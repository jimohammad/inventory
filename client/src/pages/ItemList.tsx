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
import { Plus, Search, Loader2, Pencil, Trash2, Package, Upload, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ShareCatalogDialog } from "@/components/ShareCatalogDialog";

export default function ItemList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground mt-1">Manage your inventory items</p>
        </div>
        <div className="flex gap-2">
          <ShareCatalogDialog />
          <Link href="/items/bulk-price-update">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Bulk Price Update
            </Button>
          </Link>
          <Link href="/items/bulk-import">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
          </Link>
          <Link href="/items/bulk-opening-stock">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Bulk Opening Stock
            </Button>
          </Link>
          <Link href="/items/import">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import Stock
            </Button>
          </Link>
          <Link href="/items/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Field */}
      <div className="relative max-w-4xl mx-auto">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-7 h-7 text-emerald-400" />
          <Input
            placeholder="Search items by name, code, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-20 pl-16 pr-8 text-2xl font-bold bg-slate-900/95 border-2 border-emerald-500 rounded-2xl placeholder:text-slate-500 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                        KWD {parseFloat(item.sellingPrice || "0").toFixed(3)}
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
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-base">{category}</Badge>
                <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((item) => (
                  <Card key={item.id} id={`item-${item.id}`} className="transition-all duration-300 relative">
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <Link href={`/items/${item.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-800">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(item.id)}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <CardHeader className="pt-3 pb-2">
                      <CardTitle className="text-base pr-16">{item.name}</CardTitle>
                      {item.category && (
                        <CardDescription>
                          {item.category}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <div className="space-y-1.5">
                        {item.itemCode && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Code</span>
                            <span className="font-mono">{item.itemCode}</span>
                          </div>
                        )}
                        {item.sellingPrice && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Selling Price</span>
                            <span className="font-medium">KWD {parseFloat(item.sellingPrice.toString()).toFixed(3)}</span>
                          </div>
                        )}
                        {item.purchasePrice && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Purchase Price</span>
                            <span className="font-medium">KWD {parseFloat(item.purchasePrice.toString()).toFixed(3)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-semibold text-primary">{item.availableQty || 0} pcs</span>
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
    </div>
  );
}
