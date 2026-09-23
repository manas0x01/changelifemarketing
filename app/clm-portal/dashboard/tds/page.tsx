"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReceiptText,
  Search,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Copy,
  ExternalLink,
  X,
  Percent,
  TrendingUp,
  Landmark,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface BankDetails {
  bankName: string;
  accountNo: string;
  ifsc: string;
}

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  panNo: string;
  mobileNo: string;
  location: string;
  bankDetails?: BankDetails;
  incomeType: string;
  totalCommission: number;
  tdsRate: number;
  tdsAmount: number;
  netPayable: number;
  paymentDate: string;
  dateStr: string;
  financialYear: string;
  periodMonth: string;
  status: "Pending" | "Paid" | "Filed";
  challanNo?: string;
  acknowledgementNo?: string;
  remarks?: string;
}

interface LeaderRecord {
  userId: string;
  userName: string;
  panNo: string;
  mobileNo: string;
  location: string;
  bankDetails?: BankDetails;
  totalCommission: number;
  tdsRate: number;
  tdsAmount: number;
  netPayable: number;
  paymentDate: string;
  paymentDates: string[];
  datesCount: number;
  financialYear: string;
  status: "Pending" | "Paid" | "Filed";
  challanNo?: string;
  acknowledgementNo?: string;
  remarks?: string;
  transactionCount: number;
  transactions: Transaction[];
}

interface Summary {
  totalCommission: number;
  totalTdsDeducted: number;
  totalNetPaid: number;
  numberOfLeaders: number;
  statusCounts: {
    pending: number;
    paid: number;
    filed: number;
  };
}

