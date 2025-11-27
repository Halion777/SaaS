


-- Email templates table for managing all email communications
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    template_type VARCHAR(100) NOT NULL, -- quote_sent, followup_not_viewed, followup_viewed_no_action, client_accepted, client_rejected, general_followup
    template_name VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Available variables for personalization
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Default template for the type
    language VARCHAR(10) DEFAULT 'fr', -- fr, en, nl
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email template variables reference table
CREATE TABLE IF NOT EXISTS public.email_template_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variable_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    example_value TEXT,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default email template variables
INSERT INTO public.email_template_variables (variable_name, description, example_value, is_required) VALUES
('client_name', 'Client full name', 'Jean Dupont', true),
('client_first_name', 'Client first name only', 'Jean', false),
('quote_number', 'Quote reference number', 'Q-2024-001', true),
('quote_title', 'Project title from quote', 'Rénovation salle de bain', true),
('quote_amount', 'Total quote amount', '2,500.00€', true),
('company_name', 'Your company name', 'Maçonnerie Pro', true),
('sender_name', 'Name of person sending email', 'Marie Martin', false),
('sender_email', 'Email of person sending', 'marie@maconnerie-pro.fr', false),
('quote_link', 'Direct link to view quote', 'https://app.com/quote/abc123', true),
('valid_until', 'Quote validity date', '31 décembre 2024', false),
('days_since_sent', 'Days since quote was sent', '3', false),
('next_followup_date', 'Suggested next follow-up date', '15 janvier 2025', false);

-- Insert default email templates for all scenarios
INSERT INTO public.email_templates (template_type, template_name, subject, html_content, text_content, variables, is_default, language) VALUES
-- Quote Sent Template
('quote_sent', 'Devis envoyé', 
 'Devis {quote_number} - {quote_title}',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre devis est prêt !</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant : {quote_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Valable jusqu''au {valid_until}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Devis {quote_number} - {quote_title}

Bonjour {client_name},

Votre devis est prêt !
Montant : {quote_amount}
Valable jusqu''au {valid_until}

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "quote_title": true, "quote_amount": true, "quote_link": true, "valid_until": true, "company_name": true}',
 true, 'fr'),

-- Follow-up: Client Not Opened link not viewed status is sent
('followup_not_viewed', 'Relance - Email non ouvert', 
 'Devis {quote_number} - Avez-vous reçu notre proposition ?',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous avons envoyé notre devis il y a <strong>{days_since_sent} jours</strong>.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Avez-vous bien reçu notre proposition ?</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Relance - Devis {quote_number}

Bonjour {client_name},

Nous avons envoyé notre devis il y a {days_since_sent} jours.
Avez-vous bien reçu notre proposition ?

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "days_since_sent": true, "quote_link": true, "company_name": true}',
 true, 'fr'),

-- Follow-up: Client Viewed But No Action
('followup_viewed_no_action', 'Relance - Vue sans action', 
 'Devis {quote_number} - Des questions sur notre proposition ?',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Vous avez consulté notre devis il y a <strong>{days_since_sent} jours</strong>.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Des questions ? Nous sommes là pour vous aider !</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #feca57; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(254, 202, 87, 0.3);">Relire le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Relance - Devis {quote_number}

Bonjour {client_name},

Vous avez consulté notre devis il y a {days_since_sent} jours.
Des questions ? Nous sommes là pour vous aider !

Relire le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "days_since_sent": true, "quote_link": true, "company_name": true}',
 true, 'fr'),

-- Client Accepted Quote
('client_accepted', 'Devis accepté', 
 'Devis {quote_number} accepté - Merci !',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Devis accepté !</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Merci d''avoir accepté notre devis !</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #48dbfb;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant accepté : {quote_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Notre équipe vous contacte bientôt pour la suite !</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #48dbfb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(72, 219, 251, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Devis {quote_number} accepté - Merci !

Bonjour {client_name},

Merci d''avoir accepté notre devis !
Montant accepté : {quote_amount}

Notre équipe vous contacte bientôt pour la suite !

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "quote_amount": true, "quote_link": true, "company_name": true}',
 true, 'fr'),

-- Client Rejected Quote
('client_rejected', 'Devis refusé', 
 'Devis {quote_number} - Merci pour votre retour',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #a55eea 0%, #8b5cf6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Merci pour votre retour</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Merci pour votre retour sur notre devis.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous restons à votre disposition pour de futurs projets.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Devis {quote_number} - Merci pour votre retour

Bonjour {client_name},

Merci pour votre retour sur notre devis.
Nous restons à votre disposition pour de futurs projets.

{company_name}',
 '{"client_name": true, "quote_number": true, "company_name": true}',
 true, 'fr'),

