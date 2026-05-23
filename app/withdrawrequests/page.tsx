"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── TYPES ──
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
const formatAmount = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

const STATUS_CONFIG = {
  Pending: { bg: "#fff3e0", color: "#e65100", dot: "#ff9800", label: "Pending" },
  Approved: { bg: "#e8f5e9", color: "#1b5e20", dot: "#43a047", label: "Approved" },
  Rejected: { bg: "#fce4ec", color: "#880e4f", dot: "#e53935", label: "Rejected" },
};

// ── ICONS ──
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconFilter = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IconRefresh = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IconBank = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.5 1L2 6v2h19V6L11.5 1zM4 9v9H2v2h19v-2h-2V9h-3v9h-3V9H9v9H6V9H4zM2 20h19v2H2v-2z" />
  </svg>
);
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconEye = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

// ── MAIN COMPONENT ──
export default function AdminWithdrawRequests() {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [summary, setSummary] = useState<Summary>({
    Pending: { count: 0, amount: 0 },
    Approved: { count: 0, amount: 0 },
    Rejected: { count: 0, amount: 0 },
    Total: { count: 0, amount: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
          status: actionModal.action,
          utrNumber: actionModal.utrNumber,
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        .ar-root { font-family: 'Poppins', sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; flex-direction: column; }

        /* ── HEADER ── */
        .ar-header {
          background: linear-gradient(90deg, #1a237e 0%, #283593 60%, #1565c0 100%);
          padding: 0 24px; height: 60px; display: flex; align-items: center;
          justify-content: space-between; position: sticky; top: 0; z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.25);
        }
        .ar-header-left { display: flex; align-items: center; gap: 14px; }
        .ar-logo { font-size: 18px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
        .ar-logo span { color: #1de9b6; }
        .ar-nav-badge {
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; border-radius: 6px; padding: 4px 12px; font-size: 12px; font-weight: 600;
        }
        .ar-header-right { display: flex; align-items: center; gap: 10px; }
        .ar-back-btn {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
          color: #fff; border-radius: 6px; padding: 6px 14px; font-size: 12.5px; font-weight: 500;
          font-family: 'Poppins', sans-serif; cursor: pointer; text-decoration: none;
          transition: background 0.2s;
        }
        .ar-back-btn:hover { background: rgba(255,255,255,0.2); }
        .green-bar { height: 6px; background: linear-gradient(90deg, #00c853, #1de9b6); }

        /* ── MAIN CONTENT ── */
        .ar-content { flex: 1; padding: 20px; max-width: 1400px; margin: 0 auto; width: 100%; }

        /* ── PAGE TITLE ── */
        .ar-page-title { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
        .ar-title-text h1 { font-size: 20px; font-weight: 700; color: #1a237e; }
        .ar-title-text p  { font-size: 12.5px; color: #666; margin-top: 2px; }
        .ar-refresh-btn {
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #26a69a, #1de9b6);
          color: #fff; border: none; border-radius: 8px;
          padding: 9px 18px; font-size: 13px; font-weight: 600;
          font-family: 'Poppins', sans-serif; cursor: pointer;
          transition: opacity 0.2s, transform 0.15s; box-shadow: 0 2px 8px rgba(38,166,154,0.3);
        }
        .ar-refresh-btn:hover { opacity: 0.88; transform: translateY(-1px); }

        /* ── SUMMARY CARDS ── */
        .ar-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
        @media (max-width: 900px)  { .ar-summary { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px)  { .ar-summary { grid-template-columns: 1fr 1fr; } }

        .ar-sum-card {
          border-radius: 10px; padding: 18px 16px;
          display: flex; flex-direction: column; gap: 6px;
          position: relative; overflow: hidden; cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        }
        .ar-sum-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.14); }
        .ar-sum-card::after { content: ''; position: absolute; right: -16px; bottom: -16px; width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,0.1); }
        .ar-sum-label { font-size: 11.5px; font-weight: 600; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 0.5px; }
        .ar-sum-count { font-size: 26px; font-weight: 800; color: #fff; line-height: 1; }
        .ar-sum-amount { font-size: 12px; color: rgba(255,255,255,0.8); font-weight: 500; }

        /* ── FILTERS ── */
        .ar-filters {
          background: #fff; border-radius: 10px; padding: 16px 18px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin-bottom: 18px;
          display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;
        }
        .ar-filter-group { display: flex; flex-direction: column; gap: 5px; }
        .ar-filter-label { font-size: 11px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.4px; }
        .ar-filter-select, .ar-filter-input, .ar-filter-date {
          height: 38px; border: 1.5px solid #e0e0e0; border-radius: 7px;
          padding: 0 12px; font-size: 13px; font-family: 'Poppins', sans-serif;
          color: #333; background: #fafafa; outline: none;
          transition: border-color 0.2s;
        }
        .ar-filter-select:focus, .ar-filter-input:focus, .ar-filter-date:focus { border-color: #26a69a; background: #fff; }
        .ar-filter-select { min-width: 130px; cursor: pointer; }
        .ar-filter-input  { min-width: 200px; }
        .ar-filter-date   { min-width: 140px; }
        .ar-search-wrap { position: relative; }
        .ar-search-wrap .ar-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #999; }
        .ar-search-wrap .ar-filter-input { padding-left: 34px; }
        .ar-filter-btn {
          height: 38px; border: none; border-radius: 7px;
          padding: 0 18px; font-size: 13px; font-weight: 600;
          font-family: 'Poppins', sans-serif; cursor: pointer;
          background: linear-gradient(135deg, #1a237e, #283593); color: #fff;
          display: flex; align-items: center; gap: 6px;
          transition: opacity 0.2s;
        }
        .ar-filter-btn:hover { opacity: 0.88; }
        .ar-filter-clear {
          height: 38px; border: 1.5px solid #e0e0e0; border-radius: 7px;
          padding: 0 14px; font-size: 12.5px; font-weight: 600;
          font-family: 'Poppins', sans-serif; cursor: pointer;
          background: #fff; color: #666;
          transition: border-color 0.2s;
        }
        .ar-filter-clear:hover { border-color: #e53935; color: #e53935; }

        /* ── STATUS TABS ── */
        .ar-tabs { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
        .ar-tab {
          padding: 7px 18px; border-radius: 20px; font-size: 12.5px; font-weight: 600;
          border: 1.5px solid transparent; cursor: pointer; transition: all 0.18s;
          font-family: 'Poppins', sans-serif;
        }
        .ar-tab.active-all      { background: #1a237e; color: #fff; }
        .ar-tab.active-Pending  { background: #fff3e0; color: #e65100; border-color: #ff9800; }
        .ar-tab.active-Approved { background: #e8f5e9; color: #1b5e20; border-color: #43a047; }
        .ar-tab.active-Rejected { background: #fce4ec; color: #880e4f; border-color: #e53935; }
        .ar-tab:not(.active-all):not(.active-Pending):not(.active-Approved):not(.active-Rejected) {
          background: #fff; color: #555; border-color: #e0e0e0;
        }
        .ar-tab:hover:not(.active-all):not(.active-Pending):not(.active-Approved):not(.active-Rejected) {
          background: #f5f5f5;
        }

        /* ── TABLE CARD ── */
        .ar-table-card { background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); overflow: hidden; }
        .ar-table-head {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 10px 18px; display: flex; align-items: center; justify-content: space-between;
        }
        .ar-table-head-title { font-size: 13px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
        .ar-table-head-count { font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 500; }

        /* ── TABLE (desktop) ── */
        .ar-table-wrap { overflow-x: auto; }
        .ar-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 860px; }
        .ar-table thead tr { background: #546e7a; }
        .ar-table thead th { padding: 11px 14px; text-align: left; color: #fff; font-weight: 600; font-size: 12.5px; white-space: nowrap; }
        .ar-table tbody tr { border-bottom: 1px solid #f0f0f0; transition: background 0.15s; }
        .ar-table tbody tr:nth-child(odd)  { background: #fafafa; }
        .ar-table tbody tr:nth-child(even) { background: #f5f9f9; }
        .ar-table tbody tr:hover { background: #e8f5e9; }
        .ar-table tbody td { padding: 11px 14px; color: #333; vertical-align: middle; white-space: nowrap; }
        .ar-table tbody td.wrap { white-space: normal; }

        /* Status badge */
        .ar-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 700;
        }
        .ar-badge-dot { width: 6px; height: 6px; border-radius: 50%; }

        /* Action buttons */
        .ar-action-row { display: flex; gap: 6px; align-items: center; }
        .ar-btn-approve, .ar-btn-reject, .ar-btn-view {
          display: inline-flex; align-items: center; gap: 4px;
          border: none; border-radius: 6px; padding: 5px 10px;
          font-size: 11.5px; font-weight: 700; font-family: 'Poppins', sans-serif;
          cursor: pointer; transition: opacity 0.18s, transform 0.15s;
          white-space: nowrap;
        }
        .ar-btn-approve { background: #e8f5e9; color: #1b5e20; }
        .ar-btn-approve:hover { background: #c8e6c9; transform: translateY(-1px); }
        .ar-btn-reject  { background: #fce4ec; color: #880e4f; }
        .ar-btn-reject:hover  { background: #f8bbd0; transform: translateY(-1px); }
        .ar-btn-view    { background: #e3f2fd; color: #1565c0; }
        .ar-btn-view:hover    { background: #bbdefb; transform: translateY(-1px); }

        /* ── MOBILE CARDS ── */
        .ar-mobile-cards { display: none; }
        @media (max-width: 700px) {
          .ar-table-wrap { display: none; }
          .ar-mobile-cards { display: block; }
        }
        .ar-mobile-card {
          border-radius: 10px; margin: 0 0 12px;
          overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.08);
          background: #fff; border: 1px solid #eee;
        }
        .ar-mc-header {
          padding: 10px 14px; display: flex; align-items: center;
          justify-content: space-between; flex-wrap: wrap; gap: 6px;
          background: linear-gradient(90deg, #f8f9fa, #fff);
          border-bottom: 1px solid #eee;
        }
        .ar-mc-reqno  { font-size: 12px; font-weight: 700; color: #1a237e; }
        .ar-mc-body   { padding: 12px 14px; display: flex; flex-direction: column; gap: 7px; }
        .ar-mc-row    { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .ar-mc-key    { font-size: 11.5px; color: #888; font-weight: 600; min-width: 100px; }
        .ar-mc-val    { font-size: 12.5px; color: #333; font-weight: 500; text-align: right; word-break: break-word; }
        .ar-mc-amount { font-size: 16px; font-weight: 800; color: #1a237e; }
        .ar-mc-footer { padding: 10px 14px; display: flex; gap: 7px; border-top: 1px solid #eee; flex-wrap: wrap; }

        /* ── EMPTY STATE ── */
        .ar-empty { padding: 50px 20px; text-align: center; }
        .ar-empty-icon { font-size: 48px; margin-bottom: 14px; }
        .ar-empty h3 { font-size: 15px; font-weight: 600; color: #555; margin-bottom: 6px; }
        .ar-empty p  { font-size: 13px; color: #999; }

        /* ── LOADING ── */
        .ar-loading { padding: 50px 20px; text-align: center; color: #999; font-size: 13.5px; }
        .ar-spinner {
          width: 34px; height: 34px; border: 3px solid #e0e0e0;
          border-top-color: #26a69a; border-radius: 50%;
          animation: spin 0.8s linear infinite; margin: 0 auto 14px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── PAGINATION ── */
        .ar-pagination { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-top: 1px solid #f0f0f0; flex-wrap: wrap; gap: 10px; }
        .ar-pag-info  { font-size: 12.5px; color: #666; }
        .ar-pag-btns  { display: flex; gap: 6px; }
        .ar-pag-btn {
          width: 34px; height: 34px; border-radius: 7px; border: 1.5px solid #e0e0e0;
          background: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Poppins', sans-serif; color: #333; transition: all 0.18s;
        }
        .ar-pag-btn:hover:not(:disabled)  { border-color: #26a69a; color: #26a69a; }
        .ar-pag-btn.ar-pag-active { background: #1a237e; border-color: #1a237e; color: #fff; }
        .ar-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── MODAL OVERLAY ── */
        .ar-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          display: flex; align-items: center; justify-content: center;
          z-index: 999; padding: 16px; animation: fadeIn 0.2s;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .ar-modal {
          background: #fff; border-radius: 14px; width: 100%; max-width: 520px;
          max-height: 92vh; overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          animation: slideUp 0.22s;
        }
        @keyframes slideUp { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        .ar-modal-head {
          padding: 20px 22px 16px; border-bottom: 1px solid #eee;
          display: flex; align-items: center; justify-content: space-between;
        }
        .ar-modal-title { font-size: 17px; font-weight: 800; color: #1a237e; }
        .ar-modal-close {
          width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #e0e0e0;
          background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 16px; color: #666; transition: all 0.18s; font-family: 'Poppins', sans-serif;
        }
        .ar-modal-close:hover { border-color: #e53935; color: #e53935; }
        .ar-modal-body { padding: 18px 22px; }
        .ar-modal-footer { padding: 14px 22px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

        /* Modal fields */
        .ar-mfield { margin-bottom: 14px; }
        .ar-mfield label { display: block; font-size: 11.5px; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 5px; }
        .ar-mfield .ar-mval { background: #f5f5f7; border-radius: 7px; padding: 9px 12px; font-size: 13.5px; color: #1a1a2e; font-weight: 600; border-left: 3px solid #26a69a; }
        .ar-mfield input, .ar-mfield select, .ar-mfield textarea {
          width: 100%; border: 1.5px solid #e0e0e0; border-radius: 7px;
          padding: 9px 12px; font-size: 13.5px; font-family: 'Poppins', sans-serif;
          color: #333; background: #fafafa; outline: none; transition: border-color 0.2s;
        }
        .ar-mfield input:focus, .ar-mfield select:focus, .ar-mfield textarea:focus { border-color: #26a69a; background: #fff; }
        .ar-mfield textarea { resize: vertical; min-height: 70px; }
        .ar-mdivider { height: 1px; background: linear-gradient(90deg, transparent, #e0e0e0, transparent); margin: 14px 0; }
        .ar-msection-label { font-size: 11px; font-weight: 700; color: #26a69a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
        .ar-merror   { color: #e53935; font-size: 12.5px; font-weight: 600; margin-top: 10px; display: flex; align-items: center; gap: 6px; }
        .ar-msuccess { color: #2e7d32; font-size: 12.5px; font-weight: 600; margin-top: 10px; display: flex; align-items: center; gap: 6px; }

        /* Modal buttons */
        .ar-mbtn-approve {
          padding: 10px 24px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #43a047, #2e7d32);
          color: #fff; font-size: 13.5px; font-weight: 700; font-family: 'Poppins', sans-serif;
          cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; gap: 7px;
          box-shadow: 0 3px 10px rgba(67,160,71,0.3);
        }
        .ar-mbtn-reject {
          padding: 10px 24px; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #e53935, #c62828);
          color: #fff; font-size: 13.5px; font-weight: 700; font-family: 'Poppins', sans-serif;
          cursor: pointer; transition: opacity 0.2s; display: flex; align-items: center; gap: 7px;
          box-shadow: 0 3px 10px rgba(229,57,53,0.3);
        }
        .ar-mbtn-cancel {
          padding: 10px 20px; border-radius: 8px;
          border: 1.5px solid #e0e0e0; background: #fff;
          color: #555; font-size: 13.5px; font-weight: 600; font-family: 'Poppins', sans-serif;
          cursor: pointer; transition: border-color 0.2s;
        }
        .ar-mbtn-cancel:hover { border-color: #999; }
        .ar-mbtn-approve:hover, .ar-mbtn-reject:hover { opacity: 0.88; }
        .ar-mbtn-approve:disabled, .ar-mbtn-reject:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Bank info grid */
        .ar-bank-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 420px) { .ar-bank-grid { grid-template-columns: 1fr; } }

        /* ── FOOTER ── */
        .ar-footer {
          background: linear-gradient(90deg, #1a237e, #283593);
          color: rgba(255,255,255,0.7); font-size: 12px;
          text-align: center; padding: 14px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px;
        }
        .ar-footer span { color: #1de9b6; font-weight: 600; }

        @media (max-width: 600px) {
          .ar-content { padding: 14px; }
          .ar-filters  { flex-direction: column; }
          .ar-filter-input, .ar-filter-select, .ar-filter-date { min-width: 100%; width: 100%; }
          .ar-page-title { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div className="ar-root">
        {/* ── HEADER ── */}
        <header className="ar-header">
          <div className="ar-header-left">
            <div className="ar-logo">Change<span>Life</span> Admin</div>
            <div className="ar-nav-badge">Withdraw Manager</div>
          </div>
          <div className="ar-header-right">
            <Link href="/clm-portal/dashboard" className="ar-back-btn">
              ← Dashboard
            </Link>
          </div>
        </header>
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
              { label: "Total Requests", count: summary.Total.count, amount: summary.Total.amount, grad: "linear-gradient(135deg, #1a237e 0%, #283593 100%)" },
              { label: "Pending", count: summary.Pending.count, amount: summary.Pending.amount, grad: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)" },
              { label: "Approved", count: summary.Approved.count, amount: summary.Approved.amount, grad: "linear-gradient(135deg, #43a047 0%, #2e7d32 100%)" },
              { label: "Rejected", count: summary.Rejected.count, amount: summary.Rejected.amount, grad: "linear-gradient(135deg, #e53935 0%, #c62828 100%)" },
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
                        const sc = STATUS_CONFIG[req.status];
                        return (
                          <tr key={req._id}>
                            <td style={{ color: "#888", fontWeight: 600 }}>{(page - 1) * 15 + idx + 1}</td>
                            <td style={{ fontWeight: 700, color: "#1a237e", fontSize: 12 }}>{req.requestNo}</td>
                            <td style={{ fontWeight: 600 }}>{req.userId}</td>
                            <td>{req.userFullName || req.userName}</td>
                            <td>{req.mobileNo || "—"}</td>
                            <td style={{ fontWeight: 800, color: "#1a237e" }}>{formatAmount(req.amount)}</td>
                            <td style={{ fontSize: 11.5, color: "#555" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <IconBank />
                                {req.bankDetails.bankName || "—"}
                              </div>
                              <div style={{ fontSize: 11, color: "#999" }}>
                                ••••{req.bankDetails.accountNumber?.slice(-4) || ""}
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
                    const sc = STATUS_CONFIG[req.status];
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
                            <span className="ar-mc-val">{req.bankDetails.bankName} ••••{req.bankDetails.accountNumber?.slice(-4)}</span>
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
        <footer className="ar-footer">
          <div>© 2024 <span>ChangeLife Marketing</span> — Admin Panel</div>
          <div>Withdraw Management System</div>
        </footer>
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
                  <div className="ar-mval" style={{ color: "#1a237e", fontSize: 16 }}>{formatAmount(detailModal.req.amount)}</div>
                </div>
                <div className="ar-mfield">
                  <label>Status</label>
                  <div className="ar-mval">
                    <span className="ar-badge" style={{ background: STATUS_CONFIG[detailModal.req.status].bg, color: STATUS_CONFIG[detailModal.req.status].color }}>
                      <span className="ar-badge-dot" style={{ background: STATUS_CONFIG[detailModal.req.status].dot }} />
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
              <div className="ar-modal-title" style={{ color: actionModal.action === "Approved" ? "#2e7d32" : "#c62828" }}>
                {actionModal.action === "Approved" ? "✅ Approve Request" : "❌ Reject Request"}
              </div>
              <button className="ar-modal-close" onClick={() => !actionModal.loading && setActionModal(p => ({ ...p, open: false }))}>✕</button>
            </div>
            <div className="ar-modal-body">
              {/* Quick Summary */}
              <div style={{ background: "#f5f5f7", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Request No</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#1a237e" }}>{actionModal.request.requestNo}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>User</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{actionModal.request.userFullName || actionModal.request.userName} ({actionModal.request.userId})</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Amount</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#1a237e" }}>{formatAmount(actionModal.request.amount)}</span>
                </div>
              </div>

              {actionModal.action === "Approved" && (
                <>
                  <div className="ar-mfield">
                    <label>UTR / Transaction Number <span style={{ color: "#e53935" }}>*</span></label>
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
                <label>Admin Remark {actionModal.action === "Rejected" && <span style={{ color: "#e53935" }}>*</span>}</label>
                <textarea
                  placeholder={actionModal.action === "Approved" ? "Optional note..." : "Reason for rejection..."}
                  value={actionModal.adminRemark}
                  onChange={(e) => setActionModal(p => ({ ...p, adminRemark: e.target.value, error: "" }))}
                />
              </div>

              {actionModal.error && <div className="ar-merror">⚠️ {actionModal.error}</div>}
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