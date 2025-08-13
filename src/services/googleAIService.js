// Google AI Service using Gemini API
import { GoogleGenerativeAI } from '@google/generative-ai';

// Language helpers
function getAppLanguage(defaultLang = 'fr') {
  try {
    const lang = typeof window !== 'undefined' ? (localStorage.getItem('language') || defaultLang) : defaultLang;
    return (lang || defaultLang).toLowerCase();
  } catch (_) {
    return defaultLang;
  }
}

function getLanguageLabel(lang) {
  const code = (lang || 'fr').toLowerCase();
  if (code.startsWith('en')) return 'anglais';
  if (code.startsWith('nl')) return 'néerlandais';
  if (code.startsWith('fr')) return 'français';
  return code;
}

// Dynamic length helpers to keep AI output proportional to input
function getLengthConstraintsFromInput(inputText = '') {
  const wordCount = (inputText || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  let maxSentences;
  let maxWords;

  if (wordCount <= 2) {
    maxSentences = 1;
    maxWords = 10; // ultra concise
  } else if (wordCount <= 8) {
    maxSentences = 1;
    maxWords = 20; // short single sentence
  } else if (wordCount <= 20) {
    maxSentences = 2;
    maxWords = 40; // brief two sentences
  } else {
    maxSentences = 3;
    maxWords = 70; // concise three sentences max
  }

  // Rough token cap from word cap
  const maxOutputTokens = Math.max(60, Math.min(800, Math.round(maxWords * 1.6)));

  return { wordCount, maxSentences, maxWords, maxOutputTokens };
}

function trimTextToLimits(text = '', maxSentences = 2, maxWords = 40) {
  let trimmed = (text || '').trim();
  if (!trimmed) return trimmed;

  // Limit sentences first
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, maxSentences);
  trimmed = sentences.join(' ');

  // Then limit total words
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    trimmed = words.slice(0, maxWords).join(' ');
    // Ensure sensible ending punctuation
    if (!/[.!?]$/.test(trimmed)) trimmed += '.';
  }

  return trimmed;
}

