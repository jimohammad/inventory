import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, Download, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BulkItemImport() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<{ created: number; skipped: Array<{ itemCode: string; reason: string }> } | null>(null);

  const createMutation = trpc.items.bulkCreate.useMutation({
    onSuccess: (result: { created: number; skipped: Array<{ itemCode: string; reason: string }> }) => {
      setResults(result);
      setIsUploading(false);
      if (result.created > 0) {
        toast.success(`Successfully created ${result.created} items`);
      }
      if (result.skipped.length > 0) {
        toast.warning(`${result.skipped.length} items were skipped`);
      }
      setFile(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to import: ${error.message}`);
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
      setResults(null);
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

      // Parse header
      const header = lines[0].toLowerCase().split(',').map(s => s.trim());
      const requiredFields = ['itemcode', 'name', 'category'];
      const missingFields = requiredFields.filter(field => !header.includes(field));
      
      if (missingFields.length > 0) {
        toast.error(`Missing required columns: ${missingFields.join(', ')}`);
        setIsUploading(false);
        return;
      }

      // Parse data rows
      const items: Array<{
        itemCode: string;
        name: string;
        category: 'Motorola' | 'Samsung' | 'Redmi' | 'Realme' | 'Meizu' | 'Honor';
        purchasePrice?: number;
        sellingPrice?: number;
        availableQty?: number;
        openingStock?: number;
      }> = [];

      const validCategories = ['Motorola', 'Samsung', 'Redmi', 'Realme', 'Meizu', 'Honor'];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(s => s.trim());
        const row: any = {};
        
        header.forEach((col, idx) => {
          row[col] = values[idx] || '';
        });

        if (!row.itemcode || !row.name || !row.category) {
          toast.error(`Line ${i + 1}: Missing required fields`);
          setIsUploading(false);
          return;
        }

        if (!validCategories.includes(row.category)) {
          toast.error(`Line ${i + 1}: Invalid category "${row.category}". Must be one of: ${validCategories.join(', ')}`);
          setIsUploading(false);
          return;
        }

        const item: any = {
          itemCode: row.itemcode,
          name: row.name,
          category: row.category as 'Motorola' | 'Samsung' | 'Redmi' | 'Realme' | 'Meizu' | 'Honor',
        };

        if (row.purchaseprice) {
          const price = parseFloat(row.purchaseprice);
          if (isNaN(price) || price < 0) {
            toast.error(`Line ${i + 1}: Invalid purchase price`);
            setIsUploading(false);
            return;
          }
          item.purchasePrice = price;
        }

        if (row.sellingprice) {
          const price = parseFloat(row.sellingprice);
          if (isNaN(price) || price < 0) {
            toast.error(`Line ${i + 1}: Invalid selling price`);
            setIsUploading(false);
            return;
          }
          item.sellingPrice = price;
        }

        if (row.availableqty) {
          const qty = parseInt(row.availableqty);
          if (isNaN(qty) || qty < 0) {
            toast.error(`Line ${i + 1}: Invalid available quantity`);
            setIsUploading(false);
            return;
          }
          item.availableQty = qty;
        }

        if (row.openingstock) {
          const stock = parseInt(row.openingstock);
          if (isNaN(stock) || stock < 0) {
            toast.error(`Line ${i + 1}: Invalid opening stock`);
            setIsUploading(false);
            return;
          }
          item.openingStock = stock;
        }

        items.push(item);
      }

      if (items.length === 0) {
        toast.error("No valid items found in CSV");
        setIsUploading(false);
        return;
      }

      createMutation.mutate({ items });
    } catch (error) {
      toast.error("Failed to read file");
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "itemCode,name,category,purchasePrice,sellingPrice,availableQty,openingStock\nITEM001,Samsung Galaxy A54,Samsung,250,300,100,100\nITEM002,Motorola Edge 40,Motorola,200,250,50,50\nITEM003,Redmi Note 12,Redmi,150,180,200,200";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_items_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Item Import</h1>
          <p className="text-muted-foreground mt-1">Upload CSV file to add multiple items at once</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/items")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Items
        </Button>
      </div>

      {results && results.skipped.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Skipped Items:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {results.skipped.map((skip, idx) => (
                  <div key={idx} className="text-sm">
                    <strong>{skip.itemCode}:</strong> {skip.reason}
                  </div>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file with item details to import
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
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Items
                </>
              )}
            </Button>

            {results && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Import Complete
                </p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  {results.created} items created successfully
                </p>
                {results.skipped.length > 0 && (
                  <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                    {results.skipped.length} items skipped
                  </p>
                )}
              </div>
            )}
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
            <div className="bg-muted p-4 rounded-md font-mono text-xs overflow-x-auto">
              <div className="font-bold whitespace-nowrap">itemCode,name,category,purchasePrice,sellingPrice,availableQty,openingStock</div>
              <div className="whitespace-nowrap">ITEM001,Samsung Galaxy A54,Samsung,250,300,100,100</div>
              <div className="whitespace-nowrap">ITEM002,Motorola Edge 40,Motorola,200,250,50,50</div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Required Fields:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>itemCode</strong> - Unique item identifier</li>
                <li><strong>name</strong> - Item name</li>
                <li><strong>category</strong> - Must be: Motorola, Samsung, Redmi, Realme, Meizu, or Honor</li>
              </ul>
              <p className="pt-2"><strong>Optional Fields:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>purchasePrice - Cost price</li>
                <li>sellingPrice - Selling price</li>
                <li>availableQty - Current stock</li>
                <li>openingStock - Initial stock</li>
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
    </div>
  );
}
