// =====================================================
// PEPPOL API EXTENSIONS
// Additional API functions to extend the existing peppolService
// These functions should be added to your PeppolService class
// =====================================================

/**
 * ADD THESE METHODS TO YOUR EXISTING PEPPOLSERVICE CLASS
 */

/**
 * Add a new document type to a participant
 * @param {string} peppolIdentifier - Participant's Peppol ID
 * @param {string} documentType - Document type to add (INVOICE, CREDIT_NOTE, etc.)
 */
async addDocumentTypeToParticipant(peppolIdentifier, documentType) {
  try {
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/remote-participants/${peppolIdentifier}/supported-document-types/${documentType}`,
      {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      return { 
        success: true, 
        message: `Document type ${documentType} added successfully` 
      };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to add document type:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a document type from a participant
 * @param {string} peppolIdentifier - Participant's Peppol ID
 * @param {string} documentType - Document type to remove
 */
async removeDocumentTypeFromParticipant(peppolIdentifier, documentType) {
  try {
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/remote-participants/${peppolIdentifier}/supported-document-types/${documentType}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      return { 
        success: true, 
        message: `Document type ${documentType} removed successfully` 
      };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to remove document type:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get supported document types for a participant (via Peppol network)
 * @param {string} peppolIdentifier - Participant's Peppol ID
 */
async getSupportedDocumentTypesForParticipant(peppolIdentifier) {
  try {
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/remote-participants/${peppolIdentifier}/supported-document-types`,
      {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to get supported document types:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a document via Peppol (generic document sender)
 * @param {File} documentFile - The UBL document file to send
 * @param {string} comment - Optional comment
 */
async sendDocument(documentFile, comment = '') {
  try {
    const formData = new FormData();
    formData.append('document', documentFile);
    if (comment) {
      formData.append('comment', comment);
    }

    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/outbound-documents`,
      {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password)
        },
        body: formData
      }
    );

    if (response.ok) {
      const result = await response.text();
      return { 
        success: true, 
        message: 'Document sent successfully',
        data: result 
      };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to send document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send a UBL document via Peppol
 * @param {File} ublFile - The UBL XML file
 * @param {string} comment - Optional comment
 * @param {string} id - Optional document ID
 */
async sendUBLDocument(ublFile, comment = '', id = '') {
  try {
    const formData = new FormData();
    formData.append('document', ublFile);
    if (comment) {
      formData.append('comment', comment);
    }
    if (id) {
      formData.append('id', id);
    }

    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/outbound-ubl-documents`,
      {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password)
        },
        body: formData
      }
    );

    if (response.ok) {
      const result = await response.text();
      return { 
        success: true, 
        message: 'UBL document sent successfully',
        data: result 
      };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to send UBL document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get detailed participant information (public API - no auth required)
 * @param {string} peppolIdentifier - Participant's Peppol ID
 */
async getDetailedParticipantInfoPublic(peppolIdentifier) {
  try {
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/public/participants/${peppolIdentifier}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to get participant info:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get supported document types (public API - no auth required)
 */
async getSupportedDocumentTypesPublic() {
  try {
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/public/supported-document-types`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to get supported document types:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Validate a Peppol document (public API)
 * @param {File} documentFile - The document to validate
 * @param {string} comment - Optional comment
 */
async validateDocumentPublic(documentFile, comment = '') {
  try {
    const formData = new FormData();
    formData.append('document', documentFile);
    if (comment) {
      formData.append('comment', comment);
    }

    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/public/validate-document`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        message: 'Document is valid',
        data 
      };
    } else {
      const error = await response.text();
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${error}` 
      };
    }
  } catch (error) {
    console.error('Failed to validate document:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Advanced: Send invoice with full control and tracking
 * This is an enhanced version that logs everything to the database
 */
async sendInvoiceWithTracking(invoiceData, clientInfo) {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Generate UBL XML
    const xml = generatePEPPOLXML(invoiceData);
    
    // Create blob and form data
    const blob = new Blob([xml], { type: 'application/xml' });
    const formData = new FormData();
    formData.append('comment', `Invoice ${invoiceData.billName} sent from Haliqo`);
    formData.append('document', blob, 'invoice.xml');

    // Send via Peppol API
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/peppol/outbound-ubl-documents`,
      {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password)
        },
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const result = await response.text();
    let parsedResult = null;
    try {
      parsedResult = JSON.parse(result);
    } catch (_) {
      // response is plain text
    }
    const messageId =
      parsedResult?.messageId ||
      parsedResult?.peppolMessageId ||
      (result.includes('messageId') ? result.split('messageId:')[1]?.split(/[,\n]/)[0]?.trim() : null) ||
      null;
    const transmissionId = parsedResult?.transmissionId || parsedResult?.id || null;

    // Save invoice to database
    const { data: invoice, error: invoiceError } = await supabase
      .from('peppol_invoices')
      .insert({
        user_id: user.id,
        invoice_number: invoiceData.billName,
        reference_number: invoiceData.referenceNumber || invoiceData.buyerReference || invoiceData.billName,
        document_type: 'INVOICE',
        direction: 'outbound',
        sender_peppol_id: invoiceData.sender?.peppolIdentifier || '',
        sender_name: invoiceData.sender?.name || '',
        sender_vat_number: invoiceData.sender?.vatNumber || '',
        sender_email: invoiceData.sender?.contact?.email || '',
        receiver_peppol_id: invoiceData.receiver.peppolIdentifier,
        receiver_name: invoiceData.receiver.name,
        receiver_vat_number: invoiceData.receiver.vatNumber,
        receiver_email: invoiceData.receiver?.contact?.email || '',
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        delivery_date: invoiceData.deliveryDate,
        payment_terms: invoiceData.paymentTerms || invoiceData.payment?.terms || '',
        buyer_reference: invoiceData.buyerReference || invoiceData.billName,
        subtotal_amount: invoiceData.invoiceLines.reduce((sum, line) => sum + line.taxableAmount, 0),
        tax_amount: invoiceData.invoiceLines.reduce((sum, line) => sum + (line.taxAmount || 0), 0),
        total_amount: invoiceData.invoiceLines.reduce((sum, line) => sum + line.totalAmount, 0),
        currency: 'EUR',
        ubl_xml: xml,
        status: 'sent',
        peppol_message_id: messageId,
        transmission_id: transmissionId,
        sent_at: new Date().toISOString(),
        metadata: {
          response: parsedResult || result,
          payment: invoiceData.payment || {},
          buyerReference: invoiceData.buyerReference || invoiceData.billName || null
        }
      })
      .select('id')
      .single();

    if (invoiceError) throw invoiceError;

    // Save invoice lines
    if (invoice && invoiceData.invoiceLines) {
      const lines = invoiceData.invoiceLines.map((line, index) => ({
        invoice_id: invoice.id,
        line_number: index + 1,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        line_amount: line.taxableAmount,
        tax_category: line.vatCode,
        tax_percentage: line.taxPercentage,
        tax_amount: line.taxAmount,
        total_amount: line.totalAmount
      }));

      const { error: linesError } = await supabase
        .from('peppol_invoice_lines')
        .insert(lines);

      if (linesError) {
        console.error('Failed to save invoice lines:', linesError);
      }
    }

    // Log to audit
    await supabase.from('peppol_audit_log').insert({
      user_id: user.id,
      action_type: 'send_invoice',
      action_description: `Sent invoice ${invoiceData.billName} via Peppol`,
      invoice_id: invoice.id,
      request_data: invoiceData,
      response_data: { messageId, result },
      status: 'success'
    });

    return {
      success: true,
      message: 'Invoice sent and tracked successfully',
      invoiceId: invoice.id,
      messageId
    };

  } catch (error) {
    console.error('Failed to send invoice with tracking:', error);
    
    // Log failed attempt
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('peppol_audit_log').insert({
        user_id: user.id,
        action_type: 'send_invoice',
        action_description: `Failed to send invoice ${invoiceData.billName}`,
        request_data: invoiceData,
        status: 'failed',
        error_message: error.message
      });
    }

    return { success: false, error: error.message };
  }
}

// Export helper for adding to existing service
export const peppolApiExtensions = {
  addDocumentTypeToParticipant,
  removeDocumentTypeFromParticipant,
  getSupportedDocumentTypesForParticipant,
  sendDocument,
  sendUBLDocument,
  getDetailedParticipantInfoPublic,
  getSupportedDocumentTypesPublic,
  validateDocumentPublic,
  sendInvoiceWithTracking
};

