"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface WithdrawRequest {
  requestNo: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected";
  requestDate: string;
  processedDate?: string;
  adminRemark?: string;
  utrNumber?: string;
  paymentMode?: string;
}

export default function WithdrawalsHistoryPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [datePreset, setDatePreset] = useState<"All" | "Daily" | "Weekly" | "Monthly">("All");

  // Date Presets Calculation
  const getPresets = () => {
    const now = new Date();
    
    // Daily (Today)
    const today = new Date(now);
    const todayStr = today.toDateString();
    
    // Weekly (Mon-Sun)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Monthly (1st to last of current month)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const fmtFull = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return {
      today: {
        label: `Daily (${fmtFull(now)})`,
        date: todayStr
      },
      week: {
        label: `Weekly (${fmt(startOfWeek)} – ${fmt(endOfWeek)})`,
        start: startOfWeek,
        end: endOfWeek
      },
      month: {
        label: `Monthly (${fmt(startOfMonth)} – ${fmt(endOfMonth)})`,
        start: startOfMonth,
        end: endOfMonth
      }
    };
  };

  const presets = getPresets();
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/withdraw");
        if (!response.ok) {
          throw new Error("Failed to fetch withdrawal requests");
        }
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Sort requests: newest first
          const sorted = [...result.data].sort(
            (a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
          );
          setRequests(sorted);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Filter by date presets first for summaries and main list
  const dateFilteredRequests = requests.filter((r) => {
    if (datePreset === "All") return true;
    
    const reqDate = new Date(r.requestDate);
    
    if (datePreset === "Daily") {
      return reqDate.toDateString() === presets.today.date;
    }
    
    if (datePreset === "Weekly") {
      const start = new Date(presets.week.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(presets.week.end);
      end.setHours(23, 59, 59, 999);
      return reqDate >= start && reqDate <= end;
    }
    
    if (datePreset === "Monthly") {
      const start = new Date(presets.month.start);
      start.setHours(0, 0, 0, 0);
      const end = new Date(presets.month.end);
      end.setHours(23, 59, 59, 999);
      return reqDate >= start && reqDate <= end;
    }
    
    return true;
  });

  const filteredRequests = dateFilteredRequests.filter((r) => {
    if (filterStatus === "All") return true;
    return r.status === filterStatus;
  });

  // Calculate summaries based on current date selection
  const totalRequested = dateFilteredRequests.reduce((acc, r) => acc + r.amount, 0);
  const totalApproved = dateFilteredRequests
    .filter((r) => r.status === "Approved")
    .reduce((acc, r) => acc + r.amount, 0);
  const totalPending = dateFilteredRequests
    .filter((r) => r.status === "Pending")
    .reduce((acc, r) => acc + r.amount, 0);
  const totalRejected = dateFilteredRequests
    .filter((r) => r.status === "Rejected")
    .reduce((acc, r) => acc + r.amount, 0);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .pp-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,215,0,0.12) 0%, transparent 65%);
          min-height: 100vh;
          color: #fff;
        }

        /* GOLD BAR */
        .gold-bar { height:4px; background:linear-gradient(90deg, #FFD700, #f0a500); }

        /* BREADCRUMB */
        .breadcrumb { padding:12px 20px; font-size:13px; color:rgba(255,215,0,0.7); display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:rgba(255,215,0,0.7); text-decoration:none; }
        .breadcrumb a:hover { color:#FFD700; text-decoration:underline; }
        .breadcrumb .sep { color:rgba(255,215,0,0.4); }
        .breadcrumb .current { color:#FFD700; font-weight:700; }

        /* PAGE BODY */
        .page-body { padding:0 10px 40px; }
        @media(min-width:768px) { .page-body { padding:0 20px 40px; } }

        /* SUMMARY CARDS */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        @media(min-width:768px) {
          .summary-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }
        .summary-card {
          background: linear-gradient(135deg, #250845 0%, #17022e 100%);
          border: 1px solid rgba(255,215,0,0.18);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .summary-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255,215,0,0.7);
          margin-bottom: 6px;
        }
        .summary-val {
          font-size: 18px;
          font-weight: 800;
          color: #fff;
        }
        .val-gold { color: #FFD700; text-shadow: 0 0 8px rgba(255,215,0,0.25); }
        .val-emerald { color: #00ff88; text-shadow: 0 0 8px rgba(0,255,136,0.25); }
        .val-amber { color: #f59e0b; text-shadow: 0 0 8px rgba(245,158,11,0.25); }
        .val-rose { color: #ff5555; text-shadow: 0 0 8px rgba(255,85,85,0.25); }

        /* MAIN CARD */
        .main-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        /* HEADER */
        .section-header {
          background: linear-gradient(90deg, #1d033a, #110122);
          border-bottom: 1.5px solid rgba(255,215,0,0.22);
          padding:16px 20px;
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .section-title { font-size:14px; font-weight:800; color:#FFD700; letter-spacing:0.8px; text-transform:uppercase; text-shadow: 0 0 8px rgba(255,215,0,0.3); }
        
        /* FILTERS */
        .tabs-row {
          display: flex;
          background: rgba(0,0,0,0.25);
          border: 1px solid rgba(255,215,0,0.2);
          border-radius: 20px;
          padding: 3px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: rgba(255,215,0,0.6);
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-radius: 17px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: #FFD700;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #FFD700 0%, #f0a500 100%);
          color: #120228;
          box-shadow: 0 2px 8px rgba(255,215,0,0.25);
        }

        /* STATUS BADGE */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid transparent;
        }
        .status-pending {
          background: rgba(245,158,11,0.15);
          border-color: rgba(245,158,11,0.3);
          color: #f59e0b;
        }
        .status-approved {
          background: rgba(0,255,136,0.12);
          border-color: rgba(0,255,136,0.3);
          color: #00ff88;
        }
        .status-rejected {
          background: rgba(255,85,85,0.12);
          border-color: rgba(255,85,85,0.3);
          color: #ff5555;
        }

        /* TABLE */
        .table-wrap { overflow-x:auto; -webkit-overflow-scrolling: touch; }
        .data-table { width:100%; border-collapse:collapse; font-size:12px; min-width:900px; }
        @media(min-width:768px) { .data-table { font-size:13px; } }
        .data-table thead tr { background: rgba(0, 0, 0, 0.35); border-bottom: 2px solid rgba(255,215,0,0.22); }
        .data-table thead th {
          padding:14px 16px; text-align:left;
          color:#FFD700; font-weight:700; font-size:13px;
          white-space:nowrap; text-transform:uppercase; letter-spacing:0.8px;
        }
        .data-table tbody tr:nth-child(odd)  { background: rgba(29, 3, 58, 0.35); }
        .data-table tbody tr:nth-child(even) { background: rgba(17, 1, 34, 0.35); }
        .data-table tbody tr:hover { background: rgba(255,215,0,0.06); transition:background .15s; }
        .data-table tbody td {
          padding:13px 16px; color:#ffffff;
          border-bottom:1px solid rgba(255,215,0,0.12); font-size:13px; white-space:nowrap;
          vertical-align:middle;
        }

        .amt-text { font-weight: 800; color: #FFD700; font-size: 14px; }
        .utr-text { font-family: monospace; color: #a855f7; font-weight: 600; letter-spacing: 0.5px; }
        .remark-text { white-space: normal; max-width: 250px; color: rgba(255,255,255,0.7); font-size: 12.5px; line-height: 1.4; }

        /* Skeleton Loader */
        @keyframes skeletonShimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-row {
          background: linear-gradient(90deg, rgba(29,3,58,0.5) 25%, rgba(168,85,247,0.2) 50%, rgba(29,3,58,0.5) 75%);
          background-size: 1000px 100%;
          animation: skeletonShimmer 2s infinite;
        }
        .skeleton-row td { padding: 13px 16px; }
        .skeleton-cell { height: 20px; background: rgba(255,215,0,0.1); border-radius: 4px; }

        /* Error state */
        .error-container {
          padding: 20px;
          text-align: center;
          color: #ff8888;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(239, 68, 68, 0.12);
          border-bottom: 1.5px solid rgba(239, 68, 68, 0.35);
        }
        .error-container svg { width: 20px; height: 20px; }
      `}</style>

      <div className="pp-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* NAVBAR COMPONENT */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* Gold bar */}
        <div className="gold-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span>Daily Payout</span>
          <span className="sep">/</span>
          <span className="current">Withdrawal History</span>
        </div>

        <div className="page-body">
          {/* SUMMARY GRID */}
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-label">Total Requested</div>
              <div className="summary-val val-gold">₹{totalRequested.toLocaleString("en-IN")}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Approved & Transferred</div>
              <div className="summary-val val-emerald">₹{totalApproved.toLocaleString("en-IN")}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Pending Approval</div>
              <div className="summary-val val-amber">₹{totalPending.toLocaleString("en-IN")}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Rejected</div>
              <div className="summary-val val-rose">₹{totalRejected.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Withdrawal Requests</span>
              <div className="tabs-row">
                {(["All", "Pending", "Approved", "Rejected"] as const).map((status) => (
                  <button
                    key={status}
                    className={`tab-btn ${filterStatus === status ? "active" : ""}`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Filters Presets */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", padding: "16px 20px 8px", borderBottom: "1px solid rgba(255,215,0,0.12)" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,215,0,0.5)", marginRight: "8px" }}>Filter By Period:</span>
              {([
                { id: "All", label: "All Time" },
                { id: "Daily", label: presets.today.label },
                { id: "Weekly", label: presets.week.label },
                { id: "Monthly", label: presets.month.label },
              ] as const).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setDatePreset(p.id)}
                  style={{
                    background: datePreset === p.id ? "linear-gradient(135deg, #FFD700 0%, #f0a500 100%)" : "rgba(0,0,0,0.25)",
                    border: "1px solid " + (datePreset === p.id ? "#FFD700" : "rgba(255,215,0,0.2)"),
                    color: datePreset === p.id ? "#120228" : "rgba(255,215,0,0.7)",
                    padding: "6px 12px",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "14px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                    boxShadow: datePreset === p.id ? "0 2px 8px rgba(255,215,0,0.25)" : "none",
                  }}
                  suppressHydrationWarning={true}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* ERROR STATE */}
            {error && !loading && (
              <div className="error-container">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                <span>{error}</span>
              </div>
            )}

            {/* TABLE */}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Request No</th>
                    <th>Requested Amt</th>
                    <th>Requested Date</th>
                    <th>Status</th>
                    <th>Txn Mode</th>
                    <th>UTR / Txn ID</th>
                    <th>Processed Date</th>
                    <th>Admin Remarks / Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <tr key={`skeleton-${i}`} className="skeleton-row">
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                        </tr>
                      ))}
                    </>
                  ) : filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", padding: "45px", color: "rgba(255,215,0,0.5)" }}>
                        No withdrawal requests found in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((row) => (
                      <tr key={row.requestNo}>
                        <td style={{ fontWeight: 700, color: "#fff" }}>{row.requestNo}</td>
                        <td><span className="amt-text">₹{row.amount.toLocaleString("en-IN")}</span></td>
                        <td>{formatDate(row.requestDate)}</td>
                        <td>
                          <span className={`status-badge ${
                            row.status === "Approved" 
                              ? "status-approved" 
                              : row.status === "Rejected" 
                              ? "status-rejected" 
                              : "status-pending"
                          }`}>
                            {row.status === "Approved" ? "✔ Transferred" : row.status === "Rejected" ? "✘ Rejected" : "⏳ Pending"}
                          </span>
                        </td>
                        <td>{row.paymentMode || "—"}</td>
                        <td>
                          {row.utrNumber ? (
                            <span className="utr-text">{row.utrNumber}</span>
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>—</span>
                          )}
                        </td>
                        <td>{formatDate(row.processedDate)}</td>
                        <td>
                          <div className="remark-text">
                            {row.adminRemark ? (
                              row.status === "Rejected" ? (
                                <span style={{ color: "#ff8888" }}>{row.adminRemark}</span>
                              ) : (
                                <span>{row.adminRemark}</span>
                              )
                            ) : (
                              <span style={{ color: "rgba(255,255,255,0.4)" }}>—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
