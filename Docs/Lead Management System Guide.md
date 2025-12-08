# Lead Management System Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Lead Lifecycle](#lead-lifecycle)
5. [Matching & Assignment Logic](#matching--assignment-logic)
6. [Key Components](#key-components)
7. [Service Methods](#service-methods)
8. [Database Functions & Triggers](#database-functions--triggers)
9. [Integration with Quote System](#integration-with-quote-system)
10. [Spam Reporting System](#spam-reporting-system)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Lead Management System connects clients looking for artisans with qualified professionals based on location (country/region) and work category matching. The system automatically assigns leads to matching artisans and allows artisans to create quotes directly from leads.

### Key Features
- ✅ **Automatic Lead Assignment** - Leads are automatically assigned to matching artisans
- ✅ **Location-Based Matching** - Country and region/province matching (no radius-based)
- ✅ **Category Matching** - Work category preferences matching
- ✅ **Quote Creation** - Artisans can create quotes directly from leads
- ✅ **Spam Reporting** - Artisans can report spam leads
- ✅ **Lead Preferences** - Artisans configure which leads they want to receive
- ✅ **Email Notifications** - Automated email notifications for new leads and assignments
- ✅ **Max Quote Limit** - Leads can receive maximum 3 quotes

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Client Side (Public)                                        │
│  /find-artisan - Lead Request Form                          │
│  - Client submits project request                           │
│  - Uploads project images                                   │
│  - Provides location and category info                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Database Trigger                                           │
│  trigger_auto_assign_lead                                   │
│  - Fires on lead_requests INSERT                            │
│  - Calls auto_assign_lead_to_artisans()                    │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Database Function                                           │
│  auto_assign_lead_to_artisans()                             │
│  - Matches lead with artisan preferences                    │
│  - Creates lead_assignments                                 │
│  - Creates lead_notifications                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Email Service                                               │
│  - Sends "new_lead_available" email                         │
│  - Sends "lead_assigned" email                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  Artisan Side (Authenticated)                               │
│  /leads-management - Leads Management Page                  │
│  - View assigned leads                                      │
│  - Configure lead preferences                               │
│  - Create quotes from leads                                 │
│  - Report spam leads                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

#### 1. `lead_requests`
Stores client project requests from the "Find Artisan" form.

**Key Fields:**
- `id` - UUID primary key
- `project_categories` - TEXT[] - Array of selected work categories
- `custom_category` - TEXT - Custom category if "other" selected
- `project_description` - TEXT - Project description
- `price_range` - VARCHAR(50) - Budget range (e.g., "€1,000 - €5,000")
- `completion_date` - DATE - Desired completion date
- `country` - VARCHAR(2) - Country code (BE, FR, NL, LU, etc.)
- `region` - VARCHAR(100) - Region/province within country
- `city` - VARCHAR(100) - City (defaults to 'N/A')
- `zip_code` - VARCHAR(20) - Postal code
- `full_address` - TEXT - Complete address
- `client_name` - VARCHAR(255) - Client full name
- `client_email` - VARCHAR(255) - Client email
- `client_phone` - VARCHAR(50) - Client phone
- `client_address` - TEXT - Client address
- `project_images` - TEXT[] - Array of image URLs
- `status` - VARCHAR(50) - 'active', 'assigned', 'completed', 'expired'
- `is_public` - BOOLEAN - Whether lead is visible to artisans
- `is_spam` - BOOLEAN - Spam flag
- `spam_review_status` - VARCHAR(50) - 'pending', 'approved', 'rejected'

**Indexes:**
- `idx_lead_requests_status` - Status filtering
- `idx_lead_requests_country` - Country filtering
- `idx_lead_requests_region` - Region filtering
- `idx_lead_requests_city` - City filtering
- `idx_lead_requests_zip_code` - ZIP code filtering
- `idx_lead_requests_categories` - GIN index for category array search
- `idx_lead_requests_location` - Composite index (country, region, city)
- `idx_lead_requests_is_spam` - Spam filtering
- `idx_lead_requests_spam_review_status` - Spam review status

**Trigger:**
- `trigger_auto_assign_lead` - Automatically assigns leads to matching artisans on INSERT

---

#### 2. `artisan_lead_preferences`
Stores artisan preferences for receiving leads.

**Key Fields:**
- `id` - UUID primary key
- `user_id` - UUID - Foreign key to users (unique)
- `profile_id` - UUID - Foreign key to user_profiles (optional)
- `countries_served` - JSONB - `{"BE": true, "FR": true, ...}`
- `regions_served` - JSONB - `{"BE": ["Brussels", "Flanders"], "FR": ["Île-de-France"], ...}`
- `work_categories` - JSONB - `{"plumbing": true, "electrical": true, ...}`
- `other_work_category` - TEXT - Custom category text
- `receive_leads` - BOOLEAN - Whether artisan wants to receive leads
- `max_leads_per_day` - INTEGER - Maximum leads per day (default: 10)
- `min_lead_value` - NUMERIC(10,2) - Minimum project value
- `max_lead_value` - NUMERIC(10,2) - Maximum project value
- `email_notifications` - BOOLEAN - Email notification preference
- `push_notifications` - BOOLEAN - Push notification preference

**Indexes:**
- `idx_artisan_lead_preferences_user_id` - User lookup
- `idx_artisan_lead_preferences_countries` - GIN index for countries_served
- `idx_artisan_lead_preferences_regions` - GIN index for regions_served
- `idx_artisan_lead_preferences_categories` - GIN index for work_categories

**Constraints:**
- `UNIQUE(user_id)` - One preference record per user

---

#### 3. `lead_assignments`
Tracks which artisans are assigned to which leads.

**Key Fields:**
- `id` - UUID primary key
- `lead_id` - UUID - Foreign key to lead_requests
- `artisan_user_id` - UUID - Foreign key to users
- `artisan_profile_id` - UUID - Foreign key to user_profiles (optional)
- `assigned_at` - TIMESTAMP - When lead was assigned
- `status` - VARCHAR(50) - 'assigned', 'quote_sent', 'quote_accepted', 'declined'
- `quote_id` - UUID - Foreign key to quotes (when quote is sent)
- `quote_sent_at` - TIMESTAMP - When quote was sent

**Indexes:**
- `idx_lead_assignments_lead_id` - Lead lookup
- `idx_lead_assignments_artisan_user_id` - Artisan lookup
- `idx_lead_assignments_status` - Status filtering
- `idx_lead_assignments_assigned_at` - Date sorting

**Constraints:**
- `UNIQUE(lead_id, artisan_user_id)` - One assignment per artisan per lead

---

#### 4. `lead_quotes`
Tracks quotes created from leads.

**Key Fields:**
- `id` - UUID primary key
- `lead_id` - UUID - Foreign key to lead_requests
- `artisan_user_id` - UUID - Foreign key to users
- `artisan_profile_id` - UUID - Foreign key to user_profiles (optional)
- `quote_id` - UUID - Foreign key to quotes
- `quote_amount` - NUMERIC(15,2) - Quote amount
- `quote_currency` - VARCHAR(3) - Currency code (default: 'EUR')
- `status` - VARCHAR(50) - 'sent', 'viewed', 'accepted', 'rejected'
- `viewed_at` - TIMESTAMP - When quote was viewed
- `responded_at` - TIMESTAMP - When client responded
- `client_response` - TEXT - Client response/notes

**Indexes:**
- `idx_lead_quotes_lead_id` - Lead lookup
- `idx_lead_quotes_artisan_user_id` - Artisan lookup
- `idx_lead_quotes_status` - Status filtering
- `idx_lead_quotes_created_at` - Date sorting

**Constraints:**
- `UNIQUE(lead_id, artisan_user_id)` - One quote per artisan per lead

**Trigger:**
- `trigger_update_lead_status_on_max_quotes` - Updates lead status when max quotes (3) reached

---

#### 5. `lead_notifications`
Stores email notifications sent to artisans about leads.

**Key Fields:**
- `id` - UUID primary key
- `lead_id` - UUID - Foreign key to lead_requests
- `artisan_user_id` - UUID - Foreign key to users
- `type` - VARCHAR(50) - 'new_lead', 'lead_assigned', 'quote_sent'
- `channel` - VARCHAR(50) - 'email', 'push' (default: 'email')
- `subject` - TEXT - Email subject
- `message` - TEXT - Email message
- `status` - VARCHAR(50) - 'pending', 'sent', 'delivered', 'failed'
- `sent_at` - TIMESTAMP - When notification was sent
- `delivered_at` - TIMESTAMP - When notification was delivered
- `error_message` - TEXT - Error message if failed

**Indexes:**
- `idx_lead_notifications_lead_id` - Lead lookup
- `idx_lead_notifications_artisan_user_id` - Artisan lookup
- `idx_lead_notifications_status` - Status filtering

---

#### 6. `lead_spam_reports`
Tracks spam reports submitted by artisans.

**Key Fields:**
- `id` - UUID primary key
- `lead_id` - UUID - Foreign key to lead_requests
- `reported_by_user_id` - UUID - Foreign key to users (reporter)
- `reason` - TEXT - Spam reason
- `report_type` - VARCHAR(50) - 'spam', 'inappropriate', 'duplicate'
- `additional_details` - TEXT - Additional information
- `reviewed_by` - UUID - Foreign key to users (reviewer)
- `reviewed_at` - TIMESTAMP - When report was reviewed
- `review_status` - VARCHAR(50) - 'pending', 'approved', 'rejected'
- `review_notes` - TEXT - Reviewer notes

**Indexes:**
- `idx_lead_spam_reports_lead_id` - Lead lookup
- `idx_lead_spam_reports_reported_by` - Reporter lookup
- `idx_lead_spam_reports_review_status` - Review status filtering
- `idx_lead_spam_reports_created_at` - Date sorting

**Constraints:**
- `UNIQUE(lead_id, reported_by_user_id)` - One report per user per lead

---

#### 7. `clients`
Stores client information (created automatically when quote is sent from lead).

**Key Fields:**
- `id` - UUID primary key
- `user_id` - UUID - Foreign key to users (artisan who created client)
- `name` - VARCHAR(255) - Client name
- `email` - VARCHAR(255) - Client email
- `phone` - VARCHAR(50) - Client phone
- `address` - TEXT - Client address
- `city` - VARCHAR(100) - City
- `country` - VARCHAR(100) - Country
- `postal_code` - VARCHAR(20) - Postal code
- `client_type` - VARCHAR(50) - 'individual', 'company'
- `is_active` - BOOLEAN - Active status

**Indexes:**
- `idx_clients_user_id` - User lookup
- `idx_clients_email` - Email lookup
- `idx_clients_name` - Name lookup
- `idx_clients_is_active` - Active status filtering

---

## Lead Lifecycle

### 1. Lead Creation (Client Side)

```
Client fills out "Find Artisan" form
    ↓
LeadManagementService.createLeadRequest()
    ↓
Insert into lead_requests table
    ↓
Database trigger fires: trigger_auto_assign_lead
    ↓
auto_assign_lead_to_artisans() function executes
```

**What happens:**
1. Client submits form with project details, location, categories
2. Lead is inserted into `lead_requests` with `status='active'`
3. Welcome email sent to client (using `welcome_client` template)
4. Database trigger automatically assigns lead to matching artisans

---

### 2. Automatic Assignment

```
auto_assign_lead_to_artisans() function
    ↓
Finds matching artisans based on:
  - Country match (countries_served)
  - Region match (regions_served)
  - Category match (work_categories)
  - receive_leads = true
    ↓
Creates lead_assignments records
    ↓
Creates lead_notifications records
    ↓
Email sent to artisans (new_lead_available template)
```

**Matching Criteria:**
- ✅ Artisan has `receive_leads = true`
- ✅ Lead's country is in artisan's `countries_served`
- ✅ Lead's region is in artisan's `regions_served` for that country
- ✅ At least one lead category matches artisan's `work_categories`
- ✅ Artisan hasn't already been assigned to this lead

---

### 3. Artisan Views Leads

```
Artisan navigates to /leads-management
    ↓
LeadManagementService.getLeadsForArtisan(userId)
    ↓
Calls database function: get_leads_for_artisan()
    ↓
Returns leads with:
  - Assignment status
  - Quote count (quotes_sent_count)
  - Can send quote flag (can_send_quote)
  - Quote status (quote_status)
```

**Lead Display:**
- Shows all assigned leads
- Displays quote count (X/3)
- Shows "Create Quote" button if `can_send_quote = true`
- Shows "Max Quotes Reached" if 3 quotes already sent
- Filters by price range, date period
- Allows spam reporting

---

### 4. Quote Creation from Lead

```
Artisan clicks "Create Quote"
    ↓
Navigates to /quote-creation?lead_id=xxx
    ↓
Quote creation page loads lead data
    ↓
LeadManagementService.getLeadDetailsForQuote(leadId)
    ↓
Calls database function: get_lead_details_for_quote_creation()
    ↓
Returns lead data formatted for quote creation
    ↓
Artisan creates quote
    ↓
LeadManagementService.createQuoteFromLead()
    ↓
Calls database function: create_quote_from_lead()
    ↓
Creates:
  - Client record (if doesn't exist)
  - Quote record
  - lead_quotes record
  - Updates lead_assignments
    ↓
Email sent to client (quote_sent template)
```

**What happens:**
1. Lead data is pre-filled in quote creation form
2. Client is automatically created from lead data
3. Quote is created and linked to lead
4. `lead_quotes` record is created
5. `lead_assignments.status` updated to 'quote_sent'
6. Email notification sent to client

---

### 5. Max Quotes Reached

```
When 3rd quote is sent for a lead
    ↓
Database trigger: trigger_update_lead_status_on_max_quotes
    ↓
update_lead_status_on_max_quotes() function
    ↓
Updates lead_requests.status to 'assigned'
    ↓
No more quotes can be sent for this lead
```

**Protection:**
- Maximum 3 quotes per lead
- `can_send_quote` flag becomes `false` after 3 quotes
- Lead status changes to 'assigned' (no longer 'active')
- UI shows "Max Quotes Reached" message

---

## Matching & Assignment Logic

### Matching Algorithm

The `auto_assign_lead_to_artisans()` function matches leads to artisans using:

1. **Country Matching:**
   ```sql
   alp.countries_served ? NEW.country
   ```
   - Checks if lead's country exists in artisan's `countries_served` JSONB

2. **Region Matching:**
   ```sql
   alp.regions_served ? NEW.country
   AND alp.regions_served->NEW.country ? NEW.region
   ```
   - Checks if lead's country exists in `regions_served`
   - Checks if lead's region exists in that country's region array

3. **Category Matching:**
   ```sql
   alp.work_categories ?| NEW.project_categories
   OR (alp.other_work_category IS NOT NULL AND NEW.custom_category IS NOT NULL)
   ```
   - Checks if any lead category overlaps with artisan's `work_categories`
   - OR checks if both have custom categories

4. **Preference Check:**
   ```sql
   alp.receive_leads = true
   ```
   - Artisan must have opted in to receive leads

5. **Duplicate Prevention:**
   ```sql
   SELECT COUNT(*) FROM lead_assignments
   WHERE lead_id = NEW.id AND artisan_user_id = artisan_record.user_id
   ```
   - Prevents duplicate assignments

---

## Key Components

### Frontend Pages

#### 1. `/find-artisan` - Lead Request Form
**File:** `src/pages/find-artisan/index.jsx`

**Purpose:** Public form for clients to submit project requests

**Features:**
- Multi-step form (categories, location, project details, contact info)
- File upload for project images
- Country/region selection
- Category selection (with "other" option)
- Price range selection
- Completion date picker

**Service Calls:**
- `LeadManagementService.createLeadRequest(leadData)`
- `LeadManagementService.uploadProjectFiles(files)`

---

#### 2. `/leads-management` - Artisan Leads Management
**File:** `src/pages/leads-management/index.jsx`

**Purpose:** Artisan dashboard for managing assigned leads

**Features:**
- **Leads Tab:**
  - View all assigned leads
  - Filter by price range, date period
  - View lead details (description, images, location)
  - Create quote from lead
  - Report spam
  - See quote count (X/3)
  
- **Settings Tab:**
  - Toggle receive leads on/off
  - Select countries served
  - Select regions served (per country)
  - Select work categories
  - Set custom work category
  - Auto-saves preferences

**Service Calls:**
- `LeadManagementService.getLeadsForArtisan(userId)`
- `LeadManagementService.getArtisanPreferences(userId)`
- `LeadManagementService.updateArtisanPreferences(userId, preferences)`
- `LeadManagementService.reportLeadAsSpam(leadId, userId, reason)`

---

### Service Layer

#### `LeadManagementService` (`src/services/leadManagementService.js`)

**Main Methods:**

1. **Lead Requests:**
   - `createLeadRequest(leadData)` - Create new lead from form
   - `getLeadRequest(leadId)` - Get lead by ID

2. **Artisan Preferences:**
   - `getArtisanPreferences(userId)` - Get or create preferences
   - `updateArtisanPreferences(userId, preferences)` - Update preferences

3. **Lead Assignment:**
   - `getLeadsForArtisan(userId, limit)` - Get assigned leads for artisan
   - `getLeadDetailsForQuote(leadId)` - Get lead data for quote creation

4. **Quote Creation:**
   - `createQuoteFromLead(leadId, userId, profileId, quoteData)` - Create quote from lead

5. **File Management:**
   - `uploadProjectFiles(files, leadId)` - Upload project images
   - `getFilePublicUrl(filePath)` - Get public URL for file
   - `deleteProjectFiles(filePaths)` - Delete uploaded files

6. **Statistics:**
   - `getLeadStatistics(userId)` - Get lead stats for artisan

7. **Spam Reporting:**
   - `reportLeadAsSpam(leadId, userId, reason, reportType, additionalDetails)`
   - `getSpamReports(limit, offset)` - Get spam reports (superadmin)
   - `reviewSpamReport(leadId, reviewerId, reviewStatus, reviewNotes)` - Review spam (superadmin)
   - `deleteLead(leadId)` - Delete lead (superadmin)

8. **Notifications:**
   - `getLeadNotifications(userId)` - Get notifications for artisan
   - `markNotificationAsRead(notificationId)` - Mark notification as read

---

## Database Functions & Triggers

### Functions

#### 1. `auto_assign_lead_to_artisans()`
**Type:** Trigger Function  
**Triggered By:** `trigger_auto_assign_lead` (AFTER INSERT on `lead_requests`)

**Purpose:** Automatically assigns new leads to matching artisans

**Logic:**
1. Checks if lead is active and public
2. Finds artisans with matching preferences:
   - Country match
   - Region match
   - Category match
   - `receive_leads = true`
3. Creates `lead_assignments` records
4. Creates `lead_notifications` records

**Returns:** NEW (trigger function)

---

#### 2. `get_leads_for_artisan(artisan_user_uuid, limit_count)`
**Type:** Table Function  
**Called By:** `LeadManagementService.getLeadsForArtisan()`

**Purpose:** Returns leads assigned to artisan with quote information

**Returns:**
- `lead_id` - Lead UUID
- `project_description` - Project description
- `client_name` - Client name
- `price_range` - Budget range
- `completion_date` - Desired completion date
- `country`, `region`, `city`, `zip_code` - Location
- `project_categories` - Work categories
- `project_images` - Image URLs
- `quotes_sent_count` - Number of quotes sent (0-3)
- `can_send_quote` - Boolean flag
- `quote_status` - Status ('available', 'max_reached', 'already_processed')
- `created_at` - Lead creation date
- `assigned_at` - Assignment date

**Filters:**
- Excludes spam leads (`is_spam = false`)
- Only returns leads assigned to the artisan
- Excludes leads with max quotes reached (if applicable)

---

#### 3. `create_quote_from_lead(lead_uuid, artisan_user_uuid, artisan_profile_uuid, quote_data)`
**Type:** Function  
**Called By:** `LeadManagementService.createQuoteFromLead()`

**Purpose:** Creates complete quote from lead data

**Process:**
1. Gets lead data
2. Creates or finds client record
3. Creates quote record
4. Creates `lead_quotes` record
5. Updates `lead_assignments` status to 'quote_sent'
6. Returns quote ID and share token

**Parameters:**
- `lead_uuid` - Lead ID
- `artisan_user_uuid` - Artisan user ID
- `artisan_profile_uuid` - Artisan profile ID (optional)
- `quote_data` - JSONB with quote details (title, tasks, amounts, etc.)

**Returns:**
- `quote_id` - Created quote UUID
- `share_token` - Quote share token
- `client_id` - Client UUID (created or found)

---

#### 4. `get_lead_details_for_quote_creation(lead_uuid)`
**Type:** Function  
**Called By:** `LeadManagementService.getLeadDetailsForQuote()`

**Purpose:** Formats lead data for quote creation form

**Returns:**
- Formatted lead data with client info, project details, location

---

#### 5. `update_lead_status_on_max_quotes()`
**Type:** Trigger Function  
**Triggered By:** `trigger_update_lead_status_on_max_quotes` (AFTER INSERT on `lead_quotes`)

**Purpose:** Updates lead status when 3rd quote is sent

**Logic:**
1. Counts quotes for the lead
2. If count >= 3, updates `lead_requests.status` to 'assigned'
3. Prevents further quote creation

---

#### 6. `report_lead_as_spam(lead_uuid, reporter_user_uuid, spam_reason_text, report_type_text, additional_details_text)`
**Type:** Function  
**Called By:** `LeadManagementService.reportLeadAsSpam()`

**Purpose:** Reports a lead as spam

**Process:**
1. Creates `lead_spam_reports` record
2. Updates `lead_requests.is_spam` to true (if first report)
3. Updates `lead_requests.spam_review_status` to 'pending'
4. Prevents duplicate reports (UNIQUE constraint)

---

### Triggers

#### 1. `trigger_auto_assign_lead`
**Table:** `lead_requests`  
**Event:** AFTER INSERT  
**Function:** `auto_assign_lead_to_artisans()`

**Purpose:** Automatically assigns new leads to matching artisans

---

#### 2. `trigger_update_lead_status_on_max_quotes`
**Table:** `lead_quotes`  
**Event:** AFTER INSERT  
**Function:** `update_lead_status_on_max_quotes()`

**Purpose:** Updates lead status when max quotes (3) reached

---

## Integration with Quote System

### Quote Creation Flow

```
Lead → Quote Creation
    ↓
1. Load lead data via get_lead_details_for_quote_creation()
    ↓
2. Pre-fill quote form with:
   - Client info (name, email, phone, address)
   - Project title (from project_description)
   - Project location
   - Project images
    ↓
3. Artisan creates quote (adds tasks, amounts, etc.)
    ↓
4. Submit quote
    ↓
5. create_quote_from_lead() function:
   - Creates/finds client
   - Creates quote
   - Links quote to lead (lead_quotes table)
   - Updates assignment status
    ↓
6. Email sent to client (quote_sent template)
```

### Client Creation

When a quote is created from a lead:
- Client record is automatically created in `clients` table
- Client data comes from `lead_requests` (client_name, client_email, etc.)
- Client is linked to the artisan who created the quote (`user_id`)
- If client already exists (by email), existing client is used

---

## Spam Reporting System

### How It Works

1. **Artisan Reports Spam:**
   ```
   Artisan clicks "Report Spam" on lead
       ↓
   LeadManagementService.reportLeadAsSpam()
       ↓
   Database function: report_lead_as_spam()
       ↓
   Creates lead_spam_reports record
       ↓
   Sets lead_requests.is_spam = true
       ↓
   Sets spam_review_status = 'pending'
   ```

2. **Spam Filtering:**
   - Spam leads are excluded from `get_leads_for_artisan()` results
   - Query filters: `WHERE is_spam = false`

3. **Super Admin Review:**
   - Super admins can review spam reports
   - Can approve/reject spam reports
   - Can delete leads if confirmed spam

### Spam Report Statuses

- `pending` - Awaiting review
- `approved` - Confirmed as spam
- `rejected` - Not spam (false positive)

---

## Email Notifications

### Email Types

1. **New Lead Available** (`new_lead_available`)
   - **Sent to:** Artisan
   - **When:** Lead is assigned to artisan
   - **Template Variables:**
     - `{artisan_name}`, `{artisan_company_name}`
     - `{project_description}`
     - `{city}`, `{zip_code}`, `{location}`
     - `{leads_management_url}`, `{site_url}`
     - `{company_name}`

2. **Lead Assigned** (`lead_assigned`)
   - **Sent to:** Artisan
   - **When:** Lead is successfully assigned
   - **Template Variables:** Same as new_lead_available + `{client_name}`

3. **Welcome Client** (`welcome_client`)
   - **Sent to:** Client
   - **When:** Lead is created
   - **Template Variables:**
     - `{client_name}`
     - `{company_name}`
     - `{login_url}`

4. **Quote Sent** (`quote_sent`)
   - **Sent to:** Client
   - **When:** Quote is created from lead
   - **Template Variables:**
     - `{client_name}`, `{quote_number}`, `{quote_title}`
     - `{quote_amount}`, `{quote_link}`, `{valid_until}`
     - `{company_name}`

---

## Workflow Examples

### Example 1: New Lead Submission

```
1. Client submits "Find Artisan" form
   - Project: Kitchen renovation
   - Location: Brussels, Belgium
   - Categories: [plumbing, electrical, renovation]
   - Budget: €10,000 - €25,000
   
2. Lead created in lead_requests
   - status = 'active'
   - is_public = true
   
3. Database trigger fires
   - auto_assign_lead_to_artisans() executes
   
4. System finds matching artisans:
   - Country: BE ✓
   - Region: Brussels ✓
   - Categories: plumbing OR electrical OR renovation ✓
   - receive_leads = true ✓
   
5. Creates lead_assignments for 3 matching artisans
   
6. Creates lead_notifications for each artisan
   
7. Sends "new_lead_available" emails to artisans
   
8. Sends "welcome_client" email to client
```

---

### Example 2: Artisan Creates Quote

```
1. Artisan views lead in /leads-management
   - Sees project description, images, location
   - Quote count: 0/3
   - "Create Quote" button enabled
   
2. Artisan clicks "Create Quote"
   - Navigates to /quote-creation?lead_id=xxx
   
3. Quote form pre-filled with:
   - Client: John Doe (john@example.com)
   - Project: Kitchen renovation
   - Location: Brussels, Belgium
   - Images: [image1.jpg, image2.jpg]
   
4. Artisan adds:
   - Tasks: Plumbing work, Electrical work
   - Amounts: €5,000, €3,000
   - Tax: 21%
   
5. Artisan submits quote
   
6. create_quote_from_lead() executes:
   - Creates client record (if new)
   - Creates quote record
   - Creates lead_quotes record
   - Updates lead_assignments.status = 'quote_sent'
   
7. Email sent to client with quote link
   
8. Lead quote count now: 1/3
```

---

### Example 3: Max Quotes Reached

```
1. First artisan sends quote
   - lead_quotes count: 1
   - can_send_quote: true
   
2. Second artisan sends quote
   - lead_quotes count: 2
   - can_send_quote: true
   
3. Third artisan sends quote
   - lead_quotes count: 3
   - Database trigger fires
   - update_lead_status_on_max_quotes() executes
   - lead_requests.status = 'assigned'
   - can_send_quote: false
   
4. Fourth artisan tries to create quote
   - UI shows "Max Quotes Reached"
   - "Create Quote" button disabled
```

---

## Troubleshooting

### Lead Not Appearing for Artisan

**Check:**
1. ✅ Artisan has `receive_leads = true` in preferences
2. ✅ Lead country matches artisan's `countries_served`
3. ✅ Lead region matches artisan's `regions_served` for that country
4. ✅ At least one category matches artisan's `work_categories`
5. ✅ Lead is not spam (`is_spam = false`)
6. ✅ Lead status is 'active'
7. ✅ Lead is public (`is_public = true`)

**Debug Query:**
```sql
SELECT * FROM lead_requests lr
WHERE lr.id = 'lead-uuid-here'
AND lr.is_spam = false
AND lr.status = 'active'
AND lr.is_public = true;

SELECT * FROM artisan_lead_preferences alp
WHERE alp.user_id = 'artisan-user-uuid-here'
AND alp.receive_leads = true;
```

---

### Quote Creation Fails

**Check:**
1. ✅ Lead exists and is assigned to artisan
2. ✅ Quote count < 3 (`quotes_sent_count < 3`)
3. ✅ `can_send_quote = true`
4. ✅ Lead is not spam
5. ✅ Database function `create_quote_from_lead()` exists

**Debug:**
```sql
SELECT 
  lr.id,
  lr.status,
  lr.is_spam,
  COUNT(lq.id) as quote_count
FROM lead_requests lr
LEFT JOIN lead_quotes lq ON lq.lead_id = lr.id
WHERE lr.id = 'lead-uuid-here'
GROUP BY lr.id;
```

---

### Auto-Assignment Not Working

**Check:**
1. ✅ Trigger exists: `trigger_auto_assign_lead`
2. ✅ Function exists: `auto_assign_lead_to_artisans()`
3. ✅ Artisans have matching preferences
4. ✅ Lead is inserted with `status='active'` and `is_public=true`

**Debug:**
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_assign_lead';

-- Check function exists
SELECT * FROM pg_proc WHERE proname = 'auto_assign_lead_to_artisans';

-- Test assignment manually
SELECT * FROM auto_assign_lead_to_artisans();
```

---

### Email Notifications Not Sending

**Check:**
1. ✅ Email templates exist in `email_templates` table
2. ✅ Templates are active (`is_active = true`)
3. ✅ Templates exist for user's language
4. ✅ Edge function `send-emails` is configured
5. ✅ Resend API keys are set

**Debug:**
```sql
SELECT * FROM email_templates
WHERE template_type IN ('new_lead_available', 'lead_assigned')
AND language = 'fr'
AND is_active = true;
```

---

## Key Files Reference

### Frontend
- `src/pages/find-artisan/index.jsx` - Lead request form (public)
- `src/pages/leads-management/index.jsx` - Artisan leads management page
- `src/pages/leads-management/components/LeadsFilterToolbar.jsx` - Filter component

### Services
- `src/services/leadManagementService.js` - Main lead management service

### Database
- `lead-management.sql` - Database schema and functions
- `lead-management-spam-update.sql` - Spam reporting updates

### Email Templates
- `new_lead_available` - New lead notification (fr, en, nl)
- `lead_assigned` - Lead assignment confirmation (fr, en, nl)
- `welcome_client` - Client welcome email (fr, en, nl)
- `quote_sent` - Quote sent notification (fr, en, nl)

---

## Summary

**The Lead Management System:**
- ✅ Automatically matches leads to artisans based on location and categories
- ✅ Uses country/region matching (not radius-based)
- ✅ Limits leads to maximum 3 quotes
- ✅ Integrates seamlessly with quote creation
- ✅ Supports spam reporting and moderation
- ✅ Sends automated email notifications
- ✅ Allows artisans to configure lead preferences
- ✅ Creates clients automatically when quotes are sent

**Key Tables:**
- `lead_requests` - Client project requests
- `artisan_lead_preferences` - Artisan preferences
- `lead_assignments` - Lead-to-artisan assignments
- `lead_quotes` - Quotes created from leads
- `lead_notifications` - Email notifications
- `lead_spam_reports` - Spam reports
- `clients` - Client records (auto-created)

**Key Functions:**
- `auto_assign_lead_to_artisans()` - Automatic assignment
- `get_leads_for_artisan()` - Get assigned leads
- `create_quote_from_lead()` - Create quote from lead
- `update_lead_status_on_max_quotes()` - Max quote protection

The system ensures efficient lead distribution while preventing spam and limiting quote competition! 🚀

