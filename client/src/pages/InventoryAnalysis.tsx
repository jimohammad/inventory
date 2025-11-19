import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Loader2, Package, Upload, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function InventoryAnalysis() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [filter, setFilter] = useState<"all" | "fast" | "medium" | "slow" | "none">("all");
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const { data: analysis, isLoading } = trpc.items.getMovementAnalysis.useQuery({ period });
  const aiMutation = trpc.items.getAIInsights.useMutation();

  const handleGetAIInsights = async () => {
    setIsLoadingAI(true);
    try {
      const result = await aiMutation.mutateAsync({ period });
      setAiInsights(typeof result.insights === 'string' ? result.insights : JSON.stringify(result.insights));
    } catch (error) {
      toast.error("Failed to generate AI insights");
    } finally {
      setIsLoadingAI(false);
    }
  };

  const filteredAnalysis = analysis?.filter(item => 
    filter === "all" || item.movementCategory === filter
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "fast": return "bg-green-100 text-green-800 border-green-300";
      case "medium": return "bg-blue-100 text-blue-800 border-blue-300";
      case "slow": return "bg-orange-100 text-orange-800 border-orange-300";
      case "none": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "fast": return <TrendingUp className="w-4 h-4" />;
      case "medium": return <Minus className="w-4 h-4" />;
      case "slow": return <TrendingDown className="w-4 h-4" />;
      case "none": return <Package className="w-4 h-4" />;
      default: return null;
    }
  };

  const stats = {
    fast: 0,
    medium: 0,
    slow: 0,
    none: analysis?.length || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Analysis</h1>
          <p className="text-muted-foreground mt-1">Track item movement and identify fast/slow movers</p>
        </div>
        <Button onClick={() => setLocation("/items/import")}>
          <Upload className="w-4 h-4 mr-2" />
          Import Stock Data
        </Button>
      </div>

      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </div>
            <Button 
              onClick={handleGetAIInsights}
              disabled={isLoadingAI || !analysis || analysis.length === 0}
              size="sm"
            >
              {isLoadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Insights
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            Get AI-powered recommendations based on your inventory movement data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiInsights ? (
            <div className="prose prose-sm max-w-none">
              <Streamdown>{aiInsights}</Streamdown>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Click "Generate Insights" to get AI-powered analysis of your inventory</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fast Moving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.fast}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">≥5 pcs/day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Medium Moving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Minus className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.medium}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">1-4 pcs/day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Slow Moving</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold">{stats.slow}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">&lt;1 pc/day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">No Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="text-2xl font-bold">{stats.none}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">0 orders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Item Movement Report</CardTitle>
              <CardDescription>
                Based on purchase order quantities in the selected period
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="fast">Fast</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="slow">Slow</SelectItem>
                  <SelectItem value="none">No Movement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAnalysis && filteredAnalysis.length > 0 ? (
            <div className="space-y-3">
              {filteredAnalysis.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{item.itemName}</h3>
                        {item.itemCode && (
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {item.itemCode}
                          </span>
                        )}
                        <Badge className={getCategoryColor(item.movementCategory)}>
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(item.movementCategory)}
                            {item.movementCategory}
                          </span>
                        </Badge>
                      </div>
                      {item.category && (
                        <p className="text-sm text-muted-foreground">{item.category}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Available Stock</div>
                      <div className="text-lg font-semibold">{item.availableQty} pcs</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Sold (Period)</div>
                      <div className="text-lg font-semibold text-blue-600">{item.soldQty} pcs</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Orders</div>
                      <div className="text-lg font-semibold">{item.orderCount}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Avg/Day</div>
                      <div className="text-lg font-semibold text-green-600">{item.avgPerDay} pcs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No items found for the selected filter</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
