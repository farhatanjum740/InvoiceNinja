import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReceiptIcon, FileTextIcon, UserPlusIcon, PencilIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

// Sample activity data
const activities = [
  {
    id: 1,
    type: "invoice_created",
    title: "Invoice created",
    description: "INV-2023-057 for Tech Solutions Pvt Ltd",
    time: "Today at 10:23 AM",
  },
  {
    id: 2,
    type: "payment_received",
    title: "Payment received",
    description: "₹29,500 for INV-2023-055",
    time: "Yesterday at 4:45 PM",
  },
  {
    id: 3,
    type: "customer_added",
    title: "New customer added",
    description: "Tech Solutions Pvt Ltd",
    time: "Yesterday at 2:30 PM",
  },
  {
    id: 4,
    type: "invoice_updated",
    title: "Invoice updated",
    description: "INV-2023-056 for Sharma Enterprises",
    time: "2 days ago at 9:15 AM",
  },
];

export function RecentActivity() {
  const [showAll, setShowAll] = useState(false);
  const displayedActivities = showAll ? activities : activities.slice(0, 3);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "invoice_created":
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-primary">
            <ReceiptIcon className="h-4 w-4" />
          </div>
        );
      case "payment_received":
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600">
            <FileTextIcon className="h-4 w-4" />
          </div>
        );
      case "customer_added":
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-purple-100 text-purple-600">
            <UserPlusIcon className="h-4 w-4" />
          </div>
        );
      case "invoice_updated":
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-600">
            <PencilIcon className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600">
            <ReceiptIcon className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader className="border-b pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flow-root">
          <ul className="space-y-4">
            {displayedActivities.map((activity, index) => (
              <li key={activity.id}>
                <div className="flex space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <div className="text-sm text-gray-800">
                      <span className="font-medium">{activity.title}</span>
                      <span className="text-gray-500 ml-1">{activity.description}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{activity.time}</div>
                  </div>
                </div>
                {index < displayedActivities.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-primary"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "Show less" : "View all activity"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
