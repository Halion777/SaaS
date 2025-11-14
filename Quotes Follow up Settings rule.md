# Quotes Follow-Up System - Complete Documentation

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

The Quotes Follow-Up System is an automated email reminder system that sends follow-up emails to clients based on quote status and client behavior. The system uses a **3-stage progressive follow-up strategy** with intelligent priority calculation and behavior-based scheduling.

### Key Features
- **Automated follow-up creation** when quotes are sent
- **Behavior-based scheduling** (different delays for viewed vs. unviewed quotes)
- **3-stage progressive follow-ups** with configurable delays
- **Priority system** (high, medium, low) based on quote status and stage
- **Recent activity detection** to avoid sending unnecessary emails
- **Automatic cleanup** when quotes are accepted/rejected/expired
- **Manual follow-up trigger** from UI (doesn't affect automated workflow)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - Follow-Up Management Page                                │
│  - Quote Creation/Management                                │
│  - Manual Follow-Up Trigger                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Services Layer                                  │
│  - followUpService.js (Frontend API)                        │
│  - quoteTrackingService.js (Tracking & Analytics)          │
│  - emailService.js (Email Sending)                         │
│  - quotesService.js (Quote Operations)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            Supabase Edge Functions                           │
│  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │ followups-scheduler    │  │ followups-dispatcher     │  │
│  │ (Daily at 9 AM)        │  │ (Every 15 minutes)      │  │
│  └────────────────────────┘  └──────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                          │
│  - quote_follow_ups (Main follow-up records)              │
│  - quote_events (Event tracking)                            │
│  - quote_access_logs (View tracking)                       │
│  - email_templates (Email templates)                        │
│  - email_outbox (Email queue)                              │
│  - quotes (Quote data)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. `quote_follow_ups`
Main table storing all follow-up records.

```sql
CREATE TABLE public.quote_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  stage SMALLINT NOT NULL,                    -- 1, 2, or 3
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
  meta JSONB DEFAULT '{}',                    -- Stores priority, type, etc.
  template_id UUID REFERENCES email_templates(id),
  template_variables JSONB DEFAULT '{}'
);
```

**Status Values:**
- `pending` - Initial state, not yet scheduled
- `scheduled` - Scheduled for future sending
- `ready_for_dispatch` - Ready to be sent by dispatcher
- `sent` - Successfully sent
- `failed` - Failed to send
- `stopped` - Manually stopped or quote finalized
- `stage_1_completed` - Stage 1 completed, moved to stage 2
- `stage_2_completed` - Stage 2 completed, moved to stage 3
- `stage_3_completed` - Stage 3 completed
- `all_stages_completed` - All 3 stages completed

**Stage Progression:**
- **Stage 1**: Initial follow-up (1 day delay for sent, 1 day delay for viewed)
- **Stage 2**: Second follow-up (3 days delay after stage 1)
- **Stage 3**: Final follow-up (5 days delay after stage 2)

#### 2. `quote_events`
Tracks all quote-related events for analytics and recent activity detection.

```sql
CREATE TABLE public.quote_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID,                                -- NULL for client actions
  type VARCHAR(50) NOT NULL,                  -- followup_sent, manual_followup, etc.
  meta JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  share_token VARCHAR(100)
);
```

**Event Types:**
- `followup_sent` - Automated follow-up email sent
- `followup_failed` - Follow-up email failed to send
- `manual_followup` - Manual follow-up triggered from UI
- `quote_status_changed` - Quote status changed (sent → viewed)
- `followups_stopped` - All follow-ups stopped (quote finalized)

#### 3. `quote_access_logs`
Tracks when clients view quotes (used for status updates and recent activity).

```sql
CREATE TABLE public.quote_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  share_token VARCHAR(100),
  action VARCHAR(100),                        -- 'viewed', 'downloaded', etc.
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `email_templates`
Stores email templates for different follow-up scenarios.

```sql
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  template_type VARCHAR(100) NOT NULL,        -- followup_not_viewed, followup_viewed_no_action, etc.
  template_name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'fr'
);
```

**Template Types:**
- `quote_sent` - Initial quote sent email
- `followup_not_viewed` - Follow-up for unopened quotes
- `followup_viewed_no_action` - Follow-up for viewed but no action quotes
- `general_followup` - General reminder follow-up
- `client_accepted` - Quote accepted confirmation
- `client_rejected` - Quote rejected notification
- `viewed_instant` - Instant follow-up when quote is viewed (deprecated)

**Template Variables:**
- `{quote_number}` - Quote reference number
- `{client_name}` - Client full name
- `{quote_title}` - Project title
- `{quote_amount}` - Total quote amount
- `{quote_link}` - Direct link to view quote
- `{days_since_sent}` - Days since quote was sent
- `{company_name}` - Company name
- `{valid_until}` - Quote validity date

#### 5. `email_outbox`
Email queue for sending emails via dispatcher.

```sql
CREATE TABLE public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  follow_up_id UUID REFERENCES quote_follow_ups(id) ON DELETE SET NULL,
  to_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  status VARCHAR(50) DEFAULT 'pending',      -- pending, sending, sent, failed
  email_type VARCHAR(100),
  attempts INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Follow-Up Rules & Settings

