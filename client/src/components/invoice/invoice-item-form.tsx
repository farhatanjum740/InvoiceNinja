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
    console.log("Product selection changed to:", productId);
    console.log("Available products:", products);
    
    if (!productId || productId === "custom") {
      // Reset the form fields if "Custom Item" is selected
      form.setValue("description", "");
      form.setValue("hsnCode", "");
      form.setValue("unit", "Piece");
      form.setValue("rate", 1); // Set a valid default rate
      form.setValue("gstRate", 18);
      return;
    }

    // Try to find the product with additional safety checks
    let product;
    try {
      if (products && Array.isArray(products)) {
        // Try multiple ways to match the product ID for maximum reliability
        product = products.find(p => {
          if (!p || typeof p !== 'object') return false;
          
          // Try string comparison first (most reliable)
          if (String(p.id) === productId) return true;
          
          // Try numeric comparison as fallback
          const numericId = parseInt(productId);
          return !isNaN(numericId) && p.id === numericId;
        });
      }
    } catch (err) {
      console.error("Error finding product:", err);
    }
    
    if (product) {
      console.log("Selected product details:", JSON.stringify(product, null, 2));
      
      // Set form values with fallbacks for each field
      form.setValue("description", product.name || "");
      form.setValue("hsnCode", product.hsnCode || "");
      form.setValue("unit", product.unit || "Piece");
      
      // Determine rate value with comprehensive fallbacks
      let rate = 0.01; // Default minimum rate
      try {
        // First try the schema-correct "rate" field
        if (product.rate !== undefined && product.rate !== null) {
          const parsedRate = parseFloat(String(product.rate));
          if (!isNaN(parsedRate)) {
            rate = Math.max(0.01, parsedRate);
          }
        } 
        // Then try the Supabase-returned "price" field if it exists
        else if ((product as any).price !== undefined && (product as any).price !== null) {
          const parsedPrice = parseFloat(String((product as any).price));
          if (!isNaN(parsedPrice)) {
            rate = Math.max(0.01, parsedPrice);
          }
        }
      } catch (err) {
        console.error("Error parsing product rate:", err);
      }
      
      console.log("Setting form rate to:", rate);
      form.setValue("rate", rate);
      
      // GST rate with fallback
      const gstRate = product.gstRate !== undefined && product.gstRate !== null ? product.gstRate : 18;
      form.setValue("gstRate", gstRate);
    } else {
      console.warn(`Product with ID ${productId} not found in products list!`);
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
                        {products.map((product) => {
                          // Safely determine the rate for display, checking both rate and price fields
                          const displayRate = product.rate 
                            ? parseFloat(typeof product.rate === 'string' ? product.rate : String(product.rate))
                            : (product.price 
                              ? parseFloat(typeof product.price === 'string' ? product.price : String(product.price))
                              : 0);
                          
                          const formattedPrice = !isNaN(displayRate)
                            ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(displayRate)
                            : "₹0.00";
                            
                          return (
                            <SelectItem key={product.id} value={String(product.id)}>
                              {product.name} - {formattedPrice}
                            </SelectItem>
                          );
                        })}
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
