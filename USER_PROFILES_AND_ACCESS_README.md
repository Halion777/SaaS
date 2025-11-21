# User Profiles & Access System

## Overview

The system uses a multi-user profile system where each user account can have multiple profiles with different roles and permissions. **All actions are performed by the parent user account** - profiles are **ONLY for access control** to determine which features/modules each profile can access. This allows teams to share a single account while maintaining granular access control per team member.

**Important:** Profiles are NOT separate user accounts. They are permission containers that control what features are accessible. All data, actions, and operations belong to the parent user account.

**Implementation Status:**
- ✅ Core profile system implemented and functional
- ✅ Permission checking logic implemented (`MultiUserContext.hasPermission()`)
- ✅ Profile management UI with translations (FR, EN, NL)
- ✅ Profile switching with PIN protection
- ✅ Subscription limit enforcement
- ⚠️ **Access control enforcement in UI pending** (see `PROFILE_ACCESS_CONTROL_IMPLEMENTATION_PLAN.md`)

**Note:** The permission system is fully implemented but not yet enforced in sidebar navigation, pages, and widgets. See implementation plan for complete access control rollout.

---

## User Account Structure

### 1. User Account (`users` table)
- **One account** per email address
- Contains subscription information
- Links to Stripe customer/subscription
- Has subscription status: `trial`, `active`, `past_due`, `cancelled`
- Default plan: `pro` (can be `starter` or `pro`)
- Additional fields: `company_name`, `phone`, `profession`, `country`, `business_size`, `vat_number`, `avatar_url`, `trial_start_date`, `trial_end_date`, `registration_completed`, `email_verified`, `analytics_objectives`

### 2. User Profiles (`user_profiles` table)
- **Multiple profiles** per user account (up to 10 for Pro plan, 1 for Starter plan)
- Each profile has its own:
  - Name and email
  - Role (admin, manager, accountant, sales, viewer)
  - Permissions (granular access control stored as JSONB)
  - PIN (optional, for profile switching security)
  - Avatar (stored in Supabase storage bucket `avatars`)
  - Active status (`is_active` - only one profile can be active at a time)
  - Last active timestamp (`last_active`)
  - Created/updated timestamps

---

## Subscription Plans

### Starter Plan
**Price:** €29.99/month or €299.88/year

**Features:**
- Up to 15 quotes per month
- Up to 15 invoices per month
- Client management
- Professional templates
- Email support

**Limitations:**
- ❌ No client lead generation
- ❌ No automatic reminders
- ❌ No multi-user access (1 profile only)
- ❌ No advanced analytics
- ❌ Limited AI features

**Profile Limits:**
- Max profiles: **1** (enforced in UI and backend)
- Max storage: **10GB**

**Subscription Status:**
- Users start with `trial` status (14-day free trial)
- After trial: `active`, `past_due`, or `cancelled`

### Pro Plan
**Price:** €49.99/month or €499.92/year

**Features:**
- ✅ Unlimited quotes and invoices
- ✅ Client management
- ✅ Professional templates
- ✅ Client lead generation
- ✅ Automatic reminders for unpaid invoices
- ✅ Multi-user support (up to 10 profiles)
- ✅ Priority support (email and chat)
- ✅ Advanced analytics and reporting
- ✅ Complete AI and optimizations
- ✅ Signature predictions
- ✅ Price optimization

**Profile Limits:**
- Max profiles: **10** (enforced in UI and backend)
- Max storage: **100GB**

**Subscription Status:**
- Users start with `trial` status (14-day free trial)
- After trial: `active`, `past_due`, or `cancelled`

---

## Profile Roles & Permissions

### Available Roles

#### 1. Admin
- **Full access** to all features
- Can manage other profiles (create, edit, delete)
- Can change subscription settings
- All permissions: `full_access` for all modules
- Cannot delete own profile (safety measure)

**Permissions:**
- Dashboard: `full_access`
- Analytics: `full_access`
- PEPPOL Access Point: `full_access` (only available for business users)
- Leads Management: `full_access`
- Quote Creation: `full_access`
- Quotes Management: `full_access`
- Quotes Follow-Up: `full_access`
- Invoices Follow-Up: `full_access`
- Client Invoices: `full_access`
- Supplier Invoices: `full_access`
- Client Management: `full_access`
- Credit Insurance: `full_access`
- Recovery: `full_access`

#### 2. Manager
- **Full access** to most features
- Cannot access PEPPOL
- Limited access to supplier invoices, credit insurance, recovery (view only)
- Permissions: Mix of `full_access` and `view_only`

