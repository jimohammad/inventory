import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Loader2, Bell, TrendingDown, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ReorderAlerts() {
  const { data: settings, isLoading: settingsLoading } = trpc.alerts.getSettings.useQuery();
  const { data: alertsData, isLoading: alertsLoading } = trpc.alerts.getAlerts.useQuery();
  const updateSettings = trpc.alerts.updateSettings.useMutation();
  const utils = trpc.useUtils();

  const [lowThreshold, setLowThreshold] = useState(settings?.lowStockThreshold || 10);
  const [criticalThreshold, setCriticalThreshold] = useState(settings?.criticalStockThreshold || 5);
  const [reorderQty, setReorderQty] = useState(settings?.defaultReorderQuantity || 50);
  const [emailEnabled, setEmailEnabled] = useState(settings?.emailNotificationsEnabled || false);

  // Update local state when settings load
  useState(() => {
    if (settings) {
      setLowThreshold(settings.lowStockThreshold);
      setCriticalThreshold(settings.criticalStockThreshold);
      setReorderQty(settings.defaultReorderQuantity);
      setEmailEnabled(settings.emailNotificationsEnabled);
    }
  });

  const handleSaveSettings = async () => {
    if (criticalThreshold >= lowThreshold) {
      toast.error("Critical threshold must be less than low stock threshold");
      return;
    }

    try {
      await updateSettings.mutateAsync({
        lowStockThreshold: lowThreshold,
        criticalStockThreshold: criticalThreshold,
        defaultReorderQuantity: reorderQty,
        emailNotificationsEnabled: emailEnabled,
      });
      
      utils.alerts.getSettings.invalidate();
      utils.alerts.getAlerts.invalidate();
      toast.success("Alert settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  const handleCreatePO = () => {
    toast.info("Purchase Order creation coming soon!");
  };

  if (settingsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  const alerts = alertsData?.alerts || [];
  const summary = alertsData?.summary || { critical: 0, lowStock: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Bell className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-bold text-white">Stock Reorder Alerts</h1>
        </div>

        {/* Settings Panel */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-6">Reorder Alert Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="space-y-2">
              <Label htmlFor="lowThreshold" className="text-emerald-400">
                Low Stock Threshold
              </Label>
              <Input
                id="lowThreshold"
                type="number"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="criticalThreshold" className="text-emerald-400">
                Critical Stock Threshold
              </Label>
              <Input
                id="criticalThreshold"
                type="number"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderQty" className="text-emerald-400">
                Reorder Quantity
              </Label>
              <Input
                id="reorderQty"
                type="number"
                value={reorderQty}
                onChange={(e) => setReorderQty(parseInt(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
                className="data-[state=checked]:bg-emerald-500"
              />
              <Label className="text-white cursor-pointer" onClick={() => setEmailEnabled(!emailEnabled)}>
                Enable Email Notifications
              </Label>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={updateSettings.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {updateSettings.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </div>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 p-12 text-center backdrop-blur-sm">
              <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No reorder alerts at this time</p>
              <p className="text-slate-500 text-sm mt-2">
                All items are above the low stock threshold
              </p>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`bg-slate-800/50 backdrop-blur-sm p-6 border-2 transition-all hover:shadow-lg ${
                  alert.alertLevel === "critical"
                    ? "border-red-500/50 hover:border-red-500"
                    : "border-amber-500/50 hover:border-amber-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  {/* Left Section */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{alert.name}</h3>
                        <p className="text-slate-400 text-sm">{alert.itemCode}</p>
                      </div>
                      
                      {/* Alert Badge */}
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.alertLevel === "critical"
                            ? "bg-red-500/20 text-red-400 border border-red-500/50"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/50"
                        }`}
                      >
                        {alert.alertLevel === "critical" ? "CRITICAL" : "LOW STOCK"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Current Stock</p>
                        <p
                          className={`text-2xl font-bold ${
                            alert.alertLevel === "critical" ? "text-red-400" : "text-amber-400"
                          }`}
                        >
                          {alert.availableQty} pcs
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400 text-sm">Sales Velocity</p>
                        <p className="text-xl font-semibold text-emerald-400">
                          {alert.salesVelocity} units/week
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-col items-end gap-4 ml-6">
                    <div className="text-right">
                      <p className="text-slate-400 text-sm">Suggested Reorder</p>
                      <p className="text-3xl font-bold text-white">{alert.suggestedReorder} pcs</p>
                    </div>

                    {alert.daysUntilStockout > 0 && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 rounded-lg border border-amber-500/50">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 font-semibold">
                          {alert.daysUntilStockout} days
                        </span>
                      </div>
                    )}

                    <Button
                      onClick={handleCreatePO}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Create PO
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {alerts.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700 p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-12">
              <div className="text-center">
                <p className="text-red-400 text-4xl font-bold">{summary.critical}</p>
                <p className="text-slate-400 text-sm mt-1">Critical Alerts</p>
              </div>
              
              <div className="h-12 w-px bg-slate-700" />
              
              <div className="text-center">
                <p className="text-amber-400 text-4xl font-bold">{summary.lowStock}</p>
                <p className="text-slate-400 text-sm mt-1">Low Stock Alerts</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
