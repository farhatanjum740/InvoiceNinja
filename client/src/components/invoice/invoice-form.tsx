import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { calculateGST } from "@/lib/utils/gst-calculations";
import { InvoiceItemForm } from "./invoice-item-form";

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
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [subtotal, setSubtotal] = useState(0);
  const [gstTotals, setGstTotals] = useState({ cgst: 0, sgst: 0, igst: 0 });
  const [total, setTotal] = useState(0);
  const [isGeneratingInvoiceNumber, setIsGeneratingInvoiceNumber] = useState(true);

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
      toast({
        title: "Invoice created",
        description: "Your invoice has been created successfully.",
      });
      onSuccess();
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
    if (!invoiceItems.length) return;

    // Calculate subtotal
    const calculatedSubtotal = invoiceItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    setSubtotal(calculatedSubtotal);

    // Calculate GST based on customer shipping state
    const gst = calculateGST(calculatedSubtotal, selectedCustomer, company);
    setGstTotals(gst);

    // Calculate total
    const calculatedTotal = calculatedSubtotal + gst.cgst + gst.sgst + gst.igst;
    setTotal(calculatedTotal);

    // Update the complete invoice data for preview
    updateInvoiceData();
  }, [invoiceItems, selectedCustomer]);

  // Update form data when customer changes
  const handleCustomerChange = (customerId: string) => {
    const id = parseInt(customerId);
    form.setValue("customerId", id);
    const customer = customers?.find(c => c.id === id);
    setSelectedCustomer(customer);
  };

  // Add a new invoice item
  const addInvoiceItem = (itemData: any) => {
    setInvoiceItems([...invoiceItems, itemData]);
  };

  // Remove an invoice item
  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
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
        customerName: selectedCustomer?.name || "",
      },
      items: invoiceItems,
      company,
      customer: selectedCustomer,
    };
    
    onDataChange(completeInvoiceData);
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
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
        subtotal,
        cgst: gstTotals.cgst,
        sgst: gstTotals.sgst,
        igst: gstTotals.igst,
        total
      },
      items: invoiceItems
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
                          <p>{selectedCustomer.billingAddress}</p>
                          <p>{selectedCustomer.billingCity}, {selectedCustomer.billingState} - {selectedCustomer.billingPincode}</p>
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
                        </div>
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
                      invoiceItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.hsnCode || "-"}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.quantity} {item.unit}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatCurrency(item.rate)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.gstRate}%
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                            {formatCurrency(item.amount)}
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
                      ))
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

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={updateInvoiceData}
            >
              Preview Invoice
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
