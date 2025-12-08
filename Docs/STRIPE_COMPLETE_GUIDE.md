# Stripe Integration Guide

## Quick Setup Checklist

- [ ] Create Stripe products (Starter & Pro) with Monthly & Yearly prices
- [ ] Add Price IDs to environment variables
- [ ] Configure webhook endpoint with required events
- [ ] Set up billing portal configuration
- [ ] Run `add_has_used_trial_column.sql` migration
- [ ] Deploy edge functions

---

## Environment Variables

```bash
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx     # €39,99/month
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx      # €383,88/year (€31,99/month)
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx         # €69,99/month
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx          # €671,88/year (€55,99/month)
SITE_URL=https://yourdomain.com
```

---

## Business Logic

### Flow
```
Registration → Stripe Checkout (14-day trial) → Trial → Auto Payment → Active
```

### Plan Changes
| Action | Timing | Proration |
|--------|--------|-----------|
| **Upgrade** | Immediate (if not in trial) | Charged prorated amount |
| **Upgrade (during trial)** | After trial ends | No charge during trial |
| **Downgrade** | End of period/trial | Credit applied |
| **Cancel** | End of period | Access until period ends |

### Trial Period Protection

**Important:** The system prevents charges during the 14-day trial period, even if the subscription status is `active` (e.g., after reactivation).

**Trial Detection Logic:**
- Checks both `status === 'trialing'` AND `trial_end > now` to determine if subscription is in trial
- This handles cases where reactivated subscriptions may have `active` status but are still within trial period
- All plan changes (upgrades and downgrades) are scheduled for after trial ends if still in trial
- No charges are applied during trial period, regardless of subscription status

**Scenarios:**
1. **Upgrade during trial:** Change is scheduled for after trial ends, no immediate charge
2. **Downgrade during trial:** Change is scheduled for after trial ends, no immediate charge
3. **Reactivated subscription in trial:** Even if status is `active`, if `trial_end` is in future, no charges are applied
4. **Upgrade after trial:** Applied immediately with proration
5. **Downgrade after trial:** Scheduled for end of billing period

### Cancel/Reactivate Flow with Scheduled Plan Changes

**Smart Conflict Resolution:**
- If a plan change is scheduled and user cancels → Plan change is cancelled first, then subscription is cancelled
- If a plan change is scheduled and user reactivates → Cancellation is removed, plan change remains scheduled
- If cancellation is scheduled and user changes plan → Cancellation is removed first, then plan change is applied

**Flow Examples:**

1. **Cancel with Scheduled Plan Change:**
   ```
   User has scheduled downgrade → Clicks Cancel
   ↓
   Edge function releases schedule (cancels plan change)
   ↓
   Edge function cancels subscription
   ↓
   Success: Subscription cancelled, plan change removed
   ```

2. **Reactivate with Scheduled Plan Change:**
   ```
   User has scheduled upgrade + cancellation → Clicks Reactivate
   ↓
   Edge function checks schedule type
   ↓
   If cancellation schedule → Remove cancellation, keep plan change
   If plan change schedule → Just remove cancellation flag
   ↓
   Success: Subscription reactivated, plan change still scheduled
   ```

3. **Plan Change with Scheduled Cancellation:**
   ```
   User has scheduled cancellation → Changes plan
   ↓
   Edge function removes cancellation first
   ↓
   Edge function applies plan change
   ↓
   Success: Plan changed, cancellation removed
   ```

### Status Values
- `trialing` - 14-day free trial (actively in trial)
- `active` - Paid and active (may still be in trial period if reactivated - system checks `trial_end` date)
- `past_due` - Payment failed
- `cancelled` - Subscription ended

**Note:** A subscription with `active` status may still be within the trial period if it was reactivated. The system checks `trial_end` date to prevent charges during trial, regardless of status.

---

## Access Control

### SubscriptionGuard
Blocks app access when subscription expired/cancelled. Users redirected to `/subscription` page.

