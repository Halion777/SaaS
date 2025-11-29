import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';
import TableLoader from 'components/ui/TableLoader';
import UsersFilterToolbar from './components/UsersFilterToolbar';

const SuperAdminUsers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return window.innerWidth < 1024 ? 'card' : 'table';
  });
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    newThisMonth: 0,
    withLastLogin: 0,
    superAdmins: 0
  });

  // Handle sidebar offset for responsive layout
  React.useEffect(() => {
    const updateSidebarOffset = (isCollapsed) => {
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

      // Auto-switch to card view on mobile/tablet
      if (window.innerWidth < 1024) {
        setViewMode('card');
      }
    };

    const handleSidebarToggle = (e) => {
      const { isCollapsed } = e.detail;
      updateSidebarOffset(isCollapsed);
    };
    
    const handleResize = () => {
      // Get current sidebar state from localStorage
      const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
      const isCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
      updateSidebarOffset(isCollapsed);
    };

    window.addEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
    window.addEventListener('resize', handleResize);
    
    // Set initial state based on saved sidebar state
    const savedCollapsed = localStorage.getItem('superadmin-sidebar-collapsed');
    const initialCollapsed = savedCollapsed ? JSON.parse(savedCollapsed) : false;
    updateSidebarOffset(initialCollapsed);

    return () => {
      window.removeEventListener('superadmin-sidebar-toggle', handleSidebarToggle);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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

        // Load users data
        loadUsers();
      } catch (error) {
        console.error('Error checking superadmin access:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  // Load users from Supabase
  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Load users with their subscription and activity data
      // Filter out superadmin users at the database level
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles!user_profiles_user_id_fkey(*)
        `)
        .neq('role', 'superadmin')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Now using the last_login_at column from users table for accurate login tracking
      const enrichedUsers = usersData
        .map(user => {
        // Construct full_name from first_name and last_name
        const fullName = (user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`.trim()
          : user.first_name || user.last_name || '');
        
        return {
          ...user,
          full_name: fullName, // Add constructed full_name for backward compatibility
          // Use the last_login_at column from users table
          last_sign_in_at: user.last_login_at,
          // Check if user has ever logged in
          has_logged_in: !!user.last_login_at
        };
      });

      setUsers(enrichedUsers);
      setFilteredUsers(enrichedUsers);
      
      // Calculate stats (superadmin users already filtered out)
      const stats = {
        total: enrichedUsers.length,
        newThisMonth: enrichedUsers.filter(u => {
          const createdDate = new Date(u.created_at);
          const thisMonth = new Date();
          thisMonth.setDate(1);
          return createdDate >= thisMonth;
        }).length,
        withLastLogin: enrichedUsers.filter(u => u.has_logged_in).length,
        superAdmins: 0 // Always 0 since superadmin users are filtered out
      };
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter (removed since we don't use active/inactive)
    // Status filtering is no longer needed

    // Role filtering removed

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle first_name sorting by constructing full name from first_name and last_name
      if (sortBy === 'first_name') {
        const aFullName = (a.first_name && a.last_name ? `${a.first_name} ${a.last_name}` : a.first_name || a.last_name || '').toLowerCase();
        const bFullName = (b.first_name && b.last_name ? `${b.first_name} ${b.last_name}` : b.first_name || b.last_name || '').toLowerCase();
        aValue = aFullName;
        bValue = bFullName;
      } else if (sortBy === 'created_at' || sortBy === 'last_sign_in_at') {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // User actions
  const handleUserAction = async (userId, action) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Prevent edit and delete for superadmin users
    if (user.role === 'superadmin' && (action === 'edit' || action === 'delete')) {
      alert('Super admin users cannot be edited or deleted.');
      return;
    }

    try {
      switch (action) {
        case 'view':
          setSelectedUser(user);
          setShowUserModal(true);
          break;
        case 'edit':
          setSelectedUser(user);
          setShowEditModal(true);
          break;
        // Removed suspend/activate actions since we don't use active/inactive status
        case 'delete':
          if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            await supabase
              .from('users')
              .delete()
              .eq('id', userId);
            await loadUsers();
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on user:`, error);
      alert(`Error performing ${action} on user. Please try again.`);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    // Filter out superadmin users from bulk actions
    const usersToProcess = users.filter(u => selectedUsers.includes(u.id) && u.role !== 'superadmin');
    const superAdminCount = selectedUsers.length - usersToProcess.length;
    
    if (superAdminCount > 0) {
      alert(`Cannot perform bulk action on ${superAdminCount} super admin user(s). They have been excluded.`);
    }

    if (usersToProcess.length === 0) {
      setSelectedUsers([]);
      return;
    }

    const userIdsToProcess = usersToProcess.map(u => u.id);

    try {
      switch (action) {
        // Removed bulk activate/suspend actions since we don't use active/inactive status
        case 'delete':
          if (confirm(`Are you sure you want to delete ${usersToProcess.length} user(s)? This action cannot be undone.`)) {
            await supabase
              .from('users')
              .delete()
              .in('id', userIdsToProcess);
          }
          break;
      default:
          break;
      }
      await loadUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      alert(`Error performing bulk ${action}. Please try again.`);
    }
  };

  const exportUsers = async () => {
    try {
      setIsExporting(true);
      
      const csvContent = [
        ['Email', 'Full Name', 'Company', 'Role', 'Status', 'Created At', 'Last Login'],
        ...filteredUsers.map(user => [
          user.email || '',
          (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name || user.last_name || user.full_name || ''),
          user.company_name || '',
          user.role || '',
          user.has_logged_in ? 'Has Login' : 'No Login',
          new Date(user.created_at).toLocaleDateString(),
          user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Error exporting users. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };


  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>User Management - Super Admin</title>
      </Helmet>
      
      <SuperAdminSidebar />
      
      <div
        className="flex-1 flex flex-col pb-20 md:pb-6"
        style={{ marginLeft: isMobile ? '0' : `${sidebarOffset}px` }}
      >
        <main className="flex-1 px-4 sm:px-6 pt-0 pb-4 sm:pb-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-card border-b border-border px-4 sm:px-6 py-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <div className="flex items-center">
                  <Icon name="Users" size={24} className="text-blue-600 mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">User Management</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Manage all system users, roles, and permissions
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 w-full sm:w-auto">
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportUsers}
                    disabled={isExporting}
                    className="sm:h-9 sm:px-3 sm:w-auto"
                  >
                    <Icon name="Download" size={16} className="mr-2" />
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon name="Users" size={20} className="text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Icon name="LogIn" size={20} className="text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Users with Login</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.withLastLogin}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Icon name="UserPlus" size={20} className="text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold text-foreground">{userStats.newThisMonth}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <UsersFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(field, order) => {
              setSortBy(field);
              setSortOrder(order);
            }}
            filteredCount={filteredUsers.length}
          />

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  {selectedUsers.length} user(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Icon name="Trash2" size={16} className="mr-1" />
                    Delete
                </Button>
              </div>
            </div>
          </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">View:</span>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                    viewMode === 'table'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Table" size={14} className="mr-1" />
                  Table
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center ${
                    viewMode === 'card'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="Grid" size={14} className="mr-1" />
                  Cards
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {filteredUsers.length} user(s)
            </div>
          </div>

          {/* Users Table/Card View */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {loading ? (
              <TableLoader message="Loading users..." />
            ) : (
            <>
            {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === paginatedUsers.filter(u => u.role !== 'superadmin').length && paginatedUsers.filter(u => u.role !== 'superadmin').length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers(paginatedUsers.filter(u => u.role !== 'superadmin').map(u => u.id));
                          } else {
                            setSelectedUsers([]);
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          disabled={user.role === 'superadmin'}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, user.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <Icon name="User" size={20} className="text-muted-foreground" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {user.full_name || 'No Name'}
                            </div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                            {user.company_name && (
                              <div className="text-xs text-muted-foreground">{user.company_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role || 'admin'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDateTime(user.last_sign_in_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'view')}
                            className="h-8 px-2"
                            title="View Details"
                          >
                            <Icon name="Eye" size={14} />
                          </Button>
                          {user.role !== 'superadmin' && (
                            <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'edit')}
                            className="h-8 px-2"
                            title="Edit User"
                          >
                            <Icon name="Edit" size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'delete')}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                            title="Delete User"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}

            {viewMode === 'card' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {paginatedUsers.map((user) => (
                  <div key={user.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                          <Icon name="User" size={24} className="text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {user.full_name || 'No Name'}
                          </h3>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {user.company_name && (
                            <p className="text-xs text-muted-foreground truncate">{user.company_name}</p>
                          )}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        disabled={user.role === 'superadmin'}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                          }
                        }}
                        className="rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Role:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {user.role || 'admin'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Last Login:</span>
                        <span className="text-xs text-foreground">{formatDateTime(user.last_sign_in_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Created:</span>
                        <span className="text-xs text-foreground">{formatDate(user.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-1 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'view')}
                        className="h-8 px-2"
                        title="View Details"
                      >
                        <Icon name="Eye" size={14} />
                      </Button>
                      {user.role !== 'superadmin' && (
                        <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'edit')}
                        className="h-8 px-2"
                        title="Edit User"
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUserAction(user.id, 'delete')}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                        title="Delete User"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
            )}
          </div>

          {/* Pagination */}
          <div className="bg-card border border-border rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
            </div>
          </div>
        </div>
      </main>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">User Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserModal(false)}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground border-b border-border pb-2">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-foreground">{(selectedUser.first_name && selectedUser.last_name ? `${selectedUser.first_name} ${selectedUser.last_name}` : selectedUser.first_name || selectedUser.last_name || selectedUser.full_name || 'Not provided')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-foreground">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone</label>
                      <p className="text-foreground">{selectedUser.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Profession</label>
                      <p className="text-foreground">{selectedUser.profession || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Country</label>
                      <p className="text-foreground">{selectedUser.country || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Business Size</label>
                      <p className="text-foreground">{selectedUser.business_size || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground border-b border-border pb-2">Company Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                      <p className="text-foreground">{selectedUser.company_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">VAT Number</label>
                      <p className="text-foreground">{selectedUser.vat_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Selected Plan</label>
                      <p className="text-foreground">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedUser.selected_plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                          selectedUser.selected_plan === 'premium' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedUser.selected_plan || 'Not selected'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Subscription Status</label>
                      <p className="text-foreground">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          selectedUser.subscription_status === 'active' ? 'bg-green-100 text-green-800' :
                          selectedUser.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                          selectedUser.subscription_status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedUser.subscription_status || 'Unknown'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Trial End Date</label>
                      <p className="text-foreground">
                        {selectedUser.trial_end_date 
                          ? new Date(selectedUser.trial_end_date).toLocaleDateString() 
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Status & Metadata */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-lg font-medium text-foreground mb-4">User Status & Metadata</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-foreground">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role || 'admin'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Login Status</label>
                    <p className="text-foreground">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        selectedUser.has_logged_in ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedUser.has_logged_in ? 'Has Logged In' : 'Never Logged In'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p className="text-foreground">{formatDateTime(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Login</label>
                    <p className="text-foreground">{formatDateTime(selectedUser.last_sign_in_at)}</p>
                  </div>
                </div>
              </div>
              
              {/* User Profiles */}
              {selectedUser.user_profiles && selectedUser.user_profiles.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="text-lg font-medium text-foreground mb-4">User Profiles</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUser.user_profiles.map((profile, index) => (
                      <div key={index} className="bg-muted/50 p-4 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-foreground">{profile.name}</h5>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            profile.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            profile.role === 'superadmin' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {profile.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                        <div className="mt-2 flex items-center text-xs text-muted-foreground">
                          <Icon name="Clock" size={12} className="mr-1" />
                          {profile.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowUserModal(false)}
                >
                  Close
                </Button>
                {selectedUser.role !== 'superadmin' && (
                <Button
                  onClick={() => {
                    setShowUserModal(false);
                    setShowEditModal(true);
                  }}
                >
                  Edit User
                </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-foreground">Edit User</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground border-b border-border pb-2">Personal Information</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                      <Input
                          value={selectedUser.first_name || ''}
                          onChange={(e) => setSelectedUser({...selectedUser, first_name: e.target.value})}
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                        <Input
                          value={selectedUser.last_name || ''}
                          onChange={(e) => setSelectedUser({...selectedUser, last_name: e.target.value})}
                          placeholder="Enter last name"
                      />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                      <Input
                        value={selectedUser.phone || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Profession</label>
                      <Input
                        value={selectedUser.profession || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, profession: e.target.value})}
                        placeholder="Enter profession"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                      <Input
                        value={selectedUser.country || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, country: e.target.value})}
                        placeholder="Enter country"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-foreground border-b border-border pb-2">Company Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                      <Input
                        value={selectedUser.company_name || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, company_name: e.target.value})}
                        placeholder="Enter company name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">VAT Number</label>
                      <Input
                        value={selectedUser.vat_number || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, vat_number: e.target.value})}
                        placeholder="Enter VAT number"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Business Size</label>
                      <Input
                        value={selectedUser.business_size || ''}
                        onChange={(e) => setSelectedUser({...selectedUser, business_size: e.target.value})}
                        placeholder="Enter business size"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                      <Select
                        value={selectedUser.role || 'admin'}
                        onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                        placeholder="Select role"
                        disabled={selectedUser.role === 'superadmin'}
                        options={[
                          { value: 'admin', label: 'Admin' },
                          { value: 'superadmin', label: 'Super Admin' }
                        ]}
                        className="w-full"
                      />
                      {selectedUser.role === 'superadmin' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Super admin role cannot be changed
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (selectedUser.role === 'superadmin') {
                      alert('Super admin users cannot be edited.');
                      return;
                    }
                    try {
                      await supabase
                        .from('users')
                        .update({
                          first_name: selectedUser.first_name,
                          last_name: selectedUser.last_name,
                          company_name: selectedUser.company_name,
                          phone: selectedUser.phone,
                          profession: selectedUser.profession,
                          country: selectedUser.country,
                          vat_number: selectedUser.vat_number,
                          business_size: selectedUser.business_size,
                          role: selectedUser.role
                        })
                        .eq('id', selectedUser.id);
                      
                      await loadUsers();
                      setShowEditModal(false);
                    } catch (error) {
                      console.error('Error updating user:', error);
                      alert('Error updating user. Please try again.');
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsers;
