-- Delete existing custom_quote_sent templates
DELETE FROM public.email_templates WHERE template_type = 'custom_quote_sent';

-- Insert fixed French template
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'custom_quote_sent',
  'Devis personnalisé',
  'Devis {quote_number} - {quote_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;"><h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1><p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p></div><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2><div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin-bottom: 15px;"><p style="margin: 0 0 5px 0;"><strong>Devis:</strong> {quote_number}</p><p style="margin: 0 0 5px 0;"><strong>Projet:</strong> {quote_title}</p><p style="margin: 0 0 5px 0;"><strong>Montant:</strong> {quote_amount}</p><p style="margin: 0;"><strong>Valable jusqu''au:</strong> {valid_until}</p></div><div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;"><div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div></div></div><div style="text-align: center; margin: 30px 0;"><a href="{quote_link}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">Voir le devis</a></div><div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;"><p style="margin: 0;">Cordialement,<br>{company_name}</p></div></div>',
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

-- Insert fixed English template
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'custom_quote_sent',
  'Custom Quote',
  'Quote {quote_number} - {quote_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;"><h1 style="color: white; margin: 0; font-size: 24px;">Quote {quote_number}</h1><p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p></div><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2><div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin-bottom: 15px;"><p style="margin: 0 0 5px 0;"><strong>Quote:</strong> {quote_number}</p><p style="margin: 0 0 5px 0;"><strong>Project:</strong> {quote_title}</p><p style="margin: 0 0 5px 0;"><strong>Amount:</strong> {quote_amount}</p><p style="margin: 0;"><strong>Valid until:</strong> {valid_until}</p></div><div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;"><div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div></div></div><div style="text-align: center; margin: 30px 0;"><a href="{quote_link}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">View Quote</a></div><div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;"><p style="margin: 0;">Best regards,<br>{company_name}</p></div></div>',
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
  true, true, 'en'
);

-- Insert fixed Dutch template
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'custom_quote_sent',
  'Aangepaste offerte',
  'Offerte {quote_number} - {quote_title}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;"><h1 style="color: white; margin: 0; font-size: 24px;">Offerte {quote_number}</h1><p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p></div><div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;"><h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Beste {client_name},</h2><div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #059669; margin-bottom: 15px;"><p style="margin: 0 0 5px 0;"><strong>Offerte:</strong> {quote_number}</p><p style="margin: 0 0 5px 0;"><strong>Project:</strong> {quote_title}</p><p style="margin: 0 0 5px 0;"><strong>Bedrag:</strong> {quote_amount}</p><p style="margin: 0;"><strong>Geldig tot:</strong> {valid_until}</p></div><div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0;"><div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div></div></div><div style="text-align: center; margin: 30px 0;"><a href="{quote_link}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(5, 150, 105, 0.3);">Bekijk offerte</a></div><div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;"><p style="margin: 0;">Met vriendelijke groet,<br>{company_name}</p></div></div>',
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
  true, true, 'nl'
);

