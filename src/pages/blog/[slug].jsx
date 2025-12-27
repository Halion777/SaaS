import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabaseClient';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import TableLoader from '../../components/ui/TableLoader';

const BlogDetailPage = () => {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  // Load blog post
  useEffect(() => {
    const loadBlog = async () => {
      try {
        setLoading(true);
        
        // Try to find by slug first, then by id
        let query = supabase
          .from('blogs')
          .select(`
            id,
            title,
            slug,
            excerpt,
            content,
            featured_image,
            category,
            language,
            published_at,
            created_at,
            tags,
            meta_title,
            meta_description
          `)
          .eq('status', 'published');

        // Check if slug is a UUID (id) or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
        
        if (isUUID) {
          query = query.eq('id', slug);
        } else {
          query = query.eq('slug', slug);
        }

        const { data, error } = await query.single();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (!data) {
          // Blog not found
          navigate('/blog');
          return;
        }

        setBlog(data);

        // Load related blogs (same category and language, excluding current blog)
        const relatedQuery = supabase
          .from('blogs')
          .select('id, title, slug, excerpt, featured_image, category, language, published_at, created_at')
          .eq('status', 'published')
          .eq('category', data.category)
          .neq('id', data.id);
        
        // Filter by language if blog has a language set
        if (data.language) {
          relatedQuery.eq('language', data.language);
        }
        
        const { data: relatedData } = await relatedQuery
          .order('created_at', { ascending: false })
          .limit(3);

        setRelatedBlogs(relatedData || []);
      } catch (error) {
        console.error('Error loading blog:', error);
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadBlog();
    }
  }, [slug, navigate]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
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
      'news': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <TableLoader message={t('blog.loading.message')} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{blog.meta_title || blog.title} - Haliqo</title>
        <meta name="description" content={blog.meta_description || blog.excerpt} />
        {blog.featured_image && <meta property="og:image" content={blog.featured_image} />}
      </Helmet>
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => navigate('/blog')}
                className="mb-6 text-[#0036ab] hover:text-[#0036ab] hover:bg-[#0036ab]/10"
              >
                <Icon name="ArrowLeft" size={16} className="mr-2" />
                Back to Blog
              </Button>

              {/* Category Badge */}
              <div className="mb-4">
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(blog.category)}`}>
                  {blog.category || 'General'}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {blog.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8">
                <div className="flex items-center">
                  <Icon name="Calendar" size={16} className="mr-2" />
                  <span>{formatDate(blog.published_at || blog.created_at)}</span>
                </div>
                {blog.tags && blog.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2">
                    <Icon name="Tag" size={16} className="mr-2" />
                    {blog.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured Image */}
              {blog.featured_image && (
                <div className="mb-8 rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={blog.featured_image}
                    alt={blog.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Excerpt */}
              {blog.excerpt && (
                <div className="mb-8 p-6 bg-blue-50 rounded-xl border-l-4 border-[#0036ab]">
                  <p className="text-lg text-gray-700 italic">{blog.excerpt}</p>
                </div>
              )}

              {/* Main Content */}
              <div 
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-[#0036ab] prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700"
                dangerouslySetInnerHTML={{ __html: blog.content }}
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
          </div>
        </section>

        {/* Related Blogs Section */}
        {relatedBlogs.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {relatedBlogs.map((relatedBlog) => (
                    <article 
                      key={relatedBlog.id} 
                      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
                      onClick={() => navigate(`/blog/${relatedBlog.slug || relatedBlog.id}`)}
                    >
                      {/* Featured Image */}
                      <div className="relative h-48 overflow-hidden">
                        {relatedBlog.featured_image ? (
                          <img
                            src={relatedBlog.featured_image}
                            alt={relatedBlog.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#0036ab]/10 to-[#12bf23]/10 flex items-center justify-center">
                            <Icon name="FileText" size={48} className="text-[#0036ab]/50" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(relatedBlog.category)}`}>
                            {relatedBlog.category || 'General'}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Icon name="Calendar" size={16} className="mr-2" />
                          <span>{formatDate(relatedBlog.published_at || relatedBlog.created_at)}</span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#0036ab] transition-colors duration-200">
                          {relatedBlog.title}
                        </h3>

                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {relatedBlog.excerpt}
                        </p>

                        <Button
                          variant="ghost"
                          className="text-[#0036ab] hover:text-[#0036ab] hover:bg-[#0036ab]/10 p-0"
                        >
                          Read More
                          <Icon name="ArrowRight" size={16} className="ml-2" />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogDetailPage;

