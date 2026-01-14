import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MainSidebar from '../../../components/ui/MainSidebar';
import PermissionGuard, { usePermissionCheck } from '../../../components/PermissionGuard';
import LimitedAccessGuard from '../../../components/LimitedAccessGuard';
import TableLoader from '../../../components/ui/TableLoader';
import Pagination from '../../../components/ui/Pagination';
import SortableHeader from '../../../components/ui/SortableHeader';
import { useMultiUser } from '../../../context/MultiUserContext';
import { useAuth } from '../../../context/AuthContext';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import PeppolService from '../../../services/peppolService';
import { supabase } from '../../../services/supabaseClient';
import { COUNTRY_CODES, searchCountries } from '../../../utils/countryCodes';
import { getPeppolVATSchemeId, parsePeppolId, combinePeppolId, PEPPOL_COUNTRY_LANGUAGE_MAP } from '../../../utils/peppolSchemes';
import { loadCompanyInfo } from '../../../services/companyInfoService';
import { validateVATNumber, getExpectedFormat, VAT_VALIDATION_RULES } from '../../../utils/vatNumberValidation';
import { getClientCountryOptions } from '../../../utils/countryList';
import { getStarterLimit } from '../../../config/subscriptionFeatures';
import { formatCurrency } from '../../../utils/numberFormat';

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

  // Check environment variable for production mode
  const isProductionMode = import.meta.env.VITE_PEPPOL_TEST_MODE !== 'true';
  
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
    sandboxMode: !isProductionMode, // Default to false in production, true in test
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
  const [sentSortConfig, setSentSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [receivedSortConfig, setReceivedSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [sentCurrentPage, setSentCurrentPage] = useState(1);
  const [receivedCurrentPage, setReceivedCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
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
  const [vatValidationError, setVatValidationError] = useState('');

  // Create PeppolService instance - will be recreated when sandboxMode changes
  const peppolService = React.useMemo(() => new PeppolService(peppolSettings.sandboxMode), [peppolSettings.sandboxMode]);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    return searchCountries(countrySearchQuery);
  }, [countrySearchQuery]);

  // Auto-fill scheme code when country is set
  // For Belgium: prefer 9925 (VAT scheme) to avoid MOD97 validation issues, but allow 0208
  // For other countries: use VAT scheme
  useEffect(() => {
    if (peppolSettings.countryCode) {
      const countryCode = peppolSettings.countryCode.toUpperCase();
      if (countryCode === 'BE') {
        // Belgium: prefer 9925 (VAT scheme) as default to avoid MOD97-0208 validation issues
        // Both 0208 and 9925 will be registered, but we save 9925 as primary
        // Only set if not already one of the valid Belgium schemes
        if (!peppolSchemeCode || (peppolSchemeCode !== '0208' && peppolSchemeCode !== '9925')) {
          setPeppolSchemeCode('9925'); // Default to 9925 for Belgium
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
            peppolId: loaded.peppolId || prev.peppolId, // Set peppolId from database
            name: loaded.name || prev.name,
            email: loaded.email || prev.email,
            countryCode: loaded.countryCode || prev.countryCode,
            phoneNumber: loaded.phoneNumber || prev.phoneNumber,
            firstName: loaded.firstName || prev.firstName,
            lastName: loaded.lastName || prev.lastName,
            language: loaded.language || prev.language,
            supportedDocumentTypes: loaded.supportedDocumentTypes || prev.supportedDocumentTypes,
            limitedToOutboundTraffic: loaded.limitedToOutboundTraffic !== undefined ? loaded.limitedToOutboundTraffic : prev.limitedToOutboundTraffic,
            // In production mode, force sandboxMode to false regardless of saved value
            sandboxMode: isProductionMode ? false : (loaded.sandboxMode !== undefined ? loaded.sandboxMode : prev.sandboxMode),
            // If Peppol is disabled, treat as not configured so user can re-register
            isConfigured: (loaded.isConfigured && !loaded.peppolDisabled) || false,
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
      // Error loading Peppol settings
    }
  };

  // Load Peppol invoices (for sent/received tabs)
  const loadPeppolInvoices = async () => {
    try {
      setLoadingInvoices(true);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        // User not authenticated
        return;
      }

      // Load sent invoices (from invoices table where peppol_enabled = true)
      // Only show invoices for professional clients (client_type = 'company')
      // Show all invoices sent via Peppol, regardless of payment status
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
        .not('peppol_sent_at', 'is', null) // Only show invoices that have been sent via Peppol
        .order('peppol_sent_at', { ascending: false });

      // Get current user's Peppol ID to filter received invoices
      // Only show invoices received for the current Peppol ID (not old IDs from previous registrations)
      const { data: currentPeppolSettings } = await supabase
        .from('peppol_settings')
        .select('peppol_id')
        .eq('user_id', user.id)
        .single();

      const currentPeppolId = currentPeppolSettings?.peppol_id;

      // Load received invoices (from expense_invoices table where peppol_enabled = true)
      // Directly query expense_invoices - invoices received via Peppol are stored here with user_id = current user
      const { data: expenseInvoicesData, error: receivedError } = await supabase
        .from('expense_invoices')
        .select(`
          id,
          invoice_number,
          supplier_name,
          supplier_email,
          amount,
          issue_date,
          due_date,
          status,
          peppol_message_id,
          peppol_received_at,
          sender_peppol_id
        `)
        .eq('user_id', user.id)
        .eq('peppol_enabled', true)
        .eq('source', 'peppol') // Only show invoices received via Peppol
        .not('peppol_received_at', 'is', null) // Only show invoices that were actually received
        .order('peppol_received_at', { ascending: false });

      const receivedInvoicesData = receivedError ? [] : (expenseInvoicesData || []);

      if (sentError) {
        // Error loading sent invoices
      }

      // Transform sent invoices to match expected format
      // Filter to only include invoices for professional clients (client_type = 'company')
      // Show all invoices sent via Peppol, regardless of payment status
      const sent = (sentInvoicesData || [])
        .filter(inv => inv.clients?.client_type === 'company') // Only professional clients
        .map(inv => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          recipient_name: inv.clients?.name || 'Unknown Client',
          recipient_email: inv.clients?.email || '',
          peppol_identifier: inv.receiver_peppol_id || inv.clients?.peppol_id || 'N/A',
          total_amount: parseFloat(inv.final_amount || inv.amount || 0),
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          status: inv.peppol_status || 'sent', // Use Peppol status (sent, failed, error) instead of payment status
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
        status: 'received', // Received invoices are always 'received' status for Peppol
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
      // Error loading Peppol invoices
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
          // Check if error is network-related - don't navigate to login if it's a network error
          const isNetworkError = userError?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                                userError?.message?.includes('ERR_NETWORK') ||
                                userError?.message?.includes('Failed to fetch') ||
                                userError?.message?.includes('NetworkError') ||
                                userError?.code === 'PGRST301' ||
                                userError?.code === 'PGRST302' ||
                                userError?.code === 'PGRST303';
          
          // Only navigate to login if it's not a network error
          // Network errors will be handled by PermissionGuard's internet connectivity check
          if (!isNetworkError) {
          navigate('/login');
          }
          return;
        }

        // Get user business information
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('business_size, company_name, vat_number, first_name, last_name, email, phone, country')
          .eq('id', user.id)
          .single();

        if (userDataError) {
          // Error fetching user data
          return;
        }

        // Construct full_name from first_name and last_name
        const fullName = userData.first_name && userData.last_name
          ? `${userData.first_name} ${userData.last_name}`.trim()
          : userData.first_name || userData.last_name || '';

        setUserBusinessInfo({ ...userData, full_name: fullName });

        // Allow all users to access Peppol regardless of business size
        // (solo users may still have companies)
        setIsBusinessUser(true);

        // Load company info from company_profiles table
        let companyInfo = null;
        try {
          companyInfo = await loadCompanyInfo(user.id);
        } catch (error) {
          // Error loading company info
        }

        // Pre-fill Peppol settings from company info and user data if not already configured
        // Allow all users regardless of business size
        if (!peppolSettings.isConfigured) {
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
              // Belgium: prefer 9925 (VAT scheme) to avoid MOD97 validation issues
              setPeppolSchemeCode('9925');
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

        // Load Peppol settings for all users (no business size restriction)
        // Load Peppol settings after auto-filling (so auto-filled values are preserved)
        await loadPeppolSettings();
        setLoadedTabs(prev => ({ ...prev, setup: true }));

        // Load invoice data immediately to populate KPI cards and stats
        await loadPeppolInvoices();
        setLoadedTabs(prev => ({ ...prev, sent: true, received: true }));

        // Set loading to false only after we've determined the user type
        setLoading(false);
        setIsInitialized(true);
        // Dispatch event to signal page loading is complete
        window.dispatchEvent(new CustomEvent('page-loaded'));
      } catch (error) {
        // Error checking business user
        setLoading(false);
        setIsInitialized(true);
        // Dispatch event to signal page loading is complete
        window.dispatchEvent(new CustomEvent('page-loaded'));
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
      // Peppol-specific statuses only
      case 'sent':
        return 'bg-success/10 text-success';
      case 'failed':
      case 'error':
        return 'bg-error/10 text-error';
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
      // Peppol-specific statuses only (no payment statuses)
      case 'sent':
        return t('peppol.status.sent', 'Sent');
      case 'failed':
        return t('peppol.status.failed', 'Failed');
      case 'error':
        return t('peppol.status.error', 'Error');
      case 'delivered':
        return t('peppol.status.delivered', 'Delivered');
      case 'received':
        return t('peppol.status.received', 'Received');
      case 'processed':
        return t('peppol.status.processed', 'Processed');
      case 'pending':
        return t('peppol.status.pending', 'Pending');
      default:
        return t('peppol.status.unknown', 'Unknown');
    }
  };

  // Helper function to extract VAT number from Peppol ID
  // Examples: "9957:fr1001464622" -> "FR1001464622", "9925:be0630675588" -> "BE0630675588", "0208:0630675588" -> "BE0630675588"
  const extractVATFromPeppolId = (peppolId) => {
    if (!peppolId) return '';
    const parts = peppolId.split(':');
    if (parts.length !== 2) return '';
    
    const scheme = parts[0];
    const identifier = parts[1];
    
    // For Belgian enterprise number (0208), add BE prefix
    if (scheme === '0208') {
      return `BE${identifier}`;
    }
    
    // For VAT-based schemes (9925, 9957, etc.), identifier already contains country code
    // Extract country code and VAT number
    if (/^[a-z]{2}\d+/i.test(identifier)) {
      return identifier.toUpperCase();
    }
    
    // If no country code in identifier, return as-is (shouldn't happen for valid IDs)
    return identifier;
  };

  // Helper function to normalize VAT numbers for comparison (remove country prefix, spaces, etc.)
  const normalizeVATForComparison = (vatNumber) => {
    if (!vatNumber) return '';
    // Remove country prefix if present
    let cleaned = vatNumber.replace(/^[A-Z]{2}/i, '');
    // Remove all non-numeric characters
    cleaned = cleaned.replace(/\D/g, '');
    return cleaned;
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      // Validate VAT number matches company info if Peppol is already configured
      if (peppolSettings.isConfigured && peppolSettings.peppolId) {
        try {
          const companyInfo = await loadCompanyInfo(user?.id);
          if (companyInfo?.vatNumber) {
            // Extract VAT from existing Peppol ID
            const existingPeppolVAT = extractVATFromPeppolId(peppolSettings.peppolId);
            const existingPeppolVATNormalized = normalizeVATForComparison(existingPeppolVAT);
            const companyVATNormalized = normalizeVATForComparison(companyInfo.vatNumber);
            
            // Check if new VAT number matches company VAT
            const newVATNormalized = normalizeVATForComparison(peppolIdentifier);
            
            // If company has VAT and it doesn't match the new Peppol VAT, show warning
            if (companyVATNormalized && newVATNormalized && companyVATNormalized !== newVATNormalized) {
              setErrorMessage(t('peppol.messages.errors.vatMismatch', 'VAT number does not match company information. Please update your company profile VAT number to match Peppol registration.'));
              setIsSaving(false);
              return;
            }
          }
        } catch (error) {
          // If we can't load company info, continue anyway
        }
      }

      // For Belgium: register both 0208 and 9925 schemes
      // For other countries: use the selected scheme code
      let combinedPeppolId;
      const isBelgium = peppolSettings.countryCode?.toUpperCase() === 'BE';
      
      if (isBelgium) {
        // For Belgium, prefer 9925 (VAT scheme) as the primary ID to save
        // Backend will register both 0208 and 9925, but we save 9925 to avoid MOD97 validation issues
        // 9925 scheme doesn't require MOD97-0208 validation, making it more reliable
        combinedPeppolId = combinePeppolIdWithCountry('9925', peppolSettings.countryCode, peppolIdentifier);
      } else {
        // For other countries, use the selected scheme code
        combinedPeppolId = combinePeppolIdWithCountry(peppolSchemeCode, peppolSettings.countryCode, peppolIdentifier);
      }

      // Automatically set all document types before saving
      // In production mode, force sandboxMode to false
      const settingsToSave = {
        ...peppolSettings,
        peppolId: combinedPeppolId, // Ensure combined ID is used
        supportedDocumentTypes: ALL_DOCUMENT_TYPES,
        isBelgium: isBelgium, // Flag to indicate Belgium for dual registration
        vatNumber: peppolIdentifier, // Pass VAT number separately for Belgium dual registration
        sandboxMode: isProductionMode ? false : peppolSettings.sandboxMode // Force false in production
      };
      
      // After successful save, update company info VAT number to match if needed
      const result = await peppolService.savePeppolSettings(settingsToSave);
      
      // If Peppol registration succeeded, sync VAT number to company info
      if (result.success) {
        try {
          const companyInfo = await loadCompanyInfo(user?.id);
          if (companyInfo) {
            // Extract VAT from Peppol ID
            const peppolVAT = extractVATFromPeppolId(combinedPeppolId);
            const peppolVATNormalized = normalizeVATForComparison(peppolVAT);
            const companyVATNormalized = normalizeVATForComparison(companyInfo.vatNumber || '');
            
            // If VAT numbers don't match, update company info
            if (peppolVATNormalized && companyVATNormalized !== peppolVATNormalized) {
              const { saveCompanyInfo } = await import('../../../services/companyInfoService');
              await saveCompanyInfo({
                ...companyInfo,
                vatNumber: peppolVAT // Use the VAT from Peppol ID
              }, user?.id);
            }
          }
        } catch (error) {
          // If sync fails, don't block the success - just log it
        }
      }
      
      if (result.success) {
        // Reload settings from database to ensure we have the latest state
        await loadPeppolSettings();
        setSuccessMessage(result.message || t('peppol.messages.success.settingsSaved'));
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        // Check if result exists and if participant is already registered
        if (result && result.alreadyRegistered) {
          // Show different message based on where it's registered
          const message = result.registeredWithDigiteal
            ? t('peppol.messages.success.alreadyRegisteredDigiteal')
            : t('peppol.messages.success.alreadyRegisteredPeppol');
          setSuccessMessage(message);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          // Show the actual error message from API (concise)
          const errorMsg = (result && result.error) || t('peppol.messages.errors.saveError');
          // Extract just the main message if it's too long
          const conciseError = errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg;
          setErrorMessage(conciseError);
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    } catch (error) {
      // Extract user-friendly error message, skip generic Supabase errors
      let errorMsg = error.message || t('peppol.messages.errors.saveError');
      
      // Skip generic error messages
      if (errorMsg.includes('non-2xx') || 
          errorMsg.includes('Edge Function returned') ||
          errorMsg.includes('Function returned')) {
        errorMsg = t('peppol.messages.errors.saveError');
      }
      
      // Make error concise (max 100 chars)
      const conciseError = errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg;
      setErrorMessage(conciseError);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
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
        setSuccessMessage(result.message || t('peppol.messages.success.testSuccessful'));
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        // Check if result exists and if participant is already registered - this is actually OK
        if (result && result.alreadyRegistered) {
          if (result.registeredWithDigiteal) {
            // Already registered with Digiteal
            setSuccessMessage(t('peppol.messages.success.testAlreadyRegisteredDigiteal'));
            setTimeout(() => setSuccessMessage(null), 5000);
          } else if (result.needsTransfer) {
            // Registered with another Access Point - needs transfer
            setErrorMessage(t('peppol.messages.errors.alreadyRegisteredAnotherAP'));
            setTimeout(() => setErrorMessage(null), 5000);
          } else {
            // Already registered in Peppol (global)
            setSuccessMessage(t('peppol.messages.success.testAlreadyRegisteredPeppol'));
            setTimeout(() => setSuccessMessage(null), 5000);
          }
        } else {
          // Actual test failure
          setErrorMessage((result && result.error) || t('peppol.messages.errors.testError'));
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    } catch (error) {
      setErrorMessage(error.message || t('peppol.messages.errors.testConnectionError'));
      setTimeout(() => setErrorMessage(null), 5000);
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
        // Belgium: prefer 9925 (VAT scheme) to avoid MOD97 validation issues
        setPeppolSchemeCode('9925');
        // Update combined Peppol ID when country changes
        if (peppolIdentifier) {
          const combined = combinePeppolIdWithCountry('9925', value, peppolIdentifier);
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
      
      // Re-validate VAT number when country changes (only check count)
      if (peppolIdentifier && peppolIdentifier.trim()) {
        const isCompanyNumber = peppolSchemeCode === '0208' && countryCodeUpper === 'BE';
        const validation = validatePeppolIdentifierCount(peppolIdentifier, countryCodeUpper, isCompanyNumber);
        
        if (!validation.isValid) {
          setVatValidationError(validation.error || 'Invalid count');
        } else {
          setVatValidationError('');
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
    
    // Re-validate VAT number when scheme changes (only check count)
    if (peppolIdentifier && peppolIdentifier.trim()) {
      const countryCode = peppolSettings.countryCode?.toUpperCase() || 'BE';
      const isCompanyNumber = value === '0208' && countryCode === 'BE';
      const validation = validatePeppolIdentifierCount(peppolIdentifier, countryCode, isCompanyNumber);
      
      if (!validation.isValid) {
        setVatValidationError(validation.error || 'Invalid count');
      } else {
        setVatValidationError('');
      }
    }
  };

  // Combine scheme code, country code, and VAT number into full Peppol ID
  // For Belgium:
  //   - 0208: Company Number without BE (e.g., 0208:0630675588)
  //   - 9925: BE + company Number (e.g., 9925:BE0630675588)
  // For other countries:
  //   - Format: {SCHEME_ID}:{COUNTRY_CODE_LOWERCASE}{VAT_NUMBER} (e.g., 9957:fr12345678901)
  //   - Digiteal API requires lowercase country code in identifier
  // Helper function to shorten Peppol ID for display (shows scheme:shortened-id)
  // Only shortens on mobile when there are multiple IDs (Belgium case)
  const shortenPeppolIdForDisplay = (fullId, shouldShorten = false) => {
    if (!fullId) return '';
    if (!shouldShorten) return fullId; // Don't shorten if not needed
    const parts = fullId.split(':');
    if (parts.length !== 2) return fullId;
    const [scheme, identifier] = parts;
    // Show first 6 chars of identifier + ... if longer
    const shortId = identifier.length > 6 ? `${identifier.substring(0, 6)}...` : identifier;
    return `${scheme}:${shortId}`;
  };

  const combinePeppolIdWithCountry = (schemeCode, countryCode, vatNumber) => {
    if (!schemeCode || !countryCode || !vatNumber) {
      return '';
    }
    
    const countryCodeUpper = countryCode.toUpperCase();
    const countryCodeLower = countryCode.toLowerCase();
    
    // Belgium-specific handling
    if (countryCodeUpper === 'BE') {
      if (schemeCode === '0208') {
        // 0208: Company Number without BE prefix
        return `${schemeCode}:${vatNumber}`;
      } else if (schemeCode === '9925') {
        // 9925: BE + company Number (lowercase for Digiteal API)
        return `${schemeCode}:${countryCodeLower}${vatNumber}`;
      }
    }
    
    // Default format for other countries: {SCHEME_ID}:{COUNTRY_CODE_LOWERCASE}{VAT_NUMBER}
    // Digiteal API requires lowercase country code (e.g., 9957:fr12345678901, not 9957:FR12345678901)
    return `${schemeCode}:${countryCodeLower}${vatNumber}`;
  };

  // Simple validation for Peppol page - only checks digit/character count, not format
  // Users don't need to enter country codes - we just check the count
  const validatePeppolIdentifierCount = (identifier, countryCode, isCompanyNumber) => {
    if (!identifier || !identifier.trim()) {
      return { isValid: true, error: '', expectedCount: null };
    }
    
    const country = countryCode?.toUpperCase() || 'BE';
    const rules = VAT_VALIDATION_RULES[country];
    
    if (!rules) {
      return { isValid: true, error: '', expectedCount: null };
    }
    
    // For Belgium company number (0208 scheme), check only digit count
    if (country === 'BE' && isCompanyNumber && rules.companyNumber) {
      const digitsOnly = identifier.replace(/\D/g, '');
      const expectedDigits = rules.companyNumber.minLength;
      
      if (digitsOnly.length !== expectedDigits) {
        return {
          isValid: false,
          error: `You entered ${digitsOnly.length} digit(s), but ${expectedDigits} digit(s) are required.`,
          expectedCount: expectedDigits
        };
      }
      return { isValid: true, error: '', expectedCount: expectedDigits };
    }
    
    // For VAT numbers, check digit/character count only (ignore any prefixes or format)
    // Just count digits/characters - don't check format
    if (rules.vatNumber) {
      // Calculate expected count (without country prefix)
      let expectedCount;
      let isAlphanumeric = false;
      
      if (country === 'CH') {
        // Switzerland: 6 digits
        expectedCount = 6;
        isAlphanumeric = false;
      } else if (country === 'AT') {
        // Austria: 8 digits
        expectedCount = 8;
        isAlphanumeric = false;
      } else if (country === 'NL') {
        // Netherlands: 9 digits
        expectedCount = 9;
        isAlphanumeric = false;
      } else if (country === 'ES') {
        // Spain: 9 alphanumeric characters
        expectedCount = 9;
        isAlphanumeric = true;
      } else if (country === 'IE') {
        // Ireland: 8-9 characters total (7 digits + 1-2 alphanumeric)
        expectedCount = 8;
        isAlphanumeric = true;
      } else {
        // Standard: just count digits (country prefix will be added automatically)
        expectedCount = rules.vatNumber.minLength - 2;
        isAlphanumeric = false;
      }
      
      // Count digits/characters in the entire input (ignore prefixes/suffixes)
      const count = isAlphanumeric 
        ? identifier.replace(/[^A-Z0-9]/gi, '').length 
        : identifier.replace(/\D/g, '').length;
      
      if (country === 'IE') {
        // Ireland: 8-9 characters total
        if (count < 8 || count > 9) {
          return {
            isValid: false,
            error: `You entered ${count} character(s), but 8-9 characters are required.`,
            expectedCount: expectedCount
          };
        }
      } else if (count !== expectedCount) {
        return {
          isValid: false,
          error: `You entered ${count} ${isAlphanumeric ? 'character(s)' : 'digit(s)'}, but ${expectedCount} ${isAlphanumeric ? 'characters' : 'digits'} are required.`,
          expectedCount: expectedCount
        };
      }
      
      return { isValid: true, error: '', expectedCount: expectedCount };
    }
    
    return { isValid: true, error: '', expectedCount: null };
  };

  const handleIdentifierChange = (value) => {
    // For Belgium 0208 scheme, only allow digits
    const countryCode = peppolSettings.countryCode?.toUpperCase() || 'BE';
    const isCompanyNumber = peppolSchemeCode === '0208' && countryCode === 'BE';
    
    let cleanedValue = value;
    if (isCompanyNumber) {
      cleanedValue = cleanedValue.replace(/\D/g, '');
    }
    
    // Simple validation - only check count, not format
    if (cleanedValue && cleanedValue.trim()) {
      const validation = validatePeppolIdentifierCount(cleanedValue, countryCode, isCompanyNumber);
      
      if (!validation.isValid) {
        setVatValidationError(validation.error || 'Invalid count');
      } else {
        setVatValidationError('');
      }
    } else {
      setVatValidationError('');
    }
    
    setPeppolIdentifier(cleanedValue);
    // Update combined Peppol ID with format: {SCHEME_ID}:{COUNTRY_CODE}{VAT_NUMBER}
    const combined = combinePeppolIdWithCountry(peppolSchemeCode, peppolSettings.countryCode, cleanedValue);
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

    const filteredSent = applyFilters(sentInvoices, true);
    const filteredReceived = applyFilters(receivedInvoices, false);
    
    // Sort sent invoices
    const sortedSent = [...filteredSent].sort((a, b) => {
      let aValue, bValue;
      
      if (sentSortConfig.key === 'id') {
        aValue = a.id || '';
        bValue = b.id || '';
        // Extract numeric part for proper sorting
        const aNum = parseInt((aValue.toString() || '').replace(/\D/g, '')) || 0;
        const bNum = parseInt((bValue.toString() || '').replace(/\D/g, '')) || 0;
        aValue = aNum;
        bValue = bNum;
      } else {
        aValue = a[sentSortConfig.key === 'date' ? 'date' : sentSortConfig.key === 'amount' ? 'amount' : 'recipient'];
        bValue = b[sentSortConfig.key === 'date' ? 'date' : sentSortConfig.key === 'amount' ? 'amount' : 'recipient'];
        
        if (sentSortConfig.key === 'date') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        } else if (sentSortConfig.key === 'amount') {
          aValue = parseFloat(aValue || 0);
          bValue = parseFloat(bValue || 0);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }
      }
      
      if (aValue < bValue) return sentSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sentSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Sort received invoices
    const sortedReceived = [...filteredReceived].sort((a, b) => {
      let aValue, bValue;
      
      if (receivedSortConfig.key === 'id') {
        aValue = a.id || '';
        bValue = b.id || '';
        // Extract numeric part for proper sorting
        const aNum = parseInt((aValue.toString() || '').replace(/\D/g, '')) || 0;
        const bNum = parseInt((bValue.toString() || '').replace(/\D/g, '')) || 0;
        aValue = aNum;
        bValue = bNum;
      } else {
        aValue = a[receivedSortConfig.key === 'date' ? 'date' : receivedSortConfig.key === 'amount' ? 'amount' : 'sender'];
        bValue = b[receivedSortConfig.key === 'date' ? 'date' : receivedSortConfig.key === 'amount' ? 'amount' : 'sender'];
        
        if (receivedSortConfig.key === 'date') {
          aValue = new Date(aValue || 0);
          bValue = new Date(bValue || 0);
        } else if (receivedSortConfig.key === 'amount') {
          aValue = parseFloat(aValue || 0);
          bValue = parseFloat(bValue || 0);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = (bValue || '').toLowerCase();
        }
      }
      
      if (aValue < bValue) return receivedSortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return receivedSortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredSentInvoices(sortedSent);
    setFilteredReceivedInvoices(sortedReceived);
    
    // Reset pages when filters change
    setSentCurrentPage(1);
    setReceivedCurrentPage(1);
  }, [filters, sentInvoices, receivedInvoices, sentSortConfig, receivedSortConfig]);
  
  // Pagination for sent invoices
  const sentTotalPages = Math.ceil(filteredSentInvoices.length / itemsPerPage);
  const sentStartIndex = (sentCurrentPage - 1) * itemsPerPage;
  const sentEndIndex = sentStartIndex + itemsPerPage;
  const paginatedSentInvoices = filteredSentInvoices.slice(sentStartIndex, sentEndIndex);
  
  // Pagination for received invoices
  const receivedTotalPages = Math.ceil(filteredReceivedInvoices.length / itemsPerPage);
  const receivedStartIndex = (receivedCurrentPage - 1) * itemsPerPage;
  const receivedEndIndex = receivedStartIndex + itemsPerPage;
  const paginatedReceivedInvoices = filteredReceivedInvoices.slice(receivedStartIndex, receivedEndIndex);
  
  const handleSentSort = (key) => {
    setSentSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };
  
  const handleReceivedSort = (key) => {
    setReceivedSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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
            <SortableHeader 
              label={t('peppol.invoices.invoiceNumber')}
              sortKey="id"
              currentSortKey={sentSortConfig.key}
              sortDirection={sentSortConfig.direction}
              onSort={handleSentSort}
              showIcon={true}
            />
            <SortableHeader 
              label={t('peppol.invoices.recipient')}
              sortKey="recipient"
              currentSortKey={sentSortConfig.key}
              sortDirection={sentSortConfig.direction}
              onSort={handleSentSort}
              showIcon={false}
            />
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.peppolId')}</th>
            <SortableHeader 
              label={t('peppol.invoices.amount')}
              sortKey="amount"
              currentSortKey={sentSortConfig.key}
              sortDirection={sentSortConfig.direction}
              onSort={handleSentSort}
              showIcon={true}
            />
            <SortableHeader 
              label={t('peppol.invoices.date')}
              sortKey="date"
              currentSortKey={sentSortConfig.key}
              sortDirection={sentSortConfig.direction}
              onSort={handleSentSort}
              showIcon={true}
            />
            <th className="text-left p-3 sm:p-4 font-medium text-xs sm:text-sm">{t('peppol.invoices.status')}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedSentInvoices.map((invoice) => (
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
                {formatCurrency(invoice.amount)}
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
      {filteredSentInvoices.length > itemsPerPage && (
        <div className="mt-4 px-4 pb-4">
          <Pagination
            currentPage={sentCurrentPage}
            totalPages={sentTotalPages}
            totalItems={filteredSentInvoices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setSentCurrentPage}
          />
        </div>
      )}
    </div>
  );

  const renderSentCardView = () => (
    <div className="p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {paginatedSentInvoices.map((invoice) => (
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
                <p className="text-xs font-medium text-foreground">{formatCurrency(invoice.amount)}</p>
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
      {filteredSentInvoices.length > itemsPerPage && (
        <div className="mt-4 px-4 pb-4">
          <Pagination
            currentPage={sentCurrentPage}
            totalPages={sentTotalPages}
            totalItems={filteredSentInvoices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setSentCurrentPage}
          />
        </div>
      )}
    </div>
  );

  const renderReceivedTableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <SortableHeader 
              label={t('peppol.invoices.invoiceNumber')}
              sortKey="id"
              currentSortKey={receivedSortConfig.key}
              sortDirection={receivedSortConfig.direction}
              onSort={handleReceivedSort}
              showIcon={true}
            />
            <SortableHeader 
              label={t('peppol.invoices.sender')}
              sortKey="sender"
              currentSortKey={receivedSortConfig.key}
              sortDirection={receivedSortConfig.direction}
              onSort={handleReceivedSort}
              showIcon={false}
            />
            <SortableHeader 
              label={t('peppol.invoices.amount')}
              sortKey="amount"
              currentSortKey={receivedSortConfig.key}
              sortDirection={receivedSortConfig.direction}
              onSort={handleReceivedSort}
              showIcon={true}
            />
            <SortableHeader 
              label={t('peppol.invoices.date')}
              sortKey="date"
              currentSortKey={receivedSortConfig.key}
              sortDirection={receivedSortConfig.direction}
              onSort={handleReceivedSort}
              showIcon={true}
            />
            <th className="text-left p-4 font-medium">{t('peppol.invoices.peppolId')}</th>
            <th className="text-left p-4 font-medium">{t('peppol.invoices.status')}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedReceivedInvoices.map((invoice) => (
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
                {formatCurrency(invoice.amount)}
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
      {filteredReceivedInvoices.length > itemsPerPage && (
        <div className="mt-4 px-4 pb-4">
          <Pagination
            currentPage={receivedCurrentPage}
            totalPages={receivedTotalPages}
            totalItems={filteredReceivedInvoices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setReceivedCurrentPage}
          />
        </div>
      )}
    </div>
  );

  const renderReceivedCardView = () => (
    <div className="p-2 sm:p-3 md:p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {paginatedReceivedInvoices.map((invoice) => (
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
                <p className="text-xs font-medium text-foreground">{formatCurrency(invoice.amount)}</p>
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
      {filteredReceivedInvoices.length > itemsPerPage && (
        <div className="mt-4 px-4 pb-4">
          <Pagination
            currentPage={receivedCurrentPage}
            totalPages={receivedTotalPages}
            totalItems={filteredReceivedInvoices.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setReceivedCurrentPage}
          />
        </div>
      )}
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
          limit: peppolQuota.limit || getStarterLimit('peppolInvoicesPerMonth'),
          withinLimit: peppolQuota.withinLimit || false
        });
      } catch (error) {
        // Error checking Peppol usage
        setPeppolUsage({ usage: 0, limit: getStarterLimit('peppolInvoicesPerMonth'), withinLimit: true });
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
                  {peppolSettings.isConfigured && !peppolSettings.peppolDisabled && (
                    <div className="ml-3 flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-muted-foreground">{t('peppol.header.connected')}</span>
                    </div>
                  )}
                  {(!peppolSettings.isConfigured || peppolSettings.peppolDisabled) && peppolSettings.peppolId && (
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
                    {loading ? '...' : formatCurrency(peppolStats.totalSentAmount)}
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
                    {loading ? '...' : formatCurrency(peppolStats.totalReceivedAmount)}
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

                    {/* Header - Only show when NOT configured OR when Peppol is disabled */}
                    {(!peppolSettings.isConfigured || peppolSettings.peppolDisabled) && (
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
                    {/* Show registration form if not configured OR if Peppol is disabled */}
                    {(!peppolSettings.isConfigured || peppolSettings.peppolDisabled) ? (
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
                                  options={getClientCountryOptions(t)}
                                  required
                                />
                              </div>
                            </div>

                            {/* Peppol ID - For Belgium: show combined ID only, for others: show scheme code and VAT */}
                            {peppolSettings.countryCode?.toUpperCase() === 'BE' ? (
                              <>
                                {/* Belgium: Only show VAT Number input, scheme codes are auto-registered */}
                                <div>
                                  <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                    {t('peppol.setup.companyInfo.vatNumber', 'VAT Number')} *
                                  </label>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={peppolIdentifier}
                                    onChange={(e) => handleIdentifierChange(e.target.value)}
                                    placeholder={t('peppol.setup.companyInfo.vatNumberPlaceholder', 'e.g., 0630675588 or BE0630675588')}
                                    className="font-mono"
                                    required
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {t('peppol.setup.companyInfo.belgiumAutoRegister', 'Both scheme codes (0208 and 9925) will be automatically registered for Belgium')}
                                  </p>
                                  {vatValidationError && (
                                    <div className="text-xs text-error mt-2">
                                      <p className="flex items-center gap-1">
                                        <Icon name="AlertCircle" size={14} />
                                        {vatValidationError}
                                      </p>
                                    </div>
                                  )}
                                  {!vatValidationError && peppolIdentifier && (
                                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
                                      <Icon name="CheckCircle" size={14} />
                                      {t('clientManagement.modal.vatNumberValid', 'VAT number format is valid')}
                                    </p>
                                  )}
                                </div>

                                {/* Combined Peppol ID Display for Belgium (read-only, showing both formats) */}
                                {peppolIdentifier && (
                                  <div className="bg-muted/30 border border-border rounded-lg p-3 space-y-2 hidden sm:block">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                      {t('peppol.setup.companyInfo.combinedPeppolId', 'Peppol IDs (Both will be registered)')}
                                    </label>
                                    <div className="space-y-1.5">
                                      <p className="text-xs sm:text-sm font-mono text-foreground break-all">
                                        <span className="text-muted-foreground min-w-[35px] sm:min-w-[40px] inline-block">0208:</span> 
                                        {combinePeppolIdWithCountry('0208', 'BE', peppolIdentifier)}
                                      </p>
                                      <p className="text-xs sm:text-sm font-mono text-foreground break-all">
                                        <span className="text-muted-foreground min-w-[35px] sm:min-w-[40px] inline-block">9925:</span> 
                                        {combinePeppolIdWithCountry('9925', 'BE', peppolIdentifier)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {/* Other countries: Show scheme code and VAT number separately */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                                      {t('peppol.setup.companyInfo.peppolSchemeCode', 'Peppol Scheme Code')} *
                                    </label>
                                    <Input
                                      value={peppolSchemeCode}
                                      onChange={(e) => handleSchemeCodeChange(e.target.value)}
                                      placeholder="0208"
                                      className="font-mono"
                                      required
                                      maxLength={4}
                                    />
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
                                      className={`font-mono ${vatValidationError ? 'border-error' : ''}`}
                                      required
                                    />
                                    {vatValidationError && (
                                      <div className="text-xs text-error mt-2">
                                        <p className="flex items-center gap-1">
                                          <Icon name="AlertCircle" size={14} />
                                          {vatValidationError}
                                        </p>
                                      </div>
                                    )}
                                    {!vatValidationError && peppolIdentifier && (
                                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
                                        <Icon name="CheckCircle" size={14} />
                                        {t('clientManagement.modal.vatNumberValid', 'VAT number format is valid')}
                                      </p>
                                    )}
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
                              </>
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

                          {/* Peppol Configuration - Only show in test mode, hide completely in production */}
                          {!isProductionMode && (
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
                          )}

                          {/* Action Buttons - Only show when not configured OR when Peppol is disabled */}
                          {(!peppolSettings.isConfigured || peppolSettings.peppolDisabled) && (
                            <div className="pt-4 space-y-3">
                              {/* Test Result Messages - Show near test button */}
                              {successMessage && (
                                <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
                                    <Icon name="CheckCircle" size={18} className="text-success flex-shrink-0 mt-0.5" />
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
                              {errorMessage && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                  <div className="flex items-start space-x-2">
                                    <Icon name="AlertCircle" size={18} className="text-destructive flex-shrink-0 mt-0.5" />
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
                              
                              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
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
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              {peppolSettings.countryCode === 'BE' && peppolIdentifier ? (
                                <div className="hidden sm:flex flex-row items-center gap-2">
                                  <div 
                                    className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-mono font-semibold"
                                    title={combinePeppolIdWithCountry('0208', 'BE', peppolIdentifier)}
                                  >
                                    {combinePeppolIdWithCountry('0208', 'BE', peppolIdentifier)}
                                  </div>
                                  <div 
                                    className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-mono font-semibold"
                                    title={combinePeppolIdWithCountry('9925', 'BE', peppolIdentifier)}
                                  >
                                    {combinePeppolIdWithCountry('9925', 'BE', peppolIdentifier)}
                                  </div>
                                </div>
                              ) : (
                                <div 
                                  className="hidden sm:block bg-green-600 text-white px-3 py-1 rounded-full text-xs font-mono font-semibold"
                                  title={peppolSettings.peppolId}
                                >
                                  {peppolSettings.peppolId}
                                </div>
                              )}
                              <Icon
                                name={showParticipantDetails ? "ChevronUp" : "ChevronDown"}
                                size={20}
                                className="text-green-600 flex-shrink-0"
                              />
                            </div>
                          </div>
                        </button>

                        {showParticipantDetails && (
                          <div className="space-y-4">
                            {/* Peppol IDs for Belgium */}
                            {peppolSettings.countryCode === 'BE' && peppolIdentifier && (
                              <div className="bg-muted/30 border border-border rounded-lg p-4">
                                <label className="block text-xs font-medium text-muted-foreground mb-2">
                                  {t('peppol.setup.companyInfo.combinedPeppolId', 'Peppol IDs')}
                                </label>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground font-medium min-w-[35px] sm:min-w-[40px]">0208:</span>
                                    <code 
                                      className="text-xs sm:text-sm font-mono text-foreground bg-background px-2 py-1 rounded border border-border break-all"
                                      title={combinePeppolIdWithCountry('0208', 'BE', peppolIdentifier)}
                                    >
                                      {combinePeppolIdWithCountry('0208', 'BE', peppolIdentifier)}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-muted-foreground font-medium min-w-[35px] sm:min-w-[40px]">9925:</span>
                                    <code 
                                      className="text-xs sm:text-sm font-mono text-foreground bg-background px-2 py-1 rounded border border-border break-all"
                                      title={combinePeppolIdWithCountry('9925', 'BE', peppolIdentifier)}
                                    >
                                      {combinePeppolIdWithCountry('9925', 'BE', peppolIdentifier)}
                                    </code>
                                  </div>
                                </div>
                              </div>
                            )}
                            
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
                            { value: 'sent', label: t('peppol.status.sent', 'Sent') },
                            { value: 'failed', label: t('peppol.status.failed') },
                            { value: 'error', label: t('peppol.status.error', 'Error') }
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
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">{t('peppol.filters.status')}</label>
                          <Select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            placeholder={t('peppol.filters.allStatuses')}
                            options={[
                              { value: '', label: t('peppol.filters.allStatuses') },
                              { value: 'sent', label: t('peppol.status.sent') },
                              { value: 'failed', label: t('peppol.status.failed') },
                              { value: 'error', label: t('peppol.status.error') }
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
                            { value: 'failed', label: t('peppol.status.failed') },
                            { value: 'error', label: t('peppol.status.error', 'Error') }
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
                              { value: 'failed', label: t('peppol.status.failed') },
                              { value: 'error', label: t('peppol.status.error', 'Error') }
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