import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import MainSidebar from '../../../components/ui/MainSidebar';
import GlobalProfile from '../../../components/ui/GlobalProfile';
import PermissionGuard from '../../../components/PermissionGuard';
import CreditInsuranceService from '../../../services/creditInsuranceService';

const AssuranceCreditPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
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
        setSidebarOffset(80);
      } else {
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
        setSidebarOffset(80);
      } else {
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

  const sectorOptions = [
    { value: 'construction', label: t('creditInsurance.sectors.construction', 'Construction') },
    { value: 'manufacturing', label: t('creditInsurance.sectors.manufacturing', 'Manufacturing') },
    { value: 'retail', label: t('creditInsurance.sectors.retail', 'Retail') },
    { value: 'services', label: t('creditInsurance.sectors.services', 'Services') },
    { value: 'technology', label: t('creditInsurance.sectors.technology', 'Technology') },
    { value: 'healthcare', label: t('creditInsurance.sectors.healthcare', 'Healthcare') },
    { value: 'finance', label: t('creditInsurance.sectors.finance', 'Finance') },
    { value: 'other', label: t('creditInsurance.sectors.other', 'Other') }
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await CreditInsuranceService.createApplication(formData, i18n.language);
      
      if (result.success) {
        setShowSuccess(true);
        setFormData({
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
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        alert(`${t('common.error')}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t('creditInsurance.form.errorSubmitting', 'Error submitting application'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">90%</div>
          <div className="text-sm font-medium text-foreground">
            {t('creditInsurance.highlights.coverage.title', 'Coverage')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('creditInsurance.highlights.coverage.description', 'Of unpaid amount')}
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">B2B</div>
          <div className="text-sm font-medium text-foreground">
            {t('creditInsurance.highlights.b2b.title', 'Clients')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('creditInsurance.highlights.b2b.description', 'Business only')}
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">48h</div>
          <div className="text-sm font-medium text-foreground">
            {t('creditInsurance.highlights.claims.title', 'Fast Claims')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('creditInsurance.highlights.claims.description', 'Processing time')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        {/* Risk Protection */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-2">
            {t('creditInsurance.serviceDescription.riskProtection.title', 'Risk Protection')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('creditInsurance.serviceDescription.riskProtection.description', 'This insurance covers up to 90% of the unpaid amount in case of bankruptcy or prolonged non-payment by a B2B customer. It allows you to maintain your cash flow and continue your business peacefully, even if an important customer defaults.')}
          </p>
        </div>

        {/* Benefits and Conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-500" />
              {t('creditInsurance.benefits.title', 'Benefits')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {t('creditInsurance.benefits.item1', 'Coverage up to 90% of receivables')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {t('creditInsurance.benefits.item2', 'Protection against client bankruptcy')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {t('creditInsurance.benefits.item3', 'Legal support included')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {t('creditInsurance.benefits.item4', 'Quick response in case of claims')}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="FileText" size={16} className="text-primary" />
              {t('creditInsurance.conditions.title', 'Conditions')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {t('creditInsurance.conditions.item1', 'B2B clients only (businesses)')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {t('creditInsurance.conditions.item2', 'Invoices over €500')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {t('creditInsurance.conditions.item3', 'Maximum 90 days payment terms')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {t('creditInsurance.conditions.item4', 'Report within 30 days maximum')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
          {t('creditInsurance.cta.title', 'Request a personalized quote')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('creditInsurance.cta.description', 'Get a credit insurance proposal tailored to your business')}
        </p>
        <Button
          onClick={() => setActiveTab('application')}
          variant="default"
          iconName="ArrowRight"
          iconPosition="right"
        >
          {t('creditInsurance.cta.button', 'Request my quote')}
        </Button>
      </div>
    </div>
  );

  const renderApplicationForm = () => (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">
              {t('creditInsurance.form.success.title', 'Application Submitted!')}
            </h3>
            <p className="text-sm text-green-700">
              {t('creditInsurance.form.success.message', 'Your application has been successfully submitted. You will receive a confirmation email shortly.')}
            </p>
          </div>
        </div>
      )}

      {/* Application Form */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Contact Information Section */}
          <div className="border border-border rounded-lg">
            <div className="bg-muted/50 px-4 py-3 border-b border-border rounded-t-lg">
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                {t('creditInsurance.form.sections.companyInfo.title', 'Company Contact Information')}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  label={t('creditInsurance.form.fields.companyName', 'Company Name')}
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  placeholder={t('creditInsurance.form.placeholders.companyName', 'e.g. Artisan Dupont SARL')}
                  required
                />
                
                <Input
                  label={t('creditInsurance.form.fields.contactPerson', 'Contact Person')}
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => handleChange('contactPerson', e.target.value)}
                  placeholder={t('creditInsurance.form.placeholders.contactPerson', 'e.g. John Doe')}
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Input
                  label={t('creditInsurance.form.fields.email', 'Email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('creditInsurance.form.placeholders.email', 'contact@company.com')}
                  required
                />
                
                <Input
                  label={t('creditInsurance.form.fields.telephone', 'Phone')}
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder={t('creditInsurance.form.placeholders.telephone', '+32 123 456 789')}
                  required
                />
              </div>

              <Input
                label={t('creditInsurance.form.fields.address', 'Full Address')}
                type="textarea"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder={t('creditInsurance.form.placeholders.address', '123 Main Street, 1000 Brussels')}
                required
              />
            </div>
          </div>

          {/* Industry Section */}
          <div className="border border-border rounded-lg">
            <div className="bg-muted/50 px-4 py-3 border-b border-border rounded-t-lg">
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                {t('creditInsurance.form.sections.industry.title', 'Business Sector')}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <Select
                label={t('creditInsurance.form.fields.sector', 'Main Sector')}
                options={sectorOptions}
                value={formData.sector}
                onChange={(e) => handleChange('sector', e.target.value)}
                placeholder={t('creditInsurance.form.placeholders.sector', 'Select your sector')}
                required
              />
              
              <Input
                label={t('creditInsurance.form.fields.activityDescription', 'Activity Description')}
                type="textarea"
                value={formData.activityDescription}
                onChange={(e) => handleChange('activityDescription', e.target.value)}
                placeholder={t('creditInsurance.form.placeholders.activityDescription', 'Describe your main activity, services, area of operation...')}
                required
              />
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="border border-border rounded-lg">
            <div className="bg-muted/50 px-4 py-3 border-b border-border rounded-t-lg">
              <h2 className="text-sm sm:text-base font-semibold text-foreground">
                {t('creditInsurance.form.sections.financial.title', 'Financial Information')}
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <Input
                label={t('creditInsurance.form.fields.annualTurnover', 'Annual Turnover')}
                type="text"
                value={formData.annualTurnover}
                onChange={(e) => handleChange('annualTurnover', e.target.value)}
                placeholder="150000"
                required
                prefix="€"
              />
              
              <Input
                label={t('creditInsurance.form.fields.topCustomers', 'Main B2B Customers')}
                type="textarea"
                value={formData.topCustomers}
                onChange={(e) => handleChange('topCustomers', e.target.value)}
                placeholder={t('creditInsurance.form.placeholders.topCustomers', 'List your main business customers (name, sector, average invoice amount...)')}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="default"
            className="w-full"
            iconName={isSubmitting ? "Loader" : "Send"}
            iconPosition="left"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? t('creditInsurance.form.submitting', 'Submitting...') 
              : t('creditInsurance.form.submit', 'Submit Application')
            }
          </Button>
        </form>

        {/* Security Message */}
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-border">
          <Icon name="Shield" size={14} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {t('creditInsurance.form.securityMessage', 'Your data is secure and used only for processing your application.')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <PermissionGuard module="creditInsurance" requiredPermission="view_only">
    <div className="min-h-screen bg-background">
      <MainSidebar />
      <GlobalProfile />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-6 -mx-4 sm:-mx-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Icon name="Shield" size={20} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">
                    {t('creditInsurance.title', 'Credit Insurance')}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('creditInsurance.subtitle', 'Protect your cash flow against customer non-payment')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeTab === 'overview' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('overview')}
                  size="sm"
                >
                  {t('creditInsurance.tabs.overview', 'Overview')}
                </Button>
                <Button 
                  variant={activeTab === 'application' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('application')}
                  size="sm"
                >
                  {t('creditInsurance.tabs.application', 'Application')}
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'application' && renderApplicationForm()}
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default AssuranceCreditPage;
