"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const pageSizes = [10, 20, 50, 100];

interface ReportRow {
  srNo: number;
  rbv: number;
  lbv: number;
  rCarry: number;
  lCarry: number;
  matching: number;
  date: string;
  fromMemberId: string;
  product: string;
  description: string;
}

const sampleData: ReportRow[] = [];

export default function BoosterCountingReportPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [filtered, setFiltered] = useState<ReportRow[]>([]);
  const [hasFiltered, setHasFiltered] = useState(false);
  const [allData, setAllData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/user/booster-counting-records');
        if (!res.ok) throw new Error('Failed to fetch data');
        const result = await res.json();
        if (result.success && result.data) {
          setAllData(result.data);
          setFiltered(result.data.slice(0, 20));
          setHasFiltered(true);
        } else {
          setError(result.error || result.message || 'Failed to fetch records');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilter = () => {
    let data = [...allData];
    
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

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,RBV,LBV,RCarry,LCarry,Matching,Date,From Member ID,Product,Description";
    const rows   = filtered.map(r =>
      `${r.srNo},${r.rbv},${r.lbv},${r.rCarry},${r.lCarry},${r.matching},${r.date},${r.fromMemberId},${r.product},${r.description}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "booster-counting-report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const totalMatching = filtered.reduce((s, r) => s + r.matching, 0);
  const totalRBV      = filtered.reduce((s, r) => s + r.rbv, 0);
  const totalLBV      = filtered.reduce((s, r) => s + r.lbv, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .gc-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,233,124,0.12) 0%, transparent 65%);
          min-height: 100vh;
          color: #fff;
        }

        /* GOLD BAR */
        .gold-bar { height:4px; background:linear-gradient(90deg, #ffe97c, #f0a500); }

        /* BREADCRUMB */
        .breadcrumb { padding:12px 20px; font-size:13px; color:rgba(255,233,124,0.7); display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:rgba(255,233,124,0.7); text-decoration:none; }
        .breadcrumb a:hover { color:#ffe97c; text-decoration:underline; }
        .breadcrumb .sep { color:rgba(255,233,124,0.4); }
        .breadcrumb .current { color:#ffe97c; font-weight:700; }

        /* PAGE BODY */
        .page-body { padding:0 20px 40px; }

        /* MAIN CARD */
        .main-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        /* HEADER */
        .section-header {
          background: linear-gradient(90deg, #1d033a, #110122);
          border-bottom: 1.5px solid rgba(255,233,124,0.22);
          padding:16px 20px;
          display:flex; align-items:center; justify-content:space-between;
        }
        .section-title { font-size:14px; font-weight:800; color:#ffe97c; letter-spacing:0.8px; text-transform:uppercase; text-shadow: 0 0 8px rgba(255,233,124,0.3); }
        .header-actions { display:flex; align-items:center; gap:8px; }
        .icon-btn {
          background: rgba(255,233,124,0.1); border: 1.5px solid rgba(255,233,124,0.25); border-radius:6px;
          padding:6px 10px; cursor:pointer; color:#ffe97c;
          display:flex; align-items:center; transition: all 0.2s;
        }
        .icon-btn:hover { background: rgba(255,233,124,0.25); border-color:#ffe97c; transform: translateY(-1px); }

        .icon-btn-excel { background: rgba(0,180,80,0.15); border-color: rgba(0,180,80,0.4); color: #00ff88; }
        .icon-btn-excel:hover { background: rgba(0,180,80,0.3); border-color: #00ff88; }

        /* NOTE */
        .note-text { color:#ffe97c; font-size:13.5px; font-weight:600; padding:18px 20px 12px; display: flex; align-items: center; gap: 6px; }

        /* FILTER ROW */
        .filter-row {
          display:flex; align-items:flex-end;
          gap:14px; flex-wrap:wrap;
          padding:0 20px 24px;
        }
        .filter-group { display:flex; flex-direction:column; gap:6px; }
        .filter-label { font-size:12.5px; font-weight:600; color:rgba(255,233,124,0.7); text-transform: uppercase; letter-spacing: 0.5px; }

        .filter-date {
          border: 1.5px solid rgba(255,233,124,0.25); border-radius:6px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#ffe97c;
          background: rgba(0,0,0,0.25); outline:none; height:40px; min-width:170px;
          transition: all 0.2s;
        }
        .filter-date:focus { border-color:#ffe97c; box-shadow: 0 0 10px rgba(255,233,124,0.2); }

        .filter-page {
          border: 1.5px solid rgba(255,233,124,0.25); border-radius:6px;
          padding:9px 10px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#ffe97c;
          background: rgba(0,0,0,0.25); outline:none; height:40px; min-width:90px;
          cursor:pointer; transition: all 0.2s;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 8px center; padding-right:26px;
        }
        .filter-page:focus { border-color:#ffe97c; }

        .filter-btn {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          color:#120228; border:none; border-radius:6px;
          padding:0 28px; height:40px; font-size:14px; font-weight:800;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition: all 0.2s, transform .15s; white-space:nowrap;
          box-shadow: 0 4px 12px rgba(255,233,124,0.2);
        }
        .filter-btn:hover { background: linear-gradient(135deg, #FFE042 0%, #f0b500 100%); transform:translateY(-1px); }
        .filter-btn:active { transform:scale(0.98); }

        .page-size-right { margin-left:auto; }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table { width:100%; border-collapse:collapse; font-size:13px; min-width:1000px; }
        .data-table thead tr { background: rgba(0, 0, 0, 0.35); border-bottom: 2px solid rgba(255,233,124,0.22); }
        .data-table thead th {
          padding:14px 14px; text-align:left;
          color:#ffe97c; font-weight:700; font-size:13px; white-space:nowrap;
          text-transform:uppercase; letter-spacing:0.8px;
        }
        .data-table tbody tr:nth-child(odd)  { background: rgba(29, 3, 58, 0.35); }
        .data-table tbody tr:nth-child(even) { background: rgba(17, 1, 34, 0.35); }
        .data-table tbody tr:hover { background: rgba(255,233,124,0.06); transition:background .15s; }
        .data-table tbody td {
          padding:12px 14px; color:#ffffff;
          border-bottom:1px solid rgba(255,233,124,0.12); font-size:13px; white-space:nowrap;
        }

        /* BV value styling */
        .bv-val  { font-weight:700; color:#ffe97c; }
        .carry-val { font-weight:600; color:#f0a500; }
        .match-badge {
          display:inline-block; padding:3px 12px;
          border-radius:20px; font-size:11.5px; font-weight:700;
          background: rgba(255, 215, 0, 0.15); color:#ffe97c;
          border: 1px solid rgba(255,233,124,0.3);
          min-width:32px; text-align:center;
        }
        .member-id-cell { color:#00ff88; font-weight:700; }

        /* Total row */
        .total-row td {
          background: rgba(255,233,124,0.12) !important;
          font-weight:700; border-top:2px solid #ffe97c;
          color:#ffe97c;
        }

        /* Empty state */
        .empty-state { text-align:center; padding:45px 20px; color:rgba(255,233,124,0.5); font-size:13.5px; }
        .empty-state svg { margin:0 auto 12px; display:block; opacity:0.65; }

        /* Skeleton Loader Styles */
        @keyframes skeletonShimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .skeleton-row {
          background: linear-gradient(90deg, rgba(29,3,58,0.5) 25%, rgba(168,85,247,0.2) 50%, rgba(29,3,58,0.5) 75%);
          background-size: 1000px 100%;
          animation: skeletonShimmer 2s infinite;
        }

        .skeleton-row td { padding:12px 16px; }
        .skeleton-row .skeleton-cell { height:20px; background: rgba(255,233,124,0.1); border-radius:4px; }

        /* Footer */
        .record-count {
          padding:14px 20px; font-size:12.5px; color:rgba(255,233,124,0.6);
          border-top:1.5px solid rgba(255,233,124,0.22);
          display:flex; justify-content:space-between; align-items:center;
          flex-wrap:wrap; gap:8px;
          background: rgba(0,0,0,0.15);
        }
        .total-label { font-weight:700; color:#ffe97c; font-size:13.5px; }
      `}</style>

      <div className="gc-root">
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={setActivePage} />

        {/* Gold bar */}
        <div className="gold-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffe97c"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span>Reports</span>
          <span className="sep">/</span>
          <span className="current">Booster Counting Report</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Booster Counting Detail</span>
              <div className="header-actions">
                {/* Print icon */}
                <button className="icon-btn" title="Print" onClick={() => window.print()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffe97c"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                </button>
                {/* Excel icon — green bg like screenshot */}
                <button className="icon-btn icon-btn-excel" title="Export CSV" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 18l-1.5-2.5L5.5 18H4l2-3.5L4 11h1.5l1.5 2.5L8.5 11H10l-2 3.5 2 3.5H8.5zm5.5 0h-1v-5h-1.5v-1H15v1h-1v5zm3.5 0h-3v-6h1v5h2v1z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* NOTE */}
            <p className="note-text">⚠️ Note : Please use filters to view report.</p>

            {/* ERROR STATE */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ff8888',
                padding: '12px 16px',
                borderLeft: '4px solid #ff4444',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* FILTER ROW — From Date | To Date | Filter | Page Size(right) */}
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">From Date :</label>
                <input
                  className="filter-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">To Date :</label>
                <input
                  className="filter-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <button className="filter-btn" onClick={handleFilter}>Filter</button>

              <div className="filter-group page-size-right">
                <label className="filter-label">Page Size</label>
                <select
                  className="filter-page"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
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
                    <th>RBV</th>
                    <th>LBV</th>
                    <th>RCarry</th>
                    <th>LCarry</th>
                    <th>Matching</th>
                    <th>Date</th>
                    <th>From Member ID</th>
                    <th>Product</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // ✅ Skeleton loaders
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
                          <td><div className="skeleton-cell" /></td>
                          <td><div className="skeleton-cell" /></td>
                        </tr>
                      ))}
                    </>
                  ) : error ? (
                    // ✅ Error state
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ffe97c">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <p>Error: {error}</p>
                        </div>
                      </td>
                    </tr>
                  ) : hasFiltered && filtered.length > 0 ? (
                    <>
                      {filtered.map((row) => (
                        <tr key={row.srNo}>
                          <td>{row.srNo}</td>
                          <td><span className="bv-val">{row.rbv}</span></td>
                          <td><span className="bv-val">{row.lbv}</span></td>
                          <td><span className="carry-val">{row.rCarry}</span></td>
                          <td><span className="carry-val">{row.lCarry}</span></td>
                          <td><span className="match-badge">{row.matching}</span></td>
                          <td>{row.date}</td>
                          <td><span className="member-id-cell">{row.fromMemberId}</span></td>
                          <td>{row.product}</td>
                          <td>{row.description}</td>
                        </tr>
                      ))}
                      {/* Total row */}
                      <tr className="total-row">
                        <td><strong>Total</strong></td>
                        <td><span className="bv-val">{totalRBV}</span></td>
                        <td><span className="bv-val">{totalLBV}</span></td>
                        <td colSpan={2}></td>
                        <td><span className="match-badge">{totalMatching}</span></td>
                        <td colSpan={4}></td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-state">
                          <svg width="42" height="42" viewBox="0 0 24 24" fill="#ffe97c">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <p>{hasFiltered ? "No booster counting records found." : "Please use the filter above to view booster counting report."}</p>
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
                <span className="total-label">
                  Total Matching: {totalMatching} &nbsp;|&nbsp; Total RBV: {totalRBV} &nbsp;|&nbsp; Total LBV: {totalLBV}
                </span>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}