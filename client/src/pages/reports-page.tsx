import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, PieChart, LineChart, ResponsiveContainer, Bar, Pie, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts";
import { CalendarIcon, DownloadIcon, FilterIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Sample data for the charts
const monthlyRevenueData = [
  { name: "Jan", revenue: 45000, expenses: 25000 },
  { name: "Feb", revenue: 52000, expenses: 28000 },
  { name: "Mar", revenue: 48000, expenses: 26000 },
  { name: "Apr", revenue: 61000, expenses: 30000 },
  { name: "May", revenue: 55000, expenses: 29000 },
  { name: "Jun", revenue: 67000, expenses: 32000 },
  { name: "Jul", revenue: 72000, expenses: 35000 },
  { name: "Aug", revenue: 69000, expenses: 34000 },
  { name: "Sep", revenue: 81000, expenses: 38000 },
  { name: "Oct", revenue: 78000, expenses: 36000 },
  { name: "Nov", revenue: 85000, expenses: 39000 },
  { name: "Dec", revenue: 91000, expenses: 42000 },
];

const statusData = [
  { name: "Paid", value: 65, color: "#4caf50" },
  { name: "Pending", value: 25, color: "#ff9800" },
  { name: "Overdue", value: 10, color: "#f44336" },
];

const topCustomersData = [
  { name: "Tech Solutions Pvt Ltd", value: 120000 },
  { name: "Sharma Enterprises", value: 85000 },
  { name: "Global Traders", value: 75000 },
  { name: "Patel Industries", value: 62000 },
  { name: "Krishna Electronics", value: 45000 },
];

const gstCollectionData = [
  { name: "Jan", cgst: 4050, sgst: 4050, igst: 8100 },
  { name: "Feb", cgst: 4680, sgst: 4680, igst: 9360 },
  { name: "Mar", cgst: 4320, sgst: 4320, igst: 8640 },
  { name: "Apr", cgst: 5490, sgst: 5490, igst: 10980 },
  { name: "May", cgst: 4950, sgst: 4950, igst: 9900 },
  { name: "Jun", cgst: 6030, sgst: 6030, igst: 12060 },
];

export default function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState("all");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTab, setSelectedTab] = useState("revenue");

  // Custom formatter for currency
  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Reports" showCreateInvoiceButton={false} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
              <div className="flex items-center space-x-2 mt-4 md:mt-0">
                <Select
                  value={reportPeriod}
                  onValueChange={setReportPeriod}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
                {reportPeriod === "custom" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
                <Button variant="outline">
                  <DownloadIcon className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="gst">GST</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <RevenueMetricsCard title="Total Revenue" value={798569} trend={12} />
                  <RevenueMetricsCard title="Total Invoices" value={368} trend={16} />
                  <RevenueMetricsCard title="Avg. Invoice Value" value={2169} trend={5} />
                  <RevenueMetricsCard title="Outstanding Amount" value={142350} trend={-8} trend_negative={true} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Revenue vs Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis
                              tickFormatter={(value) =>
                                new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  notation: "compact",
                                  compactDisplay: "short",
                                }).format(value)
                              }
                            />
                            <Tooltip
                              formatter={(value) => [
                                currencyFormatter.format(Number(value)),
                                "",
                              ]}
                              labelFormatter={(label) => `Month: ${label}`}
                            />
                            <Legend />
                            <Bar name="Revenue" dataKey="revenue" fill="#3f51b5" radius={[4, 4, 0, 0]} />
                            <Bar name="Expenses" dataKey="expenses" fill="#f50057" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Invoice Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={120}
                              innerRadius={60}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, ""]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="gst">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <GSTSummaryCard title="Total GST Collected" value={142920} icon="receipt" />
                  <GSTSummaryCard title="CGST" value={47640} icon="payments" />
                  <GSTSummaryCard title="SGST/IGST" value={95280} icon="account_balance" />
                </div>

                <Card className="shadow-sm mb-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">GST Collection Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={gstCollectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis
                            tickFormatter={(value) =>
                              new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                notation: "compact",
                                compactDisplay: "short",
                              }).format(value)
                            }
                          />
                          <Tooltip
                            formatter={(value) => [
                              currencyFormatter.format(Number(value)),
                              "",
                            ]}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="cgst" name="CGST" stroke="#3f51b5" activeDot={{ r: 8 }} />
                          <Line type="monotone" dataKey="sgst" name="SGST" stroke="#f50057" />
                          <Line type="monotone" dataKey="igst" name="IGST" stroke="#4caf50" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Top Customers by Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            layout="vertical"
                            data={topCustomersData}
                            margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis
                              type="number"
                              tickFormatter={(value) =>
                                new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                  notation: "compact",
                                  compactDisplay: "short",
                                }).format(value)
                              }
                            />
                            <YAxis type="category" dataKey="name" width={150} />
                            <Tooltip
                              formatter={(value) => [
                                currencyFormatter.format(Number(value)),
                                "Revenue",
                              ]}
                            />
                            <Bar dataKey="value" fill="#3f51b5" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Customer Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <CustomerStatCard title="Total Customers" value={156} change="23%" />
                        <CustomerStatCard title="New Customers (This Month)" value={12} change="8%" />
                        <CustomerStatCard title="Average Revenue per Customer" value="₹51,189" change="5%" />
                        <CustomerStatCard title="Customer Retention Rate" value="92%" change="3%" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="products">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { name: "Laptop", quantity: 45, revenue: 1980000 },
                          { name: "Desktop Computer", quantity: 38, revenue: 1425000 },
                          { name: "Printer", quantity: 32, revenue: 768000 },
                          { name: "Networking Equipment", quantity: 29, revenue: 580000 },
                          { name: "Software Licenses", quantity: 25, revenue: 375000 },
                        ].map((product, i) => (
                          <div key={i} className="flex items-center">
                            <div className="w-9 h-9 rounded-full bg-primary-50 text-primary flex items-center justify-center mr-3">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{product.name}</h4>
                                <span>{product.quantity} units</span>
                              </div>
                              <div className="mt-1 w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-primary h-2.5 rounded-full"
                                  style={{ width: `${100 - i * 15}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold">Product Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-4">
                        <ProductStatCard title="Total Products" value={52} />
                        <ProductStatCard title="Average Product Price" value="₹24,560" />
                        <ProductStatCard title="Total Product Categories" value={8} />
                        <ProductStatCard title="Products Added (This Month)" value={5} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

function RevenueMetricsCard({ title, value, trend, trend_negative = false }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <p className="text-2xl font-semibold text-gray-800 mt-1">
          {title.includes("Revenue") || title.includes("Amount") ? (
            new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(value)
          ) : (
            value.toLocaleString()
          )}
        </p>
        <div className="flex items-center mt-4">
          <span className={`flex items-center text-sm ${trend_negative ? "text-red-500" : "text-green-600"}`}>
            {trend_negative ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
              </svg>
            )}
            {Math.abs(trend)}%
          </span>
          <span className="text-gray-500 text-sm ml-1">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function GSTSummaryCard({ title, value, icon }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center mb-4">
          <div className={`p-3 rounded-full bg-blue-100 text-primary mr-4`}>
            {icon === "receipt" && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
                <path d="M16 8h-6" />
                <path d="M16 12h-6" />
                <path d="M16 16h-6" />
              </svg>
            )}
            {icon === "payments" && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            )}
            {icon === "account_balance" && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-2xl font-semibold text-gray-800">
          {new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(value)}
        </p>
        <div className="mt-4 text-sm text-gray-500">
          Based on all transactions
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerStatCard({ title, value, change }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex justify-between items-start">
        <h4 className="text-gray-600 text-sm">{title}</h4>
        {change && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            +{change}
          </span>
        )}
      </div>
      <p className="text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}

function ProductStatCard({ title, value }) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-gray-600 text-sm">{title}</h4>
      <p className="text-xl font-semibold mt-2">{value}</p>
    </div>
  );
}
