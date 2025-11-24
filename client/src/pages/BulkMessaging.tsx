import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Send, Users, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BulkMessaging() {
  const { user, loading: authLoading } = useAuth();
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [catalogType, setCatalogType] = useState<"public" | "internal">("public");
  const utils = trpc.useUtils();

  const { data: customers, isLoading } = trpc.customers.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Group customers by area
  const customersByArea = customers?.reduce((acc, customer) => {
    if (!acc[customer.area]) acc[customer.area] = [];
    acc[customer.area].push(customer);
    return acc;
  }, {} as Record<string, typeof customers>);

  const handleSelectAll = (area: string) => {
    const areaCustomers = customersByArea?.[area] || [];
    const areaCustomerIds = areaCustomers.map(c => c.id);
    const allSelected = areaCustomerIds.every(id => selectedCustomers.includes(id));

    if (allSelected) {
      // Deselect all in this area
      setSelectedCustomers(prev => prev.filter(id => !areaCustomerIds.includes(id)));
    } else {
      // Select all in this area
      setSelectedCustomers(prev => Array.from(new Set([...prev, ...areaCustomerIds])));
    }
  };

  const handleToggleCustomer = (customerId: number) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const insertCatalogLink = () => {
    if (!user) return;
    const catalogUrl = `${window.location.origin}/catalog/${user.id}/${catalogType}`;
    setMessage(prev => prev + (prev ? "\n\n" : "") + catalogUrl);
  };

  const sendBulkMutation = trpc.messages.sendBulk.useMutation({
    onSuccess: (data) => {
      toast.success(`Messages sent: ${data.successCount} successful, ${data.failCount} failed`);
      setSelectedCustomers([]);
      setMessage("");
      utils.messages.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to send messages: ${error.message}`);
    },
  });

  const handleSendMessages = async () => {
    if (selectedCustomers.length === 0) {
      toast.error("Please select at least one customer");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    sendBulkMutation.mutate({
      customerIds: selectedCustomers,
      message: message,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to access bulk messaging</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bulk Messaging</h1>
        <p className="text-muted-foreground">Send catalog links to multiple customers via WhatsApp</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Selection */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Select Customers ({selectedCustomers.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!customersByArea || Object.keys(customersByArea).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No customers found. Add customers first to send messages.
              </p>
            ) : (
              Object.entries(customersByArea).map(([area, areaCustomers]) => (
                <div key={area} className="space-y-2">
                  <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                    <h3 className="font-semibold">{area}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAll(area)}
                    >
                      {areaCustomers?.every(c => selectedCustomers.includes(c.id))
                        ? "Deselect All"
                        : "Select All"}
                    </Button>
                  </div>
                  <div className="grid gap-2 pl-4">
                    {areaCustomers?.map(customer => (
                      <div key={customer.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`customer-${customer.id}`}
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => handleToggleCustomer(customer.id)}
                        />
                        <label
                          htmlFor={`customer-${customer.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {customer.name} - {customer.phone}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Message Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Message
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Catalog Type</label>
              <div className="flex gap-2">
                <Button
                  variant={catalogType === "public" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCatalogType("public")}
                  className="flex-1"
                >
                  Public
                </Button>
                <Button
                  variant={catalogType === "internal" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCatalogType("internal")}
                  className="flex-1"
                >
                  Internal
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message Template</label>
              <Textarea
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="resize-none"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={insertCatalogLink}
              className="w-full"
            >
              Insert Catalog Link
            </Button>

            <Button
              onClick={handleSendMessages}
              disabled={sendBulkMutation.isPending || selectedCustomers.length === 0 || !message.trim()}
              className="w-full"
            >
              {sendBulkMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to {selectedCustomers.length} Customer{selectedCustomers.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
