// Google AI Service using Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate a project description using Google Gemini AI
 * @param {string} category - The selected project category
 * @param {string} userContext - The user's written context/description
 * @param {string} customCategory - Custom category if selected
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export const generateProjectDescriptionWithGemini = async (category, userContext, customCategory = '') => {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      return { 
        success: false, 
        error: 'Google AI API key not configured' 
      };
    }

    // Initialize Google Generative AI (Free Tier)
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Updated to latest free model
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 200,
      },
    });
    
    // Build the prompt based on category and context
    const prompt = `Tu es un expert en devis et estimation de projets de construction et rénovation. 
    Ta tâche est d'écrire une description de projet professionnelle et détaillée en français.

Écris une description de projet professionnelle pour un devis basée sur les informations suivantes:

Catégorie: ${category === 'autre' ? customCategory : category}
Contexte fourni par l'utilisateur: ${userContext || 'Aucun contexte fourni'}

La description doit:
- Être professionnelle et détaillée
- Inclure les éléments techniques pertinents
- Être adaptée à la catégorie sélectionnée
- Faire entre 2-4 phrases
- Être en français
- Être claire pour le client et l'équipe technique

Format de réponse: Description du projet uniquement, sans introduction ni conclusion.`;
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    if (!text) {
      return { 
        success: false, 
        error: 'Aucune description générée par Google AI' 
      };
    }

    return { success: true, data: text };

  } catch (error) {
    console.error('Error generating Google AI description:', error);
    
    // Handle specific Google AI errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return { 
        success: false, 
        error: 'Clé API Google AI invalide. Vérifiez votre configuration.' 
      };
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      return { 
        success: false, 
        error: 'Quota Google AI épuisé. Vérifiez votre plan sur Google AI Studio.' 
      };
    } else if (error.message?.includes('RATE_LIMIT')) {
      return { 
        success: false, 
        error: 'Limite de vitesse Google AI dépassée. Attendez quelques minutes.' 
      };
    } else if (error.message?.includes('SAFETY')) {
      return { 
        success: false, 
        error: 'Contenu bloqué par les filtres de sécurité Google AI.' 
      };
    }
    
    return { 
      success: false, 
      error: 'Erreur lors de la génération de la description avec Google AI. Vérifiez votre connexion.' 
    };
  }
};

// Rate limiting for free tier (15 requests per minute)
let requestCount = 0;
let lastResetTime = Date.now();
const FREE_TIER_LIMIT = 15; // requests per minute
const RESET_INTERVAL = 60 * 1000; // 1 minute in milliseconds

/**
 * Check if Google AI service is available
 * @returns {boolean} True if API key is configured
 */
export function isGoogleAIServiceAvailable() {
  return !!import.meta.env.VITE_GOOGLE_AI_API_KEY;
}

/**
 * Check if we can make a request (free tier limits)
 * @returns {boolean} True if request is allowed
 */
export function canMakeRequest() {
  const now = Date.now();
  
  // Reset counter if a minute has passed
  if (now - lastResetTime >= RESET_INTERVAL) {
    requestCount = 0;
    lastResetTime = now;
  }
  
  return requestCount < FREE_TIER_LIMIT;
}

/**
 * Increment request counter
 */
function incrementRequestCount() {
  requestCount++;
}

/**
 * Get Google AI service status
 * @returns {Object} Service status information
 */
export function getGoogleAIServiceStatus() {
  return {
    available: isGoogleAIServiceAvailable(),
    provider: 'Google Gemini (Free Tier)',
    model: 'gemini-1.5-flash',
    features: ['Project Description Generation', 'Task Suggestions'],
    limits: {
      requestsPerMinute: 15,
      maxTokens: 200,
      cost: 'Free'
    }
  };
}

