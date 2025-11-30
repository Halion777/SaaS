
-- =====================================================
-- Consistent Email Templates (Matching Quote Template Style)
-- No emojis, clean design, consistent structure
-- =====================================================

-- =====================================================
-- INVOICE PAYMENT REMINDER TEMPLATES
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_payment_reminder',
  'Rappel de paiement - Échéance proche',
  'Facture {invoice_number} - Paiement à échéance dans {days_until_due} jour(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Rappel de paiement</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Facture {invoice_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous vous rappelons que votre facture arrive à échéance dans <strong>{days_until_due} jour(s)</strong>.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Numéro de facture:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date d''échéance:</strong> {due_date}</p>
      <p style="margin: 0; font-weight: bold; color: #333;"><strong>Montant:</strong> {invoice_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Le PDF de la facture est joint à cet email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cordialement,<br>{company_name}</p>
  </div>
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
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_until_due": true, "company_name": true}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_payment_reminder',
  'Payment Reminder - Due Soon',
  'Invoice {invoice_number} - Payment due in {days_until_due} day(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Reminder</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Invoice {invoice_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We remind you that your invoice is due in <strong>{days_until_due} day(s)</strong>.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Invoice Number:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Due Date:</strong> {due_date}</p>
      <p style="margin: 0; font-weight: bold; color: #333;"><strong>Amount:</strong> {invoice_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">The invoice PDF is attached to this email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Best regards,<br>{company_name}</p>
  </div>
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
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_until_due": true, "company_name": true}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_payment_reminder',
  'Betalingsherinnering - Binnenkort verschuldigd',
  'Factuur {invoice_number} - Betaling verschuldigd over {days_until_due} dag(en)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Betalingsherinnering</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Factuur {invoice_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We herinneren u eraan dat uw factuur over <strong>{days_until_due} dag(en)</strong> verschuldigd is.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Factuurnummer:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Datum:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Vervaldatum:</strong> {due_date}</p>
      <p style="margin: 0; font-weight: bold; color: #333;"><strong>Bedrag:</strong> {invoice_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">De PDF van de factuur is bijgevoegd aan deze e-mail.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Met vriendelijke groet,<br>{company_name}</p>
  </div>
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
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_until_due": true, "company_name": true}',
  true, false, 'nl'
);

-- =====================================================
-- INVOICE OVERDUE REMINDER TEMPLATES
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_overdue_reminder',
  'Rappel de paiement - Facture en retard',
  'Facture {invoice_number} - Paiement en retard de {days_overdue} jour(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Paiement en retard</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Facture {invoice_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous vous informons que votre facture est en retard de <strong>{days_overdue} jour(s)</strong>.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ff6b6b;">
      <p style="margin: 0 0 5px 0;"><strong>Numéro de facture:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date d''échéance:</strong> {due_date}</p>
      <p style="margin: 0 0 5px 0; font-weight: bold; color: #333;"><strong>Montant:</strong> {invoice_amount}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Jours de retard:</strong> {days_overdue}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Le PDF de la facture est joint à cet email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cordialement,<br>{company_name}</p>
  </div>
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
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_overdue": true, "company_name": true}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_overdue_reminder',
  'Payment Reminder - Overdue',
  'Invoice {invoice_number} - Payment overdue by {days_overdue} day(s)',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Payment Overdue</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Invoice {invoice_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We inform you that your invoice is overdue by <strong>{days_overdue} day(s)</strong>.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ff6b6b;">
      <p style="margin: 0 0 5px 0;"><strong>Invoice Number:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Due Date:</strong> {due_date}</p>
      <p style="margin: 0 0 5px 0; font-weight: bold; color: #333;"><strong>Amount:</strong> {invoice_amount}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Days Overdue:</strong> {days_overdue}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">The invoice PDF is attached to this email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Best regards,<br>{company_name}</p>
  </div>
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
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_overdue": true, "company_name": true}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_overdue_reminder',
  'Betalingsherinnering - Achterstallig',
  'Factuur {invoice_number} - Betaling {days_overdue} dag(en) achterstallig',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Achterstallige betaling</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Factuur {invoice_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We informeren u dat uw factuur <strong>{days_overdue} dag(en)</strong> achterstallig is.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ff6b6b;">
      <p style="margin: 0 0 5px 0;"><strong>Factuurnummer:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Datum:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Vervaldatum:</strong> {due_date}</p>
      <p style="margin: 0 0 5px 0; font-weight: bold; color: #333;"><strong>Bedrag:</strong> {invoice_amount}</p>
      <p style="margin: 0; color: #dc2626;"><strong>Achterstallig:</strong> {days_overdue} dag(en)</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">De PDF van de factuur is bijgevoegd aan deze e-mail.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Met vriendelijke groet,<br>{company_name}</p>
  </div>
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
  '{"invoice_number": true, "client_name": true, "invoice_amount": true, "due_date": true, "issue_date": true, "days_overdue": true, "company_name": true}',
  true, false, 'nl'
);

-- =====================================================
-- SUBSCRIPTION ACTIVATED TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_activated',
  'Abonnement activé',
  'Votre abonnement est activé - Bienvenue chez {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement activé</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Bienvenue chez {company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Félicitations ! Votre abonnement est maintenant activé.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Montant:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0 0 5px 0;"><strong>Statut:</strong> Actif</p>
      <p style="margin: 0;"><strong>Date d''activation:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Vous avez maintenant accès à toutes les fonctionnalités de votre plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Bienvenue dans l''équipe !<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Abonnement activé - Bienvenue chez {company_name}

Bonjour {user_name},

Félicitations ! Votre abonnement est maintenant activé.

Plan: {new_plan_name}
Montant: {new_amount}€ / {billing_interval}
Statut: Actif
Date d''activation: {effective_date}

Vous avez maintenant accès à toutes les fonctionnalités de votre plan.

Bienvenue dans l''équipe !
L''équipe {company_name}',
  '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_activated',
  'Subscription Activated',
  'Your subscription is activated - Welcome to {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Activated</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Welcome to {company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Congratulations! Your subscription is now activated.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Amount:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0 0 5px 0;"><strong>Status:</strong> Active</p>
      <p style="margin: 0;"><strong>Activation Date:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">You now have access to all features of your plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Welcome to the team!<br>The {company_name} Team</p>
  </div>
</div>',
  'Subscription Activated - Welcome to {company_name}

Hello {user_name},

Congratulations! Your subscription is now activated.

Plan: {new_plan_name}
Amount: {new_amount}€ / {billing_interval}
Status: Active
Activation Date: {effective_date}

You now have access to all features of your plan.

Welcome to the team!
The {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_activated',
  'Abonnement geactiveerd',
  'Uw abonnement is geactiveerd - Welkom bij {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement geactiveerd</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Welkom bij {company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Gefeliciteerd! Uw abonnement is nu geactiveerd.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Bedrag:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0 0 5px 0;"><strong>Status:</strong> Actief</p>
      <p style="margin: 0;"><strong>Activeringsdatum:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">U heeft nu toegang tot alle functies van uw plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Welkom in het team!<br>Het {company_name} Team</p>
  </div>
</div>',
  'Abonnement geactiveerd - Welkom bij {company_name}

Hallo {user_name},

Gefeliciteerd! Uw abonnement is nu geactiveerd.

Plan: {new_plan_name}
Bedrag: {new_amount}€ / {billing_interval}
Status: Actief
Activeringsdatum: {effective_date}

U heeft nu toegang tot alle functies van uw plan.

Welkom in het team!
Het {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- SUBSCRIPTION UPGRADED TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_upgraded',
  'Abonnement mis à niveau',
  'Votre abonnement a été mis à niveau - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement mis à niveau</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre abonnement a été mis à niveau avec succès.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Ancien plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Nouveau plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Montant:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0;"><strong>Date d''effet:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Vous avez maintenant accès à toutes les fonctionnalités de votre nouveau plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cordialement,<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Abonnement mis à niveau - {company_name}

Bonjour {user_name},

Votre abonnement a été mis à niveau avec succès.

Ancien plan: {old_plan_name}
Nouveau plan: {new_plan_name}
Montant: {new_amount}€ / {billing_interval}
Date d''effet: {effective_date}

Vous avez maintenant accès à toutes les fonctionnalités de votre nouveau plan.

Cordialement,
L''équipe {company_name}',
  '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_upgraded',
  'Subscription Upgraded',
  'Your subscription has been upgraded - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Upgraded</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Your subscription has been upgraded successfully.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Previous Plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>New Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Amount:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0;"><strong>Effective Date:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">You now have access to all features of your new plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Best regards,<br>The {company_name} Team</p>
  </div>
</div>',
  'Subscription Upgraded - {company_name}

Hello {user_name},

Your subscription has been upgraded successfully.

Previous Plan: {old_plan_name}
New Plan: {new_plan_name}
Amount: {new_amount}€ / {billing_interval}
Effective Date: {effective_date}

You now have access to all features of your new plan.

Best regards,
The {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_upgraded',
  'Abonnement geüpgraded',
  'Uw abonnement is geüpgraded - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement geüpgraded</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Uw abonnement is met succes geüpgraded.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Vorig Plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Nieuw Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Bedrag:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0;"><strong>Ingangsdatum:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">U heeft nu toegang tot alle functies van uw nieuwe plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Met vriendelijke groet,<br>Het {company_name} Team</p>
  </div>
</div>',
  'Abonnement geüpgraded - {company_name}

Hallo {user_name},

Uw abonnement is met succes geüpgraded.

Vorig Plan: {old_plan_name}
Nieuw Plan: {new_plan_name}
Bedrag: {new_amount}€ / {billing_interval}
Ingangsdatum: {effective_date}

U heeft nu toegang tot alle functies van uw nieuwe plan.

Met vriendelijke groet,
Het {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- SUBSCRIPTION DOWNGRADED TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_downgraded',
  'Abonnement modifié',
  'Modification de votre abonnement - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement modifié</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre abonnement a été modifié selon votre demande.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #feca57;">
      <p style="margin: 0 0 5px 0;"><strong>Ancien plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Nouveau plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Montant:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0;"><strong>Date d''effet:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Vos données et fonctionnalités existantes sont préservées.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cordialement,<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Abonnement modifié - {company_name}

Bonjour {user_name},

Votre abonnement a été modifié selon votre demande.

Ancien plan: {old_plan_name}
Nouveau plan: {new_plan_name}
Montant: {new_amount}€ / {billing_interval}
Date d''effet: {effective_date}

Vos données et fonctionnalités existantes sont préservées.

Cordialement,
L''équipe {company_name}',
  '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_downgraded',
  'Subscription Modified',
  'Your subscription has been modified - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Modified</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Your subscription has been modified as requested.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #feca57;">
      <p style="margin: 0 0 5px 0;"><strong>Previous Plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>New Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Amount:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0;"><strong>Effective Date:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Your existing data and features are preserved.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Best regards,<br>The {company_name} Team</p>
  </div>
</div>',
  'Subscription Modified - {company_name}

Hello {user_name},

Your subscription has been modified as requested.

Previous Plan: {old_plan_name}
New Plan: {new_plan_name}
Amount: {new_amount}€ / {billing_interval}
Effective Date: {effective_date}

Your existing data and features are preserved.

Best regards,
The {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_downgraded',
  'Abonnement gewijzigd',
  'Uw abonnement is gewijzigd - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement gewijzigd</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Uw abonnement is gewijzigd zoals aangevraagd.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #feca57;">
      <p style="margin: 0 0 5px 0;"><strong>Vorig Plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Nieuw Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Bedrag:</strong> {new_amount}€ / {billing_interval}</p>
      <p style="margin: 0;"><strong>Ingangsdatum:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Uw bestaande gegevens en functies blijven behouden.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Met vriendelijke groet,<br>Het {company_name} Team</p>
  </div>
</div>',
  'Abonnement gewijzigd - {company_name}

Hallo {user_name},

Uw abonnement is gewijzigd zoals aangevraagd.

Vorig Plan: {old_plan_name}
Nieuw Plan: {new_plan_name}
Bedrag: {new_amount}€ / {billing_interval}
Ingangsdatum: {effective_date}

Uw bestaande gegevens en functies blijven behouden.

Met vriendelijke groet,
Het {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- SUBSCRIPTION CANCELLED TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_cancelled',
  'Abonnement annulé',
  'Votre abonnement a été annulé - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement annulé</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous vous informons que votre abonnement a été annulé.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ff6b6b;">
      <p style="margin: 0 0 5px 0;"><strong>Plan annulé:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date d''annulation:</strong> {effective_date}</p>
      <p style="margin: 0;"><strong>Raison:</strong> {cancellation_reason}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Votre compte reste actif jusqu''à la fin de votre période de facturation actuelle.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Nous espérons vous revoir bientôt !<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Abonnement annulé - {company_name}

Bonjour {user_name},

Nous vous informons que votre abonnement a été annulé.

Plan annulé: {old_plan_name}
Date d''annulation: {effective_date}
Raison: {cancellation_reason}

Votre compte reste actif jusqu''à la fin de votre période de facturation actuelle.

Nous espérons vous revoir bientôt !
L''équipe {company_name}',
  '{"user_name": "string", "user_email": "string", "company_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "cancellation_reason": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_cancelled',
  'Subscription Cancelled',
  'Your subscription has been cancelled - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Cancelled</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We inform you that your subscription has been cancelled.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ff6b6b;">
      <p style="margin: 0 0 5px 0;"><strong>Cancelled Plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Cancellation Date:</strong> {effective_date}</p>
      <p style="margin: 0;"><strong>Reason:</strong> {cancellation_reason}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Your account remains active until the end of your current billing period.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">We hope to see you again soon!<br>The {company_name} Team</p>
  </div>
</div>',
  'Subscription Cancelled - {company_name}

Hello {user_name},

We inform you that your subscription has been cancelled.

Cancelled Plan: {old_plan_name}
Cancellation Date: {effective_date}
Reason: {cancellation_reason}

Your account remains active until the end of your current billing period.

We hope to see you again soon!
The {company_name} Team',
  '{"user_name": "string", "user_email": "string", "company_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "cancellation_reason": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_cancelled',
  'Abonnement geannuleerd',
  'Uw abonnement is geannuleerd - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement geannuleerd</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We informeren u dat uw abonnement is geannuleerd.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #ff6b6b;">
      <p style="margin: 0 0 5px 0;"><strong>Geannuleerd Plan:</strong> {old_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Annuleringsdatum:</strong> {effective_date}</p>
      <p style="margin: 0;"><strong>Reden:</strong> {cancellation_reason}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Uw account blijft actief tot het einde van uw huidige factureringsperiode.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">We hopen u snel weer te zien!<br>Het {company_name} Team</p>
  </div>
</div>',
  'Abonnement geannuleerd - {company_name}

Hallo {user_name},

We informeren u dat uw abonnement is geannuleerd.

Geannuleerd Plan: {old_plan_name}
Annuleringsdatum: {effective_date}
Reden: {cancellation_reason}

Uw account blijft actief tot het einde van uw huidige factureringsperiode.

We hopen u snel weer te zien!
Het {company_name} Team',
  '{"user_name": "string", "user_email": "string", "company_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "cancellation_reason": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- SUBSCRIPTION REACTIVATED TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_reactivated',
  'Abonnement réactivé',
  'Votre abonnement a été réactivé - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement réactivé</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous sommes ravis de vous informer que votre abonnement a été réactivé avec succès.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Plan:</strong> {plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Montant:</strong> {amount}€ / {billing_interval}</p>
      <p style="margin: 0 0 5px 0;"><strong>Statut:</strong> Actif</p>
      <p style="margin: 0;"><strong>Date de réactivation:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Vous avez maintenant à nouveau accès à toutes les fonctionnalités de votre plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Bienvenue de retour !<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Abonnement réactivé - {company_name}

Bonjour {user_name},

Nous sommes ravis de vous informer que votre abonnement a été réactivé avec succès.

Plan: {plan_name}
Montant: {amount}€ / {billing_interval}
Statut: Actif
Date de réactivation: {effective_date}

Vous avez maintenant à nouveau accès à toutes les fonctionnalités de votre plan.

Bienvenue de retour !
L''équipe {company_name}',
  '{"user_name": "string", "amount": "string", "user_email": "string", "company_name": "string", "plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_reactivated',
  'Subscription Reactivated',
  'Your subscription has been reactivated - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Reactivated</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We are delighted to inform you that your subscription has been successfully reactivated.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Plan:</strong> {plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Amount:</strong> {amount}€ / {billing_interval}</p>
      <p style="margin: 0 0 5px 0;"><strong>Status:</strong> Active</p>
      <p style="margin: 0;"><strong>Reactivation Date:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">You now have access again to all features of your plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Welcome back!<br>The {company_name} Team</p>
  </div>
</div>',
  'Subscription Reactivated - {company_name}

Hello {user_name},

We are delighted to inform you that your subscription has been successfully reactivated.

Plan: {plan_name}
Amount: {amount}€ / {billing_interval}
Status: Active
Reactivation Date: {effective_date}

You now have access again to all features of your plan.

Welcome back!
The {company_name} Team',
  '{"user_name": "string", "amount": "string", "user_email": "string", "company_name": "string", "plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_reactivated',
  'Abonnement opnieuw geactiveerd',
  'Uw abonnement is opnieuw geactiveerd - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Abonnement opnieuw geactiveerd</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We zijn verheugd u te informeren dat uw abonnement met succes opnieuw is geactiveerd.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Plan:</strong> {plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Bedrag:</strong> {amount}€ / {billing_interval}</p>
      <p style="margin: 0 0 5px 0;"><strong>Status:</strong> Actief</p>
      <p style="margin: 0;"><strong>Heractiveringsdatum:</strong> {effective_date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">U heeft nu weer toegang tot alle functies van uw plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Welkom terug!<br>Het {company_name} Team</p>
  </div>
</div>',
  'Abonnement opnieuw geactiveerd - {company_name}

Hallo {user_name},

We zijn verheugd u te informeren dat uw abonnement met succes opnieuw is geactiveerd.

Plan: {plan_name}
Bedrag: {amount}€ / {billing_interval}
Status: Actief
Heractiveringsdatum: {effective_date}

U heeft nu weer toegang tot alle functies van uw plan.

Welkom terug!
Het {company_name} Team',
  '{"user_name": "string", "amount": "string", "user_email": "string", "company_name": "string", "plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- SUBSCRIPTION TRIAL ENDING TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_trial_ending',
  'Période d''essai se termine',
  'Votre période d''essai se termine bientôt - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Période d''essai se termine</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous vous informons que votre période d''essai gratuite se termine bientôt.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Plan d''essai:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Fin de l''essai:</strong> {trial_end_date}</p>
      <p style="margin: 0;"><strong>Montant après essai:</strong> {new_amount}€ / {billing_interval}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Pour continuer à profiter de toutes les fonctionnalités, vous devrez choisir un plan d''abonnement.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cordialement,<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Période d''essai se termine - {company_name}

Bonjour {user_name},

Nous vous informons que votre période d''essai gratuite se termine bientôt.

Plan d''essai: {new_plan_name}
Fin de l''essai: {trial_end_date}
Montant après essai: {new_amount}€ / {billing_interval}

Pour continuer à profiter de toutes les fonctionnalités, vous devrez choisir un plan d''abonnement.

Cordialement,
L''équipe {company_name}',
  '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "trial_end_date": "string", "billing_interval": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_trial_ending',
  'Trial Period Ending',
  'Your trial period is ending soon - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Trial Period Ending</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We inform you that your free trial period is ending soon.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Trial Plan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Trial End Date:</strong> {trial_end_date}</p>
      <p style="margin: 0;"><strong>Amount After Trial:</strong> {new_amount}€ / {billing_interval}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">To continue enjoying all features, you will need to choose a subscription plan.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Best regards,<br>The {company_name} Team</p>
  </div>
</div>',
  'Trial Period Ending - {company_name}

Hello {user_name},

We inform you that your free trial period is ending soon.

Trial Plan: {new_plan_name}
Trial End Date: {trial_end_date}
Amount After Trial: {new_amount}€ / {billing_interval}

To continue enjoying all features, you will need to choose a subscription plan.

Best regards,
The {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "trial_end_date": "string", "billing_interval": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'subscription_trial_ending',
  'Proefperiode loopt af',
  'Uw proefperiode loopt binnenkort af - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Proefperiode loopt af</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{company_name}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {user_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We informeren u dat uw gratis proefperiode binnenkort afloopt.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0 0 5px 0;"><strong>Proefplan:</strong> {new_plan_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Einde Proefperiode:</strong> {trial_end_date}</p>
      <p style="margin: 0;"><strong>Bedrag Na Proefperiode:</strong> {new_amount}€ / {billing_interval}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Om te blijven genieten van alle functies, moet u een abonnementsplan kiezen.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Met vriendelijke groet,<br>Het {company_name} Team</p>
  </div>
</div>',
  'Proefperiode loopt af - {company_name}

Hallo {user_name},

We informeren u dat uw gratis proefperiode binnenkort afloopt.

Proefplan: {new_plan_name}
Einde Proefperiode: {trial_end_date}
Bedrag Na Proefperiode: {new_amount}€ / {billing_interval}

Om te blijven genieten van alle functies, moet u een abonnementsplan kiezen.

Met vriendelijke groet,
Het {company_name} Team',
  '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "trial_end_date": "string", "billing_interval": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- NEW LEAD AVAILABLE TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'new_lead_available',
  'Nouveau projet disponible',
  'Nouveau projet disponible - {project_description}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nouveau projet</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Correspond à vos compétences</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {artisan_company_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Un nouveau projet correspondant à vos compétences est disponible sur notre plateforme.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669;">
      <p style="margin: 0 0 5px 0;"><strong>Description:</strong> {project_description}</p>
      <p style="margin: 0;"><strong>Localisation:</strong> {location}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Bonne chance !<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Nouveau projet disponible

Bonjour {artisan_company_name},

Un nouveau projet correspondant à vos compétences est disponible sur notre plateforme.

Description: {project_description}
Localisation: {location}

Bonne chance !
L''équipe {company_name}',
  '{"location": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'new_lead_available',
  'New Project Available',
  'New Project Available - {project_description}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Project</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Matches your skills</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {artisan_company_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">A new project matching your skills is available on our platform.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669;">
      <p style="margin: 0 0 5px 0;"><strong>Description:</strong> {project_description}</p>
      <p style="margin: 0;"><strong>Location:</strong> {location}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Good luck!<br>The {company_name} Team</p>
  </div>
</div>',
  'New Project Available

Hello {artisan_company_name},

A new project matching your skills is available on our platform.

Description: {project_description}
Location: {location}

Good luck!
The {company_name} Team',
  '{"location": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'new_lead_available',
  'Nieuw project beschikbaar',
  'Nieuw project beschikbaar - {project_description}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nieuw project</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Komt overeen met uw vaardigheden</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Beste {artisan_company_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Een nieuw project dat overeenkomt met uw vaardigheden is beschikbaar op ons platform.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669;">
      <p style="margin: 0 0 5px 0;"><strong>Beschrijving:</strong> {project_description}</p>
      <p style="margin: 0;"><strong>Locatie:</strong> {location}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Veel succes!<br>Het {company_name} Team</p>
  </div>
</div>',
  'Nieuw project beschikbaar

Beste {artisan_company_name},

Een nieuw project dat overeenkomt met uw vaardigheden is beschikbaar op ons platform.

Beschrijving: {project_description}
Locatie: {location}

Veel succes!
Het {company_name} Team',
  '{"location": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- LEAD ASSIGNED TEMPLATES (No button, no emoji)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'lead_assigned',
  'Projet assigné',
  'Projet assigné - {project_description}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Projet assigné</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Félicitations !</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {artisan_company_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Félicitations ! Le projet suivant vous a été assigné avec succès.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #7c3aed;">
      <p style="margin: 0 0 5px 0;"><strong>Description:</strong> {project_description}</p>
      <p style="margin: 0 0 5px 0;"><strong>Client:</strong> {client_name}</p>
      <p style="margin: 0;"><strong>Localisation:</strong> {location}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Bonne chance !<br>L''équipe {company_name}</p>
  </div>
</div>',
  'Projet assigné - {project_description}

Bonjour {artisan_company_name},

Félicitations ! Le projet suivant vous a été assigné avec succès.

Description: {project_description}
Client: {client_name}
Localisation: {location}

Bonne chance !
L''équipe {company_name}',
  '{"location": "string", "client_name": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'lead_assigned',
  'Project Assigned',
  'Project Assigned - {project_description}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Project Assigned</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Congratulations!</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {artisan_company_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Congratulations! The following project has been successfully assigned to you.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #7c3aed;">
      <p style="margin: 0 0 5px 0;"><strong>Description:</strong> {project_description}</p>
      <p style="margin: 0 0 5px 0;"><strong>Client:</strong> {client_name}</p>
      <p style="margin: 0;"><strong>Location:</strong> {location}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Good luck!<br>The {company_name} Team</p>
  </div>
</div>',
  'Project Assigned - {project_description}

Hello {artisan_company_name},

Congratulations! The following project has been successfully assigned to you.

Description: {project_description}
Client: {client_name}
Location: {location}

Good luck!
The {company_name} Team',
  '{"location": "string", "client_name": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'lead_assigned',
  'Project toegewezen',
  'Project toegewezen - {project_description}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Project toegewezen</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Gefeliciteerd!</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Beste {artisan_company_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Gefeliciteerd! Het volgende project is succesvol aan u toegewezen.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #7c3aed;">
      <p style="margin: 0 0 5px 0;"><strong>Beschrijving:</strong> {project_description}</p>
      <p style="margin: 0 0 5px 0;"><strong>Klant:</strong> {client_name}</p>
      <p style="margin: 0;"><strong>Locatie:</strong> {location}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Veel succes!<br>Het {company_name} Team</p>
  </div>
</div>',
  'Project toegewezen - {project_description}

Beste {artisan_company_name},

Gefeliciteerd! Het volgende project is succesvol aan u toegewezen.

Beschrijving: {project_description}
Klant: {client_name}
Locatie: {location}

Veel succes!
Het {company_name} Team',
  '{"location": "string", "client_name": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- QUOTE SENT TEMPLATES (With View Quote button and custom message support)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'quote_sent',
  'Devis personnalisé',
  'Devis {quote_number} - {quote_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Devis:</strong> {quote_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Projet:</strong> {quote_title}</p>
      <p style="margin: 0 0 5px 0;"><strong>Montant:</strong> {quote_amount}</p>
      <p style="margin: 0;"><strong>Valable jusqu''au:</strong> {valid_until}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cordialement,<br>{company_name}</p>
  </div>
</div>',
  'Devis {quote_number} - {quote_title}

Bonjour {client_name},

Devis: {quote_number}
Projet: {quote_title}
Montant: {quote_amount}
Valable jusqu''au: {valid_until}

{custom_message}

Voir le devis: {quote_link}

Cordialement,
{company_name}',
  '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'quote_sent',
  'Quote Sent',
  'Quote {quote_number} - {quote_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Quote {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Quote:</strong> {quote_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Project:</strong> {quote_title}</p>
      <p style="margin: 0 0 5px 0;"><strong>Amount:</strong> {quote_amount}</p>
      <p style="margin: 0;"><strong>Valid until:</strong> {valid_until}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">View Quote</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Best regards,<br>{company_name}</p>
  </div>
</div>',
  'Quote {quote_number} - {quote_title}

Hello {client_name},

Quote: {quote_number}
Project: {quote_title}
Amount: {quote_amount}
Valid until: {valid_until}

{custom_message}

View Quote: {quote_link}

Best regards,
{company_name}',
  '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'quote_sent',
  'Offerte verzonden',
  'Offerte {quote_number} - {quote_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Offerte {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Beste {client_name},</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Offerte:</strong> {quote_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Project:</strong> {quote_title}</p>
      <p style="margin: 0 0 5px 0;"><strong>Bedrag:</strong> {quote_amount}</p>
      <p style="margin: 0;"><strong>Geldig tot:</strong> {valid_until}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">Bekijk offerte</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Met vriendelijke groet,<br>{company_name}</p>
  </div>
</div>',
  'Offerte {quote_number} - {quote_title}

Beste {client_name},

Offerte: {quote_number}
Project: {quote_title}
Bedrag: {quote_amount}
Geldig tot: {valid_until}

{custom_message}

Bekijk offerte: {quote_link}

Met vriendelijke groet,
{company_name}',
  '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- CREDIT INSURANCE APPLICATION TEMPLATES (No button, no emoji, consistent style)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'credit_insurance_application',
  'Demande d''assurance crédit',
  'Nouvelle demande d''assurance crédit - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nouvelle demande</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Assurance crédit</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #1e40af; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>ID de la demande:</strong> {application_id}</p>
      <p style="margin: 0;"><strong>Date de soumission:</strong> {submission_date}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">
      <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Informations de l''entreprise</h3>
      <p style="margin: 0 0 5px 0;"><strong>Entreprise:</strong> {company_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Personne de contact:</strong> {contact_person}</p>
      <p style="margin: 0 0 5px 0;"><strong>Email:</strong> {email}</p>
      <p style="margin: 0 0 5px 0;"><strong>Téléphone:</strong> {telephone}</p>
      <p style="margin: 0 0 5px 0;"><strong>Adresse:</strong> {address}</p>
      <p style="margin: 0 0 5px 0;"><strong>Secteur d''activité:</strong> {sector}</p>
      <p style="margin: 0 0 5px 0;"><strong>Description de l''activité:</strong> {activity_description}</p>
      <p style="margin: 0 0 5px 0;"><strong>Chiffre d''affaires annuel:</strong> {annual_turnover}€</p>
      <p style="margin: 0;"><strong>Principaux clients B2B:</strong> {top_customers}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Action requise: Veuillez examiner cette demande.</p>
  </div>
</div>',
  'Nouvelle demande d''assurance crédit

ID de la demande: {application_id}
Date de soumission: {submission_date}

Informations de l''entreprise:
- Entreprise: {company_name}
- Personne de contact: {contact_person}
- Email: {email}
- Téléphone: {telephone}
- Adresse: {address}
- Secteur d''activité: {sector}
- Description de l''activité: {activity_description}
- Chiffre d''affaires annuel: {annual_turnover}€
- Principaux clients B2B: {top_customers}

Action requise: Veuillez examiner cette demande.',
  '{"email": "string", "sector": "string", "address": "string", "telephone": "string", "company_name": "string", "top_customers": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "activity_description": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'credit_insurance_application',
  'Credit Insurance Application',
  'New Credit Insurance Application - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Application</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Credit Insurance</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #1e40af; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Application ID:</strong> {application_id}</p>
      <p style="margin: 0;"><strong>Submission Date:</strong> {submission_date}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;">
      <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">Company Information</h3>
      <p style="margin: 0 0 5px 0;"><strong>Company:</strong> {company_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Contact Person:</strong> {contact_person}</p>
      <p style="margin: 0 0 5px 0;"><strong>Email:</strong> {email}</p>
      <p style="margin: 0 0 5px 0;"><strong>Phone:</strong> {telephone}</p>
      <p style="margin: 0 0 5px 0;"><strong>Address:</strong> {address}</p>
      <p style="margin: 0 0 5px 0;"><strong>Business Sector:</strong> {sector}</p>
      <p style="margin: 0 0 5px 0;"><strong>Activity Description:</strong> {activity_description}</p>
      <p style="margin: 0 0 5px 0;"><strong>Annual Turnover:</strong> {annual_turnover}€</p>
      <p style="margin: 0;"><strong>Main B2B Customers:</strong> {top_customers}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Action required: Please review this application.</p>
  </div>
</div>',
  'New Credit Insurance Application

Application ID: {application_id}
Submission Date: {submission_date}

Company Information:
- Company: {company_name}
- Contact Person: {contact_person}
- Email: {email}
- Phone: {telephone}
- Address: {address}
- Business Sector: {sector}
- Activity Description: {activity_description}
- Annual Turnover: {annual_turnover}€
- Main B2B Customers: {top_customers}

Action required: Please review this application.',
  '{"email": "string", "sector": "string", "address": "string", "telephone": "string", "company_name": "string", "top_customers": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "activity_description": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'credit_insurance_application',
  'Kredietverzekering Aanvraag',
  'Nieuwe kredietverzekering aanvraag - {company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nieuwe aanvraag</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Kredietverzekering</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #1e40af; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Aanvraag ID:</strong> {application_id}</p>
      <p style="margin: 0;"><strong>Inzendingsdatum:</strong> {submission_date}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #1e40af;">
      <p style="margin: 0 0 5px 0;"><strong>Bedrijf:</strong> {company_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Contactpersoon:</strong> {contact_person}</p>
      <p style="margin: 0 0 5px 0;"><strong>E-mail:</strong> {email}</p>
      <p style="margin: 0 0 5px 0;"><strong>Telefoon:</strong> {telephone}</p>
      <p style="margin: 0 0 5px 0;"><strong>Adres:</strong> {address}</p>
      <p style="margin: 0 0 5px 0;"><strong>Bedrijfssector:</strong> {sector}</p>
      <p style="margin: 0 0 5px 0;"><strong>Activiteitsbeschrijving:</strong> {activity_description}</p>
      <p style="margin: 0 0 5px 0;"><strong>Jaaromzet:</strong> {annual_turnover}€</p>
      <p style="margin: 0;"><strong>Belangrijkste B2B-klanten:</strong> {top_customers}</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Actie vereist: Bekijk deze aanvraag.</p>
  </div>
</div>',
  'Nieuwe kredietverzekering aanvraag

Aanvraag ID: {application_id}
Inzendingsdatum: {submission_date}

Bedrijfsinformatie:
- Bedrijf: {company_name}
- Contactpersoon: {contact_person}
- E-mail: {email}
- Telefoon: {telephone}
- Adres: {address}
- Bedrijfssector: {sector}
- Activiteitsbeschrijving: {activity_description}
- Jaaromzet: {annual_turnover}€
- Belangrijkste B2B-klanten: {top_customers}

Actie vereist: Bekijk deze aanvraag.',
  '{"email": "string", "sector": "string", "address": "string", "telephone": "string", "company_name": "string", "top_customers": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "activity_description": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- CREDIT INSURANCE CONFIRMATION TEMPLATES
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'credit_insurance_confirmation',
  'Confirmation demande assurance crédit',
  'Confirmation de votre demande d''assurance crédit - {haliqo_company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Confirmation</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Votre demande a été reçue</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous avons bien reçu votre demande d''assurance crédit pour l''entreprise <strong>{company_name}</strong>.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Numéro de référence:</strong> {application_id}</p>
      <p style="margin: 0;"><strong>Date de soumission:</strong> {submission_date}</p>
    </div>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Notre équipe va examiner votre dossier et vous contactera dans les plus brefs délais.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Entreprise:</strong> {company_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Personne de contact:</strong> {contact_person}</p>
      <p style="margin: 0 0 5px 0;"><strong>Secteur:</strong> {sector}</p>
      <p style="margin: 0;"><strong>Chiffre d''affaires annuel:</strong> {annual_turnover}€</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Merci de votre confiance.<br>L''équipe {haliqo_company_name}</p>
  </div>
</div>',
  'Confirmation de votre demande d''assurance crédit

Bonjour,

Nous avons bien reçu votre demande d''assurance crédit pour l''entreprise {company_name}.

Numéro de référence: {application_id}
Date de soumission: {submission_date}

Notre équipe va examiner votre dossier et vous contactera dans les plus brefs délais.

Récapitulatif:
- Entreprise: {company_name}
- Personne de contact: {contact_person}
- Secteur: {sector}
- Chiffre d''affaires annuel: {annual_turnover}€

Merci de votre confiance.
L''équipe {haliqo_company_name}',
  '{"sector": "string", "company_name": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "haliqo_company_name": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'credit_insurance_confirmation',
  'Credit Insurance Confirmation',
  'Confirmation of Your Credit Insurance Application - {haliqo_company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Confirmation</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Your application has been received</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We have received your credit insurance application for <strong>{company_name}</strong>.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Reference Number:</strong> {application_id}</p>
      <p style="margin: 0;"><strong>Submission Date:</strong> {submission_date}</p>
    </div>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Our team will review your application and contact you as soon as possible.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Company:</strong> {company_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Contact Person:</strong> {contact_person}</p>
      <p style="margin: 0 0 5px 0;"><strong>Sector:</strong> {sector}</p>
      <p style="margin: 0;"><strong>Annual Turnover:</strong> {annual_turnover}€</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Thank you for your trust.<br>The {haliqo_company_name} Team</p>
  </div>
</div>',
  'Confirmation of Your Credit Insurance Application

Hello,

We have received your credit insurance application for {company_name}.

Reference Number: {application_id}
Submission Date: {submission_date}

Our team will review your application and contact you as soon as possible.

Summary:
- Company: {company_name}
- Contact Person: {contact_person}
- Sector: {sector}
- Annual Turnover: {annual_turnover}€

Thank you for your trust.
The {haliqo_company_name} Team',
  '{"sector": "string", "company_name": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "haliqo_company_name": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'credit_insurance_confirmation',
  'Kredietverzekering Bevestiging',
  'Bevestiging van uw kredietverzekering aanvraag - {haliqo_company_name}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Bevestiging</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Uw aanvraag is ontvangen</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Beste,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We hebben uw kredietverzekering aanvraag voor <strong>{company_name}</strong> ontvangen.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Referentienummer:</strong> {application_id}</p>
      <p style="margin: 0;"><strong>Inzendingsdatum:</strong> {submission_date}</p>
    </div>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Ons team zal uw aanvraag beoordelen en zo spoedig mogelijk contact met u opnemen.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0 0 5px 0;"><strong>Bedrijf:</strong> {company_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Contactpersoon:</strong> {contact_person}</p>
      <p style="margin: 0 0 5px 0;"><strong>Sector:</strong> {sector}</p>
      <p style="margin: 0;"><strong>Jaaromzet:</strong> {annual_turnover}€</p>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Bedankt voor uw vertrouwen.<br>Het {haliqo_company_name} Team</p>
  </div>
</div>',
  'Bevestiging van uw kredietverzekering aanvraag

Beste,

We hebben uw kredietverzekering aanvraag voor {company_name} ontvangen.

Referentienummer: {application_id}
Inzendingsdatum: {submission_date}

Ons team zal uw aanvraag beoordelen en zo spoedig mogelijk contact met u opnemen.

Samenvatting:
- Bedrijf: {company_name}
- Contactpersoon: {contact_person}
- Sector: {sector}
- Jaaromzet: {annual_turnover}€

Bedankt voor uw vertrouwen.
Het {haliqo_company_name} Team',
  '{"sector": "string", "company_name": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "haliqo_company_name": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- CONTACT FORM TEMPLATES (No emoji, consistent style)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'contact_form',
  'Formulaire de contact',
  '[Formulaire de contact] {subject_label}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0036ab 0%, #0052cc 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nouvelle soumission</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Formulaire de contact</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0036ab; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Nom complet:</strong> {full_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Email:</strong> {email}</p>
      <p style="margin: 0 0 5px 0;"><strong>Téléphone:</strong> {phone}</p>
      <p style="margin: 0 0 5px 0;"><strong>Sujet:</strong> {subject_label}</p>
      <p style="margin: 0;"><strong>Date de soumission:</strong> {submission_date}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0036ab;">
      <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
      <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">{message}</div>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cet email a été envoyé depuis le formulaire de contact de {company_name}.</p>
  </div>
</div>',
  'Nouvelle soumission - Formulaire de contact

Informations du contact:
- Nom complet: {full_name}
- Email: {email}
- Téléphone: {phone}
- Sujet: {subject_label}
- Date de soumission: {submission_date}

Message:
{message}

---
Cet email a été envoyé depuis le formulaire de contact de {company_name}.',
  '{"email": "string", "phone": "string", "message": "string", "subject": "string", "full_name": "string", "last_name": "string", "first_name": "string", "company_name": "string", "subject_label": "string", "submission_date": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'contact_form',
  'Contact Form',
  '[Contact Form] {subject_label}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0036ab 0%, #0052cc 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Submission</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Contact Form</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0036ab; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Full Name:</strong> {full_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>Email:</strong> {email}</p>
      <p style="margin: 0 0 5px 0;"><strong>Phone:</strong> {phone}</p>
      <p style="margin: 0 0 5px 0;"><strong>Subject:</strong> {subject_label}</p>
      <p style="margin: 0;"><strong>Submission Date:</strong> {submission_date}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0036ab;">
      <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
      <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">{message}</div>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">This email was sent from the {company_name} contact form.</p>
  </div>
</div>',
  'New Submission - Contact Form

Contact Information:
- Full Name: {full_name}
- Email: {email}
- Phone: {phone}
- Subject: {subject_label}
- Submission Date: {submission_date}

Message:
{message}

---
This email was sent from the {company_name} contact form.',
  '{"email": "string", "phone": "string", "message": "string", "subject": "string", "full_name": "string", "last_name": "string", "first_name": "string", "company_name": "string", "subject_label": "string", "submission_date": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'contact_form',
  'Contactformulier',
  '[Contactformulier] {subject_label}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0036ab 0%, #0052cc 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nieuwe inzending</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Contactformulier</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0036ab; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Volledige naam:</strong> {full_name}</p>
      <p style="margin: 0 0 5px 0;"><strong>E-mail:</strong> {email}</p>
      <p style="margin: 0 0 5px 0;"><strong>Telefoon:</strong> {phone}</p>
      <p style="margin: 0 0 5px 0;"><strong>Onderwerp:</strong> {subject_label}</p>
      <p style="margin: 0;"><strong>Inzendingsdatum:</strong> {submission_date}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #0036ab;">
      <p style="margin: 0 0 10px 0;"><strong>Bericht:</strong></p>
      <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">{message}</div>
    </div>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Deze e-mail is verzonden vanuit het {company_name} contactformulier.</p>
  </div>
</div>',
  'Nieuwe inzending - Contactformulier

Contactgegevens:
- Volledige naam: {full_name}
- E-mail: {email}
- Telefoon: {phone}
- Onderwerp: {subject_label}
- Inzendingsdatum: {submission_date}

Bericht:
{message}

---
Deze e-mail is verzonden vanuit het {company_name} contactformulier.',
  '{"email": "string", "phone": "string", "message": "string", "subject": "string", "full_name": "string", "last_name": "string", "first_name": "string", "company_name": "string", "subject_label": "string", "submission_date": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- INVOICE SENT TEMPLATES (Matching Quote Template Style)
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_sent',
  'Facture envoyée',
  'Facture {invoice_number} - {invoice_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Facture {invoice_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Numéro de facture:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date d''échéance:</strong> {due_date}</p>
      <p style="margin: 0; font-weight: bold; color: #333;"><strong>Montant:</strong> {invoice_amount}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
    <p style="color: #555; margin: 0; line-height: 1.5;">Le PDF de la facture est joint à cet email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Cordialement,<br>{company_name}</p>
  </div>
</div>',
  'Facture {invoice_number} - {invoice_title}

Bonjour {client_name},

{custom_message}

Numéro de facture: {invoice_number}
Date: {issue_date}
Date d''échéance: {due_date}
Montant: {invoice_amount}

Le PDF de la facture est joint à cet email.

Cordialement,
{company_name}',
  '{"invoice_number": "string", "client_name": "string", "invoice_title": "string", "invoice_amount": "string", "issue_date": "string", "due_date": "string", "company_name": "string", "custom_message": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_sent',
  'Invoice Sent',
  'Invoice {invoice_number} - {invoice_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Invoice {invoice_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Invoice Number:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Date:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Due Date:</strong> {due_date}</p>
      <p style="margin: 0; font-weight: bold; color: #333;"><strong>Amount:</strong> {invoice_amount}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
    <p style="color: #555; margin: 0; line-height: 1.5;">The invoice PDF is attached to this email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Best regards,<br>{company_name}</p>
  </div>
</div>',
  'Invoice {invoice_number} - {invoice_title}

Hello {client_name},

{custom_message}

Invoice Number: {invoice_number}
Date: {issue_date}
Due Date: {due_date}
Amount: {invoice_amount}

The invoice PDF is attached to this email.

Best regards,
{company_name}',
  '{"invoice_number": "string", "client_name": "string", "invoice_title": "string", "invoice_amount": "string", "issue_date": "string", "due_date": "string", "company_name": "string", "custom_message": "string"}',
  true, false, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'invoice_sent',
  'Factuur verzonden',
  'Factuur {invoice_number} - {invoice_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Factuur {invoice_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong>Factuurnummer:</strong> {invoice_number}</p>
      <p style="margin: 0 0 5px 0;"><strong>Datum:</strong> {issue_date}</p>
      <p style="margin: 0 0 5px 0;"><strong>Vervaldatum:</strong> {due_date}</p>
      <p style="margin: 0; font-weight: bold; color: #333;"><strong>Bedrag:</strong> {invoice_amount}</p>
    </div>
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
    <p style="color: #555; margin: 0; line-height: 1.5;">De PDF van de factuur is bijgevoegd aan deze e-mail.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">Met vriendelijke groet,<br>{company_name}</p>
  </div>
</div>',
  'Factuur {invoice_number} - {invoice_title}

Hallo {client_name},

{custom_message}

Factuurnummer: {invoice_number}
Datum: {issue_date}
Vervaldatum: {due_date}
Bedrag: {invoice_amount}

De PDF van de factuur is bijgevoegd aan deze e-mail.

Met vriendelijke groet,
{company_name}',
  '{"invoice_number": "string", "client_name": "string", "invoice_title": "string", "invoice_amount": "string", "issue_date": "string", "due_date": "string", "company_name": "string", "custom_message": "string"}',
  true, false, 'nl'
);

-- =====================================================
-- NOTE: invoice_to_accountant and expense_invoice_to_accountant templates
-- already exist in the database. Only invoice_sent templates are added below.
-- =====================================================
