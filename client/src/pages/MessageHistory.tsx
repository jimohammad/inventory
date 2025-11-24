import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, CheckCircle, XCircle, Clock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";

export default function MessageHistory() {
  const { user, loading: authLoading } = useAuth();

  const { data: messages, isLoading } = trpc.messages.list.useQuery(undefined, {
    enabled: !!user,
  });

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
        <p>Please log in to view message history</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge variant="default" className="bg-green-500">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Message History</h1>
        <p className="text-muted-foreground">View all sent WhatsApp messages and their delivery status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Recent Messages ({messages?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!messages || messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No messages sent yet. Start sending messages from the Bulk Messaging page.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{msg.customerName}</h3>
                        {getStatusBadge(msg.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{msg.customerPhone}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {msg.sentAt ? (
                        <div className="flex items-center gap-1">
                          {getStatusIcon(msg.status)}
                          <span>{format(new Date(msg.sentAt), "MMM d, yyyy HH:mm")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          {getStatusIcon(msg.status)}
                          <span>{format(new Date(msg.createdAt), "MMM d, yyyy HH:mm")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded p-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {msg.errorMessage && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-3">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        <strong>Error:</strong> {msg.errorMessage}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