/**
 * Generate task suggestions using Google Gemini
 * @param {string} category - The selected project category
 * @param {string} projectDescription - The project description
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const generateTaskSuggestionsWithGemini = async (category, projectDescription) => {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      return { 
        success: false, 
        error: 'Google AI API key not configured' 
      };
    }

    // Initialize Google Generative AI (Free Tier)
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // Updated to latest free model
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300,
      },
    });
    
    // Build the prompt for task suggestions
    const prompt = `Tu es un expert en estimation de projets de construction et rénovation. 
    Ta tâche est de suggérer des tâches techniques basées sur la catégorie et description du projet.

Suggère 3-5 tâches techniques pour ce projet:

Catégorie: ${category}
Description: ${projectDescription}

Format de réponse: JSON array avec chaque tâche ayant:
{
  "title": "Nom de la tâche",
  "description": "Description technique détaillée",
  "estimatedDuration": "Durée estimée en minutes",
  "complexity": "simple/moyen/complexe"
}

Réponds uniquement en JSON valide, sans texte supplémentaire.`;
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    
    if (!content) {
      return { 
        success: false, 
        error: 'Aucune suggestion générée par Google AI' 
      };
    }

    // Try to parse JSON response
    try {
      const suggestions = JSON.parse(content);
      return { 
        success: true, 
        data: suggestions 
      };
    } catch (parseError) {
      console.error('Error parsing Google AI response:', parseError);
      return { 
        success: false, 
        error: 'Format de réponse invalide de Google AI' 
      };
    }

  } catch (error) {
    console.error('Error generating task suggestions with Google AI:', error);
    
    // Handle specific Google AI errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return { 
        success: false, 
        error: 'Clé API Google AI invalide. Vérifiez votre configuration.' 
      };
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      return { 
        success: false, 
        error: 'Quota Google AI épuisé. Vérifiez votre plan sur Google AI Studio.' 
      };
    } else if (error.message?.includes('RATE_LIMIT')) {
      return { 
        success: false, 
        error: 'Limite de vitesse Google AI dépassée. Attendez quelques minutes.' 
      };
    } else if (error.message?.includes('SAFETY')) {
      return { 
        success: false, 
        error: 'Contenu bloqué par les filtres de sécurité Google AI.' 
      };
    }
    
    return { 
      success: false, 
      error: 'Erreur lors de la génération des suggestions de tâches avec Google AI. Vérifiez votre connexion.' 
    };
  }
};

/**
 * Generate task description using Google Gemini AI
 * @param {string} taskContext - The task context or description
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const generateTaskDescriptionWithGemini = async (taskContext) => {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      return { 
        success: false, 
        error: 'Google AI API key not configured' 
      };
    }

    // Initialize Google Generative AI (Free Tier)
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800, // Increased to handle longer responses
      },
    });
    
    // Build the prompt for task description generation
    const prompt = `Expert construction/rénovation. Crée description pour tâche technique.

CONTEXTE: "${taskContext}"

GÉNÈRE JSON:
{
  "description": "Description professionnelle (2-3 phrases max)",
  "estimatedDuration": "Durée en minutes (nombre)",
  "suggestedMaterials": [
    {
      "name": "Nom matériau",
      "quantity": "Quantité (nombre)",
      "unit": "Unité (m, m², kg, pièce)"
    }
  ]
}

IMPORTANT: JSON valide uniquement, SANS marqueurs markdown.`;
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();
    
    if (!content) {
      return { 
        success: false, 
        error: 'Aucune description générée par Google AI' 
      };
    }

    // Try to parse JSON response - clean markdown formatting first
    try {
      // Remove markdown code blocks if present
      let cleanContent = content;
      if (content.includes('```json')) {
        cleanContent = content.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (content.includes('```')) {
        cleanContent = content.replace(/```\s*/, '');
      }
      
      // Trim whitespace
      cleanContent = cleanContent.trim();
      
      // Check if the JSON is complete (has balanced braces and brackets)
      const openBraces = (cleanContent.match(/\{/g) || []).length;
      const closeBraces = (cleanContent.match(/\}/g) || []).length;
      const openBrackets = (cleanContent.match(/\[/g) || []).length;
      const closeBrackets = (cleanContent.match(/\]/g) || []).length;
      
      // If JSON is incomplete, try to complete it
      if (openBraces > closeBraces || openBrackets > closeBrackets) {
        // Find the last complete object/array and truncate there
        let lastCompleteIndex = cleanContent.lastIndexOf('}');
        if (lastCompleteIndex === -1) {
          lastCompleteIndex = cleanContent.lastIndexOf(']');
        }
        
        if (lastCompleteIndex > 0) {
          // Find the matching opening brace/bracket
          let braceCount = 0;
          let bracketCount = 0;
          let startIndex = -1;
          
          for (let i = lastCompleteIndex; i >= 0; i--) {
            if (cleanContent[i] === '}') braceCount++;
            else if (cleanContent[i] === '{') braceCount--;
            else if (cleanContent[i] === ']') bracketCount++;
            else if (cleanContent[i] === '[') bracketCount--;
            
            if (braceCount === 0 && bracketCount === 0) {
              startIndex = i;
              break;
            }
          }
          
          if (startIndex >= 0) {
            cleanContent = cleanContent.substring(startIndex, lastCompleteIndex + 1);
          }
        }
      }
      
      const taskData = JSON.parse(cleanContent);
      return { 
        success: true, 
        data: taskData 
      };
    } catch (parseError) {
      console.error('Error parsing Google AI response:', parseError);
      console.error('Raw content:', content);
      
      // Try to extract partial data if possible
      try {
        // Look for partial JSON structure
        const descriptionMatch = content.match(/"description":\s*"([^"]+)"/);
        const durationMatch = content.match(/"estimatedDuration":\s*(\d+)/);
        const materialsMatch = content.match(/"suggestedMaterials":\s*\[([^\]]*)\]/);
        
        if (descriptionMatch) {
          const partialData = {
            description: descriptionMatch[1],
            estimatedDuration: durationMatch ? parseInt(durationMatch[1]) : 60,
            suggestedMaterials: []
          };
          
          // Try to extract materials if available
          if (materialsMatch && materialsMatch[1]) {
            const materialMatches = materialsMatch[1].match(/\{[^}]+\}/g);
            if (materialMatches) {
              partialData.suggestedMaterials = materialMatches.map(mat => {
                const nameMatch = mat.match(/"name":\s*"([^"]+)"/);
                const quantityMatch = mat.match(/"quantity":\s*(\d+)/);
                const unitMatch = mat.match(/"unit":\s*"([^"]+)"/);
                
                return {
                  name: nameMatch ? nameMatch[1] : 'Matériau non spécifié',
                  quantity: quantityMatch ? parseInt(quantityMatch[1]) : 1,
                  unit: unitMatch ? unitMatch[1] : 'pièce'
                };
              });
            }
          }
          
          return {
            success: true,
            data: partialData,
            warning: 'Réponse partielle - certaines données peuvent être incomplètes'
          };
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
      }
      
      return { 
        success: false, 
        error: 'Format de réponse invalide de Google AI' 
      };
    }

  } catch (error) {
    console.error('Error generating task description with Google AI:', error);
    
    // Handle specific Google AI errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return { 
        success: false, 
        error: 'Clé API Google AI invalide. Vérifiez votre configuration.' 
      };
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      return { 
        success: false, 
        error: 'Quota Google AI épuisé. Vérifiez votre plan sur Google AI Studio.' 
      };
    } else if (error.message?.includes('RATE_LIMIT')) {
      return { 
        success: false, 
        error: 'Limite de vitesse Google AI dépassée. Attendez quelques minutes.' 
      };
    } else if (error.message?.includes('SAFETY')) {
      return { 
        success: false, 
        error: 'Contenu bloqué par les filtres de sécurité Google AI.' 
      };
    }
    
    return { 
      success: false, 
      error: 'Erreur lors de la génération de la description de tâche avec Google AI. Vérifiez votre connexion.' 
    };
  }
};

