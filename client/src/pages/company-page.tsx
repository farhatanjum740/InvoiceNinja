import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompanyForm } from "@/components/forms/company-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { InvoiceTemplateSelector } from "@/components/invoice/invoice-template-selector";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Template Settings Component
function TemplateSettings({ company }: { company: any }) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState(company?.templateId || "standard");
  const [selectedColor, setSelectedColor] = useState(company?.colorTheme || "blue");

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: string; colorTheme: string }) => {
      const response = await apiRequest("PATCH", `/api/company`, data);
      if (!response.ok) {
        throw new Error("Failed to update template settings");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company"] });
      toast({
        title: "Template settings updated",
        description: "Your invoice template preferences have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update template settings",
        description: error.message,
      });
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    updateTemplateMutation.mutate({ templateId, colorTheme: selectedColor });
  };

  const handleColorSelect = (colorId: string) => {
    setSelectedColor(colorId);
    updateTemplateMutation.mutate({ templateId: selectedTemplate, colorTheme: colorId });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div>
          <h3 className="font-medium mb-4">Select your default invoice template and color theme</h3>
          <InvoiceTemplateSelector
            selectedTemplate={selectedTemplate}
            selectedColor={selectedColor}
            onTemplateSelect={handleTemplateSelect}
            onColorSelect={handleColorSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default function CompanyPage() {
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();

  const { data: company, isLoading, isError, error } = useQuery({
    queryKey: ["/api/company"],
  });

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Error loading company details",
        description: error?.message || "Failed to load company information. Please try again later.",
      });
    }
  }, [isError, error, toast]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Company" showCreateInvoiceButton={false} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Company Profile</h2>
              <p className="text-gray-600 mt-1">
                Manage your company information and settings
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="details">Company Details</TabsTrigger>
                <TabsTrigger value="bank">Bank Details</TabsTrigger>
                <TabsTrigger value="tax">Tax Information</TabsTrigger>
                <TabsTrigger value="templates">Invoice Templates</TabsTrigger>
              </TabsList>

              {isLoading ? (
                <Card>
                  <CardContent className="p-6 flex justify-center items-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : (
                <>
                  <TabsContent value="details">
                    <Card>
                      <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                        <CardDescription>
                          This information will appear on your invoices
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CompanyForm
                          company={company}
                          section="details"
                          onSuccess={() => {
                            toast({
                              title: "Company details updated",
                              description: "Your company information has been saved successfully.",
                            });
                          }}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="bank">
                    <Card>
                      <CardHeader>
                        <CardTitle>Bank Details</CardTitle>
                        <CardDescription>
                          Your bank account information for receiving payments
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CompanyForm
                          company={company}
                          section="bank"
                          onSuccess={() => {
                            toast({
                              title: "Bank details updated",
                              description: "Your banking information has been saved successfully.",
                            });
                          }}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="tax">
                    <Card>
                      <CardHeader>
                        <CardTitle>Tax Information</CardTitle>
                        <CardDescription>
                          GST and other tax details for compliance
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <CompanyForm
                          company={company}
                          section="tax"
                          onSuccess={() => {
                            toast({
                              title: "Tax information updated",
                              description: "Your tax details have been saved successfully.",
                            });
                          }}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="templates">
                    <Card>
                      <CardHeader>
                        <CardTitle>Invoice Template Settings</CardTitle>
                        <CardDescription>
                          Choose your default invoice template and color theme
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TemplateSettings company={company} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}
            </Tabs>

            {!isLoading && !company && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No Company Profile Found</h3>
                    <p className="text-gray-600 mb-4">
                      Please complete your company profile to start creating invoices.
                    </p>
                    <CompanyForm
                      onSuccess={() => {
                        toast({
                          title: "Company profile created",
                          description: "Your company profile has been created successfully.",
                        });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
