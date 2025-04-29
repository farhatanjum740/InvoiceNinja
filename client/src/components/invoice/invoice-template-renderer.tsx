import React from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, getInvoiceTotal } from "@/lib/utils/formatting";

interface InvoiceTemplateRendererProps {
  templateId: string;
  colorTheme: string;
  invoice: any;
  items: any[];
  company: any;
  customer: any;
}

export function InvoiceTemplateRenderer({
  templateId = "standard",
  colorTheme = "blue",
  invoice,
  items,
  company,
  customer,
}: InvoiceTemplateRendererProps) {
  if (!invoice || !company || !customer) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 border rounded-md">
        <p className="text-gray-500">Please fill in invoice details to preview</p>
      </div>
    );
  }

  // Default color theme styles
  const colorStyles: Record<string, { bgColor: string; textColor: string; lightBg: string }> = {
    blue: { 
      bgColor: "bg-blue-600", 
      textColor: "text-blue-600",
      lightBg: "bg-blue-50"
    },
    green: { 
      bgColor: "bg-emerald-600", 
      textColor: "text-emerald-600",
      lightBg: "bg-emerald-50"
    },
    purple: { 
      bgColor: "bg-purple-600", 
      textColor: "text-purple-600",
      lightBg: "bg-purple-50"
    },
    orange: { 
      bgColor: "bg-orange-600", 
      textColor: "text-orange-600",
      lightBg: "bg-orange-50"
    },
    red: { 
      bgColor: "bg-red-600", 
      textColor: "text-red-600",
      lightBg: "bg-red-50"
    },
    gray: { 
      bgColor: "bg-gray-600", 
      textColor: "text-gray-600",
      lightBg: "bg-gray-50"
    },
  };

  const selectedColor = colorStyles[colorTheme] || colorStyles.blue;
  
  // Removed local formatDate function as we're now importing it

  // Render template based on templateId
  switch (templateId) {
    case "modern":
      return (
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* Header with colored background */}
          <div className={cn("p-6 text-white", selectedColor.bgColor)}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold">INVOICE</h1>
                <p className="text-white/80 mt-1">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold text-xl">{company.name}</h2>
                <p className="text-white/80 text-sm mt-1">{company.gstin && `GSTIN: ${company.gstin}`}</p>
              </div>
            </div>
          </div>
          
          {/* Customer and invoice details */}
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-gray-500 text-sm mb-2">BILL TO</h3>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-gray-700 text-sm mt-1">{customer.billingAddress}</p>
              <p className="text-gray-700 text-sm">{customer.billingCity}, {customer.billingState}</p>
              <p className="text-gray-700 text-sm">{customer.billingPincode}</p>
              {customer.gstin && <p className="text-gray-700 text-sm mt-2">GSTIN: {customer.gstin}</p>}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Date Issued:</span>
                <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Due Date:</span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Status:</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  invoice.status === "paid" ? "bg-green-100 text-green-800" :
                  invoice.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                  invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                )}>
                  {invoice.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          {/* Line Items */}
          <div className="px-6">
            <table className="w-full">
              <thead>
                <tr className={cn("text-left text-sm", selectedColor.textColor)}>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold">HSN/SAC</th>
                  <th className="pb-3 font-semibold text-right">Qty</th>
                  <th className="pb-3 font-semibold text-right">Rate</th>
                  <th className="pb-3 font-semibold text-right">GST %</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr key={index} className="text-sm">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3">{item.hsnCode || '-'}</td>
                    <td className="py-3 text-right">{item.quantity} {item.unit}</td>
                    <td className="py-3 text-right">{typeof item.rate === 'number' ? 
                      formatCurrency(item.rate) : item.rate}</td>
                    <td className="py-3 text-right">{item.gstRate}%</td>
                    <td className="py-3 text-right font-medium">{typeof item.amount === 'number' ? 
                      formatCurrency(item.amount) : item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary and Totals */}
          <div className="p-6 grid grid-cols-5">
            <div className="col-span-3">
              {invoice.notes && (
                <div className="mt-4">
                  <h3 className="text-gray-500 text-sm mb-1">NOTES</h3>
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </div>
              )}
              {invoice.termsAndConditions && (
                <div className="mt-4">
                  <h3 className="text-gray-500 text-sm mb-1">TERMS & CONDITIONS</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>
            
            <div className="col-span-2">
              <div className={cn("rounded-md overflow-hidden", selectedColor.lightBg)}>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{typeof invoice.subtotal === 'number' ? 
                      formatCurrency(invoice.subtotal) : invoice.subtotal}</span>
                  </div>
                  
                  {parseFloat(invoice.cgst) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGST:</span>
                      <span>{typeof invoice.cgst === 'number' ? 
                        formatCurrency(invoice.cgst) : invoice.cgst}</span>
                    </div>
                  )}
                  
                  {parseFloat(invoice.sgst) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">SGST:</span>
                      <span>{typeof invoice.sgst === 'number' ? 
                        formatCurrency(invoice.sgst) : invoice.sgst}</span>
                    </div>
                  )}
                  
                  {parseFloat(invoice.igst) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IGST:</span>
                      <span>{typeof invoice.igst === 'number' ? 
                        formatCurrency(invoice.igst) : invoice.igst}</span>
                    </div>
                  )}
                </div>
                
                <div className={cn("p-4 text-white flex justify-between items-center", selectedColor.bgColor)}>
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold">{formatCurrency(getInvoiceTotal(invoice))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    
    case "minimal":
      return (
        <div className="bg-white border rounded-lg p-8">
          {/* Simple Header */}
          <div className="flex justify-between items-center border-b pb-6">
            <div>
              <h1 className="text-2xl font-bold">INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold">{company.name}</h2>
              <p className="text-sm text-gray-500">GSTIN: {company.gstin}</p>
            </div>
          </div>
          
          {/* Customer and Invoice Info */}
          <div className="grid grid-cols-2 gap-8 mt-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">BILL TO</p>
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm">{customer.billingAddress}</p>
              <p className="text-sm">{customer.billingCity}, {customer.billingState} - {customer.billingPincode}</p>
              {customer.gstin && <p className="text-sm mt-1">GSTIN: {customer.gstin}</p>}
            </div>
            
            <div className="text-right">
              <div className="space-y-1">
                <div>
                  <span className="text-sm text-gray-500">Date: </span>
                  <span>{formatDate(invoice.invoiceDate)}</span>
                </div>
                {invoice.dueDate && (
                  <div>
                    <span className="text-sm text-gray-500">Due Date: </span>
                    <span>{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Status: </span>
                  <span className={cn(
                    "text-xs font-medium",
                    invoice.status === "paid" ? "text-green-600" :
                    invoice.status === "pending" ? "text-yellow-600" :
                    invoice.status === "overdue" ? "text-red-600" : ""
                  )}>
                    {invoice.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="mt-8">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-2 font-normal">Description</th>
                  <th className="pb-2 font-normal">HSN/SAC</th>
                  <th className="pb-2 font-normal text-right">Qty</th>
                  <th className="pb-2 font-normal text-right">Rate</th>
                  <th className="pb-2 font-normal text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">{item.description}</td>
                    <td className="py-3">{item.hsnCode || '-'}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right">{typeof item.rate === 'number' ? 
                      formatCurrency(item.rate) : item.rate}</td>
                    <td className="py-3 text-right">{typeof item.amount === 'number' ? 
                      formatCurrency(item.amount) : item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>{typeof invoice.subtotal === 'number' ? 
                    formatCurrency(invoice.subtotal) : invoice.subtotal}</span>
                </div>
                
                {parseFloat(invoice.cgst) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">CGST:</span>
                    <span>{typeof invoice.cgst === 'number' ? 
                      formatCurrency(invoice.cgst) : invoice.cgst}</span>
                  </div>
                )}
                
                {parseFloat(invoice.sgst) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">SGST:</span>
                    <span>{typeof invoice.sgst === 'number' ? 
                      formatCurrency(invoice.sgst) : invoice.sgst}</span>
                  </div>
                )}
                
                {parseFloat(invoice.igst) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IGST:</span>
                    <span>{typeof invoice.igst === 'number' ? 
                      formatCurrency(invoice.igst) : invoice.igst}</span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 border-t font-medium">
                  <span className={cn(selectedColor.textColor)}>Total:</span>
                  <span className={cn(selectedColor.textColor)}>
                    {formatCurrency(getInvoiceTotal(invoice))}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes and Terms */}
          <div className="mt-12 text-sm">
            {invoice.notes && (
              <div className="mb-4">
                <p className="text-gray-500 mb-1">Notes:</p>
                <p>{invoice.notes}</p>
              </div>
            )}
            
            {invoice.termsAndConditions && (
              <div>
                <p className="text-gray-500 mb-1">Terms & Conditions:</p>
                <p className="whitespace-pre-line">{invoice.termsAndConditions}</p>
              </div>
            )}
          </div>
        </div>
      );
    
    case "classic":
      return (
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* Classic Header */}
          <div className="border-b">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-serif font-bold">INVOICE</h1>
                <p className="text-gray-600 mt-1">#{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <h2 className="font-bold font-serif">{company.name}</h2>
                <p className="text-sm text-gray-600">{company.address}</p>
                <p className="text-sm text-gray-600">{company.gstin && `GSTIN: ${company.gstin}`}</p>
              </div>
            </div>
          </div>
          
          {/* Information Boxes */}
          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="border p-4 rounded-md">
              <h3 className={cn("font-serif font-semibold mb-2", selectedColor.textColor)}>BILL TO</h3>
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm">{customer.billingAddress}</p>
              <p className="text-sm">{customer.billingCity}, {customer.billingState}</p>
              <p className="text-sm">{customer.billingPincode}</p>
              {customer.gstin && <p className="text-sm mt-2">GSTIN: {customer.gstin}</p>}
            </div>
            
            <div className="border p-4 rounded-md">
              <h3 className={cn("font-serif font-semibold mb-2", selectedColor.textColor)}>INVOICE DETAILS</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-600">Date:</td>
                    <td className="py-1 text-right">{formatDate(invoice.invoiceDate)}</td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td className="py-1 text-gray-600">Due Date:</td>
                      <td className="py-1 text-right">{formatDate(invoice.dueDate)}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-1 text-gray-600">Status:</td>
                    <td className="py-1 text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        invoice.status === "paid" ? "bg-green-100 text-green-800" :
                        invoice.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      )}>
                        {invoice.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Line Items */}
          <div className="px-6 mt-6">
            <table className="w-full border">
              <thead>
                <tr className={cn("text-left font-serif", selectedColor.bgColor, "text-white")}>
                  <th className="p-3 font-semibold">Description</th>
                  <th className="p-3 font-semibold">HSN/SAC</th>
                  <th className="p-3 font-semibold text-right">Qty</th>
                  <th className="p-3 font-semibold text-right">Rate</th>
                  <th className="p-3 font-semibold text-right">GST %</th>
                  <th className="p-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td className="p-3 border-b">{item.description}</td>
                    <td className="p-3 border-b">{item.hsnCode || '-'}</td>
                    <td className="p-3 border-b text-right">{item.quantity}</td>
                    <td className="p-3 border-b text-right">{typeof item.rate === 'number' ? 
                      formatCurrency(item.rate) : item.rate}</td>
                    <td className="p-3 border-b text-right">{item.gstRate}%</td>
                    <td className="p-3 border-b text-right font-medium">{typeof item.amount === 'number' ? 
                      formatCurrency(item.amount) : item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary and Totals */}
          <div className="p-6 mt-4 grid grid-cols-2">
            <div>
              {invoice.notes && (
                <div className="mb-4">
                  <h3 className={cn("font-serif font-semibold mb-1", selectedColor.textColor)}>NOTES</h3>
                  <p className="text-sm">{invoice.notes}</p>
                </div>
              )}
              
              {invoice.termsAndConditions && (
                <div>
                  <h3 className={cn("font-serif font-semibold mb-1", selectedColor.textColor)}>TERMS & CONDITIONS</h3>
                  <p className="text-sm whitespace-pre-line">{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="p-3 text-gray-600">Subtotal:</td>
                    <td className="p-3 text-right">{typeof invoice.subtotal === 'number' ? 
                      formatCurrency(invoice.subtotal) : invoice.subtotal}</td>
                  </tr>
                  
                  {parseFloat(invoice.cgst) > 0 && (
                    <tr className="border-b">
                      <td className="p-3 text-gray-600">CGST:</td>
                      <td className="p-3 text-right">{typeof invoice.cgst === 'number' ? 
                        formatCurrency(invoice.cgst) : invoice.cgst}</td>
                    </tr>
                  )}
                  
                  {parseFloat(invoice.sgst) > 0 && (
                    <tr className="border-b">
                      <td className="p-3 text-gray-600">SGST:</td>
                      <td className="p-3 text-right">{typeof invoice.sgst === 'number' ? 
                        formatCurrency(invoice.sgst) : invoice.sgst}</td>
                    </tr>
                  )}
                  
                  {parseFloat(invoice.igst) > 0 && (
                    <tr className="border-b">
                      <td className="p-3 text-gray-600">IGST:</td>
                      <td className="p-3 text-right">{typeof invoice.igst === 'number' ? 
                        formatCurrency(invoice.igst) : invoice.igst}</td>
                    </tr>
                  )}
                  
                  <tr className={cn(selectedColor.bgColor, "text-white")}>
                    <td className="p-3 font-serif font-semibold">TOTAL:</td>
                    <td className="p-3 text-right font-bold">
                      {formatCurrency(getInvoiceTotal(invoice))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    
    // Default standard template
    default:
      return (
        <div className="bg-white border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 flex justify-between items-center border-b">
            <div>
              <h1 className={cn("text-3xl font-bold", selectedColor.textColor)}>INVOICE</h1>
              <p className="text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="font-bold text-xl">{company.name}</h2>
              <p className="text-sm text-gray-600">{company.address || ''}</p>
              <p className="text-sm text-gray-600">{company.city || ''}, {company.state || ''} {company.pincode || ''}</p>
              {company.gstin && <p className="text-sm text-gray-600">GSTIN: {company.gstin}</p>}
            </div>
          </div>
          
          {/* Customer and Invoice Info */}
          <div className="p-6 grid grid-cols-2 gap-6 border-b">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">BILL TO</h3>
              <p className="font-semibold mt-2">{customer.name || ''}</p>
              <p className="text-gray-600 text-sm">{customer.billingAddress || ''}</p>
              <p className="text-gray-600 text-sm">{customer.billingCity || ''}, {customer.billingState || ''}</p>
              <p className="text-gray-600 text-sm">{customer.billingPincode || ''}</p>
              {customer.gstin && <p className="text-gray-600 text-sm mt-2">GSTIN: {customer.gstin}</p>}
            </div>
            
            <div>
              <h3 className="text-gray-500 text-sm font-medium">INVOICE DETAILS</h3>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Date Issued:</span>
                  <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Due Date:</span>
                    <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    invoice.status === "paid" ? "bg-green-100 text-green-800" :
                    invoice.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    invoice.status === "overdue" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  )}>
                    {invoice.status?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Line Items */}
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="pb-3 font-medium text-gray-600">Description</th>
                  <th className="pb-3 font-medium text-gray-600">HSN/SAC</th>
                  <th className="pb-3 font-medium text-gray-600 text-right">Qty</th>
                  <th className="pb-3 font-medium text-gray-600 text-right">Rate</th>
                  <th className="pb-3 font-medium text-gray-600 text-right">GST %</th>
                  <th className="pb-3 font-medium text-gray-600 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-4">{item.description}</td>
                    <td className="py-4">{item.hsnCode || '-'}</td>
                    <td className="py-4 text-right">{item.quantity} {item.unit}</td>
                    <td className="py-4 text-right">{typeof item.rate === 'number' ? 
                      formatCurrency(item.rate) : item.rate}</td>
                    <td className="py-4 text-right">{item.gstRate}%</td>
                    <td className="py-4 text-right font-medium">{typeof item.amount === 'number' ? 
                      formatCurrency(item.amount) : item.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary and Totals */}
          <div className="p-6 flex">
            <div className="flex-1">
              {invoice.notes && (
                <div className="mb-4">
                  <h3 className="text-gray-500 text-sm font-medium mb-2">NOTES</h3>
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </div>
              )}
              
              {invoice.termsAndConditions && (
                <div>
                  <h3 className="text-gray-500 text-sm font-medium mb-2">TERMS & CONDITIONS</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{invoice.termsAndConditions}</p>
                </div>
              )}
            </div>
            
            <div className="w-72">
              <div className="border rounded-md overflow-hidden">
                <div className="p-4 space-y-2 bg-gray-50">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{typeof invoice.subtotal === 'number' ? 
                      formatCurrency(invoice.subtotal) : invoice.subtotal}</span>
                  </div>
                  
                  {parseFloat(invoice.cgst) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">CGST:</span>
                      <span>{typeof invoice.cgst === 'number' ? 
                        formatCurrency(invoice.cgst) : invoice.cgst}</span>
                    </div>
                  )}
                  
                  {parseFloat(invoice.sgst) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">SGST:</span>
                      <span>{typeof invoice.sgst === 'number' ? 
                        formatCurrency(invoice.sgst) : invoice.sgst}</span>
                    </div>
                  )}
                  
                  {parseFloat(invoice.igst) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IGST:</span>
                      <span>{typeof invoice.igst === 'number' ? 
                        formatCurrency(invoice.igst) : invoice.igst}</span>
                    </div>
                  )}
                </div>
                
                <div className={cn("px-4 py-3 flex justify-between items-center", selectedColor.bgColor, "text-white")}>
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(getInvoiceTotal(invoice))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  }
}