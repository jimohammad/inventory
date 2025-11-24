import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, TrendingDown, TrendingUp, AlertTriangle, Search, FolderOpen, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

export default function Dashboard() {
  const { data: lowStockItems = [] } = trpc.items.lowStock.useQuery({});
  const { data: margins } = trpc.items.profitMargins.useQuery();
  const { data: items = [] } = trpc.items.list.useQuery();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !items) return [];
    const query = searchQuery.toLowerCase();
    return items
      .filter((item: any) => 
        item.name.toLowerCase().includes(query) ||
        item.itemCode.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [searchQuery, items]);

  return (
    <div className="min-h-screen bg-slate-950 space-y-8 p-8">
      {/* Header */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Inventory Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your inventory and items</p>
        </div>

        {/* Prominent Search Field */}
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
            <Input
              type="text"
              placeholder="Search items by name, code, or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="h-16 pl-14 pr-6 text-xl font-medium bg-slate-800 border-slate-700 text-emerald-400 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && searchQuery.trim() && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
              {searchResults.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setLocation(`/items`);
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-base font-semibold text-emerald-400">{item.name}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {item.itemCode} • {item.category}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-base font-bold text-emerald-400">
                        KWD {parseFloat(item.wholesalePrice || item.retailPrice || "0").toFixed(3)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.availableQty} units
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4">
              <p className="text-slate-400 text-center">No items found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>



      {/* Low Stock Alert & Profit Margins */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Low Stock Alert */}
        <Card className="border-red-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/10 hover:border-red-500/40">
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
                {lowStockItems.map((item: any) => {
                  const calculateAging = () => {
                    if (!item.lastSoldDate) return { days: null, label: "Never Sold", color: "text-slate-500" };
                    const lastSold = new Date(item.lastSoldDate);
                    const today = new Date();
                    const diffTime = Math.abs(today.getTime() - lastSold.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 30) return { days: diffDays, label: `${diffDays}d ago`, color: "text-green-600" };
                    if (diffDays < 60) return { days: diffDays, label: `${diffDays}d ago`, color: "text-yellow-600" };
                    return { days: diffDays, label: `${diffDays}d ago`, color: "text-red-600" };
                  };
                  const aging = calculateAging();
                  
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.itemCode} • {item.category}</div>
                      </div>
                      <div className="text-right ml-4 space-y-1">
                        <div className="font-bold text-red-600">{item.availableQty} left</div>
                        <div className={`text-xs font-semibold ${aging.color}`}>{aging.label}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Margins */}
        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30">
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
