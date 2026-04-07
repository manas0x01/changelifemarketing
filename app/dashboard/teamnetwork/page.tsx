"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const pageSizes = [10, 20, 50, 100];

interface Member {
  srNo: number;
  memberId: string;
  name: string;
  sponsorId: string;
  placementId: string;
  joiningDate: string;
  position: string;
}

export default function TeamNetworkPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [position,     setPosition]     = useState<"" | "Left" | "Right">("");
  const [pageSize,     setPageSize]     = useState(20);
  const [filtered,     setFiltered]     = useState<Member[]>([]);
  const [hasFiltered,  setHasFiltered]  = useState(false);
  const [allMembers,   setAllMembers]   = useState<Member[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // Fetch team network members from database on component mount
  useEffect(() => {
    const fetchTeamNetworkMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/user/get-downline-members');
        
        if (!response.ok) {
          throw new Error('Failed to fetch team network members');
        }

        const result = await response.json();
        
        if (result.success) {
          setAllMembers(result.data || []);
        } else {
          setError(result.error || 'Failed to fetch members');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamNetworkMembers();
  }, []);

  const handleFilter = () => {
    if (allMembers.length === 0) {
      setFiltered([]);
      setHasFiltered(true);
      return;
    }

    let data = [...allMembers];
    
    // Apply position filter
    if (position) {
      data = data.filter(d => d.position === position);
    }
    
    // Apply date filtering if dates are provided
    if (fromDate || toDate) {
      data = data.filter((member) => {
        const memberDate = new Date(member.joiningDate);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        if (from && memberDate < from) return false;
        if (to && memberDate > to) return false;
        return true;
      });
    }
    
    // Apply page size limit
    data = data.slice(0, pageSize);
    setFiltered(data);
    setHasFiltered(true);
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,Member ID,Name,Sponsor ID,Placement ID,Joining Date,Position";
    const rows   = filtered.map(r =>
      `${r.srNo},${r.memberId},${r.name},${r.sponsorId},${r.placementId},${r.joiningDate},${r.position}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "team-network.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .dl-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

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
        .note-text {
          color:#f57c00; font-size:13.5px; font-weight:600;
          padding:16px 16px 14px; line-height:1.5;
        }

        /* FILTER ROW — all inline: FromDate | ToDate | Position | Filter | PageSize */
        .filter-row {
          display:flex; align-items:flex-end;
          gap:16px; flex-wrap:wrap;
          padding:0 16px 20px;
        }
        .filter-group { display:flex; flex-direction:column; gap:5px; }
        .filter-label { font-size:12.5px; font-weight:500; color:#444; white-space:nowrap; }

        .filter-date {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px;
          min-width:170px; transition:border-color .18s;
        }
        .filter-date:focus { border-color:#26a69a; box-shadow:0 0 0 2px rgba(38,166,154,0.1); }

        /* Position radio box — ○LEFT ○RIGHT inline like screenshot */
        .position-radio-box {
          display:flex; align-items:center; gap:0;
          border:1px solid #d0d0d0; border-radius:5px;
          padding:0 14px; height:40px; background:#fff;
          min-width:160px;
        }
        .radio-label {
          display:flex; align-items:center; gap:4px;
          font-size:13px; color:#333; cursor:pointer;
          font-weight:500; letter-spacing:0.3px;
        }
        .radio-label + .radio-label { margin-left:10px; }
        .radio-label input[type="radio"] {
          accent-color:#1976d2; width:14px; height:14px; cursor:pointer;
        }

        .filter-btn {
          background:#1976d2; color:#fff; border:none; border-radius:6px;
          padding:0 28px; height:40px; font-size:14px; font-weight:600;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition:background .18s, transform .15s; white-space:nowrap;
        }
        .filter-btn:hover { background:#1565c0; transform:translateY(-1px); }
        .filter-btn:active { transform:scale(0.98); }
        .filter-btn:disabled {
          background:#ccc; color:#999; cursor:not-allowed; transform:none;
        }

        .filter-page {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 10px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px;
          min-width:90px; cursor:pointer;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 8px center;
          padding-right:26px; transition:border-color .18s;
        }
        .filter-page:focus { border-color:#26a69a; }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table { width:100%; border-collapse:collapse; font-size:13px; min-width:750px; }
        .data-table thead tr { background:#3d6b9e; }
        .data-table thead th {
          padding:13px 16px; text-align:left;
          color:#fff; font-weight:600; font-size:13px; white-space:nowrap;
        }
        .data-table tbody tr:nth-child(odd)  { background:#f5f5f5; }
        .data-table tbody tr:nth-child(even) { background:#fff; }
        .data-table tbody tr:hover { background:#e8f5e9; transition:background .15s; }
        .data-table tbody td {
          padding:12px 16px; color:#333;
          border-bottom:1px solid #eee; font-size:13px; white-space:nowrap;
        }

        /* Position badge */
        .pos-badge {
          display:inline-block; padding:3px 12px;
          border-radius:20px; font-size:11.5px; font-weight:600; color:#fff;
        }
        .pos-left  { background:#1976d2; }
        .pos-right { background:#7b1fa2; }

        /* Empty state */
        .empty-state { text-align:center; padding:36px 20px; color:#aaa; font-size:13.5px; }
        .empty-state svg { margin:0 auto 10px; display:block; opacity:0.35; }

        /* Record count */
        .record-count { padding:8px 16px; font-size:12.5px; color:#666; border-top:1px solid #f0f0f0; text-align:right; }

        /* SKELETON STYLES */
        @keyframes skeletonShimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .skeleton-row td {
          padding:12px 16px !important;
          border-bottom:1px solid #eee;
        }

        .skeleton-cell {
          height:16px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 1000px 100%;
          animation: skeletonShimmer 2s infinite;
          border-radius:4px;
        }
      `}</style>

      <div className="dl-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">My Network</span>
          <span className="sep">/</span>
          <span>Team Network</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Team Network</span>
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
            <p className="note-text">
              Note : This Report shows records of previous 3 months only, please use filters to view report.
            </p>

            {/* ERROR STATE */}
            {error && (
              <div style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px 16px',
                borderLeft: '4px solid #c62828',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* FILTER ROW — exact layout from screenshot */}
            <div className="filter-row">
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

              {/* Position radio — ○LEFT ○RIGHT */}
              <div className="filter-group">
                <label className="filter-label">Position :</label>
                <div className="position-radio-box">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="position"
                      checked={position === "Left"}
                      onChange={() => setPosition("Left")}
                    />
                    LEFT
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="position"
                      checked={position === "Right"}
                      onChange={() => setPosition("Right")}
                    />
                    RIGHT
                  </label>
                </div>
              </div>

              {/* Filter button */}
              <button className="filter-btn" onClick={handleFilter} disabled={loading || allMembers.length === 0}>Filter</button>

              {/* Page Size */}
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

            {/* TABLE */}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Sponsor ID</th>
                    <th>Placement ID</th>
                    <th>Joining Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <tr key={`skeleton-${i}`} className="skeleton-row">
                          <td><div className="skeleton-cell" style={{ width: '30px' }}></div></td>
                          <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                          <td><div className="skeleton-cell" style={{ width: '120px' }}></div></td>
                          <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                          <td><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                          <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                        </tr>
                      ))}
                    </>
                  ) : error ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                          </svg>
                          <p>Error loading members: {error}</p>
                        </div>
                      </td>
                    </tr>
                  ) : hasFiltered && filtered.length > 0 ? (
                    filtered.map((row) => (
                      <tr key={row.srNo}>
                        <td>{row.srNo}</td>
                        <td>{row.memberId}</td>
                        <td>{row.name}</td>
                        <td>{row.sponsorId}</td>
                        <td>{row.placementId}</td>
                        <td>{row.joiningDate}</td>
                      </tr>
                    ))
                  ) : !hasFiltered ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <svg width="42" height="42" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                          <p>{allMembers.length === 0 ? "You have no team network members yet." : "Please use the filter above to view team network."}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <svg width="42" height="42" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                          <p>No team network members found for the selected filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasFiltered && filtered.length > 0 && !loading && (
              <div className="record-count">
                Showing {filtered.length} member{filtered.length !== 1 ? "s" : ""} (Total: {allMembers.length})
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}