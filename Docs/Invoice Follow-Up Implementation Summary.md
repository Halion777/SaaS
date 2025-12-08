# Invoice Follow-Up System - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Follow-Up Rules & Settings](#follow-up-rules--settings)
5. [Edge Functions](#edge-functions)
6. [Frontend Services](#frontend-services)
7. [Email Templates](#email-templates)
8. [Workflow & Stages](#workflow--stages)
9. [Priority System](#priority-system)
10. [Cron Jobs & Scheduling](#cron-jobs--scheduling)
11. [Implementation Details](#implementation-details)

---

## System Overview

The Invoice Follow-Up System is an automated email reminder system that sends payment reminders to clients based on invoice due dates. The system uses a **progressive follow-up strategy** with approaching deadline reminders and overdue invoice stages.

### Key Features
- **Automated follow-up creation** when invoices are created or status changes to unpaid/overdue
- **Approaching deadline reminders** (3 days before due date)
- **3-stage progressive follow-ups** for overdue invoices
- **Priority system** (high, medium, low) based on stage and days overdue
- **Automatic cleanup** when invoices are paid/cancelled
- **Manual follow-up trigger** from UI
- **Multiple attempts per stage** (3 attempts with 1 day delay between attempts)

### Important Note
**Unlike quote follow-ups, invoice follow-ups do NOT track email behavior** (email opens, views, etc.). Clients pay invoices manually, and invoice status is updated when payment is received. The system only tracks:
- Approaching deadline (before due date)
- Overdue status (after due date)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - Invoice Follow-Up Management Page                        │
│  - Invoice Management Page                                  │
│  - Manual Follow-Up Trigger                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Services Layer                                  │
│  - invoiceFollowUpService.js (Frontend API)                  │
│  - invoiceService.js (Invoice Operations)                   │
│  - quotesService.js (Quote to Invoice Conversion)            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Supabase Edge Functions                           │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │ invoice-followups-     │  │ invoice-followups-       │  │
│  │ scheduler              │  │ dispatcher               │  │
│  │ (Daily at 9 AM)        │  │ (Every 15 minutes)      │  │
│  └────────────────────────┘  └──────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                          │
│  - invoice_follow_ups (Main follow-up records)              │
│  - invoice_events (Event tracking)                          │
│  - email_templates (Email templates)                        │
│  - email_outbox (Email queue)                               │
│  - invoices (Invoice data)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. `invoice_follow_ups`
Main table storing all invoice follow-up records.

```sql
CREATE TABLE public.invoice_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  stage SMALLINT NOT NULL,                    -- 0 for approaching, 1, 2, 3 for overdue
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  next_attempt_at TIMESTAMP WITH TIME ZONE,
  attempts SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 3,   -- Max attempts per stage
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  channel VARCHAR(20) NOT NULL DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  automated BOOLEAN NOT NULL DEFAULT true,
  template_subject TEXT,
  template_text TEXT,
  template_html TEXT,
  meta JSONB DEFAULT '{}'                     -- Stores priority, follow_up_type, etc.
);
```

**Status Values:**
- `pending` - Initial state
- `scheduled` - Scheduled for sending
- `ready_for_dispatch` - Ready to be sent
- `sent` - Email sent successfully
- `failed` - Email sending failed
- `stopped` - Follow-up stopped (invoice paid/cancelled)
- `stage_0_completed` - Approaching deadline stage completed
- `stage_1_completed` - Overdue stage 1 completed
- `stage_2_completed` - Overdue stage 2 completed
- `stage_3_completed` - Overdue stage 3 completed
- `all_stages_completed` - All stages completed

**Stage Values:**
- `0` - Approaching deadline (before due date)
- `1` - Overdue stage 1 (1 day after due date)
- `2` - Overdue stage 2 (3 days after stage 1)
- `3` - Overdue stage 3 (7 days after stage 2)

**Meta JSONB Fields:**
- `follow_up_type`: `'approaching_deadline'` or `'overdue'`
- `priority`: `'high'`, `'medium'`, or `'low'`
- `template_type`: Template identifier
- `days_until_due`: Days until due date (for approaching)
- `days_overdue`: Days since due date (for overdue)
- `automated`: Boolean indicating if automated

#### 2. `invoice_events`
Event tracking table for invoice follow-up actions.

```sql
CREATE TABLE public.invoice_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,                  -- Event type
  meta JSONB DEFAULT '{}',                     -- Event metadata
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Event Types:**
- `followup_sent` - Follow-up email sent
- `followup_failed` - Follow-up email failed
- `followups_stopped` - All follow-ups stopped
- `manual_followup_sent` - Manual follow-up triggered

---

## Follow-Up Rules & Settings

### Global Rules (Hardcoded in Scheduler)

```javascript
const globalRules = {
  max_stages: 3,                              // Maximum overdue stages
  approaching_deadline_days: 3,                // Days before due date to send reminder
  stage_1_delay: 1,                            // Days after due date for stage 1
  stage_2_delay: 3,                            // Days after stage 1 for stage 2
  stage_3_delay: 7,                            // Days after stage 2 for stage 3
  max_attempts_per_stage: 3,                  // Max attempts per stage
  approaching_template: 'invoice_payment_reminder',
  overdue_template: 'invoice_overdue_reminder'
};
```

### Follow-Up Types

#### 1. Approaching Deadline (Stage 0)
- **Trigger**: 3 days before invoice due date
- **Template**: `invoice_payment_reminder`
- **Priority**: Medium
- **Stage**: 0 (stored as stage 1 in database, but type is `approaching_deadline`)
- **Max Attempts**: 3
- **Delay Between Attempts**: 1 day

#### 2. Overdue (Stages 1, 2, 3)
- **Trigger**: After invoice due date passes
- **Template**: `invoice_overdue_reminder`
- **Priority**: 
  - Stage 1: Medium (if < 7 days overdue) or High (if ≥ 7 days overdue)
  - Stage 2+: Always High
- **Stages**:
  - **Stage 1**: 1 day after due date
  - **Stage 2**: 3 days after stage 1 completes
  - **Stage 3**: 7 days after stage 2 completes
- **Max Attempts per Stage**: 3
- **Delay Between Attempts**: 1 day

### Stop Conditions

Follow-ups are automatically stopped when:
1. Invoice status changes to `paid`
2. Invoice status changes to `cancelled`
3. All stages completed (status = `all_stages_completed`)

### Follow-Up Creation Triggers

Follow-ups are created when:
1. **Invoice Created**: When quote is converted to invoice (status = `unpaid`)
2. **Status Change**: When invoice status changes to `unpaid` or `overdue`
3. **Cron Job**: Daily scheduler processes approaching deadlines and overdue invoices

---

## Edge Functions

### 1. `invoice-followups-scheduler`

**Purpose**: Creates and schedules invoice follow-ups, progresses stages, and cleans up finalized invoices.

**Execution**: Daily at 9 AM (via cron job)

**Main Functions**:

#### `processApproachingInvoices()`
- Finds invoices with due date = 3 days from today
- Creates approaching deadline follow-ups
- Only creates if no existing approaching deadline follow-up exists

#### `processOverdueInvoices()`
- Finds invoices with due date < today and status = `unpaid` or `overdue`
- Creates or updates overdue follow-ups
- Determines stage based on days overdue and existing follow-up attempts

#### `cleanupPaidCancelledInvoices()`
- Finds invoices with status = `paid` or `cancelled`
- Stops all pending/scheduled follow-ups for these invoices

#### `progressFollowUpStages()`
- Finds follow-ups with status = `sent` and attempts >= max_attempts
- Progresses to next stage if not at max stage
- Updates status to `stage_X_completed` or `all_stages_completed`

#### `createInitialFollowUpForInvoice()`
- Called from frontend when invoice is created
- Determines if approaching deadline or overdue
- Creates appropriate follow-up

**Frontend Actions**:
- `action: 'create_followup_for_invoice'` - Create follow-up for specific invoice
- `action: 'cleanup_finalized_invoice'` - Stop follow-ups for paid/cancelled invoice

### 2. `invoice-followups-dispatcher`

**Purpose**: Sends scheduled follow-up emails via Resend API.

**Execution**: Every 15 minutes (via cron job)

**Main Functions**:

#### `processFollowUp()`
1. Validates invoice (must be unpaid/overdue)
2. Gets client email
3. Replaces template variables with real-time data
4. Creates email_outbox record
5. Sends email via Resend API
6. Updates follow-up status:
   - If `attempts < max_attempts`: Reschedules for 1 day later (status = `scheduled`)
   - If `attempts >= max_attempts`: Sets status = `sent` (scheduler will progress stage)
7. Logs event to `invoice_events`

**Rescheduling Logic**:
- If attempts < max_attempts: Reschedule for 1 day later
- If attempts >= max_attempts: Mark as `sent` for scheduler to progress stage

---

## Frontend Services

### `invoiceFollowUpService.js`

#### `triggerFollowUpCreation(invoiceId)`
- Calls `invoice-followups-scheduler` with action `create_followup_for_invoice`
- Used when invoice is created or status changes to unpaid/overdue

#### `stopFollowUpsForInvoice(invoiceId)`
- Calls `invoice-followups-scheduler` with action `cleanup_finalized_invoice`
- Used when invoice is paid or cancelled

#### `fetchInvoiceFollowUps(userId, filters)`
- Fetches all invoice follow-ups for user
- Includes invoice and client data
- Supports filtering by status, stage, etc.

#### `triggerManualFollowUp(invoiceId)`
- Creates immediate follow-up email
- Inserts directly into `email_outbox` with status `sending`
- Logs `manual_followup_sent` event
- Does not affect automated workflow

### Service Integration

#### `invoiceService.js`
- `updateInvoiceStatus()`:
  - If status = `paid` or `cancelled` → Calls `stopFollowUpsForInvoice()`
  - If status changes to `unpaid` or `overdue` → Calls `triggerFollowUpCreation()`

#### `quotesService.js`
- `convertQuoteToInvoice()`:
  - After invoice creation → Calls `triggerFollowUpCreation()`

---

## Email Templates

### Template Types

#### 1. `invoice_payment_reminder`
Used for approaching deadline follow-ups (3 days before due date).

**Languages**: French (FR), English (EN), Dutch (NL)

**Variables**:
- `{invoice_number}` - Invoice reference number
- `{client_name}` - Client full name
- `{invoice_amount}` - Total invoice amount
- `{due_date}` - Payment due date
- `{days_until_due}` - Days until due date
- `{invoice_link}` - Direct link to view invoice
- `{company_name}` - Company name

#### 2. `invoice_overdue_reminder`
Used for overdue invoice follow-ups (after due date).

**Languages**: French (FR), English (EN), Dutch (NL)

**Variables**:
- `{invoice_number}` - Invoice reference number
- `{client_name}` - Client full name
- `{invoice_amount}` - Total invoice amount
- `{due_date}` - Payment due date
- `{days_overdue}` - Days since due date passed
- `{invoice_link}` - Direct link to view invoice
- `{company_name}` - Company name

### Template Selection

Templates are selected based on:
- `template_type` in `email_templates` table
- **Client language preference** (`client.language_preference` from database)
- `is_active = true`

**Language Priority:**
1. Client's `language_preference` from `clients` table (default: 'fr')
2. Fallback to French template if client language not found
3. Fallback to any active template if French not found

**Implementation:**
- ✅ Scheduler fetches client language when creating follow-ups
- ✅ Templates filtered by client language preference
- ✅ Dispatcher captures client language for logging
- ✅ Manual follow-ups use client language preference

---

## Workflow & Stages

### Complete Workflow

```
1. Invoice Created (status = 'unpaid')
   ↓
2. Frontend: triggerFollowUpCreation()
   ↓
3. Scheduler: createInitialFollowUpForInvoice()
   ↓
4. Check days until due date:
   ├─ > 3 days → Schedule approaching deadline follow-up
   ├─ 0-3 days → Create approaching deadline follow-up (send now)
   └─ < 0 days → Create overdue follow-up (stage 1)
   ↓
5. Follow-up created with status = 'scheduled'
   ↓
6. Dispatcher (every 15 min): Find due follow-ups
   ↓
7. Send email via Resend API
   ↓
8. Update follow-up:
   ├─ attempts < max_attempts → Reschedule for 1 day later
   └─ attempts >= max_attempts → Status = 'sent'
   ↓
9. Scheduler (daily): Progress stages
   ├─ If status = 'sent' and attempts >= max_attempts:
   │  ├─ Stage 1 → Stage 2 (delay 3 days)
   │  ├─ Stage 2 → Stage 3 (delay 7 days)
   │  └─ Stage 3 → all_stages_completed
   └─ If invoice paid/cancelled → Stop all follow-ups
```

### Stage Progression

**Stage 0 (Approaching Deadline)**:
- Created 3 days before due date
- Max 3 attempts, 1 day delay between attempts
- After max attempts → Status = `stage_0_completed`

**Stage 1 (Overdue - First Reminder)**:
- Created 1 day after due date
- Max 3 attempts, 1 day delay between attempts
- After max attempts → Progress to Stage 2

**Stage 2 (Overdue - Second Reminder)**:
- Created 3 days after Stage 1 completes
- Max 3 attempts, 1 day delay between attempts
- After max attempts → Progress to Stage 3

**Stage 3 (Overdue - Final Reminder)**:
- Created 7 days after Stage 2 completes
- Max 3 attempts, 1 day delay between attempts
- After max attempts → Status = `all_stages_completed`

---

## Priority System

### Priority Calculation

Priority is stored in `meta->priority` and calculated as follows:

1. **From Meta** (if exists): Use stored priority
2. **By Stage**:
   - Stage 0 (approaching): `medium`
   - Stage 1 (overdue < 7 days): `medium`
   - Stage 1 (overdue ≥ 7 days): `high`
   - Stage 2+: Always `high`

### Priority Usage

- Used for sorting in dispatcher (high priority first)
- Displayed in UI for filtering and visualization
- Helps identify urgent follow-ups

---

## Cron Jobs & Scheduling

### Cron Jobs Setup

**File**: `Sheduler_dispatcher.sql`

#### 1. Scheduler Job
```sql
SELECT cron.schedule(
  'invoice-followups-scheduler-daily',
  '0 9 * * *',  -- Daily at 9 AM
  $$
  SELECT content::text 
  FROM http((
    'POST',
    'https://[SUPABASE_URL]/functions/v1/invoice-followups-scheduler',
    ARRAY[
      ('Authorization'::text, 'Bearer [SERVICE_ROLE_KEY]'::text),
      ('Content-Type'::text, 'application/json'::text)
    ]::http_header[],
    'application/json',
    '{}'::jsonb
  )::http_request);
  $$
);
```

#### 2. Dispatcher Job
```sql
SELECT cron.schedule(
  'invoice-followups-dispatcher-frequent',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT content::text 
  FROM http((
    'POST',
    'https://[SUPABASE_URL]/functions/v1/invoice-followups-dispatcher',
    ARRAY[
      ('Authorization'::text, 'Bearer [SERVICE_ROLE_KEY]'::text),
      ('Content-Type'::text, 'application/json'::text)
    ]::http_header[],
    'application/json',
    '{}'::jsonb
  )::http_request);
  $$
);
```

### Schedule Summary

- **Scheduler**: Daily at 9 AM
  - Processes approaching deadlines
  - Processes overdue invoices
  - Progresses stages
  - Cleans up finalized invoices

- **Dispatcher**: Every 15 minutes
  - Finds due follow-ups (scheduled_at <= now)
  - Sends emails via Resend
  - Reschedules for next attempt or marks as sent

---

## Implementation Details

### Environment Variables

Required in Supabase Edge Functions:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access
- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_FROM_EMAIL` - From email address
- `SITE_URL` - Site URL for invoice links (optional, defaults to haliqo.com)

### Database Migrations

Run in order:
1. `invoice_followups_schema.sql` - Create tables and indexes
2. `invoice_email_templates.sql` - Insert email templates
3. `Sheduler_dispatcher.sql` - Set up cron jobs

### Frontend Integration Points

1. **Invoice Creation** (`quotesService.js`):
   ```javascript
   await InvoiceFollowUpService.triggerFollowUpCreation(invoice.id);
   ```

2. **Status Update** (`invoiceService.js`):
   ```javascript
   if (status === 'paid' || status === 'cancelled') {
     await InvoiceFollowUpService.stopFollowUpsForInvoice(invoiceId);
   }
   if (status === 'unpaid' || status === 'overdue') {
     await InvoiceFollowUpService.triggerFollowUpCreation(invoiceId);
   }
   ```

3. **UI Display** (`invoices-follow-up/index.jsx`):
   ```javascript
   const { data } = await InvoiceFollowUpService.fetchInvoiceFollowUps(userId);
   ```

### Key Differences from Quote Follow-Ups

1. **No Email Behavior Tracking**: Invoice follow-ups don't track email opens/views
2. **Due Date Based**: Follow-ups are based on due dates, not quote status
3. **Approaching Deadline**: Unique stage for reminders before due date
4. **Payment Status**: Follow-ups stop when invoice is paid (not accepted/rejected)

### Best Practices

1. **Always check invoice status** before sending follow-up
2. **Stop follow-ups immediately** when invoice is paid/cancelled
3. **Use meta JSONB** for storing flexible data (priority, type, etc.)
4. **Log all events** to `invoice_events` for tracking
5. **Handle failures gracefully** - don't fail entire operation if follow-up fails

---

## Summary

The Invoice Follow-Up System provides automated payment reminders for invoices with:
- **Approaching deadline reminders** (3 days before due date)
- **3-stage progressive follow-ups** for overdue invoices
- **Multiple attempts per stage** (3 attempts with 1 day delay)
- **Automatic cleanup** when invoices are paid/cancelled
- **Manual follow-up support** from UI
- **Comprehensive event tracking** for audit and analytics
- **✅ Language Preference Integration** - All follow-up emails use client's language preference from database

**Language Support:**
- ✅ Scheduler fetches `client.language_preference` when creating follow-ups
- ✅ Templates filtered by client language (fr, en, nl)
- ✅ Falls back to French if client language template not found
- ✅ Falls back to any active template if French not found
- ✅ Manual follow-ups also use client language preference

The system is fully integrated with frontend services and runs automatically via cron jobs, requiring minimal manual intervention.
