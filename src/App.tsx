import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy-load pages to reduce initial JS evaluation (helps iOS Safari/WebKit stability)
const Index = React.lazy(() => import("./pages/Index"));
const Search = React.lazy(() => import("./pages/Search"));
const About = React.lazy(() => import("./pages/About"));
const Login = React.lazy(() => import("./pages/Login"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Mentorship = React.lazy(() => import("./pages/Mentorship"));
const Messages = React.lazy(() => import("./pages/Messages"));
const Favorites = React.lazy(() => import("./pages/Favorites"));
const Settings = React.lazy(() => import("./pages/Settings"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Privacy = React.lazy(() => import("./pages/Privacy"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Help = React.lazy(() => import("./pages/Help"));
const Feedback = React.lazy(() => import("./pages/Feedback"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const Donations = React.lazy(() => import("./pages/Donations"));
const News = React.lazy(() => import("./pages/News"));
const Organizations = React.lazy(() => import("./pages/Organizations"));
const Careers = React.lazy(() => import("./pages/Careers"));
const Scholarships = React.lazy(() => import("./pages/Scholarships"));
const EditProfile = React.lazy(() => import("./pages/EditProfile"));
const EditBusinessProfile = React.lazy(() => import("./pages/EditBusinessProfile"));
const Signup = React.lazy(() => import("./pages/Signup"));
const ProfessionalDashboard = React.lazy(() => import("./pages/ProfessionalDashboard"));
const BusinessDashboard = React.lazy(() => import("./pages/BusinessDashboard"));
const BusinessProfile = React.lazy(() => import("./pages/BusinessProfile"));
const Businesses = React.lazy(() => import("./pages/Businesses"));
const AutoDashboard = React.lazy(() => import("./pages/AutoDashboard"));
const AdminReleaseNotes = React.lazy(() => import("./pages/AdminReleaseNotes"));
const AdminReports = React.lazy(() => import("./pages/AdminReports"));
const Diag = React.lazy(() => import("./pages/Diag"));
const AuthGate = React.lazy(() => import("./pages/AuthGate"));

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
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </GlobalErrorBoundary>
    </div>
  );
};

export default App;
