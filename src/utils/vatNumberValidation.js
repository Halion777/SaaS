// Country-specific VAT/Company number validation rules
// Based on Peppol documentation and country-specific requirements

/**
 * Country-specific VAT/Company number validation rules
 * Format: { countryCode: { minLength, maxLength, pattern, description, example } }
 */
export const VAT_VALIDATION_RULES = {
  'BE': {
    // Belgium: 10 digits for company number, BE + 10 digits for VAT
    companyNumber: {
      minLength: 10,
      maxLength: 10,
      pattern: /^\d{10}$/,
      description: '10 digits',
      example: '0630675588',
      message: 'Belgian company number must be exactly 10 digits'
    },
    vatNumber: {
      minLength: 12, // BE + 10 digits
      maxLength: 12,
      pattern: /^BE\d{10}$/i,
      description: 'BE followed by 10 digits',
      example: 'BE0630675588',
      message: 'Belgian VAT number must be BE followed by exactly 10 digits (e.g., BE0630675588)'
    }
  },
  'FR': {
    // France: 11 digits for VAT number
    vatNumber: {
      minLength: 13, // FR + 11 digits
      maxLength: 13,
      pattern: /^FR\d{11}$/i,
      description: 'FR followed by 11 digits',
      example: 'FR12345678901',
      message: 'French VAT number must be FR followed by exactly 11 digits (e.g., FR12345678901)'
    }
  },
  'NL': {
    // Netherlands: 9 digits + B01/B02 suffix
    vatNumber: {
      minLength: 12, // NL + 9 digits + B01
      maxLength: 14, // NL + 9 digits + B01 or B02
      pattern: /^NL\d{9}B0[12]$/i,
      description: 'NL followed by 9 digits and B01 or B02',
      example: 'NL123456789B01',
      message: 'Dutch VAT number must be NL followed by 9 digits and B01 or B02 (e.g., NL123456789B01)'
    }
  },
  'DE': {
    // Germany: 9 digits for VAT
    vatNumber: {
      minLength: 11, // DE + 9 digits
      maxLength: 11,
      pattern: /^DE\d{9}$/i,
      description: 'DE followed by 9 digits',
      example: 'DE123456789',
      message: 'German VAT number must be DE followed by exactly 9 digits (e.g., DE123456789)'
    }
  },
  'IT': {
    // Italy: 11 digits for VAT
    vatNumber: {
      minLength: 13, // IT + 11 digits
      maxLength: 13,
      pattern: /^IT\d{11}$/i,
      description: 'IT followed by 11 digits',
      example: 'IT12345678901',
      message: 'Italian VAT number must be IT followed by exactly 11 digits (e.g., IT12345678901)'
    }
  },
  'ES': {
    // Spain: 9 characters (1 letter + 8 digits or 8 digits + 1 letter)
    vatNumber: {
      minLength: 11, // ES + 9 characters
      maxLength: 11,
      pattern: /^ES[A-Z0-9]{9}$/i,
      description: 'ES followed by 9 characters (letter + 8 digits or 8 digits + letter)',
      example: 'ESA12345678',
      message: 'Spanish VAT number must be ES followed by 9 characters (e.g., ESA12345678)'
    }
  },
  'GB': {
    // United Kingdom: 9 digits (or 12 digits for some formats)
    vatNumber: {
      minLength: 11, // GB + 9 digits
      maxLength: 14, // GB + 12 digits (some formats)
      pattern: /^GB\d{9}(\d{3})?$/i,
      description: 'GB followed by 9 or 12 digits',
      example: 'GB123456789',
      message: 'UK VAT number must be GB followed by 9 or 12 digits (e.g., GB123456789)'
    }
  },
  'PL': {
    // Poland: 10 digits for VAT
    vatNumber: {
      minLength: 12, // PL + 10 digits
      maxLength: 12,
      pattern: /^PL\d{10}$/i,
      description: 'PL followed by 10 digits',
      example: 'PL1234567890',
      message: 'Polish VAT number must be PL followed by exactly 10 digits (e.g., PL1234567890)'
    }
  },
  'PT': {
    // Portugal: 9 digits for VAT
    vatNumber: {
      minLength: 11, // PT + 9 digits
      maxLength: 11,
      pattern: /^PT\d{9}$/i,
      description: 'PT followed by 9 digits',
      example: 'PT123456789',
      message: 'Portuguese VAT number must be PT followed by exactly 9 digits (e.g., PT123456789)'
    }
  },
  'AT': {
    // Austria: 9 characters (U + 8 digits)
    vatNumber: {
      minLength: 11, // AT + U + 8 digits
      maxLength: 11,
      pattern: /^ATU\d{8}$/i,
      description: 'ATU followed by 8 digits',
      example: 'ATU12345678',
      message: 'Austrian VAT number must be ATU followed by exactly 8 digits (e.g., ATU12345678)'
    }
  },
  'SE': {
    // Sweden: 12 digits for VAT
    vatNumber: {
      minLength: 14, // SE + 12 digits
      maxLength: 14,
      pattern: /^SE\d{12}$/i,
      description: 'SE followed by 12 digits',
      example: 'SE123456789012',
      message: 'Swedish VAT number must be SE followed by exactly 12 digits (e.g., SE123456789012)'
    }
  },
  'DK': {
    // Denmark: 8 digits for VAT
    vatNumber: {
      minLength: 10, // DK + 8 digits
      maxLength: 10,
      pattern: /^DK\d{8}$/i,
      description: 'DK followed by 8 digits',
      example: 'DK12345678',
      message: 'Danish VAT number must be DK followed by exactly 8 digits (e.g., DK12345678)'
    }
  },
  'FI': {
    // Finland: 8 digits for VAT
    vatNumber: {
      minLength: 10, // FI + 8 digits
      maxLength: 10,
      pattern: /^FI\d{8}$/i,
      description: 'FI followed by 8 digits',
      example: 'FI12345678',
      message: 'Finnish VAT number must be FI followed by exactly 8 digits (e.g., FI12345678)'
    }
  },
  'IE': {
    // Ireland: 8 characters (1-2 letters + 6-7 digits)
    vatNumber: {
      minLength: 10, // IE + 8 characters
      maxLength: 11, // IE + 9 characters (some formats)
      pattern: /^IE\d{7}[A-Z0-9]{1,2}$/i,
      description: 'IE followed by 8-9 characters',
      example: 'IE1234567A',
      message: 'Irish VAT number must be IE followed by 8-9 characters (e.g., IE1234567A)'
    }
  },
  'LU': {
    // Luxembourg: 8 digits for VAT
    vatNumber: {
      minLength: 10, // LU + 8 digits
      maxLength: 10,
      pattern: /^LU\d{8}$/i,
      description: 'LU followed by 8 digits',
      example: 'LU12345678',
      message: 'Luxembourg VAT number must be LU followed by exactly 8 digits (e.g., LU12345678)'
    }
  },
  'CZ': {
    // Czech Republic: 8-10 digits for VAT
    vatNumber: {
      minLength: 10, // CZ + 8 digits
      maxLength: 12, // CZ + 10 digits
      pattern: /^CZ\d{8,10}$/i,
      description: 'CZ followed by 8-10 digits',
      example: 'CZ12345678',
      message: 'Czech VAT number must be CZ followed by 8-10 digits (e.g., CZ12345678)'
    }
  },
  'SK': {
    // Slovakia: 10 digits for VAT
    vatNumber: {
      minLength: 12, // SK + 10 digits
      maxLength: 12,
      pattern: /^SK\d{10}$/i,
      description: 'SK followed by 10 digits',
      example: 'SK1234567890',
      message: 'Slovak VAT number must be SK followed by exactly 10 digits (e.g., SK1234567890)'
    }
  },
  'GR': {
    // Greece: 9 digits for VAT
    vatNumber: {
      minLength: 11, // EL + 9 digits (Greece uses EL prefix in VAT)
      maxLength: 11,
      pattern: /^EL\d{9}$/i,
      description: 'EL followed by 9 digits',
      example: 'EL123456789',
      message: 'Greek VAT number must be EL followed by exactly 9 digits (e.g., EL123456789)'
    }
  },
  'HU': {
    // Hungary: 8 digits for VAT
    vatNumber: {
      minLength: 10, // HU + 8 digits
      maxLength: 10,
      pattern: /^HU\d{8}$/i,
      description: 'HU followed by 8 digits',
      example: 'HU12345678',
      message: 'Hungarian VAT number must be HU followed by exactly 8 digits (e.g., HU12345678)'
    }
  },
  'RO': {
    // Romania: 2-10 digits for VAT
    vatNumber: {
      minLength: 4, // RO + 2 digits
      maxLength: 12, // RO + 10 digits
      pattern: /^RO\d{2,10}$/i,
      description: 'RO followed by 2-10 digits',
      example: 'RO12345678',
      message: 'Romanian VAT number must be RO followed by 2-10 digits (e.g., RO12345678)'
    }
  },
  'BG': {
    // Bulgaria: 9-10 digits for VAT
    vatNumber: {
      minLength: 11, // BG + 9 digits
      maxLength: 12, // BG + 10 digits
      pattern: /^BG\d{9,10}$/i,
      description: 'BG followed by 9-10 digits',
      example: 'BG123456789',
      message: 'Bulgarian VAT number must be BG followed by 9-10 digits (e.g., BG123456789)'
    }
  },
  'HR': {
    // Croatia: 11 digits for VAT
    vatNumber: {
      minLength: 13, // HR + 11 digits
      maxLength: 13,
      pattern: /^HR\d{11}$/i,
      description: 'HR followed by 11 digits',
      example: 'HR12345678901',
      message: 'Croatian VAT number must be HR followed by exactly 11 digits (e.g., HR12345678901)'
    }
  },
  'SI': {
    // Slovenia: 8 digits for VAT
    vatNumber: {
      minLength: 10, // SI + 8 digits
      maxLength: 10,
      pattern: /^SI\d{8}$/i,
      description: 'SI followed by 8 digits',
      example: 'SI12345678',
      message: 'Slovenian VAT number must be SI followed by exactly 8 digits (e.g., SI12345678)'
    }
  },
  'EE': {
    // Estonia: 9 digits for VAT
    vatNumber: {
      minLength: 11, // EE + 9 digits
      maxLength: 11,
      pattern: /^EE\d{9}$/i,
      description: 'EE followed by 9 digits',
      example: 'EE123456789',
      message: 'Estonian VAT number must be EE followed by exactly 9 digits (e.g., EE123456789)'
    }
  },
  'LV': {
    // Latvia: 11 digits for VAT
    vatNumber: {
      minLength: 13, // LV + 11 digits
      maxLength: 13,
      pattern: /^LV\d{11}$/i,
      description: 'LV followed by 11 digits',
      example: 'LV12345678901',
      message: 'Latvian VAT number must be LV followed by exactly 11 digits (e.g., LV12345678901)'
    }
  },
  'LT': {
    // Lithuania: 9-12 digits for VAT
    vatNumber: {
      minLength: 11, // LT + 9 digits
      maxLength: 14, // LT + 12 digits
      pattern: /^LT\d{9,12}$/i,
      description: 'LT followed by 9-12 digits',
      example: 'LT123456789',
      message: 'Lithuanian VAT number must be LT followed by 9-12 digits (e.g., LT123456789)'
    }
  },
  'CH': {
    // Switzerland: 9 characters (CHE + 6 digits + MWST)
    vatNumber: {
      minLength: 15, // CHE + 6 digits + MWST
      maxLength: 15,
      pattern: /^CHE\d{6}MWST$/i,
      description: 'CHE followed by 6 digits and MWST',
      example: 'CHE123456MWST',
      message: 'Swiss VAT number must be CHE followed by 6 digits and MWST (e.g., CHE123456MWST)'
    }
  }
};

