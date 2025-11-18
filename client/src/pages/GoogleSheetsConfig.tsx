import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Cloud, CheckCircle2, XCircle, RefreshCw, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function GoogleSheetsConfig() {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");
  const [serviceAccountKey, setServiceAccountKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: config, isLoading } = trpc.googleSheets.getConfig.useQuery();
  const { data: syncLogs } = trpc.googleSheets.getSyncLogs.useQuery();
  const saveConfigMutation = trpc.googleSheets.saveConfig.useMutation();
  const syncNowMutation = trpc.googleSheets.syncNow.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (config) {
      setSpreadsheetId(config.spreadsheetId);
      setSheetName(config.sheetName);
      setServiceAccountKey(config.serviceAccountKey);
    }
  }, [config]);

  const handleSave = async () => {
    if (!spreadsheetId || !sheetName || !serviceAccountKey) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      await saveConfigMutation.mutateAsync({
        spreadsheetId,
        sheetName,
        serviceAccountKey,
      });
      toast.success("Configuration saved successfully");
      utils.googleSheets.getConfig.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const result = await syncNowMutation.mutateAsync();
      toast.success(`Sync completed! ${result.itemsUpdated} items updated`);
      utils.googleSheets.getSyncLogs.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "itemCode,quantity\nITEM001,100\nITEM002,50\nITEM003,75";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Google Sheets Integration</h1>
        <p className="text-muted-foreground mt-1">Configure automatic daily inventory sync from Google Sheets</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Connect your Google Sheet for automated inventory updates</CardDescription>
            </div>
            {config && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
            <Input
              id="spreadsheetId"
              placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Found in the URL: docs.google.com/spreadsheets/d/<strong>[SPREADSHEET_ID]</strong>/edit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheetName">Sheet Name</Label>
            <Input
              id="sheetName"
              placeholder="Sheet1"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The name of the sheet tab (default is "Sheet1")
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceAccountKey">Service Account Key (JSON)</Label>
            <Textarea
              id="serviceAccountKey"
              placeholder='{"type": "service_account", "project_id": "...", ...}'
              value={serviceAccountKey}
              onChange={(e) => setServiceAccountKey(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Paste the entire JSON key from your Google Cloud service account
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
            {config && (
              <Button variant="outline" onClick={handleSyncNow} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sheet Format</CardTitle>
              <CardDescription>Your Google Sheet should follow this format</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-semibold">Column A: itemCode</th>
                  <th className="text-left p-3 font-semibold">Column B: quantity</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">ITEM001</td>
                  <td className="p-3 font-mono text-xs">100</td>
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="p-3 font-mono text-xs">ITEM002</td>
                  <td className="p-3 font-mono text-xs">50</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">ITEM003</td>
                  <td className="p-3 font-mono text-xs">75</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Note:</strong> The sync runs automatically every day at 2:00 AM. You can also trigger a manual sync using the "Sync Now" button above.
          </p>
        </CardContent>
      </Card>

      {syncLogs && syncLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sync History</CardTitle>
            <CardDescription>Recent synchronization logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {log.status === 'success' 
                          ? `Successfully updated ${log.itemsUpdated} items`
                          : 'Sync failed'}
                      </p>
                      {log.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{log.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.syncedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
