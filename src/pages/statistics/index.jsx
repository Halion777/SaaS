import React, { useState } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';

const StatisticsPage = () => {
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [activeTab, setActiveTab] = useState('overview');

  // Handle sidebar offset for responsive layout
  React.useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed');
    const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    setSidebarOffset(isCollapsed ? 64 : 288);
    
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setSidebarOffset(0);
      } else {
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Devis</h3>
            <Icon name="FileText" size={20} color="var(--color-muted-foreground)" />
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">0</div>
          <p className="text-sm text-muted-foreground">0 en attente</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Devis Signés</h3>
            <Icon name="TrendingUp" size={20} color="var(--color-muted-foreground)" />
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">0</div>
          <p className="text-sm text-muted-foreground">0% de taux de signature</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Chiffre d'Affaires</h3>
            <Icon name="Euro" size={20} color="var(--color-muted-foreground)" />
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">0€</div>
          <p className="text-sm text-muted-foreground">Devis signés uniquement</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Catégorie Top</h3>
          </div>
          <div className="text-2xl font-bold text-foreground mb-1">Aucune</div>
          <p className="text-sm text-muted-foreground">0 devis</p>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-card border border-border rounded-lg p-12">
        <div className="text-center">
          <Icon name="FileText" size={64} color="var(--color-muted-foreground)" className="mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Aucune donnée disponible</h3>
          <p className="text-muted-foreground">
            Créez et signez vos premiers devis pour voir les statistiques apparaître ici.
          </p>
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Response Time Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Clock" size={20} color="var(--color-primary)" />
          <h3 className="font-semibold text-foreground">Temps de réponse</h3>
        </div>
        <div className="text-3xl font-bold text-foreground mb-2">2.3j</div>
        <p className="text-sm text-muted-foreground mb-6">Délai moyen de réponse client</p>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Excellent (&lt;1j)</span>
            <span className="text-sm font-medium text-foreground">25%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Bon (1-2j)</span>
            <span className="text-sm font-medium text-foreground">45%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">À améliorer (&gt;2j)</span>
            <span className="text-sm font-medium text-foreground">30%</span>
          </div>
        </div>
      </div>

      {/* Monthly Evolution Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="TrendingUp" size={20} color="var(--color-primary)" />
          <h3 className="font-semibold text-foreground">Évolution mensuelle</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Devis créés</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">15</span>
              <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">+20%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Taux conversion</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">53%</span>
              <span className="px-2 py-1 bg-gray-800 text-white text-xs rounded-full">+8%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">CA moyen/devis</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">3 063€</span>
              <span className="px-2 py-1 bg-gray-100 text-xs rounded-full">+12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoriesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="Clock" size={20} color="var(--color-primary)" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Performance par catégorie</h2>
          <p className="text-sm text-muted-foreground">
            Analysez vos performances selon les types de prestations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Plomberie */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Plomberie</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">6 devis</span>
              <span className="text-sm text-muted-foreground">4 signés</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">67% conversion</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-lg font-bold text-foreground">12,500€</div>
              <div className="text-sm text-muted-foreground">3,125€ moy.</div>
            </div>
          </div>
        </div>

        {/* Électricité */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Électricité</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">4 devis</span>
              <span className="text-sm text-muted-foreground">2 signés</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">50% conversion</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-lg font-bold text-foreground">6,500€</div>
              <div className="text-sm text-muted-foreground">3,250€ moy.</div>
            </div>
          </div>
        </div>

        {/* Peinture */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Peinture</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">3 devis</span>
              <span className="text-sm text-muted-foreground">1 signés</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">33% conversion</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-lg font-bold text-foreground">3,200€</div>
              <div className="text-sm text-muted-foreground">3,200€ moy.</div>
            </div>
          </div>
        </div>

        {/* Maçonnerie */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-4">Maçonnerie</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">2 devis</span>
              <span className="text-sm text-muted-foreground">1 signés</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">50% conversion</span>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-lg font-bold text-foreground">2,300€</div>
              <div className="text-sm text-muted-foreground">2,300€ moy.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAIInsightsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="TrendingUp" size={20} color="var(--color-primary)" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Insights IA</h2>
          <p className="text-sm text-muted-foreground">
            Recommandations personnalisées pour améliorer vos performances
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Icon name="Target" size={20} color="var(--color-green)" />
            </div>
            <h3 className="font-semibold text-foreground">Excellent taux de conversion</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Votre taux de 53% est supérieur à la moyenne du secteur (35%)
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Icon name="Clock" size={20} color="var(--color-orange)" />
            </div>
            <h3 className="font-semibold text-foreground">Délai de réponse à optimiser</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Réduire le délai de 2.3j à 1.5j pourrait augmenter vos signatures de 15%
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Icon name="TrendingUp" size={20} color="var(--color-blue)" />
            </div>
            <h3 className="font-semibold text-foreground">Spécialisation recommandée</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            La plomberie représente votre meilleur ROI, considérez vous spécialiser
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Icon name="BarChart3" size={24} color="var(--color-primary)" />
              <h1 className="text-2xl font-bold text-foreground">Statistiques</h1>
            </div>
            <p className="text-muted-foreground">
              Analysez vos performances et optimisez votre activité
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveTab('performance')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'performance'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Catégories
            </button>
            <button
              onClick={() => setActiveTab('ai-insights')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'ai-insights'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Insights IA
            </button>
          </div>

          {/* Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'categories' && renderCategoriesTab()}
          {activeTab === 'ai-insights' && renderAIInsightsTab()}
        </main>
      </div>
    </div>
  );
};

export default StatisticsPage; 