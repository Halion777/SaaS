# Peppol Integration - Documentation

## Vue d'ensemble

L'intégration Peppol permet aux utilisateurs de connecter leur système à l'infrastructure Peppol (Pan-European Public Procurement On-Line) pour envoyer et recevoir des factures électroniques de manière sécurisée.

## Fonctionnalités principales

### 1. Configuration Peppol
- **Peppol ID** : Identifiant participant unique (format: scheme:identifier)
- **Nom de l'entreprise** : Nom enregistré de l'entreprise
- **Mode Sandbox** : Mode de test pour valider l'intégration
- **Validation** : Vérification du format des identifiants

### 2. Test de connexion
- Test de connectivité avec le réseau Peppol
- Validation des certificats et endpoints
- Mesure du temps de réponse
- Vérification de l'enregistrement du participant

### 3. Envoi de factures
- Envoi de factures via le réseau Peppol
- Mode sandbox pour les tests
- Mode production pour les envois réels
- Suivi des statuts d'envoi

### 4. Réception de factures
- Réception automatique des factures Peppol
- Traitement et validation des documents
- Intégration avec le système de facturation

## Structure des fichiers

```
src/
├── pages/services/peppol/
│   └── index.jsx                    # Page principale Peppol
├── services/
│   └── peppolService.js             # Service métier Peppol
└── components/ui/
    └── MainSidebar.jsx              # Navigation mise à jour
```

## Configuration

### Peppol ID Format
Le Peppol ID suit le format standard : `scheme:identifier`

**Exemples :**
- `0088:1234567890123` (GLN - Global Location Number)
- `0208:9876543210987` (SIRENE - France)
- `9908:123456789` (DUNS - Dun & Bradstreet)

### Validation
```javascript
// Format validation regex
const peppolIdRegex = /^[0-9]{4}:[0-9]{1,20}$/;
```

## API Service

### Méthodes principales

```javascript
import peppolService from '../services/peppolService';

// Récupérer les paramètres
const result = await peppolService.getPeppolSettings();

// Sauvegarder les paramètres
const result = await peppolService.savePeppolSettings(settings);

// Tester la connexion
const result = await peppolService.testConnection(settings);

// Envoyer une facture
const result = await peppolService.sendInvoice(invoiceData, settings);

// Obtenir les statistiques
const result = await peppolService.getStatistics();
```

### Structure des données

```javascript
// Paramètres Peppol
{
  peppolId: "0088:1234567890123",
  businessName: "Mon Entreprise SARL",
  sandboxMode: true,
  isConfigured: true,
  lastTested: "2024-01-15T10:30:00Z",
  lastUpdated: "2024-01-15T10:30:00Z"
}

// Résultats de test
{
  connectionStatus: "success",
  responseTime: 245,
  lastTested: "2024-01-15T10:30:00Z",
  details: {
    participantFound: true,
    certificateValid: true,
    endpointReachable: true
  }
}
```

## Interface utilisateur

### Onglets de navigation
1. **Configuration** : Paramètres Peppol et test de connexion
2. **Factures envoyées** : Historique des factures envoyées via Peppol
3. **Factures reçues** : Historique des factures reçues via Peppol

### Éléments d'interface

#### Status de connexion
- Indicateur visuel (vert/rouge)
- Mode sandbox activé/désactivé
- Informations détaillées (ID, entreprise, dernière test)

#### Formulaire de configuration
- Champ Peppol ID avec validation
- Champ nom de l'entreprise
- Toggle mode sandbox
- Boutons de test et sauvegarde

#### Informations d'aide
- Explication du réseau Peppol
- Guide pour obtenir un Peppol ID
- Ressources et documentation

## Workflow utilisateur

### 1. Configuration initiale
1. Accéder à la page Peppol (Services > Peppol Network)
2. Aller à l'onglet "Configuration"
3. Saisir le Peppol ID et le nom de l'entreprise
4. Activer le mode sandbox pour les tests
5. Tester la connexion
6. Sauvegarder les paramètres

### 2. Envoi de factures
1. Créer une facture dans le système
2. Sélectionner l'option "Envoyer via Peppol"
3. Vérifier les informations du destinataire
4. Confirmer l'envoi
5. Suivre le statut de livraison

### 3. Réception de factures
1. Les factures sont reçues automatiquement
2. Validation et traitement automatique
3. Intégration dans le système de facturation
4. Notifications de nouvelles factures

## Fournisseurs Peppol Access Point

### France
- **Peppol France** : https://www.peppol.fr
- **Contact** : contact@peppol.fr

### Autres pays
- **Norway** : Digipost (https://www.digipost.no)
- **Denmark** : NemHandel (https://www.nemhandel.dk)
- **Sweden** : Svefaktura (https://www.svefaktura.se)

## Sécurité et conformité

### Certificats
- Certificats X.509 requis
- Validation automatique des certificats
- Renouvellement automatique

### Chiffrement
- Communication TLS 1.2+
- Chiffrement des données en transit
- Signature électronique des documents

### Conformité
- Respect des standards Peppol
- Conformité eIDAS
- Audit trail complet

## Gestion des erreurs

### Erreurs courantes
1. **Peppol ID invalide** : Format incorrect
2. **Connexion échouée** : Problème réseau ou certificat
3. **Participant non trouvé** : ID non enregistré
4. **Certificat expiré** : Renouvellement requis

### Messages d'erreur
```javascript
// Exemples de messages
"Format de Peppol ID invalide. Utilisez le format: scheme:identifier"
"Peppol ID non configuré. Veuillez configurer votre intégration Peppol."
"Erreur lors du test de connexion Peppol"
```

## Statistiques et monitoring

### Métriques clés
- Nombre de factures envoyées/reçues
- Taux de succès
- Temps de réponse moyen
- Activité mensuelle

### Alertes
- Échec de connexion
- Certificat expirant
- Factures non livrées
- Problèmes de performance

## Support et documentation

### Ressources officielles
- **Site officiel** : https://peppol.eu/
- **Documentation** : https://docs.peppol.eu/
- **Support France** : support@peppol.fr

### Documentation technique
- **Guide de démarrage** : https://docs.peppol.eu/guides/
- **Format des identifiants** : https://docs.peppol.eu/identifiers/
- **API Reference** : https://docs.peppol.eu/api/

## Évolutions futures

### Fonctionnalités prévues
- **Intégration automatique** : Synchronisation avec les systèmes comptables
- **Validation avancée** : Vérification automatique des données
- **Reporting avancé** : Analyses détaillées et exports
- **API REST** : Interface programmatique complète

### Optimisations
- **Cache intelligent** : Mise en cache des données fréquentes
- **Compression** : Optimisation de la bande passante
- **Batch processing** : Traitement par lots des factures
- **Monitoring temps réel** : Dashboard de monitoring

## Tests et validation

### Tests unitaires
- Validation des formats Peppol ID
- Tests des services de connexion
- Validation des données de facturation

### Tests d'intégration
- Tests de connexion avec le réseau Peppol
- Validation des échanges de documents
- Tests de performance

### Tests de charge
- Simulation d'envoi massif de factures
- Tests de résistance aux pannes
- Validation des timeouts et retry

## Maintenance

### Sauvegarde
- Sauvegarde automatique des paramètres
- Historique des modifications
- Restauration en cas de problème

### Monitoring
- Surveillance continue de la connectivité
- Alertes automatiques en cas de problème
- Logs détaillés pour le debugging

### Mises à jour
- Mises à jour automatiques des certificats
- Compatibilité avec les nouvelles versions Peppol
- Migration transparente des données 