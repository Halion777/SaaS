# User Profiles & Access System Guide

## Overview

The Haliqo platform uses a **two-layer access control** system:

1. **Subscription-Based Access** - What features the plan allows (Starter vs Pro)
2. **Profile-Based Permissions** - What modules each profile role can access

**Important:** Profiles are NOT separate user accounts. They are permission containers that control feature access. All data (quotes, invoices, clients) belongs to the parent user account and is shared across all profiles.

---

## Implementation Status

| Component | Status | File |
|-----------|--------|------|
| Profile CRUD (Create, Read, Update, Delete) | ✅ Complete | `multiUserService.js` |
| Profile Switching with PIN | ✅ Complete | `ProfileSwitcher.jsx` |
| Sidebar Permission Filtering | ✅ Complete | `MainSidebar.jsx` |
| Page-Level Protection | ✅ 16 pages | `PermissionGuard.jsx` |
| Action-Level Control | ✅ Complete | `usePermissionCheck` hook |
| Subscription Guard | ✅ Complete | `ProtectedRoute.jsx` |
| Super Admin Exemption | ✅ Complete | `ProtectedRoute.jsx` |
| Multi-language (FR, EN, NL) | ✅ Complete | Translation files |
| Single Loading Screen | ✅ Complete | `ProtectedRoute.jsx` |

---

## Subscription Plans

### Starter Plan - €39,99/month
| Feature | Limit |
|---------|-------|
| Users | 1 user |
| Active Clients | Up to 30 |
| Quotes | Unlimited |
| Simple Invoices | Unlimited |
| Peppol E-Invoices | Up to 50/month (sent + received) |
| Lead Generation | Qualified lead suggestions (BETA) |
| Automatic Reminders | ❌ |
| Advanced Analytics | Basic statistics only |
| Multi-User | ❌ |
| AI Features | ✅ AI-powered smart quotes & suggestions |

### Pro Plan - €69,99/month
| Feature | Limit |
|---------|-------|
| Users | Multi-user access (owner, admin, site manager, etc.) |
| Active Clients | Unlimited |
| Quotes | Unlimited |
| Simple Invoices | Unlimited |
| Peppol E-Invoices | Unlimited (normal usage) |
| Lead Generation | ✅ Full lead generation (integrated prospecting) |
| Automatic Reminders | ✅ Automatic reminders for quotes & invoices |
| Advanced Analytics | ✅ Detailed statistics & reporting |
| Multi-User | ✅ Multi-user access |
| AI Features | ✅ Complete AI features |

---

## Profile Roles & Permissions

### Permission Levels
- `no_access` - Feature hidden from UI
- `view_only` - Can view but not create/edit/delete
- `full_access` - Full CRUD operations

### Role Templates

| Module | Admin | Manager | Accountant | Sales | Viewer |
|--------|-------|---------|------------|-------|--------|
| Dashboard | Full | Full | View | View | View |
| Analytics | Full | Full | Full | View | View |
| PEPPOL | Full | ❌ | View | ❌ | ❌ |
| Leads Management | Full | Full | View | Full | View |
| Quote Creation | Full | Full | View | Full | ❌ |
| Quotes Management | Full | Full | View | View | View |
| Quotes Follow-Up | Full | Full | View | View | View |
| Invoices Follow-Up | Full | Full | Full | View | View |
| Client Invoices | Full | Full | Full | View | View |
| Supplier Invoices | Full | View | Full | ❌ | ❌ |
| Client Management | Full | Full | View | Full | View |
| Credit Insurance | Full | View | View | ❌ | ❌ |
| Recovery | Full | View | View | ❌ | ❌ |

---

## Key Files

### Core Services
```
src/services/multiUserService.js     - Profile CRUD operations
src/context/MultiUserContext.jsx     - Permission state & hooks
src/config/subscriptionFeatures.js   - Feature access configuration
```

### Protection Components
```
src/components/ProtectedRoute.jsx    - Auth + subscription + profile loading
src/components/PermissionGuard.jsx   - Page-level permission checks
src/components/SubscriptionGuard.jsx - Subscription validation (legacy)
```

### UI Components
```
src/components/ui/MainSidebar.jsx       - Permission-filtered navigation
src/components/ui/ProfileSwitcher.jsx   - Profile switching UI
src/components/ui/PinModal.jsx          - PIN verification modal
src/pages/multi-user-profiles/index.jsx - Profile management page
```

---

## How It Works

### 1. Authentication Flow
```
User Login
    ↓
ProtectedRoute (single loading screen)
    ├── Check auth status
    ├── Check subscription status
    ├── Check super admin exemption
    └── Initialize MultiUserContext
    ↓
Render page with permissions applied
```

