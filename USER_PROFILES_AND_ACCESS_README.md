# User Profiles & Access System

## Overview

The system uses a multi-user profile system where each user account can have multiple profiles with different roles and permissions. Access to features is controlled by both subscription plan and profile permissions.

---

## User Account Structure

### 1. User Account (`users` table)
- **One account** per email address
- Contains subscription information
- Links to Stripe customer/subscription
- Has subscription status: `trial`, `active`, `past_due`, `cancelled`

### 2. User Profiles (`user_profiles` table)
- **Multiple profiles** per user account
- Each profile has its own:
  - Name and email
  - Role (admin, manager, accountant, sales, viewer)
  - Permissions (granular access control)
  - PIN (for profile switching)
  - Avatar

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
- Max profiles: **1**
- Max storage: **10GB**

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
- Max profiles: **10**
- Max storage: **100GB**

---

## Profile Roles & Permissions

### Available Roles

#### 1. Admin
- **Full access** to all features
- Can manage other profiles
- Can change subscription settings
- All permissions: `full_access`

#### 2. Manager
- **Full access** to most features
- Cannot access PEPPOL
- Limited access to supplier invoices, credit insurance, recovery
- Permissions: Mix of `full_access` and `view_only`

#### 3. Accountant
- **Full access** to financial features
- Focus: Invoices, analytics, financial management
- Limited access to quotes and leads
- Permissions: Financial features `full_access`, others `view_only`

#### 4. Sales
- **Full access** to sales features
- Focus: Leads, quotes, client management
- No access to supplier invoices, credit insurance, recovery
- Permissions: Sales features `full_access`, others `view_only` or `no_access`

#### 5. Viewer
- **Read-only access**
- Can view data but cannot create or edit
- No access to sensitive features
- Permissions: Mostly `view_only` or `no_access`

---

## Permission Levels

Each feature can have one of three permission levels:

1. **`no_access`** - Cannot access this feature
2. **`view_only`** - Can view but cannot create/edit/delete
3. **`full_access`** - Full access (create, edit, delete, view)

### Available Features/Modules

- **Dashboard** - Main dashboard access
- **Analytics** - Reports and analytics
- **PEPPOL Access Point** - PEPPOL services
- **Leads Management** - Prospect and opportunity management
- **Quote Creation** - Create new quotes
- **Quotes Management** - Manage and track quotes
- **Quotes Follow-Up** - Quote follow-ups and reminders
- **Invoices Follow-Up** - Invoice follow-ups and reminders
- **Client Invoices** - Client invoice management
- **Supplier Invoices** - Supplier invoice management
- **Client Management** - Client database management
- **Credit Insurance** - Credit insurance services
- **Recovery** - Recovery services

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
   - Is user on Pro plan? → Can have multiple profiles
   - Is user on Starter plan? → Limited to 1 profile
   - Check subscription status (trial/active/cancelled)

2. **Profile Check:**
   - Get current active profile
   - Check profile role
   - Check profile permissions for specific feature

3. **Feature Access:**
   - If subscription allows → Check profile permission
   - If profile has `full_access` → Allow all actions
   - If profile has `view_only` → Allow view only
   - If profile has `no_access` → Deny access

---

## Profile Management

### Creating Profiles

**Starter Plan:**
- Can only have 1 profile (the admin profile created at registration)
- Cannot create additional profiles

**Pro Plan:**
- Can create up to 10 profiles
- Each profile can have different role and permissions
- Profiles can be switched using PIN

### Profile Switching

- Users can switch between profiles
- PIN required for profile switching (if multiple profiles exist)
- Only one profile can be active at a time
- Active profile determines current permissions

### Profile Permissions

- Set when creating profile (based on role template)
- Can be customized per profile
- Stored as JSON object in `permissions` field
- Format: `{ feature_name: 'permission_level' }`

---

## Database Schema

### `users` Table
```sql
- id (UUID) - Primary key
- email (TEXT) - Unique email
- full_name (TEXT)
- subscription_status (TEXT) - trial/active/past_due/cancelled
- selected_plan (TEXT) - starter/pro
- stripe_customer_id (TEXT)
- stripe_subscription_id (TEXT)
```

### `user_profiles` Table
```sql
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (TEXT) - Profile name
- email (TEXT) - Profile email
- role (TEXT) - admin/manager/accountant/sales/viewer
- permissions (JSONB) - Permission object
- pin (TEXT) - PIN for profile switching
- is_active (BOOLEAN) - Active profile flag
- avatar (TEXT) - Avatar URL
```

---

## Key Files

### Services
- `src/services/multiUserService.js` - Profile management
- `src/services/registrationService.js` - Creates initial profile
- `src/context/MultiUserContext.jsx` - Profile context provider

### Pages
- `src/pages/multi-user-profiles/index.jsx` - Profile management page
- `src/pages/subscription/index.jsx` - Subscription management

### Context
- `src/context/MultiUserContext.jsx` - Provides profile state and functions

---

## Important Notes

1. **Profile Creation:**
   - First profile is created automatically during registration
   - Always created as `admin` role with `full_access`
   - Additional profiles can only be created on Pro plan

2. **Subscription Limits:**
   - Starter: 1 profile max
   - Pro: 10 profiles max
   - Limits enforced in UI and backend

3. **Permission Inheritance:**
   - Permissions are per-profile, not per-user
   - Switching profiles changes available features
   - Admin profile always has full access

4. **Access Control:**
   - Check subscription plan first
   - Then check profile permissions
   - Both must allow access

---

## Example Scenarios

### Scenario 1: Starter Plan User
- Has 1 profile (admin)
- Can access all features (within Starter limits)
- Cannot create additional profiles
- Limited to 15 quotes/invoices per month

### Scenario 2: Pro Plan User
- Can have up to 10 profiles
- Each profile can have different role
- Can switch between profiles
- Unlimited quotes/invoices
- Access to all premium features

### Scenario 3: Multi-User Team (Pro Plan)
- Admin profile: Full access to everything
- Sales profile: Access to leads, quotes, clients only
- Accountant profile: Access to invoices, analytics, financials
- Viewer profile: Read-only access to all data

---

## Summary

- **User Account** = Subscription plan + billing
- **User Profile** = Role + permissions + access
- **Starter Plan** = 1 profile, limited features
- **Pro Plan** = Up to 10 profiles, all features
- **Access** = Subscription plan + Profile permissions

