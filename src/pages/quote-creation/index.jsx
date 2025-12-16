import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import PermissionGuard from '../../components/PermissionGuard';
import MainSidebar from '../../components/ui/MainSidebar';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { useTranslation } from 'react-i18next';

import StepIndicator from './components/StepIndicator';

import ClientSelection from './components/ClientSelection';

import TaskDefinition from './components/TaskDefinition';

import FileUpload from './components/FileUpload';

import QuotePreview from './components/QuotePreview';

import QuoteSendModal from './components/QuoteSendModal';

// AIScoring removed

import { generateQuoteNumber, createQuote, fetchQuoteById, updateQuote, saveQuoteDraft, deleteQuoteDraftById, deleteQuoteDraftByQuoteNumber, getQuoteByQuoteNumber } from '../../services/quotesService';
import { uploadQuoteFile, uploadQuoteSignature } from '../../services/quoteFilesService';

import { saveCompanyInfo } from '../../services/companyInfoService';

import { LeadManagementService } from '../../services/leadManagementService';

import { supabase } from '../../services/supabaseClient';

import EmailService from '../../services/emailService';

import { generatePublicShareLink } from '../../services/shareService';

import { getPublicUrl } from '../../services/storageService';
import { calculateQuoteTotals } from '../../utils/quotePriceCalculator';






