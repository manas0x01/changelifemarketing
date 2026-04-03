"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";

// ── Steps ─────────────────────────────────────────────────────────────────────
type Step = "validate" | "sponsor" | "register";

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
  const [activePage,   setActivePage]   = useState<"dashboard" | "profile">("dashboard");
  const [gender,       setGender]       = useState<"Male"|"Female">("Male");
  const [dobDay,       setDobDay]       = useState("1");
  const [dobMonth,     setDobMonth]     = useState("January");
  const [dobYear,      setDobYear]      = useState("1995");
  const [state,        setState]        = useState("Bihar");
  const [toast,        setToast]        = useState(false);
  
  // Step 2: Sponsor & Package
  const [sponsorId,    setSponsorId]    = useState("");
  const [sponsorName,  setSponsorName]  = useState("");
  const [sponsorValidated, setSponsorValidated] = useState(false);
  const [sponsorError, setSponsorError] = useState("");
  const [placementId,  setPlacementId]  = useState("SM956718");
  const [position,     setPosition]     = useState("-- Select --");
  const [pkg,          setPkg]          = useState("-- Select Package --");
  const [epin,         setEpin]         = useState("");

  const handleProceed = async () => {
    if (!txnPassword.trim()) {
      setTxnError("Please enter your transaction password.");
      return;
    }
    
    setTxnError("");
    
    try {
      console.log("\n🔐 === TRANSACTION PASSWORD VERIFICATION ===");
      console.log("🔐 Verifying transaction password with backend...");
      console.log("   Password entered length:", txnPassword?.length);
      console.log("📤 Sending request to: /api/auth/verify-transaction-password");
      console.log("   Method: POST");
      console.log("   Credentials: include (cookies will be sent)");
      const verifyResponse = await fetch('/api/auth/verify-transaction-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionPassword: txnPassword }),
        credentials: 'include', // IMPORTANT: Include cookies in request
      });

      console.log("📥 Response received:");
      console.log("   Status:", verifyResponse.status);
      console.log("   Status Text:", verifyResponse.statusText);

      const verifyData = await verifyResponse.json();

      console.log("   Response body:", verifyData);

      if (!verifyResponse.ok) {
        console.log("❌ Verification failed:");
        console.log("   Error:", verifyData.error);
        console.log("   Status code:", verifyResponse.status);
        setTxnError(verifyData.error || 'Transaction password verification failed');
        return;
      }

      console.log("✅ Transaction password verified!");
      console.log("   User ID:", verifyData.userId);
      console.log("   Username:", verifyData.username);
      console.log("   Ready to proceed to sponsor selection");
      console.log("\n");
      setStep("sponsor");
    } catch (error) {
      console.error("❌ Error verifying password:", error);
      console.error("   Error details:", (error as Error).message);
      setTxnError("An error occurred. Please try again.");
    }
  };

  const handleValidateSponsor = () => {
    if (!sponsorId.trim()) {
      setSponsorError("Please enter a sponsor ID.");
      return;
    }

    setSponsorError("");
    
    // TODO: Validate sponsor ID from database
    // For now, simulate sponsor validation
    if (sponsorId === "SM956718") {
      setSponsorName("ANKIT KUMAR");
      setSponsorValidated(true);
    } else {
      setSponsorError("Sponsor ID not found. Please try again.");
    }
  };

  const handleSponsorSubmit = () => {
    if (!sponsorValidated) {
      alert("Please validate sponsor ID first");
      return;
    }
    if (!position || position === "-- Select --") {
      alert("Please select a position");
      return;
    }
    if (!pkg || pkg === "-- Select Package --") {
      alert("Please select a package");
      return;
    }
    if (!epin.trim()) {
      alert("Please enter an E-Pin");
      return;
    }
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

        {/* ── NAVBAR COMPONENT ── */}
        <Navbar
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setActivePage={setActivePage}
        />

        {/* Green bar */}
        <div className="green-bar" />

        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb">
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">New Register</span>
        </div>

        <div className="page-body">

          {/* ══ STEP 1: VALIDATE TRANSACTION PASSWORD ══ */}
          {step === "validate" && (
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
                    suppressHydrationWarning={true}
                  />
                  <button className="proceed-btn" onClick={handleProceed} suppressHydrationWarning={true}>
                    PROCEED
                  </button>
                </div>
                {txnError && <div className="txn-error">{txnError}</div>}
              </div>
            </div>
          </div>
          )}

          {/* ══ STEP 2: SPONSOR & PACKAGE ══ */}
          {step === "sponsor" && (
            <div className="section-card">
              <div className="section-header">Fill The Sponsor Details</div>
              <div className="form-body">

                {/* Sponsor Validation Section */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Sponsor ID :</label>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="ENTER SPONSOR ID"
                          value={sponsorId}
                          onChange={(e) => setSponsorId(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleValidateSponsor()}
                          disabled={sponsorValidated}
                          suppressHydrationWarning
                        />
                        {sponsorError && <div className="txn-error">{sponsorError}</div>}
                      </div>
                      {!sponsorValidated ? (
                        <button 
                          className="proceed-btn" 
                          onClick={handleValidateSponsor}
                          style={{ marginTop: 0 }}
                          suppressHydrationWarning
                        >
                          VALIDATE
                        </button>
                      ) : (
                        <span style={{ color: "#26a69a", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 10 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#26a69a"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Show rest of fields only after sponsor validation */}
                {sponsorValidated && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Sponsor Name :</label>
                        <input
                          className="form-input"
                          type="text"
                          value={sponsorName}
                          readOnly
                          style={{ background: "#f5f5f5", color: "#777" }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label"><span className="req">*</span>Placement ID :</label>
                        <input
                          className="form-input"
                          type="text"
                          value={placementId}
                          onChange={(e) => setPlacementId(e.target.value)}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><span className="req">*</span>Position :</label>
                        <select
                          className="form-select"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                        >
                          {positions.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label"><span className="req">*</span>Package :</label>
                        <select
                          className="form-select"
                          value={pkg}
                          onChange={(e) => setPkg(e.target.value)}
                        >
                          {packages.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><span className="req">*</span>E-Pin :</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Enter E-Pin"
                          value={epin}
                          onChange={(e) => setEpin(e.target.value)}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>

                    <div className="submit-wrap" style={{ paddingTop: "20px" }}>
                      <button className="proceed-btn" onClick={handleSponsorSubmit}>
                        NEXT
                      </button>
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

          {/* ══ STEP 3: REGISTRATION FORM ══ */}
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