interface DeductorInfo {
  deductorName: string;
  deductorPan: string;
  deductorTan: string;
  deductorAddress: string;
  deductorContact?: string;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmtAmt = (n?: number | null) => {
  if (n === undefined || n === null) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const fmtDate = (d?: string) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const copyToClipboard = (text: string, label: string = "Copied") => {
  if (!text || text === "N/A" || text === "NOT PROVIDED") return;
  navigator.clipboard.writeText(text);
  toast.success(`${label}: ${text}`);
};

export default function AdminTDSManagementPage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<LeaderRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTdsRate, setActiveTdsRate] = useState<number>(2);
  const [deductorInfo, setDeductorInfo] = useState<DeductorInfo>({
    deductorName: "Change Life Marketing",
    deductorPan: "HYDKW0218G",
    deductorTan: "DELC12345A",
    deductorAddress: "Patna, Bihar, India",
  });
  const [availableFys, setAvailableFys] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [fyFilter, setFyFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Drawers
  const [selectedLeader, setSelectedLeader] = useState<LeaderRecord | null>(null);
  const [certificateLeader, setCertificateLeader] = useState<LeaderRecord | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [statusModalRecord, setStatusModalRecord] = useState<{
    userId: string;
    targetStatus: "Pending" | "Paid" | "Filed";
    challanNo?: string;
    acknowledgementNo?: string;
    remarks?: string;
  } | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    tdsRate: 2,
    deductorName: "",
    deductorPan: "",
    deductorTan: "",
    deductorAddress: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const certificateRef = useRef<HTMLDivElement>(null);

  /* ─────────────────────────────────────────────
     FETCH DATA
  ───────────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        fy: fyFilter,
        month: monthFilter,
        status: statusFilter,
        view: viewMode,
        page: String(page),
        limit: "25",
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const res = await fetch(`/api/admin/tds?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch TDS data");
      const data = await res.json();

      setRecords(data.records || []);
      setSummary(data.summary || null);
      setTotalCount(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setActiveTdsRate(data.activeTdsRate ?? 2);
      if (data.deductorInfo) {
        setDeductorInfo(data.deductorInfo);
        setSettingsForm({
          tdsRate: data.activeTdsRate ?? 2,
          deductorName: data.deductorInfo.deductorName || "",
          deductorPan: data.deductorInfo.deductorPan || "",
          deductorTan: data.deductorInfo.deductorTan || "",
          deductorAddress: data.deductorInfo.deductorAddress || "",
        });
      }
      if (Array.isArray(data.availableFys) && data.availableFys.length > 0) {
        setAvailableFys(data.availableFys);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load TDS details");
    } finally {
      setLoading(false);
    }
  }, [search, fyFilter, monthFilter, statusFilter, viewMode, page, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, fyFilter, monthFilter, statusFilter, dateFrom, dateTo, viewMode]);

  /* ─────────────────────────────────────────────
     UPDATE TDS STATUS
  ───────────────────────────────────────────── */
  const handleUpdateStatus = async (
    userId: string,
    status: "Pending" | "Paid" | "Filed",
    challanNo?: string,
    acknowledgementNo?: string,
    remarks?: string
  ) => {
    try {
      const res = await fetch("/api/admin/tds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          status,
          financialYear: fyFilter !== "all" ? fyFilter : "overall",
          challanNo,
          acknowledgementNo,
          remarks,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      toast.success(data.message || `Status updated to ${status}`);
      setStatusModalRecord(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  /* ─────────────────────────────────────────────
     SAVE TDS SETTINGS
  ───────────────────────────────────────────── */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch("/api/admin/tds/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settingsForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      toast.success("TDS Settings & Rate updated successfully!");
      setIsSettingsOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  /* ─────────────────────────────────────────────
     EXPORT TO EXCEL (.xlsx)
  ───────────────────────────────────────────── */
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing complete TDS report for Excel export…");

      const params = new URLSearchParams({
        search,
        fy: fyFilter,
        month: monthFilter,
        status: statusFilter,
        view: viewMode,
        limit: "-1",
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const res = await fetch(`/api/admin/tds?${params}`, { credentials: "include" });
      const data = await res.json();
      const exportList: any[] = data.records || [];

      if (exportList.length === 0) {
        toast.warning("No records to export.");
        return;
      }

      // Build worksheet rows
      const sheetData = exportList.map((r, idx) => ({
        "Sr. No.": idx + 1,
        "Leader ID": r.userId,
        "Leader Full Name": r.userName,
        "PAN Number": r.panNo || "NOT PROVIDED",
        "Mobile Number": r.mobileNo || "N/A",
        Location: r.location || "N/A",
        "Total Commission (₹)": r.totalCommission,
        "TDS Rate (%)": `${r.tdsRate}%`,
        "TDS Deducted (₹)": r.tdsAmount,
        "Net Payable Amount (₹)": r.netPayable,
        "Payment Date": r.paymentDate || "—",
        "Financial Year": r.financialYear || "—",
        "TDS Status": r.status || "Pending",
        "Challan / Ack No.": r.challanNo || r.acknowledgementNo || "—",
        Remarks: r.remarks || "—",
        "Bank Name": r.bankDetails?.bankName || "—",
        "Account Number": r.bankDetails?.accountNo || "—",
        "IFSC Code": r.bankDetails?.ifsc || "—",
      }));

      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "TDS Report");

      const colWidths = Object.keys(sheetData[0] || {}).map((key) => ({
        wch: Math.max(key.length + 4, 16),
      }));
      worksheet["!cols"] = colWidths;

      const dateStr = new Date().toISOString().split("T")[0];
      const filename = `TDS_Report_ChangeLife_${fyFilter !== "all" ? fyFilter : "All"}_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, filename);

      toast.success("Excel report downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to export Excel report");
    } finally {
      setIsExporting(false);
    }
  };

  /* ─────────────────────────────────────────────
     EXPORT TO CSV
  ───────────────────────────────────────────── */
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      toast.info("Preparing CSV export…");

      const params = new URLSearchParams({
        search,
        fy: fyFilter,
        month: monthFilter,
        status: statusFilter,
        view: viewMode,
        limit: "-1",
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const res = await fetch(`/api/admin/tds?${params}`, { credentials: "include" });
      const data = await res.json();
      const exportList: any[] = data.records || [];

      if (exportList.length === 0) {
        toast.warning("No records to export.");
        return;
      }

      const headers = [
        "Sr No",
        "Leader ID",
        "Full Name",
        "PAN",
        "Mobile",
        "Location",
        "Total Commission",
        "TDS Rate %",
        "TDS Deducted",
        "Net Paid",
        "Payment Date",
        "Financial Year",
        "TDS Status",
        "Challan No",
      ];

      const csvRows = [headers.join(",")];

      exportList.forEach((r, idx) => {
        csvRows.push(
          [
            idx + 1,
            `"${r.userId}"`,
            `"${(r.userName || "").replace(/"/g, '""')}"`,
            `"${r.panNo || ""}"`,
            `"${r.mobileNo || ""}"`,
            `"${(r.location || "").replace(/"/g, '""')}"`,
            r.totalCommission,
            r.tdsRate,
            r.tdsAmount,
            r.netPayable,
            `"${r.paymentDate || ""}"`,
            `"${r.financialYear || ""}"`,
            `"${r.status || "Pending"}"`,
            `"${r.challanNo || ""}"`,
          ].join(",")
        );
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TDS_Report_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV report downloaded!");
    } catch (err: any) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  /* ─────────────────────────────────────────────
     DOWNLOAD LEADER TDS CERTIFICATE (PDF)
  ───────────────────────────────────────────── */
  const downloadLeaderCertificate = async (leader: LeaderRecord) => {
    try {
      setCertificateLeader(leader);
      toast.info(`Generating TDS Certificate for ${leader.userName}…`);

      setTimeout(async () => {
        try {
          const { default: html2pdf } = await import("html2pdf.js");
          const element = document.getElementById("tds-certificate-print-container");

          if (!element) {
            toast.error("Certificate element not ready");
            return;
          }

          const opt = {
            margin: [8, 8, 8, 8],
            filename: `TDS_Certificate_${leader.userId}_${leader.financialYear}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          };

          await html2pdf().set(opt).from(element).save();
          toast.success("TDS Certificate PDF downloaded!");
        } catch (e: any) {
          console.error(e);
          toast.error("Error generating PDF certificate");
        }
      }, 500);
    } catch (err: any) {
      toast.error("Could not prepare certificate");
    }
  };

  /* ─────────────────────────────────────────────
     QUICK PRESETS
  ───────────────────────────────────────────── */
  const applyPreset = (preset: "all" | "today" | "thisMonth" | "currentFy") => {
    const now = new Date();
    if (preset === "all") {
      setDateFrom("");
      setDateTo("");
      setFyFilter("all");
      setMonthFilter("all");
    } else if (preset === "today") {
      const today = now.toISOString().split("T")[0];
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = now.toISOString().split("T")[0];
      setDateFrom(start);
      setDateTo(end);
    } else if (preset === "currentFy") {
      const y = now.getFullYear();
      const m = now.getMonth();
      const curFy = m >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
      setFyFilter(curFy);
      setDateFrom("");
      setDateTo("");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-16">
      {/* ──────────────── Top Navigation Bar ──────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#0A6E5A]/10 shadow-xs px-4 md:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#0A6E5A]/10 text-[#0A6E5A] rounded-lg shrink-0">
              <ReceiptText className="w-5 h-5 md:w-6 md:h-6" />
            </span>
            <div>
              <h1 className="font-['Fraunces'] text-[1.25rem] md:text-[1.4rem] font-bold text-[#0A6E5A] leading-tight">
                TDS Management & Reports
              </h1>
              <p className="font-['Roboto'] text-[0.72rem] md:text-[0.8rem] text-[#333333]/60">
                Tax deduction at source, Form 16A certificates, and CA audit export
              </p>
            </div>
          </div>

          {/* Top Actions: Fully Responsive for Mobile */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Active TDS Rate Badge */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#C9A84C]/15 border border-[#C9A84C]/30 rounded-lg text-[#8C6D1F] text-[0.75rem] md:text-[0.8rem] font-semibold">
              <Percent className="w-3.5 h-3.5" />
              <span>TDS Rate: {activeTdsRate}%</span>
            </div>

            {/* Configure TDS Rate */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#0A6E5A]/20 hover:border-[#0A6E5A] text-[#0A6E5A] rounded-lg text-[0.75rem] md:text-[0.8rem] font-medium transition-colors shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Configure Rate</span>
              <span className="sm:hidden">Rate</span>
            </button>

            {/* Refresh */}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-1.5 md:p-2 bg-white border border-[#0A6E5A]/20 hover:border-[#0A6E5A] text-[#0A6E5A] rounded-lg transition-colors shadow-2xs"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Export Buttons */}
            <button
              onClick={handleExportExcel}
              disabled={isExporting || records.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white rounded-lg text-[0.75rem] md:text-[0.8rem] font-semibold transition-all shadow-xs disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={isExporting || records.length === 0}
              className="p-1.5 md:p-2 bg-white border border-[#0A6E5A]/20 hover:border-[#0A6E5A] text-[#0A6E5A] rounded-lg transition-colors shadow-2xs"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-5 space-y-5">
        {/* ──────────────── Summary Statistics Cards ──────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Card 1: Total Commission */}
          <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-[#0A6E5A]/10 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0A6E5A] to-[#0A6E5A]/60" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-wider font-semibold text-[#333]/50">
                  Total Commission
                </p>
                <h3 className="font-['Fraunces'] text-[1.25rem] sm:text-[1.6rem] font-bold text-[#0A6E5A] mt-0.5">
                  {fmtAmt(summary?.totalCommission)}
                </h3>
                <p className="text-[0.65rem] sm:text-[0.72rem] text-[#333]/60 mt-0.5 hidden sm:block">
                  Gross income generated
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0A6E5A]/10 text-[#0A6E5A] flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Card 2: Total TDS Deducted */}
          <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-red-100 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-wider font-semibold text-red-700/70">
                  Total TDS Cut
                </p>
                <h3 className="font-['Fraunces'] text-[1.25rem] sm:text-[1.6rem] font-bold text-red-600 mt-0.5">
                  {fmtAmt(summary?.totalTdsDeducted)}
                </h3>
                <p className="text-[0.65rem] sm:text-[0.72rem] text-red-500/80 mt-0.5 hidden sm:block">
                  At active {activeTdsRate}%
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <ReceiptText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Card 3: Total Net Paid */}
          <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-emerald-100 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-wider font-semibold text-emerald-700/70">
                  Total Net Paid
                </p>
                <h3 className="font-['Fraunces'] text-[1.25rem] sm:text-[1.6rem] font-bold text-emerald-700 mt-0.5">
                  {fmtAmt(summary?.totalNetPaid)}
                </h3>
                <p className="text-[0.65rem] sm:text-[0.72rem] text-emerald-600/80 mt-0.5 hidden sm:block">
                  Net after TDS deduction
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          {/* Card 4: Number of Leaders */}
          <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-[#C9A84C]/30 shadow-xs relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#C9A84C] to-amber-300" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.65rem] sm:text-[0.7rem] uppercase tracking-wider font-semibold text-[#8C6D1F]">
                  Total Leaders
                </p>
                <h3 className="font-['Fraunces'] text-[1.25rem] sm:text-[1.6rem] font-bold text-[#8C6D1F] mt-0.5">
                  {summary?.numberOfLeaders || 0}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 text-[0.65rem] sm:text-[0.7rem]">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {summary?.statusCounts?.filed || 0} Filed
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-medium">
                    {summary?.statusCounts?.pending || 0} Pend.
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#C9A84C]/15 text-[#8C6D1F] flex items-center justify-center shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────── Filters & Controls Section ──────────────── */}
        <div className="bg-white rounded-xl border border-[#0A6E5A]/10 shadow-xs p-3.5 sm:p-5 space-y-3.5">
          {/* Quick Presets Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#0A6E5A]/8 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[0.72rem] font-semibold text-[#333]/50 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Quick Filter:
              </span>
              {[
                { label: "All Records", val: "all" },
                { label: "Current FY", val: "currentFy" },
                { label: "This Month", val: "thisMonth" },
                { label: "Today", val: "today" },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => applyPreset(p.val as any)}
                  className="px-2.5 py-1 rounded-md text-[0.72rem] font-medium bg-[#F5F7F6] hover:bg-[#0A6E5A]/10 hover:text-[#0A6E5A] text-[#333]/70 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F5F7F6] p-0.5 sm:p-1 rounded-lg border border-[#0A6E5A]/10 text-[0.72rem]">
              <button
                onClick={() => setViewMode("summary")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "summary"
                    ? "bg-[#0A6E5A] text-white shadow-2xs"
                    : "text-[#333]/60 hover:text-[#333]"
                }`}
              >
                Leader Summary
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === "detailed"
                    ? "bg-[#0A6E5A] text-white shadow-2xs"
                    : "text-[#333]/60 hover:text-[#333]"
                }`}
              >
                Date-wise Detailed
              </button>
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#333]/40" />
              <input
                type="text"
                placeholder="Search by Leader ID, Name, PAN, Mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F8F9FA] border border-[#0A6E5A]/15 rounded-lg text-[0.82rem] focus:outline-hidden focus:border-[#0A6E5A] focus:bg-white transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#333]/40 hover:text-[#333]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Financial Year Filter */}
            <div>
              <select
                value={fyFilter}
                onChange={(e) => setFyFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#0A6E5A]/15 rounded-lg text-[0.82rem] focus:outline-hidden focus:border-[#0A6E5A]"
              >
                <option value="all">All Financial Years</option>
                {availableFys.map((fy) => (
                  <option key={fy} value={fy}>
                    FY {fy}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#0A6E5A]/15 rounded-lg text-[0.82rem] focus:outline-hidden focus:border-[#0A6E5A]"
              >
                <option value="all">All TDS Statuses</option>
                <option value="Pending">Pending (Not Filed)</option>
                <option value="Paid">Paid (Deposited)</option>
                <option value="Filed">Filed (IT Return Done)</option>
              </select>
            </div>

            {/* Date Range Picker (From & To) */}
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-1/2 px-2 py-2 bg-[#F8F9FA] border border-[#0A6E5A]/15 rounded-lg text-[0.72rem] focus:outline-hidden focus:border-[#0A6E5A]"
                title="Date From"
              />
              <span className="text-[#333]/40 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-1/2 px-2 py-2 bg-[#F8F9FA] border border-[#0A6E5A]/15 rounded-lg text-[0.72rem] focus:outline-hidden focus:border-[#0A6E5A]"
                title="Date To"
              />
            </div>
          </div>
        </div>

        {/* ──────────────── RESPONSIVE VIEW ──────────────── */}

        {/* 1. MOBILE CARDS VIEW (Visible only on mobile screens < 768px) */}
        <div className="block md:hidden space-y-3">
          {loading ? (
            <div className="py-12 bg-white rounded-xl text-center text-[#333]/50">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A6E5A] border-t-transparent mx-auto mb-2" />
              <span>Loading TDS details…</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 bg-white rounded-xl text-center text-[#333]/50 p-4">
              <AlertCircle className="w-8 h-8 text-amber-500/70 mx-auto mb-2" />
              <p className="font-semibold text-base text-[#333]">No TDS Records Found</p>
              <p className="text-xs text-[#333]/60 mt-1">Try adjusting your filters or search.</p>
            </div>
          ) : (
            records.map((r, idx) => {
              const isPanMissing = !r.panNo || r.panNo === "NOT PROVIDED" || r.panNo === "N/A";

              return (
                <div
                  key={"m_" + r.userId + "_" + idx}
                  className="bg-white rounded-xl border border-[#0A6E5A]/15 p-4 shadow-2xs space-y-3"
                >
                  {/* Card Top: Leader Full Name & ID Badge */}
                  <div className="flex items-start justify-between gap-2 border-b border-[#0A6E5A]/8 pb-2.5">
                    <div>
                      {/* FULL LEADER NAME - No Truncation, Bold & Clear */}
                      <h3 className="font-bold text-[0.98rem] text-[#111] leading-snug break-words">
                        {r.userName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono font-bold text-xs text-[#0A6E5A] bg-[#0A6E5A]/8 px-2 py-0.5 rounded">
                          {r.userId}
                        </span>
                        <button
                          onClick={() => copyToClipboard(r.userId, "Leader ID")}
                          className="text-[#888] hover:text-[#0A6E5A]"
                          title="Copy ID"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <select
                        value={r.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as "Pending" | "Paid" | "Filed";
                          if (newStatus === "Filed") {
                            setStatusModalRecord({
                              userId: r.userId,
                              targetStatus: "Filed",
                              challanNo: r.challanNo,
                              acknowledgementNo: r.acknowledgementNo,
                              remarks: r.remarks,
                            });
                          } else {
                            handleUpdateStatus(r.userId, newStatus);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-[0.72rem] font-bold border transition-colors cursor-pointer ${
                          r.status === "Filed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : r.status === "Paid"
                            ? "bg-blue-50 text-blue-700 border-blue-300"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        <option value="Pending">⏳ Pending</option>
                        <option value="Paid">💳 Paid</option>
                        <option value="Filed">✅ Filed</option>
                      </select>
                    </div>
                  </div>

                  {/* PAN, Phone, Location Bar */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#555] bg-[#F5F7F6] p-2.5 rounded-lg">
                    <div>
                      <span className="text-[0.65rem] text-[#888] block uppercase">PAN Number</span>
                      {isPanMissing ? (
                        <span className="text-red-500 font-semibold text-[0.75rem]">Missing PAN</span>
                      ) : (
                        <div className="flex items-center gap-1 font-mono font-bold text-[#222]">
                          <span>{r.panNo}</span>
                          <button
                            onClick={() => copyToClipboard(r.panNo, "PAN")}
                            className="p-0.5 text-[#888]"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[0.65rem] text-[#888] block uppercase">Mobile No.</span>
                      <span className="font-semibold text-[#222]">{r.mobileNo || "N/A"}</span>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-[#0A6E5A]/8">
                      <span className="text-[0.65rem] text-[#888] block uppercase">Location</span>
                      <span className="text-[#333] text-[0.75rem]">{r.location || "N/A"}</span>
                    </div>
                  </div>

                  {/* 2x2 Financial Metric Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-[#F8F9FA] p-3 rounded-lg border border-[#0A6E5A]/10 text-xs">
                    <div>
                      <span className="text-[0.65rem] uppercase text-[#666] block">Total Commission</span>
                      <span className="font-bold text-[0.92rem] text-[#0A6E5A]">
                        {fmtAmt(r.totalCommission)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[0.65rem] uppercase text-[#666] block">TDS Rate</span>
                      <span className="px-1.5 py-0.5 bg-[#C9A84C]/15 text-[#8C6D1F] font-bold text-[0.72rem] rounded">
                        {r.tdsRate}%
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-gray-200">
                      <span className="text-[0.65rem] uppercase text-red-600 block">TDS Deducted</span>
                      <span className="font-bold text-[0.92rem] text-red-600">
                        {fmtAmt(r.tdsAmount)}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-gray-200">
                      <span className="text-[0.65rem] uppercase text-emerald-700 block">Net Payable</span>
                      <span className="font-bold text-[0.92rem] text-emerald-700">
                        {fmtAmt(r.netPayable)}
                      </span>
                    </div>
                  </div>

                  {/* Dates & FY Row */}
                  <div className="flex items-center justify-between text-xs text-[#666] px-1">
                    <span>
                      Date: <strong className="text-[#222]">{fmtDate(r.paymentDate)}</strong>
                      {r.datesCount > 1 && (
                        <span className="ml-1 text-[0.68rem] text-[#0A6E5A] bg-[#0A6E5A]/10 px-1 py-0.2 rounded">
                          +{r.datesCount - 1} more
                        </span>
                      )}
                    </span>
                    <span>
                      FY: <strong className="text-[#222]">{r.financialYear}</strong>
                    </span>
                  </div>

                  {/* Mobile Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#0A6E5A]/8">
                    <button
                      onClick={() => downloadLeaderCertificate(r)}
                      className="py-2 px-3 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#C9A84C]" />
                      <span>Certificate PDF</span>
                    </button>

                    <button
                      onClick={() => setSelectedLeader(r)}
                      className="py-2 px-3 bg-white border border-[#0A6E5A]/25 text-[#0A6E5A] hover:bg-[#0A6E5A]/5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Breakdown</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. DESKTOP / TABLET DATA TABLE (Hidden on mobile < 768px) */}
        <div className="hidden md:block bg-white rounded-xl border border-[#0A6E5A]/10 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A6E5A]/5 border-b border-[#0A6E5A]/10 text-[0.72rem] uppercase tracking-wider text-[#0A6E5A] font-semibold">
                  <th className="py-3.5 px-4 min-w-[120px]">Leader ID</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Leader Full Name</th>
                  <th className="py-3.5 px-4 min-w-[140px]">PAN Number</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Contact / Location</th>
                  <th className="py-3.5 px-4 text-right min-w-[130px]">Commission (₹)</th>
                  <th className="py-3.5 px-3 text-center min-w-[90px]">TDS Rate</th>
                  <th className="py-3.5 px-4 text-right min-w-[120px]">TDS Cut (₹)</th>
                  <th className="py-3.5 px-4 text-right min-w-[130px]">Net Paid (₹)</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Payout Date(s)</th>
                  <th className="py-3.5 px-3 text-center min-w-[100px]">FY</th>
                  <th className="py-3.5 px-3 text-center min-w-[110px]">Status</th>
                  <th className="py-3.5 px-4 text-center min-w-[150px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A6E5A]/6 text-[0.82rem]">
                {loading ? (
                  <tr>
                    <td colSpan={12} className="py-16 text-center text-[#333]/50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0A6E5A] border-t-transparent" />
                        <span>Loading TDS records…</span>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-16 text-center text-[#333]/50">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-amber-500/70" />
                        <span className="font-semibold text-base text-[#333]">No TDS Records Found</span>
                        <p className="text-xs max-w-sm text-[#333]/60">
                          Try adjusting your search criteria, financial year, or date filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((r, idx) => {
                    const isPanMissing =
                      !r.panNo || r.panNo === "NOT PROVIDED" || r.panNo === "N/A";

                    return (
                      <tr
                        key={r.userId + "_" + idx}
                        className="hover:bg-[#F5F7F6] transition-colors group"
                      >
                        {/* Leader ID */}
                        <td className="py-3 px-4 font-mono font-bold text-[#0A6E5A]">
                          <div className="flex items-center gap-1.5">
                            <span>{r.userId}</span>
                            <button
                              onClick={() => copyToClipboard(r.userId, "Leader ID")}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-[#0A6E5A]"
                              title="Copy ID"
                            >
                              <Copy className="w-3 h-3 text-[#333]/40 hover:text-[#0A6E5A]" />
                            </button>
                          </div>
                        </td>

                        {/* FULL LEADER NAME - No Truncation, Full wrap */}
                        <td className="py-3 px-4 font-semibold text-[#111]">
                          <div className="break-words whitespace-normal leading-snug">
                            {r.userName}
                          </div>
                        </td>

                        {/* PAN */}
                        <td className="py-3 px-4 font-mono">
                          {isPanMissing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.68rem] bg-red-50 text-red-600 font-semibold border border-red-200">
                              <AlertCircle className="w-3 h-3" /> Missing PAN
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 font-bold text-[#333]">
                              <span>{r.panNo}</span>
                              <button
                                onClick={() => copyToClipboard(r.panNo, "PAN")}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                title="Copy PAN"
                              >
                                <Copy className="w-3 h-3 text-[#333]/40 hover:text-[#0A6E5A]" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Contact & Location */}
                        <td className="py-3 px-4 text-[#555] text-[0.76rem]">
                          <div className="flex flex-col">
                            {r.mobileNo && r.mobileNo !== "N/A" && (
                              <span className="flex items-center gap-1 text-[#333] font-medium">
                                <Phone className="w-3 h-3 text-[#0A6E5A]" /> {r.mobileNo}
                              </span>
                            )}
                            {r.location && r.location !== "N/A" && (
                              <span className="flex items-center gap-1 text-[#777] break-words whitespace-normal mt-0.5">
                                <MapPin className="w-3 h-3 text-[#C9A84C] shrink-0" /> {r.location}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Commission */}
                        <td className="py-3 px-4 text-right font-bold text-[#0A6E5A]">
                          {fmtAmt(r.totalCommission)}
                        </td>

                        {/* TDS Rate */}
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 bg-[#C9A84C]/15 text-[#8C6D1F] font-bold text-[0.72rem] rounded">
                            {r.tdsRate}%
                          </span>
                        </td>

                        {/* TDS Cut Amount */}
                        <td className="py-3 px-4 text-right font-bold text-red-600">
                          {fmtAmt(r.tdsAmount)}
                        </td>

                        {/* Net Payable */}
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          {fmtAmt(r.netPayable)}
                        </td>

                        {/* Dates */}
                        <td className="py-3 px-4 text-center text-[0.75rem]">
                          <div className="flex flex-col items-center">
                            <span className="text-[#333] font-medium">{fmtDate(r.paymentDate)}</span>
                            {r.datesCount > 1 && (
                              <span className="text-[0.68rem] text-[#0A6E5A] bg-[#0A6E5A]/10 px-1.5 py-0.2 rounded mt-0.5 font-medium">
                                +{r.datesCount - 1} more payouts
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Financial Year */}
                        <td className="py-3 px-3 text-center font-medium text-[0.75rem] text-[#666]">
                          {r.financialYear}
                        </td>

                        {/* Status (with interactive dropdown) */}
                        <td className="py-3 px-3 text-center">
                          <select
                            value={r.status}
                            onChange={(e) => {
                              const newStatus = e.target.value as "Pending" | "Paid" | "Filed";
                              if (newStatus === "Filed") {
                                setStatusModalRecord({
                                  userId: r.userId,
                                  targetStatus: "Filed",
                                  challanNo: r.challanNo,
                                  acknowledgementNo: r.acknowledgementNo,
                                  remarks: r.remarks,
                                });
                              } else {
                                handleUpdateStatus(r.userId, newStatus);
                              }
                            }}
                            className={`px-2 py-1 rounded-md text-[0.72rem] font-bold border transition-colors cursor-pointer ${
                              r.status === "Filed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                : r.status === "Paid"
                                ? "bg-blue-50 text-blue-700 border-blue-300"
                                : "bg-amber-50 text-amber-700 border-amber-300"
                            }`}
                          >
                            <option value="Pending">⏳ Pending</option>
                            <option value="Paid">💳 Paid</option>
                            <option value="Filed">✅ Filed</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Certificate PDF Download */}
                            <button
                              onClick={() => downloadLeaderCertificate(r)}
                              className="px-2 py-1 bg-[#0A6E5A]/10 hover:bg-[#0A6E5A] text-[#0A6E5A] hover:text-white rounded text-[0.72rem] font-semibold flex items-center gap-1 transition-colors"
                              title="Download Form 16A style TDS Certificate PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Certificate</span>
                            </button>

                            {/* View Breakdown Drawer */}
                            <button
                              onClick={() => setSelectedLeader(r)}
                              className="p-1 text-[#333]/50 hover:text-[#0A6E5A] rounded hover:bg-[#0A6E5A]/8 transition-colors"
                              title="View Payout Breakdown"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ──────────────── Pagination ──────────────── */}
          <div className="px-5 py-3.5 border-t border-[#0A6E5A]/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#F8F9FA]">
            <p className="text-[0.78rem] text-[#333]/60">
              Showing <span className="font-semibold text-[#0A6E5A]">{records.length}</span> of{" "}
              <span className="font-semibold text-[#0A6E5A]">{totalCount}</span> leaders / records
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 bg-white border border-[#0A6E5A]/20 rounded-md text-[0.78rem] text-[#333] hover:bg-[#0A6E5A]/5 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-[0.78rem] font-semibold text-[#0A6E5A] px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 bg-white border border-[#0A6E5A]/20 rounded-md text-[0.78rem] text-[#333] hover:bg-[#0A6E5A]/5 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Pagination */}
        <div className="block md:hidden bg-white p-3 rounded-xl border border-[#0A6E5A]/10 text-center">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-white border border-[#0A6E5A]/20 rounded-md text-xs text-[#333] disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-xs font-semibold text-[#0A6E5A]">
              Page {page} of {totalPages} ({totalCount} leaders)
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-white border border-[#0A6E5A]/20 rounded-md text-xs text-[#333] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LEADER BREAKDOWN DRAWER (Mobile Responsive)
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLeader && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full sm:max-w-xl h-full shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-[#0A6E5A]/10 bg-[#0A6E5A] text-white flex items-center justify-between">
                <div>
                  <h3 className="font-['Fraunces'] text-[1.1rem] sm:text-[1.2rem] font-bold break-words">
                    {selectedLeader.userName}
                  </h3>
                  <p className="text-[0.75rem] text-white/80 font-mono">
                    ID: {selectedLeader.userId} | PAN: {selectedLeader.panNo}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLeader(null)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {/* Summary Box */}
                <div className="grid grid-cols-3 gap-2 bg-[#F5F7F6] p-3 sm:p-4 rounded-xl border border-[#0A6E5A]/10 text-center">
                  <div>
                    <span className="text-[0.62rem] sm:text-[0.68rem] text-[#333]/50 uppercase tracking-wider block">
                      Total Income
                    </span>
                    <span className="font-['Fraunces'] font-bold text-[#0A6E5A] text-base sm:text-lg">
                      {fmtAmt(selectedLeader.totalCommission)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.62rem] sm:text-[0.68rem] text-red-600/70 uppercase tracking-wider block">
                      TDS ({selectedLeader.tdsRate}%)
                    </span>
                    <span className="font-['Fraunces'] font-bold text-red-600 text-base sm:text-lg">
                      {fmtAmt(selectedLeader.tdsAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.62rem] sm:text-[0.68rem] text-emerald-700/70 uppercase tracking-wider block">
                      Net Paid
                    </span>
                    <span className="font-['Fraunces'] font-bold text-emerald-700 text-base sm:text-lg">
                      {fmtAmt(selectedLeader.netPayable)}
                    </span>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white border border-[#0A6E5A]/15 rounded-xl p-3.5">
                  <h4 className="text-[0.72rem] font-bold uppercase tracking-wider text-[#0A6E5A] flex items-center gap-1.5 mb-2">
                    <Landmark className="w-3.5 h-3.5" /> Registered Bank Account
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[0.78rem]">
                    <div>
                      <span className="text-[#333]/50 text-xs block">Bank Name:</span>
                      <span className="font-medium text-[#222]">
                        {selectedLeader.bankDetails?.bankName || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#333]/50 text-xs block">Account Number:</span>
                      <span className="font-mono font-medium text-[#222]">
                        {selectedLeader.bankDetails?.accountNo || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#333]/50 text-xs block">IFSC Code:</span>
                      <span className="font-mono font-medium text-[#222]">
                        {selectedLeader.bankDetails?.ifsc || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#333]/50 text-xs block">Location:</span>
                      <span className="font-medium text-[#222]">
                        {selectedLeader.location || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session by Session Breakdown */}
                <div>
                  <h4 className="text-[0.78rem] font-bold text-[#0A6E5A] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Transaction / Payout History (
                    {selectedLeader.transactions?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {selectedLeader.transactions?.map((t, i) => (
                      <div
                        key={i}
                        className="bg-[#F8F9FA] border border-[#0A6E5A]/10 rounded-lg p-2.5 sm:p-3 text-[0.75rem] flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-[#222]">{t.incomeType}</p>
                          <p className="text-[#777] text-xs">
                            Date: {fmtDate(t.paymentDate)} | FY: {t.financialYear}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#0A6E5A]">{fmtAmt(t.totalCommission)}</p>
                          <p className="text-xs text-red-500">
                            - {fmtAmt(t.tdsAmount)} TDS ({t.tdsRate}%)
                          </p>
                          <p className="text-xs font-semibold text-emerald-700">
                            = {fmtAmt(t.netPayable)} Net
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3.5 sm:p-4 border-t border-[#0A6E5A]/10 bg-[#F8F9FA] flex items-center justify-between">
                <button
                  onClick={() => downloadLeaderCertificate(selectedLeader)}
                  className="px-3.5 py-2 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[#C9A84C]" /> Download Certificate
                </button>
                <button
                  onClick={() => setSelectedLeader(null)}
                  className="px-3.5 py-2 border border-[#0A6E5A]/20 hover:bg-[#0A6E5A]/5 rounded-lg text-xs text-[#333]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          TDS RATE & SETTINGS MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-[#0A6E5A]/10 max-h-[90vh] flex flex-col"
            >
              <div className="p-4 bg-[#0A6E5A] text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-[#C9A84C]" />
                  <h3 className="font-['Fraunces'] text-[1.1rem] font-bold">
                    Configure TDS & Deductor Settings
                  </h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-[0.75rem] font-bold uppercase text-[#0A6E5A] block mb-1">
                    Active TDS Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={settingsForm.tdsRate}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, tdsRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 bg-[#F8F9FA] border border-[#0A6E5A]/20 rounded-lg text-lg font-bold text-[#0A6E5A] focus:outline-hidden focus:border-[#0A6E5A]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">
                      %
                    </span>
                  </div>
                  <p className="text-[0.7rem] text-[#333]/60 mt-1">
                    This rate will be used for all active TDS calculations across the system.
                  </p>
                </div>

                <div className="border-t border-[#0A6E5A]/10 pt-3 space-y-3">
                  <h4 className="text-[0.75rem] font-bold uppercase text-[#C9A84C]">
                    Company / Deductor Details
                  </h4>

                  <div>
                    <label className="text-xs text-[#555] block mb-0.5">Deductor (Company) Name</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.deductorName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, deductorName: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#0A6E5A]/20 rounded-lg text-sm text-[#222]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#555] block mb-0.5">Company PAN</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.deductorPan}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, deductorPan: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#0A6E5A]/20 rounded-lg text-sm font-mono uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#555] block mb-0.5">Company TAN</label>
                      <input
                        type="text"
                        value={settingsForm.deductorTan}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, deductorTan: e.target.value.toUpperCase() })
                        }
                        className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#0A6E5A]/20 rounded-lg text-sm font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#555] block mb-0.5">Registered Address</label>
                    <textarea
                      rows={2}
                      value={settingsForm.deductorAddress}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, deductorAddress: e.target.value })
                      }
                      className="w-full px-3 py-1.5 bg-[#F8F9FA] border border-[#0A6E5A]/20 rounded-lg text-sm text-[#222]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#0A6E5A]/10">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-3.5 py-1.5 border border-[#0A6E5A]/20 rounded-lg text-xs sm:text-sm text-[#333]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-1.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5"
                  >
                    {savingSettings && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Save Settings
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          MARK AS FILED MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {statusModalRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-[#0A6E5A]/10"
            >
              <div className="p-4 bg-[#0A6E5A] text-white flex items-center justify-between">
                <h3 className="font-['Fraunces'] font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C9A84C]" /> Record TDS as Filed
                </h3>
                <button
                  onClick={() => setStatusModalRecord(null)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-[#555]">
                  Marking TDS status as <strong>Filed</strong> for Leader ID{" "}
                  <strong className="text-[#0A6E5A]">{statusModalRecord.userId}</strong>.
                </p>

                <div>
                  <label className="text-xs font-semibold text-[#333] block mb-1">
                    IT Challan No. / BSR Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CHN-2026-98124"
                    value={statusModalRecord.challanNo || ""}
                    onChange={(e) =>
                      setStatusModalRecord({ ...statusModalRecord, challanNo: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-[#0A6E5A]/20 rounded-md text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#333] block mb-1">
                    Acknowledgement / Filing Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACK-8871236"
                    value={statusModalRecord.acknowledgementNo || ""}
                    onChange={(e) =>
                      setStatusModalRecord({
                        ...statusModalRecord,
                        acknowledgementNo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-[#0A6E5A]/20 rounded-md text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#333] block mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Q1 Return Filed by CA"
                    value={statusModalRecord.remarks || ""}
                    onChange={(e) =>
                      setStatusModalRecord({ ...statusModalRecord, remarks: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-[#0A6E5A]/20 rounded-md text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setStatusModalRecord(null)}
                    className="px-3 py-1.5 border border-gray-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        statusModalRecord.userId,
                        "Filed",
                        statusModalRecord.challanNo,
                        statusModalRecord.acknowledgementNo,
                        statusModalRecord.remarks
                      )
                    }
                    className="px-4 py-1.5 bg-[#0A6E5A] text-white rounded text-xs font-semibold"
                  >
                    Confirm Filed
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          FORM 16A STYLE LEADER TDS CERTIFICATE (PRINT CONTAINER)
      ───────────────────────────────────────────────────────────── */}
      {certificateLeader && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div
            id="tds-certificate-print-container"
            ref={certificateRef}
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "16mm",
              backgroundColor: "#ffffff",
              color: "#111111",
              fontFamily: "Arial, sans-serif",
              fontSize: "11px",
              boxSizing: "border-box",
            }}
          >
            {/* Header Border & Title */}
            <div
              style={{
                border: "2px solid #0A6E5A",
                padding: "12px",
                textAlign: "center",
                marginBottom: "12px",
                borderRadius: "4px",
              }}
            >
              <h2
                style={{
                  margin: "0 0 4px 0",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#0A6E5A",
                  letterSpacing: "1px",
                }}
              >
                {deductorInfo.deductorName || "CHANGE LIFE MARKETING"}
              </h2>
              <p style={{ margin: "0 0 6px 0", fontSize: "11px", color: "#555" }}>
                {deductorInfo.deductorAddress}
              </p>
              <div
                style={{
                  display: "inline-block",
                  backgroundColor: "#0A6E5A",
                  color: "#ffffff",
                  padding: "4px 16px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  borderRadius: "3px",
                  marginTop: "4px",
                }}
              >
                CERTIFICATE OF DEDUCTION OF TAX AT SOURCE (TDS)
              </div>
              <p style={{ margin: "6px 0 0 0", fontSize: "10px", color: "#666" }}>
                Under Section 194H / 194M of the Income-tax Act, 1961
              </p>
            </div>

            {/* Deductor & Deductee Information Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "12px",
                border: "1px solid #cccccc",
              }}
            >
              <tbody>
                <tr style={{ backgroundColor: "#f2f5f4" }}>
                  <td
                    style={{
                      width: "50%",
                      padding: "8px",
                      borderRight: "1px solid #cccccc",
                      fontWeight: "bold",
                      color: "#0A6E5A",
                    }}
                  >
                    DEDUCTOR DETAILS (Company)
                  </td>
                  <td style={{ width: "50%", padding: "8px", fontWeight: "bold", color: "#0A6E5A" }}>
                    DEDUCTEE DETAILS (Leader)
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: "8px",
                      borderRight: "1px solid #cccccc",
                      verticalAlign: "top",
                      lineHeight: "1.5",
                    }}
                  >
                    <strong>Name:</strong> {deductorInfo.deductorName}
                    <br />
                    <strong>PAN:</strong> {deductorInfo.deductorPan}
                    <br />
                    <strong>TAN:</strong> {deductorInfo.deductorTan || "DELC12345A"}
                    <br />
                    <strong>Address:</strong> {deductorInfo.deductorAddress}
                  </td>
                  <td style={{ padding: "8px", verticalAlign: "top", lineHeight: "1.5" }}>
                    <strong>Leader ID:</strong> {certificateLeader.userId}
                    <br />
                    <strong>Full Name:</strong> {certificateLeader.userName}
                    <br />
                    <strong>PAN Number:</strong> {certificateLeader.panNo}
                    <br />
                    <strong>Mobile:</strong> {certificateLeader.mobileNo || "N/A"}
                    <br />
                    <strong>Location:</strong> {certificateLeader.location || "N/A"}
                  </td>
                </tr>
                <tr style={{ backgroundColor: "#fafafa", borderTop: "1px solid #cccccc" }}>
                  <td style={{ padding: "6px 8px", borderRight: "1px solid #cccccc" }}>
                    <strong>Financial Year:</strong> {certificateLeader.financialYear}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <strong>Assessment Year:</strong>{" "}
                    {(() => {
                      const parts = certificateLeader.financialYear.split("-");
                      if (parts.length === 2) {
                        const y1 = parseInt(parts[0]) + 1;
                        const y2 = parseInt(parts[1]) + 1;
                        return `${y1}-${y2}`;
                      }
                      return "2027-2028";
                    })()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Summary Box */}
            <div
              style={{
                backgroundColor: "#eef6f4",
                border: "1px solid #b7dfd7",
                borderRadius: "4px",
                padding: "10px",
                marginBottom: "12px",
              }}
            >
              <h4 style={{ margin: "0 0 8px 0", color: "#0A6E5A", fontSize: "12px" }}>
                SUMMARY OF TAX DEDUCTION
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Total Gross Commission / Income:</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {fmtAmt(certificateLeader.totalCommission)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>Applicable Rate of Tax Deduction:</td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#8C6D1F" }}>
                      {certificateLeader.tdsRate}%
                    </td>
                  </tr>
                  <tr style={{ borderTop: "1px dashed #b7dfd7", borderBottom: "1px dashed #b7dfd7" }}>
                    <td style={{ padding: "6px 0", fontWeight: "bold", color: "#c53030" }}>
                      Total TDS Deducted &amp; Deposited:
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: "13px",
                        color: "#c53030",
                      }}
                    >
                      {fmtAmt(certificateLeader.tdsAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0", fontWeight: "bold", color: "#22543d" }}>
                      Net Amount Paid to Leader:
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold", color: "#22543d" }}>
                      {fmtAmt(certificateLeader.netPayable)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "4px 0" }}>TDS Status:</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {certificateLeader.status}
                      {certificateLeader.challanNo ? ` (Ref: ${certificateLeader.challanNo})` : ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Transaction Breakdown Table */}
            <h4
              style={{
                margin: "12px 0 6px 0",
                fontSize: "11px",
                fontWeight: "bold",
                color: "#0A6E5A",
              }}
            >
              DETAILS OF PAYMENTS &amp; TAX DEDUCTED
            </h4>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "16px",
                border: "1px solid #cccccc",
                fontSize: "10px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#0A6E5A", color: "#ffffff", textAlign: "left" }}>
                  <th style={{ padding: "6px", border: "1px solid #cccccc" }}>Sr</th>
                  <th style={{ padding: "6px", border: "1px solid #cccccc" }}>Payment Date</th>
                  <th style={{ padding: "6px", border: "1px solid #cccccc" }}>Description / Income</th>
                  <th style={{ padding: "6px", border: "1px solid #cccccc", textAlign: "right" }}>
                    Gross Amount (₹)
                  </th>
                  <th style={{ padding: "6px", border: "1px solid #cccccc", textAlign: "right" }}>
                    TDS Amount (₹)
                  </th>
                  <th style={{ padding: "6px", border: "1px solid #cccccc", textAlign: "right" }}>
                    Net Paid (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {certificateLeader.transactions && certificateLeader.transactions.length > 0 ? (
                  certificateLeader.transactions.map((item, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? "#ffffff" : "#fbfbfb" }}>
                      <td style={{ padding: "5px 6px", border: "1px solid #cccccc" }}>{i + 1}</td>
                      <td style={{ padding: "5px 6px", border: "1px solid #cccccc" }}>
                        {fmtDate(item.paymentDate)}
                      </td>
                      <td style={{ padding: "5px 6px", border: "1px solid #cccccc" }}>
                        {item.incomeType}
                      </td>
                      <td
                        style={{
                          padding: "5px 6px",
                          border: "1px solid #cccccc",
                          textAlign: "right",
                          fontWeight: "500",
                        }}
                      >
                        {fmtAmt(item.totalCommission)}
                      </td>
                      <td
                        style={{
                          padding: "5px 6px",
                          border: "1px solid #cccccc",
                          textAlign: "right",
                          color: "#c53030",
                          fontWeight: "600",
                        }}
                      >
                        {fmtAmt(item.tdsAmount)}
                      </td>
                      <td
                        style={{
                          padding: "5px 6px",
                          border: "1px solid #cccccc",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "#22543d",
                        }}
                      >
                        {fmtAmt(item.netPayable)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "6px", textAlign: "center", border: "1px solid #cccccc" }}
                    >
                      Summary Record
                    </td>
                  </tr>
                )}
                {/* Total Row */}
                <tr style={{ backgroundColor: "#f2f5f4", fontWeight: "bold" }}>
                  <td colSpan={3} style={{ padding: "6px", border: "1px solid #cccccc" }}>
                    TOTAL
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #cccccc",
                      textAlign: "right",
                      color: "#0A6E5A",
                    }}
                  >
                    {fmtAmt(certificateLeader.totalCommission)}
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #cccccc",
                      textAlign: "right",
                      color: "#c53030",
                    }}
                  >
                    {fmtAmt(certificateLeader.tdsAmount)}
                  </td>
                  <td
                    style={{
                      padding: "6px",
                      border: "1px solid #cccccc",
                      textAlign: "right",
                      color: "#22543d",
                    }}
                  >
                    {fmtAmt(certificateLeader.netPayable)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Declaration & Signature */}
            <div
              style={{
                marginTop: "24px",
                borderTop: "1px solid #cccccc",
                paddingTop: "12px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              <div style={{ maxWidth: "65%", fontSize: "9.5px", color: "#555", lineHeight: "1.4" }}>
                <strong>Declaration:</strong>
                <br />
                We hereby certify that the tax deducted at source has been / is being credited to the
                Central Government account. This is a computer generated certificate issued for
                income tax compliance purposes.
                <br />
                <br />
                <strong>Date of Issue:</strong> {new Date().toLocaleDateString("en-IN")}
                <br />
                <strong>Place:</strong> {deductorInfo.deductorAddress}
              </div>

              <div style={{ textAlign: "center", minWidth: "150px" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    border: "1px dashed #0A6E5A",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 6px auto",
                    color: "#0A6E5A",
                    fontSize: "8px",
                    textAlign: "center",
                  }}
                >
                  OFFICIAL
                  <br />
                  SEAL
                </div>
                <div style={{ borderTop: "1px solid #333333", paddingTop: "4px" }}>
                  <strong style={{ fontSize: "10px" }}>Authorized Signatory</strong>
                  <br />
                  <span style={{ fontSize: "9px", color: "#666" }}>
                    {deductorInfo.deductorName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
