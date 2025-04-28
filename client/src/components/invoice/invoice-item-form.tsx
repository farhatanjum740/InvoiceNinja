import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

// Define schema for invoice item form
const invoiceItemFormSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  hsnCode: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.coerce.number().min(0.01, "Rate must be greater than 0"),
  gstRate: z.coerce.number().min(0, "GST rate is required"),
}).refine((data) => {
  // Additional validation to ensure rate is always a number and greater than 0
  return typeof data.rate === 'number' && data.rate > 0;
}, {
  message: "Rate must be a number greater than 0",
  path: ["rate"]
});

// Units
const UNITS = [
  "Piece",
  "Box",
  "Kg",
  "Litre",
  "Meter",
  "Dozen",
  "Set",
  "Package",
  "Pair",
  "Unit",
  "Hour",
  "Day",
  "Month",
  "Year",
  "Service",
];

// GST rates
const GST_RATES = [0, 5, 12, 18, 28];

// Invoice item form component props
interface InvoiceItemFormProps {
  products: any[] | undefined;
  onAddItem: (item: any) => void;
  buttonLabel: React.ReactNode;
}

export function InvoiceItemForm({ products, onAddItem, buttonLabel }: InvoiceItemFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form definition
  const form = useForm<z.infer<typeof invoiceItemFormSchema>>({
    resolver: zodResolver(invoiceItemFormSchema),
    defaultValues: {
      productId: "custom", // Set default to "custom" instead of empty string
      description: "",
      hsnCode: "",
      unit: "Piece",
      quantity: 1,
      rate: 1, // Set a default rate greater than 0
      gstRate: 18,
    },
  });

  // Watch form values to calculate amount
  const quantity = form.watch("quantity");
  const rate = form.watch("rate");
  const amount = quantity * rate;

  // Handle product selection
  const handleProductChange = (productId: string) => {
    if (!productId || productId === "custom") {
      // Reset the form fields if "Custom Item" is selected
      form.setValue("description", "");
      form.setValue("hsnCode", "");
      form.setValue("unit", "Piece");
      form.setValue("rate", 1); // Set a valid default rate
      form.setValue("gstRate", 18);
      return;
    }

    const product = products?.find(p => p.id.toString() === productId);
    if (product) {
      form.setValue("description", product.name);
      form.setValue("hsnCode", product.hsnCode || "");
      form.setValue("unit", product.unit);
      // Ensure we have a valid rate (at least 0.01)
      form.setValue("rate", Math.max(0.01, parseFloat(product.rate.toString() || "1")));
      form.setValue("gstRate", product.gstRate);
    }
  };

  // Form submission handler
  const onSubmit = (values: z.infer<typeof invoiceItemFormSchema>) => {
    // Calculate amount with proper precision - ensure values are valid
    const quantity = Math.max(0.01, parseFloat(values.quantity.toString()));
    const rate = Math.max(0.01, parseFloat(values.rate.toString()));
    const calcAmount = quantity * rate;
    
    // Validate the minimum required values
    if (rate <= 0 || quantity <= 0) {
      form.setError("rate", { 
        type: "manual", 
        message: "Rate must be greater than 0" 
      });
      return;
    }
    
    // Create invoice item with properly calculated and rounded amount
    const itemData = {
      ...values,
      quantity: quantity,
      rate: rate,
      amount: parseFloat(calcAmount.toFixed(2)),
      // Make sure gstRate is correctly preserved as a number
      gstRate: parseFloat(values.gstRate.toString()),
      // Only set productId if it's a real product (not "custom")
      productId: values.productId && values.productId !== "custom" ? parseInt(values.productId) : undefined
    };

    // Debug info
    console.log("Adding item to invoice:", itemData);
    
    onAddItem(itemData);
    form.reset();
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">{buttonLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Invoice Item</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          {/* Important: This is a child form that should NOT submit the parent form */}
          <form onSubmit={(e) => {
            e.preventDefault(); // Prevent default form submission
            form.handleSubmit(onSubmit)(e); // Handle submission with our function
          }} className="space-y-6 mt-4">
            {products && products.length > 0 && (
              <FormField
                control={form.control}
                name="productId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product (Optional)</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleProductChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product or add a custom item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="custom">Custom Item</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} - {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(product.rate)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter item description"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hsnCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HSN/SAC Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter HSN/SAC code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit <span className="text-red-500">*</span></FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate (₹) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.01" 
                        step="0.01"
                        placeholder="Enter rate"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gstRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GST Rate (%) <span className="text-red-500">*</span></FormLabel>
                    <Select
                      value={field.value.toString()}
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select GST rate" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GST_RATES.map((rate) => (
                          <SelectItem key={rate} value={rate.toString()}>
                            {rate}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Amount:</span>
                <span className="font-bold text-lg">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                  }).format(amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={(e) => {
                  // Manually handle the form submission to prevent parent form submission
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }}
              >
                Add Item
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
