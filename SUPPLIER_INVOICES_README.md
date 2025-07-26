# Gestion des Factures Fournisseurs - Documentation

## Vue d'ensemble

Le système de gestion des factures fournisseurs permet aux artisans et entrepreneurs de :

- **Importer et gérer** leurs factures fournisseurs (bills à payer)
- **Envoyer automatiquement** ces factures à leur comptable en un clic
- **Suivre** les factures impayées comme les factures clients
- **Avoir une vue complète** des entrées/sorties de trésorerie

## Fonctionnalités principales

### 1. Création manuelle de factures fournisseurs
- Saisie manuelle des informations fournisseur
- Formulaire intuitif avec validation
- Génération automatique des numéros de facture
- Catégorisation et méthodes de paiement prédéfinies

### 2. Gestion des factures
- **Statuts** : En attente, Payée, En retard
- **Catégories** : Matériaux, Outillage, Services, Fournitures, Assurance, Transport, Marketing
- **Méthodes de paiement** : Virement bancaire, Chèque, Prélèvement, Espèces, Carte bancaire
- **Filtres avancés** : Recherche, statut, catégorie, période, montant

### 3. Envoi au comptable
- Envoi individuel ou groupé
- Email automatique avec pièces jointes
- Suivi des envois
- Configuration de l'email du comptable

### 4. Suivi et analytics
- **Métriques clés** :
  - Total des dépenses
  - Dépenses payées
  - Montant en attente
  - Factures en retard
  - Temps de paiement moyen
  - Taux de paiement

- **Alertes** :
  - Échéances à venir
  - Factures en retard
  - Optimisations suggérées

### 5. Vue d'ensemble dashboard
- Comparaison revenus vs dépenses
- Flux de trésorerie net
- Marge brute
- Actions rapides

## Structure des fichiers

```
src/
├── pages/
│   ├── supplier-invoices/
│   │   ├── index.jsx                    # Page principale
│   │   └── components/
│   │       ├── SupplierInvoicesSummaryBar.jsx
│   │       ├── SupplierInvoicesFilterToolbar.jsx
│   │       ├── SupplierInvoicesDataTable.jsx
│   │       ├── PaymentAnalyticsSidebar.jsx
│   │       └── QuickSupplierInvoiceUpload.jsx
│   └── dashboard/
│       └── components/
│           └── InvoiceOverviewWidget.jsx # Widget dashboard
├── services/
│   └── supplierInvoicesService.js       # Service métier
└── components/ui/
    └── MainSidebar.jsx                  # Navigation mise à jour
```

## Navigation

### Sidebar
- **Activité** > **Factures fournisseurs** : `/supplier-invoices`
- **Activité** > **Factures clients** : `/invoices-management` (renommé)

### Dashboard
- Widget "Vue d'ensemble des factures" avec métriques combinées
- Actions rapides vers les deux types de factures

## API Service

### Méthodes principales

```javascript
import supplierInvoicesService from '../services/supplierInvoicesService';

// Récupérer toutes les factures
const result = await supplierInvoicesService.getSupplierInvoices(filters);

// Créer une nouvelle facture
const result = await supplierInvoicesService.createSupplierInvoice(data);

// Envoyer au comptable
const result = await supplierInvoicesService.sendToAccountant(invoiceIds, email);

// Marquer comme payée
const result = await supplierInvoicesService.markAsPaid(invoiceId, details);

// Upload de fichier
const result = await supplierInvoicesService.uploadInvoiceFile(file);

// Statistiques
const result = await supplierInvoicesService.getStatistics();

// Export
const result = await supplierInvoicesService.exportInvoices(filters, format);
```

### Structure des données

```javascript
// Facture fournisseur
{
  id: 1,
  number: "FOURN-2024-001",
  supplierName: "Materiaux Pro",
  supplierEmail: "contact@materiaux-pro.fr",
  amount: 850.00,
  status: "pending", // "pending", "paid", "overdue"
  issueDate: "2024-07-01",
  dueDate: "2024-07-31",
  paymentMethod: "Virement bancaire",
  category: "Matériaux",
  invoiceFile: "facture-materiaux-001.pdf"
}

// Statistiques
{
  totalExpenses: 4370.00,
  paidExpenses: 1810.00,
  outstandingAmount: 2560.00,
  expensesGrowth: -8.2,
  overdueCount: 2,
  avgPaymentTime: 12,
  paymentRate: 88,
  upcomingDeadlines: [...]
}
```

## Composants UI

### SupplierInvoicesSummaryBar
Affiche les métriques clés :
- Total dépenses
- Dépenses payées  
- Montant en attente
- Factures en retard

### SupplierInvoicesFilterToolbar
Filtres et actions :
- Recherche textuelle
- Filtres par statut, catégorie, période
- Actions groupées (envoyer au comptable, marquer payé, etc.)

### SupplierInvoicesDataTable
Tableau des factures avec :
- Tri par colonnes
- Sélection multiple
- Actions par ligne (voir, télécharger, envoyer au comptable, marquer payé)

### PaymentAnalyticsSidebar
Analytics en temps réel :
- Métriques de paiement
- Échéances à venir
- Insights et recommandations

### QuickSupplierInvoiceCreation
Modal de création manuelle avec :
- Formulaire de saisie complet
- Validation des champs obligatoires
- Actions rapides pour les valeurs par défaut

## Workflow utilisateur

### 1. Création d'une facture
1. Cliquer sur "Ajouter facture"
2. Remplir le formulaire avec les informations fournisseur
3. Sélectionner la catégorie et méthode de paiement
4. Valider la création

### 2. Envoi au comptable
1. Sélectionner une ou plusieurs factures
2. Cliquer sur "Envoyer au comptable"
3. Confirmation d'envoi automatique

### 3. Suivi des paiements
1. Marquer les factures comme payées
2. Suivre les échéances dans le dashboard
3. Recevoir des alertes pour les retards

## Intégration avec le système existant

### Dashboard
- Widget combiné client/fournisseur
- Métriques de trésorerie nette
- Actions rapides unifiées

### Navigation
- Section "Activité" étendue
- Distinction claire entre factures clients et fournisseurs

### Analytics
- Vue d'ensemble financière complète
- Comparaisons et tendances

## Configuration

### Email comptable
```javascript
// Dans supplierInvoicesService.js
const defaultAccountantEmail = 'comptable@havitam.fr';
```

### Catégories par défaut
```javascript
const categoryOptions = [
  'Matériaux', 'Outillage', 'Services', 'Fournitures', 
  'Assurance', 'Transport', 'Marketing'
];
```

## Évolutions futures

### Fonctionnalités prévues
- **OCR avancé** : Extraction automatique des données
- **Intégration bancaire** : Rapprochement automatique
- **Relances automatiques** : Notifications d'échéances
- **Reporting avancé** : Analyses détaillées par catégorie
- **API comptable** : Intégration directe avec logiciels comptables

### Optimisations
- **Cache intelligent** : Mise en cache des données fréquentes
- **Synchronisation** : Sync en temps réel avec le serveur
- **Performance** : Pagination et lazy loading pour gros volumes

## Support et maintenance

### Logs
```javascript
console.error('Error in supplier invoice operation:', error);
```

### Gestion d'erreurs
- Validation des fichiers uploadés
- Gestion des timeouts réseau
- Messages d'erreur utilisateur-friendly

### Tests
- Tests unitaires des services
- Tests d'intégration des composants
- Tests E2E des workflows complets 