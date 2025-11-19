import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, MessageCircle, Send } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function WhatsAppContacts() {
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [catalogType, setCatalogType] = useState<"public" | "internal">("public");

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: contacts = [], isLoading } = trpc.whatsappContacts.list.useQuery();

  const createMutation = trpc.whatsappContacts.create.useMutation({
    onSuccess: () => {
      toast.success("Contact added successfully");
      utils.whatsappContacts.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add contact");
    },
  });

  const updateMutation = trpc.whatsappContacts.update.useMutation({
    onSuccess: () => {
      toast.success("Contact updated successfully");
      utils.whatsappContacts.list.invalidate();
      setIsEditOpen(false);
      setEditingContact(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update contact");
    },
  });

  const deleteMutation = trpc.whatsappContacts.delete.useMutation({
    onSuccess: () => {
      toast.success("Contact deleted successfully");
      utils.whatsappContacts.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete contact");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      notes: "",
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.phoneNumber) {
      toast.error("Name and phone number are required");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (contact: any) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      notes: contact.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name || !formData.phoneNumber) {
      toast.error("Name and phone number are required");
      return;
    }
    updateMutation.mutate({
      id: editingContact.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      deleteMutation.mutate({ id });
    }
  };

  const toggleContactSelection = (id: number) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((c: any) => c.id));
    }
  };

  const handleBroadcast = () => {
    if (selectedContacts.length === 0) {
      toast.error("Please select at least one contact");
      return;
    }
    setIsBroadcastOpen(true);
  };

  const startBroadcast = () => {
    const selectedContactsList = contacts.filter((c: any) => selectedContacts.includes(c.id));
    const catalogUrl = catalogType === "public"
      ? `${window.location.origin}/catalog/${user?.id}/public`
      : `${window.location.origin}/catalog/${user?.id}/internal`;
    
    const message = catalogType === "public"
      ? `Hello! Here's our latest product catalog with prices: ${catalogUrl}`
      : `Hello! Here's our internal catalog with stock quantities: ${catalogUrl}`;

    toast.success(`Opening WhatsApp for ${selectedContactsList.length} contact(s)...`);
    setIsBroadcastOpen(false);

    // Open WhatsApp for each contact with a delay
    selectedContactsList.forEach((contact: any, index: number) => {
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/${contact.phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }, index * 2000); // 2 second delay between each
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your sales team contacts for catalog broadcasting
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No contacts yet</CardTitle>
            <CardDescription>
              Add your first WhatsApp contact to start broadcasting catalogs
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            <Button
              onClick={handleBroadcast}
              disabled={selectedContacts.length === 0}
              variant="default"
            >
              <Send className="mr-2 h-4 w-4" />
              Broadcast to Selected ({selectedContacts.length})
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedContacts.length === contacts.length && contacts.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact: any) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => toggleContactSelection(contact.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.phoneNumber}</TableCell>
                      <TableCell className="max-w-xs truncate">{contact.notes || "-"}</TableCell>
                      <TableCell>{new Date(contact.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const url = `https://wa.me/${contact.phoneNumber.replace(/[^0-9]/g, '')}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(contact)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Add a WhatsApp contact for catalog broadcasting
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+96512345678"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Include country code (e.g., +965 for Kuwait)
              </p>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this contact"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
            <DialogDescription>
              Update contact information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div>
              <Label htmlFor="edit-phoneNumber">Phone Number *</Label>
              <Input
                id="edit-phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+96512345678"
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this contact"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Dialog */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast Catalog</DialogTitle>
            <DialogDescription>
              Choose which catalog to send to {selectedContacts.length} selected contact(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Catalog Type</Label>
              <div className="flex gap-4">
                <Button
                  variant={catalogType === "public" ? "default" : "outline"}
                  onClick={() => setCatalogType("public")}
                  className="flex-1"
                >
                  Public Catalog
                  <span className="text-xs ml-2">(Prices only)</span>
                </Button>
                <Button
                  variant={catalogType === "internal" ? "default" : "outline"}
                  onClick={() => setCatalogType("internal")}
                  className="flex-1"
                >
                  Internal Catalog
                  <span className="text-xs ml-2">(With quantities)</span>
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm">
                <strong>Note:</strong> WhatsApp will open in a new tab for each contact with the catalog link pre-filled. 
                There will be a 2-second delay between each contact to prevent browser blocking.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button onClick={startBroadcast}>
              <Send className="mr-2 h-4 w-4" />
              Start Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
