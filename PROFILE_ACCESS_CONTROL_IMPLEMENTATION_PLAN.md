# Profile Access Control Implementation Plan

## Overview
Complete implementation of permission-based access control across the application. The permission system exists but is not enforced in UI components.

**Current Status:**
- ✅ Permission system implemented (`MultiUserContext.hasPermission()`)
- ✅ Profile management page functional
- ❌ Sidebar doesn't filter by permissions
- ❌ Pages don't check permissions
- ❌ Widgets don't check permissions
- ❌ Routes not protected

---

## Implementation Steps

### 1. Sidebar Permission Filtering

**File:** `src/components/ui/MainSidebar.jsx`

**Changes:**
1. Import `useMultiUser` hook
2. Map navigation items to permission modules
3. Filter items based on `hasPermission(module, 'view_only')`

**Reference:**
- Permission modules: `src/pages/multi-user-profiles/index.jsx` (lines 53-119)
- Permission check: `src/context/MultiUserContext.jsx` (lines 243-294)

**Implementation:**
```javascript
const { hasPermission } = useMultiUser();

// Map navigation items to permission modules
const itemPermissionMap = {
  'dashboard': 'dashboard',
  'analytics-dashboard': 'analytics',
  'peppol-access-point': 'peppolAccessPoint',
  'leads-management': 'leadsManagement',
  'quote-creation': 'quoteCreation',
  'quotes-management': 'quotesManagement',
  'quotes-follow-up': 'quotesFollowUp',
  'invoices-follow-up': 'invoicesFollowUp',
  'client-invoices': 'clientInvoices',
  'expense-invoices': 'supplierInvoices',
  'client-management': 'clientManagement',
  'assurance-credit': 'creditInsurance',
  'recouvrement': 'recovery'
};

// Filter items
navigationCategories.map(category => ({
  ...category,
  items: category.items.filter(item => {
    const module = itemPermissionMap[item.id];
    return module ? hasPermission(module, 'view_only') : true;
  })
})).filter(category => category.items.length > 0);
```

---

### 2. Create Protected Route Component

**File:** `src/components/ProtectedRoute.jsx` (NEW)

**Purpose:** Route-level permission checking

**Reference:**
- Permission check: `src/context/MultiUserContext.jsx` (lines 243-294)

**Implementation:**
```javascript
import { Navigate } from 'react-router-dom';
import { useMultiUser } from '../context/MultiUserContext';

const ProtectedRoute = ({ 
  children, 
  requiredPermission, 
  module,
  requiredLevel = 'view_only' 
}) => {
  const { hasPermission, loading } = useMultiUser();
  
  if (loading) return <LoadingSpinner />;
  
  if (!hasPermission(module, requiredLevel)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};
```

---

### 3. Update Routes with Permission Checks

**File:** `src/Routes.jsx`

**Changes:** Wrap routes with `ProtectedRoute` component

**Reference:**
- Route structure: Check existing `src/Routes.jsx`
- Permission modules: `src/pages/multi-user-profiles/index.jsx` (lines 53-119)

**Implementation:**
```javascript
<Route 
  path="/quote-creation" 
  element={
    <ProtectedRoute module="quoteCreation" requiredLevel="full_access">
      <QuoteCreation />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/quotes-management" 
  element={
    <ProtectedRoute module="quotesManagement" requiredLevel="view_only">
      <QuotesManagement />
    </ProtectedRoute>
  } 
/>
```

---

### 4. Page-Level Permission Checks

**Files to Update:**
- `src/pages/quotes-management/index.jsx`
- `src/pages/quote-creation/index.jsx`
- `src/pages/invoices-management/index.jsx`
- `src/pages/client-management/index.jsx`
- `src/pages/leads-management/index.jsx`
- `src/pages/analytics-dashboard/index.jsx`
- `src/pages/services/peppol/index.jsx`
- All other feature pages

**Changes:**
1. Import `useMultiUser`
2. Check permission on mount
3. Show access denied or redirect if no permission
4. Disable actions based on permission level

