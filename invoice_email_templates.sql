-- =====================================================
-- Invoice Follow-Up Email Templates
-- =====================================================

-- Add invoice template variables to email_template_variables table
INSERT INTO public.email_template_variables (variable_name, description, example_value, is_required) VALUES
('invoice_number', 'Invoice reference number', 'FACT-2024-001', true),
('invoice_title', 'Project title from invoice', 'Rénovation salle de bain', true),
('invoice_amount', 'Total invoice amount', '2,500.00€', true),
('due_date', 'Payment due date', '31 décembre 2024', true),
('days_until_due', 'Days until payment due date', '3', false),
('days_overdue', 'Days since payment due date passed', '5', false),
('invoice_link', 'Direct link to view invoice', 'https://app.com/invoice/abc123', true),
('company_name', 'Your company name', 'Maçonnerie Pro', true),
('client_name', 'Client full name', 'Jean Dupont', true),
('client_first_name', 'Client first name only', 'Jean', false),
('payment_method', 'Payment method', 'Virement bancaire', false),
('payment_terms', 'Payment terms', 'Net 30', false)
ON CONFLICT (variable_name) DO NOTHING;

-- Invoice Payment Reminder Template (Approaching Deadline)
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
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Rappel de paiement</h1>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Facture {invoice_number}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous vous rappelons que votre facture arrive à échéance dans <strong>{days_until_due} jour(s)</strong>.</p>
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f5576c;">
        <p style="margin: 0; font-weight: bold; color: #333;">Montant : {invoice_amount}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Date d''échéance : {due_date}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{invoice_link}" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);">Voir la facture</a>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
      <p style="margin: 0; color: #856404; font-size: 14px;"><strong>💡 Information :</strong> Pour toute question concernant cette facture, n''hésitez pas à nous contacter.</p>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
  </div>',
  'Rappel de paiement - Facture {invoice_number}

Bonjour {client_name},

Nous vous rappelons que votre facture arrive à échéance dans {days_until_due} jour(s).

Montant : {invoice_amount}
Date d''échéance : {due_date}

Voir la facture : {invoice_link}

Pour toute question concernant cette facture, n''hésitez pas à nous contacter.

{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "days_until_due": true, "invoice_link": true, "company_name": true}',
  true,
  true,
  'fr'
);

-- Invoice Overdue Reminder Template (Overdue)
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
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Paiement en retard</h1>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Facture {invoice_number}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous vous informons que votre facture est en retard de <strong>{days_overdue} jour(s)</strong>.</p>
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #fa709a;">
        <p style="margin: 0; font-weight: bold; color: #333;">Montant : {invoice_amount}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Date d''échéance : {due_date}</p>
        <p style="margin: 5px 0 0 0; color: #dc3545; font-size: 14px; font-weight: bold;">Retard : {days_overdue} jour(s)</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{invoice_link}" style="background: #fa709a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3);">Voir la facture</a>
    </div>
    
    <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f5c6cb;">
      <p style="margin: 0; color: #721c24; font-size: 14px;"><strong>⚠️ Important :</strong> Veuillez régler cette facture dans les plus brefs délais. Pour toute question, contactez-nous immédiatement.</p>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
  </div>',
  'Paiement en retard - Facture {invoice_number}

Bonjour {client_name},

Nous vous informons que votre facture est en retard de {days_overdue} jour(s).

Montant : {invoice_amount}
Date d''échéance : {due_date}
Retard : {days_overdue} jour(s)

Voir la facture : {invoice_link}

⚠️ Important : Veuillez régler cette facture dans les plus brefs délais. Pour toute question, contactez-nous immédiatement.

{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "days_overdue": true, "invoice_link": true, "company_name": true}',
  true,
  true,
  'fr'
);

-- Add English versions
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
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Invoice {invoice_number}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We remind you that your invoice is due in <strong>{days_until_due} day(s)</strong>.</p>
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f5576c;">
        <p style="margin: 0; font-weight: bold; color: #333;">Amount: {invoice_amount}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Due date: {due_date}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{invoice_link}" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);">View Invoice</a>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
      <p style="margin: 0; color: #856404; font-size: 14px;"><strong>💡 Information:</strong> If you have any questions about this invoice, please do not hesitate to contact us.</p>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
  </div>',
  'Payment Reminder - Invoice {invoice_number}

Hello {client_name},

We remind you that your invoice is due in {days_until_due} day(s).

