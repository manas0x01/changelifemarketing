"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const pageSizes = [10, 20, 50, 100];

interface Member {
  srNo: number;
  memberId: string;
  name: string;
  directs: number;
  joiningDate: string;
  mobileNo: string;
}

export default function DirectMembersPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [pageSize,     setPageSize]     = useState(20);
  const [filtered,     setFiltered]     = useState<Member[]>([]);
  const [hasFiltered,  setHasFiltered]  = useState(false);
  const [allMembers,   setAllMembers]   = useState<Member[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    const fetchDirectMembers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/user/get-direct-members');
        
        if (!response.ok) {
          throw new Error('Failed to fetch direct members');
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

    fetchDirectMembers();
  }, []);

  const handleFilter = () => {
    if (allMembers.length === 0) {
      setFiltered([]);
      setHasFiltered(true);
      return;
    }

    let result = [...allMembers];

    // Apply date filtering if dates are provided
    if (fromDate || toDate) {
      result = result.filter((member) => {
        // Parse DD/MM/YYYY format from joiningDate string (handles both date-only and date-time formats)
        const datePart = member.joiningDate.includes(',') ? member.joiningDate.split(',')[0] : member.joiningDate;
        const [day, month, year] = datePart.split('/').map(Number);
        const memberDate = new Date(year, month - 1, day);
        
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        if (from && memberDate < from) return false;
        if (to) {
          // Include current day by setting to end of day
          const toEndOfDay = new Date(to);
          toEndOfDay.setHours(23, 59, 59, 999);
          if (memberDate > toEndOfDay) return false;
        }
        return true;
      });
    }

    // Apply page size limit
    result = result.slice(0, pageSize);
    setFiltered(result);
    setHasFiltered(true);
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,Member ID,Name,Directs,Joining Date,Mobile No.";
    const rows   = filtered.map(r =>
      `${r.srNo},${r.memberId},${r.name},${r.directs},${r.joiningDate},${r.mobileNo}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "direct-members.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .dm-root {
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
        .section-title {
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

        /* FILTER ROW */
        .filter-row {
          display: flex; align-items: flex-end;
          gap: 14px; flex-wrap: wrap;
          padding: 0 16px 20px;
        }
        .filter-group { display: flex; flex-direction: column; gap: 5px; }
        .filter-label {
          font-size: 12.5px;
          font-weight: 600;
          color: #FFD700;
          white-space: nowrap;
        }

        .filter-date {
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #FFD700;
          background: rgba(0,0,0,0.25);
          outline: none; height: 40px;
          transition: border-color .18s, box-shadow .18s; min-width: 170px;
        }
        .filter-date:focus {
          border-color: #FFD700;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,215,0,0.15);
        }

        .filter-page {
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #FFD700;
          background: rgba(0,0,0,0.25);
          outline: none; height: 40px;
          min-width: 90px; cursor: pointer;
          appearance: none; -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 12px center;
          padding-right: 30px;
          transition: border-color .18s;
        }
        .filter-page option {
          background-color: #1a0533;
          color: #FFD700;
        }
        .filter-page:focus {
          border-color: #FFD700;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,215,0,0.15);
        }

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
        .filter-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,215,0,0.35); }
        .filter-btn:active:not(:disabled) { transform: scale(0.98); }
        .filter-btn:disabled {
          background: rgba(255,215,0,0.2) !important;
          color: rgba(255,215,0,0.4) !important;
          border: 1px solid rgba(255,215,0,0.15) !important;
          box-shadow: none !important;
          cursor: not-allowed;
          transform: none;
        }

        /* Page size right-aligned */
        .page-size-right { margin-left:auto; }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 700px;
        }
        .data-table thead tr {
          background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,215,0,0.2);
        }
        .data-table thead th {
          padding: 13px 16px;
          text-align: left;
          color: #FFD700;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
        }
        .data-table tbody tr:nth-child(odd)  { background: rgba(255, 255, 255, 0.02); }
        .data-table tbody tr:nth-child(even) { background: rgba(0, 0, 0, 0.15); }
        .data-table tbody tr:hover { background: rgba(255, 215, 0, 0.08); transition: background .15s; }
        .data-table tbody td {
          padding: 12px 16px;
          color: #FFD700;
          border-bottom: 1px solid rgba(255, 215, 0, 0.12);
          font-size: 13px;
          white-space: nowrap;
        }

        /* Directs badge */
        .directs-badge {
          display: inline-block;
          background: rgba(255, 215, 0, 0.2);
          color: #FFD700;
          font-weight: 700;
          font-size: 12.5px;
          padding: 3px 12px;
          border-radius: 20px;
          min-width: 32px;
          text-align: center;
          border: 1px solid rgba(255, 215, 0, 0.4);
        }
        .directs-badge.zero { background: rgba(255, 255, 255, 0.05); color: rgba(255,215,0,0.4); border-color: rgba(255, 215, 0, 0.1); }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 36px 20px;
          color: rgba(255,215,0,0.4);
          font-size: 13.5px;
        }
        .empty-state svg { margin: 0 auto 10px; display: block; fill: rgba(255,215,0,0.4) !important; }

        /* Record count */
        .record-count {
          padding: 8px 16px;
          font-size: 12.5px;
          color: rgba(255,215,0,0.6);
          border-top: 1px solid rgba(255, 215, 0, 0.12);
          text-align: right;
        }

        /* SKELETON STYLES */
        @keyframes skeletonShimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        .skeleton-row td {
          padding: 12px 16px !important;
          border-bottom: 1px solid rgba(255, 215, 0, 0.12);
        }

        .skeleton-cell {
          height: 16px;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 1000px 100%;
          animation: skeletonShimmer 2s infinite;
          border-radius: 4px;
        }

        .skeleton-badge {
          height: 26px;
          width: 50px;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 1000px 100%;
          animation: skeletonShimmer 2s infinite;
          border-radius: 20px;
          display: inline-block;
        }
      `}</style>

      <div className="dm-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFD700"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">My Network</span>
          <span className="sep">/</span>
          <span>Direct Members</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Direct Members</span>
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

            {/* FILTER ROW — exact layout: From Date | To Date | Filter | Page Size (right) */}
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

              <button className="filter-btn" onClick={handleFilter} disabled={loading || allMembers.length === 0}>Filter</button>

              {/* Page Size — pushed to right */}
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
                    <th>Member ID</th>
                    <th>Name</th>
                    <th>Directs</th>
                    <th>Joining Date</th>
                    <th>Mobile No.</th>
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
                          <td><div className="skeleton-badge"></div></td>
                          <td><div className="skeleton-cell" style={{ width: '100px' }}></div></td>
                          <td><div className="skeleton-cell" style={{ width: '110px' }}></div></td>
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
                        <td>
                          <span className={`directs-badge${row.directs === 0 ? " zero" : ""}`}>
                            {row.directs}
                          </span>
                        </td>
                        <td>{row.joiningDate}</td>
                        <td>{row.mobileNo}</td>
                      </tr>
                    ))
                  ) : !hasFiltered ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                          <p>{allMembers.length === 0 ? "You have no direct members yet." : "Please use the filter above to view your direct members."}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                          <p>No direct members found for the selected date range.</p>
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