/**
 * Payment Flow Optimization Utilities
 * Reduces API calls and improves performance during payment processing
 */

// Disable analytics and tracking during payment flow
export const disableTrackingDuringPayment = () => {
  // Disable Google Analytics if present
  if (window.gtag) {
    window.gtag = () => {};
  }
  
  // Disable Facebook Pixel if present
  if (window.fbq) {
    window.fbq = () => {};
  }
  
  // Disable other tracking scripts
  if (window.dataLayer) {
    window.dataLayer = [];
  }
  
  // Disable console logging for performance
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
  
  // Return function to restore console
  return () => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  };
};

// Optimize network requests during payment
export const optimizeNetworkRequests = () => {
  // Reduce polling intervals
  const originalSetInterval = window.setInterval;
  const originalSetTimeout = window.setTimeout;
  
  // Increase intervals for background tasks
  window.setInterval = (fn, delay, ...args) => {
    if (delay < 1000) {
      delay = 1000; // Minimum 1 second for background tasks
    }
    return originalSetInterval(fn, delay, ...args);
  };
  
  return () => {
    window.setInterval = originalSetInterval;
    window.setTimeout = originalSetTimeout;
  };
};

// Clean up on payment completion
export const cleanupPaymentOptimization = (restoreConsole, restoreNetwork) => {
  if (restoreConsole) restoreConsole();
  if (restoreNetwork) restoreNetwork();
};

// Main function to optimize payment flow
export const optimizePaymentFlow = () => {
  const restoreConsole = disableTrackingDuringPayment();
  const restoreNetwork = optimizeNetworkRequests();
  
  return () => cleanupPaymentOptimization(restoreConsole, restoreNetwork);
}; 