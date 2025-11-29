# In-Platform Subscription & Invoice Management

## Goal

Replace Stripe Portal with Haliqo pages for:
1. **Subscription Management** - Upgrade, downgrade, cancel
2. **Invoice Management** - View invoices, download PDFs, payment history

Keep registration flow as-is (Stripe Checkout).

---

## What We Will Build

### 1. Subscription Management Page

**Features:**
- View current plan details
- Upgrade to higher plan (Starter → Pro)
- Downgrade to lower plan (Pro → Starter)
- Change billing interval (Monthly ↔ Yearly)
- Cancel subscription
- Reactivate cancelled subscription

**How It Works:**
- Use existing `admin-update-subscription` edge function
- Call Stripe API directly for plan changes
- Update database after Stripe confirms
- Send notification emails

---

### 2. Invoice Management Page

**Features:**
- List all invoices from Stripe
- Show invoice status (paid, pending, failed)
- Download invoice PDF
- View payment history
- Show upcoming invoice preview

**How It Works:**
- Create new edge function to fetch invoices from Stripe
- Display in a table on Haliqo
- Use Stripe's hosted invoice PDF URLs

---

## Implementation Tasks

### Task 1: Subscription Management UI

| Item | Description |
|------|-------------|
| Update `/subscription` page | Add upgrade/downgrade buttons |
| Plan selection UI | Show available plans with pricing |
| Confirmation modal | Confirm before plan change |
| Call edge function | Use `admin-update-subscription` for changes |
| Success/error handling | Show result to user |

### Task 2: Create Invoice Edge Function

| Item | Description |
|------|-------------|
| `get-invoices` function | Fetch user's invoices from Stripe API |
| Return invoice list | ID, amount, status, date, PDF URL |
| Handle pagination | Support loading more invoices |

### Task 3: Invoice Management UI

| Item | Description |
|------|-------------|
| Invoices section | Add to subscription page or separate page |
| Invoice table | List invoices with status badges |
| Download button | Link to Stripe PDF |
| Payment history | Show from `payment_records` table |

### Task 4: Update Account Settings

| Item | Description |
|------|-------------|
| Replace "Manage" button | Navigate to in-platform page instead of Stripe |
| Remove Stripe Portal redirect | Keep only for payment method updates |

---

## Files to Create/Modify

**New Files:**
- `supabase/functions/get-invoices/index.ts` - Fetch invoices from Stripe

**Modify:**
- `src/pages/subscription/index.jsx` - Add management UI
- `src/components/ui/UserProfile.jsx` - Update "Manage" button
- `src/services/stripeService.js` - Add invoice fetching

---

## Summary

| Feature | Status |
|---------|--------|
| View current subscription | ✅ Already done |
| Upgrade/Downgrade | 🔧 To build |
| Cancel subscription | 🔧 To build (use existing admin logic) |
| View invoices | 🔧 To build |
| Download invoice PDF | 🔧 To build |
| Payment history | ✅ Already in database |

**Registration flow stays unchanged** - continues using Stripe Checkout.
