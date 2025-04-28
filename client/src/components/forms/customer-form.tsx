import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertCustomerSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Indian states for the dropdown
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

// Extended schema for customer form
const customerFormSchema = insertCustomerSchema.extend({
  sameAsShipping: z.boolean().default(true),
});

// Customer form component props
interface CustomerFormProps {
  customer?: any;
  onSuccess?: () => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSameAddress, setIsSameAddress] = useState(customer ? customer.sameAsShipping : true);

  // Form definition with zod validation
  const form = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer
      ? {
          ...customer,
          userId: user?.id,
        }
      : {
          name: "",
          email: "",
          phone: "",
          gstin: "",
          billingAddress: "",
          billingCity: "",
          billingState: "",
          billingPincode: "",
          shippingAddress: "",
          shippingCity: "",
          shippingState: "",
          shippingPincode: "",
          sameAsShipping: true,
          userId: user?.id,
        },
  });

  // Create customer mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerFormSchema>) => {
      const response = await apiRequest("POST", "/api/customers", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer created",
        description: "The customer has been added successfully.",
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerFormSchema>) => {
      const response = await apiRequest("PATCH", `/api/customers/${customer.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Customer updated",
        description: "The customer has been updated successfully.",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof customerFormSchema>) {
    // If shipping address is same as billing, copy the billing address
    if (values.sameAsShipping) {
      values.shippingAddress = values.billingAddress;
      values.shippingCity = values.billingCity;
      values.shippingState = values.billingState;
      values.shippingPincode = values.billingPincode;
    }

    if (customer) {
      updateCustomerMutation.mutate(values);
    } else {
      createCustomerMutation.mutate(values);
    }
  }

  // Handle same as billing checkbox change
  const handleSameAddressChange = (checked: boolean) => {
    setIsSameAddress(checked);
    form.setValue("sameAsShipping", checked);
  };

  const isPending = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="Enter customer name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gstin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GSTIN</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GSTIN (optional)" {...field} />
                </FormControl>
                <FormDescription>15-digit GST Identification Number</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-medium mb-4">Billing Address</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter billing address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter city" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billingState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
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
              name="billingPincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pincode <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter pincode" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Checkbox 
            id="sameAsShipping" 
            checked={isSameAddress} 
            onCheckedChange={handleSameAddressChange} 
          />
          <label
            htmlFor="sameAsShipping"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Shipping address same as billing address
          </label>
        </div>

        {!isSameAddress && (
          <div>
            <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="shippingAddress"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter shipping address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingCity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter city" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shippingState"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
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
                name="shippingPincode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pincode <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pincode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {customer ? "Update Customer" : "Add Customer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
