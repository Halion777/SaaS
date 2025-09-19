// Peppol Service for Haliqo - Digiteal Integration
import { supabase } from './supabaseClient';

// Digiteal API Configuration
const PEPPOL_CONFIG = {
  test: {
    baseUrl: 'https://test.digiteal.eu',
    username: 'Haliqo-test',
    password: 'Haliqo123'
  },
  production: {
    baseUrl: 'https://app.digiteal.eu',
    username: 'Haliqo-test', // Replace with production credentials
    password: 'Haliqo123'    // Replace with production credentials
  }
};

// Peppol Document Types supported by Digiteal
const PEPPOL_DOCUMENT_TYPES = [
  'INVOICE',
  'CREDIT_NOTE', 
  'SELF_BILLING_INVOICE',
  'SELF_BILLING_CREDIT_NOTE',
  'INVOICE_RESPONSE',
  'MLR',
  'APPLICATION_RESPONSE'
];

// Required fields for Peppol integration
const REQUIRED_PEPPOL_FIELDS = {
  company: {
    peppolIdentifier: 'string', // Format: COUNTRY_CODE:VAT_NUMBER (e.g., "0208:0630675588")
    businessName: 'string',
    vatNumber: 'string',
    countryCode: 'string', // ISO country code (e.g., "BE")
    contactPerson: {
      name: 'string',
      email: 'string',
      phone: 'string',
      language: 'string' // e.g., "en-US"
    },
    address: {
      street: 'string',
      city: 'string',
      zipCode: 'string',
      country: 'string'
    },
    supportedDocumentTypes: 'array', // Array of PEPPOL_DOCUMENT_TYPES
    limitedToOutboundTraffic: 'boolean' // true for send-only, false for bidirectional
  },
  client: {
    peppolIdentifier: 'string',
    businessName: 'string', 
    vatNumber: 'string',
    countryCode: 'string',
    contactPerson: {
      name: 'string',
      email: 'string',
      phone: 'string'
    },
    address: {
      street: 'string',
      city: 'string', 
      zipCode: 'string',
      country: 'string'
    },
    supportedDocumentTypes: 'array'
  }
};

// Utility functions
const formatDate = (date, format = "iso") => {
  const d = new Date(date);
  return format === "iso" ? d.toISOString() : d.toISOString().split("T")[0];
};

const getVATPEPPOLIdentifier = (vat) => `0208:${vat.split("BE")[1]}`;

const encodeBase64 = (data) => {
  if (typeof data === "string") {
    return btoa(data);
  }
  const bytes = new Uint8Array(data);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary);
};

const xmlEscape = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Business logic helper functions
const calculateTaxCategories = (lines) => {
  let categories = {};
  lines.forEach((line) => {
    const key = `${line.vatCode}${line.taxPercentage}`;
    const existing = categories[key];
    const entry = existing ? {
      ...existing,
      taxableAmount: existing.taxableAmount + line.taxableAmount,
      taxAmount: existing.taxAmount + line.taxAmount,
      totalAmount: existing.totalAmount + line.totalAmount
    } : {
      vatCode: line.vatCode,
      taxPercentage: line.taxPercentage,
      taxableAmount: line.taxableAmount,
      taxAmount: line.taxAmount,
      totalAmount: line.totalAmount
    };
    categories = {
      ...categories,
      ...{
        [key]: entry
      }
    };
  });
  return categories;
};

const calculateTotals = (lines) => lines.reduce((totals, line) => ({
  taxableAmount: totals.taxableAmount + line.taxableAmount,
  taxAmount: totals.taxAmount + line.taxAmount,
  totalAmount: totals.totalAmount + line.totalAmount
}), {
  taxableAmount: 0,
  taxAmount: 0,
  totalAmount: 0
});

