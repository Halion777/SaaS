# Dashboard Personalization - Documentation

## Vue d'ensemble

Le système de personnalisation du tableau de bord permet aux utilisateurs de personnaliser leur expérience en choisissant quels widgets afficher ou masquer selon leurs besoins et préférences.

## Fonctionnalités principales

### 1. Personnalisation des widgets
- **Activation/Désactivation** : Chaque widget peut être activé ou désactivé
- **Sauvegarde automatique** : Les préférences sont sauvegardées dans le localStorage
- **Réinitialisation** : Possibilité de revenir aux paramètres par défaut
- **Interface intuitive** : Modal avec checkboxes organisées par catégories

### 2. Widgets disponibles
- **Métriques principales** : KPIs principaux (CA, devis, clients)
- **Vue d'ensemble des factures** : Résumé factures clients et fournisseurs
- **Devis récents** : Liste des derniers devis créés
- **Meilleurs clients** : Top 5 des clients par chiffre d'affaires
- **Liste des tâches** : Tâches en cours et à venir
- **Actions rapides** : Accès rapide aux fonctionnalités principales
- **Performance IA** : Métriques et insights de l'intelligence artificielle
- **Réseau Peppol** : Statut et métriques de l'intégration Peppol
- **Bannière sponsorisée** : Promotions et offres spéciales
- **Alertes IA** : Notifications intelligentes et recommandations

## Structure des fichiers

```
src/
├── pages/dashboard/
│   ├── index.jsx                           # Dashboard principal
│   └── components/
│       ├── PeppolWidget.jsx                # Widget Peppol
│       └── DashboardPersonalization.jsx    # Modal de personnalisation
```

## Interface utilisateur

### Bouton de personnalisation
- **Emplacement** : Header du dashboard, à côté des autres boutons d'action
- **Icône** : Settings
- **Action** : Ouvre la modal de personnalisation

### Modal de personnalisation
- **Titre** : "Personnalisation du tableau de bord"
- **Description** : "Choisissez les widgets que vous souhaitez afficher"
- **Organisation** : Widgets groupés par catégories
- **Actions** : Sauvegarder, Annuler, Réinitialiser

### Catégories de widgets

#### Analytics
- **Métriques principales** : KPIs essentiels pour le suivi de l'activité

#### Finance
- **Vue d'ensemble des factures** : Résumé financier complet

#### Sales
- **Devis récents** : Suivi des opportunités commerciales

#### Clients
- **Meilleurs clients** : Focus sur la clientèle importante

#### Productivity
- **Liste des tâches** : Gestion des priorités

#### Navigation
- **Actions rapides** : Accès direct aux fonctionnalités

#### AI
- **Performance IA** : Insights et recommandations intelligentes
- **Alertes IA** : Notifications automatisées

#### Integration
- **Réseau Peppol** : Statut de l'intégration Peppol

#### Marketing
- **Bannière sponsorisée** : Promotions et offres

## Structure des données

### Widget Settings
```javascript
{
  metricsCards: true,        // Métriques principales
  invoiceOverview: true,     // Vue d'ensemble des factures
  recentQuotes: true,        // Devis récents
  topClients: true,          // Meilleurs clients
  taskList: true,            // Liste des tâches
  quickActions: true,        // Actions rapides
  aiPerformance: true,       // Performance IA
  peppolWidget: true,        // Widget Peppol
  sponsoredBanner: true,     // Bannière sponsorisée
  aiAlerts: true            // Alertes IA
}
```

### Widget Definition
```javascript
{
  key: 'peppolWidget',
  title: 'Réseau Peppol',
  description: 'Statut et métriques de l\'intégration Peppol',
  icon: 'Network',
  category: 'Integration'
}
```

## Workflow utilisateur

### 1. Accès à la personnalisation
1. Se connecter au dashboard
2. Cliquer sur le bouton "Personnaliser" dans le header
3. La modal de personnalisation s'ouvre

### 2. Configuration des widgets
1. **Parcourir les catégories** : Analytics, Finance, Sales, etc.
2. **Cocher/Décocher** : Utiliser les checkboxes pour activer/désactiver
3. **Voir le compteur** : Nombre de widgets activés affiché en bas
4. **Réinitialiser** : Option pour revenir aux paramètres par défaut

