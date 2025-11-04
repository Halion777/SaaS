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
    const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY') || '');
    // @ts-ignore
    const model = genAI.getGenerativeModel({ model: Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-lite' });

    // Download and process the file
    const response = await fetch(fileUrl);
    const fileBuffer = await response.arrayBuffer();
    
    // Convert to base64 for Gemini
    // @ts-ignore
    const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
    
    // Create prompt for expense invoice extraction
    const prompt = `
    You are an expert at extracting data from expense invoices (supplier invoices). Analyze this invoice image/PDF and extract the following information in JSON format. Extract as much information as you can see:
    
    {
      "invoice_number": "invoice number or reference (look for 'Facture N°', 'Invoice No', 'Numéro', etc.)",
      "amount": "total amount including tax (numeric only, no currency symbols)",
      "net_amount": "net amount excluding tax (HT/TTC amounts, numeric only)",
      "tax_amount": "tax/VAT amount (TVA, VAT, numeric only, 0 if not found)",
      "issue_date": "invoice date in YYYY-MM-DD format (look for 'Date', 'Date de facturation', 'Invoice Date')",
      "due_date": "payment due date in YYYY-MM-DD format (look for 'Date d'échéance', 'Due Date', 'Payable avant', or calculate from payment terms)",
      "supplier_name": "supplier/vendor company name (from 'From', 'De', 'Fournisseur', 'Supplier')",
      "supplier_email": "supplier email address if visible",
      "supplier_vat_number": "supplier VAT/TVA number (look for 'TVA', 'VAT', 'Numéro TVA', 'BEXXX.XXX.XXX' format)",
      "category": "expense category - choose closest match: fuel, it_software, energy, materials_supplies, telecommunications, rent_property, professional_services, insurance, travel_accommodation, banking_financial, marketing_advertising, other_professional",
      "description": "invoice description or line items summary",
      "payment_terms": "payment terms if mentioned (e.g., '30 jours net', 'Net 30', 'Paiement à réception')",
      "payment_method": "payment method if mentioned (Virement, Bank Transfer, etc.)",
      "notes": "any additional notes or remarks"
    }
    
    Extraction Guidelines:
    - Extract ONLY what you can clearly see in the document
    - For amounts: Extract numbers only (remove currency symbols like €, $, spaces, commas used as thousands separators)
    - For dates: Convert to YYYY-MM-DD format (e.g., "15/01/2025" → "2025-01-15", "15 janvier 2025" → "2025-01-15")
    - For VAT numbers: Extract the full number including country code (e.g., "BE123456789" or "0208:123456789")
    - If a field is not visible, use null (not empty string)
    - Calculate net_amount if you see "HT" and "TTC" amounts: net_amount = TTC - TVA
    - Calculate due_date from payment terms if only payment terms are visible (e.g., "30 jours" from issue_date)
    - Handle both French and English invoices
    - For category: Infer from invoice content (e.g., "Électricité" → energy, "Carburant" → fuel, "Logiciel" → it_software)
    - Be very accurate with numbers and dates - double check your extractions
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

    // Helper function to clean amount strings (remove currency symbols, spaces, commas)
    const cleanAmount = (value: any): number | null => {
      if (!value) return null;
      if (typeof value === 'number') return value;
      const cleaned = String(value)
        .replace(/[€$£]/g, '') // Remove currency symbols
        .replace(/\s/g, '') // Remove spaces
        .replace(/\./g, '') // Remove periods (thousands separator in some locales)
        .replace(',', '.') // Replace comma with dot for decimal
        .trim();
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    // Helper function to format date to YYYY-MM-DD
    const formatDate = (dateStr: any): string | null => {
      if (!dateStr) return null;
      // Try to parse various date formats
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    };

    // Validate and clean data
    const cleanedAmount = cleanAmount(extractedData.amount);
    const cleanedTaxAmount = cleanAmount(extractedData.tax_amount) || 0;
    const cleanedNetAmount = cleanAmount(extractedData.net_amount) || 
      (cleanedAmount && cleanedTaxAmount ? cleanedAmount - cleanedTaxAmount : cleanedAmount);

    const cleanedData = {
      invoice_number: extractedData.invoice_number || null,
      amount: cleanedAmount,
      net_amount: cleanedNetAmount,
      tax_amount: cleanedTaxAmount,
      issue_date: formatDate(extractedData.issue_date),
      due_date: formatDate(extractedData.due_date),
      supplier_name: extractedData.supplier_name || null,
      supplier_email: extractedData.supplier_email || null,
      supplier_vat_number: extractedData.supplier_vat_number || null,
      category: extractedData.category || null,
      description: extractedData.description || null,
      payment_terms: extractedData.payment_terms || null,
      payment_method: extractedData.payment_method || null,
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
        data: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
