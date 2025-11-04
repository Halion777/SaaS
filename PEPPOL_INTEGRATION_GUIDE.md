# Peppol Integration Guide

## Overview

This guide explains how Peppol integrates with your SaaS invoicing system - specifically the differences between client invoices and expense invoices, which tables are used, and which Digiteal Peppol APIs you'll use.

---

## 📊 Two Types of Invoices

### 1. Client Invoices (`invoices` table)
**What:** Invoices you send TO your clients

**Table:** `public.invoices`

**Peppol Fields Added:**
- `peppol_enabled` - Is this invoice sent via Peppol?
- `peppol_status` - Status: `not_sent`, `sending`, `sent`, `delivered`, `failed`
- `peppol_message_id` - Digiteal message ID
- `peppol_sent_at` - When invoice was sent
- `peppol_delivered_at` - When invoice was delivered
- `peppol_error_message` - Error details if failed
- `receiver_peppol_id` - Client's Peppol identifier
- `ubl_xml` - UBL XML content
- `peppol_metadata` - Additional Peppol data

**Direction:** OUTBOUND (you send to clients)

**API Used:**
- `POST /api/v1/peppol/outbound-ubl-documents` - Send invoice to client via Peppol

---

### 2. Expense Invoices (`expense_invoices` table)
**What:** Invoices you receive FROM suppliers

**Table:** `public.expense_invoices`

**Peppol Fields Added:**
- `peppol_enabled` - Was this invoice received via Peppol?
- `peppol_message_id` - Digiteal message ID
- `peppol_received_at` - When invoice was received
- `sender_peppol_id` - Supplier's Peppol identifier
- `ubl_xml` - UBL XML content
- `peppol_metadata` - Additional Peppol data
- `user_id` - Links to your user account

**Direction:** INBOUND (suppliers send to you)

**Process:**
- Automatically processed by Peppol webhook
- Creates `expense_invoices` record
- Stores UBL XML for compliance

---

## 🗂️ Peppol Support Tables

### 1. `peppol_settings`
**Purpose:** Your company's Peppol configuration

**Key Fields:**
- `user_id` - Your account
- `peppol_id` - Your Peppol identifier (e.g., `0208:0630675588`)
- `business_name` - Your company name
- `country_code` - Your country code (e.g., `BE`)
- `supported_document_types` - Types you can send/receive
- `sandbox_mode` - Test or production environment

**Used By:** Registration and API authentication

---

### 2. `peppol_participants`
**Purpose:** Trading partners (your clients and suppliers)

**Key Fields:**
- `user_id` - Your account
- `peppol_identifier` - Partner's Peppol ID (e.g., `0208:1234567890`)
- `business_name` - Partner's company name
- `contact_email` - Partner's contact email
- `is_registered` - Is partner active in Peppol?

**Used By:** Tracking who you can send/receive invoices from

---

### 3. `peppol_invoices`
**Purpose:** Tracking table for all Peppol invoice activity

**Key Fields:**
- `user_id` - Your account
- `direction` - `outbound` (you send) or `inbound` (you receive)
- `sender_peppol_id` - Who sent it
- `receiver_peppol_id` - Who received it
- `status` - Current status: `pending`, `sent`, `delivered`, `failed`
- `peppol_message_id` - Digiteal tracking ID
- `client_invoice_id` - Links to `invoices` table (if outbound)
- `supplier_invoice_id` - Links to `expense_invoices` table (if inbound)

**Used By:** 
- Dashboard statistics
- Invoice tracking
- Audit trail

---

## 🔑 Key Digiteal Peppol APIs

### For Sending Client Invoices

**API:** `POST /api/v1/peppol/outbound-ubl-documents`

**What it does:**
- Sends your invoice to client via Peppol network
- Converts invoice to UBL XML format
- Returns message ID for tracking

**Request Body:**
```json
{
  "document": "<UBL-XML-FILE>",
  "peppolIdentifier": "0208:1234567890"  // Client's Peppol ID
}
```

**Your Code:**
```javascript
import PeppolService from './services/peppolService';

const peppolService = new PeppolService(true);
const result = await peppolService.sendInvoice({
  invoiceId: invoice.id,
  clientPeppolId: client.peppol_id,
  ublXml: convertedInvoice
});
```

---

### For Validating Documents

**API:** `POST /api/v1/peppol/public/validate-document`

