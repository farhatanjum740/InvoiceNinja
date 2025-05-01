import { useState, useEffect } from "react";
import { isValid, parseISO, format } from "date-fns";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";

export default function EditInvoicePage() {
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id ? parseInt(params.id) : null;

  // Check if company exists before allowing invoice editing
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

  // Fetch the invoice to edit
  const { data: invoiceDetails, isLoading: isLoadingInvoice } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      return response.json();
    },
    enabled: !!invoiceId,
  });

  // Function to handle invoice data update
  const handleInvoiceDataChange = (data: any) => {
    setInvoiceData(data);
  };
  
  // Set invoice data once it's loaded
  useEffect(() => {
    if (invoiceDetails) {
      // Combine invoice and items into a single form data object
      // Convert string date values to Date objects to fix the "Invalid time value" error
      const invoice = invoiceDetails.invoice;
      
      const formData = {
        ...invoice,
        // COMPLETELY REIMPLEMENTED DATE PARSING LOGIC
        invoiceDate: (() => {
          try {
            if (!invoice.invoiceDate) return null;
            
            // Log the original date for debugging
            console.log("ROBUST FIX - Original invoiceDate from API:", invoice.invoiceDate);
            
            // TARGETED APPROACH FOR 18:30 UTC FORMAT
            if (typeof invoice.invoiceDate === 'string' && invoice.invoiceDate.includes('T18:30:00')) {
              console.log("🔧 HARDCODED FIX - Detected 18:30 UTC timestamp");
              
              // Extract just the date part (YYYY-MM-DD) and add one day
              const datePart = invoice.invoiceDate.split('T')[0]; // "2025-05-01"
              
              // Get tomorrow's date (since 18:30 UTC = next day in India)
              const [year, month, day] = datePart.split('-').map(num => parseInt(num));
              
              // Create date with day+1 (next day in India) - months are 0-indexed in JS
              const fixedDate = new Date(year, month-1, day+1, 12, 0, 0);
              
              console.log("🔧 HARDCODED FIX - Created fixed date:", fixedDate, 
                "from parts:", {year, month, day: day+1});
              
              return fixedDate;
            }
            
            // First attempt: Parse as ISO string with date-fns
            if (typeof invoice.invoiceDate === 'string') {
              try {
                // Try to parse as ISO string
                const parsedDate = parseISO(invoice.invoiceDate);
                console.log("Parsed using parseISO:", parsedDate, "Valid?", isValid(parsedDate));
                
                if (isValid(parsedDate)) {
                  return parsedDate;
                }
              } catch (error) {
                console.warn("parseISO failed:", error);
              }
            }
            
            // Second attempt: Use JavaScript Date constructor
            const dateObj = new Date(invoice.invoiceDate);
            console.log("Parsed using Date constructor:", dateObj, "Valid?", !isNaN(dateObj.getTime()));
            
            if (!isNaN(dateObj.getTime())) {
              return dateObj;
            }
            
            // If all parsing attempts fail, return current date
            console.warn("All date parsing attempts failed, using current date");
            return new Date();
          } catch (err) {
            console.error("Error parsing invoice date:", err);
            return new Date(); // Fallback to current date if parsing fails
          }
        })(),
        dueDate: (() => {
          try {
            if (!invoice.dueDate) return null;
            
            // Log the original date for debugging
            console.log("ROBUST FIX - Original dueDate from API:", invoice.dueDate);
            
            // TARGETED APPROACH FOR 18:30 UTC FORMAT
            if (typeof invoice.dueDate === 'string' && invoice.dueDate.includes('T18:30:00')) {
              console.log("🔧 HARDCODED FIX - Detected 18:30 UTC timestamp for dueDate");
              
              // Extract just the date part (YYYY-MM-DD) and add one day
              const datePart = invoice.dueDate.split('T')[0]; // "2025-05-06"
              
              // Get tomorrow's date (since 18:30 UTC = next day in India)
              const [year, month, day] = datePart.split('-').map(num => parseInt(num));
              
              // Create date with day+1 (next day in India) - months are 0-indexed in JS
              const fixedDate = new Date(year, month-1, day+1, 12, 0, 0);
              
              console.log("🔧 HARDCODED FIX - Created fixed dueDate:", fixedDate, 
                "from parts:", {year, month, day: day+1});
              
              return fixedDate;
            }
            
            // First attempt: Parse as ISO string with date-fns
            if (typeof invoice.dueDate === 'string') {
              try {
                // Try to parse as ISO string
                const parsedDate = parseISO(invoice.dueDate);
                console.log("Parsed dueDate using parseISO:", parsedDate, "Valid?", isValid(parsedDate));
                
                if (isValid(parsedDate)) {
                  return parsedDate;
                }
              } catch (error) {
                console.warn("parseISO failed for dueDate:", error);
              }
            }
            
            // Second attempt: Use JavaScript Date constructor
            const dateObj = new Date(invoice.dueDate);
            console.log("Parsed dueDate using Date constructor:", dateObj, "Valid?", !isNaN(dateObj.getTime()));
            
            if (!isNaN(dateObj.getTime())) {
              return dateObj;
            }
            
            // If all parsing attempts fail, return null as due date is optional
            console.warn("All dueDate parsing attempts failed, using null");
            return null;
          } catch (err) {
            console.error("Error parsing due date:", err);
            return null;
          }
        })(),
        items: invoiceDetails.items
      };
      
      setInvoiceData(formData);
    }
  }, [invoiceDetails]);

  // Function to handle successful invoice update
  const handleInvoiceSuccess = () => {
    // Invalidate the invoices cache so the list will refresh
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    
    // Also invalidate dashboard stats as they include invoice counts
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    
    toast({
      title: "Invoice updated",
      description: "Your invoice has been updated successfully.",
    });
    
    // Navigate to invoices page
    navigate("/invoices");
  };

  if (!invoiceId) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header title="Edit Invoice" showCreateInvoiceButton={false} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Invoice</AlertTitle>
                <AlertDescription>
                  No invoice ID provided. Please select an invoice to edit.
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate("/invoices")}>
                Return to Invoices
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Edit Invoice" showCreateInvoiceButton={false} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Edit Invoice #{invoiceDetails?.invoice?.invoiceNumber || invoiceId}</h2>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => navigate("/invoices")}>
                  Cancel
                </Button>
              </div>
            </div>

            {isLoadingInvoice ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading invoice...</span>
              </div>
            ) : !invoiceDetails ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invoice not found</AlertTitle>
                <AlertDescription>
                  The invoice you are trying to edit could not be found.
                </AlertDescription>
              </Alert>
            ) : !isLoadingCompany && !company ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Company information required</AlertTitle>
                <AlertDescription>
                  Please complete your company profile before editing invoices.{" "}
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
                    initialData={invoiceData}
                    isEditing={true}
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