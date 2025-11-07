import { supabase } from './supabaseClient';

/**
 * Service for managing app_settings
 */
class AppSettingsService {
  /**
   * Get a setting by key
   * @param {string} settingKey - The setting key
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getSetting(settingKey) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', settingKey)
        .maybeSingle();

      if (error) {
        console.error(`Error getting setting ${settingKey}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data?.setting_value || null };
    } catch (error) {
      console.error(`Exception getting setting ${settingKey}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save or update a setting
   * @param {string} settingKey - The setting key
   * @param {any} settingValue - The setting value (will be stored as JSONB)
   * @param {string} description - Optional description
   * @param {string} userId - User ID who is updating
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async saveSetting(settingKey, settingValue, description = null, userId = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updatedBy = userId || user?.id;

      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: settingValue,
          description: description,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        }, {
          onConflict: 'setting_key'
        })
        .select()
        .single();

      if (error) {
        console.error(`Error saving setting ${settingKey}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data };
    } catch (error) {
      console.error(`Exception saving setting ${settingKey}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sponsored banner settings
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  async getSponsoredBannerSettings() {
    const result = await this.getSetting('sponsored_banner');
    
    if (!result.success) {
      return result;
    }

    // Return default values if no settings found
    const defaultSettings = {
      enabled: true,
      fr: {
        title: 'Optimisez vos Devis avec l\'IA Premium',
        description: 'Augmentez votre taux de signature de 40% avec des suggestions intelligentes',
        discount: '30% de réduction',
        buttonText: 'Découvrir Premium',
        buttonLink: '/subscription',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop'
      },
      en: {
        title: 'Optimize Your Quotes with Premium AI',
        description: 'Increase your signature rate by 40% with intelligent suggestions',
        discount: '30% discount',
        buttonText: 'Discover Premium',
        buttonLink: '/subscription',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop'
      },
      nl: {
        title: 'Optimaliseer Uw Offertes met Premium AI',
        description: 'Verhoog uw handtekeningpercentage met 40% met intelligente suggesties',
        discount: '30% korting',
        buttonText: 'Ontdek Premium',
        buttonLink: '/subscription',
        image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop'
      }
    };

    // If data exists, merge with defaults to ensure all languages are present
    if (result.data) {
      return {
        success: true,
        data: {
          enabled: result.data.enabled !== undefined ? result.data.enabled : defaultSettings.enabled,
          fr: { ...defaultSettings.fr, ...(result.data.fr || {}) },
          en: { ...defaultSettings.en, ...(result.data.en || {}) },
          nl: { ...defaultSettings.nl, ...(result.data.nl || {}) }
        }
      };
    }

    return {
      success: true,
      data: defaultSettings
    };
  }

  /**
   * Save sponsored banner settings
   * @param {object} settings - The sponsored banner settings
   * @param {string} userId - User ID who is updating
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async saveSponsoredBannerSettings(settings, userId = null) {
    return await this.saveSetting(
      'sponsored_banner',
      settings,
      'Sponsored banner configuration for dashboard',
      userId
    );
  }
}

export default new AppSettingsService();

