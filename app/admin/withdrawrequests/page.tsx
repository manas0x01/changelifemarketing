"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconBank = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.5 1L2 6v2h19V6L11.5 1zM4 9v9H2v2h19v-2h-2V9h-3v9h-3V9H9v9H6V9H4zM2 20h19v2H2v-2z"/>
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

// ── MAIN COMPONENT ──
export default function AdminWithdrawRequests() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [summary, setSummary] = useState<Summary>({
    Pending:  { count: 0, amount: 0 },
    Approved: { count: 0, amount: 0 },
    Rejected: { count: 0, amount: 0 },
    Total:    { count: 0, amount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch]             = useState("");
  const [searchInput, setSearchInput]   = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");

  // Detail modal
  const [detailModal, setDetailModal] = useState<{ open: boolean; req: WithdrawRequest | null }>({ open: false, req: null });

  // Action modal
  const [actionModal, setActionModal] = useState<ActionModal>({
    open: false, request: null, action: null,
    utrNumber: "", paymentMode: "", adminRemark: "",
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
        ...(dateTo   && { dateTo }),
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
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search, page, dateFrom, dateTo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filterStatus, search, dateFrom, dateTo]);

  // ── HANDLE ACTION (Approve / Reject) ──
  const handleAction = async () => {
    if (!actionModal.request || !actionModal.action) return;
    if (actionModal.action === "Approved" && !actionModal.utrNumber.trim()) {
      setActionModal(p => ({ ...p, error: "UTR Number is required for approval." }));
      return;
    }
    try {
      setActionModal(p => ({ ...p, loading: true, error: "" }));
      const res = await fetch(`/api/admin/withdraw-requests/${actionModal.request._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status:      actionModal.action,
          utrNumber:   actionModal.utrNumber,
          paymentMode: actionModal.paymentMode,
          adminRemark: actionModal.adminRemark,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionModal(p => ({ ...p, loading: false, error: data.error || "Action failed" }));
        return;
      }
      setActionModal(p => ({ ...p, loading: false, success: data.message || "Done!" }));
      setTimeout(() => {
        setActionModal({ open: false, request: null, action: null, utrNumber: "", paymentMode: "", adminRemark: "", loading: false, error: "", success: "" });
        fetchData();
      }, 1200);
    } catch {
      setActionModal(p => ({ ...p, loading: false, error: "Network error" }));
    }
  };

  const openAction = (req: WithdrawRequest, action: "Approved" | "Rejected") => {
    setActionModal({ open: true, request: req, action, utrNumber: "", paymentMode: "NEFT", adminRemark: "", loading: false, error: "", success: "" });
  };

  return (
    <>
      <style>{`
        .ar-root { font-family: 'Roboto', sans-serif; }
        .ar-content { max-width: 1400px; margin: 0 auto; padding: 32px 20px; }
        .ar-page-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; font-family: 'Fraunces', serif; }
        .ar-page-title h1 { font-size: 2.5rem; color: #0A6E5A; margin: 0; font-weight: 700; }
        .ar-page-title p { color: #666; margin: 4px 0 0 0; font-size: 0.95rem; }
        .ar-title-text { text-align: left; }
        .ar-refresh-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #0A6E5A; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s; }
        .ar-refresh-btn:hover { background: #0D8B7A; }
        .ar-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .ar-sum-card { padding: 24px; border-radius: 12px; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .ar-sum-label { font-size: 14px; font-weight: 500; opacity: 0.9; margin-bottom: 12px; }
        .ar-sum-count { font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
        .ar-sum-amount { font-size: 1.25rem; font-weight: 600; }
        .ar-filters { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; align-items: flex-end; padding: 20px; background: #f8f8f8; border-radius: 8px; }
        .ar-filter-group { display: flex; flex-direction: column; gap: 8px; }
        .ar-filter-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .ar-filter-input, .ar-filter-date { padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit; }
        .ar-search-wrap { position: relative; display: flex; align-items: center; }
        .ar-search-icon { position: absolute; left: 12px; color: #999; display: flex; }
        .ar-filter-input { padding-left: 36px; }
        .ar-filter-btn, .ar-filter-clear { padding: 10px 18px; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 6px; }
        .ar-filter-btn { background: #0A6E5A; color: white; }
        .ar-filter-btn:hover { background: #0D8B7A; }
        .ar-filter-clear { background: #e04343; color: white; }
        .ar-filter-clear:hover { background: #c92a2a; }
        .ar-tabs { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .ar-tab { padding: 10px 18px; border: 2px solid #ddd; background: white; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s; color: #333; }
        .ar-tab:hover { border-color: #0A6E5A; color: #0A6E5A; }
        .ar-tab.active-all, .ar-tab.active-Pending, .ar-tab.active-Approved, .ar-tab.active-Rejected { background: #0A6E5A; color: white; border-color: #0A6E5A; }
        .ar-table-card { background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }
        .ar-table-head { padding: 20px; border-bottom: 1px solid #f0f0f0; }
        .ar-table-head-title { font-size: 18px; font-weight: 700; color: #0A6E5A; font-family: 'Fraunces', serif; }
        .ar-table-head-count { font-size: 13px; color: #999; margin-top: 4px; }
        .ar-loading { text-align: center; padding: 60px 20px; }
        .ar-spinner { display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0A6E5A; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 16px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .ar-empty { text-align: center; padding: 60px 20px; }
        .ar-empty-icon { font-size: 4rem; margin-bottom: 16px; }
        .ar-empty h3 { color: #333; margin: 12px 0; font-size: 1.25rem; }
        .ar-empty p { color: #999; }
        .ar-table-wrap { overflow-x: auto; }
        .ar-table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .ar-table thead { background: #f9f9f9; border-bottom: 2px solid #0A6E5A; }
        .ar-table th { padding: 14px 12px; text-align: left; font-weight: 700; color: #0A6E5A; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .ar-table tbody tr { border-bottom: 1px solid #f0f0f0; transition: background 0.2s; }
        .ar-table tbody tr:hover { background: #f9f9f9; }
        .ar-table td { padding: 14px 12px; }
        .ar-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; }
        .ar-badge-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; }
        .ar-action-row { display: flex; gap: 8px; }
        .ar-btn-view { padding: 6px 12px; background: #0A6E5A; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s; display: flex; align-items: center; gap: 4px; }
        .ar-btn-view:hover { background: #0D8B7A; }
        .ar-btn-approve { padding: 6px 12px; background: #0A6E5A; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s; display: flex; align-items: center; gap: 4px; }
        .ar-btn-approve:hover { background: #0D8B7A; }
        .ar-btn-reject { padding: 6px 12px; background: #D32F2F; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600; transition: all 0.3s; display: flex; align-items: center; gap: 4px; }
        .ar-btn-reject:hover { background: #b71c1c; }
        .ar-mobile-cards { display: none; }
        @media (max-width: 768px) { .ar-table-wrap { display: none; } .ar-mobile-cards { display: block !important; } }
        .ar-mobile-card { background: white; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
        .ar-mc-header { padding: 12px 14px; background: #f9f9f9; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; }
        .ar-mc-reqno { font-weight: 700; color: #0A6E5A; font-size: 14px; }
        .ar-mc-body { padding: 14px; }
        .ar-mc-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
        .ar-mc-key { font-weight: 600; color: #666; }
        .ar-mc-val { color: #333; }
        .ar-mc-amount { font-weight: 700; font-size: 15px; color: #0A6E5A; }
        .ar-mc-footer { padding: 12px 14px; border-top: 1px solid #ddd; display: flex; gap: 8px; }
        .ar-mc-footer button { flex: 1; padding: 8px; font-size: 12px; }
        .ar-pagination { padding: 20px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .ar-pag-info { font-size: 13px; color: #666; }
        .ar-pag-btns { display: flex; gap: 6px; }
        .ar-pag-btn { width: 36px; height: 36px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer; font-weight: 600; transition: all 0.3s; }
        .ar-pag-btn:hover:not(:disabled) { background: #0A6E5A; color: white; border-color: #0A6E5A; }
        .ar-pag-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ar-pag-btn.ar-pag-active { background: #0A6E5A; color: white; border-color: #0A6E5A; }
        .ar-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
        .ar-modal { background: white; border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .ar-modal-head { padding: 20px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; }
        .ar-modal-title { font-size: 18px; font-weight: 700; font-family: 'Fraunces', serif; }
        .ar-modal-close { width: 32px; height: 32px; border: none; background: #f0f0f0; border-radius: 50%; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .ar-modal-close:hover { background: #e0e0e0; }
        .ar-modal-body { padding: 20px; }
        .ar-msection-label { font-size: 14px; font-weight: 700; color: #0A6E5A; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 12px 0; display: flex; align-items: center; gap: 6px; font-family: 'Fraunces', serif; }
        .ar-mfield { margin-bottom: 18px; }
        .ar-mfield label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
        .ar-mfield input, .ar-mfield select, .ar-mfield textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; font-family: inherit; }
        .ar-mfield input:focus, .ar-mfield select:focus, .ar-mfield textarea:focus { outline: none; border-color: #0A6E5A; box-shadow: 0 0 0 3px rgba(10, 110, 90, 0.1); }
        .ar-mfield textarea { resize: vertical; min-height: 80px; }
        .ar-mval { padding: 8px 0; color: #333; font-size: 14px; }
        .ar-mdivider { height: 1px; background: #f0f0f0; margin: 18px 0; }
        .ar-bank-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .ar-merror { padding: 12px 14px; background: #fce4ec; color: #D32F2F; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
        .ar-msuccess { padding: 12px 14px; background: #e8f5e9; color: #0A6E5A; border-radius: 6px; font-size: 13px; margin-bottom: 16px; }
        .ar-modal-footer { padding: 16px 20px; border-top: 1px solid #f0f0f0; display: flex; gap: 12px; justify-content: flex-end; }
        .ar-mbtn-approve, .ar-mbtn-reject, .ar-mbtn-cancel { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.3s; display: flex; align-items: center; gap: 6px; }
        .ar-mbtn-approve { background: #0A6E5A; color: white; }
        .ar-mbtn-approve:hover:not(:disabled) { background: #0D8B7A; }
        .ar-mbtn-reject { background: #D32F2F; color: white; }
        .ar-mbtn-reject:hover:not(:disabled) { background: #b71c1c; }
        .ar-mbtn-cancel { background: #e0e0e0; color: #333; }
        .ar-mbtn-cancel:hover:not(:disabled) { background: #d0d0d0; }
        .ar-mbtn-approve:disabled, .ar-mbtn-reject:disabled, .ar-mbtn-cancel:disabled { opacity: 0.6; cursor: not-allowed; }
        .green-bar { height: 4px; background: linear-gradient(90deg, #0A6E5A 0%, #C9A84C 50%, #0A6E5A 100%); }
      `}</style>
      <div className="ar-root">
        {/* ── HEADER ── */}
        <Header />
        <div className="green-bar" />

        {/* ── MAIN ── */}
        <main className="ar-content">

          {/* Page Title */}
          <div className="ar-page-title">
            <div className="ar-title-text">
              <h1>💸 Withdraw Requests</h1>
              <p>Manage and process user withdrawal requests</p>
            </div>
            <button className="ar-refresh-btn" onClick={fetchData}>
              <IconRefresh /> Refresh
            </button>
          </div>

          {/* Summary Cards */}
          <div className="ar-summary">
            {[
              { label: "Total Requests", count: summary.Total.count, amount: summary.Total.amount, grad: "linear-gradient(135deg, #0A6E5A 0%, #0D8B7A 100%)" },
              { label: "Pending",        count: summary.Pending.count, amount: summary.Pending.amount, grad: "linear-gradient(135deg, #C9A84C 0%, #B8954A 100%)" },
              { label: "Approved",       count: summary.Approved.count, amount: summary.Approved.amount, grad: "linear-gradient(135deg, #0A6E5A 0%, #0D8B7A 100%)" },
              { label: "Rejected",       count: summary.Rejected.count, amount: summary.Rejected.amount, grad: "linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)" },
            ].map((c) => (
              <div key={c.label} className="ar-sum-card" style={{ background: c.grad }}>
                <div className="ar-sum-label">{c.label}</div>
                <div className="ar-sum-count">{c.count}</div>
                <div className="ar-sum-amount">{formatAmount(c.amount)}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="ar-filters">
            <div className="ar-filter-group">
              <div className="ar-filter-label">Search</div>
              <div className="ar-search-wrap">
                <span className="ar-search-icon"><IconSearch /></span>
                <input
                  className="ar-filter-input"
                  placeholder="User ID / Name / Request No..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") setSearch(searchInput); }}
                />
              </div>
            </div>
            <div className="ar-filter-group">
              <div className="ar-filter-label">From Date</div>
              <input type="date" className="ar-filter-date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="ar-filter-group">
              <div className="ar-filter-label">To Date</div>
              <input type="date" className="ar-filter-date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <button className="ar-filter-btn" onClick={() => setSearch(searchInput)}>
              <IconFilter /> Apply
            </button>
            <button className="ar-filter-clear" onClick={() => {
              setSearchInput(""); setSearch(""); setDateFrom(""); setDateTo(""); setFilterStatus("all");
            }}>
              Clear
            </button>
          </div>

          {/* Status Tabs */}
          <div className="ar-tabs">
            {["all", "Pending", "Approved", "Rejected"].map((s) => (
              <button
                key={s}
                className={`ar-tab ${filterStatus === s ? (s === "all" ? "active-all" : `active-${s}`) : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === "all" ? "All" : s}
                {s !== "all" && (
                  <span style={{ marginLeft: 6, opacity: 0.8 }}>
                    ({s === "Pending" ? summary.Pending.count : s === "Approved" ? summary.Approved.count : summary.Rejected.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Table Card */}
          <div className="ar-table-card">
            <div className="ar-table-head">
              <div className="ar-table-head-title">Withdraw Requests</div>
              <div className="ar-table-head-count">{total} record{total !== 1 ? "s" : ""} found</div>
            </div>

            {loading ? (
              <div className="ar-loading">
                <div className="ar-spinner" />
                Loading requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="ar-empty">
                <div className="ar-empty-icon">📭</div>
                <h3>No requests found</h3>
                <p>Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="ar-table-wrap">
                  <table className="ar-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Request No</th>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Mobile</th>
                        <th>Amount</th>
                        <th>Bank</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((req, idx) => {
                        const sc = getStatusConfig(req.status);
                        return (
                          <tr key={req._id}>
                            <td style={{ color: "#888", fontWeight: 600 }}>{(page - 1) * 15 + idx + 1}</td>
                            <td style={{ fontWeight: 700, color: "#0A6E5A", fontSize: 12 }}>{req.requestNo}</td>
                            <td style={{ fontWeight: 600 }}>{req.userId}</td>
                            <td>{req.userFullName || req.userName}</td>
                            <td>{req.mobileNo || "—"}</td>
                            <td style={{ fontWeight: 800, color: "#0A6E5A" }}>{formatAmount(req.amount)}</td>
                            <td style={{ fontSize: 11.5, color: "#555" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <IconBank />
                                {req.bankDetails?.bankName || "—"}
                              </div>
                              <div style={{ fontSize: 11, color: "#999" }}>
                                {req.bankDetails?.accountNumber ? `••••${req.bankDetails.accountNumber.slice(-4)}` : ""}
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: "#666" }}>{formatDate(req.requestDate)}</td>
                            <td>
                              <span className="ar-badge" style={{ background: sc.bg, color: sc.color }}>
                                <span className="ar-badge-dot" style={{ background: sc.dot }} />
                                {sc.label}
                              </span>
                            </td>
                            <td>
                              <div className="ar-action-row">
                                <button className="ar-btn-view" onClick={() => setDetailModal({ open: true, req })}>
                                  <IconEye /> View
                                </button>
                                {req.status === "Pending" && (
                                  <>
                                    <button className="ar-btn-approve" onClick={() => openAction(req, "Approved")}>
                                      <IconCheck /> Approve
                                    </button>
                                    <button className="ar-btn-reject" onClick={() => openAction(req, "Rejected")}>
                                      <IconX /> Reject
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="ar-mobile-cards" style={{ padding: "12px" }}>
                  {requests.map((req) => {
                    const sc = getStatusConfig(req.status);
                    return (
                      <div className="ar-mobile-card" key={req._id}>
                        <div className="ar-mc-header">
                          <span className="ar-mc-reqno">{req.requestNo}</span>
                          <span className="ar-badge" style={{ background: sc.bg, color: sc.color }}>
                            <span className="ar-badge-dot" style={{ background: sc.dot }} />
                            {sc.label}
                          </span>
                        </div>
                        <div className="ar-mc-body">
                          <div className="ar-mc-row">
                            <span className="ar-mc-key">Amount</span>
                            <span className="ar-mc-amount">{formatAmount(req.amount)}</span>
                          </div>
                          <div className="ar-mc-row">
                            <span className="ar-mc-key">User ID</span>
                            <span className="ar-mc-val">{req.userId}</span>
                          </div>
                          <div className="ar-mc-row">
                            <span className="ar-mc-key">Name</span>
                            <span className="ar-mc-val">{req.userFullName || req.userName}</span>
                          </div>
                          <div className="ar-mc-row">
                            <span className="ar-mc-key">Mobile</span>
                            <span className="ar-mc-val">{req.mobileNo || "—"}</span>
                          </div>
                          <div className="ar-mc-row">
                            <span className="ar-mc-key">Bank</span>
                            <span className="ar-mc-val">{req.bankDetails?.bankName || "—"} {req.bankDetails?.accountNumber ? `••••${req.bankDetails.accountNumber.slice(-4)}` : ""}</span>
                          </div>
                          <div className="ar-mc-row">
                            <span className="ar-mc-key">Date</span>
                            <span className="ar-mc-val">{formatDate(req.requestDate)}</span>
                          </div>
                        </div>
                        <div className="ar-mc-footer">
                          <button className="ar-btn-view" onClick={() => setDetailModal({ open: true, req })}>
                            <IconEye /> View
                          </button>
                          {req.status === "Pending" && (
                            <>
                              <button className="ar-btn-approve" onClick={() => openAction(req, "Approved")}>
                                <IconCheck /> Approve
                              </button>
                              <button className="ar-btn-reject" onClick={() => openAction(req, "Rejected")}>
                                <IconX /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="ar-pagination">
                    <div className="ar-pag-info">
                      Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
                    </div>
                    <div className="ar-pag-btns">
                      <button className="ar-pag-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let p = page <= 3 ? i + 1 : page + i - 2;
                        if (p > totalPages) return null;
                        return (
                          <button
                            key={p}
                            className={`ar-pag-btn ${page === p ? "ar-pag-active" : ""}`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        );
                      })}
                      <button className="ar-pag-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {/* ── FOOTER ── */}
        <Footer />
      </div>

      {/* ══════════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════════ */}
      {detailModal.open && detailModal.req && (
        <div className="ar-modal-overlay" onClick={() => setDetailModal({ open: false, req: null })}>
          <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ar-modal-head">
              <div className="ar-modal-title">📋 Request Details</div>
              <button className="ar-modal-close" onClick={() => setDetailModal({ open: false, req: null })}>✕</button>
            </div>
            <div className="ar-modal-body">
              {/* Request Info */}
              <div className="ar-msection-label">🔖 Request Information</div>
              <div className="ar-mfield">
                <label>Request No</label>
                <div className="ar-mval">{detailModal.req.requestNo}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="ar-mfield">
                  <label>Amount</label>
                  <div className="ar-mval" style={{ color: "#0A6E5A", fontSize: 16 }}>{formatAmount(detailModal.req.amount)}</div>
                </div>
                <div className="ar-mfield">
                  <label>Status</label>
                  <div className="ar-mval">
                    <span className="ar-badge" style={{ background: getStatusConfig(detailModal.req.status).bg, color: getStatusConfig(detailModal.req.status).color }}>
                      <span className="ar-badge-dot" style={{ background: getStatusConfig(detailModal.req.status).dot }} />
                      {detailModal.req.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="ar-mfield">
                <label>Request Date</label>
                <div className="ar-mval">{formatDate(detailModal.req.requestDate)}</div>
              </div>
              {detailModal.req.processedDate && (
                <div className="ar-mfield">
                  <label>Processed Date</label>
                  <div className="ar-mval">{formatDate(detailModal.req.processedDate)}</div>
                </div>
              )}

              <div className="ar-mdivider" />

              {/* User Info */}
              <div className="ar-msection-label">👤 User Information</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="ar-mfield">
                  <label>User ID</label>
                  <div className="ar-mval">{detailModal.req.userId}</div>
                </div>
                <div className="ar-mfield">
                  <label>Mobile</label>
                  <div className="ar-mval">{detailModal.req.mobileNo || "—"}</div>
                </div>
              </div>
              <div className="ar-mfield">
                <label>Full Name</label>
                <div className="ar-mval">{detailModal.req.userFullName || detailModal.req.userName}</div>
              </div>

              <div className="ar-mdivider" />

              {/* Bank Info */}
              <div className="ar-msection-label"><IconBank /> Bank Details</div>
              <div className="ar-bank-grid">
                <div className="ar-mfield">
                  <label>Account Holder</label>
                  <div className="ar-mval">{detailModal.req.bankDetails.accountHolderName || "—"}</div>
                </div>
                <div className="ar-mfield">
                  <label>Account Number</label>
                  <div className="ar-mval">{detailModal.req.bankDetails.accountNumber || "—"}</div>
                </div>
                <div className="ar-mfield">
                  <label>IFSC Code</label>
                  <div className="ar-mval">{detailModal.req.bankDetails.ifscCode || "—"}</div>
                </div>
                <div className="ar-mfield">
                  <label>Bank Name</label>
                  <div className="ar-mval">{detailModal.req.bankDetails.bankName || "—"}</div>
                </div>
              </div>

              {(detailModal.req.utrNumber || detailModal.req.adminRemark) && (
                <>
                  <div className="ar-mdivider" />
                  <div className="ar-msection-label">✅ Processing Details</div>
                  {detailModal.req.utrNumber && (
                    <div className="ar-mfield">
                      <label>UTR Number</label>
                      <div className="ar-mval">{detailModal.req.utrNumber}</div>
                    </div>
                  )}
                  {detailModal.req.paymentMode && (
                    <div className="ar-mfield">
                      <label>Payment Mode</label>
                      <div className="ar-mval">{detailModal.req.paymentMode}</div>
                    </div>
                  )}
                  {detailModal.req.adminRemark && (
                    <div className="ar-mfield">
                      <label>Admin Remark</label>
                      <div className="ar-mval">{detailModal.req.adminRemark}</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="ar-modal-footer">
              {detailModal.req.status === "Pending" && (
                <>
                  <button className="ar-mbtn-approve" onClick={() => { setDetailModal({ open: false, req: null }); openAction(detailModal.req!, "Approved"); }}>
                    <IconCheck /> Approve
                  </button>
                  <button className="ar-mbtn-reject" onClick={() => { setDetailModal({ open: false, req: null }); openAction(detailModal.req!, "Rejected"); }}>
                    <IconX /> Reject
                  </button>
                </>
              )}
              <button className="ar-mbtn-cancel" onClick={() => setDetailModal({ open: false, req: null })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ACTION MODAL (Approve / Reject)
      ══════════════════════════════════════════════════════════ */}
      {actionModal.open && actionModal.request && (
        <div className="ar-modal-overlay" onClick={() => !actionModal.loading && setActionModal(p => ({ ...p, open: false }))}>
          <div className="ar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ar-modal-head">
              <div className="ar-modal-title" style={{ color: actionModal.action === "Approved" ? "#0A6E5A" : "#D32F2F" }}>
                {actionModal.action === "Approved" ? "✅ Approve Request" : "❌ Reject Request"}
              </div>
              <button className="ar-modal-close" onClick={() => !actionModal.loading && setActionModal(p => ({ ...p, open: false }))}>✕</button>
            </div>
            <div className="ar-modal-body">
              {/* Quick Summary */}
              <div style={{ background: "#f5f5f7", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Request No</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0A6E5A" }}>{actionModal.request.requestNo}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>User</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{actionModal.request.userFullName || actionModal.request.userName} ({actionModal.request.userId})</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Amount</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#0A6E5A" }}>{formatAmount(actionModal.request.amount)}</span>
                </div>
              </div>

              {actionModal.action === "Approved" && (
                <>
                  <div className="ar-mfield">
                    <label>UTR / Transaction Number <span style={{ color: "#D32F2F" }}>*</span></label>
                    <input
                      type="text"
                      placeholder="Enter UTR or Transaction ID"
                      value={actionModal.utrNumber}
                      onChange={(e) => setActionModal(p => ({ ...p, utrNumber: e.target.value, error: "" }))}
                    />
                  </div>
                  <div className="ar-mfield">
                    <label>Payment Mode</label>
                    <select
                      value={actionModal.paymentMode}
                      onChange={(e) => setActionModal(p => ({ ...p, paymentMode: e.target.value }))}
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

              <div className="ar-mfield">
                <label>Admin Remark {actionModal.action === "Rejected" && <span style={{ color: "#D32F2F" }}>*</span>}</label>
                <textarea
                  placeholder={actionModal.action === "Approved" ? "Optional note..." : "Reason for rejection..."}
                  value={actionModal.adminRemark}
                  onChange={(e) => setActionModal(p => ({ ...p, adminRemark: e.target.value, error: "" }))}
                />
              </div>

              {actionModal.error   && <div className="ar-merror">⚠️ {actionModal.error}</div>}
              {actionModal.success && <div className="ar-msuccess">✅ {actionModal.success}</div>}
            </div>
            <div className="ar-modal-footer">
              <button className="ar-mbtn-cancel" onClick={() => !actionModal.loading && setActionModal(p => ({ ...p, open: false }))} disabled={actionModal.loading}>
                Cancel
              </button>
              {actionModal.action === "Approved" ? (
                <button className="ar-mbtn-approve" onClick={handleAction} disabled={actionModal.loading}>
                  {actionModal.loading ? "Processing..." : <><IconCheck /> Confirm Approval</>}
                </button>
              ) : (
                <button className="ar-mbtn-reject" onClick={handleAction} disabled={actionModal.loading}>
                  {actionModal.loading ? "Processing..." : <><IconX /> Confirm Rejection</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}