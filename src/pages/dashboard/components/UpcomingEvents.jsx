import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import TableLoader from '../../../components/ui/TableLoader';
import { supabase } from '../../../services/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { listScheduledFollowUps } from '../../../services/followUpService';

const UpcomingEvents = ({ loading: parentLoading = false }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
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

  const getDaysUntil = (dateString) => {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return Math.floor((date - today) / (1000 * 60 * 60 * 24));
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'quote_expiry': return 'FileText';
      case 'invoice_due': return 'Receipt';
      case 'follow_up': return 'Phone';
      default: return 'Calendar';
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'quote_expiry': return 'text-primary';
      case 'invoice_due': return 'text-warning';
      case 'follow_up': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getEventBg = (type) => {
    switch (type) {
      case 'quote_expiry': return 'bg-primary/10';
      case 'invoice_due': return 'bg-warning/10';
      case 'follow_up': return 'bg-success/10';
      default: return 'bg-muted/30';
    }
  };

  useEffect(() => {
    const loadEvents = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // Prevent reloading if data was already loaded for this user
      if (hasLoadedData.current) return;

      try {
        hasLoadedData.current = true;
        setLoading(true);
        const allEvents = [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999);

        // 1. Get upcoming quote expiry dates (valid_until)
        const { data: upcomingQuotes } = await supabase
          .from('quotes')
          .select(`
            id,
            quote_number,
            valid_until,
            client:clients(id, name)
          `)
          .eq('user_id', user.id)
          .in('status', ['sent', 'viewed', 'draft'])
          .not('valid_until', 'is', null)
          .gte('valid_until', today.toISOString().split('T')[0])
          .lte('valid_until', thirtyDaysFromNow.toISOString().split('T')[0])
          .order('valid_until', { ascending: true })
          .limit(10);

        if (upcomingQuotes) {
          upcomingQuotes.forEach(quote => {
            const daysUntil = getDaysUntil(quote.valid_until);
            if (daysUntil >= 0) {
              allEvents.push({
                id: `quote-expiry-${quote.id}`,
                type: 'quote_expiry',
                title: t('dashboard.upcomingEvents.types.quoteExpiry', { number: quote.quote_number || 'N/A' }),
                date: quote.valid_until,
                formattedDate: formatDate(quote.valid_until),
                daysUntil,
                client: quote.client?.name || 'Client',
                link: `/quotes-management?quote=${quote.id}`
              });
            }
          });
        }

        // 2. Get upcoming invoice due dates
        const { data: upcomingInvoices } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            due_date,
            status,
            client:clients(id, name)
          `)
          .eq('user_id', user.id)
          .neq('status', 'paid')
          .not('due_date', 'is', null)
          .gte('due_date', today.toISOString().split('T')[0])
          .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
          .order('due_date', { ascending: true })
          .limit(10);

        if (upcomingInvoices) {
          upcomingInvoices.forEach(invoice => {
            const daysUntil = getDaysUntil(invoice.due_date);
            if (daysUntil >= 0) {
              allEvents.push({
                id: `invoice-due-${invoice.id}`,
                type: 'invoice_due',
                title: t('dashboard.upcomingEvents.types.invoiceDue', { number: invoice.invoice_number || 'N/A' }),
                date: invoice.due_date,
                formattedDate: formatDate(invoice.due_date),
                daysUntil,
                client: invoice.client?.name || 'Client',
                link: `/invoices-management?invoice=${invoice.id}`
              });
            }
          });
        }

        // 3. Get scheduled follow-ups
        const { data: followUpsData } = await listScheduledFollowUps({ 
          status: 'pending', 
          limit: 20 
        });
        
        if (followUpsData?.data) {
          const quoteIds = followUpsData.data.map(f => f.quote_id).filter(Boolean);
          
          if (quoteIds.length > 0) {
            const { data: quotes } = await supabase
              .from('quotes')
              .select(`
                id,
                quote_number,
                client:clients(id, name)
              `)
              .in('id', quoteIds)
              .eq('user_id', user.id);

            if (quotes) {
              followUpsData.data.forEach(followUp => {
                const quote = quotes.find(q => q.id === followUp.quote_id);
                if (quote && followUp.scheduled_at) {
                  const scheduledDate = new Date(followUp.scheduled_at);
                  if (scheduledDate >= today && scheduledDate <= thirtyDaysFromNow) {
                    const daysUntil = getDaysUntil(followUp.scheduled_at);
                    if (daysUntil >= 0) {
                      allEvents.push({
                        id: `followup-${followUp.id}`,
                        type: 'follow_up',
                        title: t('dashboard.upcomingEvents.types.followUp', { number: quote.quote_number || 'N/A' }),
                        date: followUp.scheduled_at,
                        formattedDate: formatDate(followUp.scheduled_at),
                        daysUntil,
                        client: quote.client?.name || 'Client',
                        link: `/quotes-management?quote=${quote.id}`
                      });
                    }
                  }
                }
              });
            }
          }
        }

        // Sort events by date (soonest first)
        allEvents.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });

        // Limit to top 10 upcoming events
        setEvents(allEvents.slice(0, 10));
      } catch (error) {
        console.error('Error loading upcoming events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    // Reset the flag when user.id changes
    if (user?.id) {
      hasLoadedData.current = false;
      loadEvents();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const handleEventClick = (event) => {
    if (event.link) {
      navigate(event.link);
    }
  };

  const getDaysUntilText = (daysUntil) => {
    if (daysUntil === 0) {
      return t('dashboard.upcomingEvents.today', 'Today');
    } else if (daysUntil === 1) {
      return t('dashboard.upcomingEvents.tomorrow', 'Tomorrow');
    } else if (daysUntil > 0) {
      return t('dashboard.upcomingEvents.daysUntil', { count: daysUntil }, `In ${daysUntil} days`);
    }
    return '';
  };

  if (parentLoading || loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <TableLoader message={t('dashboard.upcomingEvents.loading', 'Chargement des événements...')} />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.upcomingEvents.title')}</h3>
        </div>
        <div className="text-center py-8">
          <Icon name="Calendar" size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">{t('dashboard.upcomingEvents.noEvents')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6 shadow-professional">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('dashboard.upcomingEvents.title')}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/quotes-follow-up')}
        >
          {t('dashboard.upcomingEvents.viewAll')}
        </Button>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {events.map((event) => (
          <div 
            key={event.id} 
            className="flex items-center space-x-3 sm:space-x-4 p-2.5 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150 cursor-pointer"
            onClick={() => handleEventClick(event)}
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getEventBg(event.type)}`}>
              <Icon 
                name={getEventIcon(event.type)} 
                size={16} 
                className={`sm:w-5 sm:h-5 ${getEventColor(event.type)}`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-muted-foreground">{event.formattedDate}</p>
                {event.daysUntil !== undefined && (
                  <span className={`text-xs font-medium ${
                    event.daysUntil === 0 ? 'text-error' : 
                    event.daysUntil <= 3 ? 'text-warning' : 
                    'text-muted-foreground'
                  }`}>
                    • {getDaysUntilText(event.daysUntil)}
                  </span>
                )}
              </div>
              {event.client && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.client}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;
