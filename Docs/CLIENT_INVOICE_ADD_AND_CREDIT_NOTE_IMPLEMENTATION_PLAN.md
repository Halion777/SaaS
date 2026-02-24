# Client Invoice: Add Invoice & Credit Note – Implementation Plan (Core Final Flow)

This document describes the implementation plan for the core final flow: **Add invoice** (direct creation without quote) and **Credit note** (create from invoice, full export/send parity). Paid/unpaid is handled manually; no bank connection. No future additions required beyond this scope.

---

## 1. Overview & scope

### In scope
- **Add invoice:** Button on client invoices page → form with all necessary fields + optional file upload (extract & pre-fill) → create invoice (INV-xxxx). No change to existing send logic.
- **Credit note:** "Create credit note" on each invoice row/card → reason popup → create credit note (CN-xxxx, linked to invoice). Credit notes have **own number generation and usage** (CN-0001, CN-0002, separate from INV).
- **Full parity for credit notes:** List, view, export PDF, send email, send Peppol, send to accountant (same as invoices).
- **Invoice balance:** When viewing an invoice, Balance = Invoice total − SUM(linked credit notes).
- **Numbering:** Invoices use existing INV-xxxx; credit notes use new CN-xxxx (separate sequence).

### Out of scope
- No summary-bar logic for credit notes, no dashboard/export rules, no special delete/cancel rules.
- Paid/unpaid remains manual; no bank integration.

---

## 2. Final flow (start to end)

### 2.1 Client Invoices page – entry
- **Add invoice** button in header → opens **Add Invoice** modal.
- Modal: form (client, amounts, dates, terms, optional line items) + **optional upload** (extract data to pre-fill). Submit → creates **invoice** (INV-xxxx), `quote_id` null. List refreshes.
- **Quote → invoice** conversion remains unchanged (still creates INV-xxxx).
- **List** shows both invoices and credit notes (e.g. type badge "Invoice" / "Credit note", numbers INV-xxxx / CN-xxxx). Optional filter: Invoices only / Credit notes only / All.

### 2.2 For each **invoice** row/card (`document_type = 'invoice'` or null)
- **View** → Invoice detail modal (existing). Show **Balance** = total − SUM(linked credit notes). Optionally list linked credit notes.
- **Export PDF** → Invoice PDF (existing).
- **Send** → Send modal (Email or Peppol) → invoice PDF / invoice UBL (existing).
- **Send to accountant** → (existing).
- **Create credit note** → Reason (+ optional notes) popup → creates **credit note** (CN-xxxx, `related_invoice_id` = this invoice). New row appears as type "Credit note".

### 2.3 For each **credit note** row/card (`document_type = 'credit_note'`)
- **View** → Credit note detail modal: same layout as invoice, title "Credit note", amounts negative, "Related invoice: INV-xxxx". No "Create credit note" button.
- **Export PDF** → **Credit note PDF**: same layout as invoice, title "Credit note" / "Avoir" / "Creditnota", amounts negative, reference to INV-xxxx.
- **Send** → Same Send modal: Email (credit note PDF) or Peppol (CREDIT_NOTE UBL + embedded credit note PDF).
- **Send to accountant** → Same as invoices, using credit note PDF.
- No "Create credit note" on a credit note.

### 2.4 Numbering
- **Invoices:** Existing `generate_invoice_number` RPC → INV-0001, INV-0002.
- **Credit notes:** New `generate_credit_note_number` RPC → CN-0001, CN-0002 (separate sequence, own generation and usage everywhere).

---

## 3. Implementation steps (start to end)

### Phase A: Database & backend

1. **Schema (invoices table)**
   - Add `document_type` (e.g. `text`, default `'invoice'`): values `'invoice'`, `'credit_note'`.
   - Add `related_invoice_id` (UUID, nullable, FK to `invoices.id`): set only for credit notes.

2. **RPC**
   - Add `generate_credit_note_number` (e.g. same pattern as `generate_invoice_number` but prefix `CN-` and **separate sequence** so CN-0001, CN-0002 do not reuse INV sequence).

