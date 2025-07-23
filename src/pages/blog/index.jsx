import React from 'react';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useTranslation } from '../../context/TranslationContext';

const BlogPage = () => {
  const { t, language } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{t('pageTitles.blog')}</title>
        <meta name="description" content={t('blog.metaDescription') || "Découvrez nos articles sur l'actualité et les bonnes pratiques pour les artisans."} />
        <html lang={language} />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow">
        {/* Blog Coming Soon Section */}
        <section className="py-24 bg-muted">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex mb-8 p-4 rounded-full bg-primary/10">
                <Icon name="FileText" size={32} color="var(--color-primary)" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {t('blog.comingSoon.title') || "Blog en cours de développement"}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {t('blog.comingSoon.description') || "Notre blog est en cours de création. Vous y trouverez bientôt des articles sur les meilleures pratiques et conseils pour les artisans."}
              </p>
              <div className="flex justify-center">
                <a href="/" className="inline-flex items-center text-primary hover:underline">
                  <Icon name="ArrowLeft" size={20} className="mr-2" />
                  {t('blog.comingSoon.backToHome') || "Retour à l'accueil"}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BlogPage; 