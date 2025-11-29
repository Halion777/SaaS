INSERT INTO "public"."email_templates" ("id", "user_id", "template_type", "template_name", "subject", "html_content", "text_content", "variables", "is_active", "is_default", "language", "created_at", "updated_at") VALUES ('0026f5fa-eb2b-4c8d-ae3c-033ec050e312', null, 'contact_form', 'Formulaire de contact', '[Formulaire de contact] {subject_label}', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle soumission de formulaire de contact</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0036ab 0%, #0052cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📧 Nouvelle soumission</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Formulaire de contact</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0036ab;">
      <h3 style="color: #0036ab; margin-top: 0;">Informations du contact</h3>
      <p style="margin: 10px 0;"><strong>Nom complet :</strong> {full_name}</p>
      <p style="margin: 10px 0;"><strong>Email :</strong> <a href="mailto:{email}">{email}</a></p>
      <p style="margin: 10px 0;"><strong>Téléphone :</strong> {phone}</p>
      <p style="margin: 10px 0;"><strong>Sujet :</strong> {subject_label}</p>
      <p style="margin: 10px 0;"><strong>Date de soumission :</strong> {submission_date}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
      <h3 style="color: #0036ab; margin-top: 0;">Message :</h3>
      <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">{message}</div>
    </div>
    
    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <p style="margin: 0; color: #1976d2; font-size: 12px;">
        <strong>💡 Note :</strong> Cet email a été envoyé depuis le formulaire de contact de {company_name}. Vous pouvez répondre directement à cet email pour contacter le client.
      </p>
    </div>
  </div>
</body>
</html>', 'Nouvelle soumission - Formulaire de contact

Informations du contact :
- Nom complet : {full_name}
- Email : {email}
- Téléphone : {phone}
- Sujet : {subject_label}
- Date de soumission : {submission_date}

Message :
{message}

---
Cet email a été envoyé depuis le formulaire de contact de {company_name}.', '{"email": "string", "phone": "string", "message": "string", "subject": "string", "full_name": "string", "last_name": "string", "first_name": "string", "company_name": "string", "subject_label": "string", "submission_date": "string"}', 'true', 'true', 'fr', '2025-11-14 09:25:33.087241+00', '2025-11-14 09:25:33.087241+00'), ('01223945-b594-436e-a05a-771788e215e4', null, 'subscription_cancelled', 'Abonnement geannuleerd', 'Uw abonnement is geannuleerd - {company_name}', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement geannuleerd</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Abonnement geannuleerd</h1>
  </div>
  
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hallo {user_name},</p>
        
        <p>We informeren u dat uw <strong>{company_name}</strong> abonnement is geannuleerd.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #dc3545; margin-top: 0;">Annuleringsdetails:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Geannuleerd Plan:</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Annuleringsdatum:</strong> {effective_date}</li>
                <li style="margin: 10px 0;"><strong>Reden:</strong> {cancellation_reason}</li>
            </ul>
    </div>
        
        <p>Uw account blijft actief tot het einde van uw huidige factureringsperiode. Na deze datum verliest u toegang tot premium functies.</p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
            <p style="margin: 0; color: #856404;"><strong>📅 Belangrijk:</strong> U kunt uw abonnement nog steeds reactiveren vóór het einde van uw factureringsperiode.</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Heractiveer mijn abonnement</a>
            <a href="https://app.haliqo.com/dashboard" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Toegang tot mijn account</a>
  </div>
  
        <p>Als u uw abonnement wilt reactiveren of vragen heeft, neem dan gerust contact met ons op via <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">We hopen u snel weer te zien!<br>Het {company_name} Team</p>
  </div>
</body>
</html>', 'Hallo {user_name},

Uw {company_name} abonnement is geannuleerd.

Annuleringsdetails:
- Geannuleerd Plan: {old_plan_name}
- Annuleringsdatum: {effective_date}
- Reden: {cancellation_reason}

Uw account blijft actief tot het einde van uw huidige factureringsperiode. Na deze datum verliest u toegang tot premium functies.

📅 Belangrijk: U kunt uw abonnement nog steeds reactiveren vóór het einde van uw factureringsperiode.

Heractiveer mijn abonnement: https://app.haliqo.com/subscription
Toegang tot mijn account: https://app.haliqo.com/dashboard

Als u uw abonnement wilt reactiveren of vragen heeft, neem contact met ons op via {support_email}.

We hopen u snel weer te zien!
Het {company_name} Team', '{"user_name": "string", "user_email": "string", "company_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "cancellation_reason": "string"}', 'true', 'false', 'nl', '2025-11-14 09:20:05.773885+00', '2025-11-14 09:20:05.773885+00'), ('036962bc-ae8e-4963-b5fd-88d7bcacb88d', null, 'invoice_overdue_reminder', 'Betalingsherinnering - Achterstallig', 'Factuur {invoice_number} - Betaling {days_overdue} dag(en) achterstallig', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
  </div>', 'Achterstallige betaling - Factuur {invoice_number}

Hallo {client_name},

We informeren u dat uw factuur {days_overdue} dag(en) achterstallig is.

Factuurnummer: {invoice_number}
Datum: {issue_date}
Vervaldatum: {due_date}
Bedrag: {invoice_amount}
Achterstallig: {days_overdue} dag(en)

De PDF van de factuur is bijgevoegd aan deze e-mail.

Met vriendelijke groet,
{company_name}', '{"due_date": true, "issue_date": true, "client_name": true, "company_name": true, "days_overdue": true, "invoice_link": true, "invoice_amount": true, "invoice_number": true}', 'true', 'false', 'nl', '2025-11-21 12:00:51.060884+00', '2025-11-21 12:00:51.060884+00'), ('038913d4-d19f-4864-b590-bfc7b7824bcc', null, 'subscription_trial_ending', 'Proefperiode loopt af', 'Uw proefperiode loopt binnenkort af - {company_name}', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proefperiode loopt af</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Proefperiode loopt af</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hallo {user_name},</p>
        
        <p>We informeren u dat uw gratis proefperiode voor <strong>{company_name}</strong> binnenkort afloopt.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #ffc107; margin-top: 0;">Uw Proefperiode Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Proefplan:</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Einde Proefperiode:</strong> {trial_end_date}</li>
                <li style="margin: 10px 0;"><strong>Bedrag Na Proefperiode:</strong> {new_amount}€ / {billing_interval}</li>
            </ul>
        </div>
        
        <p>Om te blijven genieten van alle functies van {company_name}, moet u een abonnementsplan kiezen.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>🎯 Verlies uw gegevens niet!</strong> Uw projecten en gegevens worden bewaard, maar u verliest toegang tot premium functies.</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Kies mijn plan</a>
  </div>
  
        <p>Als u vragen heeft over onze abonnementsplannen, neem dan gerust contact met ons op via <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Met vriendelijke groet,<br>Het {company_name} Team</p>
  </div>
</body>
</html>', 'Hallo {user_name},

Uw gratis proefperiode voor {company_name} loopt binnenkort af.

Uw Proefperiode Details:
- Proefplan: {new_plan_name}
- Einde Proefperiode: {trial_end_date}
- Bedrag Na Proefperiode: {new_amount}€ / {billing_interval}

Om te blijven genieten van alle functies van {company_name}, moet u een abonnementsplan kiezen.

🎯 Verlies uw gegevens niet! Uw projecten en gegevens worden bewaard, maar u verliest toegang tot premium functies.

Kies mijn plan: https://app.haliqo.com/subscription

Als u vragen heeft over onze abonnementsplannen, neem contact met ons op via {support_email}.

Met vriendelijke groet,
Het {company_name} Team', '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "trial_end_date": "string", "billing_interval": "string"}', 'true', 'false', 'nl', '2025-11-14 09:20:05.773885+00', '2025-11-14 09:20:05.773885+00'), ('05f07f1b-6f91-48a5-b0bc-8affc256ed4e', null, 'subscription_downgraded', 'Subscription Downgraded Notification', 'Modification de votre abonnement - {company_name}', '<!DOCTYPE html>
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
</html>', 'Bonjour {user_name},

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
L''équipe {company_name}', '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'true', 'fr', '2025-10-05 17:30:36.087589+00', '2025-10-05 17:30:36.087589+00'), ('0a4016d8-aa2e-47ea-b626-d27bb0eb5eb3', null, 'new_lead_available', 'New Project Available', 'New Project Available - {project_description}', '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Available</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎯 New Project</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Matches your skills</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hello {artisan_company_name},</p>
    
    <p>A new project matching your skills is available on our platform.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin-top: 0;">Project Details</h3>
      <p style="margin: 10px 0;"><strong>Description:</strong> {project_description}</p>
      <p style="margin: 10px 0;"><strong>Location:</strong> {location}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{leads_management_url}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Project</a>
    </div>
    
    <p style="margin-top: 30px;">Good luck!<br>
    The {company_name} Team</p>
  </div>
</body>
</html>', 'New Project Available

Hello {artisan_company_name},

A new project matching your skills is available on our platform.

Project Details:
- Description: {project_description}
- Location: {location}

View Project: {leads_management_url}

Good luck!
The {company_name} Team', '{"location": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}', 'true', 'false', 'en', '2025-11-14 09:30:31.645872+00', '2025-11-14 09:30:31.645872+00'), ('0b03eaf7-d128-405d-a82a-a03e1e594d0b', null, 'subscription_downgraded', 'Abonnement gewijzigd', 'Uw abonnement is gewijzigd - {company_name}', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement gewijzigd</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Abonnement gewijzigd</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hallo {user_name},</p>
        
        <p>We informeren u dat uw <strong>{company_name}</strong> abonnement is gewijzigd zoals aangevraagd.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #ffc107; margin-top: 0;">Wijzigingsdetails:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Vorige Plan:</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Nieuw Plan:</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Bedrag:</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Ingangsdatum:</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>Uw bestaande gegevens en functies worden bewaard. U blijft toegang hebben tot uw account met de beperkingen van het nieuwe plan.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>💡 Tip:</strong> U kunt uw abonnement altijd upgraden vanuit uw dashboard.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Beheer mijn abonnement</a>
        </div>
        
        <p>Als u vragen heeft over deze wijziging, neem dan gerust contact met ons op via <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Met vriendelijke groet,<br>Het {company_name} Team</p>
    </div>
</body>
</html>', 'Hallo {user_name},

Uw {company_name} abonnement is gewijzigd zoals aangevraagd.

Wijzigingsdetails:
- Vorige Plan: {old_plan_name}
- Nieuw Plan: {new_plan_name}
- Bedrag: {new_amount}€ / {billing_interval}
- Ingangsdatum: {effective_date}

Uw bestaande gegevens en functies worden bewaard. U blijft toegang hebben tot uw account met de beperkingen van het nieuwe plan.

💡 Tip: U kunt uw abonnement altijd upgraden vanuit uw dashboard.

Beheer mijn abonnement: https://app.haliqo.com/subscription

Als u vragen heeft, neem contact met ons op via {support_email}.

Met vriendelijke groet,
Het {company_name} Team', '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'false', 'nl', '2025-11-14 09:20:05.773885+00', '2025-11-14 09:20:05.773885+00'), ('0e1e51a2-bbc8-4be8-a187-41b18c2a7ab7', null, 'credit_insurance_confirmation', 'Confirmation demande assurance crédit', 'Confirmation de votre demande d''assurance crédit - {haliqo_company_name}', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation de votre demande d''assurance crédit</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Confirmation</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Votre demande a été reçue</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Bonjour,</p>
    
    <p>Nous avons bien reçu votre demande d''assurance crédit pour l''entreprise <strong>{company_name}</strong>.</p>
    
    <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
      <p style="margin: 5px 0;"><strong>Numéro de référence:</strong> {application_id}</p>
      <p style="margin: 5px 0;"><strong>Date de soumission:</strong> {submission_date}</p>
    </div>
    
    <p>Notre équipe va examiner votre dossier et vous contactera dans les plus brefs délais pour vous proposer une offre personnalisée.</p>
    
    <p>En attendant, voici un récapitulatif de votre demande :</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 10px 0;"><strong>Entreprise:</strong> {company_name}</li>
        <li style="margin: 10px 0;"><strong>Personne de contact:</strong> {contact_person}</li>
        <li style="margin: 10px 0;"><strong>Secteur:</strong> {sector}</li>
        <li style="margin: 10px 0;"><strong>Chiffre d''affaires annuel:</strong> {annual_turnover}€</li>
      </ul>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-top: 30px;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">Prochaines étapes:</p>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin: 5px 0;">Analyse de votre dossier par nos experts</li>
        <li style="margin: 5px 0;">Évaluation des risques et de la solvabilité</li>
        <li style="margin: 5px 0;">Proposition personnalisée sous 48-72h</li>
        <li style="margin: 5px 0;">Signature du contrat et activation de la garantie</li>
      </ol>
    </div>
    
    <p style="margin-top: 30px;">Merci de votre confiance.</p>
    
    <p>Cordialement,<br>
    <strong>L''équipe {haliqo_company_name}</strong></p>
  </div>
</body>
</html>', 'Confirmation de votre demande d''assurance crédit

Bonjour,

Nous avons bien reçu votre demande d''assurance crédit pour l''entreprise {company_name}.

Numéro de référence: {application_id}
Date de soumission: {submission_date}

Notre équipe va examiner votre dossier et vous contactera dans les plus brefs délais pour vous proposer une offre personnalisée.

Récapitulatif de votre demande:
- Entreprise: {company_name}
- Personne de contact: {contact_person}
- Secteur: {sector}
- Chiffre d''affaires annuel: {annual_turnover}€

Prochaines étapes:
1. Analyse de votre dossier par nos experts
2. Évaluation des risques et de la solvabilité
3. Proposition personnalisée sous 48-72h
4. Signature du contrat et activation de la garantie

Merci de votre confiance.

Cordialement,
L''équipe {haliqo_company_name}', '{"sector": "string", "company_name": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "haliqo_company_name": "string"}', 'true', 'true', 'fr', '2025-11-14 09:30:08.409184+00', '2025-11-14 09:30:08.409184+00'), ('0e35bf90-2356-422a-a3af-1d07bc016bb7', null, 'welcome_client', 'Welcome Client', 'Welcome - Your project has been received', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome!</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Your project has been received</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We are delighted to welcome you to our platform!</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Your project request has been received successfully. Our qualified craftsmen will review it and provide you with quotes as soon as possible.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Welcome - Your project has been received

Hello {client_name},

We are delighted to welcome you to our platform!
Your project request has been received successfully. Our qualified craftsmen will review it and provide you with quotes as soon as possible.

Thank you for your trust!

{company_name}', '{"client_name": true, "company_name": true}', 'true', 'false', 'en', '2025-11-14 09:19:23.628379+00', '2025-11-14 09:19:23.628379+00'), ('15003f9c-85b7-4527-80c0-ad3d2bcd2be4', null, 'client_accepted', 'Devis accepté', 'Devis {quote_number} accepté - Merci !', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
</div>', 'Devis {quote_number} accepté - Merci !

Bonjour {client_name},

Merci d''avoir accepté notre devis !
Montant accepté : {quote_amount}

Notre équipe vous contacte bientôt pour la suite !

Voir le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('1de5605b-2fa4-46ec-b37a-97198bf0c569', null, 'subscription_activated', 'Subscription Activated Notification', 'Your subscription is activated - Welcome to {company_name}!', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Activated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to {company_name}!</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hello {user_name},</p>
        
        <p>Congratulations! Your <strong>{company_name}</strong> subscription is now activated and you have access to all features of your plan.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #10b981; margin-top: 0;">Your Subscription Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Plan:</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Amount:</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Status:</strong> Active</li>
                <li style="margin: 10px 0;"><strong>Activation Date:</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>You can now enjoy all the features of your plan. Explore your dashboard to discover all the possibilities available to you.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>🚀 Next Steps:</strong> Log in to your account and start using all available features.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/dashboard" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Access My Dashboard</a>
        </div>
        
        <p>If you have any questions or need help, please do not hesitate to contact us at <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Welcome to the team!<br>The {company_name} Team</p>
    </div>
</body>
</html>', 'Welcome to {company_name}!

Hello {user_name},

Congratulations! Your {company_name} subscription is now activated and you have access to all features of your plan.

Your Subscription Details:
- Plan: {new_plan_name}
- Amount: {new_amount}€ / {billing_interval}
- Status: Active
- Activation Date: {effective_date}

You can now enjoy all the features of your plan. Explore your dashboard to discover all the possibilities available to you.

🚀 Next Steps: Log in to your account and start using all available features.

Access my dashboard: https://app.haliqo.com/dashboard

If you have any questions or need help, contact us at {support_email}.

Welcome to the team!
The {company_name} Team', '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'false', 'en', '2025-11-14 09:19:53.415126+00', '2025-11-14 09:19:53.415126+00'), ('1f021702-0c6e-4292-b92d-cfcfaaaa60e2', null, 'invoice_to_accountant', 'Invoices to Accountant', 'Invoices to Process - {invoice_count} invoice(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Invoices to Process</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_count} invoice(s)</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Please find attached {invoice_count} client invoice(s) to process.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Total Amount: {total_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Date: {date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">An Excel file containing the invoice details is attached to this email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Invoices to Process - {invoice_count} invoice(s)

Hello,

Please find attached {invoice_count} client invoice(s) to process.
Total Amount: {total_amount}
Date: {date}

An Excel file containing the invoice details is attached to this email.

Best regards,
{company_name}', '{"date": true, "company_name": true, "total_amount": true, "invoice_count": true}', 'true', 'false', 'en', '2025-11-27 00:45:30.861693+00', '2025-11-27 00:45:30.861693+00'), ('20db5d23-f830-47a8-8d23-7e979712b178', null, 'credit_insurance_confirmation', 'Kredietverzekering Bevestiging', 'Bevestiging van uw kredietverzekering aanvraag - {haliqo_company_name}', '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bevestiging van uw kredietverzekering aanvraag</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Bevestiging</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Uw aanvraag is ontvangen</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Beste,</p>
    
    <p>We hebben uw kredietverzekering aanvraag voor <strong>{company_name}</strong> ontvangen.</p>
    
    <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
      <p style="margin: 5px 0;"><strong>Referentienummer:</strong> {application_id}</p>
      <p style="margin: 5px 0;"><strong>Inzendingsdatum:</strong> {submission_date}</p>
    </div>
    
    <p>Ons team zal uw aanvraag beoordelen en zo spoedig mogelijk contact met u opnemen om een gepersonaliseerd aanbod te doen.</p>
    
    <p>Hier is een samenvatting van uw aanvraag:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 10px 0;"><strong>Bedrijf:</strong> {company_name}</li>
        <li style="margin: 10px 0;"><strong>Contactpersoon:</strong> {contact_person}</li>
        <li style="margin: 10px 0;"><strong>Sector:</strong> {sector}</li>
        <li style="margin: 10px 0;"><strong>Jaaromzet:</strong> {annual_turnover}€</li>
      </ul>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-top: 30px;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">Volgende stappen:</p>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin: 5px 0;">Beoordeling van uw aanvraag door onze experts</li>
        <li style="margin: 5px 0;">Risico- en solvabiliteitsbeoordeling</li>
        <li style="margin: 5px 0;">Gepersonaliseerd voorstel binnen 48-72 uur</li>
        <li style="margin: 5px 0;">Contractondertekening en activering van de garantie</li>
      </ol>
    </div>
    
    <p style="margin-top: 30px;">Bedankt voor uw vertrouwen.</p>
    
    <p>Met vriendelijke groet,<br>
    <strong>Het {haliqo_company_name} Team</strong></p>
  </div>
</body>
</html>', 'Bevestiging van uw kredietverzekering aanvraag

Beste,

We hebben uw kredietverzekering aanvraag voor {company_name} ontvangen.

Referentienummer: {application_id}
Inzendingsdatum: {submission_date}

Ons team zal uw aanvraag beoordelen en zo spoedig mogelijk contact met u opnemen om een gepersonaliseerd aanbod te doen.

Samenvatting van uw aanvraag:
- Bedrijf: {company_name}
- Contactpersoon: {contact_person}
- Sector: {sector}
- Jaaromzet: {annual_turnover}€

Volgende stappen:
1. Beoordeling van uw aanvraag door onze experts
2. Risico- en solvabiliteitsbeoordeling
3. Gepersonaliseerd voorstel binnen 48-72 uur
4. Contractondertekening en activering van de garantie

Bedankt voor uw vertrouwen.

Met vriendelijke groet,
Het {haliqo_company_name} Team', '{"sector": "string", "company_name": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "haliqo_company_name": "string"}', 'true', 'false', 'nl', '2025-11-14 09:30:08.409184+00', '2025-11-14 09:30:08.409184+00'), ('23117e15-2011-45de-8d38-3a44d68b462b', null, 'credit_insurance_application', 'Kredietverzekering Aanvraag', 'Nieuwe kredietverzekering aanvraag - {company_name}', '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe kredietverzekering aanvraag</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Nieuwe aanvraag</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Kredietverzekering</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <div style="background: #e0e7ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #1e40af;">
      <p style="margin: 5px 0;"><strong>Aanvraag ID:</strong> {application_id}</p>
      <p style="margin: 5px 0;"><strong>Inzendingsdatum:</strong> {submission_date}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1e40af; margin-top: 0;">Bedrijfsinformatie</h3>
      <p style="margin: 10px 0;"><strong>Bedrijf:</strong> {company_name}</p>
      <p style="margin: 10px 0;"><strong>Contactpersoon:</strong> {contact_person}</p>
      <p style="margin: 10px 0;"><strong>E-mail:</strong> <a href="mailto:{email}">{email}</a></p>
      <p style="margin: 10px 0;"><strong>Telefoon:</strong> {telephone}</p>
      <p style="margin: 10px 0;"><strong>Adres:</strong> {address}</p>
      <p style="margin: 10px 0;"><strong>Bedrijfssector:</strong> {sector}</p>
      <p style="margin: 10px 0;"><strong>Activiteitsbeschrijving:</strong> {activity_description}</p>
      <p style="margin: 10px 0;"><strong>Jaaromzet:</strong> {annual_turnover}€</p>
      <p style="margin: 10px 0;"><strong>Belangrijkste B2B-klanten:</strong> {top_customers}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Actie vereist:</strong> Bekijk deze aanvraag en neem contact op met de klant om een gepersonaliseerd voorstel te doen.
      </p>
    </div>
  </div>
</body>
</html>', 'Nieuwe kredietverzekering aanvraag

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

⚠️ Actie vereist: Bekijk deze aanvraag en neem contact op met de klant om een gepersonaliseerd voorstel te doen.', '{"email": "string", "sector": "string", "address": "string", "telephone": "string", "company_name": "string", "top_customers": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "activity_description": "string"}', 'true', 'false', 'nl', '2025-11-14 09:30:08.409184+00', '2025-11-14 09:30:08.409184+00'), ('2acc937c-56dd-4b2f-814a-7069deaa1c74', null, 'general_followup', 'Algemene relance', 'Offerte {quote_number} - Herinnering', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Herinnering</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Offerte {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Herinnering van onze offerte voor uw project.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Bedrag: {quote_amount}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Bekijk offerte</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Herinnering - Offerte {quote_number}

Hallo {client_name},

Herinnering van onze offerte voor uw project.
Bedrag: {quote_amount}

Bekijk offerte: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'false', 'nl', '2025-11-14 09:19:35.748918+00', '2025-11-14 09:19:35.748918+00'), ('373206a4-18c9-413f-b32c-4211c031fd2b', null, 'welcome_client', 'Welkom klant', 'Welkom - Uw project is ontvangen', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welkom!</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Uw project is ontvangen</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We zijn verheugd u te verwelkomen op ons platform!</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Uw projectaanvraag is met succes ontvangen. Onze gekwalificeerde vakmensen zullen deze beoordelen en u zo spoedig mogelijk offertes verstrekken.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Welkom - Uw project is ontvangen

Hallo {client_name},

We zijn verheugd u te verwelkomen op ons platform!
Uw projectaanvraag is met succes ontvangen. Onze gekwalificeerde vakmensen zullen deze beoordelen en u zo spoedig mogelijk offertes verstrekken.

Bedankt voor uw vertrouwen!

{company_name}', '{"client_name": true, "company_name": true}', 'true', 'false', 'nl', '2025-11-14 09:19:35.748918+00', '2025-11-14 09:19:35.748918+00'), ('384cb18a-b4d8-4d23-a87d-1b3627418bf4', null, 'custom_quote_sent', 'Custom Quote', 'Quote {quote_number} - {quote_title}', '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote {quote_number}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Quote {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hello {client_name},</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin-top: 0;">Quote Information</h3>
      <p style="margin: 10px 0;"><strong>Quote:</strong> {quote_number}</p>
      <p style="margin: 10px 0;"><strong>Project:</strong> {quote_title}</p>
      <p style="margin: 10px 0;"><strong>Amount:</strong> {quote_amount}</p>
      <p style="margin: 10px 0;"><strong>Valid until:</strong> {valid_until}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
    
    {quote_link}
    
    <p style="margin-top: 30px;">Best regards,<br>
    <strong>{company_name}</strong></p>
  </div>
</body>
</html>', 'Quote {quote_number} - {quote_title}

Hello {client_name},

Quote Information:
- Quote: {quote_number}
- Project: {quote_title}
- Amount: {quote_amount}
- Valid until: {valid_until}

{custom_message}

View Quote: {quote_link}

Best regards,
{company_name}', '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string"}', 'true', 'false', 'en', '2025-11-14 09:31:10.445065+00', '2025-11-14 09:31:10.445065+00'), ('4593df4d-702b-4c2d-9c21-ef3ae1b2d918', null, 'subscription_activated', 'Subscription Activated Notification', 'Votre abonnement est activé - Bienvenue chez {company_name} !', '<!DOCTYPE html>
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
</html>', 'Bienvenue chez {company_name} !

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
L''équipe {company_name}', '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'true', 'fr', '2025-10-05 17:30:36.087589+00', '2025-10-05 17:30:36.087589+00'), ('4c5c1009-0562-4ced-9577-6f68da8845d6', null, 'expense_invoice_to_accountant', 'Expense Invoices to Accountant', 'Expense Invoices to Process - {invoice_count} invoice(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Expense Invoices to Process</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_count} invoice(s)</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Please find attached {invoice_count} expense invoice(s) to process.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-weight: bold; color: #333;">Total Amount: {total_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Date: {date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">An Excel file containing the invoice details is attached to this email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Expense Invoices to Process - {invoice_count} invoice(s)

Hello,

Please find attached {invoice_count} expense invoice(s) to process.
Total Amount: {total_amount}
Date: {date}

An Excel file containing the invoice details is attached to this email.

Best regards,
{company_name}', '{"date": true, "company_name": true, "total_amount": true, "invoice_count": true}', 'true', 'false', 'en', '2025-11-27 00:45:30.861693+00', '2025-11-27 00:45:30.861693+00'), ('4cdfe8e0-4c75-4be8-8a30-c446ec4b6ace', null, 'general_followup', 'General Follow-up', 'Quote {quote_number} - Reminder', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reminder</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Quote {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Reminder of our quote for your project.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Amount: {quote_amount}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">View Quote</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Reminder - Quote {quote_number}

Hello {client_name},

Reminder of our quote for your project.
Amount: {quote_amount}

View quote: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'false', 'en', '2025-11-14 09:19:23.628379+00', '2025-11-14 09:19:23.628379+00'), ('4ef0ec30-4d5b-42a0-84f3-bf4aa325e446', null, 'client_rejected', 'Quote Rejected', 'Quote {quote_number} - Thank you for your feedback', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #a55eea 0%, #8b5cf6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Quote {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Thank you for your feedback</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Thank you for your feedback on our quote.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We remain at your disposal for future projects.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Quote {quote_number} - Thank you for your feedback

Hello {client_name},

Thank you for your feedback on our quote.
We remain at your disposal for future projects.

{company_name}', '{"client_name": true, "company_name": true, "quote_number": true}', 'true', 'false', 'en', '2025-11-14 09:19:23.628379+00', '2025-11-14 09:19:23.628379+00'), ('53edab40-f2c4-4898-9f28-e00a9fb26d6a', null, 'client_accepted', 'Offerte geaccepteerd', 'Offerte {quote_number} geaccepteerd - Bedankt!', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Offerte geaccepteerd!</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Bedankt voor het accepteren van onze offerte!</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #48dbfb;">
      <p style="margin: 0; font-weight: bold; color: #333;">Geaccepteerd bedrag: {quote_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Ons team neemt binnenkort contact met u op voor de volgende stappen!</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #48dbfb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(72, 219, 251, 0.3);">Bekijk offerte</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Offerte {quote_number} geaccepteerd - Bedankt!

Hallo {client_name},

Bedankt voor het accepteren van onze offerte!
Geaccepteerd bedrag: {quote_amount}

Ons team neemt binnenkort contact met u op voor de volgende stappen!

Bekijk offerte: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'false', 'nl', '2025-11-14 09:19:35.748918+00', '2025-11-14 09:19:35.748918+00'), ('56dc4351-755e-4768-ba48-c092be239430', null, 'new_lead_available', 'Nouveau projet disponible', 'Nouveau projet disponible - {project_description}', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouveau projet disponible</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Nouveau projet</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Correspond à vos compétences</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {artisan_company_name},</p>
    
    <p>Un nouveau projet correspondant à vos compétences est disponible sur notre plateforme.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin-top: 0;">Détails du projet</h3>
      <p style="margin: 10px 0;"><strong>Description :</strong> {project_description}</p>
      <p style="margin: 10px 0;"><strong>Localisation :</strong> {location}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{leads_management_url}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Voir le projet</a>
    </div>
    
    <p style="margin-top: 30px;">Bonne chance !<br>
    L''équipe {company_name}</p>
  </div>
</body>
</html>', 'Nouveau projet disponible

Bonjour {artisan_company_name},

Un nouveau projet correspondant à vos compétences est disponible sur notre plateforme.

Détails du projet:
- Description: {project_description}
- Localisation: {location}

Voir le projet: {leads_management_url}

Bonne chance !
L''équipe {company_name}', '{"location": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}', 'true', 'true', 'fr', '2025-11-14 09:30:31.645872+00', '2025-11-14 09:30:31.645872+00'), ('5818b266-8b37-4e32-862f-a67bd0164a2b', null, 'expense_invoice_to_accountant', 'Factures de dépenses au comptable', 'Factures de dépenses à traiter - {invoice_count} facture(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Factures de dépenses à traiter</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_count} facture(s)</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Veuillez trouver ci-joint {invoice_count} facture(s) de dépenses à traiter.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant total : {total_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Date : {date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Un fichier Excel contenant les détails des factures est joint à cet email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Factures de dépenses à traiter - {invoice_count} facture(s)

Bonjour,

Veuillez trouver ci-joint {invoice_count} facture(s) de dépenses à traiter.
Montant total : {total_amount}
Date : {date}

Un fichier Excel contenant les détails des factures est joint à cet email.

Cordialement,
{company_name}', '{"date": true, "company_name": true, "total_amount": true, "invoice_count": true}', 'true', 'true', 'fr', '2025-11-27 00:45:30.861693+00', '2025-11-27 00:45:30.861693+00'), ('5853a415-64b0-47e2-94f1-71f890703c63', null, 'invoice_overdue_reminder', 'Rappel de paiement - Facture en retard', 'Facture {invoice_number} - Paiement en retard de {days_overdue} jour(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
  </div>', 'Paiement en retard - Facture {invoice_number}

Bonjour {client_name},

Nous vous informons que votre facture est en retard de {days_overdue} jour(s).

Numéro de facture: {invoice_number}
Date: {issue_date}
Date d''échéance: {due_date}
Montant: {invoice_amount}
Jours de retard: {days_overdue}

Le PDF de la facture est joint à cet email.

Cordialement,
{company_name}', '{"due_date": true, "issue_date": true, "client_name": true, "company_name": true, "days_overdue": true, "invoice_link": true, "invoice_amount": true, "invoice_number": true}', 'true', 'true', 'fr', '2025-11-21 12:00:51.060884+00', '2025-11-21 12:00:51.060884+00'), ('602f211c-5d4d-45f2-9e38-f5884311aa55', null, 'subscription_trial_ending', 'Subscription Trial Ending Notification', 'Votre période d''essai se termine bientôt - {company_name}', '<!DOCTYPE html>
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
</html>', 'Bonjour {user_name},

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
L''équipe {company_name}', '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "trial_end_date": "string", "billing_interval": "string"}', 'true', 'true', 'fr', '2025-10-05 17:30:36.087589+00', '2025-10-05 17:30:36.087589+00'), ('634637d4-c4a1-405e-a2a4-e01c35fbfcff', null, 'contact_form', 'Contactformulier', '[Contactformulier] {subject_label}', '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuwe contactformulier inzending</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0036ab 0%, #0052cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📧 Nieuwe inzending</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Contactformulier</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0036ab;">
      <h3 style="color: #0036ab; margin-top: 0;">Contactgegevens</h3>
      <p style="margin: 10px 0;"><strong>Volledige naam:</strong> {full_name}</p>
      <p style="margin: 10px 0;"><strong>E-mail:</strong> <a href="mailto:{email}">{email}</a></p>
      <p style="margin: 10px 0;"><strong>Telefoon:</strong> {phone}</p>
      <p style="margin: 10px 0;"><strong>Onderwerp:</strong> {subject_label}</p>
      <p style="margin: 10px 0;"><strong>Inzendingsdatum:</strong> {submission_date}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
      <h3 style="color: #0036ab; margin-top: 0;">Bericht:</h3>
      <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">{message}</div>
    </div>
    
    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <p style="margin: 0; color: #1976d2; font-size: 12px;">
        <strong>💡 Opmerking:</strong> Deze e-mail is verzonden vanuit het {company_name} contactformulier. U kunt direct op deze e-mail antwoorden om contact op te nemen met de klant.
      </p>
    </div>
  </div>
</body>
</html>', 'Nieuwe inzending - Contactformulier

Contactgegevens:
- Volledige naam: {full_name}
- E-mail: {email}
- Telefoon: {phone}
- Onderwerp: {subject_label}
- Inzendingsdatum: {submission_date}

Bericht:
{message}

---
Deze e-mail is verzonden vanuit het {company_name} contactformulier.', '{"email": "string", "phone": "string", "message": "string", "subject": "string", "full_name": "string", "last_name": "string", "first_name": "string", "company_name": "string", "subject_label": "string", "submission_date": "string"}', 'true', 'false', 'nl', '2025-11-14 09:25:33.087241+00', '2025-11-14 09:25:33.087241+00'), ('6ddf2e4f-4dc2-45ce-a7d7-c0993805b3d0', null, 'invoice_payment_reminder', 'Betalingsherinnering - Binnenkort verschuldigd', 'Factuur {invoice_number} - Betaling verschuldigd over {days_until_due} dag(en)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
  </div>', 'Betalingsherinnering - Factuur {invoice_number}

Hallo {client_name},

We herinneren u eraan dat uw factuur over {days_until_due} dag(en) verschuldigd is.

Factuurnummer: {invoice_number}
Datum: {issue_date}
Vervaldatum: {due_date}
Bedrag: {invoice_amount}

De PDF van de factuur is bijgevoegd aan deze e-mail.

Met vriendelijke groet,
{company_name}', '{"due_date": true, "issue_date": true, "client_name": true, "company_name": true, "invoice_link": true, "days_until_due": true, "invoice_amount": true, "invoice_number": true}', 'true', 'false', 'nl', '2025-11-21 12:00:51.060884+00', '2025-11-21 12:00:51.060884+00'), ('753694b6-d3bb-498a-a2fe-5ef32cdb6ec2', null, 'subscription_upgraded', 'Subscription Upgraded Notification', 'Your subscription has been upgraded - {company_name}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Subscription Upgraded!</h1>
    
    </div>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    
    
    </div>
  
    
    <div style="text-align: center; margin: 30px 0;">
    <a href="{link}" style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">Access My Dashboard</a>
  </div>
  
  
  
</div>', 'Your subscription has been upgraded - {company_name}

Subscription Upgraded!


Access My Dashboard
', '"{\\"user_name\\":\\"string\\",\\"new_amount\\":\\"string\\",\\"old_amount\\":\\"string\\",\\"user_email\\":\\"string\\",\\"company_name\\":\\"string\\",\\"new_plan_name\\":\\"string\\",\\"old_plan_name\\":\\"string\\",\\"support_email\\":\\"string\\",\\"effective_date\\":\\"string\\",\\"billing_interval\\":\\"string\\"}"', 'true', 'false', 'en', '2025-11-14 09:19:53.415126+00', '2025-11-14 09:19:53.415126+00'), ('7547399d-6a14-49a2-a1e1-f9f65a12165a', null, 'followup_viewed_no_action', 'Follow-up - Viewed No Action', 'Quote {quote_number} - Questions about our proposal?', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Follow-up</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Quote {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">You viewed our quote <strong>{days_since_sent} days</strong> ago.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Any questions? We are here to help!</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #feca57; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(254, 202, 87, 0.3);">Review Quote</a>
    </div>
    
    <div style="text-align: center; color: #666; font-size: 14px;">
      <p style="margin: 0;">{company_name}</p>
    </div>
</div>', 'Follow-up - Quote {quote_number}

Hello {client_name},

You viewed our quote {days_since_sent} days ago.
Any questions? We are here to help!

Review quote: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'false', 'en', '2025-11-14 09:19:23.628379+00', '2025-11-14 09:19:23.628379+00'), ('7769731f-8951-4051-ae8d-cd26535c84aa', null, 'new_lead_available', 'Nieuw project beschikbaar', 'Nieuw project beschikbaar - {project_description}', '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nieuw project beschikbaar</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Nieuw project</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Komt overeen met uw vaardigheden</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Beste {artisan_company_name},</p>
    
    <p>Een nieuw project dat overeenkomt met uw vaardigheden is beschikbaar op ons platform.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin-top: 0;">Projectdetails</h3>
      <p style="margin: 10px 0;"><strong>Beschrijving:</strong> {project_description}</p>
      <p style="margin: 10px 0;"><strong>Locatie:</strong> {location}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{leads_management_url}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Project bekijken</a>
    </div>
    
    <p style="margin-top: 30px;">Veel succes!<br>
    Het {company_name} Team</p>
  </div>
</body>
</html>', 'Nieuw project beschikbaar

Beste {artisan_company_name},

Een nieuw project dat overeenkomt met uw vaardigheden is beschikbaar op ons platform.

Projectdetails:
- Beschrijving: {project_description}
- Locatie: {location}

Project bekijken: {leads_management_url}

Veel succes!
Het {company_name} Team', '{"location": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}', 'true', 'false', 'nl', '2025-11-14 09:30:31.645872+00', '2025-11-14 09:30:31.645872+00'), ('78019d64-41ba-4ad7-b86e-4aeaabc1e7a6', null, 'invoice_to_accountant', 'Facturen naar accountant', 'Facturen te verwerken - {invoice_count} factuur(en)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Facturen te verwerken</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_count} factuur(en)</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Hierbij vindt u {invoice_count} klantfactuur(en) ter verwerking.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Totaalbedrag: {total_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Datum: {date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Een Excel-bestand met de factuurdetails is bijgevoegd aan deze e-mail.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Facturen te verwerken - {invoice_count} factuur(en)

Hallo,

Hierbij vindt u {invoice_count} klantfactuur(en) ter verwerking.
Totaalbedrag: {total_amount}
Datum: {date}

Een Excel-bestand met de factuurdetails is bijgevoegd aan deze e-mail.

Met vriendelijke groet,
{company_name}', '{"date": true, "company_name": true, "total_amount": true, "invoice_count": true}', 'true', 'false', 'nl', '2025-11-27 00:45:30.861693+00', '2025-11-27 00:45:30.861693+00'), ('7cb9573c-f7c7-4d52-b032-655cd7962972', null, 'quote_sent', 'Devis envoyé', 'Devis {quote_number} - {quote_title}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
</div>', 'Devis {quote_number} - {quote_title}

Bonjour {client_name},

Votre devis est prêt !
Montant : {quote_amount}
Valable jusqu''au {valid_until}

Voir le devis : {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "quote_title": true, "valid_until": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('7d4eca9d-4726-45c6-bec8-70aa030f6aaf', null, 'subscription_activated', 'Abonnement geactiveerd', 'Uw abonnement is geactiveerd - Welkom bij {company_name}!', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement geactiveerd</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welkom bij {company_name}!</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hallo {user_name},</p>
        
        <p>Gefeliciteerd! Uw <strong>{company_name}</strong> abonnement is nu geactiveerd en u heeft toegang tot alle functies van uw plan.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #10b981; margin-top: 0;">Uw Abonnement Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Plan:</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Bedrag:</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Status:</strong> Actief</li>
                <li style="margin: 10px 0;"><strong>Activeringsdatum:</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>U kunt nu genieten van alle functies van uw plan. Verken uw dashboard om alle mogelijkheden te ontdekken die voor u beschikbaar zijn.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>🚀 Volgende Stappen:</strong> Log in op uw account en begin met het gebruik van alle beschikbare functies.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/dashboard" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Toegang tot mijn dashboard</a>
        </div>
        
        <p>Als u vragen heeft of hulp nodig heeft, neem dan gerust contact met ons op via <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Welkom in het team!<br>Het {company_name} Team</p>
    </div>
</body>
</html>', 'Welkom bij {company_name}!

Hallo {user_name},

Gefeliciteerd! Uw {company_name} abonnement is nu geactiveerd en u heeft toegang tot alle functies van uw plan.

Uw Abonnement Details:
- Plan: {new_plan_name}
- Bedrag: {new_amount}€ / {billing_interval}
- Status: Actief
- Activeringsdatum: {effective_date}

U kunt nu genieten van alle functies van uw plan. Verken uw dashboard om alle mogelijkheden te ontdekken die voor u beschikbaar zijn.

🚀 Volgende Stappen: Log in op uw account en begin met het gebruik van alle beschikbare functies.

Toegang tot mijn dashboard: https://app.haliqo.com/dashboard

Als u vragen heeft of hulp nodig heeft, neem contact met ons op via {support_email}.

Welkom in het team!
Het {company_name} Team', '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'false', 'nl', '2025-11-14 09:20:05.773885+00', '2025-11-14 09:20:05.773885+00'), ('7edd76e1-a34f-42f8-9b96-a6842908724e', null, 'expense_invoice_to_accountant', 'Uitgavenfacturen naar accountant', 'Uitgavenfacturen te verwerken - {invoice_count} factuur(en)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Uitgavenfacturen te verwerken</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_count} factuur(en)</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Hierbij vindt u {invoice_count} uitgavenfactuur(en) ter verwerking.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-weight: bold; color: #333;">Totaalbedrag: {total_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Datum: {date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Een Excel-bestand met de factuurdetails is bijgevoegd aan deze e-mail.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Uitgavenfacturen te verwerken - {invoice_count} factuur(en)

Hallo,

Hierbij vindt u {invoice_count} uitgavenfactuur(en) ter verwerking.
Totaalbedrag: {total_amount}
Datum: {date}

Een Excel-bestand met de factuurdetails is bijgevoegd aan deze e-mail.

Met vriendelijke groet,
{company_name}', '{"date": true, "company_name": true, "total_amount": true, "invoice_count": true}', 'true', 'false', 'nl', '2025-11-27 00:45:30.861693+00', '2025-11-27 00:45:30.861693+00'), ('813283c8-2d50-4ae7-af90-9eba3edcd9b4', null, 'followup_viewed_no_action', 'Relance - Vue sans action', 'Devis {quote_number} - Des questions sur notre proposition ?', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('83d03a4f-cbc0-4754-8dad-44a663b4571a', null, 'subscription_upgraded', 'Abonnement geüpgraded', 'Uw abonnement is geüpgraded - {company_name}', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abonnement geüpgraded</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Abonnement geüpgraded!</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hallo {user_name},</p>
        
        <p>We zijn verheugd u te informeren dat uw <strong>{company_name}</strong> abonnement met succes is geüpgraded!</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #28a745; margin-top: 0;">Upgrade Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Vorige Plan:</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Nieuw Plan:</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Bedrag:</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Ingangsdatum:</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>U heeft nu toegang tot alle functies van uw nieuwe plan. Wijzigingen zijn onmiddellijk van kracht.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/dashboard" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Toegang tot mijn dashboard</a>
        </div>
        
        <p>Als u vragen heeft over deze upgrade, neem dan gerust contact met ons op via <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Met vriendelijke groet,<br>Het {company_name} Team</p>
    </div>
</body>
</html>', 'Hallo {user_name},

Uw {company_name} abonnement is met succes geüpgraded!

Upgrade Details:
- Vorige Plan: {old_plan_name}
- Nieuw Plan: {new_plan_name}
- Bedrag: {new_amount}€ / {billing_interval}
- Ingangsdatum: {effective_date}

U heeft nu toegang tot alle functies van uw nieuwe plan. Wijzigingen zijn onmiddellijk van kracht.

Toegang tot uw dashboard: https://app.haliqo.com/dashboard

Als u vragen heeft, neem contact met ons op via {support_email}.

Met vriendelijke groet,
Het {company_name} Team', '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'false', 'nl', '2025-11-14 09:20:05.773885+00', '2025-11-14 09:20:05.773885+00'), ('8990b430-8835-47d3-9eb0-cf06311bb41a', null, 'invoice_overdue_reminder', 'Payment Reminder - Overdue', 'Invoice {invoice_number} - Payment overdue by {days_overdue} day(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
  </div>', 'Payment Overdue - Invoice {invoice_number}

Hello {client_name},

We inform you that your invoice is overdue by {days_overdue} day(s).

Invoice Number: {invoice_number}
Date: {issue_date}
Due Date: {due_date}
Amount: {invoice_amount}
Days Overdue: {days_overdue}

The invoice PDF is attached to this email.

Best regards,
{company_name}', '{"due_date": true, "issue_date": true, "client_name": true, "company_name": true, "days_overdue": true, "invoice_link": true, "invoice_amount": true, "invoice_number": true}', 'true', 'false', 'en', '2025-11-21 12:00:51.060884+00', '2025-11-21 12:00:51.060884+00'), ('8ab2be17-4c6c-4834-9a00-82e594e32300', null, 'custom_quote_sent', 'Devis personnalisé', 'Devis {quote_number} - {quote_title}', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis {quote_number}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Devis {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {client_name},</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin-top: 0;">Informations du devis</h3>
      <p style="margin: 10px 0;"><strong>Devis :</strong> {quote_number}</p>
      <p style="margin: 10px 0;"><strong>Projet :</strong> {quote_title}</p>
      <p style="margin: 10px 0;"><strong>Montant :</strong> {quote_amount}</p>
      <p style="margin: 10px 0;"><strong>Valable jusqu''au :</strong> {valid_until}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
    
    {quote_link}
    
    <p style="margin-top: 30px;">Cordialement,<br>
    <strong>{company_name}</strong></p>
  </div>
</body>
</html>', 'Devis {quote_number} - {quote_title}

Bonjour {client_name},

Informations du devis:
- Devis: {quote_number}
- Projet: {quote_title}
- Montant: {quote_amount}
- Valable jusqu''au: {valid_until}

{custom_message}

Voir le devis: {quote_link}

Cordialement,
{company_name}', '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string"}', 'true', 'true', 'fr', '2025-11-14 09:31:10.445065+00', '2025-11-14 09:31:10.445065+00'), ('8e295f1c-4ed8-4bb4-aaf7-f280919e453c', null, 'lead_assigned', 'Projet assigné', 'Projet assigné - {project_description}', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Projet assigné avec succès</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Projet assigné</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Félicitations !</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Bonjour {artisan_company_name},</p>
    
    <p>Félicitations ! Le projet suivant vous a été assigné avec succès :</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <h3 style="color: #7c3aed; margin-top: 0;">Détails du projet</h3>
      <p style="margin: 10px 0;"><strong>Description :</strong> {project_description}</p>
      <p style="margin: 10px 0;"><strong>Client :</strong> {client_name}</p>
      <p style="margin: 10px 0;"><strong>Localisation :</strong> {location}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{leads_management_url}" style="background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Préparer le devis</a>
    </div>
    
    <p style="margin-top: 30px;">Bonne chance !<br>
    L''équipe {company_name}</p>
  </div>
</body>
</html>', 'Projet assigné avec succès

Bonjour {artisan_company_name},

Félicitations ! Le projet suivant vous a été assigné avec succès :

Détails du projet:
- Description: {project_description}
- Client: {client_name}
- Localisation: {location}

Préparer le devis: {leads_management_url}

Bonne chance !
L''équipe {company_name}', '{"location": "string", "client_name": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}', 'true', 'true', 'fr', '2025-11-14 09:30:31.645872+00', '2025-11-14 09:30:31.645872+00'), ('8ff37f8e-ccbd-4c5b-880e-4cfd4eee4f67', null, 'welcome_client', 'Bienvenue client', 'Bienvenue - Votre projet a été reçu', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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

{company_name}', '{"client_name": true, "company_name": true}', 'true', 'true', 'fr', '2025-08-18 19:58:02.672352+00', '2025-08-18 19:58:02.672352+00'), ('93356eee-796c-4ec8-a10f-289e9d5e7cf7', null, 'subscription_downgraded', 'Subscription Downgraded Notification', 'Your subscription has been modified - {company_name}', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Modified</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">📋 Subscription Modified</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hello {user_name},</p>
        
        <p>We inform you that your <strong>{company_name}</strong> subscription has been modified as requested.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #ffc107; margin-top: 0;">Modification Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Previous Plan:</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>New Plan:</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Amount:</strong> {new_amount}€ / {billing_interval}</li>
                <li style="margin: 10px 0;"><strong>Effective Date:</strong> {effective_date}</li>
            </ul>
        </div>
        
        <p>Your existing data and features are preserved. You will continue to have access to your account with the limitations of the new plan.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>💡 Tip:</strong> You can always upgrade your subscription at any time from your dashboard.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Manage My Subscription</a>
        </div>
        
        <p>If you have any questions about this modification, please do not hesitate to contact us at <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Best regards,<br>The {company_name} Team</p>
    </div>
</body>
</html>', 'Hello {user_name},

Your {company_name} subscription has been modified as requested.

Modification Details:
- Previous Plan: {old_plan_name}
- New Plan: {new_plan_name}
- Amount: {new_amount}€ / {billing_interval}
- Effective Date: {effective_date}

Your existing data and features are preserved. You will continue to have access to your account with the limitations of the new plan.

💡 Tip: You can always upgrade your subscription at any time from your dashboard.

Manage my subscription: https://app.haliqo.com/subscription

If you have any questions, contact us at {support_email}.

Best regards,
The {company_name} Team', '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'false', 'en', '2025-11-14 09:19:53.415126+00', '2025-11-14 09:19:53.415126+00'), ('93f3ca6c-2e02-4fe1-88ca-27cb098b1181', null, 'followup_not_viewed', 'Follow-up - Email Not Opened', 'Quote {quote_number} - Did you receive our proposal?', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Follow-up</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Quote {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We sent our quote <strong>{days_since_sent} days</strong> ago.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Did you receive our proposal?</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">View Quote</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Follow-up - Quote {quote_number}

Hello {client_name},

We sent our quote {days_since_sent} days ago.
Did you receive our proposal?

View quote: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'false', 'en', '2025-11-14 09:19:23.628379+00', '2025-11-14 09:19:23.628379+00'), ('a682c89a-2fdb-4909-9cb9-e37f499cf71f', null, 'invoice_to_accountant', 'Factures au comptable', 'Factures à traiter - {invoice_count} facture(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Factures à traiter</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{invoice_count} facture(s)</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Bonjour,</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Veuillez trouver ci-joint {invoice_count} facture(s) client(s) à traiter.</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Montant total : {total_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Date : {date}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Un fichier Excel contenant les détails des factures est joint à cet email.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Factures à traiter - {invoice_count} facture(s)

Bonjour,

Veuillez trouver ci-joint {invoice_count} facture(s) client(s) à traiter.
Montant total : {total_amount}
Date : {date}

Un fichier Excel contenant les détails des factures est joint à cet email.

Cordialement,
{company_name}', '{"date": true, "company_name": true, "total_amount": true, "invoice_count": true}', 'true', 'true', 'fr', '2025-11-27 00:45:30.861693+00', '2025-11-27 00:45:30.861693+00'), ('b03e3985-9408-4840-b306-39359cdaae65', null, 'invoice_payment_reminder', 'Payment Reminder - Due Soon', 'Invoice {invoice_number} - Payment due in {days_until_due} day(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
  </div>', 'Payment Reminder - Invoice {invoice_number}

Hello {client_name},

We remind you that your invoice is due in {days_until_due} day(s).

Invoice Number: {invoice_number}
Date: {issue_date}
Due Date: {due_date}
Amount: {invoice_amount}

The invoice PDF is attached to this email.

Best regards,
{company_name}', '{"due_date": true, "issue_date": true, "client_name": true, "company_name": true, "invoice_link": true, "days_until_due": true, "invoice_amount": true, "invoice_number": true}', 'true', 'false', 'en', '2025-11-21 12:00:51.060884+00', '2025-11-21 12:00:51.060884+00'), ('b4203a54-11e1-4da2-84ee-667abb2e1676', null, 'invoice_payment_reminder', 'Rappel de paiement - Échéance proche', 'Facture {invoice_number} - Paiement à échéance dans {days_until_due} jour(s)', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
  </div>', 'Rappel de paiement - Facture {invoice_number}

Bonjour {client_name},

Nous vous rappelons que votre facture arrive à échéance dans {days_until_due} jour(s).

Numéro de facture: {invoice_number}
Date: {issue_date}
Date d''échéance: {due_date}
Montant: {invoice_amount}

Le PDF de la facture est joint à cet email.

Cordialement,
{company_name}', '{"due_date": true, "issue_date": true, "client_name": true, "company_name": true, "invoice_link": true, "days_until_due": true, "invoice_amount": true, "invoice_number": true}', 'true', 'true', 'fr', '2025-11-21 12:00:51.060884+00', '2025-11-21 12:00:51.060884+00'), ('b7ff252c-b508-4eaa-b736-b72340a6830f', null, 'subscription_trial_ending', 'Subscription Trial Ending Notification', 'Your trial period is ending soon - {company_name}', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trial Period Ending</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Trial Period Ending</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hello {user_name},</p>
        
        <p>We inform you that your free trial period for <strong>{company_name}</strong> is ending soon.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #ffc107; margin-top: 0;">Your Trial Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Trial Plan:</strong> {new_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Trial End Date:</strong> {trial_end_date}</li>
                <li style="margin: 10px 0;"><strong>Amount After Trial:</strong> {new_amount}€ / {billing_interval}</li>
            </ul>
        </div>
        
        <p>To continue enjoying all features of {company_name}, you will need to choose a subscription plan.</p>
        
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #1976d2;"><strong>🎯 Don''t lose your data!</strong> Your projects and data will be preserved, but you will lose access to premium features.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Choose My Plan</a>
        </div>
        
        <p>If you have any questions about our subscription plans, please do not hesitate to contact us at <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">Best regards,<br>The {company_name} Team</p>
    </div>
</body>
</html>', 'Hello {user_name},

Your free trial period for {company_name} is ending soon.

Your Trial Details:
- Trial Plan: {new_plan_name}
- Trial End Date: {trial_end_date}
- Amount After Trial: {new_amount}€ / {billing_interval}

To continue enjoying all features of {company_name}, you will need to choose a subscription plan.

🎯 Don''t lose your data! Your projects and data will be preserved, but you will lose access to premium features.

Choose my plan: https://app.haliqo.com/subscription

If you have any questions about our subscription plans, contact us at {support_email}.

Best regards,
The {company_name} Team', '{"user_name": "string", "new_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "support_email": "string", "trial_end_date": "string", "billing_interval": "string"}', 'true', 'false', 'en', '2025-11-14 09:19:53.415126+00', '2025-11-14 09:19:53.415126+00'), ('b90c3caa-22cf-456b-81cc-b1646ae0c686', null, 'credit_insurance_confirmation', 'Credit Insurance Confirmation', 'Confirmation of Your Credit Insurance Application - {haliqo_company_name}', '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation of Your Credit Insurance Application</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Confirmation</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Your application has been received</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hello,</p>
    
    <p>We have received your credit insurance application for <strong>{company_name}</strong>.</p>
    
    <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
      <p style="margin: 5px 0;"><strong>Reference Number:</strong> {application_id}</p>
      <p style="margin: 5px 0;"><strong>Submission Date:</strong> {submission_date}</p>
    </div>
    
    <p>Our team will review your application and contact you as soon as possible to provide a personalized offer.</p>
    
    <p>In the meantime, here is a summary of your application:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin: 10px 0;"><strong>Company:</strong> {company_name}</li>
        <li style="margin: 10px 0;"><strong>Contact Person:</strong> {contact_person}</li>
        <li style="margin: 10px 0;"><strong>Sector:</strong> {sector}</li>
        <li style="margin: 10px 0;"><strong>Annual Turnover:</strong> {annual_turnover}€</li>
      </ul>
    </div>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-top: 30px;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">Next Steps:</p>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin: 5px 0;">Review of your application by our experts</li>
        <li style="margin: 5px 0;">Risk and solvency assessment</li>
        <li style="margin: 5px 0;">Personalized proposal within 48-72 hours</li>
        <li style="margin: 5px 0;">Contract signing and guarantee activation</li>
      </ol>
    </div>
    
    <p style="margin-top: 30px;">Thank you for your trust.</p>
    
    <p>Best regards,<br>
    <strong>The {haliqo_company_name} Team</strong></p>
  </div>
</body>
</html>', 'Confirmation of Your Credit Insurance Application

Hello,

We have received your credit insurance application for {company_name}.

Reference Number: {application_id}
Submission Date: {submission_date}

Our team will review your application and contact you as soon as possible to provide a personalized offer.

Summary of your application:
- Company: {company_name}
- Contact Person: {contact_person}
- Sector: {sector}
- Annual Turnover: {annual_turnover}€

Next Steps:
1. Review of your application by our experts
2. Risk and solvency assessment
3. Personalized proposal within 48-72 hours
4. Contract signing and guarantee activation

Thank you for your trust.

Best regards,
The {haliqo_company_name} Team', '{"sector": "string", "company_name": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "haliqo_company_name": "string"}', 'true', 'false', 'en', '2025-11-14 09:30:08.409184+00', '2025-11-14 09:30:08.409184+00'), ('beca10c2-7dfc-42ea-9657-2265014e7470', null, 'credit_insurance_application', 'Credit Insurance Application', 'New Credit Insurance Application - {company_name}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Application</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Credit Insurance</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    
    <div style="color: #555; margin: 0 0 15px 0; line-height: 1.5; white-space: pre-wrap;">Company: {company_name}<br><br>Contact Person: {contact_person}<br><br>Email: {email}<br><br>Phone: {telephone}<br><br>Address: {address}<br><br>Business Sector: {sector}<br><br>Activity Description: {activity_description}<br><br>Annual Turnover: {annual_turnover}€<br><br>Main B2B Customers: {top_customers}</div>
  </div>
  
  
  
  
</div>', 'New Credit Insurance Application - {company_name}

New Application
Credit Insurance

Company: {company_name}

Contact Person: {contact_person}

Email: {email}

Phone: {telephone}

Address: {address}

Business Sector: {sector}

Activity Description: {activity_description}

Annual Turnover: {annual_turnover}€

Main B2B Customers: {top_customers}
', '"{\\"email\\":\\"string\\",\\"sector\\":\\"string\\",\\"address\\":\\"string\\",\\"telephone\\":\\"string\\",\\"company_name\\":\\"string\\",\\"top_customers\\":\\"string\\",\\"application_id\\":\\"string\\",\\"contact_person\\":\\"string\\",\\"annual_turnover\\":\\"string\\",\\"submission_date\\":\\"string\\",\\"activity_description\\":\\"string\\"}"', 'true', 'false', 'en', '2025-11-14 09:30:08.409184+00', '2025-11-14 09:30:08.409184+00'), ('c21ab63c-f0ad-497b-9c48-ab5f6f3c8b15', null, 'quote_sent', 'Quote Sent', 'Quote {quote_number} - {quote_title}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Quote {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Your quote is ready!</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Amount: {quote_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Valid until {valid_until}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">View Quote</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Quote {quote_number} - {quote_title}

Hello {client_name},

Your quote is ready!
Amount: {quote_amount}
Valid until {valid_until}

View quote: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "quote_title": true, "valid_until": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'false', 'en', '2025-11-14 09:19:23.628379+00', '2025-11-14 09:19:23.628379+00'), ('c2cc2b56-ce12-4aee-8e93-471b135ca006', null, 'lead_assigned', 'Project Assigned', 'Project Assigned - {project_description}', '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Successfully Assigned</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Project Assigned</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Congratulations!</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hello {artisan_company_name},</p>
    
    <p>Congratulations! The following project has been successfully assigned to you:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <h3 style="color: #7c3aed; margin-top: 0;">Project Details</h3>
      <p style="margin: 10px 0;"><strong>Description:</strong> {project_description}</p>
      <p style="margin: 10px 0;"><strong>Client:</strong> {client_name}</p>
      <p style="margin: 10px 0;"><strong>Location:</strong> {location}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{leads_management_url}" style="background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Prepare Quote</a>
    </div>
    
    <p style="margin-top: 30px;">Good luck!<br>
    The {company_name} Team</p>
  </div>
</body>
</html>', 'Project Successfully Assigned

Hello {artisan_company_name},

Congratulations! The following project has been successfully assigned to you:

Project Details:
- Description: {project_description}
- Client: {client_name}
- Location: {location}

Prepare Quote: {leads_management_url}

Good luck!
The {company_name} Team', '{"location": "string", "client_name": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}', 'true', 'false', 'en', '2025-11-14 09:30:31.645872+00', '2025-11-14 09:30:31.645872+00'), ('c782704d-ac5d-409e-a168-83be892a177c', null, 'contact_form', 'Contact Form', '[Contact Form] {subject_label}', '<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0036ab 0%, #0052cc 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📧 New Submission</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Contact Form</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0036ab;">
      <h3 style="color: #0036ab; margin-top: 0;">Contact Information</h3>
      <p style="margin: 10px 0;"><strong>Full Name:</strong> {full_name}</p>
      <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
      <p style="margin: 10px 0;"><strong>Phone:</strong> {phone}</p>
      <p style="margin: 10px 0;"><strong>Subject:</strong> {subject_label}</p>
      <p style="margin: 10px 0;"><strong>Submission Date:</strong> {submission_date}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e0e0e0;">
      <h3 style="color: #0036ab; margin-top: 0;">Message:</h3>
      <div style="white-space: pre-wrap; color: #555; line-height: 1.6;">{message}</div>
    </div>
    
    <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <p style="margin: 0; color: #1976d2; font-size: 12px;">
        <strong>💡 Note:</strong> This email was sent from the {company_name} contact form. You can reply directly to this email to contact the client.
      </p>
    </div>
  </div>
</body>
</html>', 'New Submission - Contact Form

Contact Information:
- Full Name: {full_name}
- Email: {email}
- Phone: {phone}
- Subject: {subject_label}
- Submission Date: {submission_date}

Message:
{message}

---
This email was sent from the {company_name} contact form.', '{"email": "string", "phone": "string", "message": "string", "subject": "string", "full_name": "string", "last_name": "string", "first_name": "string", "company_name": "string", "subject_label": "string", "submission_date": "string"}', 'true', 'false', 'en', '2025-11-14 09:25:33.087241+00', '2025-11-14 09:25:33.087241+00'), ('c7abab32-64f4-40cf-97b8-85f29f6ef79d', null, 'followup_viewed_no_action', 'Relance - Bekeken zonder actie', 'Offerte {quote_number} - Vragen over ons voorstel?', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Offerte {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">U heeft onze offerte <strong>{days_since_sent} dagen</strong> geleden bekeken.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Vragen? We staan voor u klaar!</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #feca57; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(254, 202, 87, 0.3);">Herlees offerte</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Relance - Offerte {quote_number}

Hallo {client_name},

U heeft onze offerte {days_since_sent} dagen geleden bekeken.
Vragen? We staan voor u klaar!

Herlees offerte: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'false', 'nl', '2025-11-14 09:19:35.748918+00', '2025-11-14 09:19:35.748918+00'), ('c97878f1-8b4d-430e-8f66-5b81bf10ce52', null, 'lead_assigned', 'Project toegewezen', 'Project toegewezen - {project_description}', '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project succesvol toegewezen</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Project toegewezen</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Gefeliciteerd!</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Beste {artisan_company_name},</p>
    
    <p>Gefeliciteerd! Het volgende project is succesvol aan u toegewezen:</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed;">
      <h3 style="color: #7c3aed; margin-top: 0;">Projectdetails</h3>
      <p style="margin: 10px 0;"><strong>Beschrijving:</strong> {project_description}</p>
      <p style="margin: 10px 0;"><strong>Klant:</strong> {client_name}</p>
      <p style="margin: 10px 0;"><strong>Locatie:</strong> {location}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{leads_management_url}" style="background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Offerte voorbereiden</a>
    </div>
    
    <p style="margin-top: 30px;">Veel succes!<br>
    Het {company_name} Team</p>
  </div>
</body>
</html>', 'Project succesvol toegewezen

Beste {artisan_company_name},

Gefeliciteerd! Het volgende project is succesvol aan u toegewezen:

Projectdetails:
- Beschrijving: {project_description}
- Klant: {client_name}
- Locatie: {location}

Offerte voorbereiden: {leads_management_url}

Veel succes!
Het {company_name} Team', '{"location": "string", "client_name": "string", "company_name": "string", "project_description": "string", "artisan_company_name": "string", "leads_management_url": "string"}', 'true', 'false', 'nl', '2025-11-14 09:30:31.645872+00', '2025-11-14 09:30:31.645872+00'), ('cbba9ed1-4400-4c21-8290-f68763184597', null, 'client_rejected', 'Offerte geweigerd', 'Offerte {quote_number} - Bedankt voor uw feedback', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #a55eea 0%, #8b5cf6 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Offerte {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Bedankt voor uw feedback</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Bedankt voor uw feedback op onze offerte.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We blijven beschikbaar voor toekomstige projecten.</p>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Offerte {quote_number} - Bedankt voor uw feedback

Hallo {client_name},

Bedankt voor uw feedback op onze offerte.
We blijven beschikbaar voor toekomstige projecten.

{company_name}', '{"client_name": true, "company_name": true, "quote_number": true}', 'true', 'false', 'nl', '2025-11-14 09:19:35.748918+00', '2025-11-14 09:19:35.748918+00'), ('e14a38b4-fe7d-4d59-9bdb-d1b83f4ea8d4', null, 'subscription_upgraded', 'Subscription Upgraded Notification', 'Votre abonnement a été mis à niveau - {company_name}', '<!DOCTYPE html>
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
</html>', 'Bonjour {user_name},

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
L''équipe {company_name}', '{"user_name": "string", "new_amount": "string", "old_amount": "string", "user_email": "string", "company_name": "string", "new_plan_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "billing_interval": "string"}', 'true', 'true', 'fr', '2025-10-05 17:30:36.087589+00', '2025-10-05 17:30:36.087589+00'), ('e1fc531d-35cb-42c6-a89a-36df47d2875c', null, 'subscription_cancelled', 'Subscription Cancelled Notification', 'Votre abonnement a été annulé - {company_name}', '<!DOCTYPE html>
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
</html>', 'Bonjour {user_name},

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
L''équipe {company_name}', '{"user_name": "string", "user_email": "string", "company_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "cancellation_reason": "string"}', 'true', 'true', 'fr', '2025-10-05 17:30:36.087589+00', '2025-10-05 17:30:36.087589+00'), ('e3425edc-2d4b-480e-9974-8e507ee26df7', null, 'credit_insurance_application', 'Demande d''assurance crédit', 'Nouvelle demande d''assurance crédit - {company_name}', '<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle demande d''assurance crédit</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📋 Nouvelle demande</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Assurance crédit</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <div style="background: #e0e7ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #1e40af;">
      <p style="margin: 5px 0;"><strong>ID de la demande:</strong> {application_id}</p>
      <p style="margin: 5px 0;"><strong>Date de soumission:</strong> {submission_date}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1e40af; margin-top: 0;">Informations de l''entreprise</h3>
      <p style="margin: 10px 0;"><strong>Entreprise:</strong> {company_name}</p>
      <p style="margin: 10px 0;"><strong>Personne de contact:</strong> {contact_person}</p>
      <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:{email}">{email}</a></p>
      <p style="margin: 10px 0;"><strong>Téléphone:</strong> {telephone}</p>
      <p style="margin: 10px 0;"><strong>Adresse:</strong> {address}</p>
      <p style="margin: 10px 0;"><strong>Secteur d''activité:</strong> {sector}</p>
      <p style="margin: 10px 0;"><strong>Description de l''activité:</strong> {activity_description}</p>
      <p style="margin: 10px 0;"><strong>Chiffre d''affaires annuel:</strong> {annual_turnover}€</p>
      <p style="margin: 10px 0;"><strong>Principaux clients B2B:</strong> {top_customers}</p>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Action requise:</strong> Veuillez examiner cette demande et contacter le client pour une proposition personnalisée.
      </p>
    </div>
  </div>
</body>
</html>', 'Nouvelle demande d''assurance crédit

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

⚠️ Action requise: Veuillez examiner cette demande et contacter le client pour une proposition personnalisée.', '{"email": "string", "sector": "string", "address": "string", "telephone": "string", "company_name": "string", "top_customers": "string", "application_id": "string", "contact_person": "string", "annual_turnover": "string", "submission_date": "string", "activity_description": "string"}', 'true', 'true', 'fr', '2025-11-14 09:30:08.409184+00', '2025-11-14 09:30:08.409184+00'), ('e7a5954a-bee4-4b11-80b8-0b261b3414c7', null, 'general_followup', 'Relance générale', 'Devis {quote_number} - Rappel', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('e8e69355-c30a-42c7-81b0-aeaccebb469a', null, 'client_accepted', 'Quote Accepted', 'Quote {quote_number} accepted - Thank you!', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Quote Accepted!</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hello {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Thank you for accepting our quote!</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #48dbfb;">
      <p style="margin: 0; font-weight: bold; color: #333;">Accepted Amount: {quote_amount}</p>
    </div>
    <p style="color: #555; margin: 15px 0 0 0; line-height: 1.5;">Our team will contact you soon for the next steps!</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #48dbfb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(72, 219, 251, 0.3);">View Quote</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Quote {quote_number} accepted - Thank you!

Hello {client_name},

Thank you for accepting our quote!
Accepted Amount: {quote_amount}

Our team will contact you soon for the next steps!

View quote: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'false', 'en', '2025-11-14 09:19:23.628379+00', '2025-11-14 09:19:23.628379+00'), ('ec7d5fa7-b943-414c-8572-9e40ce0ca665', null, 'quote_sent', 'Offerte verzonden', 'Offerte {quote_number} - {quote_title}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Offerte {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Uw offerte is klaar!</p>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
      <p style="margin: 0; font-weight: bold; color: #333;">Bedrag: {quote_amount}</p>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Geldig tot {valid_until}</p>
    </div>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">Bekijk offerte</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Offerte {quote_number} - {quote_title}

Hallo {client_name},

Uw offerte is klaar!
Bedrag: {quote_amount}
Geldig tot {valid_until}

Bekijk offerte: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "quote_title": true, "valid_until": true, "company_name": true, "quote_amount": true, "quote_number": true}', 'true', 'false', 'nl', '2025-11-14 09:19:35.748918+00', '2025-11-14 09:19:35.748918+00'), ('ec93726f-f8eb-47d2-b882-d80d1a64dd2a', null, 'client_rejected', 'Devis refusé', 'Devis {quote_number} - Merci pour votre retour', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'true', 'fr', '2025-08-18 19:49:47.182728+00', '2025-08-18 19:49:47.182728+00'), ('f1979088-10c8-4f4f-b8fa-736e6eddc23a', null, 'subscription_cancelled', 'Subscription Cancelled Notification', 'Your subscription has been cancelled - {company_name}', '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Cancelled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Subscription Cancelled</h1>
    </div>
    
    <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
        <p style="font-size: 18px; margin-bottom: 20px;">Hello {user_name},</p>
        
        <p>We inform you that your <strong>{company_name}</strong> subscription has been cancelled.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #dc3545; margin-top: 0;">Cancellation Details:</h3>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Cancelled Plan:</strong> {old_plan_name}</li>
                <li style="margin: 10px 0;"><strong>Cancellation Date:</strong> {effective_date}</li>
                <li style="margin: 10px 0;"><strong>Reason:</strong> {cancellation_reason}</li>
            </ul>
        </div>
        
        <p>Your account remains active until the end of your current billing period. After this date, you will lose access to premium features.</p>
        
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeaa7;">
            <p style="margin: 0; color: #856404;"><strong>📅 Important:</strong> You can still reactivate your subscription before the end of your billing period.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://app.haliqo.com/subscription" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Reactivate My Subscription</a>
            <a href="https://app.haliqo.com/dashboard" style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Access My Account</a>
        </div>
        
        <p>If you wish to reactivate your subscription or have any questions, please do not hesitate to contact us at <a href="mailto:{support_email}">{support_email}</a>.</p>
        
        <p style="margin-top: 30px;">We hope to see you again soon!<br>The {company_name} Team</p>
    </div>
</body>
</html>', 'Hello {user_name},

Your {company_name} subscription has been cancelled.

Cancellation Details:
- Cancelled Plan: {old_plan_name}
- Cancellation Date: {effective_date}
- Reason: {cancellation_reason}

Your account remains active until the end of your current billing period. After this date, you will lose access to premium features.

📅 Important: You can still reactivate your subscription before the end of your billing period.

Reactivate my subscription: https://app.haliqo.com/subscription
Access my account: https://app.haliqo.com/dashboard

If you wish to reactivate your subscription or have any questions, contact us at {support_email}.

We hope to see you again soon!
The {company_name} Team', '{"user_name": "string", "user_email": "string", "company_name": "string", "old_plan_name": "string", "support_email": "string", "effective_date": "string", "cancellation_reason": "string"}', 'true', 'false', 'en', '2025-11-14 09:19:53.415126+00', '2025-11-14 09:19:53.415126+00'), ('fa05b61a-bef8-4ee1-8384-aca3d425711a', null, 'custom_quote_sent', 'Aangepaste offerte', 'Offerte {quote_number} - {quote_title}', '<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offerte {quote_number}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Offerte {quote_number}</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">{quote_title}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
    <p style="font-size: 18px; margin-bottom: 20px;">Beste {client_name},</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
      <h3 style="color: #059669; margin-top: 0;">Offerte-informatie</h3>
      <p style="margin: 10px 0;"><strong>Offerte:</strong> {quote_number}</p>
      <p style="margin: 10px 0;"><strong>Project:</strong> {quote_title}</p>
      <p style="margin: 10px 0;"><strong>Bedrag:</strong> {quote_amount}</p>
      <p style="margin: 10px 0;"><strong>Geldig tot:</strong> {valid_until}</p>
    </div>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e0e0e0;">
      <div style="white-space: pre-line; color: #555; line-height: 1.6;">{custom_message}</div>
    </div>
    
    {quote_link}
    
    <p style="margin-top: 30px;">Met vriendelijke groet,<br>
    <strong>{company_name}</strong></p>
  </div>
</body>
</html>', 'Offerte {quote_number} - {quote_title}

Beste {client_name},

Offerte-informatie:
- Offerte: {quote_number}
- Project: {quote_title}
- Bedrag: {quote_amount}
- Geldig tot: {valid_until}

{custom_message}

Offerte bekijken: {quote_link}

Met vriendelijke groet,
{company_name}', '{"quote_link": "string", "client_name": "string", "quote_title": "string", "valid_until": "string", "company_name": "string", "quote_amount": "string", "quote_number": "string", "custom_message": "string"}', 'true', 'false', 'nl', '2025-11-14 09:31:10.445065+00', '2025-11-14 09:31:10.445065+00'), ('fc5cc464-6d1e-4dbd-a257-acc7136dbb39', null, 'followup_not_viewed', 'Relance - E-mail niet geopend', 'Offerte {quote_number} - Heeft u onze voorstel ontvangen?', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Relance</h1>
    <p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">Offerte {quote_number}</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Hallo {client_name},</h2>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">We hebben onze offerte <strong>{days_since_sent} dagen</strong> geleden verzonden.</p>
    <p style="color: #555; margin: 0 0 15px 0; line-height: 1.5;">Heeft u onze voorstel ontvangen?</p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{quote_link}" style="background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);">Bekijk offerte</a>
  </div>
  
  <div style="text-align: center; color: #666; font-size: 14px;">
    <p style="margin: 0;">{company_name}</p>
  </div>
</div>', 'Relance - Offerte {quote_number}

Hallo {client_name},

We hebben onze offerte {days_since_sent} dagen geleden verzonden.
Heeft u onze voorstel ontvangen?

Bekijk offerte: {quote_link}

{company_name}', '{"quote_link": true, "client_name": true, "company_name": true, "quote_number": true, "days_since_sent": true}', 'true', 'false', 'nl', '2025-11-14 09:19:35.748918+00', '2025-11-14 09:19:35.748918+00');