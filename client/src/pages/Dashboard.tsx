import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, Search, Loader2, Eye, Calendar, Building2, FileText, Banknote } from "lucide-react";
import { useState, useMemo } from "react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: orders, isLoading } = trpc.purchaseOrders.list.useQuery(undefined, {
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => {
      // Search by PO number
      if (order.poNumber.toLowerCase().includes(query)) return true;
      // Search by supplier
      if (order.supplier.toLowerCase().includes(query)) return true;
      // Search by supplier invoice
      if (order.supplierInvoiceNumber?.toLowerCase().includes(query)) return true;
      // Search by date
      if (new Date(order.orderDate).toLocaleDateString().includes(query)) return true;
      // Search by items
      if ((order as any).items?.some((item: any) => item.itemName.toLowerCase().includes(query))) return true;
      
      return false;
    });
  }, [orders, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "confirmed": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const calculateKWDAmount = (amount: string, exchangeRateKWD?: string | null) => {
    if (!exchangeRateKWD) return null;
    const total = parseFloat(amount);
    const rate = parseFloat(exchangeRateKWD);
    return (total * rate).toFixed(3);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of all purchase orders</p>
        </div>
        <Link href="/purchase-orders/new">
          <Button size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Purchase Order
          </Button>
        </Link>
      </div>

      {/* Enhanced Search */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <Input
              placeholder="Search by item, supplier, date, or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Orders</CardDescription>
            <CardTitle className="text-3xl">{orders?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draft</CardDescription>
            <CardTitle className="text-3xl">
              {orders?.filter(o => o.status === "draft").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-3xl">
              {orders?.filter(o => o.status === "confirmed").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {orders?.filter(o => o.status === "completed").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Low Stock & Profit Margin Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LowStockWidget />
        <ProfitMarginWidget />
      </div>

      {/* Purchase Order Cards */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No purchase orders found matching your search" : "No purchase orders yet"}
            </p>
            {!searchQuery && (
              <Link href="/purchase-orders/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Purchase Order
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const kwdAmount = calculateKWDAmount(order.totalAmount, order.exchangeRateKWD);
            
            return (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{order.poNumber}</CardTitle>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {order.supplier}
                      </CardDescription>
                    </div>
                    <Link href={`/purchase-orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Order Date
                      </div>
                      <div className="font-medium">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {order.supplierInvoiceNumber && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Invoice #
                        </div>
                        <div className="font-medium">{order.supplierInvoiceNumber}</div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Banknote className="w-3 h-3" />
                        Amount
                      </div>
                      <div className="font-bold text-lg">
                        {order.currency} {parseFloat(order.totalAmount).toLocaleString()}
                      </div>
                    </div>
                    
                    {kwdAmount && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Amount in KWD</div>
                        <div className="font-bold text-lg text-green-600">
                          KWD {parseFloat(kwdAmount).toLocaleString()}
                        </div>
                      </div>
                    )}
                    
                    {order.bankName && (
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Bank</div>
                        <div className="font-medium text-sm">
                          {order.bankName === "National Bank of Kuwait" ? "NBK" : "CBK"}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {(order as any).items && (order as any).items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground mb-2">
                        Items ({(order as any).items.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(order as any).items.slice(0, 3).map((item: any, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {item.itemName}
                          </Badge>
                        ))}
                        {(order as any).items.length > 3 && (
                          <Badge variant="outline">+{(order as any).items.length - 3} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LowStockWidget() {
  const { data: lowStockItems, isLoading } = trpc.items.lowStock.useQuery({ threshold: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-red-500">⚠️</span>
          Low Stock Alert
        </CardTitle>
        <CardDescription>Items running low on inventory</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !lowStockItems || lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            All items are well stocked
          </p>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.itemCode} • {item.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-600">{item.availableQty} left</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfitMarginWidget() {
  const { data: margins, isLoading } = trpc.items.profitMargins.useQuery();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-green-500">💰</span>
          Profit Margins
        </CardTitle>
        <CardDescription>Top & low margin items</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !margins || (margins.topMargins.length === 0 && margins.lowMargins.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No profit margin data available
          </p>
        ) : (
          <div className="space-y-4">
            {margins.topMargins.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-green-600">Highest Margins</h4>
                <div className="space-y-2">
                  {margins.topMargins.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.itemCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{item.marginPercent}%</div>
                        <div className="text-xs text-muted-foreground">KWD {item.margin.toFixed(3)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {margins.lowMargins.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-orange-600">Lowest Margins</h4>
                <div className="space-y-2">
                  {margins.lowMargins.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.itemCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-orange-600">{item.marginPercent}%</div>
                        <div className="text-xs text-muted-foreground">KWD {item.margin.toFixed(3)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
