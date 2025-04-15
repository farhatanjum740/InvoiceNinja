import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, FileDown, Printer } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { format } from "date-fns";

interface InvoicePdfProps {
  invoice: any;
}

export function InvoicePdf({ invoice }: InvoicePdfProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const { invoice: invoiceData, items, company, customer } = invoice;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy");
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Generate PDF
  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const element = invoiceRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions based on invoice height
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${invoiceData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Print invoice
  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2 print:hidden">
        <Button variant="outline" onClick={printInvoice} disabled={isGenerating}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
        <Button onClick={generatePDF} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>
      
      <Card className="p-8 max-w-4xl mx-auto bg-white" ref={invoiceRef}>
        {/* Invoice Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">INVOICE</h1>
            <p className="text-xl font-semibold text-primary mt-1">#{invoiceData.invoiceNumber}</p>
          </div>
          <div className="text-right">
            {company?.logo && (
              <img src={company.logo} alt={company.name} className="h-12 mb-2" />
            )}
            <h2 className="text-xl font-bold">{company?.name}</h2>
          </div>
        </div>
        
        {/* Company and Customer Info */}
        <div className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">From</h3>
            <div className="space-y-1">
              <p className="font-medium">{company?.name}</p>
              <p>{company?.address}</p>
              <p>{company?.city}, {company?.state} - {company?.pincode}</p>
              {company?.email && <p>Email: {company.email}</p>}
              {company?.phone && <p>Phone: {company.phone}</p>}
              {company?.gstin && <p>GSTIN: {company.gstin}</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Bill To</h3>
            <div className="space-y-1">
              <p className="font-medium">{customer?.name}</p>
              <p>{customer?.billingAddress}</p>
              <p>{customer?.billingCity}, {customer?.billingState} - {customer?.billingPincode}</p>
              {customer?.email && <p>Email: {customer.email}</p>}
              {customer?.phone && <p>Phone: {customer.phone}</p>}
              {customer?.gstin && <p>GSTIN: {customer.gstin}</p>}
            </div>
          </div>
        </div>
        
        {/* Invoice Details */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 text-sm">
          <div>
            <p className="text-gray-500 font-medium">Invoice Date</p>
            <p>{formatDate(invoiceData.invoiceDate)}</p>
          </div>
          {invoiceData.dueDate && (
            <div>
              <p className="text-gray-500 font-medium">Due Date</p>
              <p>{formatDate(invoiceData.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-gray-500 font-medium">Status</p>
            <p className={`uppercase font-medium ${
              invoiceData.status === 'paid' ? 'text-green-600' :
              invoiceData.status === 'overdue' ? 'text-red-600' :
              invoiceData.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
            }`}>
              {invoiceData.status}
            </p>
          </div>
        </div>
        
        {/* Invoice Items */}
        <div className="mt-8">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{item.hsnCode || "-"}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatCurrency(item.rate)}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{item.gstRate}%</td>
                  <td className="px-4 py-4 text-sm text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Invoice Summary */}
        <div className="mt-8 flex justify-end">
          <div className="w-64">
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(invoiceData.subtotal)}</span>
              </div>
              
              {invoiceData.cgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">CGST</span>
                  <span>{formatCurrency(invoiceData.cgst / 2)}</span>
                </div>
              )}
              
              {invoiceData.sgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">SGST</span>
                  <span>{formatCurrency(invoiceData.sgst / 2)}</span>
                </div>
              )}
              
              {invoiceData.igst > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">IGST</span>
                  <span>{formatCurrency(invoiceData.igst)}</span>
                </div>
              )}
              
              <div className="flex justify-between border-t border-gray-200 pt-2 font-medium text-lg">
                <span>Total</span>
                <span>{formatCurrency(invoiceData.total)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notes and Terms */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          {invoiceData.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoiceData.notes}</p>
            </div>
          )}
          
          {invoiceData.termsAndConditions && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Terms & Conditions</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoiceData.termsAndConditions}</p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          {company?.name && (
            <p className="mt-1">This is a computer-generated invoice from {company.name}.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
