import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertCompanySchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";

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

// Company form component props
interface CompanyFormProps {
  company?: any;
  section?: 'details' | 'bank' | 'tax';
  onSuccess?: () => void;
}

export function CompanyForm({ company, section = 'details', onSuccess }: CompanyFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Form definition with zod validation
  const form = useForm<z.infer<typeof insertCompanySchema>>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: company
      ? {
          ...company,
          // Convert any null values to empty strings to fix type issues
          name: company.name || "",
          gstin: company.gstin || "",
          address: company.address || "",
          city: company.city || "",
          state: company.state || "",
          pincode: company.pincode || "",
          email: company.email || "",
          phone: company.phone || "",
          bankName: company.bankName || "",
          accountNumber: company.accountNumber || "",
          ifscCode: company.ifscCode || "",
          logo: company.logo || "",
          userId: user?.id,
        }
      : {
          name: "",
          gstin: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          email: "",
          phone: "",
          bankName: "",
          accountNumber: "",
          ifscCode: "",
          logo: "",
          userId: user?.id,
        },
  });

  // Create company mutation
  const createCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCompanySchema>) => {
      try {
        const response = await apiRequest("POST", "/api/company", data);
        return await response.json();
      } catch (error: any) {
        console.error("Error creating company:", error);
        throw new Error(error.message || "Failed to create company profile");
      }
    },
    onSuccess: () => {
      toast({
        title: "Company created",
        description: "Your company profile has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error("Company creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create company profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update company mutation
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCompanySchema>) => {
      try {
        const response = await apiRequest("PUT", `/api/company/${company.id}`, data);
        return await response.json();
      } catch (error: any) {
        console.error("Error updating company:", error);
        throw new Error(error.message || "Failed to update company profile");
      }
    },
    onSuccess: () => {
      toast({
        title: "Company updated",
        description: "Your company profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      console.error("Company update error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update company profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: z.infer<typeof insertCompanySchema>) {
    if (company) {
      updateCompanyMutation.mutate(values);
    } else {
      createCompanyMutation.mutate(values);
    }
  }

  const isPending = createCompanyMutation.isPending || updateCompanyMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Company Details Section */}
        {(section === 'details' || !company) && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className={company ? "" : "md:col-span-2"}>
                  <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Enter company name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {section === 'details' && (
              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Logo</FormLabel>
                    <FormControl>
                      <ImageUpload 
                        value={field.value} 
                        onChange={field.onChange} 
                      />
                    </FormControl>
                    <FormDescription>Upload your company logo (will be resized automatically)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter company address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
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
              name="state"
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
              name="pincode"
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
        )}

        {/* Tax Information Section */}
        {(section === 'tax' || !company) && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="gstin"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>GSTIN</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter GSTIN" {...field} />
                  </FormControl>
                  <FormDescription>15-digit GST Identification Number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Bank Details Section */}
        {(section === 'bank' || !company) && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter bank name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter account number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IFSC Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter IFSC code" {...field} />
                  </FormControl>
                  <FormDescription>Indian Financial System Code</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {company ? "Save Changes" : "Create Company Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
