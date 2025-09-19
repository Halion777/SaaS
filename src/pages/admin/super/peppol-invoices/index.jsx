import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Eye, Download, Search, Filter, RefreshCw } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import TableLoader from '../../../../components/ui/TableLoader';
import Icon from '../../../../components/AppIcon';
import PeppolService from '../../../../services/peppolService';

const PeppolInvoices = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sidebarOffset, setSidebarOffset] = useState(0);

  const peppolService = new PeppolService(true); // Use test environment

  useEffect(() => {
    loadInvoices();
    
    // Handle sidebar toggle
    const handleSidebarToggle = () => {
      const isCollapsed = localStorage.getItem('superadmin-sidebar-collapsed') === 'true';
      setSidebarOffset(isCollapsed ? 80 : 280);
    };

    // Set initial sidebar state
    const isCollapsed = localStorage.getItem('superadmin-sidebar-collapsed') === 'true';
    setSidebarOffset(isCollapsed ? 80 : 280);

    // Listen for sidebar toggle events
    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await peppolService.getPeppolInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      // Convert to Peppol format and send
      const peppolData = peppolService.convertHaliqoInvoiceToPeppol(
        invoice,
        invoice.sender,
        invoice.receiver
      );
      
      await peppolService.sendInvoice(peppolData);
      await loadInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const handleViewInvoice = (invoice) => {
    // Open invoice details modal or page
    console.log('View invoice:', invoice);
  };

  const handleDownloadUBL = (invoice) => {
    if (invoice.ubl_document) {
      const blob = new Blob([invoice.ubl_document], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.sender?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.receiver?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    const matchesType = filterType === 'all' || invoice.document_type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'received': return 'text-green-600 bg-green-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'accepted': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'mlr_received': return 'text-purple-600 bg-purple-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'invoice': return 'text-blue-600 bg-blue-100';
      case 'credit_note': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAmount = (amount, currency = 'EUR') => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div 
        className="flex-1 transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${sidebarOffset}px` }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('peppol.invoices.title')}</h1>
                <p className="text-gray-600 mt-1">{t('peppol.invoices.subtitle')}</p>
              </div>
              <Button onClick={loadInvoices} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {t('common.refresh')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder={t('peppol.invoices.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">{t('peppol.invoices.allStatuses')}</option>
                  <option value="pending">{t('peppol.invoices.pending')}</option>
                  <option value="sent">{t('peppol.invoices.sent')}</option>
                  <option value="received">{t('peppol.invoices.received')}</option>
                  <option value="delivered">{t('peppol.invoices.delivered')}</option>
                  <option value="accepted">{t('peppol.invoices.accepted')}</option>
                  <option value="rejected">{t('peppol.invoices.rejected')}</option>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">{t('peppol.invoices.allTypes')}</option>
                  <option value="invoice">{t('peppol.invoices.invoice')}</option>
                  <option value="credit_note">{t('peppol.invoices.creditNote')}</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {loading ? (
              <div className="p-8">
                <TableLoader />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.invoices.invoiceNumber')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.invoices.sender')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.invoices.receiver')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.invoices.amount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.invoices.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.invoices.status')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('peppol.invoices.createdAt')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          {t('peppol.invoices.noInvoices')}
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {invoice.invoice_number}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.peppol_message_id ? `ID: ${invoice.peppol_message_id}` : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {invoice.sender?.name || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.sender?.peppol_identifier || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {invoice.receiver?.name || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.receiver?.peppol_identifier || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatAmount(invoice.total_amount, invoice.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(invoice.document_type)}`}>
                              {t(`peppol.invoices.${invoice.document_type}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                              {t(`peppol.invoices.${invoice.status}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {invoice.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendInvoice(invoice)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewInvoice(invoice)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {invoice.ubl_document && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadUBL(invoice)}
                                  className="text-purple-600 hover:text-purple-900"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeppolInvoices;
