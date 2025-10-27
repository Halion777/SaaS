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

**Automated by Webhook:**

```javascript
// Webhook automatically receives invoice and:
// 1. Creates expense_invoices record
await supabase
  .from('expense_invoices')
  .insert({
    user_id: userId,
    supplier_name: 'ACME Corp',
    invoice_number: 'SUP-123',
    amount: 500,
    source: 'peppol',
    peppol_enabled: true,
    peppol_message_id: 'MSG-456',
    sender_peppol_id: '0208:7890123456',
    ubl_xml: rawUblXml,
    peppol_received_at: new Date()
  });

// 2. Creates tracking record in peppol_invoices
await supabase
  .from('peppol_invoices')
  .insert({
    user_id: userId,
    direction: 'inbound',
    invoice_number: 'SUP-123',
    sender_peppol_id: '0208:7890123456',
    receiver_peppol_id: '0208:0630675588',
    status: 'received',
    peppol_message_id: 'MSG-456',
    // ... other fields
  });
```

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

