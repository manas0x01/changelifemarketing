"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  basicIncome: number;
  boosterIncome: number;
  total: number;
  adminProcessing: number;
  tds: number;
  netpay: number;
  userId: string;
}

export default function SuccessPaymentsPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cycle,        setCycle]        = useState("--All--");
  const [data,         setData]         = useState<PayoutRow[]>([]);
  const [allPayments,  setAllPayments]  = useState<PayoutRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [filtered,     setFiltered]     = useState(false);

  useEffect(() => {
    const fetchSuccessPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/get-success-payments");
        if (!response.ok) {
          throw new Error("Failed to fetch success payments");
        }
        const result = await response.json();
        let payments = [];
        
        if (Array.isArray(result)) {
          payments = result;
        } else if (result?.payments && Array.isArray(result.payments)) {
          payments = result.payments;
        } else if (result?.data?.payments && Array.isArray(result.data.payments)) {
          payments = result.data.payments;
        } else if (result?.data && Array.isArray(result.data)) {
          payments = result.data;
        }
        
        if (!Array.isArray(payments)) {
          throw new Error(`Invalid response format - expected array, got ${typeof payments}`);
        }
        
        setAllPayments(payments);
        setData(payments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchSuccessPayments();
  }, []);

  const handleFilter = () => {
    if (cycle === "--All--") {
      setData([...allPayments]);
    } else {
      // Filter by cycle (if cycle categorization is available in data)
      // For now, showing all payments as cycle field is not in the data model
      setData([...allPayments]);
      // TODO: Implement cycle-based filtering once cycle field is added to successPayments
    }
    setFiltered(true);
  };

  const totalNetPay = Array.isArray(data) ? data.reduce((s, r) => s + r.netpay, 0) : 0;

  const handleExportCSV = () => {
    const header = "Sr.No.,From Date,To Date,Basic,Booster,Total,Admin & Processing,TDS,Netpay";
    const rows   = data.map(r =>
      `${r.srNo},"${r.fromDate}","${r.toDate}",${r.basicIncome},${r.boosterIncome},${r.total},${r.adminProcessing},${r.tds},${r.netpay}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "success-payments.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .pp-root {
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
        .page-body { padding:0 10px 40px; }
        @media(min-width:768px) { .page-body { padding:0 20px 40px; } }

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
        .icon-btn-excel { background: rgba(0,200,80,0.15); border-color: rgba(0,200,80,0.35); color: #00ff88; }
        .icon-btn-excel:hover { background: rgba(0,200,80,0.35); border-color: #00ff88; }

        /* FILTER AREA */
        .filter-area { padding:20px 20px 10px; }
        .filter-label { font-size:12.5px; font-weight:600; color:rgba(255,233,124,0.7); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom:6px; display:block; }

        .filter-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:14px; }

        .cycle-select {
          border: 1.5px solid rgba(255,233,124,0.25); border-radius:6px;
          padding:9px 12px; font-size:13px;
          font-family:'Poppins',sans-serif; color:#ffe97c;
          background: rgba(0,0,0,0.25); outline:none; height:40px; flex: 1; min-width:180px;
          cursor:pointer; transition: all 0.2s;
          appearance:none; -webkit-appearance:none;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat:no-repeat; background-position:right 10px center; padding-right:30px;
        }
        @media(min-width:768px) { .cycle-select { flex: none; min-width:220px; } }
        .cycle-select:focus { border-color:#ffe97c; box-shadow:0 0 10px rgba(255,233,124,0.2); }

        .filter-btn {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          color:#120228; border:none; border-radius:6px;
          padding:0 20px; height:40px; font-size:14px; font-weight:800;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition: all 0.2s, transform .15s;
          flex: 1;
          box-shadow: 0 4px 12px rgba(255,233,124,0.2);
        }
        @media(min-width:768px) { .filter-btn { padding:0 28px; flex: none; } }
        .filter-btn:hover { background: linear-gradient(135deg, #FFE042 0%, #f0b500 100%); transform:translateY(-1px); }
        .filter-btn:active { transform:scale(0.98); }

        /* TOTAL NET PAY */
        .total-netpay {
          font-size:15px; font-weight:700; color:rgba(255,233,124,0.85);
          padding:2px 20px 16px;
        }
        .total-netpay span { color:#ffe97c; text-shadow: 0 0 8px rgba(255,233,124,0.3); font-size: 17px; }

        /* TABLE */
        .table-wrap { overflow-x:auto; -webkit-overflow-scrolling: touch; }
        .data-table { width:100%; border-collapse:collapse; font-size:12px; min-width:950px; }
        @media(min-width:768px) { .data-table { font-size:13px; } }
        .data-table thead tr { background: rgba(0, 0, 0, 0.35); border-bottom: 2px solid rgba(255,233,124,0.22); }
        .data-table thead th {
          padding:14px 16px; text-align:left;
          color:#ffe97c; font-weight:700; font-size:13px;
          white-space:nowrap; text-transform:uppercase; letter-spacing:0.8px;
        }
        .data-table tbody tr:nth-child(odd)  { background: rgba(29, 3, 58, 0.35); }
        .data-table tbody tr:nth-child(even) { background: rgba(17, 1, 34, 0.35); }
        .data-table tbody tr:hover { background: rgba(255,233,124,0.06); transition:background .15s; }
        .data-table tbody td {
          padding:13px 16px; color:#ffffff;
          border-bottom:1px solid rgba(255,233,124,0.12); font-size:13px; white-space:nowrap;
          vertical-align:middle;
        }

        /* Invoice button */
        .invoice-btn {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          color:#120228; border:none;
          border-radius:20px; padding:6px 18px;
          font-size:11.5px; font-weight:800;
          font-family:'Poppins',sans-serif;
          cursor:pointer; white-space:nowrap;
          transition: all 0.2s, transform .15s;
          box-shadow: 0 4px 10px rgba(255,233,124,0.18);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .invoice-btn:hover { background: linear-gradient(135deg, #FFE042 0%, #f0b500 100%); transform:translateY(-1px) scale(1.02); }

        /* Numeric cells */
        .num-silver { color:#d8b4fe; font-weight:600; }
        .num-gold   { color:#ffe97c; font-weight:700; }
        .num-total  { font-weight:700; color:#fff; }
        .num-reimb  { color:#f472b6; font-weight:600; }
        .num-tds    { color:#ff4444; font-weight:600; }
        .num-net    { font-weight:800; color:#00ff88; font-size:14px; text-shadow: 0 0 4px rgba(0,255,136,0.2); }

        /* Footer */
        .table-footer {
          padding:14px 20px; font-size:12.5px; color:rgba(255,233,124,0.6);
          border-top:1.5px solid rgba(255,233,124,0.22);
          display:flex; justify-content:space-between; align-items:center;
          background: rgba(0,0,0,0.15);
        }
        .footer-total { font-weight:800; color:#ffe97c; font-size:13.5px; }

        /* Skeleton Loader */
        @keyframes skeletonShimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .skeleton-row {
          background: linear-gradient(90deg, rgba(29,3,58,0.5) 25%, rgba(168,85,247,0.2) 50%, rgba(29,3,58,0.5) 75%);
          background-size: 1000px 100%;
          animation: skeletonShimmer 2s infinite;
        }
        .skeleton-row td { padding: 13px 16px; }
        .skeleton-cell { height: 20px; background: rgba(255,233,124,0.1); border-radius: 4px; }

        /* Error state */
        .error-container {
          padding: 20px;
          text-align: center;
          color: #ff8888;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(239, 68, 68, 0.12);
          border-bottom: 1.5px solid rgba(239, 68, 68, 0.35);
        }
        .error-container svg { width: 20px; height: 20px; }
      `}</style>

      <div className="pp-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* NAVBAR COMPONENT */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* Gold bar */}
        <div className="gold-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffe97c"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span>Daily Payout</span>
          <span className="sep">/</span>
          <span className="current">Success Payments</span>
        </div>

        <div className="page-body">
          <div className="main-card">

            {/* HEADER */}
            <div className="section-header">
              <span className="section-title">Success Payments</span>
              <div className="header-actions">
                <button className="icon-btn" title="Print" onClick={() => window.print()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffe97c"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                </button>
                <button className="icon-btn icon-btn-excel" title="Export CSV" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#00ff88"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 18l-1.5-2.5L5.5 18H4l2-3.5L4 11h1.5l1.5 2.5L8.5 11H10l-2 3.5 2 3.5H8.5zm5.5 0h-1v-5h-1.5v-1H15v1h-1v5zm3.5 0h-3v-6h1v5h2v1z"/></svg>
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
              Total NetPay : <span>₹{totalNetPay.toLocaleString("en-IN")}</span>
            </div>

            {/* ERROR STATE */}
            {error && !loading && (
              <div className="error-container">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                <span>{error}</span>
              </div>
            )}

            {/* TABLE */}
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Sr.No.</th>
                    <th>From Date</th>
                    <th>To Date</th>
                    <th>Basic</th>
                    <th>Booster</th>
                    <th>Total</th>
                    <th>Admin and Processing</th>
                    <th>TDS</th>
                    <th>Netpay</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <tr key={`skeleton-${i}`} className="skeleton-row">
                          <td><div className="skeleton-cell" style={{ height: "32px", borderRadius:"20px" }} /></td>
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
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: "center", padding: "45px", color: "rgba(255,233,124,0.5)" }}>
                        No success payments found
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.srNo}>
                        <td>
                          <button 
                            className="invoice-btn" 
                            onClick={() => router.push(`/dashboard/invoice?userId=${row.userId}`)}
                          >
                            Invoice
                          </button>
                        </td>
                        <td>{row.srNo}</td>
                        <td style={{ whiteSpace: "pre-line", minWidth: 160 }}>{row.fromDate}</td>
                        <td style={{ whiteSpace: "pre-line", minWidth: 160 }}>{row.toDate}</td>
                        <td><span className="num-silver">₹{row.basicIncome.toLocaleString("en-IN")}</span></td>
                        <td><span className="num-gold">₹{row.boosterIncome.toLocaleString("en-IN")}</span></td>
                        <td><span className="num-total">₹{row.total.toLocaleString("en-IN")}</span></td>
                        <td><span className="num-reimb">₹{row.adminProcessing.toLocaleString("en-IN")}</span></td>
                        <td><span className="num-tds">₹{row.tds.toLocaleString("en-IN")}</span></td>
                        <td><span className="num-net">₹{row.netpay.toLocaleString("en-IN")}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* FOOTER */}
            {!loading && (
              <div className="table-footer">
                <span>Showing {data.length} records</span>
                <span className="footer-total">
                  Total NetPay: ₹{totalNetPay.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}