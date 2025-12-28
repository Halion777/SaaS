/**
 * European-style number formatting utilities
 * Uses comma as decimal separator (European format)
 */

/**
 * Format currency amount with European style (comma as decimal separator)
 * @param {number|string} amount - Amount to format
 * @param {Object} options - Formatting options
 * @param {number} options.minimumFractionDigits - Minimum decimal places (default: 2)
 * @param {number} options.maximumFractionDigits - Maximum decimal places (default: 2)
 * @param {boolean} options.showCurrency - Whether to show € symbol (default: true)
 * @returns {string} - Formatted amount (e.g., "1.234,56 €" or "1.234,56€")
 */
export function formatCurrency(amount, options = {}) {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showCurrency = true
  } = options;

  // Handle null, undefined, or invalid values
  if (amount === null || amount === undefined || amount === '' || isNaN(Number(amount))) {
    const zero = (0).toLocaleString('fr-FR', {
      minimumFractionDigits,
      maximumFractionDigits,
      style: showCurrency ? 'currency' : 'decimal',
      currency: 'EUR'
    });
    return showCurrency ? zero : zero.replace('€', '').trim();
  }

  const num = typeof amount === 'string' ? parseFloat(amount.replace(',', '.')) : Number(amount);

  if (isNaN(num)) {
    const zero = (0).toLocaleString('fr-FR', {
      minimumFractionDigits,
      maximumFractionDigits,
      style: showCurrency ? 'currency' : 'decimal',
      currency: 'EUR'
    });
    return showCurrency ? zero : zero.replace('€', '').trim();
  }

  return num.toLocaleString('fr-FR', {
    minimumFractionDigits,
    maximumFractionDigits,
    style: showCurrency ? 'currency' : 'decimal',
    currency: 'EUR'
  });
}

/**
 * Format number with European style (comma as decimal separator)
 * @param {number|string} value - Value to format
 * @param {Object} options - Formatting options
 * @param {number} options.minimumFractionDigits - Minimum decimal places (default: 2)
 * @param {number} options.maximumFractionDigits - Maximum decimal places (default: 2)
 * @returns {string} - Formatted number (e.g., "1.234,56")
 */
export function formatNumber(value, options = {}) {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;

  // Handle null, undefined, or invalid values
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return (0).toLocaleString('fr-FR', {
      minimumFractionDigits,
      maximumFractionDigits
    });
  }

  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);

  if (isNaN(num)) {
    return (0).toLocaleString('fr-FR', {
      minimumFractionDigits,
      maximumFractionDigits
    });
  }

  return num.toLocaleString('fr-FR', {
    minimumFractionDigits,
    maximumFractionDigits
  });
}

/**
 * Format number without decimals (for counts, integers)
 * @param {number|string} value - Value to format
 * @returns {string} - Formatted number (e.g., "1.234")
 */
export function formatInteger(value) {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return '0';
  }

  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);

  if (isNaN(num)) {
    return '0';
  }

  return Math.round(num).toLocaleString('fr-FR');
}

/**
 * Format percentage with European style
 * @param {number|string} value - Percentage value (0-100)
 * @param {Object} options - Formatting options
 * @param {number} options.minimumFractionDigits - Minimum decimal places (default: 0)
 * @param {number} options.maximumFractionDigits - Maximum decimal places (default: 0)
 * @returns {string} - Formatted percentage (e.g., "45,5 %")
 */
export function formatPercentage(value, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options;

  if (value === null || value === undefined || value === '' || isNaN(Number(value))) {
    return (0).toLocaleString('fr-FR', {
      minimumFractionDigits,
      maximumFractionDigits
    }) + ' %';
  }

  const num = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : Number(value);

  if (isNaN(num)) {
    return '0 %';
  }

  return num.toLocaleString('fr-FR', {
    minimumFractionDigits,
    maximumFractionDigits
  }) + ' %';
}
