# Language Preference Implementation Plan

## 📋 Overview

This document outlines the implementation plan for adding language preference functionality to the system. The goal is to allow clients and users to set their preferred language, and automatically send emails in their preferred language.

---

## 🎯 Objectives

1. **Add language preference to `clients` table** - Store client's preferred language
2. **Add language preference to `users` table** - Store user's preferred language
3. **Add language selection UI** in:
   - Quote creation (client selection/creation)
   - Client management (create/edit client)
   - Find artisan page (lead creation)
4. **Use client language for client emails** - All emails to clients use their preferred language
5. **Use user language for "copy to me" emails** - Copy emails use user's preferred language

---

## 📊 Database Changes

### Step 1: Add `language_preference` to `clients` table

**SQL Migration:**
```sql
-- Add language_preference column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'fr';

-- Add comment
COMMENT ON COLUMN public.clients.language_preference IS 'Client preferred language code: fr, en, nl. Default: fr';

-- Create index for filtering (optional, if needed for queries)
CREATE INDEX IF NOT EXISTS idx_clients_language_preference 
ON public.clients(language_preference);
```

**Field Details:**
- **Type:** `VARCHAR(10)`
- **Default:** `'fr'` (French)
- **Allowed Values:** `'fr'`, `'en'`, `'nl'`
- **Nullable:** No (always has a value)

---

### Step 2: Add `language_preference` to `users` table

**SQL Migration:**
```sql
-- Add language_preference column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS language_preference VARCHAR(10) DEFAULT 'fr';

-- Add comment
COMMENT ON COLUMN public.users.language_preference IS 'User preferred language code: fr, en, nl. Default: fr';

-- Create index for filtering (optional, if needed for queries)
CREATE INDEX IF NOT EXISTS idx_users_language_preference 
ON public.users(language_preference);
```

**Field Details:**
- **Type:** `VARCHAR(10)`
- **Default:** `'fr'` (French)
- **Allowed Values:** `'fr'`, `'en'`, `'nl'`
- **Nullable:** No (always has a value)

---

## 🎨 Frontend Changes

### Step 3: Update Client Creation Form (Quote Creation)

**File:** `src/pages/quote-creation/components/ClientSelection.jsx`

**Changes Required:**

1. **Add language field to `newClient` state:**
```javascript
const [newClient, setNewClient] = useState({
  name: '',
  type: 'particulier',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  postalCode: '',
  contactPerson: '',
  companySize: '',
  regNumber: '',
  peppolId: '',
  enablePeppol: false,
  preferences: [],
  languagePreference: 'fr' // Add this field
});
```

2. **Add language selector in form:**
```jsx
{/* Language Preference */}
<div className="space-y-2">
  <label className="block text-sm font-medium text-foreground">
    {t('quoteCreation.clientSelection.languagePreference', 'Language Preference')}
  </label>
  <Select
    value={newClient.languagePreference}
    onChange={(e) => handleInputChange('languagePreference', e.target.value)}
    options={[
      { value: 'fr', label: '🇫🇷 Français' },
      { value: 'en', label: '🇬🇧 English' },
      { value: 'nl', label: '🇳🇱 Nederlands' }
    ]}
  />
  <p className="text-xs text-muted-foreground">
    {t('quoteCreation.clientSelection.languagePreferenceHelp', 'Emails will be sent in this language')}
  </p>
</div>
```

3. **Update form reset:**
```javascript
setNewClient({ 
  name: '', 
  type: 'particulier', 
  email: '', 
  phone: '', 
  address: '', 
  city: '',
  country: '',
  postalCode: '',
  contactPerson: '', 
  companySize: '',
  regNumber: '',
  peppolId: '',
  enablePeppol: false,
  preferences: [],
  languagePreference: 'fr' // Add this
});
```

4. **Update lead data loading** (if leadId exists):
```javascript
// When loading lead data, set language preference
// Default to 'fr' if not specified in lead
if (leadData) {
  setNewClient(prev => ({
    ...prev,
    languagePreference: leadData.language_preference || 'fr'
  }));
}
```

---

### Step 4: Update Client Service

**File:** `src/services/clientsService.js`

**Changes Required:**

