"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, ShieldCheck } from "lucide-react";

interface BlockVisitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitor: { _id: string; name: string; blocked: boolean } | null;
  onConfirm: (blocked: boolean, reason?: string) => Promise<void>;
}

export function BlockVisitorModal({
  open,
  onOpenChange,
  visitor,
  onConfirm,
}: BlockVisitorModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!visitor) return;
    setLoading(true);
    try {
      await onConfirm(visitor.blocked ? false : true, reason);
      setReason("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!visitor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                visitor.blocked
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {visitor.blocked ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <DialogTitle>
              {visitor.blocked ? "Unblock" : "Block"} Visitor
            </DialogTitle>
          </div>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mt-2">
          {visitor.blocked
            ? `Unblock ${visitor.name}? They will be able to use the library again.`
            : `Block ${visitor.name}? They will not be allowed to check in to the library.`}
        </p>
        {!visitor.blocked && (
          <div className="space-y-2 mt-4">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Policy violation"
              disabled={loading}
            />
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={visitor.blocked ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : visitor.blocked
                ? "Unblock Visitor"
                : "Block Visitor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
