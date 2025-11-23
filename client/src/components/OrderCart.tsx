import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Minus, X, Send, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export interface CartItem {
  id: number;
  itemCode: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onClearCart: () => void;
}

export default function OrderCart({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart }: OrderCartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [salesmanName, setSalesmanName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderLink, setOrderLink] = useState("");
  const [copied, setCopied] = useState(false);

  const createOrderMutation = trpc.orders.create.useMutation();

  const totalItems = cartItems.length;
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSubmitOrder = async () => {
    if (!salesmanName.trim()) {
      toast.error("Please enter salesman name");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createOrderMutation.mutateAsync({
        salesmanName: salesmanName.trim(),
        notes: notes.trim() || undefined,
        items: cartItems.map(item => ({
          itemId: item.id,
          itemCode: item.itemCode,
          itemName: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // Generate WhatsApp message
      const message = generateWhatsAppMessage(result.orderNumber, salesmanName, cartItems, totalValue, notes);
      
      // Generate order link
      const link = `${window.location.origin}/order/${result.orderNumber}`;
      setOrderLink(link);

      // Copy message to clipboard
      await navigator.clipboard.writeText(message + "\n\n🔗 " + link);
      
      toast.success("Order created! Message copied to clipboard");
      
      // Clear cart and close dialog
      onClearCart();
      setSalesmanName("");
      setNotes("");
      
      // Open WhatsApp (mobile-friendly)
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message + "\n\n🔗 " + link)}`;
      window.open(whatsappUrl, "_blank");
      
    } catch (error: any) {
      toast.error(error.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateWhatsAppMessage = (
    orderNumber: string,
    salesman: string,
    items: CartItem[],
    total: number,
    orderNotes?: string
  ) => {
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let message = `📦 ORDER #${orderNumber}\n`;
    message += `👤 ${salesman} | 📅 ${date}\n\n`;
    message += `Item                    | Code         | Qty\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    
    items.forEach((item, index) => {
      const itemName = item.name.length > 23 ? item.name.substring(0, 20) + "..." : item.name;
      const code = item.itemCode.length > 12 ? item.itemCode.substring(0, 10) + ".." : item.itemCode;
      message += `${itemName.padEnd(23)} | ${code.padEnd(12)} | ${item.quantity}\n`;
    });
    
    message += `\n`;
    message += `Total: ${totalQuantity} pcs | KWD ${total.toFixed(3)}\n`;
    
    if (orderNotes) {
      message += `📝 ${orderNotes}\n`;
    }

    return message;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy");
    }
  };

  if (cartItems.length === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="h-16 px-6 rounded-full shadow-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold"
          onClick={() => setIsOpen(true)}
        >
          <ShoppingCart className="w-6 h-6 mr-2" />
          <div className="flex flex-col items-start">
            <span className="text-sm">Cart</span>
            <span className="text-xs opacity-90">{totalItems} items, {totalQuantity} pcs</span>
          </div>
          <div className="ml-3 bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
            {totalItems}
          </div>
        </Button>
      </div>

      {/* Cart Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">🛒 Order Cart</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cartItems.map((item) => (
                <Card key={item.id} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.name}</h4>
                        <p className="text-xs text-slate-500">{item.itemCode}</p>
                        <p className="text-sm font-medium text-emerald-600 mt-1">
                          KWD {item.price.toFixed(3)}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-right text-sm font-semibold text-slate-700">
                      Subtotal: KWD {(item.price * item.quantity).toFixed(3)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="bg-slate-50 border-slate-300">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Items:</span>
                    <span className="font-semibold">{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Quantity:</span>
                    <span className="font-semibold">{totalQuantity} pcs</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                    <span>Total Value:</span>
                    <span className="text-emerald-600">KWD {totalValue.toFixed(3)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salesman Info */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="salesmanName">Salesman Name *</Label>
                <Input
                  id="salesmanName"
                  placeholder="Enter your name"
                  value={salesmanName}
                  onChange={(e) => setSalesmanName(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any special instructions or notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClearCart}
                disabled={isSubmitting}
              >
                Clear Cart
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || !salesmanName.trim()}
              >
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
