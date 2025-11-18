import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, Search, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
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

export default function PurchaseOrderList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const { data: orders, isLoading, refetch } = trpc.purchaseOrders.list.useQuery();
  const deleteMutation = trpc.purchaseOrders.delete.useMutation({
    onSuccess: () => {
      toast.success("Purchase order deleted successfully");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => 
      order.poNumber.toLowerCase().includes(query) ||
      order.supplier.toLowerCase().includes(query)
    );
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
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage your purchase order records</p>
        </div>
        <Link href="/purchase-orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Purchase Order
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by PO number or supplier..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

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
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {order.poNumber}
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{order.supplier}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {order.currency} {parseFloat(order.totalAmount).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rate: {parseFloat(order.exchangeRate).toFixed(4)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Order Date: {new Date(order.orderDate).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/purchase-orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/purchase-orders/${order.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(order.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this purchase order and all associated items and documents.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
