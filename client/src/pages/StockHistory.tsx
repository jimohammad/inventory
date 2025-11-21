import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingDown, TrendingUp, Edit, History as HistoryIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useState, useMemo } from "react";

export default function StockHistory() {
  const { data: items, isLoading } = trpc.items.list.useQuery();
  const [showOnlyWithSales, setShowOnlyWithSales] = useState(false);
  
  // Fetch history data for all items to determine which have sales
  const itemsWithHistoryData = useMemo(() => {
    if (!items) return [];
    return items.map(item => ({
      ...item,
      // We'll check this in the card component
    }));
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  // Filter items based on sales history (will be checked in card component)
  const displayItems = items;
  
  // Group items by category
  const itemsByCategory = displayItems?.reduce((acc, item) => {
    const category = item.category || "Uncategorized";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof displayItems>);
  
  // Count total items
  const totalItems = items?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <HistoryIcon className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">Stock History</h1>
            </div>
            <p className="text-slate-400 mt-2">Complete stock movement history for all items</p>
          </div>
          
          {/* Filter Controls */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowOnlyWithSales(!showOnlyWithSales)}
              variant={showOnlyWithSales ? "default" : "outline"}
              className={showOnlyWithSales 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "border-slate-700 text-slate-300 hover:bg-slate-800"}
            >
              {showOnlyWithSales ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filter
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4 mr-2" />
                  Show Only Items with Sales
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Filter Status */}
        {showOnlyWithSales && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3">
            <p className="text-emerald-400 text-sm">
              <Filter className="w-4 h-4 inline mr-2" />
              Showing only items with sales history
            </p>
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(itemsByCategory || {}).map(([category, categoryItems]) => categoryItems && (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                <Badge variant="outline" className="text-base border-emerald-500/50 text-emerald-400">{category}</Badge>
                <span className="text-sm text-slate-400">({categoryItems.length})</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                {categoryItems.map((item) => (
                  <StockHistoryCard 
                    key={item.id} 
                    itemId={item.id} 
                    showOnlyWithSales={showOnlyWithSales}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StockHistoryCard({ itemId, showOnlyWithSales }: { itemId: number; showOnlyWithSales: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: historyData, isLoading } = trpc.items.getHistory.useQuery({ itemId });
  const { data: items } = trpc.items.list.useQuery();
  
  const item = items?.find(i => i.id === itemId);
  if (!item) return null;

  const totalSales = historyData?.stats.totalSales || 0;
  const totalRestocks = historyData?.stats.totalRestocks || 0;
  const currentStock = historyData?.stats.currentStock || 0;
  const history = historyData?.history || [];

  // Filter logic: hide items without sales when filter is active
  if (showOnlyWithSales && totalSales === 0) {
    return null;
  }

  // Determine border color based on history
  const hasSales = totalSales > 0;
  const hasRestocks = totalRestocks > 0;
  const borderColor = hasSales 
    ? "border-red-500/50 hover:border-red-500" 
    : hasRestocks 
    ? "border-emerald-500/50 hover:border-emerald-500"
    : "border-slate-700 hover:border-slate-600";

  return (
    <Card className={`bg-slate-800/50 backdrop-blur-sm border-2 transition-all hover:shadow-lg ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-white">{item.name}</CardTitle>
            <p className="text-slate-400 text-sm mt-1">
              {item.itemCode} • {item.category}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Current Stock</div>
            <div className="text-2xl font-bold text-emerald-400">{currentStock} pcs</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Stock Movement Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium border-b border-slate-700 pb-2">
            <span className="text-white">Stock Movement History</span>
            <span className="text-slate-400">
              {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
          ) : history.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {history.map((entry: any, index: number) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-emerald-500/30 transition-all"
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
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {format(new Date(entry.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${
                        entry.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange} pcs
                      </span>
                      <span className="text-slate-400">
                        → {entry.quantityAfter} pcs
                      </span>
                    </div>

                    {entry.notes && (
                      <div className="text-xs text-slate-500 mt-1 italic">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <p className="text-sm">No stock history available</p>
              <p className="text-xs mt-1 text-slate-500">Stock movements will appear here</p>
            </div>
          )}

          {/* Summary Statistics */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
            <div className="text-center p-2 rounded-lg bg-red-950/30 border border-red-900/50">
              <div className="text-xs text-slate-400 mb-1">Total Sales</div>
              <div className="text-lg font-bold text-red-400">{totalSales} pcs</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-950/30 border border-emerald-900/50">
              <div className="text-xs text-slate-400 mb-1">Total Restocks</div>
              <div className="text-lg font-bold text-emerald-400">{totalRestocks} pcs</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-slate-900/50 border border-slate-700">
              <div className="text-xs text-slate-400 mb-1">Current Stock</div>
              <div className="text-lg font-bold text-white">{currentStock} pcs</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
