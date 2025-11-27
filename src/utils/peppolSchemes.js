// Peppol Scheme ID mapping based on country codes
// Maps ISO 3166-1 alpha-2 country codes to Peppol scheme IDs (4-digit codes)

// Primary scheme IDs for VAT numbers (from DIGITEAL_API_DOCUMENTATION.md)
export const PEPPOL_VAT_SCHEME_MAP = {
  'AD': '9922', // Andorra
  'AL': '9923', // Albania
  'BA': '9924', // Bosnia and Herzegovina
  'BE': '9925', // Belgium (VAT-based)
  'BG': '9926', // Bulgaria
  'CH': '9927', // Switzerland
  'CY': '9928', // Cyprus
  'CZ': '9929', // Czech Republic
  'DE': '9930', // Germany
  'EE': '9931', // Estonia
  'GB': '9932', // United Kingdom
  'GR': '9933', // Greece
  'HR': '9934', // Croatia
  'IE': '9935', // Ireland
  'LI': '9936', // Liechtenstein
  'LT': '9937', // Lithuania
  'LU': '9938', // Luxembourg
  'LV': '9939', // Latvia
  'MC': '9940', // Monaco
  'ME': '9941', // Montenegro
  'MK': '9942', // North Macedonia
  'MT': '9943', // Malta
  'NL': '9944', // Netherlands
  'PL': '9945', // Poland
  'PT': '9946', // Portugal
  'RO': '9947', // Romania
  'RS': '9948', // Serbia
  'SI': '9949', // Slovenia
  'SK': '9950', // Slovakia
  'SM': '9951', // San Marino
  'TR': '9952', // Turkey
  'VA': '9953', // Vatican City
  'SE': '9955', // Sweden
  'FR': '9957'  // France
};

// Company number scheme IDs (country-specific)
// These are used for company registration numbers, not VAT numbers
export const PEPPOL_COMPANY_SCHEME_MAP = {
  'BE': '0208', // Belgium - Enterprise number (10 digits)
  'NL': '0209', // Netherlands - Chamber of Commerce number
  'FR': '0002', // France - VAT number (also used as company identifier)
  'DE': '0206', // Germany - Company registration
  'IT': '0210', // Italy - Company registration
  'ES': '0211', // Spain - Company registration
  'GB': '0088', // United Kingdom - Company number
  'SE': '0007', // Sweden - Organization number
  'DK': '0008', // Denmark - CVR number
  'FI': '0037', // Finland - Business ID
  'NO': '0009', // Norway - Organization number
  'AT': '0151', // Austria - Company registration
  'PL': '0006'  // Poland - Company registration
};

export const PEPPOL_COUNTRY_LANGUAGE_MAP = 
    [
        { value: 'fr-FR', label: 'Français - France (fr-FR)' },
        { value: 'fr-BE', label: 'Français - Belgique (fr-BE)' },
        { value: 'fr-CA', label: 'Français - Canada (fr-CA)' },
        { value: 'nl-NL', label: 'Nederlands - Nederland (nl-NL)' },
        { value: 'nl-BE', label: 'Nederlands - België (nl-BE)' },
        { value: 'en-US', label: 'English - United States (en-US)' },
        { value: 'en-GB', label: 'English - United Kingdom (en-GB)' },
        { value: 'de-DE', label: 'Deutsch - Deutschland (de-DE)' },
        { value: 'de-AT', label: 'Deutsch - Österreich (de-AT)' },
        { value: 'de-CH', label: 'Deutsch - Schweiz (de-CH)' },
        { value: 'es-ES', label: 'Español - España (es-ES)' },
        { value: 'it-IT', label: 'Italiano - Italia (it-IT)' },
        { value: 'pt-PT', label: 'Português - Portugal (pt-PT)' },
        { value: 'pt-BR', label: 'Português - Brasil (pt-BR)' },
        { value: 'pl-PL', label: 'Polski - Polska (pl-PL)' },
        { value: 'cs-CZ', label: 'Čeština - Česká republika (cs-CZ)' },
        { value: 'sk-SK', label: 'Slovenčina - Slovensko (sk-SK)' },
        { value: 'hu-HU', label: 'Magyar - Magyarország (hu-HU)' },
        { value: 'ro-RO', label: 'Română - România (ro-RO)' },
        { value: 'bg-BG', label: 'Български - България (bg-BG)' },
        { value: 'hr-HR', label: 'Hrvatski - Hrvatska (hr-HR)' },
        { value: 'sl-SI', label: 'Slovenščina - Slovenija (sl-SI)' },
        { value: 'et-EE', label: 'Eesti - Eesti (et-EE)' },
        { value: 'lv-LV', label: 'Latviešu - Latvija (lv-LV)' },
        { value: 'lt-LT', label: 'Lietuvių - Lietuva (lt-LT)' },
        { value: 'fi-FI', label: 'Suomi - Suomi (fi-FI)' },
        { value: 'sv-SE', label: 'Svenska - Sverige (sv-SE)' },
        { value: 'da-DK', label: 'Dansk - Danmark (da-DK)' },
        { value: 'no-NO', label: 'Norsk - Norge (no-NO)' },
        { value: 'el-GR', label: 'Ελληνικά - Ελλάδα (el-GR)' },
        { value: 'ru-RU', label: 'Русский - Россия (ru-RU)' },
        { value: 'uk-UA', label: 'Українська - Україна (uk-UA)' },
        { value: 'tr-TR', label: 'Türkçe - Türkiye (tr-TR)' },
        { value: 'ja-JP', label: '日本語 - 日本 (ja-JP)' },
        { value: 'ko-KR', label: '한국어 - 대한민국 (ko-KR)' },
        { value: 'zh-CN', label: '中文 - 中国 (zh-CN)' },
        { value: 'zh-TW', label: '中文 - 台灣 (zh-TW)' },
        { value: 'ar-SA', label: 'العربية - السعودية (ar-SA)' },
        { value: 'he-IL', label: 'עברית - ישראל (he-IL)' }
      ];
