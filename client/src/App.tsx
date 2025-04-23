import { Toaster } from "@/components/ui/toaster";
import { Route, Switch } from "wouter";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";

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

// Auth Provider
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// For Google AdSense
import { Helmet } from "react-helmet";

function Router() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // If not logged in and not on the landing or auth page, show landing page
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />

      {/* Protected routes */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/invoices/create" component={CreateInvoicePage} />
      <ProtectedRoute path="/customers" component={CustomersPage} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/company" component={CompanyPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      
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
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
