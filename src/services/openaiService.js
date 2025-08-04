import openai from './openaiClient';

/**
 * Transcribes audio to text using OpenAI Whisper
 * @param {Blob} audioBlob - The audio blob to transcribe
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioBlob) {
  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioBlob,
    });

    return response.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Generates comprehensive task description using OpenAI
 * @param {string} basicDescription - Basic task description
 * @returns {Promise<object>} Enhanced task details
 */
export async function generateTaskDescription(basicDescription) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional construction and renovation expert. Generate comprehensive task descriptions for quotes. Respond with detailed, professional descriptions that include work scope, materials, and time estimates.`
        },
        {
          role: 'user',
          content: `Generate a comprehensive task description for: ${basicDescription}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'task_description_response',
          schema: {
            type: 'object',
            properties: {
              description: { type: 'string' },
              estimatedDuration: { type: 'string' },
              suggestedMaterials: { 
                type: 'array', 
                items: { 
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    quantity: { type: 'string' },
                    unit: { type: 'string' }
                  }
                }
              },
              skillLevel: { type: 'string' },
              safetyConsiderations: { type: 'array', items: { type: 'string' } }
            },
            required: ['description', 'estimatedDuration', 'suggestedMaterials'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating task description:', error);
    throw error;
  }
}

/**
 * Generates follow-up content for client communication
 * @param {object} clientInfo - Client information
 * @param {string} context - Communication context
 * @returns {Promise<string>} Generated follow-up content
 */
export async function generateFollowUpContent(clientInfo, context) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional client relationship manager. Generate personalized, professional follow-up messages for construction/renovation services.'
        },
        {
          role: 'user',
          content: `Generate a follow-up message for client: ${clientInfo?.name || 'Client'}, Context: ${context}`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating follow-up content:', error);
    throw error;
  }
}

/**
 * Generates a personalized follow-up message for a specific item (quote or invoice)
 * @param {object} item - The item (quote or invoice) to generate a follow-up message for
 * @returns {Promise<string>} Generated follow-up message
 */
export async function generateFollowUpMessage(item) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional client communication specialist for artisan businesses. Generate a polite, professional follow-up message for unpaid invoices or unanswered quotes. The message should be courteous, clear, and encourage prompt action.`
        },
        {
          role: 'user',
          content: `Generate a follow-up message for a ${item.type === 'invoice' ? 'pending invoice' : 'unanswered quote'}:
- Client Name: ${item.clientName}
- Amount: ${item.amount}€
- ${item.type === 'invoice' ? `Due Date: ${item.dueDate}` : `Sent Date: ${item.sentDate}`}

The message should:
- Be professional and courteous
- Remind the client about the pending item
- Encourage prompt action
- Offer assistance if they have any questions`
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating follow-up message:', error);
    throw error;
  }
}

/**
 * Analyzes client data and provides insights
 * @param {array} clients - Array of client data
 * @returns {Promise<object>} Client analytics insights
 */
export async function analyzeClientData(clients) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a business analyst specializing in client relationship management. Analyze client data and provide actionable insights.'
        },
        {
          role: 'user',
          content: `Analyze this client data and provide insights: ${JSON.stringify(clients?.slice(0, 10) || [])}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'client_analytics_response',
          schema: {
            type: 'object',
            properties: {
              totalRevenue: { type: 'number' },
              topClients: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              riskFactors: { type: 'array', items: { type: 'string' } }
            },
            required: ['totalRevenue', 'topClients', 'recommendations'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing client data:', error);
    throw error;
  }
}

/**
 * Generates business analytics insights using AI
 * @param {object} businessData - Business metrics and data
 * @returns {Promise<object>} AI-generated business insights
 */
export async function generateBusinessInsights(businessData) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a business intelligence expert specializing in construction and renovation analytics. Provide actionable insights, recommendations, and predictions based on business data.'
        },
        {
          role: 'user',
          content: `Analyze this business data and provide comprehensive insights: ${JSON.stringify(businessData)}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'business_insights_response',
          schema: {
            type: 'object',
            properties: {
              insights: { type: 'array', items: { type: 'string' } },
              recommendations: { type: 'array', items: { type: 'string' } },
              predictions: { type: 'array', items: { type: 'string' } },
              riskFactors: { type: 'array', items: { type: 'string' } },
              opportunities: { type: 'array', items: { type: 'string' } },
              marketTrends: { type: 'array', items: { type: 'string' } }
            },
            required: ['insights', 'recommendations', 'predictions'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating business insights:', error);
    throw error;
  }
}

/**
 * Generates pricing optimization recommendations
 * @param {object} pricingData - Current pricing and market data
 * @returns {Promise<object>} Pricing optimization insights
 */
export async function generatePricingOptimization(pricingData) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a pricing strategy expert for construction services. Analyze pricing data and provide optimization recommendations.'
        },
        {
          role: 'user',
          content: `Analyze pricing data and suggest optimizations: ${JSON.stringify(pricingData)}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'pricing_optimization_response',
          schema: {
            type: 'object',
            properties: {
              recommendedPricing: { type: 'array', items: { type: 'object' } },
              marketPosition: { type: 'string' },
              competitiveAdvantages: { type: 'array', items: { type: 'string' } },
              profitabilityImpact: { type: 'string' }
            },
            required: ['recommendedPricing', 'marketPosition'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error generating pricing optimization:', error);
    throw error;
  }
}

/**
 * Analyzes performance patterns and generates operational improvements
 * @param {object} performanceData - Performance metrics and patterns
 * @returns {Promise<object>} Operational improvement recommendations
 */
export async function analyzePerformancePatterns(performanceData) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an operations consultant specializing in construction business efficiency. Analyze performance data and suggest operational improvements.'
        },
        {
          role: 'user',
          content: `Analyze performance patterns and suggest improvements: ${JSON.stringify(performanceData)}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'performance_analysis_response',
          schema: {
            type: 'object',
            properties: {
              efficiencyScore: { type: 'number' },
              bottlenecks: { type: 'array', items: { type: 'string' } },
              improvements: { type: 'array', items: { type: 'string' } },
              timeOptimizations: { type: 'array', items: { type: 'string' } },
              resourceOptimizations: { type: 'array', items: { type: 'string' } }
            },
            required: ['efficiencyScore', 'bottlenecks', 'improvements'],
            additionalProperties: false,
          },
        },
      },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error analyzing performance patterns:', error);
    throw error;
  }
}