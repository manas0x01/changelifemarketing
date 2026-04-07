"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

export default function ChangePasswordPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");
  const [oldPassword,  setOldPassword]  = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [rePassword,   setRePassword]   = useState("");
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);
  const [loading,      setLoading]      = useState(false);

  const handleProceed = async () => {
    setError("");
    setSuccess(false);
    setLoading(true);

    if (!oldPassword.trim()) { setError("Please enter your old password."); setLoading(false); return; }
    if (!newPassword.trim()) { setError("Please enter a new password."); setLoading(false); return; }
    if (newPassword.length < 6) { setError("New password must be at least 6 characters."); setLoading(false); return; }
    if (newPassword !== rePassword) { setError("New passwords do not match."); setLoading(false); return; }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change password");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setRePassword("");
      setLoading(false);
    } catch (err) {
      setError("An error occurred while changing the password");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .cp-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        /* GREEN BAR */
        .green-bar { height:8px; background:linear-gradient(90deg,#00c853,#1de9b6); }

        /* BREADCRUMB */
        .breadcrumb { padding:12px 20px; font-size:13px; color:#555; display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:#555; text-decoration:none; }
        .breadcrumb a:hover { text-decoration:underline; }
        .breadcrumb .sep { color:#999; }

        /* PAGE BODY */
        .page-body {
          padding:0 20px 40px;
          display:flex; justify-content:center;
        }

        /* CARD */
        .cp-card {
          width:100%; max-width:680px;
          border-radius:10px;
          overflow:hidden;
          box-shadow:0 2px 14px rgba(0,0,0,0.09);
          background:#fff;
        }

        /* HEADER */
        .card-header {
          background:linear-gradient(90deg,#26a69a,#1de9b6);
          padding:14px 22px;
          font-size:13.5px;
          font-weight:700;
          color:#fff;
          letter-spacing:0.8px;
          text-transform:uppercase;
        }

        /* FORM BODY */
        .form-body { padding:28px 24px 24px; }

        .form-group { margin-bottom:24px; }

        .form-label {
          display:block;
          font-size:13.5px;
          font-weight:500;
          color:#333;
          margin-bottom:8px;
        }
        .form-label .req { color:#e53935; margin-right:1px; }

        .form-input {
          width:100%;
          border:1px solid #d4d4d4;
          border-radius:6px;
          padding:11px 14px;
          font-size:14px;
          font-family:'Poppins',sans-serif;
          color:#333;
          background:#fff;
          outline:none;
          transition:border-color .18s, box-shadow .18s;
        }
        .form-input::placeholder { color:#c0c0c0; }
        .form-input:focus {
          border-color:#26a69a;
          box-shadow:0 0 0 2.5px rgba(38,166,154,0.14);
        }

        /* Error / Success */
        .error-msg {
          background:#fdecea;
          border-left:4px solid #e53935;
          border-radius:4px;
          padding:10px 14px;
          font-size:13px;
          color:#c62828;
          margin-bottom:18px;
          display:flex; align-items:center; gap:6px;
        }
        .success-msg {
          background:#e8f5e9;
          border-left:4px solid #26a69a;
          border-radius:4px;
          padding:10px 14px;
          font-size:13px;
          color:#1b5e20;
          margin-bottom:18px;
          display:flex; align-items:center; gap:6px;
        }

        /* Proceed button — centered, blue, exact match */
        .proceed-wrap { display:flex; justify-content:center; padding-top:4px; }

        .proceed-btn {
          background:#1976d2;
          color:#fff;
          border:none;
          border-radius:7px;
          padding:11px 48px;
          font-size:14.5px;
          font-weight:600;
          font-family:'Poppins',sans-serif;
          cursor:pointer;
          letter-spacing:0.3px;
          transition:background .18s, transform .15s;
        }
        .proceed-btn:hover:not(:disabled) { background:#1565c0; transform:translateY(-1px); }
        .proceed-btn:active:not(:disabled) { transform:scale(0.98); }
        .proceed-btn:disabled { background:#9fa8da; cursor:not-allowed; opacity:0.7; }
      `}</style>

      <div className="cp-root">
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={setActivePage} />

        {/* Green bar */}
        <div className="green-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span>Setting</span>
          <span className="sep">/</span>
          <span>Change Password</span>
        </div>

        <div className="page-body">
          <div className="cp-card">

            {/* HEADER */}
            <div className="card-header">Change Password</div>

            {/* FORM */}
            <div className="form-body">

              {/* Error */}
              {error && (
                <div className="error-msg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#c62828"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="success-msg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#26a69a"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  Password changed successfully!
                </div>
              )}

              {/* Old Password */}
              <div className="form-group">
                <label className="form-label">
                  <span className="req">*</span>Enter Old Password :
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter Old Password"
                  value={oldPassword}
                  onChange={(e) => { setOldPassword(e.target.value); setError(""); setSuccess(false); }}
                />
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">
                  <span className="req">*</span>Enter New Password :
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter New Password"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); setSuccess(false); }}
                />
              </div>

              {/* Re-Enter New Password */}
              <div className="form-group">
                <label className="form-label">
                  <span className="req">*</span>Re-Enter New Password :
                </label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Re-Enter New Password"
                  value={rePassword}
                  onChange={(e) => { setRePassword(e.target.value); setError(""); setSuccess(false); }}
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