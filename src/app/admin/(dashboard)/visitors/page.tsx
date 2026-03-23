"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { ExportVisitorsPDF } from "@/components/pdf-export-button";
import { BlockVisitorModal } from "@/components/block-visitor-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Ban,
  CheckCircle,
  Users,
  CreditCard,
  ShieldCheck,
  ShieldX,
  Trash2,
} from "lucide-react";

interface Visitor {
  _id: string;
  name: string;
  email: string;
  rfid?: string;
  program: string;
  type: string;
  blocked: boolean;
  blockedReason?: string;
}

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    rfid: "",
    program: "",
    type: "student",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const fetchVisitors = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/visitors?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setVisitors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const handleBlockConfirm = async (blocked: boolean, reason?: string) => {
    if (!selectedVisitor) return;
    const res = await fetch(`/api/visitors/${selectedVisitor._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked, blockedReason: reason }),
    });
    if (res.ok) {
      fetchVisitors();
      setSelectedVisitor(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          rfid: addForm.rfid.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to add visitor");
        return;
      }
      setAddForm({
        name: "",
        email: "",
        rfid: "",
        program: "",
        type: "student",
      });
      setAddModalOpen(false);
      fetchVisitors();
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteVisitor = async (visitor: Visitor) => {
    const confirmed = window.confirm(
      `Delete ${visitor.name}? This will also delete all visit logs linked to this visitor.`
    );

    if (!confirmed) return;

    setDeleteLoadingId(visitor._id);
    try {
      const res = await fetch(`/api/visitors/${visitor._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || "Failed to delete visitor");
        return;
      }

      fetchVisitors();
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visitors</h1>
          <p className="text-muted-foreground mt-1">
            Manage registered library visitors
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <ExportVisitorsPDF data={visitors} />
          <Button onClick={() => setAddModalOpen(true)} variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Add Visitor
          </Button>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name, program, or email..."
        className="max-w-sm"
      />

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>RFID</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-primary"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Loading visitors...
                  </div>
                </TableCell>
              </TableRow>
            ) : visitors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No visitors found
                </TableCell>
              </TableRow>
            ) : (
              visitors.map((v) => (
                <TableRow key={v._id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.email}
                  </TableCell>
                  <TableCell>
                    {v.rfid ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-muted px-2 py-1 rounded-md">
                        <CreditCard className="h-3 w-3" />
                        {v.rfid}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">&mdash;</span>
                    )}
                  </TableCell>
                  <TableCell>{v.program}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                      {v.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {v.blocked ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        <ShieldX className="h-3 w-3" />
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                        <ShieldCheck className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={
                          v.blocked
                            ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            : "text-destructive hover:text-destructive hover:bg-destructive/5"
                        }
                        onClick={() => {
                          setSelectedVisitor(v);
                          setBlockModalOpen(true);
                        }}
                      >
                        {v.blocked ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-1.5" />
                            Block
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteLoadingId === v._id}
                        onClick={() => handleDeleteVisitor(v)}
                      >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        {deleteLoadingId === v._id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Block Modal */}
      <BlockVisitorModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        visitor={selectedVisitor}
        onConfirm={handleBlockConfirm}
      />

      {/* Add Visitor Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent onClose={() => setAddModalOpen(false)}>
          <DialogHeader>
            <DialogTitle>Add Visitor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
            {addError && (
              <p className="text-sm text-destructive bg-destructive/5 p-3 rounded-lg">
                {addError}
              </p>
            )}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={addForm.name}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>RFID (optional)</Label>
              <Input
                value={addForm.rfid}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, rfid: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
              <Input
                value={addForm.program}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, program: e.target.value }))
                }
                placeholder="e.g., BSIT, BSCS, Faculty - CIS"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={addForm.type}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, type: e.target.value }))
                }
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="employee">Employee</option>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={addLoading}>
                {addLoading ? "Adding..." : "Add Visitor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
