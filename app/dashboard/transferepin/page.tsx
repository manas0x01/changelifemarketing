"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

type Step = "validate" | "transfer";

interface Transfer {
  date: string;
  dateISO?: string | null;
  time: string;
  ePin: string;
  package: string;
  transferredTo: string;
  transferredToName: string;
  status: "Success" | "Failed" | "Pending";
  remark: string;
}

const packages = ["-- Select Package --", "Agriculture Package", "Healthcare Package", "Sanitary Napkine"];

export default function TransferEPinPage() {
  const { data: session, status } = useSession();
  const [step,           setStep]           = useState<Step>("validate");
  const [txnPassword,    setTxnPassword]    = useState("");
  const [txnError,       setTxnError]       = useState("");
  const [loading,        setLoading]        = useState(false);
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [availablePins,  setAvailablePins]  = useState<any[]>([]);
  const [packageSelected, setPackageSelected] = useState("-- Select Package --");
  const [memberId,        setMemberId]        = useState("");
  const [memberName,      setMemberName]      = useState("");
  const [selectedPin,     setSelectedPin]     = useState("");
  const [remark,          setRemark]          = useState("");
  const [memberLoading,   setMemberLoading]   = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transfers,       setTransfers]       = useState<Transfer[]>([]);
  const [historyLoading,  setHistoryLoading]  = useState(false);
  const fetchTransferHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch("/api/user/get-transfer-history");
      const data = await response.json();
      if (response.ok && data.transfers) {
        setTransfers(data.transfers);
      } else {
        setTransfers([]);
      }
    } catch (error) {
      setTransfers([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTransferHistory();
    }
  }, [status]);

  const handleProceed = async () => {
    if (!txnPassword.trim()) {
      setTxnError("Please enter your transaction password.");
      return;
    }

    setLoading(true);
    setTxnError("");

    try {
      const response = await fetch("/api/user/verify-transaction-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionPassword: txnPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setTxnError(data.error || data.message || "Verification failed");
        setLoading(false);
        return;
      }
      setAvailablePins(data.pins || []);
      setStep("transfer");
    } catch (error) {
      setTxnError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberIdChange = async (value: string) => {
    setMemberId(value);
    
    if (!value.trim()) {
      setMemberName("");
      return;
    }

    setMemberLoading(true);
    try {
      const response = await fetch(`/api/user/get-member?id=${encodeURIComponent(value)}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setMemberName(data.memberName || "");
      } else {
        setMemberName("");
      }
    } catch (error) {
      setMemberName("");
    } finally {
      setMemberLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!packageSelected || packageSelected === "-- Select Package --") {
      toast.error("Please select a package");
      return;
    }
    if (!memberId.trim()) {
      toast.error("Please enter Member ID");
      return;
    }
    if (!memberName) {
      toast.error("Member not found. Please check the Member ID");
      return;
    }
    if (!selectedPin) {
      toast.error("Please select an E-Pin");
      return;
    }

    setTransferLoading(true);

    try {
      const response = await fetch("/api/user/transfer-epin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientMemberId: memberId,
          pin: selectedPin,
          packageSelected: packageSelected,
          remark: remark
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || data.message || "Transfer failed");
        return;
      }
      toast.success(data.message || "E-Pin Sent Successfully! ✓");
      await fetchTransferHistory();
      setPackageSelected("-- Select Package --");
      setMemberId("");
      setMemberName("");
      setSelectedPin("");
      setRemark("");
      setTxnPassword("");
      setStep("validate");
      setAvailablePins([]);

    } catch (error) {
      toast.error("An error occurred during transfer");
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .ep-root {
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
        .page-body {
          padding: 0 20px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── CENTERED CARD ── */
        .center-card, .history-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
          width: 100%;
          max-width: 740px;
          margin-bottom: 20px;
        }

        .section-header, .history-header {
          background: linear-gradient(90deg, rgba(255,233,124,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,233,124,0.25);
          padding: 13px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #ffe97c;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255,233,124,0.45);
        }

        /* ── VALIDATE BODY ── */
        .validate-body {
          padding: 22px 20px 24px;
        }
        .txn-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #ffe97c;
          margin-bottom: 10px;
          display: block;
        }
        .txn-label .req { color: #ffe97c; margin-right: 1px; }

        .txn-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .txn-input {
          flex: 1;
          min-width: 220px;
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          color: #ffe97c;
          background: rgba(0,0,0,0.25);
          outline: none;
          transition: border-color .18s, box-shadow .18s;
          height: 40px;
        }
        .txn-input::placeholder { color: rgba(255,233,124,0.4); }
        .txn-input:focus {
          border-color: #ffe97c;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,233,124,0.15);
        }

        .txn-error {
          color: #e53935;
          font-size: 12px;
          margin-top: 8px;
        }

        /* PROCEED BTN */
        .proceed-btn {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          color: #120228;
          border: none;
          border-radius: 6px;
          padding: 10px 26px;
          font-size: 14px;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background .18s, transform .15s, box-shadow 0.18s;
          white-space: nowrap;
          flex-shrink: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(255,233,124,0.25);
        }
        .proceed-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(255,233,124,0.35); }
        .proceed-btn:active:not(:disabled) { transform: scale(0.98); }
        .proceed-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── TRANSFER FORM ── */
        .form-body { padding: 22px 20px 24px; }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 28px;
          margin-bottom: 20px;
          align-items: start;
        }
        @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

        .form-group { display: flex; flex-direction: column; gap: 6px; }

        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: #ffe97c;
        }
        .form-label .req { color: #ffe97c; margin-right: 1px; }

        .form-input, .form-select {
          width: 100%;
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 6px;
          padding: 10px 13px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          color: #ffe97c;
          background: rgba(0,0,0,0.25);
          outline: none;
          transition: border-color .18s, box-shadow .18s;
          height: 40px;
        }
        .form-input::placeholder { color: rgba(255,233,124,0.4); }
        .form-input:focus, .form-select:focus {
          border-color: #ffe97c;
          background: rgba(0,0,0,0.35);
          box-shadow: 0 0 0 3px rgba(255,233,124,0.15);
        }
        .form-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }
        .form-select option {
          background-color: #1a0533;
          color: #ffe97c;
        }

        .form-input[readonly] {
          background: rgba(0,0,0,0.5);
          color: rgba(255,233,124,0.5);
          cursor: not-allowed;
          border-color: rgba(255,233,124,0.1);
        }

        /* verified badge */
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #ffe97c;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .verified-badge svg { fill: #ffe97c !important; }

        /* info note */
        .info-note {
          background: rgba(255,233,124,0.06);
          border-left: 4px solid #ffe97c;
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: #ffe97c;
          margin-bottom: 20px;
        }

        /* submit */
        .submit-wrap {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }

        /* ── TRANSFER HISTORY TABLE ── */
        .history-section {
          width: 100%;
          margin-top: 30px;
        }

        .history-card {
          margin: 0 auto;
        }

        .history-body {
          padding: 0;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .history-table thead tr {
          background: linear-gradient(90deg, rgba(255,233,124,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,233,124,0.2);
        }

        .history-table thead th {
          padding: 12px 14px;
          text-align: left;
          color: #ffe97c;
          font-weight: 700;
          font-size: 12px;
          white-space: nowrap;
        }

        .history-table tbody tr:nth-child(odd)  { background: rgba(255, 255, 255, 0.02); }
        .history-table tbody tr:nth-child(even) { background: rgba(0, 0, 0, 0.15); }
        .history-table tbody tr:hover { background: rgba(255, 215, 0, 0.08); }

        .history-table tbody td {
          padding: 11px 14px;
          color: #ffe97c;
          border-bottom: 1px solid rgba(255, 215, 0, 0.12);
          font-size: 12px;
        }

        .status-success {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #120228;
          background: #ffe97c;
        }

        .status-failed {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          background: #e53935;
        }

        .status-pending {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #fff;
          background: #fb8c00;
        }

        .history-empty {
          text-align: center;
          padding: 30px 20px;
          color: rgba(255,233,124,0.4);
          font-size: 13px;
        }

        .history-loading {
          text-align: center;
          padding: 30px 20px;
          color: #ffe97c;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .history-loading svg { stroke: #ffe97c !important; }

        /* Skeleton Styles */
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
      `}</style>

      <div className="ep-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* ── TOP NAV ── */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">E-Pin Management</span>
          <span className="sep">/</span>
          <span className="current">Transfer E-Pin</span>
        </div>

        <div className="page-body">

          {/* ── STEP 1: VALIDATE ── */}
          {step === "validate" && (
            <div className="center-card">
              <div className="section-header">Fill The Following Details</div>
              <div className="validate-body">
                <span className="txn-label"><span className="req">*</span>Transaction Password :</span>
                <div>
                  <div className="txn-row">
                    <input
                      className="txn-input"
                      type="password"
                      placeholder="Enter Transaction Password"
                      value={txnPassword}
                      onChange={(e) => setTxnPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleProceed()}
                      disabled={loading}
                    />
                    {step === "validate" ? (
                      <button className="proceed-btn" onClick={handleProceed} disabled={loading}>
                        {loading ? "Verifying..." : "Proceed"}
                      </button>
                    ) : (
                      <span className="verified-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffe97c"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                        Verified
                      </span>
                    )}
                  </div>
                  {txnError && <div className="txn-error">{txnError}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: TRANSFER FORM ── */}
          {step === "transfer" && (
            <div className="center-card">
              <div className="section-header">Transfer E-Pin Details</div>
              <div className="form-body">

                <div className="info-note">
                  Transfer your E-Pin to another member. Ensure the Member ID is correct before proceeding.
                </div>

                {/* Row 1: Package | Quantity */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Package :</label>
                    <select 
                      className="form-select" 
                      value={packageSelected}
                      onChange={(e) => setPackageSelected(e.target.value)}
                    >
                      {packages.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes :</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Optional notes"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 2: Transfer To Member ID | Member Name */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Transfer To Member ID :</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter Member ID"
                      value={memberId}
                      onChange={(e) => handleMemberIdChange(e.target.value)}
                      disabled={transferLoading}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Member Name :</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder={memberLoading ? "Searching..." : "Auto-fetched"}
                      value={memberName}
                      readOnly
                    />
                  </div>
                </div>

                {/* Row 3: E-Pin | Remark */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>E-Pin :</label>
                    <select 
                      className="form-select" 
                      value={selectedPin}
                      onChange={(e) => setSelectedPin(e.target.value)}
                      disabled={transferLoading}
                    >
                      <option value="">-- Select E-Pin --</option>
                      {availablePins.map((pin, idx) => (
                        <option key={idx} value={pin.pin}>
                          {pin.pin} ({pin.packageName})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Submit */}
                <div className="submit-wrap">
                  <button 
                    className="proceed-btn" 
                    style={{ padding: "11px 36px", fontSize: 14 }} 
                    onClick={handleTransfer}
                    disabled={transferLoading}
                  >
                    {transferLoading ? "Transferring..." : "Transfer E-Pin"}
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* ── TRANSFER HISTORY ── */}
          <div className="history-section">
            <div className="history-card">
              <div className="history-header">Transfer History</div>
              <div className="history-body">
                {historyLoading ? (
                  <div className="history-loading">
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </div>
                ) : transfers.length === 0 ? (
                  <div className="history-empty">No E-Pin transfers found</div>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>E-Pin</th>
                        <th>Package</th>
                        <th>Transferred To</th>
                        <th>Status</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t, idx) => (
                        <tr key={idx}>
                          <td>{t.date}</td>
                          <td>{t.time}</td>
                          <td>{t.ePin}</td>
                          <td>{t.package}</td>
                          <td>{t.transferredToName}</td>
                          <td>
                            <span className={`status-${t.status.toLowerCase()}`}>
                              {t.status}
                            </span>
                          </td>
                          <td>{t.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}