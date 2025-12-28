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
    // Navigate to appropriate follow-up page with search parameter
    if (task.type === 'follow') {
      // For quote follow-ups, navigate to quotes-follow-up page
      if (task.quoteNumber) {
        navigate(`/quotes-follow-up?search=${encodeURIComponent(task.quoteNumber)}`);
      } else if (task.link) {
        navigate(task.link);
      }
    } else if (task.type === 'invoice') {
      // For invoice tasks, navigate to invoices-follow-up page
      // Exception: invoice-needed tasks (creating invoice from quote) should go to quotes-management
      if (task.id && task.id.startsWith('invoice-needed-')) {
        // This is a quote that needs invoice creation, navigate to quotes-management
        if (task.link) {
          navigate(task.link);
        }
      } else if (task.invoiceNumber) {
        navigate(`/invoices-follow-up?search=${encodeURIComponent(task.invoiceNumber)}`);
      } else if (task.link) {
        navigate(task.link);
      }
    } else if (task.link) {
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

        // 1. Get overdue and due today client invoices
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];
        
        const { data: clientInvoices } = await supabase
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
          .lte('due_date', todayStr);

        if (clientInvoices) {
          clientInvoices.forEach(invoice => {
            const daysOverdue = getDaysAgo(invoice.due_date);
            const isDueToday = invoice.due_date === todayStr;
            // Higher priority for older invoices: >14 days = high, >7 days = medium, else = low
            let priority = 'low';
            if (isDueToday) {
              priority = 'high';
            } else if (daysOverdue > 14) {
              priority = 'high';
            } else if (daysOverdue > 7) {
              priority = 'medium';
            } else if (daysOverdue > 0) {
              priority = 'low';
            }
            allTasks.push({
              id: `invoice-${invoice.id}`,
              type: 'invoice',
              title: isDueToday 
                ? t('dashboard.taskList.taskLabels.invoiceDueToday', { invoiceNumber: invoice.invoice_number || 'N/A' }, `Invoice ${invoice.invoice_number || 'N/A'} due today`)
                : t('dashboard.taskList.taskLabels.overdueInvoice', { invoiceNumber: invoice.invoice_number || 'N/A' }, `Invoice ${invoice.invoice_number || 'N/A'} overdue`),
              client: invoice.client?.name || t('dashboard.taskList.taskLabels.client', 'Client'),
              priority,
              dueDate: invoice.due_date,
              action: t('dashboard.taskList.taskLabels.viewInvoice', 'View invoice'),
              amount: invoice.final_amount || invoice.amount || 0,
              daysOverdue: isDueToday ? 0 : daysOverdue,
              invoiceNumber: invoice.invoice_number,
              link: `/invoices-management?invoice=${invoice.id}`
            });
          });
        }

        // 2. Get overdue and due today expense invoices
        const { data: expenseInvoices } = await supabase
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
          .lte('due_date', todayStr);

        if (expenseInvoices) {
          expenseInvoices.forEach(invoice => {
            const daysOverdue = getDaysAgo(invoice.due_date);
            const isDueToday = invoice.due_date === todayStr;
            // Higher priority for older invoices: >14 days = high, >7 days = medium, else = low
            let priority = 'low';
            if (isDueToday) {
              priority = 'high';
            } else if (daysOverdue > 14) {
              priority = 'high';
            } else if (daysOverdue > 7) {
              priority = 'medium';
            } else if (daysOverdue > 0) {
              priority = 'low';
            }
            allTasks.push({
              id: `expense-${invoice.id}`,
              type: 'invoice',
              title: isDueToday
                ? t('dashboard.taskList.taskLabels.invoiceDueToday', { invoiceNumber: invoice.invoice_number || 'N/A' }, `Expense invoice ${invoice.invoice_number || 'N/A'} due today`)
                : t('dashboard.taskList.taskLabels.overdueExpenseInvoice', { invoiceNumber: invoice.invoice_number || 'N/A' }, `Expense invoice ${invoice.invoice_number || 'N/A'} overdue`),
              client: invoice.supplier_name || t('dashboard.taskList.taskLabels.supplier', 'Supplier'),
              priority,
              dueDate: invoice.due_date,
              action: t('dashboard.taskList.taskLabels.viewInvoice', 'View invoice'),
              amount: invoice.amount || 0,
              daysOverdue: isDueToday ? 0 : daysOverdue,
              invoiceNumber: invoice.invoice_number,
              link: `/expense-invoices?invoice=${invoice.id}`
            });
          });
        }

        // 3. Get pending follow-ups scheduled for today or overdue
        const { data: followUpsData } = await listScheduledFollowUps({ status: 'pending', limit: 50 });
        
        if (followUpsData?.data) {
          // Filter follow-ups scheduled for today or overdue
          const relevantFollowUps = followUpsData.data.filter(f => {
            if (!f.scheduled_at) return false;
            const scheduledDate = new Date(f.scheduled_at);
            scheduledDate.setHours(0, 0, 0, 0);
            return scheduledDate <= today;
          });
          
          // Get quotes for these follow-ups
          const quoteIds = relevantFollowUps.map(f => f.quote_id).filter(Boolean);
          
          if (quoteIds.length > 0) {
            const { data: quotes } = await supabase
              .from('quotes')
              .select(`
                id,
                quote_number,
                title,
                status,
                sent_at,
                total_amount,
                final_amount,
                client:clients(id, name)
              `)
              .in('id', quoteIds)
              .eq('user_id', user.id);

            if (quotes) {
              quotes.forEach(quote => {
                const followUp = relevantFollowUps.find(f => f.quote_id === quote.id);
                if (followUp) {
                  const daysSinceSent = quote.sent_at ? getDaysAgo(quote.sent_at) : 0;
                  const scheduledDate = new Date(followUp.scheduled_at);
                  scheduledDate.setHours(0, 0, 0, 0);
                  const isDueToday = scheduledDate.getTime() === today.getTime();
                  // Higher priority for older follow-ups: >10 days = high, >5 days = medium, else = low
                  let priority = 'low';
                  if (isDueToday) {
                    priority = 'high';
                  } else if (daysSinceSent > 10) {
                    priority = 'high';
                  } else if (daysSinceSent > 5) {
                    priority = 'medium';
                  } else if (daysSinceSent > 0) {
                    priority = 'low';
                  }
                  allTasks.push({
                    id: `followup-${followUp.id}`,
                    type: 'follow',
                    title: t('dashboard.taskList.taskLabels.followUpQuote', { quoteNumber: quote.quote_number || 'N/A' }, `Follow-up for quote ${quote.quote_number || 'N/A'}`),
                    client: quote.client?.name || t('dashboard.taskList.taskLabels.client', 'Client'),
                    priority,
                    dueDate: followUp.scheduled_at,
                    action: t('dashboard.taskList.taskLabels.scheduleFollowUp', 'Schedule follow-up'),
                    daysSinceSent,
                    amount: parseFloat(quote.final_amount || quote.total_amount || 0),
                    quoteNumber: quote.quote_number,
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
            total_amount,
            final_amount,
            client:clients(id, name)
          `)
          .eq('user_id', user.id)
          .in('status', ['sent', 'viewed'])
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
              title: t('dashboard.taskList.taskLabels.noResponseQuote', { quoteNumber: quote.quote_number || 'N/A' }, `Quote ${quote.quote_number || 'N/A'} with no response`),
              client: quote.client?.name || t('dashboard.taskList.taskLabels.client', 'Client'),
              priority,
              dueDate: quote.sent_at,
              action: t('dashboard.taskList.taskLabels.followUpClient', 'Follow up with client'),
              daysSinceSent,
              amount: parseFloat(quote.final_amount || quote.total_amount || 0),
              quoteNumber: quote.quote_number,
              link: `/quotes-management?quote=${quote.id}`
            });
          });
        }

        // 5. Get accepted quotes that need invoice creation (only recent ones - last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        const { data: recentAcceptedQuotes } = await supabase
          .from('quotes')
          .select(`
            id,
            quote_number,
            title,
            status,
            accepted_at,
            total_amount,
            final_amount,
            client:clients(id, name)
          `)
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .gte('accepted_at', sevenDaysAgo.toISOString());

        if (recentAcceptedQuotes && recentAcceptedQuotes.length > 0) {
          // Check which quotes don't have invoices yet
          const quoteIds = recentAcceptedQuotes.map(q => q.id);
          const { data: existingInvoices } = await supabase
            .from('invoices')
            .select('quote_id')
            .in('quote_id', quoteIds)
            .eq('user_id', user.id);

          const quotesWithInvoices = new Set(existingInvoices?.map(inv => inv.quote_id) || []);

          recentAcceptedQuotes.forEach(quote => {
            if (!quotesWithInvoices.has(quote.id)) {
              const daysSinceAccepted = quote.accepted_at ? getDaysAgo(quote.accepted_at) : 0;
              allTasks.push({
                id: `invoice-needed-${quote.id}`,
                type: 'invoice',
                title: t('dashboard.taskList.taskLabels.createInvoiceForQuote', { quoteNumber: quote.quote_number || 'N/A' }, `Create invoice for quote ${quote.quote_number || 'N/A'}`),
                client: quote.client?.name || t('dashboard.taskList.taskLabels.client', 'Client'),
                priority: daysSinceAccepted > 3 ? 'high' : 'medium',
                amount: parseFloat(quote.final_amount || quote.total_amount || 0),
                dueDate: quote.accepted_at,
                action: t('dashboard.taskList.taskLabels.createInvoice', 'Create invoice'),
                daysSinceAccepted,
                quoteNumber: quote.quote_number,
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
