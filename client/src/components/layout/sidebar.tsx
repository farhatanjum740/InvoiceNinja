import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, ReceiptText, Users, Package2, FileBarChart, Building2, Settings, Menu, LogOut, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const routes = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
    },
    {
      title: "Invoices",
      href: "/invoices",
      icon: ReceiptText,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: Users,
    },
    {
      title: "Products",
      href: "/products",
      icon: Package2,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: FileBarChart,
    },
    {
      title: "Company",
      href: "/company",
      icon: Building2,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      title: "Storage Test",
      href: "/storage-test",
      icon: Database,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/dashboard") return true;
    if (path !== "/dashboard" && location.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const SidebarContent = () => (
    <div className={cn("flex flex-col h-full bg-white border-r", className)}>
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-primary">InvoiceHub</h1>
      </div>
      <ScrollArea className="flex-1 p-4">
        <nav className="flex flex-col space-y-1">
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              <a
                className={cn(
                  "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md",
                  isActive(route.href) && "bg-blue-50 border-l-4 border-primary text-primary"
                )}
                onClick={() => setOpen(false)}
              >
                <route.icon className="mr-3 h-5 w-5" />
                <span>{route.title}</span>
              </a>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : user?.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.name || user?.username}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="mt-3 flex items-center text-sm text-gray-600 hover:text-gray-900 w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0" style={{ maxWidth: '18rem' }}>
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:block h-full">
        <SidebarContent />
      </div>
    </>
  );
}
