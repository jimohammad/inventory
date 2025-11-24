import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Package, Calendar, User, FileText } from "lucide-react";
import { useParams } from "wouter";
import { format } from "date-fns";
import { APP_LOGO, APP_TITLE } from "@/const";

export default function OrderDetail() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const { data: order, isLoading, error } = trpc.orders.getByOrderNumber.useQuery(
    { orderNumber },
    { 
      enabled: !!orderNumber,
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      cacheTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground">
              The order you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">Order Details</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Content */}
      <div className="container py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Order Details</CardTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  {order.orderNumber}
                </p>
              </div>
              <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="text-sm">
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Salesman</p>
                  <p className="font-semibold">{order.salesmanName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-semibold">
                    {format(new Date(order.createdAt), "MMM dd, yyyy, hh:mm a")}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm">{order.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Code</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{item.itemCode}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        KWD {parseFloat(item.price).toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        KWD {parseFloat(item.subtotal).toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Order Summary */}
            <div className="mt-6 pt-6 border-t">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Total Items: <span className="font-semibold text-foreground">{order.totalItems}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Total Quantity: <span className="font-semibold text-foreground">{order.totalQuantity} pcs</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-primary">
                    KWD {parseFloat(order.totalValue).toFixed(3)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
