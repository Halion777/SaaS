# 🚀 PEPPOL INTEGRATION - COMPLETE SETUP GUIDE

## 📋 Quick Overview

**What you're installing:** Peppol network integration for sending/receiving invoices electronically

**Your Webhook URL:** `https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook`

**Time Required:** 15 minutes

**Files to Run:** 3 SQL files (in order)

---

## 👑 Super Admin Setup (Recommended)

**Best Practice:** Configure Peppol settings through the Super Admin dashboard for centralized management.

### Access Super Admin Peppol Settings:

1. Login as Super Admin
2. Navigate to **Sidebar → Integrations → Peppol Settings**
3. Configure API credentials and webhook in one place
4. Test connection with one click
5. Monitor webhook status

**Benefits:**
- ✅ Centralized configuration management
- ✅ One-click webhook setup
- ✅ Visual status indicators
- ✅ Easy credential updates
- ✅ No manual API calls needed

---

## ⚡ QUICK START (Follow These Steps)

### 1️⃣ Run SQL Files in Supabase (5 min)

Open **Supabase Dashboard → SQL Editor** and run these files **IN ORDER**:

```
1. step1_add_peppol_fields.sql      (2 min)
2. step2_create_peppol_tables.sql   (2 min)
3. step3_add_invoice_attachments.sql (1 min)
```

**How to run:**
- Copy entire file contents
- Paste in SQL Editor
- Click "Run"
- Wait for success message

---

### 2️⃣ Deploy Webhook (2 min)

```bash
npx supabase functions deploy peppol-webhook
```

Your webhook is at: `supabase/functions/peppol-webhook/index.ts`

---

### 3️⃣ Configure Peppol Settings (2 min)

**Method A - Super Admin Dashboard (Recommended):**

1. Login as **Super Admin**
2. Go to **Sidebar → Integrations → Peppol Settings**
3. **API Credentials Tab:**
   - Set Environment: Test Mode (toggle on)
   - Username: `haliqo-test`
   - Password: `Haliqo123`
   - Click "Test Connection" ✅
   - Click "Save Settings" 💾

4. **Webhook Configuration Tab:**
   - Webhook URL: `https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook`
   - Click "Configure Webhook" 🔗
   - Wait for success message ✅

**Method B - Manual via Digiteal API:**

```javascript
const configureWebhook = async () => {
  const response = await fetch('https://test.digiteal.eu/api/v1/webhook/configuration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('haliqo-test:Haliqo123')
    },
    body: JSON.stringify({
      vatNumber: 'BE1001464622',
      identificationNumber: 'BE:VAT:BE1001464622',
      login: 'haliqo-test',
      webHooks: [
        { type: 'PEPPOL_INVOICE_RECEIVED', url: 'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook' },
        { type: 'PEPPOL_SEND_PROCESSING_OUTCOME', url: 'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook' },
        { type: 'PEPPOL_CREDIT_NOTE_RECEIVED', url: 'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook' },
        { type: 'PEPPOL_INVOICE_RESPONSE_RECEIVED', url: 'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook' },
        { type: 'PEPPOL_TRANSPORT_ACK_RECEIVED', url: 'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook' }
      ]
    })
  });
  return response.ok;
};
```

---

### 4️⃣ Test (2 min)

```javascript
import PeppolService from './services/peppolService';

const peppolService = new PeppolService(true);
const result = await peppolService.getPublicSupportedDocumentTypes();

console.log('✅ API Connected:', result.success);
```

---

## 📊 What Gets Created

### Your Existing Tables (Enhanced)

**`invoices`** - Client invoices:
- ✅ All existing fields preserved
- ✅ Added: `peppol_enabled`, `peppol_status`, `peppol_message_id`, `peppol_sent_at`, `peppol_delivered_at`, `receiver_peppol_id`, `ubl_xml`, etc.

**`expense_invoices`** - Supplier invoices:
- ✅ All existing fields preserved
- ✅ Added: `peppol_enabled`, `peppol_message_id`, `peppol_received_at`, `sender_peppol_id`, `ubl_xml`, `user_id`, etc.

**`invoice_attachments`** - NEW:
- ✅ Attachments for client invoices (matches `expense_invoice_attachments`)

---

### New Peppol Support Tables

| Table | Purpose |
|-------|---------|
| `peppol_settings` | Your Peppol configuration |
| `peppol_participants` | Trading partners (suppliers/clients) |
| `peppol_invoices` | Tracking table (links to your invoices) |
| `peppol_invoice_lines` | Invoice line items |
| `peppol_webhooks` | Webhook configurations |
| `peppol_webhook_events` | Event logs |
| `peppol_document_types` | Supported document types |
| `peppol_audit_log` | Complete audit trail |