### Global Rules (Hardcoded in Edge Functions)

The follow-up system uses **hardcoded rules** in the edge functions (no database table needed):

```javascript
const globalRules = {
  max_stages: 3,                    // Maximum 3 stages
  stage_1_delay: 1,                 // 1 day delay for stage 1 (both sent and viewed)
  stage_2_delay: 3,                 // 3 days delay for stage 2
  stage_3_delay: 5,                 // 5 days delay for stage 3
  max_attempts_per_stage: 3,        // 3 attempts per stage before progressing
  instant_view_followup: true,       // Enable delayed follow-up for viewed quotes
  view_followup_template: 'followup_viewed_no_action',
  sent_followup_template: 'followup_not_viewed'
};
```

### Follow-Up Creation Rules

#### 1. **Quote Sent (Status: 'sent')**
- **Trigger**: When quote status changes to 'sent'
- **Initial Follow-Up**: Created immediately with 1 day delay
- **Template**: `followup_not_viewed`
- **Stage**: 1
- **Priority**: High (if no recent activity) or Medium (if recent activity)
- **Scheduled At**: `sent_at + 1 day`

#### 2. **Quote Viewed (Status: 'viewed')**
- **Trigger**: When quote status changes from 'sent' to 'viewed'
- **Follow-Up**: Updates existing follow-up or creates new one
- **Template**: `followup_viewed_no_action`
- **Stage**: 1 (maintains current stage)
- **Priority**: Medium (if no recent activity) or Low (if recent activity)
- **Scheduled At**: `now + 1 day` (1 day delay from view time)
- **Note**: Updates existing follow-up instead of creating duplicate

#### 3. **Recent Activity Check**
The system checks for recent activity within the last 24 hours:
- Recent views in `quote_access_logs`
- Recent follow-up updates in `quote_follow_ups`
- Recent events in `quote_events`

If recent activity is detected, priority is adjusted downward.

### Stage Progression Rules

1. **Stage 1 → Stage 2**
   - **Condition**: `attempts >= max_attempts` (3 attempts)
   - **Delay**: 3 days after stage 1 completion
   - **Priority**: Automatically set to 'high' (stages 2+ are always high priority)

2. **Stage 2 → Stage 3**
   - **Condition**: `attempts >= max_attempts` (3 attempts)
   - **Delay**: 5 days after stage 2 completion
   - **Priority**: 'high'

3. **Stage 3 → Completed**
   - **Condition**: `attempts >= max_attempts` (3 attempts)
   - **Status**: `all_stages_completed`
   - **Action**: No more follow-ups for this quote

### Stop Conditions

Follow-ups are automatically stopped when:
- Quote status is `accepted`
- Quote status is `rejected`
- Quote status is `expired`
- Quote `valid_until` date has passed
- Next scheduled date would be after quote expiration

---

## Edge Functions

### 1. `followups-scheduler` (Daily at 9 AM)

**Location**: `supabase/functions/followups-scheduler/index.ts`

**Cron Schedule**: `0 9 * * *` (Daily at 9 AM)

**Responsibilities**:
1. Create initial follow-ups for newly sent quotes
2. Process quote status updates (sent → viewed)
3. Progress follow-up stages (when max attempts reached)
4. Clean up accepted/rejected/expired quotes
5. Mark follow-ups as ready for dispatch

