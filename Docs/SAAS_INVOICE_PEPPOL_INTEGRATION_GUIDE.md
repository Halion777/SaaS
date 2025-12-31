# Peppol Integration Guide

## Overview

This guide explains the Peppol integration in your SaaS invoicing system. It covers the database tables used, files involved, data structures, APIs needed, and step-by-step flows for both client invoices (outbound) and expense invoices (inbound).

### Important: Client Type Restrictions

**Peppol sending is only available for professional clients (companies), not individual clients.**

- **Professional Clients (`client_type = 'company'`):**
  - Can receive invoices via Peppol network (requires Peppol ID and VAT number)
  - Can also receive invoices via email
  - Have Peppol ID and VAT number configured

- **Individual Clients (`client_type = 'individual'`):**
  - Can only receive invoices via email
  - Do not have Peppol ID or VAT number
  - Email sending uses Resend service (same as quotes)

When sending an invoice:
- **Professional clients:** User sees options to send via Peppol or Email
- **Individual clients:** User directly sees Email option (no Peppol option shown)

---

## 📊 Tables Used

### 1. `invoices` (Client Invoices - Outbound)

**Purpose:** Invoices you send TO your clients

**Key Fields:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Links to user account
- `client_id` (UUID) - Links to client
- `quote_id` (UUID) - Links to original quote (if converted)
- `invoice_number` (VARCHAR) - Invoice number
- `status` (VARCHAR) - Payment status: `unpaid`, `paid`, `overdue`, `cancelled`
- `amount` (NUMERIC) - Net amount
- `tax_amount` (NUMERIC) - Tax amount
- `final_amount` (NUMERIC) - Total amount with tax
- `issue_date` (DATE) - Invoice issue date
- `due_date` (DATE) - Payment due date

**Peppol Fields:**
- `peppol_enabled` (BOOLEAN) - Is invoice sent via Peppol?
- `peppol_status` (VARCHAR) - Status: `not_sent`, `sending`, `sent`, `delivered`, `failed`
- `peppol_message_id` (VARCHAR) - Digiteal message ID
- `peppol_sent_at` (TIMESTAMP) - When invoice was sent
- `peppol_delivered_at` (TIMESTAMP) - When invoice was delivered
- `peppol_error_message` (TEXT) - Error details if failed
- `receiver_peppol_id` (VARCHAR) - Client's Peppol identifier
- `ubl_xml` (TEXT) - Complete UBL XML content
- `peppol_metadata` (JSONB) - Additional Peppol data

**Storage:**
- **Attachments:** Files stored in Supabase Storage bucket `invoice-uploads`
- **No Database Table:** No `invoice_attachments` table - files managed via storage bucket only

**Invoice Types:**
- `invoice_type` (VARCHAR) - Invoice type: `deposit` or `final`
- `peppol_metadata` (JSONB) - Contains deposit and balance amounts for deposit/final invoices
  - `deposit_amount` (NUMERIC) - Deposit amount (excl. VAT)
  - `balance_amount` (NUMERIC) - Balance amount (incl. VAT)
  - `buyerReference` (VARCHAR) - Reference to original quote/client invoice

---

### 2. `expense_invoices` (Expense Invoices - Inbound)

**Purpose:** Invoices you receive FROM suppliers

**Key Fields:**
- `id` (SERIAL) - Primary key
- `user_id` (UUID) - Links to user account
- `invoice_number` (VARCHAR) - Invoice number from supplier
- `supplier_name` (VARCHAR) - Supplier company name
- `supplier_email` (VARCHAR) - Supplier email
- `supplier_vat_number` (VARCHAR) - Supplier VAT number
- `amount` (NUMERIC) - Total amount with tax
- `net_amount` (NUMERIC) - Net amount (before tax)
- `vat_amount` (NUMERIC) - Tax amount
- `status` (VARCHAR) - Status: `pending`, `paid`, `overdue`, `cancelled`
- `category` (VARCHAR) - Invoice category
- `source` (VARCHAR) - Source: `peppol` or `manual`
- `issue_date` (DATE) - Invoice issue date
- `due_date` (DATE) - Payment due date
- `payment_method` (VARCHAR) - Payment method

**Peppol Fields:**
- `peppol_enabled` (BOOLEAN) - Was invoice received via Peppol?
- `peppol_message_id` (VARCHAR) - Digiteal message ID
- `peppol_received_at` (TIMESTAMP) - When invoice was received
- `sender_peppol_id` (VARCHAR) - Supplier's Peppol identifier
- `ubl_xml` (TEXT) - Complete UBL XML content
- `peppol_metadata` (JSONB) - Additional Peppol data

**Invoice Types:**
- `invoice_type` (VARCHAR) - Invoice type: `deposit` or `final`
- `peppol_metadata` (JSONB) - Contains deposit and balance amounts for deposit/final invoices
  - `deposit_amount` (NUMERIC) - Deposit amount (excl. VAT)
  - `balance_amount` (NUMERIC) - Balance amount (incl. VAT)
  - `buyerReference` (VARCHAR) - Reference to original quote/client invoice (for final invoices)

**Storage:**
- **PDF Attachments:** PDF attachments extracted from UBL XML stored in Supabase Storage bucket `expense-invoice-attachments`
- **Storage Path:** `expense-invoice-pdfs/{userId}/{invoiceNumber}_{filename}`

---

### 3. `peppol_settings`