3. **InvoiceService**
   - **createClientInvoice(userId, data):** Build one row for `invoices`: `user_id`, `client_id`, `invoice_number` (from `generate_invoice_number` or form), `title`, `description`, `status: 'unpaid'`, `amount`, `net_amount`, `tax_amount`, `final_amount`, `issue_date`, `due_date`, `payment_terms`, `notes`, `invoice_type`, `quote_id: null`, `document_type: 'invoice'`, `peppol_metadata` (e.g. deposit_amount, optional line_items). Insert and return created invoice.
   - **createCreditNoteFromInvoice(userId, sourceInvoiceId, { reason, notes }):** Load source invoice; get CN-xxxx from `generate_credit_note_number`; insert one row: copy `client_id`, copy payment/terms/dates; set `invoice_number` = CN-xxxx, `title` = e.g. "Credit Note: [original title]", `description` = reason/notes; **negative amounts** (`amount`, `net_amount`, `tax_amount`, `final_amount`); `document_type = 'credit_note'`, `related_invoice_id = sourceInvoiceId`, `status = 'unpaid'`. Return created credit note.

4. **Fetch invoices & balance**
   - When fetching invoices, optionally load linked credit notes (e.g. query where `related_invoice_id IN (...)` or join) so each invoice can display Balance = total − SUM(linked CN amounts).
   - Ensure list query returns `document_type` and `related_invoice_id` so UI can show type badge and filter.

---

### Phase B: Add Invoice UI

5. **Add invoice button – same place as expense invoice**
   - **Placement:** In the **header right** of the client invoices page, in the same spot as expense invoices: the flex container next to the page title (e.g. `<div className="flex items-center space-x-2 sm:space-x-3">`). Currently this area is empty on the client invoices page; add the button here.
   - **Button:** Label **"Add Invoice"**, icon **Plus** (iconPosition left), same style as expense invoice. On click: open Add Client Invoice modal (`setIsAddInvoiceModalOpen(true)`).
   - **Reference:** `src/pages/expense-invoices/index.jsx` (header with "Add Invoice" + `setIsQuickCreateOpen(true)`).

6. **AddClientInvoiceModal – same look as expense invoice**
   - **Layout:** Reuse the same structure as **QuickExpenseInvoiceCreation** (`src/pages/expense-invoices/components/QuickExpenseInvoiceCreation.jsx`):
     - **Modal:** Title + subtitle at top, close button, scrollable form.
     - **Upload section (optional) at top:** Same visual – blue box with icon, heading "Automatic Invoice Scanner" (or equivalent), description "Upload an invoice to automatically extract data", then **FileUpload** component (accepted types e.g. .pdf, .jpg, .png). On upload → run extraction (ocrService or client-invoice extractor) → **pre-fill** form fields only; user reviews and clicks Create (no auto-create).
     - **Form sections below:** Same pattern – sections with heading and border-b, then grid of fields (labels + Input/Select). Use the same spacing, grid (e.g. `grid-cols-1 md:grid-cols-2 gap-4`), and component styling as in QuickExpenseInvoiceCreation.
   - **Submit:** Create invoice via `InvoiceService.createClientInvoice(userId, payload)`; on success close modal and parent calls `fetchInvoices()`. No send in this flow.

7. **Add invoice form fields – from quote-to-invoice conversion**
   - Fields are decided by what is **necessary to create an invoice** in the database. Use the **quote-to-invoice conversion** in `quotesService.js` (e.g. `convertQuoteToInvoice`, single final invoice insert) as reference for which columns are set. Map those to form fields as follows (all optional unless marked required):
   - **Client (required):** Dropdown of user’s clients → `client_id`. Same data source as elsewhere (e.g. clients list for current user).
   - **Invoice number:** Auto-fill on open from RPC `generate_invoice_number`; user can override. → `invoice_number`.
   - **Title** → `title` (e.g. default "Facture pour [description]" if needed).
   - **Description** → `description`.
   - **Net amount (excl. VAT)** → `amount`, `net_amount`.
   - **Tax amount** → `tax_amount`. (Optionally derive from VAT % if you add a VAT % field.)
   - **Discount amount** → `discount_amount` (default 0).
   - **Final amount (incl. VAT)** → `final_amount`. (Can be computed from net + tax − discount or entered.)
   - **Issue date** → `issue_date`.
   - **Due date** → `due_date`.
   - **Payment terms** → `payment_terms` (e.g. "Paiement à 30 jours").
   - **Payment method** → `payment_method` (e.g. "À définir" or dropdown).
   - **Notes** → `notes`.
   - **Invoice type** → `invoice_type`: **Final** or **Deposit**. If Deposit: show optional **Deposit amount** (excl. VAT) → store in `peppol_metadata.deposit_amount`; balance can be derived (final_amount − deposit with VAT) or stored in `peppol_metadata.balance_amount` when needed for display/send.
   - **Not used for add-invoice:** `quote_id` (null), `quote_number` (null), `converted_from_quote_at` (omit). Set `status: 'unpaid'`, `document_type: 'invoice'`.
   - **Reference:** `src/services/quotesService.js` – object passed to `invoices` insert (e.g. single final invoice around lines 1919–1945, deposit invoice 1822–1850, final invoice 1872–1911).

