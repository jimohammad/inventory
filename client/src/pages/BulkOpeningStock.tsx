import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Download, Loader2, ArrowLeft } from "lucide-react";

export default function BulkOpeningStock() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateMutation = trpc.items.bulkUpdateOpeningStock.useMutation({
    onSuccess: (result: { updated: number; notFound: string[] }) => {
      toast.success(`Successfully updated ${result.updated} items`);
      setFile(null);
      setLocation("/items");
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
      setIsUploading(false);
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
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file is empty or invalid");
        setIsUploading(false);
        return;
      }

      // Skip header row and parse data
      const updates: Array<{ itemCode: string; openingStock: number }> = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [itemCode, openingStock] = line.split(',').map(s => s.trim());
        
        if (!itemCode) {
          toast.error(`Invalid data at line ${i + 1}: missing item code`);
          setIsUploading(false);
          return;
        }
        
        const stock = parseInt(openingStock);
        if (isNaN(stock) || stock < 0) {
          toast.error(`Invalid opening stock at line ${i + 1}: must be a non-negative number`);
          setIsUploading(false);
          return;
        }
        
        updates.push({ itemCode, openingStock: stock });
      }

      if (updates.length === 0) {
        toast.error("No valid data found in CSV");
        setIsUploading(false);
        return;
      }

      updateMutation.mutate({ updates });
    } catch (error) {
      toast.error("Failed to read file");
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "itemCode,openingStock\nITEM001,100\nITEM002,50\nITEM003,200";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'opening_stock_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Opening Stock Import</h1>
          <p className="text-muted-foreground mt-1">Upload CSV file to set opening stock for multiple items</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/items")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Items
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file with item codes and opening stock quantities
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
                disabled={isUploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload and Update
                </>
              )}
            </Button>
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
              <div className="font-bold">itemCode,openingStock</div>
              <div>ITEM001,100</div>
              <div>ITEM002,50</div>
              <div>ITEM003,200</div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Requirements:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>First row must be headers: itemCode,openingStock</li>
                <li>Item codes must match existing items in your database</li>
                <li>Opening stock must be non-negative integers</li>
                <li>Use comma (,) as separator</li>
              </ul>
            </div>

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

      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Understanding Stock Fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>Opening Stock:</strong> The initial quantity when you first added the item to your system. 
            This is a historical record that helps you track how much inventory you started with. 
            It doesn't change unless you manually update it.
          </div>
          <div>
            <strong>Available Qty:</strong> The current stock on hand that changes as you receive items from suppliers 
            or sell them. This is updated automatically when you sync with Google Sheets or manually adjust quantities.
          </div>
          <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
            <strong>Example:</strong> If you started with 100 units (Opening Stock) and sold 30, your Available Qty would be 70. 
            The Opening Stock remains 100 for historical reference.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
