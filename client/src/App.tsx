import { Toaster } from "@/components/ui/toaster";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Pages
import LandingPage from "@/pages/landing-page";
import DashboardPage from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import InvoicesPage from "@/pages/invoices-page";
import CreateInvoicePage from "@/pages/create-invoice-page";
import CustomersPage from "@/pages/customers-page";
import ProductsPage from "@/pages/products-page";
import CompanyPage from "@/pages/company-page";
import ReportsPage from "@/pages/reports-page";
import StorageTestPage from "@/pages/storage-test-page";
import SupabaseTestPage from "@/pages/supabase-test-page";
import SupabaseTestPageFixed from "@/pages/supabase-test-page-fixed";
import SupabaseTestPageOriginalFixed from "@/pages/supabase-test-page-original-fixed";
import TestPage from "@/pages/test-page";

// Auth Provider
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// For Google AdSense
import { Helmet } from "react-helmet";

// Component to handle dashboard redirect if authenticated
function AuthedRedirect() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);
  
  return null;
}

// Public route that doesn't redirect when authenticated
function PublicRoute({ path, component: Component }: { path: string, component: () => React.JSX.Element }) {
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}

function AppRoutes() {
  return (
    <Switch>
      {/* Home page - always accessible */}
      <PublicRoute path="/" component={LandingPage} />
      
      {/* Auth page - accessible to everyone, but redirects logged-in users to dashboard */}
      <Route path="/auth">
        <AuthPage />
        <AuthedRedirect />
      </Route>

      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/invoices/create" component={CreateInvoicePage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/company" component={CompanyPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/storage-test" component={StorageTestPage} />
      <ProtectedRoute path="/supabase-test" component={SupabaseTestPage} />
      <PublicRoute path="/supabase-test-fixed" component={SupabaseTestPageFixed} />
      <PublicRoute path="/supabase-test-original-fixed" component={SupabaseTestPageOriginalFixed} />
      
      {/* Public test route */}
      <PublicRoute path="/test" component={TestPage} />
      
      {/* Fallback 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app-container">
          <Helmet>
            {/* Google AdSense script - add your publisher ID when ready */}
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossOrigin="anonymous"></script>
          </Helmet>
          <AppRoutes />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