### 3. Sauvegarde
1. **Sauvegarder** : Cliquer sur "Sauvegarder" pour appliquer les changements
2. **Annuler** : Fermer sans sauvegarder pour annuler les modifications
3. **Application immédiate** : Les changements sont visibles immédiatement

## Implémentation technique

### État du dashboard
```javascript
const [widgetSettings, setWidgetSettings] = useState({
  metricsCards: true,
  invoiceOverview: true,
  // ... autres widgets
});
const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
```

### Chargement des paramètres
```javascript
useEffect(() => {
  const loadWidgetSettings = () => {
    try {
      const savedSettings = localStorage.getItem('dashboard-widget-settings');
      if (savedSettings) {
        setWidgetSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading widget settings:', error);
    }
  };
  loadWidgetSettings();
}, []);
```

### Rendu conditionnel des widgets
```javascript
{widgetSettings.metricsCards && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {metricsData.map((metric, index) => (
      <MetricsCard key={index} {...metric} />
    ))}
  </div>
)}
```

### Sauvegarde des paramètres
```javascript
const handleWidgetSettingsSave = (newSettings) => {
  setWidgetSettings(newSettings);
  localStorage.setItem('dashboard-widget-settings', JSON.stringify(newSettings));
};
```

## Widget Peppol

### Fonctionnalités
- **Statut de connexion** : Indicateur visuel (connecté/non connecté)
- **Mode sandbox** : Avertissement si en mode test
- **Métriques** : Nombre de factures envoyées/reçues
- **Taux de succès** : Pourcentage de succès des envois
- **Dernière activité** : Date de la dernière activité
- **Actions rapides** : Boutons pour envoyer facture et voir reçues

### États d'affichage
1. **Non configuré** : Message d'encouragement à configurer
2. **Configuré** : Affichage des métriques et statut
3. **Chargement** : Animation de chargement

### Intégration avec le service
```javascript
const loadPeppolData = async () => {
  const settingsResult = await peppolService.getPeppolSettings();
  const statsResult = await peppolService.getStatistics();
  // ... traitement des données
};
```

## Avantages de la personnalisation

### Pour l'utilisateur
- **Interface adaptée** : Dashboard personnalisé selon les besoins
- **Productivité** : Focus sur les informations importantes
- **Flexibilité** : Possibilité de changer selon l'évolution des besoins
- **Expérience utilisateur** : Interface moins encombrée

### Pour l'application
- **Scalabilité** : Facile d'ajouter de nouveaux widgets
- **Maintenance** : Code modulaire et organisé
- **Performance** : Chargement conditionnel des composants
- **Évolutivité** : Base pour des fonctionnalités avancées

## Évolutions futures

### Fonctionnalités prévues
- **Drag & Drop** : Réorganisation des widgets par glisser-déposer
- **Tailles personnalisables** : Widgets redimensionnables
- **Thèmes** : Personnalisation des couleurs et styles
- **Widgets personnalisés** : Création de widgets par l'utilisateur
- **Préférences par rôle** : Paramètres différents selon le rôle utilisateur

### Optimisations
- **Cache intelligent** : Mise en cache des préférences
- **Synchronisation** : Partage des préférences entre appareils
- **Analytics** : Suivi de l'utilisation des widgets
- **Recommandations** : Suggestions de widgets basées sur l'usage

## Tests et validation

### Tests unitaires
- Validation du chargement des paramètres
- Tests de sauvegarde des préférences
- Validation du rendu conditionnel

### Tests d'intégration
- Test de l'interface de personnalisation
- Validation de la persistance des données
- Test de la réinitialisation

### Tests utilisateur
- Facilité d'utilisation de l'interface
- Compréhension des catégories
- Satisfaction de l'expérience personnalisée

## Maintenance

### Sauvegarde
- Sauvegarde automatique dans localStorage
- Pas de perte de données en cas de fermeture
- Restauration automatique au rechargement

### Monitoring
- Suivi de l'utilisation des widgets
- Analytics sur les préférences utilisateur
- Détection des problèmes de performance

### Mises à jour
- Ajout de nouveaux widgets transparent
- Migration automatique des paramètres
- Compatibilité avec les anciennes versions 