import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import LazyRouteErrorBoundary from "@/components/LazyRouteErrorBoundary";

// Helper function to create lazy imports with retry logic
const lazyWithRetry = (importFn: () => Promise<any>, retries = 3) => {
  return React.lazy(() => {
    const tryImport = async (attempt: number): Promise<any> => {
      try {
        return await importFn();
      } catch (error) {
        if (attempt < retries) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500 * attempt));
          return tryImport(attempt + 1);
        }
        throw error;
      }
    };
    return tryImport(1);
  });
};

// Lazy-load pages with retry logic to handle transient network issues
const Index = lazyWithRetry(() => import("./pages/Index"));
const Search = lazyWithRetry(() => import("./pages/Search"));
const About = lazyWithRetry(() => import("./pages/About"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Mentorship = lazyWithRetry(() => import("./pages/Mentorship"));
const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Favorites = lazyWithRetry(() => import("./pages/Favorites"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const Contact = lazyWithRetry(() => import("./pages/Contact"));
const Privacy = lazyWithRetry(() => import("./pages/Privacy"));
const Terms = lazyWithRetry(() => import("./pages/Terms"));
const Help = lazyWithRetry(() => import("./pages/Help"));
const Feedback = lazyWithRetry(() => import("./pages/Feedback"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Donations = lazyWithRetry(() => import("./pages/Donations"));
const News = lazyWithRetry(() => import("./pages/News"));
const Organizations = lazyWithRetry(() => import("./pages/Organizations"));
const Careers = lazyWithRetry(() => import("./pages/Careers"));
const Scholarships = lazyWithRetry(() => import("./pages/Scholarships"));
const EditProfile = lazyWithRetry(() => import("./pages/EditProfile"));
const EditBusinessProfile = lazyWithRetry(() => import("./pages/EditBusinessProfile"));
const Signup = lazyWithRetry(() => import("./pages/Signup"));
const ProfessionalDashboard = lazyWithRetry(() => import("./pages/ProfessionalDashboard"));
const BusinessDashboard = lazyWithRetry(() => import("./pages/BusinessDashboard"));
const BusinessProfile = lazyWithRetry(() => import("./pages/BusinessProfile"));
const Businesses = lazyWithRetry(() => import("./pages/Businesses"));
const AutoDashboard = lazyWithRetry(() => import("./pages/AutoDashboard"));
const AdminReleaseNotes = lazyWithRetry(() => import("./pages/AdminReleaseNotes"));
const AdminReports = lazyWithRetry(() => import("./pages/AdminReports"));
const Diag = lazyWithRetry(() => import("./pages/Diag"));
const AuthGate = lazyWithRetry(() => import("./pages/AuthGate"));

const AppLoading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center p-6">
    <div className="text-center">
      <div className="text-base font-semibold text-foreground">Loading…</div>
      <div className="text-sm text-muted-foreground mt-1">Starting the app</div>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on iOS auth errors
        if (error?.message?.includes('permission') || error?.message?.includes('unauthorized')) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

const App = () => {
  return (
    <div data-app-ready="true">
      <GlobalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <LazyRouteErrorBoundary>
                  <Suspense fallback={<AppLoading />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/businesses" element={<Businesses />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <AutoDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/professional"
                      element={
                        <ProtectedRoute>
                          <ProfessionalDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/business"
                      element={
                        <ProtectedRoute>
                          <BusinessDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/business/:id" element={<BusinessProfile />} />
                    <Route
                      path="/edit-profile"
                      element={
                        <ProtectedRoute>
                          <EditProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/edit-business-profile"
                      element={
                        <ProtectedRoute>
                          <EditBusinessProfile />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/mentorship" element={<Mentorship />} />
                    <Route
                      path="/messages"
                      element={
                        <ProtectedRoute>
                          <Messages />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/favorites"
                      element={
                        <ProtectedRoute>
                          <Favorites />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/donations" element={<Donations />} />
                    <Route path="/news" element={<News />} />
                    <Route path="/organizations" element={<Organizations />} />
                    <Route path="/careers" element={<Careers />} />
                    <Route path="/scholarships" element={<Scholarships />} />
                    <Route
                      path="/admin/release-notes"
                      element={
                        <ProtectedRoute>
                          <AdminReleaseNotes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admin/reports"
                      element={
                        <ProtectedRoute>
                          <AdminReports />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/auth-gate" element={<AuthGate />} />
                    <Route path="/diag" element={<Diag />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </LazyRouteErrorBoundary>
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </div>
  );
};

export default App;
