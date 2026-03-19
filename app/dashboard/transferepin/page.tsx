"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

type Step = "validate" | "transfer";

const packages = ["-- Select Package --", "Agriculture Package", "Healthcare Package", "Sanitary Napkine"];

export default function TransferEPinPage() {
  const [step,         setStep]         = useState<Step>("validate");
  const [txnPassword,  setTxnPassword]  = useState("");
  const [txnError,     setTxnError]     = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [quantity,     setQuantity]     = useState("1");
  const [toast,        setToast]        = useState(false);

  const handleProceed = () => {
    if (!txnPassword.trim()) {
      setTxnError("Please enter your transaction password.");
      return;
    }
    setTxnError("");
    setStep("transfer");
  };

  const handleTransfer = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .ep-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px; color: #555;
          display: flex; align-items: center; gap: 6px;
        }
        .breadcrumb a { color: #555; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .breadcrumb .sep { color: #999; }
        .breadcrumb .current { color: #555; }

        /* PAGE BODY */
        .page-body {
          padding: 0 20px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* ── CENTERED CARD ── */
        .center-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
          width: 100%;
          max-width: 740px;
          margin-bottom: 20px;
        }

        .section-header {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 13px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        /* ── VALIDATE BODY ── */
        .validate-body {
          padding: 22px 20px 24px;
        }
        .txn-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #333;
          margin-bottom: 10px;
          display: block;
        }
        .txn-label .req { color: #e53935; margin-right: 1px; }

        .txn-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .txn-input {
          flex: 1;
          min-width: 220px;
          border: 1px solid #d0d0d0;
          border-radius: 5px;
          padding: 10px 14px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          background: #fff;
          outline: none;
          transition: border-color .18s;
        }
        .txn-input::placeholder { color: #aaa; }
        .txn-input:focus { border-color: #26a69a; }

        .txn-error {
          color: #e53935;
          font-size: 12px;
          margin-top: 8px;
        }

        /* PROCEED BTN */
        .proceed-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 26px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background .18s, transform .15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .proceed-btn:hover { background: #1565c0; transform: translateY(-1px); }
        .proceed-btn:active { transform: scale(0.98); }

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
          font-weight: 500;
          color: #333;
        }
        .form-label .req { color: #e53935; margin-right: 1px; }

        .form-input, .form-select {
          width: 100%;
          border: 1px solid #d0d0d0;
          border-radius: 5px;
          padding: 10px 13px;
          font-size: 13.5px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          background: #fff;
          outline: none;
          transition: border-color .18s, box-shadow .18s;
        }
        .form-input:focus, .form-select:focus {
          border-color: #26a69a;
          box-shadow: 0 0 0 2px rgba(38,166,154,0.12);
        }
        .form-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 32px;
          cursor: pointer;
        }

        .form-input[readonly] {
          background: #f5f5f5;
          color: #777;
          cursor: not-allowed;
        }

        /* verified badge */
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #26a69a;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }

        /* info note */
        .info-note {
          background: #e3f2fd;
          border-left: 4px solid #1976d2;
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 12.5px;
          color: #1565c0;
          margin-bottom: 20px;
        }

        /* submit */
        .submit-wrap {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }

        /* TOAST */
        .toast {
          position: fixed; bottom: 28px; right: 28px;
          background: #26a69a; color: #fff;
          padding: 12px 22px; border-radius: 8px;
          font-size: 13.5px; font-weight: 500;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          z-index: 999;
          animation: fadeUp .3s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="ep-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* ── TOP NAV ── */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="#">Home</a>
          <span className="sep">/</span>
          <a href="#">E-Pin Management</a>
          <span className="sep">/</span>
          <span className="current">Transfer E-Pin</span>
        </div>

        <div className="page-body">

          {/* ── STEP 1: VALIDATE ── */}
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
                    disabled={step === "transfer"}
                  />
                  {step === "validate" ? (
                    <button className="proceed-btn" onClick={handleProceed}>Proceed</button>
                  ) : (
                    <span className="verified-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#26a69a"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      Verified
                    </span>
                  )}
                </div>
                {txnError && <div className="txn-error">{txnError}</div>}
              </div>
            </div>
          </div>

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
                    <select className="form-select" defaultValue="-- Select Package --">
                      {packages.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Quantity :</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="99"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
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
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Member Name :</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Auto-fetched"
                      readOnly
                    />
                  </div>
                </div>

                {/* Row 3: E-Pin | Remark */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>E-Pin :</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Enter E-Pin"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Remark :</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Optional remark"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="submit-wrap">
                  <button className="proceed-btn" style={{ padding: "11px 36px", fontSize: 14 }} onClick={handleTransfer}>
                    Transfer E-Pin
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Toast */}
        {toast && (
          <div className="toast">✓ E-Pin transferred successfully!</div>
        )}

      </div>
    </>
  );
}