import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabaseClient';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TableLoader from '../../components/ui/TableLoader';

const BlogPage = () => {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedBlogs, setExpandedBlogs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load published blogs
  useEffect(() => {
    const loadBlogs = async () => {
      try {
        setLoading(true);
   
        
        const { data, error } = await supabase
          .from('blogs')
          .select(`
            id,
            title,
            slug,
            excerpt,
            content,
            featured_image,
            category,
            published_at,
            created_at,
            tags,
            meta_title,
            meta_description
          `)
          .eq('status', 'published')
          .order('published_at', { ascending: false });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        
        setBlogs(data || []);
      } catch (error) {
        console.error('Error loading blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  // Toggle blog expansion
  const toggleBlogExpansion = (blogId) => {
    setExpandedBlogs(prev => ({
      ...prev,
      [blogId]: !prev[blogId]
    }));
  };

  // Pagination calculations
  const totalPages = Math.ceil(blogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBlogs = blogs.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get category color
  const getCategoryColor = (category) => {
    const colors = {
      'technology': 'bg-blue-100 text-blue-800',
      'business': 'bg-green-100 text-green-800',
      'tutorials': 'bg-purple-100 text-purple-800',
      'news': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };


 
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Blog - Haliqo</title>
        <meta name="description" content="Discover insights, tutorials, and news about construction technology and business management." />
      </Helmet>
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-96 h-96 bg-[#12bf23]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-[#0036ab]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center bg-[#0036ab]/10 text-[#0036ab] px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6 animate-fadeIn">
                <Icon name="FileText" size={16} className="mr-2" />
                {t('blog.hero.badge')}
              </div>
              
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {t('blog.hero.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0036ab] to-[#12bf23]">{t('blog.hero.titleHighlight')}</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-gray-600 mb-8 leading-relaxed">
                {t('blog.hero.subtitle')}
              </p>
              
              {/* Key Benefits */}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                  <span>{t('blog.hero.benefits.expertAdvice')}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                  <span>{t('blog.hero.benefits.bestPractices')}</span>
                </div>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4 w-3 h-3 mr-1 sm:mr-2 text-[#12bf23]" />
                  <span>{t('blog.hero.benefits.industryNews')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Blog Posts Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <TableLoader message={t('blog.loading.message')} />
            ) : blogs.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="FileText" size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('blog.empty.title')}</h3>
                <p className="text-gray-600">{t('blog.empty.message')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedBlogs.map((blog) => (
                  <article key={blog.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
                    {/* Featured Image */}
                    <div className="relative h-48 overflow-hidden">
                      {blog.featured_image ? (
                        <img
                          src={blog.featured_image}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0036ab]/10 to-[#12bf23]/10 flex items-center justify-center">
                          <Icon name="FileText" size={48} className="text-[#0036ab]/50" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(blog.category)}`}>
                          {blog.category || 'General'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Icon name="Calendar" size={16} className="mr-2" />
                        <span>{formatDate(blog.published_at || blog.created_at)}</span>
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#0036ab] transition-colors duration-200">
                        {blog.title}
                      </h2>

                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {blog.excerpt}
                      </p>

                      {/* Expanded Content */}
                      {expandedBlogs[blog.id] && (
                        <div className="mb-4 prose prose-sm max-w-none">
                          <div 
                            className="text-gray-700"
                            dangerouslySetInnerHTML={{ __html: blog.content }}
                          />
                        </div>
                      )}

                      {/* Read More Button */}
                      <div className="flex items-center justify-between">
                        <Button
                          onClick={() => toggleBlogExpansion(blog.id)}
                          variant="outline"
                          className="text-[#0036ab] border-[#0036ab] hover:bg-[#0036ab] hover:text-white transition-all duration-200"
                        >
                          {expandedBlogs[blog.id] ? 'Read Less' : 'Read More'}
                          <Icon 
                            name={expandedBlogs[blog.id] ? "ChevronUp" : "ChevronDown"} 
                            size={16} 
                            className="ml-2" 
                          />
                        </Button>

                        {/* External Link Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-[#0036ab] transition-colors duration-200"
                          onClick={() => window.open(`https://www.haliqo.com/blog/${blog.slug}`, '_blank')}
                        >
                          <Icon name="ExternalLink" size={16} />
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-2"
                        >
                          <Icon name="ChevronLeft" size={16} className="mr-1" />
                          {t('blog.pagination.previous')}
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                currentPage === page
                                  ? 'bg-[#0036ab] text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2"
                        >
                          {t('blog.pagination.next')}
                          <Icon name="ChevronRight" size={16} className="ml-1" />
                        </Button>
                      </div>
                      
                      <div className="text-center mt-3 text-sm text-gray-500">
                        {t('blog.pagination.showing', {
                          start: startIndex + 1,
                          end: Math.min(endIndex, blogs.length),
                          total: blogs.length
                        })}
                      </div>
              </div>
            </div>
                )}
              </>
            )}
          </div>
        </section>

      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage; 