**What it does:**
- Checks if UBL XML is valid before sending
- Ensures document complies with Peppol standards
- Returns validation errors if any

**Request Body:**
```json
{
  "document": "<UBL-XML-FILE>"
}
```

**Your Code:**
```javascript
const result = await peppolService.validateDocument(ublXml);
if (result.success) {
  // Safe to send
  await peppolService.sendInvoice(...);
} else {
  console.error('Validation errors:', result.errors);
}
```

---

## 📝 Complete Flow

### Sending a Client Invoice

```javascript
// 1. Create invoice normally
const { data: invoice } = await supabase
  .from('invoices')
  .insert({
    client_id: clientId,
    invoice_number: 'INV-001',
    amount: 1000,
    // ... other fields
  })
  .select()
  .single();

// 2. Convert to UBL XML
const ublXml = await convertInvoiceToUBL(invoice);

// 3. Validate UBL (optional but recommended)
const validation = await peppolService.validateDocument(ublXml);
if (!validation.success) {
  throw new Error('UBL validation failed');
}

// 4. Send via Peppol
const result = await peppolService.sendInvoice({
  invoiceId: invoice.id,
  clientPeppolId: '0208:1234567890',
  ublXml: ublXml
});

// 5. Update invoice with Peppol status
if (result.success) {
  await supabase
    .from('invoices')
    .update({
      peppol_enabled: true,
      peppol_status: 'sent',
      peppol_message_id: result.data.messageId,
      receiver_peppol_id: '0208:1234567890',
      peppol_sent_at: new Date().toISOString()
    })
    .eq('id', invoice.id);
}
```

---

### Receiving an Expense Invoice

**Automated by Webhook - Complete Processing Flow:**

When a supplier sends you an invoice via Peppol, Digiteal sends a webhook to your endpoint. The system automatically processes it and creates an expense invoice record.

**Supported Document Types:**
- ✅ Regular Invoice (`PEPPOL_INVOICE_RECEIVED`)
- ✅ Credit Note (`PEPPOL_CREDIT_NOTE_RECEIVED`)
- ✅ Self-Billing Invoice (`PEPPOL_SELF_BILLING_INVOICE_RECEIVED`)
- ✅ Self-Billing Credit Note (`PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED`)

**Complete Step-by-Step Flow:**

1. **Supplier Sends Invoice via Peppol**
   - Supplier sends invoice through Peppol network
   - Document can be: Invoice, Credit Note, Self-Billing Invoice, or Self-Billing Credit Note

2. **Digiteal Access Point Receives & Validates**
   - Digiteal receives the invoice
   - Validates UBL XML against Peppol BIS Billing 3.0
   - Routes to your Peppol identifier
   - Sends webhook to your endpoint

3. **Webhook Handler Receives Request**
   ```
   POST /functions/v1/peppol-webhook
   Headers:
     - Authorization: Basic <credentials>
   Body:
     {
       eventType: "PEPPOL_INVOICE_RECEIVED",
       timestamp: "2025-01-15T10:30:00Z",
       data: {
         messageId: "MSG-123456",
         senderPeppolId: "0208:7890123456",
         receiverPeppolId: "0208:0630675588",
         ublXml: "<Invoice>...</Invoice>",
         invoiceNumber: "INV-2025-001",
         ...
       }
     }
   ```

4. **Authentication & Validation**
   - ✅ Validates Basic Auth credentials
   - ✅ Extracts `receiverPeppolId` from payload
   - ✅ Finds user in `peppol_settings` by Peppol ID
   - ❌ Returns 404 if user not found

5. **Document Type Detection**
   - Identifies document type from webhook event:
     - `PEPPOL_INVOICE_RECEIVED` → Regular Invoice
     - `PEPPOL_CREDIT_NOTE_RECEIVED` → Credit Note
     - `PEPPOL_SELF_BILLING_INVOICE_RECEIVED` → Self-Billing Invoice
     - `PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED` → Self-Billing Credit Note

6. **UBL XML Parsing**
   - Parses UBL XML to extract all mandatory fields
   - Falls back to webhook payload data if parsing fails
   - Extracts: Document IDs, Supplier info, Customer info, Tax info, Totals, Invoice lines, Payment info

7. **Supplier Participant Management**
   - Checks if supplier exists in `peppol_participants` by `senderPeppolId`
   - If found: Uses existing participant ID
   - If not found: Creates new participant with extracted information

