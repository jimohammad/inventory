import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateItem() {
  const [, setLocation] = useLocation();
  const [itemCode, setItemCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [availableQty, setAvailableQty] = useState("0");

  const createMutation = trpc.items.create.useMutation({
    onSuccess: () => {
      toast.success("Item created successfully");
      setLocation("/items");
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
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
    
    createMutation.mutate({
      itemCode: itemCode.trim(),
      name: name.trim(),
      category: category.trim() || undefined,
      defaultPrice: defaultPrice ? parseInt(defaultPrice) : undefined,
      purchasePrice: purchasePrice ? parseInt(purchasePrice) : undefined,
      availableQty: parseInt(availableQty) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => setLocation("/items")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Item</h1>
            <p className="text-muted-foreground mt-1">Create a new inventory item</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation("/items")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Item"}
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
                placeholder="Enter item name"
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