### Trial Prevention
- `has_used_trial` field in `users` table prevents multiple free trials
- `check-user-registration` edge function validates before registration

---

## Database Updates

All changes sync to both `subscriptions` AND `users` tables:

| Source | Tables Updated |
|--------|----------------|
| User subscription page | ✅ Both |
| Super admin edit | ✅ Both |
| Stripe webhooks | ✅ Both |
| Registration | ✅ Both |

---

## Webhook Events

**Endpoint:** `https://[PROJECT].supabase.co/functions/v1/stripe-webhook`

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Creates subscription, sets `has_used_trial` |
| `invoice.payment_succeeded` | Updates status to `active` |
| `invoice.payment_failed` | Updates status to `past_due` |
| `customer.subscription.updated` | Syncs status changes |
| `customer.subscription.deleted` | Sets status to `cancelled` |

---

## Key Files

### Frontend
- `src/pages/subscription/index.jsx` - User subscription management
- `src/components/SubscriptionGuard.jsx` - Access control
- `src/components/ProtectedRoute.jsx` - Route protection

### Services
- `src/services/stripeService.js` - Stripe API calls
- `src/services/registrationService.js` - Registration completion
- `src/services/subscriptionNotificationService.js` - Email notifications

### Edge Functions
- `create-checkout-session` - Creates Stripe checkout
- `admin-update-subscription` - Handles plan changes (upgrade/downgrade/cancel/reactivate) with smart conflict resolution, sends emails immediately after successful Stripe updates
- `stripe-webhook` - Processes Stripe events, sends backup emails for subscription changes
- `send-emails` - Centralized email sending function, handles all email types including 6 subscription types, fetches templates from database
- `check-user-registration` - Validates email for trial eligibility
- `get-subscription` - Fetches real-time Stripe data
- `get-invoices` - Fetches user invoices

---

## Email Notifications

### Subscription Email Template Types

The system uses **6 subscription email template types**, each available in 3 languages (FR, EN, NL):

| Template Type | Description | When Sent |
|--------------|-------------|-----------|
| `subscription_activated` | Welcome email when subscription becomes active | After successful registration/payment |
| `subscription_upgraded` | Plan upgrade confirmation | When user upgrades plan (immediate or scheduled) |
| `subscription_downgraded` | Plan downgrade confirmation | When user downgrades plan (scheduled for period end) |
| `subscription_cancelled` | Cancellation confirmation | When subscription is cancelled (immediate or at period end) |
| `subscription_reactivated` | Reactivation confirmation | When cancelled subscription is reactivated |
| `subscription_trial_ending` | Trial ending reminder | Before trial period ends |

**Total:** 18 templates (6 types × 3 languages)

### Email Sending Flow

#### Primary Flow: Immediate Email Sending

**All subscription emails are sent immediately** from the `admin-update-subscription` edge function after Stripe confirms the change was successful:

```
User/Admin Action → admin-update-subscription Edge Function
↓
Stripe API Call (update/cancel/reactivate)
↓
Stripe Returns Success (confirms change)
↓
✅ Email Sent Immediately via send-emails Edge Function
↓
Response Returned to Frontend
```

**Email Sending Logic:**

1. **Immediate Changes** (Upgrades outside trial, Cancel, Reactivate):
   - Stripe processes change immediately
   - Edge function receives success response
   - Email sent immediately with confirmation

2. **Scheduled Changes** (Downgrades, Upgrades during trial):
   - Stripe schedules change for future date
   - Edge function receives schedule confirmation
   - Email sent immediately to confirm scheduling
   - Webhook sends another email when change actually takes effect

#### Backup Flow: Webhook Email Sending

The `stripe-webhook` edge function also sends emails as a **backup mechanism** for:
- External Stripe events (payment failures, automatic renewals)
- Ensuring emails are sent even if edge function email fails
- Handling edge cases where changes happen outside our control

**Webhook Email Events:**

