"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const statuses  = ["--All--", "Paid", "Pending", "Hold"];
const pageSizes = [10, 20, 50, 100];

interface IncomeRow {
  srNo: number;
  amount: string;
  rawAmount: number;
  pairCount: number;
  date: string;
  description: string;
  status: "Paid" | "Pending" | "Hold";
}

const statusColor: Record<IncomeRow["status"], string> = {
  Paid:    "#26a69a",
  Pending: "#f57c00",
  Hold:    "#e53935",
};

export default function BoosterIncomePage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");
  const [status,       setStatus]       = useState("--All--");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [pageSize,     setPageSize]     = useState(20);
  const [allIncomeRecords, setAllIncomeRecords] = useState<IncomeRow[]>([]);
  const [filtered,     setFiltered]     = useState<IncomeRow[]>([]);
  const [hasFiltered,  setHasFiltered]  = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // Fetch booster income data on mount
  useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/get-booster-income");
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        if (result.success && result.data) {
          setAllIncomeRecords(result.data);
        } else if (result.data) {
          // Support both old and new API format
          setAllIncomeRecords(result.data);
        } else {
          setError(result.error || result.message || "Failed to fetch income data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchIncomeData();
  }, []);

  const handleFilter = () => {
    let data = [...allIncomeRecords];
    
    // ✅ Filter by status
    if (status !== "--All--") {
      data = data.filter(d => d.status === status);
    }
    
    // ✅ Apply date range filtering if dates are provided
    if (fromDate || toDate) {
      data = data.filter((record) => {
        // Parse DD/MM/YYYY format from API response
        const [day, month, year] = record.date.split('/');
        const recordDate = new Date(`${year}-${month}-${day}`);
        
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;
        
        if (from && recordDate < from) return false;
        if (to) {
          // Include entire last day (set to end of day)
          to.setHours(23, 59, 59, 999);
          if (recordDate > to) return false;
        }
        return true;
      });
    }
    
    // ✅ Apply page size limit
    const sliced = data.slice(0, pageSize);
    setFiltered(sliced);
    setHasFiltered(true);
  };

  // ✅ Calculate total using rawAmount field
  const totalAmount = filtered.reduce((sum, r) => sum + (r.rawAmount || 0), 0);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,Amount,Pair Count,Date,Description,Status";
    const rows   = filtered.map(r =>
      `${r.srNo},${r.amount},${r.pairCount},${r.date},${r.description},${r.status}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "booster-income.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .gb-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        /* GREEN BAR */
        .green-bar { height:8px; background:linear-gradient(90deg,#00c853,#1de9b6); }

        /* BREADCRUMB */
        .breadcrumb { padding:12px 20px; font-size:13px; color:#555; display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:#555; text-decoration:none; }
        .breadcrumb a:hover { text-decoration:underline; }
        .breadcrumb .sep { color:#999; }

        /* PAGE BODY */
        .page-body { padding:0 20px 40px; }

        /* MAIN CARD */
        .main-card { background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.07); }

        /* HEADER */
        .section-header {
          background:linear-gradient(90deg,#26a69a,#1de9b6);
          padding:12px 16px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .section-title { font-size:13px; font-weight:700; color:#fff; letter-spacing:0.8px; text-transform:uppercase; }
        .header-actions { display:flex; align-items:center; gap:8px; }
        .icon-btn {
          background:rgba(255,255,255,0.2); border:none; border-radius:5px;
          padding:5px 8px; cursor:pointer; color:#fff;
          display:flex; align-items:center; transition:background .18s;
        }
        .icon-btn:hover { background:rgba(255,255,255,0.35); }

        /* NOTE */
        .note-text { color:#f57c00; font-size:13.5px; font-weight:600; padding:16px 16px 12px; }

        /* FILTER ROW */
        .filter-row {
          display:flex; align-items:flex-end;
          gap:14px; flex-wrap:wrap;
          padding:0 16px 20px;
        }
        .filter-group { display:flex; flex-direction:column; gap:5px; }
        .filter-label { font-size:12.5px; font-weight:500; color:#444; white-space:nowrap; }

        .filter-select {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px; min-width:150px;
          cursor:pointer; transition:border-color .18s;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 10px center; padding-right:30px;
        }
        .filter-select:focus { border-color:#26a69a; box-shadow:0 0 0 2px rgba(38,166,154,0.1); }

        .filter-date {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px; min-width:165px;
          transition:border-color .18s;
        }
        .filter-date:focus { border-color:#26a69a; box-shadow:0 0 0 2px rgba(38,166,154,0.1); }

        .filter-page {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 10px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px; min-width:90px;
          cursor:pointer; transition:border-color .18s;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 8px center; padding-right:26px;
        }
        .filter-page:focus { border-color:#26a69a; }

        .filter-btn {
          background:#1976d2; color:#fff; border:none; border-radius:6px;
          padding:0 28px; height:40px; font-size:14px; font-weight:600;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition:background .18s, transform .15s; white-space:nowrap;
        }
        .filter-btn:hover { background:#1565c0; transform:translateY(-1px); }
        .filter-btn:active { transform:scale(0.98); }

        .page-size-right { margin-left:auto; }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table { width:100%; border-collapse:collapse; font-size:13px; min-width:650px; }
        .data-table thead tr { background:#3d6b9e; }
        .data-table thead th {
          padding:13px 16px; text-align:left;
          color:#fff; font-weight:700; font-size:13px;
          white-space:nowrap; text-transform:uppercase; letter-spacing:0.4px;
        }
        .data-table tbody tr:nth-child(odd)  { background:#f5f5f5; }
        .data-table tbody tr:nth-child(even) { background:#fff; }
        .data-table tbody tr:hover { background:#fffde7; transition:background .15s; }
        .data-table tbody td {
          padding:12px 16px; color:#333;
          border-bottom:1px solid #eee; font-size:13px; white-space:nowrap;
        }

        /* Amount */
        .amount-cell { font-weight:700; color:#f57c00; font-size:13.5px; }

        /* Pair count badge */
        .pair-badge {
          display:inline-block; padding:3px 12px;
          border-radius:20px; font-size:11.5px; font-weight:700;
          background:#ffd54f; color:#5d4037; min-width:28px; text-align:center;
        }

        /* Status badge */
        .status-badge {
          display:inline-block; padding:3px 12px;
          border-radius:20px; font-size:11.5px; font-weight:600; color:#fff;
        }

        /* Total row */
        .total-row td {
          background:#fff8e1 !important;
          font-weight:700; border-top:2px solid #ffc107; color:#5d4037;
        }

        /* Skeleton Loader Styles */
        @keyframes skeletonShimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .skeleton-row {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1000px 100%;
          animation: skeletonShimmer 2s infinite;
        }

        .skeleton-row td { padding:12px 16px; }
        .skeleton-row .skeleton-cell { height:20px; border-radius:4px; }

        /* Empty state */
        .empty-state { text-align:center; padding:36px 20px; color:#aaa; font-size:13.5px; }
        .empty-state svg { margin:0 auto 10px; display:block; opacity:0.35; }

        /* Error state */
        .error-state {
          padding:20px 16px;
          background:#ffebee;
          display:flex;
          align-items:center;
          gap:12px;
          color:#c62828;
          font-size:13px;
          border-radius:6px;
          margin:16px;
        }

        /* Footer */
        .record-count {
          padding:8px 16px; font-size:12.5px; color:#666;
          border-top:1px solid #f0f0f0;
          display:flex; justify-content:space-between; align-items:center;
          flex-wrap:wrap; gap:8px;
        }
        .total-label { font-weight:700; color:#f57c00; font-size:13px; }
      `}</style>

      <div className="gb-root">
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={setActivePage} />

        {/* Green bar */}
        <div className="green-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span >Reports</span>
          <span className="sep">/</span>
          <span>Booster Income</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Booster Income Report</span>
              <div className="header-actions">
                <button className="icon-btn" title="Print" onClick={() => window.print()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                </button>
                <button className="icon-btn" title="Export CSV" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                </button>
              </div>
            </div>

            {/* NOTE */}
            <p className="note-text">Note : Please Use Filters To View This Report.</p>

            {/* FILTER ROW — Status | From Date | To Date | Filter | Page Size(right) */}
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">Status :</label>
                <select className="filter-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">From Date :</label>
                <input className="filter-date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>

              <div className="filter-group">
                <label className="filter-label">To Date :</label>
                <input className="filter-date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>

              <button className="filter-btn" onClick={handleFilter}>Filter</button>

              <div className="filter-group page-size-right">
                <label className="filter-label">Page Size</label>
                <select className="filter-page" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  {pageSizes.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* TABLE */}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Amount</th>
                    <th>Pair Count</th>
                    <th>Date</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // Skeleton loaders
                    <>
                      {[...Array(5)].map((_, i) => (
                        <tr key={`skeleton-${i}`} className="skeleton-row">
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                        </tr>
                      ))}
                    </>
                  ) : error ? (
                    // Error state
                    <tr>
                      <td colSpan={5}>
                        <div className="error-state">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          Error: {error}
                        </div>
                      </td>
                    </tr>
                  ) : hasFiltered && filtered.length > 0 ? (
                    // Data rows
                    <>
                      {filtered.map((row) => (
                        <tr key={row.srNo}>
                          <td>{row.srNo}</td>
                          <td><span className="amount-cell">{row.amount}</span></td>
                          <td><span className="pair-badge">{row.pairCount}</span></td>
                          <td>{row.date}</td>
                          <td>
                            <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <span
                                className="status-badge"
                                style={{ background: statusColor[row.status], fontSize:10.5, padding:"2px 8px" }}
                              >
                                {row.status}
                              </span>
                              {row.description}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="total-row">
                        <td><strong>Total</strong></td>
                        <td><span className="amount-cell">₹{totalAmount.toLocaleString("en-IN")}</span></td>
                        <td>
                          <span className="pair-badge">
                            {filtered.reduce((s, r) => s + r.pairCount, 0)}
                          </span>
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </>
                  ) : (
                    // Empty state
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <svg width="42" height="42" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <p>{hasFiltered ? "No booster income records found." : "Please use the filter above to view booster income records."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasFiltered && filtered.length > 0 && (
              <div className="record-count">
                <span>Showing {filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
                <span className="total-label">Total Income: ₹{totalAmount.toLocaleString("en-IN")}</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}