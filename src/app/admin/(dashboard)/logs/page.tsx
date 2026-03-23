"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { ExportLogsPDF } from "@/components/pdf-export-button";
import { DateRangePicker, DateFilter } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  _id: string;
  visitorData?: { name?: string; program?: string };
  reason?: string;
  checkInTime?: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter === "custom" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    } else if (filter !== "custom" && filter !== "all") {
      const now = new Date();
      let start: Date;
      switch (filter) {
        case "today":
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          break;
        case "week":
          start = new Date(now);
          start.setDate(start.getDate() - 7);
          start.setHours(0, 0, 0, 0);
          break;
        case "month":
          start = new Date(now);
          start.setMonth(start.getMonth() - 1);
          start.setHours(0, 0, 0, 0);
          break;
        default:
          start = new Date(0);
      }
      params.set("startDate", start.toISOString());
      params.set("endDate", new Date().toISOString());
    }
    fetch(`/api/logs?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [search, filter, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, startDate, endDate]);

  const handleFilterChange = (f: DateFilter) => {
    setFilter(f);
    if (f !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const totalPages = Math.max(1, Math.ceil(logs.length / rowsPerPage));
  const pageStart = (currentPage - 1) * rowsPerPage;
  const paginatedLogs = logs.slice(pageStart, pageStart + rowsPerPage);

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
          <h1 className="text-2xl font-bold tracking-tight">Visit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Browse and export visitor check-in records
          </p>
        </div>
        <div className="self-start">
          <ExportLogsPDF data={logs} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, program, or reason..."
          className="max-w-sm"
        />
        <DateRangePicker
          filter={filter}
          onFilterChange={handleFilterChange}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Check-In Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
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
                    Loading logs...
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-12 text-muted-foreground"
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-medium">
                    {log.visitorData?.name || "\u2014"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.visitorData?.program || "\u2014"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                      {log.reason || "\u2014"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.checkInTime ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(log.checkInTime).toLocaleString()}
                      </span>
                    ) : (
                      "\u2014"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record count */}
      {!loading && logs.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {pageStart + 1}-{Math.min(pageStart + rowsPerPage, logs.length)} of {logs.length} record{logs.length !== 1 && "s"}
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
    </div>
  );
}