Amount: {invoice_amount}
Due date: {due_date}

View invoice: {invoice_link}

If you have any questions about this invoice, please do not hesitate to contact us.

{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "days_until_due": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'en'
),
(
  'invoice_overdue_reminder',
  'Payment Reminder - Overdue',
  'Invoice {invoice_number} - Payment overdue by {days_overdue} day(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Payment Overdue</h1>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Invoice {invoice_number}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We inform you that your invoice is overdue by <strong>{days_overdue} day(s)</strong>.</p>
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #fa709a;">
        <p style="margin: 0; font-weight: bold; color: #333;">Amount: {invoice_amount}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Due date: {due_date}</p>
        <p style="margin: 5px 0 0 0; color: #dc3545; font-size: 14px; font-weight: bold;">Overdue: {days_overdue} day(s)</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{invoice_link}" style="background: #fa709a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3);">View Invoice</a>
    </div>
    
    <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f5c6cb;">
      <p style="margin: 0; color: #721c24; font-size: 14px;"><strong>⚠️ Important:</strong> Please settle this invoice as soon as possible. If you have any questions, contact us immediately.</p>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
  </div>',
  'Payment Overdue - Invoice {invoice_number}

Hello {client_name},

We inform you that your invoice is overdue by {days_overdue} day(s).

Amount: {invoice_amount}
Due date: {due_date}
Overdue: {days_overdue} day(s)

View invoice: {invoice_link}

⚠️ Important: Please settle this invoice as soon as possible. If you have any questions, contact us immediately.

{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "days_overdue": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'en'
);

-- Add Dutch versions
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
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Betalingsherinnering</h1>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Factuur {invoice_number}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We herinneren u eraan dat uw factuur over <strong>{days_until_due} dag(en)</strong> verschuldigd is.</p>
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f5576c;">
        <p style="margin: 0; font-weight: bold; color: #333;">Bedrag: {invoice_amount}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Vervaldatum: {due_date}</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{invoice_link}" style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.3);">Factuur bekijken</a>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
      <p style="margin: 0; color: #856404; font-size: 14px;"><strong>💡 Informatie:</strong> Als u vragen heeft over deze factuur, neem dan gerust contact met ons op.</p>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
  </div>',
  'Betalingsherinnering - Factuur {invoice_number}

Hallo {client_name},

We herinneren u eraan dat uw factuur over {days_until_due} dag(en) verschuldigd is.

Bedrag: {invoice_amount}
Vervaldatum: {due_date}

Factuur bekijken: {invoice_link}

Als u vragen heeft over deze factuur, neem dan gerust contact met ons op.

{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "days_until_due": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'nl'
),
(
  'invoice_overdue_reminder',
  'Betalingsherinnering - Achterstallig',
  'Factuur {invoice_number} - Betaling {days_overdue} dag(en) achterstallig',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Achterstallige betaling</h1>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Factuur {invoice_number}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We informeren u dat uw factuur <strong>{days_overdue} dag(en)</strong> achterstallig is.</p>
      <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #fa709a;">
        <p style="margin: 0; font-weight: bold; color: #333;">Bedrag: {invoice_amount}</p>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Vervaldatum: {due_date}</p>
        <p style="margin: 5px 0 0 0; color: #dc3545; font-size: 14px; font-weight: bold;">Achterstallig: {days_overdue} dag(en)</p>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{invoice_link}" style="background: #fa709a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(250, 112, 154, 0.3);">Factuur bekijken</a>
    </div>
    
    <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #f5c6cb;">
      <p style="margin: 0; color: #721c24; font-size: 14px;"><strong>⚠️ Belangrijk:</strong> Gelieve deze factuur zo spoedig mogelijk te betalen. Als u vragen heeft, neem dan onmiddellijk contact met ons op.</p>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
  </div>',
  'Achterstallige betaling - Factuur {invoice_number}

Hallo {client_name},

We informeren u dat uw factuur {days_overdue} dag(en) achterstallig is.

Bedrag: {invoice_amount}
Vervaldatum: {due_date}
Achterstallig: {days_overdue} dag(en)

Factuur bekijken: {invoice_link}

⚠️ Belangrijk: Gelieve deze factuur zo spoedig mogelijk te betalen. Als u vragen heeft, neem dan onmiddellijk contact met ons op.

{company_name}',
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "days_overdue": true, "invoice_link": true, "company_name": true}',
  true,
  false,
  'nl'
);