/**
 * Get Peppol scheme ID for VAT number based on country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'BE', 'FR', 'NL')
 * @returns {string|null} - Peppol scheme ID (4-digit code) or null if not found
 */
export const getPeppolVATSchemeId = (countryCode) => {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase().trim();
  return PEPPOL_VAT_SCHEME_MAP[code] || null;
};

/**
 * Get Peppol scheme ID for company number based on country code
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code (e.g., 'BE', 'FR', 'NL')
 * @returns {string|null} - Peppol scheme ID (4-digit code) or null if not found
 */
export const getPeppolCompanySchemeId = (countryCode) => {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase().trim();
  return PEPPOL_COMPANY_SCHEME_MAP[code] || null;
};

/**
 * Get primary Peppol scheme ID for a country
 * Priority: Company scheme > VAT scheme
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {string|null} - Peppol scheme ID (4-digit code) or null if not found
 */
export const getPrimaryPeppolSchemeId = (countryCode) => {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase().trim();
  
  // For Belgium, prefer company number scheme (0208) over VAT scheme (9925)
  if (code === 'BE') {
    return PEPPOL_COMPANY_SCHEME_MAP[code] || PEPPOL_VAT_SCHEME_MAP[code] || null;
  }
  
  // For other countries, try company scheme first, then VAT scheme
  return PEPPOL_COMPANY_SCHEME_MAP[code] || PEPPOL_VAT_SCHEME_MAP[code] || null;
};

/**
 * Parse a Peppol ID into scheme code and identifier
 * @param {string} peppolId - Full Peppol ID (e.g., "0208:0630675588" or "9925:BE0630675588")
 * @returns {{schemeCode: string|null, identifier: string|null}} - Parsed components
 */
export const parsePeppolId = (peppolId) => {
  if (!peppolId || typeof peppolId !== 'string') {
    return { schemeCode: null, identifier: null };
  }
  
  const trimmed = peppolId.trim();
  const parts = trimmed.split(':');
  
  if (parts.length === 2) {
    return {
      schemeCode: parts[0].trim(),
      identifier: parts[1].trim()
    };
  }
  
  // If no colon, assume it's just the identifier
  return {
    schemeCode: null,
    identifier: trimmed
  };
};

/**
 * Combine scheme code and identifier into full Peppol ID
 * @param {string} schemeCode - 4-digit scheme code (e.g., "0208")
 * @param {string} identifier - Company/VAT identifier (e.g., "0630675588")
 * @returns {string} - Full Peppol ID (e.g., "0208:0630675588")
 */
export const combinePeppolId = (schemeCode, identifier) => {
  if (!schemeCode || !identifier) {
    return identifier || schemeCode || '';
  }
  return `${schemeCode}:${identifier}`;
};

/**
 * Get available scheme IDs for a country (both VAT and company schemes)
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {Array<{schemeId: string, type: string, description: string}>} - Available schemes
 */
export const getAvailableSchemesForCountry = (countryCode) => {
  if (!countryCode) return [];
  
  const code = countryCode.toUpperCase().trim();
  const schemes = [];
  
  // Add company scheme if available
  const companyScheme = PEPPOL_COMPANY_SCHEME_MAP[code];
  if (companyScheme) {
    schemes.push({
      schemeId: companyScheme,
      type: 'company',
      description: 'Company Registration Number'
    });
  }
  
  // Add VAT scheme if available
  const vatScheme = PEPPOL_VAT_SCHEME_MAP[code];
  if (vatScheme) {
    schemes.push({
      schemeId: vatScheme,
      type: 'vat',
      description: 'VAT Number'
    });
  }
  
  return schemes;
};

