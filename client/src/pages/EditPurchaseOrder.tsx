import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

type Item = {
  itemName: string;
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
};

export default function EditPurchaseOrder() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [poNumber, setPoNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [currency, setCurrency] = useState<"USD" | "AED">("USD");
  const [exchangeRate, setExchangeRate] = useState("1.0");
  const [orderDate, setOrderDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "confirmed" | "completed" | "cancelled">("draft");
  const [items, setItems] = useState<Item[]>([
    { itemName: "", description: "", quantity: "1", unitPrice: "0", totalPrice: "0" }
  ]);

  const { data: order, isLoading } = trpc.purchaseOrders.getById.useQuery({ id: parseInt(id!) });
  
  useEffect(() => {
    if (order) {
      setPoNumber(order.poNumber);
      setSupplier(order.supplier);
      setCurrency(order.currency);
      setExchangeRate(order.exchangeRate);
      setOrderDate(new Date(order.orderDate).toISOString().split("T")[0]);
      setNotes(order.notes || "");
      setStatus(order.status);
      
      if (order.items && order.items.length > 0) {
        setItems(order.items.map(item => ({
          itemName: item.itemName,
          description: item.description || "",
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })));
      }
    }
  }, [order]);

  const updateMutation = trpc.purchaseOrders.update.useMutation({
    onSuccess: () => {
      toast.success("Purchase order updated successfully");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const addItem = () => {
    setItems([...items, { itemName: "", description: "", quantity: "1", unitPrice: "0", totalPrice: "0" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].totalPrice = (qty * price).toFixed(2);
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0).toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!poNumber.trim() || !supplier.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (items.some(item => !item.itemName.trim())) {
      toast.error("All items must have a name");
      return;
    }

    updateMutation.mutate({
      id: parseInt(id!),
      poNumber,
      supplier,
      currency,
      exchangeRate,
      totalAmount: calculateTotal(),
      notes: notes.trim() || undefined,
      status,
      orderDate: new Date(orderDate),
      items: items.map(item => ({
        itemName: item.itemName,
        description: item.description.trim() || undefined,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Purchase order not found</p>
        <Button onClick={() => setLocation("/")} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Purchase Order</h1>
          <p className="text-muted-foreground mt-1">Update purchase order details</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation("/")}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Purchase Order"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poNumber">PO Number *</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => setCurrency(v as "USD" | "AED")}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">Exchange Rate</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Item {index + 1}</span>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Item Name *</Label>
                  <Input
                    value={item.itemName}
                    onChange={(e) => updateItem(index, "itemName", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.totalPrice}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4 border-t">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">
                {currency} {parseFloat(calculateTotal()).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
