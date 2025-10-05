-- Subscription Email Templates and Variables
-- Add these templates to your existing email_templates table

-- Template variables for subscription notifications
INSERT INTO public.email_template_variables (variable_name, description, example_value, is_required) VALUES
('user_name', 'User full name', 'John Doe', true),
('user_email', 'User email address', 'john@example.com', true),
('old_plan_name', 'Previous subscription plan name', 'Starter Plan', false),
('new_plan_name', 'New subscription plan name', 'Pro Plan', true),
('old_amount', 'Previous subscription amount', '29.99', false),
('new_amount', 'New subscription amount', '49.99', true),
('billing_interval', 'Billing interval (monthly/yearly)', 'monthly', true),
('effective_date', 'When the change takes effect', '2024-01-15', true),
('cancellation_reason', 'Reason for cancellation', 'User request', false),
('trial_end_date', 'Trial end date', '2024-02-01', false),
('support_email', 'Support contact email', 'support@haliqo.com', true),
('company_name', 'Company name', 'Haliqo', true)
ON CONFLICT (variable_name) DO NOTHING;

-- Subscription Upgrade Email Template
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
  'subscription_upgraded',
  'Subscription Upgraded Notification',
  'Votre abonnement a été mis à niveau - {company_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement mis à niveau</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Abonnement mis à niveau !</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {user_name},</p>
        
        <p>Nous sommes ravis de vous informer que votre abonnement <strong>{company_name}</strong> a été mis à niveau avec succès !</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Détails de la mise à niveau :</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Ancien plan :</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Nouveau plan :</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Montant :</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Date d''effet :</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>Vous avez maintenant accès à toutes les fonctionnalités de votre nouveau plan. Les changements sont immédiatement effectifs.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/dashboard" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accéder à mon tableau de bord</a>
        </div>
        
        <p>Si vous avez des questions concernant cette mise à niveau, n''hésitez pas à nous contacter à <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Cordialement,<br>L''équipe {company_name}</p>
    </div>
</body>
</html>',
  'Bonjour {user_name},

Votre abonnement {company_name} a été mis à niveau avec succès !

Détails de la mise à niveau :
- Ancien plan : {old_plan_name}
- Nouveau plan : {new_plan_name}
- Montant : {new_amount}€ / {billing_interval}
- Date d''effet : {effective_date}

Vous avez maintenant accès à toutes les fonctionnalités de votre nouveau plan. Les changements sont immédiatement effectifs.

Accédez à votre tableau de bord : https://app.haliqo.com/dashboard

Si vous avez des questions, contactez-nous à {support_email}.

Cordialement,
L''équipe {company_name}',
  '{"user_name": "string", "user_email": "string", "old_plan_name": "string", "new_plan_name": "string", "old_amount": "string", "new_amount": "string", "billing_interval": "string", "effective_date": "string", "support_email": "string", "company_name": "string"}',
  true,
  true,
  'fr'
);

-- Subscription Downgrade Email Template
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
  'subscription_downgraded',
  'Subscription Downgraded Notification',
  'Modification de votre abonnement - {company_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement modifié</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Abonnement modifié</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {user_name},</p>
        
        <p>Nous vous informons que votre abonnement <strong>{company_name}</strong> a été modifié selon votre demande.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #ffc107; margin-top: 0;">Détails de la modification :</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Ancien plan :</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Nouveau plan :</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Montant :</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Date d''effet :</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>Vos données et fonctionnalités existantes sont préservées. Vous continuerez à avoir accès à votre compte avec les limitations du nouveau plan.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>💡 Astuce :</strong> Vous pouvez toujours mettre à niveau votre abonnement à tout moment depuis votre tableau de bord.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Gérer mon abonnement</a>
        </div>
        
        <p>Si vous avez des questions concernant cette modification, n''hésitez pas à nous contacter à <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Cordialement,<br>L''équipe {company_name}</p>
    </div>