**Reference:**
- Permission check: `src/context/MultiUserContext.jsx` (lines 243-294)
- Example: `src/pages/quotes-management/index.jsx` (line 38)

**Implementation Pattern:**
```javascript
const { hasPermission, currentProfile } = useMultiUser();

useEffect(() => {
  if (!hasPermission('quotesManagement', 'view_only')) {
    navigate('/dashboard');
  }
}, []);

// Disable create button if no full_access
const canCreate = hasPermission('quoteCreation', 'full_access');
```

---

### 5. Widget-Level Permission Checks

**Files to Update:**
- `src/pages/dashboard/index.jsx`
- `src/pages/dashboard/components/*.jsx`

**Changes:**
1. Check permission before rendering each widget
2. Conditionally render based on permission level

**Reference:**
- Widget components: `src/pages/dashboard/components/`
- Permission check: `src/context/MultiUserContext.jsx` (lines 243-294)

**Implementation Pattern:**
```javascript
const { hasPermission } = useMultiUser();

// In dashboard render
{hasPermission('analytics', 'view_only') && (
  <AnalyticsWidget />
)}

{hasPermission('clientInvoices', 'view_only') && (
  <InvoiceOverviewWidget />
)}
```

---

### 6. Action-Level Permission Checks

**Files:** All pages with create/edit/delete actions

**Changes:**
1. Check `full_access` before showing action buttons
2. Disable buttons for `view_only` users
3. Show tooltips explaining why actions are disabled

**Reference:**
- Permission levels: `USER_PROFILES_AND_ACCESS_README.md` (lines 198-204)
- Permission check: `src/context/MultiUserContext.jsx` (lines 243-294)

**Implementation Pattern:**
```javascript
const canCreate = hasPermission('quoteCreation', 'full_access');
const canEdit = hasPermission('quotesManagement', 'full_access');
const canDelete = hasPermission('quotesManagement', 'full_access');

<Button 
  disabled={!canCreate}
  onClick={handleCreate}
>
  {canCreate ? 'Create Quote' : 'No Permission'}
</Button>
```

---

### 7. PEPPOL Special Handling

**File:** `src/pages/services/peppol/index.jsx`

**Changes:** Already checks business size, but add permission check

**Reference:**
- Current implementation: `src/pages/services/peppol/index.jsx` (lines 339-342)
- Permission check: `src/context/MultiUserContext.jsx` (lines 248-257)

**Implementation:**
```javascript
const { hasPermission } = useMultiUser();

// Check both business size AND permission
const canAccessPeppol = isBusinessUser && 
  hasPermission('peppolAccessPoint', 'view_only');
```

---

### 8. Navigation Item Permission Mapping

**File:** `src/components/ui/MainSidebar.jsx`

**Create mapping object:**
```javascript
const NAVIGATION_PERMISSION_MAP = {
  'dashboard': 'dashboard',
  'analytics-dashboard': 'analytics',
  'peppol-access-point': 'peppolAccessPoint',
  'leads-management': 'leadsManagement',
  'quote-creation': 'quoteCreation',
  'quotes-management': 'quotesManagement',
  'quotes-follow-up': 'quotesFollowUp',
  'invoices-follow-up': 'invoicesFollowUp',
  'client-invoices': 'clientInvoices',
  'expense-invoices': 'supplierInvoices',
  'client-management': 'clientManagement',
  'assurance-credit': 'creditInsurance',
  'recouvrement': 'recovery'
};
```

**Reference:**
- Module list: `src/pages/multi-user-profiles/index.jsx` (lines 53-119)
- Sidebar items: `src/components/ui/MainSidebar.jsx` (lines 254-404)

---

## Permission Module Reference

**All 13 Modules:**
1. `dashboard` - Dashboard access
2. `analytics` - Analytics dashboard
3. `peppolAccessPoint` - PEPPOL services
4. `leadsManagement` - Leads management
5. `quoteCreation` - Create quotes
6. `quotesManagement` - Manage quotes
7. `quotesFollowUp` - Quote follow-ups
8. `invoicesFollowUp` - Invoice follow-ups
9. `clientInvoices` - Client invoices
10. `supplierInvoices` - Supplier invoices
11. `clientManagement` - Client management
12. `creditInsurance` - Credit insurance
13. `recovery` - Recovery services