1. **Update `createClient` function:**
```javascript
export async function createClient(clientData) {
  try {
    // ... existing code ...
    
    const mappedData = {
      user_id: user.id,
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      address: clientData.address,
      city: clientData.city,
      country: clientData.country,
      postal_code: clientData.postalCode,
      client_type: clientData.type === 'professionnel' ? 'company' : 'individual',
      contact_person: clientData.contactPerson,
      company_size: clientData.companySize,
      vat_number: clientData.regNumber,
      peppol_id: clientData.peppolId,
      peppol_enabled: clientData.enablePeppol,
      communication_preferences: clientData.preferences || [],
      language_preference: clientData.languagePreference || 'fr', // Add this
      is_active: true
    };
    
    // ... rest of the function ...
  }
}
```

2. **Update `updateClient` function:**
```javascript
export async function updateClient(id, clientData) {
  try {
    // ... existing code ...
    
    const mappedData = {
      // ... existing fields ...
      language_preference: clientData.languagePreference || 'fr' // Add this
    };
    
    // ... rest of the function ...
  }
}
```

3. **Update `fetchClients` function** (if needed):
```javascript
// Ensure language_preference is included in SELECT
const { data, error } = await supabase
  .from('clients')
  .select('*, language_preference') // Add language_preference
  // ... rest of query ...
```

---

### Step 5: Update Client Management Page

**File:** `src/pages/client-management/index.jsx`

**Changes Required:**

1. **Add language field to client form state**
2. **Add language selector in client modal/form**
3. **Include language_preference when creating/updating clients**

**Implementation:**
- Find the client modal/form component
- Add language preference dropdown
- Map to `languagePreference` field
- Pass to `createClient`/`updateClient` functions

---

### Step 6: Update Find Artisan Page (Lead Creation)

**File:** `src/pages/find-artisan/index.jsx`

**Changes Required:**

1. **Add language field to form state:**
```javascript
const [formData, setFormData] = useState({
  // ... existing fields ...
  languagePreference: 'fr' // Add this
});
```

2. **Add language selector in form:**
```jsx
{/* Language Preference */}
<div className="space-y-2">
  <label className="block text-sm font-medium">
    {t('findArtisan.languagePreference', 'Preferred Language')}
  </label>
  <Select
    value={formData.languagePreference}
    onChange={(e) => handleInputChange('languagePreference', e.target.value)}
    options={[
      { value: 'fr', label: '🇫🇷 Français' },
      { value: 'en', label: '🇬🇧 English' },
      { value: 'nl', label: '🇳🇱 Nederlands' }
    ]}
  />
</div>
```

3. **Update lead creation:**
```javascript
// In handleSubmit or form submission
await LeadManagementService.createLeadRequest({
  // ... existing fields ...
  languagePreference: formData.languagePreference || 'fr'
});
```

---

### Step 7: Update Lead Management Service

**File:** `src/services/leadManagementService.js`

**Changes Required:**

1. **Update `createLeadRequest` function:**
```javascript
static async createLeadRequest(leadData) {
  try {
    const { data, error } = await supabase
      .from('lead_requests')
      .insert({
        // ... existing fields ...
        // Note: language_preference will be stored in client record when quote is created
        // For now, we can store it in communication_preferences JSONB
        communication_preferences: {
          ...leadData.communicationPreferences,
          language_preference: leadData.languagePreference || 'fr'
        }
      })
      // ... rest of function ...
  }
}
```

**Note:** Since `lead_requests` doesn't have a `language_preference` field, we can store it in `communication_preferences` JSONB, and then use it when creating the client from lead.

---

### Step 8: Update Database Function for Lead-to-Client Creation

**File:** `lead-management.sql` (or create new migration)

**Changes Required:**