---

### Helper Views & Functions

**Views:**
- `invoices_with_peppol` - Client invoices with Peppol data
- `expense_invoices_with_peppol` - Supplier invoices with Peppol data
- `invoices_with_attachments` - Invoices with attachment counts

**Functions:**
- `mark_invoice_sent_via_peppol()` - Mark invoice as sent
- `update_peppol_invoice_status()` - Update delivery status
- `get_invoice_attachments()` - Get invoice attachments

---

## 🔑 API Credentials (Test Environment)

**Digiteal Test API:**
- Base URL: `https://test.digiteal.eu`
- Username: `haliqo-test`
- Password: `Haliqo123`
- Your Peppol ID: `0208:0630675588`

**Webhook Authentication:**
- Username: `haliqo-test`
- Password: `Haliqo123`
- URL: `https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook`

---

## 📖 How It Works

### Sending Invoice (Outbound)

```javascript
// 1. Create invoice normally
const invoice = await createInvoice({
  client_id: clientId,
  amount: 1000,
  // ... other fields
});

// 2. Send via Peppol
import PeppolService from './services/peppolService';
const peppolService = new PeppolService(true);

const result = await peppolService.sendInvoiceWithTracking(invoiceData);

// What happens:
// ✅ Invoice sent via Peppol network
// ✅ invoices.peppol_enabled = true
// ✅ invoices.peppol_status = 'sent'
// ✅ invoices.peppol_message_id = 'MSG-123'
// ✅ Tracking created in peppol_invoices
```

---

### Receiving Invoice (Inbound)

```javascript
// Webhook automatically receives invoice and:
// ✅ Creates expense_invoices record
// ✅ Sets peppol_enabled = true
// ✅ Sets source = 'peppol'
// ✅ Stores UBL XML
// ✅ Creates peppol_participants entry
// ✅ Logs to peppol_audit_log

// Your existing code automatically shows it:
const { data: invoices } = await supabase
  .from('expense_invoices')
  .select('*')
  .eq('user_id', userId);

// Now includes Peppol invoices!
```

---

## 🧪 Testing & Verification

### Test 1: Check Database Migration

```sql
-- Verify new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND column_name LIKE 'peppol%';

-- Should show: peppol_enabled, peppol_status, peppol_message_id, etc.
```

```sql
-- Verify new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'peppol%';

-- Should show: peppol_settings, peppol_participants, etc.
```

---

### Test 2: Test API Connection

```javascript
import PeppolService from './services/peppolService';

const peppolService = new PeppolService(true);

// Test 1: Get supported document types
const test1 = await peppolService.getPublicSupportedDocumentTypes();
console.log('API Connected:', test1.success);

// Test 2: Get participant info
const test2 = await peppolService.getDetailedParticipantInfo('0208:0630675588');
console.log('Participant Info:', test2);
```

---

### Test 3: Test Webhook

```javascript
import { PeppolWebhookService } from './services/peppolWebhookService';

const webhookService = new PeppolWebhookService(true);

// Send test webhook
const result = await webhookService.testWebhook('PEPPOL_INVOICE_RECEIVED');
console.log('Webhook Test:', result);

// Check if event was logged
const { data: events } = await supabase
  .from('peppol_webhook_events')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

console.log('Recent Events:', events);
```

---

### Test 4: Create Test Invoice

```javascript
// Test creating expense invoice from Peppol
const { data, error } = await supabase
  .from('expense_invoices')
  .insert({
    user_id: userId,
    invoice_number: 'TEST-PEPPOL-001',
    supplier_name: 'Test Supplier',
    supplier_email: 'test@supplier.com',
    amount: 1000,
    issue_date: '2024-01-15',
    due_date: '2024-02-15',
    status: 'pending',
    source: 'peppol',
    peppol_enabled: true,
    peppol_message_id: 'TEST-MSG-123',
    sender_peppol_id: '0208:1234567890'
  });

console.log('Test invoice created:', data);
```

---

## 💻 Usage Examples

### Query Peppol Invoices

```javascript
// Get all Peppol-sent invoices
const { data: peppolInvoices } = await supabase
  .from('invoices')
  .select('*')
  .eq('peppol_enabled', true)
  .eq('user_id', userId);

// Get delivered invoices
const { data: delivered } = await supabase
  .from('invoices')
  .select('*')
  .eq('peppol_status', 'delivered')
  .eq('user_id', userId);

// Use helper view
const { data: allInvoices } = await supabase
  .from('invoices_with_peppol')
  .select('*')
  .eq('user_id', userId);
```

