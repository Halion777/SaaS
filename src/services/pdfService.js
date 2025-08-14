import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate PDF from quote preview
 * @param {Object} quoteData - Quote data including company info, client, tasks, etc.
 * @param {string} quoteNumber - Quote number
 * @returns {Promise<Blob>} PDF blob
 */
export const generateQuotePDF = async (quoteData, quoteNumber, elementToCapture) => {
  try {
    let target = elementToCapture;
    // Fallback to generated HTML if no element is provided
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

    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    // If we created a temp node, remove it now
    if (elementToCapture == null && target && target.parentNode) {
      target.parentNode.removeChild(target);
    }
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
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
  const totalAmount = tasks.reduce((sum, task) => sum + (task.price || 0), 0);
  
  return `
    <div style="max-width: 800px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #374151; padding-bottom: 20px;">
        <div style="flex: 1;">
          <h1 style="margin: 0; font-size: 24px; color: #374151; font-weight: bold;">${companyInfo.name || 'VOTRE ENTREPRISE'}</h1>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${companyInfo.address || ''}</p>
          <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${companyInfo.postalCode || ''} ${companyInfo.city || ''}</p>
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
