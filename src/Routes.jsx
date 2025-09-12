// src/Routes.jsx
import React, { Suspense } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";

// Dynamic imports for better code splitting
const LoginRegistration = React.lazy(() => import("./pages/login-registration"));
const AIFashionGenerationStudio = React.lazy(() => import("./pages/ai-fashion-generation-studio"));
const PrivacyPolicyTermsOfService = React.lazy(() => import("./pages/privacy-policy-terms-of-service"));
const CustomerPortal = React.lazy(() => import("./pages/customer-portal"));
const BillingDashboard = React.lazy(() => import("./pages/billing-dashboard"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Loading component with fashion styling
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-background via-surface/50 to-primary/5 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground font-medium">Loading your fashion experience...</p>
    </div>
  </div>
);

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <RouterRoutes>
            {/* Authentication */}
            <Route path="/" element={<LoginRegistration />} />
            <Route path="/login" element={<LoginRegistration />} />
            
            {/* Main Application - AI Fashion Generation Studio */}
            <Route path="/ai-fashion-generation-studio" element={<AIFashionGenerationStudio />} />
            
            {/* Legal Pages */}
            <Route path="/privacy-policy-terms-of-service" element={<PrivacyPolicyTermsOfService />} />
            
            {/* Customer Portal */}
            <Route path="/customer-portal" element={<CustomerPortal />} />
            
            {/* Business Management */}
            <Route path="/billing-dashboard" element={<BillingDashboard />} />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;