import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import GlobalProfile from './components/ui/GlobalProfile';
import { AuthProvider } from './context/AuthContext';

// Import pages
import HomePage from './pages/home';
import Login from './pages/login';
import Register from './pages/register';
import ForgotPasswordPage from './pages/forgot-password';
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
import SupplierInvoicesManagement from './pages/supplier-invoices';

import ClientManagement from './pages/client-management';
import FollowUpManagement from './pages/follow-up-management';
import AnalyticsDashboard from './pages/analytics-dashboard';
import PeppolNetworkPage from './pages/services/peppol';
import AssuranceCreditPage from './pages/services/assurance';
import RecouvrementPage from './pages/services/recouvrement';
import LeadsManagementPage from './pages/leads-management';
import StatisticsPage from './pages/statistics';
import MultiUserProfilesPage from './pages/multi-user-profiles';
import NotFound from './pages/NotFound';
import StripeSuccessPage from './pages/stripe-success';

const AppRoutes = () => {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public pages - redirect authenticated users to dashboard */}
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
          <Route path="/blog/:slug" element={
            <PublicRoute>
              <BlogPage />
            </PublicRoute>
          } />
          
          {/* Stripe success callback - allow authenticated users */}
          <Route path="/stripe-success" element={<StripeSuccessPage />} />
          
          {/* Protected pages */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <Dashboard />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/quote-creation" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <QuoteCreation />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/quotes-management" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <QuotesManagement />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/invoices-management" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <InvoicesManagement />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/supplier-invoices" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <SupplierInvoicesManagement />
              </>
            </ProtectedRoute>
          } />
          

          <Route path="/client-management" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <ClientManagement />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/follow-up-management" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <FollowUpManagement />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/analytics-dashboard" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <AnalyticsDashboard />
              </>
            </ProtectedRoute>
          } />
          
          {/* Service pages */}
          <Route path="/services/peppol" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <PeppolNetworkPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/services/assurance" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <AssuranceCreditPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/services/recouvrement" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <RecouvrementPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/leads-management" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <LeadsManagementPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/quotes-follow-up" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <FollowUpManagement />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/invoices-follow-up" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <FollowUpManagement />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/peppol-access-point" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <PeppolNetworkPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/statistics" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <StatisticsPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="/multi-user-profiles" element={
            <ProtectedRoute>
              <>
                <GlobalProfile />
                <MultiUserProfilesPage />
              </>
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppRoutes;