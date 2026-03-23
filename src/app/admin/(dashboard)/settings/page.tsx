"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Plus, Save, Shield, Trash2, X } from "lucide-react";

interface AdminAccount {
  _id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export default function AdminSettingsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin-accounts");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch admin accounts");
      }

      setAccounts(Array.isArray(data?.items) ? data.items : []);
    } catch (fetchError) {
      setAccounts([]);
      setError((fetchError as Error).message || "Failed to fetch admin accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenEdit = (account: AdminAccount) => {
    setEditId(account._id);
    setEditForm({
      name: account.name,
      email: account.email,
    });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditForm({ name: "", email: "" });
  };

  const handleSaveEdit = async () => {
    if (!editId) return;

    setSaveLoading(true);
    try {
      const res = await fetch(`/api/admin-accounts/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok) {
        window.alert(data?.error || "Failed to update admin account");
        return;
      }

      setAccounts((prev) =>
        prev.map((account) => (account._id === editId ? data : account))
      );
      handleCancelEdit();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setAddError("");
    setAddLoading(true);

    try {
      const res = await fetch("/api/admin-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();

      if (!res.ok) {
        setAddError(data?.error || "Failed to add admin account");
        return;
      }

      setAddForm({ name: "", email: "" });
      setAddOpen(false);
      await fetchAccounts();
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (account: AdminAccount) => {
    const confirmed = window.confirm(
      `Remove admin access for ${account.email}?`
    );

    if (!confirmed) return;

    setDeleteLoadingId(account._id);
    try {
      const res = await fetch(`/api/admin-accounts/${account._id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        window.alert(data?.error || "Failed to remove admin account");
        return;
      }

      setAccounts((prev) => prev.filter((a) => a._id !== account._id));
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground mt-1">
            View and manage Google admin accounts allowed to access the admin dashboard
          </p>
        </div>
        <Button variant="gradient" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Admin Account
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Admin Accounts</p>
          <p className="text-2xl font-semibold mt-1">{accounts.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Allowed Domain</p>
          <p className="text-2xl font-semibold mt-1">{process.env.NEXT_PUBLIC_ALLOWED_DOMAIN || "neu.edu.ph"}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <div className="rounded-xl border bg-card shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Loading admin accounts...
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No admin accounts found
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => {
                const isEditing = editId === account._id;
                return (
                  <TableRow key={account._id}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                        />
                      ) : (
                        <span className="font-medium">{account.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editForm.email}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, email: e.target.value }))
                          }
                        />
                      ) : (
                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          {account.email}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {account.createdAt
                        ? new Date(account.createdAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={saveLoading}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={saveLoading}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {saveLoading ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(account)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(account)}
                            disabled={deleteLoadingId === account._id}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deleteLoadingId === account._id ? "Removing..." : "Remove"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Admin Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name</Label>
              <Input
                id="admin-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Admin Name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="name@neu.edu.ph"
                required
              />
            </div>

            {addError && (
              <p className="text-sm text-red-500">{addError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={addLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addLoading}>
                {addLoading ? "Adding..." : "Add Admin"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
