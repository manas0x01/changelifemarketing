"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Banknote,
  CheckCircle,
  Loader2,
  Calendar,
  Download,
  IndianRupee,
  CreditCard,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  X,
  Hash,
  Phone,
  User,
} from "lucide-react";
import { toast } from "sonner";

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

interface Payout {
  _id: string;
  userId: string;
  userName: string;
  userFullName: string;
  mobileNo: string;
  requestNo: string;
  amount: number;
  status: "Approved";
  requestDate: string;
  processedDate?: string;
  processedBy?: string;
  adminRemark?: string;
  utrNumber?: string;
  paymentMode?: string;
  bankDetails: BankDetails;
}

interface Summary {
  totalCount: number;
  totalAmount: number;
  byMode: Record<string, { count: number; amount: number }>;
  dateFrom: string;
  dateTo: string;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmtAmt = (n?: number | null) => {
  if (n === undefined || n === null) return "₹0";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const fmtDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const todayStr = () => new Date().toISOString().split("T")[0];

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => toast.success("Copied!"));
};

/* ─────────────────────────────────────────────
   DETAIL DRAWER
───────────────────────────────────────────── */
const DetailDrawer = ({ payout, onClose }: { payout: Payout; onClose: () => void }) => (
  <AnimatePresence>
    {payout && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="relative bg-white h-full w-full max-w-md overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#0A6E5A] px-6 py-5 flex items-start justify-between">
            <div>
              <p className="font-['Roboto'] text-[0.7rem] text-[#C9A84C] uppercase tracking-widest mb-1">
                Payout Detail
              </p>
              <h3 className="font-['Fraunces'] text-[1.4rem] text-white leading-tight">
                {payout.requestNo}
              </h3>
              <p className="font-['Roboto'] text-[0.75rem] text-white/60 mt-0.5">
                Processed: {fmtDate(payout.processedDate)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-1 w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Amount Highlight */}
            <div className="bg-gradient-to-br from-[#0A6E5A] to-[#0D8B7A] rounded-xl p-5 text-white flex items-center justify-between">
              <div>
                <p className="text-[0.7rem] uppercase tracking-widest text-white/60 mb-1">Amount Paid</p>
                <p className="font-['Fraunces'] text-[2.2rem] leading-none">{fmtAmt(payout.amount)}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                <IndianRupee className="w-7 h-7 text-[#C9A84C]" />
              </div>
            </div>

            {/* Status + Mode Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[0.65rem] uppercase tracking-widest text-emerald-600/70 mb-0.5">Status</p>
                  <p className="font-['Roboto'] font-bold text-emerald-700 text-[0.85rem]">Approved</p>
                </div>
              </div>
              <div className="bg-[#F5F7F6] border border-[#0A6E5A]/10 rounded-lg p-4 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-[#C9A84C] shrink-0" />
                <div>
                  <p className="text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-0.5">Payment Mode</p>
                  <p className="font-['Roboto'] font-bold text-[#0A6E5A] text-[0.85rem]">
                    {payout.paymentMode || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* UTR Number */}
            {payout.utrNumber && (
              <div className="bg-[#F5F7F6] border border-[#0A6E5A]/10 rounded-lg p-4">
                <p className="text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2 flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> UTR / Transaction Number
                </p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-['Roboto'] font-bold text-[#0A6E5A] tracking-widest text-[0.95rem] break-all">
                    {payout.utrNumber}
                  </p>
                  <button
                    onClick={() => copyText(payout.utrNumber!)}
                    className="shrink-0 w-8 h-8 bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 rounded flex items-center justify-center transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#0A6E5A]" />
                  </button>
                </div>
              </div>
            )}

            {/* User Info */}
            <div>
              <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-3 flex items-center gap-2 border-b border-[#0A6E5A]/10 pb-2">
                <User className="w-3.5 h-3.5 text-[#0A6E5A]" /> User Information
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Full Name", value: payout.userFullName || payout.userName },
                  { label: "User ID", value: payout.userId },
                  { label: "Username", value: payout.userName },
                  { label: "Mobile", value: payout.mobileNo || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#F5F7F6] border border-[#0A6E5A]/8 rounded-lg p-3">
                    <p className="text-[0.6rem] uppercase tracking-widest text-[#333]/45 mb-1">{label}</p>
                    <p className="font-['Roboto'] text-[0.85rem] font-semibold text-[#333] truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-3 flex items-center gap-2 border-b border-[#0A6E5A]/10 pb-2">
                <Banknote className="w-3.5 h-3.5 text-[#0A6E5A]" /> Bank Details
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Account Holder", value: payout.bankDetails?.accountHolderName || "—" },
                  { label: "Bank Name", value: payout.bankDetails?.bankName || "—" },
                  { label: "Account Number", value: payout.bankDetails?.accountNumber || "—" },
                  { label: "IFSC Code", value: payout.bankDetails?.ifscCode || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#F5F7F6] border border-[#0A6E5A]/8 rounded-lg p-3 group">
                    <p className="text-[0.6rem] uppercase tracking-widest text-[#333]/45 mb-1">{label}</p>
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-['Roboto'] text-[0.85rem] font-semibold text-[#0A6E5A] truncate">{value}</p>
                      {value !== "—" && (
                        <button
                          onClick={() => copyText(value)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 rounded flex items-center justify-center transition-all"
                        >
                          <Copy className="w-3 h-3 text-[#0A6E5A]" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-3 flex items-center gap-2 border-b border-[#0A6E5A]/10 pb-2">
                <Calendar className="w-3.5 h-3.5 text-[#0A6E5A]" /> Timeline
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-4 py-3 bg-[#F5F7F6] border border-[#0A6E5A]/8 rounded-lg">
                  <span className="text-[0.75rem] text-[#333]/50 uppercase tracking-widest">Request Date</span>
                  <span className="font-['Roboto'] text-[0.85rem] font-semibold text-[#333]">
                    {fmtDate(payout.requestDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <span className="text-[0.75rem] text-emerald-700/70 uppercase tracking-widest">Processed Date</span>
                  <span className="font-['Roboto'] text-[0.85rem] font-semibold text-emerald-700">
                    {fmtDate(payout.processedDate)}
                  </span>
                </div>
                {payout.processedBy && (
                  <div className="flex items-center justify-between px-4 py-3 bg-[#F5F7F6] border border-[#0A6E5A]/8 rounded-lg">
                    <span className="text-[0.75rem] text-[#333]/50 uppercase tracking-widest">Processed By</span>
                    <span className="font-['Roboto'] text-[0.85rem] font-semibold text-[#0A6E5A]">
                      {payout.processedBy}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Remark */}
            {payout.adminRemark && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-[0.65rem] uppercase tracking-widest text-amber-700/70 mb-2">Admin Remark</p>
                <p className="font-['Roboto'] text-[0.875rem] text-amber-900">{payout.adminRemark}</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ─────────────────────────────────────────────
   PAYMENT MODE BADGE
───────────────────────────────────────────── */
const ModeBadge = ({ mode }: { mode?: string }) => {
  const colors: Record<string, string> = {
    NEFT:  "bg-blue-50 text-blue-700 border-blue-100",
    IMPS:  "bg-purple-50 text-purple-700 border-purple-100",
    UPI:   "bg-orange-50 text-orange-700 border-orange-100",
    RTGS:  "bg-indigo-50 text-indigo-700 border-indigo-100",
    Other: "bg-gray-50 text-gray-600 border-gray-200",
  };
  const cls = colors[mode || ""] || colors.Other;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-[0.7rem] font-bold uppercase tracking-wide ${cls}`}
    >
      <CreditCard className="w-3 h-3" />
      {mode || "—"}
    </span>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function DailyPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(todayStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  /* ── Quick date presets ── */
  const applyPreset = (preset: "today" | "yesterday" | "week" | "month") => {
    const now = new Date();
    if (preset === "today") {
      const t = now.toISOString().split("T")[0];
      setDateFrom(t); setDateTo(t);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const ys = y.toISOString().split("T")[0];
      setDateFrom(ys); setDateTo(ys);
    } else if (preset === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now); start.setDate(diff);
      setDateFrom(start.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFrom(start.toISOString().split("T")[0]);
      setDateTo(now.toISOString().split("T")[0]);
    }
    setPage(1);
  };

  /* ── Fetch ── */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: "20",
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(`/api/admin/daily-payouts?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPayouts(data.payouts || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setSummary(data.summary || null);
    } catch {
      toast.error("Failed to fetch payouts");
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, dateFrom, dateTo]);

  /* ── CSV Export ── */
  const exportCSV = async () => {
    try {
      toast.info("Preparing export…");
      const params = new URLSearchParams({
        search, page: "1", limit: "-1",
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(`/api/admin/daily-payouts?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const all: Payout[] = data.payouts || [];
      if (!all.length) { toast.error("No records to export"); return; }

      const headers = [
        "Request No", "User ID", "Username", "Full Name", "Mobile",
        "Amount", "Payment Mode", "UTR Number", "Bank Name",
        "Account Holder", "Account Number", "IFSC Code",
        "Request Date", "Processed Date", "Processed By", "Admin Remark",
      ];
      const rows = all.map((p) => [
        p.requestNo, p.userId, p.userName, p.userFullName, p.mobileNo,
        p.amount, p.paymentMode || "", p.utrNumber || "",
        p.bankDetails?.bankName || "", p.bankDetails?.accountHolderName || "",
        p.bankDetails?.accountNumber || "", p.bankDetails?.ifscCode || "",
        p.requestDate ? new Date(p.requestDate).toISOString() : "",
        p.processedDate ? new Date(p.processedDate).toISOString() : "",
        p.processedBy || "", p.adminRemark || "",
      ]);

      const csv = [headers, ...rows]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily_payouts_${dateFrom || "all"}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      toast.success("Exported successfully!");
    } catch {
      toast.error("Export failed");
    }
  };

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div className="bg-[#F5F7F6] min-h-screen">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#0A6E5A]/10 px-6 md:px-8 py-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-0.5">Admin Panel</p>
            <h1 className="font-['Fraunces'] text-[1.75rem] md:text-[2.25rem] text-[#0A6E5A] leading-tight">
              Daily Payouts Approved
            </h1>
            <p className="font-['Roboto'] text-[0.8rem] text-[#333]/50 mt-0.5">
              All payouts approved and processed within the selected date range
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C9A84C] hover:bg-[#B8963B] text-white font-['Roboto'] font-semibold text-[0.85rem] rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white font-['Roboto'] font-semibold text-[0.85rem] rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </motion.div>

      <main className="px-6 md:px-8 py-8 space-y-6">

        {/* ── Summary Cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Total Payouts */}
          <div className="bg-gradient-to-br from-[#0A6E5A] to-[#0D8B7A] rounded-xl p-5 text-white shadow-md">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.7rem] uppercase tracking-widest text-white/70">Total Payouts</p>
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckCircle className="w-4.5 h-4.5 text-[#C9A84C]" />
              </div>
            </div>
            <p className="font-['Fraunces'] text-[2rem] leading-none mb-1">{summary?.totalCount ?? 0}</p>
            <p className="font-['Roboto'] text-[0.9rem] font-semibold text-white/80">{fmtAmt(summary?.totalAmount)}</p>
          </div>

          {/* Payment Mode Breakdown */}
          {["NEFT", "IMPS", "UPI"].map((mode) => {
            const modeColors: Record<string, { from: string; to: string }> = {
              NEFT: { from: "#1565C0", to: "#1976D2" },
              IMPS: { from: "#6A1B9A", to: "#7B1FA2" },
              UPI:  { from: "#E65100", to: "#F57C00" },
            };
            const c = modeColors[mode];
            const d = summary?.byMode?.[mode];
            return (
              <div
                key={mode}
                className="rounded-xl p-5 text-white shadow-md"
                style={{ background: `linear-gradient(135deg, ${c.from} 0%, ${c.to} 100%)` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[0.7rem] uppercase tracking-widest text-white/70">{mode}</p>
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-white/80" />
                  </div>
                </div>
                <p className="font-['Fraunces'] text-[2rem] leading-none mb-1">{d?.count ?? 0}</p>
                <p className="font-['Roboto'] text-[0.9rem] font-semibold text-white/80">{fmtAmt(d?.amount)}</p>
              </div>
            );
          })}
        </motion.div>

        {/* ── Filters ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white border border-[#0A6E5A]/10 rounded-xl p-5 shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block font-['Roboto'] text-[0.72rem] uppercase tracking-widest text-[#333]/50 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="User ID, Name, Request No, UTR…"
                  className="w-full pl-10 pr-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded-lg transition-colors"
                />
              </div>
            </div>
            {/* Date From */}
            <div>
              <label className="block font-['Roboto'] text-[0.72rem] uppercase tracking-widest text-[#333]/50 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded-lg transition-colors"
              />
            </div>
            {/* Date To */}
            <div>
              <label className="block font-['Roboto'] text-[0.72rem] uppercase tracking-widest text-[#333]/50 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded-lg transition-colors"
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#0A6E5A]/8">
            <span className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/40 mr-1">
              Quick:
            </span>
            {[
              { id: "today",     label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week",      label: "This Week" },
              { id: "month",     label: "This Month" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id as any)}
                className="px-3 py-1.5 text-[0.7rem] font-bold uppercase rounded-full border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A] hover:text-white hover:border-[#0A6E5A] transition-all"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => { setSearch(""); setDateFrom(todayStr()); setDateTo(todayStr()); }}
              className="ml-auto px-3 py-1.5 text-[0.7rem] font-bold uppercase rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 transition-all flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Active Date Range Info */}
          {summary && (
            <div className="flex items-center gap-2 mt-3 text-[0.75rem] text-[#0A6E5A]/70">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                Showing payouts from{" "}
                <strong>{new Date(summary.dateFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                {" "}to{" "}
                <strong>{new Date(summary.dateTo).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
              </span>
            </div>
          )}
        </motion.div>

        {/* ── Table ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="bg-white border border-[#0A6E5A]/10 rounded-xl overflow-hidden shadow-sm"
        >
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-[#0A6E5A]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.85rem] font-semibold text-[#0A6E5A]">
                  Approved Payouts
                </p>
                <p className="font-['Roboto'] text-[0.7rem] text-[#333]/40">
                  {loading ? "Loading…" : `${total} record${total !== 1 ? "s" : ""} found`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[0.75rem] text-[#333]/40">
              {totalPages > 1 && <span>Page {page} / {totalPages}</span>}
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0A6E5A] mx-auto mb-3" />
              <p className="font-['Roboto'] text-[#333]/40 text-[0.85rem]">Loading payouts…</p>
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-[#0A6E5A]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[#0A6E5A]/30" />
              </div>
              <p className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]/50 mb-1">No payouts found</p>
              <p className="font-['Roboto'] text-[0.8rem] text-[#333]/35">
                Try adjusting the date range or search query.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/8">
                    <tr>
                      {[
                        "#", "Request No", "User", "Amount",
                        "Mode", "UTR Number", "Bank", "Processed Date", "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3.5 text-left font-['Roboto'] text-[0.68rem] uppercase tracking-widest text-[#333]/45 font-bold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A6E5A]/5">
                    {payouts.map((p, idx) => (
                      <motion.tr
                        key={p._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        className="hover:bg-[#0A6E5A]/2 transition-colors group cursor-pointer"
                        onClick={() => setSelectedPayout(p)}
                      >
                        <td className="px-4 py-3.5 text-[0.72rem] text-[#333]/30 font-['Roboto']">
                          {(page - 1) * 20 + idx + 1}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-['Roboto'] font-bold text-[0.85rem] text-[#0A6E5A]">
                            {p.requestNo}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-['Roboto'] text-[0.85rem] font-semibold text-[#333]">
                            {p.userFullName || p.userName}
                          </p>
                          <p className="text-[0.72rem] text-[#333]/50">{p.userId}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-['Fraunces'] text-[1.05rem] text-[#0A6E5A] font-bold">
                            {fmtAmt(p.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <ModeBadge mode={p.paymentMode} />
                        </td>
                        <td className="px-4 py-3.5">
                          {p.utrNumber ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-['Roboto'] text-[0.8rem] text-[#0A6E5A] font-semibold tracking-wide">
                                {p.utrNumber}
                              </span>
                              <button
                                onClick={(e) => { e.stopPropagation(); copyText(p.utrNumber!); }}
                                className="opacity-0 group-hover:opacity-100 w-6 h-6 bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 rounded flex items-center justify-center transition-all"
                              >
                                <Copy className="w-3 h-3 text-[#0A6E5A]" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#333]/30 text-[0.8rem]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-[0.8rem] text-[#333]/70 font-semibold">
                            {p.bankDetails?.bankName || "—"}
                          </p>
                          {p.bankDetails?.accountNumber && (
                            <p className="text-[0.7rem] text-[#333]/40">
                              ••••{p.bankDetails.accountNumber.slice(-4)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-[0.78rem] text-[#333]/60 whitespace-nowrap">
                          {fmtDate(p.processedDate)}
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedPayout(p); }}
                            className="px-3 py-1.5 bg-[#0A6E5A]/8 hover:bg-[#0A6E5A] hover:text-white text-[#0A6E5A] font-['Roboto'] font-semibold text-[0.72rem] uppercase tracking-wide rounded-lg transition-all"
                          >
                            View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-[#0A6E5A]/5">
                {payouts.map((p, idx) => (
                  <motion.div
                    key={p._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-4 hover:bg-[#0A6E5A]/2 transition-colors cursor-pointer"
                    onClick={() => setSelectedPayout(p)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-['Roboto'] font-bold text-[0.85rem] text-[#0A6E5A]">{p.requestNo}</p>
                        <p className="text-[0.8rem] font-semibold text-[#333] mt-0.5">{p.userFullName || p.userName}</p>
                        <p className="text-[0.72rem] text-[#333]/50">{p.userId}</p>
                      </div>
                      <span className="font-['Fraunces'] text-[1.15rem] text-[#0A6E5A] font-bold">
                        {fmtAmt(p.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <ModeBadge mode={p.paymentMode} />
                      <span className="text-[0.72rem] text-[#333]/45">{fmtDate(p.processedDate)}</span>
                    </div>
                    {p.utrNumber && (
                      <div className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-[#0A6E5A]">
                        <Hash className="w-3 h-3" />
                        <span className="font-semibold tracking-wide">{p.utrNumber}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#0A6E5A]/10 flex items-center justify-between">
              <p className="font-['Roboto'] text-[0.75rem] text-[#333]/45">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="w-8 h-8 rounded-lg border border-[#0A6E5A]/20 flex items-center justify-center text-[#0A6E5A] hover:bg-[#0A6E5A] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = totalPages <= 5 ? i + 1 : Math.max(1, page - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-[0.8rem] font-bold transition-all ${
                        page === p
                          ? "bg-[#0A6E5A] text-white"
                          : "border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/8"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 rounded-lg border border-[#0A6E5A]/20 flex items-center justify-center text-[#0A6E5A] hover:bg-[#0A6E5A] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Payment Mode Breakdown ── */}
        {summary && Object.keys(summary.byMode).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="bg-white border border-[#0A6E5A]/10 rounded-xl p-6 shadow-sm"
          >
            <h3 className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A] mb-5 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#C9A84C]" />
              Payment Mode Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(summary.byMode).map(([mode, stats]) => (
                <div
                  key={mode}
                  className="bg-[#F5F7F6] border border-[#0A6E5A]/8 rounded-xl p-4 hover:border-[#0A6E5A]/20 transition-colors"
                >
                  <ModeBadge mode={mode} />
                  <p className="font-['Fraunces'] text-[1.5rem] text-[#0A6E5A] mt-3 mb-0.5">{stats.count}</p>
                  <p className="font-['Roboto'] text-[0.8rem] font-semibold text-[#C9A84C]">{fmtAmt(stats.amount)}</p>
                  <p className="text-[0.65rem] text-[#333]/40 uppercase tracking-wide mt-0.5">transactions</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      {/* ── Detail Drawer ── */}
      {selectedPayout && (
        <DetailDrawer payout={selectedPayout} onClose={() => setSelectedPayout(null)} />
      )}
    </div>
  );
}
