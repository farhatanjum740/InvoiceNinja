import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateGST } from "@/lib/utils/gst-calculations";
import { formatCurrency } from "@/lib/utils/formatting";
import { InvoiceItemForm } from "./invoice-item-form";
import { InvoiceTemplateSelector } from "./invoice-template-selector";
import { InvoiceTemplateRenderer } from "./invoice-template-renderer";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, PlusIcon, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define schema for invoice form
const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerId: z.number().min(1, "Customer is required"),
  invoiceDate: z.date(),
  dueDate: z.date().optional(),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional()
});

// Define schema for invoice item
const invoiceItemSchema = z.object({
  productId: z.number().optional(),
  description: z.string().min(1, "Description is required"),
  hsnCode: z.string().optional(),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.number().min(0.01, "Rate must be greater than 0"),
  gstRate: z.number().min(0, "GST rate cannot be negative"),
  amount: z.number()
});

// Invoice form component props
interface InvoiceFormProps {
  company: any;
  customers: any[] | undefined;
  products: any[] | undefined;
  isLoading: boolean;
  onDataChange: (data: any) => void;
  onSuccess: () => void;
}

export function InvoiceForm({ company, customers, products, isLoading, onDataChange, onSuccess }: InvoiceFormProps) {
  const { toast } = useToast();
  // Explicitly initialize with an empty array and force the type
  const [invoiceItems, setInvoiceItems] = useState<Array<any>>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [gstTotals, setGstTotals] = useState({ cgst: 0, sgst: 0, igst: 0 });
  const [total, setTotal] = useState(0);
  const [isGeneratingInvoiceNumber, setIsGeneratingInvoiceNumber] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [selectedColor, setSelectedColor] = useState("blue");
  const [previewInvoiceData, setPreviewInvoiceData] = useState<any>(null);

  // Form definition
  const form = useForm<z.infer<typeof invoiceFormSchema>>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      customerId: 0,
      invoiceDate: new Date(),
      status: "draft",
      notes: "Thank you for your business!",
      termsAndConditions: "1. Payment due within 30 days\n2. Goods once sold cannot be returned"
    },
  });

  // Load saved form state if available
  useEffect(() => {
    const savedFormState = localStorage.getItem('invoice-form-state');
    if (savedFormState) {
      try {
        const parsedState = JSON.parse(savedFormState);
        
        // Restore form values - need to handle dates specially
        if (parsedState.formValues) {
          // Convert string dates back to Date objects
          const formValues = {...parsedState.formValues};
          if (formValues.invoiceDate) {
            formValues.invoiceDate = new Date(formValues.invoiceDate);
          }
          if (formValues.dueDate) {
            formValues.dueDate = new Date(formValues.dueDate);
          }
          // Set the form values
          Object.entries(formValues).forEach(([key, value]) => {
            form.setValue(key as any, value);
          });
        }
        
        // Restore other state values
        if (parsedState.invoiceItems) setInvoiceItems(parsedState.invoiceItems);
        if (parsedState.selectedCustomer) setSelectedCustomer(parsedState.selectedCustomer);
        if (parsedState.selectedTemplate) setSelectedTemplate(parsedState.selectedTemplate);
        if (parsedState.selectedColor) setSelectedColor(parsedState.selectedColor);
        if (parsedState.subtotal) setSubtotal(parsedState.subtotal);
        if (parsedState.gstTotals) setGstTotals(parsedState.gstTotals);
        if (parsedState.total) setTotal(parsedState.total);
        
        // Mark that we've already loaded a draft
        setIsGeneratingInvoiceNumber(false);
      } catch (e) {
        console.error("Error parsing saved form state:", e);
      }
    }
  }, []);

  // Generate a new invoice number
  useEffect(() => {
    if (isGeneratingInvoiceNumber) {
      const today = new Date();
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const year = today.getFullYear().toString().slice(-2);
      const random = Math.floor(1000 + Math.random() * 9000);
      const invoiceNo = `INV-${year}${month}-${random}`;
      form.setValue("invoiceNumber", invoiceNo);
      setIsGeneratingInvoiceNumber(false);
    }
  }, [form, isGeneratingInvoiceNumber]);

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Submitting invoice data:", data);
      const response = await apiRequest("POST", "/api/invoices", data);
      const result = await response.json();
      console.log("Response from server:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("Invoice created successfully:", data);
      // Clear the form state in localStorage
      localStorage.removeItem('invoice-form-state');
      
      // We'll let the parent component handle the success toast and navigation
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      console.error("Error creating invoice:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate totals whenever invoice items change
  useEffect(() => {
    // Even when there are no invoice items, we need to update the invoice data 
    // to show an empty invoice in the preview

    if (invoiceItems.length) {
      try {
        // Calculate subtotal correctly from all items
        const calculatedSubtotal = invoiceItems.reduce(
          (sum, item) => {
            // Make sure we have a numeric amount value
            const itemAmount = typeof item.amount === 'number' 
              ? item.amount 
              : parseFloat(String(item.amount || 0));
            
            // Check for valid number
            if (isNaN(itemAmount)) {
              console.warn("Found NaN item amount:", item);
              return sum; // Skip this item if amount is NaN
            }
            
            return sum + itemAmount;
          },
          0
        );
        
        // Ensure subtotal is properly rounded for display
        const roundedSubtotal = parseFloat(calculatedSubtotal.toFixed(2)) || 0;
        setSubtotal(roundedSubtotal);

        // Calculate GST based on each item's specific GST rate and customer shipping state
        const gst = calculateGST(invoiceItems, selectedCustomer, company);
        
        // Make sure GST values are valid numbers
        const validatedGst = {
          cgst: isNaN(gst.cgst) ? 0 : gst.cgst,
          sgst: isNaN(gst.sgst) ? 0 : gst.sgst,
          igst: isNaN(gst.igst) ? 0 : gst.igst
        };
        
        setGstTotals(validatedGst);

        // Calculate total (subtotal + all taxes)
        const calculatedTotal = roundedSubtotal + validatedGst.cgst + validatedGst.sgst + validatedGst.igst;
        const roundedTotal = parseFloat(calculatedTotal.toFixed(2)) || 0;
        setTotal(roundedTotal);
        
        console.log("Calculated values:", {
          subtotal: roundedSubtotal,
          gst: validatedGst,
          total: roundedTotal
        });
      } catch (error) {
        console.error("Error calculating invoice totals:", error);
        // Set fallback values
        setSubtotal(0);
        setGstTotals({ cgst: 0, sgst: 0, igst: 0 });
        setTotal(0);
      }
    } else {
      // Set default values for an empty invoice
      setSubtotal(0);
      setGstTotals({ cgst: 0, sgst: 0, igst: 0 });
      setTotal(0);
    }

    // Always update the invoice data for preview regardless of item count
    updateInvoiceData();
  }, [invoiceItems, selectedCustomer, company]);

  // Save form state to localStorage
  const saveFormState = () => {
    const formData = {
      formValues: form.getValues(),
      invoiceItems,
      selectedCustomer,
      selectedTemplate,
      selectedColor,
      subtotal,
      gstTotals,
      total
    };
    localStorage.setItem('invoice-form-state', JSON.stringify(formData));
  };

  // Update form data when customer changes
  const handleCustomerChange = (customerId: string) => {
    const id = parseInt(customerId);
    form.setValue("customerId", id);
    const customer = customers?.find(c => c.id === id);
    
    if (customer) {
      console.log("Selected customer:", customer);
      
      // Set customer details to the form
      setSelectedCustomer(customer);
      
      // Update the shipping address fields if they exist in the form
      try {
        // Check if these form fields exist before setting them
        if (form.getValues().hasOwnProperty("shippingAddress")) {
          form.setValue("shippingAddress", customer.billingAddress || "");
          form.setValue("shippingCity", customer.billingCity || "");
          form.setValue("shippingState", customer.billingState || "");
          form.setValue("shippingPincode", customer.billingPincode || "");
        }
      } catch (error) {
        console.error("Error setting customer shipping details:", error);
      }
    }
    
    // Save form state after customer change
    setTimeout(saveFormState, 0);
  };

  // Add a new invoice item
  const addInvoiceItem = (itemData: any) => {
    console.log("Adding invoice item in invoice form:", itemData);
    
    // Validate item data before adding
    if (!itemData || typeof itemData !== 'object') {
      console.error("Invalid item data:", itemData);
      return;
    }
    
    // Ensure required numeric fields are valid numbers
    const validatedItem = {
      ...itemData,
      quantity: typeof itemData.quantity === 'number' ? Math.max(0.01, itemData.quantity) : 1,
      rate: typeof itemData.rate === 'number' ? Math.max(0.01, itemData.rate) : 1,
      amount: typeof itemData.amount === 'number' ? Math.max(0.01, itemData.amount) : 1,
    };
    
    console.log("Validated item:", validatedItem);
    
    const newItems = [...invoiceItems, validatedItem];
    console.log("New invoice items array:", newItems, "length:", newItems.length);
    
    // First update state
    setInvoiceItems(newItems);
    
    // Then update the UI with a toast notification for feedback
    toast({
      title: "Item added",
      description: `Added ${validatedItem.description} to the invoice.`,
    });
    
    // Save form state after adding item
    setTimeout(() => {
      saveFormState();
      console.log("Form state saved with items:", newItems.length);
    }, 0);
  };

  // Remove an invoice item
  const removeInvoiceItem = (index: number) => {
    const newItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(newItems);
    // Save form state after removing item
    setTimeout(() => {
      saveFormState();
    }, 0);
  };

  // Update the complete invoice data for preview
  const updateInvoiceData = () => {
    const formValues = form.getValues();
    
    const completeInvoiceData = {
      invoice: {
        ...formValues,
        subtotal,
        cgst: gstTotals.cgst,
        sgst: gstTotals.sgst,
        igst: gstTotals.igst,
        total,
        totalAmount: total, // Add totalAmount for backend compatibility
        customerName: selectedCustomer?.name || "",
        templateId: selectedTemplate,
        colorTheme: selectedColor
      },
      items: invoiceItems,
      company,
      customer: selectedCustomer,
    };
    
    // Log the data to help with debugging
    console.log("Prepared invoice data:", completeInvoiceData);
    
    setPreviewInvoiceData(completeInvoiceData);
    onDataChange(completeInvoiceData);
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    updateInvoiceData();
  };
  
  // Handle color selection
  const handleColorSelect = (colorId: string) => {
    setSelectedColor(colorId);
    updateInvoiceData();
  };

  // Form submission handler
  const onSubmit = (values: z.infer<typeof invoiceFormSchema>) => {
    if (!invoiceItems.length) {
      toast({
        title: "No invoice items",
        description: "Please add at least one item to the invoice.",
        variant: "destructive",
      });
      return;
    }

    const invoiceData = {
      invoice: {
        ...values,
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        // Include template information for saving with the invoice
        templateId: selectedTemplate,
        colorTheme: selectedColor,
        // Convert all numeric values to strings for the database
        subtotal: subtotal.toString(),
        cgst: gstTotals.cgst !== null && gstTotals.cgst !== undefined ? gstTotals.cgst.toString() : '0.00',
        sgst: gstTotals.sgst !== null && gstTotals.sgst !== undefined ? gstTotals.sgst.toString() : '0.00', 
        igst: gstTotals.igst !== null && gstTotals.igst !== undefined ? gstTotals.igst.toString() : '0.00',
        total: total.toString(),
        totalAmount: total.toString() // Add this for backend compatibility
      },
      items: invoiceItems.map(item => ({
        ...item,
        // Convert the numeric values to strings for each item
        quantity: item.quantity.toString(),
        rate: item.rate.toString(),
        amount: item.amount.toString(),
        hsnCode: item.hsnCode || null
      }))
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-700 mb-4">Invoice Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice # <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="invoiceDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Invoice Date <span className="text-red-500">*</span></FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-700 mb-4">Customer Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer <span className="text-red-500">*</span></FormLabel>
                        <Select
                          value={field.value ? field.value.toString() : ""}
                          onValueChange={handleCustomerChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers?.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id.toString()}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedCustomer && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Billing Address:</p>
                          {selectedCustomer.billingAddress ? (
                            <>
                              <p>{selectedCustomer.billingAddress || ""}</p>
                              <p>
                                {selectedCustomer.billingCity || ""}{selectedCustomer.billingCity ? "," : ""} {selectedCustomer.billingState || ""} 
                                {selectedCustomer.billingPincode ? " - " + selectedCustomer.billingPincode : ""}
                              </p>
                            </>
                          ) : (
                            <p className="text-gray-500 italic">No billing address available</p>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Contact:</p>
                          {selectedCustomer.email && <p>Email: {selectedCustomer.email}</p>}
                          {selectedCustomer.phone && <p>Phone: {selectedCustomer.phone}</p>}
                          {selectedCustomer.gstin && (
                            <p className="mt-2">
                              GSTIN: <Badge variant="outline">{selectedCustomer.gstin}</Badge>
                            </p>
                          )}
                          {!selectedCustomer.email && !selectedCustomer.phone && (
                            <p className="text-gray-500 italic">No contact details available</p>
                          )}
                        </div>
                      </div>
                      {/* Debug information - remove in production */}
                      <div className="mt-4 pt-2 border-t border-gray-200 text-xs text-gray-400">
                        <details>
                          <summary>Debug customer data</summary>
                          <pre className="mt-1 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                            {JSON.stringify(selectedCustomer, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700">Invoice Items</h3>
                <InvoiceItemForm
                  products={products}
                  onAddItem={addInvoiceItem}
                  buttonLabel={
                    <>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Item
                    </>
                  }
                />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {invoiceItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No items added to the invoice yet. Click "Add Item" to add an item.
                        </td>
                      </tr>
                    ) : (
                      invoiceItems.map((item, index) => {
                        // Debug log to see the item content
                        console.log(`Rendering item ${index}:`, item);
                        
                        // Ensure values are correctly parsed and formatted
                        const quantity = parseFloat(typeof item.quantity === 'string' ? item.quantity : String(item.quantity));
                        const rate = parseFloat(typeof item.rate === 'string' ? item.rate : String(item.rate));
                        const amount = parseFloat(typeof item.amount === 'string' ? item.amount : String(item.amount));
                        
                        // Additional debugging for numeric values
                        console.log(`Item ${index} numeric values - quantity: ${quantity}, rate: ${rate}, amount: ${amount}`);
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.description}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.hsnCode || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {!isNaN(quantity) ? quantity : 0} {item.unit}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {!isNaN(rate) ? formatCurrency(rate) : formatCurrency(0)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {item.gstRate}%
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {!isNaN(amount) ? formatCurrency(amount) : formatCurrency(0)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeInvoiceItem(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Notes and Terms */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-700 mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add notes to your invoice"
                            className="h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsAndConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Terms and Conditions</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add terms and conditions"
                            className="h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-gray-700 mb-4">Invoice Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>

                    {gstTotals.cgst > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">CGST ({(gstTotals.cgst / subtotal * 100 / 2).toFixed(2)}%):</span>
                        <span className="font-medium">{formatCurrency(gstTotals.cgst / 2)}</span>
                      </div>
                    )}

                    {gstTotals.sgst > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">SGST ({(gstTotals.sgst / subtotal * 100 / 2).toFixed(2)}%):</span>
                        <span className="font-medium">{formatCurrency(gstTotals.sgst / 2)}</span>
                      </div>
                    )}

                    {gstTotals.igst > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">IGST ({(gstTotals.igst / subtotal * 100).toFixed(2)}%):</span>
                        <span className="font-medium">{formatCurrency(gstTotals.igst)}</span>
                      </div>
                    )}

                    <div className="flex justify-between py-3 font-medium text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">GST Summary</h4>
                  <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                    {selectedCustomer && company ? (
                      selectedCustomer.billingState === company.state ? (
                        <p>
                          Since the customer's state ({selectedCustomer.billingState}) is the same as your company's state ({company.state}), 
                          CGST & SGST will be applied.
                        </p>
                      ) : (
                        <p>
                          Since the customer's state ({selectedCustomer.billingState}) is different from your company's state ({company.state}), 
                          IGST will be applied.
                        </p>
                      )
                    ) : (
                      <p>Select a customer to see GST calculation details.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Template Preview */}
          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-gray-700">Invoice Preview</h3>
                <InvoiceTemplateSelector 
                  selectedTemplate={selectedTemplate}
                  selectedColor={selectedColor}
                  onTemplateSelect={handleTemplateSelect}
                  onColorSelect={handleColorSelect}
                />
              </div>
              
              <div className="mt-6 border rounded-lg overflow-hidden">
                {previewInvoiceData ? (
                  <InvoiceTemplateRenderer 
                    templateId={selectedTemplate}
                    colorTheme={selectedColor}
                    invoice={previewInvoiceData.invoice}
                    items={previewInvoiceData.items}
                    company={previewInvoiceData.company}
                    customer={previewInvoiceData.customer}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-50">
                    <p className="text-gray-500">
                      Fill in invoice details and add items to preview
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={updateInvoiceData}
            >
              Refresh Preview
            </Button>
            <Button
              type="submit"
              disabled={createInvoiceMutation.isPending}
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Invoice"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