| Webhook Event | Email Type | When |
|--------------|-----------|------|
| `customer.subscription.updated` (plan change) | `subscription_upgraded` or `subscription_downgraded` | When scheduled plan change takes effect |
| `customer.subscription.updated` (reactivation) | `subscription_reactivated` | When subscription is reactivated |
| `customer.subscription.updated` (status change) | `subscription_activated` | When subscription becomes active |

### Email Template System

**All emails use database-driven templates:**
- Templates stored in `email_templates` table
- Templates fetched by `template_type` and `language`
- Variables replaced dynamically (e.g., `{user_name}`, `{plan_name}`, `{amount}`)
- User-specific templates supported (via `user_id`)

**Template Variables:**

Common variables available in all subscription templates:
- `{user_name}` - User's full name
- `{user_email}` - User's email
- `{plan_name}` - Current/new plan name
- `{amount}` or `{new_amount}` - Plan price
- `{billing_interval}` - Monthly or yearly
- `{effective_date}` - When change takes effect
- `{company_name}` - Company name (Haliqo)
- `{support_email}` - Support contact

For upgrade/downgrade emails:
- `{old_plan_name}` - Previous plan name
- `{old_amount}` - Previous plan price

### Email Sending Implementation

**Edge Function:** `send-emails/index.ts`
- Handles all email types including all 6 subscription types
- Fetches template from database
- Renders template with variables
- Sends via Resend API

**Service:** `subscriptionNotificationService.js`
- Used by Super Admin for manual subscription edits
- Calls `send-emails` edge function
- Handles user language preference
- Prepares email variables

**Key Files:**
- `supabase/functions/send-emails/index.ts` - Email sending edge function
- `supabase/functions/admin-update-subscription/index.ts` - Sends emails immediately after Stripe updates
- `supabase/functions/stripe-webhook/index.ts` - Sends emails as backup for webhook events
- `src/services/subscriptionNotificationService.js` - Frontend service for Super Admin emails

---

## Billing Portal Settings

1. **Plan changes:** "Prorate charges and credits" ✅
2. **Switch plans:** ON ✅
3. **Downgrades:** "Wait until end of billing period" ✅
4. **Cancellations:** "Cancel at end of billing period" ✅

---

## Testing

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

**Verify:**
- [ ] Checkout creates 14-day trial
- [ ] Webhooks update database
- [ ] Plan changes work correctly
- [ ] Cancelled users blocked by SubscriptionGuard
- [ ] Same email cannot get another trial

---

## Deploy Commands

```bash
# Deploy edge functions
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy admin-update-subscription
supabase functions deploy send-emails
supabase functions deploy check-user-registration
supabase functions deploy get-subscription
supabase functions deploy get-invoices

# Run migration
# Execute add_has_used_trial_column.sql in Supabase SQL Editor

# Email templates
# Execute consistent_emails_tempaltes.sql in Supabase SQL Editor to create all email templates
```

---

## Summary

- ✅ 14-day trial for all plans
- ✅ **Trial Period Protection:** No charges during trial, even if subscription status is `active` (checks both status and `trial_end` date)
- ✅ Automatic billing after trial
- ✅ Automatic proration (Stripe handles calculations)
- ✅ Database sync via webhooks
- ✅ Access control via SubscriptionGuard
- ✅ Trial prevention (one trial per email)
- ✅ In-platform subscription management
- ✅ Super admin can edit subscriptions (syncs to Stripe)
- ✅ Smart conflict resolution for cancel/reactivate with scheduled plan changes
- ✅ Seamless flow: plan changes, cancellations, and reactivations work together without conflicts
- ✅ **Complete email notification system:**
  - 6 subscription email template types (18 templates total: 6 types × 3 languages)
  - Immediate email sending from `admin-update-subscription` after successful Stripe updates
  - Backup email sending from webhook for external events
  - Database-driven templates with dynamic variable replacement
  - User-specific templates supported
  - All emails sent via centralized `send-emails` edge function
