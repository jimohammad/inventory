import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, Edit } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function StockHistory() {
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
        <p className="text-muted-foreground mt-1">Complete stock movement history for all items</p>
      </div>

      <div className="space-y-6">
        {Object.entries(itemsByCategory || {}).map(([category, categoryItems]) => categoryItems && (
          <div key={category}>
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-base">{category}</Badge>
              <span className="text-sm text-muted-foreground">({categoryItems.length})</span>
            </h2>
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
              {categoryItems.map((item) => (
                <StockHistoryCard key={item.id} itemId={item.id} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StockHistoryCard({ itemId }: { itemId: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: historyData, isLoading } = trpc.items.getHistory.useQuery({ itemId });
  const { data: items } = trpc.items.list.useQuery();
  
  const item = items?.find(i => i.id === itemId);
  if (!item) return null;

  const totalSales = historyData?.stats.totalSales || 0;
  const totalRestocks = historyData?.stats.totalRestocks || 0;
  const currentStock = historyData?.stats.currentStock || 0;
  const history = historyData?.history || [];

  return (
    <Card className="transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <CardDescription className="mt-1">
              {item.itemCode} • {item.category}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current Stock</div>
            <div className="text-2xl font-bold text-emerald-400">{currentStock} pcs</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Stock Movement Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium border-b pb-2">
            <span>Stock Movement History</span>
            <span className="text-muted-foreground">
              {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {history.map((entry: any, index: number) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/30 border border-slate-800 hover:border-emerald-500/30 transition-all"
                >
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      entry.changeType === 'sale' ? 'bg-red-500' :
                      entry.changeType === 'restock' ? 'bg-emerald-500' :
                      'bg-yellow-500'
                    }`} />
                    {index < history.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-700 mt-1" style={{ minHeight: '20px' }} />
                    )}
                  </div>

                  {/* Entry Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        {entry.changeType === 'sale' ? (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        ) : entry.changeType === 'restock' ? (
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Edit className="w-4 h-4 text-yellow-400" />
                        )}
                        <span className={`text-sm font-semibold ${
                          entry.changeType === 'sale' ? 'text-red-400' :
                          entry.changeType === 'restock' ? 'text-emerald-400' :
                          'text-yellow-400'
                        }`}>
                          {entry.changeType === 'sale' ? 'Sale' :
                           entry.changeType === 'restock' ? 'Restock' :
                           'Adjustment'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${
                        entry.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange} pcs
                      </span>
                      <span className="text-muted-foreground">
                        → {entry.quantityAfter} pcs
                      </span>
                    </div>

                    {entry.notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No stock history available</p>
              <p className="text-xs mt-1">Stock movements will appear here</p>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800">
            <div className="text-center p-2 rounded-lg bg-red-950/20 border border-red-900/30">
              <div className="text-xs text-muted-foreground mb-1">Total Sales</div>
              <div className="text-lg font-bold text-red-400">{totalSales} pcs</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
              <div className="text-xs text-muted-foreground mb-1">Total Restocks</div>
              <div className="text-lg font-bold text-emerald-400">{totalRestocks} pcs</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-900/30 border border-slate-800">
              <div className="text-xs text-muted-foreground mb-1">Current Stock</div>
              <div className="text-lg font-bold text-white">{currentStock} pcs</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
