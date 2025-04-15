import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number;
  change: number;
  trend?: "positive" | "negative";
  icon: string;
  iconColor: "blue" | "green" | "orange" | "purple" | "red";
  isAmount?: boolean;
}

export function MetricsCard({
  title,
  value,
  change,
  trend = "positive",
  icon,
  iconColor,
  isAmount = false,
}: MetricsCardProps) {
  const formatValue = (val: number): string => {
    if (isAmount) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(val);
    }
    return val.toLocaleString();
  };

  const getIconBgColor = () => {
    switch (iconColor) {
      case "blue":
        return "bg-blue-100";
      case "green":
        return "bg-green-100";
      case "orange":
        return "bg-orange-100";
      case "purple":
        return "bg-purple-100";
      case "red":
        return "bg-red-100";
      default:
        return "bg-blue-100";
    }
  };

  const getIconColor = () => {
    switch (iconColor) {
      case "blue":
        return "text-primary";
      case "green":
        return "text-green-600";
      case "orange":
        return "text-orange-500";
      case "purple":
        return "text-purple-600";
      case "red":
        return "text-red-500";
      default:
        return "text-primary";
    }
  };

  const getTrendColor = () => {
    return trend === "positive" ? "text-green-600" : "text-red-500";
  };

  const getIconElement = () => {
    // This simulates a Material Icon using SVG alternatives
    switch (icon) {
      case "receipt":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
            <path d="M16 8h-6" />
            <path d="M16 12h-6" />
            <path d="M16 16h-6" />
          </svg>
        );
      case "payments":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
        );
      case "pending_actions":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case "people":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="3" x2="21" y1="9" y2="9" />
            <line x1="9" x2="9" y1="21" y2="9" />
          </svg>
        );
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-semibold text-gray-800">{formatValue(value)}</p>
          </div>
          <div className={`p-3 rounded-full ${getIconBgColor()}`}>
            <div className={getIconColor()}>{getIconElement()}</div>
          </div>
        </div>
        <div className="flex items-center mt-4">
          <span className={`flex items-center text-sm ${getTrendColor()}`}>
            {trend === "positive" ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            {change}%
          </span>
          <span className="text-gray-500 text-sm ml-1">vs last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