**Purpose:** Your company's Peppol configuration

**Key Fields:**
- `user_id` (UUID) - Links to user account
- `peppol_id` (VARCHAR) - Your Peppol identifier (e.g., `0208:0630675588`)
- `business_name` (VARCHAR) - Your company name
- `country_code` (VARCHAR) - Your country code (e.g., `BE`)
- `supported_document_types` (TEXT[]) - Document types you can send/receive
- `sandbox_mode` (BOOLEAN) - Test or production environment

---

### 4. `peppol_participants`

**Purpose:** Trading partners (your clients and suppliers)

**Key Fields:**
- `user_id` (UUID) - Links to user account
- `peppol_identifier` (VARCHAR) - Partner's Peppol ID (e.g., `0208:1234567890`)
- `business_name` (VARCHAR) - Partner's company name
- `vat_number` (VARCHAR) - Partner's VAT number
- `country_code` (VARCHAR) - Partner's country code
- `contact_email` (VARCHAR) - Partner's contact email
- `is_active` (BOOLEAN) - Is partner active?
- `verification_status` (VARCHAR) - Verification status

---

### 5. `peppol_invoices`

**Purpose:** Tracking table for all Peppol invoice activity

**Key Fields:**
- `user_id` (UUID) - Links to user account
- `invoice_number` (VARCHAR) - Invoice number
- `document_type` (VARCHAR) - Document type: `INVOICE`, `CREDIT_NOTE`, etc.
- `direction` (VARCHAR) - `outbound` (you send) or `inbound` (you receive)
- `sender_peppol_id` (VARCHAR) - Who sent it
- `receiver_peppol_id` (VARCHAR) - Who received it
- `status` (VARCHAR) - Current status: `pending`, `sent`, `delivered`, `failed`, `received`
- `peppol_message_id` (VARCHAR) - Digiteal tracking ID
- `client_invoice_id` (UUID) - Links to `invoices` table (if outbound)
- `supplier_invoice_id` (INTEGER) - Links to `expense_invoices` table (if inbound)
- `ubl_xml` (TEXT) - Complete UBL XML content
- `metadata` (JSONB) - Additional tracking data

---

### 6. `clients`

**Purpose:** Your clients (for sending invoices)

**Key Fields:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Links to user account
- `name` (VARCHAR) - Client name
- `email` (VARCHAR) - Client email
- `phone` (VARCHAR) - Client phone
- `address` (VARCHAR) - Client address
- `city` (VARCHAR) - Client city
- `postal_code` (VARCHAR) - Client postal code
- `country` (VARCHAR) - Client country
- `vat_number` (VARCHAR) - Client VAT number
- `peppol_id` (VARCHAR) - Client's Peppol identifier
- `peppol_enabled` (BOOLEAN) - Can receive Peppol invoices?
- `client_type` (VARCHAR) - Client type: `company` (professional) or `individual` (particulier)
  - **Professional clients (`company`):** Can receive invoices via Peppol or Email
  - **Individual clients (`individual`):** Can only receive invoices via Email

---

### 7. `quotes`

**Purpose:** Quotes that can be converted to invoices

**Key Fields:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Links to user account
- `client_id` (UUID) - Links to client
- `quote_number` (VARCHAR) - Quote number
- `status` (VARCHAR) - Quote status
- `total_amount` (NUMERIC) - Total amount
- `tax_amount` (NUMERIC) - Tax amount
- `final_amount` (NUMERIC) - Final amount
- `quote_tasks` (relation) - Quote line items (tasks)

---

## 📁 Files Used

### Frontend Files

#### Client Invoices (Outbound)
- **`src/pages/invoices-management/index.jsx`** - Main invoice management page
- **`src/pages/invoices-management/components/InvoicesDataTable.jsx`** - Invoice table/card display
- **`src/pages/invoices-management/components/SendInvoiceModal.jsx`** - Main modal that routes to Peppol or Email based on client type
- **`src/pages/invoices-management/components/SendPeppolModal.jsx`** - Modal for sending invoice via Peppol (professional clients only)
- **`src/pages/invoices-management/components/SendEmailModal.jsx`** - Modal for sending invoice via email (both professional and individual clients)
- **`src/pages/invoices-management/components/InvoiceDetailModal.jsx`** - Modal for viewing invoice details
- **`src/pages/invoices-management/components/InvoicesFilterToolbar.jsx`** - Filter toolbar

#### Expense Invoices (Inbound)
- **`src/pages/expense-invoices/index.jsx`** - Main expense invoice management page
- **`src/pages/expense-invoices/components/ExpenseInvoicesDataTable.jsx`** - Expense invoice table/card display
- **`src/pages/expense-invoices/components/ExpenseInvoiceDetailModal.jsx`** - Modal for viewing expense invoice details
- **`src/pages/expense-invoices/components/QuickExpenseInvoiceCreation.jsx`** - Modal for manual expense invoice creation

#### Peppol Configuration & Monitoring
- **`src/pages/services/peppol/index.jsx`** - Peppol integration setup, configuration, and monitoring page
- **`src/pages/dashboard/components/PeppolWidget.jsx`** - Dashboard widget showing Peppol statistics

---

### Service Files

- **`src/services/invoiceService.js`** - Service for managing client invoices
  - `fetchInvoices(userId)` - Fetches invoices with client and quote data
  - `updateInvoiceStatus(invoiceId, status, notes)` - Updates invoice status
  - `getInvoiceStatistics(userId)` - Calculates invoice statistics

