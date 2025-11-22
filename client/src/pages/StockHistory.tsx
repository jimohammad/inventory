import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingDown, TrendingUp, Edit, History as HistoryIcon, Filter, Calendar, Search } from "lucide-react";
import { format, isToday } from "date-fns";
import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";

type FilterType = 'all' | 'with-sales' | 'today';

export default function StockHistory() {
  const { data: items, isLoading } = trpc.items.list.useQuery();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  
  // Search results for autocomplete
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !items) return [];
    const query = searchQuery.toLowerCase();
    return items
      .filter((item: any) => 
        item.name.toLowerCase().includes(query) ||
        item.itemCode.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [searchQuery, items]);

  // Scroll to item card when selected
  const scrollToItem = (itemId: number) => {
    const element = itemRefs.current[itemId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the card briefly
      element.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.5)';
      setTimeout(() => {
        element.style.boxShadow = '';
      }, 2000);
    }
  };

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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <HistoryIcon className="w-8 h-8 text-emerald-400" />
                <h1 className="text-3xl font-bold text-white">Stock History</h1>
              </div>
              <p className="text-slate-400 mt-2">Complete stock movement history for all items</p>
            </div>
            
            {/* Filter Controls */}
            <div className="flex items-center gap-2">
            <Button
              onClick={() => setFilterType('all')}
              variant={filterType === 'all' ? "default" : "outline"}
              size="sm"
              className={filterType === 'all'
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "border-slate-700 text-slate-300 hover:bg-slate-800"}
            >
              All
            </Button>
            <Button
              onClick={() => setFilterType('with-sales')}
              variant={filterType === 'with-sales' ? "default" : "outline"}
              size="sm"
              className={filterType === 'with-sales'
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "border-slate-700 text-slate-300 hover:bg-slate-800"}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Items with Sales
            </Button>
            <Button
              onClick={() => setFilterType('today')}
              variant={filterType === 'today' ? "default" : "outline"}
              size="sm"
              className={filterType === 'today'
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "border-slate-700 text-slate-300 hover:bg-slate-800"}
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Today Only
            </Button>
          </div>
        </div>

        {/* Global Search Field */}
        <div className="relative w-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />
            <Input
              type="text"
              placeholder="Search items by name, code, or category..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="h-16 pl-14 pr-6 text-xl font-medium bg-slate-800 border-slate-700 text-emerald-400 placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && searchQuery.trim() && searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
              {searchResults.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToItem(item.id);
                    setSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-base font-semibold text-emerald-400">{item.name}</div>
                      <div className="text-sm text-slate-400 mt-1">
                        {item.itemCode} • {item.category}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-base font-bold text-emerald-400">
                        KWD {parseFloat(item.sellingPrice || "0").toFixed(3)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.availableQty} units
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && searchQuery.trim() && searchResults.length === 0 && (
            <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4">
              <p className="text-slate-400 text-center">No items found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
        
        {/* Filter Status */}
        {filterType !== 'all' && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3">
            <p className="text-emerald-400 text-sm">
              {filterType === 'with-sales' && (
                <>
                  <Filter className="w-4 h-4 inline mr-2" />
                  Showing only items with sales history
                </>
              )}
              {filterType === 'today' && (
                <>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Showing only items with changes today
                </>
              )}
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
                  <div key={item.id} ref={(el) => itemRefs.current[item.id] = el}>
                    <StockHistoryCard 
                      itemId={item.id} 
                      filterType={filterType}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StockHistoryCard({ itemId, filterType }: { itemId: number; filterType: FilterType }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: historyData, isLoading } = trpc.items.getHistory.useQuery({ itemId });
  const { data: priceHistory, isLoading: isPriceLoading } = trpc.items.getPriceHistory.useQuery({ itemId });
  const { data: items } = trpc.items.list.useQuery();
  
  const item = items?.find(i => i.id === itemId);
  if (!item) return null;

  const totalSales = historyData?.stats.totalSales || 0;
  const totalRestocks = historyData?.stats.totalRestocks || 0;
  const currentStock = historyData?.stats.currentStock || 0;
  const history = historyData?.history || [];

  // Filter logic
  if (filterType === 'with-sales' && totalSales === 0) {
    return null;
  }
  
  if (filterType === 'today') {
    // Check if any history entry is from today
    const hasTodayEntry = history.some((entry: any) => isToday(new Date(entry.createdAt)));
    if (!hasTodayEntry) {
      return null;
    }
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

          {/* Price History Timeline */}
          <div className="space-y-3 mt-6">
            <div className="flex items-center justify-between text-sm font-medium border-b border-slate-700 pb-2">
              <span className="text-white">Price History</span>
              <span className="text-slate-400">
                {priceHistory?.length || 0} {priceHistory?.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {isPriceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : priceHistory && priceHistory.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {priceHistory.map((entry: any, index: number) => {
                  // Calculate price changes
                  const prevEntry = index < priceHistory.length - 1 ? priceHistory[index + 1] : null;
                  const purchasePriceChange = prevEntry ? Number(entry.purchasePrice) - Number(prevEntry.purchasePrice) : 0;
                  const sellingPriceChange = prevEntry ? Number(entry.sellingPrice) - Number(prevEntry.sellingPrice) : 0;
                  
                  return (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-emerald-500/30 transition-all"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Date */}
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {format(new Date(entry.changedAt), 'MMM dd, yyyy')}
                        </span>

                        {/* Purchase Price */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">P:</span>
                          <span className="text-sm font-semibold text-blue-400">
                            {Number(entry.purchasePrice).toFixed(3)}
                          </span>
                          {prevEntry && purchasePriceChange !== 0 && (
                            <span className={`text-xs flex items-center ${
                              purchasePriceChange > 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {purchasePriceChange > 0 ? '↑' : '↓'}{Math.abs(purchasePriceChange).toFixed(3)}
                            </span>
                          )}
                        </div>

                        {/* Selling Price */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">S:</span>
                          <span className="text-sm font-semibold text-emerald-400">
                            {Number(entry.sellingPrice).toFixed(3)}
                          </span>
                          {prevEntry && sellingPriceChange !== 0 && (
                            <span className={`text-xs flex items-center ${
                              sellingPriceChange > 0 ? 'text-red-400' : 'text-emerald-400'
                            }`}>
                              {sellingPriceChange > 0 ? '↑' : '↓'}{Math.abs(sellingPriceChange).toFixed(3)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">No price history available</p>
                <p className="text-xs mt-1 text-slate-500">Price changes will appear here</p>
              </div>
            )}
          </div>

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
