import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export function ShareCatalogDialog() {
  const { user } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  if (!user) return null;

  const baseUrl = window.location.origin;
  const publicLink = `${baseUrl}/catalog/${user.id}/public`;
  const withQtyLink = `${baseUrl}/catalog/${user.id}/with-qty`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Share Catalog
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Inventory Catalog</DialogTitle>
          <DialogDescription>
            Generate shareable links for your inventory catalog
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Public Catalog (Prices Only)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Share with sales teams - shows item codes, names, categories, and prices only
            </p>
            <div className="flex gap-2">
              <Input
                value={publicLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(publicLink, "public")}
              >
                {copied === "public" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Internal Catalog (With Stock Quantity)</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Share internally - includes available quantities for stock checking
            </p>
            <div className="flex gap-2">
              <Input
                value={withQtyLink}
                readOnly
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => copyToClipboard(withQtyLink, "withQty")}
              >
                {copied === "withQty" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 These links are public and don't require login. Anyone with the link can view your catalog.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
