import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '../../../../services/supabaseClient';
import Icon from '../../../../components/AppIcon';
import Button from '../../../../components/ui/Button';
import SuperAdminSidebar from '../../../../components/ui/SuperAdminSidebar';

const Peppol = () => {
  const [configuringWebhook, setConfiguringWebhook] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [configuredWebhooks, setConfiguredWebhooks] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showWebhookTypes, setShowWebhookTypes] = useState(false);
  
  // Read from environment variables
  const settings = {
    isTestMode: import.meta.env.VITE_PEPPOL_TEST_MODE === 'true',
    apiUsername: import.meta.env.VITE_PEPPOL_API_USERNAME || '',
    apiPassword: import.meta.env.VITE_PEPPOL_API_PASSWORD || '',
    apiEndpoint: import.meta.env.VITE_PEPPOL_API_ENDPOINT || 'https://test.digiteal.eu',
    webhookUrl: import.meta.env.VITE_PEPPOL_WEBHOOK_URL || '',
    vatNumber: import.meta.env.VITE_PEPPOL_VAT_NUMBER || '',
    identificationNumber: import.meta.env.VITE_PEPPOL_IDENTIFICATION_NUMBER || ''
  };

  // All possible webhook types
  const allWebhookTypes = [
    { type: 'PEPPOL_INVOICE_RECEIVED', desc: 'Receive supplier invoices' },
    { type: 'PEPPOL_SEND_PROCESSING_OUTCOME', desc: 'Track delivery status' },
    { type: 'PEPPOL_CREDIT_NOTE_RECEIVED', desc: 'Receive credit notes' },
    { type: 'PEPPOL_INVOICE_RESPONSE_RECEIVED', desc: 'Acceptance/rejection' },
    { type: 'PEPPOL_TRANSPORT_ACK_RECEIVED', desc: 'Transport confirmations' },
    { type: 'PEPPOL_MLR_RECEIVED', desc: 'Message responses' },
    { type: 'PEPPOL_SELF_BILLING_INVOICE_RECEIVED', desc: 'Self-billing invoices' },
    { type: 'PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED', desc: 'Self-billing credits' },
    { type: 'PEPPOL_FUTURE_VALIDATION_FAILED', desc: 'Validation failures' }
  ];

  // Handle sidebar toggle and responsive layout
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
        const isCollapsed = localStorage.getItem('superadmin-sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  useEffect(() => {
    checkWebhookStatus();
    fetchWebhookConfiguration();
  }, []);

  const checkWebhookStatus = async () => {
    try {
      const { count } = await supabase
        .from('peppol_webhook_events')
        .select('*', { count: 'exact', head: true });

      setWebhookConfigured(count > 0);
    } catch (error) {
      console.error('Error checking webhook status:', error);
    }
  };

  const fetchWebhookConfiguration = async () => {
    if (!settings.apiUsername || !settings.apiPassword) {
      setLoadingConfig(false);
      return;
    }

    try {
      setLoadingConfig(true);
      const endpoint = settings.isTestMode 
        ? 'https://test.digiteal.eu' 
        : settings.apiEndpoint;

      // Call Supabase Edge Function to avoid CORS issues
      // Note: Only authentication is needed - the credentials identify the company
      const { data, error } = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: endpoint,
          username: settings.apiUsername,
          password: settings.apiPassword
        }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        setConfiguredWebhooks([]);
        return;
      }

      if (data) {
        // Extract webhook types from the response
        if (data.webHooks && Array.isArray(data.webHooks)) {
          const types = data.webHooks.map(wh => wh.type);
          setConfiguredWebhooks(types);
          setWebhookConfigured(types.length > 0);
        } else {
          setConfiguredWebhooks([]);
        }
      } else {
        console.error('No data returned from edge function');
        setConfiguredWebhooks([]);
      }
    } catch (error) {
      console.error('Error fetching webhook configuration:', error);
      setConfiguredWebhooks([]);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleConfigureWebhook = async () => {
    try {
      setConfiguringWebhook(true);
      setTestResult(null);

      const endpoint = settings.isTestMode 
        ? 'https://test.digiteal.eu' 
        : settings.apiEndpoint;

      const webhookTypes = [
        'PEPPOL_INVOICE_RECEIVED',
        'PEPPOL_SEND_PROCESSING_OUTCOME',
        'PEPPOL_CREDIT_NOTE_RECEIVED',
        'PEPPOL_INVOICE_RESPONSE_RECEIVED',
        'PEPPOL_TRANSPORT_ACK_RECEIVED',
        'PEPPOL_MLR_RECEIVED',
        'PEPPOL_SELF_BILLING_INVOICE_RECEIVED',
        'PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED',
        'PEPPOL_FUTURE_VALIDATION_FAILED'
      ];

      // According to Digiteal API docs, POST /api/v1/webhook/configuration only needs login, password, and webHooks
      const webhookConfig = {
        login: settings.apiUsername,
        password: settings.apiPassword,
        webHooks: webhookTypes.map(type => ({
          type: type,
          url: settings.webhookUrl
        }))
      };

      // Call Supabase Edge Function to avoid CORS issues
      const { data, error } = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: endpoint,
          username: settings.apiUsername,
          password: settings.apiPassword,
          method: 'POST',
          config: webhookConfig
        }
      });

      if (error) {
        setTestResult({
          success: false,
          message: 'Failed to configure webhook',
          details: error.message
        });
      } else {
        setWebhookConfigured(true);
        setTestResult({
          success: true,
          message: 'Webhook configured successfully!',
          details: 'All 9 Peppol event types are now active'
        });
        // Refresh the configuration
        await fetchWebhookConfiguration();
      }
    } catch (error) {
      console.error('Error configuring webhook:', error);
      setTestResult({
        success: false,
        message: 'Webhook configuration failed',
        details: error.message
      });
    } finally {
      setConfiguringWebhook(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Peppol | Super Admin</title>
        <meta name="description" content="Peppol network integration configuration" />
      </Helmet>

      <SuperAdminSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: isMobile ? '0' : `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center gap-3">
                  <Icon name="Network" size={24} className="text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Peppol Integration</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Electronic invoice network configuration
                </p>
              </div>
            </div>
          </header>

          {/* Status Alert */}
          {testResult && (
            <div className={`p-5 rounded-xl border-2 shadow-lg ${
              testResult.success 
                ? 'bg-white border-green-300 shadow-green-200/50' 
                : 'bg-white border-red-300 shadow-red-200/50'
            }`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg flex-shrink-0 ${
                  testResult.success 
                    ? 'bg-green-100' 
                    : 'bg-red-100'
                }`}>
                  <Icon 
                    name={testResult.success ? "CheckCircle2" : "XCircle"} 
                    size={24} 
                    className={testResult.success ? "text-green-600" : "text-red-600"} 
                  />
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-base ${
                    testResult.success 
                      ? 'text-black' 
                      : 'text-black'
                  }`}>
                    {testResult.message.replace('❌ ', '').replace('✅ ', '')}
                  </p>
                  <p className={`text-sm mt-1.5 ${
                    testResult.success 
                      ? 'text-gray-700' 
                      : 'text-gray-700'
                  }`}>
                    {testResult.details}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            {/* Environment Status Bar */}
            <div className="px-6 py-4 border-b border-border bg-blue-600 dark:bg-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    settings.isTestMode 
                      ? 'bg-white/20' 
                      : 'bg-white/20'
                  }`}>
                    <Icon 
                      name={settings.isTestMode ? "TestTube" : "Shield"} 
                      size={18} 
                      className="text-white" 
                    />
                  </div>
                  <span className="text-base font-bold text-white">
                    {settings.isTestMode ? 'Sandbox Environment' : 'Live Environment'}
                  </span>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-extrabold tracking-wide ${
                  settings.isTestMode 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-blue-600'
                }`}>
                  {settings.isTestMode ? 'SANDBOX MODE' : 'LIVE MODE'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Configuration Info */}
              <div className="space-y-1">
                {/* API Endpoint */}
                <div className="flex items-start justify-between py-4 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">API Endpoint</p>
                    <p className="text-xs text-muted-foreground mt-1">Digiteal Peppol Access Point</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-foreground font-mono bg-muted px-3 py-1.5 rounded">{settings.apiEndpoint}</p>
                    <p className="text-xs text-muted-foreground mt-1">VITE_PEPPOL_API_ENDPOINT</p>
                  </div>
                </div>

                {/* Username */}
                <div className="flex items-start justify-between py-4 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">API Username</p>
                    <p className="text-xs text-muted-foreground mt-1">Authentication credentials</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-foreground font-mono bg-muted px-3 py-1.5 rounded">{settings.apiUsername || 'Not configured'}</p>
                    <p className="text-xs text-muted-foreground mt-1">VITE_PEPPOL_API_USERNAME</p>
                  </div>
                </div>

                {/* Password */}
                <div className="flex items-start justify-between py-4 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">API Password</p>
                    <p className="text-xs text-muted-foreground mt-1">Secure credentials</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="inline-flex items-center gap-2 bg-muted px-3 py-1.5 rounded">
                      <p className="text-sm text-foreground font-mono">
                        {settings.apiPassword ? (showPassword ? settings.apiPassword : '••••••••') : 'Not configured'}
                      </p>
                      {settings.apiPassword && (
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">VITE_PEPPOL_API_PASSWORD</p>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="flex items-start justify-between py-4 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Webhook URL</p>
                    <p className="text-xs text-muted-foreground mt-1">Event receiver endpoint</p>
                  </div>
                  <div className="text-right ml-4 max-w-md">
                    <p className="text-sm text-foreground font-mono bg-muted px-3 py-1.5 rounded break-all">{settings.webhookUrl || 'Not configured'}</p>
                    <p className="text-xs text-muted-foreground mt-1">VITE_PEPPOL_WEBHOOK_URL</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <Button
                  onClick={handleConfigureWebhook}
                  disabled={configuringWebhook || !settings.apiUsername || !settings.apiPassword || !settings.webhookUrl}
                  className="w-full"
                  size="lg"
                >
                  {configuringWebhook ? (
                    <>
                      <Icon name="Loader2" size={18} className="mr-2 animate-spin" />
                      Configuring Webhook...
                    </>
                  ) : (
                    <>
                      <Icon name="Webhook" size={18} className="mr-2" />
                      {webhookConfigured ? 'Reconfigure Webhook' : 'Configure Webhook'}
                    </>
                  )}
                </Button>
                {!settings.apiUsername || !settings.apiPassword || !settings.webhookUrl ? (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    ⚠️ Please configure environment variables before proceeding
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Registers 9 webhook event types automatically
                  </p>
                )}
              </div>

              {/* Webhook Event Types */}
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 border border-border">
                <button 
                  onClick={() => setShowWebhookTypes(!showWebhookTypes)}
                  className="w-full text-sm font-bold text-foreground mb-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Icon name="List" size={16} className="text-primary" />
                    </div>
                    Webhook Event Types
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingConfig ? (
                      <Icon name="Loader2" size={14} className="animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs font-normal text-muted-foreground">
                        {configuredWebhooks.length} / {allWebhookTypes.length} configured
                      </span>
                    )}
                    <Icon 
                      name={showWebhookTypes ? "ChevronUp" : "ChevronDown"} 
                      size={16} 
                      className="text-muted-foreground" 
                    />
                  </div>
                </button>
                {showWebhookTypes && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allWebhookTypes.map((event, index) => {
                    const isConfigured = configuredWebhooks.includes(event.type);
                    return (
                      <div 
                        key={index} 
                        className={`flex items-start gap-2 text-xs p-2.5 rounded-lg transition-colors ${
                          isConfigured 
                            ? 'bg-white border border-black' 
                            : 'bg-background/60 border border-border/50'
                        }`}
                      >
                        <div className={`p-1 rounded border border-black flex-shrink-0 ${
                          isConfigured 
                            ? 'bg-white' 
                            : 'bg-muted'
                        }`}>
                          <Icon 
                            name={isConfigured ? "Check" : "X"} 
                            size={10} 
                            className={isConfigured ? "text-black" : "text-muted-foreground"} 
                          />
                        </div>
                        <div className="flex-1">
                          <span className="font-semibold block text-black">
                            {event.type.replace('PEPPOL_', '')}
                          </span>
                          <span className="text-muted-foreground text-[11px]">{event.desc}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Peppol;