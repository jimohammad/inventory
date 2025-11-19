import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus, Search, Pencil, Trash2, Loader2, Mail, Phone, MapPin } from "lucide-react";
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

export default function SupplierList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const { data: suppliers, isLoading, refetch } = trpc.suppliers.list.useQuery();
  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("Supplier deleted successfully");
      refetch();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!searchQuery.trim()) return suppliers;
    
    const query = searchQuery.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(query) ||
      supplier.email?.toLowerCase().includes(query) ||
      supplier.phone?.toLowerCase().includes(query)
    );
  }, [suppliers, searchQuery]);

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
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage your supplier contacts</p>
        </div>
        <Link href="/suppliers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Supplier
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "No suppliers found matching your search" : "No suppliers yet"}
            </p>
            {!searchQuery && (
              <Link href="/suppliers/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Supplier
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSuppliers.map((supplier) => (
            <Link key={supplier.id} href={`/suppliers/${supplier.id}`}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{supplier.name}</CardTitle>
                    {supplier.contactPerson && (
                      <CardDescription className="mt-1">
                        Contact: {supplier.contactPerson}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/suppliers/${supplier.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(supplier.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${supplier.email}`} className="hover:underline">
                      {supplier.email}
                    </a>
                  </div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${supplier.phone}`} className="hover:underline">
                      {supplier.phone}
                    </a>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{supplier.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this supplier. This action cannot be undone.
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
