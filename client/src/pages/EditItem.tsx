import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function EditItem() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [availableQty, setAvailableQty] = useState("0");

  const { data: item, isLoading } = trpc.items.getById.useQuery({ id: parseInt(id!) });

  useEffect(() => {
    if (item) {
      setItemCode(item.itemCode || "");
      setName(item.name);
      setCategory(item.category || "");
      setDefaultPrice(item.defaultPrice?.toString() || "");
      setPurchasePrice(item.purchasePrice?.toString() || "");
      setAvailableQty(item.availableQty?.toString() || "0");
    }
  }, [item]);

  const updateMutation = trpc.items.update.useMutation({
    onSuccess: () => {
      toast.success("Item updated successfully");
      setLocation("/items");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Item name is required");
      return;
    }
    
    if (!itemCode.trim()) {
      toast.error("Item code is required");
      return;
    }
    
    updateMutation.mutate({
      id: parseInt(id!),
      itemCode: itemCode.trim(),
      name: name.trim(),
      category: category.trim() || undefined,
      defaultPrice: defaultPrice ? parseInt(defaultPrice) : undefined,
      purchasePrice: purchasePrice ? parseInt(purchasePrice) : undefined,
      availableQty: parseInt(availableQty) || 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Item not found</p>
        <Button onClick={() => setLocation("/items")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => setLocation("/items")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Item</h1>
            <p className="text-muted-foreground mt-1">Update item information</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation("/items")}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code</Label>
              <Input
                id="itemCode"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g., ITM-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Electronics, Office Supplies"
              />
            </div>
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Default Price</Label>
              <Input
                id="defaultPrice"
                type="number"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                placeholder="e.g., 100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g., 80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="availableQty">Available Quantity</Label>
              <Input
                id="availableQty"
                type="number"
                min="0"
                value={availableQty}
                onChange={(e) => setAvailableQty(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>


        </CardContent>
      </Card>
    </form>
  );
}
