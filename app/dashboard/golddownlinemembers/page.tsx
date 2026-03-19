"use client";

import { useState } from "react";

const pageSizes = [10, 20, 50, 100];

interface Member {
  srNo: number;
  memberId: string;
  name: string;
  date: string;
  position: "Left" | "Right";
}

const sampleData: Member[] = [
  { srNo: 1, memberId: "SM112233", name: "Rahul Sharma",   date: "10-Jan-2026", position: "Left"  },
  { srNo: 2, memberId: "SM445566", name: "Priya Singh",    date: "23-Oct-2025", position: "Right" },
  { srNo: 3, memberId: "SM778899", name: "Amit Verma",     date: "01-Oct-2025", position: "Left"  },
  { srNo: 4, memberId: "SM334455", name: "Sunita Devi",    date: "20-Sep-2025", position: "Right" },
  { srNo: 5, memberId: "SM667788", name: "Vijay Kumar",    date: "18-Sep-2025", position: "Left"  },
  { srNo: 6, memberId: "SM990011", name: "Neha Gupta",     date: "05-Aug-2025", position: "Right" },
  { srNo: 7, memberId: "SM223344", name: "Manoj Yadav",    date: "12-Jul-2025", position: "Left"  },
  { srNo: 8, memberId: "SM556677", name: "Kavita Mishra",  date: "30-Jun-2025", position: "Right" },
];

export default function GoldDownlineMembersPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fromDate,     setFromDate]     = useState("");
  const [toDate,       setToDate]       = useState("");
  const [position,     setPosition]     = useState<"" | "Left" | "Right">("");
  const [pageSize,     setPageSize]     = useState(20);
  const [filtered,     setFiltered]     = useState<Member[]>([]);
  const [hasFiltered,  setHasFiltered]  = useState(false);

  const handleFilter = () => {
    let data = [...sampleData];
    if (position) data = data.filter(d => d.position === position);
    setFiltered(data.slice(0, pageSize));
    setHasFiltered(true);
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const header = "Sr.No.,Member ID,Name,Date,Position";
    const rows   = filtered.map(r =>
      `${r.srNo},${r.memberId},${r.name},${r.date},${r.position}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "gold-downline-members.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .gd-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        /* NAV */
        .topnav {
          background:#fff; height:52px;
          display:flex; align-items:center; justify-content:space-between;
          padding:0 20px; border-bottom:3px solid #1de9b6;
          position:sticky; top:0; z-index:100;
          box-shadow:0 1px 6px rgba(0,0,0,0.08);
        }
        .hamburger { display:flex; flex-direction:column; gap:4px; cursor:pointer; }
        .hamburger span { width:22px; height:2px; background:#555; border-radius:2px; }
        .topnav-right { display:flex; align-items:center; gap:10px; position:relative; }
        .user-name { font-size:13.5px; font-weight:500; color:#333; cursor:pointer; }
        .user-avatar {
          width:36px; height:36px; border-radius:50%;
          background:linear-gradient(135deg,#ff9800 50%,#5c6bc0 50%);
          cursor:pointer; border:2px solid #e0e0e0; flex-shrink:0;
        }

        /* DROPDOWN */
        .dropdown {
          position:absolute; top:46px; right:0; background:#fff;
          border:1px solid #e0e0e0; border-radius:6px; width:200px;
          box-shadow:0 4px 20px rgba(0,0,0,0.12); z-index:200; overflow:hidden;
        }
        .dropdown-header { padding:12px 16px; font-size:13px; font-weight:600; color:#333; border-bottom:1px solid #f0f0f0; }
        .dropdown-item { display:flex; align-items:center; gap:10px; padding:10px 16px; font-size:13px; color:#444; cursor:pointer; transition:background .15s; }
        .dropdown-item:hover { background:#f5f5f5; }
        .dropdown-item.red { color:#e53935; }

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
        .note-text { color:#f57c00; font-size:13.5px; font-weight:600; padding:16px 16px 14px; line-height:1.5; }

        /* FILTER ROW — all inline: From Date | To Date | Position | Filter | Page Size */
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

        /* Position radio — ○LEFT ○RIGHT */
        .position-radio-box {
          display:flex; align-items:center;
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
        .radio-label input[type="radio"] { accent-color:#1976d2; width:14px; height:14px; cursor:pointer; }

        .filter-btn {
          background:#1976d2; color:#fff; border:none; border-radius:6px;
          padding:0 28px; height:40px; font-size:14px; font-weight:600;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition:background .18s, transform .15s; white-space:nowrap;
        }
        .filter-btn:hover { background:#1565c0; transform:translateY(-1px); }
        .filter-btn:active { transform:scale(0.98); }

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
        .data-table { width:100%; border-collapse:collapse; font-size:13px; min-width:500px; }
        .data-table thead tr { background:#3d6b9e; }
        .data-table thead th {
          padding:13px 16px; text-align:left;
          color:#fff; font-weight:600; font-size:13px; white-space:nowrap;
        }
        .data-table tbody tr:nth-child(odd)  { background:#f5f5f5; }
        .data-table tbody tr:nth-child(even) { background:#fff; }
        .data-table tbody tr:hover { background:#fffde7; transition:background .15s; }
        .data-table tbody td {
          padding:12px 16px; color:#333;
          border-bottom:1px solid #eee; font-size:13px; white-space:nowrap;
        }

        /* Gold member ID styling */
        .gold-id {
          color:#f57c00;
          font-weight:600;
          display:flex; align-items:center; gap:5px;
        }
        .gold-star { color:#ffc107; font-size:14px; }

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
      `}</style>

      <div className="gd-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* TOP NAV */}
        <nav className="topnav">
          <div className="hamburger"><span /><span /><span /></div>
          <div className="topnav-right" onClick={(e) => e.stopPropagation()}>
            <span className="user-name" onClick={() => setDropdownOpen(!dropdownOpen)}>
              ajay kumar ( Sm674643 )
            </span>
            <div className="user-avatar" onClick={() => setDropdownOpen(!dropdownOpen)} />
            {dropdownOpen && (
              <div className="dropdown">
                <div className="dropdown-header">Welcome, Sm674643</div>
                <div className="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#4caf50"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                  Profile
                </div>
                <div className="dropdown-item red">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#e53935"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
                  Logout
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Green bar */}
        <div className="green-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="#">Home</a>
          <span className="sep">/</span>
          <a href="#">My Network</a>
          <span className="sep">/</span>
          <span>Gold Downline Members</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Downline Members</span>
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

              {/* Position radio ○LEFT ○RIGHT */}
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
              <button className="filter-btn" onClick={handleFilter}>Filter</button>

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
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {hasFiltered && filtered.length > 0 ? (
                    filtered.map((row) => (
                      <tr key={row.srNo}>
                        <td>{row.srNo}</td>
                        <td>
                          <span className="gold-id">
                            <span className="gold-star">★</span>
                            {row.memberId}
                          </span>
                        </td>
                        <td>{row.name}</td>
                        <td>{row.date}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state">
                          <svg width="42" height="42" viewBox="0 0 24 24" fill="#ccc">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <p>{hasFiltered ? "No gold downline members found." : "Please use the filter above to view gold downline members."}</p>
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