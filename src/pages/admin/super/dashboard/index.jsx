import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';


const SuperAdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStats, setSystemStats] = useState({
    totalUsers: 1250,
    activeUsers: 892,
    totalQuotes: 3456,
    totalInvoices: 2341,
    systemUptime: '99.8%',
    lastBackup: '2 hours ago'
  });

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Check if user is authenticated and has superadmin role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        // Check if user has superadmin role
        const { data: userData, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error || !userData || userData.role !== 'superadmin') {
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking superadmin access:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);



  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <SuperAdminSidebar />
      
             {/* Main Content */}
       <main className="ml-0 lg:ml-64 transition-all duration-300 ease-out">
        <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="Shield" size={24} className="text-red-600 mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  System Overview • {formatDate(currentTime)} • {formatTime(currentTime)}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    iconName="Settings" 
                    iconPosition="left"
                    className="sm:h-9 sm:px-3 sm:w-auto"
                  >
                    <span className="hidden sm:inline">System Settings</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    iconName="RefreshCw" 
                    iconPosition="left"
                    className="sm:h-9 sm:px-3 sm:w-auto"
                  >
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* System Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Icon name="TrendingUp" size={16} className="text-green-500 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.activeUsers.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="UserCheck" size={24} className="text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Icon name="Activity" size={16} className="text-green-500 mr-1" />
                  <span>Currently online</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.systemUptime}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Icon name="CheckCircle" size={24} className="text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Icon name="Clock" size={16} className="text-blue-500 mr-1" />
                  <span>Last 30 days</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
                  <p className="text-2xl font-bold text-foreground">{systemStats.lastBackup}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Icon name="Database" size={24} className="text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Icon name="Shield" size={16} className="text-green-500 mr-1" />
                  <span>Backup successful</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-20 flex-col justify-center">
                  <Icon name="Users" size={24} className="mb-2" />
                  <span className="text-sm">Manage Users</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col justify-center">
                  <Icon name="Settings" size={24} className="mb-2" />
                  <span className="text-sm">System Settings</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col justify-center">
                  <Icon name="BarChart3" size={24} className="mb-2" />
                  <span className="text-sm">View Analytics</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col justify-center">
                  <Icon name="Shield" size={24} className="mb-2" />
                  <span className="text-sm">Security</span>
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">New user registration - 2 minutes ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">System backup completed - 2 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Security scan initiated - 4 hours ago</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Database optimization - 6 hours ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="CheckCircle" size={32} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Database</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="CheckCircle" size={32} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-foreground">API Services</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icon name="CheckCircle" size={32} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-foreground">Storage</p>
                <p className="text-xs text-muted-foreground">Healthy</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
