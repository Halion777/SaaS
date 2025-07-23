import { supabase } from './supabaseClient';

/**
 * Call a Supabase Edge Function for OpenAI integration
 * @param {string} functionName - Name of the edge function
 * @param {Object} payload - Data to send to the function
 * @returns {Promise<{data, error}>} Function response or error
 */
async function callEdgeFunction(functionName, payload) {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: JSON.stringify(payload)
    });
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error(`Error calling ${functionName}:`, error);
    return { data: null, error };
  }
}

/**
 * Transcribe audio to text using OpenAI Whisper via Edge Function
 * @param {Blob} audioBlob - Audio data to transcribe
 * @returns {Promise<{text, error}>} Transcribed text or error
 */
export async function transcribeAudio(audioBlob) {
  try {
    // Convert blob to base64
    const base64Audio = await blobToBase64(audioBlob);
    
    const { data, error } = await callEdgeFunction('transcribe-audio', {
      audioData: base64Audio,
      mimeType: audioBlob.type
    });
    
    if (error) throw error;
    
    return { text: data.text, error: null };
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return { text: null, error };
  }
}

/**
 * Generate task description using OpenAI via Edge Function
 * @param {string} basicDescription - Basic task description
 * @returns {Promise<{description, error}>} Enhanced task description or error
 */
export async function generateTaskDescription(basicDescription) {
  try {
    const { data, error } = await callEdgeFunction('generate-task-description', {
      description: basicDescription
    });
    
    if (error) throw error;
    
    return { description: data, error: null };
  } catch (error) {
    console.error('Error generating task description:', error);
    return { description: null, error };
  }
}

/**
 * Generate follow-up content for client communication via Edge Function
 * @param {Object} clientInfo - Client information
 * @param {string} context - Communication context
 * @returns {Promise<{content, error}>} Generated follow-up content or error
 */
export async function generateFollowUpContent(clientInfo, context) {
  try {
    const { data, error } = await callEdgeFunction('generate-follow-up', {
      clientInfo,
      context
    });
    
    if (error) throw error;
    
    return { content: data.content, error: null };
  } catch (error) {
    console.error('Error generating follow-up content:', error);
    return { content: null, error };
  }
}

/**
 * Analyze client data using OpenAI via Edge Function
 * @param {Array} clients - Array of client data
 * @returns {Promise<{insights, error}>} Client analytics insights or error
 */
export async function analyzeClientData(clients) {
  try {
    const { data, error } = await callEdgeFunction('analyze-client-data', {
      clients: clients?.slice(0, 10) || [] // Limit data size
    });
    
    if (error) throw error;
    
    return { insights: data, error: null };
  } catch (error) {
    console.error('Error analyzing client data:', error);
    return { insights: null, error };
  }
}

/**
 * Generate business analytics insights using AI via Edge Function
 * @param {Object} businessData - Business metrics and data
 * @returns {Promise<{insights, error}>} Business insights or error
 */
export async function generateBusinessInsights(businessData) {
  try {
    const { data, error } = await callEdgeFunction('generate-business-insights', {
      businessData
    });
    
    if (error) throw error;
    
    return { insights: data, error: null };
  } catch (error) {
    console.error('Error generating business insights:', error);
    return { insights: null, error };
  }
}

/**
 * Generate pricing optimization recommendations via Edge Function
 * @param {Object} pricingData - Current pricing and market data
 * @returns {Promise<{recommendations, error}>} Pricing recommendations or error
 */
export async function generatePricingOptimization(pricingData) {
  try {
    const { data, error } = await callEdgeFunction('optimize-pricing', {
      pricingData
    });
    
    if (error) throw error;
    
    return { recommendations: data, error: null };
  } catch (error) {
    console.error('Error generating pricing optimization:', error);
    return { recommendations: null, error };
  }
}

/**
 * Helper function to convert Blob to base64
 * @param {Blob} blob - Blob to convert
 * @returns {Promise<string>} Base64 string
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 