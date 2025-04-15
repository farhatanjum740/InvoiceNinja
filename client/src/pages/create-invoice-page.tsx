import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoicePdf } from "@/components/invoice/invoice-pdf";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function CreateInvoicePage() {
  const [activeTab, setActiveTab] = useState("edit");
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Check if company exists before allowing invoice creation
  const { data: company, isLoading: isLoadingCompany } = useQuery({
    queryKey: ["/api/company"],
  });

  // Fetch customers for the form
  const { data: customers, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Fetch products for the form
  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["/api/products"],
  });

  // Function to handle invoice data update for preview
  const handleInvoiceDataChange = (data: any) => {
    setInvoiceData(data);
    setIsPreviewReady(true);
  };

  // Function to handle successful invoice creation
  const handleInvoiceSuccess = () => {
    toast({
      title: "Invoice created",
      description: "Your invoice has been created successfully.",
    });
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
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="edit">Edit Invoice</TabsTrigger>
                  <TabsTrigger value="preview" disabled={!isPreviewReady}>
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="edit">
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
                </TabsContent>

                <TabsContent value="preview">
                  <Card>
                    <CardHeader>
                      <CardTitle>Invoice Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {invoiceData ? (
                        <InvoicePdf invoice={invoiceData} />
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          Complete the invoice form to see a preview
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
