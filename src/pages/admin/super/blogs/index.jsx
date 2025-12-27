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
import RichTextEditor from 'components/ui/RichTextEditor';
import BlogsFilterToolbar from './components/BlogsFilterToolbar';

const BlogsManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sidebarOffset, setSidebarOffset] = useState(288);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return window.innerWidth < 1024 ? 'card' : 'table';
  });
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const [filteredBlogs, setFilteredBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category: 'general',
    language: 'en',
    tags: [],
    status: 'draft',
    published_at: null,
    meta_title: '',
    meta_description: '',
    author_id: null
  });
  const [uploadingImage, setUploadingImage] = useState(false);

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

        // Load blogs
        loadBlogs();
      } catch (error) {
        console.error('Error checking superadmin access:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  // Load blogs
  const loadBlogs = async () => {
    try {
      setLoading(true);
   
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Fetch author information for blogs that have author_id
      if (data && data.length > 0) {
        const authorIds = [...new Set(data.filter(blog => blog.author_id).map(blog => blog.author_id))];
        
        if (authorIds.length > 0) {
          // Get user information from public.users table
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name')
            .in('id', authorIds);

          if (usersError) {
            console.error('Error fetching author information:', usersError);
          }

          // Create a map of author_id to user info
          const authorsMap = {};
          if (usersData && usersData.length > 0) {
            usersData.forEach(user => {
              // Combine first_name and last_name, fallback to email
              const fullName = [user.first_name, user.last_name]
                .filter(Boolean)
                .join(' ')
                .trim();
              
              authorsMap[user.id] = {
                name: fullName || user.email || 'Unknown',
                email: user.email
              };
            });
          }

          // Add author info to each blog
          data.forEach(blog => {
            if (blog.author_id) {
              if (authorsMap[blog.author_id]) {
                blog.author_info = authorsMap[blog.author_id];
              } else {
                // User not found in users table - log for debugging
                console.warn(`Author not found for blog ${blog.id}:`, blog.author_id);
              }
            }
          });
        }
      }

      setBlogs(data || []);
      setFilteredBlogs(data || []);
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter blogs
  useEffect(() => {
    let filtered = [...blogs];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(blog =>
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(blog => blog.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(blog => blog.category === categoryFilter);
    }

    setFilteredBlogs(filtered);
  }, [blogs, searchTerm, statusFilter, categoryFilter]);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle blog edit
  const handleEditBlog = (blog) => {
    setEditingBlog({
      ...blog,
      tags: Array.isArray(blog.tags) ? blog.tags : [],
      category: blog.category || 'general',
      language: blog.language || 'en'
    });
    setIsEditModalOpen(true);
  };

  // Handle blog preview
  const handlePreviewBlog = (blog) => {
    setSelectedBlog(blog);
    setIsPreviewModalOpen(true);
  };

  // Handle blog create
  const handleCreateBlog = () => {
    setEditingBlog({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category: 'general',
      language: 'en',
      tags: [],
      status: 'draft',
      published_at: null,
      meta_title: '',
      meta_description: '',
      author_id: null
    });
    setIsCreateModalOpen(true);
  };

  // Save blog
  const handleSaveBlog = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting current user:', userError);
      }

      // Extract only the fields that exist in the database schema
      // Exclude computed fields like author_info
      const { author_info, ...blogDataWithoutComputed } = editingBlog;
      
      const blogData = {
        ...blogDataWithoutComputed,
        updated_at: new Date().toISOString()
      };

      // Set author_id to current user if creating new blog or if author_id is null
      if (!editingBlog.id) {
        // Creating new blog - set author to current user
        blogData.author_id = user?.id || null;
      } else if (!blogData.author_id && user) {
        // Updating existing blog that has no author - set to current user
        blogData.author_id = user.id;
      }

      if (editingBlog.id) {
        // Update existing blog
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', editingBlog.id);

        if (error) throw error;
      } else {
        // Create new blog
        const { error } = await supabase
          .from('blogs')
          .insert([blogData]);

        if (error) throw error;
      }

      // Reload blogs
      await loadBlogs();
      
      // Close modals
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
      setEditingBlog({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        category: '',
        tags: [],
        status: 'draft',
        published_at: null,
        meta_title: '',
        meta_description: '',
        author_id: null
      });
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Error saving blog. Please try again.');
    }
  };

  // Delete blog
  const handleDeleteBlog = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', blogId);

      if (error) throw error;

      await loadBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      alert('Error deleting blog. Please try again.');
    }
  };

  // Toggle blog status
  const handleToggleStatus = async (blog) => {
    try {
      const newStatus = blog.status === 'published' ? 'draft' : 'published';
      const { error } = await supabase
        .from('blogs')
        .update({ 
          status: newStatus,
          published_at: newStatus === 'published' ? new Date().toISOString() : null
        })
        .eq('id', blog.id);

      if (error) throw error;

      await loadBlogs();
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Error updating blog. Please try again.');
    }
  };

  // Generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);

      setEditingBlog({...editingBlog, featured_image: publicUrl});
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle tags input
  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setEditingBlog({...editingBlog, tags});
  };


  return (
    <div className="min-h-screen bg-background flex">
      <Helmet>
        <title>Blog Management - Super Admin</title>
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
                  <Icon name="FileText" size={24} className="text-blue-600 mr-3" />
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">Blog Management</h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Manage blog posts, categories, and content
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={handleCreateBlog}
                  className="sm:h-9 sm:px-3 sm:w-auto"
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  <span className="hidden sm:inline">New Post</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <BlogsFilterToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            filteredCount={filteredBlogs.length}
          />

          {/* View Toggle */}
          <div className="flex items-center p-4 border-b border-border bg-card rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">View</span>
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
                  <span>Table</span>
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
                  <span>Cards</span>
                </button>
              </div>
            </div>
          </div>

          {/* Blogs List/Card View */}
          <div className="bg-card border border-border rounded-lg">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Blog Posts ({filteredBlogs.length})
              </h3>
            </div>
            {loading ? (
              <TableLoader message="Loading blog posts..." />
            ) : (
              <>
              {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredBlogs.map((blog) => (
                    <tr key={blog.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {blog.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {blog.excerpt?.substring(0, 100)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {blog.category || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {blog.language === 'en' ? '🇬🇧 EN' : blog.language === 'fr' ? '🇫🇷 FR' : blog.language === 'nl' ? '🇳🇱 NL' : blog.language || 'EN'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(blog.status)}`}>
                          {blog.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {blog.author_info ? (
                          <div>
                            <div className="font-medium text-foreground">{blog.author_info.name}</div>
                            <div className="text-xs text-muted-foreground">{blog.author_info.email}</div>
                          </div>
                        ) : blog.author_id ? (
                          <span className="text-muted-foreground">Unknown Author</span>
                        ) : (
                          <span className="text-muted-foreground">No Author</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Not published'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewBlog(blog)}
                            title="Preview"
                          >
                            <Icon name="Eye" size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBlog(blog)}
                          >
                            <Icon name="Edit" size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(blog)}
                            title={blog.status === 'published' ? 'Hide Blog' : 'Publish Blog'}
                          >
                            <Icon name={blog.status === 'published' ? 'Lock' : 'Unlock'} size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteBlog(blog.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Icon name="Trash2" size={14} />
                          </Button>
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
                  {filteredBlogs.map((blog) => (
                    <div key={blog.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Blog Image */}
                      {blog.featured_image && (
                        <div className="mb-3 rounded-lg overflow-hidden h-32 bg-muted">
                          <img 
                            src={blog.featured_image} 
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Blog Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold text-foreground line-clamp-2">{blog.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{blog.excerpt}</p>
                        </div>
                      </div>

                      {/* Blog Details */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Category:</span>
                          <span className="text-xs text-foreground">{blog.category || 'Uncategorized'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Language:</span>
                          <span className="text-xs text-foreground">
                            {blog.language === 'en' ? '🇬🇧 EN' : blog.language === 'fr' ? '🇫🇷 FR' : blog.language === 'nl' ? '🇳🇱 NL' : blog.language || 'EN'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Status:</span>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(blog.status)}`}>
                            {blog.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Author:</span>
                          <span className="text-xs text-foreground">
                            {blog.author_info ? blog.author_info.name : blog.author_id ? 'Unknown Author' : 'No Author'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Published:</span>
                          <span className="text-xs text-foreground">
                            {blog.published_at ? new Date(blog.published_at).toLocaleDateString() : 'Not published'}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-1 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewBlog(blog)}
                          className="h-8 px-2"
                          title="Preview"
                        >
                          <Icon name="Eye" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditBlog(blog)}
                          className="h-8 px-2"
                          title="Edit"
                        >
                          <Icon name="Edit" size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(blog)}
                          className="h-8 px-2"
                          title={blog.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          <Icon name={blog.status === 'published' ? 'Lock' : 'Unlock'} size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBlog(blog.id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredBlogs.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No blog posts found</p>
                    </div>
                  )}
                </div>
              )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedBlog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Blog Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Featured Image */}
              {selectedBlog.featured_image && (
                <div className="w-full">
                  <img
                    src={selectedBlog.featured_image}
                    alt={selectedBlog.title}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              )}
              
              <div className="p-6 space-y-6">
                {/* Header Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Icon name="Calendar" size={16} className="mr-2" />
                      <span>
                        {selectedBlog.published_at 
                          ? new Date(selectedBlog.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'Not published'
                        }
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Icon name="Tag" size={16} className="mr-2" />
                      <span className="capitalize">{selectedBlog.category || 'General'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBlog.status)}`}>
                        {selectedBlog.status}
                      </span>
                    </div>
                  </div>

                  <h1 className="text-3xl font-bold text-foreground leading-tight">
                    {selectedBlog.title}
                  </h1>
                  
                  {selectedBlog.excerpt && (
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {selectedBlog.excerpt}
                    </p>
                  )}

                  {/* Tags */}
                  {selectedBlog.tags && selectedBlog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedBlog.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="border-t border-border pt-6">
                  <div 
                    className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground"
                    dangerouslySetInnerHTML={{ __html: selectedBlog.content }}
                    style={{
                      // Ensure paragraph spacing is preserved
                    }}
                  />
                  <style>{`
                    .prose p {
                      margin-top: 1em !important;
                      margin-bottom: 1em !important;
                    }
                    .prose p:first-child {
                      margin-top: 0 !important;
                    }
                    .prose p:last-child {
                      margin-bottom: 0 !important;
                    }
                    .prose h1 + p,
                    .prose h2 + p,
                    .prose h3 + p,
                    .prose h4 + p,
                    .prose h5 + p,
                    .prose h6 + p {
                      margin-top: 0.5em !important;
                    }
                  `}</style>
                </div>

                {/* SEO Information */}
                {(selectedBlog.meta_title || selectedBlog.meta_description) && (
                  <div className="border-t border-border pt-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">SEO Information</h4>
                    <div className="space-y-3">
                      {selectedBlog.meta_title && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Meta Title:</label>
                          <p className="text-sm text-foreground">{selectedBlog.meta_title}</p>
                        </div>
                      )}
                      {selectedBlog.meta_description && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Meta Description:</label>
                          <p className="text-sm text-foreground">{selectedBlog.meta_description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {(isEditModalOpen || isCreateModalOpen) && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">
                {isCreateModalOpen ? 'Create Blog Post' : 'Edit Blog Post'}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsCreateModalOpen(false);
                }}
              >
                <Icon name="X" size={16} />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                    <Input
                      value={editingBlog.title}
                      onChange={(e) => setEditingBlog({...editingBlog, title: e.target.value, slug: generateSlug(e.target.value)})}
                      placeholder="Enter blog title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Slug</label>
                    <Input
                      value={editingBlog.slug}
                      onChange={(e) => setEditingBlog({...editingBlog, slug: e.target.value})}
                      placeholder="blog-post-slug"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Excerpt</label>
                  <textarea
                    value={editingBlog.excerpt}
                    onChange={(e) => setEditingBlog({...editingBlog, excerpt: e.target.value})}
                    placeholder="Enter blog excerpt"
                    className="w-full h-24 p-3 border border-border rounded-lg bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Content</label>
                  <RichTextEditor
                    value={editingBlog.content || ''}
                    onChange={(content) => setEditingBlog({...editingBlog, content})}
                    placeholder="Enter blog content..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <Select
                      value={editingBlog.category}
                      onChange={(e) => setEditingBlog({...editingBlog, category: e.target.value})}
                      options={[
                        { value: 'general', label: 'General' },
                        { value: 'technology', label: 'Technology' },
                        { value: 'business', label: 'Business' },
                        { value: 'tutorials', label: 'Tutorials' },
                        { value: 'news', label: 'News' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Language</label>
                    <Select
                      value={editingBlog.language || 'en'}
                      onChange={(e) => setEditingBlog({...editingBlog, language: e.target.value})}
                      options={[
                        { value: 'en', label: '🇬🇧 English' },
                        { value: 'fr', label: '🇫🇷 Français' },
                        { value: 'nl', label: '🇳🇱 Nederlands' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                    <Select
                      value={editingBlog.status}
                      onChange={(e) => setEditingBlog({...editingBlog, status: e.target.value})}
                      options={[
                        { value: 'draft', label: 'Draft' },
                        { value: 'published', label: 'Published' },
                        { value: 'archived', label: 'Archived' }
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Published Date</label>
                    <Input
                      type="datetime-local"
                      value={editingBlog.published_at ? (() => {
                        // Convert UTC date to local datetime-local format (YYYY-MM-DDTHH:mm)
                        const date = new Date(editingBlog.published_at);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                      })() : ''}
                      onChange={(e) => {
                        // Convert local datetime-local value to UTC ISO string
                        if (e.target.value) {
                          const localDate = new Date(e.target.value);
                          // Preserve the original date/time by converting local input to UTC
                          setEditingBlog({...editingBlog, published_at: localDate.toISOString()});
                        } else {
                          setEditingBlog({...editingBlog, published_at: null});
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Featured Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Featured Image</label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                        disabled={uploadingImage}
                      />
                      <label
                        htmlFor="image-upload"
                        className={`px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                          uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </label>
                      <span className="text-sm text-muted-foreground">Max 5MB</span>
                    </div>
                    {editingBlog.featured_image && (
                      <div className="relative">
                        <img
                          src={editingBlog.featured_image}
                          alt="Featured"
                          className="w-32 h-32 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingBlog({...editingBlog, featured_image: ''})}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    )}
                    <Input
                      value={editingBlog.featured_image}
                      onChange={(e) => setEditingBlog({...editingBlog, featured_image: e.target.value})}
                      placeholder="Or enter image URL directly"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tags (comma-separated)</label>
                  <Input
                    value={editingBlog.tags.join(', ')}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="technology, business, tutorial"
                  />
                </div>

                {/* SEO Fields */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-foreground">SEO Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Meta Title</label>
                      <Input
                        value={editingBlog.meta_title}
                        onChange={(e) => setEditingBlog({...editingBlog, meta_title: e.target.value})}
                        placeholder="SEO title (max 60 characters)"
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {editingBlog.meta_title.length}/60 characters
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Meta Description</label>
                      <textarea
                        value={editingBlog.meta_description}
                        onChange={(e) => setEditingBlog({...editingBlog, meta_description: e.target.value})}
                        placeholder="SEO description (max 160 characters)"
                        maxLength={160}
                        className="w-full h-20 p-3 border border-border rounded-lg bg-background text-foreground"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {editingBlog.meta_description.length}/160 characters
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex items-center justify-end space-x-2 flex-shrink-0 bg-card">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsCreateModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveBlog}>
                {isCreateModalOpen ? 'Create Post' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsManagement;
