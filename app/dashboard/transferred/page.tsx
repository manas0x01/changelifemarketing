"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

const pageSizes = [10, 20, 50, 100];

interface EPinRow {
  srNo: number;
  reqNo: string;
  fromUser: string;
  fromUserName: string;
  transferType: string;
  transferRejectDate: string;
  transferRejectDateISO?: string | null;
  package: string;
  quantity: number;
  amount: string;
  status: "Transferred" | "Rejected" | "Pending" | "Approved";
}

export default function TransferredRejectedPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [transferType,  setTransferType]  = useState("");
  const [statusFilter,  setStatusFilter]  = useState("");
  const [selectedPkg,   setSelectedPkg]   = useState("");
  const [fromDate,      setFromDate]      = useState("");
  const [toDate,        setToDate]        = useState("");
  const [pageSize,      setPageSize]      = useState(20);
  const [filtered,      setFiltered]      = useState<EPinRow[]>([]);
  const [hasFiltered,   setHasFiltered]   = useState(false);
  const [allTransfers,  setAllTransfers]  = useState<EPinRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [packages,      setPackages]      = useState(new Set<string>());
  const [types,         setTypes]         = useState(new Set<string>());

  const handleClearFilters = () => {
    setTransferType("");
    setStatusFilter("");
    setSelectedPkg("");
    setFromDate("");
    setToDate("");
    setFiltered([]);
    setHasFiltered(false);
  };

  // Fetch transfer history
  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/get-transfer-history");
        
        if (!response.ok) {
          throw new Error("Failed to fetch transfer history");
        }
        
        const data = await response.json();
        const transfers = data.transfers || [];
        setAllTransfers(transfers);
        const pkgs = new Set<string>(transfers.map((t: EPinRow) => t.package));
        const typs = new Set<string>(transfers.map((t: EPinRow) => t.transferType));
        setPackages(pkgs);
        setTypes(typs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (sessionStatus === "authenticated") {
      fetchTransfers();
    }
  }, [sessionStatus]);

  const handleFilter = () => {
    let data = [...allTransfers];
    if (transferType) data = data.filter(d => d.transferType === transferType);
    if (statusFilter) data = data.filter(d => d.status === statusFilter);
    if (selectedPkg) data = data.filter(d => d.package === selectedPkg);
    if (fromDate || toDate) {
      data = data.filter((d) => {
        const dateISO = d.transferRejectDateISO;
        if (!dateISO || dateISO === null) return false;
        if (fromDate && dateISO < fromDate) return false;
        if (toDate && dateISO > toDate) return false;
        return true;
      });
    }
    setFiltered(data.slice(0, pageSize));
    setHasFiltered(true);
  };

  const statusColor: Record<EPinRow["status"], string> = {
    Transferred: "#ffe97c",
    Rejected:    "#e53935",
    Pending:     "#f57c00",
    Approved:    "#ffe97c",
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,Req.No.,FromUser,FromUser Name,Transfer Type,Transfer/Reject Date,Package,Quantity,Amount,Status";
    const rows   = filtered.map(r =>
      `${r.srNo},${r.reqNo},${r.fromUser},${r.fromUserName},${r.transferType},${r.transferRejectDate},${r.package},${r.quantity},${r.amount},${r.status}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "transferred-rejected.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .tr-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,233,124,0.12) 0%, transparent 65%);
          min-height: 100vh;
        }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px;
          color: #ffe97c;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb a { color: #ffe97c; text-decoration: none; opacity: 0.85; }
        .breadcrumb a:hover { text-decoration: underline; opacity: 1; }
        .breadcrumb .sep { color: rgba(255,233,124,0.4); }
        .breadcrumb .current { color: #ffe97c; font-weight: 600; }
        .breadcrumb svg { fill: #ffe97c !important; }

        /* PAGE BODY */
        .page-body { padding:0 20px 40px; }

        /* MAIN CARD */
        .main-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        /* HEADER */
        .section-header {
          background: linear-gradient(90deg, rgba(255,233,124,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,233,124,0.25);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #ffe97c;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255,233,124,0.45);
        }
        .header-actions { display: flex; align-items: center; gap: 8px; }
        .icon-btn {
          background: rgba(255,233,124,0.15);
          border: 1px solid rgba(255,233,124,0.25);
          border-radius: 5px;
          padding: 6px 10px;
          cursor: pointer;
          color: #ffe97c;
          display: flex;
          align-items: center;
          transition: background .18s;
        }
        .icon-btn:hover { background: rgba(255,233,124,0.3); }
        .icon-btn svg { fill: #ffe97c !important; }

        /* NOTE */
        .note-text {
          color: #ffe97c;
          font-size: 13.5px;
          font-weight: 600;
          padding: 16px 16px 12px;
          opacity: 0.85;
          text-shadow: 0 0 4px rgba(255,233,124,0.2);
        }

        /* FILTER AREA */
        .filter-area { padding:0 16px 20px; }

        /* Row 1 */
        .filter-row1 { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; margin-bottom: 18px; }

        /* Row 2 */
        .filter-row2 { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }

        .filter-group { display: flex; flex-direction: column; gap: 5px; }
        .filter-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #ffe97c;
          white-space: nowrap;
        }

        .filter-select, .filter-date, .filter-page {
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #ffe97c;
          background: rgba(0,0,0,0.25);
          outline: none;
          transition: border-color .18s, box-shadow .18s;
          height: 40px;
          appearance: none;
          -webkit-appearance: none;
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 30px;
          cursor: pointer;
        }
        .filter-select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          min-width: 160px;
        }
        .filter-date {
          background-image: none;
          padding-right: 12px;
          cursor: default;
          min-width: 160px;
        }
        .filter-page {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          min-width: 90px;
        }
        .filter-select:focus, .filter-date:focus, .filter-page:focus {
          border-color: #ffe97c;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,233,124,0.15);
        }
        .filter-select option, .filter-page option {
          background-color: #1a0533;
          color: #ffe97c;
        }

        .filter-btn {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
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
          align-self: flex-end;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(255,233,124,0.25);
        }
        .filter-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,233,124,0.35); }
        .filter-btn:active { transform: scale(0.98); }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 1000px;
        }
        .data-table thead tr {
          background: linear-gradient(90deg, rgba(255,233,124,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,233,124,0.2);
        }
        .data-table thead th {
          padding: 12px 14px;
          text-align: left;
          color: #ffe97c;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
        }
        .data-table tbody tr:nth-child(odd)  { background: rgba(255, 255, 255, 0.02); }
        .data-table tbody tr:nth-child(even) { background: rgba(0, 0, 0, 0.15); }
        .data-table tbody tr:hover { background: rgba(255, 215, 0, 0.08); }
        .data-table tbody td {
          padding: 11px 14px;
          color: #ffe97c;
          border-bottom: 1px solid rgba(255, 215, 0, 0.12);
          font-size: 13px;
          white-space: nowrap;
        }

        /* Status badge */
        .status-badge {
          display:inline-block; padding:3px 12px;
          border-radius:20px; font-size:11.5px; font-weight:600; color:#fff;
        }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 36px 20px;
          color: rgba(255,233,124,0.4);
          font-size: 13.5px;
        }
        .empty-state svg { margin-bottom: 10px; fill: rgba(255,233,124,0.4) !important; display: block; margin-left: auto; margin-right: auto; }

        /* Record count */
        .record-count {
          padding: 8px 16px;
          font-size: 12.5px;
          color: rgba(255,233,124,0.6);
          border-top: 1px solid rgba(255, 215, 0, 0.12);
          text-align: right;
        }

        /* Skeleton Loader */
        .skeleton-row { animation: pulse 1.5s ease-in-out infinite; }
        .skeleton-cell { 
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          height: 16px;
          border-radius: 4px;
          margin: 4px 0;
        }
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-table-row td { padding: 12px 14px; }
      `}</style>

      <div className="tr-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">E-Pin Management</span>
          <span className="sep">/</span>
          <span>Transferred/Rejected</span>
        </div>

        {/* Loading State with Skeleton */}
        {loading && (
          <div className="page-body">
            <div className="main-card">
              <div className="section-header">
                <span className="section-title">Transferred/Rejected E-Pins</span>
                <div className="header-actions">
                  <button className="icon-btn" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                  </button>
                  <button className="icon-btn" disabled>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                  </button>
                </div>
              </div>

              <p className="note-text">Loading data from database...</p>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sr.No.</th>
                      <th>Req.No.</th>
                      <th>FromUser</th>
                      <th>FromUser Name</th>
                      <th>Transfer Type</th>
                      <th>Transfer/Reject Date</th>
                      <th>Package</th>
                      <th>Quantity</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(5)].map((_, i) => (
                      <tr key={i} className="skeleton-row" style={{ background: "#f5f5f5" }}>
                        <td><div className="skeleton-cell" style={{ width: "30px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "70px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "80px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "100px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "70px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "90px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "120px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "50px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "60px" }}></div></td>
                        <td><div className="skeleton-cell" style={{ width: "80px" }}></div></td>
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
              <span className="section-title">Transferred/Rejected E-Pins</span>
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

              {/* Row 1: Transfer Type | Status | Select Package | From Date | To Date | Filter */}
              <div className="filter-row1">
                <div className="filter-group">
                  <label className="filter-label">Transfer Type :</label>
                  <select className="filter-select" value={transferType} onChange={(e) => setTransferType(e.target.value)}>
                    <option value="">--Select Type--</option>
                    {Array.from(types).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Status :</label>
                  <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">--Select Status--</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Select Package :</label>
                  <select className="filter-select" value={selectedPkg} onChange={(e) => setSelectedPkg(e.target.value)}>
                    <option value="">--Select Package--</option>
                    {Array.from(packages).map(p => <option key={p}>{p}</option>)}
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
                <button className="filter-btn" style={{ background: "#666" }} onClick={handleClearFilters}>Clear Filters</button>
              </div>

              {/* Row 2: Page Size */}
              <div className="filter-row2">
                <div className="filter-group">
                  <label className="filter-label">Page Size</label>
                  <select className="filter-page" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
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
                    <th>Req.No.</th>
                    <th>FromUser</th>
                    <th>FromUser Name</th>
                    <th>Transfer Type</th>
                    <th>Transfer/Reject Date</th>
                    <th>Package</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hasFiltered && filtered.length > 0 ? (
                    filtered.map((row) => (
                      <tr key={row.srNo}>
                        <td>{row.srNo}</td>
                        <td>{row.reqNo}</td>
                        <td>{row.fromUser}</td>
                        <td>{row.fromUserName}</td>
                        <td>{row.transferType}</td>
                        <td>{row.transferRejectDate}</td>
                        <td>{row.package}</td>
                        <td>{row.quantity}</td>
                        <td>{row.amount}</td>
                        <td>
                          <span className="status-badge" style={{ background: statusColor[row.status], color: (row.status === "Transferred" || row.status === "Approved") ? "#120228" : "#fff" }}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                          </svg>
                          <p>{hasFiltered ? "No records found for the selected filters." : "Please use the filter above to view records."}</p>
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