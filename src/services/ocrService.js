import { supabase } from '../config/supabaseClient';

export class OCRService {
  static async processInvoice(file) {
    try {
      // 1. Upload file to Supabase Storage
      const fileName = `invoices/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoice-uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoice-uploads')
        .getPublicUrl(fileName);

      // 3. Call Gemini OCR via Supabase Edge Function
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('process-invoice-ocr', {
        body: {
          fileUrl: publicUrl,
          fileName: fileName
        }
      });

      if (ocrError) throw ocrError;

      // 4. Clean up uploaded file
      await supabase.storage
        .from('invoice-uploads')
        .remove([fileName]);

      return ocrData.extractedData;

    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process invoice with OCR');
    }
  }

  static async validateExtractedData(data) {
    // Validate that required fields are present
    const requiredFields = ['amount', 'invoice_number', 'issue_date'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    return data;
  }

  static async extractInvoiceData(file) {
    try {
      // Process the invoice with OCR
      const extractedData = await this.processInvoice(file);
      
      // Validate the extracted data
      const validatedData = await this.validateExtractedData(extractedData);
      
      return {
        success: true,
        data: validatedData,
        confidence: "high"
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}
