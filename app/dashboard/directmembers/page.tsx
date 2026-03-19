"use client";

import { useState } from "react";
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

const sampleData: Member[] = [
  { srNo: 1, memberId: "SM112233", name: "Rahul Sharma",  directs: 3, joiningDate: "10-Jan-2026", mobileNo: "9876543210" },
  { srNo: 2, memberId: "SM445566", name: "Priya Singh",   directs: 1, joiningDate: "23-Oct-2025", mobileNo: "8765432109" },
  { srNo: 3, memberId: "SM778899", name: "Amit Verma",    directs: 5, joiningDate: "01-Oct-2025", mobileNo: "7654321098" },
  { srNo: 4, memberId: "SM334455", name: "Sunita Devi",   directs: 0, joiningDate: "20-Sep-2025", mobileNo: "6543210987" },
  { srNo: 5, memberId: "SM667788", name: "Vijay Kumar",   directs: 2, joiningDate: "18-Sep-2025", mobileNo: "9988776655" },
  { srNo: 6, memberId: "SM990011", name: "Neha Gupta",    directs: 4, joiningDate: "05-Aug-2025", mobileNo: "8877665544" },
  { srNo: 7, memberId: "SM223344", name: "Manoj Yadav",   directs: 1, joiningDate: "12-Jul-2025", mobileNo: "7766554433" },
];

export default function DirectMembersPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [pageSize,     setPageSize]     = useState(20);
  const [filtered,     setFiltered]     = useState<Member[]>([]);
  const [hasFiltered,  setHasFiltered]  = useState(false);

  const handleFilter = () => {
    setFiltered(sampleData.slice(0, pageSize));
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

        .dm-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

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

        .filter-date {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px;
          transition:border-color .18s; min-width:170px;
        }
        .filter-date:focus { border-color:#26a69a; box-shadow:0 0 0 2px rgba(38,166,154,0.1); }

        .filter-page {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px;
          min-width:90px; cursor:pointer;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 10px center;
          padding-right:28px;
          transition:border-color .18s;
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

        /* Page size right-aligned */
        .page-size-right { margin-left:auto; }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table { width:100%; border-collapse:collapse; font-size:13px; min-width:700px; }
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

        /* Directs badge */
        .directs-badge {
          display:inline-block;
          background:#e3f2fd;
          color:#1565c0;
          font-weight:700;
          font-size:12.5px;
          padding:3px 12px;
          border-radius:20px;
          min-width:32px;
          text-align:center;
        }
        .directs-badge.zero { background:#f5f5f5; color:#999; }

        /* Empty state */
        .empty-state { text-align:center; padding:36px 20px; color:#aaa; font-size:13.5px; }
        .empty-state svg { margin:0 auto 10px; display:block; opacity:0.35; }

        /* Record count */
        .record-count { padding:8px 16px; font-size:12.5px; color:#666; border-top:1px solid #f0f0f0; text-align:right; }
      `}</style>

      <div className="dm-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="#">Home</a>
          <span className="sep">/</span>
          <a href="#">My Network</a>
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

              <button className="filter-btn" onClick={handleFilter}>Filter</button>

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
                  {hasFiltered && filtered.length > 0 ? (
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
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                          </svg>
                          <p>{hasFiltered ? "No direct members found." : "Please use the filter above to view direct members."}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasFiltered && filtered.length > 0 && (
              <div className="record-count">
                Showing {filtered.length} member{filtered.length !== 1 ? "s" : ""}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}