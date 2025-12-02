import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MainSidebar from '../../../components/ui/MainSidebar';
import PermissionGuard, { usePermissionCheck } from '../../../components/PermissionGuard';
import LimitedAccessGuard from '../../../components/LimitedAccessGuard';
import TableLoader from '../../../components/ui/TableLoader';
import { useMultiUser } from '../../../context/MultiUserContext';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PeppolService from '../../../services/peppolService';
import { supabase } from '../../../services/supabaseClient';
import { COUNTRY_CODES, searchCountries } from '../../../utils/countryCodes';
import { getPeppolVATSchemeId, parsePeppolId, combinePeppolId, PEPPOL_COUNTRY_LANGUAGE_MAP } from '../../../utils/peppolSchemes';
import { loadCompanyInfo } from '../../../services/companyInfoService';

const PeppolNetworkPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userProfile, subscriptionLimits } = useMultiUser();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [activeTab, setActiveTab] = useState('setup');
  const [peppolUsage, setPeppolUsage] = useState({ usage: 0, limit: 0, withinLimit: true });
  // All Peppol document types - automatically enabled for all users
  // Document types valid for participant registration (MLR and APPLICATION_RESPONSE are response types, not registration types)
  const ALL_DOCUMENT_TYPES = ['INVOICE', 'CREDIT_NOTE', 'SELF_BILLING_INVOICE', 'SELF_BILLING_CREDIT_NOTE', 'INVOICE_RESPONSE'];

  const [peppolSettings, setPeppolSettings] = useState({
    peppolId: '',
    name: '',
    countryCode: 'BE',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    language: 'en-US',
    supportedDocumentTypes: ALL_DOCUMENT_TYPES, // All document types enabled by default
    limitedToOutboundTraffic: false,
    sandboxMode: true,
    isConfigured: false,
    peppolDisabled: false
  });
  // Split Peppol ID fields
  const [peppolSchemeCode, setPeppolSchemeCode] = useState('');
  const [peppolIdentifier, setPeppolIdentifier] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [userBusinessInfo, setUserBusinessInfo] = useState(null);
  const [isBusinessUser, setIsBusinessUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateRange: '',
    amountRange: '',
    recipient: '',
    sender: ''
  });
  const [sentInvoices, setSentInvoices] = useState([]);
  const [receivedInvoices, setReceivedInvoices] = useState([]);
  const [filteredSentInvoices, setFilteredSentInvoices] = useState([]);
  const [filteredReceivedInvoices, setFilteredReceivedInvoices] = useState([]);
  const [sentViewMode, setSentViewMode] = useState('table');
  const [receivedViewMode, setReceivedViewMode] = useState('table');
  const [isSentFiltersExpanded, setIsSentFiltersExpanded] = useState(false);
  const [isReceivedFiltersExpanded, setIsReceivedFiltersExpanded] = useState(false);
  const [peppolStats, setPeppolStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    totalSentAmount: 0,
    totalReceivedAmount: 0
  });
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showParticipantDetails, setShowParticipantDetails] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState({
    setup: false,
    sent: false,
    received: false
  });

  // Create PeppolService instance - will be recreated when sandboxMode changes
  const peppolService = React.useMemo(() => new PeppolService(peppolSettings.sandboxMode), [peppolSettings.sandboxMode]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    return searchCountries(countrySearchQuery);
  }, [countrySearchQuery]);

  // Auto-fill scheme code when country is set
  // For Belgium: default to 0208 (company number without BE) - mandatory format
  // For other countries: use VAT scheme
  useEffect(() => {
    if (peppolSettings.countryCode) {
      const countryCode = peppolSettings.countryCode.toUpperCase();
      if (countryCode === 'BE') {
        // Belgium: default to 0208 (company number without BE) - mandatory format
        // Only set if not already one of the valid Belgium schemes
        if (!peppolSchemeCode || (peppolSchemeCode !== '0208' && peppolSchemeCode !== '9925')) {
          setPeppolSchemeCode('0208');
        }
      } else {
        // Other countries: use VAT scheme ID
        // Only set if not already set or if it doesn't match the VAT scheme
        const schemeId = getPeppolVATSchemeId(peppolSettings.countryCode);
        if (schemeId && (!peppolSchemeCode || peppolSchemeCode !== schemeId)) {
          setPeppolSchemeCode(schemeId);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peppolSettings.countryCode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.country-dropdown-container')) {
        setShowCountryDropdown(false);
      }
    };

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCountryDropdown]);

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

  // Load Peppol settings only (for configuration tab)
  const loadPeppolSettings = async () => {
    try {
      const settingsResult = await peppolService.getPeppolSettings();
      if (settingsResult.success) {
        // Preserve existing auto-filled values, only update if settings have values
        setPeppolSettings(prev => {
          const loaded = settingsResult.data;
          return {
            ...prev,
            // Only update if loaded settings have values (preserve auto-filled values)
            name: loaded.name || prev.name,
            email: loaded.email || prev.email,
            countryCode: loaded.countryCode || prev.countryCode,
            phoneNumber: loaded.phoneNumber || prev.phoneNumber,
            firstName: loaded.firstName || prev.firstName,
            lastName: loaded.lastName || prev.lastName,
            language: loaded.language || prev.language,
            supportedDocumentTypes: loaded.supportedDocumentTypes || prev.supportedDocumentTypes,
            limitedToOutboundTraffic: loaded.limitedToOutboundTraffic !== undefined ? loaded.limitedToOutboundTraffic : prev.limitedToOutboundTraffic,
            sandboxMode: loaded.sandboxMode !== undefined ? loaded.sandboxMode : prev.sandboxMode,
            isConfigured: loaded.isConfigured || false,
            peppolDisabled: loaded.peppolDisabled || false
          };
        });

        // Parse existing Peppol ID into scheme code, country code, and VAT number
        // Format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER} (e.g., 9925:BE1231231231)
        if (settingsResult.data.peppolId) {
          const parsed = parsePeppolId(settingsResult.data.peppolId);
          if (parsed.schemeCode && parsed.identifier) {
            // Extract country code and VAT number from identifier
            // Format: {COUNTRY_CODE}{VAT_NUMBER} (e.g., BE1231231231)
            const identifier = parsed.identifier;
            // Check if identifier starts with 2-letter country code
            if (/^[A-Z]{2}\d+$/i.test(identifier)) {
              const countryCode = identifier.substring(0, 2).toUpperCase();
              const vatNumber = identifier.substring(2);

              // Only set if not already set (preserve auto-filled values)
              if (!peppolSchemeCode) {
                setPeppolSchemeCode(parsed.schemeCode);
              }
              if (!peppolSettings.countryCode) {
                handleInputChange('countryCode', countryCode);
              }
              if (!peppolIdentifier) {
                setPeppolIdentifier(vatNumber);
              }
            } else {
              // Old format or just numbers - try to extract
              if (!peppolSchemeCode) {
                setPeppolSchemeCode(parsed.schemeCode || '');
              }
              if (!peppolIdentifier) {
                // Extract only numbers
                const digitsOnly = parsed.identifier.replace(/\D/g, '');
                setPeppolIdentifier(digitsOnly);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading Peppol settings:', error);
    }
  };

  // Load Peppol invoices (for sent/received tabs)
  const loadPeppolInvoices = async () => {
    try {
      setLoadingInvoices(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated');
        return;
      }

      // Load sent invoices (from invoices table where peppol_enabled = true)
      // Only show invoices for professional clients (client_type = 'company')
      // Only show paid invoices (status = 'paid')
      const { data: sentInvoicesData, error: sentError } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          client_id,
          amount,
          final_amount,
          issue_date,
          due_date,
          status,
          peppol_status,
          peppol_message_id,
          peppol_sent_at,
          peppol_delivered_at,
          receiver_peppol_id,
          clients (
            name,
            email,
            peppol_id,
            client_type
          )
        `)
        .eq('user_id', user.id)
        .eq('peppol_enabled', true)
        .eq('status', 'paid')
        .order('peppol_sent_at', { ascending: false });

      // Load received invoices (from expense_invoices table where peppol_enabled = true)
      const { data: receivedInvoicesData, error: receivedError } = await supabase
        .from('expense_invoices')
        .select(`
          id,
          invoice_number,
          supplier_name,
          supplier_email,
          amount,
          issue_date,
          due_date,
          peppol_message_id,
          peppol_received_at,
          sender_peppol_id
        `)
        .eq('user_id', user.id)
        .eq('peppol_enabled', true)
        .order('peppol_received_at', { ascending: false });

      if (sentError) {
        console.error('Error loading sent invoices:', sentError);
      }
      if (receivedError) {
        console.error('Error loading received invoices:', receivedError);
      }

      // Transform sent invoices to match expected format
      // Filter to only include invoices for professional clients (client_type = 'company')
      // And only paid invoices (status = 'paid')
      const sent = (sentInvoicesData || [])
        .filter(inv => inv.clients?.client_type === 'company' && inv.status === 'paid') // Only professional clients and paid invoices
        .map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          recipient_name: inv.clients?.name || 'Unknown Client',
          recipient_email: inv.clients?.email || '',
          peppol_identifier: inv.receiver_peppol_id || inv.clients?.peppol_id || 'N/A',
          total_amount: parseFloat(inv.final_amount || inv.amount || 0),
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          status: inv.peppol_status === 'delivered' ? 'delivered' :
            inv.peppol_status === 'sent' ? 'pending' :
              inv.peppol_status === 'failed' ? 'failed' : 'pending',
          peppol_message_id: inv.peppol_message_id,
          created_at: inv.peppol_sent_at || inv.issue_date
        }));

      // Transform received invoices to match expected format
      const received = (receivedInvoicesData || []).map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        sender_name: inv.supplier_name || 'Unknown Supplier',
        sender_email: inv.supplier_email || '',
        peppol_identifier: inv.sender_peppol_id || 'N/A',
        total_amount: parseFloat(inv.amount || 0),
        issue_date: inv.issue_date,
        due_date: inv.due_date,
        status: 'received',
        peppol_message_id: inv.peppol_message_id,
        created_at: inv.peppol_received_at || inv.issue_date
      }));

      setSentInvoices(sent);
      setReceivedInvoices(received);

      // Calculate stats
      const totalSentAmount = sent.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
      const totalReceivedAmount = received.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      setPeppolStats({
        totalSent: sent.length,
        totalReceived: received.length,
        totalSentAmount,
        totalReceivedAmount
      });
    } catch (error) {
      console.error('Error loading Peppol invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Check if user is a business user and load Peppol settings
  useEffect(() => {
    // Prevent reloading if already initialized
    if (isInitialized) return;

    const checkBusinessUserAndLoadSettings = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          navigate('/login');
          return;
        }

        // Get user business information
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('business_size, company_name, vat_number, first_name, last_name, email, phone, country')
          .eq('id', user.id)
          .single();

        if (userDataError) {
          console.error('Error fetching user data:', userDataError);
          return;
        }

        // Construct full_name from first_name and last_name
        const fullName = userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : userData.first_name || userData.last_name || '';

        setUserBusinessInfo({ ...userData, full_name: fullName });

        // Check if user is a business (not solo/individual)
        const businessSizes = ['small', 'medium', 'large'];
        const isBusiness = businessSizes.includes(userData.business_size);
        setIsBusinessUser(isBusiness);

        // Load company info from company_profiles table
        let companyInfo = null;
        try {
          companyInfo = await loadCompanyInfo(user.id);
        } catch (error) {
          console.error('Error loading company info:', error);
        }

        // Pre-fill Peppol settings from company info and user data if not already configured
        if (isBusiness && !peppolSettings.isConfigured) {
          // Use company info if available, otherwise fall back to user data
          const companyName = companyInfo?.name || userData.company_name || fullName || '';
          const companyEmail = companyInfo?.email || userData.email || '';
          const companyPhone = companyInfo?.phone || userData.phone || '';
          const companyCountry = companyInfo?.country || userData.country || 'BE';
          const companyVatNumber = companyInfo?.vatNumber || userData.vat_number || '';

          // Extract first name and last name from user data
          // If last_name is missing or same as first_name, try to parse from full name
          let firstName = userData.first_name || '';
          let lastName = userData.last_name || '';

          // If last_name is empty or same as first_name, try to parse from full name
          if (!lastName || (firstName && lastName === firstName)) {
            const nameParts = fullName.trim().split(/\s+/);
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else if (nameParts.length === 1) {
              firstName = nameParts[0];
              lastName = '';
            }
          }

          // Auto-fill all fields, but only if they're empty (preserve existing values)
          setPeppolSettings(prev => ({
            ...prev,
            name: prev.name || companyName,
            email: prev.email || companyEmail,
            countryCode: prev.countryCode || companyCountry,
            phoneNumber: prev.phoneNumber || companyPhone,
            firstName: prev.firstName || firstName,
            lastName: prev.lastName || lastName
          }));

          // Set scheme code if country is available
          if (companyCountry && !peppolSchemeCode) {
            const countryCodeUpper = companyCountry.toUpperCase();
            if (countryCodeUpper === 'BE') {
              // Belgium: default to 0208 (company number without BE) - mandatory format
              setPeppolSchemeCode('0208');
            } else {
              // Other countries: use VAT scheme
              const schemeId = getPeppolVATSchemeId(companyCountry);
              if (schemeId) {
                setPeppolSchemeCode(schemeId);
              }
            }
          }

          // Auto-fill VAT number identifier if available (only numbers)
          if (companyVatNumber && !peppolIdentifier) {
            // Extract only numeric characters from VAT number
            const digitsOnly = companyVatNumber.replace(/\D/g, '');
            if (digitsOnly) {
              setPeppolIdentifier(digitsOnly);
            }
          }
        }

        // Only load Peppol settings for configuration tab if user is a business
        if (isBusiness) {
          // Load Peppol settings after auto-filling (so auto-filled values are preserved)
          await loadPeppolSettings();
          setLoadedTabs(prev => ({ ...prev, setup: true }));

          // Load invoice data immediately to populate KPI cards and stats
          await loadPeppolInvoices();
          setLoadedTabs(prev => ({ ...prev, sent: true, received: true }));
        }

        // Set loading to false only after we've determined the user type
        setLoading(false);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error checking business user:', error);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    checkBusinessUserAndLoadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-switch to card view on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSentViewMode('card');
        setReceivedViewMode('card');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Optional: Reload invoice data when user explicitly switches to invoice tabs
  // This ensures fresh data, but initial load happens on page load for KPI cards
  // Note: We could add a refresh button instead to avoid unnecessary reloads

  // Helper function to format invoice data for display
  const formatInvoiceForDisplay = (invoice, type = 'sent') => {
    return {
      id: invoice.invoice_number || invoice.id?.toString() || 'N/A',
      recipient: type === 'sent' ? (invoice.recipient_name || 'Unknown Recipient') : (invoice.sender_name || 'Unknown Sender'),
      recipientEmail: type === 'sent' ? (invoice.recipient_email || '') : (invoice.sender_email || ''),
      sender: type === 'received' ? (invoice.sender_name || 'Unknown Sender') : (invoice.recipient_name || 'Unknown Recipient'),
      senderEmail: type === 'received' ? (invoice.sender_email || '') : (invoice.recipient_email || ''),
      amount: invoice.total_amount || 0,
      date: invoice.issue_date || invoice.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
      status: invoice.status || 'pending',
      peppolId: invoice.peppol_identifier || 'N/A',
      currency: invoice.currency || 'EUR',
      dueDate: invoice.due_date || invoice.issue_date || new Date().toISOString().split('T')[0]
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
      case 'received':
      case 'processed':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return t('peppol.status.delivered');
      case 'received':
        return t('peppol.status.received');
      case 'processed':
        return t('peppol.status.processed');
      case 'pending':
        return t('peppol.status.pending');
      default:
        return t('peppol.status.unknown');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      // Combine scheme code, country code, and VAT number before saving
      // Format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER} (e.g., 9925:BE1231231231)
      const combinedPeppolId = combinePeppolIdWithCountry(peppolSchemeCode, peppolSettings.countryCode, peppolIdentifier);

      // Automatically set all document types before saving
      const settingsToSave = {
        ...peppolSettings,
        peppolId: combinedPeppolId, // Ensure combined ID is used
        supportedDocumentTypes: ALL_DOCUMENT_TYPES
      };
      const result = await peppolService.savePeppolSettings(settingsToSave);
      if (result.success) {
        // Update local settings from result instead of reloading
        setPeppolSettings(prev => ({
          ...prev,
          isConfigured: result.data?.isConfigured || true,
          ...result.data
        }));
        setSuccessMessage(result.message || t('peppol.messages.settingsSaved'));
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        // Check if participant is already registered
        if (result.alreadyRegistered) {
          setSuccessMessage(t('peppol.messages.alreadyRegistered'));
          // Clear success message after 5 seconds
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setErrorMessage(result.error || t('peppol.messages.saveError'));
          // Clear error message after 5 seconds
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    } catch (error) {
      setErrorMessage(t('peppol.messages.saveError') + ': ' + error.message);
      // Clear error message after 5 seconds
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Combine scheme code, country code, and VAT number before testing
      // Format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER} (e.g., 9925:BE1231231231)
      const combinedPeppolId = combinePeppolIdWithCountry(peppolSchemeCode, peppolSettings.countryCode, peppolIdentifier);
      const testSettings = {
        ...peppolSettings,
        peppolId: combinedPeppolId // Ensure combined ID is used
      };
      const result = await peppolService.testConnection(testSettings);
      if (result.success) {
        // Show detailed test results
        alert(result.message);
      } else {
        alert(`❌ Integration Test Failed:\n\n${result.error}`);
      }
    } catch (error) {
      alert(`❌ Integration Test Error:\n\n${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPeppolSettings(prev => ({ ...prev, [field]: value }));

    // When country code changes, auto-fill scheme code
    if (field === 'countryCode') {
      const countryCodeUpper = value.toUpperCase();
      if (countryCodeUpper === 'BE') {
        // Belgium: default to 0208 (company number without BE) - mandatory format
        setPeppolSchemeCode('0208');
        // Update combined Peppol ID when country changes
        if (peppolIdentifier) {
          const combined = combinePeppolIdWithCountry('0208', value, peppolIdentifier);
          setPeppolSettings(prev => ({ ...prev, peppolId: combined }));
        }
      } else {
        // Other countries: use VAT scheme
        const schemeId = getPeppolVATSchemeId(value);
        if (schemeId) {
          setPeppolSchemeCode(schemeId);
          // Update combined Peppol ID when country changes
          if (peppolIdentifier) {
            const combined = combinePeppolIdWithCountry(schemeId, value, peppolIdentifier);
            setPeppolSettings(prev => ({ ...prev, peppolId: combined }));
          }
        }
      }
    }
  };

  // Handle Peppol scheme code change
  const handleSchemeCodeChange = (value) => {
    setPeppolSchemeCode(value);
    // Update combined Peppol ID with format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    const combined = combinePeppolIdWithCountry(value, peppolSettings.countryCode, peppolIdentifier);
    setPeppolSettings(prev => ({ ...prev, peppolId: combined }));
  };

  // Combine scheme code, country code, and VAT number into full Peppol ID
  // For Belgium:
  //   - 0208: Company Number without BE (e.g., 0208:0630675588)
  //   - 9925: BE + company Number (e.g., 9925:BE0630675588)
  // For other countries:
  //   - Format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER} (e.g., 9925:BE1231231231)
  const combinePeppolIdWithCountry = (schemeCode, countryCode, vatNumber) => {
    if (!schemeCode || !countryCode || !vatNumber) {
      return '';
    }
    
    const countryCodeUpper = countryCode.toUpperCase();
    
    // Belgium-specific handling
    if (countryCodeUpper === 'BE') {
      if (schemeCode === '0208') {
        // 0208: Company Number without BE prefix
        return `${schemeCode}:${vatNumber}`;
      } else if (schemeCode === '9925') {
        // 9925: BE + company Number
        return `${schemeCode}:BE${vatNumber}`;
      }
    }
    
    // Default format for other countries: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    return `${schemeCode}:${countryCodeUpper}${vatNumber}`;
  };

  // Handle Peppol identifier change - only allow numbers
  const handleIdentifierChange = (value) => {
    // Remove all non-numeric characters
    const numericOnly = value.replace(/\D/g, '');
    setPeppolIdentifier(numericOnly);
    // Update combined Peppol ID with format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    const combined = combinePeppolIdWithCountry(peppolSchemeCode, peppolSettings.countryCode, numericOnly);
    setPeppolSettings(prev => ({ ...prev, peppolId: combined }));
  };

  // Apply filters to invoices
  useEffect(() => {
    const applyFilters = (invoices, isSent = true) => {
      return invoices.map(invoice => formatInvoiceForDisplay(invoice, isSent ? 'sent' : 'received')).filter(invoice => {
        // Search filter
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase();
          const searchFields = [
            invoice.id,
            isSent ? invoice.recipient : invoice.sender,
            isSent ? invoice.recipientEmail : invoice.senderEmail,
            invoice.peppolId
          ].join(' ').toLowerCase();

          if (!searchFields.includes(searchTerm)) {
            return false;
          }
        }

        // Status filter
        if (filters.status && invoice.status !== filters.status) {
          return false;
        }

        // Date range filter
        if (filters.dateRange) {
          const invoiceDate = new Date(invoice.date);
          const today = new Date();
          let startDate = new Date();

          switch (filters.dateRange) {
            case 'today':
              startDate.setHours(0, 0, 0, 0);
              break;
            case 'week':
              startDate.setDate(today.getDate() - 7);
              break;
            case 'month':
              startDate.setMonth(today.getMonth() - 1);
              break;
            case 'quarter':
              startDate.setMonth(today.getMonth() - 3);
              break;
            default:
              break;
          }

          if (invoiceDate < startDate) {
            return false;
          }
        }

        // Amount range filter
        if (filters.amountRange) {
          const amount = invoice.amount;
          switch (filters.amountRange) {
            case 'low':
              if (amount >= 1000) return false;
              break;
            case 'medium':
              if (amount < 1000 || amount >= 5000) return false;
              break;
            case 'high':
              if (amount < 5000) return false;
              break;
            default:
              break;
          }
        }

        // Recipient/Sender filter
        if (isSent && filters.recipient) {
          if (!invoice.recipient.toLowerCase().includes(filters.recipient.toLowerCase())) {
            return false;
          }
        } else if (!isSent && filters.sender) {
          if (!invoice.sender.toLowerCase().includes(filters.sender.toLowerCase())) {
            return false;
          }
        }

        return true;
      });
    };

    setFilteredSentInvoices(applyFilters(sentInvoices, true));
    setFilteredReceivedInvoices(applyFilters(receivedInvoices, false));
  }, [filters, sentInvoices, receivedInvoices]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      dateRange: '',
      amountRange: '',
      recipient: '',
      sender: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.search || filters.status || filters.dateRange || filters.amountRange || filters.recipient || filters.sender;
  };

  const renderSentTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.invoiceNumber')}</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.recipient')}</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.peppolId')}</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.amount')}</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.date')}</th>
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.status')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredSentInvoices.map((invoice) => (
            <tr key={invoice.id} className="border-t border-border hover:bg-muted/30">
              <td className="p-4 font-medium">{invoice.id}</td>
              <td className="p-4">
                <div>
                  <div className="font-medium">{invoice.recipient}</div>
                  <div className="text-xs text-muted-foreground">{invoice.recipientEmail}</div>
                </div>
              </td>
              <td className="p-4 text-sm text-muted-foreground font-mono">{invoice.peppolId}</td>
              <td className="p-4 font-medium">
                {invoice.amount.toLocaleString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR' })}
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {new Date(invoice.date).toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(invoice.status)}`}>
                  {getStatusText(invoice.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSentCardView = () => (
    <div className="p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {filteredSentInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-2 sm:p-3 md:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="Send" size={12} className="sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{invoice.id}</h3>
                  <p className="text-xs text-muted-foreground truncate">{invoice.recipient}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium text-center flex-shrink-0 ${getStatusColor(invoice.status)}`}>
                {getStatusText(invoice.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t('peppol.invoices.email')}</p>
                <p className="text-xs text-foreground truncate">{invoice.recipientEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t('peppol.invoices.amount')}</p>
                <p className="text-xs font-medium text-foreground">{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                <Icon name="Network" size={10} className="sm:w-3 sm:h-3 text-success flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-mono truncate">{invoice.peppolId}</span>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(invoice.date).toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReceivedTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-4 font-medium">{t('peppol.invoices.invoiceNumber')}</th>
            <th className="text-left p-4 font-medium">{t('peppol.invoices.sender')}</th>
            <th className="text-left p-4 font-medium">{t('peppol.invoices.peppolId')}</th>
            <th className="text-left p-4 font-medium">{t('peppol.invoices.amount')}</th>
            <th className="text-left p-4 font-medium">{t('peppol.invoices.date')}</th>
            <th className="text-left p-4 font-medium">{t('peppol.invoices.status')}</th>
          </tr>
        </thead>
        <tbody>
          {filteredReceivedInvoices.map((invoice) => (
            <tr key={invoice.id} className="border-t border-border hover:bg-muted/30">
              <td className="p-4 font-medium">{invoice.id}</td>
              <td className="p-4">
                <div>
                  <div className="font-medium">{invoice.sender}</div>
                  <div className="text-xs text-muted-foreground">{invoice.senderEmail}</div>
                </div>
              </td>
              <td className="p-4 text-sm text-muted-foreground font-mono">{invoice.peppolId}</td>
              <td className="p-4 font-medium">
                {invoice.amount.toLocaleString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR' })}
              </td>
              <td className="p-4 text-sm text-muted-foreground">
                {new Date(invoice.date).toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(invoice.status)}`}>
                  {getStatusText(invoice.status)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderReceivedCardView = () => (
    <div className="p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {filteredReceivedInvoices.map((invoice) => (
          <div key={invoice.id} className="bg-card border border-border rounded-lg p-2 sm:p-3 md:p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon name="Download" size={12} className="sm:w-4 sm:h-4 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{invoice.id}</h3>
                  <p className="text-xs text-muted-foreground truncate">{invoice.sender}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium text-center flex-shrink-0 ${getStatusColor(invoice.status)}`}>
                {getStatusText(invoice.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t('peppol.invoices.email')}</p>
                <p className="text-xs text-foreground truncate">{invoice.senderEmail}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{t('peppol.invoices.amount')}</p>
                <p className="text-xs font-medium text-foreground">{invoice.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                <Icon name="Network" size={10} className="sm:w-3 sm:h-3 text-success flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-mono truncate">{invoice.peppolId}</span>
              </div>
              <div className="text-xs text-muted-foreground flex-shrink-0">
                {new Date(invoice.date).toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Check permissions for actions
  const { canEdit } = usePermissionCheck('peppolAccessPoint');

  // Check Peppol invoice usage for Starter plan users
  useEffect(() => {
    const checkPeppolUsage = async () => {
      if (!user?.id || !userProfile) return;
      
      const isStarterPlan = userProfile.selected_plan === 'starter';
      if (!isStarterPlan) {
        setPeppolUsage({ usage: 0, limit: -1, withinLimit: true });
        return;
      }

      try {
        const { FeatureAccessService } = await import('../../../services/featureAccessService');
        const featureAccessService = new FeatureAccessService();
        const peppolQuota = await featureAccessService.canSendPeppolInvoice(user.id);
        setPeppolUsage({
          usage: peppolQuota.usage || 0,
          limit: peppolQuota.limit || 50,
          withinLimit: peppolQuota.withinLimit || false
        });
      } catch (error) {
        console.error('Error checking Peppol usage:', error);
        setPeppolUsage({ usage: 0, limit: 50, withinLimit: true });
      }
    };

    checkPeppolUsage();
  }, [user?.id, userProfile]);

  // Check if Peppol limit is reached for Starter plan
  const isStarterPlan = userProfile?.selected_plan === 'starter';
  const peppolLimitReached = isStarterPlan && peppolUsage.limit > 0 && peppolUsage.usage >= peppolUsage.limit;

  const renderContent = () => (
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
                  <Icon name="Network" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('peppol.header.title')}</h1>
                  {peppolSettings.isConfigured && (
                    <div className="ml-3 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-muted-foreground">{t('peppol.header.connected')}</span>
                    </div>
                  )}
                  {!peppolSettings.isConfigured && peppolSettings.peppolId && (
                    <div className="ml-3 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-xs text-muted-foreground">{t('peppol.header.configurationRequired')}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('peppol.header.subtitle')}
                </p>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">

              </div>
            </div>
          </header>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('peppol.stats.sentInvoices')}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {loading ? '...' : peppolStats.totalSent}
                  </p>
                </div>
                <div className="bg-primary/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Send" size={18} className="sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('peppol.stats.receivedInvoices')}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {loading ? '...' : peppolStats.totalReceived}
                  </p>
                </div>
                <div className="bg-success/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Download" size={18} className="sm:w-6 sm:h-6 text-success" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('peppol.stats.totalSent')}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {loading ? '...' : peppolStats.totalSentAmount.toLocaleString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="bg-warning/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Euro" size={18} className="sm:w-6 sm:h-6 text-warning" />
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t('peppol.stats.totalReceived')}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                    {loading ? '...' : peppolStats.totalReceivedAmount.toLocaleString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
                <div className="bg-info/10 p-2 sm:p-3 rounded-lg">
                  <Icon name="Euro" size={18} className="sm:w-6 sm:h-6 text-info" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-border">
            <div className="flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
              <button
                className={`pb-2 px-1 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${activeTab === 'setup'
                  ? 'border-b-2 border-primary text-foreground font-medium'
                  : 'text-muted-foreground'
                  }`}
                onClick={() => setActiveTab('setup')}
              >
                {t('peppol.tabs.setup')}
              </button>
              <button
                className={`pb-2 px-1 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${activeTab === 'sent'
                  ? 'border-b-2 border-primary text-foreground font-medium'
                  : 'text-muted-foreground'
                  }`}
                onClick={() => setActiveTab('sent')}
              >
                {t('peppol.tabs.sentInvoices')} ({peppolStats.totalSent})
              </button>
              <button
                className={`pb-2 px-1 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${activeTab === 'received'
                  ? 'border-b-2 border-primary text-foreground font-medium'
                  : 'text-muted-foreground'
                  }`}
                onClick={() => setActiveTab('received')}
              >
                {t('peppol.tabs.receivedInvoices')} ({peppolStats.totalReceived})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'setup' && (
              <div className="w-full">
                {loading ? (
                  <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
                    <TableLoader message={t('peppol.loading.configuration')} />
                  </div>
                ) : (
                  /* Peppol Integration Setup */
                  <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Success Message */}
                    {successMessage && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Icon name="CheckCircle" size={20} className="text-success flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-success font-medium">{successMessage}</p>
                          </div>
                          <button
                            onClick={() => setSuccessMessage(null)}
                            className="text-success hover:text-success/80 transition-colors"
                          >
                            <Icon name="X" size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <Icon name="AlertCircle" size={20} className="text-destructive flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                          </div>
                          <button
                            onClick={() => setErrorMessage(null)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <Icon name="X" size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Header - Only show when NOT configured */}
                    {!peppolSettings.isConfigured && (
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon name="Link" size={20} className="sm:w-6 sm:h-6 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-foreground">{t('peppol.setup.title')}</h2>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('peppol.setup.subtitle')}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Form Fields */}
                    {!peppolSettings.isConfigured ? (
                      <div className="space-y-6">
                        {/* Company Information */}
                        <div className="bg-card rounded-lg border border-border p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Icon name="Building2" size={20} />
                            {t('peppol.setup.companyInfo.title')}
                          </h3>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.companyInfo.companyName', 'Company Name')} *
                                </label>
                                <Input
                                  value={peppolSettings.name}
                                  onChange={(e) => handleInputChange('name', e.target.value)}
                                  placeholder={t('peppol.setup.companyInfo.companyNamePlaceholder', 'MyCompany')}
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.companyInfo.country', 'Country')} *
                                </label>
                                <Select
                                  value={peppolSettings.countryCode}
                                  onChange={(e) => handleInputChange('countryCode', e.target.value)}
                                  options={COUNTRY_CODES.map(country => ({
                                    value: country.code,
                                    label: `${country.code} - ${country.name}`
                                  }))}
                                  required
                                />
                              </div>
                            </div>

                            {/* Peppol ID - Split into Scheme Code and Identifier */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.companyInfo.peppolSchemeCode', 'Peppol Scheme Code')} *
                                </label>
                                {peppolSettings.countryCode?.toUpperCase() === 'BE' ? (
                                  <Select
                                    value={peppolSchemeCode}
                                    onChange={(e) => handleSchemeCodeChange(e.target.value)}
                                    options={[
                                      { value: '0208', label: t('peppol.setup.companyInfo.belgiumScheme0208', '0208: Company Number (without BE) - Default') },
                                      { value: '9925', label: t('peppol.setup.companyInfo.belgiumScheme9925', '9925: BE + Company Number') }
                                    ]}
                                    placeholder={t('peppol.setup.companyInfo.selectScheme', 'Select scheme')}
                                    required
                                  />
                                ) : (
                                  <Input
                                    value={peppolSchemeCode}
                                    onChange={(e) => handleSchemeCodeChange(e.target.value)}
                                    placeholder="0208"
                                    className="font-mono"
                                    required
                                    maxLength={4}
                                  />
                                )}
                              </div>

                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.companyInfo.vatNumber', 'VAT Number')} *
                                </label>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={peppolIdentifier}
                                  onChange={(e) => handleIdentifierChange(e.target.value)}
                                  placeholder={t('peppol.setup.companyInfo.vatNumberPlaceholder', 'e.g., 0630675588')}
                                  className="font-mono"
                                  required
                                />
                              </div>
                            </div>

                            {/* Combined Peppol ID Display (read-only) */}
                            {peppolSchemeCode && peppolSettings.countryCode && peppolIdentifier && (
                              <div className="bg-muted/30 border border-border rounded-lg p-3">
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  {t('peppol.setup.companyInfo.combinedPeppolId', 'Combined Peppol ID')}
                                </label>
                                <p className="text-sm font-mono text-foreground">
                                  {combinePeppolIdWithCountry(peppolSchemeCode, peppolSettings.countryCode, peppolIdentifier)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Person Information */}
                        <div className="bg-card rounded-lg border border-border p-6">
                          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Icon name="User" size={20} />
                            {t('peppol.setup.contactPerson.title')}
                          </h3>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.contactPerson.firstName')} *
                                </label>
                                <Input
                                  value={peppolSettings.firstName || ''}
                                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                                  placeholder={t('peppol.setup.contactPerson.firstNamePlaceholder')}
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.contactPerson.lastName')} *
                                </label>
                                <Input
                                  value={peppolSettings.lastName || ''}
                                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                                  placeholder={t('peppol.setup.contactPerson.lastNamePlaceholder')}
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.contactPerson.email')} *
                                </label>
                                <Input
                                  type="email"
                                  value={peppolSettings.email || ''}
                                  onChange={(e) => handleInputChange('email', e.target.value)}
                                  placeholder={t('peppol.setup.contactPerson.emailPlaceholder')}
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.contactPerson.language')} *
                                </label>
                                <Select
                                  value={peppolSettings.language || 'en-US'}
                                  onChange={(e) => handleInputChange('language', e.target.value)}
                                  options={PEPPOL_COUNTRY_LANGUAGE_MAP}
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                  {t('peppol.setup.contactPerson.phoneNumber')}
                                </label>
                                <Input
                                  value={peppolSettings.phoneNumber || ''}
                                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                  placeholder={t('peppol.setup.contactPerson.phoneNumberPlaceholder')}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Peppol Configuration */}
                          <div className="bg-card rounded-lg border border-border p-6 mt-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                              <Icon name="Settings" size={20} />
                              {t('peppol.setup.configuration.title')}
                            </h3>

                            <div className="space-y-4">

                              {/* Sandbox Mode Toggle */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/20 rounded-lg gap-3 sm:gap-0">
                                <div>
                                  <label className="text-xs sm:text-sm font-medium text-foreground">
                                    {t('peppol.setup.configuration.sandboxMode')}
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {t('peppol.setup.configuration.sandboxModeDescription')}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleInputChange('sandboxMode', !peppolSettings.sandboxMode)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${peppolSettings.sandboxMode ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                  aria-label={peppolSettings.sandboxMode ? t('peppol.setup.configuration.sandboxModeEnabled') : t('peppol.setup.configuration.sandboxModeDisabled')}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${peppolSettings.sandboxMode ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons - Only show when not configured */}
                          {!peppolSettings.isConfigured && (
                            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 pt-4">
                              <Button
                                onClick={handleTestConnection}
                                disabled={!canEdit || isTesting || !peppolSchemeCode || !peppolIdentifier || !peppolSettings.name || !peppolSettings.email || !peppolSettings.firstName || !peppolSettings.lastName}
                                variant="outline"
                                iconName={isTesting ? "Loader2" : "Wifi"}
                                iconPosition="left"
                                className="w-full sm:w-auto"
                                title={!canEdit ? t('permissions.noFullAccess', 'You need full access to perform this action') : ''}
                              >
                                {isTesting ? t('peppol.buttons.testing') : t('peppol.buttons.test')}
                              </Button>
                              <Button
                                onClick={handleSaveSettings}
                                disabled={!canEdit || isSaving || !peppolSchemeCode || !peppolIdentifier || !peppolSettings.name || !peppolSettings.email || !peppolSettings.firstName || !peppolSettings.lastName}
                                iconName={isSaving ? "Loader2" : "Save"}
                                iconPosition="left"
                                className="w-full sm:min-w-[200px]"
                                title={!canEdit ? t('permissions.noFullAccess', 'You need full access to perform this action') : ''}
                              >
                                {isSaving
                                  ? (peppolSettings.isConfigured ? t('peppol.buttons.updating') : t('peppol.buttons.registering'))
                                  : (peppolSettings.isConfigured ? t('peppol.buttons.updateAndSave') : t('peppol.buttons.registerAndSave'))}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Show summary view when participant is already configured */
                      <div className="space-y-4">
                        <button
                          onClick={() => setShowParticipantDetails(!showParticipantDetails)}
                          className="w-full bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon name="CheckCircle" size={24} className="text-green-600 flex-shrink-0" />
                              <div className="text-left">
                                <h3 className="text-base font-semibold text-green-900">{t('peppol.setup.registered.title')}</h3>
                                <p className="text-sm text-green-700 mt-0.5">
                                  {t('peppol.setup.registered.subtitle')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-mono font-semibold">
                                {peppolSettings.peppolId}
                              </div>
                              <Icon
                                name={showParticipantDetails ? "ChevronUp" : "ChevronDown"}
                                size={20}
                                className="text-green-600"
                              />
                            </div>
                          </div>
                        </button>

                        {showParticipantDetails && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-card border border-border rounded-lg p-3">
                                <label className="text-xs text-muted-foreground">{t('peppol.setup.registered.participantName')}</label>
                                <p className="text-sm font-medium text-foreground mt-1">{peppolSettings.name || t('peppol.common.notAvailable')}</p>
                              </div>

                              <div className="bg-card border border-border rounded-lg p-3">
                                <label className="text-xs text-muted-foreground">{t('peppol.setup.registered.contactPerson')}</label>
                                <p className="text-sm font-medium text-foreground mt-1">{peppolSettings.firstName} {peppolSettings.lastName}</p>
                              </div>

                              <div className="bg-card border border-border rounded-lg p-3">
                                <label className="text-xs text-muted-foreground">{t('peppol.setup.registered.email')}</label>
                                <p className="text-sm font-medium text-foreground mt-1 break-all">{peppolSettings.email || t('peppol.common.notAvailable')}</p>
                              </div>

                              <div className="bg-card border border-border rounded-lg p-3">
                                <label className="text-xs text-muted-foreground">{t('peppol.setup.registered.language')}</label>
                                <p className="text-sm font-medium text-foreground mt-1">{peppolSettings.language || t('peppol.common.notAvailable')}</p>
                              </div>
                            </div>

                            {/* Disable/Enable Peppol Toggle */}
                            <div className="mt-4 bg-muted/20 border border-border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-semibold text-foreground mb-1">
                                    {peppolSettings.peppolDisabled ? t('peppol.setup.registered.peppolDisabled') : t('peppol.setup.registered.peppolEnabled')}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {peppolSettings.peppolDisabled
                                      ? t('peppol.setup.registered.peppolDisabledDescription')
                                      : t('peppol.setup.registered.peppolEnabledDescription')}
                                  </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer ml-4">
                                  <input
                                    type="checkbox"
                                    checked={!peppolSettings.peppolDisabled}
                                    onChange={async (e) => {
                                      const newDisabled = !e.target.checked;
                                      const result = await peppolService.togglePeppolDisabled(newDisabled);
                                      if (result.success) {
                                        setPeppolSettings(prev => ({ ...prev, peppolDisabled: newDisabled }));
                                        alert(result.message);
                                        await loadPeppolSettings();
                                      } else {
                                        alert(`${newDisabled ? t('peppol.setup.registered.failedToDisable') : t('peppol.setup.registered.failedToEnable')}: ${result.error}`);
                                      }
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sent' && (
              <div>
                {/* Filter Toolbar */}
                <div className="bg-card border border-border rounded-lg shadow-sm">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between p-3 md:p-4">
                    <div className="flex items-center space-x-2">
                      <Icon name="Filter" size={18} className="text-muted-foreground" />
                      <h3 className="text-base font-medium text-foreground">{t('peppol.filters.title')}</h3>
                      {hasActiveFilters() && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {Object.values(filters).filter(v => v !== '').length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        {t('peppol.filters.invoicesFound', { count: filteredSentInvoices.length })}
                      </span>
                      {hasActiveFilters() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8"
                        >
                          <span className="flex items-center">
                            <Icon name="X" size={14} className="mr-1" />
                            {t('peppol.filters.clear')}
                          </span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSentFiltersExpanded(!isSentFiltersExpanded)}
                        className="md:hidden h-8 w-8"
                        aria-label={isSentFiltersExpanded ? t('peppol.filters.hide') : t('peppol.filters.show')}
                      >
                        <Icon name={isSentFiltersExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Filters - Always visible on md+ screens */}
                  <div className="hidden md:block p-4 space-y-4 border-t border-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

                      {/* Status Filter */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('peppol.filters.status')}</label>
                        <Select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          placeholder={t('peppol.filters.allStatuses')}
                          options={[
                            { value: '', label: t('peppol.filters.allStatuses') },
                            { value: 'delivered', label: t('peppol.status.delivered') },
                            { value: 'pending', label: t('peppol.status.pending') },
                            { value: 'failed', label: t('peppol.status.failed') }
                          ]}
                        />
                      </div>

                      {/* Date Range */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('peppol.filters.dateRange')}</label>
                        <Select
                          value={filters.dateRange}
                          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                          placeholder={t('peppol.filters.allDates')}
                          options={[
                            { value: '', label: t('peppol.filters.allDates') },
                            { value: 'today', label: t('peppol.filters.today') },
                            { value: 'week', label: t('peppol.filters.last7Days') },
                            { value: 'month', label: t('peppol.filters.last30Days') },
                            { value: 'quarter', label: t('peppol.filters.last3Months') }
                          ]}
                        />
                      </div>

                      {/* Amount Range */}
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('peppol.filters.amountRange')}</label>
                        <Select
                          value={filters.amountRange}
                          onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                          placeholder={t('peppol.filters.allAmounts')}
                          options={[
                            { value: '', label: t('peppol.filters.allAmounts') },
                            { value: 'low', label: t('peppol.filters.lessThan1000') },
                            { value: 'medium', label: t('peppol.filters.between1000And5000') },
                            { value: 'high', label: t('peppol.filters.moreThan5000') }
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Filters - Expandable */}
                  {isSentFiltersExpanded && (
                    <div className="md:hidden p-3 space-y-4 border-t border-border">
                      <div className="space-y-3">

                        {/* Status Filter */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Statut</label>
                          <Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            placeholder="Tous les statuts"
                            options={[
                              { value: '', label: 'Tous les statuts' },
                              { value: 'delivered', label: 'Livré' },
                              { value: 'pending', label: 'En attente' },
                              { value: 'failed', label: 'Échoué' }
                            ]}
                          />
                        </div>

                        {/* Date Range */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Période</label>
                          <Select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            placeholder="Toutes les dates"
                            options={[
                              { value: '', label: 'Toutes les dates' },
                              { value: 'today', label: 'Aujourd\'hui' },
                              { value: 'week', label: '7 derniers jours' },
                              { value: 'month', label: '30 derniers jours' },
                              { value: 'quarter', label: '3 derniers mois' }
                            ]}
                          />
                        </div>

                        {/* Amount Range */}
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">Montant</label>
                          <Select
                            value={filters.amountRange}
                            onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                            placeholder="Tous les montants"
                            options={[
                              { value: '', label: 'Tous les montants' },
                              { value: 'low', label: 'Moins de 1000€' },
                              { value: 'medium', label: '1000€ - 5000€' },
                              { value: 'high', label: 'Plus de 5000€' }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Active Filters Summary (when collapsed) */}
                  {!isSentFiltersExpanded && hasActiveFilters() && (
                    <div className="md:hidden p-3 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{t('peppol.filters.activeFilters', { count: Object.values(filters).filter(v => v !== '').length })}</span>
                        <span className="text-xs ml-2">
                          {filters.search && `• ${t('peppol.filters.search')}`}
                          {filters.status && ` • ${t('peppol.filters.status')}`}
                          {filters.dateRange && ` • ${t('peppol.filters.dateRange')}`}
                          {filters.amountRange && ` • ${t('peppol.filters.amountRange')}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invoices Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden mt-4 sm:mt-6">
                  {/* Search Bar */}
                  <div className="p-3 md:p-4 border-b border-border">
                    <div className="relative">
                      <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={t('peppol.filters.searchPlaceholderSent')}
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-9 max-w-md"
                      />
                    </div>
                  </div>
                  {/* View Toggle */}
                  <div className="flex items-center p-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">{t('peppol.invoices.view')}</span>
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => setSentViewMode('table')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${sentViewMode === 'table'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <Icon name="Table" size={14} className="mr-1" />
                          {t('peppol.invoices.tableView')}
                        </button>
                        <button
                          onClick={() => setSentViewMode('card')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${sentViewMode === 'card'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <Icon name="Grid" size={14} className="mr-1" />
                          {t('peppol.invoices.cardView')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  {loadingInvoices ? (
                    <TableLoader message={t('peppol.loading.invoices')} />
                  ) : filteredSentInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Send" size={48} className="text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {peppolStats.totalSent === 0 ? t('peppol.invoices.noSentInvoices') : t('peppol.invoices.noInvoicesFound')}
                      </h3>
                      <p className="text-muted-foreground">
                        {peppolStats.totalSent === 0
                          ? t('peppol.invoices.noSentInvoicesDescription')
                          : t('peppol.invoices.noInvoicesFoundDescription')
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {sentViewMode === 'table' && renderSentTableView()}
                      {sentViewMode === 'card' && renderSentCardView()}
                    </>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'received' && (
              <div>
                {/* Filter Toolbar */}
                <div className="bg-card border border-border rounded-lg shadow-sm">
                  {/* Filter Header */}
                  <div className="flex items-center justify-between p-3 md:p-4">
                    <div className="flex items-center space-x-2">
                      <Icon name="Filter" size={18} className="text-muted-foreground" />
                      <h3 className="text-base font-medium text-foreground">{t('peppol.filters.title')}</h3>
                      {hasActiveFilters() && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                          {Object.values(filters).filter(v => v !== '').length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                        {t('peppol.filters.invoicesFound', { count: filteredReceivedInvoices.length })}
                      </span>
                      {hasActiveFilters() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-8"
                        >
                          <span className="flex items-center">
                            <Icon name="X" size={14} className="mr-1" />
                            {t('peppol.filters.clear')}
                          </span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsReceivedFiltersExpanded(!isReceivedFiltersExpanded)}
                        className="md:hidden h-8 w-8"
                        aria-label={isReceivedFiltersExpanded ? t('peppol.filters.hide') : t('peppol.filters.show')}
                      >
                        <Icon name={isReceivedFiltersExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Filters - Always visible on md+ screens */}
                  <div className="hidden md:block p-4 space-y-4 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Status Filter */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t('peppol.filters.status')}</label>
                        <Select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          placeholder={t('peppol.filters.allStatuses')}
                          options={[
                            { value: '', label: t('peppol.filters.allStatuses') },
                            { value: 'received', label: t('peppol.status.received') },
                            { value: 'processed', label: t('peppol.status.processed') },
                            { value: 'pending', label: t('peppol.status.pending') }
                          ]}
                        />
                      </div>

                      {/* Date Range */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t('peppol.filters.dateRange')}</label>
                        <Select
                          value={filters.dateRange}
                          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                          placeholder={t('peppol.filters.allDates')}
                          options={[
                            { value: '', label: t('peppol.filters.allDates') },
                            { value: 'today', label: t('peppol.filters.today') },
                            { value: 'week', label: t('peppol.filters.last7Days') },
                            { value: 'month', label: t('peppol.filters.last30Days') },
                            { value: 'quarter', label: t('peppol.filters.last3Months') }
                          ]}
                        />
                      </div>

                      {/* Amount Range */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t('peppol.filters.amountRange')}</label>
                        <Select
                          value={filters.amountRange}
                          onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                          placeholder={t('peppol.filters.allAmounts')}
                          options={[
                            { value: '', label: t('peppol.filters.allAmounts') },
                            { value: 'low', label: t('peppol.filters.lessThan1000') },
                            { value: 'medium', label: t('peppol.filters.between1000And5000') },
                            { value: 'high', label: t('peppol.filters.moreThan5000') }
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Filters - Expandable */}
                  {isReceivedFiltersExpanded && (
                    <div className="md:hidden p-3 space-y-4 border-t border-border">
                      <div className="space-y-3">
                        {/* Status Filter */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">{t('peppol.filters.status')}</label>
                          <Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            placeholder={t('peppol.filters.allStatuses')}
                            options={[
                              { value: '', label: t('peppol.filters.allStatuses') },
                              { value: 'received', label: t('peppol.status.received') },
                              { value: 'processed', label: t('peppol.status.processed') },
                              { value: 'pending', label: t('peppol.status.pending') }
                            ]}
                          />
                        </div>

                        {/* Date Range */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">{t('peppol.filters.dateRange')}</label>
                          <Select
                            value={filters.dateRange}
                            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                            placeholder={t('peppol.filters.allDates')}
                            options={[
                              { value: '', label: t('peppol.filters.allDates') },
                              { value: 'today', label: t('peppol.filters.today') },
                              { value: 'week', label: t('peppol.filters.last7Days') },
                              { value: 'month', label: t('peppol.filters.last30Days') },
                              { value: 'quarter', label: t('peppol.filters.last3Months') }
                            ]}
                          />
                        </div>

                        {/* Amount Range */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">{t('peppol.filters.amountRange')}</label>
                          <Select
                            value={filters.amountRange}
                            onChange={(e) => handleFilterChange('amountRange', e.target.value)}
                            placeholder={t('peppol.filters.allAmounts')}
                            options={[
                              { value: '', label: t('peppol.filters.allAmounts') },
                              { value: 'low', label: t('peppol.filters.lessThan1000') },
                              { value: 'medium', label: t('peppol.filters.between1000And5000') },
                              { value: 'high', label: t('peppol.filters.moreThan5000') }
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mobile Active Filters Summary (when collapsed) */}
                  {!isReceivedFiltersExpanded && hasActiveFilters() && (
                    <div className="md:hidden p-3 border-t border-border">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{t('peppol.filters.activeFilters', { count: Object.values(filters).filter(v => v !== '').length })}</span>
                        <span className="text-xs ml-2">
                          {filters.search && `• ${t('peppol.filters.search')}`}
                          {filters.status && ` • ${t('peppol.filters.status')}`}
                          {filters.dateRange && ` • ${t('peppol.filters.dateRange')}`}
                          {filters.amountRange && ` • ${t('peppol.filters.amountRange')}`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Invoices Table */}
                <div className="bg-card border border-border rounded-lg overflow-hidden mt-4 sm:mt-6">
                  {/* Search Bar */}
                  <div className="p-3 md:p-4 border-b border-border">
                    <div className="relative">
                      <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder={t('peppol.filters.searchPlaceholderReceived')}
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="pl-9 max-w-md"
                      />
                    </div>
                  </div>
                  {/* View Toggle */}
                  <div className="flex items-center p-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">{t('peppol.invoices.view')}</span>
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => setReceivedViewMode('table')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${receivedViewMode === 'table'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <Icon name="Table" size={14} className="mr-1" />
                          {t('peppol.invoices.tableView')}
                        </button>
                        <button
                          onClick={() => setReceivedViewMode('card')}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${receivedViewMode === 'card'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                          <Icon name="Grid" size={14} className="mr-1" />
                          {t('peppol.invoices.cardView')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  {loadingInvoices ? (
                    <TableLoader message={t('peppol.loading.invoices')} />
                  ) : filteredReceivedInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <Icon name="Download" size={48} className="text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        {peppolStats.totalReceived === 0 ? t('peppol.invoices.noReceivedInvoices') : t('peppol.invoices.noInvoicesFound')}
                      </h3>
                      <p className="text-muted-foreground">
                        {peppolStats.totalReceived === 0
                          ? t('peppol.invoices.noReceivedInvoicesDescription')
                          : t('peppol.invoices.noInvoicesFoundDescription')
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {receivedViewMode === 'table' && renderReceivedTableView()}
                      {receivedViewMode === 'card' && renderReceivedCardView()}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );

  return (
    <PermissionGuard module="peppolAccessPoint" requiredPermission="view_only">
      {peppolLimitReached ? (
        <LimitedAccessGuard
          requiredPlan="pro"
          featureName={t('peppol.header.title', 'Peppol Network')}
          customMessage={t('peppol.limitReached', 'You have reached the maximum number of Peppol invoices ({{max}} per month) on your Starter plan. You have used {{used}} of {{max}}. Upgrade to Pro for unlimited Peppol invoices.', { 
            max: peppolUsage.limit, 
            used: peppolUsage.usage 
          })}
          showBanner={true}
        >
          {renderContent()}
        </LimitedAccessGuard>
      ) : (
        renderContent()
      )}
    </PermissionGuard>
  );
};

export default PeppolNetworkPage; 