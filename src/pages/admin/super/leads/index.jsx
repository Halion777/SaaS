import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import { LeadManagementService } from 'services/leadManagementService';

import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';

const SuperAdminLeads = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [spamReports, setSpamReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);

  const [activeTab, setActiveTab] = useState('leads');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Handle sidebar offset for responsive layout
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
        const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      
      if (!mobile && !tablet) {
        const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
        const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  // Set initial sidebar offset based on saved state
  useEffect(() => {
    const mobile = window.innerWidth < 768;
    const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (mobile) {
      setSidebarOffset(0);
    } else if (tablet) {
      setSidebarOffset(80);
    } else {
      const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
      const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
      setSidebarOffset(isCollapsed ? 64 : 288);
    }
  }, []);

  useEffect(() => {
    loadLeads();
    loadSpamReports();
  }, []);

  useEffect(() => {
    if (activeTab === 'spam-reports') {
      loadSpamReports();
    }
  }, [activeTab]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lead_requests')
        .select(`
          *,
          lead_spam_reports (
            id,
            reason,
            reported_by_user_id,
            review_status,
            created_at,
            users!lead_spam_reports_reported_by_user_id_fkey (
              full_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpamReports = async () => {
    try {
      const { data, error } = await supabase
        .from('lead_spam_reports')
        .select(`
          *,
          lead_requests (
            id, client_name, client_email, client_phone, project_description, 
            full_address, city, region, country, price_range, status, created_at
          ),
          users!lead_spam_reports_reported_by_user_id_fkey (
            id, full_name, email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Spam reports loaded:', data);
      setSpamReports(data || []);
    } catch (error) {
      console.error('Error loading spam reports:', error);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.project_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.client_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.client_phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.full_address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'spam') {
        filtered = filtered.filter(lead => lead.is_spam === true);
      } else {
        filtered = filtered.filter(lead => lead.status === statusFilter);
      }
    }

    setFilteredLeads(filtered);
  };

  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };



  const deleteLeads = async () => {
    if (selectedLeads.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_requests')
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;

      // Refresh leads
      await loadLeads();
      setSelectedLeads([]);
    } catch (error) {
      console.error('Error deleting leads:', error);
    }
  };

  const handleReviewSpamReport = (report) => {
    setSelectedReport(report);
    setReviewStatus(report.review_status || 'approved');
    setReviewNotes(report.review_notes || '');
    setShowReviewModal(true);
  };

  const submitSpamReview = async () => {
    if (!selectedReport) return;

    try {
      // Update the spam report status
      const { error: reportError } = await supabase
        .from('lead_spam_reports')
        .update({
          review_status: reviewStatus,
          review_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedReport.id);

      if (reportError) throw reportError;

      // Also update the lead based on review status
      if (reviewStatus === 'approved') {
        // Mark lead as spam and make it unavailable
        const { error: leadError } = await supabase
          .from('lead_requests')
          .update({
            is_spam: true,
            spam_reason: reviewNotes || 'Marked as spam by superadmin',
            status: 'spam'
          })
          .eq('id', selectedReport.lead_id);

        if (leadError) throw leadError;
      } else if (reviewStatus === 'rejected') {
        // Mark lead as not spam and make it available
        const { error: leadError } = await supabase
          .from('lead_requests')
          .update({
            is_spam: false,
            spam_reason: null,
            status: 'active'
          })
          .eq('id', selectedReport.lead_id);

        if (leadError) throw leadError;
      }

      // Refresh data
      await Promise.all([loadSpamReports(), loadLeads()]);
      
      setShowReviewModal(false);
      setSelectedReport(null);
      setReviewNotes('');
      alert(`Spam report ${reviewStatus === 'approved' ? 'approved and lead marked as spam' : 'rejected and lead made available'} successfully.`);
    } catch (error) {
      console.error('Error reviewing spam report:', error);
      alert('Failed to review spam report. Please try again.');
    }
  };

  const deleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('lead_requests')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      // Refresh data
      await Promise.all([loadLeads(), loadSpamReports()]);
      alert('Lead deleted successfully.');
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead. Please try again.');
    }
  };



  const viewLeadDetails = (lead) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  const exportLeadsData = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      // Prepare data for export
      const exportData = filteredLeads.map(lead => ({
        'Lead ID': lead.id,
        'Client Name': lead.client_name || '',
        'Client Email': lead.client_email || '',
        'Client Phone': lead.client_phone || '',
        'Project Description': lead.project_description || '',
        'Project Categories': lead.project_categories?.join(', ') || '',
        'Custom Category': lead.custom_category || '',
        'Budget Range': lead.budget_range || '',
        'Completion Date': lead.completion_date || '',
        'Address': lead.address || '',
        'City': lead.city || '',
        'State': lead.state || '',
        'Country': lead.country || '',
        'Postal Code': lead.postal_code || '',
        'Status': lead.status || '',
        'Is Spam': lead.is_spam ? 'Yes' : 'No',
        'Spam Reports Count': lead.lead_spam_reports?.length || 0,
        'Created At': lead.created_at ? new Date(lead.created_at).toLocaleString() : '',
        'Updated At': lead.updated_at ? new Date(lead.updated_at).toLocaleString() : ''
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return `"${value.toString().replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success message
      alert(`Successfully exported ${exportData.length} leads to CSV file.`);
    } catch (error) {
      console.error('Error exporting leads:', error);
      alert('Failed to export leads data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'max_quotes_reached': return 'bg-purple-100 text-purple-800';
      case 'spam': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Lead Management - Super Admin | Haliqo</title>
      </Helmet>

      <SuperAdminSidebar />

      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-2 sm:px-4 pt-4 pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-2 sm:px-4 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="space-y-1">
              <div className="flex items-center">
                <Icon name="Target" size={24} className="text-primary mr-3" />
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Lead Management</h1>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage and moderate lead requests from users
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={exportLeadsData}
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Icon name="Download" size={16} />
                    Export Data
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/super/dashboard')}
                className="flex items-center gap-2"
              >
                <Icon name="ArrowLeft" size={16} />
                Back to Dashboard
              </Button>
            </div>
            </div>
          </header>

          {/* Tabs */}
          <div className="border-b border-border mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('leads')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'leads'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                All Leads
              </button>
              <button
                onClick={() => setActiveTab('spam-reports')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'spam-reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                Spam Reports ({spamReports.filter(r => r.review_status === 'pending').length})
              </button>
            </nav>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'leads' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                      <p className="text-2xl font-bold text-foreground">{leads.length}</p>
                    </div>
                    <Icon name="Target" size={24} className="text-blue-600" />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-foreground">
                        {leads.filter(l => l.status === 'active').length}
                      </p>
                    </div>
                    <Icon name="Activity" size={24} className="text-green-600" />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-foreground">
                        {leads.filter(l => l.status === 'completed').length}
                      </p>
                    </div>
                    <Icon name="CheckCircle" size={24} className="text-blue-600" />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Spam Reports</p>
                      <p className="text-2xl font-bold text-foreground">
                        {leads.filter(l => l.lead_spam_reports && l.lead_spam_reports.length > 0).length}
                      </p>
                    </div>
                    <Icon name="AlertTriangle" size={24} className="text-red-600" />
                  </div>
                </div>
              </div>

                        {/* Filters and Actions */}
              <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search leads by client name, email, phone, address, or project description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                    icon="Search"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="Filter by status"
                  options={[
                    { value: 'all', label: 'All Leads' },
                    { value: 'active', label: 'Active' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'expired', label: 'Expired' },
                    { value: 'max_quotes_reached', label: 'Max Quotes Reached' },
                    { value: 'spam', label: 'Spam' }
                  ]}
                  className="min-w-[200px]"
                />
                {(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="px-4"
                  >
                    <Icon name="X" size={16} className="mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
              
              {/* Active Filters Summary */}
              {(searchTerm || statusFilter !== 'all') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Filter" size={16} />
                  <span>Active filters:</span>
                  {searchTerm && (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {statusFilter !== 'all' && (
                    <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs">
                      Status: {statusFilter.replace('_', ' ')}
                    </span>
                  )}
                </div>
              )}
              
              {selectedLeads.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedLeads.length} selected
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteLeads}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={16} className="mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-border"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Client
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Project
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Created
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-t border-border hover:bg-muted/25">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{lead.client_name}</p>
                            <p className="text-sm text-muted-foreground">{lead.client_email}</p>
                            <p className="text-xs text-muted-foreground">{lead.client_phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <p className="text-sm text-foreground truncate">
                              {lead.project_description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {lead.project_categories?.map((category) => (
                                <span key={category} className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded border border-primary/20">
                                  {category}
                                </span>
                              ))}
                              {lead.custom_category && (
                                <span className="px-2 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded border border-secondary/20">
                                  {lead.custom_category}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {lead.price_range && `Budget: ${lead.price_range}`}
                              {lead.completion_date && ` • Due: ${new Date(lead.completion_date).toLocaleDateString()}`}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {lead.full_address}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[lead.zip_code, lead.city, lead.region, lead.country]
                                .filter(value => value && value !== 'N/A' && value !== 'null' && value !== 'undefined' && value.trim() !== '')
                                .join(', ')}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              (lead.lead_spam_reports && lead.lead_spam_reports.length > 0) ? 'spam' : lead.status
                            )}`}>
                              {(lead.lead_spam_reports && lead.lead_spam_reports.length > 0) && (
                                <Icon name="AlertTriangle" size={12} />
                              )}
                              {(lead.lead_spam_reports && lead.lead_spam_reports.length > 0) ? 'spam' : lead.status}
                            </span>
                            {lead.lead_spam_reports && lead.lead_spam_reports.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {lead.lead_spam_reports.length} report(s)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(lead.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewLeadDetails(lead)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Icon name="Eye" size={14} />
                            </Button>
                            {lead.is_spam && lead.spam_review_status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Review spam report
                                  const report = lead.lead_spam_reports?.[0];
                                  if (report) {
                                    handleReviewSpamReport({
                                      lead_id: lead.id,
                                      lead_client_name: lead.client_name,
                                      lead_project_description: lead.project_description,
                                      reported_by_name: report.users?.full_name,
                                      reported_by_email: report.users?.email,
                                      reason: report.reason,
                                      review_status: report.review_status,
                                      report_created_at: report.created_at
                                    });
                                  }
                                }}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                <Icon name="Shield" size={14} />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteLead(lead.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Icon name="Trash2" size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredLeads.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="Search" size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No leads found</p>
                  </div>
                )}
              </div>
            )}
          </div>
            </>
          )}

          {/* Spam Reports Tab */}
          {activeTab === 'spam-reports' && (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Spam Reports</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and manage spam reports submitted by admin users
                </p>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : spamReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Icon name="Shield" className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Spam Reports</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    There are no spam reports to review at this time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Lead Details
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Reported By
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Reported At
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {spamReports.map((report) => (
                        <tr key={report.id} className="border-t border-border hover:bg-muted/25">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {report.lead_requests?.client_name || 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {report.lead_requests?.project_description || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Lead ID: {report.lead_id?.slice(-8) || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {report.users?.full_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {report.users?.email || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-xs">
                              <p className="text-sm text-foreground">
                                {report.reason || 'N/A'}
                              </p>
                              {report.additional_details && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {report.additional_details}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              report.review_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              report.review_status === 'approved' ? 'bg-red-100 text-red-800' :
                              report.review_status === 'rejected' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {report.review_status || 'pending'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewSpamReport(report)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Review Spam Report"
                              >
                                <Icon name="Eye" size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteLead(report.lead_id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                title="Delete Lead"
                              >
                                <Icon name="Trash2" size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {spamReports.length === 0 && (
                    <div className="text-center py-12">
                      <Icon name="Shield" size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No spam reports found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>



      {/* Spam Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Review Spam Report</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedReport(null);
                  }}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Lead Details</h4>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="font-medium text-foreground">
                        {selectedReport.lead_requests?.client_name || 'N/A'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedReport.lead_requests?.project_description || 'N/A'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Lead ID: {selectedReport.lead_id?.slice(-8) || 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Report Details</h4>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Reported by:</span> {selectedReport.users?.full_name || 'Unknown'} ({selectedReport.users?.email || 'N/A'})
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {selectedReport.reason || 'N/A'}
                      </p>
                      {selectedReport.additional_details && (
                        <p className="text-sm">
                          <span className="font-medium">Additional Details:</span> {selectedReport.additional_details}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-medium">Reported at:</span> {new Date(selectedReport.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Review Status
                    </label>
                    <Select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      placeholder="Select review status"
                      options={[
                        { value: 'approved', label: 'Approve (Mark as Spam)' },
                        { value: 'rejected', label: 'Reject (Not Spam)' }
                      ]}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Review Notes
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Add notes about your review decision..."
                      className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={4}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedReport(null);
                    setReviewNotes('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitSpamReview}
                  className={reviewStatus === 'approved' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  {reviewStatus === 'approved' ? 'Approve as Spam' : 'Reject Report'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Details Modal */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-foreground">Lead Details</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowLeadModal(false);
                  setSelectedLead(null);
                }}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-foreground border-b border-border pb-2">Client Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-foreground">{selectedLead.client_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-foreground">{selectedLead.client_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-foreground">{selectedLead.client_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <p className="text-foreground">
                      {selectedLead.full_address || selectedLead.client_address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">City</label>
                    <p className="text-foreground">{selectedLead.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Region</label>
                    <p className="text-foreground">{selectedLead.region || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Country</label>
                    <p className="text-foreground">{selectedLead.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ZIP Code</label>
                    <p className="text-foreground">{selectedLead.zip_code || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Communication Preferences</label>
                    <div className="text-foreground">
                      {selectedLead.communication_preferences ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedLead.communication_preferences.email && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Email</span>
                          )}
                          {selectedLead.communication_preferences.phone && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Phone</span>
                          )}
                          {selectedLead.communication_preferences.sms && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">SMS</span>
                          )}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-foreground border-b border-border pb-2">Project Information</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-foreground">{selectedLead.project_description || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Categories</label>
                    <p className="text-foreground">
                      {selectedLead.project_categories?.length > 0 
                        ? selectedLead.project_categories.join(', ') 
                        : selectedLead.custom_category || 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Price Range</label>
                    <p className="text-foreground">{selectedLead.price_range || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Completion Date</label>
                    <p className="text-foreground">
                      {selectedLead.completion_date 
                        ? new Date(selectedLead.completion_date).toLocaleDateString() 
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Street Number</label>
                    <p className="text-foreground">{selectedLead.street_number || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Project Images</label>
                    <div className="text-foreground">
                      {selectedLead.project_images && selectedLead.project_images.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                          {selectedLead.project_images.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                                <img 
                                  src={image} 
                                  alt={`Project ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => {
                                    setSelectedImage({ url: image });
                                    setShowImageModal(true);
                                  }}
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MFY3MEgzMFYzMFoiIGZpbGw9IiNEN0Q5RDEiLz4KPHBhdGggZD0iTTM1IDM1SDY1VjY1SDM1VjM1WiIgZmlsbD0iI0M3Q0Q5Ii8+CjxwYXRoIGQ9Ik00MCA0MEg2MFY2MEg0MFY0MFoiIGZpbGw9IiNBM0I0QjYiLz4KPC9zdmc+';
                                  }}
                                />
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg flex items-center justify-center">
                                <Icon 
                                  name="Eye" 
                                  className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        'No images'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Lead Status and Metadata */}
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="text-lg font-medium text-foreground mb-4">Lead Status & Metadata</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-foreground">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Public</label>
                  <p className="text-foreground">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      selectedLead.is_public ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedLead.is_public ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-foreground">
                    {selectedLead.created_at ? new Date(selectedLead.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-foreground">
                    {selectedLead.updated_at ? new Date(selectedLead.updated_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Spam Reports Section */}
            {selectedLead.lead_spam_reports && selectedLead.lead_spam_reports.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-lg font-medium text-foreground mb-4">Spam Reports</h4>
                <div className="space-y-3">
                  {selectedLead.lead_spam_reports.map((report, index) => (
                    <div key={index} className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Reported by: {report.users?.full_name || 'Unknown'} ({report.users?.email})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          report.review_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.review_status === 'approved' ? 'bg-red-100 text-red-800' :
                          report.review_status === 'rejected' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {report.review_status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <Icon name="X" className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage.url} 
              alt="Project image"
              className="max-w-full max-h-full object-contain rounded-lg"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjNjY2NjY2Ii8+Cjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminLeads;
