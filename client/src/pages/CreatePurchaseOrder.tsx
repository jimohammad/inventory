import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Upload, X } from "lucide-react";


type Item = {
  itemName: string;
  description: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
};

type DocumentUpload = {
  file: File;
  type: "delivery_note" | "invoice" | "payment_tt";
  preview: string;
};

export default function CreatePurchaseOrder() {
  const [, setLocation] = useLocation();
  const [poNumber, setPoNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [currency, setCurrency] = useState<"USD" | "AED" | "KWD">("USD");
  const [exchangeRateKWD, setExchangeRateKWD] = useState("1.0");
  const [bankName, setBankName] = useState<"National Bank of Kuwait" | "Commercial Bank of Kuwait" | "">("");
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [exchangeRate, setExchangeRate] = useState("1.0");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "confirmed" | "completed" | "cancelled">("draft");
  const [items, setItems] = useState<Item[]>([
    { itemName: "", description: "", quantity: "1", unitPrice: "0", totalPrice: "0" }
  ]);
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);

  const createMutation = trpc.purchaseOrders.create.useMutation({
    onSuccess: async (data) => {
      // Upload documents if any
      if (documents.length > 0) {
        for (const doc of documents) {
          try {
            const formData = new FormData();
            const randomSuffix = Math.random().toString(36).substring(7);
            const fileKey = `po-${data.id}/documents/${doc.type}-${randomSuffix}-${doc.file.name}`;
            
            formData.append("file", doc.file);
            formData.append("fileKey", fileKey);
            formData.append("contentType", doc.file.type);
            
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            });
            
            if (!uploadRes.ok) {
              throw new Error("Upload failed");
            }
            
            const { url } = await uploadRes.json();
            
            await utils.client.documents.upload.mutate({
              purchaseOrderId: data.id,
              documentType: doc.type,
              fileName: doc.file.name,
              fileUrl: url,
              fileKey: fileKey,
              mimeType: doc.file.type,
              fileSize: doc.file.size,
            });
          } catch (error) {
            console.error("Failed to upload document:", error);
            toast.error(`Failed to upload ${doc.file.name}`);
          }
        }
      }
      
      toast.success("Purchase order created successfully");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const utils = trpc.useUtils();
  const { data: suppliers } = trpc.suppliers.list.useQuery();

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
    
    // Auto-calculate total price
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "delivery_note" | "invoice" | "payment_tt") => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 16 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 16MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setDocuments(prev => [...prev, {
          file,
          type,
          preview: e.target?.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeDocument = (index: number) => {
    setDocuments(docs => docs.filter((_, i) => i !== index));
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

    createMutation.mutate({
      poNumber,
      supplier,
      supplierInvoiceNumber: supplierInvoiceNumber.trim() || undefined,
      currency,
      exchangeRate,
      exchangeRateKWD: exchangeRateKWD || undefined,
      totalAmount: calculateTotal(),
      bankName: bankName || undefined,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Purchase Order</h1>
          <p className="text-muted-foreground mt-1">Add a new purchase order record</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation("/")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Purchase Order"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplierInvoiceNumber">Supplier Invoice Number</Label>
            <Input
              id="supplierInvoiceNumber"
              value={supplierInvoiceNumber}
              onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
              placeholder="INV-2024-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Select value={bankName} onValueChange={(value) => setBankName(value as typeof bankName)}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="National Bank of Kuwait">National Bank of Kuwait</SelectItem>
                <SelectItem value="Commercial Bank of Kuwait">Commercial Bank of Kuwait</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="poNumber"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="PO-2024-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedSupplierId}
                  onValueChange={(value) => {
                    setSelectedSupplierId(value);
                    const selected = suppliers?.find(s => s.id.toString() === value);
                    if (selected) {
                      setSupplier(selected.name);
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(e) => {
                    setSupplier(e.target.value);
                    setSelectedSupplierId("");
                  }}
                  placeholder="Or type manually"
                  className="flex-1"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as "USD" | "AED" | "KWD")}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="KWD">KWD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">Exchange Rate *</Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exchangeRateKWD">Exchange Rate to KWD</Label>
              <Input
                id="exchangeRateKWD"
                type="number"
                step="0.0001"
                value={exchangeRateKWD}
                onChange={(e) => setExchangeRateKWD(e.target.value)}
                placeholder="Optional"
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
              placeholder="Additional notes..."
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
                    placeholder="Item name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Optional description"
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

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Delivery Note</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "delivery_note")}
                  className="hidden"
                  id="delivery-note-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("delivery-note-upload")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Invoice</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "invoice")}
                  className="hidden"
                  id="invoice-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("invoice-upload")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment TT</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, "payment_tt")}
                  className="hidden"
                  id="payment-tt-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("payment-tt-upload")?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </div>

          {documents.length > 0 && (
            <div className="space-y-2">
              <Label>Uploaded Documents</Label>
              <div className="grid grid-cols-2 gap-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm truncate">{doc.file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({doc.type.replace("_", " ")})
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
