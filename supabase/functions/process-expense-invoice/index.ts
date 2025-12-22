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
    
    // Validate input
    if (!fileUrl || !fileName) {
      throw new Error('Missing required parameters: fileUrl and fileName are required');
    }
    
    // Initialize Gemini
    
// @ts-ignore
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is not set in Supabase Edge Function secrets');
    }
    // @ts-ignore

    const modelName = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash-lite';
    
    // @ts-ignore
    const genAI = new GoogleGenerativeAI(apiKey);
    // @ts-ignore
    const model = genAI.getGenerativeModel({ model: modelName });

    // Download and process the file
    // The fileUrl from Supabase Storage should already be properly encoded
    console.log('Downloading file from:', fileUrl);
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText}. URL: ${fileUrl}`);
    }
    
    const fileBuffer = await response.arrayBuffer();
    
    if (fileBuffer.byteLength === 0) {
      throw new Error('Downloaded file is empty');
    }
    
    console.log(`File size: ${fileBuffer.byteLength} bytes`);
    
    // Check file size limit (Gemini has limits, typically 20MB for images, 2MB for PDFs)
    const maxFileSize = 20 * 1024 * 1024; // 20MB
    if (fileBuffer.byteLength > maxFileSize) {
      throw new Error(`File size (${(fileBuffer.byteLength / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (20MB)`);
    }
    
    // Convert to base64 for Gemini - use proper base64 encoding that handles large files
    // @ts-ignore
    const uint8Array = new Uint8Array(fileBuffer);
    
    // Use chunk-based base64 encoding to avoid stack overflow with large files
    // Process in smaller chunks and build binary string character by character
    let base64Data = '';
    const chunkSize = 0x6000; // 24KB chunks - optimal for base64 encoding
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunkEnd = Math.min(i + chunkSize, uint8Array.length);
      // Build binary string character by character (no spread operator to avoid stack overflow)
      let binaryString = '';
      const chunkLength = chunkEnd - i;
      
      // Pre-allocate string if possible, otherwise build incrementally
      for (let j = 0; j < chunkLength; j++) {
        binaryString += String.fromCharCode(uint8Array[i + j]);
      }
      
      // Encode chunk to base64
      // @ts-ignore
      const chunkBase64 = btoa(binaryString);
      base64Data += chunkBase64;
    }
    
    // Validate base64 string
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Failed to encode file to base64');
    }
    
    // Basic validation: base64 should be ~4/3 the size of original (with padding)
    const expectedMinLength = Math.floor(fileBuffer.byteLength * 4 / 3);
    if (base64Data.length < expectedMinLength * 0.9) {
      throw new Error(`Base64 encoding seems incomplete. Expected ~${expectedMinLength} chars, got ${base64Data.length}`);
    }
    
    console.log(`Base64 encoded: ${base64Data.length} chars (original: ${fileBuffer.byteLength} bytes)`);
    
    // Create enhanced prompt for expense invoice extraction with better PDF handling
    const prompt = `
    You are an expert at extracting data from expense invoices (supplier invoices). You can read both PDF documents and images with high accuracy. Analyze this invoice document thoroughly and extract ALL visible information in JSON format. Pay special attention to structured PDFs and invoices created by invoice management systems.
    
    CRITICAL: This document may be a PDF created by an invoice management system (like Haliqo, accounting software, or other invoicing platforms). These PDFs often have:
    - Structured layouts with clear sections (header, client info, company info, line items, totals, footer)
    - Text that can be directly extracted (not just OCR from images)
    - Consistent formatting and positioning
    - Multiple pages with data spread across pages
    
    Extract ALL visible information in this JSON format:
    {
      "invoice_number": "invoice number or reference (look for 'Facture N°', 'Invoice No', 'Numéro', 'INV-', 'FACT-', 'Invoice Number', 'No.', 'N°', 'Reference', 'Référence', etc.)",
      "amount": "total amount including tax (look for 'Total', 'TTC', 'Total incl. VAT', 'Amount', 'Montant total', 'Total Amount', 'Grand Total', numeric only, no currency symbols)",
      "net_amount": "net amount excluding tax (look for 'HT', 'Excl. VAT', 'Net Amount', 'Sous-total', 'Subtotal', 'Base HT', numeric only)",
      "tax_amount": "tax/VAT amount (look for 'TVA', 'VAT', 'BTW', 'Tax', 'Tax Amount', 'Montant TVA', numeric only, 0 if not found)",
      "issue_date": "invoice date in YYYY-MM-DD format (look for 'Date', 'Date de facturation', 'Invoice Date', 'Issue Date', 'Date d'émission', 'Date:', 'Dated', 'Le', 'On')",
      "due_date": "payment due date in YYYY-MM-DD format (look for 'Date d'échéance', 'Due Date', 'Payable avant', 'Payment Due', 'Pay by', 'Échéance', or calculate from payment terms)",
      "supplier_name": "supplier/vendor company name (look in 'From', 'De', 'Fournisseur', 'Supplier', 'Vendor', 'Company', 'BEDRIJF', 'COMPANY' section, or header area)",
      "supplier_email": "supplier email address (look in contact section, header, or footer)",
      "supplier_vat_number": "supplier VAT/TVA number (look for 'TVA:', 'VAT:', 'BTW:', 'Numéro TVA', 'VAT Number', 'TVA Number', 'BEXXX.XXX.XXX' format, '0208:XXXXX' format, or any country code + numbers)",
      "supplier_address": "supplier full address if visible (street, city, postal code, country)",
      "supplier_phone": "supplier phone number if visible",
      "category": "expense category - choose closest match: fuel, it_software, energy, materials_supplies, telecommunications, rent_property, professional_services, insurance, travel_accommodation, banking_financial, marketing_advertising, other_professional",
      "description": "invoice description or detailed line items summary (extract all line items if visible, combine into description)",
      "line_items": "array of line items if visible, each with description, quantity, unit_price, total (optional field)",
      "payment_terms": "payment terms if mentioned (e.g., '30 jours net', 'Net 30', 'Paiement à réception', 'Payment terms', 'Conditions de paiement')",
      "payment_method": "payment method if mentioned (Virement, Bank Transfer, Check, Chèque, Cash, Espèces, Card, Carte, etc.)",
      "iban": "IBAN or bank account number if visible",
      "bank_name": "bank name if visible",
      "notes": "any additional notes, remarks, or terms visible on the invoice",
      "currency": "currency code if visible (EUR, USD, etc.)",
      "vat_rate": "VAT rate percentage if visible (e.g., 21, 6, 12)"
    }
    
    ENHANCED Extraction Guidelines:
    
    1. PDF STRUCTURE ANALYSIS:
       - For PDFs: Read the document structure first - identify sections (header, body, footer)
       - Look for structured tables with line items
       - Check all pages if multi-page document
       - Extract text from all sections, not just visible areas
       - For system-generated PDFs: They often have consistent layouts - identify the pattern
    
    2. FIELD EXTRACTION PRIORITY:
       - Invoice Number: Check header, top-right, or dedicated "Invoice Number" field. Look for patterns like INV-XXX, FACT-XXX, or sequential numbers
       - Amounts: Look in totals section, usually bottom-right. Check for "Total", "TTC", "Amount Due", "Grand Total"
       - Dates: Usually in header or top section. Check multiple date formats (DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, written dates)
       - Supplier Info: Usually in top-left or "From" section. Extract company name, address, contact details
       - VAT Number: Often near company name or in a dedicated "VAT" or "TVA" field
    
    3. AMOUNT HANDLING:
       - Extract numbers preserving decimal separators. Use comma (,) as decimal separator in output
       - If you see "60,45" (European format with comma), keep as "60,45"
       - If you see "1.234,56" (European format: dot for thousands, comma for decimals), convert to "1234,56"
       - If you see "1,234.56" (US format: comma for thousands, dot for decimals), convert to "1234,56" (replace dot with comma)
       - Remove currency symbols (€, $, £) and spaces, but preserve the decimal separator
       - Look for amounts in multiple places: line items, subtotals, tax, totals
    
    4. DATE HANDLING:
       - Convert to YYYY-MM-DD format (e.g., "15/01/2025" → "2025-01-15", "15 janvier 2025" → "2025-01-15", "15-01-2025" → "2025-01-15")
       - Check multiple date fields: issue date, due date, payment date
       - If only payment terms visible (e.g., "30 jours"), calculate due_date from issue_date + 30 days
    
    5. VAT NUMBER HANDLING:
       - Extract the full number including country code (e.g., "BE123456789", "BE 123.456.789", "0208:123456789", "FR12345678901")
       - Look for various formats: BEXXX.XXX.XXX, BE-XXX-XXX-XXX, BE XXX XXX XXX, or just numbers with country context
       - Check both supplier and client sections if invoice shows both
    
    6. LINE ITEMS:
       - If invoice has line items table, extract each row with: description, quantity, unit_price, total
       - Combine all line items into description field if line_items array not supported
       - Look for tables with headers like "Description", "Qty", "Price", "Total"
    
    7. CALCULATIONS:
       - If you see "HT" and "TTC" amounts: net_amount = TTC - TVA (or use HT directly if shown)
       - If only TTC shown: try to find VAT rate and calculate net_amount = TTC / (1 + VAT_rate/100)
       - Verify: net_amount + tax_amount should equal amount (within rounding)
    
    8. LANGUAGE HANDLING (CRITICAL - MULTILINGUAL SUPPORT):
       - This invoice may be in French, English, Dutch, or a MIXTURE of these languages
       - The document can contain text in multiple languages simultaneously (e.g., French header with English line items, or Dutch supplier info with French amounts)
       - Extract data regardless of language - look for keywords in ALL languages:
         * French: "Facture", "TVA", "HT", "TTC", "Date d'échéance", "Fournisseur", "Montant", "Total", "Sous-total", "Date de facturation"
         * English: "Invoice", "VAT", "Excl. VAT", "Incl. VAT", "Due Date", "Supplier", "Amount", "Total", "Subtotal", "Invoice Date"
         * Dutch: "Factuur", "BTW", "Excl. BTW", "Incl. BTW", "Vervaldatum", "Leverancier", "Bedrag", "Totaal", "Subtotaal", "Factuurdatum"
       - When encountering mixed languages, extract data from whichever language section contains the information
       - For amounts and numbers: Extract regardless of language - numbers are universal
       - For dates: Recognize date formats in all languages (e.g., "15 janvier 2025", "15 January 2025", "15 januari 2025")
       - For VAT numbers: Extract regardless of label language (TVA/VAT/BTW all refer to the same field)
    
    9. CATEGORY INFERENCE:
       - "Électricité", "Electricity", "Energie" → energy
       - "Carburant", "Fuel", "Essence" → fuel
       - "Logiciel", "Software", "IT" → it_software
       - "Télécommunications", "Telecom" → telecommunications
       - "Assurance", "Insurance" → insurance
       - "Location", "Rent" → rent_property
       - "Matériaux", "Materials", "Supplies" → materials_supplies
       - Infer from keywords in description or line items
    
    10. ACCURACY REQUIREMENTS:
        - Double-check all numbers and dates before outputting
        - If uncertain about a field, use null (not empty string or guess)
        - Extract everything visible - don't skip fields that seem less important
        - For system-generated PDFs: These should have near-perfect extraction since text is selectable
    
    11. SPECIAL CASES:
        - Multi-page invoices: Extract data from all pages
        - Scanned images: Use OCR carefully, verify numbers
        - Handwritten elements: Extract if clearly readable
        - Watermarks or stamps: Ignore, focus on actual invoice data
        - Barcodes or QR codes: Extract if they contain invoice numbers or references
    
    Return ONLY valid JSON. Do not include any explanatory text outside the JSON object.
    `;

    // Determine MIME type based on file extension
    // Google Gemini Vision API supports: PDF, JPEG, PNG, WEBP, GIF, BMP
    const getMimeType = (fileName: string): string => {
      const ext = fileName.toLowerCase().split('.').pop() || '';
      const mimeTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp'
      };
      
      if (!mimeTypes[ext]) {
        throw new Error(`Unsupported file type: .${ext}. Supported formats: PDF, JPEG, JPG, PNG, GIF, WEBP, BMP`);
      }
      
      return mimeTypes[ext];
    };

    const mimeType = getMimeType(fileName);
    console.log(`Detected MIME type: ${mimeType} for file: ${fileName}`);

    // Process with Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data
        }
      }
    ]);

    // Safely extract text response - avoid logging the entire result object which may have circular references
    let response_text: string;
    try {
      response_text = result.response.text();
    } catch (error) {
      console.error('Error extracting text from Gemini response:', error.message);
      throw new Error('Failed to extract text from OCR response');
    }
    
    // Extract JSON from response
    const jsonMatch = response_text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response. Response length:', response_text.length);
      console.error('Response preview:', response_text.substring(0, 500));
      throw new Error('Failed to extract structured data from OCR response');
    }

    // Safely parse JSON - handle potential circular references
    let extractedData: any;
    try {
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('JSON string length:', jsonMatch[0].length);
      console.error('JSON preview:', jsonMatch[0].substring(0, 1000));
      throw new Error('Failed to parse extracted data from OCR response');
    }
    
    // Validate that extractedData is a plain object (not circular)
    if (typeof extractedData !== 'object' || extractedData === null || Array.isArray(extractedData)) {
      throw new Error('Invalid data structure extracted from OCR response');
    }

    // Helper function to safely extract primitive values from objects (prevents circular reference issues)
    const safeExtract = (value: any, maxDepth: number = 3, currentDepth: number = 0): any => {
      if (currentDepth >= maxDepth) return null;
      if (value === null || value === undefined) return null;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
      if (Array.isArray(value)) {
        return value.slice(0, 10).map(item => safeExtract(item, maxDepth, currentDepth + 1)); // Limit array size
      }
      if (typeof value === 'object') {
        const result: any = {};
        const keys = Object.keys(value).slice(0, 20); // Limit object keys
        for (const key of keys) {
          try {
            result[key] = safeExtract(value[key], maxDepth, currentDepth + 1);
          } catch (e) {
            // Skip circular references
            result[key] = null;
          }
        }
        return result;
      }
      return String(value);
    };

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

    // Safely extract primitive values to avoid circular references
    const safeData = safeExtract(extractedData);
    
    // Validate and clean data
    const cleanedAmount = cleanAmount(safeData?.amount);
    const cleanedTaxAmount = cleanAmount(safeData?.tax_amount) || 0;
    const cleanedNetAmount = cleanAmount(safeData?.net_amount) || 
      (cleanedAmount && cleanedTaxAmount ? cleanedAmount - cleanedTaxAmount : cleanedAmount);

    // Safely extract string values
    const safeString = (value: any): string | null => {
      if (!value) return null;
      if (typeof value === 'string') return value.substring(0, 1000); // Limit string length
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      return null;
    };

    const cleanedData = {
      invoice_number: safeString(safeData?.invoice_number),
      amount: cleanedAmount,
      net_amount: cleanedNetAmount,
      tax_amount: cleanedTaxAmount,
      issue_date: formatDate(safeData?.issue_date),
      due_date: formatDate(safeData?.due_date),
      supplier_name: safeString(safeData?.supplier_name),
      supplier_email: safeString(safeData?.supplier_email),
      supplier_vat_number: safeString(safeData?.supplier_vat_number),
      supplier_address: safeString(safeData?.supplier_address),
      supplier_phone: safeString(safeData?.supplier_phone),
      category: safeString(safeData?.category),
      description: safeString(safeData?.description) || (safeData?.line_items && Array.isArray(safeData.line_items) 
        ? safeData.line_items.slice(0, 50).map((item: any) => {
            // Safely extract values to avoid circular references
            const desc = item && typeof item === 'object' ? safeString(item.description) || '' : '';
            const qty = item && typeof item === 'object' ? safeString(item.quantity) || '' : '';
            const price = item && typeof item === 'object' ? safeString(item.unit_price) || '' : '';
            const total = item && typeof item === 'object' ? safeString(item.total) || '' : '';
            return `${desc} ${qty}x ${price} = ${total}`;
          }).join('; ') 
        : null),
      payment_terms: safeString(safeData?.payment_terms),
      payment_method: safeString(safeData?.payment_method),
      iban: safeString(safeData?.iban),
      bank_name: safeString(safeData?.bank_name),
      currency: safeString(safeData?.currency),
      vat_rate: safeData?.vat_rate ? parseFloat(String(safeData.vat_rate).replace(/[^\d.,]/g, '').replace(',', '.')) : null,
      notes: safeString(safeData?.notes)
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
    // Safely log error without causing circular reference issues
    const errorName = error?.name || 'UnknownError';
    const errorMessage = error?.message || 'Unknown error occurred during OCR processing';
    const errorStack = error?.stack ? String(error.stack).substring(0, 500) : 'No stack trace';
    
    console.error('OCR processing error:', errorName);
    console.error('Error message:', errorMessage);
    console.error('Error stack (truncated):', errorStack);
    
    // Provide more helpful error messages
    let userFriendlyMessage = errorMessage;
    let statusCode = 500;
    
    if (errorName === 'RangeError' && errorMessage.includes('Maximum call stack size exceeded')) {
      userFriendlyMessage = 'File is too large or contains complex data. Please try with a smaller file or check the file format.';
      statusCode = 413; // Payload Too Large
    } else if (errorMessage.includes('exceeds maximum allowed size')) {
      statusCode = 413; // Payload Too Large
    } else if (errorMessage.includes('Failed to download file')) {
      statusCode = 502; // Bad Gateway
    } else if (errorMessage.includes('Unsupported file type')) {
      statusCode = 400; // Bad Request
    } else if (errorMessage.includes('circular') || errorMessage.includes('Maximum call stack')) {
      userFriendlyMessage = 'Document contains complex data structure. Please try with a simpler invoice format.';
      statusCode = 422; // Unprocessable Entity
    }
    
    // Safely stringify error response
    try {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: userFriendlyMessage,
          data: null,
          errorType: errorName
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: statusCode
        }
      );
    } catch (stringifyError) {
      // Fallback if even stringify fails (shouldn't happen, but safety net)
      return new Response(
        '{"success":false,"error":"An error occurred during OCR processing","data":null}',
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        }
      );
    }
  }
});
