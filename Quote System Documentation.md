# Quote System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Quote Statuses](#quote-statuses)
3. [Draft System](#draft-system)
4. [Quote Creation Process](#quote-creation-process)
5. [Quote Management](#quote-management)
6. [Quote Actions](#quote-actions)
7. [Quote Follow-Up System](#quote-follow-up-system)
8. [Database Tables](#database-tables)
9. [Key Services and Functions](#key-services-and-functions)

---

## Overview

The quote system is a comprehensive solution for creating, managing, and following up on quotes. It includes:
- **Auto-saved drafts** for work-in-progress quotes
- **Quote creation** with a 4-step wizard
- **Quote management** for viewing and organizing quotes
- **Automated follow-ups** based on quote status and client behavior
- **Status tracking** throughout the quote lifecycle

---

## Quote Statuses

### Status Definitions

| Status | Description | When It Occurs |
|--------|-------------|----------------|
| `draft` | Quote is saved but not sent to client | User clicks "Save Draft" button |
| `sent` | Quote has been sent to the client | User sends quote via email |
| `viewed` | Client has opened the quote link | Client accesses the public quote share page |
| `accepted` | Client has accepted the quote | Client clicks "Accept" and signs |
| `rejected` | Client has rejected the quote | Client clicks "Reject" with optional reason |
| `expired` | Quote has passed its `valid_until` date | System automatically expires quotes |

### Status Transitions

```
[New Quote Creation]
    │
    ▼
[draft] ←─── User clicks "Save Draft"
    │
    │
    ▼
[sent] ←─── User sends quote via email
    │
    │
    ├─── Client opens link ───► [viewed]
    │
    │
    ├─── Client accepts ───► [accepted]
    │
    │
    ├─── Client rejects ───► [rejected]
    │
    │
    └─── valid_until date passes ───► [expired]
```

### Status Rules

1. **Draft Status**
   - Can be edited freely
   - Not visible to clients
   - Can be deleted
   - Auto-saved drafts are separate from saved drafts

2. **Sent Status**
   - Triggers follow-up system
   - Creates public share link
   - Can be converted to invoice
   - Cannot be edited (must create new version)

3. **Viewed Status**
   - Automatically set when client opens quote
   - Triggers different follow-up template
   - Tracks client engagement

4. **Accepted/Rejected Status**
   - Final states (cannot be changed)
   - Stops all follow-ups
   - Accepted quotes can be converted to invoices

5. **Expired Status**
   - Automatically set by system
   - Stops all follow-ups
   - Cannot be sent again

---

## Draft System

### Types of Drafts

#### 1. Auto-Saved Drafts (`quote_drafts` table)
- **Purpose**: Automatically save work-in-progress quotes
- **When Created**: 
  - Every 30 seconds during quote creation
  - On every step navigation (next/previous)
  - When clicking step indicators
  - When data changes (debounced 5 seconds)
- **Storage**: Both `localStorage` and `quote_drafts` database table
- **Lifecycle**:
  - Created when user starts creating a quote
  - Updated on every change/navigation
  - Deleted when:
    - Quote is saved as draft (moves to `quotes` table)
    - Quote is sent (moves to `quotes` table with `sent` status)
    - Quote expires (valid_until date passes)
    - Quote reaches final status (sent, accepted, rejected, expired)

#### 2. Saved Drafts (`quotes` table with `status='draft'`)
- **Purpose**: User explicitly saved quotes
- **When Created**: User clicks "Save Draft" button in preview step
- **Storage**: `quotes` database table
- **Lifecycle**:
  - Can be edited (updates existing quote)
  - Can be sent (status changes to `sent`)
  - Can be deleted
  - Visible in quote management page

### Draft Storage Strategy

#### localStorage Keys
1. **Quote Number-Based Keys** (when quote number exists):
   - `quote-draft-${quoteNumber}`: Draft data
   - `quote-draft-rowid-${quoteNumber}`: Backend draft row ID

2. **User-Based Fallback Keys** (when quote number doesn't exist yet):
   - `quote-draft-${userId}-${profileId}`: Draft data
   - `quote-draft-rowid-${userId}-${profileId}`: Backend draft row ID

#### Database Table: `quote_drafts`
```sql
CREATE TABLE quote_drafts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID,
  quote_number VARCHAR(50),  -- Links to quote if exists
  draft_data JSONB NOT NULL,  -- Complete quote data
  last_saved TIMESTAMP,
  valid_until DATE,           -- Used for cleanup
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Draft Auto-Save Logic

#### When Editing Existing Quotes
- **If editing a saved quote** (`isEditing && editingQuoteId`):
  - Auto-save **updates the quote directly** in `quotes` table
  - **Does NOT** create/update `quote_drafts` entry
  - Preserves quote number and status

- **If editing an auto-saved draft**:
  - Auto-save **updates the draft** in `quote_drafts` table
  - Uses existing draft row ID from localStorage
  - Preserves quote number if it exists

#### When Creating New Quotes
- Auto-save **creates/updates** entry in `quote_drafts` table
- Generates quote number when reaching step 4 (preview)
- Stores draft row ID in localStorage for future updates

### Draft Cleanup Rules

Auto-saved drafts are automatically deleted when:
1. **Quote reaches final status**: sent, accepted, rejected, expired
2. **Quote expires**: `valid_until` date has passed
3. **Quote is saved**: When user clicks "Save Draft" or "Send"
4. **Quote is converted**: When draft becomes a saved quote

### Draft Display in Quote Management

- **Auto-saved drafts** appear in quotes management with:
  - Status: "Auto-Saved Draft"
  - Quote number (if generated)
  - Last saved timestamp
  - Can be resumed for editing

- **Saved drafts** appear with:
  - Status: "Draft"
  - Quote number
  - Created/updated timestamp
  - Can be edited or sent

---

## Quote Creation Process

### 4-Step Wizard

#### Step 1: Client Selection & Project Info
- **Client Selection**: Choose existing client or create new
- **Project Categories**: Select one or more categories
- **Custom Category**: If "autre" is selected
- **Deadline**: Project deadline date
- **Description**: Project description (supports voice input, AI enhancement)

**Auto-Save Triggers**:
- Every 30 seconds
- On step navigation
- On data changes (debounced)

#### Step 2: Task Definition
- **Tasks**: Add tasks with:
  - Description
  - Quantity and unit
  - Price
  - Duration
  - Materials (optional)
- **AI Suggestions**: Based on project categories and description

**Auto-Save Triggers**:
- Every 30 seconds
- On step navigation
- On task/material changes

#### Step 3: File Upload
- **Files**: Upload attachments (photos, PDFs, etc.)
- **Storage**: Files stored in Supabase Storage
- **Temporary Files**: Stored in `temp/` folder until quote is created

**Auto-Save Triggers**:
- Every 30 seconds
- On step navigation
- On file upload completion

**Navigation Restriction**: Cannot proceed to next step while files are uploading

#### Step 4: Preview & Configuration
- **Quote Preview**: Full quote preview with all details
- **Company Info**: Configure company details, logo, signature
- **Financial Config**: VAT, advance payment, marketing banner
- **Actions**:
  - Save Draft: Creates quote with `status='draft'`
  - Send: Creates quote with `status='sent'` and sends email

**Quote Number Generation**:
- Generated automatically when reaching step 4
- Format: `DEV-YYYY-XXXXXX` (6 digits)
- Checks both `quotes` and `quote_drafts` tables for uniqueness
- Only generated for new quotes (not when editing)

### Navigation Methods

All navigation methods trigger auto-save:

1. **Upper Navigation** (`StepIndicator` component):
   - Click step numbers to jump to any step
   - Validates before allowing navigation
   - Saves to backend draft table

2. **Bottom Navigation Buttons**:
   - "Next" button: `handleNext()`
   - "Previous" button: `handlePrevious()`
   - Both save to backend draft table

3. **Step Change Handler**:
   - `handleStepChange(newStep)`: Used by step indicators
   - Validates step requirements
   - Saves to backend draft table

### Quote Number Generation

**Function**: `generate_quote_number(user_id)` (PostgreSQL function)

**Logic**:
1. Gets current year
2. Finds max sequence number from:
   - `quotes` table (for this user and year)
   - `quote_drafts` table (for this user and year)
3. Uses the greater of the two + 1
4. Formats as: `DEV-YYYY-XXXXXX`

**When Generated**:
- Only for **new quotes** (not when editing)
- When reaching step 4 (preview)
- If quote number doesn't already exist
- If not editing an existing quote

**Uniqueness**:
- Per user (not global)
- Constraint: `UNIQUE (user_id, quote_number)`
- Prevents overwriting existing drafts

---

## Quote Management

### Quote Management Page

**Location**: `/quotes-management`

**Features**:
- View all quotes (saved drafts, sent, viewed, accepted, rejected, expired)
- View auto-saved drafts
- Filter by status, client, date range, amount
- Search by quote number, client name, description
- Bulk actions (delete, export)
- Statistics dashboard

### Quote Display

#### Saved Quotes
- Displayed from `quotes` table
- Shows: quote number, client, amount, status, dates
- Can be edited, deleted, converted to invoice

#### Auto-Saved Drafts
- Displayed from `quote_drafts` table
- Filtered to exclude:
  - Drafts for quotes with final status
  - Expired drafts (valid_until passed)
- Shows: quote number (if exists), client, amount, "Auto-Saved Draft" status
- Can be resumed for editing

### Draft Filtering Logic

```javascript
// Exclude drafts that:
1. Are associated with quotes that have final status (sent, accepted, rejected, expired)
2. Have passed their valid_until date

// Only display drafts that:
- Are not expired
- Are not associated with final-state quotes
```

### Statistics Calculation

Stats exclude auto-saved drafts (only count actual quotes):
- Total quotes
- Drafts (saved drafts only)
- Sent quotes
- Viewed quotes
- Accepted quotes
- Rejected quotes
- Expired quotes
- Average amount

---

## Quote Actions

### Available Actions

#### 1. Create New Quote
- **Path**: `/quote-creation`
- **Result**: Starts 4-step wizard
- **Auto-Save**: Enabled from step 1

#### 2. Edit Quote
- **Path**: `/quote-creation?quoteId={id}`
- **For Saved Quotes**:
  - Loads quote data
  - Sets `isEditing=true`, `editingQuoteId={id}`
  - Auto-save updates quote directly (not draft table)
  - Preserves quote number

- **For Auto-Saved Drafts**:
  - Loads draft data
  - Sets `isEditing=false`, `editingQuoteId=null`
  - Auto-save updates draft table
  - Preserves quote number if exists

#### 3. Save Draft
- **Action**: Click "Save Draft" button in step 4
- **Result**:
  - Creates quote in `quotes` table with `status='draft'`
  - Deletes auto-saved draft from `quote_drafts` table
  - Clears localStorage draft data
  - Navigates to quotes management

#### 4. Send Quote
- **Action**: Click "Send" button in step 4
- **Result**:
  - Creates quote in `quotes` table with `status='sent'`
  - Sets `sent_at` timestamp
  - Generates public share link
  - Sends email to client
  - Triggers follow-up system
  - Deletes auto-saved draft
  - Clears localStorage draft data
  - Navigates to quotes management

#### 5. Delete Quote
- **Action**: Delete button in quotes management
- **Result**:
  - Deletes quote from `quotes` table
  - Cascades to related tables (tasks, materials, files, etc.)
  - Stops all follow-ups
  - Deletes associated auto-saved drafts

#### 6. Convert to Invoice
- **Action**: Convert button (for accepted quotes)
- **Result**:
  - Creates invoice from quote data
  - Links invoice to quote
  - Triggers invoice follow-up system

#### 7. Resume Draft
- **Action**: Click on auto-saved draft in quotes management
- **Result**:
  - Loads draft data into quote creation form
  - Restores all steps, data, files
  - Continues from last saved step
  - Preserves quote number

### Action Flow Diagrams

#### Save Draft Flow
```
User clicks "Save Draft"
    │
    ▼
Validate all data
    │
    ▼
Generate/use quote number
    │
    ▼
Create quote in quotes table (status='draft')
    │
    ▼
Delete auto-saved draft from quote_drafts
    │
    ▼
Clear localStorage
    │
    ▼
Navigate to quotes management
```

#### Send Quote Flow
```
User clicks "Send"
    │
    ▼
Open Quote Send Modal
    │
    ▼
User enters email, optional message
    │
    ▼
Generate/use quote number
    │
    ▼
Create quote in quotes table (status='sent')
    │
    ▼
Generate public share link
    │
    ▼
Send email to client
    │
    ▼
Trigger follow-up system
    │
    ▼
Delete auto-saved draft
    │
    ▼
Clear localStorage
    │
    ▼
Navigate to quotes management
```

---

## Quote Follow-Up System

### Overview

The follow-up system automatically sends reminder emails to clients based on:
- Quote status (sent, viewed)
- Client behavior (email not opened, viewed but no action)
- Time delays between stages

### Plan Restrictions

**Pro Plan Users**:
- Automatic follow-up creation and email sending enabled
- All 3 stages progress automatically

**Starter Plan Users**:
- Follow-up records can be created but automatic email sending is disabled
- Emails must be sent manually from the UI
- Manual follow-up actions are allowed for all plans

### Connection to Quote Lifecycle

#### When Quote is Sent
1. **Quote Status**: Changes to `sent`
2. **Follow-Up Trigger**: `followups-scheduler` edge function called
3. **Initial Follow-Up Created**:
   - Stage: 1
   - Type: `email_not_opened`
   - Scheduled: `sent_at + 1 day`
   - Priority: High (if no recent activity) or Medium (if recent activity)

#### When Quote is Viewed
1. **Quote Status**: Changes to `viewed`
2. **Follow-Up Trigger**: `followups-scheduler` edge function called
3. **Initial Follow-Up Created**:
   - Stage: 1
   - Type: `viewed_no_action`
   - Scheduled: `now + 1 day`
   - Priority: Medium (if no recent activity) or Low (if recent activity)

#### When Quote is Accepted/Rejected
1. **Quote Status**: Changes to `accepted` or `rejected`
2. **Follow-Up Action**: All follow-ups stopped
3. **Status Update**: All pending follow-ups set to `stopped`

#### When Expired Quote is Re-Sent
1. **Quote Status**: Changes from `expired` to `sent`
2. **Follow-Up Action**: 
   - Only follow-ups with `stopped_reason: 'quote_expired'` are replaced
   - Other stopped follow-ups (from accepted/rejected) remain unchanged
   - Active follow-ups are stopped before creating new ones
3. **New Follow-Up Created**: Fresh follow-up with `status: 'scheduled'` is created

### Follow-Up Stages

#### Stage 1: Initial Follow-Up
- **For Sent Quotes**:
  - Template: `followup_not_viewed`
  - Delay: 1 day after `sent_at`
  - Max Attempts: 3
  - Reschedule: 1 day between attempts

- **For Viewed Quotes**:
  - Template: `followup_viewed_no_action`
  - Delay: 1 day after viewed
  - Max Attempts: 3
  - Reschedule: 1 day between attempts

#### Stage 2: Second Follow-Up
- **Template**: `general_followup`
- **Delay**: 3 days after Stage 1 completes
- **Max Attempts**: 3
- **Priority**: Always High
- **Reschedule**: 1 day between attempts

#### Stage 3: Final Follow-Up
- **Template**: `general_followup`
- **Delay**: 5 days after Stage 2 completes
- **Max Attempts**: 3
- **Priority**: Always High
- **Reschedule**: 1 day between attempts

### Follow-Up Status Flow

```
[pending] → [scheduled] → [ready_for_dispatch] → [sent] → [stage_X_completed]
                                                      │
                                                      └──→ [failed] → (retry)
```

### Priority Calculation

**High Priority**:
- Stage 2 or Stage 3 follow-ups
- No recent activity (no views, no actions in last 7 days)
- Sent quotes with no recent activity

**Medium Priority**:
- Stage 1 follow-ups with recent activity
- Viewed quotes with no recent activity

**Low Priority**:
- Stage 1 follow-ups with recent activity
- Viewed quotes with recent activity

### Recent Activity Detection

**Checks**:
- Last quote view (from `quote_events`)
- Last client action (accept/reject)
- Last follow-up sent
- Manual follow-up actions

**Time Window**: 7 days

### Manual Follow-Up Actions

Users can trigger manual follow-ups from:
- Quote management page
- Follow-up management page

**Result**:
- Creates follow-up with `automated=false`
- Logs to `quote_events` as `relance_manual`
- Sends immediately (no scheduling)

### Follow-Up Cleanup

Follow-ups are automatically stopped when:
- Quote is accepted
- Quote is rejected
- Quote is expired
- Quote is deleted

### Re-Sending Expired Quotes

When an expired quote is edited and re-sent:
- **Selective Replacement**: Only follow-ups stopped due to expiration (`stopped_reason: 'quote_expired'`) are replaced with new scheduled follow-ups
- **Preservation**: Follow-ups stopped due to acceptance/rejection/conversion remain stopped and are not modified
- **Clean State**: Active follow-ups (pending, scheduled, ready_for_dispatch) are stopped before creating new ones
- **Fresh Start**: A new follow-up is created with `status: 'scheduled'` for the re-sent quote

---

## Database Tables

### Core Tables

#### `quotes`
Stores all saved quotes (drafts and sent quotes).

**Key Columns**:
- `id`: UUID primary key
- `user_id`: Owner of the quote
- `quote_number`: Unique per user (format: DEV-YYYY-XXXXXX)
- `status`: draft, sent, viewed, accepted, rejected, expired
- `sent_at`: Timestamp when quote was sent
- `valid_until`: Expiration date

**Constraints**:
- `UNIQUE (user_id, quote_number)`: Prevents duplicate quote numbers per user

#### `quote_drafts`
Stores auto-saved drafts.

**Key Columns**:
- `id`: UUID primary key
- `user_id`: Owner of the draft
- `quote_number`: Links to quote if exists
- `draft_data`: JSONB with complete quote data
- `last_saved`: Last auto-save timestamp
- `valid_until`: Used for cleanup

**Cleanup**: Automatically deleted when:
- Quote reaches final status
- Quote expires
- Quote is saved/sent

#### `quote_follow_ups`
Stores scheduled follow-up emails.

**Key Columns**:
- `id`: UUID primary key
- `quote_id`: Reference to quote
- `stage`: 1, 2, or 3
- `status`: pending, scheduled, ready_for_dispatch, sent, failed, stopped, etc.
- `attempts`: Current attempt count
- `max_attempts`: Max attempts per stage (default: 3)
- `scheduled_at`: When to send
- `meta`: JSONB with priority, type, etc.

#### `quote_events`
Tracks all quote-related events.

**Key Columns**:
- `id`: UUID primary key
- `quote_id`: Reference to quote
- `type`: quote_created, quote_sent, quote_viewed, followup_sent, etc.
- `meta`: JSONB with event details
- `timestamp`: When event occurred

**Used For**:
- Recent activity detection
- Analytics
- Audit trail

### Related Tables

- `quote_tasks`: Individual tasks in a quote
- `quote_materials`: Materials for tasks
- `quote_files`: Attached files
- `quote_financial_configs`: VAT, advance payment config
- `quote_signatures`: Client and company signatures
- `quote_shares`: Public share links
- `clients`: Client information
- `company_profiles`: Company information

---

## Key Services and Functions

### Frontend Services

#### `quotesService.js`
- `createQuote()`: Create new quote
- `updateQuote()`: Update existing quote
- `fetchQuotes()`: Get all quotes for user
- `fetchQuoteById()`: Get single quote
- `deleteQuote()`: Delete quote
- `saveQuoteDraft()`: Save/update auto-saved draft
- `loadQuoteDraft()`: Load draft by ID
- `loadQuoteDraftByQuoteNumber()`: Load draft by quote number
- `listQuoteDrafts()`: List all drafts for user
- `deleteQuoteDraftById()`: Delete draft
- `deleteQuoteDraftByQuoteNumber()`: Delete draft by quote number
- `generateQuoteNumber()`: Generate unique quote number
- `convertQuoteToInvoice()`: Convert accepted quote to invoice

#### `followUpService.js`
- `listScheduledFollowUps()`: Get follow-ups for quotes
- `createFollowUpForQuote()`: Create manual follow-up
- `stopFollowUpsForQuote()`: Stop all follow-ups for quote
- `logQuoteEvent()`: Log event to quote_events

#### `emailService.js`
- `sendQuoteSentEmail()`: Send quote email to client
- Handles copy-to-sender with view-only mode

### Backend Edge Functions

#### `followups-scheduler`
- **Schedule**: Daily at 9 AM (via pg_cron)
- **Purpose**: Create and schedule follow-ups
- **Actions**:
  - Creates initial follow-ups for sent/viewed quotes
  - Progresses follow-up stages
  - Calculates priorities
  - Checks recent activity
  - Cleans up completed/failed follow-ups

#### `followups-dispatcher`
- **Schedule**: Every 15 minutes (via pg_cron)
- **Purpose**: Send scheduled follow-up emails
- **Actions**:
  - Finds follow-ups with `status='ready_for_dispatch'`
  - Sends emails via Resend API
  - Updates follow-up status
  - Reschedules for retries (if attempts < max_attempts)
  - Logs events to `quote_events`

### Database Functions

#### `generate_quote_number(user_id)`
- Generates unique quote number per user
- Format: `DEV-YYYY-XXXXXX`
- Checks both `quotes` and `quote_drafts` tables
- Returns next available sequence number

---

## Best Practices for Developers

### When Adding New Features

1. **Quote Creation**:
   - Always trigger auto-save on data changes
   - Use `saveQuoteDraft()` for auto-saves
   - Use `createQuote()` only when user explicitly saves/sends

2. **Quote Editing**:
   - Check `isEditing` and `editingQuoteId` flags
   - Use `updateQuote()` for saved quotes
   - Use `saveQuoteDraft()` for auto-saved drafts

3. **Follow-Ups**:
   - Always check quote status before creating follow-ups
   - Stop follow-ups when quote reaches final status
   - Use `logQuoteEvent()` for tracking

4. **Draft Cleanup**:
   - Always delete drafts when quote is saved/sent
   - Clean up expired drafts
   - Remove drafts for final-state quotes

5. **Quote Numbers**:
   - Only generate for new quotes
   - Never generate when editing
   - Preserve existing quote numbers

### Common Pitfalls

1. **Don't create drafts for saved quotes**: Check `isEditing` flag
2. **Don't generate new quote numbers when editing**: Check `editingQuoteId`
3. **Don't forget to clean up drafts**: Delete when quote is saved/sent
4. **Don't create follow-ups for final states**: Check status first
5. **Don't overwrite existing drafts**: Use draft row ID from localStorage

---

## Troubleshooting

### Draft Not Saving
- Check user authentication
- Verify `quote_drafts` table exists
- Check browser localStorage
- Verify draft row ID is stored correctly

### Quote Number Conflicts
- Verify `UNIQUE (user_id, quote_number)` constraint
- Check both `quotes` and `quote_drafts` tables
- Ensure quote number generation checks both tables

### Follow-Ups Not Triggering
- Verify quote status is `sent` or `viewed`
- Check `followups-scheduler` cron job is running
- Verify edge function is called on quote send/view
- Check `quote_events` for logged events

### Auto-Save Not Working
- Check `useEffect` dependencies
- Verify `saveQuoteDraft()` is being called
- Check network requests in browser console
- Verify user is authenticated

---

## Summary

The quote system provides a complete lifecycle management solution:

1. **Creation**: 4-step wizard with auto-save
2. **Drafts**: Auto-saved and manually saved drafts
3. **Management**: View, filter, search, and organize quotes
4. **Actions**: Save, send, edit, delete, convert
5. **Follow-Ups**: Automated reminders based on status and behavior
6. **Status Tracking**: Complete lifecycle from draft to final state

All components work together to provide a seamless experience for both users and clients, with automatic saving, intelligent follow-ups, and comprehensive status tracking.