---

### Upload Invoice Attachment

```javascript
// Upload file to storage
const fileName = `${Date.now()}-${file.name}`;
const { data: fileData, error: uploadError } = await supabase.storage
  .from('invoice-attachments')
  .upload(`${userId}/${invoiceId}/${fileName}`, file);

// Create attachment record
const { data: attachment } = await supabase
  .from('invoice_attachments')
  .insert({
    invoice_id: invoiceId,
    file_name: file.name,
    file_path: fileData.path,
    file_size: file.size,
    file_type: 'pdf',
    mime_type: file.type,
    uploaded_by: userId
  });
```

---

### Send Invoice with Attachments

```javascript
// Get invoice with attachments
const { data: invoice } = await supabase
  .from('invoices')
  .select('*, attachments:invoice_attachments(*)')
  .eq('id', invoiceId)
  .single();

// Send via Peppol (attachments embedded in UBL)
const result = await peppolService.sendInvoiceWithAttachments({
  invoice: invoice,
  attachments: invoice.attachments
});

// Mark attachments as embedded
if (result.success) {
  await supabase
    .from('invoice_attachments')
    .update({ is_embedded_in_ubl: true })
    .eq('invoice_id', invoiceId);
}
```

---

### Check Invoice Status

```javascript
// Get invoice with Peppol status
const { data: invoice } = await supabase
  .from('invoices')
  .select('*')
  .eq('id', invoiceId)
  .single();

if (invoice.peppol_enabled) {
  console.log('Peppol Status:', invoice.peppol_status);
  console.log('Sent At:', invoice.peppol_sent_at);
  console.log('Message ID:', invoice.peppol_message_id);
  
  if (invoice.peppol_status === 'delivered') {
    console.log('Delivered At:', invoice.peppol_delivered_at);
  }
  
  if (invoice.peppol_status === 'failed') {
    console.log('Error:', invoice.peppol_error_message);
  }
}
```

---

## 🎨 Frontend Integration (Optional)

### Show Peppol Status in Invoice List

```jsx
function InvoiceRow({ invoice }) {
  return (
    <tr>
      <td>{invoice.invoice_number}</td>
      <td>{invoice.amount}</td>
      <td>{invoice.status}</td>
      
      {/* Show Peppol status */}
      <td>
        {invoice.peppol_enabled ? (
          <span className={`badge badge-${getPeppolStatusColor(invoice.peppol_status)}`}>
            {invoice.peppol_status === 'delivered' && '✅ Delivered'}
            {invoice.peppol_status === 'sent' && '📤 Sent'}
            {invoice.peppol_status === 'sending' && '⏳ Sending'}
            {invoice.peppol_status === 'failed' && '❌ Failed'}
          </span>
        ) : (
          <span className="badge badge-secondary">Manual</span>
        )}
      </td>
    </tr>
  );
}
```

---

## 🚨 Troubleshooting

### Issue: Column already exists

**Solution:** That step already ran successfully. Skip to next SQL file.

---

### Issue: Webhook returns 401 Unauthorized

**Check credentials in webhook handler:**
```typescript
// In supabase/functions/peppol-webhook/index.ts
// Credentials should be: haliqo-test : Haliqo123
```

**Fix:** Update credentials in Digiteal dashboard:
1. Go to https://test.digiteal.eu
2. Webhooks → Configuration → Credentials
3. Set: `haliqo-test` / `Haliqo123`

---

### Issue: Events not appearing in database

**Check user has Peppol settings:**
```sql
SELECT * FROM peppol_settings 
WHERE peppol_id = '0208:0630675588';
```

**If missing, create settings:**
```javascript
await peppolService.savePeppolSettings({
  peppolId: '0208:0630675588',
  businessName: 'Your Company',
  vatNumber: '0630675588',
  countryCode: 'BE'
});
```

---

### Issue: Webhook not receiving events

**Check webhook is deployed:**
```bash
npx supabase functions list
```

**Check logs:**
1. Supabase Dashboard → Edge Functions → peppol-webhook
2. Click "Logs" tab
3. Look for incoming requests

**Test webhook manually:**
```bash
curl -X POST "https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook" \
  -H "Authorization: Basic $(echo -n 'haliqo-test:Haliqo123' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "PEPPOL_INVOICE_RECEIVED",
    "timestamp": "2024-01-15T10:00:00Z",
    "data": {
      "peppolIdentifier": "0208:0630675588",
      "messageId": "TEST-123"
    }
  }'
```

