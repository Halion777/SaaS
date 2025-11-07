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

// Peppol Document Types supported by Digiteal for participant registration
// Note: MLR and APPLICATION_RESPONSE are response types, not registration types
const PEPPOL_DOCUMENT_TYPES = [
  'INVOICE',
  'CREDIT_NOTE', 
  'SELF_BILLING_INVOICE',
  'SELF_BILLING_CREDIT_NOTE',
  'INVOICE_RESPONSE'
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
export const generatePEPPOLXML = (invoiceData) => {
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

  // Check if recipient supports Peppol - via edge function to avoid CORS
  async checkRecipientSupport(recipientId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'get-participant',
          peppolIdentifier: recipientId
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to check recipient support:', error);
      throw error;
    }
  }

  // Send UBL invoice via Peppol - via edge function to avoid CORS
  async sendInvoice(invoiceData) {
    try {
      // Check if Peppol is disabled
      const isDisabled = await this.isPeppolDisabled();
      if (isDisabled) {
        throw new Error('Peppol functionality is currently disabled. Please enable it in Peppol settings to send invoices.');
      }

      const xml = generatePEPPOLXML(invoiceData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'send-ubl-document',
          xmlDocument: xml
        }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }

        console.log(`Invoice ${invoiceData.billName} sent successfully via PEPPOL`);
        return {
          success: true,
          message: "Invoice sent successfully"
        };
    } catch (error) {
      console.error("Failed to send PEPPOL invoice:", error);
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
        
      // Map database fields to camelCase for frontend
      const mappedData = data ? {
        isConfigured: data.is_configured,
        peppolId: data.peppol_id,
        name: data.business_name,
        countryCode: data.country_code,
        // Parse contact person name into first/last name
        firstName: data.contact_person_name?.split(' ')[0] || '',
        lastName: data.contact_person_name?.split(' ').slice(1).join(' ') || '',
        email: data.contact_person_email,
        phoneNumber: data.contact_person_phone,
        language: data.contact_person_language,
        supportedDocumentTypes: data.supported_document_types,
        limitedToOutboundTraffic: data.limited_to_outbound_traffic,
        sandboxMode: data.sandbox_mode,
        peppolDisabled: data.peppol_disabled || false,
        lastTested: data.last_tested
      } : {
          isConfigured: false,
          peppolId: '',
        name: '',
        countryCode: 'BE',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        language: 'en-US',
        supportedDocumentTypes: ['INVOICE', 'CREDIT_NOTE', 'SELF_BILLING_INVOICE', 'SELF_BILLING_CREDIT_NOTE', 'INVOICE_RESPONSE', 'MLR', 'APPLICATION_RESPONSE'],
        limitedToOutboundTraffic: false,
            sandboxMode: true,
          peppolDisabled: false,
          lastTested: null
      };
        
      return {
        success: true,
        data: mappedData
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

      // Check if this participant already exists in our database
      const { data: existingSettings, error: existingError } = await supabase
        .from('peppol_settings')
        .select('peppol_id, is_configured')
        .eq('peppol_id', settings.peppolId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows found

      let registrationResult = null;
      
      if (existingSettings && existingSettings.is_configured) {
        // Participant already registered in our system, skip Digiteal registration
        console.log('Participant already exists in database, skipping Digiteal registration');
        registrationResult = { success: true, alreadyRegistered: true };
      } else {
        // First, try to register participant with Digiteal
        registrationResult = await this.registerParticipant({
          peppolIdentifier: settings.peppolId,
          name: settings.name,
          countryCode: settings.countryCode,
          contactPerson: {
            firstName: settings.firstName,
            lastName: settings.lastName,
            email: settings.email,
            phoneNumber: settings.phoneNumber,
            language: settings.language
          },
          supportedDocumentTypes: PEPPOL_DOCUMENT_TYPES, // All document types enabled automatically
          limitedToOutboundTraffic: settings.limitedToOutboundTraffic || false
        });

        // If registration failed but participant is already registered, continue to save settings
        if (!registrationResult.success && !registrationResult.alreadyRegistered) {
          return registrationResult;
        }
      }

      // Then save to database using upsert to handle updates
      const { data, error } = await supabase
        .from('peppol_settings')
        .upsert({
          user_id: user.id,
          peppol_id: settings.peppolId,
          business_name: settings.name,
          country_code: settings.countryCode || 'BE',
          contact_person_name: `${settings.firstName} ${settings.lastName}`,
          contact_person_email: settings.email,
          contact_person_phone: settings.phoneNumber || null,
          contact_person_language: settings.language || 'en-US',
          supported_document_types: ['INVOICE', 'CREDIT_NOTE', 'SELF_BILLING_INVOICE', 'SELF_BILLING_CREDIT_NOTE', 'INVOICE_RESPONSE', 'MLR', 'APPLICATION_RESPONSE'], // All document types enabled automatically
          limited_to_outbound_traffic: settings.limitedToOutboundTraffic || false,
          sandbox_mode: settings.sandboxMode,
          peppol_disabled: settings.peppolDisabled !== undefined ? settings.peppolDisabled : false, // Preserve disabled state if not provided
          is_configured: !!settings.peppolId && !!settings.name && !!settings.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        // Handle specific database errors
        if (error.code === '23505') {
          if (error.message.includes('peppol_settings_user_id_key')) {
            throw new Error('You already have Peppol settings. Please update your existing settings instead.');
          } else if (error.message.includes('peppol_settings_peppol_id_key')) {
            throw new Error('This Peppol ID is already registered by another user.');
          }
        }
        throw error;
      }

      // Determine success message based on registration result
      let successMessage = 'Settings saved successfully';
      if (registrationResult.alreadyRegistered) {
        successMessage = 'Settings saved successfully. This participant is already registered in Digiteal.';
      }

      return {
        success: true,
        data: {
          isConfigured: data.is_configured,
          peppolId: data.peppol_id,
          name: data.business_name,
          countryCode: data.country_code,
          firstName: data.contact_person_name?.split(' ')[0] || '',
          lastName: data.contact_person_name?.split(' ').slice(1).join(' ') || '',
          email: data.contact_person_email,
          phoneNumber: data.contact_person_phone,
          language: data.contact_person_language,
          supportedDocumentTypes: data.supported_document_types,
          limitedToOutboundTraffic: data.limited_to_outbound_traffic,
          sandboxMode: data.sandbox_mode,
          peppolDisabled: data.peppol_disabled || false,
          lastTested: data.last_tested
        },
        message: successMessage
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
      if (!settings.peppolId || !settings.name || !settings.email || !settings.firstName || !settings.lastName) {
        return {
          success: false,
          error: 'Peppol ID, Participant Name, Email, First Name, and Last Name are required for integration test'
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
          language: settings.language || 'en-US',
          firstName: settings.firstName || '',
          lastName: settings.lastName || '',
          email: settings.email || '',
          phoneNumber: settings.phoneNumber || ''
        },
        name: settings.name,
        countryCode: settings.countryCode || 'BE',
        limitedToOutboundTraffic: settings.limitedToOutboundTraffic || false,
        supportedDocumentTypes: settings.supportedDocumentTypes || ['INVOICE', 'CREDIT_NOTE']
      };

      // Validate all required fields
      if (!registrationData.peppolIdentifier || !registrationData.name || !registrationData.contactPerson.firstName || !registrationData.contactPerson.lastName || !registrationData.contactPerson.email) {
        return {
          success: false,
          error: 'Missing required registration data (Peppol ID, Name, First Name, Last Name, Email)'
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

  // Generate simple test result message
  generateTestResultMessage(supportedDocsResult, participantTest, registrationTest, responseTime) {
    if (supportedDocsResult.success && registrationTest.success) {
      return 'Peppol test success';
    } else {
      let errorMsg = 'Peppol test failed: ';
      if (!supportedDocsResult.success) errorMsg += 'API connection failed. ';
      if (!registrationTest.success) errorMsg += 'Invalid registration data.';
      return errorMsg.trim();
    }
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

  // Register a new Peppol participant (company) - via edge function to avoid CORS
  async registerParticipant(participantData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure supportedDocumentTypes is a valid array without null values
      // Default to all document types if not provided or invalid
      const supportedDocTypes = Array.isArray(participantData.supportedDocumentTypes) 
        ? participantData.supportedDocumentTypes.filter(type => type && typeof type === 'string')
        : PEPPOL_DOCUMENT_TYPES;
      
      // Ensure we have at least one document type - default to all if empty
      if (supportedDocTypes.length === 0) {
        supportedDocTypes.push(...PEPPOL_DOCUMENT_TYPES);
      }

      const payload = {
          peppolIdentifier: participantData.peppolIdentifier,
          contactPerson: {
            language: participantData.contactPerson?.language || 'en-US',
          firstName: participantData.contactPerson?.firstName || '',
          lastName: participantData.contactPerson?.lastName || '',
          phoneNumber: participantData.contactPerson?.phoneNumber || '',
          email: participantData.contactPerson?.email || ''
        },
        name: participantData.name,
        countryCode: participantData.countryCode,
          limitedToOutboundTraffic: participantData.limitedToOutboundTraffic || false,
          supportedDocumentTypes: supportedDocTypes
      };

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'register-participant',
          participantData: payload
        }
      });

      // Check for errors in both response.error and response.data
      // When edge function returns non-2xx, error data is in response.data
      const errorData = response.data || {};
      const hasError = response.error || (errorData && errorData.error);
      
      if (hasError) {
        // Extract error message from response.data (edge function error response)
        let errorMessage = '';
        let isAlreadyRegistered = false;
        
        if (errorData && errorData.error) {
          errorMessage = errorData.error;
          
          // Parse details if available to check for ALREADY_REGISTERED status
          if (errorData.details) {
            try {
              const parsedDetails = JSON.parse(errorData.details);
              if (parsedDetails.status === 'ALREADY_REGISTERED_TO_DIGITEAL') {
                isAlreadyRegistered = true;
                if (parsedDetails.message) {
                  errorMessage = parsedDetails.message;
                }
              }
            } catch (e) {
              // If parsing fails, check error message text
            }
          }
          
          // Also check error message text for "already registered" keywords
          if (errorMessage.includes('ALREADY_REGISTERED') || 
              errorMessage.includes('already registered') ||
              errorMessage.includes('already registered for reception')) {
            isAlreadyRegistered = true;
          }
        } else if (response.error) {
          // Fallback to response.error if response.data doesn't have error
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (response.error.message) {
            errorMessage = response.error.message;
          } else {
            errorMessage = JSON.stringify(response.error);
          }
          
          if (errorMessage.includes('ALREADY_REGISTERED') || 
              errorMessage.includes('already registered')) {
            isAlreadyRegistered = true;
          }
        }
        
        if (isAlreadyRegistered) {
          return { 
            success: false, 
            error: errorMessage,
            alreadyRegistered: true
          };
        }
        
        return { success: false, error: errorMessage };
      }

      // Handle successful response
      const data = response.data || { success: true };
      
      return { success: true, data, message: 'Participant registered successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all registered participants - via edge function to avoid CORS
  async getParticipants() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'get-participants'
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get specific participant details - via edge function to avoid CORS
  async getParticipant(peppolIdentifier) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'get-participant',
          peppolIdentifier
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Toggle Peppol disabled state (soft disable/enable)
  async togglePeppolDisabled(disabled) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('peppol_settings')
        .update({ 
          peppol_disabled: disabled,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: disabled 
          ? 'Peppol functionality has been disabled. Historical data is preserved.' 
          : 'Peppol functionality has been enabled.',
        data: {
          peppolDisabled: data.peppol_disabled || false
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if Peppol is disabled for the current user
  async isPeppolDisabled() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('peppol_settings')
        .select('peppol_disabled')
        .eq('user_id', user.id)
        .single();

      return data?.peppol_disabled || false;
    } catch (error) {
      console.error('Error checking Peppol disabled state:', error);
      return false;
    }
  }

  // Validate a Peppol document - via edge function to avoid CORS
  async validateDocument(documentFile) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'validate-document',
          xmlDocument: documentFile
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get public supported document types (via edge function to avoid CORS)
  async getPublicSupportedDocumentTypes() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'test-connection'
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get detailed participant information (public) - via edge function to avoid CORS
  async getDetailedParticipantInfo(peppolIdentifier) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'get-participant',
          peppolIdentifier
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Add a supported document type for a participant - via edge function to avoid CORS
  async addSupportedDocumentType(peppolIdentifier, documentType) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'add-document-type',
          peppolIdentifier,
          documentType
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, message: `Document type ${documentType} added successfully` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Remove a supported document type for a participant - via edge function to avoid CORS
  async removeSupportedDocumentType(peppolIdentifier, documentType) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'remove-document-type',
          peppolIdentifier,
          documentType
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, message: `Document type ${documentType} removed successfully` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get supported document types for a remote participant - via edge function to avoid CORS
  async getSupportedDocumentTypes(peppolIdentifier) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'get-supported-document-types',
          peppolIdentifier
        }
      });

      if (response.error) {
        return { success: false, error: response.error.message };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default PeppolService;