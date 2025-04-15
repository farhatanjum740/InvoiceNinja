import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MetricsCard } from "@/components/dashboard/metrics-card";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Dashboard" />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <MetricsCard
                  title="Total Invoices"
                  value={stats?.totalInvoices || 0}
                  change={16}
                  icon="receipt"
                  iconColor="blue"
                />
                <MetricsCard
                  title="Total Revenue"
                  value={stats?.totalRevenue || 0}
                  change={12}
                  icon="payments"
                  iconColor="green"
                  isAmount
                />
                <MetricsCard
                  title="Unpaid Invoices"
                  value={stats?.unpaidInvoices || 0}
                  change={7}
                  trend="negative"
                  icon="pending_actions"
                  iconColor="orange"
                />
                <MetricsCard
                  title="Total Customers"
                  value={stats?.totalCustomers || 0}
                  change={23}
                  icon="people"
                  iconColor="purple"
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <AnalyticsChart
                title="Monthly Revenue"
                type="bar"
                timeRanges={["Last 6 Months", "Last Year", "All Time"]}
              />
              <AnalyticsChart
                title="Invoice Status"
                type="pie"
                timeRanges={["Current Month", "Last Quarter", "All Time"]}
              />
            </div>

            <RecentInvoices />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <QuickActions />
              <RecentActivity />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
