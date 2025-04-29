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
      
      // Use moderate scale for reasonable file size (reduced from 2 to 1.5)
      const canvas = await html2canvas(invoiceElement, {
        scale: 1.2, 
        logging: false,
        useCORS: true,
        // Use image smoothing for better quality at lower scale
        imageTimeout: 2000,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      
      // Use JPEG format with moderate quality for smaller file size
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      
      // A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true, // Enable compression
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add compression options to reduce file size
      const options = {
        compression: 'FAST', // Use faster compression
        format: 'JPEG', // Use JPEG for image data
        imageQuality: 0.8,  // Lower quality = smaller file
      };
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      
      // Add multiple pages if invoice is long with optimized approach
      if (imgHeight > 297) {
        let heightLeft = imgHeight - 297;
        let position = -297;
        
        while (heightLeft > 0) {
          pdf.addPage();
          position = position - 297;
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
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
      <div className="max-w-4xl mx-auto shadow-lg rounded-lg">
        <div 
          ref={invoiceRef} 
          className="bg-white p-0 overflow-hidden rounded-lg"
          style={{ width: "100%" }}
        >
          <InvoiceTemplateRenderer 
            templateId={invoice.company.templateId || "standard"}
            colorTheme={invoice.company.colorTheme || "blue"}
            invoice={invoice.invoice}
            items={invoice.items}
            company={invoice.company}
            customer={invoice.customer}
          />
        </div>
      </div>
    </div>
  );
}