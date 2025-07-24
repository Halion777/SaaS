import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import MainSidebar from '../../../components/ui/MainSidebar';

const RecouvrementPage = () => {
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [context, setContext] = useState('');

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

  const unpaidInvoices = [
    {
      id: 'FACT-2024-0156',
      company: 'Entreprise Martin SARL',
      service: 'Rénovation salle de bain',
      dueDate: '6/15/2024',
      daysOverdue: 45,
      amount: 2850,
      status: 'Moyen'
    },
    {
      id: 'FACT-2024-0162',
      company: 'Constructions Dubois',
      service: 'Installation électrique',
      dueDate: '7/1/2024',
      daysOverdue: 29,
      amount: 1250,
      status: 'Récent'
    },
    {
      id: 'FACT-2024-0143',
      company: 'SPRL Bertrand',
      service: 'Travaux de plomberie',
      dueDate: '5/20/2024',
      daysOverdue: 71,
      amount: 4200,
      status: 'Urgent'
    },
    {
      id: 'FACT-2024-0168',
      company: 'Cabinet Architectes SA',
      service: 'Maintenance chauffage',
      dueDate: '7/10/2024',
      daysOverdue: 20,
      amount: 890,
      status: 'Récent'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Urgent': return 'bg-red-100 text-red-800';
      case 'Moyen': return 'bg-orange-100 text-orange-800';
      case 'Récent': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleInvoiceSelect = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleSubmitCollection = () => {
    if (selectedInvoices.length === 0) {
      alert('Veuillez sélectionner au moins une facture');
      return;
    }
    console.log('Submitting for collection:', selectedInvoices, context);
    alert('Vos factures ont été envoyées pour recouvrement');
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Recouvrement Overview */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
            <Icon name="DollarSign" size={32} color="var(--color-red)" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Recouvrement de Créances</h1>
            <p className="text-lg text-muted-foreground">
              Récupérez vos impayés sans risque avec notre service à la performance
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="TrendingUp" size={24} color="var(--color-green)" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Paiement performance</h3>
            <p className="text-sm text-muted-foreground">Payé que si récupéré</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="Clock" size={24} color="var(--color-blue)" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Rapidité</h3>
            <p className="text-sm text-muted-foreground">Action sous 48h</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="CheckCircle" size={24} color="var(--color-purple)" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Expertise</h3>
            <p className="text-sm text-muted-foreground">Équipe spécialisée</p>
          </div>
        </div>

        {/* How it works */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="FileText" size={20} color="var(--color-primary)" />
            <h2 className="text-xl font-semibold text-foreground">Comment ça fonctionne</h2>
          </div>

          {/* Performance-based Service */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Service à la performance</h3>
                <p className="text-sm text-muted-foreground">
                  Une fois qu'une facture est impayée et sans nouvelles du client, nous procédons au recouvrement. 
                  <strong> Aucun frais sauf si nous récupérons la somme.</strong> Notre rémunération est uniquement basée sur notre réussite.
                </p>
              </div>
            </div>
          </div>

          {/* Process and Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Icon name="CheckCircle" size={20} color="var(--color-green)" />
                <h3 className="font-semibold text-foreground">Notre processus</h3>
              </div>
              <ol className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">1</div>
                  <span className="text-sm text-foreground">Analyse du dossier et vérification</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">2</div>
                  <span className="text-sm text-foreground">Relances amiables professionnelles</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">3</div>
                  <span className="text-sm text-foreground">Négociation et plan de paiement</span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">4</div>
                  <span className="text-sm text-foreground">Procédures juridiques si nécessaire</span>
                </li>
              </ol>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Icon name="FileText" size={20} color="var(--color-primary)" />
                <h3 className="font-semibold text-foreground">Conditions</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">Facture impayée depuis plus de 15 jours</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">Montant minimum 200€</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">Dossier complet et justificatifs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">Commission 15-25% selon complexité</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUnpaidInvoices = () => (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Factures impayées</h1>
        <p className="text-muted-foreground">
          Sélectionnez les factures que vous souhaitez confier à notre service de recouvrement
        </p>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {unpaidInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between">
              {/* Left Side - Selection & Company Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => handleInvoiceSelect(invoice.id)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <h3 className="font-semibold text-foreground">{invoice.company}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Icon name="User" size={14} />
                  <span>{invoice.service}</span>
                </div>
              </div>

              {/* Middle Section - Due Date & Delay */}
              <div className="flex flex-col items-center space-y-1">
                <div className="flex items-center space-x-2 text-sm">
                  <Icon name="Calendar" size={14} />
                  <span>Échéance: {invoice.dueDate}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  <Icon name="Clock" size={14} />
                  <span>{invoice.daysOverdue} jours de retard</span>
                </div>
              </div>

              {/* Right Side - Amount & Invoice ID */}
              <div className="flex flex-col items-end space-y-1">
                <div className="text-xl font-bold text-red-600">
                  {invoice.amount.toLocaleString()}€
                </div>
                <div className="text-xs text-muted-foreground">
                  {invoice.id}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Context and Submit */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Contexte et explications (optionnel)</h2>
        
        <Input
          type="textarea"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Décrivez le contexte de ces impayés, les tentatives de contact effectuées, les raisons invoquées par le client..."
          className="mb-4"
        />

        <Button
          onClick={handleSubmitCollection}
          variant="default"
          className="w-full"
          iconName="Send"
          iconPosition="left"
        >
          Envoyer pour recouvrement
        </Button>

        {/* Information Section */}
        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <div className="flex items-center space-x-2">
            <Icon name="DollarSign" size={16} color="var(--color-muted-foreground)" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Tarification:</span> Commission uniquement en cas de succès (15-25% selon la complexité)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={16} color="var(--color-muted-foreground)" />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Délais:</span> Première action sous 48h, suivi régulier et transparent
            </p>
          </div>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Recouvrement</h1>
              <p className="text-muted-foreground">
                Récupérez vos créances impayées avec efficacité et professionnalisme
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={activeTab === 'overview' ? 'default' : 'outline'}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </Button>
              <Button 
                variant={activeTab === 'invoices' ? 'default' : 'outline'}
                onClick={() => setActiveTab('invoices')}
              >
                Factures impayées
              </Button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'invoices' && renderUnpaidInvoices()}
        </main>
      </div>
    </div>
  );
};

export default RecouvrementPage;
