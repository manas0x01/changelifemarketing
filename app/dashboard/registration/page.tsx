"use client";

import { useState } from "react";

// ── Steps ─────────────────────────────────────────────────────────────────────
type Step = "validate" | "register";

const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const days   = Array.from({ length: 31 }, (_, i) => String(i + 1));
const months = ["January","February","March","April","May","June",
                 "July","August","September","October","November","December"];
const years  = Array.from({ length: 60 }, (_, i) => String(2005 - i));

const packages       = ["-- Select Package --","Agriculture Package","Healthcare Package","Sanitary Napkine"];
const positions      = ["-- Select --","Left","Right"];
const nomineeRels    = ["-- Select --","Son","Daughter","Wife","Husband","Father","Mother","Brother","Sister","Other"];
const accountTypes   = ["-- Select --","Saving","Current","Salary","NRI","Joint"];

export default function NewRegisterPage() {
  const [step,         setStep]         = useState<Step>("validate");
  const [txnPassword,  setTxnPassword]  = useState("");
  const [txnError,     setTxnError]     = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [gender,       setGender]       = useState<"Male"|"Female">("Male");
  const [dobDay,       setDobDay]       = useState("1");
  const [dobMonth,     setDobMonth]     = useState("January");
  const [dobYear,      setDobYear]      = useState("1995");
  const [state,        setState]        = useState("Bihar");
  const [toast,        setToast]        = useState(false);

  const handleProceed = () => {
    if (!txnPassword.trim()) {
      setTxnError("Please enter your transaction password.");
      return;
    }
    setTxnError("");
    setStep("register");
  };

  const handleSubmit = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .nr-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        /* ── TOP NAV ── */
        .topnav {
          background: #fff;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 3px solid #1de9b6;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 6px rgba(0,0,0,0.08);
        }
        .hamburger { display: flex; flex-direction: column; gap: 4px; cursor: pointer; }
        .hamburger span { width: 22px; height: 2px; background: #555; border-radius: 2px; }

        .topnav-right { display: flex; align-items: center; gap: 10px; position: relative; }
        .user-name { font-size: 13.5px; font-weight: 500; color: #333; cursor: pointer; }
        .user-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, #ff9800 50%, #5c6bc0 50%);
          cursor: pointer; border: 2px solid #e0e0e0; flex-shrink: 0;
        }

        /* ── DROPDOWN ── */
        .dropdown {
          position: absolute; top: 46px; right: 0;
          background: #fff; border: 1px solid #e0e0e0;
          border-radius: 6px; width: 200px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          z-index: 200; overflow: hidden;
        }
        .dropdown-header { padding: 12px 16px; font-size: 13px; font-weight: 600; color: #333; border-bottom: 1px solid #f0f0f0; }
        .dropdown-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; color: #444; cursor: pointer; transition: background 0.15s; }
        .dropdown-item:hover { background: #f5f5f5; }
        .dropdown-item.red { color: #e53935; }

        /* ── GREEN BAR ── */
        .green-bar { height: 8px; background: linear-gradient(90deg, #00c853, #1de9b6); }

        /* ── BREADCRUMB ── */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px;
          color: #333;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .breadcrumb a { color: #333; text-decoration: none; font-weight: 500; }
        .breadcrumb .sep { color: #999; font-weight: 400; }
        .breadcrumb .current { color: #333; }

        /* ── PAGE BODY ── */
        .page-body { padding: 0 20px 30px; }

        /* ── SECTION CARD ── */
        .section-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
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

        /* ── VALIDATE STEP ── */
        .validate-body {
          padding: 28px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .txn-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .txn-label .req { color: #e53935; margin-right: 1px; }

        .txn-input-wrap { display: flex; align-items: center; gap: 12px; flex: 1; flex-wrap: wrap; }
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
          transition: border-color 0.18s;
        }
        .txn-input::placeholder { color: #aaa; text-transform: uppercase; font-size: 12.5px; }
        .txn-input:focus { border-color: #26a69a; }

        .txn-error { color: #e53935; font-size: 12px; margin-top: 6px; padding-left: 20px; }

        /* ── PROCEED / SUBMIT BUTTONS ── */
        .proceed-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 10px 28px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: background 0.18s, transform 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .proceed-btn:hover { background: #1565c0; transform: translateY(-1px); }
        .proceed-btn:active { transform: scale(0.98); }

        /* ── REGISTRATION FORM ── */
        .form-body { padding: 24px 20px 20px; }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px 28px;
          margin-bottom: 20px;
          align-items: start;
        }
        @media (max-width: 680px) { .form-row { grid-template-columns: 1fr; } }

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

        /* gender radio */
        .gender-group {
          display: flex; align-items: center; gap: 20px;
          padding: 10px 13px;
          border: 1px solid #d0d0d0;
          border-radius: 5px;
          background: #fff;
          min-height: 42px;
        }
        .radio-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #333; cursor: pointer; }
        .radio-label input[type="radio"] { accent-color: #1976d2; width: 15px; height: 15px; cursor: pointer; }

        /* mobile split */
        .mobile-split { display: flex; gap: 8px; }
        .mobile-code  { width: 80px; flex-shrink: 0; }
        .mobile-num   { flex: 1; }

        /* dob split */
        .dob-split { display: flex; gap: 8px; }
        .dob-split .form-select { flex: 1; }

        /* section sub-header */
        .sub-header {
          background: #eceff1;
          padding: 9px 16px;
          font-size: 12.5px;
          font-weight: 700;
          color: #546e7a;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          margin: 20px -20px 18px;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }

        /* submit wrap */
        .submit-wrap { display: flex; justify-content: center; padding-top: 10px; }

        /* ── TOAST ── */
        .toast {
          position: fixed; bottom: 28px; right: 28px;
          background: #26a69a; color: #fff;
          padding: 12px 22px; border-radius: 8px;
          font-size: 13.5px; font-weight: 500;
          box-shadow: 0 4px 16px rgba(0,0,0,0.18);
          z-index: 999;
          animation: fadeUp 0.3s ease;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="nr-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* ── TOP NAV ── */}
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

        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb">
          <a href="#">Home</a>
          <span className="sep">/</span>
          <span className="current">New Register</span>
        </div>

        <div className="page-body">

          {/* ══ STEP 1: VALIDATE TRANSACTION PASSWORD ══ */}
          <div className="section-card">
            <div className="section-header">Validate Transaction Password</div>
            <div className="validate-body">
              <span className="txn-label"><span className="req">*</span>TRANSACTION PASSWORD :</span>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div className="txn-input-wrap">
                  <input
                    className="txn-input"
                    type="password"
                    placeholder="ENTER TRANSACTION PASSWORD"
                    value={txnPassword}
                    onChange={(e) => setTxnPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleProceed()}
                    disabled={step === "register"}
                  />
                  {step === "validate" && (
                    <button className="proceed-btn" onClick={handleProceed}>
                      PROCEED
                    </button>
                  )}
                  {step === "register" && (
                    <span style={{ color: "#26a69a", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#26a69a"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                      Verified
                    </span>
                  )}
                </div>
                {txnError && <div className="txn-error">{txnError}</div>}
              </div>
            </div>
          </div>

          {/* ══ STEP 2: REGISTRATION FORM ══ */}
          {step === "register" && (
            <div className="section-card">
              <div className="section-header">New Member Registration</div>
              <div className="form-body">

                {/* ── Sponsor / Placement ── */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Sponsor ID :</label>
                    <input className="form-input" type="text" defaultValue="SM956718" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sponsor Name :</label>
                    <input className="form-input" type="text" defaultValue="ANKIT KUMAR" readOnly style={{ background: "#f5f5f5", color: "#777" }} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Placement ID :</label>
                    <input className="form-input" type="text" defaultValue="SM956718" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Position :</label>
                    <select className="form-select" defaultValue="-- Select --">
                      {positions.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Package :</label>
                    <select className="form-select" defaultValue="-- Select Package --">
                      {packages.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>E-Pin :</label>
                    <input className="form-input" type="text" placeholder="Enter E-Pin" />
                  </div>
                </div>

                <div className="sub-header">Personal Information</div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Full Name :</label>
                    <input className="form-input" type="text" placeholder="Enter Full Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender :</label>
                    <div className="gender-group">
                      <label className="radio-label">
                        <input type="radio" name="gender" checked={gender === "Male"} onChange={() => setGender("Male")} /> Male
                      </label>
                      <label className="radio-label">
                        <input type="radio" name="gender" checked={gender === "Female"} onChange={() => setGender("Female")} /> Female
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Mobile No. :</label>
                    <div className="mobile-split">
                      <input className="form-input mobile-code" type="text" defaultValue="91" />
                      <input className="form-input mobile-num" type="text" placeholder="Mobile Number" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email ID :</label>
                    <input className="form-input" type="email" placeholder="Enter Email Address" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Date of Birth :</label>
                    <div className="dob-split">
                      <select className="form-select" value={dobDay} onChange={e => setDobDay(e.target.value)}>
                        {days.map(d => <option key={d}>{d}</option>)}
                      </select>
                      <select className="form-select" value={dobMonth} onChange={e => setDobMonth(e.target.value)}>
                        {months.map(m => <option key={m}>{m}</option>)}
                      </select>
                      <select className="form-select" value={dobYear} onChange={e => setDobYear(e.target.value)}>
                        {years.map(y => <option key={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>PAN No. :</label>
                    <input className="form-input" type="text" placeholder="Enter PAN Number" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>State :</label>
                    <select className="form-select" value={state} onChange={e => setState(e.target.value)}>
                      {indianStates.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">District :</label>
                    <input className="form-input" type="text" placeholder="Enter District" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City :</label>
                    <input className="form-input" type="text" placeholder="Enter City" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Pin Code :</label>
                    <input className="form-input" type="text" placeholder="Enter Pin Code" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Address :</label>
                    <input className="form-input" type="text" placeholder="Street / Landmark / Building" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nominee Name :</label>
                    <input className="form-input" type="text" placeholder="Enter Nominee Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nominee Relation :</label>
                    <select className="form-select" defaultValue="-- Select --">
                      {nomineeRels.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="sub-header">Bank Details</div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bank Name :</label>
                    <input className="form-input" type="text" placeholder="Enter Bank Name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch :</label>
                    <input className="form-input" type="text" placeholder="Enter Branch Name" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account No. :</label>
                    <input className="form-input" type="text" placeholder="Enter Account Number" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code :</label>
                    <input className="form-input" type="text" placeholder="Enter IFSC Code" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account Type :</label>
                    <select className="form-select" defaultValue="-- Select --">
                      {accountTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Password :</label>
                    <input className="form-input" type="password" placeholder="Create Password" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Confirm Password :</label>
                    <input className="form-input" type="password" placeholder="Confirm Password" />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Transaction Password :</label>
                    <input className="form-input" type="password" placeholder="Create Transaction Password" />
                  </div>
                </div>

                {/* Submit */}
                <div className="submit-wrap">
                  <button className="proceed-btn" onClick={handleSubmit}>
                    REGISTER MEMBER
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="toast">✓ Member registered successfully!</div>
        )}

      </div>
    </>
  );
}