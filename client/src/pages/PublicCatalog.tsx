import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useRoute } from "wouter";

export default function PublicCatalog() {
  const [, params] = useRoute("/catalog/:userId/:type");
  const userId = params?.userId ? parseInt(params.userId) : 0;
  const includeQty = params?.type === "internal";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: items, isLoading } = trpc.items.getPublicCatalog.useQuery({
    userId,
    includeQty,
  });

  const categories = useMemo(() => {
    if (!items) return [];
    const cats = new Set(items.map(item => item.category));
    return Array.from(cats);
  }, [items]);

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
              
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  All Categories
                </Badge>
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
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
            {filteredItems.map((item, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{item.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{item.itemCode}</p>
                    </div>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* Price display */}
                    {item.sellingPrice && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <div className="text-xs text-green-700 font-medium mb-1">Price</div>
                        <div className="text-2xl font-bold text-green-700">KWD {parseFloat(item.sellingPrice as any).toFixed(3)}</div>
                      </div>
                    )}
                    {/* Stock availability for internal catalog */}
                    {includeQty && (
                      <div className={`rounded-lg p-3 border ${
                        (item.availableQty || 0) < 10 
                          ? 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200' 
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'
                      }`}>
                        <div className={`text-xs font-medium mb-1 ${
                          (item.availableQty || 0) < 10 ? 'text-red-700' : 'text-blue-700'
                        }`}>Stock Available</div>
                        <div className={`text-2xl font-bold ${
                          (item.availableQty || 0) < 10 ? 'text-red-700' : 'text-blue-700'
                        }`}>{item.availableQty || 0} <span className="text-sm font-normal">units</span></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          Total Items: {filteredItems.length}
        </div>
      </div>
    </div>
  );
}