**Permissions:**
- Dashboard: `full_access`
- Analytics: `full_access`
- PEPPOL Access Point: `no_access`
- Leads Management: `full_access`
- Quote Creation: `full_access`
- Quotes Management: `full_access`
- Quotes Follow-Up: `full_access`
- Invoices Follow-Up: `full_access`
- Client Invoices: `full_access`
- Supplier Invoices: `view_only`
- Client Management: `full_access`
- Credit Insurance: `view_only`
- Recovery: `view_only`

#### 3. Accountant
- **Full access** to financial features
- Focus: Invoices, analytics, financial management
- Limited access to quotes and leads (view only)
- Permissions: Financial features `full_access`, others `view_only`

**Permissions:**
- Dashboard: `view_only`
- Analytics: `full_access`
- PEPPOL Access Point: `view_only`
- Leads Management: `view_only`
- Quote Creation: `view_only`
- Quotes Management: `view_only`
- Quotes Follow-Up: `view_only`
- Invoices Follow-Up: `full_access`
- Client Invoices: `full_access`
- Supplier Invoices: `full_access`
- Client Management: `view_only`
- Credit Insurance: `view_only`
- Recovery: `view_only`

#### 4. Sales
- **Full access** to sales features
- Focus: Leads, quotes, client management
- No access to supplier invoices, credit insurance, recovery
- Permissions: Sales features `full_access`, others `view_only` or `no_access`

**Permissions:**
- Dashboard: `view_only`
- Analytics: `view_only`
- PEPPOL Access Point: `no_access`
- Leads Management: `full_access`
- Quote Creation: `full_access`
- Quotes Management: `view_only`
- Quotes Follow-Up: `view_only`
- Invoices Follow-Up: `view_only`
- Client Invoices: `view_only`
- Supplier Invoices: `no_access`
- Client Management: `full_access`
- Credit Insurance: `no_access`
- Recovery: `no_access`

#### 5. Viewer
- **Read-only access**
- Can view data but cannot create or edit
- No access to sensitive features (PEPPOL, credit insurance, recovery, supplier invoices)
- Permissions: Mostly `view_only` or `no_access`

**Permissions:**
- Dashboard: `view_only`
- Analytics: `view_only`
- PEPPOL Access Point: `no_access`
- Leads Management: `view_only`
- Quote Creation: `no_access`
- Quotes Management: `view_only`
- Quotes Follow-Up: `view_only`
- Invoices Follow-Up: `view_only`
- Client Invoices: `view_only`
- Supplier Invoices: `no_access`
- Client Management: `view_only`
- Credit Insurance: `no_access`
- Recovery: `no_access`

---

## Permission Levels

Each feature/module can have one of three permission levels:

1. **`no_access`** - Cannot access this feature at all (hidden from UI)
2. **`view_only`** - Can view but cannot create/edit/delete (read-only)
3. **`full_access`** - Full access (create, edit, delete, view)

### Available Features/Modules

The system supports 13 feature modules:

1. **Dashboard** (`dashboard`) - Main dashboard access
2. **Analytics** (`analytics`) - Reports and analytics
3. **PEPPOL Access Point** (`peppolAccessPoint`) - PEPPOL e-invoicing services (only available for business users, not individual/solo users)
4. **Leads Management** (`leadsManagement`) - Prospect and opportunity management
5. **Quote Creation** (`quoteCreation`) - Create new quotes
6. **Quotes Management** (`quotesManagement`) - Manage and track quotes
7. **Quotes Follow-Up** (`quotesFollowUp`) - Quote follow-ups and reminders
8. **Invoices Follow-Up** (`invoicesFollowUp`) - Invoice follow-ups and reminders
9. **Client Invoices** (`clientInvoices`) - Client invoice management
10. **Supplier Invoices** (`supplierInvoices`) - Supplier invoice management
11. **Client Management** (`clientManagement`) - Client database management
12. **Credit Insurance** (`creditInsurance`) - Credit insurance services
13. **Recovery** (`recovery`) - Recovery services

---

## Access Control Flow

```
User Account (Subscription Plan)
    ↓
    ├─→ Determines: Max profiles, Storage, Premium features
    ↓
User Profile (Role & Permissions)
    ↓
    ├─→ Determines: Feature access, Actions allowed
    ↓
Feature Access
    ├─→ Check subscription plan limits
    ├─→ Check profile permissions
    └─→ Grant or deny access
```

### How Access is Determined

1. **Subscription Check:**
   - Is user on Pro plan? → Can have multiple profiles (up to 10)
   - Is user on Starter plan? → Limited to 1 profile
   - Check subscription status (`trial`/`active`/`past_due`/`cancelled`)
   - Premium status determined by: `isPremiumAccount()` - Only Pro plan with active/trial subscription
   - `getSubscriptionLimits()` returns correct limits based on plan type and subscription status

2. **Profile Check:**
   - Get current active profile (only one can be active at a time)
   - Check profile role
   - Check profile permissions for specific feature
   - Admin role bypasses permission checks (always has full access)

3. **Feature Access:**
   - If subscription allows → Check profile permission
   - If profile has `full_access` → Allow all actions (create, edit, delete, view)
   - If profile has `view_only` → Allow view only (read-only)
   - If profile has `no_access` → Deny access (feature hidden from UI)
   - Special case: PEPPOL access also checks if user is a business user (not individual/solo)

---

## Profile Management

### Creating Profiles

**Starter Plan:**
- Can only have 1 profile (the admin profile created at registration)
- Cannot create additional profiles (enforced in UI and backend)
- If user tries to create more, they are prompted to upgrade to Pro plan

**Pro Plan:**
- Can create up to 10 profiles
- Each profile can have different role and permissions
- Profiles can be switched using PIN (optional security)
- New profiles are created with `is_active: false` (must be explicitly activated)

**Profile Creation Process:**
1. User selects a role template (admin, manager, accountant, sales, viewer)
2. System applies default permissions based on role template
3. User can customize permissions per module
4. Optional: Set PIN for profile switching
5. Optional: Upload avatar image
6. Profile is created with `is_active: false`
7. User must switch to the new profile to activate it

### Profile Switching

- Users can switch between profiles
- PIN required for profile switching (if PIN is set for the target profile)
- Only one profile can be active at a time
- When switching:
  1. All profiles for the user are deactivated
  2. Target profile is activated
  3. `last_active` timestamp is updated
  4. Profile ID is stored in `sessionStorage` for the current session
- Active profile determines current permissions
- Switching profiles changes available features in real-time

### Profile Permissions

- Set when creating profile (based on role template)
- Can be customized per profile (override role template defaults)
- Stored as JSONB object in `permissions` field
- Format: `{ "module_name": "permission_level" }`
- Example: `{ "dashboard": "full_access", "analytics": "view_only", "peppolAccessPoint": "no_access" }`

**Permission Storage:**
- Database stores permissions as JSONB object format
- Service layer supports both array and object formats (converts array to object)
- Initial profile creation uses array format, then converts to object
- Permission checks handle both formats for backward compatibility

### Profile Deletion

- Only admin role can delete profiles
- Admin cannot delete their own profile (safety measure)
- When profile is deleted:
  - Avatar is removed from storage (if exists)
  - Profile record is deleted from database
  - If deleted profile was active, system switches to admin profile (if available)

### Profile Avatars

- Stored in Supabase storage bucket: `avatars`
- File path format: `{userId}/{timestamp}.{extension}`
- When avatar is updated, old avatar is automatically deleted
- Avatar cleanup happens on profile deletion
- If no avatar, system generates initials from profile name

---

## Database Schema

### `users` Table
```sql
- id (UUID) - Primary key, references auth.users(id), ON DELETE CASCADE
- email (TEXT) - Unique email address
- full_name (TEXT) - User's full name
- company_name (TEXT) - Company name (optional)
- phone (TEXT) - Phone number
- profession (TEXT) - User's profession
- country (TEXT) - Default 'FR'
- business_size (TEXT) - Business size (solo, small, medium, large)
- selected_plan (TEXT) - 'starter' or 'pro', default 'pro'
- subscription_status (TEXT) - 'trial', 'active', 'past_due', 'cancelled', default 'trial'
- stripe_customer_id (TEXT) - Stripe customer ID
- stripe_subscription_id (TEXT) - Stripe subscription ID
- trial_start_date (TIMESTAMP WITH TIME ZONE) - Trial start date
- trial_end_date (TIMESTAMP WITH TIME ZONE) - Trial end date
- avatar_url (TEXT) - User avatar URL
- vat_number (TEXT) - VAT number
- role (TEXT) - 'admin' or 'superadmin' (user account role, not profile role), default 'admin'
- last_login_at (TIMESTAMP WITH TIME ZONE) - Last login timestamp
- registration_completed (BOOLEAN) - Registration completion status, default false
- email_verified (BOOLEAN) - Email verification status, default false
- email_verified_at (TIMESTAMP WITH TIME ZONE) - Email verification timestamp
- analytics_objectives (JSONB) - Analytics objectives and targets, default '{"clientTarget": null, "revenueTarget": null, "projectsTarget": null}'
- created_at (TIMESTAMP WITH TIME ZONE) - Creation timestamp, default now()
- updated_at (TIMESTAMP WITH TIME ZONE) - Last update timestamp, default now()

Constraints:
- users_pkey (PRIMARY KEY on id)
- users_email_key (UNIQUE on email)
- users_id_fkey (FOREIGN KEY to auth.users(id) ON DELETE CASCADE)
- users_role_check (CHECK: role = 'admin' OR role = 'superadmin')

Indexes:
- idx_users_analytics_objectives (GIN index on analytics_objectives)
- idx_users_email (btree on email)
- idx_users_subscription_status (btree on subscription_status)
- idx_users_trial_end_date (btree on trial_end_date)
- idx_users_stripe_customer_id (btree on stripe_customer_id)
- idx_users_stripe_subscription_id (btree on stripe_subscription_id)
- idx_users_vat_number (btree on vat_number)
- idx_users_email_verified (btree on email_verified)
```

### `user_profiles` Table
```sql
- id (UUID) - Primary key, default gen_random_uuid()
- user_id (UUID) - Foreign key to users(id), ON DELETE CASCADE, nullable
- name (TEXT) - Profile name (required)
- email (TEXT) - Profile email (optional, nullable)
- role (TEXT) - Profile role: 'admin', 'manager', 'accountant', 'sales', 'viewer'
- avatar (TEXT) - Avatar URL (stored in Supabase storage), nullable
- permissions (JSONB) - Permission object, default '{}'
  Format: { "module_name": "permission_level" }
  Example: { "dashboard": "full_access", "analytics": "view_only" }
- pin (TEXT) - PIN for profile switching (optional, nullable)
- is_active (BOOLEAN) - Active profile flag, default false
- last_active (TIMESTAMP WITH TIME ZONE) - Last active timestamp, nullable
- created_at (TIMESTAMP WITH TIME ZONE) - Creation timestamp, default now()
- updated_at (TIMESTAMP WITH TIME ZONE) - Last update timestamp, default now()

Constraints:
- user_profiles_pkey (PRIMARY KEY on id)
- user_profiles_user_id_fkey (FOREIGN KEY to users(id) ON DELETE CASCADE)

Indexes:
- idx_user_profiles_user_id (btree on user_id)
- idx_user_profiles_is_active (btree on is_active)
- idx_user_profiles_role (btree on role)
- idx_user_profiles_pin (btree on pin)
- idx_user_profiles_permissions_gin (GIN index on permissions for JSONB queries)
```

---

## Key Files & Implementation

### Services

#### `src/services/multiUserService.js`
**Purpose:** Core service for profile management operations

**Key Functions:**
- `getCurrentUser()` - Get current authenticated user
- `getUserProfile(userId)` - Get user account from users table
- `getCompanyProfiles(userId)` - Get all profiles for a user
- `getProfiles(userId)` - Alias for getCompanyProfiles
- `getCurrentProfile(userId)` - Get active profile for user (ensures only one active)
- `addProfile(userId, profileData)` - Create new profile (converts permissions to object format)
- `updateProfile(userId, profileId, profileData)` - Update existing profile
- `deleteProfile(userId, profileId)` - Delete profile (admin only, cannot delete own)
- `switchProfile(userId, profileId)` - Switch active profile (deactivates all, activates target)
- `getProfileById(userId, profileId)` - Get specific profile by ID
- `hasPermission(userId, module, requiredPermission = 'view')` - Check if user has specific permission for a module
- `getUserRole(userId)` - Get current profile's role
- `isPremiumAccount(userId)` - Check if account is premium (Pro plan with active/trial subscription)
- `getSubscriptionLimits(userId)` - Get subscription limits (max profiles, storage, features)
  - Returns limits based on plan type and subscription status
  - Starter: 1 profile, 10GB storage
  - Pro: 10 profiles, 100GB storage
- `uploadAvatar(userId, file)` - Upload avatar to Supabase storage
- `deleteAvatar(avatarUrl)` - Delete avatar from storage
- `updateProfileAvatar(userId, profileId, avatarUrl)` - Update profile avatar (with cleanup)
- `createInitialProfile(userId, userData)` - Create initial admin profile (uses object format for permissions)
- `cleanupUserAvatars(userId)` - Clean up all avatars for user

**Permission Handling:**
- Supports both array and object formats
- Converts array format to object format when storing
- Object format: `{ "module": "permission_level" }`
- Array format: `["module1", "module2"]` (converted to object with `full_access`)
- `addProfile()` checks subscription limits before creating profile
- `hasPermission()` updated to accept `module` and `requiredPermission` parameters

#### `src/services/registrationService.js`
**Purpose:** Handles user registration and initial profile creation

**Key Functions:**
- `createUserProfile(sessionData, userData)` - Creates initial admin profile during registration
  - Uses object format for permissions
  - Sets all permissions to `full_access`
  - Sets `is_active: true`
  - Checks for existing profile (idempotency)

### Context

#### `src/context/MultiUserContext.jsx`
**Purpose:** React context provider for multi-user profile state and functions

**State:**
- `currentProfile` - Currently active profile
- `companyProfiles` - All profiles for current user
- `isPremium` - Premium status (Pro plan with active/trial subscription)
- `subscriptionLimits` - Subscription limits object (fetched from service)
- `loading` - Loading state
- `permissions` - Current profile's permissions (object format)
- `userProfile` - User account data (fetched from service)

**Initialization:**
- Fetches user profile and subscription status on mount
- Gets subscription limits based on actual plan
- Loads all profiles and determines active profile
- Sets permissions state from current profile

**Functions:**
- `switchProfile(profileId)` - Switch to different profile
- `addProfile(profileData)` - Add new profile
- `updateProfile(profileId, profileData)` - Update profile
- `deleteProfile(profileId)` - Delete profile
- `uploadAvatar(file)` - Upload avatar
- `updateProfileAvatar(profileId, avatarUrl)` - Update profile avatar
- `uploadAndUpdateAvatar(profileId, file)` - Upload and update in one call
- `getCompanyProfiles()` - Refresh profiles list

**Permission Checks:**
- `hasPermission(module, requiredPermission = 'view')` - Check module permission
  - Returns `true` if profile has required permission level or higher
  - Admin role always returns `true` (bypass)
  - Supports `'view'`, `'view_only'`, and `'full_access'` as requiredPermission
  - Handles both array (legacy) and object (current) permission formats
- `getUserRole()` - Get current role
- `isAdmin()` - Check if admin role
- `canManageUsers()` - Check client management permission
- `canManageQuotes()` - Check quotes management permission
- `canManageInvoices()` - Check invoice management permission
- `canManageClients()` - Check client management permission
- `canViewAnalytics()` - Check analytics permission
- `canManageSettings()` - Check dashboard permission

**Utility Functions:**
- `getProfileAvatar(profile)` - Get avatar URL or generate initials
- `getRoleColor(role)` - Get role color for UI
- `getRoleLabel(role)` - Get role label in French

**Special Handling:**
- PEPPOL access checks `business_size` (must be 'small', 'medium', or 'large', not 'solo')
- Admin role always returns `true` for permission checks (bypasses all checks)
- Handles both array and object permission formats
- Permission levels: `no_access` < `view_only` < `full_access`
- `hasPermission()` supports granular permission level checking

### Pages

#### `src/pages/multi-user-profiles/index.jsx`
**Purpose:** UI page for managing profiles

**Features:**
- Display all profiles for current user
- Create new profile (with role template selection)
- Edit existing profile (permissions, PIN, avatar)
- Delete profile (admin only)
- Switch between profiles (with PIN verification if set)
- Upload/update profile avatars
- Role templates with predefined permissions
- Permission customization per module
- Subscription limit enforcement (max profiles)
- **Full translation support** (French, English, Dutch)
- All UI strings use i18n translation keys

**Role Templates:**
- Predefined templates for: admin, manager, accountant, sales, viewer
- Each template has default permissions
- Users can customize permissions after selecting template
- Templates use translations for labels and descriptions

**Translation Keys:**
- All module labels and descriptions: `multiUserProfiles.modules.*`
- All role names and descriptions: `multiUserProfiles.roles.*`
- All UI messages: `multiUserProfiles.messages.*`
- Modal content: `multiUserProfiles.modals.*`

#### `src/pages/subscription/index.jsx`
**Purpose:** Subscription management page

**Features:**
- Display current subscription plan
- Upgrade/downgrade subscription
- View subscription limits
- Manage billing

### Components

#### `src/components/ui/MainSidebar.jsx`
**Purpose:** Main navigation sidebar

**Features:**
- Profile switcher integration
- Shows current active profile
- Displays profile avatar
- **⚠️ Access control filtering not yet implemented** - All navigation items currently shown regardless of permissions
- **TODO:** Filter navigation items based on `hasPermission()` checks

#### `src/components/ui/ProfileSwitcher.jsx`
**Purpose:** Component for switching between profiles

**Features:**
- List of available profiles
- PIN verification for protected profiles (integrated with PinModal)
- Visual indication of active profile
- Automatically prompts for PIN if target profile has PIN set
- Handles PIN validation errors

#### `src/components/ui/MultiUserProfile.jsx`
**Purpose:** Profile display component

**Features:**
- Shows profile information
- Avatar display
- Role badge

#### `src/components/ui/PinModal.jsx`
**Purpose:** Modal for PIN verification

**Features:**
- PIN input for profile switching
- Security for sensitive operations

---

## Important Notes

1. **Profile Creation:**
   - First profile is created automatically during registration
   - Always created as `admin` role with all `full_access` permissions
   - Uses object format for permissions in both registration service and `createInitialProfile`
   - Additional profiles can only be created on Pro plan
   - New profiles are created with `is_active: false`
   - Subscription limits checked before profile creation (throws error if limit reached)
   - Profile creation converts array permissions to object format automatically

