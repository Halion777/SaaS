import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the translation context
const TranslationContext = createContext();

// Common translations across all languages
const translations = {
  // French translations (default)
  fr: {
    // Hero title with markup for highlighting
    heroTitle: {
      prefix: 'La plateforme tout-en-un pour ',
      highlight: 'artisans',
      suffix: ''
    },
    // Error messages
    errors: {
      required: 'requis',
      invalidEmail: 'Email invalide',
      invalidPhone: 'Numéro de téléphone invalide',
      tooShort: 'Trop court',
      tooLong: 'Trop long',
      passwordMismatch: 'Les mots de passe ne correspondent pas'
    },
    
    // Subject options for contact form
    subjectOptions: {
      demo: 'Demande de démonstration',
      question: 'Question sur le produit',
      support: 'Assistance technique',
      partnership: 'Proposition de partenariat',
      other: 'Autre'
    },
    
    // Common navigation for French
    nav: {
      home: 'Accueil',
      pricing: 'Tarifs',
      findArtisan: 'Trouver un artisan',
      about: 'À propos',
      contact: 'Contact',
      blog: 'Blog',
      login: 'Connexion',
      register: 'S\'inscrire',
      freeTrial: 'Essai Gratuit'
    },
    
    // Common UI elements
    ui: {
      tagline: 'Havitam - Votre vitamine digitale professionnelle',
      buttons: {
        createQuote: 'Créer un devis en 2 clics',
        startTrial: 'Commencer l\'essai gratuit',
        getClients: 'Trouvez des clients près de chez vous',
        readMore: 'Lire plus',
        viewFeatures: 'Toutes nos fonctionnalités',
        viewMoreFaqs: 'Voir plus de questions',
        submit: 'Envoyer',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        cancel: 'Annuler',
        save: 'Sauvegarder',
        confirm: 'Confirmer',
        back: 'Retour'
      },
      benefits: {
        freeTrial: 'Essai gratuit de 14 jours',
        noCommitment: 'Sans engagement',
        cancelAnytime: 'Résiliez à tout moment'
      },
      badges: {
        setupTime: 'Configuration en 5 min'
      }
    },
    
    // Page titles
    pageTitles: {
      home: 'Accueil | HAVITAM - Plateforme pour artisans',
      contact: 'Contact | HAVITAM - Plateforme pour artisans',
      pricing: 'Tarifs | HAVITAM - Plateforme pour artisans',
      about: 'À Propos | HAVITAM - Plateforme pour artisans',
      blog: 'Blog | HAVITAM - Plateforme pour artisans',
      login: 'Connexion | HAVITAM - Plateforme pour artisans',
      register: 'Inscription | HAVITAM - Plateforme pour artisans',
      findArtisan: 'Trouver un Artisan | HAVITAM - Plateforme pour artisans'
    },
    
    // Home page
    home: {
      hero: {
        title: 'La plateforme tout-en-un pour artisans',
        subtitle: 'Devis, factures et paiements en un seul endroit. Simplifiez la gestion de votre entreprise artisanale.',
        createQuote: 'Créer un devis en 2 clics',
        getClients: 'Recevoir des clients locaux',
        freeTrial: 'Essai gratuit de 14 jours',
        noCommitment: 'Sans engagement',
        cancelAnytime: 'Résiliez à tout moment'
      },
      features: {
        title: 'Tout ce dont vous avez besoin pour gérer votre activité',
        subtitle: 'Une solution complète pour simplifier la gestion administrative et développer votre clientèle.',
        quotes: {
          title: 'Créez des devis',
          description: 'Créez des devis professionnels en quelques minutes avec l\'aide de l\'IA pour optimiser vos descriptions et prix.'
        },
        invoices: {
          title: 'Envoyez des factures',
          description: 'Transformez vos devis en factures en un clic et envoyez-les automatiquement par email à vos clients.'
        },
        payments: {
          title: 'Suivez les paiements',
          description: 'Suivez en temps réel le statut de vos paiements et recevez des notifications dès qu\'un client règle sa facture.'
        },
        reminders: {
          title: 'Rappels automatiques',
          description: 'Configurez des rappels automatiques pour les factures impayées et concentrez-vous sur votre métier.'
        },
        clients: {
          title: 'Recevez des clients',
          description: 'Rejoignez notre réseau d\'artisans qualifiés et recevez des demandes de devis de clients à proximité.'
        },
        admin: {
          title: 'Simplifiez l\'administratif',
          description: 'Gagnez du temps sur les tâches administratives avec nos outils intelligents et automatisés.'
        }
      },
      testimonials: {
        title: 'Ce que nos clients disent',
        subtitle: 'Des milliers d\'artisans ont déjà transformé leur activité grâce à HAVITAM',
        testimonial1: {
          quote: 'Mes signatures ont augmenté de 45% en 2 mois. L\'IA optimise vraiment mes devis et les clients apprécient la clarté des documents.',
          initials: 'PM',
          name: 'Pierre Martin',
          profession: 'Plombier, Lyon'
        },
        testimonial2: {
          quote: 'Fini les relances manuelles ! HAVITAM gère tout automatiquement et mon taux de paiement dans les délais est passé de 60% à 90%.',
          initials: 'SD',
          name: 'Sophie Dubois',
          profession: 'Électricienne, Paris'
        },
        testimonial3: {
          quote: 'J\'ai gagné 3 nouveaux clients dès la première semaine d\'utilisation grâce au réseau de professionnels HAVITAM. Excellent retour sur investissement.',
          initials: 'TG',
          name: 'Thomas Girard',
          profession: 'Peintre, Marseille'
        }
      },
      cta: {
        title: 'Prêt à faire passer votre entreprise au niveau supérieur ?',
        subtitle: 'Rejoignez des milliers d\'artisans qui ont déjà simplifié leur gestion administrative et développé leur clientèle avec HAVITAM.',
        startTrial: 'Commencer l\'essai gratuit',
        contactUs: 'Nous contacter',
        trialNote: 'Essai gratuit de 14 jours. Aucune carte bancaire requise.'
      },
      faq: {
        title: 'Questions fréquentes',
        subtitle: 'Tout ce que vous devez savoir sur HAVITAM',
        items: [
          {
            question: 'Comment fonctionne l\'essai gratuit ?',
            answer: 'Votre essai gratuit de 14 jours commence dès votre inscription. Vous aurez accès à toutes les fonctionnalités premium sans restriction. Aucune carte bancaire n\'est requise pour démarrer l\'essai et vous pouvez annuler à tout moment.'
          },
          {
            question: 'Mes données sont-elles sécurisées ?',
            answer: 'Absolument. HAVITAM utilise un chiffrement de niveau bancaire pour protéger vos données. Nous sommes conformes au RGPD et ne partageons jamais vos données avec des tiers. Vous restez propriétaire de toutes vos informations à tout moment.'
          },
          {
            question: 'Comment l\'IA optimise-t-elle mes devis ?',
            answer: 'Notre IA analyse des milliers de devis acceptés pour identifier les facteurs de succès. Elle vous suggère ensuite des améliorations de formulation, de structuration et de tarification pour maximiser vos chances de signature tout en restant rentable.'
          },
          {
            question: 'Puis-je importer mes clients existants ?',
            answer: 'Oui, HAVITAM vous permet d\'importer facilement votre base de clients existante via CSV ou Excel. Notre assistant d\'importation vous guidera à chaque étape pour assurer une transition en douceur vers notre plateforme.'
          }
        ]
      }
    },
    
    // Contact page
    contact: {
      title: 'Contactez-nous',
      subtitle: 'Des questions sur HAVITAM ? Notre équipe est là pour vous aider.',
      form: {
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        phone: 'Téléphone (optionnel)',
        subject: 'Sujet',
        message: 'Message',
        sendButton: 'Envoyer le message',
        selectSubject: 'Sélectionnez un sujet'
      },
      info: {
        title: 'Informations de contact',
        email: 'Email',
        emailValue: 'contact@havitam.com',
        address: 'Adresse',
        addressValue: '123 Avenue des Artisans\n75001 Paris, France',
        hours: 'Horaires',
        hoursValue: 'Lundi - Vendredi : 9h à 18h\nFermé le weekend',
        social: 'Suivez-nous'
      },
      success: {
        title: 'Message envoyé avec succès !',
        message: 'Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.',
        button: 'Envoyer un autre message'
      }
    },
    
    // Login page for French
    login: {
      title: 'Connexion à votre compte',
      subtitle: 'Accédez à votre tableau de bord',
      email: 'Adresse email',
      emailPlaceholder: 'votre@email.com',
      password: 'Mot de passe',
      passwordPlaceholder: 'Votre mot de passe',
      rememberMe: 'Se souvenir de moi',
      forgotPassword: 'Mot de passe oublié ?',
      loginButton: 'Connexion',
      noAccount: 'Pas encore de compte ?',
      register: 'S\'inscrire maintenant',
      welcome: 'Bon retour !',
      welcomeSubtitle: 'Connectez-vous à votre espace artisan pour gérer vos devis et factures',
      security: {
        secureData: 'Données sécurisées',
        gdprCompliant: 'Conforme RGPD',
        frenchHosting: 'Hébergement France'
      },
      socialProof: {
        title: 'Rejoignez des milliers d\'artisans qui développent leur activité',
        stats: [
          {
            value: '10 000+',
            label: 'artisans nous font confiance'
          },
          {
            value: '+40%',
            label: 'de taux de signature'
          },
          {
            value: '5h',
            label: 'économisées par semaine'
          }
        ]
      }
    },
    
    // Registration form
    register: {
      step1: {
        title: 'Créez votre compte',
        subtitle: 'Commencez votre essai gratuit de 14 jours dès aujourd\'hui',
        fullName: 'Nom complet',
        businessName: 'Nom de l\'entreprise',
        profession: 'Profession / Type d\'activité',
        email: 'Adresse email',
        password: 'Mot de passe',
        phone: 'Numéro de téléphone',
        country: 'Pays',
        passwordStrength: 'Force du mot de passe:',
        weak: 'Faible',
        medium: 'Moyen',
        good: 'Bon',
        excellent: 'Excellent'
      }
    },
    
    // Footer enhanced for French
    footer: {
      copyright: '© {year} Havitam. Tous droits réservés.',
      product: 'Produit',
      company: 'Entreprise',
      resources: 'Ressources',
      features: 'Fonctionnalités',
      description: 'La solution tout-en-un pour les artisans qui souhaitent simplifier leur gestion administrative et développer leur clientèle.',
      legal: {
        title: 'Légal',
        terms: 'Conditions d\'utilisation',
        privacy: 'Politique de confidentialité',
        cookies: 'Cookies'
      }
    },
    
    // Pricing page translations for French
    pricing: {
      title: 'Tarifs | HAVITAM - Plateforme pour artisans',
      description: 'Choisissez le plan qui correspond le mieux à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.',
      header: {
        title: 'Tarifs transparents pour votre activité',
        description: 'Choisissez le plan qui correspond le mieux à vos besoins. Tous les plans incluent un essai gratuit de 14 jours.'
      },
      billing: {
        monthly: 'Mensuel',
        annual: 'Annuel',
        period: 'mois'
      },
      popular: 'Plus Populaire',
      price: {
        vat: 'Hors TVA',
        annual: 'Facturé annuellement'
      },
      details: {
        title: 'Informations supplémentaires',
        trial: {
          title: 'Essai gratuit de 14 jours',
          description: 'Toutes les fonctionnalités débloquées pendant la période d\'essai'
        },
        no_commitment: {
          title: 'Sans engagement',
          description: 'Pas d\'engagement de durée ni de frais cachés'
        },
        secure_payment: {
          title: 'Paiement sécurisé',
          description: 'Vos informations de paiement sont traitées en toute sécurité'
        }
      },
      faqs: {
        title: 'Questions fréquentes',
        description: 'Retrouvez les réponses aux questions les plus courantes sur nos offres et fonctionnalités.',
        change_plan: {
          question: 'Puis-je changer de plan à tout moment ?',
          answer: 'Oui, vous pouvez changer de plan à tout moment. La différence sera calculée au prorata pour la période restante de votre abonnement.'
        },
        trial_period: {
          question: 'Comment fonctionne l\'essai gratuit de 14 jours ?',
          answer: 'Notre essai gratuit de 14 jours vous donne accès à toutes les fonctionnalités. Aucune carte bancaire n\'est requise pour démarrer votre essai gratuit.'
        },
        payment_methods: {
          question: 'Quelles sont les méthodes de paiement acceptées ?',
          answer: 'Nous acceptons les paiements par carte bancaire (Visa, Mastercard) et par prélèvement SEPA pour les entreprises européennes.'
        },
        lead_generation: {
          question: 'Comment fonctionne la génération de leads clients ?',
          answer: 'Le plan Pro vous permet de recevoir des demandes de devis de clients potentiels dans votre zone géographique et correspondant à votre secteur d\'activité.'
        }
      },
      cta: {
        title: 'Prêt à simplifier la gestion de votre entreprise ?',
        description: 'Rejoignez des milliers d\'artisans qui font confiance à HAVITAM pour gérer leur activité au quotidien.',
        button: 'Commencer l\'essai gratuit'
      },
      plans: {
        starter: {
          name: 'Starter',
          description: 'Pour les débutants ou une utilisation à petite échelle',
          features: {
            quotes: 'Jusqu\'à 15 devis par mois',
            invoices: 'Jusqu\'à 15 factures par mois',
            clients: 'Gestion des clients',
            templates: 'Modèles professionnels',
            support: 'Support par e-mail'
          },
          limitations: {
            leads: 'Pas de génération de leads clients',
            reminders: 'Pas de rappels automatiques',
            users: 'Pas d\'accès multi-utilisateurs',
            analytics: 'Pas d\'analyses avancées'
          },
          cta: 'Essai gratuit de 14 jours'
        },
        pro: {
          name: 'Pro',
          description: 'Pour les utilisateurs professionnels ou petites entreprises',
          features: {
            quotes: 'Devis et factures illimités',
            clients: 'Gestion des clients',
            templates: 'Modèles professionnels',
            leads: 'Génération de leads clients',
            reminders: 'Rappels automatiques pour les factures impayées',
            users: 'Support multi-utilisateurs',
            support: 'Support prioritaire par e-mail et chat',
            analytics: 'Outils d\'analyse et de rapports avancés'
          },
          cta: 'Essai gratuit de 14 jours'
        }
      }
    },
    
    // About page translations for French
    about: {
      metaDescription: "Découvrez l'histoire et les valeurs d'HAVITAM, la plateforme innovante pour les artisans du bâtiment.",
      hero: {
        title: "Notre mission est de simplifier la vie des artisans",
        description: "HAVITAM est né de la volonté de permettre aux artisans de se concentrer sur leur savoir-faire plutôt que sur les tâches administratives.",
        cta: {
          freeTrial: "Essayer gratuitement",
          contactUs: "Nous contacter"
        }
      },
      story: {
        title: "Notre histoire",
        description1: "HAVITAM a été fondé en 2020 par Pierre Durand, un ancien artisan plombier qui a constaté les difficultés rencontrées par les professionnels du bâtiment dans la gestion administrative de leur entreprise.",
        description2: "Après 15 ans passés sur les chantiers, Pierre a décidé de créer une solution qui permettrait aux artisans de se concentrer sur leur cœur de métier tout en simplifiant la création de devis, la facturation et le suivi des paiements.",
        description3: "Aujourd'hui, HAVITAM est utilisé par plus de 5 000 artisans en France et continue de se développer pour offrir toujours plus de fonctionnalités adaptées aux besoins spécifiques des professionnels du bâtiment.",
        imageAlt: "L'équipe HAVITAM"
      },
      values: {
        title: "Nos valeurs",
        description: "Ces valeurs guident nos décisions et nos actions au quotidien pour offrir le meilleur service possible.",
        passion: {
          title: "Passion",
          description: "Nous sommes passionnés par notre mission d'aider les artisans à réussir et à se concentrer sur leur savoir-faire."
        },
        trust: {
          title: "Confiance",
          description: "Nous construisons des relations de confiance avec nos utilisateurs en offrant des services fiables et transparents."
        },
        excellence: {
          title: "Excellence",
          description: "Nous visons l'excellence dans tout ce que nous faisons, en améliorant constamment nos services pour nos utilisateurs."
        },
        community: {
          title: "Communauté",
          description: "Nous croyons en la force de la communauté et au soutien mutuel entre artisans pour grandir ensemble."
        }
      },
      team: {
        title: "Notre équipe",
        description: "Des professionnels passionnés qui travaillent chaque jour pour améliorer l'expérience de nos utilisateurs.",
        member1: {
          name: "Pierre Durand",
          role: "Fondateur & CEO",
          bio: "Ancien artisan avec 15 ans d'expérience dans le bâtiment, Pierre a créé HAVITAM pour simplifier le quotidien des artisans."
        },
        member2: {
          name: "Marie Lefevre",
          role: "Directrice Produit",
          bio: "Expert en UX/UI, Marie travaille à rendre l'application intuitive et adaptée aux besoins spécifiques des artisans."
        },
        member3: {
          name: "Thomas Bernard",
          role: "CTO",
          bio: "Ingénieur en informatique passionné par les nouvelles technologies, Thomas dirige le développement technique de la plateforme."
        },
        member4: {
          name: "Julie Moreau",
          role: "Responsable Marketing",
          bio: "Avec une solide expérience en marketing digital, Julie aide les artisans à se faire connaître et à développer leur activité."
        }
      },
      stats: {
        artisans: "Artisans actifs",
        devis: "Devis créés",
        chiffreAffaires: "Chiffre d'affaires généré"
      },
      cta: {
        title: "Prêt à rejoindre HAVITAM ?",
        description: "Essayez HAVITAM gratuitement pendant 14 jours et découvrez comment notre plateforme peut vous aider à développer votre activité.",
        ctaButton: "Commencer gratuitement",
        contactButton: "Nous contacter"
      }
    },
    
    // Find Craftsman page translations for French
    findArtisan: {
      metaDescription: "Trouvez un artisan qualifié près de chez vous pour vos projets de rénovation et construction.",
      hero: {
        title: "Trouvez un artisan qualifié",
        description: "Décrivez vos travaux et recevez rapidement des devis d'artisans près de chez vous"
      },
      steps: {
        category: {
          title: "Catégorie de travaux",
          description: "Sélectionnez le type de travaux"
        },
        location: {
          title: "Lieu du chantier",
          description: "Indiquez l'adresse des travaux"
        },
        description: {
          title: "Description du projet",
          description: "Décrivez vos travaux en détail"
        },
        contact: {
          title: "Vos coordonnées",
          description: "Pour que les artisans puissent vous contacter"
        }
      },
      form: {
        title: "Décrivez votre projet",
        category: "Catégorie de travaux",
        selectCategory: "Sélectionnez une catégorie",
        address: "Adresse ou ville du chantier",
        addressPlaceholder: "Ex: 123 Rue de la Paix, Paris",
        description: "Description du projet",
        descriptionPlaceholder: "Décrivez vos travaux en détail : nature, dimensions, matériaux souhaités...",
        completionDate: "Date souhaitée de réalisation",
        datePlaceholder: "Sélectionnez une date",
        contactInfo: "Vos coordonnées",
        fullName: "Nom / Prénom",
        fullNamePlaceholder: "Votre nom complet",
        phone: "Téléphone",
        email: "Email",
        submit: "Envoyer ma demande",
        categoryRequired: "Veuillez sélectionner une catégorie de travaux"
      },
      filters: {
        masonry: "Maçonnerie",
        plumbing: "Plomberie",
        electrical: "Électricité",
        painting: "Peinture",
        carpentry: "Menuiserie",
        tiling: "Carrelage",
        roofing: "Couverture",
        heating: "Chauffage",
        gardening: "Jardinage",
        other: "Autre"
      }
    },
    
    // Blog translations for French
    blog: {
      metaDescription: "Découvrez nos articles sur l'actualité et les bonnes pratiques pour les artisans.",
      comingSoon: {
        title: "Blog en cours de développement",
        description: "Notre blog est en cours de création. Vous y trouverez bientôt des articles sur les meilleures pratiques et conseils pour les artisans.",
        backToHome: "Retour à l'accueil"
      }
    }
  },
  
  // English translations
  en: {
    // Hero title with markup for highlighting
    heroTitle: {
      prefix: 'The all-in-one platform for ',
      highlight: 'craftsmen',
      suffix: ''
    },
    // Error messages
    errors: {
      required: 'required',
      invalidEmail: 'Invalid email',
      invalidPhone: 'Invalid phone number',
      tooShort: 'Too short',
      tooLong: 'Too long',
      passwordMismatch: 'Passwords do not match'
    },
    
    // Subject options for contact form
    subjectOptions: {
      demo: 'Request a demonstration',
      question: 'Product question',
      support: 'Technical support',
      partnership: 'Partnership proposal',
      other: 'Other'
    },
    
    // Common navigation
    nav: {
      home: 'Home',
      pricing: 'Pricing',
      findArtisan: 'Find Craftsman',
      about: 'About',
      contact: 'Contact',
      blog: 'Blog',
      login: 'Login',
      register: 'Sign up',
      freeTrial: 'Free Trial'
    },
    
    // Common UI elements
    ui: {
      tagline: 'Havitam - Your business digital vitamin',
      buttons: {
        createQuote: 'Create a quote in 2 clicks',
        startTrial: 'Start your free trial',
        getClients: 'Get clients near you',
        readMore: 'Read more',
        viewFeatures: 'View all features',
        viewMoreFaqs: 'View more FAQs',
        submit: 'Submit',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        cancel: 'Cancel',
        save: 'Save',
        confirm: 'Confirm',
        back: 'Back'
      },
      benefits: {
        freeTrial: '14 days free trial',
        noCommitment: 'No commitment',
        cancelAnytime: 'Cancel anytime'
      },
      badges: {
        setupTime: 'Setup in 5 min'
      }
    },
    
    // Page titles
    pageTitles: {
      home: 'Home | HAVITAM - Platform for craftsmen',
      contact: 'Contact | HAVITAM - Platform for craftsmen',
      pricing: 'Pricing | HAVITAM - Platform for craftsmen',
      about: 'About | HAVITAM - Platform for craftsmen',
      blog: 'Blog | HAVITAM - Platform for craftsmen',
      login: 'Login | HAVITAM - Platform for craftsmen',
      register: 'Register | HAVITAM - Platform for craftsmen',
      findArtisan: 'Find a Craftsman | HAVITAM - Platform for craftsmen'
    },
    
    // Home page
    home: {
      hero: {
        title: 'The all-in-one platform for craftsmen',
        subtitle: 'Quotes, invoices and payments in one place. Simplify your craft business management.',
        createQuote: 'Create a quote in 2 clicks',
        getClients: 'Get local clients',
        freeTrial: '14-day free trial',
        noCommitment: 'No commitment',
        cancelAnytime: 'Cancel anytime'
      },
      features: {
        title: 'Everything you need to manage your business',
        subtitle: 'A complete solution to simplify administrative management and grow your customer base.',
        quotes: {
          title: 'Create quotes',
          description: 'Create professional quotes in minutes with AI help to optimize your descriptions and prices.'
        },
        invoices: {
          title: 'Send invoices',
          description: 'Transform your quotes into invoices in one click and send them automatically by email to your clients.'
        },
        payments: {
          title: 'Track payments',
          description: 'Track the status of your payments in real-time and receive notifications when a client pays their invoice.'
        },
        reminders: {
          title: 'Automatic reminders',
          description: 'Set up automatic reminders for unpaid invoices and focus on your craft.'
        },
        clients: {
          title: 'Get clients',
          description: 'Join our network of qualified craftsmen and receive quote requests from nearby clients.'
        },
        admin: {
          title: 'Simplify administration',
          description: 'Save time on administrative tasks with our intelligent and automated tools.'
        }
      },
      testimonials: {
        title: 'What our clients say',
        subtitle: 'Thousands of craftsmen have already transformed their business with HAVITAM',
        testimonial1: {
          quote: 'My signatures increased by 45% in 2 months. AI really optimizes my quotes and clients appreciate the clarity of the documents.',
          initials: 'PM',
          name: 'Pierre Martin',
          profession: 'Plumber, Lyon'
        },
        testimonial2: {
          quote: 'No more manual follow-ups! HAVITAM manages everything automatically and my payment rate within deadlines has increased from 60% to 90%.',
          initials: 'SD',
          name: 'Sophie Dubois',
          profession: 'Electrician, Paris'
        },
        testimonial3: {
          quote: 'I gained 3 new clients within the first week of using the HAVITAM professional network. Excellent return on investment.',
          initials: 'TG',
          name: 'Thomas Girard',
          profession: 'Painter, Marseille'
        }
      },
      cta: {
        title: 'Ready to take your business to the next level?',
        subtitle: 'Join thousands of craftsmen who have already simplified their administrative management and grown their customer base with HAVITAM.',
        startTrial: 'Start free trial',
        contactUs: 'Contact us',
        trialNote: '14-day free trial. No credit card required.'
      },
      faq: {
        title: 'Frequently asked questions',
        subtitle: 'Everything you need to know about HAVITAM',
        items: [
          {
            question: 'How does the free trial work?',
            answer: 'Your 14-day free trial starts as soon as you sign up. You will have access to all premium features without restriction. No credit card is required to start the trial and you can cancel at any time.'
          },
          {
            question: 'Are my data secure?',
            answer: 'Absolutely. HAVITAM uses bank-level encryption to protect your data. We are GDPR compliant and never share your data with third parties. You remain the owner of all your information at all times.'
          },
          {
            question: 'How does the AI optimize my quotes?',
            answer: 'Our AI analyzes thousands of accepted quotes to identify success factors. It then suggests improvements to formulation, structuring, and pricing to maximize your chances of signing while remaining profitable.'
          },
          {
            question: 'Can I import my existing clients?',
            answer: 'Yes, HAVITAM allows you to easily import your existing client base via CSV or Excel. Our import assistant will guide you through each step to ensure a smooth transition to our platform.'
          }
        ]
      }
    },
    
    // Contact page
    contact: {
      title: 'Contact us',
      subtitle: 'Questions about HAVITAM? Our team is here to help.',
      form: {
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        phone: 'Phone (optional)',
        subject: 'Subject',
        message: 'Message',
        sendButton: 'Send message',
        selectSubject: 'Select a subject'
      },
      info: {
        title: 'Contact information',
        email: 'Email',
        emailValue: 'contact@havitam.com',
        address: 'Address',
        addressValue: '123 Craftsmen Avenue\n75001 Paris, France',
        hours: 'Hours',
        hoursValue: 'Monday - Friday: 9am to 6pm\nClosed on weekends',
        social: 'Follow us'
      },
      success: {
        title: 'Message sent successfully!',
        message: 'Thank you for contacting us. Our team will get back to you as soon as possible.',
        button: 'Send another message'
      }
    },
    
    // Login page
    login: {
      title: 'Login to your account',
      subtitle: 'Access your craftsman dashboard',
      email: 'Email address',
      emailPlaceholder: 'your@email.com',
      password: 'Password',
      passwordPlaceholder: 'Your password',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      loginButton: 'Login',
      noAccount: 'Don\'t have an account?',
      register: 'Register now',
      welcome: 'Welcome back!',
      welcomeSubtitle: 'Connect to your craftsman space to manage your quotes and invoices',
      security: {
        secureData: 'Secure data',
        gdprCompliant: 'GDPR compliant',
        frenchHosting: 'French hosting'
      },
      socialProof: {
        title: 'Join thousands of craftsmen who develop their business',
        stats: [
          {
            value: '10 000+',
            label: 'artisans trust us'
          },
          {
            value: '+40%',
            label: 'signature rate'
          },
          {
            value: '5h',
            label: 'saved per week'
          }
        ]
      }
    },
    
    // Registration form
    register: {
      step1: {
        title: 'Create your account',
        subtitle: 'Start your 14-day free trial today',
        fullName: 'Full Name',
        businessName: 'Business Name',
        profession: 'Profession / Activity Type',
        email: 'Email address',
        password: 'Password',
        phone: 'Phone Number',
        country: 'Country',
        passwordStrength: 'Password strength:',
        weak: 'Weak',
        medium: 'Medium',
        good: 'Good',
        excellent: 'Excellent'
      }
    },
    
    // Footer enhanced for English
    footer: {
      copyright: '© {year} Havitam. All rights reserved.',
      product: 'Product',
      company: 'Company',
      resources: 'Resources',
      features: 'Features',
      description: 'The all-in-one solution for craftsmen who want to simplify their administrative management and develop their customer base.',
      legal: {
        title: 'Legal',
        terms: 'Terms of service',
        privacy: 'Privacy policy',
        cookies: 'Cookies'
      }
    },
    
    // Pricing page translations for English
    pricing: {
      title: 'Pricing | HAVITAM - Platform for craftsmen',
      description: 'Choose the plan that best suits your needs. All plans include a 14-day free trial.',
      header: {
        title: 'Transparent pricing for your activity',
        description: 'Choose the plan that best suits your needs. All plans include a 14-day free trial.'
      },
      billing: {
        monthly: 'Monthly',
        annual: 'Annual',
        period: 'months'
      },
      popular: 'Most Popular',
      price: {
        vat: 'Excluding VAT',
        annual: 'Billed annually'
      },
      details: {
        title: 'Additional information',
        trial: {
          title: '14-day free trial',
          description: 'All features unlocked during the trial period'
        },
        no_commitment: {
          title: 'No commitment',
          description: 'No duration commitment or hidden fees'
        },
        secure_payment: {
          title: 'Secure payment',
          description: 'Your payment information is processed securely'
        }
      },
      faqs: {
        title: 'Frequently asked questions',
        description: 'Find answers to the most common questions about our offers and features.',
        change_plan: {
          question: 'Can I change plans at any time?',
          answer: 'Yes, you can change plans at any time. The difference will be calculated pro rata for the remaining period of your subscription.'
        },
        trial_period: {
          question: 'How does the 14-day free trial work?',
          answer: 'Our 14-day free trial gives you access to all features. No credit card is required to start your free trial.'
        },
        payment_methods: {
          question: 'What payment methods are accepted?',
          answer: 'We accept credit card payments (Visa, Mastercard) and SEPA direct debit for European businesses.'
        },
        lead_generation: {
          question: 'How does client lead generation work?',
          answer: 'The Pro plan allows you to receive quote requests from potential clients in your geographical area and corresponding to your industry.'
        }
      },
      cta: {
        title: 'Ready to simplify your business management?',
        description: 'Join thousands of craftsmen who trust HAVITAM to manage their daily activities.',
        button: 'Start free trial'
      },
      plans: {
        starter: {
          name: 'Starter',
          description: 'For beginners or small-scale use',
          features: {
            quotes: 'Up to 15 quotes per month',
            invoices: 'Up to 15 invoices per month',
            clients: 'Client management',
            templates: 'Professional templates',
            support: 'Email support'
          },
          limitations: {
            leads: 'No client lead generation',
            reminders: 'No automatic reminders',
            users: 'No multi-user access',
            analytics: 'No advanced analytics'
          },
          cta: '14-day free trial'
        },
        pro: {
          name: 'Pro',
          description: 'For professional users or small businesses',
          features: {
            quotes: 'Unlimited quotes and invoices',
            clients: 'Client management',
            templates: 'Professional templates',
            leads: 'Client lead generation',
            reminders: 'Automatic reminders for unpaid invoices',
            users: 'Multi-user support',
            support: 'Priority email and chat support',
            analytics: 'Advanced analytics tools'
          },
          cta: '14-day free trial'
        }
      }
    },
    
    // About page translations for English
    about: {
      metaDescription: "Discover HAVITAM's story and values, the innovative platform for craftsmen.",
      hero: {
        title: "Our mission is to simplify the lives of craftsmen",
        description: "HAVITAM was born out of a desire to allow craftsmen to focus on their craft rather than administrative tasks.",
        cta: {
          freeTrial: "Try for free",
          contactUs: "Contact us"
        }
      },
      story: {
        title: "Our story",
        description1: "HAVITAM was founded in 2020 by Pierre Durand, an ex-plumber craftsman who noticed the difficulties encountered by craftsmen in administrative management of their business.",
        description2: "After 15 years spent on construction sites, Pierre decided to create a solution that would allow craftsmen to focus on their core craft while simplifying the creation of quotes, invoicing, and payment tracking.",
        description3: "Today, HAVITAM is used by over 5,000 craftsmen in France and continues to develop to offer ever more features tailored to the specific needs of craftsmen.",
        imageAlt: "The HAVITAM team"
      },
      values: {
        title: "Our values",
        description: "These values guide our daily decisions and actions to provide the best possible service.",
        passion: {
          title: "Passion",
          description: "We are passionate about our mission to help craftsmen succeed and focus on their craft."
        },
        trust: {
          title: "Trust",
          description: "We build trust with our users by offering reliable and transparent services."
        },
        excellence: {
          title: "Excellence",
          description: "We strive for excellence in everything we do, constantly improving our services for our users."
        },
        community: {
          title: "Community",
          description: "We believe in the power of community and mutual support among craftsmen to grow together."
        }
      },
      team: {
        title: "Our team",
        description: "Passionate professionals who work every day to improve the experience of our users.",
        member1: {
          name: "Pierre Durand",
          role: "Founder & CEO",
          bio: "Ex-craftsman with 15 years of experience in construction, Pierre created HAVITAM to simplify the daily lives of craftsmen."
        },
        member2: {
          name: "Marie Lefevre",
          role: "Product Director",
          bio: "UX/UI expert, Marie works to make the application intuitive and tailored to the specific needs of craftsmen."
        },
        member3: {
          name: "Thomas Bernard",
          role: "CTO",
          bio: "Passionate about new technologies, Thomas leads the technical development of the platform."
        },
        member4: {
          name: "Julie Moreau",
          role: "Marketing Manager",
          bio: "With a solid experience in digital marketing, Julie helps craftsmen get known and develop their business."
        }
      },
      stats: {
        artisans: "Active craftsmen",
        devis: "Quotes created",
        chiffreAffaires: "Revenue generated"
      },
      cta: {
        title: "Ready to join HAVITAM?",
        description: "Try HAVITAM for free for 14 days and discover how our platform can help you develop your business.",
        ctaButton: "Start for free",
        contactButton: "Contact us"
      }
    },
    
    // Find Craftsman page translations for English
    findArtisan: {
      metaDescription: "Find a qualified craftsman near you for your renovation and construction projects.",
      hero: {
        title: "Find a qualified craftsman",
        description: "Describe your work and quickly receive quotes from craftsmen near you"
      },
      steps: {
        category: {
          title: "Work category",
          description: "Select the type of work"
        },
        location: {
          title: "Worksite location",
          description: "Indicate the work address"
        },
        description: {
          title: "Project description",
          description: "Describe your work in detail"
        },
        contact: {
          title: "Your contact details",
          description: "So that craftsmen can contact you"
        }
      },
      form: {
        title: "Describe your project",
        category: "Work category",
        selectCategory: "Select a category",
        address: "Worksite address or city",
        addressPlaceholder: "Ex: 123 Peace Street, Paris",
        description: "Project description",
        descriptionPlaceholder: "Describe your work in detail: nature, dimensions, desired materials...",
        completionDate: "Desired completion date",
        datePlaceholder: "Select a date",
        contactInfo: "Your contact details",
        fullName: "Last Name / First Name",
        fullNamePlaceholder: "Your full name",
        phone: "Phone",
        email: "Email",
        submit: "Send my request",
        categoryRequired: "Please select a work category"
      },
      filters: {
        masonry: "Masonry",
        plumbing: "Plumbing",
        electrical: "Electrical",
        painting: "Painting",
        carpentry: "Carpentry",
        tiling: "Tiling",
        roofing: "Roofing",
        heating: "Heating",
        gardening: "Gardening",
        other: "Other"
      }
    },
    
    // Blog translations for English
    blog: {
      metaDescription: "Discover our articles on news and best practices for craftsmen.",
      comingSoon: {
        title: "Blog coming soon",
        description: "Our blog is currently under development. Soon you'll find articles about best practices and advice for craftsmen.",
        backToHome: "Back to home"
      }
    }
  },
  
  // Dutch translations
  nl: {
    // Hero title with markup for highlighting
    heroTitle: {
      prefix: 'Het alles-in-één platform voor ',
      highlight: 'vakmensen',
      suffix: ''
    },
    // Error messages
    errors: {
      required: 'vereist',
      invalidEmail: 'Ongeldig e-mailadres',
      invalidPhone: 'Ongeldig telefoonnummer',
      tooShort: 'Te kort',
      tooLong: 'Te lang',
      passwordMismatch: 'Wachtwoorden komen niet overeen'
    },
    
    // Subject options for contact form
    subjectOptions: {
      demo: 'Demonstratie aanvragen',
      question: 'Productvraag',
      support: 'Technische ondersteuning',
      partnership: 'Partnerschapsvoorstel',
      other: 'Anders'
    },
    
    // Common navigation
    nav: {
      home: 'Home',
      pricing: 'Prijzen',
      findArtisan: 'Vind Vakman',
      about: 'Over Ons',
      contact: 'Contact',
      blog: 'Blog',
      login: 'Inloggen',
      register: 'Registreren',
      freeTrial: 'Gratis Proef'
    },
    
    // Common UI elements
    ui: {
      tagline: 'Havitam - Uw zakelijke digitale vitamine',
      buttons: {
        createQuote: 'Maak een offerte in 2 klikken',
        startTrial: 'Start uw gratis proef',
        getClients: 'Krijg klanten in de buurt',
        readMore: 'Meer lezen',
        viewFeatures: 'Bekijk alle functies',
        viewMoreFaqs: 'Bekijk meer vragen',
        submit: 'Versturen',
        search: 'Zoeken',
        filter: 'Filteren',
        sort: 'Sorteren',
        cancel: 'Annuleren',
        save: 'Opslaan',
        confirm: 'Bevestigen',
        back: 'Terug'
      },
      benefits: {
        freeTrial: '14 dagen gratis proef',
        noCommitment: 'Geen verplichtingen',
        cancelAnytime: 'Altijd opzegbaar'
      },
      badges: {
        setupTime: 'Setup in 5 min'
      }
    },
    
    // Page titles
    pageTitles: {
      home: 'Home | HAVITAM - Platform voor vakmensen',
      contact: 'Contact | HAVITAM - Platform voor vakmensen',
      pricing: 'Prijzen | HAVITAM - Platform voor vakmensen',
      about: 'Over Ons | HAVITAM - Platform voor vakmensen',
      blog: 'Blog | HAVITAM - Platform voor vakmensen',
      login: 'Inloggen | HAVITAM - Platform voor vakmensen',
      register: 'Registreren | HAVITAM - Platform voor vakmensen',
      findArtisan: 'Vind een Vakman | HAVITAM - Platform voor vakmensen'
    },
    
    // Home page
    home: {
      hero: {
        title: 'Het alles-in-één platform voor vakmensen',
        subtitle: 'Maak offertes, verstuur facturen, volg betalingen en ontvang leads. Vereenvoudig het beheer van uw ambachtelijk bedrijf met HAVITAM.',
        createQuote: 'Maak een offerte in 2 klikken',
        getClients: 'Krijg lokale klanten',
        freeTrial: '14 dagen gratis proef',
        noCommitment: 'Geen verplichtingen',
        cancelAnytime: 'Altijd opzegbaar'
      },
      features: {
        title: 'Alles wat u nodig heeft om uw bedrijf te beheren',
        subtitle: 'Een complete oplossing om administratief beheer te vereenvoudigen en uw klantenbestand te laten groeien.',
        quotes: {
          title: 'Maak offertes',
          description: 'Maak professionele offertes in enkele minuten met AI-hulp om uw beschrijvingen en prijzen te optimaliseren.'
        },
        invoices: {
          title: 'Verstuur facturen',
          description: 'Zet uw offertes om in facturen met één klik en verstuur ze automatisch per e-mail naar uw klanten.'
        },
        payments: {
          title: 'Volg betalingen',
          description: 'Volg de status van uw betalingen in realtime en ontvang meldingen wanneer een klant zijn factuur betaalt.'
        },
        reminders: {
          title: 'Automatische herinneringen',
          description: 'Stel automatische herinneringen in voor onbetaalde facturen en focus op uw ambacht.'
        },
        clients: {
          title: 'Krijg klanten',
          description: 'Word lid van ons netwerk van gekwalificeerde vakmensen en ontvang offerteverzoeken van klanten in de buurt.'
        },
        admin: {
          title: 'Vereenvoudig administratie',
          description: 'Bespaar tijd op administratieve taken met onze intelligente en geautomatiseerde tools.'
        }
      },
      testimonials: {
        title: 'Wat onze klanten zeggen',
        subtitle: 'Duizenden vakmensen hebben al hun bedrijf vereenvoudigd met HAVITAM',
        testimonial1: {
          quote: 'Mijn handtekeningen zijn met 45% toegenomen in 2 maanden. AI optimaliseert echt mijn offertes en klanten waarderen de duidelijkheid van de documenten.',
          initials: 'PM',
          name: 'Pierre Martin',
          profession: 'Plater, Lyon'
        },
        testimonial2: {
          quote: 'Geen meer handmatige opvolging! HAVITAM beheert alles automatisch en mijn betalingspercentage binnen de termijn is gestegen van 60% naar 90%.',
          initials: 'SD',
          name: 'Sophie Dubois',
          profession: 'Elektricien, Parijs'
        },
        testimonial3: {
          quote: 'Ik heb 3 nieuwe klanten binnen de eerste week van gebruik van het HAVITAM-professioneel netwerk gewonnen. Uitstekende terugverdientijd.',
          initials: 'TG',
          name: 'Thomas Girard',
          profession: 'Schilder, Marseille'
        }
      },
      cta: {
        title: 'Klaar om uw bedrijf te vereenvoudigen?',
        subtitle: 'Word lid van duizenden vakmensen die HAVITAM vertrouwen om hun dagelijkse activiteiten te beheren.',
        startTrial: 'Start gratis proef',
        contactUs: 'Neem contact op',
        trialNote: '14-dagen gratis proef. Geen creditcard vereist.'
      },
      faq: {
        title: 'Veelgestelde vragen',
        subtitle: 'Alles wat u moet weten over HAVITAM',
        items: [
          {
            question: 'Hoe werkt de gratis proefperiode?',
            answer: 'Uw gratis proefperiode van 14 dagen begint direct na uw registratie. U hebt toegang tot alle premium functies zonder beperking. Er is geen creditcard vereist om de proefperiode te starten en u kunt op elk moment annuleren.'
          },
          {
            question: 'Zijn mijn gegevens veilig?',
            answer: 'Absoluut. HAVITAM gebruikt bankniveau-encryptie om uw gegevens te beschermen. We zijn GDPR-conform en delen uw gegevens nooit met derden. U blijft eigenaar van alle uw informatie op elk moment.'
          },
          {
            question: 'Hoe optimaliseert de AI mijn offertes?',
            answer: 'Onze AI analyseert duizenden geaccepteerde offertes om succesfactoren te identificeren. Het suggereert vervolgens verbeteringen in formulering, structuur en prijsoptimalisatie om uw kans op ondertekening te maximaliseren terwijl uw winstgevendheid behouden.'
          },
          {
            question: 'Kan ik mijn bestaande klanten importeren?',
            answer: 'Ja, HAVITAM staat u toe om uw bestaande klantenbasis eenvoudig te importeren via CSV of Excel. Onze importassistent zal u bij elke stap helpen om een soepele overgang naar onze platform te garanderen.'
          }
        ]
      }
    },
    
    // Contact page
    contact: {
      title: 'Contact',
      subtitle: 'Vragen over HAVITAM? Ons team staat klaar om u te helpen.',
      form: {
        firstName: 'Voornaam',
        lastName: 'Achternaam',
        email: 'E-mail',
        phone: 'Telefoon (optioneel)',
        subject: 'Onderwerp',
        message: 'Bericht',
        sendButton: 'Bericht versturen',
        selectSubject: 'Selecteer een onderwerp'
      },
      info: {
        title: 'Contactgegevens',
        email: 'E-mail',
        emailValue: 'contact@havitam.com',
        address: 'Adres',
        addressValue: '123 Vakmanslaan\n75001 Parijs, Frankrijk',
        hours: 'Openingstijden',
        hoursValue: 'Maandag - Vrijdag: 9u tot 18u\nGesloten in het weekend',
        social: 'Volg ons'
      },
      success: {
        title: 'Bericht succesvol verzonden!',
        message: 'Bedankt voor uw bericht. Ons team zal zo spoedig mogelijk contact met u opnemen.',
        button: 'Nog een bericht versturen'
      }
    },
    
    // Login page
    login: {
      title: 'Log in op uw account',
      subtitle: 'Toegang tot uw vakman dashboard',
      email: 'E-mailadres',
      emailPlaceholder: 'uw@email.nl',
      password: 'Wachtwoord',
      passwordPlaceholder: 'Uw wachtwoord',
      rememberMe: 'Onthoud mij',
      forgotPassword: 'Wachtwoord vergeten?',
      loginButton: 'Inloggen',
      noAccount: 'Heeft u geen account?',
      register: 'Nu registreren',
      welcome: 'Welkom terug!',
      welcomeSubtitle: 'Maak verbinding met uw vakman ruimte om uw offertes en facturen te beheren',
      security: {
        secureData: 'Beveiligde gegevens',
        gdprCompliant: 'AVG-conform',
        frenchHosting: 'Franse hosting'
      },
      socialProof: {
        title: 'Word lid van duizenden vakmensen die HAVITAM vertrouwen om hun dagelijkse activiteiten te beheren',
        stats: [
          {
            value: '10 000+',
            label: 'vakmensen vertrouwen ons'
          },
          {
            value: '+40%',
            label: 'handtekeningstijd'
          },
          {
            value: '5h',
            label: 'bespaard per week'
          }
        ]
      }
    },
    
    // Registration form
    register: {
      step1: {
        title: 'Maak uw account aan',
        subtitle: 'Start vandaag uw gratis proefperiode van 14 dagen',
        fullName: 'Volledige naam',
        businessName: 'Bedrijfsnaam',
        profession: 'Beroep / Activiteitstype',
        email: 'E-mailadres',
        password: 'Wachtwoord',
        phone: 'Telefoonnummer',
        country: 'Land',
        passwordStrength: 'Wachtwoordsterkte:',
        weak: 'Zwak',
        medium: 'Gemiddeld',
        good: 'Goed',
        excellent: 'Uitstekend'
      }
    },
    
    // Footer enhanced for Dutch
    footer: {
      copyright: '© {year} Havitam. Alle rechten voorbehouden.',
      product: 'Product',
      company: 'Bedrijf',
      resources: 'Middelen',
      features: 'Functies',
      description: 'Het alles-in-één platform voor vakmensen die hun administratieve beheer vereenvoudigen en hun klantenbestand willen ontwikkelen.',
      legal: {
        title: 'Recht',
        terms: 'Gebruiksvoorwaarden',
        privacy: 'Privacybeleid',
        cookies: 'Cookies'
      }
    },
    
    // Pricing page translations for Dutch
    pricing: {
      title: 'Prijzen | HAVITAM - Platform voor vakmensen',
      description: 'Kies het plan dat het beste bij uw behoeften past. Alle abonnementen bevatten een gratis proefperiode van 14 dagen.',
      header: {
        title: 'Transparante prijzen voor uw activiteit',
        description: 'Kies het plan dat het beste bij uw behoeften past. Alle abonnementen bevatten een gratis proefperiode van 14 dagen.'
      },
      billing: {
        monthly: 'Maandelijks',
        annual: 'Jaarlijks',
        period: 'maanden'
      },
      popular: 'Meest Populair',
      price: {
        vat: 'Excl. BTW',
        annual: 'Jaarlijks gefactureerd'
      },
      details: {
        title: 'Extra informatie',
        trial: {
          title: '14-dagen gratis proef',
          description: 'Alle functies ontgrendeld tijdens de proefperiode'
        },
        no_commitment: {
          title: 'Geen verplichtingen',
          description: 'Geen duurverplichting of verborgen kosten'
        },
        secure_payment: {
          title: 'Veilig betalen',
          description: 'Uw betalingsinformatie wordt veilig verwerkt'
        }
      },
      faqs: {
        title: 'Veelgestelde vragen',
        description: 'Ontdek antwoorden op de meest voorkomende vragen over onze aanbiedingen en functies.',
        change_plan: {
          question: 'Kan ik mijn abonnement op elk moment wijzigen?',
          answer: 'Ja, u kunt uw abonnement op elk moment wijzigen. De verschillen worden pro rata berekend voor de resterende periode van uw abonnement.'
        },
        trial_period: {
          question: 'Hoe werkt de 14-dagen gratis proefperiode?',
          answer: 'Onze 14-dagen gratis proefperiode geeft u toegang tot alle functies. Er is geen creditcard vereist om uw gratis proefperiode te starten.'
        },
        payment_methods: {
          question: 'Welke betaalmethoden worden geaccepteerd?',
          answer: 'We accepteren creditcardbetalingen (Visa, Mastercard) en SEPA-directdebit voor Europese bedrijven.'
        },
        lead_generation: {
          question: 'Hoe werkt de leadgeneratie van klanten?',
          answer: 'Het Pro-abonnement staat u toe om aanvragen voor offerte te ontvangen van potentiële klanten in uw geografische regio en overeenkomstig uw branche.'
        }
      },
      cta: {
        title: 'Klaar om uw bedrijf te vereenvoudigen?',
        description: 'Word lid van duizenden vakmensen die HAVITAM vertrouwen om hun dagelijkse activiteiten te beheren.',
        button: 'Start gratis proef'
      },
      plans: {
        starter: {
          name: 'Starter',
          description: 'Voor beginners of kleine bedrijven',
          features: {
            quotes: 'Tot 15 offertes per maand',
            invoices: 'Tot 15 facturen per maand',
            clients: 'Klantenbeheer',
            templates: 'Professionele templates',
            support: 'E-mailondersteuning'
          },
          limitations: {
            leads: 'Geen leadgeneratie van klanten',
            reminders: 'Geen automatische herinneringen',
            users: 'Geen multi-gebruikers toegang',
            analytics: 'Geen geavanceerde analyses'
          },
          cta: '14-dagen gratis proef'
        },
        pro: {
          name: 'Pro',
          description: 'Voor professionele gebruikers of kleine bedrijven',
          features: {
            quotes: 'Onbeperkte offertes en facturen',
            clients: 'Klantenbeheer',
            templates: 'Professionele templates',
            leads: 'Leadgeneratie van klanten',
            reminders: 'Automatische herinneringen voor onbetaalde facturen',
            users: 'Multi-gebruikers ondersteuning',
            support: 'Prioritaire e-mail- en chatondersteuning',
            analytics: 'Geavanceerde analysehulpmiddelen'
          },
          cta: '14-dagen gratis proef'
        }
      }
    },
    
    // About page translations for Dutch
    about: {
      metaDescription: "Ontdek de geschiedenis en waarden van HAVITAM, de innovatieve platform voor vakmensen.",
      hero: {
        title: "Onze missie is om de leven van vakmensen te vereenvoudigen",
        description: "HAVITAM is geboren uit de wens om vakmensen te laten concentreren op hun vak in plaats van administratieve taken.",
        cta: {
          freeTrial: "Probeer gratis",
          contactUs: "Neem contact op"
        }
      },
      story: {
        title: "Onze geschiedenis",
        description1: "HAVITAM werd in 2020 opgericht door Pierre Durand, een ex-vakman die de problemen waar vakmensen mee worstelden in het administratieve beheer van hun bedrijf opmerkte.",
        description2: "Na 15 jaar doorgebracht op bouwplaatsen, besloot Pierre een oplossing te creëren die vakmensen zou toestaan om zich te concentreren op hun kernvak terwijl ze de creatie van offertes, facturen en betalingsvolging vereenvoudigden.",
        description3: "Vandaag gebruikt HAVITAM meer dan 5.000 vakmensen in Frankrijk en blijft het ontwikkelen om steeds meer functies aan te bieden die aan de specifieke behoeften van vakmensen voldoen.",
        imageAlt: "De HAVITAM-team"
      },
      values: {
        title: "Onze waarden",
        description: "Deze waarden leiden onze dagelijkse beslissingen en handelingen om het beste mogelijke service te bieden.",
        passion: {
          title: "Passie",
          description: "Wij zijn gepassioneerd door onze missie om vakmensen te helpen slagen en zich te concentreren op hun vak."
        },
        trust: {
          title: "Vertrouwen",
          description: "Wij bouwen relaties van vertrouwen met onze gebruikers door betrouwbare en transparante diensten aan te bieden."
        },
        excellence: {
          title: "Uitstekendheid",
          description: "Wij streven naar uitstekendheid in alles wat we doen, door ons service continu te verbeteren voor onze gebruikers."
        },
        community: {
          title: "Gemeenschap",
          description: "Wij geloven in de kracht van de gemeenschap en het ondersteuningsverband tussen vakmensen om samen te groeien."
        }
      },
      team: {
        title: "Ons team",
        description: "Passionate professionals die elke dag werken om de ervaring van onze gebruikers te verbeteren.",
        member1: {
          name: "Pierre Durand",
          role: "Oprichter & CEO",
          bio: "Ex-vakman met 15 jaar ervaring in de bouw, Pierre heeft HAVITAM gecreëerd om de dagelijkse leven van vakmensen te vereenvoudigen."
        },
        member2: {
          name: "Marie Lefevre",
          role: "Productdirecteur",
          bio: "UX/UI-expert, Marie werkt aan het maken van de applicatie intuïtief en aangepast aan de specifieke behoeften van vakmensen."
        },
        member3: {
          name: "Thomas Bernard",
          role: "CTO",
          bio: "Gepassioneerd door nieuwe technologieën, Thomas leidt de technische ontwikkeling van de platform."
        },
        member4: {
          name: "Julie Moreau",
          role: "Marketingmanager",
          bio: "Met een solide ervaring in digitale marketing, Julie helpt vakmensen zich bekend te maken en hun activiteit te ontwikkelen."
        }
      },
      stats: {
        artisans: "Actieve vakmensen",
        devis: "Offertes gemaakt",
        chiffreAffaires: "Omzet gegenereerd"
      },
      cta: {
        title: "Klaar om HAVITAM te vereenvoudigen?",
        description: "Word lid van duizenden vakmensen die HAVITAM vertrouwen om hun dagelijkse activiteiten te beheren.",
        ctaButton: "Start gratis proef",
        contactButton: "Neem contact op"
      }
    },
    
    // Find Craftsman page translations for Dutch
    findArtisan: {
      metaDescription: "Vind een gekwalificeerde vakman bij u in de buurt voor uw renovatie en bouwprojecten.",
      hero: {
        title: "Vind een gekwalificeerde vakman",
        description: "Beschrijf uw werk en ontvang snel offertes van vakmensen bij u in de buurt"
      },
      steps: {
        category: {
          title: "Werkcategorie",
          description: "Selecteer het type werk"
        },
        location: {
          title: "Werkplaatslocatie",
          description: "Geef het werkadres aan"
        },
        description: {
          title: "Projectbeschrijving",
          description: "Beschrijf uw werk in detail"
        },
        contact: {
          title: "Uw contactgegevens",
          description: "Zodat vakmensen u kunnen contacteren"
        }
      },
      form: {
        title: "Beschrijf uw project",
        category: "Werkcategorie",
        selectCategory: "Selecteer een categorie",
        address: "Werkplaatsadres of stad",
        addressPlaceholder: "Bijv: 123 Vredesstraat, Parijs",
        description: "Projectbeschrijving",
        descriptionPlaceholder: "Beschrijf uw werk in detail: aard, afmetingen, gewenste materialen...",
        completionDate: "Gewenste voltooiingsdatum",
        datePlaceholder: "Selecteer een datum",
        contactInfo: "Uw contactgegevens",
        fullName: "Achternaam / Voornaam",
        fullNamePlaceholder: "Uw volledige naam",
        phone: "Telefoon",
        email: "E-mail",
        submit: "Verstuur mijn aanvraag",
        categoryRequired: "Selecteer een werk categorie"
      },
      filters: {
        masonry: "Metselwerk",
        plumbing: "Loodgieterswerk",
        electrical: "Elektriciteit",
        painting: "Schilderen",
        carpentry: "Timmerwerk",
        tiling: "Tegelwerk",
        roofing: "Dakbedekking",
        heating: "Verwarming",
        gardening: "Tuinieren",
        other: "Anders"
      },
      howItWorks: {
        title: "Hoe werkt het?",
        description: "Vind snel een gekwalificeerde vakman in 3 eenvoudige stappen",
        step1: {
          title: "Zoeken",
          description: "Geef uw behoefte en locatie aan om vakmensen bij u in de buurt te vinden."
        },
        step2: {
          title: "Contact",
          description: "Neem direct contact op met vakmensen om uw project te bespreken en een gratis offerte te krijgen."
        },
        step3: {
          title: "Valideren",
          description: "Kies de vakman die bij u past en volg de voortgang van uw project direct op het platform."
        }
      }
    },
    
    // Blog translations for Dutch
    blog: {
      metaDescription: "Ontdek onze artikelen over nieuws en best practices voor vakmensen.",
      comingSoon: {
        title: "Blog in ontwikkeling",
        description: "Onze blog wordt momenteel ontwikkeld. Binnenkort vindt u hier artikelen over best practices en advies voor vakmensen.",
        backToHome: "Terug naar home"
      }
    }
  }
};

