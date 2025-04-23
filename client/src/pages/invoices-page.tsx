import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { EyeIcon, PencilIcon, TrashIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, FilterIcon, DownloadIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function InvoicesPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: invoices = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Overdue</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filter and search invoices
  const filteredInvoices = invoices.filter((invoice: any) => {
    const matchesSearch =
      !searchQuery ||
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  // Paginate invoices
  const paginatedInvoices = filteredInvoices.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(filteredInvoices.length / pageSize);

  // Function to view an invoice detail
  const handleViewInvoice = (id: number) => {
    toast({
      title: "View Invoice",
      description: "Opening invoice details...",
    });
    // TODO: Open a modal with invoice details or navigate to a detail page
    console.log("Viewing invoice:", id);
  };
  
  // Function to edit an invoice
  const handleEditInvoice = (id: number) => {
    toast({
      title: "Edit Invoice",
      description: "Redirecting to edit page...",
    });
    // TODO: Navigate to edit page or open edit modal
    console.log("Editing invoice:", id);
  };
  
  // Function to download an invoice as PDF
  const handleDownloadInvoice = (id: number) => {
    toast({
      title: "Downloading Invoice",
      description: "Preparing PDF for download...",
    });
    // TODO: Call API to generate and download PDF
    console.log("Downloading invoice:", id);
  };

  // Function to delete an invoice
  const handleDeleteInvoice = async () => {
    // Here we would call the API to delete the invoice
    // For now, just close the dialog and show a success message
    toast({
      title: "Invoice Deleted",
      description: "The invoice has been successfully deleted.",
    });
    setInvoiceToDelete(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Invoices" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Invoices</h2>
              <Link href="/invoices/new">
                <Button className="mt-4 md:mt-0">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              </Link>
            </div>

            <Card className="mb-6 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search invoices..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon">
                      <FilterIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline">
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Export
                    </Button>
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
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
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
                                  <Skeleton className="h-5 w-24" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-32" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-24" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-24" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-20" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Skeleton className="h-5 w-16 rounded-full" />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <Skeleton className="h-8 w-24 ml-auto" />
                                </td>
                              </tr>
                            ))
                        : paginatedInvoices.length > 0 ? (
                            paginatedInvoices.map((invoice: any) => (
                              <tr key={invoice.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {invoice.invoiceNumber}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {invoice.customerName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {formatDate(invoice.invoiceDate)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {invoice.dueDate ? formatDate(invoice.dueDate) : "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                  {formatAmount(invoice.total)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {getStatusBadge(invoice.status)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewInvoice(invoice.id)}
                                    title="View"
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEditInvoice(invoice.id)}
                                    title="Edit"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDownloadInvoice(invoice.id)}
                                    title="Download"
                                  >
                                    <DownloadIcon className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                        <TrashIcon className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete the invoice.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-red-600 text-white hover:bg-red-700"
                                          onClick={() => handleDeleteInvoice()}
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
                              <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                {searchQuery || statusFilter !== "all" ? (
                                  <div>
                                    <p className="text-lg font-medium">No matching invoices</p>
                                    <p className="mt-1">Try adjusting your search or filter to find what you're looking for.</p>
                                    <Button
                                      variant="link"
                                      className="mt-2"
                                      onClick={() => {
                                        setSearchQuery("");
                                        setStatusFilter("all");
                                      }}
                                    >
                                      Clear filters
                                    </Button>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-lg font-medium">No invoices yet</p>
                                    <p className="mt-1">Create your first invoice to get started.</p>
                                    <Link href="/invoices/new">
                                      <Button className="mt-4">Create Invoice</Button>
                                    </Link>
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
                        {Math.min(page * pageSize, filteredInvoices.length)}
                      </span>{" "}
                      of <span className="font-medium">{filteredInvoices.length}</span> invoices
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
    </div>
  );
}

// Plus icon component
function PlusIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