const QuoteCreation = () => {
  const { t } = useTranslation();
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
  const [isFileUploading, setIsFileUploading] = useState(false);



  // Draft expiration (24 hours)

  const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

  const isDraftExpired = (isoTimestamp) => {

    if (!isoTimestamp) return false;

    const saved = new Date(isoTimestamp).getTime();

    if (Number.isNaN(saved)) return false;

    return Date.now() - saved > DRAFT_TTL_MS;

  };





  // Helper function to generate draft key with quote number for unique identification
  const getDraftKeyByQuoteNumber = (quoteNumber) => {
    if (!quoteNumber) return `quote-draft-${user?.id}-${currentProfile?.id || 'default'}`;
    return `quote-draft-${user?.id}-${currentProfile?.id || 'default'}-${quoteNumber}`;
  };

  const getDraftRowIdKeyByQuoteNumber = (quoteNumber) => {
    if (!quoteNumber) return `quote-draft-rowid-${user?.id}-${currentProfile?.id || 'default'}`;
    return `quote-draft-rowid-${user?.id}-${currentProfile?.id || 'default'}-${quoteNumber}`;
  };




  // Normalize selected client to a minimal, non-duplicated structure for drafts

  const normalizeSelectedClient = (sel) => {

    if (!sel) return null;

    const c = sel.client || sel;

    const id = c.id || sel.id || sel.value || null;

    return id ? {

      id,

      value: id, // keep compatibility for consumers reading .value

      name: c.name || sel.name || (sel.label ? sel.label.replace(/^[👤🏢]\s*/, '') : '') || '', // Clean name without emoji

      label: sel.label || c.name || sel.name || '', // Keep label for backward compatibility

      email: c.email || sel.email || '',

      phone: c.phone || sel.phone || '',

      address: c.address || sel.address || '',

      city: c.city || sel.city || '',

      postalCode: c.postal_code || sel.postalCode || c.postalCode || '',

      postal_code: c.postal_code || sel.postalCode || c.postalCode || '', // Keep both for compatibility

      country: c.country || sel.country || '',

      // Professional client fields

      type: c.type || sel.type || c.client_type || sel.client_type || '',

      client_type: c.client_type || sel.client_type || c.type || sel.type || '', // Keep both for compatibility

      regNumber: c.regNumber || sel.regNumber || c.vat_number || sel.vat_number || '',

      vat_number: c.vat_number || sel.vat_number || c.regNumber || sel.regNumber || '', // Keep both for compatibility

      contactPerson: c.contactPerson || sel.contactPerson || c.contact_person || '',

      contact_person: c.contact_person || sel.contactPerson || c.contactPerson || '', // Keep both for compatibility

      companySize: c.companySize || sel.companySize || c.company_size || '',

      company_size: c.company_size || sel.companySize || c.companySize || '' // Keep both for compatibility

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

        // Restore projectInfo with quote number from draft (check both draft_data and quote_number column)
        const draftQuoteNumber = data.quote_number || d.projectInfo?.quoteNumber;
        const restoredProjectInfo = {
          ...(d.projectInfo || { categories: [], customCategory: '', deadline: '', description: '' }),
          quoteNumber: draftQuoteNumber || d.projectInfo?.quoteNumber
        };
        setProjectInfo(restoredProjectInfo);
        
        // Also store quote number in localStorage for consistency (used in send flow)
        if (draftQuoteNumber) {
          localStorage.setItem('pre_generated_quote_number', draftQuoteNumber);
        }

        setTasks(d.tasks || []);

        setFiles(d.files || []);

        setCompanyInfo(d.companyInfo || null);

        setFinancialConfig(d.financialConfig || null);

        setCurrentStep(d.currentStep || 1);

        setLastSaved(d.lastSaved || new Date().toISOString());

        // Restore leadId if this draft is from a lead
        if (d.leadId) {
          setLeadId(d.leadId);
        }


        // Restore client signature from draft
        if (d.clientSignature && d.selectedClient?.id) {
          try {
            localStorage.setItem(`client-signature-${user.id}-${d.selectedClient.id}`, JSON.stringify(d.clientSignature));
          } catch (e) {
            console.warn('Failed to restore client signature:', e);
          }
        } else if (d.clientSignature && d.selectedClient?.value) {
          try {
            localStorage.setItem(`client-signature-${user.id}-${d.selectedClient.value}`, JSON.stringify(d.clientSignature));
          } catch (e) {
            console.warn('Failed to restore client signature:', e);
          }
        }

        // Use quote number for draft key if available
        const quoteNumber = d.projectInfo?.quoteNumber;
        const fallbackKey = `quote-draft-${user.id}-${currentProfile?.id || 'default'}`;
        const fallbackRowIdKey = `quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`;

        if (quoteNumber) {
          const draftKey = getDraftKeyByQuoteNumber(quoteNumber);
          const draftRowIdKey = getDraftRowIdKeyByQuoteNumber(quoteNumber);

          // Persist as current draft for continuity
          try { localStorage.setItem(draftKey, JSON.stringify(d)); } catch { }
          // Bind this editing session to the backend draft row id so autosave updates the same row
          try { localStorage.setItem(draftRowIdKey, data.id); } catch { }
          // Also store in fallback key for consistency
          try { localStorage.setItem(fallbackRowIdKey, data.id); } catch { }
        } else {
          // Fallback to user-based keys
          try { localStorage.setItem(fallbackKey, JSON.stringify(d)); } catch { }
          try { localStorage.setItem(fallbackRowIdKey, data.id); } catch { }
        }
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

        try { localStorage.removeItem(`quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`); } catch { }
      }

    } else if (duplicateId) {

      setIsEditing(false);

      setEditingQuoteId(duplicateId);

      loadExistingQuote(duplicateId, true);

      // New session: clear any previous draft row binding to avoid overriding previous draft

      try { localStorage.removeItem(`quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`); } catch { }
    } else if (leadId) {

      // Handle lead-based quote creation

      setIsEditing(false);

      setEditingQuoteId(null);

      loadLeadData(leadId);

      // Clear any previous draft row binding for new quote from lead

      try { localStorage.removeItem(`quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`); } catch { }
    } else {

      setIsEditing(false);

      setEditingQuoteId(null);

      // Brand-new quote session: clear any previous draft row binding to force insert of a new draft row

      try { localStorage.removeItem(`quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`); } catch { }
    }

  }, [searchParams]);


  // Clean up quote files from localStorage when page loads
  useEffect(() => {
    const cleanupQuoteFiles = () => {
      try {
        // Get all localStorage keys
        const keys = Object.keys(localStorage);

        // Find and remove quote file keys
        const quoteFileKeys = keys.filter(key =>
          key.includes('quote-files-')
        );

        // Remove each quote file key
        quoteFileKeys.forEach(key => {
          localStorage.removeItem(key);
        });



      } catch (error) {
        console.warn('Error cleaning up quote files from localStorage:', error);
      }
    };

    // Run cleanup when component mounts
    cleanupQuoteFiles();
  }, []); // Empty dependency array means this runs once when component mounts


  // No automatic clearing on back/unload: drafts must persist until explicit save/send



  // Load lead data for quote creation

  const loadLeadData = async (leadId) => {

    if (!leadId || !user?.id) return;



    try {

      setIsLoadingQuote(true);

      // Check if client was already added for this lead
      const storedClientId = localStorage.getItem(`lead-client-id-${leadId}`);
      const clientAdded = localStorage.getItem(`lead-client-added-${leadId}`) === 'true';

      if (clientAdded && storedClientId) {
        // Client was already added, fetch it from database
        try {
          const { fetchClientById } = await import('../../services/clientsService');
          const { data: clientData, error: clientError } = await fetchClientById(storedClientId);

          if (!clientError && clientData) {
            // Format the client for selection (matching the format used in ClientSelection)
            const nameIcon = clientData.type === 'professionnel' ? '🏢' : '👤';
            const formattedClient = {
              value: clientData.id,
              label: `${nameIcon} ${clientData.name}`,
              description: `${clientData.email || ''} ${clientData.phone ? '📞 ' + clientData.phone : ''}`.trim(),
              type: clientData.type || 'particulier',
              client: clientData,
              address: clientData.address,
              city: clientData.city,
              postalCode: clientData.postalCode || clientData.postal_code,
              country: clientData.country || 'BE',
              email: clientData.email,
              phone: clientData.phone,
              id: clientData.id,
              name: clientData.name // Keep name for compatibility
            };

            setSelectedClient(formattedClient);

            // Load project information from lead
            const { data: leadData } = await LeadManagementService.getLeadDetailsForQuote(leadId);
            if (leadData) {
              setProjectInfo({
                categories: leadData.project_categories || [],
                customCategory: leadData.custom_category || '',
                deadline: leadData.completion_date || '',
                description: leadData.project_description || ''
              });
            }

            setIsLoadingQuote(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching stored client:', error);
          // Continue to load lead data if client fetch fails
        }
      }

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



      // Clear tasks for new quote, but preserve any existing files
      setTasks([]);

      // Don't clear files - they might be uploaded before selecting lead
      // setFiles([]);


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

      // Check if this quote is from a lead
      if (!isDuplicating) {
        try {
          const { data: leadQuote, error: leadQuoteError } = await supabase
            .from('lead_quotes')
            .select('lead_id')
            .eq('quote_id', quoteId)
            .eq('artisan_user_id', user.id)
            .single();

          if (!leadQuoteError && leadQuote?.lead_id) {
            setLeadId(leadQuote.lead_id);
          }
        } catch (error) {
          console.warn('Error checking if quote is from lead:', error);
          // Continue with quote loading even if lead check fails
        }
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

          // Use total_price first since users enter total prices (already multiplied)
          // If total_price is not available, calculate it from unit_price * quantity
          // Fallback to unit_price only if quantity is missing
          price: material.total_price || 
                 (material.unit_price && material.quantity ? (material.unit_price * material.quantity) : material.unit_price) || 
                 0

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



      // Get public URLs for all files (bucket is now public)

      const transformedFiles = [];

      for (const file of quote.quote_files || []) {

        const publicUrl = getPublicUrl('quote-files', file.file_path);





        transformedFiles.push({

          id: file.id,

          name: file.file_name,

          path: file.file_path,

          size: file.file_size,

          type: file.mime_type,

          uploadedAt: new Date(file.created_at),

          backendId: file.id, // Important for edit mode

          publicUrl: publicUrl, // Public URL for public bucket access

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

            url: getPublicUrl('company-assets', quote.company_profile.logo_path)

          } : null,

          signature: quote.company_profile.signature_path ? {

            name: quote.company_profile.signature_filename || 'company-signature',

            size: quote.company_profile.signature_size || 0,

            type: quote.company_profile.signature_mime_type || 'image/*',

            data: null, // Will be loaded from storage

            path: quote.company_profile.signature_path,

            url: getPublicUrl('company-assets', quote.company_profile.signature_path)

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

          ? getPublicUrl('signatures', clientSignature.signature_file_path)

          : (clientSignature.signature_data ? `data:image/png;base64,${clientSignature.signature_data}` : null);

        const clientSignatureData = {
          signature: signatureUrl,

          clientComment: clientSignature.signer_email || '',

          signedAt: clientSignature.signed_at || new Date().toISOString()

        };

        if (user?.id && signatureUrl) {

          // Save with both user ID and client ID for better organization

          const clientId = quote.client?.id;

          if (clientId) {

            localStorage.setItem(`client-signature-${user.id}-${clientId}`, JSON.stringify(clientSignatureData));
          }

          // Also save to general user signature for backward compatibility

          localStorage.setItem(`client-signature-${user.id}`, JSON.stringify(clientSignatureData));
        }

      }



      // Load financial configuration if exists

      let financialConfig = null;

      if (quote.quote_financial_configs && quote.quote_financial_configs.length > 0) {

        const financialData = quote.quote_financial_configs[0]; // Assuming one financial config per quote



        financialConfig = {

          vatConfig: {

            display: financialData.vat_config?.display ?? true,

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

          },

          materialPriceDisplay: financialData.show_material_prices ?? (localStorage.getItem('include-materials-prices') ?? 'true') === 'true'

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







  // Save draft function - called only on navigation button clicks
  const saveDraftOnNavigation = async (targetStep) => {
    // Prevent saving if no data
    if (!selectedClient && tasks.length === 0 && files.length === 0 &&
        projectInfo.categories.length === 0 && !projectInfo.description && !projectInfo.deadline) {
      return;
    }

        setIsAutoSaving(true);

    try {
        const savedTime = new Date().toISOString();

        // Calculate totals using centralized calculator
        const financialBreakdown = calculateQuoteTotals(tasks, financialConfig);
        const { totalBeforeVAT: totalAmount, vatAmount: taxAmount, totalWithVAT: finalAmount, depositAmount } = financialBreakdown;

        // Include calculated amounts in projectInfo for quotes management display
        const enhancedProjectInfo = {
          ...projectInfo,
          totalAmount,
          taxAmount,
          finalAmount,
          depositAmount
        };

        const quoteData = {
          selectedClient: normalizeSelectedClient(selectedClient),
          projectInfo: enhancedProjectInfo,
          tasks,
          files,
        currentStep: targetStep !== undefined ? targetStep : currentStep,
          companyInfo,
          financialConfig,
          leadId: leadId || null,
        // Get client signature from localStorage
          clientSignature: (() => {
            const clientId = selectedClient?.id || selectedClient?.value || selectedClient?.client?.id;
            if (clientId) {
              const key = `client-signature-${user.id}-${clientId}`;
              const storedSignature = localStorage.getItem(key);
              if (storedSignature) {
                try {
                  return JSON.parse(storedSignature);
                } catch (e) {
                  console.warn('Failed to parse stored signature:', e);
                }
              }
            }
            return null;
          })(),
          lastSaved: savedTime,
          // Add calculated amounts at the top level for quotes management display
          totalAmount,
          taxAmount,
          finalAmount,
          depositAmount
        };

      // Save to localStorage
        try {
          const quoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
          const draftKey = getDraftKeyByQuoteNumber(quoteNumber);
          localStorage.setItem(draftKey, JSON.stringify(quoteData));
          setLastSaved(savedTime);
        } catch (localStorageError) {
          console.error('Error saving to localStorage:', localStorageError);
      }

      // Save to backend draft table (if not editing an existing quote)
      if (user?.id && !isEditing && !editingQuoteId) {
        try {
              const quoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
              const draftRowIdKey = getDraftRowIdKeyByQuoteNumber(quoteNumber);
              const existingRowId = localStorage.getItem(draftRowIdKey);

              const fallbackRowIdKey = `quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`;
              const fallbackRowId = !quoteNumber ? localStorage.getItem(fallbackRowIdKey) : null;
              const rowIdToUse = existingRowId || fallbackRowId;

              const { data: saved, error: draftErr } = await saveQuoteDraft({
                id: rowIdToUse || undefined,
                user_id: user.id,
                profile_id: currentProfile?.id || null,
                draft_data: quoteData,
                quote_number: quoteNumber || null
              });

              if (!draftErr && saved?.id) {
                if (quoteNumber) {
                  localStorage.setItem(draftRowIdKey, saved.id);
                }
                if (!rowIdToUse) {
                  localStorage.setItem(fallbackRowIdKey, saved.id);
                }
              }
        } catch (e) {
          console.warn('Draft save on navigation failed:', e?.message || e);
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
          setIsAutoSaving(false);
    }
  };

  // Auto-save draft when financialConfig or companyInfo changes on Step 4
  // This ensures VAT% and other configs are saved even if user doesn't navigate away
  useEffect(() => {
    // Only auto-save on Step 4 (Preview step) when configs change
    if (currentStep === 4 && financialConfig) {
      // Debounce the save to avoid too many saves
      const timeoutId = setTimeout(() => {
        saveDraftOnNavigation(4);
      }, 1000); // Wait 1 second after last change

      return () => clearTimeout(timeoutId);
    }
  }, [financialConfig, companyInfo, currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

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

              url: getPublicUrl('company-assets', companyProfile.logo_path)

            } : null,

            signature: companyProfile.signature_path ? {

              name: companyProfile.signature_filename || 'company-signature',

              size: companyProfile.signature_size || 0,

              type: companyProfile.signature_mime_type || 'image/*',

              path: companyProfile.signature_path,

              url: getPublicUrl('company-assets', companyProfile.signature_path)

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

        // Check for quote number-based draft first
        const quoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
        if (quoteNumber) {
          const draftKey = getDraftKeyByQuoteNumber(quoteNumber);
          const local = JSON.parse(localStorage.getItem(draftKey) || 'null');
          if (local?.lastSaved && isDraftExpired(local.lastSaved)) {

            localStorage.removeItem(draftKey);
          }
        } else {
          // Fallback to user-based draft
          const fallbackKey = `quote-draft-${user.id}-${currentProfile?.id || 'default'}`;
          const local = JSON.parse(localStorage.getItem(fallbackKey) || 'null');
          if (local?.lastSaved && isDraftExpired(local.lastSaved)) {
            localStorage.removeItem(fallbackKey);
          }
        }

      } catch { }

    }

  }, [user?.id, currentProfile?.id, projectInfo.quoteNumber]);


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



  const handleNext = async () => {
    // Prevent moving to next step if files are uploading
    if (isFileUploading) {
      return;
    }

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

        // Include leadId if this is a lead quote
        leadId: leadId || null,

        // Include client signature when moving between steps
        clientSignature: selectedClient?.id || selectedClient?.value ?
          localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`) ?
            JSON.parse(localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`)) : null : null,
        lastSaved: savedTime

      };


      // Use quote number for draft key if available
      const quoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
      const draftKey = getDraftKeyByQuoteNumber(quoteNumber);
      localStorage.setItem(draftKey, JSON.stringify(quoteData));
      setLastSaved(savedTime);

      // Save to backend draft table on navigation (if not editing an existing quote)
      if (user?.id && !isEditing && !editingQuoteId) {
        try {
          const draftRowIdKey = getDraftRowIdKeyByQuoteNumber(quoteNumber);
          const existingRowId = localStorage.getItem(draftRowIdKey);

          // Also check fallback user-based key if quote number is not available
          const fallbackRowIdKey = `quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`;
          const fallbackRowId = !quoteNumber ? localStorage.getItem(fallbackRowIdKey) : null;

          // Use existing row ID if available (from quote number key or fallback key)
          const rowIdToUse = existingRowId || fallbackRowId;

          const { data: saved, error: draftErr } = await saveQuoteDraft({
            id: rowIdToUse || undefined,
            user_id: user.id,
            profile_id: currentProfile?.id || null,
            draft_data: quoteData,
            quote_number: quoteNumber || null
          });

          // Store the row ID in both keys for future reference
          if (!draftErr && saved?.id) {
            if (quoteNumber) {
              localStorage.setItem(draftRowIdKey, saved.id);
            }
            // Also store in fallback key for cases where quote number isn't set yet
            if (!rowIdToUse) {
              localStorage.setItem(fallbackRowIdKey, saved.id);
            }
          }
        } catch (e) {
          console.warn('Draft save on navigation failed:', e?.message || e);
        }
      }

      // If moving to step 4 (preview), generate quote number only if it doesn't exist
      // Don't generate if we're editing or if a quote number already exists (e.g., from a resumed draft)

      if (currentStep === 3 && !isEditing && !editingQuoteId && !projectInfo.quoteNumber) {

        generateQuoteNumberForPreview();

      }



      setCurrentStep(currentStep + 1);

    }

  };



  const handlePrevious = async () => {
    if (currentStep > 1) {
      // Save draft before moving to previous step (with loading state)
      await saveDraftOnNavigation(currentStep - 1);

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

  const handleFileUploadStatusChange = (isUploading) => {
    setIsFileUploading(isUploading);
  };



  const handleCompanyInfoChange = (newCompanyInfo) => {

    setCompanyInfo(newCompanyInfo);

  };



  // Enhanced handleSave with better data structure and backend integration

  const handleSave = async (data) => {

    try {

      setIsSaving(true);


      // Manual save: If editing an existing quote, skip draft table and update quote directly
      // Otherwise, save to draft table
      if (user?.id && !isEditing && !editingQuoteId) {
        // Only save to draft table if we're NOT editing an existing quote
        // Force a complete auto-save with all signature data before proceeding
        const savedTime = new Date().toISOString();
        const completeDraftData = {
          selectedClient: normalizeSelectedClient(selectedClient),
          projectInfo,
          tasks,
          files,
          currentStep,
          companyInfo,
          financialConfig,
          // Include leadId if this is a lead quote
          leadId: leadId || null,
          // Use signature data from the QuotePreview component if available
          clientSignature: data?.signatureData || (selectedClient?.id || selectedClient?.value ?
            localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`) ?
              JSON.parse(localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`)) : null : null),
          lastSaved: savedTime
        };

        try {
          // Use quote number for unique draft identification if available
          const quoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
          const draftRowIdKey = getDraftRowIdKeyByQuoteNumber(quoteNumber);

          const existingRowId = localStorage.getItem(draftRowIdKey);
          const { data: saved, error: draftErr } = await saveQuoteDraft({
            id: existingRowId || undefined,
            user_id: user.id,
            profile_id: currentProfile?.id || null,
            draft_data: completeDraftData,
            // Add quote number to draft data for better identification
            quote_number: quoteNumber || null
          });

          if (!draftErr && saved?.id && !existingRowId) {
            localStorage.setItem(draftRowIdKey, saved.id);
          }

          // Client signature will be saved when the quote is actually created
          if (completeDraftData.clientSignature && selectedClient?.id) {
            console.log('Client signature will be saved when quote is created');
          }

          if (draftErr) {
            console.warn('Manual draft save failed:', draftErr);
          } else {
            console.log('Manual draft save successful');
          }
        } catch (e) {
          console.warn('Manual draft save error:', e?.message || e);
        }
      }


      // Check if we're editing an existing quote

      if (isEditing && editingQuoteId) {

        // Update existing quote - calculate totals using centralized calculator
        const financialBreakdown = calculateQuoteTotals(tasks, data.financialConfig);
        const { totalBeforeVAT: totalAmount, vatAmount: taxAmount, totalWithVAT: finalAmount, discountAmount, depositAmount } = financialBreakdown;

        const quoteData = {
          title: projectInfo.description || 'Nouveau devis',
          description: projectInfo.description || '',
          project_categories: projectInfo.categories || [],
          custom_category: projectInfo.customCategory || '',
          deadline: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : null,
          total_amount: totalAmount,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,

          // Add deposit amount to the quote data
          advance_payment_amount: depositAmount,

          // Add VAT config
          vat_config: data.financialConfig?.vatConfig || null,

          // Add marketing banner config
          marketing_banner: data.financialConfig?.marketingBannerConfig || null,

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

            // task.price is already total price - do NOT multiply by quantity (that causes huge amounts)
            total_price: task.price || task.unit_price || 0,

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

      // Check if we're editing a draft (has quote number but not a saved quote yet)
      // In this case, we still need to create a quote in the quotes table and clean up the draft
      // So we continue with the quote creation flow below

      // Check for existing quote number from draft or localStorage
      // Priority: projectInfo.quoteNumber > localStorage pre_generated > generate new
      let finalQuoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');

      // If we have a quote number, check if a quote already exists with it
      let existingQuote = null;
      if (finalQuoteNumber && user?.id) {
        const { data: existingQuoteData, error: checkError } = await getQuoteByQuoteNumber(user.id, finalQuoteNumber);
        if (checkError) {
          console.warn('Error checking for existing quote:', checkError);
        } else if (existingQuoteData) {
          existingQuote = existingQuoteData;
          console.log('Found existing quote with number:', finalQuoteNumber, 'ID:', existingQuoteData.id);
        }
      }

      // Only generate a new quote number if we don't have one AND no existing quote was found
      if (!finalQuoteNumber && !existingQuote) {
        // Generate quote number using the service
        const { data: quoteNumber, error: numberError } = await generateQuoteNumber(user?.id);

        if (numberError) {
          console.warn('Error generating quote number, using fallback:', numberError);
        }

        finalQuoteNumber = quoteNumber;

        // If backend didn't provide a number, generate a fallback with timestamp for uniqueness
        if (!finalQuoteNumber) {
          const timestamp = Date.now();
          const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          finalQuoteNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;
        }
      } else if (finalQuoteNumber) {
        // Clear the pre-generated number since we're using the existing one
        localStorage.removeItem('pre_generated_quote_number');
      }



      // Calculate totals using centralized calculator
      const financialBreakdown = calculateQuoteTotals(tasks, data.financialConfig);
      const { totalBeforeVAT: totalAmount, vatAmount: taxAmount, totalWithVAT, balanceAmount, discountAmount, depositAmount } = financialBreakdown;
      // Use balanceAmount (totalWithVAT - deposit) for final_amount to show the amount client needs to pay
      const finalAmount = balanceAmount;

      // For new quotes, files will be uploaded when the quote is actually created
      const uploadedFiles = files;

      const quoteData = {
        user_id: user?.id,
        profile_id: currentProfile?.id,
        client_id: selectedClient?.value,
        quote_number: finalQuoteNumber,
        status: 'draft',
        title: projectInfo.description || 'Nouveau devis',
        description: projectInfo.description || '',
        project_categories: projectInfo.categories || [],
        custom_category: projectInfo.customCategory || '',
        start_date: new Date().toISOString().split('T')[0],
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,

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





      // If quote already exists, update it instead of creating a new one
      let quoteId;
      if (existingQuote) {
        console.log('Updating existing quote instead of creating new one:', existingQuote.id);
        // Update existing quote - calculate totals using centralized calculator
        const financialBreakdown = calculateQuoteTotals(tasks, data.financialConfig);
        const { totalBeforeVAT: totalAmount, vatAmount: taxAmount, totalWithVAT, balanceAmount, discountAmount, depositAmount } = financialBreakdown;
        // Use balanceAmount (totalWithVAT - deposit) for final_amount to show the amount client needs to pay
        const finalAmount = balanceAmount;

        const updateData = {
          title: projectInfo.description || 'Nouveau devis',
          description: projectInfo.description || '',
          project_categories: projectInfo.categories || [],
          custom_category: projectInfo.customCategory || '',
          total_amount: totalAmount,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,
          advance_payment_amount: depositAmount,
          vat_config: data.financialConfig?.vatConfig || null,
          marketing_banner: data.financialConfig?.marketingBannerConfig || null,
          valid_until: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          terms_conditions: data.financialConfig?.defaultConditions?.text || '',
          quote_number: finalQuoteNumber, // Preserve the quote number
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
            file_category: 'attachment',
            order_index: index
          }))
        };

        const { data: updatedQuote, error: updateError } = await updateQuote(existingQuote.id, updateData);

        if (updateError) {
          console.error('Error updating existing quote:', updateError);
          setIsSaving(false);
          return;
        }

        if (!updatedQuote) {
          console.error('Error updating quote: updatedQuote is null or undefined');
          setIsSaving(false);
          return;
        }

        quoteId = updatedQuote.id;
      } else {
        // Create quote in database with draft status
        const { data: createdQuote, error: createError } = await createQuote(quoteData);

        if (createError) {
          console.error('Error creating draft quote in backend:', createError);
          setIsSaving(false);
          return;
        }

        if (!createdQuote) {
          console.error('Error creating quote: createdQuote is null or undefined');
          setIsSaving(false);
          return;
        }

        quoteId = createdQuote.id;
      }



      // Now save financial configuration to database

      if (data.financialConfig && user?.id) {

        try {

          const financialConfigData = {

            quote_id: quoteId,

            vat_config: {

              display: data.financialConfig.vatConfig?.display ?? true,

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

            },

            show_material_prices: data.financialConfig.materialPriceDisplay ?? false

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



      // Handle temporary files: move from temp folder to quote folder and create database records

      const savedFiles = [];

      if (files.length > 0) {

        try {

          for (const file of files) {

            if (file.isTemporary && file.storagePath) {

              // This is a temporary file, move it from temp folder to quote folder

              const oldPath = file.storagePath; // temp/userId/timestamp-filename

              const newPath = `${quoteId}/attachment/${file.name}`; // quoteId/attachment/filename



              try {

                // Copy file to new location

                const { error: copyError } = await supabase

                  .storage

                  .from('quote-files')

                  .copy(oldPath, newPath);



                if (copyError) {

                  console.error('Error copying file:', copyError);

                  continue; // Skip this file if copy fails

                }



                // Create database record with new path

                const fileRecord = {

                  quote_id: quoteId,

                  file_name: file.name,

                  file_path: newPath, // Use new path

                  file_size: file.size,

                  mime_type: file.type,

                  file_category: 'attachment',

                  uploaded_by: currentProfile?.id || user.id

                };



                const { data: dbData, error: insertError } = await supabase

                  .from('quote_files')

                  .insert(fileRecord)

                  .select()

                  .single();



                if (insertError) {

                  console.error('Error creating file record:', insertError);

                  // Delete the copied file if DB insert fails

                  await supabase.storage.from('quote-files').remove([newPath]);

                  continue;

                }



                // Delete original temp file

                await supabase.storage.from('quote-files').remove([oldPath]);



                savedFiles.push({

                  ...file,

                  ...dbData,

                  backendId: dbData.id,

                  storagePath: newPath // Update with new path

                });



              } catch (error) {

                console.error('Error processing file:', error);

                continue;

              }

            } else if (file.backendId) {

              // File already has database record, just add to saved files

              savedFiles.push(file);

            } else {

              console.warn('File has no storage path or backendId, skipping:', file);

            }

          }

        } catch (error) {

          console.error('Error creating file records:', error);

          return;

        }

      }



      // Now save client signature to database and storage

      let clientSignatureId = null;

      if (data.signatureData?.signature && user?.id) {
        try {

          // Check if this is a temporary signature that needs to be moved

          if (data.signatureData.isTemporary && data.signatureData.signatureFilePath) {
            // This is a temporary signature, move it from client-signatures folder to quote folder

            const oldPath = data.signatureData.signatureFilePath; // client-signatures/userId/timestamp-filename
            const newPath = `${quoteId}/client-signatures/${data.signatureData.signatureFileName}`; // quoteId/client-signatures/filename


            try {

              // Copy signature to new location

              const { error: copyError } = await supabase

                .storage

                .from('signatures')

                .copy(oldPath, newPath);



              if (copyError) {

                console.error('Error copying signature:', copyError);

                throw new Error(`Failed to copy signature: ${copyError.message}`);

              }



              // Fetch client information for signature record

              let signerName = 'Client';

              let signerEmail = null;



              try {

                const { data: quoteData, error: quoteError } = await supabase

                  .from('quotes')

                  .select(`

                    client:clients(name, email)

                  `)

                  .eq('id', quoteId)

                  .single();



                if (!quoteError && quoteData?.client) {

                  signerName = quoteData.client.name || 'Client';

                  signerEmail = quoteData.client.email || null;

                }

              } catch (error) {

                console.warn('Could not fetch client info for signature:', error);

              }



              // Create signature record in database with new path

              const signatureRecord = {

                quote_id: quoteId,

                signer_name: signerName,

                signer_email: signerEmail,

                signature_file_path: newPath,

                signature_filename: data.signatureData.signatureFileName,
                signature_size: data.signatureData.signatureFileSize,
                signature_mime_type: data.signatureData.signatureMimeType,
                signature_mode: 'upload',

                signature_type: 'client',

                customer_comment: data.signatureData.clientComment
              };



              const { data: dbData, error: insertError } = await supabase

                .from('quote_signatures')

                .insert(signatureRecord)

                .select()

                .single();



              if (insertError) {

                console.error('Error creating signature record:', insertError);

                // Delete the copied signature if DB insert fails

                await supabase.storage.from('signatures').remove([newPath]);

                throw new Error(`Failed to create signature record: ${insertError.message}`);

              }



              // Delete original temp signature

              await supabase.storage.from('signatures').remove([oldPath]);



              clientSignatureId = dbData.id;

            } catch (error) {

              console.error('Error processing temporary signature:', error);

              throw error;

            }

          } else {

            // This is a base64 signature, convert to file and upload

            const signatureResponse = await fetch(data.signatureData.signature);
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

              'client',

              data.signatureData.clientComment || null
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

          }

        } catch (error) {

          console.error('Error saving client signature:', error);

          // Continue with quote creation even if signature save fails

        }

      }



      // Files are already in the database, no need to insert again

      // The quote_id reference has been updated above



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





  // Actual quote sending logic

  const processQuoteSend = async (sendData) => {

    try {

      setIsSaving(true);



      // Debug: Check user authentication




      if (!user?.id) {

        console.error('No user ID available');

        return;

      }

      // ========================================
      // UPDATE CLIENT EMAIL FIRST (before anything else)
      // ========================================
      // This ensures the database has the latest email before:
      // - Creating/updating quote (which logs client info)
      // - Sending emails
      // - Logging to quote_events or other tables
      let finalClientEmail = selectedClient?.email || selectedClient?.client?.email || '';
      
      if (sendData.emailData?.clientEmail && selectedClient) {
        const clientId = selectedClient?.value || selectedClient?.id || selectedClient?.client?.id;
        const currentEmail = selectedClient?.email || selectedClient?.client?.email;
        const newEmail = sendData.emailData.clientEmail.trim();
        
        // Only update if email is different and client ID exists
        if (clientId && newEmail && newEmail !== currentEmail) {
          try {
            // AWAIT the email update to ensure it completes before any other database operations
            const { error: updateError } = await supabase
              .from('clients')
              .update({ email: newEmail })
              .eq('id', clientId);
            
            if (updateError) {
              console.error('Failed to update client email:', updateError);
              // Use the new email from modal even if update fails (for sending/logging)
              finalClientEmail = newEmail;
            } else {
              // Update the selectedClient object to reflect the new email
              if (selectedClient.client) {
                selectedClient.client.email = newEmail;
              } else {
                selectedClient.email = newEmail;
              }
              finalClientEmail = newEmail;
              console.log('✅ Client email updated successfully in database:', newEmail);
            }
          } catch (error) {
            console.error('Error updating client email:', error);
            // Use the new email from modal even if update fails (for sending/logging)
            finalClientEmail = newEmail;
          }
        } else {
          // Email hasn't changed, use current email
          finalClientEmail = currentEmail || sendData.emailData?.clientEmail?.trim() || '';
        }
      } else if (sendData.emailData?.clientEmail) {
        // If emailData has clientEmail but selectedClient doesn't match, use the emailData value
        finalClientEmail = sendData.emailData.clientEmail.trim();
      }

      // Check if we're editing an existing quote

      if (isEditing && editingQuoteId) {

        // Update existing quote and send it - calculate totals using centralized calculator
        const financialBreakdown = calculateQuoteTotals(tasks, sendData.financialConfig);
        const { totalBeforeVAT: totalAmount, vatAmount: taxAmount, totalWithVAT, balanceAmount, discountAmount, depositAmount } = financialBreakdown;
        // Use balanceAmount (totalWithVAT - deposit) for final_amount to show the amount client needs to pay
        const finalAmount = balanceAmount;

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
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          deposit_amount: depositAmount,
          balance_amount: balanceAmount,

          valid_until: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).split('T')[0],

          terms_conditions: sendData.financialConfig?.defaultConditions?.text || '',

          tasks: tasks.map((task, index) => ({

            name: task.description || task.name || '',

            description: task.description || task.name || '',

            quantity: task.quantity || 1,

            unit: task.unit || 'piece',

            unit_price: task.price || task.unit_price || 0,

            // task.price is already total price - do NOT multiply by quantity (that causes huge amounts)
            total_price: task.price || task.unit_price || 0,

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

      // Check for pre-generated quote number first, or use existing quote number from draft
      let finalQuoteNumber = localStorage.getItem('pre_generated_quote_number') || projectInfo.quoteNumber;

      if (!finalQuoteNumber) {
        // Generate quote number using the service

        const { data: quoteNumber, error: numberError } = await generateQuoteNumber(user.id);



        if (numberError) {

          console.warn('Error generating quote number, using fallback:', numberError);

        }



        finalQuoteNumber = quoteNumber;


        // If backend didn't provide a number, generate a fallback with timestamp for uniqueness

        if (!finalQuoteNumber) {

          const timestamp = Date.now();

          const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

          finalQuoteNumber = `${new Date().getFullYear()}-${timestamp}-${randomSuffix}`;

        }
      } else {
        // Clear the pre-generated number since we're using it
        localStorage.removeItem('pre_generated_quote_number');

      }




      // Store the quote number in projectInfo for display

      setProjectInfo(prev => ({

        ...prev,

        quoteNumber: finalQuoteNumber

      }));



      // Calculate totals using centralized calculator
      const financialBreakdown = calculateQuoteTotals(tasks, sendData.financialConfig);
      const { totalBeforeVAT: totalAmount, vatAmount: taxAmount, totalWithVAT, balanceAmount, discountAmount, depositAmount } = financialBreakdown;
      // Use balanceAmount (totalWithVAT - deposit) for final_amount to show the amount client needs to pay
      const finalAmount = balanceAmount;

      // Note: Client email update already handled at the beginning of the function




      // First, create the quote in the database to get a real ID



      const quoteData = {

        user_id: user?.id,

        profile_id: currentProfile?.id,

        client_id: selectedClient?.value || selectedClient?.id,

        quote_number: finalQuoteNumber,
        status: 'sent',

        title: projectInfo.description || '',
        description: projectInfo.description || '',

        project_categories: projectInfo.categories || [],

        custom_category: projectInfo.customCategory || '',

        total_amount: totalAmount,

        tax_amount: taxAmount,

        discount_amount: discountAmount,

        final_amount: finalAmount,
        deposit_amount: depositAmount,
        balance_amount: balanceAmount,

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






      if (createError || !createdQuote) {
        console.error('Error creating quote:', createError);
        setIsSaving(false);
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

              display: sendData.financialConfig.vatConfig?.display ?? true,

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

            },

            show_material_prices: sendData.financialConfig.materialPriceDisplay ?? false

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

          // Check if this is a temporary signature that needs to be moved

          if (sendData.signatureData.isTemporary && sendData.signatureData.signatureFilePath) {
            // This is a temporary signature, download and re-upload to quote folder



            try {

              // Download the temporary signature file

              const { data: signatureBlob, error: downloadError } = await supabase

                .storage

                .from('signatures')

                .download(sendData.signatureData.signatureFilePath);


              if (downloadError) {

                console.error('Error downloading signature:', downloadError);

                throw new Error(`Failed to download signature: ${downloadError.message}`);

              }



              // Create a new File object from the blob

              const signatureFile = new File([signatureBlob], sendData.signatureData.signatureFileName, {
                type: sendData.signatureData.signatureMimeType
              });



              // Upload to the final quote location using uploadQuoteSignature

              const { data: signatureUploadResult, error: signatureUploadError } = await uploadQuoteSignature(

                signatureFile,

                quoteId,

                user.id,

                'client',

                sendData.signatureData.clientComment || null
              );



              if (signatureUploadError) {

                console.error('Client signature upload failed:', signatureUploadError);

                throw new Error(`Failed to upload signature: ${signatureUploadError.message}`);

              }



              if (signatureUploadResult.success) {

                // uploadQuoteSignature already handles database insert

                clientSignatureId = signatureUploadResult.data.id;



                // Delete the original temporary signature

                try {

                  await supabase.storage.from('signatures').remove([sendData.signatureData.signatureFilePath]);
                } catch (deleteError) {

                  console.warn('Warning: Could not delete temporary signature:', deleteError);

                }

              }

            } catch (error) {

              console.error('Error processing temporary signature:', error);

              throw error;

            }

          } else {

            // This is a base64 signature, convert to file and upload

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

              'client',

              sendData.signatureData.clientComment || null
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

          }

        } catch (error) {

          console.error('Error saving client signature:', error);

          // Continue with quote creation even if signature save fails

        }

      }



      // Handle temporary files: move from temp folder to quote folder and create database records

      const uploadedFiles = [];

      if (files.length > 0) {

        try {

          for (const file of files) {

            if (file.isTemporary && file.storagePath) {

              // This is a temporary file, move it from temp folder to quote folder

              const oldPath = file.storagePath; // temp/userId/timestamp-filename

              const newPath = `${quoteId}/attachment/${file.name}`; // quoteId/attachment/filename



              try {

                // Copy file to new location

                const { error: copyError } = await supabase

                  .storage

                  .from('quote-files')

                  .copy(oldPath, newPath);



                if (copyError) {

                  console.error('Error copying file:', copyError);

                  continue; // Skip this file if copy fails

                }



                // Create database record with new path

                const fileRecord = {

                  quote_id: quoteId,

                  file_name: file.name,

                  file_path: newPath, // Use new path

                  file_size: file.size,

                  mime_type: file.type,

                  file_category: 'attachment',

                  uploaded_by: currentProfile?.id || user.id

                };



                const { data: dbData, error: insertError } = await supabase

                  .from('quote_files')

                  .insert(fileRecord)

                  .select()

                  .single();



                if (insertError) {

                  console.error('Error creating file record:', insertError);

                  // Delete the copied file if DB insert fails

                  await supabase.storage.from('quote-files').remove([newPath]);

                  continue;

                }



                // Delete original temp file

                await supabase.storage.from('quote-files').remove([oldPath]);



                uploadedFiles.push({

                  ...file,

                  ...dbData,

                  backendId: dbData.id,

                  storagePath: newPath // Update with new path

                });



              } catch (error) {

                console.error('Error processing file:', error);

                continue;

              }

            } else if (file.backendId) {

              // File already has database record, just add to uploaded files

              uploadedFiles.push(file);

            } else {

              console.warn('File has no storage path or backendId, skipping:', file);

            }

          }

        } catch (error) {

          console.error('Error creating file records:', error);

          return;

        }

      }



      // Note: Files are already inserted into quote_files table by uploadQuoteFile service

      // No need for manual insertion - the service handles database records automatically



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

            user.id,
            sendData.emailData // Pass the custom email data from the modal
          );



          if (emailResult.success) {


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

                  user_id: user?.id || null, // System event
                  type: 'email_sent',

                  share_token: shareToken, // Use dedicated column

                  meta: {

                    email_type: 'quote_notification',

                    recipient: finalClientEmail || selectedClient?.email || selectedClient?.client?.email || sendData.emailData?.clientEmail || '',

                    timestamp: new Date().toISOString(),
                    custom_subject: sendData.emailData?.subject || null,
                    custom_message: sendData.emailData?.message || null
                  }

                });

            } catch (eventError) {

              console.warn('Failed to log email event:', eventError);

            }



            // Follow-up records are now created automatically by database triggers
            // No need to manually create them here
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



      // Clear the current client's signature specifically after successful quote creation

      if (user?.id && selectedClient?.id) {

        const clientSignatureKey = `client-signature-${user.id}-${selectedClient.id}`;

        localStorage.removeItem(clientSignatureKey);


      } else if (user?.id && selectedClient?.value) {

        const clientSignatureKey = `client-signature-${user.id}-${selectedClient.value}`;

        localStorage.removeItem(clientSignatureKey);


      }



      // Redirect

      navigate('/quotes-management');

    } catch (error) {

      console.error('Error sending quote:', error);

    } finally {

      setIsSaving(false);

    }

  };



  const handleStepChange = async (newStep) => {

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

        // Include leadId if this is a lead quote
        leadId: leadId || null,

        // Include client signature when changing steps
        clientSignature: selectedClient?.id || selectedClient?.value ?
          localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`) ?
            JSON.parse(localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`)) : null : null,
        lastSaved: savedTime

      };


      // Use quote number for draft key if available
      const quoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
      const draftKey = getDraftKeyByQuoteNumber(quoteNumber);
      localStorage.setItem(draftKey, JSON.stringify(quoteData));
      setLastSaved(savedTime);

      // Save to backend draft table on navigation (if not editing an existing quote)
      if (user?.id && !isEditing && !editingQuoteId) {
        try {
          const draftRowIdKey = getDraftRowIdKeyByQuoteNumber(quoteNumber);
          const existingRowId = localStorage.getItem(draftRowIdKey);

          // Also check fallback user-based key if quote number is not available
          const fallbackRowIdKey = `quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`;
          const fallbackRowId = !quoteNumber ? localStorage.getItem(fallbackRowIdKey) : null;

          // Use existing row ID if available (from quote number key or fallback key)
          const rowIdToUse = existingRowId || fallbackRowId;

          const { data: saved, error: draftErr } = await saveQuoteDraft({
            id: rowIdToUse || undefined,
            user_id: user.id,
            profile_id: currentProfile?.id || null,
            draft_data: quoteData,
            quote_number: quoteNumber || null
          });

          // Store the row ID in both keys for future reference
          if (!draftErr && saved?.id) {
            if (quoteNumber) {
              localStorage.setItem(draftRowIdKey, saved.id);
            }
            // Also store in fallback key for cases where quote number isn't set yet
            if (!rowIdToUse) {
              localStorage.setItem(fallbackRowIdKey, saved.id);
            }
          }
        } catch (e) {
          console.warn('Draft save on step change failed:', e?.message || e);
        }
      }



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
      // Don't generate quote number if we're editing an existing quote
      if (isEditing || editingQuoteId) {
        return;
      }

      // Don't generate if we already have a quote number (e.g., from a resumed draft)
      if (projectInfo.quoteNumber) {
        return;
      }

      // First check if we already have a pre-generated number from client selection
      const preGeneratedNumber = localStorage.getItem('pre_generated_quote_number');

      if (preGeneratedNumber) {

        // Use the pre-generated number instead of generating a new one
        setProjectInfo(prev => ({
          ...prev,
          quoteNumber: preGeneratedNumber
        }));

        // Clear it from localStorage since we're using it now
        localStorage.removeItem('pre_generated_quote_number');

        // Auto-save with the pre-generated quote number
        const savedTime = new Date().toISOString();
        const quoteData = {
          selectedClient,
          projectInfo: { ...projectInfo, quoteNumber: preGeneratedNumber },
          tasks,
          files,
          currentStep: 4,
          companyInfo,
          financialConfig,
          // Include leadId if this is a lead quote
          leadId: leadId || null,
          clientSignature: selectedClient?.id || selectedClient?.value ?
            localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`) ?
              JSON.parse(localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`)) : null : null,
          lastSaved: savedTime
        };
        const currentQuoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
        const draftKey = getDraftKeyByQuoteNumber(currentQuoteNumber);
        localStorage.setItem(draftKey, JSON.stringify(quoteData));
        setLastSaved(savedTime);

        return; // Don't generate a new number
      }

      // Only generate new number if none exists
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

        // Include leadId if this is a lead quote
        leadId: leadId || null,

        clientSignature: selectedClient?.id || selectedClient?.value ?
          localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`) ?
            JSON.parse(localStorage.getItem(`client-signature-${user.id}-${selectedClient.id || selectedClient.value}`)) : null : null,
        lastSaved: savedTime

      };

      const currentQuoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
      const draftKey = getDraftKeyByQuoteNumber(currentQuoteNumber);
      localStorage.setItem(draftKey, JSON.stringify(quoteData));
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

      // Clear draft data by quote number if available
      const quoteNumber = projectInfo.quoteNumber || localStorage.getItem('pre_generated_quote_number');
      if (quoteNumber) {
        const draftKey = getDraftKeyByQuoteNumber(quoteNumber);
        const draftRowIdKey = getDraftRowIdKeyByQuoteNumber(quoteNumber);

        localStorage.removeItem(draftKey);
        try {
          const rowId = localStorage.getItem(draftRowIdKey);
          if (rowId) {

            deleteQuoteDraftById(rowId);

          } else if (quoteNumber) {
            // If no row ID but we have quote number, delete by quote number
            deleteQuoteDraftByQuoteNumber(user.id, currentProfile?.id || null, quoteNumber);
          }

        } catch (_) { }

        localStorage.removeItem(draftRowIdKey);
      } else {
        // Fallback to user-based keys
        const fallbackKey = `quote-draft-${user.id}-${currentProfile?.id || 'default'}`;
        const fallbackRowIdKey = `quote-draft-rowid-${user.id}-${currentProfile?.id || 'default'}`;

        localStorage.removeItem(fallbackKey);
        try {
          const rowId = localStorage.getItem(fallbackRowIdKey);
          if (rowId) {
            deleteQuoteDraftById(rowId);
          }
        } catch (_) { }
        localStorage.removeItem(fallbackRowIdKey);
      }


      // Clear company info

      localStorage.removeItem(`company-info-${user.id}`);

      localStorage.removeItem(`company-logo-${user.id}`);

      localStorage.removeItem(`company-signature-${user.id}`);



      // Clear client signature

      localStorage.removeItem(`client-signature-${user.id}`);



      // Clear client-specific signatures

      const signatureKeysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (key && key.startsWith(`client-signature-${user.id}-`)) {

          signatureKeysToRemove.push(key);

        }

      }

      signatureKeysToRemove.forEach(key => localStorage.removeItem(key));



      // Clear quote files - both generic and quote-specific
      localStorage.removeItem(`quote-files-${user.id}`);

      if (quoteNumber) {
        localStorage.removeItem(`quote-files-${user.id}-${quoteNumber}`);
      }


      // Clear any other quote-related data

      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);

        if (key && (key.includes('quote-') || key.includes('draft-')) && key.includes(user.id)) {

          keysToRemove.push(key);

        }

      }

      keysToRemove.forEach(key => localStorage.removeItem(key));


      // Clear any quote-specific file storage keys
      if (quoteNumber) {
        const fileKeysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`quote-files-${user.id}-${quoteNumber}`)) {
            fileKeysToRemove.push(key);
          }
        }
        fileKeysToRemove.forEach(key => localStorage.removeItem(key));
      }
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

            userId={user?.id}

            isSaving={isAutoSaving}
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

            isSaving={isAutoSaving}

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

            quoteNumber={projectInfo.quoteNumber}
            isSaving={isSaving || isAutoSaving}

            currentProfile={currentProfile}
            onUploadStatusChange={handleFileUploadStatusChange}
          />

        );

      case 4:

        // Ensure quote number exists for preview (only for new quotes, not when editing)
        if (!projectInfo.quoteNumber && user?.id && !isEditing && !editingQuoteId) {

          // Check for pre-generated quote number first
          const preGeneratedNumber = localStorage.getItem('pre_generated_quote_number');
          if (preGeneratedNumber) {
            setProjectInfo(prev => ({
              ...prev,
              quoteNumber: preGeneratedNumber
            }));
            localStorage.removeItem('pre_generated_quote_number');
          } else {
            // Generate quote number if it doesn't exist (only for new quotes)

            setTimeout(() => generateQuoteNumberForPreview(), 100);

          }
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

            onSend={processQuoteSend}

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
    <PermissionGuard module="quoteCreation" requiredPermission="full_access">
      <div className="min-h-screen bg-background">

        <MainSidebar />



        <div

          style={{

            marginLeft: isMobile ? 0 : `${sidebarOffset}px`,

            transition: 'margin-left 0.3s ease-out'

          }}

          className="min-h-screen pt-4 md:pt-0"

        >

          <div className="container mx-auto px-4 sm:px-6 pt-0 pb-20 sm:pb-8 max-w-7xl">

            {/* Header */}

            <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">

                <div>

                  <div className="flex items-center">

                    <Icon name="FileText" size={24} className="text-primary mr-3" />

                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">

                      {isEditing ? t('quoteCreation.editTitle') : t('quoteCreation.title')}

                    </h1>

                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">

                    {isEditing
                      ? t('quoteCreation.editSubtitle', 'Modifiez les informations du devis existant')
                      : t('quoteCreation.subtitle', 'Remplissez les informations ci-dessous pour générer automatiquement un devis professionnel')

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

                      {t('quoteCreation.autoSave.saving')}

                    </div>

                  )}

                  {lastSaved && !isAutoSaving && !isLoadingQuote && !isSaving && (

                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">

                      <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 mr-2 text-green-500" />

                      {t('quoteCreation.autoSave.saved', { time: new Date(lastSaved).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) })}

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

                  <span className="text-3xl sm:text-4xl font-extrabold text-primary">{t('quoteCreation.stepIndicator.step', 'Étape')} {currentStep}/4</span>

                </div>

                {/* Recommendation box */}

                <div className="bg-card border border-border rounded-lg p-4">

                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">

                    <Icon name="Sparkles" size={14} className="mr-2 text-primary" />

                    {t('quoteCreation.recommendations.title', 'Recommandations')}

                  </h3>

                  {currentStep === 1 && (

                    <>

                      <div className="space-y-2">

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Sparkles" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step1.selectCategory', 'Sélectionnez au moins une catégorie (obligatoire) pour activer les suggestions de tâches.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Sparkles" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step1.multipleCategories', 'Vous pouvez choisir plusieurs catégories si nécessaire.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Mic" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step1.useMic', 'Cliquez sur l\'icône micro pour dicter; l\'IA nettoie et reformule proprement.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Wand2" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step1.useEnhance', 'Utilisez « Améliorer » pour une description courte, claire et professionnelle.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Globe" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step1.language', 'La langue suit vos préférences de compte.')}</div>

                      </div>

                      <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">

                        <Icon name="Info" size={14} className="mr-2 mt-0.5" />

                        {t('quoteCreation.recommendations.step1.tip', 'Astuce: plus votre description est précise, meilleures seront les suggestions de tâches.')}

                      </div>

                    </>

                  )}

                  {currentStep === 2 && (

                    <>

                      <div className="space-y-2">

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Mic" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step2.dictate', 'Dictez/écrivez; l\'IA génère description, durée, prix et matériaux proposés.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Hand" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step2.clickSuggestion', 'Cliquez sur une suggestion pour préremplir; modifiez librement avant d\'ajouter.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Coins" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step2.checkPrices', 'Vérifiez les prix et quantités de matériaux; ajustez selon votre tarif.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Clock" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step2.duration', 'Durée par défaut en heures; renseignez la durée pour un prix cohérent.')}</div>

                      </div>

                      <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">

                        <Icon name="Info" size={14} className="mr-2 mt-0.5" />

                        {t('quoteCreation.recommendations.step2.tip', 'Astuce: ajoutez les tâches une par une pour garder un devis clair.')}

                      </div>

                    </>

                  )}

                  {currentStep === 3 && (

                    <>

                      {/* File Upload Status */}
                      {isFileUploading && (
                        <div className="mb-3 p-3 rounded-md bg-blue-50 border border-blue-200 flex items-center space-x-2">
                          <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-blue-700 font-medium">{t('quoteCreation.recommendations.step3.uploading', 'Upload de fichiers en cours...')}</span>
                        </div>
                      )}

                      <div className="space-y-2">

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Image" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step3.addFiles', 'Ajoutez des fichiers utiles (photos avant/après, croquis, PDF).')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Upload" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step3.dragDrop', 'Glissez‑déposez ou cliquez pour sélectionner; privilégiez PDF/JPG/PNG légers.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Type" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step3.nameFiles', 'Nommez vos fichiers clairement pour le client.')}</div>

                      </div>

                      <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">

                        <Icon name="Info" size={14} className="mr-2 mt-0.5" />

                        {t('quoteCreation.recommendations.step3.tip', 'Astuce: des visuels clairs augmentent le taux d\'acceptation.')}

                      </div>

                    </>

                  )}

                  {currentStep === 4 && (

                    <>

                      <div className="space-y-2">

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Percent" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step4.configVat', 'Configurez la TVA et l\'acompte dans « Configuration ».')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Palette" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step4.customize', 'Personnalisez le modèle et les couleurs.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="Download" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step4.download', 'Téléchargez le devis en PDF.')}</div>

                        <div className="flex items-start text-sm text-muted-foreground"><Icon name="EyeOff" size={14} className="mt-0.5 mr-2 text-primary" />{t('quoteCreation.recommendations.step4.hidePrices', 'Masquez les prix des matériaux dans les Préférences du compte si besoin.')}</div>

                      </div>

                      <div className="mt-3 p-2 rounded-md bg-blue-50 border border-blue-100 text-[12px] text-blue-700 flex items-start">

                        <Icon name="Info" size={14} className="mr-2 mt-0.5" />

                        {t('quoteCreation.recommendations.step4.tip', 'Astuce: un devis simple et lisible se signe plus vite.')}

                      </div>

                    </>

                  )}

                </div>

                {/* Notes box */}

                <div className="bg-card border border-border rounded-lg p-4">

                  <h3 className="text-sm font-semibold text-foreground mb-2">{t('quoteCreation.notes.title', 'Notes')}</h3>

                  <div className="text-xs sm:text-sm text-muted-foreground">

                    {t('quoteCreation.notes.autosaved', 'Brouillon auto‑enregistré. Vous pouvez le retrouver dans')}

                    <Button

                      variant="outline"

                      size="sm"

                      onClick={() => navigate('/quotes-management')}

                      className="inline-flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"

                    >

                      <Icon name="ExternalLink" size={14} />

                      {t('quoteCreation.notes.quotesManagement', 'Gestion des devis')}

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

          signatureData={(() => {
            // Get client signature from localStorage
            if (selectedClient?.id || selectedClient?.value) {
              const clientId = selectedClient.id || selectedClient.value;
              const key = `client-signature-${user?.id}-${clientId}`;
              const storedSignature = localStorage.getItem(key);
              if (storedSignature) {
                try {
                  return JSON.parse(storedSignature);
                } catch (e) {
                  console.warn('Failed to parse stored signature:', e);
                  return null;
                }
              }
            }
            return null;
          })()}
        />



      </div>
    </PermissionGuard>
  );

};



export default QuoteCreation;