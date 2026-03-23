"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportVisitorsPDFProps {
  data: {
    name: string;
    email: string;
    program: string;
    type: string;
    blocked: boolean;
  }[];
  filename?: string;
  fetchAllData?: () => Promise<
    {
      name: string;
      email: string;
      program: string;
      type: string;
      blocked: boolean;
    }[]
  >;
}

export function ExportVisitorsPDF({
  data,
  filename = "visitors",
  fetchAllData,
}: ExportVisitorsPDFProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const sourceData = fetchAllData ? await fetchAllData() : data;

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("NEU Library - Visitor List", 14, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: 40,
        head: [["Name", "Email", "Program", "Type", "Status"]],
        body: sourceData.map((v) => [
          v.name,
          v.email,
          v.program,
          v.type,
          v.blocked ? "Blocked" : "Active",
        ]),
        headStyles: {
          fillColor: [59, 130, 246],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={(data.length === 0 && !fetchAllData) || exporting}
    >
      <FileDown className="h-4 w-4 mr-2" />
      {exporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
}

interface ExportLogsPDFProps {
  data: {
    visitorData?: { name?: string; program?: string };
    reason?: string;
    checkInTime?: string;
  }[];
  filename?: string;
  fetchAllData?: () => Promise<
    {
      visitorData?: { name?: string; program?: string };
      reason?: string;
      checkInTime?: string;
    }[]
  >;
}

export function ExportLogsPDF({
  data,
  filename = "visit-logs",
  fetchAllData,
}: ExportLogsPDFProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const sourceData = fetchAllData ? await fetchAllData() : data;

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("NEU Library - Visit Logs", 14, 22);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: 40,
        head: [["Visitor", "Program", "Reason", "Check-In Time"]],
        body: sourceData.map((log) => [
          log.visitorData?.name || "\u2014",
          log.visitorData?.program || "\u2014",
          log.reason || "\u2014",
          log.checkInTime
            ? new Date(log.checkInTime).toLocaleString()
            : "\u2014",
        ]),
        headStyles: {
          fillColor: [59, 130, 246],
          fontSize: 9,
          fontStyle: "bold",
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });

      doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={(data.length === 0 && !fetchAllData) || exporting}
    >
      <FileDown className="h-4 w-4 mr-2" />
      {exporting ? "Exporting..." : "Export PDF"}
    </Button>
  );
}