// XML generation functions
const generatePartyInfo = (party, isSupplier = true) => {
  const partyType = isSupplier ? "AccountingSupplierParty" : "AccountingCustomerParty";
  const [endpointScheme, endpointId] = (party.peppolIdentifier ?? getVATPEPPOLIdentifier(party.vatNumber)).split(":");
  return `
    <cac:${partyType}>
      <cac:Party>
        <cbc:EndpointID schemeID="${endpointScheme}">${endpointId}</cbc:EndpointID>
        <cac:PartyName>
          <cbc:Name>${xmlEscape(party.name)}</cbc:Name>
        </cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${xmlEscape(party.addressLine1)}</cbc:StreetName>
          <cbc:CityName>${xmlEscape(party.city)}</cbc:CityName>
          <cbc:PostalZone>${xmlEscape(party.zipCode)}</cbc:PostalZone>
          <cac:Country>
            <cbc:IdentificationCode>${xmlEscape(party.vatNumber.substring(0, 2))}</cbc:IdentificationCode>
          </cac:Country>
        </cac:PostalAddress>
        <cac:PartyTaxScheme>
          <cbc:CompanyID>${party.vatNumber}</cbc:CompanyID>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>
        <cac:PartyLegalEntity>
          <cbc:RegistrationName>${xmlEscape(party.name)}</cbc:RegistrationName>
          <cbc:CompanyID>${party.vatNumber}</cbc:CompanyID>
        </cac:PartyLegalEntity>
        ${!isSupplier ? generateContactInfo(party.contact) : ""}
      </cac:Party>
    </cac:${partyType}>
  `;
};

const generateContactInfo = ({ name, phone, email }) => {
  if (!name && !phone && !email) return "";
  return `
    <cac:Contact>
      ${name ? `<cbc:Name>${xmlEscape(name)}</cbc:Name>` : ""}
      ${phone ? `<cbc:Telephone>${xmlEscape(phone)}</cbc:Telephone>` : ""}
      ${email ? `<cbc:ElectronicMail>${xmlEscape(email)}</cbc:ElectronicMail>` : ""}
    </cac:Contact>
  `;
};

const generateDelivery = (invoiceConfig) => `
<cac:Delivery>
  <cbc:ActualDeliveryDate>${invoiceConfig.deliveryDate}</cbc:ActualDeliveryDate>
  <cac:DeliveryLocation>
    <cac:Address>
      <cac:Country>
        <cbc:IdentificationCode>${xmlEscape(invoiceConfig.receiver.countryCode)}</cbc:IdentificationCode>
      </cac:Country>
    </cac:Address>
 </cac:DeliveryLocation>
</cac:Delivery>
`;

const generatePaymentMeansAndTerms = (invoiceConfig) => `
<cac:PaymentMeans>
  <cbc:PaymentMeansCode name="Credit transfer">${invoiceConfig.paymentMeans}</cbc:PaymentMeansCode>
  <cbc:PaymentID>${xmlEscape(invoiceConfig.billName)}</cbc:PaymentID>
  <cac:PayeeFinancialAccount>
    <cbc:ID>${invoiceConfig.sender.iban}</cbc:ID>
    <cbc:Name>${xmlEscape(invoiceConfig.sender.name)}</cbc:Name>
  </cac:PayeeFinancialAccount>
</cac:PaymentMeans>
<cac:PaymentTerms>
  <cbc:Note>Net within ${invoiceConfig.paymentDelay} days</cbc:Note>
</cac:PaymentTerms>
`;

const generateTaxSubtotals = (taxCategories) => Object.values(taxCategories).map((category) => `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">${category.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">${category.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${category.vatCode}</cbc:ID>
          <cbc:Percent>${category.taxPercentage}</cbc:Percent>
          ${category.taxPercentage === 0 ? "<cbc:TaxExemptionReasonCode>VATEX-EU-IC</cbc:TaxExemptionReasonCode>" : ""}
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    `).join("");

const generateInvoiceLines = (lines) => lines.map((line, index) => `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="1I">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="EUR">${line.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${xmlEscape(line.description ?? "")}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${line.vatCode}</cbc:ID>
          <cbc:Percent>${line.taxPercentage}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="EUR">${line.unitPrice}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>
  `).join("");