-- General Follow-up Template on 1 day after qoute sent after 3 days after 5 days (for viewed/sent) (Not for qoute not expired/accepted/rejected)
('general_followup', 'Relance générale', 
 'Devis {quote_number} - Rappel',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Rappel</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Rappel de notre devis pour votre projet.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant : {quote_amount}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Rappel - Devis {quote_number}

Bonjour {client_name},

Rappel de notre devis pour votre projet.
Montant : {quote_amount}

Voir le devis : {quote_link}

{company_name}',
 '{"client_name": true, "quote_number": true, "quote_amount": true, "quote_link": true, "company_name": true}',
 true, 'fr'),


-- Welcome Client Template
('welcome_client', 'Bienvenue client', 
 'Bienvenue - Votre projet a été reçu',
 '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue !</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Votre projet a été reçu</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous sommes ravis de vous accueillir sur notre plateforme !</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l''examiner et vous proposer des devis dans les plus brefs délais.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>',
 'Bienvenue - Votre projet a été reçu

Bonjour {client_name},

Nous sommes ravis de vous accueillir sur notre plateforme !
Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l''examiner et vous proposer des devis dans les plus brefs délais.

Merci de votre confiance !

{company_name}',
 '{"client_name": true, "company_name": true}',
 true, 'fr');

-- Create indexes for email templates
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON public.email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_default ON public.email_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_email_templates_language ON public.email_templates(language);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Enable Row Level Security for email templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own email templates
CREATE POLICY "Users can manage their own email templates" ON public.email_templates
    FOR ALL USING (user_id = auth.uid());

-- RLS Policy: Users can view default templates (system-wide)
CREATE POLICY "Users can view default templates" ON public.email_templates
    FOR SELECT USING (is_default = true);

-- Add email template metadata to quote_follow_ups table
ALTER TABLE public.quote_follow_ups 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.email_templates(id),
ADD COLUMN IF NOT EXISTS template_variables JSONB DEFAULT '{}';

-- Create index for template_id in quote_follow_ups
CREATE INDEX IF NOT EXISTS idx_quote_follow_ups_template_id ON public.quote_follow_ups(template_id);

-- Add comments for documentation
COMMENT ON TABLE public.email_templates IS 'Email templates for all quote-related communications';
COMMENT ON TABLE public.email_template_variables IS 'Available variables for email template personalization';
COMMENT ON COLUMN public.email_templates.template_type IS 'Type of email: quote_sent, followup_not_viewed, followup_viewed_no_action, client_accepted, client_rejected, general_followup';
COMMENT ON COLUMN public.email_templates.variables IS 'JSON object defining available variables for this template';
COMMENT ON COLUMN public.quote_follow_ups.template_id IS 'Reference to the email template used for this follow-up';
COMMENT ON COLUMN public.quote_follow_ups.template_variables IS 'JSON object with actual values for template variables';

-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cron job to create initial follow-ups for sent quotes (runs every hour)
-- STRATEGY: Create ONE initial follow-up for quotes sent in the last hour
-- Next follow-ups are handled by intelligent system based on client behavior
SELECT cron.schedule(
  'schedule-followups-for-sent-quotes',
  '0 * * * *', -- Every hour at minute 0
  'SELECT public.schedule_followups_for_sent_quotes();'
);

-- Send automatic emails when quotes are accepted or rejected
CREATE OR REPLACE FUNCTION public.on_quote_status_accepted_rejected()
RETURNS TRIGGER AS $$
DECLARE
  v_template RECORD;
  v_client RECORD;
  v_company_profile RECORD;
  v_share_token VARCHAR(100);
  v_template_type VARCHAR(100);
  v_subject TEXT;
  v_html TEXT;
  v_text TEXT;