**Key Functions**:

#### `createInitialFollowUpForSentQuote(admin, quote, rules)`
- Creates initial follow-up when quote is sent
- Uses `followup_not_viewed` template
- Schedules for 1 day after `sent_at`
- Sets priority to 'high'

#### `createDelayedViewFollowUp(admin, quote)`
- Creates/updates follow-up when quote is viewed
- Uses `followup_viewed_no_action` template
- **Updates existing follow-up** instead of creating duplicate
- Schedules for 1 day after view time
- Adjusts priority based on recent activity

#### `createIntelligentFollowUp(admin, quote, rules)`
- Creates follow-ups based on quote status and behavior
- Checks for recent activity
- Determines appropriate template and priority
- Only creates if no existing follow-up exists

#### `progressFollowUpStages(admin, rules)`
- Progresses follow-ups to next stage when max attempts reached
- Calculates delays for next stage (3 days for stage 2, 5 days for stage 3)
- Checks if next stage would exceed quote expiration
- Updates status to `stage_X_completed`

#### `processScheduledFollowUps(admin)`
- Marks scheduled follow-ups as `ready_for_dispatch`
- Queues emails in `email_outbox`
- Only processes follow-ups where `scheduled_at <= now`

**Frontend Actions Supported**:
- `create_followup_for_quote` - Create follow-up for specific quote
- `sync_quote_status` - Sync quote status with backend
- `mark_quote_viewed` - Mark quote as viewed and create delayed follow-up
- `cleanup_finalized_quote` - Stop all follow-ups for finalized quote

### 2. `followups-dispatcher` (Every 15 minutes)

**Location**: `supabase/functions/followups-dispatcher/index.ts`

**Cron Schedule**: `*/15 * * * *` (Every 15 minutes)

**Responsibilities**:
1. Find due follow-ups (status: `ready_for_dispatch`, `scheduled`, or `pending`)
2. Send emails via Resend API
3. Update follow-up status to `sent` or `failed`
4. Increment attempt counter
5. Log events to `quote_events`

**Key Functions**:

#### `processFollowUp(admin, followUp)`
- Gets quote and client details
- Validates quote is still valid (not accepted/rejected/expired)
- Replaces template variables
- Sends email via Resend
- Updates follow-up status and attempts
- Logs event to `quote_events`

#### `stopFollowUpsForQuote(admin, quoteId)`
- Stops all pending/scheduled follow-ups for a quote
- Used when quote is finalized

**Template Variable Replacement**:
- `{quote_number}` → Quote number
- `{client_name}` → Client name
- `{quote_title}` → Project title
- `{days_since_sent}` → Calculated days since sent
- `{quote_link}` → `https://www.haliqo.com/quote-share/{share_token}`
- `{company_name}` → Company name (hardcoded as 'Haliqo')

**Environment Variables Required**:
- `RESEND_API_KEY` - Resend API key for sending emails
- `RESEND_FROM_EMAIL` - From email address
- `SITE_URL` - Site URL for quote links (defaults to 'https://www.haliqo.com')

---

## Frontend Services

### 1. `followUpService.js`

**Location**: `src/services/followUpService.js`

**Key Functions**:

#### `listScheduledFollowUps({ status, limit })`
- Fetches follow-ups from database
- Filters by status if provided
- Returns transformed data for UI

#### `createFollowUpForQuote(quoteId, stage, userId)`
- Creates manual follow-up record
- Ensures quote has share token
- Prevents duplicates (checks for existing pending/scheduled)

#### `stopFollowUpsForQuote(quoteId)`
- Stops all pending/scheduled follow-ups for a quote
- Used when quote is accepted/rejected

#### `logQuoteEvent({ quote_id, user_id, type, meta, share_token })`
- Logs events to `quote_events` table
- Ensures quote has share token
- Used for tracking and analytics

#### `triggerFollowUpScheduling()`
- Manually triggers `followups-scheduler` edge function
- Used for immediate follow-up creation

#### `triggerFollowUpDispatching()`
- Manually triggers `followups-dispatcher` edge function
- Used for immediate email sending

