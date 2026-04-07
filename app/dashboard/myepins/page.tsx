"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

const pageSizes = [10, 20, 50, 100];

interface EPin {
  srNo: number;
  ePin: string;
  package: string;
  status: "Active" | "Used" | "Transferred" | "Expired";
  transferredTo: string;
  transferredToName: string;
  transferredDate: string;
  usedDate?: string;
  transferDate?: string;
  transferredToId?: string;
}

// Get unique packages and statuses from data
const getPackages = (data: EPin[]) => {
  const pkgs = new Set(data.map(d => d.package));
  return ["--Select Package--", ...Array.from(pkgs)];
};

const getStatuses = (data: EPin[]) => {
  const stats = new Set(data.map(d => d.status));
  return ["--Select Status--", ...Array.from(stats)];
};

const statusColor: Record<EPin["status"], string> = {
  Active:      "#26a69a",
  Used:        "#1976d2",
  Transferred: "#f57c00",
  Expired:     "#e53935",
};

export default function MyEPinsPage() {
  const { data: session, status } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPkg,  setSelectedPkg]  = useState("--Select Package--");
  const [selectedStat, setSelectedStat] = useState("--Select Status--");
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [pageSize,     setPageSize]     = useState(20);
  const [filtered,     setFiltered]     = useState<EPin[]>([]);
  const [hasFiltered,  setHasFiltered]  = useState(false);
  const [allEPins,     setAllEPins]     = useState<EPin[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [packages,     setPackages]     = useState<string[]>(["--Select Package--"]);
  const [statuses,     setStatuses]     = useState<string[]>(["--Select Status--"]);
  useEffect(() => {
    const fetchEPins = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/get-epins");
        if (!response.ok) {
          throw new Error("Failed to fetch E-Pins");
        }
        const data = await response.json();
        setAllEPins(data.ePins || []);
        setPackages(getPackages(data.ePins || []));
        setStatuses(getStatuses(data.ePins || []));
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchEPins();
    }
  }, [status]);

  const handleFilter = () => {
    let data = [...allEPins];
    if (selectedPkg  !== "--Select Package--") data = data.filter(d => d.package === selectedPkg);
    if (selectedStat !== "--Select Status--")  data = data.filter(d => d.status  === selectedStat);
    if (fromDate) {
      const from = new Date(fromDate);
      data = data.filter(d => d.transferDate ? new Date(d.transferDate) >= from : true);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      data = data.filter(d => d.transferDate ? new Date(d.transferDate) <= to : true);
    }
    setFiltered(data.slice(0, pageSize));
    setHasFiltered(true);
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,E-Pin,Package,Status,Used/Transferred To,Used/Transferred To Name,Used/Transferred Date";
    const rows = filtered.map(r =>
      `${r.srNo},${r.ePin},${r.package},${r.status},${r.transferredTo},${r.transferredToName},${r.transferredDate}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "my-epins.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPrint = () => window.print();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .ep-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px; color: #555;
          display: flex; align-items: center; gap: 6px;
        }
        .breadcrumb a { color: #555; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .breadcrumb .sep { color: #999; }
        .breadcrumb .current { color: #555; }

        /* PAGE BODY */
        .page-body { padding: 0 20px 40px; }

        /* ── MAIN CARD ── */
        .main-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
        }

        /* SECTION HEADER */
        .section-header {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-header-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 5px;
          padding: 5px 8px;
          cursor: pointer;
          color: #fff;
          display: flex;
          align-items: center;
          transition: background .18s;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.35); }

        /* NOTE */
        .note-text {
          color: #f57c00;
          font-size: 13.5px;
          font-weight: 600;
          padding: 14px 16px 10px;
        }

        /* FILTER ROW */
        .filter-row {
          display: flex;
          align-items: flex-end;
          gap: 14px;
          padding: 0 16px 16px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .filter-label {
          font-size: 12.5px;
          font-weight: 500;
          color: #444;
          white-space: nowrap;
        }

        .filter-select, .filter-date, .filter-page {
          border: 1px solid #d0d0d0;
          border-radius: 5px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          background: #fff;
          outline: none;
          transition: border-color .18s;
          height: 40px;
        }
        .filter-select { min-width: 160px; cursor: pointer; }
        .filter-date   { min-width: 155px; }
        .filter-page   { min-width: 80px;  cursor: pointer; }
        .filter-select:focus, .filter-date:focus, .filter-page:focus {
          border-color: #26a69a;
        }

        .filter-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0 28px;
          height: 40px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background .18s, transform .15s;
          white-space: nowrap;
          align-self: flex-end;
        }
        .filter-btn:hover { background: #1565c0; transform: translateY(-1px); }

        /* TABLE */
        .table-wrap {
          overflow-x: auto;
          padding: 0 0 10px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 800px;
        }
        .data-table thead tr {
          background: #3d6b9e;
        }
        .data-table thead th {
          padding: 12px 14px;
          text-align: left;
          color: #fff;
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
        }
        .data-table tbody tr:nth-child(odd)  { background: #f5f5f5; }
        .data-table tbody tr:nth-child(even) { background: #fff; }
        .data-table tbody tr:hover { background: #e8f5e9; }
        .data-table tbody td {
          padding: 11px 14px;
          color: #333;
          border-bottom: 1px solid #eee;
          font-size: 13px;
          white-space: nowrap;
        }

        /* Status badge */
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 600;
          color: #fff;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 36px 20px;
          color: #aaa;
          font-size: 13.5px;
        }
        .empty-state svg { margin-bottom: 10px; opacity: 0.4; }

        /* Record count */
        .record-count {
          padding: 8px 16px;
          font-size: 12.5px;
          color: #666;
          border-top: 1px solid #f0f0f0;
          text-align: right;
        }

        /* Skeleton Loading */
        .skeleton-row { background: #f5f5f5; }
        .skeleton-cell {
          display: block;
          height: 16px;
          border-radius: 4px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="ep-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">E-Pin Management</span>
          <span className="sep">/</span>
          <span className="current">My E-Pins</span>
        </div>

        {/* Loading State - Skeleton Table */}
        {loading && (
          <div className="page-body">
            <div className="main-card">
              {/* HEADER */}
              <div className="section-header">
                <span className="section-header-title">My E-Pins</span>
              </div>

              <p className="note-text">Note : Please Use Filter To View This Report.</p>

              {/* SKELETON TABLE */}
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sr.No.</th>
                      <th>E-Pin</th>
                      <th>Package</th>
                      <th>Status</th>
                      <th>Used/Transferred To</th>
                      <th>Used/Transferred To Name</th>
                      <th>Used/Transferred Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="skeleton-row">
                        <td><div className="skeleton-cell" style={{ width: "40px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "90px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "80px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "70px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "110px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "120px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "100px" }}></div></td>
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
              <span className="section-header-title">My E-Pins</span>
              <div className="header-actions">
                {/* Print icon */}
                <button className="icon-btn" title="Print" onClick={handleExportPrint}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                  </svg>
                </button>
                {/* Export/CSV icon */}
                <button className="icon-btn" title="Export CSV" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* NOTE */}
            <p className="note-text">Note : Please Use Filter To View This Report.</p>

            {/* FILTER ROW */}
            <div className="filter-row">
              {/* Package */}
              <div className="filter-group">
                <label className="filter-label">Select Package :</label>
                <select
                  className="filter-select"
                  value={selectedPkg}
                  onChange={(e) => setSelectedPkg(e.target.value)}
                >
                  {packages.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="filter-group">
                <label className="filter-label">Status :</label>
                <select
                  className="filter-select"
                  value={selectedStat}
                  onChange={(e) => setSelectedStat(e.target.value)}
                >
                  {statuses.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {/* From Date */}
              <div className="filter-group">
                <label className="filter-label">From Date :</label>
                <input
                  className="filter-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* To Date */}
              <div className="filter-group">
                <label className="filter-label">To Date :</label>
                <input
                  className="filter-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              {/* Filter Button */}
              <button className="filter-btn" onClick={handleFilter}>Filter</button>

              {/* Page Size */}
              <div className="filter-group" style={{ marginLeft: "auto" }}>
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
                    <th>E-Pin</th>
                    <th>Package</th>
                    <th>Status</th>
                    <th>Used/Transferred To</th>
                    <th>Used/Transferred To Name</th>
                    <th>Used/Transferred Date</th>
                  </tr>
                </thead>
                <tbody>
                  {hasFiltered && filtered.length > 0 ? (
                    filtered.map((row) => (
                      <tr key={row.srNo}>
                        <td>{row.srNo}</td>
                        <td>{row.ePin}</td>
                        <td>{row.package}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ background: statusColor[row.status] }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td>{row.transferredTo}</td>
                        <td>{row.transferredToName}</td>
                        <td>{row.transferredDate}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                          </svg>
                          <p>{hasFiltered ? "No records found for the selected filters." : "Please use the filter above to view E-Pin records."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Record count */}
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