---

### Issue: Invoice not showing in dashboard

**Check RLS policies:**
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('invoices', 'expense_invoices');

-- Test query
SELECT * FROM expense_invoices 
WHERE user_id = 'your-user-id' 
LIMIT 5;
```

---

## 📊 Monitoring & Analytics

### Check Webhook Statistics

```javascript
import { PeppolWebhookService } from './services/peppolWebhookService';

const webhookService = new PeppolWebhookService(true);
const stats = await webhookService.getWebhookStatistics();

console.log('Total Events:', stats.data.totalEvents);
console.log('Processed:', stats.data.processedEvents);
console.log('Failed:', stats.data.failedEvents);
console.log('Success Rate:', stats.data.successRate + '%');
```

---

### Check Peppol Statistics

```javascript
import PeppolService from './services/peppolService';

const peppolService = new PeppolService(true);
const stats = await peppolService.getStatistics();

console.log('Total Sent:', stats.data.totalSent);
console.log('Total Received:', stats.data.totalReceived);
console.log('Sent This Month:', stats.data.sentThisMonth);
console.log('Received This Month:', stats.data.receivedThisMonth);
```

---

### View Audit Trail

```sql
-- Get recent audit logs
SELECT 
  action_type,
  action_description,
  status,
  created_at,
  error_message
FROM peppol_audit_log
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 20;
```

---

### Monitor Webhook Events

```sql
-- Check webhook event status
SELECT 
  event_type,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_event
FROM peppol_webhook_events
WHERE user_id = 'your-user-id'
GROUP BY event_type, status
ORDER BY last_event DESC;
```

---

## ✅ Success Checklist

After complete setup:

- [ ] All 3 SQL files ran successfully
- [ ] No errors in SQL Editor
- [ ] Webhook handler deployed
- [ ] Webhook URL configured in Digiteal
- [ ] API connection test passed
- [ ] Webhook test successful
- [ ] Test invoice created
- [ ] Events logged in database
- [ ] Supabase logs show webhook requests
- [ ] No errors in logs

---

## 🎉 What You Can Do Now

✅ **Send invoices via Peppol**
```javascript
await peppolService.sendInvoiceWithTracking(invoiceData);
```

✅ **Receive invoices automatically**
- Webhook processes incoming invoices
- Creates expense_invoices records
- Notifies your system

✅ **Track delivery status**
```javascript
// Real-time status updates
invoice.peppol_status // 'sent', 'delivered', 'failed'
```

✅ **Attach documents**
```javascript
await supabase.from('invoice_attachments').insert({...});
```

✅ **Monitor everything**
- Complete audit trail
- Webhook event logs
- Statistics dashboard

---

## 🔐 Security Features

Your integration includes:

✅ **Row Level Security (RLS)** - Users only see their own data  
✅ **Webhook Authentication** - Basic Auth protection  
✅ **Encrypted Storage** - UBL XML stored securely  
✅ **Audit Trail** - Complete log of all actions  
✅ **Service Role Protection** - Separate permissions for webhooks  

---

## 📚 Key Features Summary

| Feature | Status |
|---------|--------|
| Send invoices via Peppol | ✅ Ready |
| Receive invoices via Peppol | ✅ Ready |
| Invoice attachments | ✅ Ready |
| Delivery tracking | ✅ Ready |
| Webhook automation | ✅ Ready |
| Audit trail | ✅ Ready |
| Multi-user support | ✅ Ready |
| Test/Production modes | ✅ Ready |
| Complete documentation | ✅ Ready |

---

## 🆘 Need Help?

1. **Check logs:** Supabase Dashboard → Edge Functions → Logs
2. **Review audit trail:** Query `peppol_audit_log` table
3. **Test API directly:** Use provided test code snippets
4. **Verify credentials:** `haliqo-test` / `Haliqo123`

---

## 🚀 Summary

**Installation:**
- 3 SQL files to run
- 1 webhook to deploy
- 1 webhook URL to configure
- Total time: ~15 minutes

**What You Get:**
- ✅ Peppol network integration
- ✅ Automatic invoice sync
- ✅ Complete tracking
- ✅ Full audit trail
- ✅ Zero data loss
- ✅ Backwards compatible

**Your Data:**
- ✅ All existing invoices preserved
- ✅ All existing code works unchanged
- ✅ New features added seamlessly

---

**🎉 You're ready to go live with Peppol integration!**

**Next:** Send your first invoice via Peppol network! 🚀

