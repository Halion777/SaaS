import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../services/supabaseClient';
import Icon from '../../../../components/AppIcon';
import Button from '../../../../components/ui/Button';
import SuperAdminSidebar from '../../../../components/ui/SuperAdminSidebar';
import TableLoader from '../../../../components/ui/TableLoader';

const Customization = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [serviceSettings, setServiceSettings] = useState({
    creditInsurance: true,
    recovery: true
  });

  // Handle sidebar toggle and responsive layout
  useEffect(() => {
    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const tablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);

      if (mobile) {
        setSidebarOffset(0);
      } else if (tablet) {
        setSidebarOffset(80);
      } else {
        const isCollapsed = localStorage.getItem('superadmin-sidebar-collapsed') === 'true';
        setSidebarOffset(isCollapsed ? 64 : 288);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    };
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Loading settings from database...');
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'service_visibility')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('⚠️ No settings found, using defaults');
        } else {
          console.error('❌ Error loading settings:', error);
          alert('Error loading settings from database. Using default values.');
        }
      } else {
        console.log('✅ Settings loaded successfully:', data);
        if (data && data.setting_value) {
          setServiceSettings(data.setting_value);
        }
      }
    } catch (error) {
      console.error('❌ Exception loading settings:', error);
      alert('Failed to connect to database. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (service) => {
    setServiceSettings(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      console.log('💾 Saving settings:', serviceSettings);

      // Upsert settings
      const { data, error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'service_visibility',
          setting_value: serviceSettings,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        }, {
          onConflict: 'setting_key'
        })
        .select();

      if (error) {
      
        alert(`Error saving settings: ${error.message}\n\nPlease check if:\n1. The SQL schema was executed correctly\n2. You have super admin permissions`);
        return;
      }

     
      alert('✅ Settings saved successfully!\n\nUsers will see the changes when they refresh their page.');
    } catch (error) {
      
      alert(`Failed to save settings: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const services = [
    {
      id: 'creditInsurance',
      name: 'Credit Insurance',
      description: 'Credit insurance service for protecting against payment defaults',
      icon: 'Shield',
      path: '/services/assurance'
    },
    {
      id: 'recovery',
      name: 'Recovery',
      description: 'Debt recovery and collection service',
      icon: 'Banknote',
      path: '/services/recouvrement'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Customization | Super Admin</title>
        <meta name="description" content="Customize application settings and service visibility" />
      </Helmet>

      <SuperAdminSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: isMobile ? '0' : `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center gap-3">
                  <Icon name="Sliders" size={24} className="text-primary" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Application Customization</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Control which services are visible to users in their sidebar
                </p>
              </div>
            </div>
          </header>

          {loading ? (
            <TableLoader message="Loading customization settings..." />
          ) : (
            <div className="space-y-6">
              {/* Service Visibility Section */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Icon name="Eye" size={20} className="text-primary" />
                      Service Visibility
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Toggle services on/off to control what users see in their navigation
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${serviceSettings[service.id] ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Icon 
                            name={service.icon} 
                            size={24} 
                            className={serviceSettings[service.id] ? 'text-primary' : 'text-muted-foreground'} 
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-foreground">{service.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{service.path}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${serviceSettings[service.id] ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {serviceSettings[service.id] ? 'Visible' : 'Hidden'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={serviceSettings[service.id]}
                            onChange={() => handleToggle(service.id)}
                          />
                          <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-100/80 border-2 border-blue-300 rounded-lg">
                  <div className="flex gap-3">
                    <Icon name="Info" size={20} className="text-blue-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">
                        Important Information
                      </h4>
                      <ul className="text-xs text-blue-900 mt-2 space-y-1.5 list-disc list-inside font-medium">
                        <li>Changes will affect all users across the platform</li>
                        <li>Users need to refresh their page to see the changes</li>
                        <li>Hidden services are not deleted, just hidden from navigation</li>
                        <li>Users can still access services via direct URL if they know it</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={loadSettings}
                    disabled={saving}
                  >
                    <Icon name="RotateCcw" size={16} className="mr-2" />
                    Reset Changes
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Icon name="Save" size={16} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Customization;

