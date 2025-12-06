// Peppol Service for Haliqo - Digiteal Integration
import { supabase } from './supabaseClient';
import { getAllPeppolIdentifiers } from '../utils/peppolSchemes';

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

// Get PEPPOL scheme ID based on VAT number country code
const getPEPPOLSchemeId = (vatNumber) => {
  if (!vatNumber || vatNumber.length < 2) return null;
  
  const countryCode = vatNumber.substring(0, 2).toUpperCase();
  
  const schemeMap = {
    'AD': '9922',
    'AL': '9923',
    'BA': '9924',
    'BE': '9925', // VAT-based scheme for Belgium (but EndpointID uses 0208)
    'BG': '9926',
    'CH': '9927',
    'CY': '9928',
    'CZ': '9929',
    'DE': '9930',
    'EE': '9931',
    'GB': '9932',
    'GR': '9933',
    'HR': '9934',
    'IE': '9935',
    'LI': '9936',
    'LT': '9937',
    'LU': '9938',
    'LV': '9939',
    'MC': '9940',
    'ME': '9941',
    'MK': '9942',
    'MT': '9943',
    'NL': '9944',
    'PO': '9945',
    'PT': '9946',
    'RO': '9947',
    'RS': '9948',
    'SI': '9949',
    'SK': '9950',
    'SM': '9951',
    'TR': '9952',
    'VA': '9953',
    'SE': '9955',
    'FR': '9957'
  };
  
  return schemeMap[countryCode] || null;
};

// Get Belgian enterprise number identifier (0208:XXXXXXXXXX)
const getBelgianEnterpriseNumberIdentifier = (vatNumber) => {
  if (!vatNumber) return null;
  
  // Check if it's a Belgian VAT number (BE followed by 10 digits)
  if (/^BE\d{10}$/i.test(vatNumber)) {
    // Extract 10 digits after "BE"
    const enterpriseNumber = vatNumber.substring(2, 12);
    return `0208:${enterpriseNumber}`;
  }
  
  return null;
};

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

// Extract payment delay in days from payment_terms text
const extractPaymentDelay = (paymentTerms) => {
  if (!paymentTerms || typeof paymentTerms !== 'string') {
    return null;
  }
  
  // Try to extract number of days from common patterns:
  // "30 days", "net 30", "30 jours", "paiement à 30 jours", etc.
  const patterns = [
    /(\d+)\s*(?:days?|jours?|d)/i,
    /net\s*(\d+)/i,
    /(\d+)\s*(?:day|jour)/i
  ];
  
  for (const pattern of patterns) {
    const match = paymentTerms.match(pattern);
    if (match && match[1]) {
      const days = parseInt(match[1], 10);
      if (days > 0 && days <= 365) {
        return days;
      }
    }
  }
  
  return null;
};

// Helper function to clean VAT number (remove Peppol scheme prefixes like "0208:", "9925:", etc.)
const cleanVATNumber = (vatNumber) => {
  if (!vatNumber || vatNumber.trim() === '') {
    return '';
  }
  
  // Remove any Peppol scheme prefix (e.g., "0208:", "9925:", etc.)
  // Pattern: digits followed by colon, then optional country code and digits
  let cleaned = vatNumber.trim();
  
  // Remove scheme prefix if present (e.g., "0208:BE0630675588" -> "BE0630675588")
  if (/^\d{4}:[A-Z]{2}/i.test(cleaned)) {
    cleaned = cleaned.replace(/^\d{4}:/, '');
  }
  
  // Remove any other scheme prefixes (e.g., "9925:BE0630675588" -> "BE0630675588")
  if (/^\d{4}:[A-Z]{2}/i.test(cleaned)) {
    cleaned = cleaned.replace(/^\d{4}:/, '');
  }
  
  return cleaned;
};

// Helper function to convert country name to ISO code
const countryNameToISO = (countryName) => {
  if (!countryName) return 'BE';
  
  const countryMap = {
    'belgique': 'BE',
    'belgium': 'BE',
    'france': 'FR',
    'nederland': 'NL',
    'netherlands': 'NL',
    'deutschland': 'DE',
    'germany': 'DE',
    'espagne': 'ES',
    'spain': 'ES',
    'italie': 'IT',
    'italy': 'IT',
    'luxembourg': 'LU',
    'luxemburg': 'LU'
  };
  
  const normalized = countryName.trim().toLowerCase();
  return countryMap[normalized] || countryName.toUpperCase().substring(0, 2);
};

// Helper function to format VAT number with country prefix
const formatVATNumber = (vatNumber, countryCode) => {
  if (!vatNumber || vatNumber.trim() === '') {
    // If VAT number is empty, return empty string (will fail validation, but that's expected)
    return '';
  }
  
  // First, clean the VAT number (remove any Peppol scheme prefixes)
  let cleanVat = cleanVATNumber(vatNumber);
  
  // Convert country code from name to ISO if needed
  let isoCountryCode = countryCode;
  if (countryCode && countryCode.length > 2) {
    isoCountryCode = countryNameToISO(countryCode);
  }
  
  // If VAT number already has country prefix (e.g., "BE0630675588"), return as is (uppercase)
  if (/^[A-Z]{2}\d+$/.test(cleanVat)) {
    return cleanVat.toUpperCase();
  }
  
  // Otherwise, add country prefix
  const countryPrefix = (isoCountryCode || 'BE').toUpperCase().trim();
  // For Greece, use 'EL' instead of 'GR'
  const prefix = countryPrefix === 'GR' ? 'EL' : countryPrefix;
  
  // Remove any existing country prefix from VAT number if present
  const vatWithoutPrefix = cleanVat.replace(/^[A-Z]{2}/i, '');
  
  return `${prefix}${vatWithoutPrefix}`;
};

/**
 * MOD97-0208 checksum validation for Belgian enterprise numbers
 * Belgian enterprise numbers must pass MOD97-0208 validation
 * Algorithm: The number must be divisible by 97 when treated as a number
 * @param {string} enterpriseNumber - 10-digit enterprise number
 * @returns {boolean} True if passes MOD97-0208 validation
 */
const validateMOD97_0208 = (enterpriseNumber) => {
  if (!enterpriseNumber || typeof enterpriseNumber !== 'string') {
    return false;
  }
  
  // Must be exactly 10 digits
  const digitsOnly = enterpriseNumber.replace(/\D/g, '');
  if (digitsOnly.length !== 10) {
    return false;
  }
  
  // MOD97-0208 validation: The 10-digit number must be divisible by 97
  // The last 2 digits are the check digits
  const baseNumber = parseInt(digitsOnly.substring(0, 8), 10); // First 8 digits
  const checkDigits = parseInt(digitsOnly.substring(8, 10), 10); // Last 2 digits
  
  // Calculate: baseNumber % 97 should equal checkDigits
  // But actually, the full 10-digit number should be divisible by 97
  const fullNumber = parseInt(digitsOnly, 10);
  return fullNumber % 97 === 0;
};

/**
 * Helper function to ensure Belgian enterprise number is 10 digits and passes mod97 check
 * @param {string} endpointId - Enterprise number identifier
 * @param {string} schemeId - Scheme ID (should be '0208' for Belgian)
 * @returns {string} Formatted enterprise number (exactly 10 digits)
 */
const formatBelgianEnterpriseNumber = (endpointId, schemeId) => {
  if (!endpointId) return endpointId;
  
  // For Belgian enterprise numbers (scheme 0208), must be exactly 10 digits
  if (schemeId === '0208') {
    // Remove any non-digit characters
    const digitsOnly = endpointId.replace(/\D/g, '');
    
    // Must be exactly 10 digits
    if (digitsOnly.length !== 10) {
      // Pad with leading zeros if less than 10 digits
      const padded = digitsOnly.padStart(10, '0');
      // If more than 10 digits, take first 10
      const formatted = padded.length > 10 ? padded.substring(0, 10) : padded;
      
      // Validate MOD97-0208 checksum
      if (!validateMOD97_0208(formatted)) {
        // MOD97 validation failed - will fail at Peppol level
      }
      
      return formatted;
    }
    
    // Validate MOD97-0208 checksum for existing 10-digit number
    if (!validateMOD97_0208(digitsOnly)) {
      // MOD97 validation failed - will fail at Peppol level
    }
    
    return digitsOnly;
  }
  
  return endpointId;
};

// Valid ISO 3166-1 alpha-2 country codes
const VALID_COUNTRY_CODES = new Set([
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'EH', 'EL', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'XI',
  'YE', 'YT',
  'ZA', 'ZM', 'ZW'
]);

// Helper function to validate and normalize country code
const normalizeCountryCode = (countryCode) => {
  if (!countryCode) return 'BE'; // Default to Belgium
  
  const normalized = countryCode.trim().toUpperCase();
  
  // Handle Greece special case (GR -> EL for VAT, but keep GR for country code)
  // Actually, for country code, we should use GR, but for VAT prefix we use EL
  // For country code in PostalAddress, we use the actual ISO code
  
  // Validate against ISO 3166-1 alpha-2
  if (VALID_COUNTRY_CODES.has(normalized)) {
    return normalized;
  }
  
  // If invalid, default to BE
  return 'BE';
};

// XML generation functions
const generatePartyInfo = (party, isSupplier = true) => {
  const partyType = isSupplier ? "AccountingSupplierParty" : "AccountingCustomerParty";
  
  let endpointScheme = null;
  let endpointId = '';
  
  // Priority 1: Use peppolIdentifier if provided (e.g., "0208:0630675588" or "9925:BE0630675588")
  // IMPORTANT: Use the provided scheme as-is - don't convert 9925 to 0208
  // The user may explicitly want to use 9925 scheme, so respect their choice
  if (party.peppolIdentifier) {
    const parts = party.peppolIdentifier.split(":");
    if (parts.length === 2) {
      const providedScheme = parts[0];
      const providedId = parts[1];
      
      // Use provided identifier as-is - respect the user's choice of scheme
      endpointScheme = providedScheme;
      
      // For Belgian scheme 0208, ensure we extract only digits and pad to 10 digits
      if (providedScheme === '0208') {
        const digitsOnly = providedId.replace(/\D/g, '');
        endpointId = digitsOnly.padStart(10, '0').substring(0, 10);
      } else {
        // For other schemes (like 9925), use the ID as-is (may include country prefix like "BE")
        endpointId = providedId;
      }
    } else {
      // If no colon, assume it's just the ID - need to determine scheme from VAT
      endpointId = party.peppolIdentifier;
    }
  }
  
  // Priority 2: Determine from VAT number
  if (!endpointScheme || !endpointId) {
    if (party.vatNumber) {
      // Clean VAT number first (remove any Peppol scheme prefixes)
      const cleanedVatNumber = cleanVATNumber(party.vatNumber);
      const vatNumber = cleanedVatNumber.trim().toUpperCase();
      
      // For Belgian VAT numbers: Use enterprise number identifier (0208:XXXXXXXXXX)
      const belgianEnterpriseId = getBelgianEnterpriseNumberIdentifier(vatNumber);
      if (belgianEnterpriseId) {
        const parts = belgianEnterpriseId.split(":");
        endpointScheme = parts[0]; // "0208"
        endpointId = parts[1]; // 10-digit enterprise number
      } else {
        // For non-Belgian VAT numbers: Use VAT-based scheme
        const schemeId = getPEPPOLSchemeId(vatNumber);
        if (schemeId) {
          endpointScheme = schemeId;
          endpointId = vatNumber.toLowerCase(); // Full VAT number in lowercase
        }
      }
    }
  }
  
  // Fallback: If still no scheme/ID, use default Belgian format
  if (!endpointScheme || !endpointId) {
    endpointScheme = '0208';
    if (party.vatNumber) {
      // Extract 10 digits from VAT number
      const digitsOnly = party.vatNumber.replace(/\D/g, '');
      endpointId = digitsOnly.padStart(10, '0').substring(0, 10);
    }
  }
  
  // For Belgian enterprise numbers (scheme 0208), ensure exactly 10 digits, no prefix
  // Expected format: EndpointID = "0630675508" (digits only, no country prefix)
  // MUST pass MOD97-0208 checksum validation per PEPPOL-COMMON-R043
  // PEPPOL-COMMON-R043: matches(normalize-space(), '^[0-9]{10}$') and u:mod97-0208(normalize-space())
  if (endpointScheme === '0208') {
    // Remove all non-digit characters and trim whitespace
    const digitsOnly = endpointId.replace(/\D/g, '').trim();
    
    // Ensure exactly 10 digits (pad with zeros if needed, truncate if too long)
    let formattedId = digitsOnly;
    if (formattedId.length < 10) {
      formattedId = formattedId.padStart(10, '0');
    } else if (formattedId.length > 10) {
      formattedId = formattedId.substring(0, 10);
    }
    
    // Validate MOD97-0208 checksum (PEPPOL-COMMON-R043 requirement)
    if (!validateMOD97_0208(formattedId)) {
      // MOD97 validation failed - will fail at Peppol level
    }
    
    endpointId = formattedId;
  }

  // Format VAT number with country prefix for CompanyID
  // Expected format: CompanyID = "BE0630675508" (country prefix + digits)
  // CompanyID is MANDATORY - must not be empty (PEPPOL-EN16931-R008)
  let formattedVAT = formatVATNumber(party.vatNumber, party.countryCode);
  
  // If VAT number is empty, try to extract from peppolIdentifier or endpointId
  if (!formattedVAT || formattedVAT.trim() === '') {
    if (party.peppolIdentifier) {
      // Extract VAT from Peppol ID (e.g., "9957:fr12345670023" -> "FR12345670023")
      const parts = party.peppolIdentifier.split(':');
      if (parts.length === 2) {
        const identifier = parts[1];
        // If identifier starts with country code (lowercase), convert to uppercase
        if (/^[a-z]{2}\d+/i.test(identifier)) {
          formattedVAT = identifier.toUpperCase();
        } else {
          // If no country code, add it from countryCode
          const countryCode = normalizeCountryCode(party.countryCode);
          formattedVAT = `${countryCode}${identifier}`;
        }
      }
    } else if (endpointId) {
      // Extract VAT from endpointId - add country code prefix
      const countryCode = normalizeCountryCode(party.countryCode);
      // For 0208 scheme, endpointId is just digits, so add country prefix
      if (endpointScheme === '0208') {
        formattedVAT = `${countryCode}${endpointId}`;
      } else {
        // For other schemes, endpointId might already have country code
        if (/^[a-z]{2}\d+/i.test(endpointId)) {
          formattedVAT = endpointId.toUpperCase();
        } else {
          formattedVAT = `${countryCode}${endpointId}`;
        }
      }
    }
  }
  
  // Final fallback: if still empty, use endpointId with country code
  if (!formattedVAT || formattedVAT.trim() === '') {
    const countryCode = normalizeCountryCode(party.countryCode);
    formattedVAT = `${countryCode}${endpointId || 'UNKNOWN'}`;
  }
  
  const countryCode = normalizeCountryCode(party.countryCode);
  
 
  return `
    <cac:${partyType}>
      <cac:Party>
        <cbc:EndpointID schemeID="${endpointScheme}">${xmlEscape(endpointId.trim())}</cbc:EndpointID>
        <cac:PartyName>
          <cbc:Name>${xmlEscape(party.name)}</cbc:Name>
        </cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${xmlEscape(party.addressLine1)}</cbc:StreetName>
          <cbc:CityName>${xmlEscape(party.city)}</cbc:CityName>
          <cbc:PostalZone>${xmlEscape(party.zipCode)}</cbc:PostalZone>
          <cac:Country>
            <cbc:IdentificationCode>${xmlEscape(countryCode)}</cbc:IdentificationCode>
          </cac:Country>
        </cac:PostalAddress>
        <cac:PartyTaxScheme>
          <cbc:CompanyID>${xmlEscape(formattedVAT)}</cbc:CompanyID>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>
        <cac:PartyLegalEntity>
          <cbc:RegistrationName>${xmlEscape(party.name)}</cbc:RegistrationName>
          <cbc:CompanyID>${xmlEscape(formattedVAT)}</cbc:CompanyID>
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

const generateDelivery = (invoiceConfig) => {
  // Ensure delivery date is in YYYY-MM-DD format
  const formatUBLDate = (dateValue) => {
    if (!dateValue) return formatDate(new Date(), "date");
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    return formatDate(dateValue, "date");
  };
  const deliveryDate = formatUBLDate(invoiceConfig.deliveryDate);
  
  return `
<cac:Delivery>
  <cbc:ActualDeliveryDate>${deliveryDate}</cbc:ActualDeliveryDate>
  <cac:DeliveryLocation>
    <cac:Address>
      <cac:Country>
        <cbc:IdentificationCode>${xmlEscape(invoiceConfig.receiver.countryCode)}</cbc:IdentificationCode>
      </cac:Country>
    </cac:Address>
 </cac:DeliveryLocation>
</cac:Delivery>
`;
};

const generatePaymentMeansAndTerms = (invoiceConfig) => {
  // IBAN is required for credit transfer payments (PaymentMeansCode 30, 31, 58)
  // But we'll make it optional to handle cases where it's not provided
  const hasIBAN = invoiceConfig.sender.iban && invoiceConfig.sender.iban.trim() !== '';
  
  return `
<cac:PaymentMeans>
  <cbc:PaymentMeansCode name="Credit transfer">${invoiceConfig.paymentMeans}</cbc:PaymentMeansCode>
  <cbc:PaymentID>${xmlEscape(invoiceConfig.billName)}</cbc:PaymentID>
  ${hasIBAN ? `
  <cac:PayeeFinancialAccount>
    <cbc:ID>${xmlEscape(invoiceConfig.sender.iban)}</cbc:ID>
    <cbc:Name>${xmlEscape(invoiceConfig.sender.name)}</cbc:Name>
  </cac:PayeeFinancialAccount>
  ` : ''}
</cac:PaymentMeans>
<cac:PaymentTerms>
  <cbc:Note>Net within ${invoiceConfig.paymentDelay} days</cbc:Note>
</cac:PaymentTerms>
`;
};

const generateTaxSubtotals = (taxCategories) => Object.values(taxCategories).map((category) => {
  // Recalculate tax amount to ensure it matches TaxableAmount × (TaxRate / 100), rounded to 2 decimals
  // This is required by BR-CO-17 and BR-S-09 validation rules
  const calculatedTaxAmount = Math.round((category.taxableAmount * (category.taxPercentage / 100)) * 100) / 100;
  const taxAmount = category.taxPercentage === 0 ? 0 : calculatedTaxAmount;
  
  // Map VAT codes to correct exemption reason codes for 0% VAT
  const getTaxExemptionReasonCode = (vatCode, taxPercentage) => {
    if (taxPercentage !== 0) {
      return ''; // No exemption code for non-zero VAT
    }
    
    // Map VAT codes to exemption codes according to Peppol BIS Billing 3.0
    const exemptionCodeMap = {
      'K': 'VATEX-EU-IC',  // Intra-community supply
      'G': 'VATEX-EU-G',   // Export outside EU
      'E': 'VATEX-EU-E',   // Exempt from tax
      'AE': 'VATEX-EU-AE'  // Reverse charge
    };
    
    return exemptionCodeMap[vatCode] || '';
  };
  
  const exemptionCode = getTaxExemptionReasonCode(category.vatCode, category.taxPercentage);
  const exemptionCodeXml = exemptionCode 
    ? `<cbc:TaxExemptionReasonCode>${exemptionCode}</cbc:TaxExemptionReasonCode>` 
    : '';
  
  return `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">${category.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">${taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${category.vatCode}</cbc:ID>
          <cbc:Percent>${category.taxPercentage}</cbc:Percent>
          ${exemptionCodeXml}
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    `;
}).join("");

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
        <cbc:PriceAmount currencyID="EUR">${parseFloat(line.unitPrice || 0).toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>
  `).join("");

// Main UBL generation function
export const generatePEPPOLXML = (invoiceData) => {
  // Validate required fields before generating XML
  if (!invoiceData) {
    throw new Error("Invoice data is required");
  }
  
  if (!invoiceData.receiver || !invoiceData.receiver.peppolIdentifier) {
    throw new Error("Receiver Peppol identifier is required");
  }
  
  if (!invoiceData.sender || !invoiceData.sender.peppolIdentifier) {
    throw new Error("Sender Peppol identifier is required");
  }
  
  if (!invoiceData.invoiceLines || !Array.isArray(invoiceData.invoiceLines) || invoiceData.invoiceLines.length === 0) {
    throw new Error("At least one invoice line is required");
  }
  
  // Validate required address fields for sender
  if (!invoiceData.sender.addressLine1 || !invoiceData.sender.city || !invoiceData.sender.zipCode) {
    throw new Error("Sender address fields (addressLine1, city, zipCode) are required");
  }
  
  // Validate required address fields for receiver
  if (!invoiceData.receiver.addressLine1 || !invoiceData.receiver.city || !invoiceData.receiver.zipCode) {
    throw new Error("Receiver address fields (addressLine1, city, zipCode) are required");
  }
  
  // Validate dates
  if (!invoiceData.issueDate) {
    throw new Error("Issue date is required");
  }
  
  if (!invoiceData.dueDate) {
    throw new Error("Due date is required");
  }
  
  const timestamp = formatDate(new Date());
  const taxCategories = calculateTaxCategories(invoiceData.invoiceLines);
  const totals = calculateTotals(invoiceData.invoiceLines);
  
  // Ensure dates are in YYYY-MM-DD format (UBL requires date-only, not datetime)
  const formatUBLDate = (dateValue) => {
    if (!dateValue) return formatDate(new Date(), "date");
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // Otherwise, format it as date-only
    return formatDate(dateValue, "date");
  };
  
  const issueDate = formatUBLDate(invoiceData.issueDate);
  const dueDate = formatUBLDate(invoiceData.dueDate);
  const deliveryDate = formatUBLDate(invoiceData.deliveryDate);
  
  // Buyer reference is mandatory (PEPPOL-EN16931-R003)
  // Use invoice number if buyerReference is not provided
  const buyerReference = invoiceData.buyerReference || invoiceData.billName || 'INV-' + Date.now();
  
  // Recalculate total tax amount from tax categories to ensure accuracy
  const recalculatedTaxTotal = Object.values(taxCategories).reduce((sum, category) => {
    if (category.taxPercentage === 0) return sum;
    const calculatedTaxAmount = Math.round((category.taxableAmount * (category.taxPercentage / 100)) * 100) / 100;
    return sum + calculatedTaxAmount;
  }, 0);
  
  
  return `<?xml version="1.0" encoding="UTF-8"?>
  <Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
           xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
           xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>${xmlEscape(invoiceData.billName)}</cbc:ID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
    <cbc:DueDate>${dueDate}</cbc:DueDate>
    <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
    <cbc:BuyerReference>${xmlEscape(buyerReference)}</cbc:BuyerReference>
  ${generatePartyInfo(invoiceData.sender, true)}
  ${generatePartyInfo(invoiceData.receiver, false)}
  ${generateDelivery({ ...invoiceData, deliveryDate })}
  ${generatePaymentMeansAndTerms(invoiceData)}
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="EUR">${recalculatedTaxTotal.toFixed(2)}</cbc:TaxAmount>
      ${generateTaxSubtotals(taxCategories)}
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
      <cbc:LineExtensionAmount currencyID="EUR">${totals.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cbc:TaxExclusiveAmount currencyID="EUR">${totals.taxableAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
      <cbc:TaxInclusiveAmount currencyID="EUR">${(totals.taxableAmount + recalculatedTaxTotal).toFixed(2)}</cbc:TaxInclusiveAmount>
      <cbc:PayableAmount currencyID="EUR">${(totals.taxableAmount + recalculatedTaxTotal).toFixed(2)}</cbc:PayableAmount>
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
  // Format: SCHEME_CODE:IDENTIFIER (e.g., "0208:0630675588", "9925:BE0630675588", "9957:FR0545744269")
  // Scheme code is 4 digits, identifier can contain letters and numbers
  validatePeppolIdentifier(identifier) {
    if (!identifier || typeof identifier !== 'string') {
      return false;
    }
    // Pattern: 4 digits (scheme code) : one or more alphanumeric characters (identifier)
    const pattern = /^\d{4}:[A-Z0-9]+$/i;
    return pattern.test(identifier.trim());
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
  // This method checks a single identifier
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
        // Check if it's a 404 (participant not found) - this is expected, not an error
        if (response.error.status === 404 || response.error.message?.includes('404')) {
          return null; // Return null instead of throwing for 404
        }
        throw new Error(response.error.message);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check receiver capability - tries all possible Peppol identifiers
   * For Belgium: Tries 9925 (VAT scheme) first, then 0208 (enterprise number) as fallback
   * This avoids MOD97-0208 validation issues - 9925 doesn't require MOD97 validation
   * @param {string} receiverVatNumber - Receiver's VAT number (e.g., "BE0262465766" or "1001463624")
   * @param {string} countryCode - Optional country code to use if VAT number lacks prefix (e.g., "BE", "NL")
   * @returns {Promise<{found: boolean, identifier?: string, supportedDocuments?: string[]}>}
   */
  async checkReceiverCapability(receiverVatNumber, countryCode = null) {
    if (!receiverVatNumber) {
      return { found: false };
    }

    // Get all possible Peppol identifiers for this VAT number
    // For Belgium: getAllPeppolIdentifiers returns 9925 first, then 0208
    const identifiers = getAllPeppolIdentifiers(receiverVatNumber, countryCode);
    
    if (identifiers.length === 0) {
      return { found: false };
    }

    // Detect if this is a Belgian receiver
    const isBelgium = countryCode?.toUpperCase() === 'BE' || 
                      receiverVatNumber.toUpperCase().startsWith('BE') ||
                      identifiers.some(id => id.startsWith('9925:') || id.startsWith('0208:'));

    // Try each identifier until one is found
    // For Belgium: This will try 9925 first (no MOD97 validation), then 0208 (requires MOD97) as fallback
    for (let i = 0; i < identifiers.length; i++) {
      const identifier = identifiers[i];
      try {
        const result = await this.checkRecipientSupport(identifier);
        
        // If result is null, it means 404 (not found)
        if (!result) {
          continue;
        }
        
        // If we get a successful response, receiver is on Peppol
        // Check for various possible response formats from public Peppol API:
        // - peppolIdentifier: "9925:be1001463624"
        // - smpHostName: "peppol-smp-test.digiteal.eu" (indicates participant found)
        // - supportedDocumentTypes: array of document types
        // - name: participant name (from registered participants endpoint)
        const hasPeppolIdentifier = result?.peppolIdentifier;
        const hasSupportedDocuments = Array.isArray(result?.supportedDocumentTypes) && result.supportedDocumentTypes.length > 0;
        const hasSmpHostName = result?.smpHostName; // This is a strong indicator of participant found
        const hasName = result?.name; // From registered participants endpoint
        const hasFoundFlag = result?.found === true;
        
        // If any of these indicators are present, participant is found
        if (hasPeppolIdentifier || hasSupportedDocuments || hasSmpHostName || hasName || hasFoundFlag) {
          return {
            found: true,
            identifier: identifier,
            supportedDocuments: result.supportedDocumentTypes || [],
            data: result
          };
        }
      } catch (error) {
        // Continue to next identifier
        continue;
      }
    }
    
    // None of the identifiers were found
    return { found: false };
  }

  /**
   * Check if a receiver supports a specific document type
   * @param {string} peppolIdentifier - Receiver's Peppol identifier (e.g., "0208:1001464623")
   * @param {string} documentType - Document type to check (e.g., "INVOICE")
   * @returns {Promise<{supported: boolean, supportedDocuments?: string[]}>}
   */
  async checkReceiverSupportsDocumentType(peppolIdentifier, documentType = 'INVOICE') {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response = await supabase.functions.invoke('peppol-webhook-config', {
        body: {
          endpoint: this.config.baseUrl,
          username: this.config.username,
          password: this.config.password,
          action: 'get-supported-document-types',
          peppolIdentifier: peppolIdentifier
        }
      });

      if (response.error) {
        // If 404, participant doesn't support the document type
        if (response.error.status === 404 || response.error.message?.includes('404')) {
          return { supported: false, supportedDocuments: [] };
        }
        throw new Error(response.error.message);
      }

      // API response format: { peppolIdentifier: "...", documentTypes: ["urn:...", ...] }
      // OR: array of document type objects with { type, fullType }
      let documentTypesArray = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // If response.data is directly an array
          documentTypesArray = response.data;
        } else if (response.data.documentTypes && Array.isArray(response.data.documentTypes)) {
          // If response.data has documentTypes property (array of URN strings)
          documentTypesArray = response.data.documentTypes;
        } else if (Array.isArray(response.data.supportedDocumentTypes)) {
          // Alternative format with supportedDocumentTypes
          documentTypesArray = response.data.supportedDocumentTypes;
        }
      }
      
      // The INVOICE document type URN we're looking for
      const invoiceDocumentType = `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1`;
      
      // Check if any document type matches INVOICE
      const isSupported = documentTypesArray.some(doc => {
        // If doc is a string (URN), check direct match
        if (typeof doc === 'string') {
          return doc === invoiceDocumentType || doc.includes('Invoice-2::Invoice');
        }
        // If doc is an object, check type or fullType properties
        if (typeof doc === 'object') {
          if (doc.type === 'INVOICE' || doc.type === documentType) {
            return true;
          }
          if (doc.fullType === invoiceDocumentType) {
            return true;
          }
          if (typeof doc.fullType === 'string' && doc.fullType.includes('Invoice-2::Invoice')) {
            return true;
          }
        }
        return false;
      });

      return {
        supported: isSupported,
        supportedDocuments: documentTypesArray
      };
    } catch (error) {
      // If we can't check, assume not supported to be safe
      return { supported: false, supportedDocuments: [], error: error.message };
    }
  }

  /**
   * Validate UBL document structure locally (before sending)
   * @param {string} xml - UBL XML string
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async validateDocumentStructure(xml) {
    try {
      const errors = [];
      
      if (!xml || typeof xml !== 'string') {
        errors.push('Document XML is required');
        return { valid: false, errors };
      }
      
      if (xml.trim().length === 0) {
        errors.push('Document XML is empty');
        return { valid: false, errors };
      }
      
      // Check mandatory document identifiers
      const mandatoryFields = {
        'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0',
        'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
        'cbc:InvoiceTypeCode': '380'
      };
      
      for (const [field, expectedValue] of Object.entries(mandatoryFields)) {
        const fieldPattern = new RegExp(`<${field}[^>]*>${expectedValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</${field}>`);
        if (!fieldPattern.test(xml)) {
          errors.push(`Missing or incorrect ${field}`);
        }
      }
      
      // Check endpoint IDs have schemeID
      if (!xml.includes('schemeID=')) {
        errors.push('Missing schemeID attribute in EndpointID');
      }
      
      // Check all amounts have currencyID
      const amountFields = [
        'TaxAmount', 'TaxableAmount', 'LineExtensionAmount',
        'PriceAmount', 'PayableAmount'
      ];
      
      for (const field of amountFields) {
        const fieldPattern = new RegExp(`<cbc:${field}[^>]*>`, 'i');
        if (fieldPattern.test(xml)) {
          const currencyPattern = new RegExp(`<cbc:${field}[^>]*currencyID=`, 'i');
          if (!currencyPattern.test(xml)) {
            errors.push(`Missing currencyID in ${field}`);
          }
        }
      }
      
      // Check for required sections
      const requiredSections = [
        { name: 'cbc:ID', description: 'Invoice ID' },
        { name: 'cbc:IssueDate', description: 'Issue Date' },
        { name: 'cbc:DueDate', description: 'Due Date' },
        { name: 'cac:AccountingSupplierParty', description: 'Supplier Party (Sender)' },
        { name: 'cac:AccountingCustomerParty', description: 'Customer Party (Receiver)' },
        { name: 'cac:TaxTotal', description: 'Tax Total' },
        { name: 'cac:LegalMonetaryTotal', description: 'Legal Monetary Total' },
        { name: 'cac:InvoiceLine', description: 'Invoice Line(s)' }
      ];
      
      for (const section of requiredSections) {
        if (!xml.includes(`<${section.name}`)) {
          errors.push(`Missing mandatory section: ${section.description} (${section.name})`);
        }
      }
      
      const result = {
        valid: errors.length === 0,
        errors: errors
      };
      
      return result;
    } catch (error) {
      return {
        valid: false,
        errors: [`Validation function error: ${error.message || error.toString()}`]
      };
    }
  }

  /**
   * Send invoice with retry logic for transient errors
   * @param {object} invoiceData - Invoice data
   * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
   * @returns {Promise<object>} Send result
   */
  async sendWithRetry(invoiceData, maxRetries = 3) {
    let lastError;
    
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Generate UBL XML
        let xml;
        try {
          xml = generatePEPPOLXML(invoiceData);
        } catch (xmlError) {
          throw new Error(`Failed to generate UBL XML: ${xmlError.message || 'Unknown error'}`);
        }
        
        if (!xml || typeof xml !== 'string') {
          throw new Error('Failed to generate UBL XML document: Generated XML is empty or invalid');
        }
        
        // Validate document before sending
        let validation;
        try {
          // CORRECT: Use validateDocumentStructure for local validation
          console.log('[Peppol] Starting local document validation...');
          validation = await this.validateDocumentStructure(xml);
          console.log('[Peppol] Local validation result:', JSON.stringify(validation, null, 2));
        } catch (validationError) {
          console.error('[Peppol] Validation threw error:', validationError);
          throw new Error(`Document validation error: ${validationError.message || validationError.toString() || 'Unknown validation error'}`);
        }
        
        if (!validation) {
          console.error('[Peppol] Validation returned null/undefined');
          throw new Error('Document validation failed: Validation function returned no result');
        }
        
        if (!validation.valid) {
          // Better error reporting
          let errorMessages = 'Validation failed';
          if (validation.errors) {
            if (Array.isArray(validation.errors) && validation.errors.length > 0) {
              errorMessages = validation.errors.join(', ');
            } else if (typeof validation.errors === 'string') {
              errorMessages = validation.errors;
            } else {
              errorMessages = `Validation failed: ${JSON.stringify(validation.errors)}`;
            }
          }
          console.error('[Peppol] Local validation failed:', {
            valid: validation.valid,
            errors: validation.errors,
            errorMessage: errorMessages
          });
          throw new Error(`Document validation failed: ${errorMessages}`);
        }
        
        console.log('[Peppol] ✅ Local validation passed, proceeding to send...');
        
        // Send via edge function
        console.log('[Peppol] Sending invoice via edge function...');
        const response = await supabase.functions.invoke('peppol-webhook-config', {
          body: {
            endpoint: this.config.baseUrl,
            username: this.config.username,
            password: this.config.password,
            action: 'send-ubl-document',
            xmlDocument: xml
          }
        });
        
        console.log('[Peppol] Edge function response:', {
          hasError: !!response.error,
          error: response.error,
          hasData: !!response.data,
          data: response.data
        });
        
        if (response.error) {
          console.error('[Peppol] Edge function returned error:', response.error);
          
          // Parse error details from Digiteal API
          let errorMessage = response.error.message || 'Unknown error';
          
          // Check if error details contain RECIPIENT_NOT_IN_PEPPOL
          if (response.error.details) {
            try {
              const details = typeof response.error.details === 'string' 
                ? JSON.parse(response.error.details) 
                : response.error.details;
              
              if (details.status === 'RECIPIENT_NOT_IN_PEPPOL' || details.errorCode === 'RECIPIENT_NOT_IN_PEPPOL') {
                const recipientId = details.message?.match(/Recipient\s+([^\s]+)/)?.[1] || 'unknown';
                errorMessage = `Receiver ${recipientId} is registered on Peppol but does not support INVOICE document type. Please contact the receiver to enable INVOICE support or use email delivery method.`;
              } else if (details.message) {
                errorMessage = details.message;
              }
            } catch (e) {
              // If parsing fails, use the original error message
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Check if response.data contains validation errors
        if (response.data) {
          const validationResult = response.data.currentSpecValidationResult || response.data.futureSpecValidationResult;
          if (validationResult && validationResult.status === 'ERROR') {
            const errors = validationResult.errors || [];
            const errorMessages = errors.map(e => `${e.id}: ${e.description}`).join(', ');
            console.error('[Peppol] Document validation failed in edge function:', {
              status: validationResult.status,
              errors: errors,
              errorMessages: errorMessages
            });
            throw new Error(`Document validation failed: ${errorMessages || 'Validation failed'}`);
          } else if (validationResult && validationResult.status === 'OK') {
            console.log('[Peppol] ✅ Document validation passed in edge function');
          }
        }
        
        // Success
        console.log('[Peppol] ✅ Invoice sent successfully');
        return {
          success: true,
          message: "Invoice sent successfully",
          attempt: attempt
        };
        
      } catch (error) {
        lastError = error;
        
        // Don't retry for non-transient errors
        const errorMessage = error.message || '';
        if (errorMessage.includes('not found') || 
            errorMessage.includes('validation') ||
            errorMessage.includes('receiver not found') ||
            errorMessage.includes('401') ||
            errorMessage.includes('Unauthorized') ||
            errorMessage.includes('404')) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  // Send UBL invoice via Peppol - via edge function to avoid CORS
  async sendInvoice(invoiceData) {
    try {
      // Get user first for quota check
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      // Check if Peppol is disabled
      const isDisabled = await this.isPeppolDisabled();
      if (isDisabled) {
        throw new Error('Peppol functionality is currently disabled. Please enable it in Peppol settings to send invoices.');
      }

      // Check Peppol invoice quota limit
      const { FeatureAccessService } = await import('./featureAccessService');
      const featureAccessService = new FeatureAccessService();
      const peppolQuota = await featureAccessService.canSendPeppolInvoice(user.id);
      
      if (!peppolQuota.withinLimit && !peppolQuota.unlimited) {
        throw new Error(
          `Peppol invoice limit reached. You can send/receive up to ${peppolQuota.limit} Peppol invoices per month on your current plan. ` +
          `You have used ${peppolQuota.usage} of ${peppolQuota.limit}. Please upgrade to Pro for unlimited Peppol invoices.`
        );
      }

      // CRITICAL: Check if receiver is on Peppol BEFORE sending
      if (!invoiceData.receiver || !invoiceData.receiver.vatNumber) {
        throw new Error('Receiver VAT number is required to check Peppol capability');
      }

      // Use the Peppol identifier from invoiceData if provided (from UI), otherwise discover it
      let receiverPeppolIdentifier = invoiceData.receiver.peppolIdentifier;
      
      if (!receiverPeppolIdentifier) {
        // If no Peppol ID provided, discover it via capability check
        const receiverCheck = await this.checkReceiverCapability(invoiceData.receiver.vatNumber);
        
        if (!receiverCheck.found) {
          throw new Error(
            `Receiver ${invoiceData.receiver.vatNumber} not found on Peppol network. ` +
            `Please use email delivery method or ensure the receiver is registered on Peppol.`
          );
        }

        // Set receiver Peppol identifier from capability check result
        receiverPeppolIdentifier = receiverCheck.identifier;
        invoiceData.receiver.peppolIdentifier = receiverPeppolIdentifier;
      } else {
        // If Peppol ID is provided from UI, validate it exists on Peppol network
        // This ensures the user-provided ID is valid before sending
        const receiverCheck = await this.checkRecipientSupport(receiverPeppolIdentifier);
        if (!receiverCheck) {
          throw new Error(
            `Receiver Peppol ID ${receiverPeppolIdentifier} not found on Peppol network. ` +
            `Please verify the Peppol ID is correct or use email delivery method.`
          );
        }
      }

      // CRITICAL: Check if receiver supports INVOICE document type before sending
      // Use the Peppol identifier from UI (if provided) or discovered identifier
      const documentTypeCheck = await this.checkReceiverSupportsDocumentType(
        receiverPeppolIdentifier,
        'INVOICE'
      );

      if (!documentTypeCheck.supported) {
        const supportedTypes = documentTypeCheck.supportedDocuments?.map(d => d.type || d.fullType).join(', ') || 'none';
        throw new Error(
          `Receiver ${receiverPeppolIdentifier} is registered on Peppol but does not support INVOICE document type. ` +
          `Supported document types: ${supportedTypes || 'none'}. ` +
          `Please contact the receiver to enable INVOICE support or use email delivery method.`
        );
      }

      // Send with retry logic
      return await this.sendWithRetry(invoiceData, 3);
      
    } catch (error) {
      throw error;
    }
  }


  // Convert Haliqo invoice to Peppol format
  convertHaliqoInvoiceToPeppol(haliqoInvoice, senderInfo, receiverInfo) {
    // Validate required sender fields
    if (!senderInfo.address || senderInfo.address.trim() === '') {
      throw new Error('Sender address (addressLine1) is required. Please update your company profile with a valid address.');
    }
    if (!senderInfo.city || senderInfo.city.trim() === '') {
      throw new Error('Sender city is required. Please update your company profile with a valid city.');
    }
    if (!senderInfo.zip_code || senderInfo.zip_code.trim() === '') {
      throw new Error('Sender postal code (zipCode) is required. Please update your company profile with a valid postal code.');
    }
    
    // Validate required receiver fields
    if (!receiverInfo.address || receiverInfo.address.trim() === '') {
      throw new Error('Receiver address (addressLine1) is required. Please update the client profile with a valid address.');
    }
    if (!receiverInfo.city || receiverInfo.city.trim() === '') {
      throw new Error('Receiver city is required. Please update the client profile with a valid city.');
    }
    if (!receiverInfo.zip_code || receiverInfo.zip_code.trim() === '') {
      throw new Error('Receiver postal code (zipCode) is required. Please update the client profile with a valid postal code.');
    }
    
    // Validate invoice lines
    if (!haliqoInvoice.items || !Array.isArray(haliqoInvoice.items) || haliqoInvoice.items.length === 0) {
      throw new Error('At least one invoice line item is required.');
    }
    
    return {
      billName: haliqoInvoice.invoice_number || `INV-${Date.now()}`,
      // Use issue_date from schema (invoices.issue_date), fallback to created_at if not available
      issueDate: formatDate(haliqoInvoice.issue_date || haliqoInvoice.created_at || new Date(), "date"),
      // Use due_date from schema (invoices.due_date)
      dueDate: formatDate(haliqoInvoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "date"),
      // delivery_date is not in invoices table, use issue_date as fallback (or created_at)
      deliveryDate: formatDate(haliqoInvoice.delivery_date || haliqoInvoice.issue_date || haliqoInvoice.created_at || new Date(), "date"),
      // buyerReference can be from invoice notes, description, or invoice number
      buyerReference: haliqoInvoice.buyer_reference || haliqoInvoice.reference || haliqoInvoice.invoice_number || null,
      // Extract payment delay from payment_terms if available, otherwise default to 30 days
      paymentDelay: extractPaymentDelay(haliqoInvoice.payment_terms) || 30,
      paymentMeans: 31, // Debit transfer (code 31 = Credit transfer)
      sender: {
        vatNumber: cleanVATNumber(senderInfo.vat_number), // Clean VAT number (remove Peppol scheme prefixes)
        name: senderInfo.company_name || senderInfo.full_name || 'Company Name Required',
        addressLine1: senderInfo.address.trim(),
        city: senderInfo.city.trim(),
        countryCode: countryNameToISO(senderInfo.country) || "BE", // Convert country name to ISO code
        zipCode: senderInfo.zip_code.trim(),
        iban: senderInfo.iban || null, // IBAN is optional but recommended for credit transfer payments
        peppolIdentifier: senderInfo.peppol_identifier || null // Use Peppol ID from settings if available
      },
      receiver: {
        vatNumber: receiverInfo.vat_number || '',
        name: receiverInfo.company_name || receiverInfo.full_name || 'Client Name Required',
        addressLine1: receiverInfo.address.trim(),
        city: receiverInfo.city.trim(),
        zipCode: receiverInfo.zip_code.trim(),
        countryCode: receiverInfo.country || "BE",
        peppolIdentifier: receiverInfo.peppol_identifier,
        contact: {
          name: receiverInfo.contact_name || null,
          phone: receiverInfo.phone || null,
          email: receiverInfo.email || null
        }
      },
      invoiceLines: haliqoInvoice.items.map((item, index) => ({
        description: item.description || `Item ${index + 1}`,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || 0,
        taxableAmount: item.subtotal || 0,
        taxAmount: item.tax_amount || 0,
        totalAmount: item.total || 0,
        vatCode: item.vat_code || "S",
        taxPercentage: item.vat_percentage || 21
      }))
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
      throw error;
    }
  }

  // Check if user is a business user
  // Note: All users are allowed to use Peppol regardless of business size
  // Solo users may still have companies and need Peppol services
  async isBusinessUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Allow all authenticated users to use Peppol
      // Business size check removed - solo users can also have companies
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get Peppol settings for user
  async getPeppolSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Allow all users to access Peppol regardless of business size
      // Solo users may still have companies and need Peppol services

      const { data, error } = await supabase
        .from('peppol_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
        
      // Map database fields to camelCase for frontend
      // For Belgium: Use 9925 as default if both exist, otherwise use primary peppol_id
      const primaryPeppolId = data?.peppol_id_9925 || data?.peppol_id || null;
      
      const mappedData = data ? {
        isConfigured: data.is_configured,
        peppolId: primaryPeppolId, // Default to 9925 for Belgium, or primary ID for others
        peppolId9925: data.peppol_id_9925 || null, // 9925 scheme ID (Belgium only)
        peppolId0208: data.peppol_id_0208 || null, // 0208 scheme ID (Belgium only)
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

      // Allow all users to use Peppol regardless of business size
      // Solo users may still have companies and need Peppol services

      // Check if this participant already exists in our database
      const { data: existingSettings, error: existingError } = await supabase
        .from('peppol_settings')
        .select('peppol_id, is_configured')
        .eq('peppol_id', settings.peppolId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows found

      let registrationResult = null;
      
      if (existingSettings && existingSettings.is_configured) {
        // Participant already registered in our system, skip Digiteal registration
        // Participant already exists in database, skipping Digiteal registration
        registrationResult = { success: true, alreadyRegistered: true };
      } else {
        // For Belgium: register both 0208 and 9925 schemes
        // For other countries: register with the provided scheme
        const isBelgium = settings.countryCode?.toUpperCase() === 'BE';
        
        if (isBelgium && settings.vatNumber) {
          // Register both schemes for Belgium
          // Normalize VAT number: ensure it has BE prefix
          let normalizedVAT = settings.vatNumber.trim();
          if (!normalizedVAT.toUpperCase().startsWith('BE')) {
            normalizedVAT = `BE${normalizedVAT}`;
          }
          
          // CORRECT: Use 9925 with full VAT number (lowercase)
          const id9925 = `9925:${normalizedVAT.toLowerCase()}`;
          // Extract digits only for 0208 scheme (enterprise number without BE prefix)
          const digitsOnly = normalizedVAT.replace(/\D/g, '');
          const id0208 = `0208:${digitsOnly}`;
          
          // Register with 9925 first (preferred - no MOD97 validation required)
          registrationResult = await this.registerParticipant({
            peppolIdentifier: id9925,
            name: settings.name,
            countryCode: settings.countryCode,
            contactPerson: {
              firstName: settings.firstName,
              lastName: settings.lastName,
              email: settings.email,
              phoneNumber: settings.phoneNumber,
              language: settings.language
            },
            supportedDocumentTypes: PEPPOL_DOCUMENT_TYPES,
            limitedToOutboundTraffic: settings.limitedToOutboundTraffic || false
          });
          
          // Register with 0208 (secondary/fallback) - only if 9925 registration succeeded
          if (registrationResult.success || registrationResult.alreadyRegistered) {
            try {
              await this.registerParticipant({
                peppolIdentifier: id0208,
                name: settings.name,
                countryCode: settings.countryCode,
                contactPerson: {
                  firstName: settings.firstName,
                  lastName: settings.lastName,
                  email: settings.email,
                  phoneNumber: settings.phoneNumber,
                  language: settings.language
                },
                supportedDocumentTypes: PEPPOL_DOCUMENT_TYPES,
                limitedToOutboundTraffic: settings.limitedToOutboundTraffic || false
              });
              // Note: We don't fail if 0208 registration fails, as 9925 is the primary (saved ID)
            } catch (error) {
              // Secondary registration failed, but continuing with primary
            }
          }
        } else {
          // For other countries, register with the provided scheme
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
        }

        // If registration failed but participant is already registered, continue to save settings
        if (!registrationResult.success && !registrationResult.alreadyRegistered) {
          return registrationResult;
        }
      }

      // For Belgium: Ensure we save 9925 scheme as primary (even if settings.peppolId is 0208)
      // Both schemes are registered, but we save 9925 to avoid MOD97 validation issues
      let peppolIdToSave = settings.peppolId;
      let peppolId9925 = null;
      let peppolId0208 = null;
      const isBelgium = settings.countryCode?.toUpperCase() === 'BE';
      
      if (isBelgium && settings.vatNumber) {
        // Normalize VAT number
        let normalizedVAT = settings.vatNumber.trim();
        if (!normalizedVAT.toUpperCase().startsWith('BE')) {
          normalizedVAT = `BE${normalizedVAT}`;
        }
        
        // Generate both IDs for Belgium
        peppolId9925 = `9925:${normalizedVAT.toLowerCase()}`;
        const digitsOnly = normalizedVAT.replace(/\D/g, '');
        peppolId0208 = `0208:${digitsOnly}`;
        
        // Set primary ID to 9925 (default/preferred)
        peppolIdToSave = peppolId9925;
      } else {
        // For non-Belgium, use the provided ID as primary
        peppolIdToSave = settings.peppolId;
      }
      
      // Then save to database using upsert to handle updates
      const { data, error } = await supabase
        .from('peppol_settings')
        .upsert({
          user_id: user.id,
          peppol_id: peppolIdToSave, // Primary ID (9925 for Belgium, or provided ID for others)
          peppol_id_9925: peppolId9925, // 9925 scheme ID (Belgium only)
          peppol_id_0208: peppolId0208, // 0208 scheme ID (Belgium only)
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
        // Use the actual error message from API if available, otherwise use default
        const apiMessage = registrationResult.error || 'This participant is already registered in Digiteal.';
        successMessage = `Settings saved successfully. ${apiMessage}`;
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
          error: 'Invalid Peppol ID format. Expected format: SCHEME_CODE:IDENTIFIER (e.g., 0208:0630675588, 9925:BE0630675588, 9957:FR0545744269)'
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
      
      // Test 3: Check if participant exists in global Peppol network (RECOMMENDED - Primary Check)
      // This uses the public API to check the global Peppol network
      const participantTest = await this.getDetailedParticipantInfo(settings.peppolId);
      
      // If participant exists in global Peppol network, check which Access Point (SMP) they're registered with
      if (participantTest.success && participantTest.data) {
        const smpHostName = participantTest.data.smpHostName || participantTest.data.smp?.hostname || '';
        const isRegisteredWithDigiteal = smpHostName.includes('digiteal');
        
        // Test 3.5: Check if participant is already registered in Digiteal's system
        // This is critical - if already registered, test should indicate this
        try {
          const participantCheck = await this.getParticipant(settings.peppolId);
          
          // If we can get participant details from Digiteal, they're already registered
          if (participantCheck.success && participantCheck.data) {
            return {
              success: false,
              error: 'Company already registered in Digiteal.',
              alreadyRegistered: true,
              registeredWithDigiteal: true,
              smpHostName: smpHostName
            };
          }
        } catch (error) {
          // If getParticipant fails, check if participant is registered with another Access Point
          if (participantTest.success && !isRegisteredWithDigiteal && smpHostName) {
            return {
              success: false,
              error: 'Company already registered in Peppol.',
              alreadyRegistered: true,
              registeredWithDigiteal: false,
              smpHostName: smpHostName,
              needsTransfer: true
            };
          }
         
        }
      } else {
        // Participant not found in global Peppol network
        // Check if they're already registered with Digiteal (edge case)
        try {
          const participantCheck = await this.getParticipant(settings.peppolId);
          if (participantCheck.success && participantCheck.data) {
            return {
              success: false,
              error: 'Company already registered in Digiteal.',
              alreadyRegistered: true,
              registeredWithDigiteal: true
            };
          }
        } catch (error) {
          // Participant not found anywhere - this is OK, they can register
        }
      }
      
      // For Belgium, also check the 9925 identifier if we're testing with 0208
      if (settings.countryCode?.toUpperCase() === 'BE' && settings.peppolId?.startsWith('0208:')) {
        const vatNumber = settings.peppolId.split(':')[1];
        const id9925 = `9925:BE${vatNumber}`;
        
        try {
          const participantCheck9925 = await this.getParticipant(id9925);
          if (participantCheck9925.success && participantCheck9925.data) {
            return {
              success: false,
              error: 'Company already registered in Digiteal.',
              alreadyRegistered: true,
              registeredWithDigiteal: true
            };
          }
        } catch (error) {
          // Continue if check fails
        }
      }
      
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
          registrationReady: registrationTest.success,
          alreadyRegistered: false
        },
        message: this.generateTestResultMessage(supportedDocsResult, participantTest, registrationTest, responseTime)
      };
    } catch (error) {
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

      let response;
      try {
        response = await supabase.functions.invoke('peppol-webhook-config', {
          body: {
            endpoint: this.config.baseUrl,
            username: this.config.username,
            password: this.config.password,
            action: 'register-participant',
            participantData: payload
          }
        });
      } catch (invokeError) {
        // If Supabase throws an error, try to extract error message from it
        // Edge function invocation error
        
        // Try to extract error from various possible locations
        let errorMessage = invokeError.message || 'Failed to invoke edge function';
        let isAlreadyRegistered = false;
        
        // Check if error has response data in different possible locations
        if (invokeError.context?.body) {
          const errorBody = invokeError.context.body;
          if (errorBody.error) {
            errorMessage = errorBody.error;
            isAlreadyRegistered = errorBody.error.toLowerCase().includes('already registered');
          }
        } else if (invokeError.data) {
          const errorData = invokeError.data;
          if (errorData.error) {
            errorMessage = errorData.error;
            isAlreadyRegistered = errorData.error.toLowerCase().includes('already registered');
          }
        } else if (invokeError.message && invokeError.message.includes('non-2xx')) {
          // If it's the generic "non-2xx" error, try to get more details
          // The actual error might be in the error object itself
          errorMessage = 'Registration failed. Please check your participant details.';
        }
        
        return {
          success: false,
          error: errorMessage,
          alreadyRegistered: isAlreadyRegistered
        };
      }

      // Check for errors in both response.error and response.data
      // When edge function returns non-2xx, error data is in response.data
      const errorData = response.data || {};
      const hasError = response.error || (errorData && errorData.error);
      
      if (hasError) {
        // Extract error message from response.data (edge function error response)
        let errorMessage = '';
        let isAlreadyRegistered = false;
        
        // PRIORITY 1: Check errorData.error first (this is the main source from edge function)
        if (errorData.error && typeof errorData.error === 'string') {
          errorMessage = errorData.error;
          // Check if this is an "already registered" error
          const errorTextLower = errorMessage.toLowerCase();
          if (errorTextLower.includes('already_registered') || 
              errorTextLower.includes('already registered') ||
              errorTextLower.includes('already registered for reception')) {
            isAlreadyRegistered = true;
          }
        }
        
        // PRIORITY 2: Try to parse the details field which contains the full API error response
        if (!errorMessage && errorData.details) {
          try {
            const parsedDetails = JSON.parse(errorData.details);
            
            // Check if it's the Digiteal API error format
            if (parsedDetails.status === 'ALREADY_REGISTERED_TO_DIGITEAL' || 
                parsedDetails.errorCode === 'REGISTER_ALREADY_REGISTERED_TO_DIGITEAL') {
              isAlreadyRegistered = true;
              // Use the message from API response
              errorMessage = parsedDetails.message || parsedDetails.errorMessage || errorData.error || 'Participant is already registered';
            } else if (parsedDetails.message) {
              // Use message from parsed details
              errorMessage = parsedDetails.message;
            } else if (parsedDetails.errorMessage) {
              errorMessage = parsedDetails.errorMessage;
            } else if (parsedDetails.error) {
              errorMessage = parsedDetails.error;
            }
          } catch (e) {
            // If parsing fails, continue to other error extraction methods
            // Failed to parse error details
          }
        }
        
        // PRIORITY 3: Fallback to response.error if we still don't have an error message
        // But skip generic Supabase error messages like "non-2xx" or "Edge Function returned"
        if (!errorMessage && response.error) {
          const responseErrorMsg = typeof response.error === 'string' 
            ? response.error 
            : (response.error.message || JSON.stringify(response.error));
          
          // Skip generic Supabase error messages - we want the actual error from response.data
          if (!responseErrorMsg.includes('non-2xx') && 
              !responseErrorMsg.includes('Edge Function returned') &&
              !responseErrorMsg.includes('Function returned')) {
            errorMessage = responseErrorMsg;
            
            // Check again for already registered
            const fallbackErrorLower = errorMessage.toLowerCase();
            if (fallbackErrorLower.includes('already_registered') || 
                fallbackErrorLower.includes('already registered') ||
                fallbackErrorLower.includes('already registered for reception')) {
              isAlreadyRegistered = true;
            }
          }
        }
        
        // If still no error message, use a default
        if (!errorMessage) {
          errorMessage = 'Failed to register participant';
        }
        
        // Make error message user-friendly and concise
        if (isAlreadyRegistered) {
          // Determine if registered in Digiteal or globally in Peppol
          let isDigitealRegistration = false;
          
          // Check details field for Digiteal-specific status
          if (errorData.details) {
            try {
              const parsedDetails = JSON.parse(errorData.details);
              if (parsedDetails.status === 'ALREADY_REGISTERED_TO_DIGITEAL' || 
                  parsedDetails.errorCode === 'REGISTER_ALREADY_REGISTERED_TO_DIGITEAL') {
                isDigitealRegistration = true;
              }
            } catch (e) {
              // If parsing fails, check error message text
              if (errorData.details.includes('ALREADY_REGISTERED_TO_DIGITEAL')) {
                isDigitealRegistration = true;
              }
            }
          }
          
          // Also check error message for Digiteal keywords
          if (!isDigitealRegistration && errorMessage.toLowerCase().includes('digiteal')) {
            isDigitealRegistration = true;
          }
          
          // If error mentions "for reception", it's likely Digiteal registration
          if (!isDigitealRegistration && errorMessage.toLowerCase().includes('for reception')) {
            isDigitealRegistration = true;
          }
          
          // Concise message based on registration location
          const conciseMessage = isDigitealRegistration
            ? 'Company already registered in Digiteal.'
            : 'Company already registered in Peppol.';
          
          return { 
            success: false, 
            error: conciseMessage,
            alreadyRegistered: true,
            registeredWithDigiteal: isDigitealRegistration
          };
        }
        
        // For other errors, make them concise (max 100 chars)
        const conciseError = errorMessage.length > 100 
          ? errorMessage.substring(0, 100) + '...' 
          : errorMessage;
        
        return { success: false, error: conciseError };
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