---

### Phase C: Credit note UI

8. **InvoicesDataTable**
   - In **table**, **card**, and **grouped card** views: add **"Create credit note"** button/icon in actions. Show only when `invoice.document_type !== 'credit_note'` (and optionally exclude cancelled).
   - On click: `onInvoiceAction('create_credit_note', invoice)`.

9. **Invoices management page**
   - Handle `handleInvoiceAction('create_credit_note', invoice)`: open **CreateCreditNoteModal** with selected invoice.

10. **CreateCreditNoteModal (new component)**
    - Props: `invoice`, `onClose`, `onCreated`.
    - Show original invoice number and total; required **Reason for credit note**; optional Notes. Buttons: Cancel, Create credit note.
    - On Create: `InvoiceService.createCreditNoteFromInvoice(userId, invoice.id, { reason, notes })` → on success `onCreated()` (refetch, close).

11. **Invoice detail modal**
    - Display **Balance** = invoice `final_amount` − SUM(linked credit notes’ `final_amount`). Optionally list linked credit notes (e.g. CN-xxx, amount) with link to open.

12. **Credit note detail**
    - Reuse same detail modal; when `document_type === 'credit_note'`: title "Credit note", amounts shown negative, show "Related invoice: INV-xxxx", hide "Create credit note" button.

13. **List display**
    - Show document type badge (Invoice / Credit note) and number (INV-xxxx / CN-xxxx). For credit notes, show amounts as negative in table/cards. Optional filter: Invoices only / Credit notes only / All.

---

### Phase D: PDF

14. **Credit note PDF**
    - Extend `generateInvoicePDF` (or add a parameter): when `document_type === 'credit_note'` (or equivalent in `invoiceData`), use same layout but title "Credit note" / "Avoir" / "Creditnota", amounts negative, and reference to original invoice (e.g. "Related to INV-xxxx").
    - Export PDF and Send flows for credit notes call this with credit note data so the generated file is the credit note PDF.

---

### Phase E: Send (Email & Peppol)

15. **Send modal for credit notes**
    - Reuse existing SendInvoiceModal / SendEmailModal / SendPeppolModal. When the selected document is a credit note (`document_type === 'credit_note'`):
    - **Email:** Generate **credit note PDF** (step 13), attach, send (same flow as invoice email).
    - **Peppol:** Generate UBL with **document type CREDIT_NOTE** (e.g. InvoiceTypeCode 381), same structure as invoice but negative amounts and reference to original invoice; embed **credit note PDF** in UBL. Use existing send path (edge function, Digiteal API). Ensure receiver supports CREDIT_NOTE if you check document type support.

16. **Send to accountant**
    - For credit notes, use credit note PDF (same as Export PDF).

---

### Phase F: Peppol UBL for credit note (Peppol BIS Billing 3.0 compliant)

17. **peppolService / UBL generation – compliance**
    - Credit notes are implemented in line with **Peppol BIS Billing 3.0** and **EN 16931**:
    - Use the **UBL CreditNote-2** schema (root element `<CreditNote>`, namespace `urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2`), not Invoice with type 381.
    - **CreditNoteTypeCode** 381; **CreditNoteLine** with **CreditedQuantity** (not InvoiceLine/InvoicedQuantity).
    - **OrderReference** to the original invoice (e.g. INV-xxxx); on each line **DocumentReference** with **DocumentTypeCode 130** to reference the invoice.
    - All amounts in the UBL are **positive** (credit nature is indicated by the document type).
    - **UBLVersionID** 2.1; same CustomizationID/ProfileID as invoice; embedded **credit note PDF** in AdditionalDocumentReference.
    - Sending: **generatePEPPOLCreditNoteXML** for credit notes; **generatePEPPOLXML** (InvoiceTypeCode 380 only) for invoices. Receiver support check uses CREDIT_NOTE vs INVOICE document type.

---

## 4. File checklist