/**
 * Validate VAT/Company number based on country
 * @param {string} vatNumber - VAT or company number to validate
 * @param {string} countryCode - ISO country code (e.g., 'BE', 'FR', 'NL')
 * @param {boolean} isCompanyNumber - If true, validate as company number (for Belgium 0208 scheme)
 * @returns {Object} Validation result with isValid, error message, and expected format
 */
export const validateVATNumber = (vatNumber, countryCode, isCompanyNumber = false) => {
  if (!vatNumber || typeof vatNumber !== 'string') {
    return {
      isValid: false,
      error: 'VAT number is required',
      expectedFormat: null
    };
  }

  const cleaned = vatNumber.trim();
  if (!cleaned) {
    return {
      isValid: false,
      error: 'VAT number cannot be empty',
      expectedFormat: null
    };
  }

  const country = countryCode?.toUpperCase() || 'BE';
  const rules = VAT_VALIDATION_RULES[country];

  if (!rules) {
    // No specific rules for this country, do basic validation
    return {
      isValid: cleaned.length >= 3,
      error: cleaned.length < 3 ? 'VAT number is too short' : null,
      expectedFormat: null
    };
  }

  // For Belgium, check if validating company number (0208 scheme)
  if (country === 'BE' && isCompanyNumber && rules.companyNumber) {
    const companyRule = rules.companyNumber;
    const digitsOnly = cleaned.replace(/\D/g, '');
    
    if (!companyRule.pattern.test(digitsOnly)) {
      return {
        isValid: false,
        error: companyRule.message,
        expectedFormat: companyRule.example,
        expectedLength: companyRule.description
      };
    }
    
    return {
      isValid: true,
      error: null,
      expectedFormat: companyRule.example
    };
  }

  // Validate VAT number
  if (rules.vatNumber) {
    const vatRule = rules.vatNumber;
    
    // Check if VAT number already has country prefix
    const hasPrefix = /^[A-Z]{2}/i.test(cleaned);
    let normalizedVAT = cleaned.toUpperCase();
    let cleanedForValidation = cleaned;
    
    // Special case: Greece uses EL prefix, not GR
    // If country is GR but VAT starts with GR, we should normalize to EL for validation
    if (country === 'GR' && hasPrefix && cleaned.toUpperCase().startsWith('GR')) {
      // Replace GR with EL for validation
      cleanedForValidation = 'EL' + cleaned.substring(2);
      normalizedVAT = cleanedForValidation.toUpperCase();
    }
    
    // If no prefix, add country prefix for validation
    if (!hasPrefix) {
      // For Greece, use EL prefix instead of GR
      const prefixToUse = country === 'GR' ? 'EL' : country;
      normalizedVAT = `${prefixToUse}${cleaned}`;
    }
    
    // Check pattern
    if (!vatRule.pattern.test(normalizedVAT)) {
      return {
        isValid: false,
        error: vatRule.message,
        expectedFormat: vatRule.example,
        expectedLength: vatRule.description
      };
    }
    
    // Check length (with country prefix)
    if (normalizedVAT.length < vatRule.minLength || normalizedVAT.length > vatRule.maxLength) {
      // Special handling for Swiss VAT (CHE + 6 digits + MWST)
      if (country === 'CH') {
        const match = normalizedVAT.match(/^CHE(\d{1,6})MWST$/i);
        if (match) {
          const actualDigits = match[1].length;
          return {
            isValid: false,
            error: `${vatRule.message}. You entered ${actualDigits} digit(s), but 6 digit(s) are required between CHE and MWST.`,
            expectedFormat: vatRule.example,
            expectedLength: vatRule.description
          };
        }
        return {
          isValid: false,
          error: vatRule.message,
          expectedFormat: vatRule.example,
          expectedLength: vatRule.description
        };
      }
      
      // Special handling for countries with alphanumeric characters (ES, IE)
      if (country === 'ES') {
        // Spain: ES + 9 alphanumeric characters
        const match = normalizedVAT.match(/^ES([A-Z0-9]{1,9})$/i);
        if (match) {
          const actualChars = match[1].length;
          return {
            isValid: false,
            error: `${vatRule.message}. You entered ${actualChars} character(s) after ES, but 9 alphanumeric characters are required.`,
            expectedFormat: vatRule.example,
            expectedLength: vatRule.description
          };
        }
        return {
          isValid: false,
          error: vatRule.message,
          expectedFormat: vatRule.example,
          expectedLength: vatRule.description
        };
      }
      
      if (country === 'IE') {
        // Ireland: IE + 7 digits + 1-2 alphanumeric characters
        const match = normalizedVAT.match(/^IE(\d{1,7})([A-Z0-9]{0,2})$/i);
        if (match) {
          const actualDigits = match[1].length;
          const actualSuffix = match[2].length;
          if (actualDigits < 7) {
            return {
              isValid: false,
              error: `${vatRule.message}. You entered ${actualDigits} digit(s) after IE, but 7 digits are required, followed by 1-2 alphanumeric characters.`,
              expectedFormat: vatRule.example,
              expectedLength: vatRule.description
            };
          }
          if (actualSuffix === 0) {
            return {
              isValid: false,
              error: `${vatRule.message}. You entered 7 digits but missing 1-2 alphanumeric characters at the end.`,
              expectedFormat: vatRule.example,
              expectedLength: vatRule.description
            };
          }
        }
        return {
          isValid: false,
          error: vatRule.message,
          expectedFormat: vatRule.example,
          expectedLength: vatRule.description
        };
      }
      
      // Special handling for Greece (EL prefix)
      if (country === 'GR') {
        // Greece uses EL prefix, not GR
        const match = normalizedVAT.match(/^EL(\d{1,9})$/i);
        if (match) {
          const actualDigits = match[1].length;
          return {
            isValid: false,
            error: `${vatRule.message}. You entered ${actualDigits} digit(s) after EL, but 9 digits are required. Note: Greece uses EL prefix, not GR.`,
            expectedFormat: vatRule.example,
            expectedLength: vatRule.description
          };
        }
        return {
          isValid: false,
          error: `${vatRule.message}. Note: Greece uses EL prefix, not GR.`,
          expectedFormat: vatRule.example,
          expectedLength: vatRule.description
        };
      }
      
      // For other countries, calculate expected digits
      // Most countries: country code (2 chars) + digits
      // But some have special formats (e.g., AT has ATU, NL has suffix)
      let expectedDigits;
      if (country === 'AT') {
        // ATU + 8 digits
        expectedDigits = 8;
      } else if (country === 'NL') {
        // NL + 9 digits + B01/B02
        expectedDigits = 9;
      } else if (country === 'GB') {
        // GB + 9 or 12 digits (variable)
        // Check if it's closer to 9 or 12
        const digitsOnly = cleaned.replace(/\D/g, '');
        const digitsAfterGB = hasPrefix ? cleaned.substring(2).replace(/\D/g, '').length : digitsOnly.length;
        if (digitsAfterGB < 9) {
          expectedDigits = 9;
        } else if (digitsAfterGB < 12) {
          expectedDigits = 12;
        } else {
          expectedDigits = 12;
        }
      } else if (['CZ', 'RO', 'BG', 'LT'].includes(country)) {
        // Variable length countries - use min length for error message
        expectedDigits = vatRule.minLength - 2;
      } else {
        // Standard: country code (2 chars) + digits
        expectedDigits = vatRule.minLength - 2;
      }
      
      // Provide more specific error based on what's wrong
      const digitsOnly = cleaned.replace(/\D/g, '');
      
      if (hasPrefix) {
        // Extract digits after country prefix
        let actualDigits;
        if (country === 'AT') {
          // ATU format
          const match = cleaned.match(/^ATU(\d+)/i);
          actualDigits = match ? match[1].length : 0;
        } else if (country === 'NL') {
          // NL + digits + B01/B02
          const match = cleaned.match(/^NL(\d+)/i);
          actualDigits = match ? match[1].length : 0;
        } else if (country === 'GR') {
          // EL format (Greece)
          const match = cleaned.match(/^EL(\d+)/i);
          actualDigits = match ? match[1].length : 0;
        } else {
          // Standard: remove first 2 chars (country code)
          actualDigits = cleaned.substring(2).replace(/\D/g, '').length;
        }
        
        // For variable length countries, provide range
        if (['CZ', 'RO', 'BG', 'LT'].includes(country)) {
          const minDigits = vatRule.minLength - 2;
          const maxDigits = vatRule.maxLength - 2;
          return {
            isValid: false,
            error: `${vatRule.message}. You entered ${actualDigits} digit(s), but ${minDigits}-${maxDigits} digits are required.`,
            expectedFormat: vatRule.example,
            expectedLength: vatRule.description
          };
        }
        
        return {
          isValid: false,
          error: `${vatRule.message}. You entered ${actualDigits} digit(s), but ${expectedDigits} digit(s) are required.`,
          expectedFormat: vatRule.example,
          expectedLength: vatRule.description
        };
      } else {
        // For variable length countries, provide range
        if (['CZ', 'RO', 'BG', 'LT'].includes(country)) {
          const minDigits = vatRule.minLength - 2;
          const maxDigits = vatRule.maxLength - 2;
          return {
            isValid: false,
            error: `${vatRule.message}. You entered ${digitsOnly.length} digit(s), but ${minDigits}-${maxDigits} digits are required (format: ${vatRule.example}).`,
            expectedFormat: vatRule.example,
            expectedLength: vatRule.description
          };
        }
        
        return {
          isValid: false,
          error: `${vatRule.message}. You entered ${digitsOnly.length} digit(s), but ${expectedDigits} digit(s) are required (format: ${vatRule.example}).`,
          expectedFormat: vatRule.example,
          expectedLength: vatRule.description
        };
      }
    }
    
    return {
      isValid: true,
      error: null,
      expectedFormat: vatRule.example
    };
  }

  // Fallback: basic validation
  return {
    isValid: cleaned.length >= 5,
    error: cleaned.length < 5 ? 'VAT number is too short' : null,
    expectedFormat: null
  };
};

/**
 * Get expected format message for a country
 * @param {string} countryCode - ISO country code
 * @param {boolean} isCompanyNumber - If true, get company number format (for Belgium)
 * @returns {string} User-friendly format description
 */
export const getExpectedFormat = (countryCode, isCompanyNumber = false) => {
  const country = countryCode?.toUpperCase() || 'BE';
  const rules = VAT_VALIDATION_RULES[country];

  if (!rules) {
    return 'Enter a valid VAT or company number';
  }

  if (country === 'BE' && isCompanyNumber && rules.companyNumber) {
    return `Expected format: ${rules.companyNumber.description} (e.g., ${rules.companyNumber.example})`;
  }

  if (rules.vatNumber) {
    return `Expected format: ${rules.vatNumber.description} (e.g., ${rules.vatNumber.example})`;
  }

  return 'Enter a valid VAT or company number';
};

