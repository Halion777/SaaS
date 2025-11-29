import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import MainSidebar from '../../components/ui/MainSidebar';
import TableLoader from '../../components/ui/TableLoader';
import FilterToolbar from '../follow-up-management/components/FilterToolbar';
import { useScrollPosition } from '../../utils/useScrollPosition';
import { useAuth } from '../../context/AuthContext';
import { useMultiUser } from '../../context/MultiUserContext';
import { useTranslation } from 'react-i18next';
import { InvoiceFollowUpService } from '../../services/invoiceFollowUpService';
import { InvoiceService } from '../../services/invoiceService';
import { supabase } from '../../services/supabaseClient';
import EmailService from '../../services/emailService';

const InvoicesFollowUp = () => {
  const { user } = useAuth();
  const { currentProfile } = useMultiUser();
  const { t } = useTranslation();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [activeFilter, setActiveFilter] = useState('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    days: 'all'
  });
  const filterScrollRef = useScrollPosition('followup-filter-scroll');
  
  // Real data states
  const [followUps, setFollowUps] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingFollowUp, setProcessingFollowUp] = useState(null);

  // Handle sidebar offset for responsive layout
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

  // Set initial view mode
  useEffect(() => {
    const savedViewMode = localStorage.getItem('invoice-followup-view-mode');
    if (savedViewMode && ['table', 'card'].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    } else {
      const defaultViewMode = window.innerWidth < 768 ? 'card' : 'table';
      setViewMode(defaultViewMode);
    }
  }, []);

  // Fetch real data from backend
  useEffect(() => {
    const loadData = async () => {
      if (!user || !currentProfile) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch invoices
        const { data: invoicesData, error: invoicesError } = await InvoiceService.fetchInvoices(user.id);
        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
          setError('Erreur lors du chargement des factures');
          return;
        }
        
        // Fetch follow-ups
        const { data: followUpsData, error: followUpsError } = await InvoiceFollowUpService.fetchInvoiceFollowUps(user.id, { 
          status: 'all', 
          limit: 1000 
        });
        
        if (followUpsError) {
          console.error('Error fetching follow-ups:', followUpsError);
          setError('Erreur lors du chargement des relances');
          return;
        }

        // Transform invoices data
        const transformedInvoices = (invoicesData || []).map(invoice => ({
          id: invoice.id,
          title: invoice.title || 'Sans titre',
          dueDate: invoice.due_date,
          number: invoice.invoice_number,
          clientName: invoice.client?.name || 'Client inconnu',
          amount: parseFloat(invoice.final_amount || invoice.amount || 0),
          status: invoice.status,
          createdAt: invoice.created_at,
          client: invoice.client,
          invoice_number: invoice.invoice_number
        }));
        
        setInvoices(transformedInvoices);
        
        // Transform follow-ups data to match the expected format
        const transformedFollowUps = (followUpsData || []).map(followUp => {
          const invoice = transformedInvoices.find(i => i.id === followUp.invoice_id);
          if (!invoice) return null;
          
          // Only show follow-ups for unpaid/overdue invoices
          if (invoice.status === 'paid' || invoice.status === 'cancelled') {
            return null;
          }
          
          // Note: Status filtering is handled in filteredFollowUps filter function
          // We don't filter by status here to allow status filter to work
          
          const nextFollowUp = followUp.scheduled_at || followUp.created_at;
          
          // Determine follow-up type:
          // 1. First check meta.follow_up_type from database (most accurate)
          // 2. If not available, check if invoice is actually overdue (due_date < today)
          // 3. Default to approaching_deadline if invoice is not yet overdue
          let followUpType = 'approaching_deadline';
          
          if (followUp.meta?.follow_up_type) {
            // Use the type stored in database
            followUpType = followUp.meta.follow_up_type;
          } else {
            // Fallback: Check if invoice is actually overdue
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(invoice.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            if (dueDate < today) {
              // Invoice is past due date = overdue
              followUpType = 'overdue';
            } else {
              // Invoice is not yet due = approaching deadline
              followUpType = 'approaching_deadline';
            }
          }
          
          // Only show approaching_deadline or overdue follow-ups
          // Filter out any other types
          if (followUpType !== 'approaching_deadline' && followUpType !== 'overdue') {
            return null;
          }
          
          // Calculate priority
          const calculatedPriority = (() => {
            // Get priority from meta if available
            if (followUp.meta?.priority) {
              return followUp.meta.priority;
            }

            // Calculate priority based on stage and due date
            const today = new Date();
            const dueDate = new Date(invoice.dueDate);
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Higher stages always get high priority
            if (followUp.stage > 1) {
              return 'high';
            }
            
            // Stage 0 (approaching) or Stage 1 (just overdue)
            if (followUp.stage === 0) {
              return 'medium'; // Approaching deadline
            } else if (followUp.stage === 1) {
              return daysOverdue > 7 ? 'high' : 'medium';
            } else {
              return 'high'; // Stage 2+ always high
            }
          })();

          return {
            id: followUp.id,
            name: invoice.clientName,
            number: invoice.number,
            title: invoice.title || 'Sans titre',
            project: `${invoice.number} - ${invoice.title || 'Sans titre'}`,
            nextFollowUp: nextFollowUp,
            dueDate: invoice.dueDate,
            potentialRevenue: invoice.amount,
            priority: calculatedPriority,
            status: followUp.status,
            type: 'invoice',
            hasResponse: false,
            isPaid: invoice.status === 'paid',
            invoiceId: followUp.invoice_id,
            stage: followUp.stage,
            scheduledAt: followUp.scheduled_at,
            attempts: followUp.attempts || 0,
            followUpType: followUpType,
            isAutomated: followUp.automated || false,
            templateSubject: followUp.template_subject,
            invoiceStatus: invoice.status,
            // Calculate days since last activity for filtering
            daysAgo: (() => {
              const lastActivityDate = followUp.updated_at || followUp.created_at;
              if (!lastActivityDate) return 0;
              const now = new Date();
              const lastActivity = new Date(lastActivityDate);
              const diffTime = Math.abs(now - lastActivity);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays;
            })()
          };
        }).filter(Boolean); // Remove null entries
        
        setFollowUps(transformedFollowUps);
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, currentProfile]);

  // Auto-refresh follow-up data every 30 seconds
  useEffect(() => {
    if (!user || !currentProfile) return;
    
    const interval = setInterval(async () => {
      try {
        if (!loading) {
          await refreshData();
        }
      } catch (error) {
        console.warn('Auto-refresh failed:', error);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [user, currentProfile, loading]);

  // Refresh data
  const refreshData = async () => {
    if (!user || !currentProfile) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await InvoiceService.fetchInvoices(user.id);
      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError);
        setError('Erreur lors du chargement des factures');
        return;
      }
      
      // Fetch follow-ups
      const { data: followUpsData, error: followUpsError } = await InvoiceFollowUpService.fetchInvoiceFollowUps(user.id, { 
        status: 'all', 
        limit: 1000 
      });
      
      if (followUpsError) {
        console.error('Error fetching follow-ups:', followUpsError);
        setError('Erreur lors du chargement des relances');
        return;
      }

      // Transform invoices data
      const transformedInvoices = (invoicesData || []).map(invoice => ({
        id: invoice.id,
        title: invoice.title || 'Sans titre',
        dueDate: invoice.due_date,
        number: invoice.invoice_number,
        clientName: invoice.client?.name || 'Client inconnu',
        amount: parseFloat(invoice.final_amount || invoice.amount || 0),
        status: invoice.status,
        createdAt: invoice.created_at,
        client: invoice.client,
        invoice_number: invoice.invoice_number
      }));
      
      setInvoices(transformedInvoices);
      
      // Transform follow-ups data
      const transformedFollowUps = (followUpsData || []).map(followUp => {
        const invoice = transformedInvoices.find(i => i.id === followUp.invoice_id);
        if (!invoice) return null;
        
        if (invoice.status === 'paid' || invoice.status === 'cancelled') {
          return null;
        }
        
        // Note: Status filtering is handled in filteredFollowUps filter function
        // We don't filter by status here to allow status filter to work
        
        const nextFollowUp = followUp.scheduled_at || followUp.created_at;
        
        // Determine follow-up type:
        // 1. First check meta.follow_up_type from database (most accurate)
        // 2. If not available, check if invoice is actually overdue (due_date < today)
        // 3. Default to approaching_deadline if invoice is not yet overdue
        let followUpType = 'approaching_deadline';
        
        if (followUp.meta?.follow_up_type) {
          // Use the type stored in database
          followUpType = followUp.meta.follow_up_type;
        } else {
          // Fallback: Check if invoice is actually overdue
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(invoice.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          if (dueDate < today) {
            // Invoice is past due date = overdue
            followUpType = 'overdue';
          } else {
            // Invoice is not yet due = approaching deadline
            followUpType = 'approaching_deadline';
          }
        }
        
        // Only show approaching_deadline or overdue follow-ups
        // Filter out any other types
        if (followUpType !== 'approaching_deadline' && followUpType !== 'overdue') {
          return null;
        }
        
        const calculatedPriority = (() => {
          if (followUp.meta?.priority) {
            return followUp.meta.priority;
          }

          const today = new Date();
          const dueDate = new Date(invoice.dueDate);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (followUp.stage > 1) {
            return 'high';
          }
          
          if (followUp.stage === 0) {
            return 'medium';
          } else if (followUp.stage === 1) {
            return daysOverdue > 7 ? 'high' : 'medium';
          } else {
            return 'high';
          }
        })();

        return {
          id: followUp.id,
          name: invoice.clientName,
          number: invoice.number,
          title: invoice.title || 'Sans titre',
          project: `${invoice.number} - ${invoice.title || 'Sans titre'}`,
          nextFollowUp: nextFollowUp,
          dueDate: invoice.dueDate,
          potentialRevenue: invoice.amount,
          priority: calculatedPriority,
          status: followUp.status,
          type: 'invoice',
          hasResponse: false,
          isPaid: invoice.status === 'paid',
          invoiceId: followUp.invoice_id,
          stage: followUp.stage,
          scheduledAt: followUp.scheduled_at,
          attempts: followUp.attempts || 0,
          followUpType: followUpType,
          isAutomated: followUp.automated || false,
          templateSubject: followUp.template_subject,
          invoiceStatus: invoice.status,
          daysAgo: (() => {
            const lastActivityDate = followUp.updated_at || followUp.created_at;
            if (!lastActivityDate) return 0;
            const now = new Date();
            const lastActivity = new Date(lastActivityDate);
            const diffTime = Math.abs(now - lastActivity);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
          })()
        };
      }).filter(Boolean);
      
      setFollowUps(transformedFollowUps);
      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Erreur lors de l\'actualisation des données');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    await refreshData();
  };

  // Filter to only show items that need follow-up
  const needsFollowUp = (followUp) => {
    if (followUp.type === 'invoice') {
      return !followUp.isPaid;
    }
    return false;
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getDaysRange = (days) => {
    switch (days) {
      case '0-2': return [0, 2];
      case '3-5': return [3, 5];
      case '6-10': return [6, 10];
      case '10+': return [10, Infinity];
      default: return [0, Infinity];
    }
  };

  const filteredFollowUps = followUps.filter(followUp => {
    if (!needsFollowUp(followUp)) return false;
    
    // Only show invoice follow-ups
    if (followUp.type !== 'invoice') return false;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (followUp.name && followUp.name.toLowerCase().includes(searchLower)) ||
        (followUp.number && followUp.number.toLowerCase().includes(searchLower)) ||
        (followUp.status && followUp.status.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
    }
    
    // Filter by follow-up type (only approaching_deadline or overdue)
    // But allow all types when status filter is set to show stopped/completed
    if (filters.status === 'all') {
      // Default behavior: only show approaching_deadline and overdue
      if (followUp.followUpType !== 'approaching_deadline' && followUp.followUpType !== 'overdue') {
        return false;
      }
      // Also filter out stopped/completed when status is 'all' (default view)
      const excludedStatuses = ['stopped', 'all_stages_completed', 'stage_0_completed', 'stage_1_completed', 'stage_2_completed', 'stage_3_completed', 'failed'];
      if (excludedStatuses.includes(followUp.status)) {
        return false;
      }
    } else {
      // When a specific status is selected, respect the type filter if set
      if (filters.type !== 'all' && followUp.followUpType !== filters.type) return false;
    }
    
    // Filter by priority
    if (filters.priority !== 'all' && followUp.priority !== filters.priority) return false;
    
    // Filter by status
    if (filters.status !== 'all' && followUp.status !== filters.status) return false;
    
    // Filter by days
    if (filters.days !== 'all') {
      const [minDays, maxDays] = getDaysRange(filters.days);
      if (followUp.daysAgo < minDays || followUp.daysAgo > maxDays) return false;
    }
    
    return true;
  });

  const invoiceFollowUps = followUps.filter(f => f.type === 'invoice' && !f.isPaid);
  const totalFollowUpsCount = filteredFollowUps.length;
  const highPriorityCount = filteredFollowUps.filter(f => f.priority === 'high').length;
  const totalRevenue = filteredFollowUps.reduce((sum, f) => sum + f.potentialRevenue, 0);

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-700 bg-red-100 border border-red-200',
      medium: 'text-amber-700 bg-amber-100 border border-amber-200',
      low: 'text-emerald-700 bg-emerald-100 border border-emerald-200'
    };
    return colors[priority] || colors.low;
  };

  const getPriorityLabel = (priority) => {
    return t(`followUpManagement.priority.${priority}`) || t('followUpManagement.priority.low');
  };

  const getFollowUpTypeLabel = (followUpType) => {
    if (followUpType === 'approaching_deadline') {
      return t('invoiceFollowUp.type.approachingDeadline') || 'Échéance approchante';
    } else if (followUpType === 'overdue') {
      return t('invoiceFollowUp.type.overdue') || 'En retard';
    }
    return followUpType;
  };

  const getFollowUpTypeColor = (followUpType) => {
    const colors = {
      'approaching_deadline': 'text-blue-700 bg-blue-100',
      'overdue': 'text-red-700 bg-red-100'
    };
    return colors[followUpType] || 'text-gray-700 bg-gray-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-orange-700 bg-orange-100',
      'scheduled': 'text-purple-700 bg-purple-100',
      'ready_for_dispatch': 'text-blue-700 bg-blue-100',
      'sent': 'text-green-700 bg-green-100',
      'failed': 'text-red-700 bg-red-100',
      'stopped': 'text-gray-700 bg-gray-100',
      'all_stages_completed': 'text-emerald-700 bg-emerald-100',
      'stage_0_completed': 'text-blue-700 bg-blue-100',
      'stage_1_completed': 'text-indigo-700 bg-indigo-100',
      'stage_2_completed': 'text-violet-700 bg-violet-100',
      'stage_3_completed': 'text-purple-700 bg-purple-100'
    };
    return colors[status] || 'text-gray-700 bg-gray-100';
  };

  const getStageCompletionLabel = (status, stage) => {
    if (status === 'all_stages_completed') {
      return t('followUpManagement.status.allStagesCompleted') || 'Toutes les étapes terminées';
    }
    if (status.startsWith('stage_') && status.endsWith('_completed')) {
      const stageNumber = status.match(/stage_(\d+)_completed/)?.[1];
      if (stageNumber) {
        return t(`followUpManagement.status.stage${stageNumber}Completed`) || `Étape ${stageNumber} terminée`;
      }
    }
    return t('followUpManagement.stageCompletion.inProgress', { stage: stage || 0 }) || `Étape ${stage || 0} en cours`;
  };

  const getStatusLabel = (status) => {
    return t(`followUpManagement.status.${status}`) || status;
  };

  const getTypeIcon = (type) => {
    return type === 'invoice' ? 'Receipt' : 'FileText';
  };

  /**
   * Handle manual follow-up button click
   */
  const handleFollowUp = async (id) => {
    try {
      setProcessingFollowUp(id);
      
      const followUp = followUps.find(fu => fu.id === id);
      if (!followUp) {
        console.error('Follow-up not found:', id);
        return;
      }

      const invoice = invoices.find(i => i.id === followUp.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found for follow-up');
      }

      // Get company profile for email
      const { data: companyProfile } = await supabase
        .from('company_profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

      // Trigger manual follow-up
      const result = await InvoiceFollowUpService.triggerManualFollowUp(
        followUp.invoiceId
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send follow-up email');
      }

      // Refresh the follow-ups list
      await refreshData();
      
    } catch (error) {
      console.error('Error sending manual follow-up:', error);
      alert('Erreur lors de l\'envoi de la relance. Veuillez réessayer.');
    } finally {
      setProcessingFollowUp(null);
    }
  };

  const renderTableView = () => (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.client')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('invoiceFollowUp.tableHeaders.invoice')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.title')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('invoiceFollowUp.tableHeaders.dueDate')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.followUpDate')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.amount')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.priority')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.followUpType')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.status')}</th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.tableHeaders.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredFollowUps.map((followUp) => (
              <tr key={followUp.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name="User" 
                      size={14} 
                      className="sm:w-4 sm:h-4 text-blue-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{followUp.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name="Receipt" 
                      size={14} 
                      className="sm:w-4 sm:h-4 text-blue-500"
                    />
                    <span className="text-xs sm:text-sm font-medium text-foreground">{followUp.number || 'N/A'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground max-w-[200px] truncate block">
                    {followUp.title || 'Sans titre'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {followUp.dueDate ? new Date(followUp.dueDate).toLocaleDateString() : 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm text-muted-foreground" title={followUp.scheduledAt ? t('invoiceFollowUp.tooltip.scheduledDate') : ''}>
                    {followUp.scheduledAt ? new Date(followUp.scheduledAt).toLocaleDateString() : t('followUpManagement.cardView.notScheduled')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs sm:text-sm font-medium text-green-600">
                    +{followUp.potentialRevenue.toLocaleString()}€
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getPriorityColor(followUp.priority)}`}>
                    {getPriorityLabel(followUp.priority)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getFollowUpTypeColor(followUp.followUpType)}`}>
                    {getFollowUpTypeLabel(followUp.followUpType)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(followUp.status)}`}>
                    {getStatusLabel(followUp.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleFollowUp(followUp.id)}
                      iconName={processingFollowUp === followUp.id ? "Loader" : "Mail"}
                      iconPosition="left"
                      className="h-7 sm:h-8 text-xs"
                      title="Relancer"
                      disabled={processingFollowUp === followUp.id}
                    >
                      {processingFollowUp === followUp.id ? t('followUpManagement.actions.sending') : t('followUpManagement.actions.followUp')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCardView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      {filteredFollowUps.map((followUp) => (
        <div key={followUp.id} className="bg-card border border-border rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Header with client info and tags */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <Icon 
                  name="User" 
                  size={16} 
                  className="sm:w-5 sm:h-5 text-blue-500"
                />
                <h3 className="text-sm sm:text-base font-semibold text-foreground">{followUp.name}</h3>
              </div>
              <div className="flex flex-wrap gap-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getPriorityColor(followUp.priority)}`}>
                  {getPriorityLabel(followUp.priority)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getStatusColor(followUp.status)}`}>
                  {getStatusLabel(followUp.status)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center ${getFollowUpTypeColor(followUp.followUpType)}`}>
                  {getFollowUpTypeLabel(followUp.followUpType)}
                </span>
              </div>
            </div>

            {/* Project details */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="FileText" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>{followUp.title}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="Hash" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>{t('invoiceFollowUp.cardView.invoiceNumber', { number: followUp.number || 'N/A' })}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="Calendar" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>{t('invoiceFollowUp.cardView.dueDate', { date: followUp.dueDate ? new Date(followUp.dueDate).toLocaleDateString() : 'N/A' })}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="Clock" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>{t('followUpManagement.cardView.followUpDate', { date: followUp.scheduledAt ? new Date(followUp.scheduledAt).toLocaleDateString() : t('followUpManagement.cardView.notScheduled') })}</span>
              </div>
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                <Icon name="GitBranch" size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>{t('followUpManagement.cardView.stage', { stage: followUp.stage, status: getStageCompletionLabel(followUp.status, followUp.stage) })}</span>
              </div>
              {followUp.templateSubject && (
                <div className="flex items-start space-x-2 text-xs sm:text-sm text-muted-foreground">
                  <Icon name="MessageSquare" size={12} className="sm:w-3.5 sm:h-3.5 mt-0.5" />
                  <span className="break-words">{followUp.templateSubject}</span>
                </div>
              )}
            </div>

            {/* Revenue and actions */}
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-bold text-green-600">
                +{followUp.potentialRevenue.toLocaleString()}€
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleFollowUp(followUp.id)}
                  iconName={processingFollowUp === followUp.id ? "Loader" : "Mail"}
                  iconPosition="left"
                  className="h-8 sm:h-9"
                  disabled={processingFollowUp === followUp.id}
                >
                  {processingFollowUp === followUp.id ? t('followUpManagement.actions.sending') : t('followUpManagement.actions.followUp')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      
      <main 
        className={`transition-all duration-300 ease-out ${isMobile ? 'pb-16 pt-4' : ''}`}
        style={{ 
          marginLeft: isMobile ? 0 : `${sidebarOffset}px`,
        }}
      >
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="Bell" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('invoiceFollowUp.title') || 'Relances factures'}</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('invoiceFollowUp.subtitle') || 'Relancez vos factures non payées'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              </div>
            </div>
          </header>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.kpi.totalFollowUps')}</h3>
                <Icon name="MessageCircle" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 mb-1">{totalFollowUpsCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('followUpManagement.kpi.total')}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.kpi.highPriority')}</h3>
                <Icon name="MessageCircle" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mb-1">{highPriorityCount}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('followUpManagement.kpi.urgent')}</p>
            </div>

            <div className="bg-card border border-border rounded-lg p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{t('followUpManagement.kpi.potentialRevenue')}</h3>
                <Icon name="Receipt" size={16} className="sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mb-1">{totalRevenue.toLocaleString()}€</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {t('invoiceFollowUp.kpi.invoices') || 'Factures'}
              </p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <FilterToolbar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filteredCount={filteredFollowUps.length}
            isInvoiceFollowUp={true}
          />

          {/* Follow-up Items */}
          <div className="relative">
            {loading ? (
              <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <div className="w-full">
                  <TableLoader message={t('followUpManagement.refreshing')} />
                </div>
              </div>
            ) : (
              <>
                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                  {/* Search Bar */}
                  <div className="p-3 md:p-4 border-b border-border">
                    <div className="relative">
                      <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="search"
                        placeholder={t('invoiceFollowUp.search.placeholder', 'Search by client, invoice number, or status...')}
                        value={searchTerm || ''}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 max-w-md w-full pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center p-4 border-b border-border">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">{t('followUpManagement.view.label')}</span>
                      <div className="flex bg-muted rounded-lg p-1">
                        <button
                          onClick={() => {
                            setViewMode('table');
                            localStorage.setItem('invoice-followup-view-mode', 'table');
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            viewMode === 'table'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon name="Table" size={14} className="mr-1" />
                          {t('followUpManagement.view.table')}
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('card');
                            localStorage.setItem('invoice-followup-view-mode', 'card');
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                            viewMode === 'card'
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Icon name="Grid" size={14} className="mr-1" />
                          {t('followUpManagement.view.cards')}
                        </button>
                      </div>
                    </div>
                  </div>
                  {error ? (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                      <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">{t('followUpManagement.error.title')}</h3>
                      <p className="text-muted-foreground">
                        {error}. {t('followUpManagement.error.message')}
                      </p>
                    </div>
                  ) : filteredFollowUps.length === 0 ? (
                    <div className="p-8 text-center">
                      <Icon name="Bell" size={48} className="text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-4">
                        {followUps.length === 0 
                          ? t('invoiceFollowUp.empty.title') || 'Aucune relance nécessaire'
                          : t('followUpManagement.empty.noMatch') || 'Aucun résultat ne correspond aux filtres'
                        }
                      </h3>
                      {followUps.length > 0 && (
                        <Button onClick={() => setFilters({ type: 'all', priority: 'all', status: 'all', days: 'all' })} variant="outline" className="gap-2">
                          <Icon name="RotateCcw" size={16} />
                          {t('followUpManagement.empty.clearFilters')}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Content */}
                      {viewMode === 'table' ? (
                        renderTableView()
                      ) : (
                        renderCardView()
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoicesFollowUp;