### 2. Permission Check Flow
```
User accesses a page
    ↓
PermissionGuard checks:
    ├── Is user admin? → Allow
    ├── Has required permission? → Allow
    └── No permission → Show "Access Denied"
```

### 3. Sidebar Filtering
```
MainSidebar renders navigation
    ↓
For each nav item:
    ├── Map item to permission module
    ├── Check hasPermission(module, 'view_only')
    └── Hide item if no_access
```

---

## Usage Examples

### Page Protection
```jsx
import { PermissionGuard } from '../components/PermissionGuard';

// Basic protection (view_only required)
<PermissionGuard module="quotesManagement">
  <QuotesPage />
</PermissionGuard>

// Full access required
<PermissionGuard module="quoteCreation" requiredPermission="full_access">
  <CreateQuotePage />
</PermissionGuard>

// Admin-only page
<PermissionGuard adminOnly>
  <AdminSettingsPage />
</PermissionGuard>
```

### Action-Level Control
```jsx
import { usePermissionCheck } from '../components/PermissionGuard';

function QuotesList() {
  const { canPerform } = usePermissionCheck('quotesManagement');
  
  return (
    <div>
      <Button 
        disabled={!canPerform('full_access')}
        onClick={handleCreate}
      >
        Create Quote
      </Button>
    </div>
  );
}
```

### Permission Check in Context
```jsx
import { useMultiUser } from '../context/MultiUserContext';

function MyComponent() {
  const { hasPermission, isAdmin, currentProfile } = useMultiUser();
  
  // Check specific permission
  if (hasPermission('quoteCreation', 'full_access')) {
    // Allow create action
  }
  
  // Check if admin
  if (isAdmin()) {
    // Show admin features
  }
}
```

---

## Protected Pages

The following pages are wrapped with `PermissionGuard`:

| Page | Module | Required Permission |
|------|--------|---------------------|
| Dashboard | `dashboard` | view_only |
| Analytics | `analytics` | view_only |
| Leads Management | `leadsManagement` | view_only |
| Quote Creation | `quoteCreation` | full_access |
| Quotes Management | `quotesManagement` | view_only |
| Quotes Follow-Up | `quotesFollowUp` | view_only |
| Invoices Follow-Up | `invoicesFollowUp` | view_only |
| Client Invoices | `clientInvoices` | view_only |
| Expense Invoices | `supplierInvoices` | view_only |
| Client Management | `clientManagement` | view_only |
| PEPPOL | `peppolAccessPoint` | view_only |
| Credit Insurance | `creditInsurance` | view_only |
| Recovery | `recovery` | view_only |
| Subscription | - | adminOnly |
| Multi-User Profiles | - | adminOnly |

---

## Super Admin

Super admin users (`role: 'superadmin'` in users table) are:

- ✅ Exempt from subscription checks
- ✅ Exempt from billing/revenue calculations
- ✅ Excluded from user statistics
- ✅ Redirected to `/admin/super/dashboard`

Super admin routes: `/admin/super/*`

---

## Database Schema

### users table
```sql
- id (UUID) - Primary key
- email (TEXT) - Unique
- role (TEXT) - 'admin' or 'superadmin'
- selected_plan (TEXT) - 'starter' or 'pro'
- subscription_status (TEXT) - 'trial', 'active', 'past_due', 'cancelled'
```

### user_profiles table
```sql
- id (UUID) - Primary key
- user_id (UUID) - Foreign key to users
- name (TEXT) - Profile name
- role (TEXT) - 'admin', 'manager', 'accountant', 'sales', 'viewer'
- permissions (JSONB) - { "module": "permission_level" }
- pin (TEXT) - Optional PIN for switching
- is_active (BOOLEAN) - Only one active at a time
- avatar (TEXT) - Avatar URL
```

---

## Quick Reference

### Check if user can access a feature
```jsx
const { hasPermission } = useMultiUser();
hasPermission('quotesManagement', 'full_access'); // true/false
```

### Check if user is admin
```jsx
const { isAdmin } = useMultiUser();
isAdmin(); // true/false
```

### Get current profile
```jsx
const { currentProfile } = useMultiUser();
console.log(currentProfile.name, currentProfile.role);
```

### Switch profile
```jsx
const { switchProfile } = useMultiUser();
await switchProfile(profileId); // PIN modal shown if needed
```

---

## Notes

1. **Admin Bypass**: Admin role always returns `true` for all permission checks
2. **PEPPOL Access**: Also requires `business_size` to be 'small', 'medium', or 'large' (not 'solo')
3. **First Profile**: Always created as admin during registration
4. **Profile Limits**: Enforced at creation time based on subscription plan
5. **Single Loader**: All auth/subscription/profile checks show ONE "Loading..." screen