- **`src/services/expenseInvoicesService.js`** - Service for managing expense invoices
  - `getExpenseInvoices(userId, filters)` - Fetches expense invoices
  - `getExpenseInvoice(invoiceId)` - Fetches single expense invoice
  - `createExpenseInvoice(invoiceData)` - Creates new expense invoice
  - `updateExpenseInvoiceStatus(invoiceId, status)` - Updates invoice status

- **`src/services/peppolService.js`** - Main service for Peppol operations
  - `sendInvoice(invoiceData, options)` - Sends invoice via Peppol with retry logic
  - `convertHaliqoInvoiceToPeppol(haliqoInvoice, senderInfo, receiverInfo)` - Converts invoice format
  - `generatePEPPOLXML(invoiceData)` - Generates UBL XML
  - `getPeppolSettings()` - Gets user's Peppol configuration
  - `getPeppolParticipants()` - Gets saved Peppol participants
  - `checkReceiverCapability(vatNumber, countryCode)` - Checks if receiver is registered on Peppol
  - `checkReceiverSupportsDocumentType(peppolId, documentType)` - Checks if receiver supports specific document type
  - `sendWithRetry(invoiceData, maxRetries)` - Sends invoice with automatic retry logic

- **`src/services/peppolApiExtensions.js`** - Extended Peppol API operations
  - Additional API methods for Peppol network operations

- **`src/services/peppolWebhookService.js`** - Service for handling Peppol webhook events
  - Processes webhook events from Digiteal
  - Handles status updates and acknowledgments

- **`src/services/quotesService.js`** - Service for quote operations
  - `convertQuoteToInvoice(quote, userId)` - Converts accepted quote to invoice

- **`src/services/companyInfoService.js`** - Service for company information
  - `loadCompanyInfo(userId)` - Loads company profile information

- **`src/services/emailService.js`** - Service for sending emails via Resend
  - `sendInvoiceEmail(emailData, pdfBlob, attachments)` - Sends invoice via email with PDF attachment
  - Handles email sending for both professional and individual clients

- **`src/services/pdfService.js`** - Service for generating PDF documents
  - `generateInvoicePDF(invoiceData, invoiceNumber, language, hideBankInfo, invoiceType, showWarning)` - Generates client invoice PDF
  - Handles deposit and final invoice types
  - Supports multi-language PDF generation
  - **Note:** Expense invoice PDFs are now exclusively sourced from Peppol attachments (stored PDFs from received invoices). PDF generation for expense invoices has been removed.

- **`src/services/ocrService.js`** - Service for OCR processing (manual expense invoices)
  - `extractInvoiceData(file)` - Extracts invoice data from uploaded document using Gemini AI

---

### Edge Functions

- **`supabase/functions/peppol-webhook-config/index.ts`** - Edge function for sending invoices
  - Handles `send-ubl-document` action
  - Sends UBL XML to Digiteal API: `POST /api/v1/peppol/outbound-ubl-documents`
  - Uses Basic Auth
  - Returns success/error response with message ID

- **`supabase/functions/peppol-webhook/index.ts`** - Edge function for receiving webhooks
  - Receives webhook events from Digiteal
  - Authenticates requests using Basic Auth
  - Processes inbound invoices (creates expense invoices)
  - Updates invoice status based on webhook events
  - Handles all webhook event types:
    - `PEPPOL_INVOICE_RECEIVED` - Regular invoice received
    - `PEPPOL_CREDIT_NOTE_RECEIVED` - Credit note received
    - `PEPPOL_SELF_BILLING_INVOICE_RECEIVED` - Self-billing invoice received
    - `PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED` - Self-billing credit note received
    - `PEPPOL_SEND_PROCESSING_OUTCOME` - Send result (status update)
    - `PEPPOL_MLR_RECEIVED` - Message Level Response (delivery confirmation)
    - `PEPPOL_TRANSPORT_ACK_RECEIVED` - Transport acknowledgment
    - `PEPPOL_INVOICE_RESPONSE_RECEIVED` - Buyer business response
    - `PEPPOL_FUTURE_VALIDATION_FAILED` - Validation warning
  - Extracts PDF attachments from UBL XML
  - Stores PDF attachments in Supabase Storage bucket `expense-invoice-attachments`
  - Parses UBL XML to extract all mandatory fields
  - Creates/updates supplier participants automatically

- **`supabase/functions/send-emails/index.ts`** - Edge function for sending emails
  - Handles email sending via Resend service
  - Sends invoice PDFs as email attachments
  - Supports multi-language email content
  - Handles email translation for client language preferences

- **`supabase/functions/process-expense-invoice/index.ts`** - Edge function for processing manual expense invoices
  - Handles OCR processing for uploaded invoice documents
  - Extracts invoice data using Gemini AI
  - Returns extracted data for user verification

### Utility Files

- **`src/utils/peppolSchemes.js`** - Peppol scheme utilities
  - `getPeppolVATSchemeId(countryCode)` - Gets Peppol scheme ID for country
  - `parsePeppolId(peppolId)` - Parses Peppol ID into scheme and identifier
  - `combinePeppolId(scheme, identifier)` - Combines scheme and identifier into full Peppol ID
  - `PEPPOL_COUNTRY_LANGUAGE_MAP` - Maps countries to Peppol languages

