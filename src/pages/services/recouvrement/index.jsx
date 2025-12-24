import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import FileUpload from '../../../components/ui/FileUpload';
import MainSidebar from '../../../components/ui/MainSidebar';
import GlobalProfile from '../../../components/ui/GlobalProfile';
import PermissionGuard from '../../../components/PermissionGuard';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';

const RecouvrementPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [context, setContext] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
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

  // Fetch overdue invoices from database
  useEffect(() => {
    const fetchOverdueInvoices = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            client_name,
            title,
            due_date,
            total_amount,
            status
          `)
          .eq('user_id', user.id)
          .neq('status', 'paid')
          .lt('due_date', today.toISOString());
        
        if (error) throw error;
        
        const processedInvoices = invoices?.map(invoice => {
          const dueDate = new Date(invoice.due_date);
          const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          
          let urgency;
          if (daysOverdue > 60) {
            urgency = 'urgent';
          } else if (daysOverdue > 30) {
            urgency = 'medium';
          } else {
            urgency = 'recent';
          }
          
          return {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            company: invoice.client_name,
            service: invoice.title,
            dueDate: new Date(invoice.due_date).toLocaleDateString(),
            daysOverdue,
            amount: invoice.total_amount,
            urgency
          };
        }) || [];
        
        processedInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);
        
        setUnpaidInvoices(processedInvoices);
      } catch (error) {
        console.error('Error fetching overdue invoices:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOverdueInvoices();
  }, [user]);

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'recent': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case 'urgent': return t('recovery.urgency.urgent', 'Urgent');
      case 'medium': return t('recovery.urgency.medium', 'Medium');
      case 'recent': return t('recovery.urgency.recent', 'Recent');
      default: return urgency;
    }
  };

  const handleInvoiceSelect = (invoiceId) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleFileUpload = (file) => {
    const newFile = {
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    };
    setUploadedFiles(prev => [...prev, newFile]);
  };

  const handleFileRemove = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmitCollection = async () => {
    if (selectedInvoices.length === 0 && uploadedFiles.length === 0) {
      alert(t('recovery.form.selectInvoiceOrDocumentError', 'Please select at least one invoice or upload a document'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting for collection:', selectedInvoices, context, uploadedFiles);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowSuccess(true);
      setSelectedInvoices([]);
      setContext('');
      setUploadedFiles([]);
      
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting recovery request:', error);
      alert(t('recovery.form.submitError', 'Error submitting recovery request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">85%</div>
          <div className="text-sm font-medium text-foreground">
            {t('recovery.highlights.successRate.title', 'Success Rate')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('recovery.highlights.successRate.description', 'Of invoices recovered')}
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">15</div>
          <div className="text-sm font-medium text-foreground">
            {t('recovery.highlights.fastRecovery.title', 'Days Average')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('recovery.highlights.fastRecovery.description', 'Recovery time')}
          </p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4 sm:p-5">
          <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">100%</div>
          <div className="text-sm font-medium text-foreground">
            {t('recovery.highlights.legalProtection.title', 'Legal Support')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('recovery.highlights.legalProtection.description', 'Full protection')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        {/* Performance-based Service */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-foreground mb-2">
            {t('recovery.howItWorks.performanceBased.title', 'Performance-based service')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('recovery.howItWorks.performanceBased.description', 'Once an invoice is unpaid and you have no news from the client, we proceed with recovery. No fees unless we recover the amount. Our compensation is based solely on our success.')}
          </p>
        </div>

        {/* Process and Conditions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="CheckCircle" size={16} className="text-green-500" />
              {t('recovery.process.title', 'Our Process')}
            </h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-medium">1</span>
                {t('recovery.process.step1', 'Case analysis and verification')}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-medium">2</span>
                {t('recovery.process.step2', 'Professional amicable reminders')}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-medium">3</span>
                {t('recovery.process.step3', 'Negotiation and payment plan')}
              </li>
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 font-medium">4</span>
                {t('recovery.process.step4', 'Legal procedures if necessary')}
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon name="FileText" size={16} className="text-primary" />
              {t('recovery.conditions.title', 'Conditions')}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {t('recovery.conditions.item1', 'Invoice unpaid for more than 15 days')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {t('recovery.conditions.item2', 'Minimum amount €200')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {t('recovery.conditions.item3', 'Complete file and supporting documents')}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
        <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
          {t('recovery.cta.title', 'Entrust us with your unpaid invoices')}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t('recovery.cta.description', 'Our recovery experts support you in recovering your receivables')}
        </p>
        <Button
          onClick={() => setActiveTab('invoices')}
          variant="default"
          iconName="ArrowRight"
          iconPosition="right"
        >
          {t('recovery.cta.button', 'Start Recovery')}
        </Button>
      </div>
    </div>
  );

  const renderUnpaidInvoices = () => (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-800">
              {t('recovery.form.success.title', 'Request Submitted!')}
            </h3>
            <p className="text-sm text-green-700">
              {t('recovery.form.success.message', 'Your invoices have been submitted for recovery. Our team will contact you within 48 hours.')}
            </p>
          </div>
        </div>
      )}

      {/* Invoice List Section */}
      <div className="bg-card border border-border rounded-lg">
        <div className="bg-muted/50 px-4 py-3 border-b border-border rounded-t-lg">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">
            {t('recovery.invoices.title', 'Unpaid Invoices')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('recovery.invoices.subtitle', 'Select the invoices you want to submit for our recovery service')}
          </p>
        </div>
        
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : unpaidInvoices.length === 0 ? (
            <div className="text-center py-8">
              <Icon name="CheckCircle" size={40} className="text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-1">
                {t('recovery.invoices.noInvoices.title', 'No unpaid invoices')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('recovery.invoices.noInvoices.description', 'All your invoices are paid. Great job!')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidInvoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className={`border rounded-lg p-3 sm:p-4 transition-colors cursor-pointer ${
                    selectedInvoices.includes(invoice.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => handleInvoiceSelect(invoice.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleInvoiceSelect(invoice.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{invoice.company}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUrgencyColor(invoice.urgency)}`}>
                            {getUrgencyLabel(invoice.urgency)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {invoice.invoiceNumber} • {invoice.service}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 ml-7 sm:ml-0">
                      <div className="text-xs text-muted-foreground">
                        <span className="text-red-600 font-medium">{invoice.daysOverdue} {t('recovery.invoices.daysOverdue', 'days')}</span>
                      </div>
                      <div className="text-lg font-bold text-red-600">
                        €{invoice.amount?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Context Section */}
      <div className="bg-card border border-border rounded-lg">
        <div className="bg-muted/50 px-4 py-3 border-b border-border rounded-t-lg">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">
            {t('recovery.form.context.title', 'Context and Explanations')}
          </h2>
        </div>
        <div className="p-4">
          <Input
            type="textarea"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder={t('recovery.form.context.placeholder', 'Describe the context of these unpaid invoices, contact attempts made, reasons given by the client...')}
          />
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-card border border-border rounded-lg">
        <div className="bg-muted/50 px-4 py-3 border-b border-border rounded-t-lg">
          <h2 className="text-sm sm:text-base font-semibold text-foreground">
            {t('recovery.form.attachments.title', 'Attachments')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('recovery.form.attachments.subtitle', 'Invoices, contracts, supporting documents')}
          </p>
        </div>
        <div className="p-4">
          <FileUpload
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            maxSize={10 * 1024 * 1024}
            onFileSelect={handleFileUpload}
            label={t('recovery.form.attachments.addLabel', 'Add documents')}
            description={t('recovery.form.attachments.addDescription', 'Drag and drop or click to select files')}
          />

          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mt-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <Icon name="FileText" size={16} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileRemove(file.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Icon name="X" size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Submit Section */}
      <div className="bg-card border border-border rounded-lg p-4">
        <Button
          onClick={handleSubmitCollection}
          variant="default"
          className="w-full"
          iconName={isSubmitting ? "Loader" : "Send"}
          iconPosition="left"
          disabled={isSubmitting || (selectedInvoices.length === 0 && uploadedFiles.length === 0)}
        >
          {isSubmitting 
            ? t('recovery.form.submitting', 'Submitting...') 
            : t('recovery.form.submit', 'Submit for Recovery')
          }
        </Button>

        {selectedInvoices.length === 0 && uploadedFiles.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t('recovery.form.selectInvoiceOrDocumentHint', 'Select at least one invoice or upload a document to continue')}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="Clock" size={12} />
            <span><strong>{t('recovery.form.info.timeline.label', 'Timeline')}:</strong> {t('recovery.form.info.timeline.value', 'First action within 48h')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Icon name="Shield" size={12} />
            <span><strong>{t('recovery.form.info.guarantee.label', 'Guarantee')}:</strong> {t('recovery.form.info.guarantee.value', "No fees if we don't recover")}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PermissionGuard module="recovery" requiredPermission="view_only">
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
                  <Icon name="Banknote" size={20} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-foreground">
                    {t('recovery.title', 'Debt Recovery')}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('recovery.headerSubtitle', 'Recover your unpaid receivables efficiently and professionally')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant={activeTab === 'overview' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('overview')}
                  size="sm"
                >
                  {t('recovery.tabs.overview', 'Overview')}
                </Button>
                <Button 
                  variant={activeTab === 'invoices' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('invoices')}
                  size="sm"
                >
                  {t('recovery.tabs.invoices', 'Unpaid Invoices')}
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'invoices' && renderUnpaidInvoices()}
        </main>
      </div>
    </div>
    </PermissionGuard>
  );
};

export default RecouvrementPage;
