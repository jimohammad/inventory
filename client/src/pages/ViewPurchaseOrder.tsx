import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams, Link } from "wouter";
import { ArrowLeft, Pencil, FileText, Download, Loader2 } from "lucide-react";

export default function ViewPurchaseOrder() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: order, isLoading } = trpc.purchaseOrders.getById.useQuery({ id: parseInt(id!) });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "confirmed": return "bg-blue-500";
      case "completed": return "bg-green-500";
      case "cancelled": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "delivery_note": return "Delivery Note";
      case "invoice": return "Invoice";
      case "payment_tt": return "Payment TT";
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Purchase order not found</p>
        <Button onClick={() => setLocation("/")}>
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
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{order.poNumber}</h1>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{order.supplier}</p>
          </div>
        </div>
        <Link href={`/purchase-orders/${order.id}/edit`}>
          <Button>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">PO Number</div>
              <div className="text-sm font-medium">{order.poNumber}</div>
              
              <div className="text-sm text-muted-foreground">Supplier</div>
              <div className="text-sm font-medium">{order.supplier}</div>
              
              <div className="text-sm text-muted-foreground">Order Date</div>
              <div className="text-sm font-medium">
                {new Date(order.orderDate).toLocaleDateString()}
              </div>
              
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-sm font-medium">
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">Currency</div>
              <div className="text-sm font-medium">{order.currency}</div>
              
              <div className="text-sm text-muted-foreground">Exchange Rate</div>
              <div className="text-sm font-medium">
                {parseFloat(order.exchangeRate).toFixed(4)}
              </div>
              
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-lg font-bold">
                {order.currency} {parseFloat(order.totalAmount).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {order.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            {order.items?.length || 0} item(s) in this purchase order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-medium">{item.itemName}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {order.currency} {parseFloat(item.totalPrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <div>Quantity: {item.quantity}</div>
                    <div>
                      Unit Price: {order.currency} {parseFloat(item.unitPrice).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {order.documents && order.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              {order.documents.length} document(s) attached
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {order.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{doc.fileName}</div>
                      <div className="text-xs text-muted-foreground">
                        {getDocumentTypeLabel(doc.documentType)} • {(doc.fileSize / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
