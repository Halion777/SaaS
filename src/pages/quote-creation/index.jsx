import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import MainSidebar from '../../components/ui/MainSidebar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import StepIndicator from './components/StepIndicator';
import ClientSelection from './components/ClientSelection';
import TaskDefinition from './components/TaskDefinition';
import FileUpload from './components/FileUpload';
import QuotePreview from './components/QuotePreview';
import QuoteSendModal from './components/QuoteSendModal';
// AIScoring removed
import { generateQuoteNumber, createQuote, fetchQuoteById, updateQuote, saveQuoteDraft, loadQuoteDraft, deleteQuoteDraft, deleteQuoteDraftById } from '../../services/quotesService';
import { uploadQuoteFile, uploadQuoteSignature } from '../../services/quoteFilesService';
import { saveCompanyInfo } from '../../services/companyInfoService';
import { LeadManagementService } from '../../services/leadManagementService';
import { supabase } from '../../services/supabaseClient';
import EmailService from '../../services/emailService';
import { generatePublicShareLink } from '../../services/shareService';
import { getPublicUrl } from '../../services/storageService';

// Helper function to get signed URL for private bucket access
const getSignedUrlForBucket = async (bucket, path) => {
  // Debug: Log what we're trying to get signed URL for
  
  try {
    // For company-assets bucket, use public URL since it's now public
    if (bucket === 'company-assets') {
      const { getPublicUrl } = await import('../../services/storageService');
      return getPublicUrl(bucket, path);
    }
    
    // Get signed URL for other private buckets
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 2592000); // 30 days expiry
    
    if (error) {
      console.error(`Error getting signed URL for ${bucket}/${path}:`, error);
      return null;
    }
    
    // Debug: Log the result
    
    return data.signedUrl;
  } catch (error) {
    console.error(`Exception getting signed URL for ${bucket}/${path}:`, error);
    return null;
  }
};

