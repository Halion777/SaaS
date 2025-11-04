import { supabase } from './supabaseClient';

export class OCRService {
  static async processInvoice(file, keepFileInStorage = true) {
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

      // 3. Call Gemini OCR via Supabase Edge Function (use process-expense-invoice for expense invoices)
      const { data: ocrData, error: ocrError } = await supabase.functions.invoke('process-expense-invoice', {
        body: {
          fileUrl: publicUrl,
          fileName: fileName
        }
      });

      if (ocrError) throw ocrError;

      // 4. Clean up uploaded file ONLY if keepFileInStorage is false
      // For expense invoices, we keep files in storage until user removes them
      if (!keepFileInStorage) {
        await supabase.storage
          .from('invoice-uploads')
          .remove([fileName]);
      }

      // Return both extracted data and file path for storage management
      return {
        extractedData: ocrData.extractedData,
        storagePath: fileName
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process invoice with OCR');
    }
  }

  /**
   * Remove file from storage
   * @param {string} storagePath - The file path in storage (e.g., "invoices/1234567890_file.pdf")
   */
  static async removeFileFromStorage(storagePath) {
    try {
      if (!storagePath) return;
      
      const { error } = await supabase.storage
        .from('invoice-uploads')
        .remove([storagePath]);

      if (error) {
        console.error('Error removing file from storage:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to remove file from storage:', error);
      return { success: false, error: error.message };
    }
  }

  static async validateExtractedData(data) {
    // Validate that at least some useful data is present
    // Don't require all fields - expense invoices may not have everything
    const usefulFields = ['amount', 'invoice_number', 'supplier_name', 'issue_date', 'net_amount', 'tax_amount'];
    const hasUsefulData = usefulFields.some(field => data[field]);
    
    if (!hasUsefulData) {
      throw new Error('No useful data extracted from invoice');
    }

    return data;
  }

  static async extractInvoiceData(file, keepFileInStorage = true) {
    try {
      // Process the invoice with OCR
      const result = await this.processInvoice(file, keepFileInStorage);
      
      // Validate the extracted data
      const validatedData = await this.validateExtractedData(result.extractedData);
      
      return {
        success: true,
        data: validatedData,
        storagePath: result.storagePath, // Return storage path so we can delete it later
        confidence: "high"
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
        storagePath: null
      };
    }
  }
}
