"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function ChangeTransactionPasswordPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");
  const [oldTransactionPassword, setOldTransactionPassword] = useState("");
  const [newTransactionPassword, setNewTransactionPassword] = useState("");
  const [reTransactionPassword, setReTransactionPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!newTransactionPassword.trim()) {
      setError("Please enter a new transaction password.");
      setLoading(false);
      return;
    }
    if (newTransactionPassword.length < 6) {
      setError("New transaction password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    if (newTransactionPassword !== reTransactionPassword) {
      setError("New transaction passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/change-transaction-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldTransactionPassword,
          newTransactionPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change transaction password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setOldTransactionPassword("");
      setNewTransactionPassword("");
      setReTransactionPassword("");
      setLoading(false);
    } catch (err) {
      setError("An error occurred while changing the transaction password");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .cp-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,233,124,0.12) 0%, transparent 65%);
          min-height: 100vh;
          color: #fff;
        }

        /* GOLD BAR */
        .gold-bar { height:3px; background:linear-gradient(90deg, transparent, #ffe97c, #ffe97c, #ffe97c, transparent); }

        /* BREADCRUMB */
        .breadcrumb { padding:12px 20px; font-size:13px; color:rgba(255,233,124,0.7); display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:rgba(255,233,124,0.7); text-decoration:none; }
        .breadcrumb a:hover { color:#ffe97c; text-decoration:underline; }
        .breadcrumb .sep { color:rgba(255,233,124,0.4); }
        .breadcrumb .current { color:#ffe97c; font-weight:700; }

        /* PAGE BODY */
        .page-body {
          padding:0 20px 40px;
          display:flex; justify-content:center;
        }

        /* CARD */
        .cp-card {
          width:100%; max-width:680px;
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        /* HEADER */
        .card-header {
          background: linear-gradient(90deg, #1d033a, #110122);
          border-bottom: 1.5px solid rgba(255,233,124,0.22);
          padding:16px 22px;
          font-size:14px;
          font-weight:800;
          color:#ffe97c;
          letter-spacing:0.8px;
          text-transform:uppercase;
          text-shadow: 0 0 8px rgba(255,233,124,0.3);
        }

        /* FORM BODY */
        .form-body { padding:28px 24px 24px; }

        .form-group { margin-bottom:24px; }

        .form-label {
          display:block;
          font-size:13px;
          font-weight:600;
          color:rgba(255,233,124,0.85);
          margin-bottom:8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-label .req { color:#ff4444; margin-right:3px; }

        .form-input {
          width:100%;
          border: 1.5px solid rgba(255,233,124,0.25);
          border-radius:6px;
          padding:11px 14px;
          font-size:14px;
          font-family:'Poppins',sans-serif;
          color:#fff;
          background: rgba(0,0,0,0.25);
          outline:none;
          transition: all 0.2s;
        }
        .form-input:-webkit-autofill,
        .form-input:-webkit-autofill:hover,
        .form-input:-webkit-autofill:focus,
        .form-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1a0533 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
        .form-input::placeholder { color:rgba(255,233,124,0.3); }
        .form-input:focus {
          border-color:#ffe97c;
          box-shadow:0 0 10px rgba(255,233,124,0.2);
        }

        /* Error / Success */
        .error-msg {
          background: rgba(239, 68, 68, 0.12);
          border-left: 4px solid #ff4444;
          border-radius:4px;
          padding:10px 14px;
          font-size:13px;
          color:#ff8888;
          margin-bottom:18px;
          display:flex; align-items:center; gap:6px;
        }
        .success-msg {
          background: rgba(16, 185, 129, 0.12);
          border-left: 4px solid #ffe97c;
          border-radius:4px;
          padding:10px 14px;
          font-size:13px;
          color:#ffe97c;
          margin-bottom:18px;
          display:flex; align-items:center; gap:6px;
        }

        /* Proceed button */
        .proceed-wrap { display:flex; justify-content:center; padding-top:4px; }

        .proceed-btn {
          background: linear-gradient(135deg, #ffe97c 0%, #ffe97c 100%);
          color:#120228;
          border:none;
          border-radius:7px;
          padding:11px 48px;
          font-size:14.5px;
          font-weight:800;
          font-family:'Poppins',sans-serif;
          cursor:pointer;
          letter-spacing:0.5px;
          text-transform: uppercase;
          transition: all 0.2s, transform .15s;
          box-shadow: 0 4px 12px rgba(255,233,124,0.2);
        }
        .proceed-btn:hover:not(:disabled) { background: linear-gradient(135deg, #ffe97c 0%, #ffe97c 100%); transform:translateY(-1px); }
        .proceed-btn:active:not(:disabled) { transform:scale(0.98); }
        .proceed-btn:disabled { background:rgba(255,233,124,0.25); color:rgba(255,233,124,0.4); cursor:not-allowed; opacity:0.7; box-shadow:none; }
      `}</style>

      <div className="cp-root">
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={setActivePage} />

        {/* Gold bar */}
        <div className="gold-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffe97c"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span>Setting</span>
          <span className="sep">/</span>
          <span className="current">Change Transaction Password</span>
        </div>

        <div className="page-body">
          <div className="cp-card">

            {/* HEADER */}
            <div className="card-header">Change Transaction Password</div>

            {/* FORM */}
            <div className="form-body">

              {/* Error */}
              {error && (
                <div className="error-msg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4444"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="success-msg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffe97c"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Transaction password changed successfully!
                </div>
              )}

              {/* Old Password */}
              <div className="form-group">
                <label className="form-label">
                  Enter Old Transaction Password (if set) :
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter Old Transaction Password"
                  value={oldTransactionPassword}
                  onChange={(e) => { setOldTransactionPassword(e.target.value); setError(""); setSuccess(false); }}
                />
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">
                  <span className="req">*</span>Enter New Transaction Password :
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter New Transaction Password"
                  value={newTransactionPassword}
                  onChange={(e) => { setNewTransactionPassword(e.target.value); setError(""); setSuccess(false); }}
                />
              </div>

              {/* Re-Enter New Password */}
              <div className="form-group">
                <label className="form-label">
                  <span className="req">*</span>Re-Enter New Transaction Password :
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Re-Enter New Transaction Password"
                  value={reTransactionPassword}
                  onChange={(e) => { setReTransactionPassword(e.target.value); setError(""); setSuccess(false); }}
                  onKeyDown={(e) => e.key === "Enter" && handleProceed()}
                />
              </div>

              {/* Proceed Button */}
              <div className="proceed-wrap">
                <button className="proceed-btn" onClick={handleProceed} disabled={loading}>
                  {loading ? "Processing..." : "Proceed"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
