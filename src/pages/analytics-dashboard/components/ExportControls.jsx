import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Button from '../../../components/ui/Button';

const ExportControls = ({ analyticsData, kpiData, detailedAnalyticsData, revenueData, conversionData, clientSegmentData }) => {
  const { t, i18n } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (amount) => {
    const locale = i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    const locale = i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR';
    return new Date(date).toLocaleDateString(locale);
  };

  const generateAnalyticsHTML = () => {
    const currentDate = new Date().toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR');
    
    return `
      <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif; background: white; padding: 40px;">
        <!-- Header -->
        <div style="border-bottom: 3px solid #374151; padding-bottom: 20px; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; color: #374151; font-weight: bold;">${t('analyticsDashboard.header.title')}</h1>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${t('analyticsDashboard.header.subtitle')}</p>
          <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">${t('analyticsDashboard.export.date')}: ${currentDate}</p>
        </div>

        <!-- KPIs Section -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.export.kpis')}
          </h2>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            ${kpiData.map(kpi => `
              <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; background: #f9fafb;">
                <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">${kpi.title}</div>
                <div style="font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 8px;">${kpi.value}</div>
                <div style="color: ${kpi.trend === 'up' ? '#10b981' : '#ef4444'}; font-size: 14px; font-weight: 600;">
                  ${kpi.change} • ${kpi.description}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Payment Status -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.detailedAnalytics.paymentStatus.title')}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.status')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.count')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.paymentStatus.paid')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.paymentStatus.paid}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.paymentStatus.pending')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.paymentStatus.pending}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.paymentStatus.overdue')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.paymentStatus.overdue}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Client Activity -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.detailedAnalytics.clientActivity.title')}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.type')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.count')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.clientActivity.newClients')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.clientActivity.newClients}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.clientActivity.returningClients')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.clientActivity.returningClients}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.clientActivity.inactiveClients')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.clientActivity.inactiveClients}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Invoice Statistics -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.title')}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.metric')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.value')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.totalRevenue')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${formatCurrency(detailedAnalyticsData.invoiceStatistics.totalRevenue)}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.averageInvoice')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${formatCurrency(detailedAnalyticsData.invoiceStatistics.averageInvoice)}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.totalInvoices')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.invoiceStatistics.totalInvoices}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Quote Overview -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.detailedAnalytics.quoteOverview.title')}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.status')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.count')}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.quoteOverview.totalQuotes')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.quoteOverview.totalQuotes}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.quoteOverview.acceptedQuotes')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.quoteOverview.acceptedQuotes}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.quoteOverview.rejectedQuotes')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.quoteOverview.rejectedQuotes}</td>
              </tr>
              <tr style="background: #f9fafb;">
                <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${t('analyticsDashboard.detailedAnalytics.quoteOverview.pendingQuotes')}</td>
                <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${detailedAnalyticsData.quoteOverview.pendingQuotes}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Revenue by Month -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.export.revenueByMonth')}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.month')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              ${revenueData.map((month, index) => `
                <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${month.month}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${formatCurrency(month.revenue || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Conversion by Category -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.export.conversionByCategory')}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.category')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.charts.conversion.rate')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.charts.conversion.quotes')}</th>
              </tr>
            </thead>
            <tbody>
              ${conversionData.map((item, index) => `
                <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${item.name}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${item.rate}%</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${item.count}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Client Segments -->
        <div style="margin-bottom: 40px;">
          <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            ${t('analyticsDashboard.charts.clientSegments.title')}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.segment')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.percentage')}</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #374151; font-weight: 600;">${t('analyticsDashboard.export.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              ${clientSegmentData.map((segment, index) => `
                <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : ''}">
                  <td style="padding: 12px; border: 1px solid #e5e7eb; color: #1f2937;">${segment.name}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${segment.value}%</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${formatCurrency(segment.revenue)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">${t('analyticsDashboard.export.generatedBy')} Haliqo • ${currentDate}</p>
        </div>
      </div>
    `;
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    try {
      // Create temporary div with HTML content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '0';
      tempDiv.innerHTML = generateAnalyticsHTML();
      document.body.appendChild(tempDiv);
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create PDF with A4 size
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Convert HTML element to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: tempDiv.offsetWidth,
        height: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: tempDiv.offsetWidth
      });
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      // Calculate dimensions
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `analytics-report-${dateStr}.pdf`;
      
      // Save PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Export error:', error);
      alert(t('analyticsDashboard.export.pdfError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    
    try {
      const currentDate = new Date().toLocaleDateString(i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'en' ? 'en-US' : 'fr-FR');
      
      // Create CSV content with translations
      let csvContent = `${t('analyticsDashboard.header.title')},${currentDate}\n\n`;
      
      // KPIs
      csvContent += `${t('analyticsDashboard.export.kpis')}\n`;
      csvContent += `${t('analyticsDashboard.export.title')},${t('analyticsDashboard.export.value')},${t('analyticsDashboard.export.change')},${t('analyticsDashboard.export.description')}\n`;
      kpiData.forEach(kpi => {
        csvContent += `"${kpi.title}","${kpi.value}","${kpi.change}","${kpi.description}"\n`;
      });
      
      csvContent += `\n${t('analyticsDashboard.detailedAnalytics.paymentStatus.title')}\n`;
      csvContent += `${t('analyticsDashboard.export.status')},${t('analyticsDashboard.export.count')}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.paymentStatus.paid')},${detailedAnalyticsData.paymentStatus.paid}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.paymentStatus.pending')},${detailedAnalyticsData.paymentStatus.pending}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.paymentStatus.overdue')},${detailedAnalyticsData.paymentStatus.overdue}\n`;
      
      csvContent += `\n${t('analyticsDashboard.detailedAnalytics.clientActivity.title')}\n`;
      csvContent += `${t('analyticsDashboard.export.type')},${t('analyticsDashboard.export.count')}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.clientActivity.newClients')},${detailedAnalyticsData.clientActivity.newClients}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.clientActivity.returningClients')},${detailedAnalyticsData.clientActivity.returningClients}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.clientActivity.inactiveClients')},${detailedAnalyticsData.clientActivity.inactiveClients}\n`;
      
      csvContent += `\n${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.title')}\n`;
      csvContent += `${t('analyticsDashboard.export.metric')},${t('analyticsDashboard.export.value')}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.totalRevenue')},${detailedAnalyticsData.invoiceStatistics.totalRevenue}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.averageInvoice')},${detailedAnalyticsData.invoiceStatistics.averageInvoice}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.invoiceStatistics.totalInvoices')},${detailedAnalyticsData.invoiceStatistics.totalInvoices}\n`;
      
      csvContent += `\n${t('analyticsDashboard.detailedAnalytics.quoteOverview.title')}\n`;
      csvContent += `${t('analyticsDashboard.export.status')},${t('analyticsDashboard.export.count')}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.quoteOverview.totalQuotes')},${detailedAnalyticsData.quoteOverview.totalQuotes}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.quoteOverview.acceptedQuotes')},${detailedAnalyticsData.quoteOverview.acceptedQuotes}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.quoteOverview.rejectedQuotes')},${detailedAnalyticsData.quoteOverview.rejectedQuotes}\n`;
      csvContent += `${t('analyticsDashboard.detailedAnalytics.quoteOverview.pendingQuotes')},${detailedAnalyticsData.quoteOverview.pendingQuotes}\n`;
      
      csvContent += `\n${t('analyticsDashboard.export.revenueByMonth')}\n`;
      csvContent += `${t('analyticsDashboard.export.month')},${t('analyticsDashboard.export.revenue')}\n`;
      revenueData.forEach(month => {
        csvContent += `"${month.month}",${month.revenue || 0}\n`;
      });
      
      csvContent += `\n${t('analyticsDashboard.export.conversionByCategory')}\n`;
      csvContent += `${t('analyticsDashboard.export.category')},${t('analyticsDashboard.charts.conversion.rate')},${t('analyticsDashboard.charts.conversion.quotes')}\n`;
      conversionData.forEach(item => {
        csvContent += `"${item.name}",${item.rate},${item.count}\n`;
      });
      
      csvContent += `\n${t('analyticsDashboard.charts.clientSegments.title')}\n`;
      csvContent += `${t('analyticsDashboard.export.segment')},${t('analyticsDashboard.export.percentage')},${t('analyticsDashboard.export.revenue')}\n`;
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
      alert(t('analyticsDashboard.export.excelError'));
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