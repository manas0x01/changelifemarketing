"use client";

import { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import Navbar from "@/components/Navbar";

type Step = "sponsor" | "register";

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
  const [step,         setStep]         = useState<Step>("sponsor");
  const [hasPins,      setHasPins]      = useState<boolean | null>(null);
  const [pinError,     setPinError]     = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage,   setActivePage]   = useState<"dashboard" | "profile">("dashboard");
  const [gender,       setGender]       = useState<"Male"|"Female">("Male");
  const [dobDay,       setDobDay]       = useState("1");
  const [dobMonth,     setDobMonth]     = useState("January");
  const [dobYear,      setDobYear]      = useState("1995");
  const [state,        setState]        = useState("Bihar");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 2: Sponsor & Package
  const [sponsorId,    setSponsorId]    = useState("");
  const [sponsorName,  setSponsorName]  = useState("");
  const [sponsorValidated, setSponsorValidated] = useState(false);
  const [sponsorError, setSponsorError] = useState("");
  const [placementId,  setPlacementId]  = useState("");
  const [placementName, setPlacementName] = useState("");
  const [position,     setPosition]     = useState("-- Select --");
  const [pkg,          setPkg]          = useState("-- Select Package --");
  const [availableEPins, setAvailableEPins] = useState<string[]>([]);
  const [selectedEPin, setSelectedEPin] = useState("");
  // Step 3: Registration Form Fields
  const [fullName,     setFullName]     = useState("");
  const [userId,       setUserId]       = useState("CLM");
  const [userIdError,  setUserIdError]  = useState("");
  const [userIdValidated, setUserIdValidated] = useState(false);
  const [mobileNo,     setMobileNo]     = useState("");
  const [email,        setEmail]        = useState("");
  const [panNo,        setPanNo]        = useState("");
  const [district,     setDistrict]     = useState("");
  const [city,         setCity]         = useState("");
  const [address,      setAddress]      = useState("");
  const [pincode,      setPincode]      = useState("");
  const [nomineeName,  setNomineeName]  = useState("");
  const [nomineeRel,   setNomineeRel]   = useState("-- Select --");
  const [bankName,     setBankName]     = useState("");
  const [branchName,   setBranchName]   = useState("");
  const [accountNo,    setAccountNo]    = useState("");
  const [ifscCode,     setIfscCode]     = useState("");
  const [accountType,  setAccountType]  = useState("-- Select --");
  const [password,     setPassword]     = useState("");
  const [confirmPwd,   setConfirmPwd]   = useState("");
  const [passwordError,    setPasswordError]    = useState("");
  const [confirmPwdError,  setConfirmPwdError]  = useState("");
  const [nomineeRelError,  setNomineeRelError]  = useState("");
  const [accountTypeError, setAccountTypeError] = useState("");

  useEffect(() => {
    const checkPinAvailability = async () => {
      try {
        const res = await fetch('/api/auth/check-pin-availability');
        const data = await res.json();
        
        if (!data.hasPins) {
          setHasPins(false);
          setPinError(data.message || 'First Buy The Pin Then Create A Account');
          toast.error(data.message || 'No pins available');
        } else {
          setHasPins(true);
        }
      } catch (error) {
        setHasPins(false);
        setPinError('Error checking pin availability');
        toast.error('Error checking pin availability');
      }
    };

    checkPinAvailability();
  }, []);

  const handleProceed = async () => {
    setStep("sponsor");
  };

  const handleValidateSponsor = async () => {
    if (!sponsorId.trim()) {
      setSponsorError("Please enter a sponsor ID.");
      return;
    }

    setSponsorError("");
    
    try {
      // Check if sponsor has pins
      const pinCheckRes = await fetch('/api/user/check-epins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorId: sponsorId.trim() }),
        credentials: 'include',
      });

      const pinData = await pinCheckRes.json();

      if (!pinCheckRes.ok || !pinData.availableEPins || pinData.availableEPins.length === 0) {
        setSponsorError("First Buy The Pins And Then Create A Account");
        toast.error("Sponsor has no pins available");
        return;
      }

      // Fetch sponsor name
      try {
        const nameResponse = await fetch('/api/user/get-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: sponsorId.trim() }),
          credentials: 'include',
        });
        const nameData = await nameResponse.json();
        setSponsorName(nameData.name || "");
      } catch (err) {
        setSponsorName("");
      }

      // Extract pin strings and set the first one as selected
      const pinStrings = pinData.availableEPins?.map((ePin: any) => {
        if (typeof ePin === 'string') {
          return ePin;
        } else if (typeof ePin === 'object' && ePin.pin) {
          return ePin.pin;
        }
        return ePin;
      }) || [];

      setAvailableEPins(pinStrings);
      setSelectedEPin(pinStrings[0] || "");
      setSponsorValidated(true);
      toast.success("✓ Sponsor validated!");
    } catch (error) {
      setSponsorError("An error occurred. Please try again.");
      toast.error("Error validating sponsor");
    }
  };

  const handlePlacementIdChange = async (value: string) => {
    setPlacementId(value);
    
    // Fetch placement name from database if ID is entered
    if (value && value.trim()) {
      try {
        const response = await fetch('/api/user/get-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: value.trim() }),
          credentials: 'include',
        });
        const data = await response.json();
        if (data.name) {
          setPlacementName(data.name);
        } else {
          setPlacementName("");
        }
      } catch (err) {
        setPlacementName("");
      }
    } else {
      setPlacementName("");
    }
  };

  const handleValidateUserId = async () => {
    if (!userId.trim() || userId === "CLM") {
      setUserIdError("Please enter a User ID");
      return;
    }

    setUserIdError("");
    
    try {
      const response = await fetch('/api/auth/check-userid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId.trim() }),
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        setUserIdError(data.error || "This User ID is already taken");
        setUserIdValidated(false);
        toast.error("User ID already exists!");
        return;
      }

      setUserIdValidated(true);
      setUserIdError("");
      toast.success("✓ User ID is available!");
    } catch (error) {
      setUserIdError("Error checking User ID availability");
      toast.error("Error validating User ID");
    }
  };

  const handleSponsorSubmit = () => {
    if (!sponsorValidated) {
      alert("Please validate sponsor ID first");
      return;
    }
    if (!position || position === "-- Select --") {
      toast.error("Please select a position");
      return;
    }
    if (!pkg || pkg === "-- Select Package --") {
      toast.error("Please select a package");
      return;
    }
    setStep("register");
  };

  const handleRegistrationSubmit = async () => {
    // Validate required fields
    if (!userIdValidated) {
      toast.error("Please validate User ID first");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!gender) {
      toast.error("Please select gender");
      return;
    }
    if (!mobileNo.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email ID is required");
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password.trim()) {
      setPasswordError("Password is required");
      toast.error("Password is required");
      return;
    }
    setPasswordError("");
    if (!confirmPwd.trim()) {
      setConfirmPwdError("Confirm password is required");
      toast.error("Please confirm password");
      return;
    }
    setConfirmPwdError("");
    if (password !== confirmPwd) {
      setPasswordError("Passwords don't match");
      setConfirmPwdError("Passwords don't match");
      toast.error("Passwords do not match");
      return;
    }
    setPasswordError("");
    setConfirmPwdError("");

    setIsSubmitting(true);

    try {
      const registrationData: any = {
        userId,
        sponsorId,
        placementId,
        position,
        package: pkg,
        epin: selectedEPin,
        fullName,
        gender,
        mobileNo,
        email,
        dateOfBirth: `${dobDay}-${dobMonth}-${dobYear}`,
        panNo,
        state,
        district,
        city,
        address,
        pincode,
        nomineeName,
        bankName,
        branchName,
        accountNo,
        ifsc: ifscCode,
        password,
      };

      // Only add optional fields if they have valid values
      if (nomineeRel && nomineeRel !== "-- Select --") {
        registrationData.nomineeRelation = nomineeRel;
      }
      if (accountType && accountType !== "-- Select --") {
        registrationData.accountType = accountType;
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
        credentials: 'include',
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("✓ Member registered successfully!");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      toast.error("An error occurred during registration");
    } finally {
      setIsSubmitting(false);
    }
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
        .proceed-btn:disabled { background: #999; cursor: not-allowed; opacity: 0.7; transform: none; }

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
        .form-input[style*="borderColor: #e53935"] {
          border-color: #e53935 !important;
          box-shadow: 0 0 0 2px rgba(229,57,53,0.12) !important;
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

          {/* ══ PIN AVAILABILITY CHECK ══ */}
          {hasPins === false && (
          <div className="section-card" style={{ background: '#fff3cd', borderLeft: '4px solid #ff9800' }}>
            <div className="section-header" style={{ background: '#ff9800' }}>Pin Availability Required</div>
            <div className="validate-body" style={{ padding: '28px 20px' }}>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#d32f2f', marginBottom: '12px' }}>❌ No Available Pins</div>
                <div style={{ fontSize: '14px', color: '#333', marginBottom: '20px' }}>{pinError}</div>
                <a href="/products" style={{ textDecoration: 'none' }}>
                  <button className="proceed-btn" style={{ background: '#ff9800' }}>
                    BUY PIN NOW
                  </button>
                </a>
              </div>
            </div>
          </div>
          )}

          {/* ══ STEP 2: SPONSOR & PACKAGE ══ */}
          {hasPins && step === "sponsor" && (
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
                          onChange={(e) => handlePlacementIdChange(e.target.value)}
                          placeholder="Enter Placement ID"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Placement Name :</label>
                        <input
                          className="form-input"
                          type="text"
                          value={placementName}
                          readOnly
                          style={{ background: "#f5f5f5", color: "#777" }}
                        />
                      </div>
                      <div className="form-group" style={{ visibility: "hidden" }}>
                        <label className="form-label">Placeholder</label>
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
          {hasPins && step === "register" && (
            <div className="section-card">
              <div className="section-header">New Member Registration</div>
              <div className="form-body">

                {/* ── Sponsor / Placement ── */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Sponsor ID :</label>
                    <input className="form-input" type="text" value={sponsorId} readOnly style={{ background: "#f5f5f5", color: "#777" }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sponsor Name :</label>
                    <input className="form-input" type="text" value={sponsorName} readOnly style={{ background: "#f5f5f5", color: "#777" }} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Placement ID :</label>
                    <input className="form-input" type="text" value={placementId} readOnly style={{ background: "#f5f5f5", color: "#777" }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Placement Name :</label>
                    <input className="form-input" type="text" value={placementName} readOnly style={{ background: "#f5f5f5", color: "#777" }} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Position :</label>
                    <select className="form-select" value={position} disabled style={{ background: "#f5f5f5", color: "#777" }}>
                      <option>{position}</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ visibility: "hidden" }}>
                    <label className="form-label">Placeholder</label>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Package :</label>
                    <select className="form-select" value={pkg} disabled style={{ background: "#f5f5f5", color: "#777" }}>
                      <option>{pkg}</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ visibility: "hidden" }}>
                    <label className="form-label">Placeholder</label>
                  </div>
                </div>

                <div className="sub-header">Personal Information</div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>User ID :</label>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="CLM + your ID"
                          value={userId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith("CLM")) {
                              setUserId(val);
                              setUserIdValidated(false);
                              setUserIdError("");
                            } else {
                              setUserId("CLM" + val.replace("CLM", ""));
                            }
                          }}
                          onKeyDown={(e) => e.key === "Enter" && handleValidateUserId()}
                          disabled={userIdValidated}
                          suppressHydrationWarning
                        />
                        {userIdError && <div className="txn-error">{userIdError}</div>}
                      </div>
                      {!userIdValidated ? (
                        <button 
                          className="proceed-btn" 
                          onClick={handleValidateUserId}
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

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Full Name :</label>
                    <input className="form-input" type="text" placeholder="Enter Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} suppressHydrationWarning />
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
                      <input className="form-input mobile-code" type="text" defaultValue="91" disabled />
                      <input className="form-input mobile-num" type="text" placeholder="Mobile Number" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} suppressHydrationWarning />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email ID :</label>
                    <input className="form-input" type="email" placeholder="Enter Email Address" value={email} onChange={(e) => setEmail(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Date of Birth :</label>
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
                    <label className="form-label">PAN No. :</label>
                    <input className="form-input" type="text" placeholder="Enter PAN Number" value={panNo} onChange={(e) => setPanNo(e.target.value)} suppressHydrationWarning />
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
                    <input className="form-input" type="text" placeholder="Enter District" value={district} onChange={(e) => setDistrict(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City :</label>
                    <input className="form-input" type="text" placeholder="Enter City" value={city} onChange={(e) => setCity(e.target.value)} suppressHydrationWarning />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pin Code :</label>
                    <input className="form-input" type="text" placeholder="Enter Pin Code" value={pincode} onChange={(e) => setPincode(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Address :</label>
                    <input className="form-input" type="text" placeholder="Street / Landmark / Building" value={address} onChange={(e) => setAddress(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nominee Name :</label>
                    <input className="form-input" type="text" placeholder="Enter Nominee Name" value={nomineeName} onChange={(e) => setNomineeName(e.target.value)} suppressHydrationWarning />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nominee Relation :</label>
                    <select 
                      className="form-select" 
                      value={nomineeRel} 
                      onChange={(e) => {
                        setNomineeRel(e.target.value);
                        setNomineeRelError("");
                      }}
                    >
                      {nomineeRels.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="sub-header">Bank Details</div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Bank Name :</label>
                    <input className="form-input" type="text" placeholder="Enter Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} suppressHydrationWarning />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch :</label>
                    <input className="form-input" type="text" placeholder="Enter Branch Name" value={branchName} onChange={(e) => setBranchName(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account No. :</label>
                    <input className="form-input" type="text" placeholder="Enter Account Number" value={accountNo} onChange={(e) => setAccountNo(e.target.value)} suppressHydrationWarning />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code :</label>
                    <input className="form-input" type="text" placeholder="Enter IFSC Code" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account Type :</label>
                    <select 
                      className="form-select" 
                      value={accountType} 
                      onChange={(e) => {
                        setAccountType(e.target.value);
                        setAccountTypeError("");
                      }}
                    >
                      {accountTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ visibility: "hidden" }}>
                    <label className="form-label">Placeholder</label>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Password :</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder="Create Password" 
                      value={password} 
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError("");
                      }}
                      style={{ borderColor: passwordError ? "#e53935" : "" }}
                      suppressHydrationWarning 
                    />
                    {passwordError && <div className="txn-error">{passwordError}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>Confirm Password :</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder="Confirm Password" 
                      value={confirmPwd} 
                      onChange={(e) => {
                        setConfirmPwd(e.target.value);
                        setConfirmPwdError("");
                      }}
                      style={{ borderColor: confirmPwdError ? "#e53935" : "" }}
                      suppressHydrationWarning 
                    />
                    {confirmPwdError && <div className="txn-error">{confirmPwdError}</div>}
                  </div>
                </div>



                {/* Submit */}
                <div className="submit-wrap">
                  <button className="proceed-btn" onClick={handleRegistrationSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "REGISTERING..." : "REGISTER MEMBER"}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>

      <Toaster position="top-right" />
    </>
  );
}