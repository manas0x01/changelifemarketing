"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type Step = "validateTxn" | "sponsor" | "register";

const indianStates = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh",
];

const days   = Array.from({ length: 31 }, (_, i) => String(i + 1));
const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const years  = Array.from({ length: 60 }, (_, i) => String(2005 - i));

const packages       = ["-- Select Package --","Basic Package","Healthcare Package","Sanitary Napkine"];
const positions      = ["-- Select --","Left","Right"];
const nomineeRels    = ["-- Select --","Son","Daughter","Wife","Husband","Father","Mother","Brother","Sister","Other"];
const accountTypes   = ["-- Select --","Saving","Current","Salary","NRI","Joint"];

interface NewUserData {
  userId: string;
  fullName: string; 
  mobileNo: string;
  password: string;
  transactionPassword: string;
  regDate: Date;
}

export default function NewRegisterPage() {
  const [step,         setStep]         = useState<Step>("validateTxn");
  const [hasPins,      setHasPins]      = useState<boolean | null>(null);
  const [pinError,     setPinError]     = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage,   setActivePage]   = useState<"dashboard" | "profile">("dashboard");
  const [txnPassword,  setTxnPassword]  = useState("");
  const [txnPasswordError, setTxnPasswordError] = useState("");
  const [txnValidating, setTxnValidating] = useState(false);
  const [txnValidated, setTxnValidated] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [newUserData, setNewUserData] = useState<NewUserData | null>(null);
  const [registrationFrozen, setRegistrationFrozen] = useState(false);
  const [gender,       setGender]       = useState<"Male"|"Female">("Male");
  const [dobDay,       setDobDay]       = useState("1");
  const [dobMonth,     setDobMonth]     = useState("01");
  const [dobYear,      setDobYear]      = useState("1995");
  const [state,        setState]        = useState("Bihar");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sponsorId,    setSponsorId]    = useState("");
  const [sponsorName,  setSponsorName]  = useState("");
  const [sponsorValidated, setSponsorValidated] = useState(false);
  const [sponsorError, setSponsorError] = useState("");
  const [uplineId,     setUplineId]     = useState("");
  const [uplineName,   setUplineName]   = useState("");
  const [uplineError,  setUplineError]  = useState("");
  const [position,     setPosition]     = useState("-- Select --");
  const [pkg,          setPkg]          = useState("-- Select Package --");
  const [availableEPins, setAvailableEPins] = useState<string[]>([]);
  const [selectedEPin, setSelectedEPin] = useState("");
  const [availablePositions, setAvailablePositions] = useState<string[]>(["-- Select --", "Left", "Right"]);
  const [nomineeRelError,  setNomineeRelError]  = useState("");
  const [accountTypeError, setAccountTypeError] = useState("");

  const [fullName,     setFullName]     = useState("");
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

  useEffect(() => {
    const checkPinAvailability = async () => {
      try {
        const res = await fetch('/api/auth/checkpinavailability');
        const data = await res.json();
        if (!data.hasPins) {
          setHasPins(false);
          setPinError(data.message || 'First Buy The Pin Then Create A Account');
        } else {
          setHasPins(true);
        }
      } catch (error) {
        setHasPins(false);
        setPinError('Error checking pin availability');
      }
    };

    checkPinAvailability();
  }, []);

  useEffect(() => {
    const checkFreeze = () => {
      const now = new Date();
      const hour = now.getHours();
      const min = now.getMinutes();

      // PM Freeze: 12:00 PM to 12:10 PM (hour 12)
      const isPmFreeze = (hour === 12 && min >= 0 && min < 10);
      
      // AM Freeze: 12:00 AM to 12:10 AM (hour 0)
      const isAmFreeze = (hour === 0 && min >= 0 && min < 10);

      setRegistrationFrozen(isPmFreeze || isAmFreeze);
    };

    checkFreeze();
    const timer = setInterval(checkFreeze, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleValidateTransactionPassword = async () => {
    if (!txnPassword.trim()) {
      setTxnPasswordError("Please enter your transaction password");
      return;
    }
    setTxnValidating(true);
    setTxnPasswordError("");
    try {
      // Log what we are about to send from the frontend (mask sensitive values)
      console.log("[frontend -> validateTx] sending:", {
        endpoint: '/api/auth/validatetransactionpassword',
        payload: {
          transactionPasswordMasked: txnPassword ? '***REDACTED***' : null,
          transactionPasswordLength: txnPassword.trim().length,
        },
      });

      const response = await fetch('/api/auth/validatetransactionpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionPassword: txnPassword.trim() }),
        credentials: 'include',
      });
      const data = await response.json();

      // Log the backend response for inspection
      console.log("[frontend <- validateTx] response:", {
        status: response.status,
        ok: response.ok,
        body: data,
      });
      if (response.status === 404) {
        setTxnPasswordError('API Route not found. Please check if the backend is running correctly.');
        setTxnValidating(false);
        return;
      }
      if (!response.ok && response.status === 401) {
        const errorMsg = data.error === 'No transaction password set' 
          ? "No transaction password set. Please set it in your profile first"
          : "Transaction password is incorrect";
        setTxnPasswordError(errorMsg);
        setTxnValidating(false);
        return;
      }
      if (!response.ok) {
        setTxnPasswordError(data.error || "Transaction password validation failed");
        setTxnValidating(false);
        return;
      }
      if (!data.hasPins) {
        setTxnPasswordError(data.message || "You don't have a pin. First purchase a pin then create a new account");
        setTxnValidating(false);
        return;
      }
      setTxnValidated(true);
      setTxnPassword("");
      setPinError("");
      setTimeout(() => {
        setStep("sponsor");
      }, 500);

    } catch (error) {
      console.error('[frontend validateTx] network/error:', error);
      setTxnPasswordError("An error occurred. Please try again.");
    } finally {
      setTxnValidating(false);
    }
  };

  const handleValidateSponsor = async () => {
    if (!sponsorId.trim()) {
      setSponsorError("Please enter a sponsor ID.");
      return;
    }
    setSponsorError("");
    try {
      // Get sponsor name
      const nameResponse = await fetch('/api/user/getname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: sponsorId.trim() }),
        credentials: 'include',
      });
      const nameData = await nameResponse.json();

      if (!nameResponse.ok || !nameData) {
        setSponsorError("Sponsor ID not found");
        return;
      }

      // normalize name field (API may return { success, data: { name } })
      const sponsorDisplayName = nameData?.data?.name ?? nameData?.name ?? "";

      // Check available positions for the Upline (defaults to sponsor if upline not specified)
      const targetUplineId = uplineId.trim() || sponsorId.trim();
      const positionsResponse = await fetch('/api/user/check-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorId: targetUplineId }),
        credentials: 'include',
      });

      if (!positionsResponse.ok) {
        setSponsorError("Failed to check sponsor positions");
        return;
      }

      const positionsData = await positionsResponse.json();

      if (!positionsData.success) {
        setSponsorError(positionsData.message || "Failed to check sponsor positions");
        return;
      }

      const { availablePositions } = positionsData;

      // If no positions available, show error
      if (availablePositions.length === 0) {
        setSponsorError("Both positions are already filled. Use a different sponsor ID.");
        return;
      }

      // Always show available positions explicitly (Left, Right, or both)
      let positionsToShow = ["-- Select --"];
      availablePositions.forEach((pos: string) => {
        positionsToShow.push(pos.charAt(0).toUpperCase() + pos.slice(1));
      });
      setPosition("-- Select --");

      setAvailablePositions(positionsToShow);
      setSponsorName(sponsorDisplayName);
      if (!uplineId.trim()) {
        setUplineId(sponsorId.trim());
        setUplineName(sponsorDisplayName);
      }
      setSponsorValidated(true);

      // Get available EPINs
      try {
        const pinsResponse = await fetch('/api/user/get-epins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
          credentials: 'include',
        });
        
        if (pinsResponse.ok) {
          const pinsData = await pinsResponse.json();
          const pinStrings = pinsData.availableEPins?.map((ePin: any) => {
            if (typeof ePin === 'string') {
              return ePin;
            } else if (typeof ePin === 'object' && ePin.pin) {
              return ePin.pin;
            }
            return ePin;
          }) || [];
          setAvailableEPins(pinStrings);
          setSelectedEPin(pinStrings[0] || "");
        }
      } catch (pinsError) {
        // Silently handle EPIN error
      }

      toast.success("✓ Sponsor validated!");
    } catch (error) {
      setSponsorError("An error occurred. Please try again.");
      toast.error("Error validating sponsor");
    }
  };

  const handleValidateUpline = async () => {
    if (!uplineId.trim()) {
      setUplineError("Please enter an Upline ID.");
      return;
    }
    setUplineError("");
    try {
      // Get upline name
      const nameResponse = await fetch('/api/user/getname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uplineId.trim() }),
        credentials: 'include',
      });
      const nameData = await nameResponse.json();

      if (!nameResponse.ok || !nameData) {
        setUplineError("Upline ID not found");
        return;
      }

      const uplineDisplayName = nameData?.data?.name ?? nameData?.name ?? "";
      setUplineName(uplineDisplayName);

      // Check available positions for this upline
      const positionsResponse = await fetch('/api/user/check-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sponsorId: uplineId.trim() }),
        credentials: 'include',
      });

      if (!positionsResponse.ok) {
        setUplineError("Failed to check upline positions");
        return;
      }

      const positionsData = await positionsResponse.json();

      if (!positionsData.success) {
        setUplineError(positionsData.message || "Failed to check upline positions");
        return;
      }

      const { availablePositions } = positionsData;

      if (availablePositions.length === 0) {
        setUplineError("Both positions are already filled for this Upline.");
        return;
      }

      let positionsToShow = ["-- Select --"];
      availablePositions.forEach((pos: string) => {
        positionsToShow.push(pos.charAt(0).toUpperCase() + pos.slice(1));
      });
      setPosition("-- Select --");
      setAvailablePositions(positionsToShow);
      
      toast.success("✓ Upline validated!");
    } catch (error) {
      setUplineError("An error occurred. Please try again.");
      toast.error("Error validating upline");
    }
  };

  const handleSponsorSubmit = async () => {
    if (!sponsorValidated) {
      alert("Please validate sponsor ID first");
      return;
    }
    if (!position || position === "-- Select --") {
      toast.error("Please select a position");
      return;
    }
    // For first registration, position is auto-assigned, so no validation needed
    if (position === "Default (Auto-assigned)") {
      // Position will be determined during registration
    }
    if (!pkg || pkg === "-- Select Package --") {
      toast.error("Please select a package");
      return;
    }
    if (!selectedEPin || selectedEPin === "-- Select PIN --") {
      toast.error("Please select a PIN");
      return;
    }
    // Validate Upline ID matches Sponsor ID
    setUplineError("");
    // Validate Upline Name exists
    if (!uplineName.trim()) {
      setUplineError("Upline Name is required");
      toast.error("Upline Name is required");
      return;
    }

    // Move to registration step
      setStep("register");
  };

  const handleRegistrationSubmit = async () => {
    // Sessions: Morning = 12:00 AM to 12:00 PM, Evening = 12:00 PM to 12:00 AM
    // No freeze period - registration is always allowed

    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!mobileNo.trim()) {
      toast.error("Mobile number is required");
      return;
    }
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    setIsRegistering(true);
    setIsSubmitting(true);

    try {
      const startTime = Date.now();
      const registrationData: any = {
        placementPosition: position ? position.toLowerCase() : position,
        sponsorId,
        uplineId,
        uplineName,
        position,
        package: pkg,
        epin: selectedEPin,
        fullName,
        gender,
        mobileNo,
        email,
        dateOfBirth: `${String(dobDay).padStart(2, '0')}-${dobMonth}-${dobYear}`,
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
        autoGenerate: true, // Tell backend to generate credentials
      };
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
      
      // Ensure at least 3 seconds have passed
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise(r => setTimeout(r, remainingTime));
      }
      
      if (!response.ok) {
        setIsRegistering(false);
        setIsSubmitting(false);
        toast.error(data.message || data.error || "Registration failed");
        return;
      }
      
      setIsRegistering(false);

      setNewUserData({
        userId: data.user.username,
        fullName: fullName,
        mobileNo: mobileNo,
        password: data.user.password,
        transactionPassword: data.user.transactionPassword,
        regDate: new Date(),
      });
      setShowCongratulations(true);
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Network error. Please check your connection and try again.");
      setIsRegistering(false);
      setIsSubmitting(false);
    } finally {
      // setIsSubmitting should stay true until we are done showing the congrats or failing
      if (!showCongratulations) setIsSubmitting(false);
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

        /* ── LOADING OVERLAY ── */
        .loading-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(5px);
        }

        .loading-circle {
          width: 60px;
          height: 60px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #26a69a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        .loading-text {
          font-size: 18px;
          font-weight: 600;
          color: #26a69a;
          letter-spacing: 1px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ── VALIDATE STEP ── */
        .validate-body {
          padding: 28px 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }
        .txn-label {
          font-size: 13.5px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          height: 42px;
        }
        .txn-label .req { color: #e53935; margin-right: 1px; }

        .txn-input-group {
          flex: 1;
          min-width: 220px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .txn-input {
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

        .txn-error { color: #e53935; font-size: 12px; margin-top: 2px; padding-left: 0; }

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

        /* ── CONGRATULATIONS MODAL ── */
        .congratulations-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 16px;
          overflow-y: auto;
        }

        .congratulations-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.35s ease-out;
        }

        @media (max-width: 600px) {
          .congratulations-card {
            border-radius: 8px;
            max-height: 95vh;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .congratulations-header {
          background: linear-gradient(135deg, #00c853 0%, #1de9b6 100%);
          padding: 32px 20px;
          text-align: center;
          color: #fff;
        }

        .congratulations-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }

        .congratulations-header p {
          font-size: 13px;
          margin: 0;
          opacity: 0.95;
          font-weight: 500;
          padding: 0 10px;
        }

        @media (max-width: 480px) {
          .congratulations-header {
            padding: 24px 16px;
          }
          .congratulations-header h2 {
            font-size: 20px;
          }
          .congratulations-header p {
            font-size: 12px;
          }
        }

        .congratulations-icon {
          font-size: 40px;
          margin-bottom: 12px;
          display: block;
        }

        .congratulations-body {
          padding: 28px 20px;
        }

        @media (max-width: 480px) {
          .congratulations-body {
            padding: 20px 16px;
          }
        }

        .details-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 12px;
          background: #f8f9fa;
          border-radius: 6px;
          border-left: 3px solid #26a69a;
          gap: 12px;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          min-width: fit-content;
        }

        .detail-value {
          font-size: 14px;
          font-weight: 600;
          color: #1976d2;
          word-break: break-all;
          text-align: right;
          flex-grow: 1;
        }

        .detail-value.password {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.8px;
          font-size: 13px;
          text-align: center;
        }

        @media (max-width: 480px) {
          .details-section {
            gap: 10px;
            margin-bottom: 16px;
          }
          .detail-row {
            padding: 10px;
            gap: 10px;
            flex-wrap: wrap;
          }
          .detail-label {
            font-size: 11px;
          }
          .detail-value {
            font-size: 13px;
          }
          .detail-value.password {
            font-size: 12px;
            letter-spacing: 0.6px;
          }
        }

        .congratulations-footer {
          padding: 16px 20px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }

        .congratulations-footer p {
          font-size: 12px;
          color: #999;
          margin: 0 0 14px;
          line-height: 1.4;
          padding: 0 8px;
        }

        @media (max-width: 480px) {
          .congratulations-footer {
            padding: 14px 16px;
          }
          .congratulations-footer p {
            font-size: 11px;
            margin: 0 0 12px;
          }
        }

        .done-btn {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: all 0.25s;
          box-shadow: 0 4px 12px rgba(38, 166, 154, 0.3);
        }

        .done-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(38, 166, 154, 0.4);
        }

        .done-btn:active {
          transform: scale(0.98);
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

          {/* ══ TRANSACTION PASSWORD VALIDATION ══ */}
          {step === "validateTxn" && (
            <div className="section-card">
              <div className="section-header">Validate Transaction Password</div>
              <div className="validate-body">
                <label className="txn-label">
                  <span className="req">*</span>Transaction Password :
                </label>
                <div className="txn-input-group">
                  <input
                    className="txn-input"
                    type="password"
                    placeholder="ENTER YOUR TRANSACTION PASSWORD"
                    value={txnPassword}
                    onChange={(e) => {
                      setTxnPassword(e.target.value);
                      setTxnPasswordError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleValidateTransactionPassword()}
                    suppressHydrationWarning
                  />
                  {txnPasswordError && <div className="txn-error">{txnPasswordError}</div>}
                </div>
                <button
                  className="proceed-btn"
                  onClick={handleValidateTransactionPassword}
                  disabled={txnValidating}
                  suppressHydrationWarning
                >
                  PROCEED
                </button>
              </div>
            </div>
          )}

          {/* ══ PIN AVAILABILITY CHECK ══ */}
          {hasPins === false && txnValidated && (
          <div className="section-card" style={{ background: '#fff3cd', borderLeft: '4px solid #ff9800' }}>
            <div className="section-header" style={{ background: '#ff9800' }}>Pin Availability Required</div>
            <div className="validate-body" style={{ padding: '28px 20px' }}>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#d32f2f', marginBottom: '12px' }}>❌ No Available Pins</div>
                <div style={{ fontSize: '14px', color: '#333', marginBottom: '20px' }}>{pinError}</div>
                <a href="/dashboard/buypins" style={{ textDecoration: 'none' }}>
                  <button className="proceed-btn" style={{ background: '#ff9800' }} suppressHydrationWarning={true}>
                    BUY PIN NOW
                  </button>
                </a>
              </div>
            </div>
          </div>
          )}

          {/* STEP 2: SPONSOR & PACKAGE */}
          {txnValidated && hasPins && step === "sponsor" && (
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
                          suppressHydrationWarning={true}
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

                {/* Show Rest Of Fields Only After Sponsor Validation */}
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
                    </div>

                    {/* Upline ID Field */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><span className="req">*</span>UPLINE ID :</label>
                        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <input
                              className="form-input"
                              type="text"
                              placeholder="ENTER UPLINE ID"
                              value={uplineId}
                              onChange={(e) => setUplineId(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleValidateUpline()}
                              suppressHydrationWarning
                            />
                            {uplineError && <div className="txn-error">{uplineError}</div>}
                          </div>
                          <button 
                            className="proceed-btn" 
                            onClick={handleValidateUpline}
                            style={{ marginTop: 0 }}
                            suppressHydrationWarning={true}
                          >
                            VALIDATE
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Upline Name Field */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label"><span className="req">*</span>UPLINE NAME :</label>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="ENTER UPLINE NAME (MUST MATCH SPONSOR NAME)"
                          value={uplineName}
                          onChange={(e) => setUplineName(e.target.value)}
                          suppressHydrationWarning
                        />
                        {uplineError && <div className="txn-error">{uplineError}</div>}
                      </div>
                    </div>

                    {sponsorValidated && (
                      <>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label"><span className="req">*</span>Position :</label>
                            <select
                              className="form-select"
                              value={position}
                              onChange={(e) => setPosition(e.target.value)}
                            >
                              {availablePositions.map(p => <option key={p}>{p}</option>)}
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
                            <label className="form-label"><span className="req">*</span>Select PIN :</label>
                            <select
                              className="form-select"
                              value={selectedEPin}
                              onChange={(e) => setSelectedEPin(e.target.value)}
                            >
                              <option key="default">-- Select PIN --</option>
                              {availableEPins.map((pin, i) => <option key={`pin-${i}`}>{pin}</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{ visibility: "hidden" }}>
                            <label className="form-label">Placeholder</label>
                          </div>
                        </div>

                        <div className="submit-wrap" style={{ paddingTop: "20px" }}>
                          <button className="proceed-btn" onClick={handleSponsorSubmit} suppressHydrationWarning={true}>
                            NEXT
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

              </div>
            </div>
          )}

          {/* ══ STEP 3: REGISTRATION FORM ══ */}
          {txnValidated && hasPins && step === "register" && (
            <div className="section-card">
              <div className="section-header">New Member Registration</div>
              <div className="form-body">

                {/* ── Sponsor & Upline Details ── */}
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
                    <label className="form-label"><span className="req">*</span>UPLINE ID :</label>
                    <input className="form-input" type="text" value={uplineId} readOnly style={{ background: "#f5f5f5", color: "#777" }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label"><span className="req">*</span>UPLINE NAME :</label>
                    <input className="form-input" type="text" value={uplineName} readOnly style={{ background: "#f5f5f5", color: "#777" }} />
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

                {/* CREDENTIALS WILL BE AUTO-GENERATED */}
                <div className="form-row" style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", border: "1px dashed #ced4da", marginBottom: "20px" }}>
                  <div style={{ textAlign: "center", width: "100%" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#495057", fontSize: "14px" }}>
                      ✨ Credentials (User ID, Passwords) will be automatically generated for security.
                    </p>
                    <p style={{ margin: "4px 0 0", color: "#6c757d", fontSize: "12px" }}>
                      You will see them in the success message after registration.
                    </p>
                  </div>
                </div>

                <div className="sub-header">Personal Information</div>
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
                        {days.map(d => <option key={d}>{String(d).padStart(2, '0')}</option>)}
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

                {/* Password fields removed as they are now auto-generated */}



                {/* Submit */}
                <div className="submit-wrap">
                  <button 
                    className={`proceed-btn ${registrationFrozen ? 'frozen' : ''}`}
                    onClick={handleRegistrationSubmit} 
                    disabled={isSubmitting || registrationFrozen} 
                    suppressHydrationWarning={true}
                  >
                    {registrationFrozen ? '⏸ REGISTRATION FROZEN' : 'REGISTER MEMBER'}
                  </button>
                  {registrationFrozen && (
                    <div style={{ marginTop: '10px', textAlign: 'center', color: '#e53935', fontSize: '12px', fontWeight: '600' }}>
                      ⏸ System transition in progress (12:00 - 12:10)
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONGRATULATIONS MODAL ── */}
      {showCongratulations && newUserData && (
        <div className="congratulations-overlay">
          <div className="congratulations-card">
            <div className="congratulations-header">
              <span className="congratulations-icon">🎉</span>
              <h2>Congratulations!</h2>
              <p>Your account has been created successfully</p>
            </div>

            <div className="congratulations-body">
              <div className="details-section">
                <div className="detail-row">
                  <span className="detail-label">User ID</span>
                  <span className="detail-value">{newUserData.userId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{newUserData.fullName}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Mobile Number</span>
                  <span className="detail-value">+91 {newUserData.mobileNo}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Sponsor ID</span>
                  <span className="detail-value">{sponsorId}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">New Password</span>
                  <span className="detail-value">{newUserData.password}</span>
                </div>

                <div className="detail-row">
                  <span className="detail-label">Transaction Password</span>
                  <span className="detail-value">{newUserData.transactionPassword}</span>
                </div>
                
                <div className="detail-row" style={{ borderTop: "1px solid #eee", marginTop: "8px", paddingTop: "8px" }}>
                  <span className="detail-label" style={{ fontWeight: 700, color: "#26a69a" }}>Registration Time</span>
                  <span className="detail-value" style={{ fontWeight: 700, color: "#26a69a" }}>
                    {newUserData.regDate ? `${String(newUserData.regDate.getDate()).padStart(2, '0')}/${String(newUserData.regDate.getMonth() + 1).padStart(2, '0')}/${newUserData.regDate.getFullYear()} ${String(newUserData.regDate.getHours()).padStart(2, '0')}:${String(newUserData.regDate.getMinutes()).padStart(2, '0')}:${String(newUserData.regDate.getSeconds()).padStart(2, '0')}` : "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="congratulations-footer">
              <p>Please save these credentials securely. You can now log in to your account.</p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button
                  className="done-btn"
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                >
                  Go to Dashboard
                </button>
                <button
                  className="done-btn"
                  style={{ background: "#26a69a" }}
                  onClick={() => {
                    // Navigate to network tree with the selected position
                    const selectedPos = position === "Default (Auto-assigned)" ? "left" : position;
                    window.location.href = `/dashboard/networktree?userId=${encodeURIComponent(sponsorId)}&selectedPosition=${encodeURIComponent(selectedPos)}`;
                  }}
                >
                  View Network Tree
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REGISTERING LOADING OVERLAY ── */}
      {isRegistering && (
        <div className="loading-overlay">
          <div className="loading-circle"></div>
          <div className="loading-text">Registering User...</div>
          <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>Please wait while we set up the account</div>
        </div>
      )}
    </>
  );
}