**Reference:** `src/pages/multi-user-profiles/index.jsx` (lines 53-119)

---

## Permission Levels

1. **`no_access`** - Hide from UI completely
2. **`view_only`** - Show but disable create/edit/delete
3. **`full_access`** - Full access to all actions

**Reference:** `USER_PROFILES_AND_ACCESS_README.md` (lines 198-204)

---

## Key Functions Reference

### `hasPermission(module, requiredLevel)`
- **Location:** `src/context/MultiUserContext.jsx` (lines 243-294)
- **Usage:** Check if current profile has permission
- **Returns:** `boolean`
- **Admin bypass:** Returns `true` for admin role

### `isAdmin()`
- **Location:** `src/context/MultiUserContext.jsx` (line 300)
- **Usage:** Check if current profile is admin
- **Returns:** `boolean`

### `getUserRole()`
- **Location:** `src/context/MultiUserContext.jsx` (line 296)
- **Usage:** Get current profile role
- **Returns:** `'admin' | 'manager' | 'accountant' | 'sales' | 'viewer' | 'none'`

---

## Implementation Order

1. ✅ **Step 1:** Sidebar filtering (highest visibility)
2. ✅ **Step 2:** ProtectedRoute component (foundation)
3. ✅ **Step 3:** Route protection (security)
4. ✅ **Step 4:** Page-level checks (user experience)
5. ✅ **Step 5:** Widget-level checks (dashboard)
6. ✅ **Step 6:** Action-level checks (button states)
7. ✅ **Step 7:** PEPPOL special handling (edge case)

---

## Testing Checklist

- [ ] Sidebar hides items with `no_access`
- [ ] Sidebar shows items with `view_only` or `full_access`
- [ ] Routes redirect if no permission
- [ ] Pages show access denied if no permission
- [ ] Widgets hidden if no permission
- [ ] Create buttons disabled for `view_only`
- [ ] Edit buttons disabled for `view_only`
- [ ] Delete buttons disabled for `view_only`
- [ ] Admin role bypasses all checks
- [ ] PEPPOL checks both business size and permission

---

## Files Summary

**Core Files:**
- `src/context/MultiUserContext.jsx` - Permission logic
- `src/services/multiUserService.js` - Profile service
- `src/pages/multi-user-profiles/index.jsx` - Profile management

**Files to Modify:**
- `src/components/ui/MainSidebar.jsx` - Add filtering
- `src/Routes.jsx` - Add route protection
- All page components - Add permission checks
- Dashboard widgets - Add permission checks

**New Files:**
- `src/components/ProtectedRoute.jsx` - Route guard component

---

## Quick Reference

**Import:**
```javascript
import { useMultiUser } from '../context/MultiUserContext';
const { hasPermission, isAdmin, getUserRole } = useMultiUser();
```

**Check Permission:**
```javascript
if (hasPermission('quotesManagement', 'view_only')) {
  // Show content
}

if (hasPermission('quoteCreation', 'full_access')) {
  // Enable create button
}
```

**Admin Bypass:**
```javascript
if (isAdmin() || hasPermission('module', 'full_access')) {
  // Admin always has access
}
```

---

## Notes

- Admin role always returns `true` for permission checks
- PEPPOL requires both business user check AND permission check
- Permission format supports both array (legacy) and object (current)
- Profile switching updates permissions immediately
- Subscription plan determines max profiles, not feature access
- **Important:** Profiles are ONLY for access control - all data belongs to parent user account
- Profiles are NOT separate user accounts - they are permission containers
- All actions (create, edit, delete) are performed by the parent user account
- Profiles only determine which features are visible and accessible

**Reference:** `USER_PROFILES_AND_ACCESS_README.md` (complete documentation)