8. **Amount Calculation**
   - `totalAmount` = PayableAmount (from UBL)
   - `taxAmount` = TaxAmount (from UBL)
   - `netAmount` = TaxExclusiveAmount OR LineExtensionAmount OR (totalAmount - taxAmount)

9. **Create Expense Invoice Record**
   - Inserts into `expense_invoices` table with all extracted data
   - Stores complete UBL XML for compliance
   - Stores metadata with document type, lines, tax breakdown, etc.

10. **Create Tracking Record**
    - Inserts into `peppol_invoices` table for tracking
    - Links to `expense_invoices` via `supplier_invoice_id`
    - Stores direction: `'inbound'`, status: `'received'`

11. **Return Success Response**
    - Returns 200 OK with processing result
    - Invoice is now ready for review and payment

**Webhook Handler:** `supabase/functions/peppol-webhook/index.ts`

**What Gets Extracted from UBL XML:**

The webhook handler parses the UBL XML and extracts all mandatory fields:

| Category | Fields Extracted | UBL Path |
|----------|------------------|----------|
| **Document Identifiers** | Invoice ID, Issue Date, Due Date, Invoice Type Code, Currency | `cbc:ID`, `cbc:IssueDate`, `cbc:DueDate`, `cbc:InvoiceTypeCode`, `cbc:DocumentCurrencyCode` |
| **Supplier Information** | Peppol ID, Name, VAT Number, Address, Email | `cac:AccountingSupplierParty` → `cbc:EndpointID`, `cac:PartyName`, `cac:PartyTaxScheme`, `cac:PostalAddress`, `cac:Contact` |
| **Customer Information** | Peppol ID, Name, VAT Number (should be your company) | `cac:AccountingCustomerParty` → `cbc:EndpointID`, `cac:PartyName`, `cac:PartyTaxScheme` |
| **Tax Information** | Total Tax Amount, Tax Subtotals (by category), Tax Rates | `cac:TaxTotal` → `cbc:TaxAmount`, `cac:TaxSubtotal` |
| **Monetary Totals** | Line Extension Amount, Tax Exclusive, Tax Inclusive, Payable Amount | `cac:LegalMonetaryTotal` → all monetary fields |
| **Invoice Lines** | Line ID, Quantity, Unit Code, Item Name, Price, Tax Category | `cac:InvoiceLine` → all line fields |
| **Payment Information** | Payment Means Code, Payment ID, IBAN, Payment Terms | `cac:PaymentMeans`, `cac:PaymentTerms` |
| **Additional** | Buyer Reference, Order Reference, Delivery Date | `cbc:BuyerReference`, `cac:OrderReference`, `cac:Delivery` |

**Database Records Created:**

