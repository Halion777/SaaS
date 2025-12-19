/**
 * Centralized Quote Price Calculation Utility
 * 
 * This utility provides a single source of truth for calculating quote prices
 * including tasks, materials, VAT, discounts, and deposits.
 * 
 * Used consistently across:
 * - Quote creation/save/send flows
 * - Database storage
 * - Email templates
 * - PDF generation
 * - Invoice conversion
 */

/**
 * Calculate quote totals from tasks and materials
 * 
 * @param {Array} tasks - Array of task objects with price, materials, etc.
 * @param {Object} financialConfig - Financial configuration object
 * @param {Object} options - Additional options
 * @param {boolean} options.useStoredAmounts - If true, use stored amounts from quote as fallback
 * @param {Object} options.storedQuote - Quote object with stored amounts (for fallback)
 * @returns {Object} - Financial breakdown with all calculated values
 */
export function calculateQuoteTotals(tasks = [], financialConfig = {}, options = {}) {
  const { useStoredAmounts = false, storedQuote = null } = options;

  // Calculate subtotal from tasks and materials
  // Note: Users enter TOTAL prices for materials (already multiplied by quantity)
  // So mat.price should always be the total price - NEVER multiply by quantity
  let totalBeforeVAT = 0;
  
  if (tasks && tasks.length > 0) {
    totalBeforeVAT = tasks.reduce((sum, task) => {
      // Task price (labor) - task.price is total price for the task
      const taskPrice = parseFloat(task.price || task.total_price || 0);
      
      // Materials total - mat.price is ALWAYS total price (users enter total prices)
      // DO NOT multiply by quantity - that would cause double multiplication
      const taskMaterials = task.materials || [];
      const taskMaterialsTotal = taskMaterials.reduce((matSum, mat) => {
        // Prefer price field, then unit_price, then calculate from unit_price * quantity
        const materialPrice = parseFloat(mat.price || mat.unit_price || 0);
        return matSum + materialPrice;
      }, 0);
      
      return sum + taskPrice + taskMaterialsTotal;
    }, 0);
  }

  // Fallback to stored amounts if calculation yields 0 and fallback is enabled
  if (useStoredAmounts && storedQuote && totalBeforeVAT === 0) {
    totalBeforeVAT = parseFloat(storedQuote.total_amount || 0);
  }

  // Get VAT configuration
  const vatConfig = financialConfig?.vatConfig || financialConfig?.vat_config || {};
  const vatEnabled = vatConfig.display !== false && vatConfig.display !== undefined;
  const vatRate = vatEnabled ? parseFloat(vatConfig.rate || 0) : 0;
  
  // Helper function to round VAT up (ceiling) to 2 decimal places
  // Example: 72.975 -> 72.98 (not 72.97)
  // This ensures VAT always rounds up when calculated from percentage
  const roundVatUp = (vatAmount) => {
    if (!vatAmount || isNaN(vatAmount)) return 0;
    // Multiply by 100, round up (ceiling), then divide by 100
    return Math.ceil(vatAmount * 100) / 100;
  };

  // Calculate VAT amount
  let vatAmount = 0;
  if (vatEnabled && vatRate > 0) {
    // Calculate VAT from percentage and round up (ceiling)
    // Example: 21% of 347.50 = 72.975 -> 72.98
    vatAmount = roundVatUp(totalBeforeVAT * (vatRate / 100));
  } else if (useStoredAmounts && storedQuote?.tax_amount) {
    // Fallback to stored tax amount if VAT is disabled but we have stored value
    vatAmount = parseFloat(storedQuote.tax_amount || 0);
  }

  // Get discount configuration
  const discountConfig = financialConfig?.discountConfig || financialConfig?.discount_config || {};
  const discountEnabled = discountConfig.enabled === true;
  const discountRate = discountEnabled ? parseFloat(discountConfig.rate || 0) : 0;
  const discountAmount = discountEnabled ? (totalBeforeVAT * (discountRate / 100)) : 0;

  // Calculate net amount (after discount, before VAT)
  const netAmount = totalBeforeVAT - discountAmount;

  // Calculate total with VAT
  let totalWithVAT = netAmount + vatAmount;
  
  // Fallback to stored final_amount if calculation yields 0 and fallback is enabled
  if (useStoredAmounts && storedQuote && totalWithVAT === 0 && storedQuote.final_amount) {
    totalWithVAT = parseFloat(storedQuote.final_amount || 0);
  }

  // Get deposit/advance configuration
  const advanceConfig = financialConfig?.advanceConfig || financialConfig?.advance_config || {};
  const depositEnabled = advanceConfig.enabled === true;
  const depositAmount = depositEnabled ? parseFloat(advanceConfig.amount || 0) : 0;

  // Calculate balance (total with VAT minus deposit)
  const balanceAmount = totalWithVAT - depositAmount;

  return {
    // Base amounts
    totalBeforeVAT,        // Subtotal before VAT and discount (sum of tasks + materials)
    netAmount,             // After discount, before VAT
    vatAmount,             // VAT amount
    totalWithVAT,          // Total including VAT (netAmount + vatAmount)
    discountAmount,        // Discount amount
    depositAmount,         // Deposit/advance amount
    balanceAmount,         // Balance after deposit (totalWithVAT - depositAmount)
    
    // Configuration flags
    vatEnabled,
    vatRate,
    discountEnabled,
    discountRate,
    depositEnabled
  };
}

/**
 * Calculate quote totals from database format (quote_tasks and quote_materials)
 * This is used when reading from database where tasks and materials are separate tables
 * 
 * @param {Array} quoteTasks - Array of quote_tasks from database
 * @param {Array} quoteMaterials - Array of quote_materials from database
 * @param {Object} financialConfig - Financial configuration object (from quote_financial_configs)
 * @param {Object} options - Additional options
 * @returns {Object} - Financial breakdown with all calculated values
 */
export function calculateQuoteTotalsFromDB(quoteTasks = [], quoteMaterials = [], financialConfig = {}, options = {}) {
  // Transform database format to calculation format
  const tasks = (quoteTasks || []).map(task => {
    // Get materials for this task
    const taskMaterials = (quoteMaterials || []).filter(m => m.quote_task_id === task.id);
    
    // IMPORTANT: Use total_price if available, otherwise use unit_price as total price
    // DO NOT multiply unit_price by quantity - unit_price is already the total price
    // This matches the user's expectation that unit_price should be treated as price
    const taskPrice = parseFloat(task.total_price || 0) || parseFloat(task.unit_price || 0);
    
    return {
      price: taskPrice,
      total_price: taskPrice,
      materials: taskMaterials.map(mat => ({
        // Use total_price if available, otherwise use unit_price as total price
        // DO NOT multiply by quantity - unit_price is already the total price
        price: parseFloat(mat.total_price || 0) || parseFloat(mat.unit_price || 0),
        unit_price: parseFloat(mat.unit_price || 0),
        quantity: parseFloat(mat.quantity || 1)
      }))
    };
  });

  return calculateQuoteTotals(tasks, financialConfig, options);
}

/**
 * Format currency amount with comma as decimal separator (fr-FR format)
 * @param {number|string} amount - Amount to format
 * @returns {string} - Formatted amount with € symbol (e.g., "730,84€")
 */
export function formatCurrency(amount) {
  const n = Number.isFinite(Number(amount)) ? Number(amount) : 0;
  return n.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) + '€';
}

/**
 * Format number with comma as decimal separator (fr-FR format)
 * @param {number|string} value - Value to format
 * @returns {string} - Formatted number (e.g., "730,84")
 */
export function formatNumber(value) {
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  return n.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