2. **Subscription Limits:**
   - Starter: 1 profile max (enforced in UI and backend)
   - Pro: 10 profiles max (enforced in UI and backend)
   - Limits checked in `getSubscriptionLimits()` function
   - Premium status: Only Pro plan with active/trial subscription (`isPremiumAccount()`)
   - `getSubscriptionLimits()` returns correct limits based on plan and subscription status
   - Profile creation enforces limits before allowing new profiles

3. **Permission Inheritance:**
   - Permissions are per-profile, not per-user
   - Switching profiles changes available features immediately
   - Admin profile always has full access (bypasses permission checks)
   - Permissions stored as JSONB object: `{ "module": "permission_level" }`
   - Service supports both array and object formats (converts array to object)

4. **Access Control:**
   - Check subscription plan first (max profiles, features)
   - Then check profile permissions (module access)
   - Admin role bypasses permission checks
   - PEPPOL access also checks `business_size` (must be business, not solo)
   - Permission checks in `MultiUserContext.hasPermission()`
   - **⚠️ Current Status:** Permission system implemented but not enforced in UI
   - **Missing:** Sidebar filtering, page-level checks, widget-level checks, route protection
   - **See:** `PROFILE_ACCESS_CONTROL_IMPLEMENTATION_PLAN.md` for complete implementation guide

5. **Active Profile Management:**
   - Only one profile can be active at a time
   - `getCurrentProfile()` ensures only one active profile exists
   - If multiple active profiles found, keeps first, deactivates others
   - If no active profile, activates first profile (if only one exists)
   - Profile switching deactivates all, then activates target

6. **Profile Deletion:**
   - Only admin role can delete profiles
   - Admin cannot delete own profile (safety measure)
   - Avatar is automatically deleted when profile is deleted
   - If deleted profile was active, system switches to admin profile

7. **Avatar Management:**
   - Stored in Supabase storage bucket: `avatars`
   - File path: `{userId}/{timestamp}.{extension}`
   - Old avatar automatically deleted when new one is uploaded
   - Cleanup on profile deletion
   - Initials generated if no avatar

---

## Example Scenarios

### Scenario 1: Starter Plan User
- Has 1 profile (admin, created at registration)
- Can access all features (within Starter limits: 15 quotes/invoices per month)
- Cannot create additional profiles (UI prevents, backend enforces)
- Limited to 15 quotes/invoices per month
- No lead generation, no automatic reminders
- Subscription status: `trial` (14 days) → `active` or `cancelled`

### Scenario 2: Pro Plan User (Single User)
- Can have up to 10 profiles
- Each profile can have different role
- Can switch between profiles (with PIN if set)
- Unlimited quotes/invoices
- Access to all premium features (lead generation, automatic reminders, analytics)
- Subscription status: `trial` (14 days) → `active` or `cancelled`

### Scenario 3: Multi-User Team (Pro Plan)
- **Parent user account:** Owns all data (quotes, invoices, clients, etc.)
- **Admin profile:** Full access to everything, can manage other profiles
- **Sales profile:** Full access to leads, quotes, clients; view-only for invoices; no access to supplier invoices, credit insurance, recovery
- **Accountant profile:** Full access to invoices, analytics, financials; view-only for quotes and leads
- **Viewer profile:** Read-only access to most data; no access to sensitive features
- **Important:** All profiles see the SAME data (quotes, invoices, clients) - profiles only control which features are accessible
- Each profile has its own permissions and can be switched
- PIN can be set for additional security on sensitive profiles

### Scenario 4: Profile Switching
1. User has 3 profiles: Admin, Sales, Accountant
2. Currently active: Admin
3. User wants to switch to Sales profile
4. If Sales profile has PIN set, user enters PIN
5. System deactivates Admin profile
6. System activates Sales profile
7. UI updates to show only features allowed by Sales permissions
8. `last_active` timestamp updated for Sales profile
9. **Important:** All data remains the same - only accessible features change

### Scenario 5: Permission Check Flow
1. User (Pro plan, active subscription) tries to access "Quotes Management"
2. System checks subscription: ✅ Pro plan allows access
3. System gets current active profile: Sales profile
4. System checks profile permissions: `quotesManagement: "view_only"`
5. **Current:** System grants access but limits to view-only (no create/edit/delete buttons)
6. **TODO:** Sidebar should hide item if `no_access`, page should redirect if no permission
7. If user switches to Admin profile, same check grants `full_access` (admin bypass)

**Note:** Permission checking logic is implemented but UI enforcement is pending. See implementation plan.

---

## Summary

