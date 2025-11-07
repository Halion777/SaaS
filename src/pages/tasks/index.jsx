import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import MainSidebar from '../../components/ui/MainSidebar';
import GlobalProfile from '../../components/ui/GlobalProfile';
import Icon from '../../components/AppIcon';
import TableLoader from '../../components/ui/TableLoader';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { listScheduledFollowUps } from '../../services/followUpService';
import TasksTable from './components/TasksTable';
import FilterBar from './components/FilterBar';
const TasksPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all'
  });

  // Sidebar offset handling
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
        const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleStorage = () => {
      const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
      if (!isMobile && !isTablet) {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    window.addEventListener('sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    window.addEventListener('storage', handleStorage);
    handleResize();

    return () => {
      window.removeEventListener('sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language || 'fr', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysAgo = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return Math.floor((today - date) / (1000 * 60 * 60 * 24));
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case 'invoice': return 'Receipt';
      case 'follow': return 'MessageCircle';
      case 'quote': return 'FileText';
      default: return 'CheckCircle';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'high': return 'bg-error/10';
      case 'medium': return 'bg-warning/10';
      case 'low': return 'bg-success/10';
      default: return 'bg-muted/30';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return t('common.priority.high', 'High');
      case 'medium': return t('common.priority.medium', 'Medium');
      case 'low': return t('common.priority.low', 'Low');
      default: return t('common.priority.normal', 'Normal');
    }
  };

  const getTaskTypeLabel = (type) => {
    switch (type) {
      case 'invoice': return t('dashboard.taskList.taskTypes.invoice', 'Invoice');
      case 'follow': return t('dashboard.taskList.taskTypes.follow', 'Follow Up');
      case 'quote': return t('dashboard.taskList.taskTypes.finalize', 'Quote');
      default: return t('common.task', 'Task');
    }
  };

  const handleTaskClick = (task) => {
    if (task.link) {
      navigate(task.link);
    }
  };

  useEffect(() => {
    const loadTasks = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const allTasks = [];

        // 1. Get overdue client invoices
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: overdueClientInvoices } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            due_date,
            status,
            final_amount,
            amount,
            client:clients(id, name)
          `)
          .eq('user_id', user.id)
          .neq('status', 'paid')
          .lt('due_date', today.toISOString().split('T')[0]);

        if (overdueClientInvoices) {
          overdueClientInvoices.forEach(invoice => {
            const daysOverdue = getDaysAgo(invoice.due_date);
            // Higher priority for older invoices: >14 days = high, >7 days = medium, else = low
            let priority = 'low';
            if (daysOverdue > 14) {
              priority = 'high';
            } else if (daysOverdue > 7) {
              priority = 'medium';
            } else if (daysOverdue > 0) {
              priority = 'low';
            }
            allTasks.push({
              id: `invoice-${invoice.id}`,
              type: 'invoice',
              title: `Facture ${invoice.invoice_number || 'N/A'} en retard`,
              client: invoice.client?.name || 'Client',
              priority,
              dueDate: invoice.due_date,
              action: 'Voir la facture',
              amount: invoice.final_amount || invoice.amount || 0,
              daysOverdue,
              link: `/invoices-management?invoice=${invoice.id}`
            });
          });
        }

        // 2. Get overdue expense invoices
        const { data: overdueExpenseInvoices } = await supabase
          .from('expense_invoices')
          .select(`
            id,
            invoice_number,
            due_date,
            status,
            amount,
            supplier_name
          `)
          .eq('user_id', user.id)
          .neq('status', 'paid')
          .lt('due_date', today.toISOString().split('T')[0]);

        if (overdueExpenseInvoices) {
          overdueExpenseInvoices.forEach(invoice => {
            const daysOverdue = getDaysAgo(invoice.due_date);
            // Higher priority for older invoices: >14 days = high, >7 days = medium, else = low
            let priority = 'low';
            if (daysOverdue > 14) {
              priority = 'high';
            } else if (daysOverdue > 7) {
              priority = 'medium';
            } else if (daysOverdue > 0) {
              priority = 'low';
            }
            allTasks.push({
              id: `expense-${invoice.id}`,
              type: 'invoice',
              title: `Facture ${invoice.invoice_number || 'N/A'} en retard`,
              client: invoice.supplier_name || 'Fournisseur',
              priority,
              dueDate: invoice.due_date,
              action: 'Voir la facture',
              amount: invoice.amount || 0,
              daysOverdue,
              link: `/expense-invoices?invoice=${invoice.id}`
            });
          });
        }

        // 3. Get pending follow-ups
        const { data: followUpsData } = await listScheduledFollowUps({ status: 'pending', limit: 50 });
        
        if (followUpsData?.data) {
          const quoteIds = followUpsData.data.map(f => f.quote_id).filter(Boolean);
          
          if (quoteIds.length > 0) {
            const { data: quotes } = await supabase
              .from('quotes')
              .select(`
                id,
                quote_number,
                title,
                status,
                sent_at,
                client:clients(id, name)
              `)
              .in('id', quoteIds)
              .eq('user_id', user.id);

            if (quotes) {
              quotes.forEach(quote => {
                const followUp = followUpsData.data.find(f => f.quote_id === quote.id);
                if (followUp) {
                  const daysSinceSent = quote.sent_at ? getDaysAgo(quote.sent_at) : 0;
                  // Higher priority for older follow-ups: >10 days = high, >5 days = medium, else = low
                  let priority = 'low';
                  if (daysSinceSent > 10) {
                    priority = 'high';
                  } else if (daysSinceSent > 5) {
                    priority = 'medium';
                  } else if (daysSinceSent > 0) {
                    priority = 'low';
                  }
                  allTasks.push({
                    id: `followup-${followUp.id}`,
                    type: 'follow',
                    title: `Relance pour devis ${quote.quote_number || 'N/A'}`,
                    client: quote.client?.name || 'Client',
                    priority,
                    dueDate: followUp.scheduled_at,
                    action: 'Planifier la relance',
                    daysSinceSent,
                    link: `/quotes-management?quote=${quote.id}`
                  });
                }
              });
            }
          }
        }

        // 4. Get quotes that need follow-up (sent but not responded for 3+ days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        
        const { data: delayedQuotes } = await supabase
          .from('quotes')
          .select(`
            id,
            quote_number,
            title,
            status,
            sent_at,
            client:clients(id, name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'sent')
          .lt('sent_at', threeDaysAgo.toISOString());

        if (delayedQuotes) {
          delayedQuotes.forEach(quote => {
            const daysSinceSent = quote.sent_at ? getDaysAgo(quote.sent_at) : 0;
            // Higher priority for older delayed quotes: >14 days = high, >7 days = medium, else = low
            let priority = 'low';
            if (daysSinceSent > 14) {
              priority = 'high';
            } else if (daysSinceSent > 7) {
              priority = 'medium';
            } else if (daysSinceSent > 3) {
              priority = 'low';
            }
            allTasks.push({
              id: `delayed-${quote.id}`,
              type: 'follow',
              title: `Devis ${quote.quote_number || 'N/A'} sans réponse`,
              client: quote.client?.name || 'Client',
              priority,
              dueDate: quote.sent_at,
              action: 'Relancer le client',
              daysSinceSent,
              link: `/quotes-management?quote=${quote.id}`
            });
          });
        }

        // 5. Get accepted quotes that need invoice creation
        const { data: acceptedQuotes } = await supabase
          .from('quotes')
          .select(`
            id,
            quote_number,
            title,
            status,
            accepted_at,
            client:clients(id, name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted');

        if (acceptedQuotes && acceptedQuotes.length > 0) {
          // Check which quotes don't have invoices yet
          const quoteIds = acceptedQuotes.map(q => q.id);
          const { data: existingInvoices } = await supabase
            .from('invoices')
            .select('quote_id')
            .in('quote_id', quoteIds)
            .eq('user_id', user.id);

          const quotesWithInvoices = new Set(existingInvoices?.map(inv => inv.quote_id) || []);

          acceptedQuotes.forEach(quote => {
            if (!quotesWithInvoices.has(quote.id)) {
              allTasks.push({
                id: `invoice-needed-${quote.id}`,
                type: 'invoice',
                title: `Créer facture pour devis ${quote.quote_number || 'N/A'}`,
                client: quote.client?.name || 'Client',
                priority: 'medium',
                dueDate: quote.accepted_at,
                action: 'Créer la facture',
                link: `/quotes-management?quote=${quote.id}&action=convert`
              });
            }
          });
        }

        // Sort tasks by priority and days overdue/since sent (older tasks first)
        allTasks.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          // If same priority, sort by days overdue/since sent (more days = higher priority)
          const aDays = a.daysOverdue || a.daysSinceSent || 0;
          const bDays = b.daysOverdue || b.daysSinceSent || 0;
          if (aDays !== bDays) {
            return bDays - aDays; // More days = higher priority
          }
          // If same days, sort by due date (older first)
          return new Date(a.dueDate) - new Date(b.dueDate);
        });

        setTasks(allTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [user?.id]);

  // Apply filters and search using useMemo for better performance
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    
    if (filters.type !== 'all') {
      filtered = filtered.filter(task => task.type === filters.type);
    }
    
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.client.toLowerCase().includes(searchLower) ||
        task.action.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [tasks, filters, searchTerm]);

  const handleClearFilters = () => {
    setFilters({ type: 'all', priority: 'all' });
    setSearchTerm('');
  };


  return (
    <div className="min-h-screen bg-background">
      <MainSidebar />
      <GlobalProfile />
      
      <main 
        className={`transition-all duration-300 ease-out ${
          isMobile ? 'pb-16 pt-4' : ''
        }`}
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
                  <Icon name="CheckCircle" size={24} className="text-primary mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {t('dashboard.taskList.viewAllTasks', 'View All Tasks')}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {t('dashboard.taskList.title', "Today's Tasks")} • {t('dashboard.taskList.tasksCount', { count: filteredTasks.length })}
                </p>
              </div>
            </div>
          </header>

          {/* Filter Bar */}
          <FilterBar 
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={handleClearFilters}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* Tasks Display */}
          {loading ? (
            <div className="bg-card border border-border rounded-lg">
              <TableLoader message={t('dashboard.taskList.title', "Today's Tasks")} />
            </div>
          ) : (
            <TasksTable
              tasks={filteredTasks}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onTaskClick={handleTaskClick}
              formatDate={formatDate}
              getPriorityColor={getPriorityColor}
              getPriorityBg={getPriorityBg}
              getPriorityLabel={getPriorityLabel}
              getTaskIcon={getTaskIcon}
              getTaskTypeLabel={getTaskTypeLabel}
              i18n={i18n}
              t={t}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default TasksPage;
