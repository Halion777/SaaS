import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Hook to automatically set page title based on current route
 * Updates document.title on route changes
 */
const usePageTitle = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'Haliqo';

    // Map routes to page titles
    const routeTitles = {
      '/': t('pageTitle.home', 'Home'),
      '/login': t('pageTitle.login', 'Login'),
      '/register': t('pageTitle.register', 'Register'),
      '/forgot-password': t('pageTitle.forgotPassword', 'Forgot Password'),
      '/reset-password': t('pageTitle.resetPassword', 'Reset Password'),
      '/pricing': t('pageTitle.pricing', 'Pricing'),
      '/about': t('pageTitle.about', 'About'),
      '/contact': t('pageTitle.contact', 'Contact'),
      '/features': t('pageTitle.features', 'Features'),
      '/terms': t('pageTitle.terms', 'Terms of Service'),
      '/privacy': t('pageTitle.privacy', 'Privacy Policy'),
      '/cookies': t('pageTitle.cookies', 'Cookie Policy'),
      '/blog': t('pageTitle.blog', 'Blog'),
      '/find-artisan': t('pageTitle.findArtisan', 'Find Artisan'),
      
      // Protected pages
      '/dashboard': t('pageTitle.dashboard', 'Dashboard'),
      '/quote-creation': t('pageTitle.quoteCreation', 'Create Quote'),
      '/quotes-management': t('pageTitle.quotesManagement', 'Quotes'),
      '/invoices-management': t('pageTitle.invoicesManagement', 'Invoices'),
      '/expense-invoices': t('pageTitle.expenseInvoices', 'Expense Invoices'),
      '/client-management': t('pageTitle.clientManagement', 'Clients'),
      '/quotes-follow-up': t('pageTitle.quotesFollowUp', 'Quotes Follow-up'),
      '/invoices-follow-up': t('pageTitle.invoicesFollowUp', 'Invoices Follow-up'),
      '/analytics-dashboard': t('pageTitle.analytics', 'Analytics'),
      '/leads-management': t('pageTitle.leadsManagement', 'Leads'),
      '/multi-user-profiles': t('pageTitle.profiles', 'Profiles'),
      '/subscription': t('pageTitle.subscription', 'Subscription'),
      '/tasks': t('pageTitle.tasks', 'Tasks'),
      
      // Services
      '/services/peppol': t('pageTitle.peppol', 'PEPPOL'),
      '/services/assurance': t('pageTitle.creditInsurance', 'Credit Insurance'),
      '/services/recouvrement': t('pageTitle.recovery', 'Recovery'),
      
      // Super Admin
      '/admin/super/dashboard': t('pageTitle.superAdmin.dashboard', 'Admin Dashboard'),
      '/admin/super/users': t('pageTitle.superAdmin.users', 'Users Management'),
      '/admin/super/leads': t('pageTitle.superAdmin.leads', 'Leads Management'),
      '/admin/super/billing': t('pageTitle.superAdmin.billing', 'Billing'),
      '/admin/super/email-templates': t('pageTitle.superAdmin.emailTemplates', 'Email Templates'),
      '/admin/super/blogs': t('pageTitle.superAdmin.blogs', 'Blog Management'),
      '/admin/super/customization': t('pageTitle.superAdmin.customization', 'Customization'),
      '/admin/super/peppol-settings': t('pageTitle.superAdmin.peppol', 'PEPPOL Settings'),
    };

    // Check for exact match first
    if (routeTitles[path]) {
      title = routeTitles[path];
    } else {
      // Check for partial matches (for dynamic routes)
      if (path.startsWith('/quote-share/')) {
        title = t('pageTitle.quoteShare', 'Quote');
      } else if (path.startsWith('/blog/')) {
        title = t('pageTitle.blogPost', 'Blog Post');
      } else if (path.startsWith('/admin/super/')) {
        title = t('pageTitle.superAdmin.default', 'Super Admin');
      }
    }

    // Set the document title
    document.title = `${title} | Haliqo`;
  }, [location.pathname, t]);
};

export default usePageTitle;

