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
  total: number;
  adminProcessing: number;
}

export default function AdminProcessingPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cycle,        setCycle]        = useState("--All--");
  const [data,         setData]         = useState<PayoutRow[]>([]);
  const [allPayments,  setAllPayments]  = useState<PayoutRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/user/get-success-payments");
        if (!response.ok) throw new Error("Failed to fetch data");
        const result = await response.json();
        const payments = result.payments || [];
        setAllPayments(payments);
        setData(payments);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilter = () => {
    setData([...allPayments]);
  };

  const totalAdmin = data.reduce((s, r) => s + r.adminProcessing, 0);

  const handleExportCSV = () => {
    const header = "Sr.No.,Payout Date,Total,Admin and Processing";
    const rows   = data.map(r =>
      `${r.srNo},"${r.fromDate.split(' ')[0]}",${r.total},${r.adminProcessing}`
    ).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "admin-processing.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        .pp-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }
        .green-bar { height:8px; background:linear-gradient(90deg,#00c853,#1de9b6); }
        .breadcrumb { padding:12px 20px; font-size:13px; color:#555; display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:#555; text-decoration:none; }
        .breadcrumb .sep { color:#999; }
        .page-body { padding:0 10px 40px; }
        @media(min-width:768px) { .page-body { padding:0 20px 40px; } }
        .main-card { background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.07); }
        .section-header { background:linear-gradient(90deg,#26a69a,#1de9b6); padding:10px 14px; display:flex; align-items:center; justify-content:space-between; }
        @media(min-width:768px) { .section-header { padding:12px 16px; } }
        .section-title { font-size:12px; font-weight:700; color:#fff; letter-spacing:0.8px; text-transform:uppercase; }
        @media(min-width:768px) { .section-title { font-size:13px; } }
        .header-actions { display:flex; align-items:center; gap:8px; }
        .icon-btn { background:rgba(255,255,255,0.2); border:none; border-radius:5px; padding:5px 8px; cursor:pointer; color:#fff; display:flex; align-items:center; transition:background .18s; }
        .icon-btn:hover { background:rgba(255,255,255,0.35); }
        .icon-btn-excel { background:rgba(0,160,60,0.55); }
        .icon-btn-excel:hover { background:rgba(0,160,60,0.75); }
        .filter-area { padding:16px 16px 10px; }
        .filter-label { font-size:13px; font-weight:500; color:#333; margin-bottom:6px; display:block; }
        .filter-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:14px; }
        .cycle-select { border:1px solid #d0d0d0; border-radius:5px; padding:9px 12px; font-size:13px; font-family:'Poppins',sans-serif; color:#333; background:#fff; outline:none; height:40px; flex: 1; min-width:180px; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:30px; }
        @media(min-width:768px) { .cycle-select { flex: none; min-width:220px; } }
        .filter-btn { background:#1976d2; color:#fff; border:none; border-radius:6px; padding:0 20px; height:40px; font-size:14px; font-weight:600; cursor:pointer; flex: 1; }
        @media(min-width:768px) { .filter-btn { padding:0 28px; flex: none; } }
        .total-summary { font-size:14px; font-weight:700; color:#1a1a2e; padding:2px 16px 14px; }
        .total-summary span { color:#26a69a; }
        .table-wrap { overflow-x:auto; -webkit-overflow-scrolling: touch; border-top:1px solid #f0f0f0; }
        .data-table { width:100%; border-collapse:collapse; font-size:12px; min-width:800px; }
        @media(min-width:768px) { .data-table { font-size:13px; } }
        .data-table thead tr { background:#3d6b9e; }
        .data-table thead th { padding:10px 12px; text-align:left; color:#fff; font-weight:600; font-size:12px; white-space:nowrap; }
        @media(min-width:768px) { .data-table thead th { padding:13px 14px; font-size:13px; } }
        .data-table tbody td { padding:10px 12px; color:#333; font-size:12px; vertical-align:middle; border-bottom:1px solid #e8e8e8; }
        @media(min-width:768px) { .data-table tbody td { padding:13px 14px; font-size:13px; } }
        .num-bold { font-weight:700; color:#333; }
        .num-admin { color:#f57c00; font-weight:600; }
        .table-footer { padding:10px 16px; font-size:12.5px; color:#666; border-top:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; }
        .footer-total { font-weight:700; color:#26a69a; font-size:13px; }
      `}</style>

      <div className="pp-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />
        <div className="green-bar" />

        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span>Daily Payout</span>
          <span className="sep">/</span>
          <span>Admin & Processing</span>
        </div>

        <div className="page-body">
          <div className="main-card">
            <div className="section-header">
              <span className="section-title">Admin & Processing Report</span>
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
              <label className="filter-label">Payout Cycle</label>
              <div className="filter-row">
                <select className="cycle-select" value={cycle} onChange={(e) => setCycle(e.target.value)}>
                  {payoutCycles.map(c => <option key={c}>{c}</option>)}
                </select>
                <button className="filter-btn" onClick={handleFilter}>Filter</button>
              </div>
            </div>

            <div className="total-summary">
              Total Admin Charges : <span>₹{totalAdmin.toLocaleString("en-IN")}</span>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sr.No.</th>
                    <th>Payout Date</th>
                    <th>Total Amount</th>
                    <th>Admin and Processing (15%)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>Loading...</td></tr>
                  ) : data.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#999" }}>No records found</td></tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.srNo}>
                        <td>{row.srNo}</td>
                        <td>{row.fromDate.split(' ')[0]}</td>
                        <td className="num-bold">₹{row.total.toLocaleString("en-IN")}</td>
                        <td className="num-admin">₹{row.adminProcessing.toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && (
              <div className="table-footer">
                <span>Showing {data.length} records</span>
                <span className="footer-total">Total Admin: ₹{totalAdmin.toLocaleString("en-IN")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