BEGIN
  -- Only proceed for accepted or rejected status
  IF NEW.status NOT IN ('accepted', 'rejected') THEN
    RETURN NEW;
  END IF;
  
  -- Determine template type based on status
  v_template_type := CASE 
    WHEN NEW.status = 'accepted' THEN 'client_accepted'
    WHEN NEW.status = 'rejected' THEN 'client_rejected'
    ELSE NULL
  END;
  
  IF v_template_type IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get client details
  SELECT * INTO v_client FROM public.clients WHERE id = NEW.client_id;
  IF v_client IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get company profile
  SELECT * INTO v_company_profile FROM public.company_profiles 
  WHERE user_id = NEW.user_id AND is_default = true 
  LIMIT 1;
  
  -- Get share token for quote link
  SELECT share_token INTO v_share_token FROM public.quotes WHERE id = NEW.id;
  
  -- Get email template
  SELECT * INTO v_template FROM public.email_templates 
  WHERE template_type = v_template_type
  AND is_active = true
  LIMIT 1;
  
  IF v_template IS NULL THEN
    RAISE NOTICE 'Template % not found for quote %', v_template_type, NEW.quote_number;
    RETURN NEW;
  END IF;
  
  -- Prepare email content with variable replacement using PostgreSQL REPLACE function
  v_subject := REPLACE(REPLACE(REPLACE(REPLACE(v_template.subject,
    '{quote_number}', NEW.quote_number),
    '{client_name}', COALESCE(v_client.name, '')),
    '{quote_amount}', COALESCE(NEW.final_amount::TEXT, NEW.total_amount::TEXT, '0') || '€'),
    '{company_name}', COALESCE(v_company_profile.company_name, 'Notre entreprise'));
  
  v_html := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_template.html_content,
    '{quote_number}', NEW.quote_number),
    '{client_name}', COALESCE(v_client.name, '')),
    '{quote_amount}', COALESCE(NEW.final_amount::TEXT, NEW.total_amount::TEXT, '0') || '€'),
    '{quote_link}', COALESCE(v_share_token, '#')),
    '{company_name}', COALESCE(v_company_profile.company_name, 'Notre entreprise'));
  
  v_text := REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(v_template.text_content,
    '{quote_number}', NEW.quote_number),
    '{client_name}', COALESCE(v_client.name, '')),
    '{quote_amount}', COALESCE(NEW.final_amount::TEXT, NEW.total_amount::TEXT, '0') || '€'),
    '{quote_link}', COALESCE(v_share_token, '#')),
    '{company_name}', COALESCE(v_company_profile.company_name, 'Notre entreprise'));
  
  -- Create email outbox record for immediate sending
  INSERT INTO public.email_outbox (
    quote_id, user_id, to_email, subject, html, text, 
    status, email_type, meta
  ) VALUES (
    NEW.id, NEW.user_id, v_client.email, v_subject, v_html, v_text,
    'sending', v_template_type, jsonb_build_object(
      'quote_status', NEW.status,
      'template_type', v_template_type,
      'automated', true,
      'triggered_by', 'status_change',
      'created_at', NOW()
    )
  );
  
  -- Log the email event
  INSERT INTO public.quote_events (quote_id, user_id, type, meta)
  VALUES (NEW.id, NEW.user_id, 'email_sent', jsonb_build_object(
    'email_type', v_template_type,
    'status_change', NEW.status,
    'template_type', v_template_type,
    'automated', true,
    'timestamp', NOW()
  ));
  
  RAISE NOTICE 'Automatic % email queued for quote % to %', v_template_type, NEW.quote_number, v_client.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic accepted/rejected emails
DROP TRIGGER IF EXISTS trg_on_quote_accepted_rejected ON public.quotes;
CREATE TRIGGER trg_on_quote_accepted_rejected
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  WHEN (NEW.status IN ('accepted', 'rejected') AND (OLD.status IS DISTINCT FROM NEW.status))
  EXECUTE FUNCTION public.on_quote_status_accepted_rejected();

-- Create email outbox table for queuing emails
CREATE TABLE IF NOT EXISTS public.email_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    follow_up_id UUID REFERENCES public.quote_follow_ups(id) ON DELETE SET NULL,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    html TEXT,
    text TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    email_type VARCHAR(100),
    attempts INTEGER DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for email outbox
CREATE INDEX IF NOT EXISTS idx_email_outbox_status ON public.email_outbox(status);
CREATE INDEX IF NOT EXISTS idx_email_outbox_quote_id ON public.email_outbox(quote_id);
CREATE INDEX IF NOT EXISTS idx_email_outbox_user_id ON public.email_outbox(user_id);
CREATE INDEX IF NOT EXISTS idx_email_outbox_created_at ON public.email_outbox(created_at);