// More generous limits specifically for task descriptions
function getTaskLengthConstraintsFromInput(inputText = '') {
  const wordCount = (inputText || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  let maxSentences;
  let maxWords;

  if (wordCount <= 2) {
    maxSentences = 2;
    maxWords = 30;
  } else if (wordCount <= 8) {
    maxSentences = 2;
    maxWords = 50;
  } else if (wordCount <= 20) {
    maxSentences = 3;
    maxWords = 80;
  } else {
    maxSentences = 4;
    maxWords = 120;
  }

  const maxOutputTokens = Math.max(200, Math.round(maxWords * 1.8));

  return { wordCount, maxSentences, maxWords, maxOutputTokens };
}

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
    const { maxSentences, maxWords, maxOutputTokens } = getLengthConstraintsFromInput(userContext);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
      },
    });
    
    // Build the prompt based on category and context
    const lang = getAppLanguage('fr-FR');
    const langLabel = getLanguageLabel(lang);
    const prompt = `Tu es un expert en devis et estimation de projets de construction et rénovation. 
    Ta tâche est d'écrire une description de projet professionnelle en ${langLabel}, 
    avec une longueur proportionnelle au contexte fourni.

Écris une description de projet professionnelle pour un devis basée sur les informations suivantes:

Catégorie: ${category === 'autre' ? customCategory : category}
Contexte fourni par l'utilisateur: ${userContext || 'Aucun contexte fourni'}

La description doit:
 - Être professionnelle et claire
- Inclure les éléments techniques pertinents
- Être adaptée à la catégorie sélectionnée
 - Respecter des contraintes de longueur dynamiques:
   • Si le contexte est très court (1-2 mots), produire 1 phrase très courte (≤ ${Math.min(maxWords, 12)} mots)
   • Si le contexte est court, produire 1 phrase courte (≤ ${maxWords} mots)
   • Sinon, maximum ${maxSentences} phrases et ≤ ${maxWords} mots au total
  - Être en ${langLabel}
- Être claire pour le client et l'équipe technique

Format de réponse: Description du projet uniquement, sans introduction ni conclusion.`;
    
    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();
    text = trimTextToLimits(text, maxSentences, maxWords);
    
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
export const generateTaskDescriptionWithGemini = async (taskContext, projectContext = '') => {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      return { 
        success: false, 
        error: 'Google AI API key not configured' 
      };
    }

    // Initialize Google Generative AI (Free Tier)
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    const { maxSentences, maxWords, maxOutputTokens } = getTaskLengthConstraintsFromInput(taskContext);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.5,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: Math.max(120, maxOutputTokens),
      },
    });
    
    // Build the prompt for task description generation
    const lang = getAppLanguage('fr-FR');
    const langLabel = getLanguageLabel(lang);
    const prompt = `Expert construction/rénovation. Crée une description de tâche technique en ${langLabel}. 
Fournis des détails techniques concrets (étapes, prérequis, critères d’acceptation) tout en restant concise.

CONTEXTE: "${taskContext}"
CONTEXTE PROJET (si utile): "${projectContext || 'N/A'}"

GÉNÈRE JSON:
{
  "description": "Description proportionnelle au contexte en ${langLabel}, ${maxSentences} phrases maximum (≈ ≤ ${maxWords} mots), incluant étapes clés et points de contrôle",
  "estimatedDuration": "Durée en minutes (nombre)",
  "suggestedMaterials": [
    {
      "name": "Nom matériau",
      "quantity": "Quantité (nombre)",
      "unit": "Unité (m, m², kg, pièce)",
      "price": "Prix unitaire en euros (nombre, 0 si non précisé)"
    }
  ],
  "laborPrice": "Prix main d’œuvre (en euros, nombre, 0 si non précisé)",
  "unitLaborBasis": "Base du prix main d’œuvre (par tâche/heure, optionnel)",
  "notes": "Courtes notes techniques, optionnel"
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
      if (typeof taskData?.description === 'string') {
        taskData.description = trimTextToLimits(taskData.description, maxSentences, maxWords);
      }
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
    const { maxSentences, maxWords, maxOutputTokens } = getLengthConstraintsFromInput(transcribedText);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
      },
    });
    
    // Determine the main category
    const mainCategory = categories?.includes('autre') ? customCategory : categories?.[0] || '';
    
    // Build the prompt for transcription enhancement with context
    const lang = getAppLanguage('fr-FR');
    const langLabel = getLanguageLabel(lang);
    const prompt = `Tu es un expert en rédaction professionnelle (${langLabel}) spécialisé dans la construction et rénovation. 
    Ta tâche est d'améliorer un texte transcrit par reconnaissance vocale pour un devis professionnel, 
    en conservant une longueur proportionnelle au texte d'origine.

CONTEXTE DU PROJET:
- Catégorie principale: ${mainCategory || 'Non spécifiée'}
- Catégories sélectionnées: ${categories?.join(', ') || 'Aucune'}
- Type de projet: ${mainCategory ? 'Construction/Rénovation' : 'Général'}

TEXTE TRANSCRIT ORIGINAL:
"${transcribedText}"

    AMÉLIORATIONS REQUISES (respecter la concision):
- Corriger la grammaire et l'orthographe
- Améliorer la clarté et la structure
- Rendre le style plus professionnel et technique
- Garder le sens et l'intention originale
- Adapter le vocabulaire au contexte de la catégorie sélectionnée
- Utiliser des termes techniques appropriés pour la construction
    - Longueur maximale: ${maxSentences} phrase(s) et ≤ ${maxWords} mots
- Inclure des détails techniques pertinents pour la catégorie

    FORMAT DE RÉPONSE: Texte amélioré uniquement en ${langLabel}, sans introduction ni commentaires.`;
    
    // Generate enhanced content with Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let enhancedText = response.text().trim();
    enhancedText = trimTextToLimits(enhancedText, maxSentences, maxWords);
    
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