- **User Account** = Subscription plan + billing + user metadata + **owns all data**
- **User Profile** = Role + permissions + access control (**ONLY for access control, not separate accounts**)
- **Starter Plan** = 1 profile max, limited features (15 quotes/invoices per month)
- **Pro Plan** = Up to 10 profiles, all features (unlimited quotes/invoices)
- **Access Control** = Subscription plan limits + Profile permissions
- **Permission Format** = JSONB object: `{ "module": "permission_level" }`
- **Active Profile** = Only one active at a time, determines current permissions
- **Admin Role** = Bypasses permission checks, can manage other profiles
- **Profile Switching** = Deactivates all, activates target, updates permissions in real-time
- **Data Ownership** = All data (quotes, invoices, clients) belongs to parent user account, shared across all profiles
- **Profile Purpose** = Profiles are permission containers only - they control feature access, not data ownership

---

## Translation Support

**Status:** ✅ Fully implemented for profile management page

**Translation Files:**
- `src/i18n/locales/fr.json` - French translations
- `src/i18n/locales/en.json` - English translations
- `src/i18n/locales/nl.json` - Dutch translations

**Translation Keys Structure:**
```
multiUserProfiles
├── title, subtitle, loading, addProfile
├── premiumAccount (title, description, profilesCreated)
├── currentProfile (title, role, status, active, switchHint)
├── noProfile (title, description)
├── noProfilesConfigured (title, description, createFirst)
├── permissions, changeAvatar, selectImage, imageDescription
├── modals
│   ├── addProfile (all form labels and hints)
│   └── editProfile (title, subtitle, updateProfile, changesApplied)
├── modules (all 13 modules with label and description)
├── roles (all 5 roles with name and description)
└── messages (all success/error messages)
```

**Reference:** `src/pages/multi-user-profiles/index.jsx` uses `t('multiUserProfiles.*')` for all strings

---

## Access Control Implementation Status

**Current State:**
- ✅ Permission checking logic: Fully implemented and tested
- ✅ Profile management: Complete with translations
- ✅ Profile switching: Working with PIN protection
- ⚠️ **UI Enforcement: Not yet implemented**

**What's Missing:**
1. **Sidebar Navigation:** All items shown regardless of permissions
2. **Page Access:** No permission checks before rendering pages
3. **Widget Visibility:** Dashboard widgets shown to all users
4. **Action Buttons:** Create/edit/delete buttons not disabled for `view_only` users
5. **Route Protection:** No route guards checking permissions

**Implementation Plan:**
See `PROFILE_ACCESS_CONTROL_IMPLEMENTATION_PLAN.md` for:
- Step-by-step implementation guide
- Code examples for each component
- File references and line numbers
- Testing checklist
- Quick reference guide

**Priority Order:**
1. Sidebar filtering (highest visibility impact)
2. Route protection (security foundation)
3. Page-level checks (user experience)
4. Widget-level checks (dashboard)
5. Action-level checks (button states)

---

## Technical Implementation Details

### Permission Storage Format

**Database (JSONB):**
```json
{
  "dashboard": "full_access",
  "analytics": "view_only",
  "peppolAccessPoint": "no_access",
  "leadsManagement": "full_access",
  "quoteCreation": "full_access",
  "quotesManagement": "view_only",
  "quotesFollowUp": "view_only",
  "invoicesFollowUp": "view_only",
  "clientInvoices": "view_only",
  "supplierInvoices": "no_access",
  "clientManagement": "full_access",
  "creditInsurance": "no_access",
  "recovery": "no_access"
}
```

**Service Layer Conversion:**
- Array format: `["dashboard", "analytics", "leadsManagement"]` 
- Converts to: `{ "dashboard": "full_access", "analytics": "full_access", "leadsManagement": "full_access", ... }`
- All other modules set to `"no_access"`
- Conversion happens in `addProfile()` and `updateProfile()` functions
- `createInitialProfile()` now uses object format directly (updated)

### Profile Activation Logic

1. On login/initialization: `getCurrentProfile(userId)`
2. Query: `SELECT * FROM user_profiles WHERE user_id = ? AND is_active = true`
3. If 0 results: Get first profile, activate it
4. If 1 result: Return it
5. If >1 results: Keep first, deactivate others (data integrity fix)

### Subscription Limit Enforcement

**Backend Check:**
```javascript
const limits = await getSubscriptionLimits(userId);
if (limits.maxProfiles <= currentProfileCount) {
  throw new Error('Profile limit reached');
}
```

**UI Check:**
- Disable "Add Profile" button if limit reached
- Show upgrade prompt for Starter plan users

### Permission Check Implementation

**Location:** `src/context/MultiUserContext.jsx` (lines 243-294)