/**
 * Enhance transcribed speech with AI to improve grammar, clarity, and professionalism
 * @param {string} transcribedText - Raw transcribed text from speech
 * @param {Array} categories - Selected project categories
 * @param {string} customCategory - Custom category if selected
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export const enhanceTranscriptionWithAI = async (transcribedText, categories = [], customCategory = '') => {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      return { 
        success: false, 
        error: 'Google AI API key not configured' 
      };
    }

    // Initialize Google Generative AI (Free Tier)
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent editing
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 300,
      },
    });
    
    // Determine the main category
    const mainCategory = categories?.includes('autre') ? customCategory : categories?.[0] || '';
    
    // Build the prompt for transcription enhancement with context
    const prompt = `Tu es un expert en rédaction professionnelle française spécialisé dans la construction et rénovation. 
    Ta tâche est d'améliorer un texte transcrit par reconnaissance vocale pour un devis professionnel.

CONTEXTE DU PROJET:
- Catégorie principale: ${mainCategory || 'Non spécifiée'}
- Catégories sélectionnées: ${categories?.join(', ') || 'Aucune'}
- Type de projet: ${mainCategory ? 'Construction/Rénovation' : 'Général'}

TEXTE TRANSCRIT ORIGINAL:
"${transcribedText}"

AMÉLIORATIONS REQUISES:
- Corriger la grammaire et l'orthographe
- Améliorer la clarté et la structure
- Rendre le style plus professionnel et technique
- Garder le sens et l'intention originale
- Adapter le vocabulaire au contexte de la catégorie sélectionnée
- Utiliser des termes techniques appropriés pour la construction
- Structurer en 2-4 phrases claires et professionnelles
- Inclure des détails techniques pertinents pour la catégorie

FORMAT DE RÉPONSE: Texte amélioré uniquement, sans introduction ni commentaires.`;
    
    // Generate enhanced content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedText = response.text().trim();
    
    if (!enhancedText) {
      return { 
        success: false, 
        error: 'Aucun texte amélioré généré par Google AI' 
      };
    }

    return { success: true, data: enhancedText };

  } catch (error) {
    console.error('Error enhancing transcription with Google AI:', error);
    
    // Handle specific Google AI errors
    if (error.message?.includes('API_KEY_INVALID')) {
      return { 
        success: false, 
        error: 'Clé API Google AI invalide. Vérifiez votre configuration.' 
      };
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      return { 
        success: false, 
        error: 'Quota Google AI épuisé. Vérifiez votre plan sur Google AI Studio.' 
      };
    } else if (error.message?.includes('RATE_LIMIT')) {
      return { 
        success: false, 
        error: 'Limite de vitesse Google AI dépassée. Attendez quelques minutes.' 
      };
    } else if (error.message?.includes('SAFETY')) {
      return { 
        success: false, 
        error: 'Contenu bloqué par les filtres de sécurité Google AI.' 
      };
    }
    
    return { 
      success: false, 
      error: 'Erreur lors de l\'amélioration du texte avec Google AI. Vérifiez votre connexion.' 
    };
  }
};
