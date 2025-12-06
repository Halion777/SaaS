import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '../../../../services/supabaseClient';
import Icon from '../../../../components/AppIcon';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
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
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [unregisteringId, setUnregisteringId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [relatedIds, setRelatedIds] = useState([]);
  const [idsToDelete, setIdsToDelete] = useState(new Set());
  
  // Filter participants based on search term
  const filteredParticipants = useMemo(() => {
    if (!searchTerm.trim()) {
      return participants;
    }
    const term = searchTerm.toLowerCase().trim();
    return participants.filter(participant => {
      const peppolId = (participant.peppolIdentifier || participant.id || '').toLowerCase();
      return peppolId.includes(term);
    });
  }, [participants, searchTerm]);
  
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
    fetchParticipants();
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

  const fetchParticipants = async () => {
    if (!settings.apiUsername || !settings.apiPassword) {
      return;
    }

    try {
      setLoadingParticipants(true);
      const endpoint = settings.isTestMode 
        ? 'https://test.digiteal.eu' 
        : settings.apiEndpoint;

      // First, get the list of all registered participants
      const { data, error } = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: endpoint,
          username: settings.apiUsername,
          password: settings.apiPassword,
          action: 'get-participants'
        }
      });

      if (error) {
        console.error('Error fetching participants:', error);
        setParticipants([]);
        return;
      }

      // Extract participant data from response
      let participantsList = [];
      
      if (Array.isArray(data)) {
        // If response is already an array
        participantsList = data;
      } else if (data && Array.isArray(data.participants)) {
        participantsList = data.participants;
      } else if (data && typeof data === 'object') {
        // If response is an object, try to extract participants
        if (data.data && Array.isArray(data.data)) {
          participantsList = data.data;
        } else {
          // Convert object to array
          participantsList = Object.values(data).filter(item => item !== null && item !== undefined);
        }
      }

      if (participantsList.length === 0) {
        setParticipants([]);
        return;
      }

      // Process each participant - fetch details if needed
      const detailedParticipants = await Promise.all(
        participantsList.map(async (participant) => {
          try {
            // If participant is already an object with details, check if it has enough info
            if (typeof participant === 'object' && participant !== null) {
              const identifier = participant.peppolIdentifier || participant.id || participant.identifier;
              
              // If we already have name and other details, use it
              if (participant.name || participant.businessName || participant.companyName) {
                return {
                  peppolIdentifier: identifier,
                  id: identifier,
                  name: participant.name || participant.businessName || participant.companyName || 'N/A',
                  countryCode: participant.countryCode || participant.country || 'N/A',
                  supportedDocumentTypes: participant.supportedDocumentTypes || participant.documentTypes || []
                };
              }
              
               // If we have identifier but no details, fetch details from both endpoints
               if (identifier) {
                 // Fetch from authenticated endpoint (basic info)
                 const { data: basicDetails, error: basicError } = await supabase.functions.invoke('peppol-webhook-config', {
                   body: {
                     endpoint: endpoint,
                     username: settings.apiUsername,
                     password: settings.apiPassword,
                     action: 'get-participant-details',
                     peppolIdentifier: identifier
                   }
                 });

                 // Fetch from public endpoint (detailed info including document types)
                 const { data: publicDetails, error: publicError } = await supabase.functions.invoke('peppol-webhook-config', {
                   body: {
                     endpoint: endpoint,
                     username: settings.apiUsername,
                     password: settings.apiPassword,
                     action: 'get-participant',
                     peppolIdentifier: identifier
                   }
                 });

                 // Merge data from both endpoints
                 const mergedData = {
                   peppolIdentifier: identifier,
                   id: identifier,
                   // From authenticated endpoint
                   name: basicDetails?.name || publicDetails?.businessCard?.businessEntities?.[0]?.names?.[0]?.name || 'N/A',
                   registrationDate: basicDetails?.registrationDate || publicDetails?.businessCard?.businessEntities?.[0]?.registrationDate || null,
                   contactPerson: basicDetails?.contactPerson || null,
                   // From public endpoint
                   countryCode: publicDetails?.businessCard?.businessEntities?.[0]?.countryCode || 'N/A',
                   supportedDocumentTypes: publicDetails?.supportedDocumentTypes 
                     ? publicDetails.supportedDocumentTypes.map(dt => dt.type || dt)
                     : [],
                   smpHostName: publicDetails?.smpHostName || null
                 };

                 // Return merged data if at least one endpoint succeeded
                 if (!basicError || !publicError) {
                   return mergedData;
                 }
                 
                 // If both failed, log and return basic info
                 console.warn(`Failed to fetch details for ${identifier}:`, { basicError, publicError });
               }
              
              // Fallback to basic info from participant object
              return {
                peppolIdentifier: identifier || 'N/A',
                id: identifier || 'N/A',
                name: participant.name || participant.businessName || participant.companyName || 'N/A',
                countryCode: participant.countryCode || participant.country || 'N/A',
                supportedDocumentTypes: participant.supportedDocumentTypes || participant.documentTypes || []
              };
            }

            // If participant is a string (just identifier), fetch details from both endpoints
            if (typeof participant === 'string') {
              // Fetch from authenticated endpoint (basic info)
              const { data: basicDetails, error: basicError } = await supabase.functions.invoke('peppol-webhook-config', {
                body: {
                  endpoint: endpoint,
                  username: settings.apiUsername,
                  password: settings.apiPassword,
                  action: 'get-participant-details',
                  peppolIdentifier: participant
                }
              });

              // Fetch from public endpoint (detailed info including document types)
              const { data: publicDetails, error: publicError } = await supabase.functions.invoke('peppol-webhook-config', {
                body: {
                  endpoint: endpoint,
                  username: settings.apiUsername,
                  password: settings.apiPassword,
                  action: 'get-participant',
                  peppolIdentifier: participant
                }
              });

              // Merge data from both endpoints
              const mergedData = {
                peppolIdentifier: participant,
                id: participant,
                // From authenticated endpoint
                name: basicDetails?.name || publicDetails?.businessCard?.businessEntities?.[0]?.names?.[0]?.name || 'N/A',
                registrationDate: basicDetails?.registrationDate || publicDetails?.businessCard?.businessEntities?.[0]?.registrationDate || null,
                contactPerson: basicDetails?.contactPerson || null,
                // From public endpoint
                countryCode: publicDetails?.businessCard?.businessEntities?.[0]?.countryCode || 'N/A',
                supportedDocumentTypes: publicDetails?.supportedDocumentTypes 
                  ? publicDetails.supportedDocumentTypes.map(dt => dt.type || dt)
                  : [],
                smpHostName: publicDetails?.smpHostName || null
              };

              // Return merged data if at least one endpoint succeeded
              if (!basicError || !publicError) {
                return mergedData;
              }
              
              // Return basic info if both fetches fail
              console.warn(`Failed to fetch details for ${participant}:`, { basicError, publicError });
              return {
                peppolIdentifier: participant,
                id: participant,
                name: 'N/A',
                countryCode: 'N/A',
                supportedDocumentTypes: []
              };
            }

            // Unknown format
            return {
              peppolIdentifier: 'N/A',
              id: 'N/A',
              name: 'N/A',
              countryCode: 'N/A',
              supportedDocumentTypes: []
            };
          } catch (err) {
            console.warn(`Error processing participant:`, err, participant);
            const identifier = typeof participant === 'string' 
              ? participant 
              : (participant?.peppolIdentifier || participant?.id || 'N/A');
            return {
              peppolIdentifier: identifier,
              id: identifier,
              name: 'N/A',
              countryCode: 'N/A',
              supportedDocumentTypes: []
            };
          }
        })
      );

      setParticipants(detailedParticipants);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Cleanup all Peppol-related data for a user
  // Uses edge function to bypass RLS
  const cleanupPeppolData = async (peppolIdentifier) => {
    try {
      // Use edge function with service role to bypass RLS
      const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('admin-delete-user-peppol', {
        body: { peppolIdentifier }
      });

      if (deleteError) {
        console.error('Error deleting Peppol data via edge function:', deleteError);
        return { 
          success: false, 
          message: deleteError.message || 'Failed to delete Peppol data' 
        };
      }

      if (!deleteResult?.success) {
        console.error('Peppol data deletion failed:', deleteResult);
        return { 
          success: false, 
          message: deleteResult?.message || deleteResult?.error || 'Failed to delete Peppol data' 
        };
      }

      return { 
        success: true, 
        message: deleteResult.message || 'All Peppol data cleaned up successfully' 
      };
    } catch (error) {
      console.error('Error in cleanupPeppolData:', error);
      return { 
        success: false, 
        message: error.message || 'Unknown error during cleanup' 
      };
    }
  };

  // Helper function to find related Belgian IDs
  const findRelatedBelgianIds = (peppolIdentifier) => {
    const related = [peppolIdentifier];
    
    if (peppolIdentifier.startsWith('9925:') || peppolIdentifier.startsWith('0208:')) {
      const parts = peppolIdentifier.split(':');
      if (parts.length === 2) {
        const scheme = parts[0];
        const identifier = parts[1];
        
        if (scheme === '9925' && identifier.toLowerCase().startsWith('be')) {
          // Extract 10 digits from BEXXXXXXXXXX
          const digitsOnly = identifier.replace(/\D/g, '').substring(2);
          const id0208 = `0208:${digitsOnly}`;
          // Check if this ID exists in participants
          const exists = participants.some(p => (p.peppolIdentifier || p.id) === id0208);
          if (exists) {
            related.push(id0208);
          }
        } else if (scheme === '0208') {
          // Generate 9925 ID from 0208
          const digitsOnly = identifier.replace(/\D/g, '');
          const id9925 = `9925:be${digitsOnly}`;
          // Check if this ID exists in participants
          const exists = participants.some(p => (p.peppolIdentifier || p.id) === id9925);
          if (exists) {
            related.push(id9925);
          }
        }
      }
    }
    
    return related;
  };

  // Open unregister modal with participant info
  const openUnregisterModal = (peppolIdentifier) => {
    const participant = participants.find(p => (p.peppolIdentifier || p.id) === peppolIdentifier);
    if (!participant) return;
    
    const related = findRelatedBelgianIds(peppolIdentifier);
    setSelectedParticipant(participant);
    setRelatedIds(related);
    setIdsToDelete(new Set(related)); // Default: select all related IDs
    setShowUnregisterModal(true);
  };

  // Handle unregister with selected IDs
  const handleUnregisterParticipant = async (selectedIds) => {
    if (!selectedIds || selectedIds.length === 0) {
      setTestResult({
        success: false,
        message: 'No IDs selected for deletion',
        details: 'Please select at least one Peppol ID to unregister'
      });
      return;
    }

    if (!settings.apiUsername || !settings.apiPassword) {
      setTestResult({
        success: false,
        message: 'API credentials not configured',
        details: 'Please configure environment variables'
      });
      return;
    }

    try {
      // Use the first selected ID for tracking
      const primaryId = selectedIds[0];
      setUnregisteringId(primaryId);
      const endpoint = settings.isTestMode 
        ? 'https://test.digiteal.eu' 
        : settings.apiEndpoint;

      // Use the selected IDs
      const identifiersToUnregister = selectedIds;

      // Step 1: Unregister all identifiers from Peppol network
      const unregisterResults = [];
      for (const id of identifiersToUnregister) {
        const { data, error } = await supabase.functions.invoke('peppol-webhook-config', {
          body: {
            endpoint: endpoint,
            username: settings.apiUsername,
            password: settings.apiPassword,
            action: 'unregister-participant',
            peppolIdentifier: id
          }
        });
        
        if (error) {
          // Log error but continue with other IDs
          console.warn(`Failed to unregister ${id}:`, error);
          unregisterResults.push({ id, success: false, error: error.message });
        } else {
          unregisterResults.push({ id, success: true });
        }
      }

      // Check if at least one unregistration succeeded
      const hasSuccess = unregisterResults.some(r => r.success);
      if (!hasSuccess) {
        setTestResult({
          success: false,
          message: 'Failed to unregister participant(s)',
          details: unregisterResults.map(r => `${r.id}: ${r.error || 'Unknown error'}`).join('; ')
        });
        setUnregisteringId(null);
        return;
      }

      // Step 2: Clean up all Peppol data from database (edge function handles all related IDs)
      const cleanupResult = await cleanupPeppolData(primaryId);
      
      if (!cleanupResult.success) {
        setTestResult({
          success: false,
          message: 'Participant unregistered from Peppol, but cleanup failed',
          details: cleanupResult.message || 'Some data may still remain in the database'
        });
        setUnregisteringId(null);
        return;
      }

      // Success: Both unregistration and cleanup completed
      // Refresh the participants table
      await fetchParticipants();
      setTestResult({
        success: true,
        message: 'Participant(s) unregistered and all Peppol data deleted successfully',
        details: `Selected participant(s) have been removed from Peppol network and all related data has been deleted from the database`
      });
      
      // Close modal
      setShowUnregisterModal(false);
      setSelectedParticipant(null);
      setRelatedIds([]);
      setIdsToDelete(new Set());
      
      // Refresh participants list
      await fetchParticipants();
    } catch (error) {
      console.error('Error unregistering participant:', error);
      setTestResult({
        success: false,
        message: 'Failed to unregister participant',
        details: error.message || 'Unknown error occurred'
      });
    } finally {
      setUnregisteringId(null);
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
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border bg-blue-600 dark:bg-blue-700">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                    settings.isTestMode 
                      ? 'bg-white/20' 
                      : 'bg-white/20'
                  }`}>
                    <Icon 
                      name={settings.isTestMode ? "TestTube" : "Shield"} 
                      size={16} 
                      className="sm:w-[18px] sm:h-[18px] text-white" 
                    />
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white">
                    {settings.isTestMode ? 'Sandbox Environment' : 'Live Environment'}
                  </span>
                </div>
                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-extrabold tracking-wide whitespace-nowrap ${
                  settings.isTestMode 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white text-blue-600'
                }`}>
                  {settings.isTestMode ? 'SANDBOX MODE' : 'LIVE MODE'}
                </span>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Configuration Info */}
              <div className="space-y-1">
                {/* API Endpoint */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 sm:py-4 px-3 sm:px-4 rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">API Endpoint</p>
                    <p className="text-xs text-muted-foreground mt-1">Digiteal Peppol Access Point</p>
                  </div>
                  <div className="text-left sm:text-right sm:ml-4 flex-shrink-0 sm:flex-shrink">
                    <p className="text-xs sm:text-sm text-foreground font-mono bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded break-all">{settings.apiEndpoint}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">VITE_PEPPOL_API_ENDPOINT</p>
                  </div>
                </div>

                {/* Username */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 sm:py-4 px-3 sm:px-4 rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">API Username</p>
                    <p className="text-xs text-muted-foreground mt-1">Authentication credentials</p>
                  </div>
                  <div className="text-left sm:text-right sm:ml-4 flex-shrink-0 sm:flex-shrink">
                    <p className="text-xs sm:text-sm text-foreground font-mono bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded break-all">{settings.apiUsername || 'Not configured'}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">VITE_PEPPOL_API_USERNAME</p>
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 sm:py-4 px-3 sm:px-4 rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">API Password</p>
                    <p className="text-xs text-muted-foreground mt-1">Secure credentials</p>
                  </div>
                  <div className="text-left sm:text-right sm:ml-4 flex-shrink-0 sm:flex-shrink">
                    <div className="inline-flex items-center gap-2 bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded">
                      <p className="text-xs sm:text-sm text-foreground font-mono break-all">
                        {settings.apiPassword ? (showPassword ? settings.apiPassword : '••••••••') : 'Not configured'}
                      </p>
                      {settings.apiPassword && (
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                          title={showPassword ? "Hide password" : "Show password"}
                        >
                          <Icon name={showPassword ? "EyeOff" : "Eye"} size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">VITE_PEPPOL_API_PASSWORD</p>
                  </div>
                </div>

                {/* Webhook URL */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between py-3 sm:py-4 px-3 sm:px-4 rounded-lg hover:bg-muted/50 transition-colors gap-2 sm:gap-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground">Webhook URL</p>
                    <p className="text-xs text-muted-foreground mt-1">Event receiver endpoint</p>
                  </div>
                  <div className="text-left sm:text-right sm:ml-4 w-full sm:w-auto sm:max-w-md">
                    <p className="text-xs sm:text-sm text-foreground font-mono bg-muted px-2 sm:px-3 py-1 sm:py-1.5 rounded break-all">{settings.webhookUrl || 'Not configured'}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">VITE_PEPPOL_WEBHOOK_URL</p>
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
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-3 sm:p-5 border border-border">
                <button 
                  onClick={() => setShowWebhookTypes(!showWebhookTypes)}
                  className="w-full text-xs sm:text-sm font-bold text-foreground mb-3 sm:mb-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1 sm:p-1.5 bg-primary/10 rounded-lg">
                      <Icon name="List" size={14} className="sm:w-4 sm:h-4 text-primary" />
                    </div>
                    <span className="hidden sm:inline">Webhook Event Types</span>
                    <span className="sm:hidden">Event Types</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {loadingConfig ? (
                      <Icon name="Loader2" size={12} className="sm:w-[14px] sm:h-[14px] animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-[10px] sm:text-xs font-normal text-muted-foreground">
                        {configuredWebhooks.length} / {allWebhookTypes.length}
                      </span>
                    )}
                    <Icon 
                      name={showWebhookTypes ? "ChevronUp" : "ChevronDown"} 
                      size={14} 
                      className="sm:w-4 sm:h-4 text-muted-foreground" 
                    />
                  </div>
                </button>
                {showWebhookTypes && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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

          {/* Registered Participants Section */}
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon name="Users" size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Registered Participants</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Manage Peppol network participants
                    </p>
                  </div>
                </div>
                <Button
                  onClick={fetchParticipants}
                  disabled={loadingParticipants || !settings.apiUsername || !settings.apiPassword}
                  variant="outline"
                  size="sm"
                >
                  {loadingParticipants ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Icon name="RefreshCw" size={16} className="mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Search Bar */}
              {settings.apiUsername && settings.apiPassword && participants.length > 0 && (
                <div className="mb-4">
                  <div className="relative">
                    <Icon 
                      name="Search" 
                      size={18} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
                    />
                    <Input
                      type="text"
                      placeholder="Search by Peppol ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear search"
                      >
                        <Icon name="X" size={16} />
                      </button>
                    )}
                  </div>
                  {searchTerm && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Showing {filteredParticipants.length} of {participants.length} participants
                    </p>
                  )}
                </div>
              )}

              {!settings.apiUsername || !settings.apiPassword ? (
                <div className="text-center py-8">
                  <Icon name="AlertCircle" size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    API credentials not configured. Please set environment variables.
                  </p>
                </div>
              ) : loadingParticipants ? (
                <div className="text-center py-8">
                  <Icon name="Loader2" size={32} className="mx-auto text-primary animate-spin mb-3" />
                  <p className="text-sm text-muted-foreground">Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="Users" size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No registered participants found</p>
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <Icon name="Search" size={32} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No participants found matching "{searchTerm}"</p>
                  <Button
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Peppol ID</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Name</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Country</th>
                        <th className="text-left py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Document Types</th>
                        <th className="text-right py-3 px-4 text-xs sm:text-sm font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.map((participant, index) => (
                        <tr 
                          key={participant.peppolIdentifier || index} 
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <code className="text-xs sm:text-sm font-mono bg-muted px-2 py-1 rounded">
                              {participant.peppolIdentifier || participant.id || 'N/A'}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-xs sm:text-sm text-foreground">
                            {participant.name || participant.companyName || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-xs sm:text-sm text-foreground">
                            {participant.countryCode || participant.country || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {participant.supportedDocumentTypes && Array.isArray(participant.supportedDocumentTypes) ? (
                                participant.supportedDocumentTypes.slice(0, 3).map((type, idx) => (
                                  <span 
                                    key={idx}
                                    className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded"
                                  >
                                    {type}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">N/A</span>
                              )}
                              {participant.supportedDocumentTypes && participant.supportedDocumentTypes.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{participant.supportedDocumentTypes.length - 3} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              onClick={() => openUnregisterModal(participant.peppolIdentifier || participant.id)}
                              disabled={unregisteringId === (participant.peppolIdentifier || participant.id) || showUnregisterModal}
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                            >
                              {unregisteringId === (participant.peppolIdentifier || participant.id) ? (
                                <>
                                  <Icon name="Loader2" size={14} className="mr-1 animate-spin" />
                                  Unregistering...
                                </>
                              ) : (
                                <>
                                  <Icon name="Trash2" size={14} className="mr-1" />
                                  Unregister
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Unregister Confirmation Modal */}
      {showUnregisterModal && selectedParticipant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Icon name="AlertTriangle" size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Unregister Peppol Participant</h3>
                    <p className="text-sm text-muted-foreground mt-1">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUnregisterModal(false);
                    setSelectedParticipant(null);
                    setRelatedIds([]);
                    setIdsToDelete(new Set());
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="X" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Participant Info */}
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-semibold text-foreground mb-2">Participant Information</p>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedParticipant.name || 'N/A'}</span></p>
                  <p><span className="text-muted-foreground">Country:</span> <span className="font-medium">{selectedParticipant.countryCode || 'N/A'}</span></p>
                </div>
              </div>

              {/* Related IDs for Belgium */}
              {relatedIds.length > 1 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Icon name="Info" size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Belgian Peppol IDs Detected</p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        This participant has multiple Peppol IDs registered. Select which ones you want to unregister.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-3">
                    {relatedIds.map((id) => {
                      const participant = participants.find(p => (p.peppolIdentifier || p.id) === id);
                      const isChecked = idsToDelete.has(id);
                      return (
                        <label
                          key={id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-400 dark:border-blue-600'
                              : 'bg-white dark:bg-muted border-border hover:border-blue-300 dark:hover:border-blue-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newSet = new Set(idsToDelete);
                              if (e.target.checked) {
                                newSet.add(id);
                              } else {
                                newSet.delete(id);
                              }
                              setIdsToDelete(newSet);
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{id}</code>
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                {id.startsWith('9925:') ? 'VAT-based' : 'Company Number'}
                              </span>
                            </div>
                            {participant && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {participant.name || 'N/A'} • {participant.countryCode || 'N/A'}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Single ID */}
              {relatedIds.length === 1 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Peppol ID to Unregister</p>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{relatedIds[0]}</code>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Icon name="AlertCircle" size={18} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-red-900 dark:text-red-100">
                    <p className="font-semibold mb-1">Warning: This will permanently:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Unregister the selected Peppol ID(s) from the Peppol network</li>
                      <li>Delete all Peppol-related data from the database</li>
                      <li>Remove all associated invoices and settings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex items-center justify-end gap-3">
              <Button
                onClick={() => {
                  setShowUnregisterModal(false);
                  setSelectedParticipant(null);
                  setRelatedIds([]);
                  setIdsToDelete(new Set());
                }}
                variant="outline"
                disabled={unregisteringId !== null}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const selectedArray = Array.from(idsToDelete);
                  if (selectedArray.length === 0) {
                    setTestResult({
                      success: false,
                      message: 'No IDs selected',
                      details: 'Please select at least one Peppol ID to unregister'
                    });
                    return;
                  }
                  await handleUnregisterParticipant(selectedArray);
                }}
                disabled={idsToDelete.size === 0 || unregisteringId !== null}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {unregisteringId ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Unregistering...
                  </>
                ) : (
                  <>
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Unregister Selected ({idsToDelete.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Peppol;