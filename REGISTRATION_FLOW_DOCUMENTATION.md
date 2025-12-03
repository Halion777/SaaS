# Registration Flow Documentation

## Overview

This document describes the complete user registration flow, including new registrations and resuming incomplete registrations. The system handles data persistence at each step to ensure users can resume their registration even if payment fails.

## Table of Contents

1. [New Registration Flow](#new-registration-flow)
2. [Resume Registration Flow](#resume-registration-flow)
3. [Data Persistence Strategy](#data-persistence-strategy)
4. [Email Verification](#email-verification)
5. [Payment Flow](#payment-flow)
6. [Login Flow with Canceled Subscription](#login-flow-with-canceled-subscription)
7. [Error Handling](#error-handling)

---

## New Registration Flow

### Step 1: Personal Information & Email Verification

**User Actions:**
1. User enters personal information:
   - First Name
   - Last Name
   - Email
   - Password
   - Phone Number
   - Profession (multiple select)
   - Country

2. **Email Verification (OTP-based):**
   - User clicks "Verify" button next to email field
   - System checks if email is already registered:
     - If registered with **completed** registration → Shows error, blocks verification
     - If registered with **incomplete** registration → Skips verification, auto-fills data (see [Resume Flow](#resume-registration-flow))
     - If new email → Proceeds with OTP verification
   - OTP (6-digit code) is sent via Resend email service
   - User enters OTP and clicks "Confirm"
   - System verifies OTP and marks email as verified
   - **30-second cooldown** for resend functionality

3. User clicks "Continue" → Validates Step 1 → Proceeds to Step 2

**Data Storage:**
- No data stored in database at this step
- Email verification status stored in `auth.users.email_confirmed_at` and `public.users.email_verified`

### Step 2: Company Information

**User Actions:**
1. User enters company information:
   - Business Size
   - Company Name
   - VAT Number
   - Company Address
   - Company City
   - Company Postal Code
   - Company State
   - Company Website (optional)
   - Company IBAN (optional)
   - Company Account Name (optional)
   - Company Bank Name (optional)

2. User clicks "Continue" → Validates Step 2 → Proceeds to Step 3

**Data Storage:**
- No data stored in database at this step

### Step 3: Plan Selection & Payment

**User Actions:**
1. User selects:
   - Plan (Starter/Pro)
   - Billing Cycle (Monthly/Yearly)
   - Accepts Terms and Conditions

2. User clicks "Start Trial"

**System Actions:**
1. **Email Uniqueness Check:**
   - Calls `checkUserRegistration` edge function
   - If email already registered with completed registration → Shows error, blocks registration
   - If email already registered with incomplete registration → Triggers resume flow

2. **Create Auth User:**
   - Calls `completeRegistration(formData)`
   - Creates user in `auth.users` with metadata (Step 1 fields)
   - If user already exists (from email verification) → Signs in and updates metadata

3. **Save Step 1 Data to Database (BEFORE Payment):**
   - Calls `saveUserDataBeforePayment(userId, formData)`
   - Upserts to `users` table with:
     - `registration_completed: false`
     - `subscription_status: 'trial'`
     - All Step 1 fields (firstName, lastName, phone, companyName, vatNumber, profession, country, businessSize, selectedPlan, emailVerified)

4. **Save Step 2 Data to Database (BEFORE Payment):**
   - Calls `saveCompanyProfileBeforePayment(userId, formData)`
   - Upserts/inserts to `company_profiles` table with:
     - All Step 2 fields (address, city, postal_code, state, website, iban, account_name, bank_name)
     - `is_default: true`

5. **Create Stripe Checkout Session:**
   - Calls `createCheckoutSession` with plan and user data
   - Returns Stripe checkout URL

6. **Store Registration Data:**
   - Stores all form data in `sessionStorage` as `registration_pending`
   - Redirects to Stripe checkout URL

### After Payment (Stripe Success Page)

**System Actions:**
1. User completes payment on Stripe
2. Stripe redirects to `/stripe-success?session_id=...`
3. System processes payment:
   - Fetches Stripe session data
   - Retrieves registration data from `sessionStorage`
   - Calls `RegistrationService.completeRegistration()`

4. **Registration Completion:**
   - Updates `users` table:
     - Sets `registration_completed: true`
     - Updates subscription status
     - Adds Stripe customer ID and subscription ID
   - Creates user profile in `user_profiles` table
   - Updates `company_profiles` with `profile_id` link
   - Sends welcome registration email (with PIN code 0000)
   - Sends subscription notification email

5. Redirects to dashboard

---

## Resume Registration Flow

### Entry Points

1. **From Login Page:**
   - User with incomplete registration tries to log in
   - System detects incomplete registration
   - Shows "Complete Registration" button
   - Redirects to `/register?email={email}&resume=true`

2. **Direct Registration Page Access:**
   - User enters email that has incomplete registration
   - System auto-detects incomplete registration
   - Skips email verification (email already verified)
   - Auto-fills all data
   - Shows resume message

### Auto-Detection Flow

**When User Enters Email (Step 1):**

1. System checks email via `checkUserRegistration` edge function
2. If incomplete registration detected:
   - **Skips email verification** (email was already verified in previous attempt)
   - Sets `emailVerified: true` automatically
   - Calls `onIncompleteRegistrationDetected` callback
   - Triggers `fetchUserDataForResume(email)`

3. **Auto-Fill Process:**
   - Fetches user data from `users` table (Step 1 fields)
   - Fetches company profile from `company_profiles` table (Step 2 fields)
   - Uses `checkUserRegistration` edge function to bypass RLS (Row Level Security)
   - Parses profession from JSON string to array format
   - Auto-fills all form fields
   - Sets `isResumingRegistration: true`
   - Shows resume message banner

4. **Resume Message:**
   - Blue info banner: "Resuming incomplete registration"
   - Description: "We found an incomplete registration for this email. Your information has been auto-filled. Please review and continue to complete your registration."

### Step 3: Payment Completion

**User Actions:**
1. User reviews/edits auto-filled data
2. User clicks "Start Trial"

**System Actions:**
1. **Check Registration Status:**
   - Calls `checkUserRegistration(email)`
   - Detects `userExists: true` and `registrationComplete: false`

2. **Resume Flow:**
   - Sets `isResumingRegistration: true`
   - Stores `registration_pending` in `sessionStorage`

3. **Sign In User:**
   - Calls `supabase.auth.signInWithPassword(email, password)`
   - If password mismatch → Shows error with options
   - If other error → Shows error message

4. **Update Auth Metadata:**
   - Updates `auth.users.user_metadata` with Step 1 fields

5. **Save Step 1 Data (BEFORE Payment):**
   - Calls `saveUserDataBeforePayment(userId, formData)`
   - Updates existing record in `users` table

6. **Save Step 2 Data (BEFORE Payment):**
   - Calls `saveCompanyProfileBeforePayment(userId, formData)`
   - Updates/creates record in `company_profiles` table

7. **Create Stripe Checkout Session:**
   - Calls `createCheckoutSession` with updated form data

8. **Show Resume Message:**
   - "Resuming incomplete registration. Redirecting to payment..."
   - 1.5 second delay

9. **Redirect to Stripe Checkout**

### After Payment (Stripe Success Page)

- Same as new registration flow
- Registration is completed and user is redirected to dashboard

---

## Data Persistence Strategy

### Before Payment (Both Flows)

**Step 1 Fields → `users` Table:**
- `id` (user ID)
- `email`
- `first_name`
- `last_name`
- `phone`
- `company_name`
- `vat_number`
- `profession` (stored as JSON string or array)
- `country`
- `business_size`
- `selected_plan`
- `registration_completed: false` ⚠️ **Critical: Must be false**
- `subscription_status: 'trial'`
- `email_verified: true` (if email was verified)

**Step 2 Fields → `company_profiles` Table:**
- `user_id` (foreign key to users)
- `company_name`
- `vat_number`
- `address`
- `city`
- `postal_code`
- `state`
- `country`
- `phone`
- `email`
- `website`
- `iban`
- `account_name`
- `bank_name`
- `is_default: true`

**Backup Storage:**
- All fields also stored in `sessionStorage` as `registration_pending` (backup)

### After Successful Payment

**`users` Table Updates:**
- `registration_completed: true` ⚠️ **Critical: Must be true**
- `subscription_status: 'trialing'` or `'active'`
- `stripe_customer_id`
- `stripe_subscription_id`
- `trial_start_date`
- `trial_end_date`

**`company_profiles` Table Updates:**
- `profile_id` (linked to `user_profiles.id`)

**`user_profiles` Table:**
- Admin profile created with full permissions

### If Payment Fails

- All data remains in database
- User can resume from login page or registration page
- Form auto-fills from database on resume
- No data loss occurs

---

## Email Verification

### OTP-Based Verification System

**Technology:**
- Uses Resend API for sending emails
- OTP stored in `email_verification_otps` table
- 6-digit code, 10-minute expiration
- Maximum 5 failed attempts

**Flow:**
1. User clicks "Verify" button
2. System checks if email already registered:
   - **Completed registration** → Error: "This email is already registered. Please log in instead."
   - **Incomplete registration** → Skips verification, auto-fills data
   - **New email** → Proceeds with OTP
3. OTP sent via Resend
4. User enters OTP and clicks "Confirm"
5. System verifies OTP:
   - Valid → Sets `emailVerified: true`, updates `auth.users.email_confirmed_at` and `public.users.email_verified`
   - Invalid/expired → Shows error
6. **30-second cooldown** for resend functionality

**Special Cases:**
- **Incomplete Registration:** Email verification is automatically skipped (email was already verified in previous attempt)
- **Page Refresh:** Verification status is restored from `auth.users` and `public.users` tables

---

## Payment Flow

### Stripe Integration

**Checkout Session Creation:**
- Created with 14-day trial period
- Includes all user data in metadata
- Returns Stripe checkout URL

**Payment Success:**
- Stripe redirects to `/stripe-success?session_id=...`
- System fetches real Stripe session data
- Calls `RegistrationService.completeRegistration()`
- Updates database with subscription information
- Sends welcome emails

**Payment Failure:**
- User remains on Stripe checkout page
- Can retry payment
- All registration data preserved in database
- Can resume registration later

---

## Login Flow with Canceled Subscription

### Overview

When a user with a canceled or expired subscription attempts to log in, the system follows a specific flow to handle access control and provide options for subscription renewal.

### Login Process

**Step 1: Authentication**
1. User enters email and password
2. System authenticates via `supabase.auth.signInWithPassword`
3. If credentials are invalid → Shows error message
4. If credentials are valid → Proceeds to Step 2

**Step 2: Registration Completion Check**
1. System checks if user exists in `users` table
2. If user doesn't exist → Signs out, shows "Registration incomplete" error
3. If `registration_completed` is `false` → Signs out, shows "Registration incomplete" error with "Complete Registration" button
4. If `registration_completed` is `true` → Proceeds to Step 3

**Step 3: Subscription Status Check (ProtectedRoute)**
1. User is redirected to dashboard (or role-based page)
2. `ProtectedRoute` component checks subscription status:
   - **Super Admin Check:** If `role === 'superadmin'` → Access granted (bypasses subscription check)
   - **Lifetime Access Check:** If `has_lifetime_access === true` → Access granted (bypasses subscription check)
   - **Support Email Check:** Special email gets lifetime access automatically
   - **Subscription Fetch:** Queries `subscriptions` table for latest subscription

**Step 4: Subscription Validation**
1. System checks subscription data:
   - **Status Check:** Must be `'active'`, `'trialing'`, or `'trial'`
   - **Trial Expiration:** If `trial_end` has passed and status is `'trialing'` or `'trial'` → Expired
   - **Period End:** If `current_period_end` has passed → Expired
   - **Cancel Flag:** If `cancel_at_period_end === true`:
     - Subscription remains active until `current_period_end`
     - User can access app until period ends
     - After period ends → Expired

**Step 5: Access Control**
1. **If Subscription is Active:**
   - User gains full access to application
   - Subscription status cached for 30 minutes
   - Normal app usage continues

2. **If Subscription is Canceled/Expired:**
   - **Expired Modal Displayed:**
     - Title: "Subscription Expired" or "No Active Subscription"
     - Message: Explains subscription status
     - Two action buttons:
       - **"Manage Subscription"** → Navigates to `/subscription` page
       - **"Logout"** → Signs out user and redirects to login

### Canceled Subscription States

**1. Canceled at Period End (`cancel_at_period_end: true`)**
- Subscription status remains `'active'` until `current_period_end`
- User retains access until billing period ends
- After period ends → Status changes to `'expired'`
- User can reactivate before period ends from subscription page

**2. Immediately Canceled (`status: 'cancelled'`)**
- Access is immediately blocked
- Expired modal is shown
- User must reactivate subscription to regain access

**3. Expired Subscription**
- `current_period_end` has passed
- `trial_end` has passed (for trial subscriptions)
- Access is blocked
- Expired modal is shown

**4. No Subscription Found**
- No record in `subscriptions` table
- Access is blocked
- Shows "No Active Subscription" modal

### Subscription Reactivation Flow

**From Expired Modal:**
1. User clicks "Manage Subscription" button
2. Redirects to `/subscription` page
3. User can:
   - View current subscription status
   - Select a new plan
   - Reactivate subscription
   - Update payment method

**From Subscription Page:**
1. User selects a plan (Starter/Pro)
2. User selects billing cycle (Monthly/Yearly)
3. User clicks "Subscribe" or "Reactivate"
4. System creates Stripe checkout session
5. User completes payment
6. Subscription status updated to `'active'`
7. User regains full access

### Caching Strategy

**Subscription Cache:**
- Stored in `localStorage` with key `haliqo_subscription_cache`
- Cache duration: 30 minutes
- Cache includes:
  - User ID
  - Subscription status
  - Subscription data (dates, status)
  - Super admin flag
  - Lifetime access flag
  - Timestamp

**Cache Usage:**
- Primary: Always fetch fresh data from database
- Fallback: Use cache only if network request fails
- Expiration Check: Even with valid cache, system checks if subscription dates have passed
- Cache Reset: Updated on every successful subscription check (resets 30-min timer)

### Important Notes

⚠️ **Critical Behaviors:**
1. **Registration Must Be Complete:** Users with `registration_completed: false` cannot log in, even if subscription is active
2. **Period End Access:** Users with `cancel_at_period_end: true` retain access until `current_period_end` date
3. **Super Admin Bypass:** Super admins and lifetime access users bypass all subscription checks
4. **Network Resilience:** System uses cached subscription data if network fails to prevent locking users out
5. **Date Validation:** System checks both subscription status and date-based expiration (trial_end, current_period_end)

---

## Error Handling

### Email Already Registered

**Completed Registration:**
- Error: "This email is already registered. Please log in instead."
- Blocks registration

**Incomplete Registration:**
- Auto-detects and triggers resume flow
- Skips email verification
- Auto-fills data
- Shows resume message

### Password Mismatch (Resume Flow)

- Error: "This email is already registered but payment was not completed. Please either: 1. Use your original password, or 2. Use 'Forgot Password' to reset it, then try registering again."
- Provides clear options to user

### Payment Failure

- Error: "Payment failed"
- All data preserved in database
- User can retry or resume later

### Database Errors

- Errors are logged but don't block registration
- Data persistence is best-effort
- `sessionStorage` serves as backup

### Subscription Errors

**Network Errors:**
- System falls back to cached subscription data
- If no cache available → Allows access (prevents locking users out)
- Logs error for debugging

**Subscription Not Found:**
- Shows "No Active Subscription" modal
- User can navigate to subscription page to subscribe

---

## Key Features

### 1. Email Verification
- OTP-based (Resend)
- Required for new users
- Skipped for incomplete registrations
- Status persists across page refreshes

### 2. Data Persistence
- All fields saved **before payment**
- Ensures data is preserved even if payment fails
- Auto-fill works seamlessly on resume

### 3. Resume Capability
- Auto-detection of incomplete registrations
- Automatic data retrieval and form population
- Clear UI messaging
- No duplicate email verification required

### 4. Error Handling
- Clear error messages
- Helpful guidance for password mismatches
- Graceful degradation

### 5. Security
- Email uniqueness check
- Password validation
- OTP verification with expiration and attempt limits
- RLS (Row Level Security) bypassed via edge functions for resume flow

---

## Database Tables

### `users` Table
Stores Step 1 fields and user account information.

**Key Fields:**
- `id` (UUID, primary key)
- `email` (unique)
- `first_name`
- `last_name`
- `phone`
- `company_name`
- `vat_number`
- `profession` (JSON string or array)
- `country`
- `business_size`
- `selected_plan`
- `registration_completed` (BOOLEAN) ⚠️ **Critical field**
- `subscription_status`
- `email_verified` (BOOLEAN)
- `email_verified_at` (TIMESTAMP)
- `stripe_customer_id`
- `stripe_subscription_id`

### `company_profiles` Table
Stores Step 2 fields (company information).

**Key Fields:**
- `id` (UUID, primary key)
- `user_id` (foreign key to users)
- `profile_id` (foreign key to user_profiles, set after payment)
- `company_name`
- `vat_number`
- `address`
- `city`
- `postal_code`
- `state`
- `country`
- `phone`
- `email`
- `website`
- `iban`
- `account_name`
- `bank_name`
- `is_default` (BOOLEAN)

### `email_verification_otps` Table
Stores OTP codes for email verification.

**Key Fields:**
- `id` (UUID, primary key)
- `email` (unique)
- `otp` (6-digit code)
- `expires_at` (TIMESTAMP, 10 minutes from creation)
- `attempts` (INTEGER, max 5)
- `created_at` (TIMESTAMP)

### `subscriptions` Table
Stores subscription information for users.

**Key Fields:**
- `id` (UUID, primary key)
- `user_id` (foreign key to users)
- `status` (ENUM: 'active', 'trialing', 'trial', 'cancelled', 'past_due', 'unpaid')
- `cancel_at_period_end` (BOOLEAN) - If true, subscription will cancel at period end
- `current_period_end` (TIMESTAMP) - End date of current billing period
- `trial_end` (TIMESTAMP) - End date of trial period (if applicable)
- `stripe_subscription_id` (string) - Stripe subscription ID
- `stripe_customer_id` (string) - Stripe customer ID
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Edge Functions

### `check-user-registration`
**Purpose:** Check if email is registered and get user data for resume.

**Input:**
- `email` (string)

**Output:**
- `userExists` (boolean)
- `userId` (UUID, if exists)
- `registrationComplete` (boolean)
- `canRegister` (boolean)
- `companyProfile` (object, if exists) - **Bypasses RLS using service role**

**Usage:**
- Email uniqueness check
- Resume registration detection
- Auto-fill data retrieval

### `email-verification-otp`
**Purpose:** Generate and verify OTP codes for email verification.

**Actions:**
- `generate`: Creates OTP, stores in database, sends email via Resend
- `verify`: Validates OTP, updates email verification status

**Input:**
- `action` ('generate' | 'verify')
- `email` (string)
- `otp` (string, for verify action)
- `language` (string, optional)

**Output:**
- `success` (boolean)
- `message` (string)
- `error` (string, if failed)

---

## Important Notes

### Registration Completion Flag

⚠️ **Critical:** The `registration_completed` field in `users` table must be:
- `false` (BOOLEAN) before payment
- `true` (BOOLEAN) after successful payment

The system defensively handles both boolean and string values, but the database should store boolean values.

### RLS (Row Level Security)

The `company_profiles` table has RLS policies that require authentication. For the resume flow:
- The `check-user-registration` edge function uses **service role** to bypass RLS
- Company profile data is included in the edge function response
- Frontend uses this data instead of direct queries

### Email Verification for Incomplete Registrations

- **Skipped automatically** - Email was already verified in previous attempt
- `emailVerified: true` is set automatically
- No OTP required
- User can proceed directly to Step 2

### Data Auto-Fill

When resuming registration:
- All Step 1 fields from `users` table
- All Step 2 fields from `company_profiles` table
- Profession parsed from JSON string to array format
- Email verification status restored
- Resume message displayed

---

## Testing Checklist

### New Registration
- [ ] User can enter email and verify with OTP
- [ ] Email verification status persists on page refresh
- [ ] User can proceed to Step 2 after verification
- [ ] User can proceed to Step 3 after Step 2
- [ ] Data is saved to database before payment
- [ ] Payment redirects to Stripe
- [ ] After payment, registration is completed
- [ ] Welcome email is sent

### Resume Registration (From Login)
- [ ] Incomplete registration detected on login
- [ ] "Complete Registration" button appears
- [ ] Redirects to registration page with email pre-filled
- [ ] Resume message is displayed
- [ ] All data is auto-filled
- [ ] Email verification is skipped
- [ ] User can proceed through steps
- [ ] Payment completes registration

### Resume Registration (Direct Access)
- [ ] User enters email with incomplete registration
- [ ] System auto-detects incomplete registration
- [ ] Email verification is skipped
- [ ] Data is auto-filled automatically
- [ ] Resume message is displayed
- [ ] User can proceed through steps
- [ ] Payment completes registration

### Login with Canceled Subscription
- [ ] User with canceled subscription can log in (authentication succeeds)
- [ ] Registration completion check passes
- [ ] User redirected to dashboard
- [ ] ProtectedRoute checks subscription status
- [ ] Expired modal is displayed for canceled/expired subscriptions
- [ ] "Manage Subscription" button navigates to subscription page
- [ ] "Logout" button signs out user
- [ ] User can reactivate subscription from subscription page
- [ ] After reactivation, user regains full access

### Error Cases
- [ ] Email already registered (completed) → Error shown
- [ ] Password mismatch on resume → Error with options shown
- [ ] Payment failure → Data preserved, can resume
- [ ] OTP expiration → Error shown, can resend
- [ ] Canceled subscription → Expired modal shown, can reactivate
- [ ] Network error during subscription check → Falls back to cache

---

## Future Improvements

1. **Email Verification Status Persistence:**
   - Currently persists across page refreshes
   - Could add localStorage backup

2. **Data Validation:**
   - Add more robust validation for company fields
   - Validate IBAN format

3. **Resume Flow Optimization:**
   - Cache company profile data
   - Reduce database queries

4. **Error Recovery:**
   - Better error messages
   - Retry mechanisms for failed saves

---

## Related Files

### Registration Flow
- `src/pages/register/index.jsx` - Main registration component
- `src/pages/register/components/StepOne.jsx` - Step 1 with email verification
- `src/pages/register/components/StepTwo.jsx` - Step 2 with company info
- `src/pages/register/components/StepThree.jsx` - Step 3 with plan selection
- `src/services/authService.js` - Authentication service (login, registration checks)
- `src/services/emailVerificationService.js` - Email verification service
- `src/services/registrationService.js` - Registration completion service
- `supabase/functions/check-user-registration/index.ts` - Edge function for checking registration status
- `supabase/functions/email-verification-otp/index.ts` - Edge function for OTP verification

### Login & Subscription Management
- `src/pages/login/index.jsx` - Login page component
- `src/components/ProtectedRoute.jsx` - Route protection with subscription checks
- `src/context/AuthContext.jsx` - Authentication context and state management
- `src/pages/subscription/index.jsx` - Subscription management page
- `src/services/stripeService.js` - Stripe integration service

---

**Last Updated:** December 2024
**Version:** 2.0

