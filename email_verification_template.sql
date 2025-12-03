-- =====================================================
-- EMAIL VERIFICATION OTP TEMPLATES
-- =====================================================

-- French
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'email_verification_otp',
  'Vérification d''email - Code OTP',
  'Vérifiez votre adresse email - Haliqo',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Haliqo</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Votre partenaire digital intelligent</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Vérifiez votre adresse email</h2>
    
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.6;">Bonjour,</p>
    
    <p style="color: #555; margin: 0 0 20px 0; line-height: 1.6;">
      Merci de vous être inscrit sur Haliqo ! Pour compléter votre inscription, veuillez utiliser le code de vérification ci-dessous.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; padding: 20px 40px; background-color: #1e40af; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; font-family: ''Courier New'', monospace;">
        {otp_code}
      </div>
    </div>
    
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
      <p style="margin: 0 0 10px 0; color: #b45309; font-weight: bold;">Informations de sécurité importantes</p>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
        <li style="margin-bottom: 5px;">Ce code expirera dans <strong>10 minutes</strong> pour des raisons de sécurité</li>
        <li style="margin-bottom: 5px;">Si vous n''avez pas créé de compte sur Haliqo, vous pouvez ignorer cet email en toute sécurité</li>
        <li style="margin-bottom: 0;">Ne partagez jamais ce code avec qui que ce soit</li>
      </ul>
    </div>
    
    <p style="color: #777; font-size: 14px; margin: 15px 0 0 0; line-height: 1.5;">
      <strong>Vous n''avez pas demandé cela ?</strong> Si vous n''avez pas demandé à vérifier votre email, vous pouvez ignorer cet email en toute sécurité.
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">© 2025 Haliqo. Tous droits réservés.</p>
    <p style="margin: 5px 0 0 0;">
      Besoin d''aide ? Contactez-nous à
      <a href="mailto:support@haliqo.com" style="color: #1e40af; text-decoration: none;">support@haliqo.com</a>
    </p>
  </div>
</div>',
  'Haliqo - Vérification d''email

Bonjour,

Merci de vous être inscrit sur Haliqo ! Pour compléter votre inscription, veuillez utiliser le code de vérification ci-dessous:

{otp_code}

Ce code expirera dans 10 minutes pour des raisons de sécurité.

Si vous n''avez pas créé de compte sur Haliqo, vous pouvez ignorer cet email en toute sécurité.

© 2025 Haliqo. Tous droits réservés.',
  '{"otp_code": "string"}',
  true, true, 'fr'
);

-- English
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'email_verification_otp',
  'Email Verification - OTP Code',
  'Verify Your Email Address - Haliqo',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Haliqo</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Your Smart Digital Partner</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Verify Your Email Address</h2>
    
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.6;">Hello,</p>
    
    <p style="color: #555; margin: 0 0 20px 0; line-height: 1.6;">
      Thank you for registering with Haliqo! To complete your registration, please use the verification code below.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; padding: 20px 40px; background-color: #1e40af; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; font-family: ''Courier New'', monospace;">
        {otp_code}
      </div>
    </div>
    
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
      <p style="margin: 0 0 10px 0; color: #b45309; font-weight: bold;">Important Security Information</p>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
        <li style="margin-bottom: 5px;">This code will expire in <strong>10 minutes</strong> for security reasons</li>
        <li style="margin-bottom: 5px;">If you didn''t create an account with Haliqo, you can safely ignore this email</li>
        <li style="margin-bottom: 0;">Never share this code with anyone</li>
      </ul>
    </div>
    
    <p style="color: #777; font-size: 14px; margin: 15px 0 0 0; line-height: 1.5;">
      <strong>Didn''t request this?</strong> If you didn''t ask to verify your email, you can safely ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">© 2025 Haliqo. All rights reserved.</p>
    <p style="margin: 5px 0 0 0;">
      Need help? Contact us at
      <a href="mailto:support@haliqo.com" style="color: #1e40af; text-decoration: none;">support@haliqo.com</a>
    </p>
  </div>
</div>',
  'Haliqo - Email Verification

Hello,

Thank you for registering with Haliqo! To complete your registration, please use the verification code below:

{otp_code}

This code will expire in 10 minutes for security reasons.

If you didn''t create an account with Haliqo, you can safely ignore this email.

© 2025 Haliqo. All rights reserved.',
  '{"otp_code": "string"}',
  true, true, 'en'
);

-- Dutch
INSERT INTO public.email_templates (
  template_type, template_name, subject, html_content, text_content, variables, is_active, is_default, language
) VALUES (
  'email_verification_otp',
  'E-mailverificatie - OTP-code',
  'Verifieer uw e-mailadres - Haliqo',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Haliqo</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Uw slimme digitale partner</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Verifieer uw e-mailadres</h2>
    
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.6;">Hallo,</p>
    
    <p style="color: #555; margin: 0 0 20px 0; line-height: 1.6;">
      Bedankt voor uw registratie bij Haliqo! Om uw registratie te voltooien, gebruik de verificatiecode hieronder.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; padding: 20px 40px; background-color: #1e40af; color: #ffffff; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; font-family: ''Courier New'', monospace;">
        {otp_code}
      </div>
    </div>
    
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin-bottom: 15px;">
      <p style="margin: 0 0 10px 0; color: #b45309; font-weight: bold;">Belangrijke beveiligingsinformatie</p>
      <ul style="margin: 0; padding-left: 20px; color: #92400e; line-height: 1.6;">
        <li style="margin-bottom: 5px;">Deze code verloopt over <strong>10 minuten</strong> om veiligheidsredenen</li>
        <li style="margin-bottom: 5px;">Als u geen account heeft aangemaakt bij Haliqo, kunt u deze e-mail veilig negeren</li>
        <li style="margin-bottom: 0;">Deel deze code nooit met iemand</li>
      </ul>
    </div>
    
    <p style="color: #777; font-size: 14px; margin: 15px 0 0 0; line-height: 1.5;">
      <strong>Heeft u dit niet aangevraagd?</strong> Als u niet heeft gevraagd om uw e-mail te verifiëren, kunt u deze e-mail veilig negeren.
    </p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">© 2025 Haliqo. Alle rechten voorbehouden.</p>
    <p style="margin: 5px 0 0 0;">
      Hulp nodig? Neem contact met ons op via
      <a href="mailto:support@haliqo.com" style="color: #1e40af; text-decoration: none;">support@haliqo.com</a>
    </p>
  </div>
</div>',
  'Haliqo - E-mailverificatie

Hallo,

Bedankt voor uw registratie bij Haliqo! Om uw registratie te voltooien, gebruik de verificatiecode hieronder:

{otp_code}

Deze code verloopt over 10 minuten om veiligheidsredenen.

Als u geen account heeft aangemaakt bij Haliqo, kunt u deze e-mail veilig negeren.

© 2025 Haliqo. Alle rechten voorbehouden.',
  '{"otp_code": "string"}',
  true, true, 'nl'
);