- **`src/utils/vatNumberValidation.js`** - VAT number validation utilities
  - `validateVATNumber(vatNumber, countryCode)` - Validates VAT number format
  - `getExpectedFormat(countryCode)` - Gets expected VAT number format for country

- **`src/utils/countryCodes.js`** - Country code utilities
  - `COUNTRY_CODES` - List of all country codes
  - `searchCountries(query)` - Search countries by name or code

---

## 🔧 Data Structures

### Client Invoice Structure

```javascript
{
  id: "uuid",
  user_id: "uuid",
  client_id: "uuid",
  quote_id: "uuid",
  invoice_number: "INV-2025-001",
  quote_number: "QT-2025-001",
  title: "Invoice Title",
  description: "Invoice Description",
  status: "unpaid", // unpaid, paid, overdue, cancelled
  amount: 1000.00, // Net amount
  tax_amount: 210.00,
  discount_amount: 0.00,
  final_amount: 1210.00,
  net_amount: 1000.00,
  issue_date: "2025-01-15",
  due_date: "2025-02-15",
  payment_method: "bank_transfer",
  payment_terms: "Net 30 days",
  notes: "Additional notes",
  // Peppol fields
  peppol_enabled: true,
  peppol_status: "sent", // not_sent, sending, sent, delivered, failed
  peppol_message_id: "MSG-123456",
  peppol_sent_at: "2025-01-15T10:30:00Z",
  peppol_delivered_at: null,
  peppol_error_message: null,
  receiver_peppol_id: "0208:1234567890",
  ubl_xml: "<Invoice>...</Invoice>",
  peppol_metadata: {},
  // Relations
  client: {
    id: "uuid",
    name: "Client Name",
    email: "client@example.com",
    vat_number: "BE123456789",
    peppol_id: "0208:1234567890",
    peppol_enabled: true
  },
  quote: {
    id: "uuid",
    quote_number: "QT-2025-001",
    title: "Quote Title",
    description: "Quote Description",
    quote_tasks: [
      {
        id: "uuid",
        name: "Task Name",
        description: "Task Description",
        quantity: 10,
        unit: "hours",
        unit_price: 100.00,
        total_price: 1000.00
      }
    ]
  }
}
```

### Expense Invoice Structure

```javascript
{
  id: 123,
  user_id: "uuid",
  invoice_number: "INV-2025-001",
  supplier_name: "ACME Corp",
  supplier_email: "info@acme.com",
  supplier_vat_number: "BE123456789",
  amount: 1210.00, // Total with tax
  net_amount: 1000.00, // Net amount
  vat_amount: 210.00, // Tax amount
  status: "pending", // pending, paid, overdue, cancelled
  category: "General",
  source: "peppol", // peppol or manual
  issue_date: "2025-01-15",
  due_date: "2025-02-15",
  payment_method: "30",
  notes: "Received via Peppol network",
  // Peppol fields
  peppol_enabled: true,
  peppol_message_id: "MSG-123456",
  peppol_received_at: "2025-01-15T10:30:00Z",
  sender_peppol_id: "0208:7890123456",
  ubl_xml: "<Invoice>...</Invoice>",
  peppol_metadata: {
    documentType: "INVOICE",
    documentTypeLabel: "Invoice",
    isSelfBilling: false,
    isCreditNote: false,
    webhookEventType: "PEPPOL_INVOICE_RECEIVED",
    invoiceLines: [...],
    taxSubtotals: [...],
    payment: {...},
    totals: {...}
  }
}
```

### Peppol Invoice Data Structure (for UBL Generation)

```javascript
{
  billName: "INV-2025-001",
  issueDate: "2025-01-15",
  dueDate: "2025-02-15",
  deliveryDate: "2025-01-20",
  buyerReference: "PO-12345",
  paymentDelay: 30,
  paymentMeans: 31, // Debit transfer
  sender: {
    vatNumber: "BE0262465766",
    name: "Your Company BVBA",
    addressLine1: "Main Street 123",
    city: "Brussels",
    countryCode: "BE",
    zipCode: "1000",
    iban: "BE0403019261"
  },
  receiver: {
    vatNumber: "BE123456789",
    name: "Client Company BV",
    addressLine1: "Client Street 456",
    city: "Brussels",
    zipCode: "1000",
    countryCode: "BE",
    peppolIdentifier: "0208:1234567890",
    contact: {
      name: "John Doe",
      phone: "+321234567",
      email: "john@client.com"
    }
  },
  invoiceLines: [
    {
      description: "Consulting Services",
      quantity: 10,
      unitPrice: 100.00,
      taxableAmount: 1000.00,
      taxAmount: 210.00,
      totalAmount: 1210.00,
      vatCode: "S",
      taxPercentage: 21
    }
  ]
}
```

---

## 🔑 APIs Needed

### Digiteal Peppol Access Point APIs

**Base URL:** `https://test.digiteal.eu` (test) or `https://app.digiteal.eu` (production)

**Authentication:** Basic Auth (username:password)

#### 1. Send UBL Document (Client Invoices)

**Endpoint:** `POST /api/v1/peppol/outbound-ubl-documents`

**Purpose:** Send invoice to client via Peppol network

**Request:**
- Method: `POST`
- Headers: `Authorization: Basic <base64(username:password)>`
- Body: `multipart/form-data`
  - `document` (File) - UBL XML document
  - `comment` (String, optional) - Optional comment