```javascript
// 1. expense_invoices record (main record)
{
  user_id: userId,
  invoice_number: 'INV-2025-001',              // From cbc:ID
  supplier_name: 'ACME Corp',                  // From AccountingSupplierParty/PartyName
  supplier_vat_number: 'BE123456789',          // From PartyTaxScheme/CompanyID
  supplier_email: 'info@acme.com',             // From Contact/ElectronicMail
  amount: 1210.00,                             // From PayableAmount
  net_amount: 1000.00,                         // From TaxExclusiveAmount
  vat_amount: 210.00,                          // From TaxAmount
  issue_date: '2025-01-15',                    // From IssueDate
  due_date: '2025-02-15',                      // From DueDate
  payment_method: '30',                        // From PaymentMeansCode
  status: 'pending',
  source: 'peppol',
  peppol_enabled: true,
  peppol_message_id: 'MSG-456',
  sender_peppol_id: '0208:7890123456',        // From EndpointID (schemeID:identifier)
  ubl_xml: '<Invoice>...</Invoice>',          // Complete UBL XML
  peppol_received_at: '2025-01-15T10:30:00Z',
  peppol_metadata: {                          // Additional parsed data stored as JSONB
    documentType: 'INVOICE',                  // INVOICE or CREDIT_NOTE
    documentTypeLabel: 'Invoice',              // Human-readable label
    isSelfBilling: false,                      // Boolean
    isCreditNote: false,                       // Boolean
    webhookEventType: 'PEPPOL_INVOICE_RECEIVED',
    invoiceTypeCode: '380',
    documentCurrencyCode: 'EUR',
    buyerReference: 'PO-12345',
    orderReference: 'ORD-67890',
    salesOrderId: 'SO-12345',
    deliveryDate: '2025-01-20',
    invoiceLines: [                            // All invoice lines with details
      {
        lineId: '1',
        quantity: 10,
        unitCode: 'C62',
        itemName: 'Product Name',
        priceAmount: 100.00,
        lineExtensionAmount: 1000.00,
        taxCategoryId: 'S',
        taxPercent: 21
      }
    ],
    taxSubtotals: [                            // Tax breakdown by category
      {
        taxableAmount: 1000.00,
        taxAmount: 210.00,
        taxCategoryId: 'S',
        taxPercent: 21
      }
    ],
    payment: {                                 // Payment details
      meansCode: '30',
      paymentId: 'INV-2025-001',
      iban: 'BE12345678901234',
      terms: 'Net within 30 days'
    },
    supplierAddress: {                         // Supplier address
      street: 'Main Street 123',
      city: 'Brussels',
      postalCode: '1000',
      country: 'BE'
    },
    totals: {                                  // All monetary totals
      lineExtensionAmount: 1000.00,
      taxExclusiveAmount: 1000.00,
      taxInclusiveAmount: 1210.00,
      payableAmount: 1210.00,
      currency: 'EUR'
    }
  }
}

// 2. peppol_participants record (if supplier doesn't exist)
{
  user_id: userId,
  peppol_identifier: '0208:7890123456',
  business_name: 'ACME Corp',
  vat_number: 'BE123456789',
  country_code: 'BE',
  contact_email: 'info@acme.com',
  is_active: true,
  verification_status: 'verified'
}

// 3. peppol_invoices record (tracking)
{
  user_id: userId,
  invoice_number: 'INV-2025-001',
  document_type: 'INVOICE',
  direction: 'inbound',
  sender_peppol_id: '0208:7890123456',
  receiver_peppol_id: '0208:0630675588',       // Your company's Peppol ID
  total_amount: 1210.00,
  currency: 'EUR',
  status: 'received',
  supplier_invoice_id: expenseInvoice.id,     // Links to expense_invoices
  ubl_xml: '<Invoice>...</Invoice>',
  metadata: {                                  // Additional tracking data
    documentTypeLabel: 'Invoice',
    isSelfBilling: false,
    isCreditNote: false,
    webhookEventType: 'PEPPOL_INVOICE_RECEIVED',
    invoiceLines: [...],
    taxSubtotals: [...],
    payment: {...},
    orderReference: 'ORD-67890',
    salesOrderId: 'SO-12345'
  }
}
```

**Webhook Configuration:**

You must configure the webhook URL in Digiteal for all supported document types:
- **Endpoint:** `https://your-project.supabase.co/functions/v1/peppol-webhook`
- **Event Types to Configure:**
  - `PEPPOL_INVOICE_RECEIVED` - Regular invoices
  - `PEPPOL_CREDIT_NOTE_RECEIVED` - Credit notes
  - `PEPPOL_SELF_BILLING_INVOICE_RECEIVED` - Self-billing invoices
  - `PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED` - Self-billing credit notes
- **Authentication:** Basic Auth (configured in webhook handler)

**Flow Diagram:**

```
Supplier → Peppol Network → Digiteal AP → Webhook → Your Handler
                                                         │
                                                         ├─→ Parse UBL XML
                                                         ├─→ Extract Mandatory Fields
                                                         ├─→ Detect Document Type
                                                         ├─→ Create/Update Supplier (peppol_participants)
                                                         ├─→ Calculate Amounts
                                                         ├─→ Create Expense Invoice (expense_invoices)
                                                         ├─→ Create Tracking Record (peppol_invoices)
                                                         └─→ Return Success Response
```

**What Happens at Each Step:**

| Step | Action | Result |
|------|--------|--------|
| **1-2** | Supplier → Digiteal | Invoice validated and routed to your Peppol ID |
| **3** | Webhook received | Handler receives POST request with UBL XML |
| **4** | Authentication | Validates Basic Auth, finds user by Peppol ID |
| **5** | Document type detection | Identifies: Invoice, Credit Note, Self-Billing, etc. |
| **6** | UBL parsing | Extracts all mandatory fields from UBL XML |
| **7** | Supplier management | Creates/updates supplier in `peppol_participants` |
| **8** | Amount calculation | Calculates total, tax, and net amounts |
| **9** | Expense invoice creation | Creates record in `expense_invoices` with all data |
| **10** | Tracking record creation | Creates record in `peppol_invoices` for tracking |
| **11** | Success response | Returns 200 OK, invoice ready for processing |

