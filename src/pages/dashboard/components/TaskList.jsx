import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import TableLoader from '../../../components/ui/TableLoader';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { listScheduledFollowUps } from '../../../services/followUpService';

const TaskList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedData = useRef(false);

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

  useEffect(() => {
    const loadTasks = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Prevent reloading if data was already loaded for this user
      if (hasLoadedData.current) return;

      try {
        hasLoadedData.current = true;
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
            allTasks.push({
              id: `invoice-${invoice.id}`,
              type: 'invoice',
              title: `Facture ${invoice.invoice_number || 'N/A'} en retard`,
              client: invoice.client?.name || 'Client',
              priority: daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low',
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
            allTasks.push({
              id: `expense-invoice-${invoice.id}`,
              type: 'invoice',
              title: `Facture ${invoice.invoice_number || 'N/A'} en retard`,
              client: invoice.supplier_name || 'Fournisseur',
              priority: daysOverdue > 7 ? 'high' : daysOverdue > 3 ? 'medium' : 'low',
              dueDate: invoice.due_date,
              action: 'Voir la facture',
              amount: invoice.amount || 0,
              daysOverdue,
              link: `/expense-invoices?invoice=${invoice.id}`
            });
          });
        }

        // 3. Get pending follow-ups for quotes
        const { data: followUpsData } = await listScheduledFollowUps({ status: 'pending', limit: 50 });
        
        if (followUpsData?.data) {
          // Get quotes for these follow-ups
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
                  allTasks.push({
                    id: `followup-${followUp.id}`,
                    type: 'follow',
                    title: `Relance pour devis ${quote.quote_number || 'N/A'}`,
                    client: quote.client?.name || 'Client',
                    priority: daysSinceSent > 5 ? 'high' : daysSinceSent > 3 ? 'medium' : 'low',
                    dueDate: followUp.scheduled_at,
                    action: 'Planifier la relance',
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
          .in('status', ['sent', 'viewed'])
          .lt('sent_at', threeDaysAgo.toISOString());

        if (delayedQuotes) {
          delayedQuotes.forEach(quote => {
            const daysSinceSent = getDaysAgo(quote.sent_at);
            // Check if there's already a follow-up task for this quote
            const hasFollowUpTask = allTasks.some(t => t.id === `followup-${quote.id}` || (t.type === 'follow' && t.link?.includes(quote.id)));
            
            if (!hasFollowUpTask && daysSinceSent >= 3) {
              allTasks.push({
                id: `delayed-quote-${quote.id}`,
                type: 'send',
                title: `Devis ${quote.quote_number || 'N/A'} sans réponse`,
                client: quote.client?.name || 'Client',
                priority: daysSinceSent > 7 ? 'high' : 'medium',
                dueDate: quote.sent_at,
                action: 'Relancer le client',
                daysSinceSent,
                link: `/quotes-management?quote=${quote.id}`
              });
            }
          });
        }

        // 5. Get accepted quotes that need invoice creation
        const { data: allAcceptedQuotes } = await supabase
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

        // Filter quotes that don't have invoices
        if (allAcceptedQuotes && allAcceptedQuotes.length > 0) {
          const quoteIds = allAcceptedQuotes.map(q => q.id);
          const { data: quotesWithInvoices } = await supabase
            .from('invoices')
            .select('quote_id')
            .in('quote_id', quoteIds)
            .eq('user_id', user.id);

          const invoiceQuoteIds = new Set(quotesWithInvoices?.map(inv => inv.quote_id) || []);
          const acceptedQuotes = allAcceptedQuotes.filter(q => !invoiceQuoteIds.has(q.id));

          acceptedQuotes.forEach(quote => {
            const daysSinceAccepted = quote.accepted_at ? getDaysAgo(quote.accepted_at) : 0;
            allTasks.push({
              id: `invoice-creation-${quote.id}`,
              type: 'invoice',
              title: `Créer facture pour devis ${quote.quote_number || 'N/A'}`,
              client: quote.client?.name || 'Client',
              priority: daysSinceAccepted > 3 ? 'high' : 'medium',
              dueDate: quote.accepted_at,
              action: 'Créer la facture',
              daysSinceAccepted,
              link: `/quotes-management?quote=${quote.id}&action=convert`
            });
          });
        }

        // Sort tasks by priority (high first) and then by due date
        allTasks.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          const aDate = new Date(a.dueDate || 0);
          const bDate = new Date(b.dueDate || 0);
          return aDate - bDate;
        });

        setTasks(allTasks.slice(0, 10)); // Show top 10 tasks
      } catch (error) {
        console.error('Error loading tasks:', error);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    // Reset the flag when user.id changes
    if (user?.id) {
      hasLoadedData.current = false;
      loadTasks();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const getTaskIcon = (type) => {
    const icons = {
      finalize: 'Edit3',
      send: 'Send',
      follow: 'Phone',
      invoice: 'Receipt'
    };
    return icons[type] || 'CheckCircle';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-error',
      medium: 'text-warning',
      low: 'text-muted-foreground'
    };
    return colors[priority] || 'text-muted-foreground';
  };

  const getPriorityBg = (priority) => {
    const colors = {
      high: 'bg-error/10',
      medium: 'bg-warning/10',
      low: 'bg-muted/50'
    };
    return colors[priority] || 'bg-muted/50';
  };

  const handleTaskClick = (task) => {
    if (task.link) {
      navigate(task.link);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <TableLoader message="Chargement des tâches..." />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.taskList.title')}</h3>
          <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.taskList.tasksCount', { count: 0 })}</span>
        </div>
        <div className="text-center py-8">
          <Icon name="CheckCircle" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('dashboard.taskList.noTasks') || 'Aucune tâche en attente'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.taskList.title')}</h3>
        <span className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.taskList.tasksCount', { count: tasks.length })}</span>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150 cursor-pointer"
            onClick={() => handleTaskClick(task)}
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${getPriorityBg(task.priority)}`}>
              <Icon 
                name={getTaskIcon(task.type)} 
                size={14} 
                className={`sm:w-4 sm:h-4 ${getPriorityColor(task.priority)}`}
                color="currentColor"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
              <p className="text-xs text-muted-foreground">
                {task.client} • {task.action}
                {task.daysOverdue && ` • ${task.daysOverdue} jour${task.daysOverdue > 1 ? 's' : ''} de retard`}
                {task.daysSinceSent && ` • ${task.daysSinceSent} jour${task.daysSinceSent > 1 ? 's' : ''} sans réponse`}
              </p>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${getPriorityBg(task.priority)}`}></span>
              <Button variant="ghost" size="sm" className="p-1 sm:p-1.5">
                <Icon name="ChevronRight" size={14} className="sm:w-4 sm:h-4" color="currentColor" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <Button 
          variant="outline" 
          fullWidth 
          className="text-sm"
          onClick={() => navigate('/tasks')}
        >
          {t('dashboard.taskList.viewAllTasks')}
        </Button>
      </div>
    </div>
  );
};

export default TaskList;
