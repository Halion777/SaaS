import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import MainSidebar from '../../../components/ui/MainSidebar';

const RecouvrementPage = () => {
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [context, setContext] = useState('');

  React.useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        // On tablet, sidebar is always collapsed
        setSidebarOffset(80);
      } else {
        // On desktop, check sidebar state
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (!mobile && !tablet) {
        const savedCollapsed = localStorage.getItem('sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
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
    <div className="space-y-6 sm:space-y-8">
      {/* Recouvrement Overview */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 lg:p-8">
        <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="Handshake" size={24} className="sm:w-8 sm:h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Recouvrement</h1>
            <p className="text-sm sm:text-lg text-muted-foreground">Recover your unpaid invoices efficiently.</p>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 p-3 sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="Target" size={20} className="sm:w-6 sm:h-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-foreground">Success Rate 85%</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Of invoices recovered</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="Clock" size={20} className="sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-foreground">Fast Recovery</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Average 15 days</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name="Shield" size={20} className="sm:w-6 sm:h-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-foreground">Legal Protection</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Full legal support</p>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div>
          <div className="flex items-center space-x-2 mb-3 sm:mb-4">
            <Icon name="FileText" size={16} className="sm:w-5 sm:h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Comment ça fonctionne</h2>
          </div>

          {/* Performance-based Service */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <Icon name="Info" size={16} className="sm:w-5 sm:h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">Service à la performance</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Une fois qu'une facture est impayée et sans nouvelles du client, nous procédons au recouvrement. 
                  <strong> Aucun frais sauf si nous récupérons la somme.</strong> Notre rémunération est uniquement basée sur notre réussite.
                </p>
              </div>
            </div>
          </div>

          {/* Process and Conditions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Icon name="CheckCircle" size={16} className="sm:w-5 sm:h-5 text-green-500" />
                <h3 className="font-semibold text-foreground">Notre processus</h3>
              </div>
              <ol className="space-y-2 sm:space-y-3">
                <li className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">1</div>
                  <span className="text-xs sm:text-sm text-foreground">Analyse du dossier et vérification</span>
                </li>
                <li className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">2</div>
                  <span className="text-xs sm:text-sm text-foreground">Relances amiables professionnelles</span>
                </li>
                <li className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">3</div>
                  <span className="text-xs sm:text-sm text-foreground">Négociation et plan de paiement</span>
                </li>
                <li className="flex items-start space-x-2 sm:space-x-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">4</div>
                  <span className="text-xs sm:text-sm text-foreground">Procédures juridiques si nécessaire</span>
                </li>
              </ol>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Icon name="FileText" size={16} className="sm:w-5 sm:h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Conditions</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Icon name="Clock" size={14} className="sm:w-4 sm:h-4 text-red-500" />
                  <span className="text-xs sm:text-sm text-foreground">Facture impayée depuis plus de 15 jours</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="Euro" size={14} className="sm:w-4 sm:h-4 text-green-500" />
                  <span className="text-xs sm:text-sm text-foreground">Montant minimum 200€</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="FileText" size={14} className="sm:w-4 sm:h-4 text-blue-500" />
                  <span className="text-xs sm:text-sm text-foreground">Dossier complet et justificatifs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="Percent" size={14} className="sm:w-4 sm:h-4 text-purple-500" />
                  <span className="text-xs sm:text-sm text-foreground">Commission 15-25% selon complexité</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUnpaidInvoices = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Factures impayées</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Sélectionnez les factures que vous souhaitez confier à notre service de recouvrement
        </p>
      </div>

      {/* Invoice List */}
      <div className="space-y-3 sm:space-y-4">
        {unpaidInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              {/* Left Side - Selection & Company Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.includes(invoice.id)}
                    onChange={() => handleInvoiceSelect(invoice.id)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">{invoice.company}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <Icon name="User" size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>{invoice.service}</span>
                </div>
              </div>

              {/* Middle Section - Due Date & Delay */}
              <div className="flex flex-col items-start sm:items-center space-y-1">
                <div className="flex items-center space-x-2 text-xs sm:text-sm">
                  <Icon name="Calendar" size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>Échéance: {invoice.dueDate}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm text-red-600">
                  <Icon name="Clock" size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span>{invoice.daysOverdue} jours de retard</span>
                </div>
              </div>

              {/* Right Side - Amount & Invoice ID */}
              <div className="flex flex-col items-start sm:items-end space-y-1">
                <div className="text-lg sm:text-xl font-bold text-red-600">
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
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Contexte et explications (optionnel)</h2>
        
        <Input
          type="textarea"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Décrivez le contexte de ces impayés, les tentatives de contact effectuées, les raisons invoquées par le client..."
          className="mb-3 sm:mb-4"
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
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border space-y-2 sm:space-y-3">
          <div className="flex items-center space-x-2">
            <Icon name="DollarSign" size={14} className="sm:w-4 sm:h-4 text-muted-foreground" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium">Tarification:</span> Commission uniquement en cas de succès (15-25% selon la complexité)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="Clock" size={14} className="sm:w-4 sm:h-4 text-muted-foreground" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium">Délais:</span> Première action sous 48h, suivi régulier et transparent
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="Handshake" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Recouvrement</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Récupérez vos créances impayées avec efficacité et professionnalisme
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex items-center gap-2">
                  <Button 
                    variant={activeTab === 'overview' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('overview')}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Aperçu
                  </Button>
                  <Button 
                    variant={activeTab === 'invoices' ? 'default' : 'outline'}
                    onClick={() => setActiveTab('invoices')}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    Factures impayées
                  </Button>
                </div>
                
              </div>
            </div>
          </header>

          {/* Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'invoices' && renderUnpaidInvoices()}
        </main>
      </div>
    </div>
  );
};

export default RecouvrementPage;
