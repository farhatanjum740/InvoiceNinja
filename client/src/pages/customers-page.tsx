import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CustomerForm } from "@/components/forms/customer-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EyeIcon, PencilIcon, TrashIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

  const { toast } = useToast();

  const { data: customers, isLoading } = useQuery({
    queryKey: ["/api/customers"],
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: number) => {
      await apiRequest("DELETE", `/api/customers/${customerId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted.",
      });
      setCustomerToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter customers based on search query
  const filteredCustomers = customers
    ? customers.filter((customer: any) => {
        const searchRegex = new RegExp(searchQuery, "i");
        return (
          searchRegex.test(customer.name) ||
          searchRegex.test(customer.email || "") ||
          searchRegex.test(customer.phone || "") ||
          searchRegex.test(customer.gstin || "")
        );
      })
    : [];

  // Paginate customers
  const paginatedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredCustomers.length / pageSize);

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCustomer = (customerId: number) => {
    setCustomerToDelete(customerId);
  };

  const confirmDeleteCustomer = () => {
    if (customerToDelete) {
      deleteCustomerMutation.mutate(customerToDelete);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Customers" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
              <Button className="mt-4 md:mt-0" onClick={() => setIsAddDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </div>

            <Card className="mb-6 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search customers..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GSTIN
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isLoading
                        ? Array(5)
                            .fill(0)
                            .map((_, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-32" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-40" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-24" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-32" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-20" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <Skeleton className="h-8 w-24 ml-auto" />
                                </td>
                              </tr>
                            ))
                        : paginatedCustomers.length > 0 ? (
                            paginatedCustomers.map((customer: any) => (
                              <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {customer.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {customer.email || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {customer.phone || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {customer.gstin ? (
                                    <Badge variant="outline">{customer.gstin}</Badge>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {customer.billingState}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedCustomer(customer);
                                      // In a real app, you would navigate to a detail view
                                    }}
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEditCustomer(customer)}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                      >
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the customer
                                          and remove the data from our servers.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 text-white hover:bg-red-700"
                                          onClick={() => handleDeleteCustomer(customer.id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                {searchQuery ? (
                                  <div>
                                    <p className="text-lg font-medium">No matching customers</p>
                                    <p className="mt-1">Try adjusting your search to find what you're looking for.</p>
                                    <Button
                                      variant="link"
                                      className="mt-2"
                                      onClick={() => setSearchQuery("")}
                                    >
                                      Clear search
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                      <UserIcon className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium">No customers yet</p>
                                    <p className="mt-1">Add your first customer to get started.</p>
                                    <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                                      Add Customer
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 0 && (
                  <div className="px-5 py-3 border-t flex items-center justify-between">
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(page * pageSize, filteredCustomers.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredCustomers.length}</span> customers
                    </p>
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 w-8"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={page === totalPages ? "outline" : "default"}
                        size="icon"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="ml-2 h-8 w-8"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            onSuccess={() => {
              setIsAddDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              customer={selectedCustomer}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