</body>
</html>',
  'Bonjour {user_name},

Votre abonnement {company_name} a été modifié selon votre demande.

Détails de la modification :
- Ancien plan : {old_plan_name}
- Nouveau plan : {new_plan_name}
- Montant : {new_amount}€ / {billing_interval}
- Date d''effet : {effective_date}

Vos données et fonctionnalités existantes sont préservées. Vous continuerez à avoir accès à votre compte avec les limitations du nouveau plan.

💡 Astuce : Vous pouvez toujours mettre à niveau votre abonnement à tout moment depuis votre tableau de bord.

Gérer mon abonnement : https://app.haliqo.com/subscription

Si vous avez des questions, contactez-nous à {support_email}.

Cordialement,
L''équipe {company_name}',
  '{"user_name": "string", "user_email": "string", "old_plan_name": "string", "new_plan_name": "string", "old_amount": "string", "new_amount": "string", "billing_interval": "string", "effective_date": "string", "support_email": "string", "company_name": "string"}',
  true,
  true,
  'fr'
);

-- Subscription Cancelled Email Template
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
  'subscription_cancelled',
  'Subscription Cancelled Notification',
  'Votre abonnement a été annulé - {company_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement annulé</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Abonnement annulé</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {user_name},</p>
        
        <p>Nous vous informons que votre abonnement <strong>{company_name}</strong> a été annulé.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #dc3545; margin-top: 0;">Détails de l''annulation :</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Plan annulé :</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Date d''annulation :</strong> {effective_date}</li>
                <li style="margin: 10px 0;"><strong>Raison :</strong> {cancellation_reason}</li>
            </ul>
        </div>
        
        <p>Votre compte reste actif jusqu''à la fin de votre période de facturation actuelle. Après cette date, vous perdrez l''accès aux fonctionnalités premium.</p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
            <p style="margin: 0; color: #856404;"><strong>📅 Important :</strong> Vous pouvez toujours réactiver votre abonnement avant la fin de votre période de facturation.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Réactiver mon abonnement</a>
            <a href="https://app.haliqo.com/dashboard" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accéder à mon compte</a>
        </div>
        
        <p>Si vous souhaitez réactiver votre abonnement ou si vous avez des questions, n''hésitez pas à nous contacter à <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Nous espérons vous revoir bientôt !<br>L''équipe {company_name}</p>
    </div>
</body>
</html>',
  'Bonjour {user_name},

Votre abonnement {company_name} a été annulé.

Détails de l''annulation :
- Plan annulé : {old_plan_name}
- Date d''annulation : {effective_date}
- Raison : {cancellation_reason}

Votre compte reste actif jusqu''à la fin de votre période de facturation actuelle. Après cette date, vous perdrez l''accès aux fonctionnalités premium.

📅 Important : Vous pouvez toujours réactiver votre abonnement avant la fin de votre période de facturation.

Réactiver mon abonnement : https://app.haliqo.com/subscription
Accéder à mon compte : https://app.haliqo.com/dashboard

Si vous souhaitez réactiver votre abonnement ou si vous avez des questions, contactez-nous à {support_email}.

Nous espérons vous revoir bientôt !
L''équipe {company_name}',
  '{"user_name": "string", "user_email": "string", "old_plan_name": "string", "effective_date": "string", "cancellation_reason": "string", "support_email": "string", "company_name": "string"}',
  true,
  true,
  'fr'
);

