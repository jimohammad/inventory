import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function StockImport() {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ updated: number; notFound: string[] } | null>(null);

  const importMutation = trpc.items.importStock.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setImporting(false);
      if (data.updated > 0) {
        toast.success(`Successfully updated ${data.updated} items`);
      }
      if (data.notFound.length > 0) {
        toast.warning(`${data.notFound.length} item codes not found`);
      }
      setFile(null);
      setNotes("");
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setImporting(false);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setImporting(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        setImporting(false);
        return;
      }

      // Parse CSV (expecting: itemCode,quantity)
      const items: Array<{ itemCode: string; quantity: number }> = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 2) {
          const itemCode = parts[0].trim();
          const quantity = parseInt(parts[1].trim());
          
          if (itemCode && !isNaN(quantity)) {
            items.push({ itemCode, quantity });
          }
        }
      }

      if (items.length === 0) {
        toast.error("No valid data found in CSV");
        setImporting(false);
        return;
      }

      importMutation.mutate({
        items,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      toast.error("Failed to read CSV file");
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "itemCode,quantity\nITM-001,100\nITM-002,50";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Stock Data</h1>
        <p className="text-muted-foreground mt-1">Upload CSV file to update inventory quantities</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Import weekly stock updates from your CSV file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importing}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Weekly stock update - Week 12"
                rows={3}
                disabled={importing}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleImport} 
                disabled={!file || importing}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                {importing ? "Importing..." : "Import Stock Data"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CSV Format</CardTitle>
            <CardDescription>
              Your CSV file should follow this format
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-md font-mono text-sm">
              <div className="font-semibold">itemCode,quantity</div>
              <div>ITM-001,100</div>
              <div>ITM-002,50</div>
              <div>ITM-003,75</div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Item codes must match exactly with your existing items. 
                Quantities will replace current stock levels.
              </AlertDescription>
            </Alert>

            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{result.updated}</div>
                <div className="text-sm text-muted-foreground">Items Updated</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{result.notFound.length}</div>
                <div className="text-sm text-muted-foreground">Not Found</div>
              </div>
            </div>

            {result.notFound.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Item codes not found:</strong> {result.notFound.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
