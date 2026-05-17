"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

const pageSizes = [10, 20, 50, 100];

interface Request {
  srNo: number;
  requestNo: string;
  date: string;
  dateISO?: string | null; 
  memberId: string;
  name: string;
  totalPins: number;
  totalAmount: string;
  description: string;
  type: "Credit" | "Debit";
}

export default function MyRequestsPage() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [selectType,   setSelectType]   = useState<"" | "Credit" | "Debit">("");
  const [pageSize,     setPageSize]     = useState(20);
  const [filtered,     setFiltered]     = useState<Request[]>([]);
  const [hasFiltered,  setHasFiltered]  = useState(false);
  const [allRequests,  setAllRequests]  = useState<Request[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/get-pin-requests");
        
        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }
        const data = await response.json();
        setAllRequests(data.requests || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchRequests();
    }
  }, [status]);

  const handleFilter = () => {
    let data = [...allRequests];
    
    // Apply type filter
    if (selectType) {
      data = data.filter(d => d.type === selectType);
    }
    
    // Apply date range filtering
    if (fromDate) {
      const from = new Date(fromDate);
      data = data.filter(d => {
        if (!d.dateISO) return true; // Include items without dates
        return new Date(d.dateISO) >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter(d => {
        if (!d.dateISO) return true; // Include items without dates
        return new Date(d.dateISO) <= to;
      });
    }
    
    setFiltered(data.slice(0, pageSize));
    setHasFiltered(true);
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,Request No.,Date,Member ID,Name,Total Pins,Total Amount,Description,Type";
    const rows   = filtered.map(r =>
      `${r.srNo},${r.requestNo},${r.date},${r.memberId},${r.name},${r.totalPins},${r.totalAmount},${r.description},${r.type}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "my-requests.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .mr-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,215,0,0.12) 0%, transparent 65%);
          min-height: 100vh;
        }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px;
          color: #FFD700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb a { color: #FFD700; text-decoration: none; opacity: 0.85; }
        .breadcrumb a:hover { text-decoration: underline; opacity: 1; }
        .breadcrumb .sep { color: rgba(255,215,0,0.4); }
        .breadcrumb .current { color: #FFD700; font-weight: 600; }
        .breadcrumb svg { fill: #FFD700 !important; }

        /* PAGE BODY */
        .page-body { padding:0 20px 40px; }

        /* MAIN CARD */
        .main-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        /* HEADER */
        .section-header {
          background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,215,0,0.25);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-header-title {
          font-size: 13px;
          font-weight: 700;
          color: #FFD700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255,215,0,0.45);
        }
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .icon-btn {
          background: rgba(255,215,0,0.15);
          border: 1px solid rgba(255,215,0,0.25);
          border-radius: 5px;
          padding: 6px 10px;
          cursor: pointer;
          color: #FFD700;
          display: flex;
          align-items: center;
          transition: background .18s;
        }
        .icon-btn:hover { background: rgba(255,215,0,0.3); }
        .icon-btn svg { fill: #FFD700 !important; }

        /* NOTE */
        .note-text {
          color: #FFD700;
          font-size: 13.5px;
          font-weight: 600;
          padding: 16px 16px 12px;
          opacity: 0.85;
          text-shadow: 0 0 4px rgba(255,215,0,0.2);
        }

        /* FILTER AREA */
        .filter-area { padding:0 16px 20px; }

        /* Row 1 */
        .filter-row1 {
          display: flex; align-items: flex-end; gap: 16px;
          flex-wrap: wrap; margin-bottom: 18px;
        }
        /* Row 2 */
        .filter-row2 { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }

        .filter-group { display: flex; flex-direction: column; gap: 5px; }
        .filter-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #FFD700;
          white-space: nowrap;
        }

        .filter-date, .filter-page {
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #FFD700;
          background: rgba(0,0,0,0.25);
          outline: none;
          transition: border-color .18s, box-shadow .18s;
          height: 40px;
        }
        .filter-date  { min-width:170px; }
        .filter-page  {
          min-width: 90px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 30px;
        }
        .filter-page option {
          background-color: #1a0533;
          color: #FFD700;
        }
        .filter-date:focus, .filter-page:focus {
          border-color: #FFD700;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,215,0,0.15);
        }

        /* Credit/Debit radio group */
        .radio-box {
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 6px;
          padding: 0 14px;
          height: 40px;
          background: rgba(0,0,0,0.25);
          min-width: 180px;
        }
        .radio-label { display: flex; align-items: center; gap: 5px; font-size: 13px; color: #FFD700; cursor: pointer; font-weight: 500; }
        .radio-label input[type="radio"] { accent-color: #FFD700; width: 14px; height: 14px; cursor: pointer; }

        .filter-btn {
          background: linear-gradient(135deg, #FFD700 0%, #f0a500 100%);
          color: #120228;
          border: none;
          border-radius: 6px;
          padding: 0 28px;
          height: 40px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background .18s, transform .15s, box-shadow 0.18s;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(255,215,0,0.25);
        }
        .filter-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,215,0,0.35); }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 900px;
        }
        .data-table thead tr {
          background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,215,0,0.2);
        }
        .data-table thead th {
          padding: 12px 14px;
          text-align: left;
          color: #FFD700;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
        }
        .data-table tbody tr:nth-child(odd)  { background: rgba(255, 255, 255, 0.02); }
        .data-table tbody tr:nth-child(even) { background: rgba(0, 0, 0, 0.15); }
        .data-table tbody tr:hover { background: rgba(255, 215, 0, 0.08); }
        .data-table tbody td {
          padding: 11px 14px;
          color: #FFD700;
          border-bottom: 1px solid rgba(255, 215, 0, 0.12);
          font-size: 13px;
          white-space: nowrap;
        }

        /* Type badge */
        .type-badge {
          display:inline-block; padding:3px 12px;
          border-radius:20px; font-size:11.5px; font-weight:600; color:#fff;
        }
        .badge-credit { background:#26a69a; }
        .badge-debit  { background:#e53935; }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 36px 20px;
          color: rgba(255,215,0,0.4);
          font-size: 13.5px;
        }
        .empty-state svg { margin-bottom: 10px; fill: rgba(255,215,0,0.4) !important; }

        /* Record count */
        .record-count {
          padding: 8px 16px;
          font-size: 12.5px;
          color: rgba(255,215,0,0.6);
          border-top: 1px solid rgba(255, 215, 0, 0.12);
          text-align: right;
        }

        /* Skeleton Loading */
        .skeleton-row { animation: pulse 1.5s ease-in-out infinite; }
        .skeleton-cell {
          display: block;
          height: 16px;
          border-radius: 4px;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { background-position:200% 0; }
          100% { background-position:-200% 0; }
        }
      `}</style>

      <div className="mr-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">E-Pin Management</span>
          <span className="sep">/</span>
          <span>My Requests</span>
        </div>

        {/* Loading State - Skeleton Table */}
        {loading && (
          <div className="page-body">
            <div className="main-card">
              {/* HEADER */}
              <div className="section-header">
                <span className="section-header-title">My Requests</span>
              </div>

              <p className="note-text">Note : Please Use Filter To View This Report.</p>

              {/* SKELETON TABLE */}
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sr.No.</th>
                      <th>Request No.</th>
                      <th>Date</th>
                      <th>Member ID</th>
                      <th>Name</th>
                      <th>Total Pins</th>
                      <th>Total Amount</th>
                      <th>Description</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td><div className="skeleton-cell" style={{ width: "40px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "100px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "90px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "80px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "120px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "60px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "90px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "100px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "70px" }}></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="page-body">
            <div className="main-card" style={{ padding: "20px", border: "1px solid #ef5350" }}>
              <p style={{ color: "#d32f2f", fontSize: "14px" }}>Error: {error}</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-header-title">My Requests</span>
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
            <p className="note-text">Note : Please Use Filter To View This Report.</p>

            {/* FILTERS */}
            <div className="filter-area">

              {/* Row 1: From Date | To Date | Select Type | Filter btn */}
              <div className="filter-row1">
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

                <div className="filter-group">
                  <label className="filter-label">Select Type :</label>
                  <div className="radio-box">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="txnType"
                        checked={selectType === "Credit"}
                        onChange={() => setSelectType("Credit")}
                      />
                      Credit
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="txnType"
                        checked={selectType === "Debit"}
                        onChange={() => setSelectType("Debit")}
                      />
                      Debit
                    </label>
                  </div>
                </div>

                <button className="filter-btn" onClick={handleFilter}>Filter</button>
              </div>

              {/* Row 2: Page Size */}
              <div className="filter-row2">
                <div className="filter-group">
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
            </div>

            {/* TABLE */}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Request No.</th>
                    <th>Date</th>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Total Pins</th>
                    <th>Total Amount</th>
                    <th>Description</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {hasFiltered && filtered.length > 0 ? (
                    filtered.map((row) => (
                      <tr key={row.srNo}>
                        <td>{row.srNo}</td>
                        <td>{row.requestNo}</td>
                        <td>{row.date}</td>
                        <td>{row.memberId}</td>
                        <td>{row.name}</td>
                        <td>{row.totalPins}</td>
                        <td>{row.totalAmount}</td>
                        <td>{row.description}</td>
                        <td>
                          <span className={`type-badge ${row.type === "Credit" ? "badge-credit" : "badge-debit"}`}>
                            {row.type}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                          </svg>
                          <p>{hasFiltered ? "No records found for the selected filters." : "Please use the filter above to view request records."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasFiltered && filtered.length > 0 && (
              <div className="record-count">
                Showing {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </div>
            )}

          </div>
        </div>
        )}
      </div>
    </>
  );
}