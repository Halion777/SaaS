-- =====================================================
-- DROP Existing Email Templates for Re-creation
-- Run this BEFORE running the updated templates SQL
-- =====================================================

-- Delete invoice reminder templates
DELETE FROM public.email_templates WHERE template_type = 'invoice_payment_reminder';
DELETE FROM public.email_templates WHERE template_type = 'invoice_overdue_reminder';

-- Delete subscription templates
DELETE FROM public.email_templates WHERE template_type = 'subscription_upgraded';
DELETE FROM public.email_templates WHERE template_type = 'subscription_downgraded';
DELETE FROM public.email_templates WHERE template_type = 'subscription_cancelled';
DELETE FROM public.email_templates WHERE template_type = 'subscription_activated';
DELETE FROM public.email_templates WHERE template_type = 'subscription_trial_ending';

-- Delete lead templates
DELETE FROM public.email_templates WHERE template_type = 'new_lead_available';
DELETE FROM public.email_templates WHERE template_type = 'lead_assigned';

-- Delete custom quote sent templates
DELETE FROM public.email_templates WHERE template_type = 'custom_quote_sent';

-- Delete credit insurance templates
DELETE FROM public.email_templates WHERE template_type = 'credit_insurance_application';
DELETE FROM public.email_templates WHERE template_type = 'credit_insurance_confirmation';

-- Delete contact form templates
DELETE FROM public.email_templates WHERE template_type = 'contact_form';