**Response:**
- Success: 200 OK (may include messageId in response)
- Error: 400/403 with error details

**Used By:** Edge function `peppol-webhook-config` → `send-ubl-document` action

---

#### 2. Validate Document (Optional but Recommended)

**Endpoint:** `POST /api/v1/peppol/public/validate-document`

**Purpose:** Validate UBL XML before sending

**Request:**
- Method: `POST`
- Body: `multipart/form-data`
  - `file` (File) - UBL XML document

**Response:**
- Success: `{ valid: true, errors: [], warnings: [] }`
- Error: `{ valid: false, errors: [...], warnings: [...] }`

**Used By:** Frontend validation (optional)

---

#### 3. Webhook Configuration

**Endpoint:** `POST /api/v1/webhook/configuration`

**Purpose:** Configure webhook URLs for receiving events

**Request:**
- Method: `POST`
- Headers: `Authorization: Basic <base64(username:password)>`
- Body: JSON
```json
{
  "login": "username",
  "password": "password",
  "webHooks": [
    {
      "type": "PEPPOL_INVOICE_RECEIVED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_CREDIT_NOTE_RECEIVED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_SELF_BILLING_INVOICE_RECEIVED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_SEND_PROCESSING_OUTCOME",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_MLR_RECEIVED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_TRANSPORT_ACK_RECEIVED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_INVOICE_RESPONSE_RECEIVED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_FUTURE_VALIDATION_FAILED",
      "url": "https://your-project.supabase.co/functions/v1/peppol-webhook"
    }
  ]
}
```

**Response:**
- Success: 200 OK
- Error: 400 with error details

**Used By:** Initial setup (one-time configuration)

---

### Webhook Events (Received from Digiteal)

**Endpoint:** `POST /functions/v1/peppol-webhook` (your Supabase Edge Function)

**Authentication:** Basic Auth (configured in edge function)

**Event Types:**
- `PEPPOL_INVOICE_RECEIVED` - Regular invoice received
- `PEPPOL_CREDIT_NOTE_RECEIVED` - Credit note received
- `PEPPOL_SELF_BILLING_INVOICE_RECEIVED` - Self-billing invoice received
- `PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED` - Self-billing credit note received
- `PEPPOL_SEND_PROCESSING_OUTCOME` - Send result (status update)
- `PEPPOL_MLR_RECEIVED` - Message Level Response (delivery confirmation)
- `PEPPOL_TRANSPORT_ACK_RECEIVED` - Transport acknowledgment
- `PEPPOL_INVOICE_RESPONSE_RECEIVED` - Buyer business response
- `PEPPOL_FUTURE_VALIDATION_FAILED` - Validation warning

**Webhook Payload:**
```json
{
  "eventType": "PEPPOL_INVOICE_RECEIVED",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "messageId": "MSG-123456",
    "senderPeppolId": "0208:7890123456",
    "receiverPeppolId": "0208:0630675588",
    "ublXml": "<Invoice>...</Invoice>",
    "invoiceNumber": "INV-2025-001",
    "senderName": "ACME Corp",
    "senderEmail": "info@acme.com",
    "senderVatNumber": "BE123456789",
    "totalAmount": 1210.00,
    "taxAmount": 210.00,
    "currency": "EUR",
    "issueDate": "2025-01-15",
    "dueDate": "2025-02-15"
  }
}
```

---

## 🔄 Flows

### Flow 1: Sending Client Invoice (Professional vs Individual)

**For Professional Clients (`client_type = 'company'`):**

```
1. User clicks "Send Invoice" button
   ↓
2. SendInvoiceModal opens and checks client type
   ↓
3. System automatically checks receiver capability (checkReceiverCapability)
   - Uses VAT number and country code to find receiver on Peppol network
   - Stores found Peppol identifier for reuse
   ↓
4. If receiver is on Peppol:
   - Shows both Peppol and Email options
   - Auto-selects Peppol option
   - User can choose Peppol or Email
   ↓
5. If receiver is NOT on Peppol:
   - Shows Email option only (with warning)
   - Warning: "This is not the actual invoice. You must send via Peppol to get paid."
   ↓
6. If user selects Peppol:
   - Opens SendPeppolModal
   - Checks if receiver supports INVOICE document type (checkReceiverSupportsDocumentType)
   - If not supported: Shows error and allows fallback to Email
   - If supported: Continues with Peppol sending
   ↓
7. Load company info (sender) and client info (receiver)
   ↓
8. Create invoice lines from quote tasks or single "Deposit payment" line for deposit invoices
   ↓
9. Convert invoice to Peppol format (convertHaliqoInvoiceToPeppol)
   - Handles deposit and final invoice types
   - Includes deposit invoice number for final invoices
   ↓
10. Generate UBL XML (generatePEPPOLXML)
    ↓
11. Send via edge function (peppol-webhook-config) with retry logic
    ↓
12. Edge function sends to Digiteal API (POST /api/v1/peppol/outbound-ubl-documents)
    ↓
13. Update invoice with initial status (peppol_status = 'sent')
    - Creates tracking record in peppol_invoices table
    ↓
14. Webhook receives status updates (PEPPOL_SEND_PROCESSING_OUTCOME, PEPPOL_MLR_RECEIVED)
    ↓
15. Invoice status updated to 'delivered' when MLR confirms delivery
```

**For Individual Clients (`client_type = 'individual'`):**

