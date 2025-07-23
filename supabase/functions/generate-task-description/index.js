// Follow this pattern to implement Supabase Edge functions for your OpenAI integrations
// This is a sample function for task description generation

// Import Supabase OpenAI client
// Note: Edge Functions have access to the service_role key, so be careful with your security
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5'
import { OpenAI } from 'https://esm.sh/openai@4.93.0'

// These would come from your Supabase env vars in production
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
})

// This is the main function that gets called when your Edge Function is invoked
Deno.serve(async (req) => {
  try {
    // Verify authentication - IMPORTANT to prevent unauthorized access
    // Create supabase client with the headers from the request
    // This extracts the auth token and verifies it
    const supabaseClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') }
        }
      }
    )

    // Get the auth user (this will be null if not authenticated)
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser()

    // If no authenticated user, return error
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse the request body
    const { description } = await req.json()

    // Validate the input
    if (!description || typeof description !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid input: description must be a string' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Call OpenAI to generate the enhanced task description
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional construction and renovation expert. 
                    Generate comprehensive task descriptions for quotes. 
                    Respond with detailed, professional descriptions that include 
                    work scope, materials, and time estimates.`
        },
        {
          role: 'user',
          content: `Generate a comprehensive task description for: ${description}`
        }
      ],
      response_format: {
        type: 'json_schema',
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
          required: ['description', 'estimatedDuration', 'suggestedMaterials']
        }
      },
      temperature: 0.7
    })

    // Parse the response
    const responseData = JSON.parse(completion.choices[0].message.content)

    // Optional: Log usage to database with admin client
    const adminClient = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    )

    await adminClient
      .from('ai_usage_logs')
      .insert({
        user_id: user.id,
        function_name: 'generate-task-description',
        input_length: description.length,
        output_length: JSON.stringify(responseData).length,
        model: 'gpt-4o',
        tokens_used: completion.usage.total_tokens
      })

    // Return the result
    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    // Handle errors
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 