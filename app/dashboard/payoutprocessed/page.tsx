"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

const payoutCycles = [
  "--All--",
  "Daily Cycle",
  "Weekly Cycle",
  "Monthly Cycle",
];

interface PayoutRow {
  srNo: number;
  fromDate: string;
  toDate: string;
  silverBinary: number;
  goldBinary: number;
  total: number;
  reimbursement: number;
  tds: number;
  netpay: number;
}

const allData: PayoutRow[] = [
  { srNo: 1,  fromDate: "1/10/2026 12:00:00 PM",   toDate: "1/10/2026 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 2,  fromDate: "10/23/2025 12:00:00 PM",  toDate: "10/23/2025 11:59:59 PM",  silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 3,  fromDate: "10/1/2025 12:00:00 PM",   toDate: "10/1/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 4,  fromDate: "9/20/2025 12:00:00 PM",   toDate: "9/20/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 5,  fromDate: "9/18/2025 12:00:00 PM",   toDate: "9/18/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 6,  fromDate: "9/17/2025 12:00:00 AM",   toDate: "9/17/2025 11:59:59 AM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 7,  fromDate: "9/9/2025 12:00:00 PM",    toDate: "9/9/2025 11:59:59 PM",    silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 8,  fromDate: "9/5/2025 12:00:00 PM",    toDate: "9/5/2025 11:59:59 PM",    silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 9,  fromDate: "9/3/2025 12:00:00 AM",    toDate: "9/3/2025 11:59:59 AM",    silverBinary: 0,    goldBinary: 1500, total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 10, fromDate: "8/30/2025 12:00:00 PM",   toDate: "8/30/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 11, fromDate: "8/26/2025 12:00:00 PM",   toDate: "8/26/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 12, fromDate: "8/20/2025 12:00:00 PM",   toDate: "8/20/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 13, fromDate: "8/13/2025 12:00:00 AM",   toDate: "8/13/2025 11:59:59 AM",   silverBinary: 0,    goldBinary: 1500, total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 14, fromDate: "8/7/2025 12:00:00 PM",    toDate: "8/7/2025 11:59:59 PM",    silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 15, fromDate: "7/28/2025 12:00:00 PM",   toDate: "7/28/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 16, fromDate: "7/20/2025 12:00:00 AM",   toDate: "7/20/2025 11:59:59 AM",   silverBinary: 500,  goldBinary: 1000, total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 17, fromDate: "7/10/2025 12:00:00 PM",   toDate: "7/10/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 18, fromDate: "6/30/2025 12:00:00 PM",   toDate: "6/30/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 19, fromDate: "6/22/2025 12:00:00 PM",   toDate: "6/22/2025 11:59:59 PM",   silverBinary: 0,    goldBinary: 1500, total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 20, fromDate: "6/14/2025 12:00:00 PM",   toDate: "6/14/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 21, fromDate: "6/5/2025 12:00:00 PM",    toDate: "6/5/2025 11:59:59 PM",    silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 22, fromDate: "5/28/2025 12:00:00 PM",   toDate: "5/28/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 23, fromDate: "5/18/2025 12:00:00 AM",   toDate: "5/18/2025 11:59:59 AM",   silverBinary: 0,    goldBinary: 1500, total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 24, fromDate: "5/9/2025 12:00:00 PM",    toDate: "5/9/2025 11:59:59 PM",    silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 25, fromDate: "4/29/2025 12:00:00 PM",   toDate: "4/29/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 26, fromDate: "4/18/2025 12:00:00 PM",   toDate: "4/18/2025 11:59:59 PM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 27, fromDate: "4/7/2025 12:00:00 PM",    toDate: "4/7/2025 11:59:59 PM",    silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 28, fromDate: "3/27/2025 12:00:00 PM",   toDate: "3/27/2025 11:59:59 PM",   silverBinary: 0,    goldBinary: 1500, total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
  { srNo: 29, fromDate: "3/15/2025 12:00:00 AM",   toDate: "3/15/2025 11:59:59 AM",   silverBinary: 1500, goldBinary: 0,    total: 1500, reimbursement: 270, tds: 30, netpay: 1200 },
];

export default function PayoutProcessedPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cycle,        setCycle]        = useState("--All--");
  const [data,         setData]         = useState<PayoutRow[]>(allData);
  const [filtered,     setFiltered]     = useState(false);

  const handleFilter = () => {
    setData([...allData]);
    setFiltered(true);
  };

  const totalNetPay = data.reduce((s, r) => s + r.netpay, 0);

  const handleExportCSV = () => {
    const header = "Sr.No.,From Date,To Date,Silver Binary,Gold Binary,Total,Reimbursement of Expenditure,TDS,Netpay";
    const rows   = data.map(r =>
      `${r.srNo},"${r.fromDate}","${r.toDate}",${r.silverBinary},${r.goldBinary},${r.total},${r.reimbursement},${r.tds},${r.netpay}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "payout-processed.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .pp-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        /* Removed topnav styles - now using Navbar component */

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
        .icon-btn-excel { background:rgba(0,160,60,0.55); }
        .icon-btn-excel:hover { background:rgba(0,160,60,0.75); }

        /* FILTER AREA */
        .filter-area { padding:16px 16px 10px; }
        .filter-label { font-size:13px; font-weight:500; color:#333; margin-bottom:6px; display:block; }

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

        /* TOTAL NET PAY */
        .total-netpay {
          font-size:14px; font-weight:700; color:#1a1a2e;
          padding:2px 16px 14px;
        }
        .total-netpay span { color:#26a69a; }

        /* TABLE */
        .table-wrap { overflow-x:auto; }
        .data-table { width:100%; border-collapse:collapse; font-size:13px; min-width:1000px; }
        .data-table thead tr { background:#3d6b9e; }
        .data-table thead th {
          padding:13px 14px; text-align:left;
          color:#fff; font-weight:600; font-size:13px; white-space:nowrap;
        }
        .data-table tbody tr { border-bottom:1px solid #e8e8e8; }
        .data-table tbody tr:hover { background:#f0fdf4; transition:background .15s; }
        .data-table tbody td {
          padding:13px 14px; color:#333;
          font-size:13px;
          vertical-align:middle;
        }

        /* Invoice button */
        .invoice-btn {
          background:linear-gradient(90deg,#26a69a,#1de9b6);
          color:#fff; border:none;
          border-radius:20px; padding:6px 16px;
          font-size:12.5px; font-weight:600;
          font-family:'Poppins',sans-serif;
          cursor:pointer; white-space:nowrap;
          transition:opacity .18s, transform .15s;
          box-shadow:0 2px 6px rgba(38,166,154,0.3);
        }
        .invoice-btn:hover { opacity:0.88; transform:scale(1.04); }

        /* Numeric cells */
        .num-silver { color:#1976d2; font-weight:600; }
        .num-gold   { color:#f57c00; font-weight:600; }
        .num-total  { font-weight:700; color:#333; }
        .num-reimb  { color:#7b1fa2; font-weight:500; }
        .num-tds    { color:#e53935; font-weight:500; }
        .num-net    { font-weight:700; color:#1b5e20; font-size:13.5px; }

        /* Footer */
        .table-footer {
          padding:10px 16px; font-size:12.5px; color:#666;
          border-top:1px solid #f0f0f0;
          display:flex; justify-content:space-between; align-items:center;
        }
        .footer-total { font-weight:700; color:#26a69a; font-size:13px; }
      `}</style>

      <div className="pp-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* NAVBAR COMPONENT */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* Green bar */}
        <div className="green-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span >Daily Payout</span>
          <span className="sep">/</span>
          <span>Payout Processed</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Payout Processed</span>
              <div className="header-actions">
                <button className="icon-btn" title="Print" onClick={() => window.print()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                </button>
                <button className="icon-btn icon-btn-excel" title="Export CSV" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 18l-1.5-2.5L5.5 18H4l2-3.5L4 11h1.5l1.5 2.5L8.5 11H10l-2 3.5 2 3.5H8.5zm5.5 0h-1v-5h-1.5v-1H15v1h-1v5zm3.5 0h-3v-6h1v5h2v1z"/></svg>
                </button>
              </div>
            </div>

            {/* FILTER */}
            <div className="filter-area">
              <label className="filter-label">Payout Cycle</label>
              <div className="filter-row">
                <select
                  className="cycle-select"
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value)}
                >
                  {payoutCycles.map(c => <option key={c}>{c}</option>)}
                </select>
                <button className="filter-btn" onClick={handleFilter}>Filter</button>
              </div>
            </div>

            {/* TOTAL NET PAY */}
            <div className="total-netpay">
              Total NetPay : <span>{totalNetPay.toLocaleString("en-IN")}</span>
            </div>

            {/* TABLE */}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Sr.No.</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Silver Binary</th>
                    <th>Gold Binary</th>
                    <th>Total</th>
                    <th>Reimbursement of Expenditure</th>
                    <th>TDS</th>
                    <th>Netpay</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.srNo}>
                      <td>
                        <button className="invoice-btn" onClick={() => alert(`Invoice #${row.srNo}`)}>
                          Invoice
                        </button>
                      </td>
                      <td>{row.srNo}</td>
                      <td style={{ whiteSpace: "pre-line", minWidth: 160 }}>{row.fromDate}</td>
                      <td style={{ whiteSpace: "pre-line", minWidth: 160 }}>{row.toDate}</td>
                      <td><span className="num-silver">{row.silverBinary}</span></td>
                      <td><span className="num-gold">{row.goldBinary}</span></td>
                      <td><span className="num-total">{row.total}</span></td>
                      <td><span className="num-reimb">{row.reimbursement}</span></td>
                      <td><span className="num-tds">{row.tds}</span></td>
                      <td><span className="num-net">{row.netpay}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            <div className="table-footer">
              <span>Showing {data.length} records</span>
              <span className="footer-total">
                Total NetPay: ₹{totalNetPay.toLocaleString("en-IN")}
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}