### 2. `quoteTrackingService.js`

**Location**: `src/services/quoteTrackingService.js`

**Key Functions**:

#### `getQuoteTrackingData(quoteId)`
- Gets quote status, access logs, events, and follow-ups
- Analyzes tracking data for relance decisions
- Returns relance status and recommendations

#### `analyzeTrackingData(quote, accessLogs, events)`
- Determines relance status (not_viewed, viewed_no_action, expired, etc.)
- Calculates if relance is allowed
- Suggests next relance date
- Checks for client actions (accepted/rejected)

#### `logRelanceAction(quoteId, relanceType, relanceMethod, notes)`
- Logs manual relance actions to `quote_events`
- Used when user clicks "Relance" button in UI
- **Important**: Manual relances do NOT affect automated workflow stages

### 3. `quotesService.js`

**Location**: `src/services/quotesService.js`

**Key Functions**:

#### `triggerFollowUpCreation(quoteId, quoteStatus)`
- Called when quote is created/sent
- Stops existing follow-ups if any
- Calls `followups-scheduler` edge function with action `create_followup_for_quote`
- Ensures only one follow-up exists per quote

---

## Email Templates

### Template Types

1. **`followup_not_viewed`**
   - Used for quotes with status 'sent' (client hasn't opened)
   - Subject: "Devis {quote_number} - Avez-vous reçu notre proposition ?"
   - Sent 1 day after quote is sent

2. **`followup_viewed_no_action`**
   - Used for quotes with status 'viewed' (client viewed but no action)
   - Subject: "Devis {quote_number} - Des questions sur notre proposition ?"
   - Sent 1 day after quote is viewed

3. **`general_followup`**
   - Used for general reminders (stages 2 and 3)
   - Subject: "Devis {quote_number} - Rappel"
   - Sent at stage 2 (3 days delay) and stage 3 (5 days delay)

4. **`quote_sent`**
   - Initial quote sent email (not a follow-up)
   - Sent immediately when quote is sent

### Template Variable Replacement

Templates support the following variables:
- `{quote_number}` - Quote reference number
- `{client_name}` - Client full name
- `{quote_title}` - Project title
- `{quote_amount}` - Total quote amount
- `{quote_link}` - Direct link to view quote
- `{days_since_sent}` - Days since quote was sent
- `{company_name}` - Company name
- `{valid_until}` - Quote validity date

**Replacement happens in**:
- `followups-scheduler` when creating follow-up records
- `followups-dispatcher` when sending emails

---

## Workflow & Stages

### Complete Follow-Up Lifecycle

```
Quote Sent
    │
    ▼
[Stage 1 - Initial Follow-Up]
    │
    ├─ Status: 'sent' → Template: 'followup_not_viewed'
    │  └─ Scheduled: sent_at + 1 day
    │  └─ Priority: High (no recent activity) or Medium (recent activity)
    │
    └─ Status: 'viewed' → Template: 'followup_viewed_no_action'
       └─ Scheduled: now + 1 day
       └─ Priority: Medium (no recent activity) or Low (recent activity)
    │
    ▼
[Dispatcher Sends Email]
    │
    ├─ Success → Status: 'sent', attempts++
    └─ Failure → Status: 'failed', attempts++
    │
    ▼
[Check Attempts]
    │
    ├─ attempts < max_attempts (3) → Wait for next scheduled time
    └─ attempts >= max_attempts (3) → Progress to next stage
    │
    ▼
[Stage 2 - Second Follow-Up]
    │
    ├─ Template: 'general_followup'
    ├─ Scheduled: stage_1_completed + 3 days
    ├─ Priority: High (always)
    └─ Max Attempts: 3
    │
    ▼
[Dispatcher Sends Email]
    │
    ├─ Success → Status: 'sent', attempts++
    └─ Failure → Status: 'failed', attempts++
    │
    ▼
[Check Attempts]
    │
    ├─ attempts < max_attempts (3) → Wait for next scheduled time
    └─ attempts >= max_attempts (3) → Progress to next stage
    │
    ▼
[Stage 3 - Final Follow-Up]
    │
    ├─ Template: 'general_followup'
    ├─ Scheduled: stage_2_completed + 5 days
    ├─ Priority: High (always)
    └─ Max Attempts: 3
    │
    ▼
[Dispatcher Sends Email]
    │
    ├─ Success → Status: 'sent', attempts++
    └─ Failure → Status: 'failed', attempts++
    │
    ▼
[Check Attempts]
    │
    ├─ attempts < max_attempts (3) → Wait for next scheduled time
    └─ attempts >= max_attempts (3) → All stages completed
    │
    ▼
[Status: 'all_stages_completed']
    └─ No more follow-ups for this quote
```

### Stage Progression Timing

| Stage | Delay After Previous | Total Days from Quote Sent |
|-------|---------------------|---------------------------|
| Stage 1 | 1 day | 1 day |
| Stage 2 | 3 days | 4 days (1 + 3) |
| Stage 3 | 5 days | 9 days (1 + 3 + 5) |

**Note**: Delays are calculated from stage completion, not from quote sent date.

---

## Priority System

### Priority Calculation

Priority is calculated in `calculatePriority(status, currentStage, hasRecentActivity)`:

```javascript
const calculatePriority = (status, currentStage, hasRecent) => {
  // Higher stages always get high priority
  if (currentStage > 1) return 'high';
  
  // For Stage 1, maintain status distinction
  if (status === 'sent') {
    return hasRecent ? 'medium' : 'high';
  }
  if (status === 'viewed') {
    return hasRecent ? 'low' : 'medium';
  }
  
  return 'medium'; // default
};
```

### Priority Rules

1. **Stage 2+**: Always 'high' priority
2. **Stage 1 - Sent Quotes**:
   - No recent activity → 'high'
   - Recent activity → 'medium'
3. **Stage 1 - Viewed Quotes**:
   - No recent activity → 'medium'
   - Recent activity → 'low'

### Recent Activity Detection

Recent activity is checked within the last 24 hours:
- Recent views in `quote_access_logs` (action = 'viewed')
- Recent follow-up updates in `quote_follow_ups`
- Recent events in `quote_events`

---

## Cron Jobs & Scheduling

### Cron Job Setup

**File**: `Sheduler_dispatcher.sql`

```sql
-- Scheduler: Daily at 9 AM
SELECT cron.schedule(
  'followups-scheduler-daily',
  '0 9 * * *',
  $$SELECT content::text FROM http(...)$$
);

-- Dispatcher: Every 15 minutes
SELECT cron.schedule(
  'followups-dispatcher-frequent',
  '*/15 * * * *',
  $$SELECT content::text FROM http(...)$$
);
```

### Execution Flow

1. **Daily at 9 AM**: `followups-scheduler` runs
   - Creates new follow-ups for sent quotes
   - Updates follow-ups for viewed quotes
   - Progresses stages when max attempts reached
   - Marks follow-ups as ready for dispatch

2. **Every 15 minutes**: `followups-dispatcher` runs
   - Finds due follow-ups (scheduled_at <= now)
   - Sends emails via Resend
   - Updates status and attempts
   - Logs events

### Manual Triggers

Both edge functions can be triggered manually from frontend:
- `triggerFollowUpScheduling()` - Immediate scheduler run
- `triggerFollowUpDispatching()` - Immediate dispatcher run

---

## Implementation Details

### Follow-Up Creation Flow

```
1. Quote Created/Sent
   │
   ├─ quotesService.createQuote() or updateQuote()
   │
   └─ triggerFollowUpCreation(quoteId, 'sent')
      │
      ├─ Stops existing follow-ups (if any)
      │
      └─ Calls followups-scheduler edge function
         │
         └─ Action: 'create_followup_for_quote'
            │
            └─ createInitialFollowUpForSentQuote()
               │
               ├─ Gets client details
               ├─ Gets email template (followup_not_viewed)
               ├─ Replaces template variables
               ├─ Calculates scheduled_at (sent_at + 1 day)
               └─ Inserts into quote_follow_ups
                  │
                  └─ Status: 'scheduled'
                     └─ Stage: 1
                        └─ Priority: 'high'
```

### Follow-Up Sending Flow

```
1. Dispatcher Runs (Every 15 minutes)
   │
   ├─ Finds due follow-ups
   │  └─ Status: 'ready_for_dispatch', 'scheduled', or 'pending'
   │  └─ scheduled_at <= now
   │
   └─ For each follow-up:
      │
      ├─ Validates quote (not accepted/rejected/expired)
      │
      ├─ Gets quote and client details
      │
      ├─ Replaces template variables
      │  └─ {quote_number}, {client_name}, {quote_title}, etc.
      │
      ├─ Sends email via Resend API
      │
      ├─ Updates follow-up:
      │  ├─ Status: 'sent'
      │  ├─ Attempts: attempts + 1
      │  └─ updated_at: now
      │
      └─ Logs event to quote_events
         └─ Type: 'followup_sent'
```

### Stage Progression Flow

```
1. Scheduler Runs (Daily at 9 AM)
   │
   ├─ progressFollowUpStages()
   │
   └─ For each follow-up with status 'scheduled':
      │
      ├─ Checks if scheduled_at <= now
      │
      ├─ Checks if attempts >= max_attempts (3)
      │
      └─ If yes:
         │
         ├─ Calculates next stage
         │  └─ Stage 2: +3 days delay
         │  └─ Stage 3: +5 days delay
         │
         ├─ Checks if next stage would exceed quote expiration
         │
         ├─ If valid:
         │  ├─ Updates follow-up:
         │  │  ├─ Stage: nextStage
         │  │  ├─ Status: 'stage_X_completed'
         │  │  ├─ Attempts: 0 (reset)
         │  │  ├─ Scheduled_at: now + delay
         │  │  └─ Priority: 'high'
         │  │
         │  └─ Updates template (general_followup for stages 2+)
         │
         └─ If max stages reached:
            └─ Status: 'all_stages_completed'
```

### Manual Follow-Up Flow

```
1. User Clicks "Relance" Button
   │
   ├─ handleFollowUp(followUpId)
   │
   ├─ Gets quote and client details
   │
   ├─ Sends email via EmailService.sendFollowUpEmail()
   │  └─ Template: 'general_followup'
   │
   ├─ Logs event to quote_events
   │  └─ Type: 'manual_followup'
   │  └─ Meta: { stage: currentStage, manual: true }
   │
   └─ Logs relance action to quote_events
      └─ Type: 'manual_followup_sent'
      └─ Note: Does NOT affect automated workflow stages
```

---

## Important Notes for Developers

### 1. **Follow-Up Deduplication**
- Always check for existing follow-ups before creating new ones
- Use `maybeSingle()` when checking for existing follow-ups
- Update existing follow-ups instead of creating duplicates

### 2. **Status Management**
- Follow-up status must be 'scheduled' or 'ready_for_dispatch' for dispatcher to send
- After sending, status changes to 'sent'
- For multiple attempts per stage, reschedule after each attempt

### 3. **Recent Activity Detection**
- Check last 24 hours in:
  - `quote_access_logs` (action = 'viewed')
  - `quote_follow_ups` (updated_at or created_at)
  - `quote_events` (timestamp)

### 4. **Template Variable Replacement**
- Replace variables in both scheduler (when creating) and dispatcher (when sending)
- Always use `SITE_URL` environment variable for quote links
- Calculate `days_since_sent` dynamically in dispatcher

### 5. **Priority Calculation**
- Stages 2+ are always 'high' priority
- Stage 1 priority depends on quote status and recent activity
- Priority stored in `meta.priority` field

### 6. **Stage Progression**
- Only happens in scheduler (daily at 9 AM)
- Requires `attempts >= max_attempts` (3)
- Calculates delays: Stage 2 = +3 days, Stage 3 = +5 days
- Checks quote expiration before progressing

### 7. **Manual Follow-Ups**
- Do NOT affect automated workflow stages
- Do NOT create new follow-up records
- Only send email and log event
- Use `general_followup` template

### 8. **Cleanup**
- Automatically stop follow-ups when quote is accepted/rejected/expired
- Check `valid_until` date before scheduling
- Stop all pending/scheduled follow-ups when quote is finalized

---

## Testing Checklist

### Follow-Up Creation
- [ ] Follow-up created when quote is sent
- [ ] Follow-up scheduled for correct date (sent_at + 1 day)
- [ ] No duplicate follow-ups created
- [ ] Follow-up updated (not duplicated) when quote is viewed

### Email Sending
- [ ] Email sent when scheduled_at <= now
- [ ] Template variables replaced correctly
- [ ] Quote link constructed correctly
- [ ] Status updated to 'sent' after sending
- [ ] Attempts incremented after sending

### Stage Progression
- [ ] Stage progresses when attempts >= max_attempts
- [ ] Delay calculated correctly (3 days for stage 2, 5 days for stage 3)
- [ ] Template updated for stages 2+ (general_followup)
- [ ] Priority set to 'high' for stages 2+
- [ ] All stages completed when stage 3 max attempts reached

### Cleanup
- [ ] Follow-ups stopped when quote is accepted
- [ ] Follow-ups stopped when quote is rejected
- [ ] Follow-ups stopped when quote is expired
- [ ] Follow-ups stopped when valid_until date passed

### Priority System
- [ ] Priority calculated correctly based on status and stage
- [ ] Recent activity affects priority correctly
- [ ] Stages 2+ always have 'high' priority

### Manual Follow-Ups
- [ ] Manual follow-up sends email
- [ ] Manual follow-up doesn't affect automated stages
- [ ] Manual follow-up logs event correctly

---

## Environment Variables

### Required for Edge Functions

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Service (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Site URL (for quote links)
SITE_URL=https://www.haliqo.com
```

### Required for Frontend

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Database Indexes

### Recommended Indexes

```sql
-- quote_follow_ups
CREATE INDEX idx_quote_follow_ups_quote_id ON quote_follow_ups(quote_id);
CREATE INDEX idx_quote_follow_ups_user_id ON quote_follow_ups(user_id);
CREATE INDEX idx_quote_follow_ups_scheduled_at ON quote_follow_ups(scheduled_at);
CREATE INDEX idx_quote_follow_ups_status ON quote_follow_ups(status);
CREATE INDEX idx_quote_follow_ups_stage ON quote_follow_ups(stage);

-- quote_events
CREATE INDEX idx_quote_events_quote_id ON quote_events(quote_id);
CREATE INDEX idx_quote_events_timestamp ON quote_events(timestamp);
CREATE INDEX idx_quote_events_type ON quote_events(type);

-- quote_access_logs
CREATE INDEX idx_quote_access_logs_quote_id ON quote_access_logs(quote_id);
CREATE INDEX idx_quote_access_logs_accessed_at ON quote_access_logs(accessed_at);
CREATE INDEX idx_quote_access_logs_action ON quote_access_logs(action);
```

---

## Conclusion

The Quotes Follow-Up System is a comprehensive automated email reminder system with intelligent behavior-based scheduling. The system uses a 3-stage progressive approach with configurable delays and priority-based sending.

**Key Strengths**:
- Automated follow-up creation and sending
- Behavior-based scheduling (different for viewed vs. unviewed)
- Recent activity detection to avoid spam
- Automatic cleanup for finalized quotes
- Manual follow-up support without affecting automation

---

## Quick Reference Summary

### Key Settings
- **Max Stages**: 3
- **Stage 1 Delay**: 1 day (for both sent and viewed quotes)
- **Stage 2 Delay**: 3 days after stage 1 completion
- **Stage 3 Delay**: 5 days after stage 2 completion
- **Max Attempts Per Stage**: 3
- **Scheduler Frequency**: Daily at 9 AM
- **Dispatcher Frequency**: Every 15 minutes

### Follow-Up Status Flow
```
pending → scheduled → ready_for_dispatch → sent → (reschedule or progress stage)
                                                      ↓
                                              stage_X_completed → (next stage)
                                                      ↓
                                              all_stages_completed
```

### Priority Rules
- **Stage 1 - Sent**: High (no recent activity) or Medium (recent activity)
- **Stage 1 - Viewed**: Medium (no recent activity) or Low (recent activity)
- **Stage 2+**: Always High

### Template Usage
- **Stage 1 - Sent**: `followup_not_viewed`
- **Stage 1 - Viewed**: `followup_viewed_no_action`
- **Stage 2+**: `general_followup`

---

**Document Version**: 1.1  
**Last Updated**: 2025-01-26  
**Author**: AI Assistant  
**Status**: Complete

