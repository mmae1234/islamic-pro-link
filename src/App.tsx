import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import IOSSafeguard from "@/components/IOSSafeguard";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Search from "./pages/Search";
import About from "./pages/About";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Mentorship from "./pages/Mentorship";
import Messages from "./pages/Messages";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Donations from "./pages/Donations";
import News from "./pages/News";
import Organizations from "./pages/Organizations";
import Careers from "./pages/Careers";
import Scholarships from "./pages/Scholarships";
import EditProfile from "./pages/EditProfile";
import Signup from "./pages/Signup";
import ProfessionalDashboard from "./pages/ProfessionalDashboard";
import BusinessDashboard from "./pages/BusinessDashboard";
import BusinessProfile from "./pages/BusinessProfile";
import Businesses from "./pages/Businesses";
import AutoDashboard from "./pages/AutoDashboard";
import AdminReleaseNotes from "./pages/AdminReleaseNotes";

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

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <IOSSafeguard>
            <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<Search />} />
              <Route path="/businesses" element={<Businesses />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AutoDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/professional" element={
                <ProtectedRoute>
                  <ProfessionalDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/business" element={
                <ProtectedRoute>
                  <BusinessDashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/business/:id" element={<BusinessProfile />} />
              <Route path="/edit-profile" element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              } />
              <Route path="/mentorship" element={
                <ProtectedRoute>
                  <Mentorship />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } />
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/help" element={<Help />} />
              <Route path="/donations" element={<Donations />} />
              <Route path="/news" element={<News />} />
              <Route path="/organizations" element={<Organizations />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/admin/release-notes" element={
                <ProtectedRoute>
                  <AdminReleaseNotes />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </IOSSafeguard>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
