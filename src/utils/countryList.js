// Country list for client forms - includes all countries with VAT validation rules
// This ensures all countries with Peppol/VAT support are available in dropdowns

export const COUNTRIES_WITH_VAT_FORMATS = [
  { code: 'AD', name: 'Andorra' },
  { code: 'AL', name: 'Albania' },
  { code: 'AT', name: 'Austria' },
  { code: 'BA', name: 'Bosnia and Herzegovina' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EE', name: 'Estonia' },
  { code: 'ES', name: 'Spain' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GR', name: 'Greece' },
  { code: 'HR', name: 'Croatia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LI', name: 'Liechtenstein' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'LV', name: 'Latvia' },
  { code: 'MC', name: 'Monaco' },
  { code: 'ME', name: 'Montenegro' },
  { code: 'MK', name: 'North Macedonia' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SM', name: 'San Marino' },
  { code: 'TR', name: 'Turkey' },
  { code: 'VA', name: 'Vatican City' }
];

/**
 * Get country options for client forms
 * @param {Function} t - Translation function
 * @returns {Array} Array of { value, label } objects for dropdown
 */
export const getClientCountryOptions = (t) => {
  return COUNTRIES_WITH_VAT_FORMATS.map(country => ({
    value: country.code,
    label: t(`clientManagement.countries.${country.code}`, { defaultValue: country.name })
  })).concat([
    { value: 'OTHER', label: t('clientManagement.countries.OTHER', { defaultValue: 'Other' }) }
  ]);
};

