import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';

const SuperAdminLeads = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showSpamModal, setShowSpamModal] = useState(false);
  const [spamReason, setSpamReason] = useState('');

  useEffect(() => {
    loadLeads();
  }, []);

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
          users!lead_requests_user_id_fkey(full_name, email, company_name)
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

  const filterLeads = () => {
    let filtered = leads;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.project_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.users?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
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

  const markAsSpam = async () => {
    if (selectedLeads.length === 0 || !spamReason.trim()) return;

    try {
      // Update lead status to spam
      const { error } = await supabase
        .from('lead_requests')
        .update({ 
          status: 'spam',
          spam_reason: spamReason,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedLeads);

      if (error) throw error;

      // Refresh leads
      await loadLeads();
      setSelectedLeads([]);
      setShowSpamModal(false);
      setSpamReason('');
    } catch (error) {
      console.error('Error marking leads as spam:', error);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'spam': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
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

      <main className="ml-0 lg:ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Lead Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage and moderate lead requests from users
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/super/dashboard')}
              >
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <p className="text-sm font-medium text-muted-foreground">Spam</p>
                  <p className="text-2xl font-bold text-foreground">
                    {leads.filter(l => l.status === 'spam').length}
                  </p>
                </div>
                <Icon name="AlertTriangle" size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="spam">Spam</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {selectedLeads.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedLeads.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpamModal(true)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Icon name="AlertTriangle" size={16} className="mr-1" />
                    Mark as Spam
                  </Button>
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
                        User
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
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <p className="text-sm text-foreground truncate">
                              {lead.project_description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.project_type} • {lead.budget_range}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {lead.users?.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lead.users?.email || 'No email'}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {formatDate(lead.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // View lead details
                                console.log('View lead:', lead.id);
                              }}
                            >
                              <Icon name="Eye" size={14} />
                            </Button>
                            {lead.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Mark as completed
                                  supabase
                                    .from('lead_requests')
                                    .update({ status: 'completed' })
                                    .eq('id', lead.id)
                                    .then(() => loadLeads());
                                }}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Icon name="Check" size={14} />
                              </Button>
                            )}
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
        </div>
      </main>

      {/* Spam Modal */}
      {showSpamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Mark as Spam
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide a reason for marking {selectedLeads.length} lead(s) as spam:
            </p>
            <textarea
              value={spamReason}
              onChange={(e) => setSpamReason(e.target.value)}
              placeholder="Enter reason for marking as spam..."
              className="w-full p-3 border border-border rounded-md bg-background text-foreground mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSpamModal(false);
                  setSpamReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={markAsSpam}
                disabled={!spamReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Mark as Spam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminLeads;
