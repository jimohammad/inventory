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
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [defaultUnitPrice, setDefaultUnitPrice] = useState("");
  const [availableQty, setAvailableQty] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: item, isLoading } = trpc.items.getById.useQuery({ id: parseInt(id!) });

  useEffect(() => {
    if (item) {
      setItemCode(item.itemCode || "");
      setItemName(item.itemName);
      setCategory(item.category || "");
      setDescription(item.description || "");
      setDefaultUnitPrice(item.defaultUnitPrice || "");
      setAvailableQty(item.availableQty?.toString() || "0");
      setNotes(item.notes || "");
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
    
    if (!itemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    updateMutation.mutate({
      id: parseInt(id!),
      itemCode: itemCode.trim() || undefined,
      itemName: itemName.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      defaultUnitPrice: defaultUnitPrice.trim() || undefined,
      availableQty: parseInt(availableQty) || 0,
      notes: notes.trim() || undefined,
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
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultUnitPrice">Default Unit Price</Label>
              <Input
                id="defaultUnitPrice"
                value={defaultUnitPrice}
                onChange={(e) => setDefaultUnitPrice(e.target.value)}
                placeholder="e.g., 100.00"
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
