import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CreateSupplier() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier created successfully");
      setLocation("/suppliers");
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    createMutation.mutate({
      name,
      contactPerson: contactPerson.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Supplier</h1>
          <p className="text-muted-foreground mt-1">Create a new supplier record</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setLocation("/suppliers")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Supplier"
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Supplier Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ABC Trading Company"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input
              id="contactPerson"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@supplier.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address, city, country"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this supplier..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