// Translation provider component
export const TranslationProvider = ({ children }) => {
  const [language, setLanguage] = useState('fr');
  
  // Load language from localStorage on initial render and ensure French is default
  useEffect(() => {
    // If language is not set in localStorage, set it to French
    if (!localStorage.getItem('language')) {
      localStorage.setItem('language', 'fr');
    }
    
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setLanguage(savedLanguage);
    
    // Set language on the HTML tag for accessibility and CSS
    document.documentElement.setAttribute('lang', savedLanguage);
    
    // Always set the default HTML title in French if not set yet
    if (!document.title || document.title === 'React App') {
      document.title = 'HAVITAM | La plateforme tout-en-un pour artisans';
    }
    
    // Listen for storage events (when localStorage changes in other tabs/components)
    const handleStorageChange = (e) => {
      if (e.key === 'language' && e.newValue !== language) {
        setLanguage(e.newValue || 'fr');
        document.documentElement.setAttribute('lang', e.newValue || 'fr');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);
  
  // Create a value object to provide through context
  const contextValue = {
    language,
    setLanguage,
    t: (key) => {
      // Split the key by dots (e.g., 'home.hero.title')
      const keys = key.split('.');
      
      // Start with the full translations object for the current language
      let result = translations[language];
      
      // Navigate through the nested properties
      for (const k of keys) {
        if (result && result[k] !== undefined) {
          result = result[k];
        } else {
          console.warn(`Translation key not found: ${key}`);
          return key; // Return the key as fallback
        }
      }
      
      return result;
    }
  };
  
  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to access translations
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export default TranslationContext; 