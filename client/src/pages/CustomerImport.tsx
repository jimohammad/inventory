import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface ParsedCustomer {
  name: string;
  phone: string;
  area: string;
  valid: boolean;
  errors: string[];
}

const VALID_AREAS = [
  "Sharq",
  "Margab",
  "Mubarkiya",
  "Souk Wataniya",
  "Fahaheel",
  "Jaleeb Shuwaikh",
  "Jahra",
  "Salmiya",
  "Hawally",
  "Souk Qurain",
  "Team",
];

export default function CustomerImport() {
  const { user, loading: authLoading } = useAuth();
  const [parsedData, setParsedData] = useState<ParsedCustomer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const importMutation = trpc.customers.importFromCsv.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.imported} customers`);
      setParsedData([]);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const validateCustomer = (customer: { name: string; phone: string; area: string }): ParsedCustomer => {
    const errors: string[] = [];

    if (!customer.name || customer.name.trim().length === 0) {
      errors.push("Name is required");
    }

    if (!customer.phone || customer.phone.trim().length === 0) {
      errors.push("Phone is required");
    } else if (!/^\+?\d{8,15}$/.test(customer.phone.replace(/[\s-]/g, ""))) {
      errors.push("Invalid phone format");
    }

    if (!customer.area || customer.area.trim().length === 0) {
      errors.push("Area is required");
    } else if (!VALID_AREAS.includes(customer.area)) {
      errors.push(`Invalid area (must be one of: ${VALID_AREAS.join(", ")})`);
    }

    return {
      name: customer.name,
      phone: customer.phone,
      area: customer.area,
      valid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsProcessing(true);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());

      if (lines.length < 2) {
        toast.error("CSV file must contain at least a header row and one data row");
        setIsProcessing(false);
        return;
      }

      // Parse CSV (simple implementation, assumes comma-separated)
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const nameIndex = headers.indexOf("name");
      const phoneIndex = headers.indexOf("phone");
      const areaIndex = headers.indexOf("area");

      if (nameIndex === -1 || phoneIndex === -1 || areaIndex === -1) {
        toast.error("CSV must contain 'name', 'phone', and 'area' columns");
        setIsProcessing(false);
        return;
      }

      const parsed: ParsedCustomer[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim());
        if (values.length < 3) continue;

        const customer = {
          name: values[nameIndex] || "",
          phone: values[phoneIndex] || "",
          area: values[areaIndex] || "",
        };

        parsed.push(validateCustomer(customer));
      }

      setParsedData(parsed);
      toast.success(`Parsed ${parsed.length} customers from CSV`);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error("Failed to parse CSV file");
    } finally {
      setIsProcessing(false);
      event.target.value = "";
    }
  };

  const handleImport = () => {
    const validCustomers = parsedData.filter(c => c.valid);

    if (validCustomers.length === 0) {
      toast.error("No valid customers to import");
      return;
    }

    importMutation.mutate({
      customers: validCustomers.map(c => ({
        name: c.name,
        phone: c.phone,
        area: c.area,
      })),
    });
  };

  const downloadTemplate = () => {
    const template = `name,phone,area
Ahmed Al-Sayed,50123456,Salmiya
Fatima Hassan,51234567,Hawally
Mohammed Ali,52345678,Sharq`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "customer_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to import customers</p>
      </div>
    );
  }

  const validCount = parsedData.filter(c => c.valid).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Import Customers</h1>
        <p className="text-muted-foreground">Upload a CSV file to bulk import customers</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload CSV File
            </CardTitle>
            <CardDescription>
              Upload a CSV file with columns: name, phone, area
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4">
              <label htmlFor="csv-upload">
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload CSV file</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB</p>
                </div>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing || importMutation.isPending}
                />
              </label>

              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              CSV Format Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium">Required Columns:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>name</strong> - Customer full name</li>
                <li><strong>phone</strong> - Phone number (8-15 digits, can include +)</li>
                <li><strong>area</strong> - Must be one of the valid areas</li>
              </ul>

              <p className="font-medium mt-4">Valid Areas:</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {VALID_AREAS.map(area => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview ({parsedData.length} rows)</CardTitle>
                <CardDescription>
                  {validCount} valid, {invalidCount} invalid
                </CardDescription>
              </div>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Import {validCount} Customers
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {customer.valid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.area}</TableCell>
                      <TableCell>
                        {customer.errors.length > 0 && (
                          <span className="text-xs text-red-500">
                            {customer.errors.join(", ")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
