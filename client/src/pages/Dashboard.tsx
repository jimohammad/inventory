import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: lowStockItems = [] } = trpc.items.lowStock.useQuery({});
  const { data: margins } = trpc.items.profitMargins.useQuery();
  const { data: items = [] } = trpc.items.list.useQuery();

  return (
    <div className="space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your inventory and items</p>
        </div>
        <Link href="/items/new">
          <Button size="lg">
            <Package className="w-5 h-5 mr-2" />
            Add New Item
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Items</CardDescription>
            <CardTitle className="text-3xl">{items.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="text-3xl text-red-600">{lowStockItems.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Stock Value</CardDescription>
            <CardTitle className="text-3xl">
              KWD {items.reduce((sum: number, item: any) => {
                const price = parseFloat(item.sellingPrice || "0");
                const qty = item.availableQty || 0;
                return sum + (price * qty);
              }, 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Low Stock Alert & Profit Margins */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alert */}
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle>Low Stock Alert</CardTitle>
            </div>
            <CardDescription>Items running low on inventory</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All items are well stocked
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.itemCode} • {item.category}</div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-red-600">{item.availableQty} left</div>
                      <div className="text-xs text-muted-foreground">Low stock</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Margins */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <CardTitle>Profit Margins</CardTitle>
            </div>
            <CardDescription>Top & low margin items</CardDescription>
          </CardHeader>
          <CardContent>
            {margins && (
              <div className="space-y-4">
                {/* Highest Margins */}
                <div>
                  <div className="text-sm font-medium text-green-600 mb-2">Highest Margins</div>
                  <div className="space-y-2">
                    {margins.topMargins.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.itemCode}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-green-600">{item.marginPercent}</div>
                          <div className="text-xs text-muted-foreground">KWD {item.marginAmount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lowest Margins */}
                <div>
                  <div className="text-sm font-medium text-orange-600 mb-2">Lowest Margins</div>
                  <div className="space-y-2">
                    {margins.lowMargins.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-orange-50 rounded border border-orange-200">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.itemCode}</div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="font-bold text-orange-600">{item.marginPercent}</div>
                          <div className="text-xs text-muted-foreground">KWD {item.marginAmount}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Link href="/items/new">
              <Button variant="outline" className="w-full justify-start">
                <Package className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </Link>
            <Link href="/items/bulk-import">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                Bulk Import
              </Button>
            </Link>
            <Link href="/items/bulk-price-update">
              <Button variant="outline" className="w-full justify-start">
                <TrendingDown className="w-4 h-4 mr-2" />
                Update Prices
              </Button>
            </Link>
            <Link href="/inventory-analysis">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analysis
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
