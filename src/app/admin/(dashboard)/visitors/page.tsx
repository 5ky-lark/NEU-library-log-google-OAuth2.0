"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { ExportVisitorsPDF } from "@/components/pdf-export-button";
import { BlockVisitorModal } from "@/components/block-visitor-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { COLLEGES } from "@/lib/constants";
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
  ShieldCheck,
  ShieldX,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Visitor {
  _id: string;
  name: string;
  email: string;
  program: string;
  type: string;
  blocked: boolean;
  blockedReason?: string;
}

export default function AdminVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "student" | "teacher" | "employee">("all");
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    program: "",
    type: "student",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshTick, setRefreshTick] = useState(0);
  const rowsPerPage = 10;

  const buildParams = useCallback(
    (all = false) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (all) {
        params.set("all", "1");
      } else {
        params.set("page", String(currentPage));
        params.set("pageSize", String(rowsPerPage));
      }
      return params;
    },
    [currentPage, debouncedSearch, statusFilter, typeFilter]
  );

  const fetchVisitors = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      try {
        const res = await fetch(`/api/visitors?${buildParams(false).toString()}`, {
          signal,
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch visitors");
        }

        setVisitors(Array.isArray(data?.items) ? data.items : []);
        setTotalCount(Number(data?.total || 0));
        setActiveCount(Number(data?.summary?.activeCount || 0));
        setBlockedCount(Number(data?.summary?.blockedCount || 0));
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setVisitors([]);
          setTotalCount(0);
          setActiveCount(0);
          setBlockedCount(0);
        }
      } finally {
        setLoading(false);
      }
    },
    [buildParams]
  );

  const fetchAllVisitorsForExport = useCallback(async () => {
    const res = await fetch(`/api/visitors?${buildParams(true).toString()}`);
    const data = await res.json();
    return Array.isArray(data?.items) ? data.items : [];
  }, [buildParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchVisitors(controller.signal);
    return () => controller.abort();
  }, [fetchVisitors, refreshTick]);

  const handleBlockConfirm = async (blocked: boolean, reason?: string) => {
    if (!selectedVisitor) return;
    const res = await fetch(`/api/visitors/${selectedVisitor._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked, blockedReason: reason }),
    });
    if (res.ok) {
      setRefreshTick((value) => value + 1);
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
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Failed to add visitor");
        return;
      }
      setAddForm({
        name: "",
        email: "",
        program: "",
        type: "student",
      });
      setAddModalOpen(false);
      setRefreshTick((value) => value + 1);
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

      setRefreshTick((value) => value + 1);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const pageStart = (currentPage - 1) * rowsPerPage;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, typeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registered Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage registered user accounts for library access
          </p>
        </div>
        <div className="flex gap-2 self-start">
          <ExportVisitorsPDF
            data={visitors}
            filename="registered-accounts"
            fetchAllData={fetchAllVisitorsForExport}
          />
          <Button onClick={() => setAddModalOpen(true)} variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Accounts</p>
          <p className="text-2xl font-semibold mt-1">{totalCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Accounts</p>
          <p className="text-2xl font-semibold mt-1 text-emerald-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Blocked Accounts</p>
          <p className="text-2xl font-semibold mt-1 text-destructive">{blockedCount}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(240px,1fr),180px,180px]">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, program, or email..."
          className="max-w-full"
        />
        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "blocked")
          }
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </Select>
        <Select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(
              e.target.value as "all" | "student" | "teacher" | "employee"
            )
          }
        >
          <option value="all">All Types</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="employee">Staff</option>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
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
                  colSpan={6}
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
                      Loading accounts...
                  </div>
                </TableCell>
              </TableRow>
            ) : visitors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No accounts found
                </TableCell>
              </TableRow>
            ) : (
              visitors.map((v) => (
                <TableRow key={v._id}>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {v.email}
                  </TableCell>
                  <TableCell>{v.program}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                      {v.type === "faculty" ? "teacher" : v.type}
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

      {!loading && totalCount > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {pageStart + 1}-{Math.min(pageStart + rowsPerPage, totalCount)} of {totalCount} account{totalCount !== 1 && "s"}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Prev
            </Button>

            <span className="text-sm text-muted-foreground min-w-[64px] text-center">
              Page {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

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
            <DialogTitle>Add Account</DialogTitle>
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
              <Label>Program</Label>
              <Select
                value={addForm.program}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, program: e.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Select program
                </option>
                {COLLEGES.map((college) => (
                  <option key={college} value={college}>
                    {college}
                  </option>
                ))}
              </Select>
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
                <option value="teacher">Teacher</option>
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
                {addLoading ? "Adding..." : "Add Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
