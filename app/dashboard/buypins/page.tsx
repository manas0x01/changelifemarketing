"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const PIN_COST   = 1299;          // ₹ per pin
const RAZORPAY_KEY = "rzp_test_YourKeyHere"; // Replace with your Razorpay Key ID

const packages = [
  { id: "agri",    name: "Agriculture Package",  icon: "🌾" },
  { id: "health",  name: "Healthcare Package",   icon: "🏥" },
  { id: "sanit",   name: "Sanitary Napkine",     icon: "✨" },
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

async function sendConfirmationEmail(params: {
  userName: string;
  email: string;
  memberId: string;
  packageName: string;
  pins: number;
  amount: number;
  paymentId: string;
}) {
  return new Promise<void>((resolve) => setTimeout(resolve, 600));
}

/* ─── Load Razorpay Script ──────────────────────────────── */
function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/* ─── Main Component ────────────────────────────────────── */
export default function BuyEPinPage() {
  const [selectedPkg,   setSelectedPkg]   = useState(packages[0].id);
  const [numPins,       setNumPins]       = useState(1);
  const [txnPassword,   setTxnPassword]   = useState("");
  const [step,          setStep]          = useState<"form" | "paying" | "success" | "error">("form");
  const [paymentId,     setPaymentId]     = useState("");
  const [errorMsg,      setErrorMsg]      = useState("");
  const [formError,     setFormError]     = useState("");
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [activePage,    setActivePage]    = useState<"dashboard" | "profile">("dashboard");

  const totalAmount = numPins * PIN_COST;
  const pkg         = packages.find(p => p.id === selectedPkg)!;

  // User info (in real app, from auth context)
  const user = {
    userName: "ajay kumar",
    memberId: "Sm674643",
    email:    "ajaysharmamlm71@gmail.com",
  };

  const handlePinChange = (val: number) => {
    if (val < 1) val = 1;
    if (val > 99) val = 99;
    setNumPins(val);
  };

  const handleBuy = async () => {
    setFormError("");
    if (!txnPassword.trim()) {
      setFormError("Please enter your transaction password.");
      return;
    }

    setStep("paying");

    try {
      const verifyResponse = await fetch('/api/auth/verify-transaction-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionPassword: txnPassword }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        setFormError(verifyData.error || 'Transaction password verification failed');
        setStep("form");
        return;
      }

      // If verification passed, proceed with Razorpay
      const loaded = await loadRazorpay();
      if (!loaded) {
        setErrorMsg("Razorpay failed to load. Please check your internet connection.");
        setStep("error");
        return;
      }

      const options = {
        key:          RAZORPAY_KEY,
        amount:       totalAmount * 100,   // paise
        currency:     "INR",
        name:         "Swamini Life",
        description:  `Buy ${numPins} E-Pin(s) — ${pkg.name}`,
        image:        "",
        handler: async (response: { razorpay_payment_id: string }) => {
          const pid = response.razorpay_payment_id;
          setPaymentId(pid);

          // Send confirmation email
          await sendConfirmationEmail({
            userName:    user.userName,
            email:       user.email,
            memberId:    user.memberId,
            packageName: pkg.name,
            pins:        numPins,
            amount:      totalAmount,
            paymentId:   pid,
          });

          setStep("success");
        },
        prefill: {
          name:  user.userName,
          email: user.email,
        },
        notes: {
          memberId:    user.memberId,
          package:     pkg.name,
          pins:        String(numPins),
        },
        theme: { color: "#26a69a" },
        modal: {
          ondismiss: () => {
            setStep("form");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      setErrorMsg("Payment could not be initiated. Please try again.");
      setStep("error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .bp-root { font-family:'Poppins',sans-serif; background:#f0f2f5; min-height:100vh; }

        .green-bar { height:8px; background:linear-gradient(90deg,#00c853,#1de9b6); }
        
        /* Navbar styling removed - using Navbar component */

        .breadcrumb { padding:12px 20px; font-size:13px; color:#555; display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:#555; text-decoration:none; }
        .breadcrumb a:hover { text-decoration:underline; }
        .breadcrumb .sep { color:#999; }

        /* PAGE BODY */
        .page-body { padding:20px; display:flex; justify-content:center; }

        /* CARD */
        .buy-card {
          width:100%; max-width:620px;
          background:#fff; border-radius:14px;
          box-shadow:0 4px 24px rgba(0,0,0,0.10);
          overflow:hidden;
        }

        /* HEADER */
        .card-header {
          background:linear-gradient(90deg,#26a69a,#1de9b6);
          padding:18px 24px;
          display:flex; align-items:center; gap:12px;
        }
        .card-header-icon {
          width:42px; height:42px; border-radius:50%;
          background:rgba(255,255,255,0.22);
          display:flex; align-items:center; justify-content:center;
          font-size:20px;
        }
        .card-header-text h2 { font-size:16px; font-weight:700; color:#fff; }
        .card-header-text p  { font-size:12.5px; color:rgba(255,255,255,0.85); }

        /* PRICE BANNER */
        .price-banner {
          background:linear-gradient(135deg,#1b5e20 0%,#2e7d32 100%);
          margin:0; padding:14px 24px;
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:8px;
        }
        .price-per {
          font-size:13px; color:rgba(255,255,255,0.8);
        }
        .price-per strong { font-size:22px; color:#69f0ae; font-weight:700; }
        .price-per span   { font-size:13px; color:rgba(255,255,255,0.7); }

        .total-price {
          text-align:right;
        }
        .total-label { font-size:12px; color:rgba(255,255,255,0.7); }
        .total-val   { font-size:26px; font-weight:800; color:#fff; line-height:1; }
        .total-pins  { font-size:11.5px; color:rgba(255,255,255,0.6); }

        /* FORM */
        .form-body { padding:24px; }

        .form-group { margin-bottom:20px; }
        .form-label { font-size:13px; font-weight:600; color:#333; display:block; margin-bottom:7px; }
        .form-label .req { color:#e53935; margin-right:2px; }

        /* Package selector */
        .pkg-grid {
          display:grid; grid-template-columns:repeat(3,1fr);
          gap:10px;
        }
        @media(max-width:500px){ .pkg-grid { grid-template-columns:1fr; } }

        .pkg-card {
          border:2px solid #e0e0e0; border-radius:10px;
          padding:12px 10px; text-align:center;
          cursor:pointer; transition:all .18s;
        }
        .pkg-card:hover { border-color:#26a69a; background:#f0fdf9; }
        .pkg-card.selected {
          border-color:#26a69a; background:#e0f7f4;
          box-shadow:0 0 0 3px rgba(38,166,154,0.15);
        }
        .pkg-icon  { font-size:24px; margin-bottom:5px; }
        .pkg-name  { font-size:11.5px; font-weight:600; color:#333; }

        /* Pin counter */
        .pin-counter {
          display:flex; align-items:center; gap:0;
          border:1.5px solid #d0d0d0; border-radius:8px;
          overflow:hidden; width:fit-content;
        }
        .counter-btn {
          width:44px; height:44px; border:none; background:#f5f5f5;
          font-size:20px; font-weight:700; color:#333; cursor:pointer;
          transition:background .15s; display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
        }
        .counter-btn:hover { background:#e0f7f4; color:#26a69a; }
        .counter-btn:active { background:#b2dfdb; }
        .counter-input {
          width:70px; height:44px; text-align:center;
          border:none; border-left:1.5px solid #e0e0e0; border-right:1.5px solid #e0e0e0;
          font-size:18px; font-weight:700; color:#1a1a2e;
          font-family:'Poppins',sans-serif; outline:none;
          background:#fff;
        }
        /* Remove spinners */
        .counter-input::-webkit-outer-spin-button,
        .counter-input::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        .counter-input[type=number] { -moz-appearance:textfield; }

        .pin-hint { font-size:11.5px; color:#888; margin-top:5px; }

        /* Amount breakdown */
        .amount-box {
          background:linear-gradient(135deg,#f0fdf9,#e8f5e9);
          border:1px solid #b2dfdb; border-radius:10px;
          padding:14px 16px;
        }
        .amount-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:5px 0;
        }
        .amount-row + .amount-row { border-top:1px dashed #c8e6c9; }
        .amount-label { font-size:13px; color:#555; }
        .amount-val   { font-size:13px; font-weight:600; color:#1b5e20; }
        .amount-row.total .amount-label { font-size:14px; font-weight:700; color:#1b5e20; }
        .amount-row.total .amount-val   { font-size:18px; font-weight:800; color:#26a69a; }

        /* TXN Password */
        .form-input {
          width:100%; border:1.5px solid #d0d0d0; border-radius:8px;
          padding:11px 14px; font-size:13.5px;
          font-family:'Poppins',sans-serif; color:#333;
          outline:none; transition:border-color .18s, box-shadow .18s;
        }
        .form-input:focus { border-color:#26a69a; box-shadow:0 0 0 3px rgba(38,166,154,0.12); }
        .form-input::placeholder { color:#bbb; }

        /* Error */
        .form-error {
          background:#fdecea; border-left:4px solid #e53935; border-radius:4px;
          padding:9px 13px; font-size:13px; color:#c62828;
          margin-bottom:16px; display:flex; align-items:center; gap:6px;
        }

        /* Buy button */
        .buy-btn {
          width:100%; background:linear-gradient(90deg,#1976d2,#1565c0);
          color:#fff; border:none; border-radius:10px;
          padding:14px; font-size:15px; font-weight:700;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition:opacity .18s, transform .15s;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 14px rgba(25,118,210,0.35);
          margin-top:4px;
        }
        .buy-btn:hover  { opacity:0.91; transform:translateY(-1px); }
        .buy-btn:active { transform:scale(0.99); }
        .buy-btn:disabled { opacity:0.55; cursor:not-allowed; }

        .razorpay-note {
          display:flex; align-items:center; justify-content:center; gap:6px;
          font-size:11.5px; color:#888; margin-top:10px;
        }

        /* ── PAYING STATE ── */
        .paying-state {
          padding:48px 24px; text-align:center;
        }
        .spinner {
          width:52px; height:52px; border-radius:50%;
          border:4px solid #e0e0e0;
          border-top-color:#26a69a;
          animation:spin 0.9s linear infinite;
          margin:0 auto 18px;
        }
        @keyframes spin { to { transform:rotate(360deg); } }
        .paying-title { font-size:16px; font-weight:600; color:#333; margin-bottom:6px; }
        .paying-sub   { font-size:13px; color:#888; }

        /* ── SUCCESS STATE ── */
        .success-state {
          padding:40px 24px; text-align:center;
        }
        .success-icon {
          width:72px; height:72px; border-radius:50%;
          background:linear-gradient(135deg,#26a69a,#1de9b6);
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 18px;
          box-shadow:0 6px 20px rgba(38,166,154,0.35);
          animation:popIn .4s cubic-bezier(.175,.885,.32,1.275);
        }
        @keyframes popIn {
          from { transform:scale(0); opacity:0; }
          to   { transform:scale(1); opacity:1; }
        }
        .success-title { font-size:20px; font-weight:800; color:#1b5e20; margin-bottom:8px; }
        .success-sub   { font-size:13.5px; color:#555; margin-bottom:20px; line-height:1.6; }

        .success-details {
          background:#f0fdf9; border:1px solid #b2dfdb; border-radius:10px;
          padding:16px; text-align:left; margin-bottom:22px;
        }
        .detail-row { display:flex; justify-content:space-between; padding:5px 0; font-size:13px; }
        .detail-row + .detail-row { border-top:1px dashed #c8e6c9; }
        .detail-key { color:#555; }
        .detail-val { font-weight:600; color:#1b5e20; }

        .email-note {
          background:#e3f2fd; border-radius:8px; padding:12px 14px;
          font-size:12.5px; color:#1565c0; display:flex; align-items:center; gap:8px;
          margin-bottom:20px; text-align:left;
        }

        .buy-again-btn {
          background:linear-gradient(90deg,#26a69a,#1de9b6);
          color:#fff; border:none; border-radius:8px;
          padding:12px 32px; font-size:14px; font-weight:600;
          font-family:'Poppins',sans-serif; cursor:pointer;
          transition:opacity .18s; box-shadow:0 3px 12px rgba(38,166,154,0.3);
        }
        .buy-again-btn:hover { opacity:0.88; }

        /* ── ERROR STATE ── */
        .error-state {
          padding:48px 24px; text-align:center;
        }
        .error-icon {
          width:64px; height:64px; border-radius:50%; background:#fdecea;
          display:flex; align-items:center; justify-content:center;
          margin:0 auto 16px; font-size:28px;
        }
        .error-title { font-size:17px; font-weight:700; color:#c62828; margin-bottom:6px; }
        .error-sub   { font-size:13px; color:#888; margin-bottom:20px; }
        .retry-btn {
          background:#1976d2; color:#fff; border:none; border-radius:8px;
          padding:11px 32px; font-size:14px; font-weight:600;
          font-family:'Poppins',sans-serif; cursor:pointer;
        }
      `}</style>

      <div className="bp-root">

        {/* TOP NAV */}
        <Navbar
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setActivePage={setActivePage}
        />

        <div className="green-bar" />

        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="#">Home</a>
          <span className="sep">/</span>
          <a href="#">E-Pin Management</a>
          <span className="sep">/</span>
          <span>Buy E-Pin</span>
        </div>

        <div className="page-body">
          <div className="buy-card">

            {/* ── HEADER ── */}
            <div className="card-header">
              <div className="card-header-icon">🔑</div>
              <div className="card-header-text">
                <h2>Buy E-Pin</h2>
                <p>Secure purchase via Razorpay</p>
              </div>
            </div>

            {/* ── PRICE BANNER ── */}
            <div className="price-banner">
              <div className="price-per">
                Price per pin<br />
                <strong>₹{PIN_COST.toLocaleString("en-IN")}</strong>
                <span> / pin</span>
              </div>
              <div className="total-price">
                <div className="total-label">Total Amount</div>
                <div className="total-val">₹{totalAmount.toLocaleString("en-IN")}</div>
                <div className="total-pins">{numPins} pin{numPins > 1 ? "s" : ""} × ₹{PIN_COST}</div>
              </div>
            </div>

            {/* ── STATES ── */}
            {step === "paying" && (
              <div className="paying-state">
                <div className="spinner" />
                <div className="paying-title">Processing Payment…</div>
                <div className="paying-sub">Please complete the payment in the Razorpay window.</div>
              </div>
            )}

            {step === "success" && (
              <div className="success-state">
                <div className="success-icon">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                </div>
                <div className="success-title">Payment Successful! 🎉</div>
                <div className="success-sub">
                  Your E-Pins have been purchased successfully.<br />
                  A confirmation email has been sent to <strong>{user.email}</strong>
                </div>

                <div className="success-details">
                  <div className="detail-row"><span className="detail-key">Member Name</span><span className="detail-val">{user.userName}</span></div>
                  <div className="detail-row"><span className="detail-key">Member ID</span><span className="detail-val">{user.memberId}</span></div>
                  <div className="detail-row"><span className="detail-key">Package</span><span className="detail-val">{pkg.icon} {pkg.name}</span></div>
                  <div className="detail-row"><span className="detail-key">Pins Purchased</span><span className="detail-val">{numPins} Pin{numPins > 1 ? "s" : ""}</span></div>
                  <div className="detail-row"><span className="detail-key">Amount Paid</span><span className="detail-val">₹{totalAmount.toLocaleString("en-IN")}</span></div>
                  <div className="detail-row"><span className="detail-key">Payment ID</span><span className="detail-val" style={{fontSize:11.5}}>{paymentId}</span></div>
                </div>

                <div className="email-note">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1565c0"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  Confirmation email with pin details has been sent to <strong style={{marginLeft:3}}>{user.email}</strong>
                </div>

                <button className="buy-again-btn" onClick={() => { setStep("form"); setTxnPassword(""); setNumPins(1); }}>
                  Buy More Pins
                </button>
              </div>
            )}

            {step === "error" && (
              <div className="error-state">
                <div className="error-icon">❌</div>
                <div className="error-title">Payment Failed</div>
                <div className="error-sub">{errorMsg}</div>
                <button className="retry-btn" onClick={() => setStep("form")}>Try Again</button>
              </div>
            )}

            {step === "form" && (
              <div className="form-body">
                {/* Package Selection */}
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Select Package :</label>
                  <div className="pkg-grid">
                    {packages.map(p => (
                      <div
                        key={p.id}
                        className={`pkg-card ${selectedPkg === p.id ? "selected" : ""}`}
                        onClick={() => setSelectedPkg(p.id)}
                      >
                        <div className="pkg-icon">{p.icon}</div>
                        <div className="pkg-name">{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Number of Pins */}
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Number of E-Pins :</label>
                  <div className="pin-counter">
                    <button className="counter-btn" onClick={() => handlePinChange(numPins - 1)}>−</button>
                    <input
                      className="counter-input"
                      type="number"
                      min={1} max={99}
                      value={numPins}
                      onChange={(e) => handlePinChange(parseInt(e.target.value) || 1)}
                    />
                    <button className="counter-btn" onClick={() => handlePinChange(numPins + 1)}>+</button>
                  </div>
                  <div className="pin-hint">Min: 1 pin &nbsp;|&nbsp; Max: 99 pins per order</div>
                </div>

                {/* Amount Breakdown */}
                <div className="form-group">
                  <label className="form-label">Amount Breakdown :</label>
                  <div className="amount-box">
                    <div className="amount-row">
                      <span className="amount-label">Price per Pin</span>
                      <span className="amount-val">₹{PIN_COST.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="amount-row">
                      <span className="amount-label">Number of Pins</span>
                      <span className="amount-val">× {numPins}</span>
                    </div>
                    <div className="amount-row">
                      <span className="amount-label">GST / Tax</span>
                      <span className="amount-val">Included</span>
                    </div>
                    <div className="amount-row total">
                      <span className="amount-label">Total Payable</span>
                      <span className="amount-val">₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Transaction Password */}
                <div className="form-group">
                  <label className="form-label"><span className="req">*</span>Transaction Password :</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Enter Transaction Password"
                    value={txnPassword}
                    onChange={(e) => { setTxnPassword(e.target.value); setFormError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleBuy()}
                  />
                </div>

                {formError && (
                  <div className="form-error">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#c62828"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {formError}
                  </div>
                )}

                {/* Buy Button */}
                <button className="buy-btn" onClick={handleBuy}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
                  Pay ₹{totalAmount.toLocaleString("en-IN")} via Razorpay
                </button>

                <div className="razorpay-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#888"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                  Secured by Razorpay &nbsp;|&nbsp; 256-bit SSL Encryption
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}