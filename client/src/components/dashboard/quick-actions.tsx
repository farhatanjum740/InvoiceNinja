import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserPlusIcon, PackageIcon, ReceiptTextIcon } from "lucide-react";

export function QuickActions() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">Quick Add</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="grid grid-cols-1 gap-4">
          <Link href="/customers/new">
            <Button variant="outline" className="flex w-full py-6 justify-center items-center">
              <UserPlusIcon className="mr-2 h-5 w-5 text-primary" />
              <span>Add New Customer</span>
            </Button>
          </Link>
          <Link href="/products/new">
            <Button variant="outline" className="flex w-full py-6 justify-center items-center">
              <PackageIcon className="mr-2 h-5 w-5 text-primary" />
              <span>Add New Product</span>
            </Button>
          </Link>
          <Link href="/invoices/new">
            <Button className="flex w-full py-6 justify-center items-center">
              <ReceiptTextIcon className="mr-2 h-5 w-5" />
              <span>Create New Invoice</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
