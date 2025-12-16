-- Migration: Update quote_sent email templates to clearly show deposit information
-- This replaces the previous templates with new ones that display deposit/advance payment clearly

-- =====================================================
-- UPDATE QUOTE SENT TEMPLATES (With Deposit Information)
-- =====================================================

-- First, delete existing quote_sent templates
DELETE FROM public.email_templates 
WHERE template_type = 'quote_sent';

-- French Template
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
      <p style="margin: 0 0 5px 0;"><strong>Valable jusqu''au:</strong> {valid_until}</p>
    </div>
    
    <!-- Financial Breakdown Section -->
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
      <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Détails financiers:</h3>
      
      <!-- Subtotal -->
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
        <span style="color: #666;">Sous-total HT:</span>
        <span style="color: #333; font-weight: 500;">{total_before_vat}</span>
      </div>
      
      <!-- VAT (if enabled) - will be replaced by edge function -->
      {vat_section}
      
      <!-- Total with VAT -->
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; margin-top: 5px;">
        <span style="color: #333; font-weight: bold;">Total TTC:</span>
        <span style="color: #333; font-weight: bold; font-size: 16px;">{total_with_vat}</span>
      </div>
      
      <!-- Deposit Section - will be replaced by edge function based on deposit_enabled -->
      {deposit_section}
      
      <!-- Total Amount to Pay (always shown, even if deposit is enabled) -->
      <div style="background: #dbeafe; padding: 12px; border-radius: 6px; margin-top: 12px; border-left: 4px solid #3b82f6;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #1e40af; font-weight: bold;">Montant total à payer:</span>
          <span style="color: #1e40af; font-weight: bold; font-size: 18px;">{balance_amount}</span>
        </div>
      </div>
    </div>
    
    <!-- Custom Message -->
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
Valable jusqu''au: {valid_until}

Détails financiers:
Sous-total HT: {total_before_vat}
{vat_section_text}
Total TTC: {total_with_vat}

{deposit_section_text}

{custom_message}

Voir le devis: {quote_link}

Cordialement,
{company_name}',
  '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string", "total_before_vat": "string", "vat_enabled": "string", "vat_rate": "string", "vat_percentage": "string", "vat_amount": "string", "total_with_vat": "string", "deposit_enabled": "string", "deposit_amount": "string", "balance_amount": "string"}',
  true, true, 'fr'
);

-- English Template
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
      <p style="margin: 0 0 5px 0;"><strong>Valid until:</strong> {valid_until}</p>
    </div>
    
    <!-- Financial Breakdown Section -->
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
      <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Financial Details:</h3>
      
      <!-- Subtotal -->
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
        <span style="color: #666;">Subtotal (excl. VAT):</span>
        <span style="color: #333; font-weight: 500;">{total_before_vat}</span>
      </div>
      
      <!-- VAT (if enabled) - will be replaced by edge function -->
      {vat_section}
      
      <!-- Total with VAT -->
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; margin-top: 5px;">
        <span style="color: #333; font-weight: bold;">Total (incl. VAT):</span>
        <span style="color: #333; font-weight: bold; font-size: 16px;">{total_with_vat}</span>
      </div>
      
      <!-- Deposit Section - will be replaced by edge function based on deposit_enabled -->
      {deposit_section}
      
      <!-- Total Amount to Pay (always shown, even if deposit is enabled) -->
      <div style="background: #dbeafe; padding: 12px; border-radius: 6px; margin-top: 12px; border-left: 4px solid #3b82f6;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #1e40af; font-weight: bold;">Total Amount to Pay:</span>
          <span style="color: #1e40af; font-weight: bold; font-size: 18px;">{balance_amount}</span>
        </div>
      </div>
    </div>
    
    <!-- Custom Message -->
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
Valid until: {valid_until}

Financial Details:
Subtotal (excl. VAT): {total_before_vat}
{vat_section_text}
Total (incl. VAT): {total_with_vat}

{deposit_section_text}
Total Amount to Pay: {balance_amount}

{custom_message}

View Quote: {quote_link}

Best regards,
{company_name}',
  '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string", "total_before_vat": "string", "vat_enabled": "string", "vat_rate": "string", "vat_percentage": "string", "vat_amount": "string", "total_with_vat": "string", "deposit_enabled": "string", "deposit_amount": "string", "balance_amount": "string"}',
  true, false, 'en'
);

-- Dutch Template
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
      <p style="margin: 0 0 5px 0;"><strong>Geldig tot:</strong> {valid_until}</p>
    </div>
    
    <!-- Financial Breakdown Section -->
    <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e0e0e0; margin-bottom: 15px;">
      <h3 style="color: #333; margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">Financiële details:</h3>
      
      <!-- Subtotal -->
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
        <span style="color: #666;">Subtotaal (excl. BTW):</span>
        <span style="color: #333; font-weight: 500;">{total_before_vat}</span>
      </div>
      
      <!-- VAT (if enabled) - will be replaced by edge function -->
      {vat_section}
      
      <!-- Total with VAT -->
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; margin-top: 5px;">
        <span style="color: #333; font-weight: bold;">Totaal (incl. BTW):</span>
        <span style="color: #333; font-weight: bold; font-size: 16px;">{total_with_vat}</span>
      </div>
      
      <!-- Deposit Section - will be replaced by edge function based on deposit_enabled -->
      {deposit_section}
      
      <!-- Total Amount to Pay (always shown, even if deposit is enabled) -->
      <div style="background: #dbeafe; padding: 12px; border-radius: 6px; margin-top: 12px; border-left: 4px solid #3b82f6;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #1e40af; font-weight: bold;">Totaalbedrag te betalen:</span>
          <span style="color: #1e40af; font-weight: bold; font-size: 18px;">{balance_amount}</span>
        </div>
      </div>
    </div>
    
    <!-- Custom Message -->
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
Geldig tot: {valid_until}

Financiële details:
Subtotaal (excl. BTW): {total_before_vat}
{vat_section_text}
Totaal (incl. BTW): {total_with_vat}

{deposit_section_text}
Totaalbedrag te betalen: {balance_amount}

{custom_message}

Bekijk offerte: {quote_link}

Met vriendelijke groet,
{company_name}',
  '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string", "total_before_vat": "string", "vat_enabled": "string", "vat_rate": "string", "vat_percentage": "string", "vat_amount": "string", "total_with_vat": "string", "deposit_enabled": "string", "deposit_amount": "string", "balance_amount": "string"}',
  true, false, 'nl'
);

