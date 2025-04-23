import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { InvoiceTemplateRenderer } from "./invoice-template-renderer";

interface InvoicePdfProps {
  invoice: any;
}

export function InvoicePdf({ invoice }: InvoicePdfProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    
    try {
      const invoiceElement = invoiceRef.current;
      
      // Scale up for better quality
      const canvas = await html2canvas(invoiceElement, {
        scale: 2, 
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL("image/png");
      
      // A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      
      // Add multiple pages if invoice is long
      if (imgHeight > 297) {
        let heightLeft = imgHeight - 297;
        let position = -297;
        
        while (heightLeft > 0) {
          pdf.addPage();
          position = position - 297;
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= 297;
        }
      }
      
      // Generate invoice number-based filename
      const invoiceNumber = invoice.invoice.invoiceNumber || "invoice";
      const filename = `${invoiceNumber.replace(/[^\w-]/g, "-")}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!invoice) return null;
  
  return (
    <div className="space-y-6">
      {/* PDF Export Button */}
      <div className="flex justify-end">
        <Button 
          onClick={generatePDF} 
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </Button>
      </div>
      
      {/* Invoice Template for PDF generation */}
      <div 
        ref={invoiceRef} 
        className="bg-white p-0 overflow-hidden"
        style={{ width: "100%" }}
      >
        <InvoiceTemplateRenderer 
          templateId={invoice.invoice.templateId || "standard"}
          colorTheme={invoice.invoice.colorTheme || "blue"}
          invoice={invoice.invoice}
          items={invoice.items}
          company={invoice.company}
          customer={invoice.customer}
        />
      </div>
    </div>
  );
}