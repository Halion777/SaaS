import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { calculateQuoteTotals, formatCurrency as formatQuoteCurrency } from '../utils/quotePriceCalculator';
import { formatCurrency, formatNumber } from '../utils/numberFormat';

/**
 * Clean quantity string to extract only the first number (handles cases like "1 11" -> 1, "10 11" -> 10)
 * @param {string|number} qty - Quantity value (string or number)
 * @returns {number} - Cleaned quantity as number
 */
const cleanQuantity = (qty) => {
  if (typeof qty === 'number') return qty;
  if (!qty) return 1;
  const str = String(qty).trim();
  // Extract first number from string (handles cases like "1 11" -> "1", "10 11" -> "10")
  const numberMatch = str.match(/^[-+]?(\d+(?:[.,]\d+)?)/);
  if (numberMatch) {
    const cleaned = numberMatch[1].replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 1 : parsed;
  }
  return 1;
};

/**
 * Format number with comma as decimal separator (European format)
 * Uses centralized utility for consistency
 * @param {number|string} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted number with comma as decimal separator (e.g., "123,45")
 */
const formatNumberWithComma = (num, decimals = 2) => {
  // Use centralized formatNumber utility and extract just the number part (remove currency symbol if present)
  const formatted = formatNumber(num, { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
  // formatNumber returns just the number, so we can use it directly
  return formatted;
};

/**
 * Generate PDF from quote preview
 * This approach ensures all data is visible while maintaining the same template
 * @param {Object} quoteData - Quote data including company info, client, tasks, etc.
 * @param {string} quoteNumber - Quote number
 * @param {HTMLElement} elementToCapture - Element to capture (quote preview container)
 * @returns {Promise<Blob>} PDF blob
 */
export const generateQuotePDF = async (quoteData, quoteNumber, elementToCapture) => {
  try {
    let target = elementToCapture;
    
    // If no element provided, create a temporary element with the quote preview
    if (!target) {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '900px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '0';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.innerHTML = generateQuoteHTML(quoteData, quoteNumber);
      document.body.appendChild(tempDiv);
      target = tempDiv;
    }
    
    // Clone the target element to avoid modifying the original
    const clonedTarget = target.cloneNode(true);
    clonedTarget.style.position = 'absolute';
    clonedTarget.style.left = '-9999px';
    clonedTarget.style.top = '0';
    document.body.appendChild(clonedTarget);
    
    // Find all scrollable elements within the cloned target
    const scrollableElements = clonedTarget.querySelectorAll('.overflow-x-auto, .overflow-y-auto, [style*="overflow"]');
    
    // Remove overflow properties to ensure all content is visible
    scrollableElements.forEach(element => {
      element.style.overflow = 'visible';
      element.style.overflowX = 'visible';
      element.style.overflowY = 'visible';
      element.style.maxHeight = 'none';
      element.style.maxWidth = 'none';
    });
    
    // Find all tables and ensure they're fully visible
    const tables = clonedTarget.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.tableLayout = 'auto';
    });
    
    // Create PDF with A4 size
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Convert HTML element to canvas
    const canvas = await html2canvas(clonedTarget, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: clonedTarget.offsetWidth,
      height: clonedTarget.scrollHeight, // Use full height including all content
      scrollX: 0,
      scrollY: 0,
      windowWidth: clonedTarget.offsetWidth
    });
    
    // Remove the cloned element
    document.body.removeChild(clonedTarget);
    
    // If we created a temp node, remove it now
    if (elementToCapture == null && target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
    
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
    const filename = `devis-${quoteNumber || 'N/A'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save PDF
    pdf.save(filename);
    
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Generate HTML content for the quote
 */
const generateQuoteHTML = (quoteData, quoteNumber) => {
  const { companyInfo, selectedClient, tasks, projectInfo, financialConfig, quote } = quoteData;
  
  // Detect language from localStorage
  const lang = (localStorage.getItem('language') || 'fr').toLowerCase();
  const paymentBeforeWorkLabel = lang.startsWith('en') ? 'PAYMENT BEFORE WORK:' : lang.startsWith('nl') ? 'BETALING VOOR WERK:' : 'PAIEMENT AVANT TRAVAUX:';
  const paymentAfterWorkLabel = lang.startsWith('en') ? 'PAYMENT AFTER WORK:' : lang.startsWith('nl') ? 'BETALING NA WERK:' : 'PAIEMENT APRÈS TRAVAUX:';
  
  // Use stored values from quote table if available (for quotes loaded from database)
  // Otherwise calculate from tasks (for quotes being created)
  let totalBeforeVAT, vatAmount, totalWithVAT, depositAmount, balanceAmount, depositWithVAT;
  
  if (quote && (quote.total_amount !== undefined || quote.deposit_amount !== undefined)) {
    // Use stored values from database for consistency
    totalBeforeVAT = parseFloat(quote.total_amount || 0);
    vatAmount = parseFloat(quote.tax_amount || 0);
    depositAmount = parseFloat(quote.deposit_amount || 0);
    balanceAmount = parseFloat(quote.balance_amount || 0);
    
    // depositAmount is stored EXCL VAT, calculate deposit WITH VAT
    const vatRate = totalBeforeVAT > 0 ? vatAmount / totalBeforeVAT : 0.21;
    depositWithVAT = depositAmount > 0 ? depositAmount * (1 + vatRate) : 0;
    
    // Calculate totalWithVAT from stored values
    totalWithVAT = balanceAmount > 0 && depositAmount > 0 
      ? balanceAmount + depositWithVAT 
      : totalBeforeVAT + vatAmount;
  } else {
    // Calculate from tasks (for quotes being created)
    const financialBreakdown = calculateQuoteTotals(tasks, financialConfig);
    totalBeforeVAT = financialBreakdown.totalBeforeVAT;
    vatAmount = financialBreakdown.vatAmount;
    totalWithVAT = financialBreakdown.totalWithVAT;
    depositAmount = financialBreakdown.depositAmount;
    balanceAmount = financialBreakdown.balanceAmount;
    
    // depositAmount is EXCL VAT, calculate deposit WITH VAT
    const vatRate = totalBeforeVAT > 0 ? vatAmount / totalBeforeVAT : 0.21;
    depositWithVAT = depositAmount > 0 ? depositAmount * (1 + vatRate) : 0;
  }
  
  const currentDate = new Date().toLocaleDateString('fr-FR');
  
  return `
    <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #374151; padding-bottom: 20px;">
        <div style="flex: 1;">
          <h1 style="margin: 0; font-size: 24px; color: #374151; font-weight: bold;">${companyInfo?.name || 'VOTRE ENTREPRISE'}</h1>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${companyInfo?.address || ''}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${companyInfo?.postalCode || ''} ${companyInfo?.city || ''}</p>
        </div>
        <div style="text-align: right; flex: 1;">
          <h2 style="margin: 0; font-size: 20px; color: #374151; font-weight: bold;">DEVIS</h2>
          <p style="margin: 10px 0; font-size: 18px; color: #1f2937; font-weight: bold;">${quoteNumber || 'N/A'}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Date: ${currentDate}</p>
        </div>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #374151; font-weight: bold;">CLIENT</h3>
        <p style="margin: 5px 0; font-weight: bold; color: #1f2937;">${selectedClient?.label?.split(' - ')[0] || selectedClient?.name || 'Client'}</p>
        <p style="margin: 5px 0; color: #6b7280;">${selectedClient?.email || 'email@client.com'}</p>
      </div>
      
      <div style="margin-bottom: 40px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #374151; font-weight: bold;">PRESTATIONS</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: left;">Description</th>
              <th style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(task => {
              const taskPrice = parseFloat(task.price || 0);
              const materialsTotal = (task.materials || []).reduce((sum, mat) => sum + parseFloat(mat.price || 0), 0);
              return `
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 12px;">${task.description || task.name || ''}</td>
                  <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">${formatCurrency(taskPrice + materialsTotal)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f3f4f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold;">SOUS-TOTAL HT:</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(totalBeforeVAT)}</td>
            </tr>
            ${financialConfig?.vatConfig?.display ? `
            <tr style="background-color: #f3f4f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold;">TVA (${financialConfig.vatConfig.rate}%):</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(vatAmount)}</td>
            </tr>
            ` : ''}
            <tr style="background-color: #e5e7eb;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold;">TOTAL TTC:</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold;">${formatCurrency(totalWithVAT)}</td>
            </tr>
            ${financialConfig?.advanceConfig?.enabled ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold; color: ${primaryColor}; text-transform: uppercase;">${paymentBeforeWorkLabel}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold; color: ${primaryColor};">${formatCurrency(depositWithVAT)}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold; color: ${primaryColor}; text-transform: uppercase;">${paymentAfterWorkLabel}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold; color: ${primaryColor};">${formatCurrency(balanceAmount)}</td>
            </tr>
            ` : ''}
          </tfoot>
        </table>
      </div>
    </div>
  `;
};

/**
 * Generate PDF from invoice data
 * @param {Object} invoiceData - Invoice data including company info, client, invoice details, etc.
 * @param {string} invoiceNumber - Invoice number
 * @param {HTMLElement} elementToCapture - Optional element to capture (invoice preview container)
 * @param {string} language - User's preferred language (fr, en, nl)
 * @returns {Promise<Blob>} PDF blob
 */
export const generateInvoicePDF = async (invoiceData, invoiceNumber, elementToCapture = null, language = 'fr', hideBankInfo = false, invoiceType = null, showWarning = false) => {
  try {
    let target = elementToCapture;
    
    // If no element provided, create a temporary element with the invoice preview
    if (!target) {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '900px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '0';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.innerHTML = generateInvoiceHTML(invoiceData, invoiceNumber, language, hideBankInfo, invoiceType, showWarning);
      document.body.appendChild(tempDiv);
      target = tempDiv;
    }
    
    // Clone the target element to avoid modifying the original
    const clonedTarget = target.cloneNode(true);
    clonedTarget.style.position = 'absolute';
    clonedTarget.style.left = '-9999px';
    clonedTarget.style.top = '0';
    document.body.appendChild(clonedTarget);
    
    // Find all scrollable elements within the cloned target
    const scrollableElements = clonedTarget.querySelectorAll('.overflow-x-auto, .overflow-y-auto, [style*="overflow"]');
    
    // Remove overflow properties to ensure all content is visible
    scrollableElements.forEach(element => {
      element.style.overflow = 'visible';
      element.style.overflowX = 'visible';
      element.style.overflowY = 'visible';
      element.style.maxHeight = 'none';
      element.style.maxWidth = 'none';
    });
    
    // Find all tables and ensure they're fully visible
    const tables = clonedTarget.querySelectorAll('table');
    tables.forEach(table => {
      table.style.width = '100%';
      table.style.tableLayout = 'auto';
    });
    
    // Create PDF with A4 size
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Convert HTML element to canvas
    const canvas = await html2canvas(clonedTarget, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: clonedTarget.offsetWidth,
      height: clonedTarget.scrollHeight, // Use full height including all content
      scrollX: 0,
      scrollY: 0,
      windowWidth: clonedTarget.offsetWidth
    });
    
    // Remove the cloned element
    document.body.removeChild(clonedTarget);
    
    // If we created a temp node, remove it now
    if (elementToCapture == null && target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
    
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
    
    // Return PDF blob (don't save to file, just return blob for attachment)
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  }
};

/**
 * Generate HTML content for the invoice (improved styling matching quote preview)
 */
const generateInvoiceHTML = (invoiceData, invoiceNumber, language = 'fr', hideBankInfo = false, invoiceType = null, showWarning = false) => {
  const { companyInfo, client, invoice, quote } = invoiceData;
  
  // Get invoice_type from parameter, invoice object, or peppol_metadata
  const finalInvoiceType = invoiceType || invoice.invoice_type || invoice.peppol_metadata?.invoice_type || 'final';
  const isDepositInvoice = finalInvoiceType === 'deposit';
  const isFinalInvoice = finalInvoiceType === 'final';
  
  // Color scheme matching quote preview
  const primaryColor = '#374151'; // Dark gray
  const secondaryColor = '#1f2937'; // Darker gray
  const primaryColorLight = `${primaryColor}20`; // 20% opacity for backgrounds
  
  // Get locale based on language
  const localeMap = { fr: 'fr-FR', en: 'en-US', nl: 'nl-NL' };
  const locale = localeMap[language] || 'fr-FR';
  
  const currentDate = invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString(locale) : new Date().toLocaleDateString(locale);
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString(locale) : '';
  
  // Translation labels based on language
  const labels = {
    fr: {
      invoice: 'FACTURE',
      depositInvoice: 'FACTURE D\'ACOMPTE',
      finalInvoice: 'FACTURE FINALE',
      client: 'CLIENT',
      company: 'ENTREPRISE',
      paymentInfo: 'INFORMATIONS DE PAIEMENT',
      services: 'DÉTAIL DES PRESTATIONS',
      subtotal: 'SOUS-TOTAL HT:',
      vat: 'TVA:',
      total: 'TOTAL TTC:',
      date: 'Date:',
      due: 'Échéance:',
      number: 'N°',
      designation: 'Désignation',
      qty: 'Qté',
      unitPrice: 'Prix U.',
      totalHT: 'Total HT',
      iban: 'IBAN:',
      account: 'Compte:',
      bank: 'Banque:',
      pdfWarning: 'ATTENTION: Ce document PDF est fourni uniquement à titre de référence. Pour les transactions officielles et la facturation électronique, veuillez toujours utiliser le document UBL Peppol, qui est le format légalement reconnu pour la facturation électronique.',
      pdfWarningTitle: 'Document de référence uniquement'
    },
    en: {
      invoice: 'INVOICE',
      depositInvoice: 'DEPOSIT INVOICE',
      finalInvoice: 'FINAL INVOICE',
      client: 'CLIENT',
      company: 'COMPANY',
      paymentInfo: 'PAYMENT INFORMATION',
      services: 'SERVICE DETAILS',
      subtotal: 'SUBTOTAL EXCL. VAT:',
      vat: 'VAT:',
      total: 'TOTAL INCL. VAT:',
      date: 'Date:',
      due: 'Due Date:',
      number: 'No.',
      designation: 'Description',
      qty: 'Qty',
      unitPrice: 'Unit Price',
      totalHT: 'Total Excl. VAT',
      iban: 'IBAN:',
      account: 'Account:',
      bank: 'Bank:',
      pdfWarning: 'WARNING: This PDF document is provided for reference purposes only. For official transactions and electronic invoicing, please always use the Peppol UBL document, which is the legally recognized format for electronic invoicing.',
      pdfWarningTitle: 'Reference document only'
    },
    nl: {
      invoice: 'FACTUUR',
      depositInvoice: 'AANBETALING FACTUUR',
      finalInvoice: 'EIND FACTUUR',
      client: 'KLANT',
      company: 'BEDRIJF',
      paymentInfo: 'BETALINGSINFORMATIE',
      services: 'DIENSTDETAILS',
      subtotal: 'SUBTOTAAL EXCL. BTW:',
      vat: 'BTW:',
      total: 'TOTAAL INCL. BTW:',
      date: 'Datum:',
      due: 'Vervaldatum:',
      number: 'Nr.',
      designation: 'Omschrijving',
      qty: 'Aantal',
      unitPrice: 'Prijs per eenheid',
      totalHT: 'Totaal Excl. BTW',
      iban: 'IBAN:',
      account: 'Rekening:',
      bank: 'Bank:',
      pdfWarning: 'WAARSCHUWING: Dit PDF-document is uitsluitend bedoeld als referentie. Voor officiële transacties en elektronische facturering gebruik altijd het Peppol UBL-document, dat het wettelijk erkende formaat is voor elektronische facturering.',
      pdfWarningTitle: 'Alleen referentiedocument'
    }
  };
  
  const t = labels[language] || labels.fr;
  
  // Get invoice lines - for deposit invoices, show simple "Deposit payment", for others show full breakdown
  let invoiceLines = [];
  
  // Get deposit amount early to use for deposit invoice line
  let depositAmountForLine = 0;
  if (quote && (quote.deposit_amount !== undefined || quote.balance_amount !== undefined)) {
    depositAmountForLine = parseFloat(quote.deposit_amount || 0); // This is EXCL VAT
  } else if (invoice.peppol_metadata && typeof invoice.peppol_metadata === 'object') {
    const metadata = invoice.peppol_metadata;
    depositAmountForLine = typeof metadata.deposit_amount === 'number' ? metadata.deposit_amount :
                          parseFloat(metadata.deposit_amount || 0); // This is EXCL VAT
  }
  
  if (isDepositInvoice) {
    // For deposit invoices: Show simple "Deposit payment" line
    const depositLabel = language === 'fr' ? 'Paiement d\'acompte' : 
                        language === 'nl' ? 'Aanbetaling' : 
                        'Deposit payment';
    invoiceLines = [{
      number: 1,
      description: depositLabel,
      quantity: 1,
      unit: '',
      unitPrice: depositAmountForLine,
      totalPrice: depositAmountForLine,
      materials: []
    }];
  } else if (quote && quote.quote_tasks && quote.quote_tasks.length > 0) {
    // For final/regular invoices: Show full task/material breakdown
    // Group materials by task_id
    const materialsByTaskId = {};
    if (quote.quote_materials && quote.quote_materials.length > 0) {
      quote.quote_materials.forEach((material) => {
        const taskId = material.quote_task_id;
        if (!materialsByTaskId[taskId]) {
          materialsByTaskId[taskId] = [];
        }
        // Helper to parse price value (handles both numbers and strings with commas)
        const parsePrice = (value) => {
          if (!value) return 0;
          if (typeof value === 'number') return value;
          // If string, replace comma with dot for parsing
          const cleaned = String(value).replace(',', '.');
          const parsed = parseFloat(cleaned);
          return isNaN(parsed) ? 0 : parsed;
        };
        
        materialsByTaskId[taskId].push({
          name: material.name || '',
          quantity: material.quantity || 1,
          unit: material.unit || 'piece',
          // unitPrice should equal totalPrice (users enter total prices, not unit prices)
          // This matches quote creation logic where price = unit_price (no multiplication)
          unitPrice: parsePrice(material.total_price || material.unit_price),
          totalPrice: parsePrice(material.total_price || material.unit_price)
        });
      });
    }
    
    // Build invoice lines with tasks and their materials
    quote.quote_tasks.forEach((task, taskIndex) => {
      const taskMaterials = materialsByTaskId[task.id] || [];
      const taskPrice = parseFloat(task.total_price || task.unit_price || 0);
      
      // Add task line - only show task price, materials are shown separately as sub-items
      invoiceLines.push({
        number: taskIndex + 1,
        description: task.description || task.name || '',
        quantity: task.quantity || 1,
        unit: task.unit || '',
        unitPrice: taskPrice,
        totalPrice: taskPrice, // Only task price, not including materials
        materials: taskMaterials // Store materials for sub-item display
      });
    });
  } else {
    // Single line from invoice summary
    invoiceLines = [{
      number: 1,
      description: invoice.description || invoice.title || 'Facture',
      quantity: 1,
      unit: '',
      unitPrice: parseFloat(invoice.amount || 0),
      totalPrice: parseFloat(invoice.amount || 0),
      materials: []
    }];
  }
  
  const subtotal = parseFloat(invoice.net_amount || invoice.amount || 0);
  const taxAmount = parseFloat(invoice.tax_amount || 0);
  const total = parseFloat(invoice.final_amount || invoice.amount || 0);
  
  // Extract deposit information directly from quote table or invoice peppol_metadata
  let depositAmount = 0;
  let depositWithVAT = 0; // Deposit WITH VAT (for display)
  let balanceAmount = total;
  let depositEnabled = false;
  let totalWithVAT = subtotal + taxAmount;
  let isDepositPaid = false; // Check if deposit invoice is paid (for final invoices)
  let vatRate = subtotal > 0 ? taxAmount / subtotal : 0.21; // Calculate VAT rate
  
  if (quote && (quote.deposit_amount !== undefined || quote.balance_amount !== undefined)) {
    // Get deposit info directly from quote table columns
    depositAmount = parseFloat(quote.deposit_amount || 0); // This is EXCL VAT
    balanceAmount = parseFloat(quote.balance_amount || total);
    depositEnabled = depositAmount > 0;
    
    // Calculate depositWithVAT (depositAmount is stored EXCL VAT)
    depositWithVAT = depositAmount > 0 ? depositAmount * (1 + vatRate) : 0;
    
    // Calculate totalWithVAT from stored values
    if (depositEnabled && balanceAmount > 0) {
      totalWithVAT = balanceAmount + depositWithVAT;
    } else {
      totalWithVAT = subtotal + taxAmount;
    }
    
    // Check if deposit invoice is paid (from invoiceData if provided)
    if (invoiceData.depositInvoiceStatus === 'paid' || invoice.deposit_invoice_status === 'paid') {
      isDepositPaid = true;
    }
  } else if (invoice.peppol_metadata && typeof invoice.peppol_metadata === 'object') {
    // Get deposit info from invoice's peppol_metadata (for converted invoices)
    // Deposit is enabled if deposit_amount > 0 (same logic as quotes table)
    const metadata = invoice.peppol_metadata;
    depositAmount = typeof metadata.deposit_amount === 'number' ? metadata.deposit_amount :
                    parseFloat(metadata.deposit_amount || 0); // This is EXCL VAT
    depositEnabled = depositAmount > 0; // Deposit is enabled if amount > 0
    
    if (depositEnabled) {
      // Calculate depositWithVAT (depositAmount is stored EXCL VAT)
      depositWithVAT = depositAmount > 0 ? depositAmount * (1 + vatRate) : 0;
      
      // Use EXACT balance_amount from metadata if available, otherwise use total
      balanceAmount = typeof metadata.balance_amount === 'number' ? metadata.balance_amount :
                      parseFloat(metadata.balance_amount || total);
      totalWithVAT = balanceAmount + depositWithVAT;
    }
    
    // Check deposit status from metadata or invoiceData
    if (metadata.deposit_invoice_status === 'paid' || invoiceData.depositInvoiceStatus === 'paid' || invoice.deposit_invoice_status === 'paid') {
      isDepositPaid = true;
    }
  }
  
  // Ensure depositAmount is a valid number for badge display
  // This handles cases where depositAmount might be NaN or undefined
  if (isNaN(depositAmount) || depositAmount === null || depositAmount === undefined) {
    depositAmount = 0;
  }
  depositAmount = Math.max(0, depositAmount); // Ensure non-negative
  
  // Helper to escape HTML
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  
  // Get logo URL if available
  let logoHtml = '';
  if (companyInfo?.logo) {
    if (companyInfo.logo.data) {
      // Base64 data
      logoHtml = `<img src="${companyInfo.logo.data}" alt="Logo ${companyInfo.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px;" />`;
    } else if (companyInfo.logo.url) {
      // Public URL
      logoHtml = `<img src="${companyInfo.logo.url}" alt="Logo ${companyInfo.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px;" />`;
    } else if (typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('http')) {
      // Direct URL
      logoHtml = `<img src="${companyInfo.logo}" alt="Logo ${companyInfo.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px;" />`;
    }
  }
  
  return `
    <div style="max-width: 900px; margin: 0 auto; font-family: 'Arial', 'Helvetica', sans-serif; background: #ffffff; padding: 30px; font-size: 11px;">
      <!-- Header with Logo and Invoice Info -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid ${primaryColor};">
        <div style="flex: 1; display: flex; align-items: center; gap: 15px;">
          ${logoHtml ? `<div style="flex-shrink: 0;">${logoHtml.replace('width: 80px; height: 80px;', 'width: 60px; height: 60px;')}</div>` : '<div style="width: 60px; height: 60px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 10px; font-weight: bold;">LOGO</div>'}
          <div>
            <h1 style="margin: 0; font-size: 20px; color: ${primaryColor}; font-weight: bold; line-height: 1.2;">${escapeHtml(companyInfo?.name || 'VOTRE ENTREPRISE')}</h1>
            <p style="margin: 3px 0 0 0; color: ${secondaryColor}; font-size: 11px; font-weight: 500;">Artisan professionnel</p>
          </div>
        </div>
        <div style="text-align: right; flex: 1;">
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: ${primaryColor}; font-weight: bold; letter-spacing: 1px;">${isDepositInvoice ? t.depositInvoice : (isFinalInvoice && depositEnabled ? t.finalInvoice : t.invoice)}</h2>
          <p style="margin: 5px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold;">${escapeHtml(invoiceNumber || 'N/A')}</p>
          <p style="margin: 3px 0; color: ${secondaryColor}; font-size: 11px;">${t.date} ${currentDate}</p>
          ${dueDate ? `<p style="margin: 3px 0; color: ${secondaryColor}; font-size: 11px;">${t.due} ${dueDate}</p>` : ''}
        </div>
      </div>
      
      <!-- Company and Client Information -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 12px 0; font-size: 12px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${t.client}</h3>
          <div style="color: ${secondaryColor}; font-size: 11px; line-height: 1.6;">
            <p style="margin: 0 0 5px 0; font-size: 12px;">${escapeHtml(client?.name || 'Client')}</p>
            ${client?.email ? `<p style="margin: 0 0 3px 0;">${escapeHtml(client.email)}</p>` : ''}
            ${client?.phone ? `<p style="margin: 0 0 3px 0;">${escapeHtml(client.phone)}</p>` : ''}
            ${client?.address ? `<p style="margin: 0 0 3px 0;">${escapeHtml(client.address)}</p>` : ''}
            ${client?.postal_code && client?.city ? `<p style="margin: 0;">${escapeHtml(client.postal_code)} ${escapeHtml(client.city)}</p>` : ''}
            ${(client?.client_type === 'company' || client?.client_type === 'professional') && client?.vat_number ? (() => {
              // Format VAT number with country prefix if not already present
              let formattedVAT = client.vat_number;
              if (formattedVAT && !formattedVAT.match(/^[A-Z]{2}\d+/i)) {
                // VAT number doesn't have correct country prefix format (2 letters + digits)
                // Remove all leading letters to get to the numeric part, handling malformed VATs correctly
                // Examples: "ABC123" -> "123", "B123" -> "123", "BE123" -> "123"
                const countryCode = (client?.country || 'BE').toUpperCase();
                const countryPrefix = countryCode === 'GR' ? 'EL' : countryCode;
                // Remove all leading letters (not just 2) to handle malformed VAT numbers
                const cleanVAT = formattedVAT.replace(/^[A-Z]+/i, '');
                formattedVAT = `${countryPrefix}${cleanVAT}`;
              }
              return `<p style="margin: 3px 0 0 0;">${language === 'en' ? 'VAT:' : language === 'nl' ? 'BTW:' : 'TVA:'} ${escapeHtml(formattedVAT)}</p>`;
            })() : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 12px 0; font-size: 12px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${t.company}</h3>
          <div style="color: ${secondaryColor}; font-size: 11px; line-height: 1.6;">
            <p style="margin: 0 0 3px 0; font-size: 12px;">${escapeHtml(companyInfo?.name || '')}</p>
            ${companyInfo?.email ? `<p style="margin: 0 0 3px 0;">${escapeHtml(companyInfo.email)}</p>` : ''}
            ${companyInfo?.phone ? `<p style="margin: 0 0 3px 0;">${escapeHtml(companyInfo.phone)}</p>` : ''}
            ${companyInfo?.address ? `<p style="margin: 0 0 3px 0;">${escapeHtml(companyInfo.address)}</p>` : ''}
            ${companyInfo?.postalCode && companyInfo?.city ? `<p style="margin: 0;">${escapeHtml(companyInfo.postalCode)} ${escapeHtml(companyInfo.city)}</p>` : ''}
            ${companyInfo?.vatNumber ? (() => {
              // Format VAT number with country prefix if not already present
              let formattedVAT = companyInfo.vatNumber;
              if (formattedVAT && !formattedVAT.match(/^[A-Z]{2}\d+/i)) {
                // VAT number doesn't have correct country prefix format (2 letters + digits)
                // Remove all leading letters to get to the numeric part, handling malformed VATs correctly
                const countryCode = (companyInfo?.country || 'BE').toUpperCase();
                const countryPrefix = countryCode === 'GR' ? 'EL' : countryCode;
                // Remove all leading letters (not just 2) to handle malformed VAT numbers
                const cleanVAT = formattedVAT.replace(/^[A-Z]+/i, '');
                formattedVAT = `${countryPrefix}${cleanVAT}`;
              }
              return `<p style="margin: 3px 0 0 0;">${language === 'en' ? 'VAT:' : language === 'nl' ? 'BTW:' : 'TVA:'} ${escapeHtml(formattedVAT)}</p>`;
            })() : ''}
          </div>
        </div>
      </div>
      
      <!-- Payment Information -->
      ${!hideBankInfo && (companyInfo?.iban || companyInfo?.accountName || companyInfo?.bankName) ? `
      <div style="margin-bottom: 30px; padding: 12px; background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 8px 0; font-size: 11px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${t.paymentInfo}</h3>
        <div style="color: ${secondaryColor}; font-size: 10px; line-height: 1.5;">
          ${companyInfo?.iban ? `<span style="font-weight: 500;">${t.iban}</span> ${escapeHtml(companyInfo.iban)}${companyInfo?.accountName || companyInfo?.bankName ? ' | ' : ''}` : ''}
          ${companyInfo?.accountName ? `<span style="font-weight: 500;">${t.account}</span> ${escapeHtml(companyInfo.accountName)}${companyInfo?.bankName ? ' | ' : ''}` : ''}
          ${companyInfo?.bankName ? `<span style="font-weight: 500;">${t.bank}</span> ${escapeHtml(companyInfo.bankName)}` : ''}
        </div>
      </div>
      ` : ''}
      
      <!-- Invoice Lines Table -->
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 12px 0; font-size: 12px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${t.services}</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; font-size: 10px;">
          <thead>
            <tr style="background-color: ${primaryColorLight};">
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; font-weight: bold; color: ${primaryColor}; font-size: 10px; text-transform: uppercase;">${t.number}</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: left; font-weight: bold; color: ${primaryColor}; font-size: 10px; text-transform: uppercase;">${t.designation}</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; font-weight: bold; color: ${primaryColor}; font-size: 10px; text-transform: uppercase;">${t.qty}</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px; text-transform: uppercase;">${t.unitPrice}</th>
              <th style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px; text-transform: uppercase;">${t.totalHT}</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceLines.map((line, index) => {
              const hasMaterials = line.materials && line.materials.length > 0;
              return `
              <tr style="${index % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #ffffff;'}">
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; color: ${secondaryColor}; font-size: 10px;">${line.number}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; color: ${secondaryColor}; font-size: 10px;">${escapeHtml(line.description)}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; color: ${secondaryColor}; font-size: 10px;">${hasMaterials ? '' : `${cleanQuantity(line.quantity)} ${escapeHtml(line.unit)}`}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; color: ${secondaryColor}; font-size: 10px; font-weight: 500;">${hasMaterials ? '' : `${formatCurrency(line.unitPrice)}`}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; color: ${secondaryColor}; font-size: 10px; font-weight: 500;">${formatCurrency(line.totalPrice)}</td>
              </tr>
              ${hasMaterials ? line.materials.map((mat, matIndex) => `
              <tr style="background-color: #f9fafb;">
                <td style="border: 1px solid #d1d5db; padding: 6px 6px 6px 20px; text-align: center; color: ${secondaryColor}; font-size: 9px;">${line.number}.${matIndex + 1}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px 6px 20px; color: ${secondaryColor}; font-size: 9px;">${escapeHtml(mat.name)}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: center; color: ${secondaryColor}; font-size: 9px;">${cleanQuantity(mat.quantity)} ${escapeHtml(mat.unit)}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: right; color: ${secondaryColor}; font-size: 9px; font-weight: 500;">${formatCurrency(mat.unitPrice)}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: right; color: ${secondaryColor}; font-size: 9px; font-weight: 500;">${formatCurrency(mat.totalPrice)}</td>
              </tr>
              `).join('') : ''}
            `;
            }).join('')}
          </tbody>
          <tfoot>
            ${depositEnabled && depositAmount > 0 ? `
            ${isDepositInvoice ? `
            <!-- Deposit Invoice: Payment info with breakdown -->
            <tr style="background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: #1e40af; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT AVANT TRAVAUX:' : language === 'en' ? 'PAYMENT BEFORE WORK:' : 'BETALING VOOR WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 14px;">${formatCurrency(depositWithVAT)}</td>
            </tr>
            <tr style="background-color: #dbeafe;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 10px; color: #1e40af;" colspan="4">${language === 'fr' ? 'HT:' : language === 'en' ? 'Excl. VAT:' : 'Excl. BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 10px; color: #1e40af;">${formatCurrency(depositAmount)}</td>
            </tr>
            <tr style="background-color: #dbeafe;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 10px; color: #1e40af;" colspan="4">${language === 'fr' ? 'TVA:' : language === 'en' ? 'VAT:' : 'BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 10px; color: #1e40af;">${formatCurrency(depositWithVAT - depositAmount)}</td>
            </tr>
            ` : isFinalInvoice ? `
            <!-- Final Invoice: Project totals first (subtotal, VAT, total), then remaining with breakdown, then paid deposit -->
            ${(() => {
              // Calculate project subtotal and VAT from totalWithVAT (full project total)
              const projectSubtotal = totalWithVAT / (1 + vatRate);
              const projectVAT = totalWithVAT - projectSubtotal;
              return `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.subtotal}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatCurrency(projectSubtotal)}</td>
            </tr>
            ${projectVAT > 0 ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.vat}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatCurrency(projectVAT)}</td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatCurrency(totalWithVAT)}</td>
            </tr>
            `;
            })()}
            <tr style="background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: #1e40af; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'RESTANT:' : language === 'en' ? 'REMAINING:' : 'RESTEREND:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 14px;">${formatCurrency(balanceAmount)}</td>
            </tr>
            <tr style="background-color: #dbeafe;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 10px; color: #1e40af;" colspan="4">${language === 'fr' ? 'HT:' : language === 'en' ? 'Excl. VAT:' : 'Excl. BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 10px; color: #1e40af;">${formatCurrency(balanceAmount / (1 + vatRate))}</td>
            </tr>
            <tr style="background-color: #dbeafe;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 10px; color: #1e40af;" colspan="4">${language === 'fr' ? 'TVA:' : language === 'en' ? 'VAT:' : 'BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 10px; color: #1e40af;">${formatCurrency(balanceAmount - (balanceAmount / (1 + vatRate)))}</td>
            </tr>
            <tr style="background-color: #f0fdf4; border-left: 4px solid #10b981;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: #065f46; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAYÉ:' : language === 'en' ? 'PAID:' : 'BETAALD:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: #065f46; font-size: 14px;">${formatCurrency(depositWithVAT)}</td>
            </tr>
            <tr style="background-color: #f0fdf4;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 10px; color: #065f46;" colspan="4">${language === 'fr' ? 'HT:' : language === 'en' ? 'Excl. VAT:' : 'Excl. BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 10px; color: #065f46;">${formatCurrency(depositAmount)}</td>
            </tr>
            <tr style="background-color: #f0fdf4;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 10px; color: #065f46;" colspan="4">${language === 'fr' ? 'TVA:' : language === 'en' ? 'VAT:' : 'BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 10px; color: #065f46;">${formatCurrency(depositWithVAT - depositAmount)}</td>
            </tr>
            ` : `
            <!-- No deposit/final distinction: Show project totals first (subtotal, VAT, total), then payment breakdowns -->
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.subtotal}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatCurrency(subtotal)}</td>
            </tr>
            ${taxAmount > 0 ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.vat}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatCurrency(taxAmount)}</td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatCurrency(totalWithVAT)}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 11px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT AVANT TRAVAUX:' : language === 'en' ? 'PAYMENT BEFORE WORK:' : 'BETALING VOOR WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 11px;">${formatCurrency(depositWithVAT)}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 9px; color: ${primaryColor};" colspan="4">${language === 'fr' ? 'HT:' : language === 'en' ? 'Excl. VAT:' : 'Excl. BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 9px; color: ${primaryColor};">${formatCurrency(depositAmount)}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 8px 6px 8px 20px; font-size: 9px; color: ${primaryColor};" colspan="4">${language === 'fr' ? 'TVA:' : language === 'en' ? 'VAT:' : 'BTW:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; font-size: 9px; color: ${primaryColor};">${formatCurrency(depositWithVAT - depositAmount)}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 11px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT APRÈS TRAVAUX:' : language === 'en' ? 'PAYMENT AFTER WORK:' : 'BETALING NA WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 11px;">${formatCurrency(balanceAmount)}</td>
            </tr>
            `}
            ` : `
            <!-- No deposit: Standard format with subtotal, VAT, total -->
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.subtotal}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatCurrency(subtotal)}</td>
            </tr>
            ${taxAmount > 0 ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.vat}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatCurrency(taxAmount)}</td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatCurrency(totalWithVAT)}</td>
            </tr>
            `}
          </tfoot>
        </table>
      </div>
      
      <!-- PDF Warning Notice - Only show for professional clients when explicitly requested (e.g., email attachments) -->
      ${showWarning && ((client?.client_type === 'company' || client?.client_type === 'professional' || client?.type === 'company' || client?.type === 'professional') && client?.client_type !== 'individual' && client?.type !== 'individual') ? `
      <div style="margin-top: 40px; padding: 15px; background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div style="flex-shrink: 0; color: #d97706; font-size: 16px; font-weight: bold;">⚠</div>
          <div style="flex: 1;">
            <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: bold; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">${t.pdfWarningTitle}</p>
            <p style="margin: 0; font-size: 10px; color: #78350f; line-height: 1.5;">${t.pdfWarning}</p>
          </div>
        </div>
      </div>
      ` : ''}
      
    </div>
  `;
};