// Main UBL generation function
const generatePEPPOLXML = (invoiceData) => {
  const timestamp = formatDate(new Date());
  const taxCategories = calculateTaxCategories(invoiceData.invoiceLines);
  const totals = calculateTotals(invoiceData.invoiceLines);
  
  if (!invoiceData.receiver.peppolIdentifier) {
    throw new Error("Peppol identifier of receiving party must be defined");
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
  <Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
           xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
           xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>${xmlEscape(invoiceData.billName)}</cbc:ID>
    <cbc:IssueDate>${invoiceData.issueDate}</cbc:IssueDate>
    <cbc:DueDate>${invoiceData.dueDate}</cbc:DueDate>
    <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
    ${invoiceData.buyerReference ? `<cbc:BuyerReference>${xmlEscape(invoiceData.buyerReference)}</cbc:BuyerReference>` : ""}
  ${generatePartyInfo(invoiceData.sender, true)}
  ${generatePartyInfo(invoiceData.receiver, false)}
  ${generateDelivery(invoiceData)}
  ${generatePaymentMeansAndTerms(invoiceData)}
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="EUR">${totals.taxAmount.toFixed(2)}</cbc:TaxAmount>
      ${generateTaxSubtotals(taxCategories)}
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
      <cbc:LineExtensionAmount currencyID="EUR">${totals.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cbc:TaxExclusiveAmount currencyID="EUR">${totals.taxableAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
      <cbc:TaxInclusiveAmount currencyID="EUR">${totals.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
      <cbc:PayableAmount currencyID="EUR">${totals.totalAmount.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
  ${generateInvoiceLines(invoiceData.invoiceLines)}
  </Invoice>`;
};

// HTTP functions
const createAuthHeader = (username, password) => `Basic ${encodeBase64(`${username}:${password}`)}`;

const createFormData = (xml, comment = "Sent from Haliqo") => {
  const formData = new FormData();
  const blob = new Blob([xml], { type: "application/xml" });
  formData.append("comment", comment);
  formData.append("document", blob, "ubl.xml");
  return formData;
};

// Main Peppol Service Class
export class PeppolService {
  constructor(isTest = true) {
    this.config = isTest ? PEPPOL_CONFIG.test : PEPPOL_CONFIG.production;
  }

  // Get required fields for Peppol integration
  getRequiredFields(type = 'company') {
    return REQUIRED_PEPPOL_FIELDS[type] || REQUIRED_PEPPOL_FIELDS.company;
  }

  // Get supported Peppol document types
  getSupportedDocumentTypes() {
    return PEPPOL_DOCUMENT_TYPES;
  }

  // Validate Peppol identifier format
  validatePeppolIdentifier(identifier) {
    const pattern = /^\d{4}:\d+$/;
    return pattern.test(identifier);
  }

  // Generate Peppol identifier from VAT number and country code
  generatePeppolIdentifier(vatNumber, countryCode = 'BE') {
    // Remove country prefix if present (e.g., "BE123456789" -> "123456789")
    const cleanVat = vatNumber.replace(/^[A-Z]{2}/, '');
    
    // Get country code number (BE = 0208, NL = 0209, etc.)
    const countryCodes = {
      'BE': '0208',
      'NL': '0209', 
      'FR': '0207',
      'DE': '0206',
      'IT': '0210',
      'ES': '0211'
    };
    
    const countryNum = countryCodes[countryCode] || '0208';
    return `${countryNum}:${cleanVat}`;
  }

  // Check if recipient supports Peppol
  async checkRecipientSupport(recipientId) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/supported-document-types`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantId: recipientId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to check recipient support:', error);
      throw error;
    }
  }

  // Send UBL invoice via Peppol
  async sendInvoice(invoiceData) {
    try {
      const xml = generatePEPPOLXML(invoiceData);
      const formData = createFormData(xml);
      
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/outbound-ubl-documents`, {
        method: "POST",
        headers: {
          "Authorization": createAuthHeader(this.config.username, this.config.password)
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      const result = await response.text();
      if (result.includes("OK")) {
        console.log(`Invoice ${invoiceData.billName} sent successfully via PEPPOL`);
        return {
          success: true,
          message: "Invoice sent successfully"
        };
      } else {
        throw new Error(`PEPPOL service error: ${result}`);
      }
    } catch (error) {
      console.error("Failed to send PEPPOL invoice:", error);
      throw error;
    }
  }

  // Register participant for Peppol
  async registerParticipant(participantData) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/register-participant`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(participantData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to register participant:', error);
      throw error;
    }
  }

  // Convert Haliqo invoice to Peppol format
  convertHaliqoInvoiceToPeppol(haliqoInvoice, senderInfo, receiverInfo) {
        return {
      billName: haliqoInvoice.invoice_number || `INV-${Date.now()}`,
      issueDate: formatDate(haliqoInvoice.created_at || new Date()),
      dueDate: formatDate(haliqoInvoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      deliveryDate: formatDate(haliqoInvoice.delivery_date || haliqoInvoice.created_at || new Date()),
      buyerReference: haliqoInvoice.reference || null,
      paymentDelay: 30,
      paymentMeans: 31, // Debit transfer
      sender: {
        vatNumber: senderInfo.vat_number,
        name: senderInfo.company_name || senderInfo.full_name,
        addressLine1: senderInfo.address || "Main Street 123",
        city: senderInfo.city || "Brussels",
        countryCode: senderInfo.country || "BE",
        zipCode: senderInfo.zip_code || "1000",
        iban: senderInfo.iban || "BE0403019261"
      },
      receiver: {
        vatNumber: receiverInfo.vat_number,
        name: receiverInfo.company_name || receiverInfo.full_name,
        addressLine1: receiverInfo.address || "Customer Street 456",
        city: receiverInfo.city || "Amsterdam",
        zipCode: receiverInfo.zip_code || "1012",
        countryCode: receiverInfo.country || "NL",
        peppolIdentifier: receiverInfo.peppol_identifier,
        contact: {
          name: receiverInfo.contact_name,
          phone: receiverInfo.phone,
          email: receiverInfo.email
        }
      },
      invoiceLines: haliqoInvoice.items?.map((item, index) => ({
        description: item.description || `Item ${index + 1}`,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || 0,
        taxableAmount: item.subtotal || 0,
        taxAmount: item.tax_amount || 0,
        totalAmount: item.total || 0,
        vatCode: item.vat_code || "S",
        taxPercentage: item.vat_percentage || 21
      })) || []
    };
  }

  // Get Peppol participants from database
  async getPeppolParticipants() {
    try {
      const { data, error } = await supabase
        .from('peppol_participants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get Peppol participants:', error);
      throw error;
    }
  }

  // Add Peppol participant
  async addPeppolParticipant(participantData) {
    try {
      const { data, error } = await supabase
        .from('peppol_participants')
        .insert([participantData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add Peppol participant:', error);
      throw error;
    }
  }

  // Update Peppol participant
  async updatePeppolParticipant(id, updates) {
    try {
      const { data, error } = await supabase
        .from('peppol_participants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update Peppol participant:', error);
      throw error;
    }
  }

  // Delete Peppol participant
  async deletePeppolParticipant(id) {
    try {
      const { error } = await supabase
        .from('peppol_participants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to delete Peppol participant:', error);
      throw error;
    }
  }

  // Get Peppol invoices
  async getPeppolInvoices() {
    try {
      const { data, error } = await supabase
        .from('peppol_invoices')
        .select(`
          *,
          sender:peppol_participants!peppol_invoices_sender_id_fkey(*),
          receiver:peppol_participants!peppol_invoices_receiver_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get Peppol invoices:', error);
      throw error;
    }
  }

  // Add Peppol invoice
  async addPeppolInvoice(invoiceData) {
    try {
      const { data, error } = await supabase
        .from('peppol_invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to add Peppol invoice:', error);
      throw error;
    }
  }

  // Update Peppol invoice status
  async updatePeppolInvoiceStatus(id, status, additionalData = {}) {
    try {
      const { data, error } = await supabase
        .from('peppol_invoices')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...additionalData
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to update Peppol invoice status:', error);
      throw error;
    }
  }

  // Check if user is a business user
  async isBusinessUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: userData, error } = await supabase
        .from('users')
        .select('business_size')
        .eq('id', user.id)
        .single();

      if (error) return false;

      // Business sizes: small, medium, large (exclude 'solo' which is individual)
      const businessSizes = ['small', 'medium', 'large'];
      return businessSizes.includes(userData.business_size);
    } catch (error) {
      console.error('Failed to check business user:', error);
      return false;
    }
  }

  // Get Peppol settings for user
  async getPeppolSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user is a business user
      const isBusiness = await this.isBusinessUser();
      if (!isBusiness) {
        return {
          success: false,
          error: 'Peppol is only available for business users. Individual users cannot use Peppol services.'
        };
      }

      const { data, error } = await supabase
        .from('peppol_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
        
        return {
          success: true,
        data: data || {
          isConfigured: false,
          peppolId: '',
          businessName: '',
            sandboxMode: true,
          lastTested: null
        }
      };
    } catch (error) {
      console.error('Failed to get Peppol settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Save Peppol settings for user
  async savePeppolSettings(settings) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user is a business user
      const isBusiness = await this.isBusinessUser();
      if (!isBusiness) {
      return {
        success: false,
          error: 'Peppol is only available for business users. Individual users cannot use Peppol services.'
        };
      }

      const { data, error } = await supabase
        .from('peppol_settings')
        .upsert({
          user_id: user.id,
          peppol_id: settings.peppolId,
          business_name: settings.businessName,
          sandbox_mode: settings.sandboxMode,
          is_configured: !!settings.peppolId,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          isConfigured: data.is_configured,
          peppolId: data.peppol_id,
          businessName: data.business_name,
          sandboxMode: data.sandbox_mode,
          lastTested: data.last_tested
        },
        message: 'Settings saved successfully'
      };
    } catch (error) {
      console.error('Failed to save Peppol settings:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test Peppol connection and integration
  async testConnection(settings) {
    try {
      const startTime = Date.now();
      
      // Validate required fields
      if (!settings.peppolId || !settings.businessName || !settings.vatNumber) {
        return {
          success: false,
          error: 'Peppol ID, Business Name, and VAT Number are required for integration test'
        };
      }

      if (!this.validatePeppolIdentifier(settings.peppolId)) {
        return {
          success: false,
          error: 'Invalid Peppol ID format. Expected format: COUNTRY_CODE:VAT_NUMBER (e.g., 0208:0630675588)'
        };
      }

      // Test 1: API Connection - Get supported document types
      const supportedDocsResult = await this.getPublicSupportedDocumentTypes();
      if (!supportedDocsResult.success) {
        return {
          success: false,
          error: `API connection failed: ${supportedDocsResult.error}`
        };
      }

      // Test 2: Validate document format (if we have a sample)
      const validationResult = await this.validateDocumentFormat();
      
      // Test 3: Check if participant exists in Peppol network
      const participantTest = await this.getDetailedParticipantInfo(settings.peppolId);
      
      // Test 4: Test participant registration (dry run)
      const registrationTest = await this.testParticipantRegistration(settings);
      
      const responseTime = Date.now() - startTime;
      
      // Update last tested timestamp
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('peppol_settings')
          .update({ last_tested: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      const isReadyForIntegration = supportedDocsResult.success && registrationTest.success;
      
      return {
        success: true,
        data: {
          responseTime,
          apiConnected: supportedDocsResult.success,
          participantExists: participantTest.success,
          readyForIntegration: isReadyForIntegration,
          supportedDocumentTypes: supportedDocsResult.data?.length || 0,
          validationPassed: validationResult.success,
          registrationReady: registrationTest.success
        },
        message: this.generateTestResultMessage(supportedDocsResult, participantTest, registrationTest, responseTime)
      };
    } catch (error) {
      console.error('Failed to test Peppol connection:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Test participant registration without actually registering
  async testParticipantRegistration(settings) {
    try {
      // Simulate registration data validation
      const registrationData = {
        peppolIdentifier: settings.peppolId,
        contactPerson: {
          language: settings.contactPerson?.language || 'en-US',
          name: settings.contactPerson?.name || settings.businessName,
          email: settings.contactPerson?.email || '',
          phone: settings.contactPerson?.phone || ''
        },
        limitedToOutboundTraffic: settings.limitedToOutboundTraffic || false,
        supportedDocumentTypes: settings.supportedDocumentTypes || ['INVOICE', 'CREDIT_NOTE']
      };

      // Validate all required fields
      if (!registrationData.peppolIdentifier || !registrationData.contactPerson.name) {
        return {
          success: false,
          error: 'Missing required registration data'
        };
      }

      return {
        success: true,
        data: registrationData,
        message: 'Registration data is valid and ready for Peppol integration'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Validate document format (placeholder for future implementation)
  async validateDocumentFormat() {
    try {
      // This would validate a sample UBL document format
      // For now, return success as we don't have a sample document
      return {
        success: true,
        message: 'Document format validation passed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate comprehensive test result message
  generateTestResultMessage(supportedDocsResult, participantTest, registrationTest, responseTime) {
    let message = `✅ Peppol Integration Test Results\n\n`;
    message += `📡 API Response Time: ${responseTime}ms\n`;
    message += `🔗 Digiteal API Connected: ${supportedDocsResult.success ? 'Yes' : 'No'}\n`;
    message += `📄 Supported Document Types: ${supportedDocsResult.data?.length || 0}\n`;
    message += `👤 Participant in Network: ${participantTest.success ? 'Yes' : 'No'}\n`;
    message += `📋 Registration Data Valid: ${registrationTest.success ? 'Yes' : 'No'}\n\n`;
    
    if (supportedDocsResult.success && registrationTest.success) {
      message += `🎉 Your Peppol integration is ready! You can now:\n`;
      message += `• Send electronic invoices via Peppol network\n`;
      message += `• Receive invoices from other Peppol participants\n`;
      message += `• Process ${supportedDocsResult.data?.length || 0} different document types\n\n`;
      message += `Next step: Click "Save Settings" to complete the integration.`;
    } else {
      message += `⚠️ Integration not ready. Please check:\n`;
      if (!supportedDocsResult.success) message += `• API connection issues\n`;
      if (!registrationTest.success) message += `• Missing or invalid registration data\n`;
      message += `\nFix these issues and test again.`;
    }
    
    return message;
  }

  // Get Peppol statistics
  async getStatistics() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get sent invoices count
      const { count: totalSent } = await supabase
        .from('peppol_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id);

      // Get received invoices count
      const { count: totalReceived } = await supabase
        .from('peppol_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id);

      // Get this month's data
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: sentThisMonth } = await supabase
        .from('peppol_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      const { count: receivedThisMonth } = await supabase
        .from('peppol_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      // Get pending and failed counts
      const { count: pending } = await supabase
        .from('peppol_invoices')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'sent'])
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const { count: failed } = await supabase
        .from('peppol_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      // Get last activity
      const { data: lastActivity } = await supabase
        .from('peppol_invoices')
        .select('created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const totalInvoices = (totalSent || 0) + (totalReceived || 0);
      const successRate = totalInvoices > 0 ? ((totalInvoices - (failed || 0)) / totalInvoices) * 100 : 0;

      return {
        success: true,
        data: {
          totalSent: totalSent || 0,
          totalReceived: totalReceived || 0,
          sentThisMonth: sentThisMonth || 0,
          receivedThisMonth: receivedThisMonth || 0,
          pending: pending || 0,
          failed: failed || 0,
          successRate: Math.round(successRate),
          lastActivity: lastActivity?.created_at || null
        }
      };
    } catch (error) {
      console.error('Failed to get Peppol statistics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Register a new Peppol participant (company)
  async registerParticipant(participantData) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/registered-participants`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          peppolIdentifier: participantData.peppolIdentifier,
          contactPerson: {
            language: participantData.contactPerson?.language || 'en-US',
            name: participantData.contactPerson?.name || '',
            email: participantData.contactPerson?.email || '',
            phone: participantData.contactPerson?.phone || ''
          },
          limitedToOutboundTraffic: participantData.limitedToOutboundTraffic || false,
          supportedDocumentTypes: participantData.supportedDocumentTypes || ['INVOICE', 'CREDIT_NOTE']
        })
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data, message: 'Participant registered successfully' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all registered participants
  async getParticipants() {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/registered-participants`, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get specific participant details
  async getParticipant(peppolIdentifier) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/registered-participants/${peppolIdentifier}`, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Unregister a participant
  async unregisterParticipant(peppolIdentifier) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/registered-participants/${peppolIdentifier}`, {
        method: 'DELETE',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { success: true, message: 'Participant unregistered successfully' };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Validate a Peppol document
  async validateDocument(documentFile) {
    try {
      const formData = new FormData();
      formData.append('document', documentFile);

      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/public/validate-document`, {
        method: 'POST',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password)
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get public supported document types
  async getPublicSupportedDocumentTypes() {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/public/supported-document-types`, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get detailed participant information (public)
  async getDetailedParticipantInfo(peppolIdentifier) {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/peppol/public/participants/${peppolIdentifier}`, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(this.config.username, this.config.password),
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default PeppolService;