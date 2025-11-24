import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link, useLocation } from "wouter";
import { Plus, Search, Loader2, Pencil, Trash2, Package, Upload, TrendingUp, History, FolderOpen, AlertTriangle, DollarSign, TrendingDown } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ShareCatalogDialog } from "@/components/ShareCatalogDialog";
import { StockHistoryModal } from "@/components/StockHistoryModal";

export default function ItemList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [historyItem, setHistoryItem] = useState<{ id: number; name: string; code: string } | null>(null);

  const { data: items, isLoading } = trpc.items.list.useQuery();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.items.delete.useMutation({
    onSuccess: () => {
      toast.success("Item deleted successfully");
      utils.items.list.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.itemCode.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, typeof items> = {};
    filteredItems.forEach(item => {
      const category = item.category || "Uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });
    return grouped;
  }, [filteredItems]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 space-y-6 p-8">
      {/* Header with Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Items</h1>
        <p className="text-slate-400 mt-1">Manage your inventory items</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Items Card */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600" />
          
          {/* Icon Section */}
          <div className="relative p-8 flex items-center justify-center">
            <FolderOpen className="w-20 h-20 text-white/90" strokeWidth={1.5} />
          </div>
          
          {/* Content Section */}
          <div className="relative bg-white rounded-2xl p-6 space-y-1">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-medium text-slate-600">Total Items</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{items?.length || 0}</p>
          </div>
        </div>

        {/* Low Stock Items Card */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600" />
          
          {/* Icon Section */}
          <div className="relative p-8 flex items-center justify-center">
            <AlertTriangle className="w-20 h-20 text-white/90" strokeWidth={1.5} />
          </div>
          
          {/* Content Section */}
          <div className="relative bg-white rounded-2xl p-6 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-slate-600">Low Stock Items</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{items?.filter(item => (item.availableQty || 0) < 20).length || 0}</p>
          </div>
        </div>

        {/* Total Stock Value Card */}
        <div className="group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 via-emerald-400 to-teal-500" />
          
          {/* Icon Section */}
          <div className="relative p-8 flex items-center justify-center">
            <DollarSign className="w-20 h-20 text-white/90" strokeWidth={1.5} />
          </div>
          
          {/* Content Section */}
          <div className="relative bg-white rounded-2xl p-6 space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-sm font-medium text-slate-600">Total Stock Value</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              KWD {items?.reduce((sum: number, item: any) => {
                const price = parseFloat(item.purchasePrice || "0");
                const qty = item.availableQty || 0;
                return sum + (price * qty);
              }, 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-3 justify-end">
        <ShareCatalogDialog />
        <Link href="/items/bulk-price-update">
          <Button className="h-16 bg-gradient-to-br from-blue-200 to-blue-300 hover:from-blue-300 hover:to-blue-400 text-blue-900 border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <TrendingUp className="w-5 h-5 mr-2" />
            Bulk Price Update
          </Button>
        </Link>
        <Link href="/items/bulk-import">
          <Button className="h-16 bg-gradient-to-br from-teal-200 to-teal-300 hover:from-teal-300 hover:to-teal-400 text-teal-900 border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <Upload className="w-5 h-5 mr-2" />
            Bulk Import
          </Button>
        </Link>
        <Link href="/items/bulk-opening-stock">
          <Button className="h-16 bg-gradient-to-br from-orange-200 to-orange-300 hover:from-orange-300 hover:to-orange-400 text-orange-900 border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <Upload className="w-5 h-5 mr-2" />
            Opening Stock
          </Button>
        </Link>
        <Link href="/items/import">
          <Button className="h-16 bg-gradient-to-br from-cyan-200 to-cyan-300 hover:from-cyan-300 hover:to-cyan-400 text-cyan-900 border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <Upload className="w-5 h-5 mr-2" />
            Import Stock
          </Button>
        </Link>
        <Link href="/items/new">
          <Button className="h-16 bg-gradient-to-br from-pink-200 to-pink-300 hover:from-pink-300 hover:to-pink-400 text-pink-900 border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </Button>
        </Link>
      </div>

      {/* Search Field */}
      <div className="relative w-full">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-emerald-400" />
          <Input
            placeholder="Search items by name, code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-16 pl-16 pr-8 text-xl font-medium bg-slate-900/95 border-2 border-emerald-500 rounded-2xl placeholder:text-slate-500 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Autocomplete Dropdown */}
        {searchQuery.trim() && filteredItems.length > 0 && (
          <div className="absolute z-50 w-full mt-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="max-h-96 overflow-y-auto">
              {filteredItems.slice(0, 6).map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    const element = document.getElementById(`item-${item.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element?.classList.add('ring-4', 'ring-teal-500', 'ring-opacity-50');
                    setTimeout(() => {
                      element?.classList.remove('ring-4', 'ring-teal-500', 'ring-opacity-50');
                    }, 2000);
                  }}
                  className="w-full px-6 py-4 text-left hover:bg-teal-50 dark:hover:bg-slate-800 transition-all duration-200 border-b border-slate-100 dark:border-slate-800 last:border-b-0 group/item"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover/item:text-teal-600 dark:group-hover/item:text-emerald-400 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                        <span className="font-mono">{item.itemCode}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-xl font-bold text-teal-600 dark:text-emerald-400">
                        KWD {parseFloat(item.wholesalePrice || "0").toFixed(3)}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {item.availableQty} units
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {filteredItems.length > 6 && (
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 text-center text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                +{filteredItems.length - 6} more items found
              </div>
            )}
          </div>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No items found matching your search" : "No items yet"}
            </p>
            {!searchQuery && (
              <Link href="/items/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Item
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(itemsByCategory).map(([category, categoryItems]) => categoryItems && (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white">
                <Badge variant="outline" className="text-base border-emerald-500 text-emerald-400">{category}</Badge>
                <span className="text-sm text-slate-400">({categoryItems.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((item) => (
                  <Card key={item.id} id={`item-${item.id}`} className="transition-all duration-300 relative bg-slate-800/50 backdrop-blur-sm border-2 border-slate-700 hover:border-slate-600 hover:shadow-lg">
                    <CardHeader className="pt-3 pb-2">
                      <CardTitle className="text-base text-white">{item.name}</CardTitle>
                      {item.category && (
                        <CardDescription className="text-slate-400">
                          {item.category}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="space-y-1.5">
                        {item.itemCode && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Code</span>
                            <span className="font-mono text-slate-300">{item.itemCode}</span>
                          </div>
                        )}
                        {item.wholesalePrice && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Wholesale Price</span>
                            <span className="font-medium text-emerald-400">KWD {parseFloat(item.wholesalePrice.toString()).toFixed(3)}</span>
                          </div>
                        )}
                        {item.retailPrice && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Retail Price</span>
                            <span className="font-medium text-amber-400">KWD {parseFloat(item.retailPrice.toString()).toFixed(3)}</span>
                          </div>
                        )}
                        {item.purchasePrice && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Purchase Price</span>
                            <span className="font-medium text-blue-400">KWD {parseFloat(item.purchasePrice.toString()).toFixed(3)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Available</span>
                          <span className="font-semibold text-emerald-400">{item.availableQty || 0} pcs</span>
                        </div>
                        
                        {/* Sales Velocity Section */}
                        <div className="pt-2 mt-2 border-t border-slate-700">
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="text-xs">
                              <div className="text-slate-400 mb-0.5">Last Sold</div>
                              <div className="font-medium text-emerald-400">
                                {item.lastSoldDate 
                                  ? `${Math.floor((Date.now() - new Date(item.lastSoldDate).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                                  : 'Never'}
                              </div>
                            </div>
                            <div className="text-xs">
                              <div className="text-slate-400 mb-0.5">Sales Velocity</div>
                              <div className="font-medium text-emerald-400">
                                {(item as any).salesVelocity || 0} units/week
                              </div>
                            </div>
                          </div>
                          
                          {/* Velocity Status Bar */}
                          <div className="space-y-1">
                            <div className="text-xs text-slate-400">Velocity Status</div>
                            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-emerald-500 transition-all"
                                style={{ width: (item as any).velocityStatus === 'fast' ? '60%' : '0%' }}
                              />
                              <div 
                                className="h-full bg-yellow-500 transition-all"
                                style={{ width: (item as any).velocityStatus === 'moderate' ? '30%' : '0%' }}
                              />
                              <div 
                                className="h-full bg-red-500 transition-all"
                                style={{ width: (item as any).velocityStatus === 'slow' ? '10%' : '0%' }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px]">
                              <span className="text-emerald-400">Fast (&gt;3/wk)</span>
                              <span className="text-yellow-400">Moderate (1-3/wk)</span>
                              <span className="text-red-400">Slow (&lt;1/wk)</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Icons at Bottom */}
                        <div className="flex items-center justify-center gap-3 pt-3 mt-3 border-t border-slate-700">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setHistoryItem({ id: item.id, name: item.name, code: item.itemCode })}
                            className="h-10 w-10 bg-black hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 rounded-md transition-all"
                            title="View stock history"
                          >
                            <History className="w-5 h-5" />
                          </Button>
                          <Link href={`/items/${item.id}/edit`}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 bg-black hover:bg-slate-900 text-blue-400 hover:text-blue-300 rounded-md transition-all"
                            >
                              <Pencil className="w-5 h-5" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
                            className="h-10 w-10 bg-black hover:bg-slate-900 text-red-400 hover:text-red-300 rounded-md transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {historyItem && (
        <StockHistoryModal
          isOpen={true}
          onClose={() => setHistoryItem(null)}
          itemId={historyItem.id}
          itemName={historyItem.name}
          itemCode={historyItem.code}
        />
      )}
    </div>
  );
}