```
1. User clicks "Send Invoice" button
   ↓
2. SendInvoiceModal opens and detects individual client type
   ↓
3. System automatically opens SendEmailModal (no Peppol option shown)
   ↓
4. Load company info and client info
   ↓
5. Generate invoice PDF (generateInvoicePDF)
   - Shows bank information (not hidden for individual clients)
   - No warning message in PDF
   ↓
6. Send email via Resend service (send-emails edge function)
   - PDF attached as email attachment
   - Email content translated to client's language preference
   ↓
7. Update invoice with email sent status
```

### Flow 2: Receiving Expense Invoice via Peppol

```
1. Supplier sends invoice via Peppol network
   ↓
2. Digiteal Access Point validates UBL XML
   ↓
3. Digiteal routes to your Peppol ID
   ↓
4. Digiteal sends webhook to your endpoint (peppol-webhook)
   ↓
5. Webhook handler authenticates request
   ↓
6. Webhook handler finds user by Peppol ID
   ↓
7. Webhook handler detects document type
   ↓
8. Webhook handler parses UBL XML (parseUBLInvoice)
   ↓
9. Webhook handler extracts all mandatory fields
   ↓
10. Webhook handler manages supplier participant (create if not exists)
    ↓
11. Webhook handler calculates amounts
    ↓
12. Webhook handler creates expense invoice record (expense_invoices table)
    ↓
13. Webhook handler creates tracking record (peppol_invoices table)
    ↓
14. Expense invoice appears in expense invoices page
```

### Flow 3: Converting Quote to Invoice

```
1. User clicks "Convert to Invoice" on accepted quote
   ↓
2. Validate quote status (not draft or expired)
   ↓
3. Fetch full quote data from database
   ↓
4. Generate invoice number (via RPC function)
   ↓
5. Calculate due date (30 days from today)
   ↓
6. Create invoice record with all quote data
   ↓
7. Update quote status to 'converted_to_invoice'
   ↓
8. Link invoice to quote (quote_id)
   ↓
9. Invoice appears in invoices list
```

---

## 📝 Step-by-Step Instructions

### Step 1: Setup Peppol Configuration

1. Navigate to `/services/peppol`
2. Register your Peppol participant
3. Configure webhook URL: `https://your-project.supabase.co/functions/v1/peppol-webhook`
4. Configure all required webhook event types (see API section above)
5. Save configuration

**Files:** `src/pages/services/peppol/index.jsx`

---

### Step 2: Create Client Invoice from Quote

1. Navigate to `/quotes-management`
2. Find an accepted quote
3. Click "Convert to Invoice" button
4. System automatically:
   - Generates invoice number
   - Copies quote data (client, amounts, line items)
   - Creates invoice record
   - Updates quote status
   - Navigates to invoices page

**Files:** `src/services/quotesService.js` → `convertQuoteToInvoice()`

---

### Step 3: Send Client Invoice

**For Professional Clients:**

1. Navigate to `/invoices-management`
2. Find the invoice you want to send
3. Click "Send Invoice" button in actions column
4. System automatically:
   - Checks client type (must be `company` for Peppol)
   - Checks if receiver is registered on Peppol network (checkReceiverCapability)
   - Shows appropriate sending options
5. **If receiver is on Peppol:**
   - Select "Send via Peppol" option (auto-selected)
   - System checks if receiver supports INVOICE document type
   - If supported: Click "Send" button
   - System automatically:
     - Loads company info (sender)
     - Loads client info (receiver)
     - Creates invoice lines (full breakdown for final invoices, "Deposit payment" for deposit invoices)
     - Converts invoice to Peppol format
     - Generates UBL XML
     - Sends via Peppol edge function with retry logic
     - Updates invoice with Peppol status
     - Creates tracking record in peppol_invoices table
   - Invoice status updates automatically via webhooks:
     - Initial: `sent`
     - When MLR received: `delivered`
6. **If receiver is NOT on Peppol:**
   - Select "Send via Email" option (with warning)
   - Warning: "This is not the actual invoice. You must send via Peppol to get paid."
   - Click "Send" button
   - System generates PDF (bank info hidden) and sends via email
7. **If Peppol sending fails:**
   - System shows error message
   - User can fallback to Email option
   - Email PDF includes warning message

**For Individual Clients:**

1. Navigate to `/invoices-management`
2. Find the invoice you want to send
3. Click "Send Invoice" button in actions column
4. System automatically opens Email modal (no Peppol option)
5. Review email details (recipient, subject, message)
6. Click "Send" button
7. System automatically:
   - Generates invoice PDF (bank info shown)
   - Sends email via Resend service
   - Email content translated to client's language preference
   - Updates invoice with email sent status

**Files:**
- `src/pages/invoices-management/components/SendInvoiceModal.jsx` - Main routing modal
- `src/pages/invoices-management/components/SendPeppolModal.jsx` - Peppol sending modal
- `src/pages/invoices-management/components/SendEmailModal.jsx` - Email sending modal
- `src/services/peppolService.js` → `sendInvoice()`, `checkReceiverCapability()`, `checkReceiverSupportsDocumentType()`
- `src/services/pdfService.js` → `generateInvoicePDF()`
- `src/services/emailService.js` → `sendInvoiceEmail()`
- `supabase/functions/peppol-webhook-config/index.ts` - Peppol sending edge function
- `supabase/functions/send-emails/index.ts` - Email sending edge function