1. **Update `create_client_from_lead` function:**
```sql
CREATE OR REPLACE FUNCTION public.create_client_from_lead(
    lead_uuid UUID,
    artisan_user_uuid UUID
)
RETURNS UUID AS $$
DECLARE
    lead_data RECORD;
    new_client_id UUID;
    client_language VARCHAR(10);
BEGIN
    -- Get lead data
    SELECT 
        client_name,
        client_email,
        client_phone,
        client_address,
        city,
        zip_code,
        communication_preferences
    INTO lead_data
    FROM public.lead_requests
    WHERE id = lead_uuid;
    
    -- Extract language preference from communication_preferences
    client_language := COALESCE(
        lead_data.communication_preferences->>'language_preference',
        'fr'
    );
    
    -- Check if client already exists for this artisan
    SELECT id INTO new_client_id
    FROM public.clients
    WHERE user_id = artisan_user_uuid 
    AND email = lead_data.client_email
    LIMIT 1;
    
    -- If client doesn't exist, create new one
    IF new_client_id IS NULL THEN
        INSERT INTO public.clients (
            user_id,
            name,
            email,
            phone,
            address,
            city,
            country,
            postal_code,
            client_type,
            contact_person,
            company_size,
            vat_number,
            peppol_id,
            peppol_enabled,
            communication_preferences,
            language_preference, -- Add this
            is_active
        ) VALUES (
            artisan_user_uuid,
            lead_data.client_name,
            lead_data.client_email,
            lead_data.client_phone,
            lead_data.client_address,
            NULL,
            NULL,
            NULL,
            'individual',
            NULL,
            NULL,
            NULL,
            NULL,
            false,
            lead_data.communication_preferences,
            client_language, -- Add this
            true
        ) RETURNING id INTO new_client_id;
    ELSE
        -- Update existing client's language preference if not set
        UPDATE public.clients
        SET language_preference = COALESCE(language_preference, client_language)
        WHERE id = new_client_id
        AND language_preference IS NULL;
    END IF;
    
    RETURN new_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📧 Email Service Updates

### Step 9: Update Email Service to Use Client Language

**File:** `src/services/emailService.js`

**Changes Required:**

1. **Update `sendQuoteSentEmail` function:**
```javascript
static async sendQuoteSentEmail(quote, client, companyProfile, userId = null, customEmailData = null) {
  try {
    // ... existing code ...
    
    // Get client's language preference (default to 'fr')
    const clientLanguage = client.language_preference || client.languagePreference || 'fr';
    
    // ... existing variables setup ...
    
    // Send email to client using client's language
    let clientEmailResult;
    if (customEmailData) {
      clientEmailResult = await this.sendCustomQuoteEmail(
        variables, 
        recipientEmail, 
        userId, 
        customEmailData, 
        clientLanguage // Use client language instead of user language
      );
    } else {
      const defaultEmailData = {
        subject: emailSubject,
        message: emailMessage
      };
      clientEmailResult = await this.sendCustomQuoteEmail(
        variables, 
        recipientEmail, 
        userId, 
        defaultEmailData, 
        clientLanguage // Use client language instead of user language
      );
    }
    
    // If sendCopy is enabled, send copy using USER's language preference
    if (customEmailData?.sendCopy && user?.email && clientEmailResult.success) {
      // Get user's language preference
      const { data: userData } = await supabase
        .from('users')
        .select('language_preference')
        .eq('id', userId)
        .single();
      
      const userLanguage = userData?.language_preference || 
                          localStorage.getItem('i18nextLng')?.split('-')[0] || 
                          'fr';
      
      await this.sendCustomQuoteEmail(
        variables,
        user.email,
        userId,
        { ...customEmailData, subject: `[Copie] ${emailSubject}` },
        userLanguage // Use user's language for copy
      );
    }
    
    // ... rest of function ...
  }
}
```

2. **Update `sendDraftQuoteMarkedAsSentEmail` function:**
```javascript
static async sendDraftQuoteMarkedAsSentEmail(quote, client, companyProfile, userId = null, customEmailData = null) {
  try {
    // ... existing code ...
    
    // Get client's language preference
    const clientLanguage = client.language_preference || client.languagePreference || 'fr';
    
    // Use client language for email
    const clientEmailResult = await this.sendCustomQuoteEmail(
      variables,
      recipientEmail,
      userId,
      customEmailData || defaultEmailData,
      clientLanguage // Use client language
    );
    
    // Copy email uses user's language
    if (customEmailData?.sendCopy && user?.email) {
      const { data: userData } = await supabase
        .from('users')
        .select('language_preference')
        .eq('id', userId)
        .single();
      
      const userLanguage = userData?.language_preference || 
                          localStorage.getItem('i18nextLng')?.split('-')[0] || 
                          'fr';
      
      await this.sendCustomQuoteEmail(
        variables,
        user.email,
        userId,
        { ...customEmailData, subject: `[Copie] ${emailSubject}` },
        userLanguage
      );
    }
    
    // ... rest of function ...
  }
}
```

---

### Step 10: Update Invoice Email Sending

**File:** `src/pages/invoices-management/components/SendEmailModal.jsx`

**Changes Required:**

1. **Fetch client language when loading invoice:**
```javascript
useEffect(() => {
  if (invoice) {
    // Fetch client data including language_preference
    const fetchClientData = async () => {
      const { data: clientData } = await supabase
        .from('clients')
        .select('language_preference')
        .eq('id', invoice.client_id)
        .single();
      
      // Store client language for email sending
      setClientLanguage(clientData?.language_preference || 'fr');
    };
    
    fetchClientData();
  }
}, [invoice]);
```

2. **Use client language for client email:**
```javascript
// Send email to client using client's language
const clientLanguage = clientLanguage || 'fr';

