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

  const shareOnWhatsApp = (link: string, catalogType: string) => {
    const message = catalogType === 'public' 
      ? `Check out our latest inventory catalog with prices:\n${link}`
      : `Here's our inventory catalog with current stock levels:\n${link}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-16 bg-gradient-to-br from-purple-200 to-purple-300 hover:from-purple-300 hover:to-purple-400 text-purple-900 border-0 shadow-md hover:shadow-lg transition-all duration-300">
          <Share2 className="w-5 h-5 mr-2" />
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
                title="Copy link"
              >
                {copied === "public" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => shareOnWhatsApp(publicLink, 'public')}
                className="bg-[#25D366] hover:bg-[#20BA5A] text-white border-[#25D366]"
                title="Share on WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
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
                title="Copy link"
              >
                {copied === "withQty" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={() => shareOnWhatsApp(withQtyLink, 'internal')}
                className="bg-[#25D366] hover:bg-[#20BA5A] text-white border-[#25D366]"
                title="Share on WhatsApp"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
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
