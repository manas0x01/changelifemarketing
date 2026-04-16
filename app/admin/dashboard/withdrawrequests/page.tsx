"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, RefreshCw, Banknote, Check, X, Eye, TrendingUp,
  AlertTriangle, Loader2, Copy, Calendar, User, Phone, DollarSign,
  ArrowLeft, ArrowRight, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

interface WithdrawRequest {
  _id: string;
  userId: string;
  userName: string;
  userFullName: string;
  mobileNo: string;
  requestNo: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
  processedDate?: string;
  processedBy?: string;
  adminRemark?: string;
  utrNumber?: string;
  paymentMode?: string;
  bankDetails: BankDetails;
}

interface Summary {
  Pending: { count: number; amount: number };
  Approved: { count: number; amount: number };
  Rejected: { count: number; amount: number };
  Total: { count: number; amount: number };
}

interface ActionModal {
  open: boolean;
  request: WithdrawRequest | null;
  action: "Approved" | "Rejected" | null;
  utrNumber: string;
  paymentMode: string;
  adminRemark: string;
  loading: boolean;
  error: string;
  success: string;
}

// ── HELPERS ──
const formatDate = (d?: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const formatAmount = (n?: number | null) => {
  if (n === undefined || n === null) return "₹0";
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const STATUS_CONFIG = {
  Pending:  { bg: "#FEF5E7", color: "#C9A84C", dot: "#C9A84C", label: "Pending"  },
  Approved: { bg: "#E8F4F1", color: "#0A6E5A", dot: "#0A6E5A", label: "Approved" },
  Rejected: { bg: "#FCE8E6", color: "#D32F2F", dot: "#D32F2F", label: "Rejected" },
};

const getStatusConfig = (status: any) => STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || { bg: "#e0e0e0", color: "#666", dot: "#999", label: status || "Unknown" };

// ── STAT CARD ──
const StatCard = ({ label, count, amount, gradient }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-lg p-6 text-white shadow-md hover:shadow-lg transition-shadow"
    style={{ background: gradient }}
  >
    <p className="font-['Roboto'] text-[0.75rem] uppercase tracking-widest opacity-90 mb-2">{label}</p>
    <p className="font-['Fraunces'] text-[2rem] leading-none mb-1">{count}</p>
    <p className="font-['Roboto'] text-[1.1rem] font-semibold">{formatAmount(amount)}</p>
  </motion.div>
);

// ── DETAIL MODAL ──
const DetailModal = ({ req, onClose, onApprove, onReject }: any) => {
  const sc = getStatusConfig(req.status);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0A6E5A] px-6 py-5 flex items-center justify-between z-10">
          <div>
            <h3 className="font-['Fraunces'] text-[1.5rem] text-white">📋 Request Details</h3>
            <p className="font-['Roboto'] text-[0.75rem] text-[#C9A84C] mt-1">{req.requestNo}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center rounded-full transition-colors"
            suppressHydrationWarning={true}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Quick Summary */}
          <div className="bg-[#F5F7F6] border border-[#0A6E5A]/10 p-5 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 mb-1">Amount</p>
                <p className="font-['Fraunces'] text-[1.4rem] text-[#0A6E5A]">{formatAmount(req.amount)}</p>
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 mb-1">Status</p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.75rem] font-bold uppercase" style={{ background: sc.bg, color: sc.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                  {req.status}
                </div>
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 mb-1">Request Date</p>
                <p className="font-['Roboto'] text-[0.85rem] text-[#333]">{formatDate(req.requestDate)?.split(' ')[0]}</p>
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 mb-1">Request No</p>
                <p className="font-['Roboto'] font-bold text-[0.85rem] text-[#0A6E5A]">{req.requestNo}</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div>
            <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-4 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> User Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">User ID</p>
                <p className="font-['Roboto'] text-[0.9rem] font-bold text-[#0A6E5A]">{req.userId}</p>
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">Mobile</p>
                <p className="font-['Roboto'] text-[0.9rem] text-[#333]">{req.mobileNo || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">Full Name</p>
                <p className="font-['Roboto'] text-[0.9rem] text-[#333]">{req.userFullName || req.userName}</p>
              </div>
            </div>
          </div>

          {/* Bank Info */}
          <div>
            <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-4 flex items-center gap-2">
              <Banknote className="w-3.5 h-3.5" /> Bank Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">Account Holder</p>
                <p className="font-['Roboto'] text-[0.9rem] text-[#333]">{req.bankDetails?.accountHolderName || "—"}</p>
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">Bank Name</p>
                <p className="font-['Roboto'] text-[0.9rem] text-[#333]">{req.bankDetails?.bankName || "—"}</p>
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">Account Number</p>
                <p className="font-['Roboto'] text-[0.9rem] text-[#0A6E5A] tracking-widest">
                  {req.bankDetails?.accountNumber ? `••••${req.bankDetails.accountNumber.slice(-4)}` : "—"}
                </p>
              </div>
              <div>
                <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">IFSC Code</p>
                <p className="font-['Roboto'] text-[0.9rem] text-[#333] tracking-widest">{req.bankDetails?.ifscCode || "—"}</p>
              </div>
            </div>
          </div>

          {/* Processing Info */}
          {(req.utrNumber || req.adminRemark) && (
            <div>
              <h4 className="font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#C9A84C] mb-4 flex items-center gap-2">
                <Check className="w-3.5 h-3.5" /> Processing Details
              </h4>
              <div className="space-y-3">
                {req.utrNumber && (
                  <div>
                    <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">UTR Number</p>
                    <p className="font-['Roboto'] text-[0.9rem] text-[#0A6E5A] tracking-widest">{req.utrNumber}</p>
                  </div>
                )}
                {req.paymentMode && (
                  <div>
                    <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">Payment Mode</p>
                    <p className="font-['Roboto'] text-[0.9rem] text-[#333]">{req.paymentMode}</p>
                  </div>
                )}
                {req.adminRemark && (
                  <div>
                    <p className="font-['Roboto'] text-[0.65rem] uppercase tracking-widest text-[#333]/50 mb-2">Admin Remark</p>
                    <p className="font-['Roboto'] text-[0.9rem] text-[#333] bg-[#F5F7F6] p-3 rounded">{req.adminRemark}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#F5F7F6] border-t border-[#0A6E5A]/10 px-6 py-4 flex gap-3 justify-end">
          {req.status === "Pending" && (
            <>
              <button
                onClick={() => { onClose(); onApprove(req); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white font-['Roboto'] font-semibold text-[0.85rem] rounded transition-colors"
                suppressHydrationWarning={true}
              >
                <Check className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => { onClose(); onReject(req); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-['Roboto'] font-semibold text-[0.85rem] rounded transition-colors"
                suppressHydrationWarning={true}
              >
                <X className="w-4 h-4" /> Reject
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2.5 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] font-semibold text-[0.85rem] rounded hover:bg-[#0A6E5A]/5 transition-colors"
            suppressHydrationWarning={true}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── ACTION MODAL ──
const ActionModal = ({ req, action, onClose, onSubmit, loading, error, success }: any) => {
  const [utr, setUtr] = useState("");
  const [mode, setMode] = useState("NEFT");
  const [remark, setRemark] = useState("");

  const handleSubmit = () => {
    if (action === "Approved" && !utr.trim()) {
      toast.error("UTR Number is required");
      return;
    }
    onSubmit({ utrNumber: utr, paymentMode: mode, adminRemark: remark });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white w-full max-w-md rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 flex items-center justify-between ${action === "Approved" ? "bg-[#0A6E5A]" : "bg-red-500"}`}>
          <h3 className="font-['Fraunces'] text-[1.2rem] text-white">
            {action === "Approved" ? "✅ Approve Request" : "❌ Reject Request"}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 bg-white/10 hover:bg-white/20 flex items-center justify-center rounded-full transition-colors disabled:opacity-50"
            suppressHydrationWarning={true}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="bg-[#F5F7F6] p-4 rounded-lg space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="font-['Roboto'] text-[0.75rem] uppercase text-[#333]/50">Request No</span>
              <span className="font-['Roboto'] font-bold text-[0.85rem] text-[#0A6E5A]">{req.requestNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-['Roboto'] text-[0.75rem] uppercase text-[#333]/50">Amount</span>
              <span className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">{formatAmount(req.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-['Roboto'] text-[0.75rem] uppercase text-[#333]/50">User</span>
              <span className="font-['Roboto'] text-[0.85rem]">{req.userFullName || req.userName} ({req.userId})</span>
            </div>
          </div>

          {action === "Approved" && (
            <>
              <div>
                <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333]/50 mb-2">
                  UTR / Transaction Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter UTR or Transaction ID"
                  className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded transition-colors"
                  disabled={loading}
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333]/50 mb-2">Payment Mode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded transition-colors"
                  disabled={loading}
                  suppressHydrationWarning={true}
                >
                  <option value="NEFT">NEFT</option>
                  <option value="IMPS">IMPS</option>
                  <option value="UPI">UPI</option>
                  <option value="RTGS">RTGS</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333]/50 mb-2">
              Admin Remark {action === "Rejected" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder={action === "Approved" ? "Optional note..." : "Reason for rejection..."}
              className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded transition-colors resize-none min-h-32"
              disabled={loading}
              suppressHydrationWarning={true}
            />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-[0.85rem] rounded">{error}</div>}
          {success && <div className="p-3 bg-green-50 border border-green-200 text-green-600 text-[0.85rem] rounded">{success}</div>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#0A6E5A]/10 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] font-semibold text-[0.85rem] rounded hover:bg-[#0A6E5A]/5 transition-colors disabled:opacity-50"
            suppressHydrationWarning={true}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2.5 text-white font-['Roboto'] font-semibold text-[0.85rem] rounded transition-colors disabled:opacity-50 ${
              action === "Approved" ? "bg-[#0A6E5A] hover:bg-[#0A6E5A]/90" : "bg-red-500 hover:bg-red-600"
            }`}
            suppressHydrationWarning={true}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : action === "Approved" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {loading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── MAIN COMPONENT ──
export default function AdminDashboardWithdrawRequests() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [summary, setSummary] = useState<Summary>({
    Pending:  { count: 0, amount: 0 },
    Approved: { count: 0, amount: 0 },
    Rejected: { count: 0, amount: 0 },
    Total:    { count: 0, amount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals
  const [detailModal, setDetailModal] = useState<{ open: boolean; req: WithdrawRequest | null }>({ open: false, req: null });
  const [actionModal, setActionModal] = useState<ActionModal>({
    open: false, request: null, action: null,
    utrNumber: "", paymentMode: "NEFT", adminRemark: "",
    loading: false, error: "", success: "",
  });

  // ── FETCH DATA ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filterStatus,
        search,
        page: String(page),
        limit: "15",
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });
      const res = await fetch(`/api/admin/withdraw-requests?${params}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      if (data.summary) setSummary(data.summary);
    } catch (e) {
      toast.error("Failed to fetch requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search, page, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [filterStatus, search, dateFrom, dateTo]);

  // ── HANDLE ACTION ──
  const handleAction = async (data: any) => {
    if (!actionModal.request || !actionModal.action) return;
    try {
      setActionModal(p => ({ ...p, loading: true, error: "", success: "" }));
      const res = await fetch(`/api/admin/withdraw-requests/${actionModal.request._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionModal.action,
          utrNumber: data.utrNumber,
          paymentMode: data.paymentMode,
          adminRemark: data.adminRemark,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Action failed");
      
      setActionModal(p => ({ ...p, loading: false, success: "Request processed successfully!" }));
      setTimeout(() => {
        setActionModal({ open: false, request: null, action: null, utrNumber: "", paymentMode: "NEFT", adminRemark: "", loading: false, error: "", success: "" });
        fetchData();
        toast.success(json.message || "Done!");
      }, 1000);
    } catch (e: any) {
      setActionModal(p => ({ ...p, loading: false, error: e.message || "Network error" }));
    }
  };

  const openDetailModal = (req: WithdrawRequest) => {
    setDetailModal({ open: true, req });
  };

  const openActionModal = (req: WithdrawRequest, action: "Approved" | "Rejected") => {
    setActionModal({ open: true, request: req, action, utrNumber: "", paymentMode: "NEFT", adminRemark: "", loading: false, error: "", success: "" });
  };

  return (
    <div className="bg-[#F5F7F6] min-h-screen">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#0A6E5A]/10 px-6 md:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A]">Withdraw Requests</h1>
            <p className="font-['Roboto'] text-[#333]/60 text-sm mt-1">Manage and process user withdrawal requests</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white font-['Roboto'] font-semibold text-[0.85rem] rounded transition-colors disabled:opacity-50"
            suppressHydrationWarning={true}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </motion.div>

      <main className="px-6 md:px-8 py-8">
        <div className="max-w-full">
          {/* Summary Cards */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Requests"
              count={summary.Total.count}
              amount={summary.Total.amount}
              gradient="linear-gradient(135deg, #0A6E5A 0%, #0D8B7A 100%)"
            />
            <StatCard
              label="Pending"
              count={summary.Pending.count}
              amount={summary.Pending.amount}
              gradient="linear-gradient(135deg, #C9A84C 0%, #B8954A 100%)"
            />
            <StatCard
              label="Approved"
              count={summary.Approved.count}
              amount={summary.Approved.amount}
              gradient="linear-gradient(135deg, #0A6E5A 0%, #0D8B7A 100%)"
            />
            <StatCard
              label="Rejected"
              count={summary.Rejected.count}
              amount={summary.Rejected.amount}
              gradient="linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)"
            />
          </motion.div>

          {/* Filters */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white border border-[#0A6E5A]/10 p-5 mb-6 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333]/50 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="User ID / Request No..."
                    className="w-full pl-10 pr-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded transition-colors"
                    suppressHydrationWarning={true}
                  />
                </div>
              </div>
              <div>
                <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333]/50 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded transition-colors"
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <label className="block font-['Roboto'] text-[0.75rem] uppercase tracking-widest text-[#333]/50 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[#0A6E5A]/20 focus:border-[#0A6E5A] focus:outline-none bg-[#F8FAF9] font-['Roboto'] text-[0.875rem] rounded transition-colors"
                  suppressHydrationWarning={true}
                />
              </div>
              <div>
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white font-['Roboto'] font-semibold text-[0.85rem] rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  suppressHydrationWarning={true}
                >
                  <Filter className="w-4 h-4" /> Apply
                </button>
              </div>
              <div>
                <button
                  onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setFilterStatus("all"); }}
                  className="w-full px-4 py-2.5 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] font-semibold text-[0.85rem] rounded hover:bg-[#0A6E5A]/5 transition-colors"
                  suppressHydrationWarning={true}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#0A6E5A]/10">
              {["all", "Pending", "Approved", "Rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 text-[0.75rem] font-['Roboto'] font-bold uppercase tracking-wider rounded transition-all ${
                    filterStatus === s
                      ? s === "all"
                        ? "bg-[#0A6E5A] text-white"
                        : s === "Pending"
                        ? "bg-[#C9A84C] text-white"
                        : s === "Approved"
                        ? "bg-[#0A6E5A] text-white"
                        : "bg-red-500 text-white"
                      : "border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5"
                  }`}
                  suppressHydrationWarning={true}
                >
                  {s === "all" ? "All" : s}
                  {s !== "all" && (
                    <span className="ml-1.5 opacity-75">
                      ({s === "Pending" ? summary.Pending.count : s === "Approved" ? summary.Approved.count : summary.Rejected.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Table */}
          <div className="bg-white border border-[#0A6E5A]/10 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-[#0A6E5A]/10 flex items-center justify-between">
              <p className="font-['Roboto'] text-[0.75rem] text-[#333]/50">
                {loading ? "Loading..." : `Showing ${requests.length} of ${total} requests`}
              </p>
              {totalPages > 1 && <p className="font-['Roboto'] text-[0.75rem] text-[#333]/40">Page {page} / {totalPages}</p>}
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0A6E5A] mx-auto mb-2" />
                <p className="font-['Roboto'] text-[#333]/40">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-20 text-center">
                <AlertTriangle className="w-12 h-12 text-[#0A6E5A]/20 mx-auto mb-2" />
                <p className="font-['Roboto'] text-[#333]/40">No requests found</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0A6E5A]/3 border-b border-[#0A6E5A]/10">
                      <tr>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">#</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">Request No</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">User ID</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">Name</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">Amount</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">Bank</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">Date</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">Status</th>
                        <th className="px-4 py-3 text-left font-['Roboto'] text-[0.7rem] uppercase tracking-widest text-[#333]/50 font-bold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A6E5A]/5">
                      {requests.map((req, idx) => {
                        const sc = getStatusConfig(req.status);
                        return (
                          <motion.tr
                            key={req._id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="hover:bg-[#0A6E5A]/2 transition-colors group"
                          >
                            <td className="px-4 py-3.5 font-['Roboto'] text-[0.75rem] text-[#333]/30">{(page - 1) * 15 + idx + 1}</td>
                            <td className="px-4 py-3.5 font-['Roboto'] font-bold text-[0.85rem] text-[#0A6E5A]">{req.requestNo}</td>
                            <td className="px-4 py-3.5 font-['Roboto'] text-[0.85rem] text-[#333]">{req.userId}</td>
                            <td className="px-4 py-3.5 font-['Roboto'] text-[0.85rem] text-[#333]">{req.userFullName || req.userName}</td>
                            <td className="px-4 py-3.5 font-['Fraunces'] text-[1rem] text-[#0A6E5A] font-bold">{formatAmount(req.amount)}</td>
                            <td className="px-4 py-3.5 text-[0.75rem]">
                              <div className="flex items-center gap-1 text-[#333]/60">
                                <Banknote className="w-3 h-3" />
                                {req.bankDetails?.bankName || "—"}
                              </div>
                              {req.bankDetails?.accountNumber && (
                                <div className="text-[0.7rem] text-[#333]/40">••••{req.bankDetails.accountNumber.slice(-4)}</div>
                              )}
                            </td>
                            <td className="px-4 py-3.5 font-['Roboto'] text-[0.75rem] text-[#333]/60">{formatDate(req.requestDate)?.split(" ")[0]}</td>
                            <td className="px-4 py-3.5">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.7rem] font-bold uppercase" style={{ background: sc.bg, color: sc.color }}>
                                <span className="w-2 h-2 rounded-full" style={{ background: sc.dot }} />
                                {req.status}
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openDetailModal(req)}
                                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 text-[#0A6E5A] font-['Roboto'] text-[0.7rem] font-bold rounded transition-colors"
                                  suppressHydrationWarning={true}
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                {req.status === "Pending" && (
                                  <>
                                    <button
                                      onClick={() => openActionModal(req, "Approved")}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white font-['Roboto'] text-[0.7rem] font-bold rounded transition-colors"
                                      suppressHydrationWarning={true}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => openActionModal(req, "Rejected")}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white font-['Roboto'] text-[0.7rem] font-bold rounded transition-colors"
                                      suppressHydrationWarning={true}
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden divide-y divide-[#0A6E5A]/5 p-4 space-y-4">
                  {requests.map((req, idx) => {
                    const sc = getStatusConfig(req.status);
                    return (
                      <motion.div
                        key={req._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-[#F8FAF9] border border-[#0A6E5A]/10 p-4 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-['Roboto'] font-bold text-[0.85rem] text-[#0A6E5A]">{req.requestNo}</p>
                            <p className="font-['Roboto'] text-[0.75rem] text-[#333]/50 mt-1">{req.userId}</p>
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.7rem] font-bold uppercase" style={{ background: sc.bg, color: sc.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                            {req.status}
                          </div>
                        </div>

                        <div className="space-y-2 mb-4 pb-4 border-b border-[#0A6E5A]/10">
                          <div className="flex justify-between">
                            <span className="font-['Roboto'] text-[0.7rem] uppercase text-[#333]/50">Amount</span>
                            <span className="font-['Fraunces'] text-[1rem] text-[#0A6E5A] font-bold">{formatAmount(req.amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-['Roboto'] text-[0.7rem] uppercase text-[#333]/50">Name</span>
                            <span className="font-['Roboto'] text-[0.8rem]">{req.userFullName || req.userName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-['Roboto'] text-[0.7rem] uppercase text-[#333]/50">Bank</span>
                            <span className="font-['Roboto'] text-[0.8rem]">{req.bankDetails?.bankName || "—"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-['Roboto'] text-[0.7rem] uppercase text-[#333]/50">Date</span>
                            <span className="font-['Roboto'] text-[0.8rem]">{formatDate(req.requestDate)?.split(" ")[0]}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => openDetailModal(req)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0A6E5A]/8 hover:bg-[#0A6E5A]/15 text-[#0A6E5A] font-['Roboto'] text-[0.75rem] font-bold rounded transition-colors"
                            suppressHydrationWarning={true}
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          {req.status === "Pending" && (
                            <>
                              <button
                                onClick={() => openActionModal(req, "Approved")}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#0A6E5A] hover:bg-[#0A6E5A]/90 text-white font-['Roboto'] text-[0.75rem] font-bold rounded transition-colors"
                                suppressHydrationWarning={true}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openActionModal(req, "Rejected")}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-['Roboto'] text-[0.75rem] font-bold rounded transition-colors"
                                suppressHydrationWarning={true}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="px-6 py-4 border-t border-[#0A6E5A]/10 flex items-center justify-between">
                <p className="font-['Roboto'] text-[0.75rem] text-[#333]/50">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-3 py-2 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] text-[0.75rem] font-bold rounded hover:bg-[#0A6E5A]/5 disabled:opacity-30 transition-colors"
                    suppressHydrationWarning={true}
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p = page <= 3 ? i + 1 : page + i - 2;
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 font-['Roboto'] text-[0.75rem] font-bold rounded transition-all ${
                          page === p ? "bg-[#0A6E5A] text-white" : "border border-[#0A6E5A]/20 text-[#0A6E5A] hover:bg-[#0A6E5A]/5"
                        }`}
                        suppressHydrationWarning={true}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1.5 px-3 py-2 border border-[#0A6E5A]/20 text-[#0A6E5A] font-['Roboto'] text-[0.75rem] font-bold rounded hover:bg-[#0A6E5A]/5 disabled:opacity-30 transition-colors"
                    suppressHydrationWarning={true}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {detailModal.open && detailModal.req && (
          <DetailModal
            req={detailModal.req}
            onClose={() => setDetailModal({ open: false, req: null })}
            onApprove={(req: WithdrawRequest) => openActionModal(req, "Approved")}
            onReject={(req: WithdrawRequest) => openActionModal(req, "Rejected")}
          />
        )}
        {actionModal.open && actionModal.request && (
          <ActionModal
            req={actionModal.request}
            action={actionModal.action}
            onClose={() => setActionModal({ ...actionModal, open: false })}
            onSubmit={handleAction}
            loading={actionModal.loading}
            error={actionModal.error}
            success={actionModal.success}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
