// AI Service Selector - Choose between OpenAI and Google AI
import { generateProjectDescription } from './openaiService';
import { generateProjectDescriptionWithGemini, isGoogleAIServiceAvailable } from './googleAIService';

/**
 * Get the preferred AI service based on availability and configuration
 * @returns {string} 'openai' or 'google' or 'none'
 */
export function getPreferredAIService() {
  const hasOpenAI = !!import.meta.env.VITE_OPENAI_API_KEY;
  const hasGoogleAI = isGoogleAIServiceAvailable();
  
  // Priority: Google AI first (usually more reliable), then OpenAI
  if (hasGoogleAI) return 'google';
  if (hasOpenAI) return 'openai';
  return 'none';
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
      error: 'Aucun service IA configuré. Ajoutez une clé API OpenAI ou Google AI.',
      service: 'none'
    };
  }
  
  try {
    let result;
    
    if (service === 'google') {
      result = await generateProjectDescriptionWithGemini(category, userContext, customCategory);
      result.service = 'google';
    } else if (service === 'openai') {
      result = await generateProjectDescription(category, userContext, customCategory);
      result.service = 'openai';
    }
    
    return result;
  } catch (error) {
    console.error(`Error with ${service} service:`, error);
    return {
      success: false,
      error: `Erreur avec le service ${service === 'google' ? 'Google AI' : 'OpenAI'}`,
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
  } else if (service === 'openai') {
    return {
      name: 'OpenAI GPT',
      status: 'Disponible',
      icon: '🟢',
      description: 'Service IA OpenAI GPT'
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
