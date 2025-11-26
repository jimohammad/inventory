import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [category, setCategory] = useState<"Motorola" | "Samsung" | "Redmi" | "Realme" | "Meizu" | "Honor" | "">("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [foreignCurrency, setForeignCurrency] = useState<"AED" | "USD" | "">("");
  const [foreignCurrencyPrice, setForeignCurrencyPrice] = useState("");
  const [availableQty, setAvailableQty] = useState("0");
  const [openingStock, setOpeningStock] = useState("0");
  
  // Validation errors
  const [errors, setErrors] = useState({
    itemCode: "",
    name: "",
    category: "",
  });

  const { data: item, isLoading } = trpc.items.getById.useQuery({ id: parseInt(id!) });

  useEffect(() => {
    if (item) {
      setItemCode(item.itemCode || "");
      setName(item.name);
      // Capitalize first letter of category to match dropdown options
      const categoryValue = item.category 
        ? (item.category.charAt(0).toUpperCase() + item.category.slice(1)) as typeof category
        : "";
      setCategory(categoryValue);
      setWholesalePrice(item.wholesalePrice?.toString() || "");
      setRetailPrice(item.retailPrice?.toString() || "");
      setPurchasePrice(item.purchasePrice?.toString() || "");
      setForeignCurrency((item.foreignCurrency as typeof foreignCurrency) || "");
      setForeignCurrencyPrice(item.foreignCurrencyPrice?.toString() || "");
      setAvailableQty(item.availableQty?.toString() || "0");
      setOpeningStock(item.openingStock?.toString() || "0");
      // Clear all errors when item loads
      setErrors({ itemCode: "", name: "", category: "" });
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

  const validateItemCode = (value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, itemCode: "Item code is required" }));
      return false;
    }
    setErrors(prev => ({ ...prev, itemCode: "" }));
    return true;
  };

  const validateName = (value: string) => {
    if (!value.trim()) {
      setErrors(prev => ({ ...prev, name: "Item name is required" }));
      return false;
    }
    setErrors(prev => ({ ...prev, name: "" }));
    return true;
  };

  const validateCategory = (value: string) => {
    if (!value || value === "") {
      setErrors(prev => ({ ...prev, category: "Category is required" }));
      return false;
    }
    setErrors(prev => ({ ...prev, category: "" }));
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isItemCodeValid = validateItemCode(itemCode);
    const isNameValid = validateName(name);
    const isCategoryValid = validateCategory(category);
    
    if (!isItemCodeValid || !isNameValid || !isCategoryValid) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    updateMutation.mutate({
      id: parseInt(id!),
      itemCode: itemCode.trim(),
      name: name.trim(),
      category: category || undefined,
      wholesalePrice: wholesalePrice || undefined,
      retailPrice: retailPrice || undefined,
      purchasePrice: purchasePrice || undefined,
      foreignCurrency: foreignCurrency ? (foreignCurrency as "AED" | "USD") : undefined,
      foreignCurrencyPrice: foreignCurrencyPrice || undefined,
      availableQty: parseInt(availableQty) || 0,
      openingStock: parseInt(openingStock) || 0,
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
              <Label htmlFor="itemCode" className="flex items-center gap-1">
                Item Code
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="itemCode"
                value={itemCode}
                onChange={(e) => {
                  setItemCode(e.target.value);
                  validateItemCode(e.target.value);
                }}
                onBlur={() => validateItemCode(itemCode)}
                placeholder="e.g., ITM-001"
                className={errors.itemCode ? "border-red-500" : ""}
              />
              {errors.itemCode && (
                <p className="text-xs text-red-500">{errors.itemCode}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                Item Name
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  validateName(e.target.value);
                }}
                onBlur={() => validateName(name)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="flex items-center gap-1">
                Category
                <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={category} 
                onValueChange={(value) => {
                  setCategory(value as typeof category);
                  setErrors(prev => ({ ...prev, category: "" }));
                }}
              >
                <SelectTrigger 
                  id="category"
                  className={errors.category ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Motorola">Motorola</SelectItem>
                  <SelectItem value="Samsung">Samsung</SelectItem>
                  <SelectItem value="Redmi">Redmi</SelectItem>
                  <SelectItem value="Realme">Realme</SelectItem>
                  <SelectItem value="Meizu">Meizu</SelectItem>
                  <SelectItem value="Honor">Honor</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && !category && (
                <p className="text-xs text-red-500">{errors.category}</p>
              )}
            </div>
          </div>



          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="wholesalePrice">Wholesale Price</Label>
              <Input
                id="wholesalePrice"
                type="number"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
                placeholder="e.g., 100"
              />
              <p className="text-xs text-muted-foreground">Price for wholesale customers</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="retailPrice">Retail Shop Price</Label>
              <Input
                id="retailPrice"
                type="number"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
                placeholder="e.g., 120"
              />
              <p className="text-xs text-muted-foreground">Price for retail shops</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (Local Currency)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.001"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g., 80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="foreignCurrency">Foreign Currency</Label>
              <Select 
                value={foreignCurrency} 
                onValueChange={(value) => setForeignCurrency(value as typeof foreignCurrency)}
              >
                <SelectTrigger id="foreignCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AED">AED (UAE Dirham)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Currency used for purchase</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="foreignCurrencyPrice">Foreign Currency Price</Label>
              <Input
                id="foreignCurrencyPrice"
                type="number"
                step="0.001"
                value={foreignCurrencyPrice}
                onChange={(e) => setForeignCurrencyPrice(e.target.value)}
                placeholder="e.g., 20.5"
                disabled={!foreignCurrency}
              />
              <p className="text-xs text-muted-foreground">Price in {foreignCurrency || "foreign currency"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <p className="text-xs text-muted-foreground">Current stock on hand (updates with sales/purchases)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingStock">Opening Stock</Label>
              <Input
                id="openingStock"
                type="number"
                min="0"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Initial quantity when first added (for historical reference)</p>
            </div>
          </div>


        </CardContent>
      </Card>
    </form>
  );
}
