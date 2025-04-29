import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { EyeIcon, PencilIcon, TrashIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon, DownloadIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate as formatDateUtil, formatInvoiceTotal } from "@/lib/utils/formatting";

export default function InvoicesPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  // Use the imported formatDateUtil function

  // We now use the imported formatCurrency and formatInvoiceTotal functions

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Overdue</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter and search invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch =
      !searchQuery ||
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Paginate invoices
  const paginatedInvoices = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  // Fetch single invoice with items
  const fetchInvoiceDetails = async (id: number) => {
    try {
      const response = await fetch(`/api/invoices/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoice details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      throw error;
    }
  };

  // Function to view an invoice detail
  const handleViewInvoice = async (id: number) => {
    try {
      const invoiceData = await fetchInvoiceDetails(id);
      
      // Create a new window to display the invoice
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Unable to open a new window. Please check your popup blocker settings.",
          variant: "destructive",
        });
        return;
      }
      
      // Fetch company and customer data for the PDF
      const companyResponse = await fetch('/api/company');
      const company = await companyResponse.json();
      
      const customerResponse = await fetch(`/api/customers/${invoiceData.invoice.customerId}`);
      const customer = await customerResponse.json();
      
      // Create the complete data needed for rendering
      const completeData = {
        invoice: invoiceData.invoice,
        items: invoiceData.items,
        company,
        customer
      };
      
      // Create HTML content for the invoice
      const invoiceHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invoice #${completeData.invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
            .invoice-container { max-width: 800px; margin: 0 auto; border: 1px solid #eee; padding: 30px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .invoice-title { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 5px; }
            .invoice-number { color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .flex-between { display: flex; justify-content: space-between; }
            .company-info, .customer-info { width: 48%; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f9fafb; text-align: left; padding: 10px; }
            td { padding: 10px; border-bottom: 1px solid #eee; }
            .summary { margin-left: auto; width: 250px; margin-top: 30px; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .summary-title { font-weight: bold; }
            .total-row { font-weight: bold; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; }
            .notes { margin-top: 30px; background-color: #f9fafb; padding: 15px; border-radius: 4px; }
            .print-button { display: block; margin: 20px auto; padding: 10px 20px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="header">
              <div>
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#${completeData.invoice.invoiceNumber}</div>
              </div>
              <div>
                ${completeData.company.logoUrl ? `<img src="${completeData.company.logoUrl}" alt="Company Logo" style="max-height: 80px; max-width: 200px;">` : ''}
              </div>
            </div>
            
            <div class="flex-between section">
              <div class="company-info">
                <div class="section-title">From</div>
                <div>${completeData.company.name}</div>
                <div>${completeData.company.address}</div>
                <div>${completeData.company.city}, ${completeData.company.state} ${completeData.company.zipCode}</div>
                <div>GSTIN: ${completeData.company.gstin || 'N/A'}</div>
                <div>Phone: ${completeData.company.phone || 'N/A'}</div>
                <div>Email: ${completeData.company.email || 'N/A'}</div>
              </div>
              
              <div class="customer-info">
                <div class="section-title">Bill To</div>
                <div>${completeData.customer.name}</div>
                <div>${completeData.customer.billingAddress}</div>
                <div>${completeData.customer.billingCity}, ${completeData.customer.billingState} ${completeData.customer.billingZipCode}</div>
                <div>GSTIN: ${completeData.customer.gstin || 'N/A'}</div>
                <div>Phone: ${completeData.customer.phone || 'N/A'}</div>
                <div>Email: ${completeData.customer.email || 'N/A'}</div>
              </div>
            </div>
            
            <div class="flex-between section">
              <div>
                <div class="section-title">Invoice Details</div>
                <div><strong>Issue Date:</strong> ${new Date(completeData.invoice.invoiceDate).toLocaleDateString('en-IN')}</div>
                <div><strong>Due Date:</strong> ${completeData.invoice.dueDate ? new Date(completeData.invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}</div>
                <div><strong>Status:</strong> ${completeData.invoice.status.toUpperCase()}</div>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Invoice Items</div>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>HSN Code</th>
                    <th>Quantity</th>
                    <th>Rate</th>
                    <th>GST Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${completeData.items.map((item: any) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.hsnCode}</td>
                      <td>${parseFloat(String(item.quantity)).toLocaleString('en-IN')} ${item.unit || 'Piece'}</td>
                      <td>₹${parseFloat(String(item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>${item.gstRate}%</td>
                      <td>₹${parseFloat(String(item.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="summary">
                <div class="summary-row">
                  <div class="summary-title">Subtotal:</div>
                  <div>₹${parseFloat(completeData.invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                ${parseFloat(completeData.invoice.cgst) > 0 ? `
                <div class="summary-row">
                  <div class="summary-title">CGST:</div>
                  <div>₹${parseFloat(completeData.invoice.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                ` : ''}
                ${parseFloat(completeData.invoice.sgst) > 0 ? `
                <div class="summary-row">
                  <div class="summary-title">SGST:</div>
                  <div>₹${parseFloat(completeData.invoice.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                ` : ''}
                ${parseFloat(completeData.invoice.igst) > 0 ? `
                <div class="summary-row">
                  <div class="summary-title">IGST:</div>
                  <div>₹${parseFloat(completeData.invoice.igst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
                ` : ''}
                <div class="summary-row total-row">
                  <div class="summary-title">Total:</div>
                  <div>₹${parseFloat(completeData.invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>
            </div>
            
            <div class="notes">
              <div class="section-title">Notes</div>
              <div>${completeData.invoice.notes || 'No additional notes.'}</div>
            </div>
            
            <div class="notes">
              <div class="section-title">Terms & Conditions</div>
              <div>${completeData.invoice.termsAndConditions ? completeData.invoice.termsAndConditions.replace(/\n/g, '<br>') : 'No terms specified.'}</div>
            </div>
            
            <button class="print-button" onclick="window.print(); return false;">Print Invoice</button>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      
      toast({
        title: "Invoice Opened",
        description: "Invoice opened in a new tab. Click the print button to print or save as PDF.",
      });
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to edit an invoice
  const handleEditInvoice = (id: number) => {
    // Navigate to edit invoice page with the invoice id
    setLocation(`/invoices/edit/${id}`);
    toast({
      title: "Edit Invoice",
      description: "Navigating to edit page...",
    });
  };
  
  // Function to download an invoice as PDF
  const handleDownloadInvoice = async (id: number) => {
    toast({
      title: "Preparing Download",
      description: "Generating PDF...",
    });

    try {
      // First get the invoice details
      const invoiceData = await fetchInvoiceDetails(id);
      
      // Fetch company and customer data for the PDF
      const companyResponse = await fetch('/api/company');
      const company = await companyResponse.json();
      
      const customerResponse = await fetch(`/api/customers/${invoiceData.invoice.customerId}`);
      const customer = await customerResponse.json();
      
      // Set up the complete data needed for PDF generation
      const completeData = {
        invoice: invoiceData.invoice,
        items: invoiceData.items,
        company,
        customer
      };
      
      // Now use an async import to load the PDF generation libraries only when needed
      const { jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      
      // Create a temporary div to render the invoice
      const tempDiv = document.createElement('div');
      tempDiv.style.width = '800px';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div>
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">INVOICE</div>
              <div style="color: #666;">#${completeData.invoice.invoiceNumber}</div>
            </div>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
            <div style="width: 48%;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">From</div>
              <div>${completeData.company.name}</div>
              <div>${completeData.company.address || ''}</div>
              <div>${completeData.company.city || ''}, ${completeData.company.state || ''} ${completeData.company.pincode || ''}</div>
              <div>GSTIN: ${completeData.company.gstin || 'N/A'}</div>
              <div>Phone: ${completeData.company.phone || 'N/A'}</div>
              <div>Email: ${completeData.company.email || 'N/A'}</div>
            </div>
            
            <div style="width: 48%;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Bill To</div>
              <div>${completeData.customer.name}</div>
              <div>${completeData.customer.billingAddress || ''}</div>
              <div>${completeData.customer.billingCity || ''}, ${completeData.customer.billingState || ''} ${completeData.customer.billingPincode || ''}</div>
              <div>GSTIN: ${completeData.customer.gstin || 'N/A'}</div>
              <div>Phone: ${completeData.customer.phone || 'N/A'}</div>
              <div>Email: ${completeData.customer.email || 'N/A'}</div>
            </div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Invoice Details</div>
            <div><strong>Issue Date:</strong> ${new Date(completeData.invoice.invoiceDate).toLocaleDateString('en-IN')}</div>
            <div><strong>Due Date:</strong> ${completeData.invoice.dueDate ? new Date(completeData.invoice.dueDate).toLocaleDateString('en-IN') : 'N/A'}</div>
            <div><strong>Status:</strong> ${completeData.invoice.status.toUpperCase()}</div>
          </div>
          
          <div style="margin-bottom: 30px;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Invoice Items</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <thead>
                <tr>
                  <th style="background-color: #f9fafb; text-align: left; padding: 10px;">Description</th>
                  <th style="background-color: #f9fafb; text-align: left; padding: 10px;">HSN</th>
                  <th style="background-color: #f9fafb; text-align: left; padding: 10px;">Qty</th>
                  <th style="background-color: #f9fafb; text-align: left; padding: 10px;">Rate</th>
                  <th style="background-color: #f9fafb; text-align: left; padding: 10px;">GST</th>
                  <th style="background-color: #f9fafb; text-align: left; padding: 10px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${completeData.items.map((item: any) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.hsnCode}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${parseFloat(String(item.quantity)).toLocaleString('en-IN')} ${item.unit || 'Piece'}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${parseFloat(String(item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.gstRate}%</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${parseFloat(String(item.amount)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div style="margin-left: auto; width: 250px; margin-top: 30px;">
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <div style="font-weight: bold;">Subtotal:</div>
              <div>₹${parseFloat(completeData.invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            ${parseFloat(completeData.invoice.cgst) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <div style="font-weight: bold;">CGST:</div>
              <div>₹${parseFloat(completeData.invoice.cgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            ` : ''}
            ${parseFloat(completeData.invoice.sgst) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <div style="font-weight: bold;">SGST:</div>
              <div>₹${parseFloat(completeData.invoice.sgst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            ` : ''}
            ${parseFloat(completeData.invoice.igst) > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 5px 0;">
              <div style="font-weight: bold;">IGST:</div>
              <div>₹${parseFloat(completeData.invoice.igst).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding: 5px 0; font-weight: bold; border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px;">
              <div>Total:</div>
              <div>₹${parseFloat(completeData.invoice.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          
          <div style="margin-top: 30px; background-color: #f9fafb; padding: 15px; border-radius: 4px;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Notes</div>
            <div>${completeData.invoice.notes || 'No additional notes.'}</div>
          </div>
          
          <div style="margin-top: 30px; background-color: #f9fafb; padding: 15px; border-radius: 4px;">
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Terms & Conditions</div>
            <div>${completeData.invoice.termsAndConditions ? completeData.invoice.termsAndConditions.replace(/\n/g, '<br>') : 'No terms specified.'}</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      try {
        // Convert the HTML to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // Higher scale for better quality
          useCORS: true,
          logging: false
        });
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add new pages if the content doesn't fit on one page
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Save the PDF
        pdf.save(`Invoice-${completeData.invoice.invoiceNumber}.pdf`);
        
        toast({
          title: "Success",
          description: "Invoice PDF has been downloaded.",
        });
      } finally {
        // Clean up
        document.body.removeChild(tempDiv);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete invoice');
        } catch (e) {
          throw new Error('Failed to delete invoice');
        }
      }
      
      // For 204 No Content responses, just return an empty object
      if (response.status === 204) {
        return {};
      }
      
      try {
        return await response.json();
      } catch (e) {
        // If there's no JSON response but the request was successful, return an empty object
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Invoice Deleted",
        description: "The invoice has been successfully deleted.",
      });
      setInvoiceToDelete(null);
      
      // Invalidate the invoices query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Function to delete an invoice
  const handleDeleteInvoice = async () => {
    if (invoiceToDelete !== null) {
      deleteMutation.mutate(invoiceToDelete);
    }
  };

  return (
    <>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header title="Invoices" />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
                <Link href="/invoices/new">
                  <Button className="mt-4 md:mt-0">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New Invoice
                  </Button>
                </Link>
              </div>

              <Card className="mb-6 shadow-sm">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search invoices..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="icon">
                        <FilterIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issue Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading
                          ? Array(5)
                              .fill(0)
                              .map((_, index) => (
                                <tr key={index}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-5 w-24" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-5 w-32" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-5 w-24" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-5 w-24" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-5 w-20" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <Skeleton className="h-8 w-24 ml-auto" />
                                  </td>
                                </tr>
                              ))
                          : paginatedInvoices.length > 0 ? (
                              paginatedInvoices.map((invoice: any) => (
                                <tr key={invoice.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {invoice.invoiceNumber}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {invoice.customerName}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {formatDateUtil(invoice.invoiceDate)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {invoice.dueDate ? formatDateUtil(invoice.dueDate) : "-"}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                    {formatInvoiceTotal(invoice)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {getStatusBadge(invoice.status)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleViewInvoice(invoice.id)}
                                      title="View"
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleEditInvoice(invoice.id)}
                                      title="Edit"
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0"
                                      onClick={() => handleDownloadInvoice(invoice.id)}
                                      title="Download"
                                    >
                                      <DownloadIcon className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                      onClick={() => setInvoiceToDelete(invoice.id)}
                                      title="Delete"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                  {searchQuery || statusFilter !== "all" ? (
                                    <div>
                                      <p className="text-lg font-medium">No matching invoices</p>
                                      <p className="mt-1">Try adjusting your search or filter to find what you're looking for.</p>
                                      <Button
                                        variant="link"
                                        className="mt-2"
                                        onClick={() => {
                                          setSearchQuery("");
                                          setStatusFilter("all");
                                        }}
                                      >
                                        Clear filters
                                      </Button>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-lg font-medium">No invoices yet</p>
                                      <p className="mt-1">Create your first invoice to get started.</p>
                                      <Link href="/invoices/new">
                                        <Button className="mt-4">Create Invoice</Button>
                                      </Link>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 0 && (
                    <div className="px-5 py-3 border-t flex items-center justify-between">
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
                        <span className="font-medium">
                          {Math.min(page * pageSize, filteredInvoices.length)}
                        </span>{" "}
                        of <span className="font-medium">{filteredInvoices.length}</span> invoices
                      </p>
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="h-8 w-8"
                        >
                          <ChevronLeftIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={page === totalPages ? "outline" : "default"}
                          size="icon"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="ml-2 h-8 w-8"
                        >
                          <ChevronRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Delete Invoice Dialog */}
      <AlertDialog open={invoiceToDelete !== null} onOpenChange={() => setInvoiceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice
              and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleDeleteInvoice}
            >
              {deleteMutation.isPending ? (
                <>
                  <span className="mr-2">Deleting</span>
                  <span className="animate-spin">⚪</span>
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Plus icon component
function PlusIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}