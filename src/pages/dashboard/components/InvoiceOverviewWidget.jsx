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
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Vue d'ensemble des factures</h3>
          <p className="text-sm text-muted-foreground">Suivi de vos entrées et sorties de trésorerie</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Receipt"
            iconPosition="left"
            onClick={() => navigate('/invoices-management')}
          >
            Factures clients
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="FileText"
            iconPosition="left"
            onClick={() => navigate('/supplier-invoices')}
          >
            Factures fournisseurs
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Invoices Summary */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon name="Receipt" size={16} color="var(--color-blue-600)" />
            </div>
            <h4 className="font-medium text-foreground">Factures clients</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenus totaux</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(invoiceData.clientInvoices.totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Revenus encaissés</span>
              <span className="text-sm font-medium text-success">
                {formatCurrency(invoiceData.clientInvoices.paidRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">En attente</span>
              <span className="text-sm font-medium text-warning">
                {formatCurrency(invoiceData.clientInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">En retard</span>
              <span className="text-sm font-medium text-error">
                {invoiceData.clientInvoices.overdueCount} facture(s)
              </span>
            </div>
          </div>
        </div>

        {/* Supplier Invoices Summary */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icon name="FileText" size={16} color="var(--color-orange-600)" />
            </div>
            <h4 className="font-medium text-foreground">Factures fournisseurs</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dépenses totales</span>
              <span className="text-sm font-medium text-foreground">
                {formatCurrency(invoiceData.supplierInvoices.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Dépenses payées</span>
              <span className="text-sm font-medium text-success">
                {formatCurrency(invoiceData.supplierInvoices.paidExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">À payer</span>
              <span className="text-sm font-medium text-warning">
                {formatCurrency(invoiceData.supplierInvoices.outstandingAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">En retard</span>
              <span className="text-sm font-medium text-error">
                {invoiceData.supplierInvoices.overdueCount} facture(s)
              </span>
            </div>
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icon name="TrendingUp" size={16} color="var(--color-green-600)" />
            </div>
            <h4 className="font-medium text-foreground">Trésorerie nette</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Flux net</span>
              <span className={`text-lg font-bold ${
                netCashFlow >= 0 ? 'text-success' : 'text-error'
              }`}>
                {formatCurrency(netCashFlow)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Marge brute</span>
              <span className="text-sm font-medium text-foreground">
                {((netCashFlow / invoiceData.clientInvoices.totalRevenue) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="pt-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-success h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.max(0, (netCashFlow / invoiceData.clientInvoices.totalRevenue) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-border">
        <h4 className="text-sm font-medium text-foreground mb-3">Actions rapides</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            onClick={() => navigate('/invoices-management')}
            className="justify-start"
          >
            Nouvelle facture
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Upload"
            iconPosition="left"
            onClick={() => navigate('/supplier-invoices')}
            className="justify-start"
          >
            Importer facture
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Send"
            iconPosition="left"
            onClick={() => navigate('/supplier-invoices')}
            className="justify-start"
          >
            Envoyer au comptable
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="BarChart3"
            iconPosition="left"
            onClick={() => navigate('/analytics-dashboard')}
            className="justify-start"
          >
            Voir analyses
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(invoiceData.clientInvoices.overdueCount > 0 || invoiceData.supplierInvoices.overdueCount > 0) && (
        <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertTriangle" size={16} color="var(--color-error)" />
            <span className="text-sm font-medium text-error">
              Attention : {invoiceData.clientInvoices.overdueCount + invoiceData.supplierInvoices.overdueCount} facture(s) en retard
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pensez à régler ces factures rapidement pour éviter les pénalités.
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceOverviewWidget; 