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
      'subscription_trial_ending': 'Trial Ending'
    };
    return typeNames[type] || type;
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
      'subscription_trial_ending': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // Handle template edit
  const handleEditTemplate = (template) => {
    setEditingTemplate({
      ...template,
      variables: typeof template.variables === 'string' ? JSON.parse(template.variables) : template.variables
    });
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
    setIsCreateModalOpen(true);
  };

  // Save template
  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        ...editingTemplate,
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
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template. Please try again.');
    }
  };

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
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                <Select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'client_accepted', label: 'Client Accepted' },
                    { value: 'quote_sent', label: 'Quote Sent' },
                    { value: 'followup_viewed_no_action', label: 'Follow-up - Viewed' },
                    { value: 'welcome_client', label: 'Welcome Client' },
                    { value: 'general_followup', label: 'General Follow-up' },
                    { value: 'client_rejected', label: 'Client Rejected' },
                    { value: 'followup_not_viewed', label: 'Follow-up - Not Viewed' }
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                <Select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Languages' },
                    { value: 'fr', label: 'French' },
                    { value: 'en', label: 'English' },
                    { value: 'nl', label: 'Dutch' }
                  ]}
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setLanguageFilter('all');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">View:</span>
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
            <div className="text-xs text-muted-foreground">
              {filteredTemplates.length} template(s)
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
                          <div className="text-sm font-medium text-foreground">
                            {template.template_name}
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
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {template.language.toUpperCase()}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Icon name="Trash2" size={14} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Template Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">{template.template_name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{template.subject}</p>
                        </div>
                      </div>

                      {/* Template Details */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Type:</span>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getTemplateTypeColor(template.template_type)}`}>
                            {getTemplateTypeName(template.template_type)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Language:</span>
                          <span className="text-xs text-foreground">{template.language.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Status:</span>
                          <div className="flex items-center space-x-1">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              template.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {template.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {template.is_default && (
                              <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Created:</span>
                          <span className="text-xs text-foreground">{new Date(template.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-1 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewTemplate(template)}
                          className="h-8 px-2"
                          title="Preview"
                        >
                          <Icon name="Eye" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                          className="h-8 px-2"
                          title="Edit"
                        >
                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(template.id)}
                          className="h-8 px-2"
                          title={template.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Icon name={template.is_active ? "EyeOff" : "Eye"} size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Icon name="Trash2" size={14} />
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
                  <p className="text-muted-foreground">{selectedTemplate.subject}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">HTML Content:</h4>
                  <div 
                    className="border border-border rounded-lg p-4 bg-muted/30"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }}
                  />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Text Content:</h4>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Template Name</label>
                    <Input
                      value={editingTemplate.template_name}
                      onChange={(e) => setEditingTemplate({...editingTemplate, template_name: e.target.value})}
                      placeholder="Enter template name"
                    />
                  </div>
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
                        { value: 'subscription_trial_ending', label: 'Trial Ending' }
                      ]}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Subject</label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">HTML Content</label>
                  <textarea
                    value={editingTemplate.html_content}
                    onChange={(e) => setEditingTemplate({...editingTemplate, html_content: e.target.value})}
                    placeholder="Enter HTML content"
                    className="w-full h-64 p-3 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Text Content</label>
                  <textarea
                    value={editingTemplate.text_content}
                    onChange={(e) => setEditingTemplate({...editingTemplate, text_content: e.target.value})}
                    placeholder="Enter text content"
                    className="w-full h-32 p-3 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                    <Select
                      value={editingTemplate.language}
                      onChange={(e) => setEditingTemplate({...editingTemplate, language: e.target.value})}
                      options={[
                        { value: 'fr', label: 'French' },
                        { value: 'en', label: 'English' },
                        { value: 'nl', label: 'Dutch' }
                      ]}
                    />
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingTemplate.is_active}
                        onChange={(e) => setEditingTemplate({...editingTemplate, is_active: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editingTemplate.is_default}
                        onChange={(e) => setEditingTemplate({...editingTemplate, is_default: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">Default</span>
                    </label>
                  </div>
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
