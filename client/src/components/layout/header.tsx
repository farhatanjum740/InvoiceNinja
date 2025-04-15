import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BellIcon, HelpCircleIcon } from "lucide-react";

interface HeaderProps {
  title: string;
  showCreateInvoiceButton?: boolean;
}

export function Header({ title, showCreateInvoiceButton = true }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b">
      <div className="flex items-center">
        <h1 className="text-lg font-medium ml-4 md:hidden">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        {showCreateInvoiceButton && (
          <Link href="/invoices/new">
            <Button className="hidden sm:flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1 h-4 w-4"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              New Invoice
            </Button>
          </Link>
        )}
        <Button variant="ghost" size="icon" className="rounded-full">
          <BellIcon className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <HelpCircleIcon className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
