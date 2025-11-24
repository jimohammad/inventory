import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function BulkPriceUpdate() {
  const [, setLocation] = useLocation();
  const [category, setCategory] = useState<string>("all");
  const [priceType, setPriceType] = useState<"wholesale" | "retail" | "purchase" | "all">("wholesale");
  const [adjustmentType, setAdjustmentType] = useState<"percentage" | "fixed">("percentage");
  const [adjustmentValue, setAdjustmentValue] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkUpdateMutation = trpc.items.bulkUpdatePrices.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setAdjustmentValue("");
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsProcessing(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = parseFloat(adjustmentValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid number");
      return;
    }

    if (adjustmentType === "percentage" && value < -100) {
      toast.error("Percentage decrease cannot be more than 100%");
      return;
    }

    setIsProcessing(true);
    bulkUpdateMutation.mutate({
      category: category === "all" ? undefined : category as any,
      priceType,
      adjustmentType,
      adjustmentValue: value,
    });
  };

  const categories = ["Motorola", "Samsung", "Redmi", "Realme", "Meizu", "Honor"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/items")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Bulk Price Update</h1>
            <p className="text-muted-foreground">
              Update prices for multiple items at once
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Price Adjustment Settings</CardTitle>
              <CardDescription>
                Configure how you want to update prices across your inventory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label htmlFor="category">Category Filter</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Select a specific category or apply to all items
                </p>
              </div>

              {/* Price Type */}
              <div className="space-y-2">
                <Label>Price Type to Update</Label>
                <RadioGroup value={priceType} onValueChange={(v) => setPriceType(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="selling" id="selling" />
                    <Label htmlFor="selling" className="font-normal cursor-pointer">
                      Selling Price Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="purchase" id="purchase" />
                    <Label htmlFor="purchase" className="font-normal cursor-pointer">
                      Purchase Price Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="font-normal cursor-pointer">
                      Both Prices
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Adjustment Type */}
              <div className="space-y-2">
                <Label>Adjustment Method</Label>
                <RadioGroup value={adjustmentType} onValueChange={(v) => setAdjustmentType(v as any)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage" className="font-normal cursor-pointer flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Percentage (%)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fixed Amount (KWD)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Adjustment Value */}
              <div className="space-y-2">
                <Label htmlFor="value">
                  {adjustmentType === "percentage" ? "Percentage Change" : "Amount Change (KWD)"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step={adjustmentType === "percentage" ? "0.1" : "0.001"}
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={adjustmentType === "percentage" ? "e.g., 5 for +5% or -10 for -10%" : "e.g., 2.500 for +2.500 KWD"}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {adjustmentType === "percentage" 
                    ? "Enter positive number to increase or negative to decrease (e.g., 5 for +5%, -10 for -10%)"
                    : "Enter positive number to increase or negative to decrease (e.g., 2.500 for +2.500 KWD)"}
                </p>
              </div>

              {/* Preview */}
              {adjustmentValue && !isNaN(parseFloat(adjustmentValue)) && (
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Preview</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="text-muted-foreground">Example:</span> KWD 100.000 →{" "}
                      <span className="font-semibold text-green-600">
                        KWD{" "}
                        {adjustmentType === "percentage"
                          ? (100 * (1 + parseFloat(adjustmentValue) / 100)).toFixed(3)
                          : (100 + parseFloat(adjustmentValue)).toFixed(3)}
                      </span>
                    </p>
                    {adjustmentType === "percentage" && (
                      <p className="text-muted-foreground">
                        {parseFloat(adjustmentValue) > 0 ? "Increase" : "Decrease"} by{" "}
                        {Math.abs(parseFloat(adjustmentValue))}%
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isProcessing || !adjustmentValue}
                  className="flex-1"
                >
                  {isProcessing ? "Updating..." : "Update Prices"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/items")}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
