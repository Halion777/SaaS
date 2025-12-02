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
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash-lite",
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

// Google AI Service Status
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
    model: (import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash-lite'),
    features: ['Project Description Generation', 'Task Suggestions'],
    limits: {
      requestsPerMinute: 15,
      maxTokens: 200,
      cost: 'Free'
    }
  };
}

// Best-effort JSON array parser for LLM outputs that may include fences, smart quotes, or trailing commas
function safeParseJsonArray(possiblyFenced) {
  if (!possiblyFenced || typeof possiblyFenced !== 'string') return null;
  let s = possiblyFenced.trim();
  // Strip markdown fences
  if (s.startsWith('```')) {
    s = s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    s = s.replace(/```\s*$/i, '');
  }
  // Extract array slice between first '[' and last ']'
  const first = s.indexOf('[');
  let last = s.lastIndexOf(']');
  if (first !== -1) {
    if (last !== -1 && last > first) {
      s = s.slice(first, last + 1);
    } else {
      // Missing closing bracket: truncate to last complete object '}' and close array
      const lastBrace = s.lastIndexOf('}');
      if (lastBrace > first) {
        s = s.slice(first, lastBrace + 1) + ']';
      }
    }
  }
  // Normalize smart quotes and collapse newlines inside
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/[\r\n]+/g, ' ');
  // Remove trailing commas before ] or }
  s = s.replace(/,\s*([\]}])/g, '$1');
  // Quote unquoted property names
  s = s.replace(/([\{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
  // Try parse straight away
  try {
    const parsed = JSON.parse(s);
    return Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    // Convert single-quoted strings to double-quoted
    const singleToDouble = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (m, g1) => '"' + g1.replace(/"/g, '\\"') + '"');
    try {
      const parsed2 = JSON.parse(singleToDouble);
      return Array.isArray(parsed2) ? parsed2 : null;
    } catch (_) {
      // Truncate to last complete object if there is a dangling partial at the end
      const lastObjEnd = singleToDouble.lastIndexOf('}');
      if (first !== -1 && lastObjEnd > first) {
        let truncated = singleToDouble.slice(first, lastObjEnd + 1);
        // Ensure it starts with '['
        if (!truncated.trim().startsWith('[')) truncated = '[' + truncated;
        // Remove trailing commas before closing and add ']'
        truncated = truncated.replace(/,\s*$/,'');
        truncated = truncated + ']';
        truncated = truncated.replace(/,\s*([\]}])/g, '$1');
        try {
          const parsed3 = JSON.parse(truncated);
          return Array.isArray(parsed3) ? parsed3 : null;
        } catch (_) {}
      }
      // Try to pull tasks array if wrapped in an object
      const match = singleToDouble.match(/"tasks"\s*:\s*(\[[\s\S]*\])/);
      if (match) {
        try {
          const arr = JSON.parse(match[1]);
          return Array.isArray(arr) ? arr : null;
        } catch (_) {}
      }
      return null;
    }
  }
}

// Best-effort JSON object parser with similar robustness to safeParseJsonArray
function safeParseJsonObject(possiblyFenced) {
  if (!possiblyFenced || typeof possiblyFenced !== 'string') return null;
  let s = possiblyFenced.trim();
  // Strip markdown fences
  if (s.startsWith('```')) {
    s = s.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    s = s.replace(/```\s*$/i, '');
  }
  // If multiple blocks present, try to carve first balanced { ... }
  const startObj = s.indexOf('{');
  const lastObj = s.lastIndexOf('}');
  if (startObj !== -1 && lastObj !== -1 && lastObj > startObj) {
    s = s.slice(startObj, lastObj + 1);
  }
  // Normalize smart quotes and collapse newlines inside
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
  s = s.replace(/[\r\n]+/g, ' ');
  // Remove trailing commas before ] or }
  s = s.replace(/,\s*([\]}])/g, '$1');
  // Quote unquoted property names
  s = s.replace(/([\{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
  // Try parse straight away
  try {
    const parsed = JSON.parse(s);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    // Convert single-quoted strings to double-quoted
    const singleToDouble = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (m, g1) => '"' + g1.replace(/"/g, '\\"') + '"');
    try {
      const parsed2 = JSON.parse(singleToDouble);
      return parsed2 && typeof parsed2 === 'object' && !Array.isArray(parsed2) ? parsed2 : null;
    } catch (_) {
      // If materials array is valid but object wrapper is broken, try to reconstruct
      const desc = singleToDouble.match(/"description"\s*:\s*"([^"]*)"/);
      const dur = singleToDouble.match(/"estimatedDuration"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/);
      const labor = singleToDouble.match(/"laborPrice"\s*:\s*"?(\d+(?:[.,]\d+)?)"?/);
      const unit = singleToDouble.match(/"unitLaborBasis"\s*:\s*"([^"]*)"/);
      const mats = safeParseJsonArray(singleToDouble);
      if (desc || dur || labor || unit || (Array.isArray(mats) && mats.length >= 0)) {
        return {
          description: desc ? desc[1] : undefined,
          estimatedDuration: dur ? parseFloat(dur[1].replace(',', '.')) : undefined,
          suggestedMaterials: Array.isArray(mats) ? mats : undefined,
          laborPrice: labor ? parseFloat(labor[1].replace(',', '.')) : undefined,
          unitLaborBasis: unit ? unit[1] : undefined
        };
      }
      return null;
    }
  }
}

// In-memory cache to avoid repeated API calls across step navigation
const __taskSuggestionsCache = new Map();
function buildTaskSuggestionsCacheKey(category, projectDescription, maxTasks) {
  const cat = (category || '').toString().trim().toLowerCase();
  const desc = (projectDescription || '').toString().trim().toLowerCase().slice(0, 500);
  const n = Number(maxTasks || 3);
  return `${cat}::${n}::${desc}`;
}

/**
 * Generate task suggestions using Google Gemini
 * @param {string} category - The selected project category
 * @param {string} projectDescription - The project description
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const generateTaskSuggestionsWithGemini = async (category, projectDescription, maxTasks = 3) => {
  try {
    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      return { 
        success: false, 
        error: 'Google AI API key not configured' 
      };
    }

    // Check cache first to avoid re-generation on navigation
    const cacheKey = buildTaskSuggestionsCacheKey(category, projectDescription, maxTasks);
    if (__taskSuggestionsCache.has(cacheKey)) {
      const cached = __taskSuggestionsCache.get(cacheKey);
      return { success: true, data: JSON.parse(JSON.stringify(cached)) };
    }

    // Initialize Google Generative AI (Free Tier)
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    const { maxSentences, maxWords, maxOutputTokens } = getTaskLengthConstraintsFromInput(projectDescription || '');
    const perTaskTokenBudget = 180; // approx tokens per task item
    const scaledTokenCap = Math.min(2048, Math.max(512, perTaskTokenBudget * (maxTasks || 3)));
    const model = genAI.getGenerativeModel({ 
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash-lite",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: Math.max(scaledTokenCap, maxOutputTokens),
        responseMimeType: 'application/json'
      },
    });
    
    // Build the prompt for task suggestions
    const lang = getAppLanguage('fr-FR');
    const langLabel = getLanguageLabel(lang);
    const prompt = `Tu es un expert en estimation de projets de construction/rénovation.
Ta tâche est de proposer des tâches adaptées à la catégorie et à la description du projet, avec des informations actionnables.

Propose AU PLUS ${maxTasks} tâches concises pour ce projet (${maxTasks} maximum):

Catégorie: ${category}
Description: ${projectDescription}

Réponds UNIQUEMENT par un tableau JSON (pas de markdown ni de texte hors JSON). Chaque tâche doit respecter EXACTEMENT ce schéma:
{
  "title": "Nom court de la tâche",
  "description": "Description professionnelle concise en ${langLabel} (≤ ${Math.max(25, Math.min(60, maxWords))} mots)",
  "estimatedDuration": 120,
  "laborPrice": 150,
  "suggestedMaterials": [
    { "name": "Nom matériau", "quantity": 1, "unit": "pièce", "price": 10 }
  ]
}

Contraintes:
- Utilise des NOMBRES pour estimatedDuration, laborPrice, quantity et price (pas de chaînes).
- Limite suggestedMaterials à 3 éléments maximum par tâche.
- Si le contexte est long, réduis la longueur des descriptions, PAS la structure JSON.
`;
    
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
      let clean = content;
      if (clean.includes('```json')) clean = clean.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      else if (clean.includes('```')) clean = clean.replace(/```/g, '');
      
      let suggestions;
      try {
        suggestions = JSON.parse(clean);
      } catch (e) {
        const fallback = safeParseJsonArray(clean);
        if (!fallback) throw e;
        suggestions = fallback;
      }
      if (!Array.isArray(suggestions)) {
        // Try to detect array under a known key
        const fallback = safeParseJsonArray(JSON.stringify(suggestions));
        if (fallback) suggestions = fallback;
      }
      // Post-process descriptions to respect length caps
      const processed = Array.isArray(suggestions) ? suggestions.map(s => ({
        ...s,
        description: typeof s.description === 'string' ? trimTextToLimits(s.description, maxSentences, maxWords) : s.description
      })) : [];
      
      // Save to cache
      __taskSuggestionsCache.set(cacheKey, processed);
      return { success: true, data: processed };
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
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash-lite",
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: Math.max(220, maxOutputTokens),
        responseMimeType: 'application/json'
      },
    });
    
    // Build the prompt for task description generation
    const lang = getAppLanguage('fr-FR');
    const langLabel = getLanguageLabel(lang);
    const prompt = `Expert construction/rénovation. Crée une description de tâche technique en ${langLabel}. 
 Fournis des détails techniques concrets (étapes, prérequis, critères d’acceptation) tout en restant concise.

CONTEXTE: "${taskContext}"
CONTEXTE PROJET (si utile): "${projectContext || 'N/A'}"

 GÉNÈRE JSON (UNIQUEMENT le JSON, sans markdown):
{
  "description": "Description proportionnelle au contexte en ${langLabel}, ${maxSentences} phrases maximum (≈ ≤ ${maxWords} mots), incluant étapes clés et points de contrôle",
  "estimatedDuration": 120,
  "suggestedMaterials": [
    {
      "name": "Nom matériau",
      "quantity": 1,
      "unit": "Unité (m, m², kg, pièce)",
      "price": 10
    }
  ],
  "laborPrice": 150,
  "unitLaborBasis": "hour|task",
  "notes": "Courtes notes techniques, optionnel"
}

 CONTRAINTES:
 - Utilise des NOMBRES (pas de chaînes) pour estimatedDuration, laborPrice, suggestedMaterials[].quantity et suggestedMaterials[].price.
 - RENSEIGNE TOUJOURS laborPrice (nombre):
   • Si l'utilisateur donne un tarif horaire, mets unitLaborBasis="hour" et laborPrice=tarif horaire.
   • Sinon, si une durée est fournie/sous-entendue, DÉDUIS un tarif horaire réaliste pour le métier et calcule un coût (laborPrice=tarif horaire). Mets unitLaborBasis="hour".
   • Si rien n'est précisé, fournis un PRIX FORFAITAIRE réaliste (unitLaborBasis="task").
  - La tarification doit être un BAS DE FOURCHETTE du marché (estimation minimale réaliste pour ce type de tâche), jamais un tarif premium.
  - Si l'incertitude est élevée, choisis la borne basse plausible du marché pour ce métier.
  - Les prix matériaux également au niveau d'entrée de gamme (réalistes), pas premium.
  - La sortie doit être du JSON strict, sans texte additionnel.`;
    
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
      
      // Try to carve out the outermost complete JSON block first (prefers top-level object/array)
      const extractOutermost = (text) => {
        const pickBlock = (openChar, closeChar) => {
          const start = text.indexOf(openChar);
          if (start === -1) return null;
          let depth = 0;
          for (let i = start; i < text.length; i++) {
            const ch = text[i];
            if (ch === openChar) depth++;
            else if (ch === closeChar) {
              depth--;
              if (depth === 0) return text.substring(start, i + 1);
            }
          }
          return null;
        };
        // Prefer object; if none, try array
        return pickBlock('{', '}') || pickBlock('[', ']');
      };
      const outer = extractOutermost(cleanContent);
      if (outer) cleanContent = outer;
      
      // Prefer strict parse; if it fails downstream, fall back to a robust parser
      let taskData;
      try {
        taskData = JSON.parse(cleanContent);
      } catch (_) {
        taskData = safeParseJsonObject(cleanContent);
      }
      // Sometimes the model returns an array with a single object
      if (Array.isArray(taskData)) {
        taskData = taskData[0] || {};
      }
      if (!taskData || typeof taskData !== 'object') {
        throw new Error('Invalid JSON object');
      }
      if (typeof taskData?.description === 'string') {
        taskData.description = trimTextToLimits(taskData.description, maxSentences, maxWords);
      }
      return { 
        success: true, 
        data: taskData 
      };
    } catch (parseError) {
      console.error('Error parsing Google AI response:', parseError);
      
      // Try to extract partial data if possible
      try {
        // Look for partial JSON structure
        const descriptionMatch = content.match(/"description":\s*"([^"]+)"/);
        const durationMatch = content.match(/"estimatedDuration":\s*(\d+)/);
        const materialsMatch = content.match(/"suggestedMaterials":\s*\[([^\]]*)\]/);
        const laborPriceMatch = content.match(/"laborPrice":\s*"?(\d+(?:[.,]\d+)?)"?/);
        const unitBasisMatch = content.match(/"unitLaborBasis":\s*"([^"]*)"/);
        
        if (descriptionMatch) {
          const partialData = {
            description: descriptionMatch[1],
            estimatedDuration: durationMatch ? parseInt(durationMatch[1]) : 60,
            suggestedMaterials: [],
            laborPrice: laborPriceMatch ? parseFloat(laborPriceMatch[1].replace(',', '.')) : undefined,
            unitLaborBasis: unitBasisMatch ? unitBasisMatch[1] : undefined
          };
          
          // Try to extract materials if available
          if (materialsMatch && materialsMatch[1]) {
            const materialMatches = materialsMatch[1].match(/\{[^}]+\}/g);
            if (materialMatches) {
              partialData.suggestedMaterials = materialMatches.map(mat => {
                const nameMatch = mat.match(/"name":\s*"([^"]+)"/);
                const quantityMatch = mat.match(/"quantity":\s*"?(\d+(?:[.,]\d+)?)"?/);
                const unitMatch = mat.match(/"unit":\s*"([^"]+)"/);
                const priceMatch = mat.match(/"price":\s*"?(\d+(?:[.,]\d+)?)"?/);
                
                return {
                  name: nameMatch ? nameMatch[1] : 'Matériau non spécifié',
                  quantity: quantityMatch ? parseFloat(quantityMatch[1].replace(',', '.')) : 1,
                  unit: unitMatch ? unitMatch[1] : 'pièce',
                  price: priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0
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
        console.error('Fallback parsing failed:', fallbackError);
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
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash-lite",
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

/**
 * Translate text to target language using Google AI
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code ('fr', 'en', 'nl')
 * @param {string} sourceLanguage - Source language code (optional, auto-detect if not provided)
 * @returns {Promise<{success: boolean, data?: string, error?: string}>}
 */
export const translateTextWithAI = async (text, targetLanguage = 'fr', sourceLanguage = null) => {
  try {
    if (!text || !text.trim()) {
      return { success: true, data: text }; // Return original if empty
    }

    if (!import.meta.env.VITE_GOOGLE_AI_API_KEY) {
      return { 
        success: false, 
        error: 'Google AI API key not configured' 
      };
    }

    // If source and target are the same, no translation needed
    if (sourceLanguage && sourceLanguage.split('-')[0] === targetLanguage.split('-')[0]) {
      return { success: true, data: text };
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: import.meta.env.VITE_GEMINI_MODEL || "gemini-2.0-flash-lite",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 500,
      },
    });
    
    // Get language names
    const languageNames = {
      'fr': 'French',
      'en': 'English',
      'nl': 'Dutch'
    };
    
    const targetLangName = languageNames[targetLanguage.split('-')[0]] || 'French';
    const sourceLangName = sourceLanguage ? (languageNames[sourceLanguage.split('-')[0]] || 'auto-detect') : 'auto-detect';
    
    // Build translation prompt
    const prompt = `Translate the following text to ${targetLangName}. 
Keep the same tone, formality level, and meaning. 
Do not add any explanations or notes, only return the translated text.

Text to translate:
"${text}"

Translated text:`;
    
    // Generate translation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();
    
    if (!translatedText) {
      return { 
        success: false, 
        error: 'No translation generated by Google AI' 
      };
    }

    return { success: true, data: translatedText };

  } catch (error) {
    console.error('Error translating text with Google AI:', error);
    
    // Return original text on error (graceful degradation)
    return { 
      success: false, 
      error: error.message || 'Translation failed',
      data: text // Return original text as fallback
    };
  }
};