// For invoice emails, we need to fetch template in client's language
// Since invoice emails use templated_email type, we need to:
// 1. Fetch invoice template in client's language
// 2. Render template with variables
// 3. Send email

const result = await EmailService.sendEmailViaEdgeFunction('templated_email', {
  client_email: emailData.clientEmail,
  subject: emailData.subject,
  html: emailHtml,
  text: emailData.message,
  language: clientLanguage, // Pass client language
  attachments: [/* ... */]
});
```

3. **Use user language for copy email:**
```javascript
// If sendCopy is enabled, send copy using user's language
if (emailData.sendCopy && user?.email && result.success) {
  // Get user's language preference
  const { data: userData } = await supabase
    .from('users')
    .select('language_preference')
    .eq('id', user.id)
    .single();
  
  const userLanguage = userData?.language_preference || 
                      i18n.language?.split('-')[0] || 
                      'fr';
  
  await EmailService.sendEmailViaEdgeFunction('templated_email', {
    client_email: user.email,
    subject: `[Copie] ${emailData.subject}`,
    html: emailHtml,
    text: emailData.message,
    language: userLanguage, // Use user's language
    attachments: [/* ... */]
  });
}
```

---

### Step 11: Update Automated Email Sending

**Files to Update:**
- Database triggers that send emails
- Edge functions that send automated emails

**Changes Required:**

1. **Quote Accepted/Rejected Emails (Database Trigger):**
   - Update trigger to fetch client's `language_preference`
   - Pass language to email template fetching

2. **Follow-up Emails:**
   - Update follow-up dispatcher to use client's language
   - Fetch client language from `clients` table via `quotes.client_id`

3. **Welcome Emails:**
   - When creating client from lead, use language from lead's `communication_preferences`
   - When creating client manually, use selected language

---

## 🔄 User Language Preference Sync

### Step 12: Sync User Language with Settings

**File:** User settings/language preference component

**Changes Required:**

1. **Update user language preference when user changes language in settings:**
```javascript
// When user changes language in UI settings
const handleLanguageChange = async (newLanguage) => {
  // Update localStorage
  localStorage.setItem('i18nextLng', newLanguage);
  
  // Update database
  const { error } = await supabase
    .from('users')
    .update({ 
      language_preference: newLanguage.split('-')[0] // 'fr-FR' -> 'fr'
    })
    .eq('id', user.id);
  
  if (error) {
    console.error('Error updating user language preference:', error);
  }
};
```

2. **Load user language preference on app start:**
```javascript
// On app initialization
useEffect(() => {
  const loadUserLanguage = async () => {
    const { data: userData } = await supabase
      .from('users')
      .select('language_preference')
      .eq('id', user.id)
      .single();
    
    if (userData?.language_preference) {
      // Set i18n language
      i18n.changeLanguage(userData.language_preference);
      localStorage.setItem('i18nextLng', userData.language_preference);
    }
  };
  
  if (user) {
    loadUserLanguage();
  }
}, [user]);
```

---

## 📝 Translation Updates

### Step 13: Add Translation Keys

**Files:** `src/i18n/locales/en.json`, `src/i18n/locales/fr.json`, `src/i18n/locales/nl.json`

**Add Keys:**
```json
{
  "quoteCreation": {
    "clientSelection": {
      "languagePreference": "Language Preference",
      "languagePreferenceHelp": "Emails will be sent in this language"
    }
  },
  "clientManagement": {
    "languagePreference": "Language Preference",
    "languagePreferenceHelp": "Emails will be sent in this language"
  },
  "findArtisan": {
    "languagePreference": "Preferred Language",
    "languagePreferenceHelp": "We will communicate with you in this language"
  }
}
```

---

## 🧪 Testing Checklist

### Database
- [ ] `language_preference` column added to `clients` table
- [ ] `language_preference` column added to `users` table
- [ ] Default value is 'fr' for both tables
- [ ] Indexes created (if needed)
- [ ] Database function `create_client_from_lead` updated

### Frontend - Client Creation
- [ ] Language selector added to quote creation client form
- [ ] Language selector added to client management form
- [ ] Language selector added to find artisan form
- [ ] Language preference saved when creating client
- [ ] Language preference saved when updating client
- [ ] Language preference loaded when editing client

### Frontend - Lead to Client
- [ ] Language preference extracted from lead's `communication_preferences`
- [ ] Language preference saved when creating client from lead
- [ ] Default language ('fr') used if not specified

### Email Sending
- [ ] Client emails use client's `language_preference`
- [ ] Copy emails use user's `language_preference`
- [ ] Quote sent emails use client language
- [ ] Invoice sent emails use client language
- [ ] Automated emails (accepted/rejected) use client language
- [ ] Follow-up emails use client language
- [ ] Welcome emails use client language

### User Language Sync
- [ ] User language preference synced with database
- [ ] User language loaded from database on app start
- [ ] Language change in settings updates database

### Edge Cases
- [ ] Client without language preference defaults to 'fr'
- [ ] User without language preference defaults to 'fr'
- [ ] Lead without language preference defaults to 'fr'
- [ ] Email template not found in client language falls back to 'fr'
- [ ] Copy email uses user's language even if client language is different

---

## 📋 Implementation Order

### Phase 1: Database Setup
1. ✅ Add `language_preference` to `clients` table
2. ✅ Add `language_preference` to `users` table
3. ✅ Update `create_client_from_lead` function

### Phase 2: Frontend - Client Creation
4. ✅ Update `ClientSelection` component (quote creation)
5. ✅ Update client management page
6. ✅ Update `clientsService.js` to include language_preference
7. ✅ Update find artisan page

### Phase 3: Email Service Updates
8. ✅ Update `sendQuoteSentEmail` to use client language
9. ✅ Update `sendDraftQuoteMarkedAsSentEmail` to use client language
10. ✅ Update invoice email sending to use client language
11. ✅ Update automated email triggers to use client language

### Phase 4: User Language Sync
12. ✅ Sync user language preference with database
13. ✅ Load user language on app start

### Phase 5: Testing & Validation
14. ✅ Test all email sending scenarios
15. ✅ Test language fallbacks
16. ✅ Test copy email functionality

---

## 🔍 Key Considerations

### Language Detection Priority

**For Client Emails:**
1. Client's `language_preference` (from database)
2. Fallback to 'fr' if not set

**For Copy Emails:**
1. User's `language_preference` (from database)
2. Fallback to `localStorage.getItem('i18nextLng')`
3. Fallback to 'fr'

### Backward Compatibility

- Existing clients without `language_preference` will default to 'fr'
- Existing users without `language_preference` will default to 'fr'
- All email templates must exist in all 3 languages (fr, en, nl)

### Migration Strategy

1. **Add columns with default 'fr'** - No data migration needed
2. **Update existing records** (optional):
   ```sql
   -- Set language based on country or other criteria (if needed)
   UPDATE clients 
   SET language_preference = CASE 
     WHEN country = 'BE' THEN 'fr'
     WHEN country = 'NL' THEN 'nl'
     ELSE 'fr'
   END
   WHERE language_preference IS NULL;
   ```

---

## 📚 Related Files

### Database
- `clients` table schema
- `users` table schema
- `lead-management.sql` (create_client_from_lead function)

### Frontend
- `src/pages/quote-creation/components/ClientSelection.jsx`
- `src/pages/client-management/index.jsx`
- `src/pages/find-artisan/index.jsx`
- `src/services/clientsService.js`
- `src/services/leadManagementService.js`

### Email Services
- `src/services/emailService.js`
- `src/pages/invoices-management/components/SendEmailModal.jsx`
- `supabase/functions/send-emails/index.ts`

### Translations
- `src/i18n/locales/en.json`
- `src/i18n/locales/fr.json`
- `src/i18n/locales/nl.json`

---

## ✅ Success Criteria

1. ✅ Clients can set language preference when created/edited
2. ✅ Users can set language preference in settings
3. ✅ All client emails sent in client's preferred language
4. ✅ All copy emails sent in user's preferred language
5. ✅ Language preference persists in database
6. ✅ Language preference loads correctly on page refresh
7. ✅ Fallback to 'fr' works if language not set
8. ✅ All email templates available in all 3 languages

---

## 🚀 Summary

This implementation will:
- Add language preference fields to `clients` and `users` tables
- Add language selection UI in all client creation points
- Update email services to use client/user language preferences
- Ensure copy emails use user's language, not client's language
- Maintain backward compatibility with default 'fr' language

