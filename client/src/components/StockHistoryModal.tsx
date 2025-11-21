import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { format } from "date-fns";

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  itemName: string;
  itemCode: string;
}

export function StockHistoryModal({
  isOpen,
  onClose,
  itemId,
  itemName,
  itemCode,
}: StockHistoryModalProps) {
  const { data, isLoading } = trpc.items.getHistory.useQuery(
    { itemId },
    { enabled: isOpen }
  );

  const getChangeTypeIcon = (changeType: string) => {
    if (changeType === "sale") {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/20">
          <ArrowDown className="w-5 h-5 text-red-400" />
        </div>
      );
    } else if (changeType === "restock") {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/20">
          <ArrowUp className="w-5 h-5 text-emerald-400" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/20">
        <span className="text-yellow-400 font-bold">±</span>
      </div>
    );
  };

  const getChangeTypeLabel = (changeType: string) => {
    if (changeType === "sale") return "Sale";
    if (changeType === "restock") return "Stock In";
    return "Adjustment";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden bg-slate-800 border-slate-700 z-50">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                Stock History - {itemName}
              </DialogTitle>
              <p className="text-sm text-gray-400 mt-1">Item Code: {itemCode}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline */}
            <div className="overflow-y-auto max-h-[400px] pr-2">
              {data?.history && data.history.length > 0 ? (
                <div className="relative space-y-4">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-emerald-400/30"></div>

                  {data.history.map((entry, index) => (
                    <div key={entry.id} className="relative flex gap-4 items-start">
                      {/* Date column */}
                      <div className="w-24 flex-shrink-0 text-right">
                        <div className="text-sm text-gray-400">
                          {format(new Date(entry.createdAt), "MMM dd")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(entry.createdAt), "yyyy")}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(entry.createdAt), "h:mm a")}
                        </div>
                      </div>

                      {/* Timeline dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2"></div>
                      </div>

                      {/* Entry card */}
                      <div className="flex-1 bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700/70 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            {/* Icon */}
                            {getChangeTypeIcon(entry.changeType)}

                            {/* Details */}
                            <div className="flex-1">
                              <div className="font-medium text-white">
                                {getChangeTypeLabel(entry.changeType)}
                              </div>
                              <div
                                className={`text-lg font-bold ${
                                  entry.quantityChange > 0
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }`}
                              >
                                {entry.quantityChange > 0 ? "+" : ""}
                                {entry.quantityChange} pcs
                              </div>
                              {entry.notes && (
                                <div className="text-sm text-gray-400 mt-1">
                                  {entry.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Resulting stock */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs text-gray-400">After</div>
                            <div className="text-lg font-semibold text-white">
                              {entry.quantityAfter} pcs
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No stock history available for this item
                </div>
              )}
            </div>

            {/* Summary statistics */}
            {data?.stats && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Total Sales</div>
                  <div className="text-2xl font-bold text-red-400">
                    {data.stats.totalSales} pcs
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Total Restocks</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    {data.stats.totalRestocks} pcs
                  </div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-400 mb-1">Current Stock</div>
                  <div className="text-2xl font-bold text-white">
                    {data.stats.currentStock} pcs
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
