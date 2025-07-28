import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const InvoiceOverviewWidget = () => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Mock data for the widget
  const invoiceData = {
    clientInvoices: {
      totalRevenue: 16900.00,
      paidRevenue: 9450.00,
      outstandingAmount: 7450.00,
      overdueCount: 2,
      recentCount: 8
    },
    supplierInvoices: {
      totalExpenses: 4370.00,
      paidExpenses: 1810.00,
      outstandingAmount: 2560.00,
      overdueCount: 2,
      recentCount: 8
    }
  };

  const netCashFlow = invoiceData.clientInvoices.paidRevenue - invoiceData.supplierInvoices.paidExpenses;

  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon name="Receipt" size={16} className="sm:w-5 sm:h-5 text-blue-600" />
          </div>
        <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">Vue d'ensemble des factures</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Suivi de vos entrées et sorties de trésorerie</p>
          </div>
        </div>
        <div className="flex flex-row space-x-2">
          <Button
            variant="outline"
            size="xs"
            iconName="Receipt"
            iconPosition="left"
            onClick={() => navigate('/invoices-management')}
            className="text-xs h-8 sm:h-9"
          >
            <span className="hidden sm:inline">Factures clients</span>
            <span className="sm:hidden">Clients</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            iconName="Truck"
            iconPosition="left"
            onClick={() => navigate('/supplier-invoices')}
            className="text-xs h-8 sm:h-9"
          >
            <span className="hidden sm:inline">Factures fournisseurs</span>
            <span className="sm:hidden">Fournisseurs</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Client Invoices Summary */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon name="Receipt" size={16} className="sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">Factures clients</h4>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Revenus totaux</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {formatCurrency(invoiceData.clientInvoices.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Revenus encaissés</span>
              <span className="text-xs sm:text-sm font-medium text-success">
                {formatCurrency(invoiceData.clientInvoices.paidRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">En attente</span>
              <span className="text-xs sm:text-sm font-medium text-warning">
                {formatCurrency(invoiceData.clientInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">En retard</span>
              <span className="text-xs sm:text-sm font-medium text-error">
                {invoiceData.clientInvoices.overdueCount} facture(s)
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Invoices Summary */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg flex items-center justify-center">
              <Icon name="Truck" size={16} className="sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">Factures fournisseurs</h4>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Dépenses totales</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {formatCurrency(invoiceData.supplierInvoices.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Dépenses payées</span>
              <span className="text-xs sm:text-sm font-medium text-success">
                {formatCurrency(invoiceData.supplierInvoices.paidExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">En attente</span>
              <span className="text-xs sm:text-sm font-medium text-warning">
                {formatCurrency(invoiceData.supplierInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">En retard</span>
              <span className="text-xs sm:text-sm font-medium text-error">
                {invoiceData.supplierInvoices.overdueCount} facture(s)
              </span>
            </div>
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 sm:p-2 rounded-lg flex items-center justify-center ${netCashFlow >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Icon 
                name={netCashFlow >= 0 ? "TrendingUp" : "TrendingDown"} 
                size={16} 
                className={`sm:w-5 sm:h-5 ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`} 
              />
            </div>
            <h4 className="font-medium text-foreground text-sm sm:text-base">Flux de trésorerie</h4>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Net du mois</span>
              <span className={`text-xs sm:text-sm font-bold ${netCashFlow >= 0 ? 'text-success' : 'text-error'}`}>
                {formatCurrency(netCashFlow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Taux d'encaissement</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {Math.round((invoiceData.clientInvoices.paidRevenue / invoiceData.clientInvoices.totalRevenue) * 100)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Taux de paiement</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {Math.round((invoiceData.supplierInvoices.paidExpenses / invoiceData.supplierInvoices.totalExpenses) * 100)}%
              </span>
              </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm text-muted-foreground">Solde disponible</span>
              <span className="text-xs sm:text-sm font-medium text-foreground">
                {formatCurrency(netCashFlow)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-4 text-xs sm:text-sm text-muted-foreground">
            <span>Dernière mise à jour: {new Date().toLocaleDateString('fr-FR')}</span>
            <span>•</span>
            <span>{invoiceData.clientInvoices.recentCount + invoiceData.supplierInvoices.recentCount} factures récentes</span>
          </div>
          <div className="flex space-x-2 justify-end">
          <Button
            variant="outline"
              size="xs"
            iconName="Plus"
            iconPosition="left"
            onClick={() => navigate('/invoices-management')}
              className="text-xs h-8 sm:h-9"
          >
              <span className="hidden sm:inline">Nouvelle facture</span>
              <span className="sm:hidden">Nouvelle</span>
          </Button>
          <Button
              variant="default"
              size="xs"
            iconName="BarChart3"
            iconPosition="left"
            onClick={() => navigate('/analytics-dashboard')}
              className="text-xs h-8 sm:h-9"
          >
              <span className="hidden sm:inline">Voir analyses</span>
              <span className="sm:hidden">Analyses</span>
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceOverviewWidget; 