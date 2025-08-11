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
import AIScoring from './components/AIScoring';
import { generateQuoteNumber, createQuote, fetchQuoteById, updateQuote } from '../../services/quotesService';
import { uploadQuoteFile, uploadQuoteSignature } from '../../services/quoteFilesService';
import { saveCompanyInfo } from '../../services/companyInfoService';
import { supabase } from '../../services/supabaseClient';

// Helper function to get signed URL from Supabase storage
const getStorageSignedUrl = async (bucket, path) => {
  if (!path) return null;
  
  // Debug: Log what we're trying to get signed URL for
  console.log(`Getting signed URL for bucket: ${bucket}, path: ${path}`);
  
  try {
    // Get signed URL for private bucket access
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) {
      console.error(`Error getting signed URL for ${bucket}/${path}:`, error);
      return null;
    }
    
    // Debug: Log the result
    console.log(`Signed URL result for ${bucket}/${path}:`, data?.signedUrl ? 'SUCCESS' : 'FAILED');
    
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

  // Helper function to generate draft key with user and profile IDs
  const getDraftKey = () => {
    return `quote-draft-${user?.id}-${currentProfile?.id || 'default'}`;
  };

  // Check URL parameters for edit mode
  useEffect(() => {
    const editId = searchParams.get('edit');
    const duplicateId = searchParams.get('duplicate');
    
    if (editId) {
      setIsEditing(true);
      setEditingQuoteId(editId);
      loadExistingQuote(editId, false); // false = not duplicating
    } else if (duplicateId) {
      setIsEditing(false);
      setEditingQuoteId(duplicateId);
      loadExistingQuote(duplicateId, true); // true = duplicating
    } else {
      setIsEditing(false);
      setEditingQuoteId(null);
    }
  }, [searchParams]);

  // Handle browser back button and page unload to clear localStorage
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear localStorage when user leaves the page
      if (isEditing) {
        clearAllQuoteData();
      }
    };

    const handlePopState = () => {
      // Clear localStorage when user navigates back
      if (isEditing) {
        clearAllQuoteData();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isEditing]);

  // Cleanup localStorage when component unmounts (if editing)
  useEffect(() => {
    return () => {
      if (isEditing) {
        clearAllQuoteData();
      }
    };
  }, [isEditing]);

  // Load existing quote data for editing or duplicating
  const loadExistingQuote = async (quoteId, isDuplicating = false) => {
    if (!quoteId || !user?.id) return;
    
    try {
      setIsLoadingQuote(true);
      const { data: quote, error } = await fetchQuoteById(quoteId);
      
      if (error) {
        console.error('Error loading quote:', error);
        alert('Erreur lors du chargement du devis. Veuillez réessayer.');
        return;
      }
      
      if (!quote) {
        alert('Devis non trouvé.');
        return;
      }
      
      // Check if user has permission to edit this quote
      if (quote.user_id !== user.id) {
        alert('Vous n\'avez pas la permission de modifier ce devis.');
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
        materials: [], // Materials are stored separately
        hourlyRate: task.hourly_rate,
        pricingType: task.pricing_type || 'flat'
      }));
      
      const transformedMaterials = (quote.quote_materials || []).map(material => ({
        id: material.id,
        name: material.name,
        description: material.description,
        quantity: material.quantity,
        unit: material.unit,
        price: material.unit_price || material.total_price
      }));
      
      // Get signed URLs for all files
      const transformedFiles = [];
      for (const file of quote.quote_files || []) {
        const signedUrl = await getStorageSignedUrl('quote-files', file.file_path);

        
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
        console.log('Company profile from database:', quote.company_profile);
        
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
            publicUrl: await getStorageSignedUrl('company-assets', quote.company_profile.logo_path)
          } : null,
          signature: quote.company_profile.signature_path ? {
            name: quote.company_profile.signature_filename || 'company-signature',
            size: quote.company_profile.signature_size || 0,
            type: quote.company_profile.signature_mime_type || 'image/*',
            data: null, // Will be loaded from storage
            path: quote.company_profile.signature_path,
            publicUrl: await getStorageSignedUrl('company-assets', quote.company_profile.signature_path)
          } : null
        };
        
        // Debug: Log the logo and signature data
        console.log('Logo data loaded:', companyInfo.logo);
        console.log('Signature data loaded:', companyInfo.signature);
        
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
      
      // Load client signature if exists
      if (quote.quote_signatures && quote.quote_signatures.length > 0) {
        const clientSignature = quote.quote_signatures[0]; // Assuming one client signature per quote
        const signatureData = {
          signature: clientSignature.signature_file_path ? 
            await getStorageSignedUrl('signatures', clientSignature.signature_file_path) : 
            (clientSignature.signature_data ? `data:image/png;base64,${clientSignature.signature_data}` : null),
          clientComment: clientSignature.signer_email || '',
          signedAt: clientSignature.signed_at || new Date().toISOString()
        };
        
        // Save to localStorage for display
        if (user?.id) {
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
        deadline: quote.deadline || '',
        description: quote.description || '',
        quoteNumber: isDuplicating ? null : quote.quote_number // Don't copy quote number when duplicating
      });
      setTasks(transformedTasks);
      setFiles(transformedFiles);
      setFinancialConfig(financialConfig);
      
      // If duplicating, generate a new quote number
      if (isDuplicating) {
        setTimeout(() => generateQuoteNumberForPreview(), 100);
      }
      

      
    } catch (error) {
      console.error('Error loading quote:', error);
      alert('Erreur lors du chargement du devis. Veuillez réessayer.');
    } finally {
      setIsLoadingQuote(false);
    }
  };



  // Enhanced auto-save functionality with localStorage only
  useEffect(() => {
    const autoSave = async () => {
      // Auto-save if there's any data to save
      if (selectedClient || tasks.length > 0 || files.length > 0 || 
          projectInfo.categories.length > 0 || projectInfo.description || projectInfo.deadline) {
        setIsAutoSaving(true);
        const savedTime = new Date().toISOString();
        const quoteData = {
          selectedClient,
          projectInfo,
          tasks,
          files,
          currentStep,
          companyInfo,
          lastSaved: savedTime
        };
        
        // Save to localStorage only
        try {
          localStorage.setItem(getDraftKey(), JSON.stringify(quoteData));
          setLastSaved(savedTime);
        } catch (localStorageError) {
          console.error('Error saving to localStorage:', localStorageError);
        }
        
        setTimeout(() => {
          setIsAutoSaving(false);
        }, 1500);
      }
    };

    // Auto-save every 15 seconds (more frequent)
    const interval = setInterval(autoSave, 15000);
    
    // Also auto-save immediately when data changes (debounced)
    const timeoutId = setTimeout(autoSave, 2000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, [selectedClient, projectInfo, tasks, files, currentStep, companyInfo, user?.id, currentProfile?.id]);

  // Load draft data on component mount
  useEffect(() => {
    if (user?.id) {
      const draftKey = getDraftKey();
      const savedDraft = localStorage.getItem(draftKey);
      
        if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
  
          
          if (draftData.projectInfo) setProjectInfo(draftData.projectInfo);
          if (draftData.selectedClient) setSelectedClient(draftData.selectedClient);
          if (draftData.tasks) setTasks(draftData.tasks);
          if (draftData.files) setFiles(draftData.files);
          if (draftData.companyInfo) setCompanyInfo(draftData.companyInfo);
      } catch (error) {
        console.error('Error loading draft:', error);
        }
      }
      
      // Also load company info from localStorage
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
        selectedClient,
        projectInfo,
        tasks,
        files,
        currentStep: currentStep + 1,
        companyInfo,
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
        selectedClient,
        projectInfo,
        tasks,
        files,
        currentStep: currentStep - 1,
        companyInfo,
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
          alert(`Erreur lors de la mise à jour du devis: ${updateError.message || 'Erreur inconnue'}`);
          return;
        }


        // Clear all quote creation data from localStorage after successful update
        clearAllQuoteData();
        
        alert('Devis mis à jour avec succès !');
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
        deadline: projectInfo.deadline ? new Date(projectInfo.deadline).toISOString().split('T')[0] : null,
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
      

      // Save to localStorage
      const existingQuotes = JSON.parse(localStorage.getItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`) || '[]');
      existingQuotes.push({
        ...quoteData,
        id: Date.now(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`, JSON.stringify(existingQuotes));

      // Clear all quote creation data from localStorage
      clearAllQuoteData();
      
      // Clear form data for clean state
      clearFormData();

      // Show success message and redirect
      alert('Devis sauvegardé avec succès !');
      navigate('/quotes-management');
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Erreur lors de la sauvegarde du devis. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced handleSend with better data structure and backend integration
  const handleSend = async (data) => {
    try {
      setIsSaving(true);
      
      // Debug: Check user authentication
      
      
      if (!user?.id) {
        console.error('No user ID available');
        alert('Erreur d\'authentification. Veuillez vous reconnecter.');
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
          alert(`Erreur lors de la mise à jour du devis: ${updateError.message || 'Erreur inconnue'}`);
          return;
        }


        // Clear all quote creation data from localStorage after successful edit
        clearAllQuoteData();
        
        alert(`Devis mis à jour et envoyé avec succès à ${selectedClient?.label?.split(' - ')[0] || 'le client'} !`);
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
        files: [] // We'll add files after upload
      };

      // Call backend service to create quote FIRST
      const { data: createdQuote, error: createError } = await createQuote(quoteData);
      
      if (createError) {
        console.error('Error creating quote in backend:', createError);
        alert(`Erreur lors de la création du devis: ${createError.message || 'Erreur inconnue'}`);
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

      // Now save client signature to database and storage
      let clientSignatureId = null;
      if (data.signatureData?.signature && user?.id) {
        try {
  
          
          // Convert base64 to file for upload
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
                alert(`Erreur lors de l'upload de ${file.name}: ${uploadError}`);
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
          alert('Erreur lors de l\'upload des fichiers. Veuillez réessayer.');
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
            alert('Erreur lors de la sauvegarde des références de fichiers. Veuillez réessayer.');
            return;
          }
          
  
        } catch (error) {
          console.error('Error saving file references:', error);
          alert('Erreur lors de la sauvegarde des références de fichiers. Veuillez réessayer.');
          return;
        }
      }

      

      // Save to localStorage as backup
      const existingQuotes = JSON.parse(localStorage.getItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`) || '[]');
      existingQuotes.push({
        id: quoteId,
        quote_number: finalQuoteNumber,
        client_id: selectedClient?.id || selectedClient?.value,
        status: 'sent',
        title: projectInfo.description || 'Nouveau devis',
        total_amount: totalAmount,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(`quotes-${user?.id}-${currentProfile?.id || 'default'}`, JSON.stringify(existingQuotes));

      // Clear all quote creation data from localStorage
      clearAllQuoteData();
      
      // Clear form data for clean state
      clearFormData();

      // Show success message and redirect
      alert(`Devis envoyé avec succès à ${selectedClient?.label?.split(' - ')[0] || 'le client'} !`);
      navigate('/quotes-management');
    } catch (error) {
      console.error('Error sending quote:', error);
      alert('Erreur lors de l\'envoi du devis. Veuillez réessayer.');
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
        selectedClient,
        projectInfo,
        tasks,
        files,
        currentStep: newStep,
        companyInfo,
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
      
      // Clear company info
      localStorage.removeItem(`company-info-${user.id}`);
      localStorage.removeItem(`company-logo-${user.id}`);
      localStorage.removeItem(`company-signature-${user.id}`);
      
      // Clear client signature
      localStorage.removeItem(`client-signature-${user.id}`);
      
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

  // Enhanced clearDraft with comprehensive localStorage cleanup
  const clearDraft = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer ce brouillon ?')) {
      // Clear all quote-related localStorage data
      clearAllQuoteData();
      
      // Clear form data
      clearFormData();
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
          />
        );
      case 2:
        return (
          <TaskDefinition
            tasks={tasks}
            projectCategory={projectInfo.categories}
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
            onPrevious={handlePrevious}
            onSave={handleSave}
            onSend={handleSend}
            onCompanyInfoChange={handleCompanyInfoChange}
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
              
              <Button
                variant="outline"
                onClick={clearDraft}
                iconName="Trash2"
                iconPosition="left"
                  size="sm"
                  className="w-auto"
              >
                  <span className="hidden sm:inline">Effacer le brouillon</span>
                  <span className="sm:hidden">Effacer</span>
              </Button>
              

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

            {/* AI Scoring Sidebar */}
            <div className="lg:col-span-1">
              <AIScoring
                selectedClient={selectedClient}
                tasks={tasks}
                currentStep={currentStep}
              />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default QuoteCreation;