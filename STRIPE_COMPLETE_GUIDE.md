# Complete Stripe Integration Guide

## Table of Contents
1. [Quick Setup Checklist](#quick-setup-checklist)
2. [Stripe Products & Prices](#stripe-products--prices)
3. [Business Logic Summary](#business-logic-summary)
4. [Stripe Configuration](#stripe-configuration)
5. [Code Integration](#code-integration)
6. [Email Notifications](#email-notifications)
7. [Webhook Setup](#webhook-setup)
8. [Testing](#testing)

---

## Quick Setup Checklist

- [ ] Create products in Stripe (Starter & Pro)
- [ ] Add prices (Monthly & Yearly for each)
- [ ] Copy Price IDs to environment variables
- [ ] Configure webhook endpoint
- [ ] Set up billing portal configuration
- [ ] Test complete flow

---

## Stripe Products & Prices

### Product Structure

**Product: Starter**
- Monthly Price: €29.99/month → `STRIPE_STARTER_MONTHLY_PRICE_ID`
- Yearly Price: €299.88/year → `STRIPE_STARTER_YEARLY_PRICE_ID`

**Product: Pro**
- Monthly Price: €49.99/month → `STRIPE_PRO_MONTHLY_PRICE_ID`
- Yearly Price: €499.92/year → `STRIPE_PRO_YEARLY_PRICE_ID`

### Environment Variables

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Price IDs
STRIPE_STARTER_MONTHLY_PRICE_ID=price_xxx
STRIPE_STARTER_YEARLY_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx

# Billing Portal
STRIPE_BILLING_PORTAL_CONFIG_ID=bpc_xxx

# Site URL
SITE_URL=https://yourdomain.com
```

---

## Business Logic Summary

### Subscription Flow

```
User Registration → Plan Selection → Stripe Checkout (14-day trial) → 
Trial Period (0-14 days) → Auto Payment → Active Subscription
```

### 14-Day Free Trial

- **All plans** get 14-day free trial
- Card collected but **NOT charged** during trial
- After 14 days, Stripe **automatically charges** the card
- Status: `trialing` → `active` (after payment)

### Plan Changes

**Upgrade (Starter → Pro):**
- Stripe **automatically calculates proration**
- Customer pays prorated amount for remaining period
- **Immediate access** to Pro features

**Downgrade (Pro → Starter):**
- Stripe **automatically issues credit** for unused portion
- Change takes effect at **end of billing period**
- Customer keeps access until period ends

### Subscription Status

- `trial` / `trialing`: 14-day free trial, no charge
- `active`: Subscription active and paid
- `past_due`: Payment failed, grace period
- `cancelled`: Subscription cancelled

### Proration (Automatic by Stripe)

**Stripe handles all calculations automatically:**
- Unused portion of old plan = Credit
- Prorated amount of new plan = Charge
- Net amount = Charge - Credit

**You don't need to calculate anything** - Stripe does it all!

---

## Stripe Configuration

### Billing Portal Settings

**1. When customers change plans:**
- ✅ **Select: "Prorate charges and credits"**
- Stripe automatically calculates and applies proration

**2. Subscription Products:**
- ✅ "Customers can switch plans" - **ON**
- ✅ "Customers can change quantity" - **OFF**
- Include: Starter (monthly + yearly), Pro (monthly + yearly)

**3. Downgrades:**
- ✅ "When switching to cheaper plan" → **"Wait until end of billing period"**
- ✅ "When switching to shorter interval" → **"Wait until end of billing period"**

### Custom Domain (Optional)

1. Go to Stripe Dashboard → Settings → Billing → Customer Portal
2. Add custom domain (e.g., `billing.yourdomain.com`)
3. Add CNAME DNS record (provided by Stripe)
4. Verify domain in Stripe
5. Activate custom domain

---

## Code Integration

### Key Files

**Frontend:**
- `src/pages/pricing/index.jsx` - Pricing page
- `src/pages/subscription/index.jsx` - User subscription management
- `src/pages/stripe-success/index.jsx` - Payment success handler

**Services:**
- `src/services/stripeService.js` - Stripe API calls
- `src/services/registrationService.js` - Registration completion

**Edge Functions:**
- `supabase/functions/create-checkout-session/index.ts` - Creates checkout
- `supabase/functions/create-portal-session/index.ts` - Billing portal
- `supabase/functions/stripe-webhook/index.ts` - Webhook handler

### Database Tables

**`users` table:**
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `subscription_status` - Current status (trial/active/cancelled)

**`subscriptions` table:**
- Subscription records with plan details
- Trial dates, billing periods
- Status tracking

**`payment_records` table:**
- Payment history
- Used for revenue reporting

---

## Email Notifications

### When Emails Are Sent

The system automatically sends email notifications to users for subscription events:

#### 1. **Subscription Activated** (`subscription_activated`)
- **When:** After successful registration and payment
- **Trigger:** User completes checkout and subscription is created
- **Content:** Welcome message with plan details and activation date
- **Service:** `SubscriptionNotificationService.sendSubscriptionActivationNotification()`

#### 2. **Trial Ending** (`subscription_trial_ending`)
- **When:** When user starts trial period (14 days before payment)
- **Trigger:** After registration with trial status
- **Content:** Reminder that trial ends soon, plan details, amount after trial
- **Service:** `SubscriptionNotificationService.sendTrialEndingNotification()`

#### 3. **Subscription Upgraded** (`subscription_upgraded`)
- **When:** User upgrades from Starter to Pro (or lower to higher plan)
- **Trigger:** Plan change via checkout or admin edit
- **Content:** Old plan, new plan, prorated amount, immediate access notice
- **Service:** `SubscriptionNotificationService.sendSubscriptionUpgradeNotification()`

#### 4. **Subscription Downgraded** (`subscription_downgraded`)
- **When:** User downgrades from Pro to Starter (or higher to lower plan)
- **Trigger:** Plan change via checkout or admin edit
- **Content:** Old plan, new plan, effective date, data preservation notice
- **Service:** `SubscriptionNotificationService.sendSubscriptionDowngradeNotification()`

#### 5. **Subscription Cancelled** (`subscription_cancelled`)
- **When:** Subscription is cancelled (immediate or end of period)
- **Trigger:** User cancels via portal or admin cancels subscription
- **Content:** Cancellation date, reason, access until period end, reactivation option
- **Service:** `SubscriptionNotificationService.sendSubscriptionCancellationNotification()`

### Email Templates

All email templates are stored in `email_templates` table with:
- **Template Type:** `subscription_activated`, `subscription_trial_ending`, `subscription_upgraded`, `subscription_downgraded`, `subscription_cancelled`
- **Language:** French (fr) by default
- **Variables:** `{user_name}`, `{user_email}`, `{old_plan_name}`, `{new_plan_name}`, `{new_amount}`, `{billing_interval}`, `{effective_date}`, `{trial_end_date}`, `{cancellation_reason}`, `{support_email}`, `{company_name}`

### Email Service

- **Service File:** `src/services/subscriptionNotificationService.js`
- **Edge Function:** `supabase/functions/send-emails/index.ts`
- **Database:** Templates stored in `email_templates` table
- **Variables:** Defined in `email_template_variables` table

### Setup

To add email templates, run the SQL file:
- `subscription_email_templates_only.sql` - Contains all subscription email templates

---

## Webhook Setup

### Endpoint URL

```
https://[YOUR_PROJECT].supabase.co/functions/v1/stripe-webhook
```

### Required Events

- `checkout.session.completed` - Checkout completed
- `invoice.payment_succeeded` - Payment successful (after trial)
- `invoice.payment_failed` - Payment failed
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled

### Webhook Secret

1. Create webhook endpoint in Stripe Dashboard
2. Copy signing secret (`whsec_...`)
3. Add to Supabase: `STRIPE_WEBHOOK_SECRET`

### What Webhooks Do

- **`checkout.session.completed`**: Updates user with Stripe IDs
- **`invoice.payment_succeeded`**: Updates subscription to `active` (after trial)
- **`invoice.payment_failed`**: Updates status to `past_due`
- **`customer.subscription.updated`**: Syncs status from Stripe to database
- **`customer.subscription.deleted`**: Marks subscription as `cancelled`

---

## Testing

### Test Flow

1. **Create test subscription** in Stripe test mode
2. **Verify checkout** works correctly
3. **Check webhook** receives events
4. **Verify database** updates correctly
5. **Test plan change** (upgrade/downgrade)
6. **Test billing portal** access

### Stripe Test Cards

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date, any CVC

### Verify After Setup

- [ ] Checkout session creates successfully
- [ ] Trial period shows correctly (14 days)
- [ ] Webhook events received and processed
- [ ] Database updates on payment
- [ ] Billing portal opens correctly
- [ ] Plan changes work with proration

---

## Summary

### How It Works

1. **User selects plan** → Creates Stripe checkout session
2. **Stripe collects card** → No charge during 14-day trial
3. **Trial ends** → Stripe automatically charges card
4. **Webhook fires** → Updates database to `active`
5. **User manages subscription** → Via billing portal or your app

### Key Points

- ✅ **14-day trial** for all plans (configured in checkout)
- ✅ **Automatic billing** after trial (handled by Stripe)
- ✅ **Automatic proration** for plan changes (handled by Stripe)
- ✅ **Webhook sync** keeps database updated
- ✅ **No manual calculations** needed - Stripe handles everything

### Important Notes

- Stripe calculates all proration automatically
- Webhooks keep database in sync with Stripe
- Trial period is automatic (no manual tracking needed)
- Billing portal allows customer self-service
- All payment processing handled by Stripe

---

## Quick Reference

**Checkout Session:** `supabase/functions/create-checkout-session/index.ts`
- Creates session with 14-day trial
- Maps plan type to price ID

**Webhook Handler:** `supabase/functions/stripe-webhook/index.ts`
- Handles all Stripe events
- Updates database accordingly

**Billing Portal:** `supabase/functions/create-portal-session/index.ts`
- Opens Stripe Customer Portal
- Allows customer self-service

**Registration:** `src/services/registrationService.js`
- Completes user registration after payment
- Creates all necessary database records

---