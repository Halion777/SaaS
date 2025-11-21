# Email System Structure Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Database Structure](#database-structure)
4. [How Templates Work](#how-templates-work)
5. [Email Flow Examples](#email-flow-examples)
6. [Template Management](#template-management)
7. [Adding New Email Types](#adding-new-email-types)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses a **database-driven email template system** where all email templates are stored in the database and can be customized by Super Admins through the UI. The system supports **3 languages** (French, English, Dutch) and ensures consistency across all email communications.

### Key Principles
- ✅ **All templates stored in database** - No hardcoded email templates
- ✅ **Multi-language support** - French (default), English, Dutch
- ✅ **Super Admin customization** - Templates editable via UI
- ✅ **Variable-based** - Dynamic content using `{variable_name}` syntax
- ✅ **Error handling** - Clear errors if templates are missing

---

## System Architecture

The email system uses a **3-layer architecture**:

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: Service Files (Frontend)                     │
│  src/services/emailService.js                          │
│  - Prepares email data                                 │
│  - Determines user language                            │
│  - Calls Edge Function                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 2: Edge Function (Backend)                       │
│  supabase/functions/send-emails/index.ts                │
│  - Fetches template from database                       │
│  - Renders template with variables                     │
│  - Sends email via Resend API                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Layer 3: Database (Storage)                           │
│  email_templates table                                  │
│  - Stores all templates                                │
│  - Multi-language support                              │
│  - Customizable via Super Admin UI                     │
└─────────────────────────────────────────────────────────┘
```

### Layer 1: Service Files (`src/services/emailService.js`)
**Purpose**: Frontend/Application layer that prepares email data

**Responsibilities**:
- Gets user language from `localStorage.getItem('i18nextLng')`
- Prepares email data (variables, recipients, etc.)
- Calls the Edge Function to send emails
- Handles business logic for email sending

**Example**:
```javascript
// Get user language
const language = localStorage.getItem('i18nextLng') || 'fr';

// Call edge function
await EmailService.sendEmailViaEdgeFunction('new_lead_available', {
  language: language,
  artisan_email: 'artisan@example.com',
  leadData: { ... },
  artisanData: { ... }
});
```

### Layer 2: Edge Function (`supabase/functions/send-emails/index.ts`)
**Purpose**: Backend execution layer that sends emails securely

**Responsibilities**:
- Fetches email template from database
- Replaces variables in template (`{variable_name}` → actual value)
- Sends email via Resend API (API keys stay secure on server)
- Returns success/error response

**Key Functions**:
- `getEmailTemplate(templateType, language, userId)` - Fetches template from database
- `renderTemplate(template, variables)` - Replaces variables in template
- `sendEmail(emailPayload)` - Sends email via Resend API

### Layer 3: Database (`email_templates` table)
**Purpose**: Stores all email templates with customization support

**Features**:
- Multi-language templates (fr, en, nl)
- Variable definitions
- Active/inactive status
- Default template support
- User-specific templates (optional via `user_id`)

---

## Database Structure

### `email_templates` Table Schema

```sql
CREATE TABLE public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,  -- Optional: for user-specific templates
    template_type VARCHAR(100) NOT NULL,  -- Type identifier (e.g., 'quote_sent', 'contact_form')
    template_name VARCHAR(255) NOT NULL,  -- Display name (e.g., "Quote Sent")
    subject TEXT NOT NULL,  -- Email subject with {variables}
    html_content TEXT NOT NULL,  -- HTML email template
    text_content TEXT NOT NULL,  -- Plain text fallback
    variables JSONB DEFAULT '{}',  -- Available variables for this template
    is_active BOOLEAN DEFAULT true,  -- Whether template is active
    is_default BOOLEAN DEFAULT false,  -- Default template for the type
    language VARCHAR(10) DEFAULT 'fr',  -- Language code: 'fr', 'en', 'nl'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Template Types

The system supports the following email template types:

#### Quote-Related Templates
| Template Type | Description | Variables | Language Support |
|--------------|-------------|-----------|------------------|
| `quote_sent` | Quote sent to client | `{client_name}`, `{quote_number}`, `{quote_title}`, `{quote_amount}`, `{quote_link}`, `{valid_until}`, `{company_name}` | ✅ Uses client language preference |
| `custom_quote_sent` | Custom quote with user message | Same as `quote_sent` + `{custom_message}` | ✅ Uses client language preference |
| `client_accepted` | Quote accepted by client | `{client_name}`, `{quote_number}`, `{quote_amount}`, `{company_name}` | ✅ Uses client language preference |
| `client_rejected` | Quote rejected by client | Same as `client_accepted` | ✅ Uses client language preference |
| `followup_not_viewed` | Follow-up for unopened quotes | `{client_name}`, `{quote_number}`, `{quote_link}`, `{company_name}` | ✅ Uses client language preference |
| `followup_viewed_no_action` | Follow-up for viewed but no action | Same as `followup_not_viewed` | ✅ Uses client language preference |
| `general_followup` | General follow-up reminder | Same as `followup_not_viewed` | ✅ Uses client language preference |
| `welcome_client` | Welcome email for new clients | `{client_name}`, `{company_name}`, `{login_url}` | ✅ Uses client language preference |

#### Subscription Templates
| Template Type | Description | Variables | Language Support |
|--------------|-------------|-----------|------------------|
| `subscription_upgraded` | Subscription upgrade notification | `{user_name}`, `{old_plan_name}`, `{new_plan_name}`, `{price}`, `{billing_cycle}`, `{company_name}` | ✅ Uses user language preference |
| `subscription_downgraded` | Subscription downgrade notification | Same as `subscription_upgraded` | ✅ Uses user language preference |
| `subscription_cancelled` | Subscription cancellation notification | `{user_name}`, `{plan_name}`, `{company_name}` | ✅ Uses user language preference |
| `subscription_activated` | Subscription activation notification | `{user_name}`, `{plan_name}`, `{price}`, `{company_name}` | ✅ Uses user language preference |
| `subscription_trial_ending` | Trial ending reminder | `{user_name}`, `{plan_name}`, `{trial_end_date}`, `{company_name}` | ✅ Uses user language preference |

#### Lead Management Templates
| Template Type | Description | Variables | Language Support |
|--------------|-------------|-----------|------------------|
| `new_lead_available` | New project available notification | `{artisan_name}`, `{artisan_company_name}`, `{project_description}`, `{city}`, `{zip_code}`, `{location}`, `{leads_management_url}`, `{site_url}`, `{company_name}` | ✅ Uses artisan/user language preference |
| `lead_assigned` | Project assigned confirmation | Same as `new_lead_available` + `{client_name}` | ✅ Uses artisan/user language preference |

#### Contact & Support Templates
| Template Type | Description | Variables | Language Support |
|--------------|-------------|-----------|------------------|
| `contact_form` | Contact form submission notification | `{first_name}`, `{last_name}`, `{full_name}`, `{email}`, `{phone}`, `{subject}`, `{subject_label}`, `{message}`, `{company_name}`, `{submission_date}` | ✅ Uses browser/i18n language |

#### Credit Insurance Templates
| Template Type | Description | Variables | Language Support |
|--------------|-------------|-----------|------------------|
| `credit_insurance_application` | Application submission (internal) | `{application_id}`, `{submission_date}`, `{company_name}`, `{contact_person}`, `{email}`, `{telephone}`, `{address}`, `{sector}`, `{activity_description}`, `{annual_turnover}`, `{top_customers}` | ✅ Uses language parameter (default: 'fr') |
| `credit_insurance_confirmation` | Application confirmation (client) | `{application_id}`, `{submission_date}`, `{company_name}`, `{contact_person}`, `{sector}`, `{annual_turnover}`, `{haliqo_company_name}` | ✅ Uses language parameter (default: 'fr') |

#### Invoice Templates
| Template Type | Description | Variables | Language Support |
|--------------|-------------|-----------|------------------|
| `invoice_overdue_reminder` | Overdue invoice reminder | `{client_name}`, `{invoice_number}`, `{invoice_amount}`, `{days_overdue}`, `{due_date}`, `{company_name}` | ✅ Uses client language preference |
| `invoice_payment_reminder` | Payment due soon reminder | Same as `invoice_overdue_reminder` | ✅ Uses client language preference |
| `overdue` | General overdue notification | Same as `invoice_overdue_reminder` | ✅ Uses client language preference |

---

## How Templates Work

### Template Fetching Logic

When an email needs to be sent, the system follows this priority order:

1. **User-specific template** (if `user_id` is provided and template exists)
2. **Default template** for requested language (from `client.language_preference` or `user.language_preference`)
3. **Any active template** for requested language
4. **French default template** (fallback if requested language not found)
5. **Any active template** (final fallback)
6. **Error** - If no template found, throws error with clear message

**Language Source:**
- **Client emails**: Uses `client.language_preference` from `clients` table
- **User emails**: Uses `user.language_preference` from `users` table
- **Contact form**: Uses browser/i18n language

### Variable Replacement

Templates use variables in the format `{variable_name}` that are replaced with actual values when sending.

**Example Template**:
```html
<h2>Hello {client_name},</h2>
<p>Your quote {quote_number} for {quote_title} is ready.</p>
<p>Amount: {quote_amount}</p>
<p>Valid until: {valid_until}</p>
<a href="{quote_link}">View Quote</a>
<p>Best regards,<br>{company_name}</p>
```

**Variables Passed**:
```javascript
{
  client_name: "John Doe",
  quote_number: "QT-2024-001",
  quote_title: "Kitchen Renovation",
  quote_amount: "€5,000",
  valid_until: "2024-12-31",
  quote_link: "https://app.haliqo.com/quote-share/qt_123",
  company_name: "Haliqo"
}
```

**Result**:
```html
<h2>Hello John Doe,</h2>
<p>Your quote QT-2024-001 for Kitchen Renovation is ready.</p>
<p>Amount: €5,000</p>
<p>Valid until: 2024-12-31</p>
<a href="https://app.haliqo.com/quote-share/qt_123">View Quote</a>
<p>Best regards,<br>Haliqo</p>
```

### Language Selection

**Language Priority System:**

1. **For Client Emails** (quotes, invoices, follow-ups):
   - Primary: `client.language_preference` (from database)
   - Fallback: French template
   - Final fallback: Any active template

2. **For User/Artisan Emails** (subscriptions, copy emails):
   - Primary: `user.language_preference` (from database)
   - Fallback: `localStorage.getItem('language')` or `localStorage.getItem('i18nextLng')`
   - Final fallback: French template

3. **For Contact Form**:
   - Primary: Language from i18n (`i18n.language`)
   - Fallback: `localStorage.getItem('language')` or `localStorage.getItem('i18nextLng')`
   - Final fallback: French template

**Template Selection Logic:**
- First tries to find template in requested language
- Falls back to French if requested language not found
- Falls back to any active template if French not found
- Throws error if no template exists

---

## Email Flow Examples

### Example 1: User Sends Quote (Manual Action)

```
1. User clicks "Send Quote" in UI
   ↓
2. Frontend calls: EmailService.sendQuoteSentEmail(quoteId)
   ↓
3. emailService.js:
   - Fetches client data including client.language_preference (e.g., 'en')
   - Fetches quote data from database
   - Prepares variables (client_name, quote_number, etc.)
   - Uses client.language_preference for client email
   - Calls Edge Function: sendEmailViaEdgeFunction('templated_email', {
       language: 'en',  // From client.language_preference
       template_type: 'quote_sent',
       client_email: 'client@example.com',
       variables: { ... }
     })
   ↓
4. Edge Function (send-emails/index.ts):
   - Receives email request
   - Fetches template from email_templates table
     (template_type='quote_sent', language='en')
   - Renders template with variables
   - Sends email via Resend API
   - Returns success/error
   ↓
5. Frontend receives response and shows success message
```

### Example 2: Quote Accepted (Automated via Database Trigger)

```
1. Client accepts quote (status changes to 'accepted')
   ↓
2. Database Trigger: on_quote_status_accepted_rejected()
   - Detects status change
   - Fetches 'client_accepted' template from email_templates
   - Renders template with quote data
   - Inserts email into email_outbox (status: 'sending')
   ↓
3. Cron Job (runs every 5 minutes):
   - SELECT public.send_pending_emails()
   - Finds emails in email_outbox with status 'sending'
   - Calls Edge Function to send each email
   - Updates status to 'sent' or 'failed'
```

### Example 3: Follow-up Email (Scheduled)

```
1. Follow-up Scheduler Edge Function (runs daily at 9 AM):
   - Checks quotes that need follow-ups
   - Fetches client.language_preference from database
   - Fetches template filtered by client language
   - Creates follow-up records in quote_follow_ups table
     (with template content already rendered)
   ↓
2. Follow-up Dispatcher Edge Function (runs every 15 minutes):
   - Finds follow-ups ready to send (scheduled_at <= now)
   - Uses template content already stored in follow-up record
   - Replaces dynamic variables (days_since_sent, etc.)
   - Calls send-emails edge function
   - Updates follow-up status to 'sent'
```

---

## Template Management

### Super Admin Template Management UI

**Location**: `/admin/super/email-templates`

**Features**:
- ✅ View all templates in table or card view
- ✅ Filter by type, language, or search
- ✅ Edit templates (HTML content, text content, subject)
- ✅ Create new templates
- ✅ Switch between languages (🇫🇷 FR, 🇬🇧 EN, 🇳🇱 NL)
- ✅ Activate/deactivate templates
- ✅ Set default templates

### Creating/Editing Templates

1. **Navigate to**: Super Admin → Email Templates
2. **Click**: "Create Template" or "Edit" on existing template
3. **Fill in**:
   - **Template Name**: Display name (e.g., "Quote Sent")
   - **Template Type**: Select from dropdown (e.g., `quote_sent`)
   - **Subject**: Email subject with variables (e.g., "Devis {quote_number}")
   - **HTML Content**: Full HTML email template
   - **Text Content**: Plain text version
   - **Language**: Selected via language tabs (default: French)
   - **Active**: Checkbox to enable/disable template
4. **Save**: Template is immediately available for use

### Language Switching

- Click language buttons (🇫🇷 FR, 🇬🇧 EN, 🇳🇱 NL) to switch
- Template content loads automatically for selected language
- If template doesn't exist for a language, empty fields are shown for creation
- Each language is stored as a separate template record

### Best Practices

1. **Always create templates for all 3 languages** (fr, en, nl)
2. **Test templates** before marking as active
3. **Use consistent variable names** across languages
4. **Keep text_content** as plain text version of HTML
5. **Set one template as default** per language per type

---

## Adding New Email Types

### Step 1: Create Template Records

Add templates to `email_templates` table for each language:

```sql
-- French template
INSERT INTO email_templates (
  template_type,
  template_name,
  subject,
  html_content,
  text_content,
  language,
  is_active,
  is_default
) VALUES (
  'new_template_type',
  'New Template Name',
  'Subject with {variables}',
  '<html>Template HTML with {variables}</html>',
  'Plain text version with {variables}',
  'fr',
  true,
  true
);

-- Repeat for 'en' and 'nl' languages
```

### Step 2: Update Edge Function

Add new case in `supabase/functions/send-emails/index.ts`:

```typescript
case 'new_template_type':
  const templateLanguage = emailData.language || 'fr';
  const template = await getEmailTemplate('new_template_type', templateLanguage, emailData.user_id || null);
  
  if (template.success) {
    const variables = {
      variable1: emailData.data?.value1 || '',
      variable2: emailData.data?.value2 || '',
      company_name: 'Haliqo'
    };
    const rendered = renderTemplate(template.data, variables);
    emailResult = await sendEmail({
      from: fromEmail,
      to: [emailData.to],
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    });
  } else {
    throw new Error(`Email template 'new_template_type' not found in database for language '${templateLanguage}'. Please create the template in the email_templates table.`);
  }
  break;
```

### Step 3: Update Service Layer

Add function in `src/services/emailService.js`:

```javascript
static async sendNewTemplateEmail(data) {
  const language = localStorage.getItem('i18nextLng') || 'fr';
  
  return await this.sendEmailViaEdgeFunction('new_template_type', {
    language: language,
    to: data.recipientEmail,
    data: {
      value1: data.value1,
      value2: data.value2
    }
  });
}
```

### Step 4: Update Super Admin UI (Optional)

Add new template type to dropdown in `src/pages/admin/super/email-templates/index.jsx`:

```javascript
const getTemplateTypeName = (type) => {
  const names = {
    // ... existing types
    'new_template_type': 'New Template Name',
  };
  return names[type] || type;
};
```

---

## Troubleshooting

### Error: "Email template 'X' not found in database"

**Cause**: Template doesn't exist in `email_templates` table for the requested language.

**Solution**:
1. Go to Super Admin → Email Templates
2. Create template for the missing language
3. Ensure template is marked as `is_active = true`
4. Set `is_default = true` if it's the default template

### Email not sending

**Check**:
1. Template exists in database
2. Template is active (`is_active = true`)
3. All required variables are provided
4. Resend API keys are configured in Edge Function environment variables
5. Check Edge Function logs in Supabase dashboard

### Variables not replacing

**Check**:
1. Variable names match exactly (case-sensitive)
2. Variables are passed in the `variables` object
3. Template uses `{variable_name}` syntax (with curly braces)
4. No typos in variable names

### Wrong language template loading

**Check**:
1. User language is correctly set in `localStorage.getItem('i18nextLng')`
2. Template exists for that language in database
3. Template is active
4. Language code matches exactly ('fr', 'en', 'nl')

### Template not appearing in Super Admin UI

**Check**:
1. Template exists in database
2. RLS (Row Level Security) policies allow access
3. User has Super Admin permissions
4. Refresh the page

---

## Key Files Reference

### Service Files
- `src/services/emailService.js` - Main email service (uses client/user language preferences)
- `src/services/subscriptionNotificationService.js` - Subscription emails (uses user language preference)
- `src/services/contactService.js` - Contact form emails (uses browser/i18n language)
- `src/services/leadManagementService.js` - Lead management emails (uses artisan/user language)
- `src/services/invoiceFollowUpService.js` - Invoice follow-up service (uses client language)
- `src/services/clientsService.js` - Client service (saves/loads language preference)

### Edge Functions
- `supabase/functions/send-emails/index.ts` - Email sending & template fetching (with language filtering)
- `supabase/functions/followups-scheduler/index.ts` - Quote follow-up scheduling (uses client language)
- `supabase/functions/followups-dispatcher/index.ts` - Quote follow-up dispatching
- `supabase/functions/invoice-followups-scheduler/index.ts` - Invoice follow-up scheduling (uses client language)
- `supabase/functions/invoice-followups-dispatcher/index.ts` - Invoice follow-up dispatching

### Database
- `email_templates` table - Template storage
- `email_template_variables` table - Variable definitions (optional)
- `email_outbox` table - Email queue for retries

### UI
- `src/pages/admin/super/email-templates/index.jsx` - Super Admin template management

---

## Summary

**The email system:**
- ✅ Stores all templates in database (`email_templates` table)
- ✅ Supports 3 languages (French, English, Dutch)
- ✅ Uses variables for dynamic content (`{variable_name}`)
- ✅ Allows Super Admin customization via UI
- ✅ Throws clear errors if templates are missing (no silent fallbacks)
- ✅ Supports user-specific templates (via `user_id` field)
- ✅ Uses edge functions for secure email delivery
- ✅ Includes retry mechanism via `email_outbox` table

**All email types use the database template system for consistency and easy management!** 🚀

---

## Quick Reference

### Common Variables
- `{company_name}` - Company/platform name (usually "Haliqo")
- `{client_name}` - Client full name
- `{email}` - Email address
- `{submission_date}` - Date of submission

### Template Priority
1. User-specific template (if `user_id` provided and template exists)
2. Default template for requested language (from `client.language_preference` or `user.language_preference`)
3. Any active template for requested language
4. French default template (fallback if requested language not found)
5. Any active template (final fallback)
6. Error if no template found

### Language Codes
- `fr` - French (default)
- `en` - English
- `nl` - Dutch

### Template Status
- `is_active = true` - Template can be used
- `is_active = false` - Template is disabled
- `is_default = true` - Preferred template for the type/language
