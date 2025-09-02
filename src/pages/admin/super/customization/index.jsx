import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from 'services/supabaseClient';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import SuperAdminSidebar from 'components/ui/SuperAdminSidebar';

const SuperAdminCustomization = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('email-templates');
  const [loading, setLoading] = useState(true);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedBlogPost, setSelectedBlogPost] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    content: '',
    variables: ''
  });
  const [blogForm, setBlogForm] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    featured_image: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load email templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Load blog posts
      const { data: blogData, error: blogError } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (blogError) throw blogError;

      setEmailTemplates(templatesData || []);
      setBlogPosts(blogData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateEdit = (template) => {
    setSelectedTemplate(template);
    setTemplateForm({
      name: template.name || '',
      subject: template.subject || '',
      content: template.content || '',
      variables: template.variables || ''
    });
    setShowTemplateModal(true);
  };

  const handleBlogEdit = (post) => {
    setSelectedBlogPost(post);
    setBlogForm({
      title: post.title || '',
      content: post.content || '',
      excerpt: post.excerpt || '',
      status: post.status || 'draft',
      featured_image: post.featured_image || ''
    });
    setShowBlogModal(true);
  };

  const saveTemplate = async () => {
    try {
      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateForm.name,
            subject: templateForm.subject,
            content: templateForm.content,
            variables: templateForm.variables,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            name: templateForm.name,
            subject: templateForm.subject,
            content: templateForm.content,
            variables: templateForm.variables
          });

        if (error) throw error;
      }

      await loadData();
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      setTemplateForm({ name: '', subject: '', content: '', variables: '' });
    } catch (error) {
      console.error('Error saving template:', error);
    }
  };

  const saveBlogPost = async () => {
    try {
      if (selectedBlogPost) {
        // Update existing post
        const { error } = await supabase
          .from('blog_posts')
          .update({
            title: blogForm.title,
            content: blogForm.content,
            excerpt: blogForm.excerpt,
            status: blogForm.status,
            featured_image: blogForm.featured_image,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBlogPost.id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase
          .from('blog_posts')
          .insert({
            title: blogForm.title,
            content: blogForm.content,
            excerpt: blogForm.excerpt,
            status: blogForm.status,
            featured_image: blogForm.featured_image
          });

        if (error) throw error;
      }

      await loadData();
      setShowBlogModal(false);
      setSelectedBlogPost(null);
      setBlogForm({ title: '', content: '', excerpt: '', status: 'draft', featured_image: '' });
    } catch (error) {
      console.error('Error saving blog post:', error);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const deleteBlogPost = async (postId) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error deleting blog post:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Customization - Super Admin | Haliqo</title>
      </Helmet>

      <SuperAdminSidebar />

      <main className="ml-0 lg:ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Customization</h1>
              <p className="text-muted-foreground mt-1">
                Manage email templates and blog content
              </p>
            </div>
            <div className="flex items-center space-x-2 mt-4 sm:mt-0">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/super/dashboard')}
              >
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('email-templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'email-templates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                Email Templates
              </button>
              <button
                onClick={() => setActiveTab('blog-posts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'blog-posts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                Blog Posts
              </button>
            </nav>
          </div>

          {/* Email Templates Tab */}
          {activeTab === 'email-templates' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Email Templates</h2>
                <Button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateForm({ name: '', subject: '', content: '', variables: '' });
                    setShowTemplateModal(true);
                  }}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Template
                </Button>
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Subject
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Variables
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Created
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {emailTemplates.map((template) => (
                          <tr key={template.id} className="border-t border-border hover:bg-muted/25">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{template.name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-foreground">{template.subject}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-muted-foreground">
                                {template.variables ? template.variables.split(',').length : 0} variables
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatDate(template.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTemplateEdit(template)}
                                >
                                  <Icon name="Edit" size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteTemplate(template.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Icon name="Trash2" size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {emailTemplates.length === 0 && (
                      <div className="text-center py-12">
                        <Icon name="Mail" size={48} className="mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No email templates found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Blog Posts Tab */}
          {activeTab === 'blog-posts' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Blog Posts</h2>
                <Button
                  onClick={() => {
                    setSelectedBlogPost(null);
                    setBlogForm({ title: '', content: '', excerpt: '', status: 'draft', featured_image: '' });
                    setShowBlogModal(true);
                  }}
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Post
                </Button>
              </div>

              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Title
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Excerpt
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Created
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {blogPosts.map((post) => (
                          <tr key={post.id} className="border-t border-border hover:bg-muted/25">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{post.title}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                                {post.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-muted-foreground max-w-xs truncate">
                                {post.excerpt}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {formatDate(post.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleBlogEdit(post)}
                                >
                                  <Icon name="Edit" size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteBlogPost(post.id)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Icon name="Trash2" size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {blogPosts.length === 0 && (
                      <div className="text-center py-12">
                        <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No blog posts found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {selectedTemplate ? 'Edit Template' : 'New Template'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Template Name
                </label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject
                </label>
                <Input
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Variables (comma-separated)
                </label>
                <Input
                  value={templateForm.variables}
                  onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                  placeholder="e.g., {{name}}, {{company}}, {{quote_number}}"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Content
                </label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  placeholder="Enter email content (HTML supported)"
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                  rows={10}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveTemplate}>
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {selectedBlogPost ? 'Edit Blog Post' : 'New Blog Post'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title
                </label>
                <Input
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  placeholder="Enter blog post title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Excerpt
                </label>
                <textarea
                  value={blogForm.excerpt}
                  onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                  placeholder="Enter blog post excerpt"
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Featured Image URL
                </label>
                <Input
                  value={blogForm.featured_image}
                  onChange={(e) => setBlogForm({ ...blogForm, featured_image: e.target.value })}
                  placeholder="Enter image URL"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={blogForm.status}
                  onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value })}
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Content
                </label>
                <textarea
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  placeholder="Enter blog post content (Markdown supported)"
                  className="w-full p-3 border border-border rounded-md bg-background text-foreground"
                  rows={15}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowBlogModal(false);
                  setSelectedBlogPost(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveBlogPost}>
                Save Post
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminCustomization;
