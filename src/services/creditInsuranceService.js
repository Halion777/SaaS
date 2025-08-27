import { supabase } from './supabaseClient';
import EmailService from './emailService';

export class CreditInsuranceService {
  
  /**
   * Create a new credit insurance application
   */
  static async createApplication(applicationData) {
    try {
      // Validate required fields
      const requiredFields = [
        'companyName', 'contactPerson', 'email', 'telephone', 
        'address', 'sector', 'activityDescription', 'annualTurnover', 'topCustomers'
      ];
      
      for (const field of requiredFields) {
        if (!applicationData[field]) {
          throw new Error(`Le champ ${field} est obligatoire`);
        }
      }

      // Validate sector
      const validSectors = ['construction', 'manufacturing', 'retail', 'services', 
                           'technology', 'healthcare', 'finance', 'other'];
      if (!validSectors.includes(applicationData.sector)) {
        throw new Error('Secteur invalide');
      }

      // Validate annual turnover
      const turnover = parseFloat(applicationData.annualTurnover);
      if (isNaN(turnover) || turnover <= 0) {
        throw new Error('Chiffre d\'affaires invalide');
      }

      // Insert into database
      const { data, error } = await supabase
        .from('credit_insurance_applications')
        .insert([{
          company_name: applicationData.companyName,
          contact_person: applicationData.contactPerson,
          email: applicationData.email,
          telephone: applicationData.telephone,
          address: applicationData.address,
          sector: applicationData.sector,
          activity_description: applicationData.activityDescription,
          annual_turnover: turnover,
          top_customers: applicationData.topCustomers,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        throw new Error('Erreur lors de la sauvegarde de la demande');
      }

      // Prepare application object for emails
      const application = {
        id: data.id,
        companyName: applicationData.companyName,
        contactPerson: applicationData.contactPerson,
        email: applicationData.email,
        telephone: applicationData.telephone,
        address: applicationData.address,
        sector: applicationData.sector,
        activityDescription: applicationData.activityDescription,
        annualTurnover: turnover,
        topCustomers: applicationData.topCustomers,
        createdAt: data.created_at
      };

      // Send email to info@haliqo.com
      const notificationResult = await EmailService.sendCreditInsuranceApplicationEmail(application);
      if (!notificationResult.success) {
        console.warn('Failed to send notification email to info@haliqo.com:', notificationResult.error);
      }

      // Send confirmation email to applicant
      const confirmationResult = await EmailService.sendCreditInsuranceConfirmationEmail(application);
      if (!confirmationResult.success) {
        console.warn('Failed to send confirmation email to applicant:', confirmationResult.error);
      }

      return {
        success: true,
        message: 'Votre demande a été envoyée avec succès !',
        application: data,
        applicationId: data.id
      };

    } catch (error) {
      console.error('Error creating credit insurance application:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'envoi de la demande',
        error: error.message
      };
    }
  }

  /**
   * Get application status by ID
   */
  static async getApplicationStatus(applicationId) {
    try {
      const { data, error } = await supabase
        .from('credit_insurance_applications')
        .select('id, company_name, status, created_at, updated_at')
        .eq('id', applicationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            message: 'Demande non trouvée',
            error: 'APPLICATION_NOT_FOUND'
          };
        }
        throw new Error('Erreur lors de la récupération du statut');
      }

      return {
        success: true,
        application: {
          id: data.id,
          companyName: data.company_name,
          status: data.status,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }
      };

    } catch (error) {
      console.error('Error getting application status:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération du statut',
        error: error.message
      };
    }
  }

  /**
   * Get all sectors
   */
  static async getSectors() {
    try {
      const sectors = [
        { value: 'construction', label: 'Construction' },
        { value: 'manufacturing', label: 'Fabrication' },
        { value: 'retail', label: 'Commerce de détail' },
        { value: 'services', label: 'Services' },
        { value: 'technology', label: 'Technologie' },
        { value: 'healthcare', label: 'Santé' },
        { value: 'finance', label: 'Finance' },
        { value: 'other', label: 'Autre' }
      ];

      return {
        success: true,
        sectors
      };

    } catch (error) {
      console.error('Error getting sectors:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des secteurs',
        error: error.message
      };
    }
  }

  /**
   * Update application status (admin function)
   */
  static async updateApplicationStatus(applicationId, status, notes = '') {
    try {
      const validStatuses = ['pending', 'approved', 'rejected', 'processing'];
      if (!validStatuses.includes(status)) {
        throw new Error('Statut invalide');
      }

      const { data, error } = await supabase
        .from('credit_insurance_applications')
        .update({
          status,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new Error('Erreur lors de la mise à jour du statut');
      }

      return {
        success: true,
        message: 'Statut mis à jour avec succès',
        application: data
      };

    } catch (error) {
      console.error('Error updating application status:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du statut',
        error: error.message
      };
    }
  }

  /**
   * Get all applications (admin function)
   */
  static async getAllApplications(limit = 50, offset = 0, status = null) {
    try {
      let query = supabase
        .from('credit_insurance_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Erreur lors de la récupération des demandes');
      }

      return {
        success: true,
        applications: data,
        count: data.length
      };

    } catch (error) {
      console.error('Error getting all applications:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des demandes',
        error: error.message
      };
    }
  }
}

export default CreditInsuranceService;
