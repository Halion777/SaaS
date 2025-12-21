import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { calculateQuoteTotals, formatCurrency } from '../utils/quotePriceCalculator';

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
 * Handles both numbers and strings (with or without commas)
 * @param {number|string} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted number with comma as decimal separator (e.g., "123,45")
 */
const formatNumberWithComma = (num, decimals = 2) => {
  // Handle null, undefined, or empty values
  if (num === null || num === undefined || num === '') {
    return (0).toFixed(decimals).replace('.', ',');
  }
  
  // If it's already a string, clean it first (replace comma with dot for parsing)
  let cleanNum = num;
  if (typeof num === 'string') {
    // Replace comma with dot for parsing (European format -> US format)
    cleanNum = num.replace(',', '.');
  }
  
  // Parse to number
  const parsed = parseFloat(cleanNum);
  
  // Check if parsing was successful
  if (isNaN(parsed)) {
    return (0).toFixed(decimals).replace('.', ',');
  }
  
  // Format with specified decimals and replace dot with comma
  const fixed = parsed.toFixed(decimals);
  return fixed.replace('.', ',');
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
  let totalBeforeVAT, vatAmount, totalWithVAT, depositAmount, balanceAmount;
  
  if (quote && (quote.total_amount !== undefined || quote.deposit_amount !== undefined)) {
    // Use stored values from database for consistency
    totalBeforeVAT = parseFloat(quote.total_amount || 0);
    vatAmount = parseFloat(quote.tax_amount || 0);
    depositAmount = parseFloat(quote.deposit_amount || 0);
    balanceAmount = parseFloat(quote.balance_amount || 0);
    // Calculate totalWithVAT from stored values
    totalWithVAT = balanceAmount > 0 && depositAmount > 0 
      ? balanceAmount + depositAmount 
      : totalBeforeVAT + vatAmount;
  } else {
    // Calculate from tasks (for quotes being created)
    const financialBreakdown = calculateQuoteTotals(tasks, financialConfig);
    totalBeforeVAT = financialBreakdown.totalBeforeVAT;
    vatAmount = financialBreakdown.vatAmount;
    totalWithVAT = financialBreakdown.totalWithVAT;
    depositAmount = financialBreakdown.depositAmount;
    balanceAmount = financialBreakdown.balanceAmount;
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
                  <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">${formatNumberWithComma(taskPrice + materialsTotal)} €</td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f3f4f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold;">SOUS-TOTAL HT:</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold;">${formatNumberWithComma(totalBeforeVAT)} €</td>
            </tr>
            ${financialConfig?.vatConfig?.display ? `
            <tr style="background-color: #f3f4f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold;">TVA (${financialConfig.vatConfig.rate}%):</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold;">${formatNumberWithComma(vatAmount)} €</td>
            </tr>
            ` : ''}
            <tr style="background-color: #e5e7eb;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold;">TOTAL TTC:</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            ${financialConfig?.advanceConfig?.enabled ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold; color: ${primaryColor}; text-transform: uppercase;">${paymentBeforeWorkLabel}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold; color: ${primaryColor};">${formatNumberWithComma(depositAmount)} €</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px; font-weight: bold; color: ${primaryColor}; text-transform: uppercase;">${paymentAfterWorkLabel}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; font-weight: bold; color: ${primaryColor};">${formatNumberWithComma(balanceAmount)} €</td>
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
export const generateInvoicePDF = async (invoiceData, invoiceNumber, elementToCapture = null, language = 'fr', hideBankInfo = false, invoiceType = null) => {
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
      tempDiv.innerHTML = generateInvoiceHTML(invoiceData, invoiceNumber, language, hideBankInfo, invoiceType);
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
const generateInvoiceHTML = (invoiceData, invoiceNumber, language = 'fr', hideBankInfo = false, invoiceType = null) => {
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
      invoice: 'FACTURE CLIENT',
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
      invoice: 'CLIENT INVOICE',
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
      invoice: 'KLANTENFACTUUR',
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
  
  // Get invoice lines from quote tasks and materials if available, otherwise create a single line
  let invoiceLines = [];
  if (quote && quote.quote_tasks && quote.quote_tasks.length > 0) {
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
      totalPrice: parseFloat(invoice.amount || 0)
    }];
  }
  
  const subtotal = parseFloat(invoice.net_amount || invoice.amount || 0);
  const taxAmount = parseFloat(invoice.tax_amount || 0);
  const total = parseFloat(invoice.final_amount || invoice.amount || 0);
  
  // Extract deposit information directly from quote table or invoice peppol_metadata
  let depositAmount = 0;
  let balanceAmount = total;
  let depositEnabled = false;
  let totalWithVAT = subtotal + taxAmount;
  let isDepositPaid = false; // Check if deposit invoice is paid (for final invoices)
  
  if (quote && (quote.deposit_amount !== undefined || quote.balance_amount !== undefined)) {
    // Get deposit info directly from quote table columns
    depositAmount = parseFloat(quote.deposit_amount || 0);
    balanceAmount = parseFloat(quote.balance_amount || total);
    depositEnabled = depositAmount > 0;
    
    // Calculate totalWithVAT from stored values
    if (depositEnabled && balanceAmount > 0) {
      totalWithVAT = balanceAmount + depositAmount;
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
                    parseFloat(metadata.deposit_amount || 0);
    depositEnabled = depositAmount > 0; // Deposit is enabled if amount > 0
    
    if (depositEnabled) {
      // Use EXACT balance_amount from metadata if available, otherwise use total
      balanceAmount = typeof metadata.balance_amount === 'number' ? metadata.balance_amount :
                      parseFloat(metadata.balance_amount || total);
      totalWithVAT = balanceAmount + depositAmount;
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
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: ${primaryColor}; font-weight: bold; letter-spacing: 1px;">${t.invoice}</h2>
          <p style="margin: 5px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold;">${escapeHtml(invoiceNumber || 'N/A')}</p>
          ${(() => {
            // Simple badge logic - show based on invoice type only, no extra conditions
            if (isDepositInvoice) {
              return `<div style="margin: 8px 0; padding: 6px 12px; background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; display: inline-block; min-width: 120px;">
                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #000000; text-transform: uppercase; line-height: 1.2;">${language === 'fr' ? 'FACTURE D\'ACOMPTE' : language === 'en' ? 'DEPOSIT INVOICE' : 'AANBETALINGSFACTUUR'}</p>
              </div>`;
            } 
            if (isFinalInvoice && depositEnabled) {
              return `<div style="margin: 8px 0; padding: 6px 12px; background-color: #d1fae5; border: 2px solid #10b981; border-radius: 6px; display: inline-block; min-width: 120px;">
                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #000000; text-transform: uppercase; line-height: 1.2;">${language === 'fr' ? 'FACTURE FINALE' : language === 'en' ? 'FINAL INVOICE' : 'EINDFACTUUR'}</p>
              </div>`;
            }
            return '';
          })()}
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
              return `<p style="margin: 3px 0 0 0; font-weight: 500;">${language === 'en' ? 'VAT:' : language === 'nl' ? 'BTW:' : 'TVA:'} ${escapeHtml(formattedVAT)}</p>`;
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
            ${companyInfo?.vatNumber ? `<p style="margin: 3px 0 0 0; font-weight: 500;">${language === 'en' ? 'VAT:' : language === 'nl' ? 'BTW:' : 'TVA:'} ${escapeHtml(companyInfo.vatNumber)}</p>` : ''}
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
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; color: ${secondaryColor}; font-size: 10px; font-weight: 500;">${hasMaterials ? '' : `${formatNumberWithComma(line.unitPrice)} €`}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; color: ${secondaryColor}; font-size: 10px; font-weight: 500;">${formatNumberWithComma(line.totalPrice)} €</td>
              </tr>
              ${hasMaterials ? line.materials.map((mat, matIndex) => `
              <tr style="background-color: #f9fafb;">
                <td style="border: 1px solid #d1d5db; padding: 6px 6px 6px 20px; text-align: center; color: ${secondaryColor}; font-size: 9px;">${line.number}.${matIndex + 1}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px 6px 20px; color: ${secondaryColor}; font-size: 9px;">${escapeHtml(mat.name)}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: center; color: ${secondaryColor}; font-size: 9px;">${cleanQuantity(mat.quantity)} ${escapeHtml(mat.unit)}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: right; color: ${secondaryColor}; font-size: 9px; font-weight: 500;">${formatNumberWithComma(mat.unitPrice)} €</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: right; color: ${secondaryColor}; font-size: 9px; font-weight: 500;">${formatNumberWithComma(mat.totalPrice)} €</td>
              </tr>
              `).join('') : ''}
            `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.subtotal}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatNumberWithComma(subtotal)} €</td>
            </tr>
            ${taxAmount > 0 ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.vat}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatNumberWithComma(taxAmount)} €</td>
            </tr>
            ` : ''}
            ${depositEnabled && depositAmount > 0 ? `
            ${isDepositInvoice ? `
            <!-- Deposit Invoice: Show deposit info (highlighted), remaining balance (not highlighted), and total -->
            <tr style="background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: #1e40af; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT AVANT TRAVAUX:' : language === 'en' ? 'PAYMENT BEFORE WORK:' : 'BETALING VOOR WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 14px;">${formatNumberWithComma(depositAmount)} €</td>
            </tr>
            ${balanceAmount > 0 ? `
            <tr style="background-color: ${primaryColorLight};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'MONTANT RESTANT À PAYER APRÈS TRAVAUX:' : language === 'en' ? 'REMAINING AMOUNT TO PAY AFTER WORK:' : 'RESTEREND BEDRAG TE BETALEN NA WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(balanceAmount)} €</td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            ` : isFinalInvoice ? `
            <!-- Final Invoice: Show remaining amount to pay (highlighted), then paid deposit (if paid), then total -->
            <tr style="background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: #1e40af; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'MONTANT RESTANT À PAYER:' : language === 'en' ? 'REMAINING AMOUNT TO PAY:' : 'RESTEREND BEDRAG TE BETALEN:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 14px;">${formatNumberWithComma(balanceAmount)} €</td>
            </tr>
            ${isDepositPaid ? `
            <tr style="background-color: #f0fdf4; border-left: 4px solid #10b981;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: 600; color: #065f46; font-size: 10px; font-style: italic;" colspan="5">
                ${language === 'fr' ? '✓ Acompte payé: ' : language === 'en' ? '✓ Paid deposit: ' : '✓ Betaald voorschot: '}
                <span style="font-weight: bold;">${formatNumberWithComma(depositAmount)} €</span>
              </td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            ` : `
            <!-- No deposit/final distinction: Show both (backward compatibility) -->
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 11px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT AVANT TRAVAUX:' : language === 'en' ? 'PAYMENT BEFORE WORK:' : 'BETALING VOOR WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 11px;">${formatNumberWithComma(depositAmount)} €</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 11px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT APRÈS TRAVAUX:' : language === 'en' ? 'PAYMENT AFTER WORK:' : 'BETALING NA WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 11px;">${formatNumberWithComma(balanceAmount)} €</td>
            </tr>
            `}
            ` : `
            <!-- No deposit: Show total only -->
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            `}
          </tfoot>
        </table>
      </div>
      
      <!-- PDF Warning Notice - Only show for professional clients (companies), not individual clients -->
      ${((client?.client_type === 'company' || client?.client_type === 'professional' || client?.type === 'company' || client?.type === 'professional') && client?.client_type !== 'individual' && client?.type !== 'individual') ? `
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

/**
 * Generate PDF from expense invoice data
 * @param {Object} expenseInvoiceData - Expense invoice data including company info, supplier, invoice details, etc.
 * @param {string} invoiceNumber - Invoice number
 * @returns {Promise<Blob>} PDF blob
 */
export const generateExpenseInvoicePDF = async (expenseInvoiceData, invoiceNumber, language = 'fr', invoiceType = null) => {
  try {
    // Create a temporary element with the expense invoice preview
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '900px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '0';
    tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.innerHTML = generateExpenseInvoiceHTML(expenseInvoiceData, invoiceNumber, language, invoiceType);
    document.body.appendChild(tempDiv);
    const target = tempDiv;
    
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
      height: clonedTarget.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: clonedTarget.offsetWidth
    });
    
    // Remove the cloned element
    document.body.removeChild(clonedTarget);
    
    // Remove the temp node
    if (target && target.parentNode) {
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
    
    // Return PDF blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating expense invoice PDF:', error);
    throw new Error('Failed to generate expense invoice PDF');
  }
};

/**
 * Generate HTML content for the expense invoice
 */
const generateExpenseInvoiceHTML = (expenseInvoiceData, invoiceNumber, language = 'fr', invoiceType = null) => {
  const { companyInfo, supplier, invoice } = expenseInvoiceData;
  
  // Get invoice_type from parameter, invoice object, or peppol_metadata
  const finalInvoiceType = invoiceType || invoice.invoice_type || invoice.peppol_metadata?.invoice_type || 'final';
  const isDepositInvoice = finalInvoiceType === 'deposit';
  const isFinalInvoice = finalInvoiceType === 'final';
  
  // Color scheme matching client invoice PDF exactly
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
      invoice: 'FACTURE FOURNISSEUR',
      supplier: 'FOURNISSEUR',
      company: 'ENTREPRISE',
      invoiceDetails: 'DÉTAILS DE LA FACTURE',
      category: 'Catégorie:',
      payment: 'Paiement:',
      source: 'Source:',
      notes: 'Notes:',
      subtotal: 'SOUS-TOTAL HT:',
      vat: 'TVA:',
      total: 'TOTAL TTC:',
      date: 'Date:',
      due: 'Échéance:',
      paymentInfo: 'INFORMATIONS DE PAIEMENT',
      services: 'DÉTAIL DES PRESTATIONS',
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
      invoice: 'SUPPLIER INVOICE',
      supplier: 'SUPPLIER',
      company: 'COMPANY',
      invoiceDetails: 'INVOICE DETAILS',
      category: 'Category:',
      payment: 'Payment:',
      source: 'Source:',
      notes: 'Notes:',
      subtotal: 'SUBTOTAL EXCL. VAT:',
      vat: 'VAT:',
      total: 'TOTAL INCL. VAT:',
      date: 'Date:',
      due: 'Due Date:',
      paymentInfo: 'PAYMENT INFORMATION',
      services: 'SERVICE DETAILS',
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
      invoice: 'LEVERANCIERSFACTUUR',
      supplier: 'LEVERANCIER',
      company: 'BEDRIJF',
      invoiceDetails: 'FACTUURDETAILS',
      category: 'Categorie:',
      payment: 'Betaling:',
      source: 'Bron:',
      notes: 'Opmerkingen:',
      subtotal: 'SUBTOTAAL EXCL. BTW:',
      vat: 'BTW:',
      total: 'TOTAAL INCL. BTW:',
      date: 'Datum:',
      due: 'Vervaldatum:',
      paymentInfo: 'BETALINGSINFORMATIE',
      services: 'DIENSTDETAILS',
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
  
  // Get invoice lines from Peppol metadata if available, otherwise create a single line
  // Use EXACT values from UBL XML - NO calculations, NO modifications
  // Show all lines as flat items (no grouping of materials under tasks)
  let invoiceLines = [];
  if (invoice.invoiceLines && Array.isArray(invoice.invoiceLines) && invoice.invoiceLines.length > 0) {
    // Map all lines with their EXACT data from UBL XML (no parsing, no calculation, no grouping)
    invoiceLines = invoice.invoiceLines.map((line, index) => {
      // Use EXACT values as stored in peppol_metadata (already parsed from UBL XML)
      // These values come directly from <cac:InvoiceLine> in UBL XML
      // Clean quantity - ensure it's a number, not a string with multiple values
      let rawQuantity = line.quantity || line.InvoicedQuantity || 1;
      // If it's a string, clean it first, then ensure it's a number
      const exactQuantity = typeof rawQuantity === 'number' ? rawQuantity : cleanQuantity(rawQuantity);
      const exactUnitPrice = typeof line.unitPrice === 'number' ? line.unitPrice : 
                            typeof line.priceAmount === 'number' ? line.priceAmount :
                            typeof line.unit_price === 'number' ? line.unit_price :
                            parseFloat(line.unitPrice || line.priceAmount || line.unit_price || 0);
      const exactTotalPrice = typeof line.amount === 'number' ? line.amount :
                              typeof line.lineExtensionAmount === 'number' ? line.lineExtensionAmount :
                              typeof line.totalPrice === 'number' ? line.totalPrice :
                              parseFloat(line.amount || line.lineExtensionAmount || line.totalPrice || 0);
      
      return {
        number: String(index + 1), // Simple sequential numbering: 1, 2, 3, etc. (sub-items will be 1.1, 1.2, etc. if materials exist)
        description: line.description || line.itemName || line.name || '',
        quantity: exactQuantity, // Already cleaned, ensure it's a number
        // Use same unit logic as detail view - don't include unit code from InvoicedQuantity
        unit: line.unit || line.unitCode || '',
        // Use EXACT unit price from UBL XML - no calculation
        unitPrice: exactUnitPrice,
        // Use EXACT line total from UBL XML (lineExtensionAmount) - no calculation
        totalPrice: exactTotalPrice,
        // Check if this line has sub-items (materials) - for Peppol, we might need to check for related lines
        materials: line.materials || line.subItems || []
      };
    });
  } else {
    // Single line from invoice summary - use exact stored net amount
    const netAmount = parseFloat(invoice.net_amount || invoice.amount || 0);
    invoiceLines = [{
      number: '1',
      description: invoice.notes || 'Service',
      quantity: 1,
      unit: '',
      unitPrice: netAmount,
      totalPrice: netAmount,
      materials: []
    }];
  }
  
  // Use EXACT values from UBL XML stored in database - NO calculations
  // These values come directly from <cac:LegalMonetaryTotal> in UBL XML
  // For Peppol invoices, use totals from peppol_metadata which are exact UBL XML values
  let total, netAmount, vatAmount, totalWithVAT, depositAmount, balanceAmount, depositEnabled;
  
  if (invoice.peppol_metadata && typeof invoice.peppol_metadata === 'object') {
    const metadata = invoice.peppol_metadata;
    const totals = metadata.totals || {};
    const taxSubtotals = metadata.taxSubtotals || [];
    
    // Use EXACT values from UBL XML totals (no calculation)
    // These come from <cac:LegalMonetaryTotal> in UBL XML
    total = typeof totals.payableAmount === 'number' ? totals.payableAmount :
            typeof totals.taxInclusiveAmount === 'number' ? totals.taxInclusiveAmount :
            parseFloat(invoice.amount || 0);
    
    // PRIORITIZE taxExclusiveAmount from UBL XML - this is the correct subtotal
    netAmount = typeof totals.taxExclusiveAmount === 'number' ? totals.taxExclusiveAmount :
                typeof totals.lineExtensionAmount === 'number' ? totals.lineExtensionAmount :
                parseFloat(invoice.net_amount || 0);
    
    // PRIORITIZE VAT from UBL XML - use tax total amount directly, or sum from tax subtotals
    // This ensures we use the exact VAT amount from UBL XML <cac:TaxTotal>/<cbc:TaxAmount>
    // First try to get tax total from metadata (if stored), then sum from subtotals, then fallback to database
    const taxTotal = metadata.tax?.totalTaxAmount;
    if (typeof taxTotal === 'number' && taxTotal > 0) {
      // Use exact tax total from UBL XML
      vatAmount = taxTotal;
    } else if (taxSubtotals.length > 0) {
      // Sum all tax amounts from tax subtotals (exact from UBL XML)
      vatAmount = taxSubtotals.reduce((sum, tax) => {
        const taxAmt = typeof tax.taxAmount === 'number' ? tax.taxAmount :
                       typeof tax.tax_amount === 'number' ? tax.tax_amount :
                       parseFloat(tax.taxAmount || tax.tax_amount || 0);
        return sum + taxAmt;
      }, 0);
    } else {
      // Fallback to stored VAT amount if tax data not available
      vatAmount = parseFloat(invoice.vat_amount || 0);
    }
    
    // Use EXACT totalWithVAT from UBL XML (taxInclusiveAmount or payableAmount) - NO calculation
    totalWithVAT = typeof totals.taxInclusiveAmount === 'number' ? totals.taxInclusiveAmount :
                    typeof totals.payableAmount === 'number' ? totals.payableAmount :
                    total;
    
    // Extract deposit information from Peppol metadata (exact values, no calculation)
    // Deposit is enabled if deposit_amount > 0 (same logic as quotes table)
    depositAmount = typeof metadata.deposit_amount === 'number' ? metadata.deposit_amount :
                    parseFloat(metadata.deposit_amount || 0);
    depositEnabled = depositAmount > 0; // Deposit is enabled if amount > 0
    
    // Use EXACT balance_amount from metadata if available, otherwise calculate from total
    if (depositEnabled && depositAmount > 0) {
    balanceAmount = typeof metadata.balance_amount === 'number' ? metadata.balance_amount :
                      parseFloat(metadata.balance_amount || (totalWithVAT - depositAmount));
  } else {
      balanceAmount = totalWithVAT;
    }
    
    // Check deposit status from metadata or invoiceData
    if (metadata.deposit_invoice_status === 'paid' || expenseInvoiceData.depositInvoiceStatus === 'paid' || invoice.deposit_invoice_status === 'paid') {
      isDepositPaid = true;
    }
  } else {
    // Manual invoice - check if deposit info exists in peppol_metadata or invoice object
    // For expense invoices, deposit/balance are stored in peppol_metadata
    const metadata = invoice.peppol_metadata || {};
    const manualDepositAmount = typeof metadata.deposit_amount === 'number' ? metadata.deposit_amount :
                                parseFloat(metadata.deposit_amount || invoice.deposit_amount || 0);
    const manualBalanceAmount = typeof metadata.balance_amount === 'number' ? metadata.balance_amount :
                                parseFloat(metadata.balance_amount || invoice.balance_amount || 0);
    
    total = parseFloat(invoice.amount || 0);
    netAmount = parseFloat(invoice.net_amount || 0);
    vatAmount = parseFloat(invoice.vat_amount || 0);
    totalWithVAT = total; // For manual invoices, amount is already total with VAT
    
    // Check if deposit is enabled for manual invoices
    // For deposit invoices: amount = deposit, total = deposit + balance (stored in metadata)
    // For final invoices: amount = balance, deposit is stored in metadata
    if (manualDepositAmount > 0) {
      depositAmount = manualDepositAmount;
      depositEnabled = true;
      // If it's a deposit invoice, total = deposit + balance
      // If it's a final invoice, amount = balance, total = deposit + balance
      if (finalInvoiceType === 'deposit') {
        // Deposit invoice: amount is deposit, calculate total from deposit + balance
        balanceAmount = manualBalanceAmount > 0 ? manualBalanceAmount : 0;
        totalWithVAT = depositAmount + balanceAmount;
      } else {
        // Final invoice: amount is balance, total = deposit + balance
        balanceAmount = manualBalanceAmount > 0 ? manualBalanceAmount : total;
        totalWithVAT = depositAmount + balanceAmount;
      }
    } else {
    depositAmount = 0;
      balanceAmount = totalWithVAT;
    depositEnabled = false;
    }
  }
  
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
      logoHtml = `<img src="${companyInfo.logo.data}" alt="Logo ${companyInfo.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px;" />`;
    } else if (companyInfo.logo.url) {
      logoHtml = `<img src="${companyInfo.logo.url}" alt="Logo ${companyInfo.name}" style="width: 80px; height: 80px; object-fit: contain; border-radius: 8px;" />`;
    } else if (typeof companyInfo.logo === 'string' && companyInfo.logo.startsWith('http')) {
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
          <h2 style="margin: 0 0 10px 0; font-size: 18px; color: ${primaryColor}; font-weight: bold; letter-spacing: 1px;">${t.invoice}</h2>
          <p style="margin: 5px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold;">${escapeHtml(invoiceNumber || 'N/A')}</p>
          ${(() => {
            // Simple badge logic - show based on invoice type only, no extra conditions
            if (isDepositInvoice) {
              return `<div style="margin: 8px 0; padding: 6px 12px; background-color: #dbeafe; border: 2px solid #3b82f6; border-radius: 6px; display: inline-block; min-width: 120px;">
                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #000000; text-transform: uppercase; line-height: 1.2;">${language === 'fr' ? 'FACTURE D\'ACOMPTE' : language === 'en' ? 'DEPOSIT INVOICE' : 'AANBETALINGSFACTUUR'}</p>
              </div>`;
            } 
            if (isFinalInvoice && depositEnabled) {
              return `<div style="margin: 8px 0; padding: 6px 12px; background-color: #d1fae5; border: 2px solid #10b981; border-radius: 6px; display: inline-block; min-width: 120px;">
                <p style="margin: 0; font-size: 11px; font-weight: bold; color: #000000; text-transform: uppercase; line-height: 1.2;">${language === 'fr' ? 'FACTURE FINALE' : language === 'en' ? 'FINAL INVOICE' : 'EINDFACTUUR'}</p>
              </div>`;
            }
            return '';
          })()}
          <p style="margin: 3px 0; color: ${secondaryColor}; font-size: 11px;">${t.date} ${currentDate}</p>
          ${dueDate ? `<p style="margin: 3px 0; color: ${secondaryColor}; font-size: 11px;">${t.due} ${dueDate}</p>` : ''}
        </div>
      </div>
      
      <!-- Company and Supplier Information -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 12px 0; font-size: 12px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${t.supplier}</h3>
          <div style="color: ${secondaryColor}; font-size: 11px; line-height: 1.6;">
            <p style="margin: 0 0 5px 0; font-size: 12px;">${escapeHtml(supplier?.name || (language === 'en' ? 'Supplier' : language === 'nl' ? 'Leverancier' : 'Fournisseur'))}</p>
            ${supplier?.email ? `<p style="margin: 0 0 3px 0;">${escapeHtml(supplier.email)}</p>` : ''}
            ${supplier?.phone ? `<p style="margin: 0 0 3px 0;">${escapeHtml(supplier.phone)}</p>` : ''}
            ${supplier?.address ? `<p style="margin: 0 0 3px 0;">${escapeHtml(supplier.address)}</p>` : ''}
            ${supplier?.postal_code && supplier?.city ? `<p style="margin: 0;">${escapeHtml(supplier.postal_code)} ${escapeHtml(supplier.city)}</p>` : ''}
            ${supplier?.vat_number ? `<p style="margin: 3px 0 0 0; font-weight: 500;">TVA: ${escapeHtml(supplier.vat_number)}</p>` : ''}
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
            ${companyInfo?.vatNumber ? `<p style="margin: 3px 0 0 0; font-weight: 500;">TVA: ${escapeHtml(companyInfo.vatNumber)}</p>` : ''}
          </div>
        </div>
      </div>
      
      <!-- Payment Information -->
      ${companyInfo?.iban || companyInfo?.accountName || companyInfo?.bankName ? `
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
              // Use quantity directly - same as detail modal (no cleanQuantity, no processing)
              const displayQuantity = line.quantity || 1;
              return `
              <tr style="${index % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #ffffff;'}">
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; color: ${secondaryColor}; font-size: 10px;">${line.number}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; color: ${secondaryColor}; font-size: 10px;">${escapeHtml(line.description)}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: center; color: ${secondaryColor}; font-size: 10px;">${hasMaterials ? '' : `${displayQuantity} ${escapeHtml(line.unit || '')}`}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; color: ${secondaryColor}; font-size: 10px; font-weight: 500;">${hasMaterials ? '' : `${formatNumberWithComma(line.unitPrice)} €`}</td>
                <td style="border: 1px solid #d1d5db; padding: 8px 6px; text-align: right; color: ${secondaryColor}; font-size: 10px; font-weight: 500;">${formatNumberWithComma(line.totalPrice)} €</td>
              </tr>
              ${hasMaterials ? line.materials.map((mat, matIndex) => {
                // Use quantity directly - same as detail modal (no cleanQuantity, no processing)
                const matQuantity = mat.quantity || 1;
                return `
              <tr style="background-color: #f9fafb;">
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: center; color: ${secondaryColor}; font-size: 9px; padding-left: 24px;">${line.number}.${matIndex + 1}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; color: ${secondaryColor}; font-size: 9px; padding-left: 24px;">${escapeHtml(mat.name || mat.description || '')}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: center; color: ${secondaryColor}; font-size: 9px;">${matQuantity} ${escapeHtml(mat.unit || '')}</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: right; color: ${secondaryColor}; font-size: 9px; font-weight: 500;">${formatNumberWithComma(mat.unitPrice || mat.price || 0)} €</td>
                <td style="border: 1px solid #d1d5db; padding: 6px 6px; text-align: right; color: ${secondaryColor}; font-size: 9px; font-weight: 500;">${formatNumberWithComma(mat.totalPrice || mat.amount || 0)} €</td>
              </tr>
              `;
              }).join('') : ''}
            `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.subtotal}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatNumberWithComma(netAmount)} €</td>
            </tr>
            ${vatAmount > 0 ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: bold; color: ${primaryColor}; font-size: 10px;" colspan="4">${t.vat}</td>
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 10px;">${formatNumberWithComma(vatAmount)} €</td>
            </tr>
            ` : ''}
            ${depositEnabled && depositAmount > 0 ? `
            ${isDepositInvoice ? `
            <!-- Deposit Invoice: Show deposit info (highlighted), remaining balance (not highlighted), and total -->
            <tr style="background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: #1e40af; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT AVANT TRAVAUX:' : language === 'en' ? 'PAYMENT BEFORE WORK:' : 'BETALING VOOR WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 14px;">${formatNumberWithComma(depositAmount)} €</td>
            </tr>
            ${balanceAmount > 0 ? `
            <tr style="background-color: ${primaryColorLight};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'MONTANT RESTANT À PAYER APRÈS TRAVAUX:' : language === 'en' ? 'REMAINING AMOUNT TO PAY AFTER WORK:' : 'RESTEREND BEDRAG TE BETALEN NA WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(balanceAmount)} €</td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            ` : isFinalInvoice ? `
            <!-- Final Invoice: Show remaining amount to pay (highlighted), then paid deposit (if paid), then total -->
            <tr style="background-color: #dbeafe; border-left: 4px solid #3b82f6;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: #1e40af; font-size: 12px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'MONTANT RESTANT À PAYER:' : language === 'en' ? 'REMAINING AMOUNT TO PAY:' : 'RESTEREND BEDRAG TE BETALEN:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 14px;">${formatNumberWithComma(balanceAmount)} €</td>
            </tr>
            ${isDepositPaid ? `
            <tr style="background-color: #f0fdf4; border-left: 4px solid #10b981;">
              <td style="border: 1px solid #d1d5db; padding: 10px 6px; font-weight: 600; color: #065f46; font-size: 10px; font-style: italic;" colspan="5">
                ${language === 'fr' ? '✓ Acompte payé: ' : language === 'en' ? '✓ Paid deposit: ' : '✓ Betaald voorschot: '}
                <span style="font-weight: bold;">${formatNumberWithComma(depositAmount)} €</span>
              </td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            ` : `
            <!-- No deposit/final distinction: Show both (backward compatibility) -->
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 11px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT AVANT TRAVAUX:' : language === 'en' ? 'PAYMENT BEFORE WORK:' : 'BETALING VOOR WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 11px;">${formatNumberWithComma(depositAmount)} €</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 11px; text-transform: uppercase;" colspan="4">${language === 'fr' ? 'PAIEMENT APRÈS TRAVAUX:' : language === 'en' ? 'PAYMENT AFTER WORK:' : 'BETALING NA WERK:'}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 11px;">${formatNumberWithComma(balanceAmount)} €</td>
            </tr>
            `}
            ` : `
            <!-- No deposit: Show total only -->
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; font-weight: bold; color: ${primaryColor}; font-size: 12px; text-transform: uppercase;" colspan="4">${t.total}</td>
              <td style="border: 1px solid #d1d5db; padding: 12px 6px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${formatNumberWithComma(totalWithVAT)} €</td>
            </tr>
            `}
          </tfoot>
        </table>
      </div>
      
      <!-- PDF Warning Notice - Expense invoices are always from suppliers (companies), so always show warning -->
      <div style="margin-top: 40px; padding: 15px; background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 6px;">
        <div style="display: flex; align-items: flex-start; gap: 10px;">
          <div style="flex-shrink: 0; color: #d97706; font-size: 16px; font-weight: bold;">⚠</div>
          <div style="flex: 1;">
            <p style="margin: 0 0 5px 0; font-size: 11px; font-weight: bold; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">${t.pdfWarningTitle}</p>
            <p style="margin: 0; font-size: 10px; color: #78350f; line-height: 1.5;">${t.pdfWarning}</p>
          </div>
        </div>
      </div>
      
    </div>
  `;
};