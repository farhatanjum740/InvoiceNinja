import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function CreateInvoicePage() {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check if company exists before allowing invoice creation
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["/api/company"],
  });

  // Fetch customers for the form
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch products for the form
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Function to handle invoice data update
  const handleInvoiceDataChange = (data: any) => {
    setInvoiceData(data);
    // Store the form data in localStorage as a backup
    if (data) {
      localStorage.setItem('invoice-draft', JSON.stringify(data));
    }
  };
  
  // Load saved draft if available on initial render
  useEffect(() => {
    const savedDraft = localStorage.getItem('invoice-draft');
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft);
        setInvoiceData(parsedData);
      } catch (e) {
        console.error("Error parsing saved invoice draft:", e);
      }
    }
  }, []);

  // Function to handle successful invoice creation
  const handleInvoiceSuccess = () => {
    // Invalidate the invoices cache so the list will refresh
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    
    // Also invalidate dashboard stats as they include invoice counts
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    
    toast({
      title: "Invoice created",
      description: "Your invoice has been created successfully.",
    });
    
    // Clear the draft after successful creation
    localStorage.removeItem('invoice-draft');
    
    // Navigate to invoices page
    navigate("/invoices");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="New Invoice" showCreateInvoiceButton={false} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Invoice</h2>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate("/invoices")}>
                  Cancel
                </Button>
              </div>
            </div>

            {!isLoadingCompany && !company ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Company information required</AlertTitle>
                <AlertDescription>
                  Please complete your company profile before creating invoices.{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-white underline"
                    onClick={() => navigate("/company")}
                  >
                    Go to Company Settings
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <InvoiceForm
                    company={company}
                    customers={customers}
                    products={products}
                    isLoading={isLoadingCompany || isLoadingCustomers || isLoadingProducts}
                    onDataChange={handleInvoiceDataChange}
                    onSuccess={handleInvoiceSuccess}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
