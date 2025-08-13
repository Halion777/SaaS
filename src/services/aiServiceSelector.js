// AI Service Selector - Google AI only
import { generateProjectDescriptionWithGemini, isGoogleAIServiceAvailable } from './googleAIService';

/**
 * Get the preferred AI service based on availability and configuration
 * @returns {string} 'openai' or 'google' or 'none'
 */
export function getPreferredAIService() {
  const hasGoogleAI = isGoogleAIServiceAvailable();
  return hasGoogleAI ? 'google' : 'none';
}

/**
 * Generate project description using the best available AI service
 * @param {string} category - The selected project category
 * @param {string} userContext - The user's written context/description
 * @param {string} customCategory - Custom category if selected
 * @returns {Promise<{success: boolean, data?: string, error?: string, service?: string}>}
 */
export async function generateProjectDescriptionWithBestService(category, userContext, customCategory = '') {
  const service = getPreferredAIService();
  
  if (service === 'none') {
    return {
      success: false,
      error: 'Aucun service IA configuré. Ajoutez une clé API Google AI.',
      service: 'none'
    };
  }
  
  try {
    const result = await generateProjectDescriptionWithGemini(category, userContext, customCategory);
    result.service = 'google';
    return result;
  } catch (error) {
    console.error(`Error with ${service} service:`, error);
    return {
      success: false,
      error: `Erreur avec le service Google AI`,
      service
    };
  }
}

/**
 * Get service information for UI display
 * @returns {Object} Service information
 */
export function getAIServiceInfo() {
  const service = getPreferredAIService();
  
  if (service === 'google') {
    return {
      name: 'Google Gemini',
      status: 'Disponible',
      icon: '🔵',
      description: 'Service IA Google Gemini'
    };
  } else {
    return {
      name: 'Aucun service',
      status: 'Non configuré',
      icon: '🔴',
      description: 'Aucun service IA configuré'
    };
  }
}
