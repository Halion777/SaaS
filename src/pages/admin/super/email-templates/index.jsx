import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';
import TableLoader from 'components/ui/TableLoader';
import EmailTemplatesFilterToolbar from './components/EmailTemplatesFilterToolbar';

const EmailTemplatesManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return window.innerWidth < 1024 ? 'card' : 'table';
  });
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [variables, setVariables] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({
    template_name: '',
    template_type: '',
    subject: '',
    html_content: '',
    text_content: '',
    variables: {},
    is_active: true,
    is_default: false,
    language: 'fr'
  });
  const [editingLanguage, setEditingLanguage] = useState('fr'); // Language for editing template
  const [isLoadingLanguage, setIsLoadingLanguage] = useState(false); // Loading state for language switch
  const [useSimpleEditor, setUseSimpleEditor] = useState(true); // Toggle between simple and advanced editor
  const [simpleTemplate, setSimpleTemplate] = useState({
    headerTitle: '',
    headerSubtitle: '',
    headerColorStart: '#667eea',
    headerColorEnd: '#764ba2',
    greeting: '',
    bodyContent: '',
    buttonText: '',
    buttonColor: '#667eea',
    footerText: ''
  });

  // Parse HTML to simple template when switching to simple editor from advanced
  React.useEffect(() => {
    if (useSimpleEditor && editingTemplate.html_content && editingTemplate.template_type) {
      // Only parse if simple template is empty (switching from advanced to simple)
      const hasSimpleContent = simpleTemplate.headerTitle || simpleTemplate.greeting || simpleTemplate.bodyContent;
      if (!hasSimpleContent) {
        const parsed = parseHTMLToSimpleTemplate(editingTemplate.html_content);
        setSimpleTemplate(parsed);
      }
    }
  }, [useSimpleEditor]); // Only when switching editor mode

  // Handle sidebar offset for responsive layout
  React.useEffect(() => {
    const updateSidebarOffset = (isCollapsed) => {
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

      // Auto-switch to card view on mobile/tablet
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      updateSidebarOffset(isCollapsed);
    };
    
    const handleResize = () => {
      // Get current sidebar state from localStorage
      const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
      const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
      updateSidebarOffset(isCollapsed);
    };

    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    
    // Set initial state based on saved sidebar state
    const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
    const initialCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    updateSidebarOffset(initialCollapsed);

    return () => {
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Check if user is authenticated and has superadmin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        // Check if user has superadmin role
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !userData || userData.role !== 'superadmin') {
          navigate('/dashboard');
          return;
        }

        // Load templates and variables
        loadTemplates();
        loadVariables();
      } catch (error) {
        console.error('Error checking superadmin access:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  // Load email templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTemplates(data || []);
      setFilteredTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load template variables
  const loadVariables = async () => {
    try {
      const { data, error } = await supabase
        .from('email_template_variables')
        .select('*')
        .order('variable_name');

      if (error) throw error;
      setVariables(data || []);
    } catch (error) {
      console.error('Error loading variables:', error);
    }
  };

  // Filter templates
  useEffect(() => {
    let filtered = [...templates];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.template_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(template => template.template_type === typeFilter);
    }

    // Apply language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(template => template.language === languageFilter);
    }

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, typeFilter, languageFilter]);

  // Get template type display name
  const getTemplateTypeName = (type) => {
    const typeNames = {
      'client_accepted': 'Client Accepted',
      'quote_sent': 'Quote Sent',
      'followup_viewed_no_action': 'Follow-up - Viewed No Action',
      'welcome_client': 'Welcome Client',
      'general_followup': 'General Follow-up',
      'client_rejected': 'Client Rejected',
      'followup_not_viewed': 'Follow-up - Not Viewed',
      'subscription_upgraded': 'Subscription Upgraded',
      'subscription_downgraded': 'Subscription Downgraded',
      'subscription_cancelled': 'Subscription Cancelled',
      'subscription_activated': 'Subscription Activated',
      'subscription_reactivated': 'Subscription Reactivated',
      'subscription_trial_ending': 'Trial Ending',
      'welcome_registration': 'Welcome Registration',
      'email_verification_otp': 'Email Verification OTP',
      'contact_form': 'Contact Form',
      'credit_insurance_application': 'Credit Insurance Application',
      'credit_insurance_confirmation': 'Credit Insurance Confirmation',
      'new_lead_available': 'New Lead Available',
      'lead_assigned': 'Lead Assigned',
      'invoice_sent': 'Invoice Sent',
      'invoice_overdue_reminder': 'Invoice Overdue Reminder',
      'invoice_payment_reminder': 'Invoice Payment Reminder',
      'invoice_to_accountant': 'Invoice to Accountant',
      'expense_invoice_to_accountant': 'Expense Invoice to Accountant',
    };
    return typeNames[type] || type;
  };

  // Check if template is updated (updated within last 7 days and not new)
  const isTemplateUpdated = (template) => {
    if (!template.updated_at) return false;
    const updatedDate = new Date(template.updated_at);
    const createdDate = new Date(template.created_at);
    const daysSinceUpdated = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    // Only show updated if it was updated recently and not created recently (to avoid showing both)
    return daysSinceUpdated <= 7 && daysSinceCreated > 7 && updatedDate.getTime() > createdDate.getTime();
  };

  // Get language color
  const getLanguageColor = (language) => {
    const colors = {
      'fr': 'text-blue-600',      // French - Blue
      'en': 'text-green-600',      // English - Green
      'nl': 'text-orange-600'      // Dutch - Orange
    };
    return colors[language?.toLowerCase()] || 'text-muted-foreground';
  };

  // Get template type color
  const getTemplateTypeColor = (type) => {
    const colors = {
      'client_accepted': 'bg-green-100 text-green-800',
      'quote_sent': 'bg-blue-100 text-blue-800',
      'followup_viewed_no_action': 'bg-yellow-100 text-yellow-800',
      'welcome_client': 'bg-purple-100 text-purple-800',
      'general_followup': 'bg-orange-100 text-orange-800',
      'client_rejected': 'bg-red-100 text-red-800',
      'followup_not_viewed': 'bg-pink-100 text-pink-800',
      'subscription_upgraded': 'bg-emerald-100 text-emerald-800',
      'subscription_downgraded': 'bg-amber-100 text-amber-800',
      'subscription_cancelled': 'bg-red-100 text-red-800',
      'subscription_activated': 'bg-green-100 text-green-800',
      'subscription_reactivated': 'bg-teal-100 text-teal-800',
      'subscription_trial_ending': 'bg-indigo-100 text-indigo-800',
      'welcome_registration': 'bg-emerald-100 text-emerald-800',
      'contact_form': 'bg-cyan-100 text-cyan-800',
      'credit_insurance_application': 'bg-blue-100 text-blue-800',
      'credit_insurance_confirmation': 'bg-teal-100 text-teal-800',
      'new_lead_available': 'bg-lime-100 text-lime-800',
      'lead_assigned': 'bg-violet-100 text-violet-800',
      'invoice_sent': 'bg-emerald-100 text-emerald-800',
      'invoice_overdue_reminder': 'bg-rose-100 text-rose-800',
      'invoice_payment_reminder': 'bg-yellow-100 text-yellow-800',
      'invoice_to_accountant': 'bg-indigo-100 text-indigo-800',
      'expense_invoice_to_accountant': 'bg-amber-100 text-amber-800',
      'email_verification_otp': 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Parse HTML to extract simplified template fields
  const parseHTMLToSimpleTemplate = (htmlContent) => {
    if (!htmlContent) {
      return {
        headerTitle: '',
        headerSubtitle: '',
        headerColorStart: '#667eea',
        headerColorEnd: '#764ba2',
        greeting: '',
        bodyContent: '',
        buttonText: '',
        buttonColor: '#667eea',
        footerText: ''
      };
    }

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Extract header (first div with gradient background)
    const headerDiv = tempDiv.querySelector('div[style*="gradient"], div[style*="background"]');
    let headerTitle = '';
    let headerSubtitle = '';
    let headerColorStart = '#667eea';
    let headerColorEnd = '#764ba2';

    if (headerDiv) {
      const h1 = headerDiv.querySelector('h1');
      const p = headerDiv.querySelector('p');
      if (h1) headerTitle = h1.textContent || '';
      if (p) headerSubtitle = p.textContent || '';
      
      // Extract gradient colors from style
      const style = headerDiv.getAttribute('style') || '';
      const gradientMatch = style.match(/gradient\([^)]+\)/);
      if (gradientMatch) {
        const colors = gradientMatch[0].match(/#[0-9a-fA-F]{6}/g);
        if (colors && colors.length >= 2) {
          headerColorStart = colors[0];
          headerColorEnd = colors[1];
        }
      }
    }

    // Extract greeting and body content
    const bodyDiv = tempDiv.querySelector('div[style*="#f8f9fa"], div[style*="background"]:not([style*="gradient"])');
    let greeting = '';
    let bodyContent = '';
    
    if (bodyDiv) {
      const h2 = bodyDiv.querySelector('h2');
      if (h2) greeting = h2.textContent || '';
      
      // Get all paragraphs except the first one (which might be in a box)
      const paragraphs = bodyDiv.querySelectorAll('p');
      const contentParagraphs = Array.from(paragraphs).filter(p => {
        const parent = p.parentElement;
        return !parent || !parent.style || !parent.style.borderLeft;
      });
      bodyContent = contentParagraphs.map(p => p.textContent).join('\n\n');
    }

    // Extract button
    const buttonLink = tempDiv.querySelector('a[style*="background"], a[style*="padding"]');
    let buttonText = '';
    let buttonColor = '#667eea';
    
    if (buttonLink) {
      buttonText = buttonLink.textContent || '';
      const buttonStyle = buttonLink.getAttribute('style') || '';
      const bgMatch = buttonStyle.match(/background:\s*(#[0-9a-fA-F]{6})/);
      if (bgMatch) buttonColor = bgMatch[1];
    }

    // Extract footer
    const footerDiv = tempDiv.querySelector('div[style*="text-align: center"]:last-child');
    let footerText = '';
    if (footerDiv) {
      footerText = footerDiv.textContent.trim() || '';
    }

    return {
      headerTitle,
      headerSubtitle,
      headerColorStart,
      headerColorEnd,
      greeting,
      bodyContent,
      buttonText,
      buttonColor,
      footerText
    };
  };

  // Check if template type needs a call-to-action button
  // Only quote-related templates have buttons (View Quote, Accept, etc.)
  // Subscription, Lead, Invoice, Credit Insurance, and Contact templates do NOT have buttons
  const templateNeedsButton = (templateType) => {
    const typesWithButtons = [
      'quote_sent',           // Has "View Quote" button
      'client_accepted',      // Has "View Quote" button
      'followup_viewed_no_action',  // Has "View Quote" button
      'followup_not_viewed',  // Has "View Quote" button
      'general_followup'      // Has action button
    ];
    return typesWithButtons.includes(templateType);
  };

  // Generate HTML from simplified template fields
  const generateHTMLFromSimpleTemplate = (simple) => {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, ${simple.headerColorStart} 0%, ${simple.headerColorEnd} 100%); padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${simple.headerTitle || '{title}'}</h1>
    ${simple.headerSubtitle ? `<p style="color: white; margin: 5px 0 0 0; opacity: 0.9;">${simple.headerSubtitle}</p>` : ''}
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    ${simple.greeting ? `<h2 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">${simple.greeting}</h2>` : ''}
    ${simple.bodyContent ? `<div style="color: #555; margin: 0 0 15px 0; line-height: 1.5; white-space: pre-wrap;">${simple.bodyContent.replace(/\n/g, '<br>')}</div>` : ''}
  </div>
  
  ${simple.buttonText ? `
  <div style="text-align: center; margin: 30px 0;">
    <a href="{link}" style="background: ${simple.buttonColor}; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">${simple.buttonText}</a>
  </div>
  ` : ''}
  
  ${simple.footerText ? `
  <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
    ${simple.footerText}
  </div>
  ` : ''}
</div>
    `.trim();
  };

  // Generate text content from simplified template
  const generateTextFromSimpleTemplate = (simple, subject) => {
    let text = subject || '';
    text += '\n\n';
    if (simple.headerTitle) text += simple.headerTitle + '\n';
    if (simple.headerSubtitle) text += simple.headerSubtitle + '\n';
    text += '\n';
    if (simple.greeting) text += simple.greeting + '\n';
    if (simple.bodyContent) text += simple.bodyContent + '\n';
    if (simple.buttonText) text += '\n' + simple.buttonText + '\n';
    if (simple.footerText) text += '\n' + simple.footerText;
    return text;
  };

  // Handle template edit
  const handleEditTemplate = (template) => {
    // Parse variables if needed
    const parsedVariables = typeof template.variables === 'string' 
      ? (template.variables ? JSON.parse(template.variables) : {})
      : (template.variables || {});
    
    setEditingTemplate({
      ...template,
      variables: parsedVariables,
      html_content: template.html_content || '',
      text_content: template.text_content || '',
      subject: template.subject || ''
    });
    
    // Parse HTML to simple template
    const parsed = parseHTMLToSimpleTemplate(template.html_content);
    setSimpleTemplate(parsed);
    setUseSimpleEditor(true);
    
    setEditingLanguage(template.language || 'fr');
    setIsEditModalOpen(true);
  };

  // Handle template preview
  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

  // Handle template create
  const handleCreateTemplate = () => {
    setEditingTemplate({
      template_name: '',
      template_type: '',
      subject: '',
      html_content: '',
      text_content: '',
      variables: {},
      is_active: true,
      is_default: false,
      language: 'fr'
    });
    setSimpleTemplate({
      headerTitle: '',
      headerSubtitle: '',
      headerColorStart: '#667eea',
      headerColorEnd: '#764ba2',
      greeting: '',
      bodyContent: '',
      buttonText: '',
      buttonColor: '#667eea',
      footerText: ''
    });
    setUseSimpleEditor(true);
    setEditingLanguage('fr');
    setIsCreateModalOpen(true);
  };

  // Save template
  const handleSaveTemplate = async () => {
    try {
      // Generate HTML and text from simple template if using simple editor
      let htmlContent = editingTemplate.html_content;
      let textContent = editingTemplate.text_content;
      
      if (useSimpleEditor) {
        htmlContent = generateHTMLFromSimpleTemplate(simpleTemplate);
        textContent = generateTextFromSimpleTemplate(simpleTemplate, editingTemplate.subject);
      }
      
      const templateData = {
        ...editingTemplate,
        html_content: htmlContent,
        text_content: textContent,
        language: editingLanguage, // Use the selected language from tabs
        variables: JSON.stringify(editingTemplate.variables)
      };

      if (editingTemplate.id) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert([templateData]);

        if (error) throw error;
      }

      // Reload templates
      await loadTemplates();
      
      // Close modals
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
      setEditingTemplate({
        template_name: '',
        template_type: '',
        subject: '',
        html_content: '',
        text_content: '',
        variables: {},
        is_active: true,
        is_default: false,
        language: 'fr'
      });
      setEditingLanguage('fr');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    }
  };

  // Load template for specific language when switching tabs
  const handleLanguageSwitch = async (lang) => {
    // Don't switch if already on this language
    if (editingLanguage === lang) {
      return;
    }

    if (!editingTemplate.template_type) {
      // No template type selected yet, just switch language
      setEditingLanguage(lang);
      setEditingTemplate(prev => ({
        ...prev,
        language: lang
      }));
      return;
    }

    setIsLoadingLanguage(true);

    // Fetch template directly from database for this type and language
    try {
      const templateType = editingTemplate.template_type;
      
      // RLS is disabled, so we can query directly without any special conditions
      // Fetch the specific template for this language
      const { data: existingTemplate, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('language', lang)
        .maybeSingle();
      
      
      // Also fetch all templates for this type for debugging
      const { data: allTemplatesForType, error: listError } = await supabase
        .from('email_templates')
        .select('id, language, template_type, template_name')
        .eq('template_type', templateType)
        .order('language');
   
      if (listError) {
        console.error('Error fetching template list:', listError);
      }

     

      if (error) {
        // PGRST116 is "no rows returned" which is fine if template doesn't exist
        if (error.code !== 'PGRST116') {
          console.error('Error fetching template:', error);
          alert(`Error loading template: ${error.message}`);
        }
      }

      if (existingTemplate) {
        // Load existing template for this language - replace ALL fields explicitly
        const parsedVariables = typeof existingTemplate.variables === 'string' 
          ? (existingTemplate.variables ? JSON.parse(existingTemplate.variables) : {})
          : (existingTemplate.variables || {});
        
        // Explicitly set all fields to ensure they update - use null coalescing for all fields
        const updatedTemplate = {
          id: existingTemplate.id,
          template_name: existingTemplate.template_name ?? '',
          template_type: existingTemplate.template_type ?? templateType,
          subject: existingTemplate.subject ?? '',
          html_content: existingTemplate.html_content ?? '',
          text_content: existingTemplate.text_content ?? '',
          variables: parsedVariables,
          is_active: existingTemplate.is_active ?? true,
          is_default: existingTemplate.is_default ?? false,
          language: lang
        };
        
        // Parse HTML to simple template
        const parsed = parseHTMLToSimpleTemplate(existingTemplate.html_content || '');
       
        // Use setTimeout to ensure state update happens after current render cycle
        setTimeout(() => {
          setEditingTemplate(updatedTemplate);
          setSimpleTemplate(parsed);
          setEditingLanguage(lang);
        }, 0);
      } else {
        // No template exists for this language - create new empty template data
        // Keep only the template_type, clear all content fields
        const baseTemplateName = getTemplateTypeName(templateType);
        const emptyTemplate = {
          template_name: baseTemplateName,
          template_type: templateType,
          subject: '',
          html_content: '',
          text_content: '',
          variables: {},
          is_active: true,
          is_default: false,
          language: lang,
          id: undefined // Remove ID so it creates a new template
        };
       
        setTimeout(() => {
          setEditingTemplate(emptyTemplate);
          setSimpleTemplate({
            headerTitle: '',
            headerSubtitle: '',
            headerColorStart: '#667eea',
            headerColorEnd: '#764ba2',
            greeting: '',
            bodyContent: '',
            buttonText: '',
            buttonColor: '#667eea',
            footerText: ''
          });
          setEditingLanguage(lang);
        }, 0);
      }
    } catch (error) {
      console.error('Error in handleLanguageSwitch:', error);
      alert(`Error switching language: ${error.message}`);
      // Fallback: just switch language without loading template
      setEditingLanguage(lang);
      setEditingTemplate(prev => ({
        ...prev,
        language: lang
      }));
    } finally {
      setIsLoadingLanguage(false);
    }
  };

  // Delete template function removed - delete functionality disabled

  // Toggle template active status
  const handleToggleActive = async (template) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error updating template. Please try again.');
    }
  };

  // Toggle template default status
  const handleToggleDefault = async (template) => {
    try {
      // First, unset all other defaults for this template type
      if (template.is_default) {
        const { error: unsetError } = await supabase
          .from('email_templates')
          .update({ is_default: false })
          .eq('template_type', template.template_type)
          .neq('id', template.id);

        if (unsetError) throw unsetError;
      } else {
        // Set this as default and unset others
        const { error: unsetError } = await supabase
          .from('email_templates')
          .update({ is_default: false })
          .eq('template_type', template.template_type);

        if (unsetError) throw unsetError;

        const { error: setError } = await supabase
          .from('email_templates')
          .update({ is_default: true })
          .eq('id', template.id);

        if (setError) throw setError;
      }

      await loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error updating template. Please try again.');
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>Email Templates Management - Super Admin</title>
      </Helmet>
      
      <SuperAdminSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: isMobile ? '0' : `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="Mail" size={24} className="text-blue-600 mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Email Templates Management</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Manage email templates, variables, and customization
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <EmailTemplatesFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            languageFilter={languageFilter}
            onLanguageFilterChange={setLanguageFilter}
            filteredCount={filteredTemplates.length}
          />

          {/* View Toggle */}
          <div className="flex items-center p-4 border-b border-border bg-card rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">View</span>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                    viewMode === 'table'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Table" size={14} className="mr-1" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                    viewMode === 'card'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Grid" size={14} className="mr-1" />
                  Cards
                </button>
              </div>
            </div>
          </div>

          {/* Templates List/Card View */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Email Templates ({filteredTemplates.length})
              </h3>
            </div>
            {loading ? (
              <TableLoader message="Loading email templates..." />
            ) : (
              <>
              {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTemplates.map((template) => (
                    <tr key={template.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-foreground">
                              {template.template_name}
                            </div>
                            {isTemplateUpdated(template) && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-500 text-white">
                                Updated
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {template.subject}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTemplateTypeColor(template.template_type)}`}>
                          {getTemplateTypeName(template.template_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${getLanguageColor(template.language)}`}>
                          {template.language.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {template.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {template.is_default && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(template.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewTemplate(template)}
                          >
                            <Icon name="Eye" size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Icon name="Edit" size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              )}

              {viewMode === 'card' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 p-3 sm:p-4">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                      {/* Template Header */}
                      <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">{template.template_name}</h3>
                            {isTemplateUpdated(template) && (
                              <span className="inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-500 text-white whitespace-nowrap">
                                Updated
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{template.subject}</p>
                        </div>
                      </div>

                      {/* Template Details */}
                      <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Type:</span>
                          <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${getTemplateTypeColor(template.template_type)}`}>
                            {getTemplateTypeName(template.template_type)}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Language:</span>
                          <span className={`text-[10px] sm:text-xs font-semibold ${getLanguageColor(template.language)}`}>
                            {template.language.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Status:</span>
                          <div className="flex items-center flex-wrap gap-1 sm:space-x-1">
                            <span className={`inline-flex px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${
                              template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {template.is_default && (
                              <span className="inline-flex px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Created:</span>
                          <span className="text-[10px] sm:text-xs text-foreground">{new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1 sm:space-x-1 pt-2 sm:pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewTemplate(template)}
                          className="h-7 sm:h-8 px-1.5 sm:px-2 flex-shrink-0"
                          title="Preview"
                        >
                          <Icon name="Eye" size={12} className="sm:w-[14px] sm:h-[14px]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="h-7 sm:h-8 px-1.5 sm:px-2 flex-shrink-0"
                          title="Edit"
                        >
                          <Icon name="Edit" size={12} className="sm:w-[14px] sm:h-[14px]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(template)}
                          className="h-7 sm:h-8 px-1.5 sm:px-2 flex-shrink-0"
                          title={template.is_active ? 'Deactivate' : 'Activate'}
                        >
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Icon name="Mail" size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No email templates found</p>
                    </div>
                  )}
                </div>
              )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Template Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Subject:</h4>
                  <p className="text-muted-foreground bg-muted/30 p-3 rounded-lg">{selectedTemplate.subject}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-3">Email Preview:</h4>
                  <div 
                    className="border border-border rounded-lg p-4 bg-white shadow-sm max-w-2xl mx-auto"
                    style={{ maxHeight: '500px', overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }}
                  />
                </div>
                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-2">Plain Text Version:</h4>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-4 rounded-lg">
                    {selectedTemplate.text_content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {(isEditModalOpen || isCreateModalOpen) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {isCreateModalOpen ? 'Create Template' : 'Edit Template'}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsCreateModalOpen(false);
                }}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div className={`grid grid-cols-1 ${isCreateModalOpen ? 'md:grid-cols-2' : ''} gap-4`}>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Template Name</label>
                    <Input
                      key={`name-${editingLanguage}-${editingTemplate.template_type}`}
                      value={editingTemplate.template_name || ''}
                      onChange={(e) => setEditingTemplate({...editingTemplate, template_name: e.target.value})}
                      placeholder="Enter template name"
                    />
                  </div>
                  {isCreateModalOpen && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Template Type</label>
                      <Select
                        value={editingTemplate.template_type}
                        onChange={(e) => setEditingTemplate({...editingTemplate, template_type: e.target.value})}
                        options={[
                          { value: 'client_accepted', label: 'Client Accepted' },
                          { value: 'quote_sent', label: 'Quote Sent' },
                          { value: 'followup_viewed_no_action', label: 'Follow-up - Viewed No Action' },
                          { value: 'welcome_client', label: 'Welcome Client' },
                          { value: 'general_followup', label: 'General Follow-up' },
                          { value: 'client_rejected', label: 'Client Rejected' },
                          { value: 'followup_not_viewed', label: 'Follow-up - Not Viewed' },
                          { value: 'subscription_upgraded', label: 'Subscription Upgraded' },
                          { value: 'subscription_downgraded', label: 'Subscription Downgraded' },
                          { value: 'subscription_cancelled', label: 'Subscription Cancelled' },
                          { value: 'subscription_activated', label: 'Subscription Activated' },
                          { value: 'subscription_reactivated', label: 'Subscription Reactivated' },
                        { value: 'subscription_trial_ending', label: 'Trial Ending' },
                        { value: 'welcome_registration', label: 'Welcome Registration' },
                        { value: 'contact_form', label: 'Contact Form' },
                        { value: 'credit_insurance_application', label: 'Credit Insurance Application' },
                        { value: 'credit_insurance_confirmation', label: 'Credit Insurance Confirmation' },
                        { value: 'new_lead_available', label: 'New Lead Available' },
                        { value: 'lead_assigned', label: 'Lead Assigned' },
                        { value: 'invoice_sent', label: 'Invoice Sent' },
                        { value: 'invoice_overdue_reminder', label: 'Invoice Overdue Reminder' },
                        { value: 'invoice_payment_reminder', label: 'Invoice Payment Reminder' },
                        { value: 'invoice_to_accountant', label: 'Invoice to Accountant' },
                        { value: 'expense_invoice_to_accountant', label: 'Expense Invoice to Accountant' }
                      ]}
                    />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                  <Input
                    key={`subject-${editingLanguage}-${editingTemplate.template_type}`}
                    value={editingTemplate.subject || ''}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                    placeholder="Enter email subject"
                  />
                </div>

                {/* Editor Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <Icon name="Settings" size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Editor Mode</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // When switching to simple editor, parse existing HTML
                        if (!useSimpleEditor && editingTemplate.html_content) {
                          const parsed = parseHTMLToSimpleTemplate(editingTemplate.html_content);
                          setSimpleTemplate(parsed);
                        }
                        setUseSimpleEditor(true);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        useSimpleEditor
                          ? 'bg-primary text-white'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Simple
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // When switching to advanced editor, generate HTML from simple template
                        if (useSimpleEditor) {
                          const htmlContent = generateHTMLFromSimpleTemplate(simpleTemplate);
                          const textContent = generateTextFromSimpleTemplate(simpleTemplate, editingTemplate.subject);
                          setEditingTemplate(prev => ({
                            ...prev,
                            html_content: htmlContent,
                            text_content: textContent
                          }));
                        }
                        setUseSimpleEditor(false);
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        !useSimpleEditor
                          ? 'bg-primary text-white'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Advanced
                    </button>
                  </div>
                </div>

                {useSimpleEditor ? (
                  /* Simple Editor */
                  <div className="space-y-4">
                    {/* Header Section */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Image" size={16} className="text-primary" />
                        Header Section
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Header Title</label>
                          <Input
                            value={simpleTemplate.headerTitle}
                            onChange={(e) => setSimpleTemplate({...simpleTemplate, headerTitle: e.target.value})}
                            placeholder="e.g., Factures de dépenses à traiter"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Header Subtitle (optional)</label>
                          <Input
                            value={simpleTemplate.headerSubtitle}
                            onChange={(e) => setSimpleTemplate({...simpleTemplate, headerSubtitle: e.target.value})}
                            placeholder="e.g., {invoice_count} facture(s)"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Header Color Start</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={simpleTemplate.headerColorStart}
                                onChange={(e) => setSimpleTemplate({...simpleTemplate, headerColorStart: e.target.value})}
                                className="w-12 h-10 rounded border border-border cursor-pointer"
                              />
                              <Input
                                value={simpleTemplate.headerColorStart}
                                onChange={(e) => setSimpleTemplate({...simpleTemplate, headerColorStart: e.target.value})}
                                placeholder="#667eea"
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Header Color End</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={simpleTemplate.headerColorEnd}
                                onChange={(e) => setSimpleTemplate({...simpleTemplate, headerColorEnd: e.target.value})}
                                className="w-12 h-10 rounded border border-border cursor-pointer"
                              />
                              <Input
                                value={simpleTemplate.headerColorEnd}
                                onChange={(e) => setSimpleTemplate({...simpleTemplate, headerColorEnd: e.target.value})}
                                placeholder="#764ba2"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Body Section */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="FileText" size={16} className="text-primary" />
                        Body Content
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Greeting</label>
                          <Input
                            value={simpleTemplate.greeting}
                            onChange={(e) => setSimpleTemplate({...simpleTemplate, greeting: e.target.value})}
                            placeholder="e.g., Bonjour {client_name},"
                          />
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Body Text</label>
                          <textarea
                            value={simpleTemplate.bodyContent}
                            onChange={(e) => setSimpleTemplate({...simpleTemplate, bodyContent: e.target.value})}
                            placeholder="Enter the main message content. Use {variable_name} for dynamic values."
                            className="w-full h-32 p-3 border border-border rounded-lg bg-background text-foreground resize-y"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Tip: Use variables like {`{variable_name}`} for dynamic content
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Button Section (Only for templates that need links) */}
                    {templateNeedsButton(editingTemplate.template_type) && (
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                          <Icon name="MousePointerClick" size={16} className="text-primary" />
                          Call-to-Action Button
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Button Text</label>
                            <Input
                              value={simpleTemplate.buttonText}
                              onChange={(e) => setSimpleTemplate({...simpleTemplate, buttonText: e.target.value})}
                              placeholder="e.g., View Quote"
                            />
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Button Color</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={simpleTemplate.buttonColor}
                                onChange={(e) => setSimpleTemplate({...simpleTemplate, buttonColor: e.target.value})}
                                className="w-12 h-10 rounded border border-border cursor-pointer"
                              />
                              <Input
                                value={simpleTemplate.buttonColor}
                                onChange={(e) => setSimpleTemplate({...simpleTemplate, buttonColor: e.target.value})}
                                placeholder="#667eea"
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Section (Optional) */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="AlignCenter" size={16} className="text-primary" />
                        Footer (Optional)
                      </h4>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-1.5">Footer Text</label>
                        <Input
                          value={simpleTemplate.footerText}
                          onChange={(e) => setSimpleTemplate({...simpleTemplate, footerText: e.target.value})}
                          placeholder="e.g., Best regards, {company_name}"
                        />
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="p-4 bg-muted/30 rounded-lg border border-border">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Icon name="Eye" size={16} className="text-primary" />
                        Preview
                      </h4>
                      <div 
                        className="border border-border rounded-lg p-4 bg-white max-h-96 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: generateHTMLFromSimpleTemplate(simpleTemplate) }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Advanced Editor */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">HTML Content</label>
                      <textarea
                        key={`html-${editingLanguage}-${editingTemplate.template_type}`}
                        value={editingTemplate.html_content || ''}
                        onChange={(e) => setEditingTemplate({...editingTemplate, html_content: e.target.value})}
                        placeholder="Enter HTML content"
                        className="w-full h-64 p-3 border border-border rounded-lg bg-background text-foreground font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Text Content</label>
                      <textarea
                        key={`text-${editingLanguage}-${editingTemplate.template_type}`}
                        value={editingTemplate.text_content || ''}
                        onChange={(e) => setEditingTemplate({...editingTemplate, text_content: e.target.value})}
                        placeholder="Enter text content"
                        className="w-full h-32 p-3 border border-border rounded-lg bg-background text-foreground"
                      />
                    </div>
                  </div>
                )}

                {/* Language Selection Tabs */}
                <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                  <label className="block text-sm font-medium text-foreground mb-3">Select Language</label>
                  <div className="flex gap-2">
                    {[
                      { code: 'fr', name: 'French', flag: '🇫🇷' },
                      { code: 'en', name: 'English', flag: '🇬🇧' },
                      { code: 'nl', name: 'Dutch', flag: '🇳🇱' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageSwitch(lang.code)}
                        disabled={isLoadingLanguage}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          editingLanguage === lang.code
                            ? 'bg-primary text-white border-primary'
                            : 'bg-card text-foreground border-border hover:border-primary/50'
                        } ${isLoadingLanguage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                        {isLoadingLanguage && editingLanguage === lang.code && (
                          <span className="ml-2 text-xs">Loading...</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Editing template for {editingLanguage === 'fr' ? 'French' : editingLanguage === 'en' ? 'English' : 'Dutch'}
                    {isLoadingLanguage && ' (Loading...)'}
                  </p>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingTemplate.is_active}
                      onChange={(e) => setEditingTemplate({...editingTemplate, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsCreateModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveTemplate}>
                {isCreateModalOpen ? 'Create Template' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplatesManagement;
