import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, History as HistoryIcon } from "lucide-react";
import { useState } from "react";
import { StockHistoryModal } from "@/components/StockHistoryModal";

export default function StockHistory() {
  const [historyItem, setHistoryItem] = useState<{ id: number; name: string; code: string } | null>(null);
  const { data: items, isLoading } = trpc.items.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group items by category
  const itemsByCategory = items?.reduce((acc, item) => {
    const category = item.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock History</h1>
        <p className="text-muted-foreground mt-1">View stock movement and sales history for all items</p>
      </div>

      <div className="space-y-6">
        {Object.entries(itemsByCategory || {}).map(([category, categoryItems]) => categoryItems && (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-base">{category}</Badge>
              <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryItems.map((item) => (
                <Card key={item.id} className="transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pt-3 pb-2">
                    <CardTitle className="text-base">{item.name}</CardTitle>
                    {item.category && (
                      <CardDescription>
                        {item.category}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="space-y-1.5">
                      {item.itemCode && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Code</span>
                          <span className="font-mono">{item.itemCode}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Available</span>
                        <span className="font-semibold text-primary">{item.availableQty || 0} pcs</span>
                      </div>
                      {item.openingStock !== null && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Opening Stock</span>
                          <span className="font-medium">{item.openingStock} pcs</span>
                        </div>
                      )}
                      
                      {/* Sales Velocity Section */}
                      <div className="pt-2 mt-2 border-t border-border">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div className="text-xs">
                            <div className="text-muted-foreground mb-0.5">Last Sold</div>
                            <div className="font-medium text-emerald-400">
                              {item.lastSoldDate 
                                ? `${Math.floor((Date.now() - new Date(item.lastSoldDate).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                                : 'Never'}
                            </div>
                          </div>
                          <div className="text-xs">
                            <div className="text-muted-foreground mb-0.5">Sales Velocity</div>
                            <div className="font-medium text-emerald-400">
                              {(item as any).salesVelocity || 0} units/week
                            </div>
                          </div>
                        </div>
                        
                        {/* Velocity Status Bar */}
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Velocity Status</div>
                          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-emerald-500 transition-all"
                              style={{ width: (item as any).velocityStatus === 'fast' ? '60%' : '0%' }}
                            />
                            <div 
                              className="h-full bg-yellow-500 transition-all"
                              style={{ width: (item as any).velocityStatus === 'moderate' ? '30%' : '0%' }}
                            />
                            <div 
                              className="h-full bg-red-500 transition-all"
                              style={{ width: (item as any).velocityStatus === 'slow' ? '10%' : '0%' }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-emerald-400">Fast (&gt;3/wk)</span>
                            <span className="text-yellow-400">Moderate (1-3/wk)</span>
                            <span className="text-red-400">Slow (&lt;1/wk)</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* View History Button */}
                      <div className="pt-3 mt-3 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setHistoryItem({ id: item.id, name: item.name, code: item.itemCode })}
                          className="w-full bg-black hover:bg-slate-900 text-emerald-400 hover:text-emerald-300 border-emerald-500/30 transition-all"
                        >
                          <HistoryIcon className="w-4 h-4 mr-2" />
                          View Full History
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {historyItem && (
        <StockHistoryModal
          isOpen={true}
          onClose={() => setHistoryItem(null)}
          itemId={historyItem.id}
          itemName={historyItem.name}
          itemCode={historyItem.code}
        />
      )}
    </div>
  );
}