const QuoteCreation = () => {
  const { user } = useAuth();
  const { currentProfile } = useMultiUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [leadId, setLeadId] = useState(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [projectInfo, setProjectInfo] = useState({
    categories: [],
    customCategory: '',
    deadline: '',
    description: ''
  });
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [financialConfig, setFinancialConfig] = useState(null);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuoteSendModal, setShowQuoteSendModal] = useState(false);

  // Draft expiration (24 hours)
  const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
  const isDraftExpired = (isoTimestamp) => {
    if (!isoTimestamp) return false;
    const saved = new Date(isoTimestamp).getTime();
    if (Number.isNaN(saved)) return false;
    return Date.now() - saved > DRAFT_TTL_MS;
  };

  // Helper function to generate draft key with user and profile IDs
  const getDraftKey = () => {
    return `quote-draft-${user?.id}-${currentProfile?.id || 'default'}`;
  };
  const getDraftRowIdKey = () => {
    return `quote-draft-rowid-${user?.id}-${currentProfile?.id || 'default'}`;
  };

  // Deprecated: drafts list/session id removed for a cleaner flow

  // Normalize selected client to a minimal, non-duplicated structure for drafts
  const normalizeSelectedClient = (sel) => {
    if (!sel) return null;
    const c = sel.client || sel;
    const id = c.id || sel.id || sel.value || null;
    return id ? {
      id,
      value: id, // keep compatibility for consumers reading .value
      name: c.name || sel.label || '',
      email: c.email || sel.email || '',
      phone: c.phone || sel.phone || '',
      address: c.address || sel.address || '',
      city: c.city || sel.city || '',
      postal_code: c.postal_code || sel.postalCode || ''
    } : null;
  };

  // Resume draft or edit existing quote based on URL params
  useEffect(() => {
    const editId = searchParams.get('edit');
    const duplicateId = searchParams.get('duplicate');
    const leadId = searchParams.get('lead_id');

    const resumeDraftById = async (draftIdWithPrefix) => {
      try {
        const draftId = draftIdWithPrefix.replace(/^draft-/, '');
        const { data, error } = await supabase
          .from('quote_drafts')
          .select('*')
          .eq('id', draftId)
          .single();
        if (error || !data) {
          console.error('Error loading draft by id:', error);
          return;
        }
        const d = data.draft_data || {};
        setIsEditing(false);
        setEditingQuoteId(null);
        setSelectedClient(d.selectedClient || null);
        setProjectInfo(d.projectInfo || { categories: [], customCategory: '', deadline: '', description: '' });
        setTasks(d.tasks || []);
        setFiles(d.files || []);
        setCompanyInfo(d.companyInfo || null);
        setFinancialConfig(d.financialConfig || null);
        setCurrentStep(d.currentStep || 1);
        setLastSaved(d.lastSaved || new Date().toISOString());
        // Persist as current draft for continuity
        try { localStorage.setItem(getDraftKey(), JSON.stringify(d)); } catch {}
        // Bind this editing session to the backend draft row id so autosave updates the same row
        try { localStorage.setItem(getDraftRowIdKey(), data.id); } catch {}
      } catch (err) {
        console.error('Exception resuming draft:', err);
      }
    };
    
    if (editId) {
      if (editId.startsWith('draft-')) {
        resumeDraftById(editId);
      } else {
      setIsEditing(true);
      setEditingQuoteId(editId);
        loadExistingQuote(editId, false);
        // Ensure a fresh backend draft row will be created if user starts autosaving while editing
        try { localStorage.removeItem(getDraftRowIdKey()); } catch {}
      }
    } else if (duplicateId) {
      setIsEditing(false);
      setEditingQuoteId(duplicateId);
      loadExistingQuote(duplicateId, true);
      // New session: clear any previous draft row binding to avoid overriding previous draft
      try { localStorage.removeItem(getDraftRowIdKey()); } catch {}
    } else if (leadId) {
      // Handle lead-based quote creation
      setIsEditing(false);
      setEditingQuoteId(null);
      loadLeadData(leadId);
      // Clear any previous draft row binding for new quote from lead
      try { localStorage.removeItem(getDraftRowIdKey()); } catch {}
    } else {
      setIsEditing(false);
      setEditingQuoteId(null);
      // Brand-new quote session: clear any previous draft row binding to force insert of a new draft row
      try { localStorage.removeItem(getDraftRowIdKey()); } catch {}
    }
  }, [searchParams]);

  // No automatic clearing on back/unload: drafts must persist until explicit save/send

  // Load lead data for quote creation
  const loadLeadData = async (leadId) => {
    if (!leadId || !user?.id) return;
    
    try {
      setIsLoadingQuote(true);
      const { data: leadData, error } = await LeadManagementService.getLeadDetailsForQuote(leadId);
      
      if (error) {
        console.error('Error loading lead data:', error);
        return;
      }
      
      if (!leadData) {
        console.error('No lead data found');
        return;
      }
      
      // Transform lead data to quote format
      const transformedClient = {
        id: null, // New client to be created
        value: null,
        label: leadData.client_name,
        name: leadData.client_name,
        email: leadData.client_email,
        phone: leadData.client_phone,
        address: leadData.client_address,
        city: leadData.city,
        postalCode: leadData.zip_code,
        country: 'BE', // Default to Belgium
        client: null, // Will be created when quote is saved
        communicationPreferences: leadData.communication_preferences || { email: true, phone: false, sms: false }
      };
      
      // Set the client data
      setSelectedClient(transformedClient);
      
      // Set project information
      setProjectInfo({
        categories: leadData.project_categories || [],
        customCategory: leadData.custom_category || '',
        deadline: leadData.completion_date || '',
        description: leadData.project_description || ''
      });
      
      // Clear tasks and files for new quote
      setTasks([]);
      setFiles([]);
      
      // Don't automatically move to step 2 when leadId is present
      // User must click "Ajouter le client" first
      setCurrentStep(1);
      
      // Store the lead ID for later use
      setLeadId(leadId);
      
      setIsLoadingQuote(false);
    } catch (error) {
      console.error('Error loading lead data:', error);
      setIsLoadingQuote(false);
    }
  };

  // Load existing quote data for editing or duplicating
  const loadExistingQuote = async (quoteId, isDuplicating = false) => {
    if (!quoteId || !user?.id) return;
    
    try {
      setIsLoadingQuote(true);
      const { data: quote, error } = await fetchQuoteById(quoteId);
      
      if (error) {
        console.error('Error loading quote:', error);
        return;
      }
      
      if (!quote) {
        return;
      }
      
      // Check if user has permission to edit this quote
      if (quote.user_id !== user.id) {
        navigate('/quotes-management');
        return;
      }
      
      // Transform backend data to frontend format
      const transformedClient = {
        id: quote.client?.id,
        value: quote.client?.id,
        label: quote.client?.name,
        name: quote.client?.name,
        email: quote.client?.email,
        phone: quote.client?.phone,
        address: quote.client?.address,
        city: quote.client?.city,
        postalCode: quote.client?.postal_code,
        country: quote.client?.country,
        client: quote.client // Keep full client object for reference
      };
      
      const transformedTasks = (quote.quote_tasks || []).map(task => ({
        id: task.id,
        description: task.name || task.description,
        duration: task.duration,
        durationUnit: task.duration_unit || 'minutes',
        price: task.unit_price || task.total_price,
        materials: [],
        hourlyRate: task.hourly_rate,
        pricingType: task.pricing_type || 'flat'
      }));
      
      // Group materials by their task
      const materialsByTaskId = {};
      (quote.quote_materials || []).forEach((material) => {
        const mapped = {
        id: material.id,
        name: material.name,
        description: material.description,
        quantity: material.quantity,
        unit: material.unit,
        price: material.unit_price || material.total_price
        };
        const tid = material.quote_task_id;
        if (!materialsByTaskId[tid]) materialsByTaskId[tid] = [];
        materialsByTaskId[tid].push(mapped);
      });

      // Attach materials to corresponding tasks
      const tasksWithMaterials = transformedTasks.map(t => ({
        ...t,
        materials: materialsByTaskId[t.id] || []
      }));
      
      // Get signed URLs for all files
      const transformedFiles = [];
      for (const file of quote.quote_files || []) {
        const signedUrl = await getSignedUrlForBucket('quote-files', file.file_path);

        
        transformedFiles.push({
          id: file.id,
          name: file.file_name,
          path: file.file_path,
          size: file.file_size,
          type: file.mime_type,
          uploadedAt: new Date(file.created_at),
          backendId: file.id, // Important for edit mode
          publicUrl: signedUrl, // Signed URL for private bucket access
          // Add data field for compatibility with existing display logic
          data: null, // Will be loaded from storage if needed
          // Mark as already uploaded
          isUploading: false
        });
      }
      

      
      // Load company info from database
      if (quote.company_profile) {
        // Debug: Log the company profile data
        
        const companyInfo = {
          name: quote.company_profile.company_name || '',
          vatNumber: quote.company_profile.vat_number || '',
          address: quote.company_profile.address || '',
          postalCode: quote.company_profile.postal_code || '',
          city: quote.company_profile.city || '',
          state: quote.company_profile.state || '',
          country: quote.company_profile.country || '',
          phone: quote.company_profile.phone || '',
          email: quote.company_profile.email || '',
          website: quote.company_profile.website || '',
          logo: quote.company_profile.logo_path ? {
            name: quote.company_profile.logo_filename || 'company-logo',
            size: quote.company_profile.logo_size || 0,
            type: quote.company_profile.logo_mime_type || 'image/*',
            data: null, // Will be loaded from storage
            path: quote.company_profile.logo_path,
            publicUrl: await getSignedUrlForBucket('company-assets', quote.company_profile.logo_path)
          } : null,
          signature: quote.company_profile.signature_path ? {
            name: quote.company_profile.signature_filename || 'company-signature',
            size: quote.company_profile.signature_size || 0,
            type: quote.company_profile.signature_mime_type || 'image/*',
            data: null, // Will be loaded from storage
            path: quote.company_profile.signature_path,
            publicUrl: await getSignedUrlForBucket('company-assets', quote.company_profile.signature_path)
          } : null
        };
        
        // Debug: Log the logo and signature data
        
        // Save company info to localStorage for display
        if (user?.id) {
          localStorage.setItem(`company-info-${user.id}`, JSON.stringify(companyInfo));
          if (companyInfo.logo?.path) {
            localStorage.setItem(`company-logo-${user.id}`, JSON.stringify(companyInfo.logo));
          }
          if (companyInfo.signature?.path) {
            localStorage.setItem(`company-signature-${user.id}`, JSON.stringify(companyInfo.signature));
          }
        }
      }
      
      // Load client signature if exists (prefer client type)
      if (quote.quote_signatures && quote.quote_signatures.length > 0) {
        const clientSignature = quote.quote_signatures.find(s => s.signature_type === 'client') || quote.quote_signatures[0];
        const signatureUrl = clientSignature.signature_file_path 
          ? await getSignedUrlForBucket('signatures', clientSignature.signature_file_path) 
          : (clientSignature.signature_data ? `data:image/png;base64,${clientSignature.signature_data}` : null);
        const signatureData = {
          signature: signatureUrl,
          clientComment: clientSignature.signer_email || '',
          signedAt: clientSignature.signed_at || new Date().toISOString()
        };
        if (user?.id && signatureUrl) {
          localStorage.setItem(`client-signature-${user.id}`, JSON.stringify(signatureData));
        }
      }
      
      // Load financial configuration if exists
      let financialConfig = null;
      if (quote.quote_financial_configs && quote.quote_financial_configs.length > 0) {
        const financialData = quote.quote_financial_configs[0]; // Assuming one financial config per quote
        
        financialConfig = {
          vatConfig: {
            display: financialData.vat_config?.display || false,
            rate: financialData.vat_config?.rate || 21
          },
          advanceConfig: {
            enabled: financialData.advance_config?.enabled || false,
            percentage: financialData.advance_config?.percentage || 30,
            amount: financialData.advance_config?.amount || '',
            dueDate: financialData.advance_config?.due_date || null
          },
          marketingBannerConfig: {
            enabled: !!financialData.marketing_banner?.text,
            message: financialData.marketing_banner?.text || ''
          },
          paymentTerms: {
            netDays: financialData.payment_terms?.net_days || 30,
            earlyPaymentDiscount: financialData.payment_terms?.early_payment_discount || 0
          },
          discountConfig: {
            rate: financialData.discount_config?.rate || 0,
            amount: financialData.discount_config?.amount || 0,
            type: financialData.discount_config?.type || 'percentage'
          },
          defaultConditions: {
            language: 'FR',
            text: quote.terms_conditions || 'Conditions générales:\n• Devis valable 30 jours\n• Acompte de 30% à la commande\n• Solde à la livraison\n• Délai de paiement: 30 jours\n• TVA comprise\n• Matériaux et main d\'œuvre garantis 1 an'
          }
        };
      }
      
      // Set the data
      setSelectedClient(transformedClient);
      setProjectInfo({
        categories: quote.project_categories || [],
        customCategory: quote.custom_category || '',
        // Use stored valid_until; fallback to legacy deadline if present
        deadline: quote.valid_until || quote.deadline || '',
        description: quote.description || '',
        quoteNumber: isDuplicating ? null : quote.quote_number // Don't copy quote number when duplicating
      });
      setTasks(tasksWithMaterials);
      setFiles(transformedFiles);
      setFinancialConfig(financialConfig);
      
      // If duplicating, generate a new quote number
      if (isDuplicating) {
        setTimeout(() => generateQuoteNumberForPreview(), 100);
      }
      

      
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setIsLoadingQuote(false);
    }
  };



  // Enhanced auto-save functionality: localStorage + backend draft table
  useEffect(() => {
    const autoSave = async () => {
      // Auto-save if there's any data to save
      if (selectedClient || tasks.length > 0 || files.length > 0 || 
          projectInfo.categories.length > 0 || projectInfo.description || projectInfo.deadline) {
        setIsAutoSaving(true);
        const savedTime = new Date().toISOString();
        const quoteData = {
          selectedClient: normalizeSelectedClient(selectedClient),
          projectInfo,
          tasks,
          files,
          currentStep,
          companyInfo,
          financialConfig,
          lastSaved: savedTime
        };
        
        // Save to localStorage (current in-progress draft only)
        try {
          localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
          setLastSaved(savedTime);
        } catch (localStorageError) {
          console.error('Error saving to localStorage:', localStorageError);
        }

        // Also save to backend draft table for cross-device and quotes-management visibility
        try {
          if (user?.id) {
            const existingRowId = localStorage.getItem(getDraftRowIdKey());
            const { data: saved, error: draftErr } = await saveQuoteDraft({
              id: existingRowId || undefined,
              user_id: user.id,
              profile_id: currentProfile?.id || null,
              draft_data: quoteData
            });
            if (!draftErr && saved?.id && !existingRowId) {
              localStorage.setItem(getDraftRowIdKey(), saved.id);
            }
          }
        } catch (e) {
          console.warn('Draft autosave (backend) failed:', e?.message || e);
        }
        
        setTimeout(() => {
          setIsAutoSaving(false);
        }, 1500);
      }
    };

    // Auto-save every 30 seconds
    const interval = setInterval(autoSave, 30000);
    
    // Also auto-save immediately when data changes (debounced)
    const timeoutId = setTimeout(autoSave, 5000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [selectedClient, projectInfo, tasks, files, currentStep, companyInfo, financialConfig, user?.id, currentProfile?.id]);

  // Load company info from database and localStorage
  useEffect(() => {
    const loadCompanyInfo = async () => {
      if (!user?.id) return;
      
      try {
        // First try to load from database
        const { data: companyProfile, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error loading company profile from database:', error);
        } else if (companyProfile) {
          // Convert database format to frontend format
          const dbCompanyInfo = {
            name: companyProfile.company_name,
            vatNumber: companyProfile.vat_number,
            address: companyProfile.address,
            postalCode: companyProfile.postal_code,
            city: companyProfile.city,
            state: companyProfile.state,
            country: companyProfile.country,
            phone: companyProfile.phone,
            email: companyProfile.email,
            website: companyProfile.website,
            logo: companyProfile.logo_path ? {
              name: companyProfile.logo_filename || 'company-logo',
              size: companyProfile.logo_size || 0,
              type: companyProfile.logo_mime_type || 'image/*',
              path: companyProfile.logo_path,
              publicUrl: getPublicUrl('company-assets', companyProfile.logo_path)
            } : null,
            signature: companyProfile.signature_path ? {
              name: companyProfile.signature_filename || 'company-signature',
              size: companyProfile.signature_size || 0,
              type: companyProfile.signature_mime_type || 'image/*',
              path: companyProfile.signature_path,
              publicUrl: getPublicUrl('company-assets', companyProfile.signature_path)
            } : null
          };
          
          setCompanyInfo(dbCompanyInfo);
          
          // Also save to localStorage for future use
          try {
            localStorage.setItem(`company-info-${user.id}`, JSON.stringify({
              name: dbCompanyInfo.name,
              vatNumber: dbCompanyInfo.vatNumber,
              address: dbCompanyInfo.address,
              postalCode: dbCompanyInfo.postalCode,
              city: dbCompanyInfo.city,
              state: dbCompanyInfo.state,
              country: dbCompanyInfo.country,
              phone: dbCompanyInfo.phone,
              email: dbCompanyInfo.email,
              website: dbCompanyInfo.website
            }));
            
            if (dbCompanyInfo.logo) {
              localStorage.setItem(`company-logo-${user.id}`, JSON.stringify(dbCompanyInfo.logo));
            }
            
            if (dbCompanyInfo.signature) {
              localStorage.setItem(`company-signature-${user.id}`, JSON.stringify(dbCompanyInfo.signature));
            }
          } catch (localStorageError) {
            console.warn('Failed to save company info to localStorage:', localStorageError);
          }
        }
      } catch (error) {
        console.error('Error loading company info:', error);
      }
    };

    loadCompanyInfo();
  }, [user?.id, currentProfile?.id]);

  // Do not auto-load draft into the form on page open; only clean expired local draft
  useEffect(() => {
    if (user?.id) {
        try {
          const local = JSON.parse(localStorage.getItem(getDraftKey()) || 'null');
          if (local?.lastSaved && isDraftExpired(local.lastSaved)) {
            localStorage.removeItem(getDraftKey());
          }
        } catch {}
      
      // Also load company info from localStorage (as fallback)
      try {
        const companyInfoKey = `company-info-${user.id}`;
        const savedCompanyInfo = localStorage.getItem(companyInfoKey);
        if (savedCompanyInfo) {
          const parsedCompanyInfo = JSON.parse(savedCompanyInfo);
  
          setCompanyInfo(prev => ({ ...prev, ...parsedCompanyInfo }));
        }
        
        // Load company logo from localStorage
        const logoKey = `company-logo-${user.id}`;
        const savedLogo = localStorage.getItem(logoKey);
        if (savedLogo) {
          const parsedLogo = JSON.parse(savedLogo);
  
          setCompanyInfo(prev => ({ ...prev, logo: parsedLogo }));
        }
        
        // Load company signature from localStorage
        const signatureKey = `company-signature-${user.id}`;
        const savedSignature = localStorage.getItem(signatureKey);
        if (savedSignature) {
          const parsedSignature = JSON.parse(savedSignature);
  
          setCompanyInfo(prev => ({ ...prev, signature: parsedSignature }));
        }
      } catch (error) {
        console.error('Error loading company info from localStorage:', error);
      }
    }
  }, [user?.id, currentProfile?.id]);

  // Helper function to clear form data
  const clearFormData = () => {
    setSelectedClient(null);
    setProjectInfo({
      categories: [],
      customCategory: '',
      deadline: '',
      description: ''
    });
    setTasks([]);
    setFiles([]);
    setCurrentStep(1);
    setCompanyInfo(null);
    setLastSaved(null);
  };



  // Handle sidebar offset and responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (isMobile) {
        setSidebarOffset(0);
      } else if (isTablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, respond to sidebar state
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      setIsMobile(isMobile);
      
      if (isMobile) {
        setSidebarOffset(0);
      } else if (isTablet) {
        // On tablet, sidebar auto-closes after navigation, so always use collapsed width
        // But account for wider collapsed sidebar on tablet (80px instead of 64px)
        setSidebarOffset(80);
      } else {
        // On desktop, check sidebar state
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < 4) {
      // Auto-save before moving to next step
      const savedTime = new Date().toISOString();
      const quoteData = {
          selectedClient: normalizeSelectedClient(selectedClient),
        projectInfo,
        tasks,
        files,
        currentStep: currentStep + 1,
        companyInfo,
        financialConfig,
        lastSaved: savedTime
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
      setLastSaved(savedTime);
      
      // If moving to step 4 (preview), generate quote number
      if (currentStep === 3) {
        generateQuoteNumberForPreview();
      }
      
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      // Auto-save before moving to previous step
      const savedTime = new Date().toISOString();
      const quoteData = {
          selectedClient: normalizeSelectedClient(selectedClient),
        projectInfo,
        tasks,
        files,
        currentStep: currentStep - 1,
        companyInfo,
        financialConfig,
        lastSaved: savedTime
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
      setLastSaved(savedTime);
      
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  const handleProjectInfoChange = (newProjectInfo) => {
    setProjectInfo(newProjectInfo);
  };

  const handleTasksChange = (newTasks) => {
    setTasks(newTasks);
  };

  const handleFilesChange = (newFiles) => {
    setFiles(newFiles);
  };

  const handleCompanyInfoChange = (newCompanyInfo) => {
    setCompanyInfo(newCompanyInfo);
  };

  // Enhanced handleSave with better data structure and backend integration
  const handleSave = async (data) => {
    try {
      setIsSaving(true);
      
      // Check if we're editing an existing quote
      if (isEditing && editingQuoteId) {
        // Update existing quote
        const totalAmount = tasks.reduce((sum, task) => {
          const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
            matSum + (mat.price * parseFloat(mat.quantity || 1)), 0);
          return sum + (task.price || 0) + taskMaterialsTotal;
        }, 0);

        const quoteData = {
          title: projectInfo.description || 'Nouveau devis',
          description: projectInfo.description || '',
          project_categories: projectInfo.categories || [],
          custom_category: projectInfo.customCategory || '',
          deadline: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : null,
          total_amount: totalAmount,
          tax_amount: data.financialConfig?.vatConfig?.display ? (totalAmount * (data.financialConfig.vatConfig.rate || 20) / 100) : 0,
          discount_amount: 0,
          final_amount: totalAmount + (data.financialConfig?.vatConfig?.display ? (totalAmount * (data.financialConfig.vatConfig.rate || 20) / 100) : 0),
          valid_until: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          terms_conditions: data.financialConfig?.defaultConditions?.text || '',
          // Preserve the existing quote number when editing
          quote_number: projectInfo.quoteNumber,
          tasks: tasks.map((task, index) => ({
            name: task.description || task.name || '',
            description: task.description || task.name || '',
            quantity: task.quantity || 1,
            unit: task.unit || 'piece',
            unit_price: task.price || task.unit_price || 0,
            total_price: (task.price || task.unit_price || 0) * (task.quantity || 1),
            duration: task.duration || 0,
            duration_unit: task.durationUnit || 'minutes',
            pricing_type: task.pricingType || 'flat',
            hourly_rate: task.hourlyRate || 0,
            order_index: index,
            materials: task.materials || []
          })),
          files: files.map((file, index) => ({
            file_name: file.name || file.file_name || '',
            file_path: file.path || file.file_path || file.url || '',
            file_size: file.size || file.file_size || 0,
            mime_type: file.type || file.mime_type || '',
            file_category: 'attachment',
            order_index: index
          }))
        };

        // Update the quote in the backend
        const { data: updatedQuote, error: updateError } = await updateQuote(editingQuoteId, quoteData);
        
        if (updateError) {
          console.error('Error updating quote:', updateError);
          return;
        }


        // Clear all quote creation data from localStorage after successful update
        clearAllQuoteData();
        navigate('/quotes-management');
        return;
      }

      // Create new quote (existing logic)
      // Generate quote number using the service
      const { data: quoteNumber, error: numberError } = await generateQuoteNumber(user?.id);
      
      if (numberError) {
        console.warn('Error generating quote number, using fallback:', numberError);
      }
      
      let finalQuoteNumber = quoteNumber;
      
      // If backend didn't provide a number, generate a fallback with timestamp for uniqueness
      if (!finalQuoteNumber) {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        finalQuoteNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
      }
      
      // Calculate totals more accurately
      const totalAmount = tasks.reduce((sum, task) => {
        const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
          matSum + (mat.price * parseFloat(mat.quantity || 1)), 0);
        return sum + (task.price || 0) + taskMaterialsTotal;
      }, 0);

      // For new quotes, files will be uploaded when the quote is actually created
      const uploadedFiles = files;

      const quoteData = {
        user_id: user?.id,
        profile_id: currentProfile?.id,
        quote_number: finalQuoteNumber,
        client_id: selectedClient?.value,
        status: 'draft',
        title: projectInfo.description || 'Nouveau devis',
        description: projectInfo.description || '',
        project_categories: projectInfo.categories || [],
        custom_category: projectInfo.customCategory || '',
        start_date: new Date().toISOString().split('T')[0],
        total_amount: totalAmount,
        tax_amount: data.financialConfig?.vatConfig?.display ? (totalAmount * (data.financialConfig.vatConfig.rate || 20) / 100) : 0,
        discount_amount: 0,
        final_amount: totalAmount + (data.financialConfig?.vatConfig?.display ? (totalAmount * (data.financialConfig.vatConfig.rate || 20) / 100) : 0),
        valid_until: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        terms_conditions: data.financialConfig?.defaultConditions?.text || '',
        tasks: tasks.map((task, index) => ({
          name: task.description || task.name || '',
          description: task.description || task.name || '',
          quantity: task.quantity || 1,
          unit: task.unit || 'piece',
          unit_price: task.price || task.unit_price || 0,
          total_price: (task.price || task.unit_price || 0) * (task.quantity || 1),
          duration: task.duration || 0,
          duration_unit: task.durationUnit || 'minutes',
          pricing_type: task.pricingType || 'flat',
          hourly_rate: task.hourlyRate || 0,
          order_index: index,
          materials: task.materials || []
        })),
        files: uploadedFiles.map((file, index) => ({
          file_name: file.name || file.file_name || '',
          file_path: file.file_path || file.path || file.file_path || file.url || '',
          file_size: file.size || file.file_size || 0,
          mime_type: file.type || file.mime_type || '',
          order_index: index
        }))
      };

      // Debug logging
      

      // Create quote in database with draft status
      const { data: createdQuote, error: createError } = await createQuote(quoteData);
      
      if (createError) {
        console.error('Error creating draft quote in backend:', createError);
        return;
      }

      const quoteId = createdQuote.id;
      
      // Now save financial configuration to database
      if (data.financialConfig && user?.id) {
        try {
          const financialConfigData = {
            quote_id: quoteId,
            vat_config: {
              display: data.financialConfig.vatConfig?.display || false,
              rate: data.financialConfig.vatConfig?.rate || 21,
              is_inclusive: false
            },
            advance_config: {
              enabled: data.financialConfig.advanceConfig?.enabled || false,
              percentage: data.financialConfig.advanceConfig?.percentage || 30,
              amount: data.financialConfig.advanceConfig?.amount || '',
              due_date: data.financialConfig.advanceConfig?.dueDate || null
            },
            marketing_banner: {
              text: data.financialConfig.marketingBannerConfig?.message || '',
              color: '#3B82F6',
              position: 'top'
            },
            payment_terms: {
              net_days: 30,
              early_payment_discount: 0
            },
            discount_config: {
              rate: 0,
              amount: 0,
              type: 'percentage'
            }
          };
          
          // Insert financial configuration
          const { error: financialConfigError } = await supabase
            .from('quote_financial_configs')
            .insert(financialConfigData);
          
          if (financialConfigError) {
            console.error('Error saving financial config:', financialConfigError);
            // Continue with quote creation even if financial config save fails
          }
        } catch (error) {
          console.error('Error saving financial config:', error);
          // Continue with quote creation even if financial config save fails
        }
      }
      
      // Now save company info to database (including logo and signature)
      let companyProfileId = null;
      if (data.companyInfo && user?.id) {
        try {
          // Convert base64 data to files for upload
          let logoFile = null;
          let signatureFile = null;
          
          if (data.companyInfo.logo?.data) {
            // Convert base64 to file
            const logoResponse = await fetch(data.companyInfo.logo.data);
            const logoBlob = await logoResponse.blob();
            
            // Create a proper File object
            logoFile = new File([logoBlob], data.companyInfo.logo.name, { 
              type: data.companyInfo.logo.type 
            });
          }
          
          if (data.companyInfo.signature?.data) {
            // Convert base64 to file
            const signatureResponse = await fetch(data.companyInfo.signature.data);
            const signatureBlob = await signatureResponse.blob();
            
            // Create a proper File object
            signatureFile = new File([signatureBlob], data.companyInfo.signature.name, { 
              type: data.companyInfo.signature.type 
            });
          }
          
          // Prepare company data for saving
          const companyDataToSave = {
            ...data.companyInfo,
            logo: logoFile,
            signature: signatureFile
          };
          
          // Save company info to database
          const companyResult = await saveCompanyInfo(companyDataToSave, user.id);
          if (companyResult.success) {
            companyProfileId = companyResult.data.id;
            
            // Update the quote with the company profile ID
            const { error: updateQuoteError } = await supabase
              .from('quotes')
              .update({ company_profile_id: companyProfileId })
              .eq('id', quoteId);
            
            if (updateQuoteError) {
              console.error('Error updating quote with company profile:', updateQuoteError);
              // Continue with quote creation even if update fails
            }
          } else {
            console.warn('Company info save warning:', companyResult.error);
            // Continue with quote creation even if company info save fails
          }
        } catch (error) {
          console.error('Error saving company info:', error);
          // Continue with quote creation even if company info save fails
        }
      }
      
      // Now upload quote files to storage (AFTER quote creation)
      const savedFiles = [];
      if (files.length > 0) {
        try {
          for (const file of files) {
            if (file.data) {
              // File has base64 data, convert to blob and upload
              
              // Convert base64 to file
              const fileResponse = await fetch(file.data);
              const fileBlob = await fileResponse.blob();
              
              // Create a proper File object with the correct name and type
              const fileToUpload = new File([fileBlob], file.name, { type: file.type });
              
              // Upload file to storage (now with real quote ID)
              const { data: uploadResult, error: uploadError } = await uploadQuoteFile(
                fileToUpload, 
                quoteId, // Use real quote ID now
                user.id,
                currentProfile?.id, // Pass profile ID for foreign key constraint
                'attachment'
              );
              
              if (uploadError) {
                console.error('File upload failed:', uploadError);
                return;
              }
              
              if (uploadResult.success) {
                savedFiles.push({
                  ...file,
                  backendId: uploadResult.data.id,
                  file_path: uploadResult.data.file_path,
                  publicUrl: uploadResult.data.publicUrl
                });
              }
            } else if (file.backendId) {
              // File already uploaded (for editing existing quotes)
              savedFiles.push(file);
            } else {
              console.warn('File has no data or backendId, skipping:', file);
            }
          }
        } catch (error) {
          console.error('Error uploading files:', error);
          return;
        }
      }

      // Now update the quote with file references
      if (savedFiles.length > 0) {
        try {
          const filesToInsert = savedFiles.map((file, index) => ({
            quote_id: quoteId,
            file_name: file.name || file.file_name || '',
            file_path: file.file_path || file.path || file.file_path || file.url || '',
            file_size: file.size || file.file_size || 0,
            mime_type: file.type || file.mime_type || '',
            file_category: 'attachment'
          }));

          const { error: filesInsertError } = await supabase
            .from('quote_files')
            .insert(filesToInsert);

          if (filesInsertError) {
            console.error('Error saving file references to database:', filesInsertError);
            return;
          }
        } catch (error) {
          console.error('Error saving file references:', error);
          return;
        }
      }
      
      // Removed legacy local backup of quotes list; rely on backend only

      // Clear all quote creation data from localStorage
      clearAllQuoteData();
      
      // Clear form data for clean state
      clearFormData();

      // Redirect
      navigate('/quotes-management');
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced handleSend with better data structure and backend integration
  const handleSend = async (data) => {
    // Store the data for later use and show the send modal
    setShowQuoteSendModal(true);
  };

  // Actual quote sending logic
  const processQuoteSend = async (sendData) => {
    try {
      setIsSaving(true);
      
      // Debug: Check user authentication
      
      
      if (!user?.id) {
        console.error('No user ID available');
        return;
      }
      
      // Check if we're editing an existing quote
      if (isEditing && editingQuoteId) {
        // Update existing quote and send it
        const totalAmount = tasks.reduce((sum, task) => {
          const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
            matSum + (mat.price * parseFloat(mat.quantity || 1)), 0);
          return sum + (task.price || 0) + taskMaterialsTotal;
        }, 0);

        const quoteData = {
          title: projectInfo.description || 'Nouveau devis',
          description: projectInfo.description || '',
          status: 'sent', // Change status to sent
          // Preserve the existing quote number when editing
          quote_number: projectInfo.quoteNumber,
          project_categories: projectInfo.categories || [],
          custom_category: projectInfo.customCategory || '',
          deadline: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : null,
          total_amount: totalAmount,
          tax_amount: sendData.financialConfig?.vatConfig?.display ? (totalAmount * (sendData.financialConfig.vatConfig.rate || 20) / 100) : 0,
          discount_amount: 0,
          final_amount: totalAmount + (sendData.financialConfig?.vatConfig?.display ? (totalAmount * (sendData.financialConfig.vatConfig.rate || 20) / 100) : 0),
          valid_until: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).split('T')[0],
          terms_conditions: sendData.financialConfig?.defaultConditions?.text || '',
          tasks: tasks.map((task, index) => ({
            name: task.description || task.name || '',
            description: task.description || task.name || '',
            quantity: task.quantity || 1,
            unit: task.unit || 'piece',
            unit_price: task.price || task.unit_price || 0,
            total_price: (task.price || task.unit_price || 0) * (task.quantity || 1),
            duration: task.duration || 0,
            duration_unit: task.durationUnit || 'minutes',
            pricing_type: task.pricingType || 'flat',
            hourly_rate: task.hourlyRate || 0,
            order_index: index,
            materials: task.materials || []
          })),
          files: files.map((file, index) => ({
            file_name: file.name || file.file_name || '',
            file_path: file.path || file.file_path || file.url || '',
            file_size: file.size || file.file_size || 0,
            mime_type: file.type || file.mime_type || '',
            file_category: 'attachment',
            order_index: index
          }))
        };

        // Update the quote in the backend
        const { data: updatedQuote, error: updateError } = await updateQuote(editingQuoteId, quoteData);
        
        if (updateError) {
          console.error('Error updating quote:', updateError);
          return;
        }


        // Clear all quote creation data from localStorage after successful edit
        clearAllQuoteData();
        navigate('/quotes-management');
        return;
      }

      // Create new quote (existing logic)
      // Generate quote number using the service
      const { data: quoteNumber, error: numberError } = await generateQuoteNumber(user.id);
      
      if (numberError) {
        console.warn('Error generating quote number, using fallback:', numberError);
      }
      
      let finalQuoteNumber = quoteNumber;
      
      // If backend didn't provide a number, generate a fallback with timestamp for uniqueness
      if (!finalQuoteNumber) {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        finalQuoteNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
      }
      
      // Store the quote number in projectInfo for display
      setProjectInfo(prev => ({
        ...prev,
        quoteNumber: finalQuoteNumber
      }));
      
      // Calculate totals more accurately
      const totalAmount = tasks.reduce((sum, task) => {
        const taskMaterialsTotal = task.materials.reduce((matSum, mat) => 
          matSum + (mat.price * parseFloat(mat.quantity || 1)), 0);
        return sum + (task.price || 0) + taskMaterialsTotal;
      }, 0);

      // First, create the quote in the database to get a real ID
      
      const quoteData = {
        user_id: user?.id,
        profile_id: currentProfile?.id,
        quote_number: finalQuoteNumber,
        client_id: selectedClient?.id || selectedClient?.value,
        status: 'sent',
        title: projectInfo.description || 'Nouveau devis',
        description: projectInfo.description || '',
        project_categories: projectInfo.categories || [],
        custom_category: projectInfo.customCategory || '',
        deadline: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : null,
        total_amount: totalAmount,
        tax_amount: sendData.financialConfig?.vatConfig?.display ? (totalAmount * (sendData.financialConfig.vatConfig.rate || 20) / 100) : 0,
        discount_amount: 0,
        final_amount: totalAmount + (sendData.financialConfig?.vatConfig?.display ? (totalAmount * (sendData.financialConfig.vatConfig.rate || 20) / 100) : 0),
        valid_until: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).split('T')[0],
        terms_conditions: sendData.financialConfig?.defaultConditions?.text || '',
        tasks: tasks.map((task, index) => ({
          name: task.description || task.name || '',
          description: task.description || task.name || '',
          quantity: task.quantity || 1,
          unit: task.unit || 'piece',
          unit_price: task.price || task.unit_price || 0,
          total_price: (task.price || task.unit_price || 0) * (task.quantity || 1),
          duration: task.duration || 0,
          duration_unit: task.durationUnit || 'minutes',
          pricing_type: task.pricingType || 'flat',
          hourly_rate: task.hourlyRate || 0,
          order_index: index,
          materials: task.materials || []
        })),
        files: [] // We'll add files after upload
      };

      // Call backend service to create quote FIRST
      const { data: createdQuote, error: createError } = await createQuote(quoteData);
      
      if (createError) {
        console.error('Error creating quote in backend:', createError);
        return;
      }

      const quoteId = createdQuote.id;
      
      // If this quote was created from a lead, create a lead quote record
      if (leadId) {
        try {
          const { error: leadQuoteError } = await supabase
            .from('lead_quotes')
            .insert({
              lead_id: leadId,
              quote_id: quoteId,
              artisan_user_id: user.id,
              status: 'sent'
            });
          
          if (leadQuoteError) {
            console.error('Error creating lead quote record:', leadQuoteError);
            // Continue with quote creation even if lead quote record fails
          } else {
            console.log('Lead quote record created successfully');
          }
        } catch (error) {
          console.error('Error creating lead quote record:', error);
          // Continue with quote creation even if lead quote record fails
        }
      }
      
      // Now save financial configuration to database
      if (sendData.financialConfig && user?.id) {
        try {
          const financialConfigData = {
            quote_id: quoteId,
            vat_config: {
              display: sendData.financialConfig.vatConfig?.display || false,
              rate: sendData.financialConfig.vatConfig?.rate || 21,
              is_inclusive: false
            },
            advance_config: {
              enabled: sendData.financialConfig.advanceConfig?.enabled || false,
              percentage: sendData.financialConfig.advanceConfig?.percentage || 30,
              amount: sendData.financialConfig.advanceConfig?.amount || '',
              due_date: sendData.financialConfig.advanceConfig?.dueDate || null
            },
            marketing_banner: {
              text: sendData.financialConfig.marketingBannerConfig?.message || '',
              color: '#3B82F6',
              position: 'top'
            },
            payment_terms: {
              net_days: 30,
              early_payment_discount: 0
            },
            discount_config: {
              rate: 0,
              amount: 0,
              type: 'percentage'
            }
          };
          
          // Insert financial configuration
          const { error: financialConfigError } = await supabase
            .from('quote_financial_configs')
            .insert(financialConfigData);
          
          if (financialConfigError) {
            console.error('Error saving financial config:', financialConfigError);
            // Continue with quote creation even if financial config save fails
          }
        } catch (error) {
          console.error('Error saving financial config:', error);
          // Continue with quote creation even if financial config save fails
        }
      }

      // Now save company info to database (including logo and signature)
      let companyProfileId = null;
      if (sendData.companyInfo && user?.id) {
        try {
  
          
          // Convert base64 data to files for upload
          let logoFile = null;
          let signatureFile = null;
          
          if (sendData.companyInfo.logo?.data) {
            // Convert base64 to file
            const logoResponse = await fetch(sendData.companyInfo.logo.data);
            const logoBlob = await logoResponse.blob();
            
            // Create a proper File object
            logoFile = new File([logoBlob], sendData.companyInfo.logo.name, { 
              type: sendData.companyInfo.logo.type 
            });
          }
          
          if (sendData.companyInfo.signature?.data) {
            // Convert base64 to file
            const signatureResponse = await fetch(sendData.companyInfo.signature.data);
            const signatureBlob = await signatureResponse.blob();
            
            // Create a proper File object
            signatureFile = new File([signatureBlob], sendData.companyInfo.signature.name, { 
              type: sendData.companyInfo.signature.type 
            });
          }
          
          // Prepare company data for saving
          const companyDataToSave = {
            ...sendData.companyInfo,
            logo: logoFile,
            signature: signatureFile
          };
          
          // Save company info to database
          const companyResult = await saveCompanyInfo(companyDataToSave, user.id);
          if (companyResult.success) {
            companyProfileId = companyResult.data.id;
            
            // Update the quote with the company profile ID
            const { error: updateQuoteError } = await supabase
              .from('quotes')
              .update({ company_profile_id: companyProfileId })
              .eq('id', quoteId);
            
            if (updateQuoteError) {
              console.error('Error updating quote with company profile:', updateQuoteError);
              // Continue with quote creation even if update fails
            }
          } else {
            console.warn('Company info save warning:', companyResult.error);
            // Continue with quote creation even if company info save fails
          }
        } catch (error) {
          console.error('Error saving company info:', error);
          // Continue with quote creation even if company info save fails
        }
      }

      // Now save client signature to database and storage
      let clientSignatureId = null;
      if (sendData.signatureData?.signature && user?.id) {
        try {
  
          
          // Convert base64 to file for upload
          const signatureResponse = await fetch(sendData.signatureData.signature);
          const signatureBlob = await signatureResponse.blob();
          
          // Create a proper File object
          const signatureFile = new File([signatureBlob], 'client-signature.png', { 
            type: 'image/png' 
          });
          
          // Upload client signature to storage (now with real quote ID)
          const { data: signatureUploadResult, error: signatureUploadError } = await uploadQuoteSignature(
            signatureFile,
            quoteId, // Use real quote ID now
            user.id,
            'client'
          );
          
          if (signatureUploadError) {
            console.error('Client signature upload failed:', signatureUploadError);
            alert(`Erreur lors de l'upload de la signature client: ${signatureUploadError}`);
            return;
          }
          
          if (signatureUploadResult.success) {
            // uploadQuoteSignature already handles database insert
            clientSignatureId = signatureUploadResult.data.id;
    
          }
        } catch (error) {
          console.error('Error saving client signature:', error);
          // Continue with quote creation even if signature save fails
        }
      }

      // Now upload quote files to storage (AFTER quote creation)
      const uploadedFiles = [];
      if (files.length > 0) {
        try {
          for (const file of files) {
            if (file.data) {
              // File has base64 data, convert to blob and upload
      
              
              // Convert base64 to file
              const fileResponse = await fetch(file.data);
              const fileBlob = await fileResponse.blob();
              
              // Create a proper File object with the correct name and type
              const fileToUpload = new File([fileBlob], file.name, { type: file.type });
              
              // Upload file to storage (now with real quote ID)
              const { data: uploadResult, error: uploadError } = await uploadQuoteFile(
                fileToUpload, 
                quoteId, // Use real quote ID now
                user.id,
                currentProfile?.id, // Pass profile ID for foreign key constraint
                'attachment'
              );
              
              if (uploadError) {
                console.error('File upload failed:', uploadError);
                return;
              }
              
              if (uploadResult.success) {
                uploadedFiles.push({
                  ...file,
                  backendId: uploadResult.data.id,
                  file_path: uploadResult.data.file_path,
                  publicUrl: uploadResult.data.publicUrl
                });
        
              }
            } else if (file.backendId) {
              // File already uploaded (for editing existing quotes)
              uploadedFiles.push(file);
            } else {
              console.warn('File has no data or backendId, skipping:', file);
            }
          }
        } catch (error) {
          console.error('Error uploading files:', error);
          return;
        }
      }

      // Now update the quote with file references
      if (uploadedFiles.length > 0) {
        try {
          const filesToInsert = uploadedFiles.map((file, index) => ({
            quote_id: quoteId,
            file_name: file.name || file.file_name || '',
            file_path: file.file_path || file.path || file.file_path || file.url || '',
            file_size: file.size || file.file_size || 0,
            mime_type: file.type || file.mime_type || '',
            file_category: 'attachment'
            // Note: order_index column doesn't exist in schema, removed
          }));

          const { error: filesInsertError } = await supabase
            .from('quote_files')
            .insert(filesToInsert);

          if (filesInsertError) {
            console.error('Error saving file references to database:', filesInsertError);
            return;
          }
          
  
        } catch (error) {
          console.error('Error saving file references:', error);
          return;
        }
      }

      // NEW: Send email notification after successfully creating the quote
      if (createdQuote && selectedClient?.email && sendData?.method === 'email') {
        try {
          // Ensure the quote has a share token before sending email
          let shareToken = createdQuote.share_token;
          if (!shareToken) {
            const shareResult = await generatePublicShareLink(createdQuote.id, user?.id);
            if (shareResult?.success) {
              shareToken = shareResult.data?.share_token || shareResult.token;
              // Update the createdQuote object with the new share token
              createdQuote.share_token = shareToken;
              
              // Update the quote in database with the share token
              const { error: updateError } = await supabase
                .from('quotes')
                .update({ share_token: shareToken })
                .eq('id', createdQuote.id);
              
              if (updateError) {
                console.warn('Failed to update quote with share token:', updateError);
              }
            } else {
              console.error('Failed to generate share token for email:', shareResult?.error);
            }
          }

          // Send quote notification email using new template system
          const emailResult = await EmailService.sendQuoteSentEmail(
            createdQuote,
            selectedClient,
            companyInfo,
            user.id
          );
          
          if (emailResult.success) {
            console.log('Quote notification email sent successfully');
            
            // Update sent_at timestamp when email is sent
            await supabase
              .from('quotes')
              .update({ sent_at: new Date().toISOString() })
              .eq('id', createdQuote.id);
            
            // Log email sent event to quote_events table
            try {
              await supabase
                .from('quote_events')
                .insert({
                  quote_id: createdQuote.id,
                  user_id: null, // System event
                  type: 'email_sent',
                  share_token: shareToken, // Use dedicated column
                  meta: {
                    email_type: 'quote_notification',
                    recipient: selectedClient.email,
                    timestamp: new Date().toISOString()
                  }
                });
            } catch (eventError) {
              console.warn('Failed to log email event:', eventError);
            }
          } else {
            console.error('Failed to send quote notification email:', emailResult.error);
          }
        } catch (emailError) {
          console.error('Error sending quote notification email:', emailError);
          // Don't fail quote sending if email fails
        }
      }

      // Removed legacy local backup of quotes list; rely on backend only

      // Clear all quote creation data from localStorage
      clearAllQuoteData();
      
      // Clear form data for clean state
      clearFormData();

      // Redirect
      navigate('/quotes-management');
    } catch (error) {
      console.error('Error sending quote:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepChange = (newStep) => {
    // Validation functions matching the component validation logic
    const isStep1Valid = () => {
      // Check if a client is selected (either existing or new)
      const isClientValid = selectedClient;

      // Check if project information is complete
      const isProjectValid = 
        projectInfo.categories && 
        projectInfo.categories.length > 0 &&
        projectInfo.deadline &&
        projectInfo.description &&
        projectInfo.description.trim().length > 0;

      // If "autre" category is selected, custom category must be filled
      const isCustomCategoryValid = !projectInfo.categories?.includes('autre') || 
        (projectInfo.customCategory && projectInfo.customCategory.trim().length > 0);

      return isClientValid && isProjectValid && isCustomCategoryValid;
    };

    const isStep2Valid = () => {
      return tasks.length > 0;
    };

    // Validate step change based on comprehensive validation
    let canProceed = false;
    
    if (newStep <= currentStep) {
      // Can always go back or stay on current step
      canProceed = true;
    } else if (newStep === 2) {
      canProceed = isStep1Valid();
    } else if (newStep === 3) {
      canProceed = isStep1Valid() && isStep2Valid();
    } else if (newStep === 4) {
      canProceed = isStep1Valid() && isStep2Valid();
    }

    if (canProceed) {
      // Auto-save before changing step
      const savedTime = new Date().toISOString();
      const quoteData = {
        selectedClient: normalizeSelectedClient(selectedClient),
        projectInfo,
        tasks,
        files,
        currentStep: newStep,
        companyInfo,
        financialConfig,
        lastSaved: savedTime
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
      setLastSaved(savedTime);
      
      setCurrentStep(newStep);
    } else {
      // Show specific validation error message
      let errorMessage = 'Veuillez remplir les informations requises avant de passer à l\'étape suivante.';
      
      if (newStep === 2 && !isStep1Valid()) {
        if (!selectedClient) {
          errorMessage = 'Veuillez sélectionner un client.';
        } else if (!projectInfo.categories || projectInfo.categories.length === 0) {
          errorMessage = 'Veuillez sélectionner au moins une catégorie de projet.';
        } else if (!projectInfo.deadline) {
          errorMessage = 'Veuillez définir une date limite pour le projet.';
        } else if (!projectInfo.description || projectInfo.description.trim().length === 0) {
          errorMessage = 'Veuillez décrire le projet.';
        } else if (projectInfo.categories.includes('autre') && (!projectInfo.customCategory || projectInfo.customCategory.trim().length === 0)) {
          errorMessage = 'Veuillez spécifier la catégorie personnalisée.';
        }
      } else if (newStep === 3 && !isStep2Valid()) {
        errorMessage = 'Veuillez ajouter au moins une tâche avant de continuer.';
      }
      
      alert(errorMessage);
    }
  };

  // Generate quote number for preview
  const generateQuoteNumberForPreview = async () => {
    try {
      if (!user?.id) return;
      
      // First try to get a unique quote number from the backend service
      const { data: quoteNumber, error: numberError } = await generateQuoteNumber(user.id);
      
      if (numberError) {
        console.warn('Error generating quote number for preview, using fallback:', numberError);
      }
      
      let finalQuoteNumber = quoteNumber;
      
      // If backend didn't provide a number, generate a fallback with timestamp for uniqueness
      if (!finalQuoteNumber) {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        finalQuoteNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
      }
      
      // Store the quote number in projectInfo for display
      setProjectInfo(prev => ({
        ...prev,
        quoteNumber: finalQuoteNumber
      }));
      
      // Auto-save with the new quote number
      const savedTime = new Date().toISOString();
      const quoteData = {
        selectedClient,
        projectInfo: { ...projectInfo, quoteNumber: finalQuoteNumber },
        tasks,
        files,
        currentStep: 4,
        companyInfo,
        financialConfig,
        lastSaved: savedTime
      };
      localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
      setLastSaved(savedTime);
      
      
    } catch (error) {
      console.error('Error generating quote number for preview:', error);
      // Use fallback quote number with timestamp and random suffix for uniqueness
      const timestamp = Date.now();
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const fallbackNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
      setProjectInfo(prev => ({
        ...prev,
        quoteNumber: fallbackNumber
      }));
    }
  };

  // Comprehensive localStorage clearing function
  const clearAllQuoteData = () => {
    if (user?.id) {
      // Clear draft data
      localStorage.removeItem(getDraftKey());
      // Delete only the current session's backend draft row, not all drafts
      try {
        const rowId = localStorage.getItem(getDraftRowIdKey());
        if (rowId) {
          deleteQuoteDraftById(rowId);
        }
      } catch (_) {}
      localStorage.removeItem(getDraftRowIdKey());
      
      // Clear company info
      localStorage.removeItem(`company-info-${user.id}`);
      localStorage.removeItem(`company-logo-${user.id}`);
      localStorage.removeItem(`company-signature-${user.id}`);
      
      // Clear client signature
      localStorage.removeItem(`client-signature-${user.id}`);
      localStorage.removeItem('quote-signature-data'); // Clear client signature data
      
      // Clear quote files
      localStorage.removeItem(`quote-files-${user.id}`);
      
      // Clear any other quote-related data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('quote-') || key.includes('draft-')) && key.includes(user.id)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };




  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <ClientSelection
            selectedClient={selectedClient}
            projectInfo={projectInfo}
            onClientSelect={handleClientSelect}
            onProjectInfoChange={handleProjectInfoChange}
            onNext={handleNext}
            leadId={leadId}
          />
        );
      case 2:
        return (
          <TaskDefinition
            tasks={tasks}
            projectCategory={projectInfo.categories}
            projectDescription={projectInfo.description}
            projectCustomCategory={projectInfo.customCategory}
            onTasksChange={handleTasksChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <FileUpload
            files={files}
            onFilesChange={handleFilesChange}
            onNext={handleNext}
            onPrevious={handlePrevious}
            quoteId={editingQuoteId}
            isSaving={isSaving}
          />
        );
      case 4:
        // Ensure quote number exists for preview
        if (!projectInfo.quoteNumber && user?.id) {
          // Generate quote number if it doesn't exist
          setTimeout(() => generateQuoteNumberForPreview(), 100);
        }
        
        return (
          <QuotePreview
            selectedClient={selectedClient}
            tasks={tasks}
            files={files}
            projectInfo={projectInfo}
            quoteNumber={projectInfo.quoteNumber}
            companyInfo={companyInfo}
            financialConfig={financialConfig}
            quoteId={editingQuoteId}
            onPrevious={handlePrevious}
            onSave={handleSave}
            onSend={handleSend}
            onCompanyInfoChange={handleCompanyInfoChange}
            onFinancialConfigChange={setFinancialConfig}
            isSaving={isSaving}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <div 
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
          transition: 'margin-left 0.3s ease-out'
        }}
        className="min-h-screen pt-4 md:pt-0"
      >
        <div className="container mx-auto px-4 sm:px-6 pt-0 pb-4 sm:pb-8 max-w-7xl">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
                <div className="flex items-center">
                  <Icon name="FileText" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {isEditing ? 'Modifier le devis' : 'Créer un devis'}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {isEditing 
                    ? 'Modifiez les informations du devis existant'
                    : 'Remplissez les informations ci-dessous pour générer automatiquement un devis professionnel'
                  }
                  {projectInfo.quoteNumber && (
                    <span className="ml-2 inline-flex items-center text-blue-500 text-xs">
                      {projectInfo.quoteNumber}
                    </span>
                  )}
              </p>
            </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
              {isLoadingQuote && (
                  <div className="flex items-center text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                    <Icon name="Loader" size={14} className="sm:w-4 sm:h-4 mr-2 animate-spin" />
                    Chargement du devis...
                  </div>
              )}
              {isSaving && (
                  <div className="flex items-center text-xs sm:text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-200">
                    <Icon name="Save" size={14} className="sm:w-4 sm:h-4 mr-2 animate-pulse" />
                    Sauvegarde en cours...
                  </div>
              )}
              {isAutoSaving && !isSaving && (
                  <div className="flex items-center text-xs sm:text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                    <Icon name="Save" size={14} className="sm:w-4 sm:h-4 mr-2 animate-pulse" />
                    Sauvegarde automatique...
                  </div>
              )}
              {lastSaved && !isAutoSaving && !isLoadingQuote && !isSaving && (
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 mr-2 text-green-500" />
                    Sauvegardé {new Date(lastSaved).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
              )}
              
              {/* Clear draft button removed per new flow */}
              

              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
              <StepIndicator 
                currentStep={currentStep} 
                onStepChange={handleStepChange} 
              />
              {renderCurrentStep()}
            </div>

            {/* Recommendations Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Step box */}
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center">
                <span className="text-3xl sm:text-4xl font-extrabold text-primary">Étape {currentStep}/4</span>
            </div>
              {/* Recommendation box */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                  <Icon name="Sparkles" size={14} className="mr-2 text-primary" />
                  Recommandations
                </h3>
                {currentStep === 1 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Sparkles" size={14} className="mt-0.5 mr-2 text-primary" />Sélectionnez au moins une catégorie (obligatoire) pour activer les suggestions de tâches.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Sparkles" size={14} className="mt-0.5 mr-2 text-primary" />Vous pouvez choisir plusieurs catégories si nécessaire.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Mic" size={14} className="mt-0.5 mr-2 text-primary" />Cliquez sur l'icône micro pour dicter; l'IA nettoie et reformule proprement.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Wand2" size={14} className="mt-0.5 mr-2 text-primary" />Utilisez « Améliorer » pour une description courte, claire et professionnelle.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Globe" size={14} className="mt-0.5 mr-2 text-primary" />La langue suit vos préférences de compte.</div>
          </div>
                    <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">
                      <Icon name="Info" size={14} className="mr-2 mt-0.5" />
                      Astuce: plus votre description est précise, meilleures seront les suggestions de tâches.
                    </div>
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Mic" size={14} className="mt-0.5 mr-2 text-primary" />Dictez/écrivez; l'IA génère description, durée, prix et matériaux proposés.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Hand" size={14} className="mt-0.5 mr-2 text-primary" />Cliquez sur une suggestion pour préremplir; modifiez librement avant d'ajouter.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Coins" size={14} className="mt-0.5 mr-2 text-primary" />Vérifiez les prix et quantités de matériaux; ajustez selon votre tarif.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Clock" size={14} className="mt-0.5 mr-2 text-primary" />Durée par défaut en heures; renseignez la durée pour un prix cohérent.</div>
                    </div>
                    <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">
                      <Icon name="Info" size={14} className="mr-2 mt-0.5" />
                      Astuce: ajoutez les tâches une par une pour garder un devis clair.
                    </div>
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Image" size={14} className="mt-0.5 mr-2 text-primary" />Ajoutez des fichiers utiles (photos avant/après, croquis, PDF).</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Upload" size={14} className="mt-0.5 mr-2 text-primary" />Glissez‑déposez ou cliquez pour sélectionner; privilégiez PDF/JPG/PNG légers.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Type" size={14} className="mt-0.5 mr-2 text-primary" />Nommez vos fichiers clairement pour le client.</div>
                    </div>
                    <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">
                      <Icon name="Info" size={14} className="mr-2 mt-0.5" />
                      Astuce: des visuels clairs augmentent le taux d'acceptation.
                    </div>
                  </>
                )}
                {currentStep === 4 && (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Percent" size={14} className="mt-0.5 mr-2 text-primary" />Configurez la TVA et l'acompte dans « Configuration ».</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Palette" size={14} className="mt-0.5 mr-2 text-primary" />Personnalisez le modèle et les couleurs.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="Download" size={14} className="mt-0.5 mr-2 text-primary" />Téléchargez le devis en PDF.</div>
                      <div className="flex items-start text-sm text-muted-foreground"><Icon name="EyeOff" size={14} className="mt-0.5 mr-2 text-primary" />Masquez les prix des matériaux dans les Préférences du compte si besoin.</div>
                    </div>
                    <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">
                      <Icon name="Info" size={14} className="mr-2 mt-0.5" />
                      Astuce: un devis simple et lisible se signe plus vite.
                    </div>
                  </>
                )}
              </div>
              {/* Notes box */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Brouillon auto‑enregistré. Vous pouvez le retrouver dans
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/quotes-management')}
                    className="inline-flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                  >
                    <Icon name="ExternalLink" size={14} />
                    Gestion des devis
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Send Modal */}
      <QuoteSendModal
        isOpen={showQuoteSendModal}
        onClose={() => setShowQuoteSendModal(false)}
        onSend={processQuoteSend}
        selectedClient={selectedClient}
        projectInfo={projectInfo}
        companyInfo={companyInfo}
        quoteNumber={projectInfo.quoteNumber}
        tasks={tasks}
        files={files}
        financialConfig={financialConfig}
        signatureData={null}
      />

    </div>
  );
};

export default QuoteCreation;