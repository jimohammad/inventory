import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ShoppingCart } from "lucide-react";
import { useState, useMemo } from "react";
import { useRoute } from "wouter";
import OrderCart, { CartItem } from "@/components/OrderCart";
import { toast } from "sonner";

export default function PublicCatalog() {
  const [, params] = useRoute("/catalog/:userId/:type");
  const userId = params?.userId ? parseInt(params.userId) : 0;
  const catalogType = params?.type || "public"; // "internal", "public", or "retail"
  const includeQty = catalogType === "internal";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});

  const { data: items, isLoading } = trpc.items.getPublicCatalog.useQuery({
    userId,
    includeQty,
  });

  const categories = useMemo(() => {
    if (!items) return [];
    const cats = new Set(items.map(item => item.category));
    return Array.from(cats);
  }, [items]);

  const getCategoryCount = (category: string) => {
    if (!items) return 0;
    return items.filter(item => item.category === category).length;
  };

  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    return items.filter(item => {
      const matchesSearch = !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const getItemQuantity = (itemId: number) => itemQuantities[itemId] || 1;

  const setItemQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) quantity = 1;
    if (quantity > 999) quantity = 999;
    setItemQuantities({ ...itemQuantities, [itemId]: quantity });
  };

  const handleAddToCart = (item: any) => {
    const quantity = getItemQuantity(item.id);
    const existingItem = cartItems.find(ci => ci.id === item.id);
    
    if (existingItem) {
      // Update quantity
      setCartItems(cartItems.map(ci => 
        ci.id === item.id 
          ? { ...ci, quantity: ci.quantity + quantity }
          : ci
      ));
      toast.success(`Added ${quantity} more ${item.name} to cart`);
    } else {
      // Add new item
      const newCartItem: CartItem = {
        id: item.id,
        itemCode: item.itemCode,
        name: item.name,
        price: parseFloat((catalogType === "retail" ? item.retailPrice : item.wholesalePrice) as any),
        quantity,
      };
      setCartItems([...cartItems, newCartItem]);
      toast.success(`Added ${quantity} ${item.name} to cart`);
    }
    // Reset quantity to 1 after adding
    setItemQuantity(item.id, 1);
  };

  const handleUpdateQuantity = (itemId: number, quantity: number) => {
    setCartItems(cartItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handleRemoveItem = (itemId: number) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    toast.success("Item removed from cart");
  };

  const handleClearCart = () => {
    setCartItems([]);
    toast.success("Cart cleared");
  };

  const getItemCartQuantity = (itemId: number) => {
    const cartItem = cartItems.find(ci => ci.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Inventory Catalog
          </h1>
          <p className="text-gray-600">
            {includeQty ? "Complete catalog with stock availability" : "Product catalog with pricing"}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by item name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer px-6 py-2.5 text-base font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                  onClick={() => setSelectedCategory(null)}
                >
                  <span>All Categories</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{items?.length || 0}</span>
                </Badge>
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer px-6 py-2.5 text-base font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{cat ? getCategoryCount(cat) : 0}</span>
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No items found
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, idx) => {
              const cartQty = getItemCartQuantity(item.id);
              
              return (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-1 pt-2 px-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.itemCode}</p>
                      </div>
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-1 px-2 pb-2">
                    <div className="space-y-0.5">
                      {/* Price display */}
                      {((catalogType === "retail" && item.retailPrice) || (catalogType !== "retail" && item.wholesalePrice)) && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-1.5 border border-green-200">
                          <div className="text-xs text-green-700 font-medium mb-0.5">{catalogType === "retail" ? 'Retail Shop Price' : 'Wholesale Price'}</div>
                          <div className="text-2xl font-bold text-green-700">KWD {parseFloat((catalogType === "retail" ? item.retailPrice : item.wholesalePrice) as any).toFixed(3)}</div>
                        </div>
                      )}
                      {/* Stock availability for internal catalog */}
                      {includeQty && (
                        <div className={`rounded-lg p-1.5 border ${
                          (item.availableQty || 0) < 10 
                            ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' 
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                        }`}>
                          <div className={`text-xs font-medium mb-0.5 ${
                            (item.availableQty || 0) < 10 ? 'text-red-700' : 'text-blue-700'
                          }`}>Stock Available</div>
                          <div className={`text-2xl font-bold ${
                            (item.availableQty || 0) < 10 ? 'text-red-700' : 'text-blue-700'
                          }`}>{item.availableQty || 0} <span className="text-sm font-normal">units</span></div>
                        </div>
                      )}

                      {/* Add to Cart and Quantity Selector */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                          onClick={() => handleAddToCart(item)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          {cartQty > 0 ? `In Cart (${cartQty})` : 'Add to Cart'}
                        </Button>
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 px-3"
                            onClick={() => setItemQuantity(item.id, getItemQuantity(item.id) - 1)}
                          >
                            −
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max="999"
                            value={getItemQuantity(item.id)}
                            onChange={(e) => setItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-10 text-center border-0 focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 px-3"
                            onClick={() => setItemQuantity(item.id, getItemQuantity(item.id) + 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          Total Items: {filteredItems.length}
        </div>
      </div>

      {/* Order Cart Component */}
      <OrderCart
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}
