# Peppol Integration Guide

## Overview

This guide explains the Peppol integration in your SaaS invoicing system. It covers the database tables used, files involved, data structures, APIs needed, and step-by-step flows for both client invoices (outbound) and expense invoices (inbound).

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
- **`src/pages/invoices-management/components/SendPeppolModal.jsx`** - Modal for sending invoice via Peppol
- **`src/pages/invoices-management/components/InvoiceDetailModal.jsx`** - Modal for viewing invoice details
- **`src/pages/invoices-management/components/InvoicesFilterToolbar.jsx`** - Filter toolbar

#### Expense Invoices (Inbound)
- **`src/pages/expense-invoices/index.jsx`** - Main expense invoice management page
- **`src/pages/expense-invoices/components/ExpenseInvoicesDataTable.jsx`** - Expense invoice table/card display
- **`src/pages/expense-invoices/components/QuickExpenseInvoiceCreation.jsx`** - Modal for manual expense invoice creation

#### Peppol Configuration
- **`src/pages/services/peppol/index.jsx`** - Peppol integration setup and status page

---

### Service Files

- **`src/services/invoiceService.js`** - Service for managing client invoices
  - `fetchInvoices(userId)` - Fetches invoices with client and quote data
  - `updateInvoiceStatus(invoiceId, status, notes)` - Updates invoice status
  - `getInvoiceStatistics(userId)` - Calculates invoice statistics

- **`src/services/expenseInvoicesService.js`** - Service for managing expense invoices
  - `getExpenseInvoices(userId, filters)` - Fetches expense invoices
  - `getExpenseInvoice(invoiceId)` - Fetches single expense invoice
  - `updateExpenseInvoiceStatus(invoiceId, status)` - Updates invoice status

- **`src/services/peppolService.js`** - Service for Peppol operations
  - `sendInvoice(invoiceData)` - Sends invoice via Peppol
  - `convertHaliqoInvoiceToPeppol(haliqoInvoice, senderInfo, receiverInfo)` - Converts invoice format
  - `generatePEPPOLXML(invoiceData)` - Generates UBL XML
  - `getPeppolSettings()` - Gets user's Peppol configuration
  - `getPeppolParticipants()` - Gets saved Peppol participants

- **`src/services/quotesService.js`** - Service for quote operations
  - `convertQuoteToInvoice(quote, userId)` - Converts accepted quote to invoice

- **`src/services/companyInfoService.js`** - Service for company information
  - `loadCompanyInfo()` - Loads company profile information

---

### Edge Functions

- **`supabase/functions/peppol-webhook-config/index.ts`** - Edge function for sending invoices
  - Handles `send-ubl-document` action
  - Sends UBL XML to Digiteal API: `POST /api/v1/peppol/outbound-ubl-documents`
  - Uses Basic Auth
  - Returns success/error response

- **`supabase/functions/peppol-webhook/index.ts`** - Edge function for receiving webhooks
  - Receives webhook events from Digiteal
  - Processes inbound invoices (creates expense invoices)
  - Updates invoice status based on webhook events
  - Handles all webhook event types

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

### Flow 1: Sending Client Invoice via Peppol

```
1. User clicks "Send via Peppol" on invoice
   ↓
2. Check Peppol configuration (peppolSettings.isConfigured)
   ↓
3. Load company info (sender) and client info (receiver)
   ↓
4. Create invoice lines from quote tasks or single line
   ↓
5. Convert invoice to Peppol format (convertHaliqoInvoiceToPeppol)
   ↓
6. Generate UBL XML (generatePEPPOLXML)
   ↓
7. Send via edge function (peppol-webhook-config)
   ↓
8. Edge function sends to Digiteal API (POST /api/v1/peppol/outbound-ubl-documents)
   ↓
9. Update invoice with initial status (peppol_status = 'sent')
   ↓
10. Webhook receives status updates (PEPPOL_SEND_PROCESSING_OUTCOME, PEPPOL_MLR_RECEIVED)
    ↓
11. Invoice status updated to 'delivered' when MLR confirms delivery
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

### Step 3: Send Client Invoice via Peppol

1. Navigate to `/invoices-management`
2. Find the invoice you want to send
3. Click "Send via Peppol" button in actions column
4. System checks if Peppol is configured
   - If not configured: Shows warning and redirects to configuration page
   - If configured: Continues with sending
5. Select client's Peppol ID (from participants or manual entry)
6. Click "Send" button
7. System automatically:
   - Loads company info (sender)
   - Loads client info (receiver)
   - Creates invoice lines from quote tasks
   - Converts invoice to Peppol format
   - Generates UBL XML
   - Sends via Peppol edge function
   - Updates invoice with Peppol status
8. Invoice status updates automatically via webhooks:
   - Initial: `sent`
   - When MLR received: `delivered`

**Files:**
- `src/pages/invoices-management/components/SendPeppolModal.jsx`
- `src/services/peppolService.js` → `sendInvoice()`
- `supabase/functions/peppol-webhook-config/index.ts`

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
   - Financial information
   - Notes
   - Peppol metadata tab

**Files:** `src/pages/expense-invoices/components/ExpenseInvoiceDetailModal.jsx` (if exists)

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

## 📚 Additional Resources

- **Digiteal API Documentation:** See `DIGITEAL_API_DOCUMENTATION.md`
- **UBL Syntax & Validation:** See `DIGITEAL_API_DOCUMENTATION.md` → UBL Syntax & Validation Rules
- **Mandatory Fields:** See `DIGITEAL_API_DOCUMENTATION.md` → Mandatory Fields for Peppol BIS Billing 3.0

---

**Last Updated:** 2025-01-15