---

### Step 4: Receive Expense Invoice via Peppol (Automatic)

1. Supplier sends invoice via Peppol network
2. Digiteal validates and routes to your Peppol ID
3. Digiteal sends webhook to your endpoint
4. Webhook handler automatically:
   - Authenticates request
   - Finds user by Peppol ID
   - Detects document type (Invoice/Credit Note/Self-Billing)
   - Parses UBL XML
   - Extracts all mandatory fields
   - Creates/updates supplier participant
   - Calculates amounts
   - Creates expense invoice record
   - Creates tracking record
5. Expense invoice appears in `/expense-invoices` page
6. User can review and process the invoice

**Files:** `supabase/functions/peppol-webhook/index.ts` → `processInboundInvoice()`

---

### Step 5: View Invoice Details

**Client Invoices:**
1. Navigate to `/invoices-management`
2. Click "View" button on invoice
3. View invoice details in modal:
   - General invoice information
   - Client information
   - Financial information
   - Notes
   - Peppol metadata tab

**Files:** `src/pages/invoices-management/components/InvoiceDetailModal.jsx`

**Expense Invoices:**
1. Navigate to `/expense-invoices`
2. Click "View" button on invoice
3. View invoice details in modal:
   - General invoice information
   - Supplier information
   - Financial information (with HT and TVA breakdown for deposit/final invoices)
   - Notes
   - Peppol metadata tab
   - PDF attachment (if received via Peppol)

**Files:** `src/pages/expense-invoices/components/ExpenseInvoiceDetailModal.jsx`

---

### Step 6: Manual Expense Invoice Creation

1. Navigate to `/expense-invoices`
2. Click "Add Invoice" button
3. Upload invoice document (PDF, JPG, PNG, etc.)
4. System automatically:
   - Extracts data using OCR (Gemini AI)
   - Pre-fills form fields
5. User reviews and verifies extracted data
6. User fills any missing fields manually
7. Click "Create Invoice" button
8. Invoice is created with `source = 'manual'`

**Files:**
- `src/pages/expense-invoices/components/QuickExpenseInvoiceCreation.jsx`
- `src/services/ocrService.js` → `extractInvoiceData()`
- `supabase/functions/process-expense-invoice/index.ts`

---

### Step 7: View Peppol Activity

1. Navigate to `/services/peppol`
2. Switch to "Sent" tab to view all sent invoices
3. Switch to "Received" tab to view all received invoices
4. Filter by status, date range, amount, recipient/sender
5. View detailed information for each invoice
6. Monitor Peppol statistics (total sent, total received, amounts)

**Files:** `src/pages/services/peppol/index.jsx`

---

## 📋 Quick Reference

### Client Invoice (Outbound)
- **Table:** `invoices`
- **API:** `POST /api/v1/peppol/outbound-ubl-documents`
- **Direction:** OUTBOUND (you send)
- **Status Flow:** `not_sent` → `sending` → `sent` → `delivered`
- **Creation:** Quote conversion only

### Expense Invoice (Inbound)
- **Table:** `expense_invoices`
- **API:** Webhook (automatic)
- **Direction:** INBOUND (you receive)
- **Status Flow:** `pending` (when received)
- **Creation:** Automatic via webhook OR manual with OCR

### Tracking
- **Table:** `peppol_invoices`
- **Purpose:** Track all Peppol activity
- **Links:** Both `invoices` and `expense_invoices`

---

## 🔧 Utility Files

- **`src/utils/peppolSchemes.js`** - Peppol scheme utilities
  - `getPeppolVATSchemeId(countryCode)` - Gets Peppol scheme ID for country
  - `parsePeppolId(peppolId)` - Parses Peppol ID into scheme and identifier
  - `combinePeppolId(scheme, identifier)` - Combines scheme and identifier into full Peppol ID
  - `PEPPOL_COUNTRY_LANGUAGE_MAP` - Maps countries to Peppol languages

- **`src/utils/vatNumberValidation.js`** - VAT number validation utilities
  - `validateVATNumber(vatNumber, countryCode)` - Validates VAT number format
  - `getExpectedFormat(countryCode)` - Gets expected VAT number format for country

- **`src/utils/countryCodes.js`** - Country code utilities
  - `COUNTRY_CODES` - List of all country codes
  - `searchCountries(query)` - Search countries by name or code

---

## 📚 Additional Resources

- **Digiteal API Documentation:** See `DIGITEAL_API_DOCUMENTATION.md`
- **UBL Syntax & Validation:** See `DIGITEAL_API_DOCUMENTATION.md` → UBL Syntax & Validation Rules
- **Mandatory Fields:** See `DIGITEAL_API_DOCUMENTATION.md` → Mandatory Fields for Peppol BIS Billing 3.0

---

## 🔍 Key Features

### Client Type-Based Routing
- **Professional clients (`company`):** System automatically checks if receiver is on Peppol network
  - If on Peppol: Shows both Peppol and Email options (Peppol auto-selected)
  - If not on Peppol: Shows Email option with warning
  - Validates receiver supports INVOICE document type before sending
- **Individual clients (`individual`):** Directly opens Email modal (no Peppol option)

### Invoice Types Support
- **Deposit invoices:** Shows simple "Deposit payment" line item
- **Final invoices:** Shows full task/material breakdown
- **Deposit/Balance amounts:** Stored in `peppol_metadata` for proper calculation

