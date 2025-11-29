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
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx     # €29.99/month
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx      # €299.88/year
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx         # €49.99/month
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx          # €499.92/year
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
| **Upgrade** | Immediate | Charged prorated amount |
| **Downgrade** | End of period | Credit applied |
| **Cancel** | End of period | Access until period ends |

### Status Values
- `trialing` - 14-day free trial
- `active` - Paid and active
- `past_due` - Payment failed
- `cancelled` - Subscription ended

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
- `admin-update-subscription` - Handles plan changes (upgrade/downgrade/cancel)
- `stripe-webhook` - Processes Stripe events
- `check-user-registration` - Validates email for trial eligibility
- `get-subscription` - Fetches real-time Stripe data
- `get-invoices` - Fetches user invoices

---

## Email Notifications

| Event | Template Type |
|-------|--------------|
| Registration complete | `subscription_activated` |
| Trial starting | `subscription_trial_ending` |
| Upgrade | `subscription_upgraded` |
| Downgrade | `subscription_downgraded` |
| Cancellation | `subscription_cancelled` |

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
supabase functions deploy check-user-registration
supabase functions deploy get-subscription
supabase functions deploy get-invoices

# Run migration
# Execute add_has_used_trial_column.sql in Supabase SQL Editor
```

---

## Summary

- ✅ 14-day trial for all plans
- ✅ Automatic billing after trial
- ✅ Automatic proration (Stripe handles calculations)
- ✅ Database sync via webhooks
- ✅ Access control via SubscriptionGuard
- ✅ Trial prevention (one trial per email)
- ✅ In-platform subscription management
- ✅ Super admin can edit subscriptions (syncs to Stripe)