```javascript
hasPermission(module, requiredPermission = 'view') {
  // Admin bypass
  if (currentProfile.role === 'admin') return true;
  
  // Special handling for PEPPOL - check business_size
  if (module === 'peppolAccessPoint') {
    const businessSizes = ['small', 'medium', 'large'];
    const isBusiness = businessSizes.includes(userProfile?.business_size);
    if (!isBusiness) return false;
  }
  
  // Get permissions (handle both formats)
  let permissions = currentProfile.permissions;
  
  // Array format (legacy) - if module in array, means full_access
  if (Array.isArray(permissions)) {
    return permissions.includes(module);
  }
  
  // Object format (current) - check permission level
  if (typeof permissions === 'object' && permissions !== null) {
    const modulePermission = permissions[module];
    
    if (!modulePermission || modulePermission === 'no_access') {
      return false;
    }
    
    // If requiredPermission is 'view' or 'view_only', allow both view_only and full_access
    if (requiredPermission === 'view' || requiredPermission === 'view_only') {
      return modulePermission === 'view_only' || modulePermission === 'full_access';
    }
    
    // If requiredPermission is 'full_access', only allow full_access
    if (requiredPermission === 'full_access') {
      return modulePermission === 'full_access';
    }
    
    // Default: check if permission exists and is not 'no_access'
    return modulePermission !== 'no_access';
  }
  
  return false;
}
```

**Service Layer:** `src/services/multiUserService.js` (lines 375-421)
- Same logic as context, but async function
- Signature: `hasPermission(userId, module, requiredPermission = 'view')`

---

## Recent Updates & Fixes

### Permission System Improvements
1. **`hasPermission()` Function Signature:**
   - Updated to accept `module` and `requiredPermission` parameters
   - Supports granular permission level checking (`'view'`, `'view_only'`, `'full_access'`)
   - Improved logic for handling permission hierarchies
   - **Files:** `src/context/MultiUserContext.jsx`, `src/services/multiUserService.js`

2. **Subscription Limits Logic:**
   - Fixed `getSubscriptionLimits()` to return correct limits based on plan
   - Fixed `isPremiumAccount()` to only return true for Pro plan with active/trial subscription
   - Added limit checking in `addProfile()` before profile creation
   - **Files:** `src/services/multiUserService.js`

3. **Profile Initialization:**
   - `createInitialProfile()` now uses object format for permissions (not array)
   - `MultiUserContext.initializeMultiUser()` fetches user profile and subscription limits
   - Ensures accurate `isPremium` and `subscriptionLimits` state
   - **Files:** `src/services/multiUserService.js`, `src/context/MultiUserContext.jsx`

4. **ProfileSwitcher PIN Integration:**
   - Integrated PIN verification in profile switching flow
   - Automatically opens PinModal if target profile has PIN
   - Handles PIN validation errors gracefully
   - **Files:** `src/components/ui/ProfileSwitcher.jsx`, `src/pages/multi-user-profiles/index.jsx`

## Implementation Status & Next Steps

### ✅ Completed

1. **Core Profile System:**
   - Profile CRUD operations
   - Profile switching with PIN protection
   - Avatar management
   - Subscription limit enforcement
   - Permission checking logic

2. **UI Implementation:**
   - Profile management page (`/multi-user-profiles`)
   - Profile switcher component
   - PIN modal for secure switching
   - Full translation support (FR, EN, NL)

3. **Service Layer:**
   - Permission format conversion (array ↔ object)
   - Subscription status checking
   - Profile activation logic
   - Avatar cleanup

### ⚠️ Pending Implementation

**Access Control Enforcement:**
- Sidebar navigation filtering (hide items with `no_access`)
- Page-level permission checks (redirect if no access)
- Widget-level permission checks (conditional rendering)
- Route protection (ProtectedRoute component)
- Action button state management (disable for `view_only`)

**Reference:** See `PROFILE_ACCESS_CONTROL_IMPLEMENTATION_PLAN.md` for detailed implementation guide with code examples and file references.

### What Profiles Are NOT For

**Profiles are ONLY for access control. They are NOT:**
- ❌ Separate user accounts (all actions belong to parent user)
- ❌ Profile-specific data storage (all data belongs to parent user)
- ❌ Profile-specific settings or preferences
- ❌ Profile activity logging or tracking
- ❌ Profile expiration dates or time restrictions
- ❌ Profile-based data filtering (quotes/invoices are shared across all profiles)
- ❌ Bulk profile operations
- ❌ Profile customization by super admin beyond role templates

**Profiles ARE:**
- ✅ Permission containers that control feature access
- ✅ Role-based access control (admin, manager, accountant, sales, viewer)
- ✅ Module-level permission control (13 feature modules)
- ✅ PIN-protected profile switching for security
- ✅ Visual identity (avatar, name) for team member recognition

**All data and actions belong to the parent user account. Profiles only determine what features are visible and accessible.**