| Area | File / location | Action |
|------|------------------|--------|
| DB | Supabase | Add `document_type`, `related_invoice_id` to `invoices`; add `generate_credit_note_number` RPC. |
| Service | `src/services/invoiceService.js` | Add `createClientInvoice`, `createCreditNoteFromInvoice`; ensure fetch returns/uses `document_type`, `related_invoice_id` for balance. |
| Page | `src/pages/invoices-management/index.jsx` | Add "Add invoice" button, AddClientInvoiceModal state, CreateCreditNoteModal state, handle `create_credit_note` action. |
| New | `src/pages/invoices-management/components/AddClientInvoiceModal.jsx` | Form + optional upload; submit → createClientInvoice. |
| New | `src/pages/invoices-management/components/CreateCreditNoteModal.jsx` | Reason + notes; submit → createCreditNoteFromInvoice. |
| Table | `src/pages/invoices-management/components/InvoicesDataTable.jsx` | Add "Create credit note" in table/card/grouped card; show type badge; show negative amount for credit notes. |
| Detail | `src/pages/invoices-management/components/InvoiceDetailModal.jsx` | Balance = total − linked CNs; optional linked CN list; for credit note, title "Credit note", negative amounts, related invoice. |
| PDF | `src/services/pdfService.js` | Credit note variant: "Credit note" title, negative amounts, reference to INV-xxxx. |
| Peppol | `src/services/peppolService.js` | UBL CreditNote-2 (CreditNoteTypeCode 381, CreditNoteLine, OrderReference, embed credit note PDF). Peppol BIS 3.0 compliant. |
| Send | SendInvoiceModal / SendPeppolModal / SendEmailModal | When document is credit note, use credit note PDF and (for Peppol) CREDIT_NOTE UBL. |

---

## 5. Summary

- **Core flow:** Add invoice (form + optional upload) → INV-xxxx; Create credit note from invoice (reason) → CN-xxxx with own numbering; list both; view; export PDF; send (email + Peppol + accountant) for both; invoice balance = total − linked credit notes.
- **No future additions** required; paid/unpaid remains manual; no bank connection.
- Implementation order: DB & RPC → InvoiceService → Add Invoice UI → Credit note UI (button + modals + detail + list) → Credit note PDF → Send (email + Peppol) and Peppol UBL for CREDIT_NOTE.

---

---

## 6. Implementation notes (credit note)

- **Peppol:** Credit note sending follows **Peppol BIS Billing 3.0**: separate UBL **CreditNote** document (`generatePEPPOLCreditNoteXML`), not Invoice with type 381. Validation accepts both Invoice (380/381) and CreditNote (381) roots; send path checks receiver support for INVOICE vs CREDIT_NOTE.

---

## 7. Implementation checklist

### Done

| Phase | Item | Status |
|-------|------|--------|
| **A** | DB: `document_type`, `related_invoice_id` on `invoices`; `generate_credit_note_number` RPC | Done |
| **A** | InvoiceService: `createCreditNoteFromInvoice`, `getBalanceByInvoiceId`; fetch uses `document_type` / `related_invoice_id` | Done |
| **A** | InvoiceService: `createClientInvoice` for Add Invoice | Done |
| **B** | "Add Invoice" button in client invoices header | Done |
| **B** | AddClientInvoiceModal: form, optional OCR upload, Peppol-required validation, file-upload styling aligned with expense | Done |
| **B** | Client dropdown: "+ Add client" shortcut opens full ClientModal (client management), not quick-add; dropdown refreshes and selects new client on save | Done |
| **C** | CreateCreditNoteModal; "Create credit note" in table/card/grouped card views | Done |
| **C** | Invoice detail: Balance = total − linked credit notes; linked credit notes list | Done |
| **C** | Credit note detail: title "Credit note", negative amounts, related invoice; no "Create credit note" button | Done |
| **C** | List: document type badge (Invoice / Credit note), INV-xxxx / CN-xxxx, negative amounts for credit notes | Done |
| **D** | Credit note PDF variant (title, negative amounts, reference to INV-xxxx) | Done |
| **E** | Send modal: credit note → credit note PDF (email); Peppol CREDIT_NOTE UBL + embedded PDF; send to accountant | Done |
| **F** | Peppol: `generatePEPPOLCreditNoteXML` (UBL CreditNote-2, 381, CreditNoteLine); invoice path stays `generatePEPPOLXML` (380 only); receiver check CREDIT_NOTE vs INVOICE | Done |
| — | Translations (EN/FR/NL) for credit note and Add Invoice UI | Done |
| — | Starter Peppol limit 100/month in `subscriptionFeatures.js` and locales | Done |
| — | List filter: "Document type" (All / Invoices only / Credit notes only) in InvoicesFilterToolbar + index filter logic; EN/FR/NL | Done |

### Remaining

| Item | Notes |
|------|--------|
| — | No scope items outstanding; core flow and optional filter are complete. |

*Last updated: 2025-02-03*
