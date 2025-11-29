-- =====================================================
-- Invoice Follow-Up Email Templates
-- =====================================================

-- Add invoice template variables to email_template_variables table
INSERT INTO public.email_template_variables (variable_name, description, example_value, is_required) VALUES
('invoice_number', 'Invoice reference number', 'FACT-2024-001', true),
('invoice_title', 'Project title from invoice', 'Rénovation salle de bain', false),
('invoice_amount', 'Total invoice amount', '2,500.00€', true),
('issue_date', 'Invoice issue date', '15 décembre 2024', true),
('due_date', 'Payment due date', '31 décembre 2024', true),
('days_until_due', 'Days until payment due date', '3', false),
('days_overdue', 'Days since payment due date passed', '5', false),
('invoice_link', 'Direct link to view invoice', 'https://app.com/invoice/abc123', false),
('company_name', 'Your company name', 'Maçonnerie Pro', true),
('client_name', 'Client full name', 'Jean Dupont', true),
('client_first_name', 'Client first name only', 'Jean', false),
('payment_method', 'Payment method', 'Virement bancaire', false),
('payment_terms', 'Payment terms', 'Net 30', false)
ON CONFLICT (variable_name) DO NOTHING;

-- Invoice Payment Reminder Template (Approaching Deadline)
-- Updated to match SendEmailModal design with PDF attachment note
INSERT INTO public.email_templates (
  template_type,
  template_name,
  subject,
  html_content,
  text_content,
  variables,
  is_active,
  is_default,
  language
) VALUES (
  'invoice_payment_reminder',
  'Rappel de paiement - Échéance proche',
  'Facture {invoice_number} - Paiement à échéance dans {days_until_due} jour(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">Facture {invoice_number}</h2>
    <p>Bonjour {client_name},</p>
    <p>Nous vous rappelons que votre facture arrive à échéance dans <strong>{days_until_due} jour(s)</strong>.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Numéro de facture:</strong> {invoice_number}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 5px 0;"><strong>Date d''échéance:</strong> {due_date}</p>
      <p style="margin: 5px 0;"><strong>Montant:</strong> {invoice_amount}</p>
    </div>
    <p>Le PDF de la facture est joint à cet email.</p>
    <p>Cordialement,<br>{company_name}</p>
  </div>',
  'Rappel de paiement - Facture {invoice_number}

Bonjour {client_name},

Nous vous rappelons que votre facture arrive à échéance dans {days_until_due} jour(s).

Numéro de facture: {invoice_number}
Date: {issue_date}
Date d''échéance: {due_date}
Montant: {invoice_amount}

Le PDF de la facture est joint à cet email.

Cordialement,
{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_until_due": true, "invoice_link": true, "company_name": true}',
  true,
  true,
  'fr'
);

-- Invoice Overdue Reminder Template (Overdue)
-- Updated to match SendEmailModal design with PDF attachment note
INSERT INTO public.email_templates (
  template_type,
  template_name,
  subject,
  html_content,
  text_content,
  variables,
  is_active,
  is_default,
  language
) VALUES (
  'invoice_overdue_reminder',
  'Rappel de paiement - Facture en retard',
  'Facture {invoice_number} - Paiement en retard de {days_overdue} jour(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">Facture {invoice_number}</h2>
    <p>Bonjour {client_name},</p>
    <p>Nous vous informons que votre facture est en retard de <strong>{days_overdue} jour(s)</strong>.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Numéro de facture:</strong> {invoice_number}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 5px 0;"><strong>Date d''échéance:</strong> {due_date}</p>
      <p style="margin: 5px 0;"><strong>Montant:</strong> {invoice_amount}</p>
      <p style="margin: 5px 0; color: #dc2626;"><strong>Jours de retard:</strong> {days_overdue}</p>
    </div>
    <p>Le PDF de la facture est joint à cet email.</p>
    <p>Cordialement,<br>{company_name}</p>
  </div>',
  'Paiement en retard - Facture {invoice_number}

Bonjour {client_name},

Nous vous informons que votre facture est en retard de {days_overdue} jour(s).

Numéro de facture: {invoice_number}
Date: {issue_date}
Date d''échéance: {due_date}
Montant: {invoice_amount}
Jours de retard: {days_overdue}

Le PDF de la facture est joint à cet email.

Cordialement,
{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_overdue": true, "invoice_link": true, "company_name": true}',
  true,
  true,
  'fr'
);

-- Add English versions
-- Updated to match SendEmailModal design with PDF attachment note
INSERT INTO public.email_templates (
  template_type,
  template_name,
  subject,
  html_content,
  text_content,
  variables,
  is_active,
  is_default,
  language
) VALUES (
  'invoice_payment_reminder',
  'Payment Reminder - Due Soon',
  'Invoice {invoice_number} - Payment due in {days_until_due} day(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">Invoice {invoice_number}</h2>
    <p>Hello {client_name},</p>
    <p>We remind you that your invoice is due in <strong>{days_until_due} day(s)</strong>.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Invoice Number:</strong> {invoice_number}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 5px 0;"><strong>Due Date:</strong> {due_date}</p>
      <p style="margin: 5px 0;"><strong>Amount:</strong> {invoice_amount}</p>
    </div>
    <p>The invoice PDF is attached to this email.</p>
    <p>Best regards,<br>{company_name}</p>
  </div>',
  'Payment Reminder - Invoice {invoice_number}

Hello {client_name},

We remind you that your invoice is due in {days_until_due} day(s).

Invoice Number: {invoice_number}
Date: {issue_date}
Due Date: {due_date}
Amount: {invoice_amount}

The invoice PDF is attached to this email.

Best regards,
{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_until_due": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'en'
),
(
  'invoice_overdue_reminder',
  'Payment Reminder - Overdue',
  'Invoice {invoice_number} - Payment overdue by {days_overdue} day(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">Invoice {invoice_number}</h2>
    <p>Hello {client_name},</p>
    <p>We inform you that your invoice is overdue by <strong>{days_overdue} day(s)</strong>.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Invoice Number:</strong> {invoice_number}</p>
      <p style="margin: 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 5px 0;"><strong>Due Date:</strong> {due_date}</p>
      <p style="margin: 5px 0;"><strong>Amount:</strong> {invoice_amount}</p>
      <p style="margin: 5px 0; color: #dc2626;"><strong>Days Overdue:</strong> {days_overdue}</p>
    </div>
    <p>The invoice PDF is attached to this email.</p>
    <p>Best regards,<br>{company_name}</p>
  </div>',
  'Payment Overdue - Invoice {invoice_number}

Hello {client_name},

We inform you that your invoice is overdue by {days_overdue} day(s).

Invoice Number: {invoice_number}
Date: {issue_date}
Due Date: {due_date}
Amount: {invoice_amount}
Days Overdue: {days_overdue}

The invoice PDF is attached to this email.

Best regards,
{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_overdue": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'en'
);

-- Add Dutch versions
-- Updated to match SendEmailModal design with PDF attachment note
INSERT INTO public.email_templates (
  template_type,
  template_name,
  subject,
  html_content,
  text_content,
  variables,
  is_active,
  is_default,
  language
) VALUES (
  'invoice_payment_reminder',
  'Betalingsherinnering - Binnenkort verschuldigd',
  'Factuur {invoice_number} - Betaling verschuldigd over {days_until_due} dag(en)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">Factuur {invoice_number}</h2>
    <p>Hallo {client_name},</p>
    <p>We herinneren u eraan dat uw factuur over <strong>{days_until_due} dag(en)</strong> verschuldigd is.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Factuurnummer:</strong> {invoice_number}</p>
      <p style="margin: 5px 0;"><strong>Datum:</strong> {issue_date}</p>
      <p style="margin: 5px 0;"><strong>Vervaldatum:</strong> {due_date}</p>
      <p style="margin: 5px 0;"><strong>Bedrag:</strong> {invoice_amount}</p>
    </div>
    <p>De PDF van de factuur is bijgevoegd aan deze e-mail.</p>
    <p>Met vriendelijke groet,<br>{company_name}</p>
  </div>',
  'Betalingsherinnering - Factuur {invoice_number}

Hallo {client_name},

We herinneren u eraan dat uw factuur over {days_until_due} dag(en) verschuldigd is.

Factuurnummer: {invoice_number}
Datum: {issue_date}
Vervaldatum: {due_date}
Bedrag: {invoice_amount}

De PDF van de factuur is bijgevoegd aan deze e-mail.

Met vriendelijke groet,
{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_until_due": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'nl'
),
(
  'invoice_overdue_reminder',
  'Betalingsherinnering - Achterstallig',
  'Factuur {invoice_number} - Betaling {days_overdue} dag(en) achterstallig',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">Factuur {invoice_number}</h2>
    <p>Hallo {client_name},</p>
    <p>We informeren u dat uw factuur <strong>{days_overdue} dag(en)</strong> achterstallig is.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Factuurnummer:</strong> {invoice_number}</p>
      <p style="margin: 5px 0;"><strong>Datum:</strong> {issue_date}</p>
      <p style="margin: 5px 0;"><strong>Vervaldatum:</strong> {due_date}</p>
      <p style="margin: 5px 0;"><strong>Bedrag:</strong> {invoice_amount}</p>
      <p style="margin: 5px 0; color: #dc2626;"><strong>Achterstallig:</strong> {days_overdue} dag(en)</p>
    </div>
    <p>De PDF van de factuur is bijgevoegd aan deze e-mail.</p>
    <p>Met vriendelijke groet,<br>{company_name}</p>
  </div>',
  'Achterstallige betaling - Factuur {invoice_number}

Hallo {client_name},

We informeren u dat uw factuur {days_overdue} dag(en) achterstallig is.

Factuurnummer: {invoice_number}
Datum: {issue_date}
Vervaldatum: {due_date}
Bedrag: {invoice_amount}
Achterstallig: {days_overdue} dag(en)

De PDF van de factuur is bijgevoegd aan deze e-mail.

Met vriendelijke groet,
{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_overdue": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'nl'
);