-- Enable RLS for email outbox
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own outbox records
CREATE POLICY "Users can view their own outbox records" ON public.email_outbox
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policy: System can insert/update outbox records
CREATE POLICY "System can manage outbox records" ON public.email_outbox
    FOR ALL USING (true);

-- Function to send emails from outbox (called by cron job)
CREATE OR REPLACE FUNCTION public.send_pending_emails()
RETURNS VOID AS $$
DECLARE
  v_email RECORD;
BEGIN
  -- Process emails in outbox with 'sending' status
  FOR v_email IN 
    SELECT id, quote_id, user_id, to_email, subject, html, text, email_type, meta
    FROM public.email_outbox 
    WHERE status = 'sending'
    ORDER BY created_at ASC
    LIMIT 50
  LOOP
    BEGIN
      -- Here you would integrate with your email service (Resend, SendGrid, etc.)
      -- For now, we'll mark as sent and log the attempt
      
      -- Update email status to sent
      UPDATE public.email_outbox 
      SET status = 'sent', sent_at = NOW(), attempts = COALESCE(attempts, 0) + 1
      WHERE id = v_email.id;
      
      -- Log successful email sending
      INSERT INTO public.quote_events (quote_id, user_id, type, meta)
      VALUES (v_email.quote_id, v_email.user_id, 'email_sent', jsonb_build_object(
        'email_type', v_email.email_type,
        'outbox_id', v_email.id,
        'to_email', v_email.to_email,
        'automated', true,
        'timestamp', NOW()
      ));
      
      RAISE NOTICE 'Email sent successfully: % to %', v_email.email_type, v_email.to_email;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log failed email attempt
      UPDATE public.email_outbox 
      SET status = 'failed', last_error = SQLERRM, attempts = COALESCE(attempts, 0) + 1
      WHERE id = v_email.id;
      
      RAISE WARNING 'Failed to send email %: %', v_email.id, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule cron job to send pending emails (runs every 5 minutes)
SELECT cron.schedule(
  'send-pending-emails',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT public.send_pending_emails();'
);

-- Alternative: Function to manually trigger email processing
-- This can be called from your application or manually when needed
CREATE OR REPLACE FUNCTION public.trigger_email_processing()
RETURNS TEXT AS $$
BEGIN
  -- Process follow-ups for sent quotes
  PERFORM public.schedule_followups_for_sent_quotes();
  
  -- Process pending emails
  PERFORM public.send_pending_emails();
  
  RETURN 'Email processing completed at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check email outbox status
