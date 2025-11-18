import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, Pencil, Mail, Phone, MapPin, FileText, Loader2, Calendar, Banknote } from "lucide-react";
import { useMemo } from "react";

export default function SupplierDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: supplier, isLoading: supplierLoading } = trpc.suppliers.getById.useQuery({ id: parseInt(id!) });
  const { data: allOrders, isLoading: ordersLoading } = trpc.purchaseOrders.list.useQuery();

  // Filter orders for this supplier
  const supplierOrders = useMemo(() => {
    if (!allOrders || !supplier) return [];
    return allOrders.filter(order => order.supplier === supplier.name);
  }, [allOrders, supplier]);

  // Calculate total spending
  const totalSpending = useMemo(() => {
    if (!supplierOrders) return { USD: 0, AED: 0, KWD: 0 };
    
    const totals = { USD: 0, AED: 0, KWD: 0 };
    supplierOrders.forEach(order => {
      const amount = parseFloat(order.totalAmount);
      if (order.currency === "USD") totals.USD += amount;
      else if (order.currency === "AED") totals.AED += amount;
      else if (order.currency === "KWD") totals.KWD += amount;
    });
    
    return totals;
  }, [supplierOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "confirmed": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  if (supplierLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Supplier not found</p>
        <Button onClick={() => setLocation("/suppliers")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/suppliers")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
            {supplier.contactPerson && (
              <p className="text-muted-foreground mt-1">Contact: {supplier.contactPerson}</p>
            )}
          </div>
        </div>
        <Link href={`/suppliers/${supplier.id}/edit`}>
          <Button>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <a href={`mailto:${supplier.email}`} className="hover:underline">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <a href={`tel:${supplier.phone}`} className="hover:underline">
                  {supplier.phone}
                </a>
              </div>
            )}
            {supplier.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <span>{supplier.address}</span>
              </div>
            )}
            {supplier.notes && (
              <div className="pt-3 border-t">
                <div className="text-sm font-medium mb-1">Notes</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Total Orders</div>
              <div className="text-sm font-bold">{supplierOrders.length}</div>
              
              {totalSpending.USD > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">Total (USD)</div>
                  <div className="text-sm font-bold">
                    USD {totalSpending.USD.toLocaleString()}
                  </div>
                </>
              )}
              
              {totalSpending.AED > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">Total (AED)</div>
                  <div className="text-sm font-bold">
                    AED {totalSpending.AED.toLocaleString()}
                  </div>
                </>
              )}
              
              {totalSpending.KWD > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">Total (KWD)</div>
                  <div className="text-sm font-bold text-green-600">
                    KWD {totalSpending.KWD.toLocaleString()}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            {supplierOrders.length} purchase order(s) from this supplier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supplierOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No purchase orders yet
            </p>
          ) : (
            <div className="space-y-3">
              {supplierOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.poNumber}</span>
                        <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                      </div>
                      {order.supplierInvoiceNumber && (
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Invoice: {order.supplierInvoiceNumber}
                        </div>
                      )}
                    </div>
                    <Link href={`/purchase-orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.orderDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Banknote className="w-3 h-3" />
                      {order.currency} {parseFloat(order.totalAmount).toLocaleString()}
                    </div>
                    {order.exchangeRateKWD && (
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        KWD {(parseFloat(order.totalAmount) * parseFloat(order.exchangeRateKWD)).toFixed(3)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
