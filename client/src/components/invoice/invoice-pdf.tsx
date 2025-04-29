import { useRef, useState } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Loader2, AlertTriangle } from "lucide-react";
import { InvoiceTemplateRenderer } from "./invoice-template-renderer";

// PDF paper size definitions in mm (width, height)
const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
};

interface InvoicePdfProps {
  invoice: any;
}

export function InvoicePdf({ invoice }: InvoicePdfProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [paperSize, setPaperSize] = useState<keyof typeof PAPER_SIZES>('A4');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState<string>('');
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const generatePDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGenerating(true);
    setErrorMessage(null);
    setProgressStep('Starting PDF generation...');
    
    try {
      const invoiceElement = invoiceRef.current;
      
      // Start progress indicator
      console.log("Generating PDF: Preparing invoice for conversion");
      setProgressStep('Rendering invoice content...');
      
      // Better rendering with higher quality and support for logos
      const canvas = await html2canvas(invoiceElement, {
        scale: 1.5, // Higher scale for better quality
        logging: false,
        useCORS: true,
        imageTimeout: 5000, // Longer timeout for complex invoices
        allowTaint: true,
        backgroundColor: "#ffffff",
        onclone: (document) => {
          // Fix for images not loading in PDF
          Array.from(document.images).forEach(img => {
            img.setAttribute('crossorigin', 'anonymous');
          });
          console.log("Preparing document clone for PDF generation");
        }
      });
      
      // Use JPEG format with moderate quality for smaller file size
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      
      // Get selected paper dimensions
      setProgressStep('Creating PDF document...');
      const selectedPaperSize = PAPER_SIZES[paperSize];
      console.log(`Using ${paperSize} paper size: ${selectedPaperSize.width}mm x ${selectedPaperSize.height}mm`);
      
      // Create PDF with selected paper size
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: paperSize.toLowerCase(),
        compress: true, // Enable compression
      });
      
      // Set image dimensions based on paper width
      const imgWidth = selectedPaperSize.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add compression options to reduce file size
      const options = {
        compression: 'FAST', // Use faster compression
        format: 'JPEG', // Use JPEG for image data
        imageQuality: 0.8,  // Lower quality = smaller file
      };
      
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
      
      // Improved pagination approach for invoices
      // Check if content exceeds single page
      const pageHeight = selectedPaperSize.height;
      const footerHeight = 15; // Height of the footer area in mm
      const headerHeight = 15; // Height of the header area in mm
      const pageWidth = selectedPaperSize.width;
        
      if (imgHeight > pageHeight) {
        // First page is already added above
        // Calculate total number of pages needed
        const totalPages = Math.ceil(imgHeight / pageHeight);
        
        // Add page number to first page (10mm from bottom, 10mm from right edge)
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Page 1 of ${totalPages}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
        
        // Add subsequent pages
        let heightLeft = imgHeight - pageHeight;
        let position = -pageHeight;
        let pageNum = 2;
        
        while (heightLeft > 0) {
          pdf.addPage();
          position = position - pageHeight;
          
          // Add the image with the correct position offset
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
          
          // Add page numbers to each page
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 10, pageHeight - 10, { align: 'right' });
          
          heightLeft -= pageHeight;
          pageNum++;
        }
        
        // Add enhanced headers and footers for continuation pages
        if (totalPages > 1) {
          setProgressStep(`Creating multi-page invoice (${totalPages} pages)...`);
          console.log(`Multi-page invoice detected: ${totalPages} pages`);
          
          // Get invoice and company details for headers
          const invoiceNumber = invoice.invoice?.invoiceNumber || '';
          const companyName = invoice.company?.name || '';
          const customerName = invoice.customer?.name || '';
          
          for (let i = 2; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Header with continued note and invoice number
            pdf.setFillColor(245, 245, 245);
            pdf.rect(0, 0, pageWidth, headerHeight, 'F');
            
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text('(Continued from previous page)', pageWidth / 2, 5, { align: 'center' });
            
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            pdf.text(`${companyName}`, 10, 10);
            pdf.text(`Invoice #${invoiceNumber} - ${customerName}`, pageWidth - 10, 10, { align: 'right' });
            
            // Footer with page numbers
            pdf.setFillColor(245, 245, 245);
            pdf.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');
            
            // Add company info in footer
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`${companyName} - Invoice #${invoiceNumber}`, 10, pageHeight - footerHeight + 5);
          }
        }
      }
      
      // Generate invoice number-based filename
      setProgressStep('Saving PDF...');
      const invoiceNumber = invoice.invoice.invoiceNumber || "invoice";
      const filename = `${invoiceNumber.replace(/[^\w-]/g, "-")}.pdf`;
      
      pdf.save(filename);
      
      setProgressStep('PDF downloaded successfully!');
    } catch (error) {
      console.error("Error generating PDF:", error);
      
      // Set a user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('tainted canvas')) {
          setErrorMessage("Could not generate PDF: The invoice contains images from another domain. Try downloading invoice images first.");
        } else if (error.message.includes('timeout')) {
          setErrorMessage("PDF generation timed out. The invoice may be too complex. Try a smaller paper size.");
        } else {
          setErrorMessage(`Error generating PDF: ${error.message}`);
        }
      } else {
        setErrorMessage("An unexpected error occurred while generating the PDF.");
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  if (!invoice) return null;
  
  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {/* PDF Export Options */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Paper Size:</span>
            <div className="flex rounded-md border overflow-hidden">
              {(Object.keys(PAPER_SIZES) as Array<keyof typeof PAPER_SIZES>).map((size) => (
                <button 
                  key={size}
                  className={`px-3 py-1 text-xs font-medium ${
                    paperSize === size 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-background hover:bg-muted'
                  }`}
                  onClick={() => setPaperSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {paperSize === 'A4' ? 'ISO Standard (210×297 mm)' : 
             paperSize === 'LETTER' ? 'US Letter (8.5×11 in)' :
             'US Legal (8.5×14 in)'}
          </div>
        </div>
        
        <Button 
          onClick={generatePDF} 
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progressStep || 'Generating PDF...'}
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
            templateId={(invoice.company && invoice.company.templateId) ? invoice.company.templateId : "standard"}
            colorTheme={(invoice.company && invoice.company.colorTheme) ? invoice.company.colorTheme : "blue"}
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