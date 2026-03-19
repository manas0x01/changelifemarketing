"use client";

import { useState } from "react";

const payoutCycles = ["--All--", "Daily Cycle", "Weekly Cycle", "Monthly Cycle"];

interface ReimRow {
  srNo: number;
  payoutDate: string;
  total: number;
  reimbursement: number;
}

const allData: ReimRow[] = [
  { srNo: 1,  payoutDate: "21 Sep 2024 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 2,  payoutDate: "30 Oct 2024 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 3,  payoutDate: "05 Nov 2024 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 4,  payoutDate: "10 Nov 2024 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 5,  payoutDate: "13 Nov 2024 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 6,  payoutDate: "20 Nov 2024 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 7,  payoutDate: "22 Dec 2024 12:00:00", total: 1500, reimbursement: 270 },
  { srNo: 8,  payoutDate: "28 Dec 2024 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 9,  payoutDate: "05 Jan 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 10, payoutDate: "12 Jan 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 11, payoutDate: "20 Jan 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 12, payoutDate: "28 Jan 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 13, payoutDate: "04 Feb 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 14, payoutDate: "12 Feb 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 15, payoutDate: "20 Feb 2025 12:00:00", total: 1500, reimbursement: 270 },
  { srNo: 16, payoutDate: "28 Feb 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 17, payoutDate: "08 Mar 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 18, payoutDate: "16 Mar 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 19, payoutDate: "24 Mar 2025 12:00:00", total: 1500, reimbursement: 270 },
  { srNo: 20, payoutDate: "01 Apr 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 21, payoutDate: "09 Apr 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 22, payoutDate: "17 Apr 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 23, payoutDate: "25 Apr 2025 12:00:00", total: 1500, reimbursement: 270 },
  { srNo: 24, payoutDate: "03 May 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 25, payoutDate: "11 May 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 26, payoutDate: "19 May 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 27, payoutDate: "27 May 2025 12:00:00", total: 1500, reimbursement: 270 },
  { srNo: 28, payoutDate: "04 Jun 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 29, payoutDate: "12 Jun 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 30, payoutDate: "20 Jun 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 31, payoutDate: "28 Jun 2025 12:00:00", total: 1500, reimbursement: 270 },
  { srNo: 32, payoutDate: "06 Jul 2025 12:00:00", total: 1500, reimbursement: 225 },
  { srNo: 33, payoutDate: "14 Jul 2025 12:00:00", total: 1500, reimbursement: 225 },
];

export default function ReimbursementPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cycle,        setCycle]        = useState("--All--");
  const [data,         setData]         = useState<ReimRow[]>(allData);

  const totalAdminCharge = data.reduce((s, r) => s + r.reimbursement, 0);

  const handleFilter = () => setData([...allData]);

  const handleExportCSV = () => {
    const header = "Sr.No.,Payout Date,Total,Reimbursement of Expenditure";
    const rows   = data.map(r => `${r.srNo},"${r.payoutDate}",${r.total},${r.reimbursement}`).join("\n");
    const blob   = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a"); a.href = url; a.download = "reimbursement-of-expenditure.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .re-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

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

        .dropdown {
          position:absolute; top:46px; right:0; background:#fff;
          border:1px solid #e0e0e0; border-radius:6px; width:200px;
          box-shadow:0 4px 20px rgba(0,0,0,0.12); z-index:200; overflow:hidden;
        }
        .dropdown-header { padding:12px 16px; font-size:13px; font-weight:600; color:#333; border-bottom:1px solid #f0f0f0; }
        .dropdown-item { display:flex; align-items:center; gap:10px; padding:10px 16px; font-size:13px; color:#444; cursor:pointer; transition:background .15s; }
        .dropdown-item:hover { background:#f5f5f5; }
        .dropdown-item.red { color:#e53935; }

        .green-bar { height:8px; background:linear-gradient(90deg,#00c853,#1de9b6); }

        .breadcrumb { padding:12px 20px; font-size:13px; color:#555; display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:#555; text-decoration:none; }
        .breadcrumb a:hover { text-decoration:underline; }
        .breadcrumb .sep { color:#999; }

        .page-body { padding:0 20px 40px; }

        .main-card { background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.07); }

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
        .icon-btn-excel { background:rgba(0,160,60,0.55); }
        .icon-btn-excel:hover { background:rgba(0,160,60,0.75); }

        .filter-area { padding:16px 16px 10px; }
        .filter-label-text { font-size:13px; font-weight:500; color:#333; margin-bottom:6px; display:block; }
        .filter-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:14px; }

        .cycle-select {
          border:1px solid #d0d0d0; border-radius:5px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#333;
          background:#fff; outline:none; height:40px; min-width:220px;
          cursor:pointer; transition:border-color .18s;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 10px center; padding-right:30px;
        }
        .cycle-select:focus { border-color:#26a69a; box-shadow:0 0 0 2px rgba(38,166,154,0.1); }

        .filter-btn {
          background:#1976d2; color:#fff; border:none; border-radius:6px;
          padding:0 28px; height:40px; font-size:14px; font-weight:600;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition:background .18s, transform .15s;
        }
        .filter-btn:hover { background:#1565c0; transform:translateY(-1px); }
        .filter-btn:active { transform:scale(0.98); }

        .total-admin {
          font-size:14px; font-weight:700; color:#1a1a2e;
          padding:2px 16px 14px;
        }
        .total-admin span { color:#7b1fa2; }

        .table-wrap { overflow-x:auto; }
        .data-table { width:100%; border-collapse:collapse; font-size:13px; min-width:500px; }
        .data-table thead tr { background:#3d6b9e; }
        .data-table thead th {
          padding:13px 20px; text-align:left;
          color:#fff; font-weight:600; font-size:13px; white-space:nowrap;
        }
        .data-table tbody tr { border-bottom:1px solid #e8e8e8; }
        .data-table tbody tr:hover { background:#f3e5f5; transition:background .15s; }
        .data-table tbody td { padding:16px 20px; color:#333; font-size:13px; }

        .num-total { font-weight:600; color:#1976d2; }
        .num-reimb  { font-weight:700; color:#7b1fa2; font-size:13.5px; }

        .total-row td {
          background:#f3e5f5 !important;
          font-weight:700; border-top:2px solid #7b1fa2; color:#4a148c;
          padding:13px 20px;
        }

        .table-footer {
          padding:10px 16px; font-size:12.5px; color:#666;
          border-top:1px solid #f0f0f0;
          display:flex; justify-content:space-between; align-items:center;
        }
        .footer-total { font-weight:700; color:#7b1fa2; font-size:13px; }
      `}</style>

      <div className="re-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

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

        <div className="green-bar" />

        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span >Daily Payout</span>
          <span className="sep">/</span>
          <span>Reimbursement of Expenditure</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            <div className="section-header">
              <span className="section-title">Reimbursement of Expenditure</span>
              <div className="header-actions">
                <button className="icon-btn" title="Print" onClick={() => window.print()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                </button>
                <button className="icon-btn icon-btn-excel" title="Export CSV" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 18l-1.5-2.5L5.5 18H4l2-3.5L4 11h1.5l1.5 2.5L8.5 11H10l-2 3.5 2 3.5H8.5zm5.5 0h-1v-5h-1.5v-1H15v1h-1v5zm3.5 0h-3v-6h1v5h2v1z"/></svg>
                </button>
              </div>
            </div>

            <div className="filter-area">
              <span className="filter-label-text">Payout Cycle</span>
              <div className="filter-row">
                <select className="cycle-select" value={cycle} onChange={(e) => setCycle(e.target.value)}>
                  {payoutCycles.map(c => <option key={c}>{c}</option>)}
                </select>
                <button className="filter-btn" onClick={handleFilter}>Filter</button>
              </div>
            </div>

            <div className="total-admin">
              Total Admin Charge : <span>{totalAdminCharge}</span>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Payout Date</th>
                    <th>Total</th>
                    <th>Reimbursement of Expenditure</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.srNo}>
                      <td>{row.srNo}</td>
                      <td>{row.payoutDate}</td>
                      <td><span className="num-total">{row.total}</span></td>
                      <td><span className="num-reimb">{row.reimbursement}</span></td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={2}><strong>Total</strong></td>
                    <td><span className="num-total">{data.reduce((s, r) => s + r.total, 0)}</span></td>
                    <td><span className="num-reimb">{totalAdminCharge}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing {data.length} records</span>
              <span className="footer-total">Total Admin Charge: {totalAdminCharge}</span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}