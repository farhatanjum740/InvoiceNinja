import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import InvoicesPage from "@/pages/invoices-page";
import CustomersPage from "@/pages/customers-page";
import ProductsPage from "@/pages/products-page";
import ReportsPage from "@/pages/reports-page";
import CompanyPage from "@/pages/company-page";
import CreateInvoicePage from "@/pages/create-invoice-page";
import { ProtectedRoute } from "./lib/protected-route";
import { Providers } from "./providers";
import "./index.css";

// Application with all routes
function App() {
  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={DashboardPage} />
        <ProtectedRoute path="/invoices" component={InvoicesPage} />
        <ProtectedRoute path="/invoices/create" component={CreateInvoicePage} />
        <ProtectedRoute path="/invoices/new" component={CreateInvoicePage} />
        <ProtectedRoute path="/customers" component={CustomersPage} />
        <ProtectedRoute path="/products" component={ProductsPage} />
        <ProtectedRoute path="/reports" component={ReportsPage} />
        <ProtectedRoute path="/company" component={CompanyPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <Providers>
    <App />
  </Providers>
);