-- Subscription Activated Email Template (for new registrations)
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
  'subscription_activated',
  'Subscription Activated Notification',
  'Votre abonnement est activé - Bienvenue chez {company_name} !',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement activé</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bienvenue chez {company_name} !</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {user_name},</p>
        
        <p>Félicitations ! Votre abonnement <strong>{company_name}</strong> est maintenant activé et vous avez accès à toutes les fonctionnalités de votre plan.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #10b981; margin-top: 0;">Détails de votre abonnement :</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Plan :</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Montant :</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Statut :</strong> Actif</li>
                <li style="margin: 10px 0;"><strong>Date d''activation :</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan. Explorez votre tableau de bord pour découvrir toutes les possibilités qui s''offrent à vous.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>🚀 Prochaines étapes :</strong> Connectez-vous à votre compte et commencez à utiliser toutes les fonctionnalités disponibles.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/dashboard" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Accéder à mon tableau de bord</a>
        </div>
        
        <p>Si vous avez des questions ou besoin d''aide, n''hésitez pas à nous contacter à <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Bienvenue dans l''équipe !<br>L''équipe {company_name}</p>
    </div>
</body>
</html>',
  'Bienvenue chez {company_name} !

Bonjour {user_name},

Félicitations ! Votre abonnement {company_name} est maintenant activé et vous avez accès à toutes les fonctionnalités de votre plan.

Détails de votre abonnement :
- Plan : {new_plan_name}
- Montant : {new_amount}€ / {billing_interval}
- Statut : Actif
- Date d''activation : {effective_date}

Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan. Explorez votre tableau de bord pour découvrir toutes les possibilités qui s''offrent à vous.

🚀 Prochaines étapes : Connectez-vous à votre compte et commencez à utiliser toutes les fonctionnalités disponibles.

Accéder à mon tableau de bord : https://app.haliqo.com/dashboard

Si vous avez des questions ou besoin d''aide, contactez-nous à {support_email}.

Bienvenue dans l''équipe !
L''équipe {company_name}',
  '{"user_name": "string", "user_email": "string", "new_plan_name": "string", "new_amount": "string", "billing_interval": "string", "effective_date": "string", "support_email": "string", "company_name": "string"}',
  true,
  true,
  'fr'
);

-- Subscription Trial Ending Email Template
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
  'subscription_trial_ending',
  'Subscription Trial Ending Notification',
  'Votre période d''essai se termine bientôt - {company_name}',
  '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Période d''essai se termine</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Période d''essai se termine</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {user_name},</p>
        
        <p>Nous vous informons que votre période d''essai gratuite <strong>{company_name}</strong> se termine bientôt.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #ffc107; margin-top: 0;">Détails de votre essai :</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Plan d''essai :</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Fin de l''essai :</strong> {trial_end_date}</li>
                <li style="margin: 10px 0;"><strong>Montant après essai :</strong> {new_amount}€ / {billing_interval}</li>
            </ul>
        </div>
        
        <p>Pour continuer à profiter de toutes les fonctionnalités de {company_name}, vous devrez choisir un plan d''abonnement.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>🎯 Ne perdez pas vos données !</strong> Vos projets et données seront préservés, mais vous perdrez l''accès aux fonctionnalités premium.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Choisir mon plan</a>
        </div>
        
        <p>Si vous avez des questions concernant nos plans d''abonnement, n''hésitez pas à nous contacter à <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Cordialement,<br>L''équipe {company_name}</p>
    </div>
</body>
</html>',
  'Bonjour {user_name},

Votre période d''essai gratuite {company_name} se termine bientôt.

Détails de votre essai :
- Plan d''essai : {new_plan_name}
- Fin de l''essai : {trial_end_date}
- Montant après essai : {new_amount}€ / {billing_interval}

Pour continuer à profiter de toutes les fonctionnalités de {company_name}, vous devrez choisir un plan d''abonnement.

🎯 Ne perdez pas vos données ! Vos projets et données seront préservés, mais vous perdrez l''accès aux fonctionnalités premium.

Choisir mon plan : https://app.haliqo.com/subscription

Si vous avez des questions concernant nos plans d''abonnement, contactez-nous à {support_email}.

Cordialement,
L''équipe {company_name}',
  '{"user_name": "string", "user_email": "string", "new_plan_name": "string", "trial_end_date": "string", "new_amount": "string", "billing_interval": "string", "support_email": "string", "company_name": "string"}',
  true,
  true,
  'fr'
);
