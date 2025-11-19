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
import { Plus, Search, Loader2, Pencil, Trash2, Package, Upload } from "lucide-react";
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

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-[25px] h-14"
          />
        </div>
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
                  <Card key={item.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      {item.category && (
                        <CardDescription>
                          {item.category}
                        </CardDescription>
                      )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {item.itemCode && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Code</span>
                            <span className="font-mono text-xs">{item.itemCode}</span>
                          </div>
                        )}
                        {item.sellingPrice && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Selling Price</span>
                            <span className="font-medium">{item.sellingPrice}</span>
                          </div>
                        )}
                        {item.purchasePrice && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Purchase Price</span>
                            <span className="font-medium">{item.purchasePrice}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Available</span>
                          <span className="font-semibold text-primary">{item.availableQty || 0} pcs</span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Link href={`/items/${item.id}/edit`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <Pencil className="w-3 h-3 mr-2" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteId(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
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
    </div>
  );
}
