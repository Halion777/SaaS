import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import MainSidebar from '../../../components/ui/MainSidebar';

const AssuranceCreditPage = () => {
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    telephone: '',
    address: '',
    sector: '',
    activityDescription: '',
    annualTurnover: '150000',
    topCustomers: ''
  });

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

  const sectorOptions = [
    { value: 'construction', label: 'Construction' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'services', label: 'Services' },
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert('Your request has been sent successfully!');
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Credit Insurance Overview */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon name="Shield" size={32} color="var(--color-blue)" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Credit Insurance</h1>
            <p className="text-lg text-muted-foreground">Protect your cash flow against unpaid customers.</p>
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="Shield" size={24} color="var(--color-green)" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Coverage 90%</h3>
            <p className="text-sm text-muted-foreground">Of the unpaid amount</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="Building2" size={24} color="var(--color-blue)" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Clients B2B</h3>
            <p className="text-sm text-muted-foreground">Businesses Only</p>
          </div>
          
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Icon name="CheckCircle" size={24} color="var(--color-purple)" />
            </div>
            <h3 className="font-bold text-lg text-foreground">Protection totale</h3>
            <p className="text-sm text-muted-foreground">Bankruptcy & unpaid debts</p>
          </div>
        </div>

        {/* Service Description */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="FileText" size={20} color="var(--color-primary)" />
            <h2 className="text-xl font-semibold text-foreground">Service Description</h2>
          </div>

          {/* Risk Protection */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Icon name="AlertTriangle" size={14} color="var(--color-orange)" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Risk protection</h3>
                <p className="text-sm text-muted-foreground">
                  This insurance covers up to 90% of the outstanding amount in the event of bankruptcy or prolonged non-payment of a B2B customer. It allows you to maintain your cash flow and continue your activity serenely, even in the event of the failure of an important customer.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits and Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Icon name="CheckCircle" size={20} color="var(--color-green)" />
                <h3 className="font-semibold text-foreground">Benefits</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} color="var(--color-green)" />
                  <span className="text-sm text-foreground">Coverage of up to 90% of receivables</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} color="var(--color-green)" />
                  <span className="text-sm text-foreground">Customer Bankruptcy Protection</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} color="var(--color-green)" />
                  <span className="text-sm text-foreground">Legal support included</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="CheckCircle" size={16} color="var(--color-green)" />
                  <span className="text-sm text-foreground">Responsiveness in the event of a disaster</span>
                </li>
              </ul>
            </div>

            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Icon name="FileText" size={20} color="var(--color-primary)" />
                <h3 className="font-semibold text-foreground">Conditions</h3>
              </div>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">B2B customers only (companies)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">Invoices over €500</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">Maximum payment term 90 days</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  <span className="text-sm text-foreground">Declaration within 30 days maximum</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApplicationForm = () => (
    <div className="space-y-8">
      {/* Application Form */}
      <div className="bg-card border border-border rounded-lg p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Applying for credit insurance</h1>
          <p className="text-muted-foreground">Fill out this form to receive a personalized proposal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Contact Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Company contact information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="Ex: Artisan Dupont SARL"
                required
              />
              
              <Input
                label="Contact person *"
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="Ex: Jean Dupont"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email *"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@entreprise.com"
                required
              />
              
              <Input
                label="Telephone *"
                type="tel"
                value={formData.telephone}
                onChange={(e) => handleChange('telephone', e.target.value)}
                placeholder="06 12 34 56 78"
                required
              />
            </div>

            <Input
              label="Full address *"
              type="textarea"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Rue de l'Artisan, 1000 Bruxelles"
              required
            />
          </div>

          {/* Industry */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Industry</h2>
            
            <Select
              label="Main sector *"
              options={sectorOptions}
              value={formData.sector}
              onChange={(e) => handleChange('sector', e.target.value)}
              placeholder="Select your sector"
              required
            />
            
            <Input
              label="Description of the activity *"
              type="textarea"
              value={formData.activityDescription}
              onChange={(e) => handleChange('activityDescription', e.target.value)}
              placeholder="Décrivez votre activité principale, vos services, votre zone d'intervention..."
              required
            />
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Financial Information</h2>
            
            <div className="relative">
              <Input
                label="Annual turnover *"
                type="text"
                value={formData.annualTurnover}
                onChange={(e) => handleChange('annualTurnover', e.target.value)}
                placeholder="150000"
                required
                prefix="€"
              />
            </div>
            
            <Input
              label="Top B2B Customers *"
              type="textarea"
              value={formData.topCustomers}
              onChange={(e) => handleChange('topCustomers', e.target.value)}
              placeholder="Listez vos principaux clients entreprises (nom, secteur, montant moyen des factures...)"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="default"
            className="w-full"
            iconName="Send"
            iconPosition="left"
          >
            Send my request
          </Button>
        </form>

        {/* Security Message */}
        <div className="flex items-center space-x-2 mt-6 pt-6 border-t border-border">
          <Icon name="Shield" size={16} color="var(--color-muted-foreground)" />
          <p className="text-sm text-muted-foreground">
            Your data is secure and used only for the study of your file.
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Assurance Crédit</h1>
              <p className="text-muted-foreground">
                Protégez votre trésorerie contre les impayés clients
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
                variant={activeTab === 'application' ? 'default' : 'outline'}
                onClick={() => setActiveTab('application')}
              >
                Application
              </Button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'application' && renderApplicationForm()}
        </main>
      </div>
    </div>
  );
};

export default AssuranceCreditPage;
