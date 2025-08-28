// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileUrl, fileName } = await req.json();
    
    // Initialize Gemini
    // @ts-ignore
    const genAI = new GoogleGenerativeAI(Deno.env.get('VITE_GOOGLE_AI_API_KEY') || '');
    // @ts-ignore
    const model = genAI.getGenerativeModel({ model: Deno.env.get('VITE_GEMINI_MODEL') || 'gemini-2.0-flash-lite' });

    // Download and process the file
    const response = await fetch(fileUrl);
    const fileBuffer = await response.arrayBuffer();
    
    // Convert to base64 for Gemini
    // @ts-ignore
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    // Create prompt for invoice extraction
    const prompt = `
    Analyze this invoice image/PDF and extract the following information in JSON format:
    
    {
      "invoice_number": "invoice number or reference",
      "amount": "total amount (numeric only)",
      "tax_amount": "tax amount (numeric only, 0 if not found)",
      "discount_amount": "discount amount (numeric only, 0 if not found)",
      "issue_date": "YYYY-MM-DD format",
      "due_date": "YYYY-MM-DD format (if found, otherwise null)",
      "client_name": "client or customer name",
      "description": "invoice description or items",
      "payment_terms": "payment terms if mentioned",
      "notes": "any additional notes"
    }
    
    Important:
    - Extract only what you can clearly see
    - For amounts, extract only numbers (no currency symbols)
    - For dates, use YYYY-MM-DD format
    - If a field is not found, use null
    - Be very accurate with numbers and dates
    - Handle both French and English invoices
    `;

    // Process with Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          data: base64Data
        }
      }
    ]);

    const response_text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = response_text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract structured data from OCR response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);

    // Validate and clean data
    const cleanedData = {
      invoice_number: extractedData.invoice_number || null,
      amount: parseFloat(extractedData.amount) || 0,
      tax_amount: parseFloat(extractedData.tax_amount) || 0,
      discount_amount: parseFloat(extractedData.discount_amount) || 0,
      issue_date: extractedData.issue_date || null,
      due_date: extractedData.due_date || null,
      client_name: extractedData.client_name || null,
      description: extractedData.description || null,
      payment_terms: extractedData.payment_terms || null,
      notes: extractedData.notes || null
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        extractedData: cleanedData,
        confidence: "high"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('OCR processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        extractedData: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