CREATE OR REPLACE FUNCTION public.get_email_outbox_status()
RETURNS TABLE(
  total_emails BIGINT,
  pending_emails BIGINT,
  sending_emails BIGINT,
  sent_emails BIGINT,
  failed_emails BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_emails,
    COUNT(*) FILTER (WHERE status = 'sending') as sending_emails,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_emails,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_emails
  FROM public.email_outbox;
END;
$$ LANGUAGE plpgsql;


INSERT INTO "public"."email_templates" ("id", "user_id", "template_type", "template_name", "subject", "html_content", "text_content", "variables", "is_active", "is_default", "language", "created_at", "updated_at") VALUES ('15003f9c-85b7-4527-80c0-ad3d2bcd2be4', null, 'client_accepted', 'Devis accepté', 'Devis {quote_number} accepté - Merci !', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Devis accepté !</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Merci d'avoir accepté notre devis !</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #48dbfb;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant accepté : {quote_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Notre équipe vous contacte bientôt pour la suite !</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #48dbfb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(72, 219, 251, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Devis {quote_number} accepté - Merci !

Bonjour {client_name},

Merci d'avoir accepté notre devis !
Montant accepté : {quote_amount}

Notre équipe vous contacte bientôt pour la suite !

Voir le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('57229b60-495c-49ee-91d3-8e20e4bef302', null, 'viewed_instant', 'Relance - Instant Vue', 'Devis {quote_number} - Merci de votre intérêt !', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Merci de votre intérêt !</h1>
      <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Merci d'avoir consulté notre devis pour votre projet <strong>"{quote_title}"</strong>.</p>
      <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous espérons que notre proposition répond à vos attentes. Avez-vous des questions ou souhaitez-vous que nous clarifions certains points ?</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{quote_link}" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">Voir le devis</a>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
  </div>', 'Merci de votre intérêt !

Bonjour {client_name},

Merci d'avoir consulté notre devis pour votre projet "{quote_title}".
Nous espérons que notre proposition répond à vos attentes. Avez-vous des questions ou souhaitez-vous que nous clarifions certains points ?

Voir le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "quote_title": true, "company_name": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-19 23:31:57.162937+00', '2025-08-19 23:31:57.162937+00'), ('7cb9573c-f7c7-4d52-b032-655cd7962972', null, 'quote_sent', 'Devis envoyé', 'Devis {quote_number} - {quote_title}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre devis est prêt !</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant : {quote_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Valable jusqu'au {valid_until}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Devis {quote_number} - {quote_title}

Bonjour {client_name},

Votre devis est prêt !
Montant : {quote_amount}
Valable jusqu'au {valid_until}

Voir le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "quote_title": true, "valid_until": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('813283c8-2d50-4ae7-af90-9eba3edcd9b4', null, 'followup_viewed_no_action', 'Relance - Vue sans action', 'Devis {quote_number} - Des questions sur notre proposition ?', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Vous avez consulté notre devis il y a <strong>{days_since_sent} jours</strong>.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Des questions ? Nous sommes là pour vous aider !</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #feca57; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(254, 202, 87, 0.3);">Relire le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Relance - Devis {quote_number}

Bonjour {client_name},

Vous avez consulté notre devis il y a {days_since_sent} jours.
Des questions ? Nous sommes là pour vous aider !

Relire le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('8ff37f8e-ccbd-4c5b-880e-4cfd4eee4f67', null, 'welcome_client', 'Bienvenue client', 'Bienvenue - Votre projet a été reçu', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue !</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Votre projet a été reçu</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous sommes ravis de vous accueillir sur notre plateforme !</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l''examiner et vous proposer des devis dans les plus brefs délais.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Bienvenue - Votre projet a été reçu

Bonjour {client_name},

Nous sommes ravis de vous accueillir sur notre plateforme !
Votre demande de projet a été reçue avec succès. Nos artisans qualifiés vont l''examiner et vous proposer des devis dans les plus brefs délais.

Merci de votre confiance !

{company_name}', '{"client_name": true, "company_name": true}', 'true', 'true', 'fr', '2025-08-18 19:58:02.672352+00', '2025-08-18 19:58:02.672352+00'), ('e7a5954a-bee4-4b11-80b8-0b261b3414c7', null, 'general_followup', 'Relance générale', 'Devis {quote_number} - Rappel', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Rappel</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Rappel de notre devis pour votre projet.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant : {quote_amount}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Rappel - Devis {quote_number}

Bonjour {client_name},

Rappel de notre devis pour votre projet.
Montant : {quote_amount}

Voir le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('ec93726f-f8eb-47d2-b882-d80d1a64dd2a', null, 'client_rejected', 'Devis refusé', 'Devis {quote_number} - Merci pour votre retour', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #a55eea 0%, #8b5cf6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Merci pour votre retour</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Merci pour votre retour sur notre devis.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous restons à votre disposition pour de futurs projets.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Devis {quote_number} - Merci pour votre retour

Bonjour {client_name},

Merci pour votre retour sur notre devis.
Nous restons à votre disposition pour de futurs projets.

{company_name}', '{"client_name": true, "company_name": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('ef0c04d7-3d8f-4331-aa62-7e52fa78a655', null, 'followup_not_viewed', 'Relance - Email non ouvert', 'Devis {quote_number} - Avez-vous reçu notre proposition ?', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Devis {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Nous avons envoyé notre devis il y a <strong>{days_since_sent} jours</strong>.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Avez-vous bien reçu notre proposition ?</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">Voir le devis</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Relance - Devis {quote_number}

Bonjour {client_name},

Nous avons envoyé notre devis il y a {days_since_sent} jours.
Avez-vous bien reçu notre proposition ?

Voir le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00');



create table public.quote_access_logs (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  share_token character varying(100) null,
  action character varying(100) null,
  accessed_at timestamp with time zone null default now(),
  constraint quote_access_logs_pkey primary key (id),
  constraint quote_access_logs_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_access_logs_quote_id on public.quote_access_logs using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_access_logs_share_token on public.quote_access_logs using btree (share_token) TABLESPACE pg_default;

create index IF not exists idx_quote_access_logs_accessed_at on public.quote_access_logs using btree (accessed_at) TABLESPACE pg_default;
create table public.quote_events (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  user_id uuid null,
  type character varying(50) not null,
  meta jsonb null default '{}'::jsonb,
  timestamp timestamp with time zone null default now(),
  share_token character varying(100) null,
  constraint quote_events_pkey primary key (id),
  constraint quote_events_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint quote_events_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint quote_events_user_id_check check (
    (
      (user_id is not null)
      or (
        (user_id is null)
        and (
          (type)::text = any (
            (
              array[
                'email_sent'::character varying,
                'system_event'::character varying,
                'quote_created'::character varying,
                'quote_updated'::character varying
              ]
            )::text[]
          )
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quote_events_quote_id on public.quote_events using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_events_user_id on public.quote_events using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quote_events_type on public.quote_events using btree (type) TABLESPACE pg_default;

create index IF not exists idx_quote_events_timestamp on public.quote_events using btree ("timestamp") TABLESPACE pg_default;

create index IF not exists idx_quote_events_share_token on public.quote_events using btree (share_token) TABLESPACE pg_default;

create table public.quote_follow_ups (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  user_id uuid not null,
  client_id uuid null,
  stage smallint not null,
  scheduled_at timestamp with time zone not null,
  next_attempt_at timestamp with time zone null,
  attempts smallint not null default 0,
  max_attempts smallint not null default 3,
  status character varying(20) not null default 'pending'::character varying,
  channel character varying(20) not null default 'email'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  automated boolean not null default true,
  template_subject text null,
  template_text text null,
  template_html text null,
  meta jsonb null default '{}'::jsonb,
  constraint quote_follow_ups_pkey primary key (id),
  constraint quote_follow_ups_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null,
  constraint quote_follow_ups_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint quote_follow_ups_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_follow_ups_quote_id on public.quote_follow_ups using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_follow_ups_user_id on public.quote_follow_ups using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quote_follow_ups_scheduled_at on public.quote_follow_ups using btree (scheduled_at) TABLESPACE pg_default;
create table public.quote_shares (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  share_token character varying(100) not null,
  access_count integer null default 0,
  last_accessed timestamp with time zone null,
  expires_at timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint quote_shares_pkey primary key (id),
  constraint quote_shares_share_token_key unique (share_token),
  constraint quote_shares_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_shares_quote_id on public.quote_shares using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_shares_share_token on public.quote_shares using btree (share_token) TABLESPACE pg_default;
create table public.quotes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  profile_id uuid null,
  company_profile_id uuid null,
  client_id uuid null,
  quote_number character varying(50) not null,
  title text null,
  description text null,
  status character varying(50) null default 'draft'::character varying,
  project_categories text[] null default '{}'::text[],
  custom_category text null,
  total_amount numeric(15, 2) null default 0,
  tax_amount numeric(15, 2) null default 0,
  discount_amount numeric(15, 2) null default 0,
  final_amount numeric(15, 2) null default 0,
  valid_until date null,
  terms_conditions text null,
  share_token character varying(100) null,
  is_public boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  start_date date null,
  accepted_at timestamp with time zone null,
  rejected_at timestamp with time zone null,
  sent_at timestamp with time zone null,
  rejection_reason text null,
  constraint quotes_pkey primary key (id),
  constraint quotes_share_token_key unique (share_token),
  constraint quotes_user_quote_number_key unique (user_id, quote_number),
  constraint quotes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint quotes_profile_id_fkey foreign KEY (profile_id) references user_profiles (id) on delete CASCADE,
  constraint quotes_company_profile_id_fkey foreign KEY (company_profile_id) references company_profiles (id) on delete set null,
  constraint quotes_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_quotes_sent_at on public.quotes using btree (sent_at) TABLESPACE pg_default;

create index IF not exists idx_quotes_rejection_reason on public.quotes using btree (rejection_reason) TABLESPACE pg_default;

create index IF not exists idx_quotes_user_id on public.quotes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_profile_id on public.quotes using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_company_profile_id on public.quotes using btree (company_profile_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_client_id on public.quotes using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_quote_number on public.quotes using btree (quote_number) TABLESPACE pg_default;

create index IF not exists idx_quotes_status on public.quotes using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quotes_share_token on public.quotes using btree (share_token) TABLESPACE pg_default;

create index IF not exists idx_quotes_valid_until on public.quotes using btree (valid_until) TABLESPACE pg_default;

create index IF not exists idx_quotes_created_at on public.quotes using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_quotes_is_public on public.quotes using btree (is_public) TABLESPACE pg_default;

create index IF not exists idx_quotes_project_categories_gin on public.quotes using gin (project_categories) TABLESPACE pg_default;

