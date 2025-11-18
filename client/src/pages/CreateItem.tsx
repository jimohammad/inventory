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
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [defaultUnitPrice, setDefaultUnitPrice] = useState("");
  const [notes, setNotes] = useState("");

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
    
    if (!itemName.trim()) {
      toast.error("Item name is required");
      return;
    }

    createMutation.mutate({
      itemName: itemName.trim(),
      category: category.trim() || undefined,
      description: description.trim() || undefined,
      defaultUnitPrice: defaultUnitPrice.trim() || undefined,
      notes: notes.trim() || undefined,
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Item description"
              rows={3}
            />
          </div>

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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