**Additional Webhook Events (Not Creating Expense Invoices):**

| Event Type | Purpose | Handler |
|------------|---------|---------|
| `PEPPOL_MLR_RECEIVED` | Message Level Response | Updates `peppol_invoices.metadata.acknowledgments` |
| `PEPPOL_TRANSPORT_ACK_RECEIVED` | Transport acknowledgment | Updates `peppol_invoices.metadata.acknowledgments` |
| `PEPPOL_INVOICE_RESPONSE_RECEIVED` | Buyer business response | Updates `peppol_invoices.metadata.invoiceResponse` |
| `PEPPOL_FUTURE_VALIDATION_FAILED` | Validation warning | Stores warning in `peppol_metadata` for both invoice types |

**Validation & Error Handling:**

The webhook handler:
- ✅ Validates webhook authentication (Basic Auth)
- ✅ Finds user by Peppol identifier (`receiverPeppolId`)
- ✅ Detects document type (Invoice, Credit Note, Self-Billing, etc.)
- ✅ Parses UBL XML using DOMParser (with fallback to webhook payload)
- ✅ Validates extracted mandatory fields
- ✅ Handles missing data gracefully (uses defaults)
- ✅ Automatically creates/updates supplier participants
- ✅ Creates all necessary database records
- ✅ Stores complete UBL XML for compliance and audit
- ✅ Stores document type information in metadata
- ✅ Logs all processing steps for debugging

**See Also:**
- [Mandatory Fields for Peppol BIS Billing 3.0](../DIGITEAL_API_DOCUMENTATION.md#-mandatory-fields-for-peppol-bis-billing-30) - Complete list of mandatory fields
- [UBL Syntax & Validation Rules](../DIGITEAL_API_DOCUMENTATION.md#-ubl-syntax--validation-rules-peppol-bis-billing-30) - UBL structure details

---

## 🔍 Database Schema Summary

| Table | Purpose | Key Relation |
|-------|---------|--------------|
| `invoices` | Client invoices (you send) | OUTBOUND to clients |
| `expense_invoices` | Supplier invoices (you receive) | INBOUND from suppliers |
| `peppol_invoices` | Tracking table | Links to both invoice types |
| `peppol_settings` | Your configuration | Per user |
| `peppol_participants` | Trading partners | Clients and suppliers |
| `invoice_attachments` | Client invoice files | Linked to `invoices` |
| `expense_invoice_attachments` | Expense invoice files | Linked to `expense_invoices` |

---

## 🎯 Key Differences Summary

### Client Invoices (`invoices`)
- ✅ YOU send them
- ✅ Store in `invoices` table
- ✅ Use `POST /api/v1/peppol/outbound-ubl-documents` API
- ✅ Track with `peppol_status` (sent, delivered, failed)
- ✅ Direction: **OUTBOUND**

### Expense Invoices (`expense_invoices`)
- ✅ YOU receive them
- ✅ Store in `expense_invoices` table
- ✅ Processed by webhook automatically
- ✅ Links to your `user_id`
- ✅ Direction: **INBOUND**

---

## 🛠️ APIs You'll Actually Use

### Sending Invoices
1. **`validate-document`** (Public API) - Validate UBL before sending
2. **`send-ubl-document`** (Authenticated) - Send invoice to client

### Receiving Invoices
1. **Webhook** - Automatically processes incoming invoices
2. **No API calls needed** - It's automated!

### Management
1. **`register-participant`** - Register your company on Peppol
2. **`get-supported-document-types`** - See what document types are supported
3. **`configure-webhook`** - Set up webhook to receive invoices

---

## 📖 Quick Reference

### Client Invoice = You Send to Client
- Table: `invoices`
- API: `POST /outbound-ubl-documents`
- Direction: OUTBOUND
- Status tracking: sent → delivered

### Expense Invoice = Supplier Sends to You
- Table: `expense_invoices`
- API: None (automatic webhook)
- Direction: INBOUND
- Status: automatically received

### Everything is Tracked in `peppol_invoices`
- One table tracks both directions
- Links to both `invoices` and `expense_invoices`
- Used for dashboard statistics

