import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./hooks/use-auth";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import "./index.css";

// This is a minimal application for testing the auth system
function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={() => <div className="p-10 text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to InvoiceHub</h1>
          <p className="mb-4">Please <a href="/auth" className="text-primary underline">log in</a> to access the application.</p>
        </div>} />
        <Route path="/auth" component={AuthPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
