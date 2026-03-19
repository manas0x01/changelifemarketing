"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

const accountTypes = ["-- Select --", "Saving", "Current", "Salary", "NRI", "Joint"];

export default function EditBankPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountType, setAccountType]   = useState("-- Select --");
  const [saved, setSaved]               = useState(false);

  const handleUpdate = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .eb-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }



        /* ── GREEN BAR ── */
        .green-bar { height: 8px; background: linear-gradient(90deg, #00c853, #1de9b6); }

        /* ── BREADCRUMB ROW ── */
        .breadcrumb-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .breadcrumb-left {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #555;
        }
        .breadcrumb-left a { color: #555; text-decoration: none; }
        .breadcrumb-left a:hover { text-decoration: underline; }
        .breadcrumb-left .sep { color: #999; }
        .breadcrumb-left .current { color: #333; font-weight: 500; }

        .return-btn {
          background: #546e7a;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 9px 20px;
          font-size: 13px;
          font-weight: 500;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background 0.18s;
          white-space: nowrap;
        }
        .return-btn:hover { background: #455a64; }

        /* ── PAGE BODY ── */
        .page-body { padding: 0 20px 30px; }

        /* ── SECTION CARD ── */
        .section-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
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

        /* ── FORM BODY ── */
        .form-body { padding: 24px 20px 20px; }

        /* 2-col grid */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 28px;
          margin-bottom: 28px;
        }
        @media (max-width: 680px) {
          .form-grid { grid-template-columns: 1fr; }
        }

        .form-group { display: flex; flex-direction: column; gap: 7px; }

        .form-label {
          font-size: 13.5px;
          font-weight: 400;
          color: #333;
        }

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
          transition: border-color 0.18s, box-shadow 0.18s;
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

        /* ── UPDATE BUTTON ── */
        .update-wrap {
          display: flex;
          justify-content: center;
          padding-top: 4px;
        }
        .update-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 11px 36px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: background 0.18s, transform 0.15s;
        }
        .update-btn:hover { background: #1565c0; transform: translateY(-1px); }
        .update-btn:active { transform: scale(0.98); }

        /* ── TOAST ── */
        .toast {
          position: fixed;
          bottom: 28px; right: 28px;
          background: #26a69a;
          color: #fff;
          padding: 12px 22px;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          z-index: 999;
          animation: fadeUp 0.3s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="eb-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* Navbar Component */}
        <Navbar
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setActivePage={() => {}}
        />

        {/* Green bar */}
        <div className="green-bar" />

        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb-row">
          <div className="breadcrumb-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#555">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <a href="#">Home</a>
            <span className="sep">/</span>
            <a href="#">Profile</a>
            <span className="sep">/</span>
            <span className="current">Edit Bank</span>
          </div>
          <button className="return-btn">Return to Profile</button>
        </div>

        {/* ── MAIN CARD ── */}
        <div className="page-body">
          <div className="section-card">
            <div className="section-header">Edit Bank Details</div>

            <div className="form-body">
              <div className="form-grid">

                {/* Bank Name */}
                <div className="form-group">
                  <label className="form-label">Bank Name :</label>
                  <input
                    className="form-input"
                    type="text"
                    defaultValue="CENTER BANK OF INDIA"
                  />
                </div>

                {/* IFSC Code */}
                <div className="form-group">
                  <label className="form-label">IFSC Code :</label>
                  <input
                    className="form-input"
                    type="text"
                    defaultValue="CBIN0284349"
                  />
                </div>

                {/* Account No. */}
                <div className="form-group">
                  <label className="form-label">Account No. :</label>
                  <input
                    className="form-input"
                    type="text"
                    defaultValue="5511182971"
                  />
                </div>

                {/* Branch */}
                <div className="form-group">
                  <label className="form-label">Branch :</label>
                  <input
                    className="form-input"
                    type="text"
                    defaultValue="MASAURHI"
                  />
                </div>

                {/* Account Type */}
                <div className="form-group">
                  <label className="form-label">Account Type :</label>
                  <select
                    className="form-select"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                  >
                    {accountTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* PAN */}
                <div className="form-group">
                  <label className="form-label">PAN :</label>
                  <input
                    className="form-input"
                    type="text"
                    defaultValue="FVEPK3555E"
                  />
                </div>

              </div>

              {/* Update Button */}
              <div className="update-wrap">
                <button className="update-btn" onClick={handleUpdate}>
                  Update Bank Details
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toast */}
        {saved && (
          <div className="toast">✓ Bank details updated successfully!</div>
        )}

      </div>
    </>
  );
}