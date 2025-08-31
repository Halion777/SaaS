import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import GlobalProfile from './components/ui/GlobalProfile';

// Import pages
import HomePage from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import ForgotPasswordPage from './pages/forgot-password';
import ResetPasswordPage from './pages/reset-password';
import PricingPage from './pages/pricing';
import FindArtisanPage from './pages/find-artisan';
import AboutPage from './pages/about';
import ContactPage from './pages/contact';
import FeaturesPage from './pages/features';
import TermsPage from './pages/terms';
import PrivacyPage from './pages/privacy';
import CookiesPage from './pages/cookies';
import BlogPage from './pages/blog';
import Dashboard from './pages/dashboard';
import QuoteCreation from './pages/quote-creation';
import QuotesManagement from './pages/quotes-management';
import InvoicesManagement from './pages/invoices-management';
import ExpenseInvoicesManagement from './pages/expense-invoices';

import ClientManagement from './pages/client-management';
import FollowUpManagement from './pages/follow-up-management/index';
import InvoicesFollowUp from './pages/invoices-follow-up';
import AnalyticsDashboard from './pages/analytics-dashboard';
import PeppolNetworkPage from './pages/services/peppol/index';
import AssuranceCreditPage from './pages/services/assurance';
import RecouvrementPage from './pages/services/recouvrement';
import LeadsManagementPage from './pages/leads-management';
import StatisticsPage from './pages/statistics';
import MultiUserProfilesPage from './pages/multi-user-profiles';
import NotFound from './pages/NotFound';
import StripeSuccessPage from './pages/stripe-success';
import PublicQuoteShareViewer from './pages/quote-share';

// Super Admin imports
import SuperAdminDashboard from './pages/admin/super/dashboard';
import SuperAdminUsers from './pages/admin/super/users';

const AppRoutes = () => {
  return (
    <>
      <ScrollToTop />
      <GlobalProfile />
      <Routes>
          {/* Public pages - redirect authenticated users to dashboard */}
          <Route path="/quote-share/:token" element={<PublicQuoteShareViewer />} />
          <Route path="/" element={
            <PublicRoute>
              <HomePage />
            </PublicRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          } />
          <Route path="/reset-password" element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          } />
          <Route path="/pricing" element={
            <PublicRoute>
              <PricingPage />
            </PublicRoute>
          } />
          <Route path="/find-artisan" element={
            <PublicRoute>
              <FindArtisanPage />
            </PublicRoute>
          } />
          <Route path="/about" element={
            <PublicRoute>
              <AboutPage />
            </PublicRoute>
          } />
          <Route path="/contact" element={
            <PublicRoute>
              <ContactPage />
            </PublicRoute>
          } />
          <Route path="/features" element={
            <PublicRoute>
              <FeaturesPage />
            </PublicRoute>
          } />
          <Route path="/terms" element={
            <PublicRoute>
              <TermsPage />
            </PublicRoute>
          } />
          <Route path="/privacy" element={
            <PublicRoute>
              <PrivacyPage />
            </PublicRoute>
          } />
          <Route path="/cookies" element={
            <PublicRoute>
              <CookiesPage />
            </PublicRoute>
          } />
          <Route path="/blog" element={
            <PublicRoute>
              <BlogPage />
            </PublicRoute>
          } />
          <Route path="/stripe-success" element={<StripeSuccessPage />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/quote-creation" element={
            <ProtectedRoute>
              <QuoteCreation />
            </ProtectedRoute>
          } />
          <Route path="/quotes-management" element={
            <ProtectedRoute>
              <QuotesManagement />
            </ProtectedRoute>
          } />
          <Route path="/invoices-management" element={
            <ProtectedRoute>
              <InvoicesManagement />
            </ProtectedRoute>
          } />
          <Route path="/expense-invoices" element={
            <ProtectedRoute>
              <ExpenseInvoicesManagement />
            </ProtectedRoute>
          } />
          <Route path="/client-management" element={
            <ProtectedRoute>
              <ClientManagement />
            </ProtectedRoute>
          } />
          <Route path="/quotes-follow-up" element={
            <ProtectedRoute>
              <FollowUpManagement />
            </ProtectedRoute>
          } />
          <Route path="/invoices-follow-up" element={
            <ProtectedRoute>
              <InvoicesFollowUp />
            </ProtectedRoute>
          } />
          <Route path="/analytics-dashboard" element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          } />
          <Route path="/services/peppol" element={
            <ProtectedRoute>
              <PeppolNetworkPage />
            </ProtectedRoute>
          } />
          <Route path="/services/assurance" element={
            <ProtectedRoute>
              <AssuranceCreditPage />
            </ProtectedRoute>
          } />
          <Route path="/services/recouvrement" element={
            <ProtectedRoute>
              <RecouvrementPage />
            </ProtectedRoute>
          } />
          <Route path="/leads-management" element={
            <ProtectedRoute>
              <LeadsManagementPage />
            </ProtectedRoute>
          } />
          <Route path="/statistics" element={
            <ProtectedRoute>
              <StatisticsPage />
            </ProtectedRoute>
          } />
          <Route path="/multi-user-profiles" element={
            <ProtectedRoute>
              <MultiUserProfilesPage />
            </ProtectedRoute>
          } />

          {/* Super Admin Routes */}
                  <Route path="/admin/super/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/admin/super/users" element={<SuperAdminUsers />} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
    </>
  );
};

export default AppRoutes;