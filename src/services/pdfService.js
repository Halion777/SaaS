import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const { companyInfo, selectedClient, tasks, projectInfo, financialConfig } = quoteData;
  
  const currentDate = new Date().toLocaleDateString('fr-FR');
  const totalAmount = tasks.reduce((sum, task) => {
    const taskMaterialsTotal = (task.materials || []).reduce(
      (matSum, mat) => matSum + ((parseFloat(mat.price || 0)) * (parseFloat(mat.quantity || 0))),
      0
    );
    return sum + (parseFloat(task.price || 0)) + taskMaterialsTotal;
  }, 0);
  
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
            ${tasks.map(task => `
              <tr>
                <td style="border: 1px solid #d1d5db; padding: 12px;">${task.description || task.name || ''}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right;">${(task.price || 0).toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div style="text-align: right; font-size: 18px; font-weight: bold; color: #374151;">
        Total: ${totalAmount.toFixed(2)} €
      </div>
    </div>
  `;
};

/**
 * Generate PDF from invoice data
 * @param {Object} invoiceData - Invoice data including company info, client, invoice details, etc.
 * @param {string} invoiceNumber - Invoice number
 * @param {HTMLElement} elementToCapture - Optional element to capture (invoice preview container)
 * @returns {Promise<Blob>} PDF blob
 */
export const generateInvoicePDF = async (invoiceData, invoiceNumber, elementToCapture = null) => {
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
      tempDiv.innerHTML = generateInvoiceHTML(invoiceData, invoiceNumber);
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
const generateInvoiceHTML = (invoiceData, invoiceNumber) => {
  const { companyInfo, client, invoice, quote } = invoiceData;
  
  // Color scheme matching quote preview
  const primaryColor = '#374151'; // Dark gray
  const secondaryColor = '#1f2937'; // Darker gray
  const primaryColorLight = `${primaryColor}20`; // 20% opacity for backgrounds
  
  const currentDate = invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
  const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('fr-FR') : '';
  
  // Get invoice lines from quote tasks if available, otherwise create a single line
  let invoiceLines = [];
  if (quote && quote.quote_tasks && quote.quote_tasks.length > 0) {
    invoiceLines = quote.quote_tasks.map((task, index) => ({
      number: index + 1,
      description: task.description || task.name || '',
      quantity: task.quantity || 1,
      unit: task.unit || '',
      unitPrice: parseFloat(task.unit_price || 0),
      totalPrice: parseFloat(task.total_price || 0)
    }));
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
    <div style="max-width: 900px; margin: 0 auto; font-family: 'Arial', 'Helvetica', sans-serif; background: #ffffff; padding: 40px;">
      <!-- Header with Logo and Invoice Info -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 50px; padding-bottom: 30px; border-bottom: 2px solid ${primaryColor};">
        <div style="flex: 1; display: flex; align-items: center; gap: 20px;">
          ${logoHtml ? `<div style="flex-shrink: 0;">${logoHtml}</div>` : '<div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; font-weight: bold;">LOGO</div>'}
          <div>
            <h1 style="margin: 0; font-size: 28px; color: ${primaryColor}; font-weight: bold; line-height: 1.2;">${escapeHtml(companyInfo?.name || 'VOTRE ENTREPRISE')}</h1>
            <p style="margin: 5px 0 0 0; color: ${secondaryColor}; font-size: 14px; font-weight: 500;">Artisan professionnel</p>
          </div>
        </div>
        <div style="text-align: right; flex: 1;">
          <h2 style="margin: 0 0 15px 0; font-size: 24px; color: ${primaryColor}; font-weight: bold; letter-spacing: 1px;">FACTURE</h2>
          <p style="margin: 8px 0; font-size: 20px; color: ${primaryColor}; font-weight: bold;">${escapeHtml(invoiceNumber || 'N/A')}</p>
          <p style="margin: 5px 0; color: ${secondaryColor}; font-size: 14px;">Date: ${currentDate}</p>
          ${dueDate ? `<p style="margin: 5px 0; color: ${secondaryColor}; font-size: 14px;">Échéance: ${dueDate}</p>` : ''}
        </div>
      </div>
      
      <!-- Company and Client Information -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-bottom: 50px;">
        <div>
          <h3 style="margin: 0 0 20px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">CLIENT</h3>
          <div style="color: ${secondaryColor}; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px;">${escapeHtml(client?.name || 'Client')}</p>
            ${client?.email ? `<p style="margin: 0 0 5px 0;">${escapeHtml(client.email)}</p>` : ''}
            ${client?.phone ? `<p style="margin: 0 0 5px 0;">${escapeHtml(client.phone)}</p>` : ''}
            ${client?.address ? `<p style="margin: 0 0 5px 0;">${escapeHtml(client.address)}</p>` : ''}
            ${client?.postal_code && client?.city ? `<p style="margin: 0;">${escapeHtml(client.postal_code)} ${escapeHtml(client.city)}</p>` : ''}
            ${client?.country ? `<p style="margin: 5px 0 0 0;">${escapeHtml(client.country)}</p>` : ''}
          </div>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0 0 20px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">ENTREPRISE</h3>
          <div style="color: ${secondaryColor}; font-size: 14px; line-height: 1.8;">
            <p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo?.address || '')}</p>
            <p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo?.postalCode || '')} ${escapeHtml(companyInfo?.city || '')}</p>
            ${companyInfo?.email ? `<p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo.email)}</p>` : ''}
            ${companyInfo?.phone ? `<p style="margin: 0 0 5px 0;">${escapeHtml(companyInfo.phone)}</p>` : ''}
            ${companyInfo?.vatNumber ? `<p style="margin: 5px 0 0 0; font-weight: 500;">TVA: ${escapeHtml(companyInfo.vatNumber)}</p>` : ''}
          </div>
        </div>
      </div>
      
      <!-- Payment Information -->
      ${(companyInfo?.iban || companyInfo?.accountName || companyInfo?.bankName) ? `
      <div style="margin-bottom: 50px; padding: 20px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">INFORMATIONS DE PAIEMENT</h3>
        <div style="color: ${secondaryColor}; font-size: 14px; line-height: 1.8;">
          ${companyInfo?.iban ? `<p style="margin: 0 0 8px 0;"><strong>IBAN:</strong> ${escapeHtml(companyInfo.iban)}</p>` : ''}
          ${companyInfo?.accountName ? `<p style="margin: 0 0 8px 0;"><strong>Nom du compte:</strong> ${escapeHtml(companyInfo.accountName)}</p>` : ''}
          ${companyInfo?.bankName ? `<p style="margin: 0 0 8px 0;"><strong>Banque:</strong> ${escapeHtml(companyInfo.bankName)}</p>` : ''}
        </div>
      </div>
      ` : ''}
      
      <!-- Invoice Lines Table -->
      <div style="margin-bottom: 50px;">
        <h3 style="margin: 0 0 20px 0; font-size: 16px; color: ${primaryColor}; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">DÉTAIL DES PRESTATIONS</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
          <thead>
            <tr style="background-color: ${primaryColorLight};">
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: center; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">N°</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: left; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Désignation</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: center; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Qté</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Prix U.</th>
              <th style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Total HT</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceLines.map((line, index) => `
              <tr style="${index % 2 === 0 ? 'background-color: #fafafa;' : 'background-color: #ffffff;'}">
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: ${secondaryColor}; font-size: 14px;">${line.number}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; color: ${secondaryColor}; font-size: 14px;">${escapeHtml(line.description)}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: center; color: ${secondaryColor}; font-size: 14px;">${line.quantity} ${escapeHtml(line.unit)}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: ${secondaryColor}; font-size: 14px; font-weight: 500;">${line.unitPrice.toFixed(2)} €</td>
                <td style="border: 1px solid #d1d5db; padding: 12px; text-align: right; color: ${secondaryColor}; font-size: 14px; font-weight: 500;">${line.totalPrice.toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; font-weight: bold; color: ${primaryColor}; font-size: 14px;" colspan="4">SOUS-TOTAL HT:</td>
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${subtotal.toFixed(2)} €</td>
            </tr>
            ${taxAmount > 0 ? `
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; font-weight: bold; color: ${primaryColor}; font-size: 14px;" colspan="4">TVA:</td>
              <td style="border: 1px solid #d1d5db; padding: 14px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 14px;">${taxAmount.toFixed(2)} €</td>
            </tr>
            ` : ''}
            <tr style="background-color: ${primaryColorLight}; border: 2px solid ${primaryColor};">
              <td style="border: 1px solid #d1d5db; padding: 16px 12px; font-weight: bold; color: ${primaryColor}; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;" colspan="4">TOTAL TTC:</td>
              <td style="border: 1px solid #d1d5db; padding: 16px 12px; text-align: right; font-weight: bold; color: ${primaryColor}; font-size: 18px;">${total.toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>
      </div>
      
    </div>
  `;
};