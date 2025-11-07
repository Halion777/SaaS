import React, { useState } from 'react';
import Button from '../../../components/ui/Button';

const ExportControls = ({ analyticsData, kpiData, detailedAnalyticsData, revenueData, conversionData, clientSegmentData }) => {
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Rapport d'Analyses - ${new Date().toLocaleDateString('fr-FR')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .kpi-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            .kpi-value { font-size: 24px; font-weight: bold; color: #333; }
            .kpi-label { color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Rapport d'Analyses Détaillées</h1>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          
          <h2>Indicateurs Clés de Performance</h2>
          <div class="kpi-grid">
            ${kpiData.map(kpi => `
              <div class="kpi-card">
                <div class="kpi-label">${kpi.title}</div>
                <div class="kpi-value">${kpi.value}</div>
                <div style="color: ${kpi.trend === 'up' ? '#10b981' : '#ef4444'}; margin-top: 5px;">
                  ${kpi.change} ${kpi.description}
                </div>
              </div>
            `).join('')}
          </div>

          <h2>Statut des Paiements</h2>
          <table>
            <tr><th>Statut</th><th>Nombre</th></tr>
            <tr><td>Payées</td><td>${detailedAnalyticsData.paymentStatus.paid}</td></tr>
            <tr><td>En attente</td><td>${detailedAnalyticsData.paymentStatus.pending}</td></tr>
            <tr><td>En retard</td><td>${detailedAnalyticsData.paymentStatus.overdue}</td></tr>
          </table>

          <h2>Activité Clients</h2>
          <table>
            <tr><th>Type</th><th>Nombre</th></tr>
            <tr><td>Nouveaux clients (ce mois)</td><td>${detailedAnalyticsData.clientActivity.newClients}</td></tr>
            <tr><td>Clients récurrents</td><td>${detailedAnalyticsData.clientActivity.returningClients}</td></tr>
            <tr><td>Clients inactifs</td><td>${detailedAnalyticsData.clientActivity.inactiveClients}</td></tr>
          </table>

          <h2>Statistiques Factures</h2>
          <table>
            <tr><th>Métrique</th><th>Valeur</th></tr>
            <tr><td>Revenu total</td><td>${formatCurrency(detailedAnalyticsData.invoiceStatistics.totalRevenue)}</td></tr>
            <tr><td>Moyenne par facture</td><td>${formatCurrency(detailedAnalyticsData.invoiceStatistics.averageInvoice)}</td></tr>
            <tr><td>Total factures</td><td>${detailedAnalyticsData.invoiceStatistics.totalInvoices}</td></tr>
          </table>

          <h2>Vue d'ensemble des Devis</h2>
          <table>
            <tr><th>Statut</th><th>Nombre</th></tr>
            <tr><td>Total devis</td><td>${detailedAnalyticsData.quoteOverview.totalQuotes}</td></tr>
            <tr><td>Devis acceptés</td><td>${detailedAnalyticsData.quoteOverview.acceptedQuotes}</td></tr>
            <tr><td>Devis rejetés</td><td>${detailedAnalyticsData.quoteOverview.rejectedQuotes}</td></tr>
            <tr><td>Devis en attente</td><td>${detailedAnalyticsData.quoteOverview.pendingQuotes}</td></tr>
          </table>

          <h2>Revenus par Mois</h2>
          <table>
            <tr><th>Mois</th><th>Revenu</th></tr>
            ${revenueData.map(month => `
              <tr>
                <td>${month.month}</td>
                <td>${formatCurrency(month.revenue || 0)}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Taux de Conversion par Catégorie</h2>
          <table>
            <tr><th>Catégorie</th><th>Taux</th><th>Nombre de devis</th></tr>
            ${conversionData.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.rate}%</td>
                <td>${item.count}</td>
              </tr>
            `).join('')}
          </table>

          <h2>Segments Clients</h2>
          <table>
            <tr><th>Segment</th><th>Pourcentage</th><th>Revenu</th></tr>
            ${clientSegmentData.map(segment => `
              <tr>
                <td>${segment.name}</td>
                <td>${segment.value}%</td>
                <td>${formatCurrency(segment.revenue)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `analytics-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    
    try {
      // Create CSV content
      let csvContent = 'Rapport d\'Analyses,' + new Date().toLocaleDateString('fr-FR') + '\n\n';
      
      // KPIs
      csvContent += 'Indicateurs Clés de Performance\n';
      csvContent += 'Titre,Valeur,Changement,Description\n';
      kpiData.forEach(kpi => {
        csvContent += `"${kpi.title}","${kpi.value}","${kpi.change}","${kpi.description}"\n`;
      });
      
      csvContent += '\nStatut des Paiements\n';
      csvContent += 'Statut,Nombre\n';
      csvContent += `Payées,${detailedAnalyticsData.paymentStatus.paid}\n`;
      csvContent += `En attente,${detailedAnalyticsData.paymentStatus.pending}\n`;
      csvContent += `En retard,${detailedAnalyticsData.paymentStatus.overdue}\n`;
      
      csvContent += '\nActivité Clients\n';
      csvContent += 'Type,Nombre\n';
      csvContent += `Nouveaux clients (ce mois),${detailedAnalyticsData.clientActivity.newClients}\n`;
      csvContent += `Clients récurrents,${detailedAnalyticsData.clientActivity.returningClients}\n`;
      csvContent += `Clients inactifs,${detailedAnalyticsData.clientActivity.inactiveClients}\n`;
      
      csvContent += '\nStatistiques Factures\n';
      csvContent += 'Métrique,Valeur\n';
      csvContent += `Revenu total,${detailedAnalyticsData.invoiceStatistics.totalRevenue}\n`;
      csvContent += `Moyenne par facture,${detailedAnalyticsData.invoiceStatistics.averageInvoice}\n`;
      csvContent += `Total factures,${detailedAnalyticsData.invoiceStatistics.totalInvoices}\n`;
      
      csvContent += '\nVue d\'ensemble des Devis\n';
      csvContent += 'Statut,Nombre\n';
      csvContent += `Total devis,${detailedAnalyticsData.quoteOverview.totalQuotes}\n`;
      csvContent += `Devis acceptés,${detailedAnalyticsData.quoteOverview.acceptedQuotes}\n`;
      csvContent += `Devis rejetés,${detailedAnalyticsData.quoteOverview.rejectedQuotes}\n`;
      csvContent += `Devis en attente,${detailedAnalyticsData.quoteOverview.pendingQuotes}\n`;
      
      csvContent += '\nRevenus par Mois\n';
      csvContent += 'Mois,Revenu\n';
      revenueData.forEach(month => {
        csvContent += `"${month.month}",${month.revenue || 0}\n`;
      });
      
      csvContent += '\nTaux de Conversion par Catégorie\n';
      csvContent += 'Catégorie,Taux,Nombre de devis\n';
      conversionData.forEach(item => {
        csvContent += `"${item.name}",${item.rate},${item.count}\n`;
      });
      
      csvContent += '\nSegments Clients\n';
      csvContent += 'Segment,Pourcentage,Revenu\n';
      clientSegmentData.forEach(segment => {
        csvContent += `"${segment.name}",${segment.value},${segment.revenue}\n`;
      });
      
      // Create blob and download
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const element = document.createElement('a');
      element.href = url;
      element.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportExcel}
        disabled={isExporting}
        iconName={isExporting ? "Loader2" : "Download"}
        iconPosition="left"
        className={isExporting ? "animate-pulse" : ""}
      >
        <span className="hidden sm:inline">Excel</span>
      </Button>
      
      <Button
        variant="default"
        size="sm"
        onClick={handleExportPDF}
        disabled={isExporting}
        iconName={isExporting ? "Loader2" : "FileText"}
        iconPosition="left"
        className={isExporting ? "animate-pulse" : ""}
      >
        <span className="hidden sm:inline">
          {isExporting ? 'Export...' : 'PDF'}
        </span>
      </Button>
    </div>
  );
};

export default ExportControls;