### Email Sending Features
- **Multi-language support:** Email content translated to client's language preference
- **PDF generation:** Bank information hidden for professional clients (unless Peppol failed/not sent)
- **Warning messages:** Professional clients receive warning when sending via email instead of Peppol
- **Resend service:** Uses Resend API for reliable email delivery

### Peppol Network Features
- **Receiver capability checking:** Automatically checks if receiver is registered on Peppol
- **Document type validation:** Validates receiver supports INVOICE document type
- **Retry logic:** Automatic retry on failed sends (up to 3 attempts)
- **Status tracking:** Real-time status updates via webhooks
- **PDF attachments:** Extracts and stores PDF attachments from received invoices

### Storage
- **Client invoice attachments:** `invoice-uploads` bucket
- **Expense invoice PDFs:** `expense-invoice-attachments` bucket
- **Storage path format:** `expense-invoice-pdfs/{userId}/{invoiceNumber}_{filename}`

---

## 📋 UBL XML Element Ordering (Critical for Validation)

**IMPORTANT:** The order of elements in UBL XML is strictly enforced by the UBL 2.1 Invoice schema. Placing elements in the wrong order will cause validation errors.

### Correct Element Order

The following is the **correct and tested** element order for Peppol BIS Billing 3.0 UBL invoices:

```xml
<Invoice>
  <!-- 1. Document Identifiers (Mandatory) -->
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>INV-001</cbc:ID>
  <cbc:IssueDate>2025-01-15</cbc:IssueDate>
  <cbc:DueDate>2025-02-15</cbc:DueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  
  <!-- 2. Buyer Reference -->
  <cbc:BuyerReference>PO-12345</cbc:BuyerReference>
  
  <!-- 3. Order Reference (Optional - for final invoices with deposit) -->
  <cac:OrderReference>
    <cbc:ID>DEP-INV-001</cbc:ID>
  </cac:OrderReference>
  
  <!-- 4. Additional Document Reference (PDF Attachment) - MUST BE HERE -->
  <!-- ⚠️ CRITICAL: AdditionalDocumentReference MUST be placed AFTER OrderReference and BEFORE party elements -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>INVOICE_PDF</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject
        mimeCode="application/pdf"
        filename="invoice-INV-001.pdf">
        BASE64_ENCODED_PDF_CONTENT
      </cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  
  <!-- 5. Party Information -->
  <cac:AccountingSupplierParty>...</cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>...</cac:AccountingCustomerParty>
  
  <!-- 6. Delivery Information (Optional) -->
  <cac:Delivery>...</cac:Delivery>
  
  <!-- 7. Payment Information -->
  <cac:PaymentMeans>...</cac:PaymentMeans>
  <cac:PaymentTerms>...</cac:PaymentTerms>
  
  <!-- 8. Allowance/Charge (Optional - for final invoices with deposit deduction) -->
  <cac:AllowanceCharge>...</cac:AllowanceCharge>
  
  <!-- 9. Tax and Monetary Totals -->
  <cac:TaxTotal>...</cac:TaxTotal>
  <cac:LegalMonetaryTotal>...</cac:LegalMonetaryTotal>
  
  <!-- 10. Invoice Lines -->
  <cac:InvoiceLine>...</cac:InvoiceLine>
</Invoice>
```

### Key Points About Element Ordering

1. **AdditionalDocumentReference (PDF Attachment) Placement:**
   - ✅ **CORRECT:** After `OrderReference`, before `AccountingSupplierParty`
   - ❌ **WRONG:** After `AllowanceCharge` and before `TaxTotal` (will cause validation error)
   - ❌ **WRONG:** After `PaymentTerms` and before `AllowanceCharge` (will cause validation error)
   - ❌ **WRONG:** After `TaxTotal` or `LegalMonetaryTotal` (will cause validation error)

2. **Payment-Related Elements:**
   - `PaymentMeans` and `PaymentTerms` must come before `AllowanceCharge`
   - All payment-related elements must be complete before `TaxTotal`

3. **Tax and Monetary Totals:**
   - `TaxTotal` must come before `LegalMonetaryTotal`
   - Both must come before `InvoiceLine` elements

4. **Invoice Lines:**
   - Must be the last elements in the invoice
   - At least one `InvoiceLine` is mandatory

### Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid content was found starting with element 'AdditionalDocumentReference'` | `AdditionalDocumentReference` placed after `AllowanceCharge` or `TaxTotal` | Move `AdditionalDocumentReference` to after `OrderReference` and before party elements |
| `One of 'PaymentTerms, PrepaidPayment, AllowanceCharge...' is expected` | `AdditionalDocumentReference` placed in wrong position | Place `AdditionalDocumentReference` after `OrderReference`, before `AccountingSupplierParty` |
| `One of 'InvoiceLine' is expected` | Elements placed after `TaxTotal`/`LegalMonetaryTotal` that aren't `InvoiceLine` | Ensure only `InvoiceLine` elements come after `TaxTotal` and `LegalMonetaryTotal` |

### Implementation Reference

The correct element order is implemented in:
- **File:** `src/services/peppolService.js`
- **Function:** `generatePEPPOLXML()`
- **Lines:** ~1042-1048 (element placement)

**Note:** This ordering has been tested and validated successfully with Peppol BIS Billing 3.0 validators.

---

**Last Updated:** 2025-01-15
