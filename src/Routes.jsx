import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
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

const AppRoutes = () => {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/find-artisan" element={<FindArtisanPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPage />} />
          
          {/* Protected pages */}
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
          
          <Route path="/supplier-invoices" element={
            <ProtectedRoute>
              <SupplierInvoicesManagement />
            </ProtectedRoute>
          } />
          

          <Route path="/client-management" element={
            <ProtectedRoute>
              <ClientManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/follow-up-management" element={
            <ProtectedRoute>
              <FollowUpManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/analytics-dashboard" element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          } />
          
          {/* Service pages */}
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
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppRoutes;