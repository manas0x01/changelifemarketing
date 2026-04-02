"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!userId && !email) {
      setError("Please enter User ID or Email address.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess("Password reset link has been sent to your email address.");
      setUserId("");
      setEmail("");
    }, 1500);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Nunito:wght@400;500;600;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        .fp-root {
          height: 100vh;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 2vw, 12px);
          position: relative;
          overflow: hidden;
          background: #020d2e;
        }

        /* ── Starfield background ── */
        .fp-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, #0d3fa6 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 100%, #061a6e 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 20% 80%, #05134d 0%, transparent 60%),
            #020d2e;
          pointer-events: none;
        }

        .stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .star {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: twinkle var(--dur, 3s) ease-in-out infinite var(--delay, 0s);
          opacity: 0;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: var(--op, 0.8); transform: scale(1.2); }
        }

        .arcs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .arcs svg { width: 100%; height: 100%; }

        /* ── Brand above card ── */
        .brand {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: clamp(8px, 2vw, 14px);
          animation: fadeDown 0.7s ease both;
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .brand-logo {
          width: clamp(50px, 10vw, 70px);
          height: clamp(50px, 10vw, 70px);
          margin-bottom: 8px;
          filter: drop-shadow(0 0 18px rgba(255,200,50,0.6));
        }

        .brand-name {
          font-family: 'Cinzel', serif;
          font-size: clamp(20px, 4.5vw, 32px);
          font-weight: 700;
          letter-spacing: 4px;
          background: linear-gradient(135deg, #f5c842 0%, #ffeaa0 40%, #d4930a 70%, #f5c842 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
        }

        .brand-tagline {
          color: rgba(255,255,255,0.75);
          font-size: clamp(10px, 2vw, 12px);
          font-weight: 400;
          letter-spacing: 1.2px;
          margin-top: 2px;
        }

        /* ── Login logo above card ── */
        .card-logo {
          width: clamp(80px, 14vw, 100px);
          height: clamp(60px, 14vw, 90px);
          margin: clamp(6px, 1.5vw, 10px) auto clamp(8px, 1.5vw, 12px);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
          animation: fadeDown 0.7s ease both;
        }
        .card-logo img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.15));
        }

        /* ── Card ── */
        .card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 360px;
          background: rgba(245, 247, 255, 0.96);
          border-radius: 20px;
          padding: clamp(14px, 2.5vw, 26px) clamp(12px, 2.5vw, 26px);
          box-shadow: 0 8px 60px rgba(0,0,100,0.45), 0 0 0 1px rgba(255,255,255,0.08);
          animation: fadeUp 0.7s ease 0.15s both;
          overflow-y: auto;
          max-height: 80vh;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .card-title {
          font-family: 'Nunito', sans-serif;
          font-size: clamp(17px, 3.5vw, 24px);
          font-weight: 700;
          color: #0d1d4a;
          margin-bottom: 4px;
        }

        .card-subtitle {
          font-size: clamp(11px, 2.5vw, 13px);
          color: #6b7a9e;
          margin-bottom: clamp(14px, 3vw, 20px);
          line-height: 1.5;
        }

        /* ── Inputs ── */
        .field {
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1.5px solid #c8cfe8;
          padding-bottom: 8px;
          margin-bottom: clamp(11px, 2.5vw, 16px);
          transition: border-color 0.2s;
        }
        .field:focus-within { border-color: #1a4ec0; }

        .field-icon { color: #8895b5; flex-shrink: 0; }

        .field input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Nunito', sans-serif;
          font-size: clamp(13px, 3.5vw, 15px);
          color: #1a1a3e;
        }
        .field input::placeholder { color: #a0aac4; }

        /* ── OR divider ── */
        .or-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: clamp(11px, 2.5vw, 16px);
          margin-top: -4px;
        }
        .or-line {
          flex: 1;
          height: 1px;
          background: #d0d8ee;
        }
        .or-text {
          font-size: 12px;
          font-weight: 700;
          color: #8895b5;
          letter-spacing: 1px;
        }

        /* ── Messages ── */
        .error-msg {
          color: #e53935;
          font-size: 11px;
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #fff0f0;
          border-radius: 8px;
          border-left: 3px solid #e53935;
        }
        .success-msg {
          color: #1b7c3a;
          font-size: 11px;
          margin-bottom: 10px;
          padding: 8px 12px;
          background: #f0fff5;
          border-radius: 8px;
          border-left: 3px solid #2ecc71;
        }

        /* ── Button ── */
        .submit-btn {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 2.5px solid #c8962a;
          background: linear-gradient(180deg, #1e3fa8 0%, #112485 100%);
          color: #fff;
          font-family: 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 1px;
          cursor: pointer;
          box-shadow: 0 0 0 1px rgba(200,150,42,0.3), 0 4px 24px rgba(10,30,120,0.35);
          transition: filter 0.2s, transform 0.1s;
          margin-bottom: clamp(12px, 3vw, 16px);
        }
        .submit-btn:hover { filter: brightness(1.12); }
        .submit-btn:active { transform: scale(0.98); }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── Back link ── */
        .back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #1565c0;
          font-size: 13px;
          font-weight: 600;
          text-decoration: underline;
          margin-bottom: 4px;
          cursor: pointer;
          text-underline-offset: 2px;
        }
        .back-link:hover { color: #0d47a1; }

        .footer-text {
          text-align: center;
          font-size: 11px;
          color: #8895b5;
          margin-top: clamp(10px, 2vw, 14px);
        }
        .footer-link { color: #1565c0; text-decoration: underline; }

        @media (max-width: 380px) {
          .card { padding: 12px clamp(10px, 2vw, 14px); border-radius: 16px; }
        }
      `}</style>

      <div className="fp-root">
        <div className="fp-bg" />

        {/* Stars */}
        <div className="stars">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="star" style={{
              width: `${Math.random() * 2.5 + 1}px`,
              height: `${Math.random() * 2.5 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              ['--dur' as string]: `${(Math.random() * 3 + 2).toFixed(1)}s`,
              ['--delay' as string]: `${(Math.random() * 4).toFixed(1)}s`,
              ['--op' as string]: `${(Math.random() * 0.5 + 0.4).toFixed(2)}`,
            }} />
          ))}
        </div>

        {/* Gold arc decorations */}
        <div className="arcs" aria-hidden>
          <svg viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gold1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="40%" stopColor="#c8962a" stopOpacity="0.7"/>
                <stop offset="70%" stopColor="#f5e06e" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>
              <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="50%" stopColor="#c8962a" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>
            </defs>
            <path d="M-100,200 Q300,80 700,320 Q900,420 1100,280" stroke="url(#gold1)" strokeWidth="1.5" fill="none"/>
            <path d="M-100,280 Q200,120 600,380 Q850,480 1100,360" stroke="url(#gold2)" strokeWidth="1" fill="none"/>
            <path d="M-50,350 Q250,160 650,440 Q880,540 1100,420" stroke="url(#gold1)" strokeWidth="0.8" fill="none" opacity="0.6"/>
            <path d="M-100,550 Q400,480 750,600 Q900,640 1100,580" stroke="url(#gold2)" strokeWidth="1.2" fill="none" opacity="0.5"/>
            <path d="M-100,620 Q350,540 700,660 Q900,700 1100,640" stroke="url(#gold1)" strokeWidth="0.9" fill="none" opacity="0.4"/>
            {[
              [140,170],[320,115],[520,140],[720,280],[850,330],
              [200,240],[450,190],[650,380],[820,420],
            ].map(([cx,cy],i) => (
              <circle key={i} cx={cx} cy={cy} r="3" fill="#f5c842" opacity="0.75"/>
            ))}
          </svg>
        </div>

        {/* Login image above card */}
        <div className="card-logo">
          <img src="/images/login.png" alt="Forgot Password" />
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="card-title">Forgot Password?</h2>
          <p className="card-subtitle">
            Enter your User ID or Email and we'll send you a reset link.
          </p>
          
          {/* User ID */}
          <div className="field">
            <span className="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Enter User ID"
              value={userId}
              onChange={e => setUserId(e.target.value)}
            />
          </div>

          {/* OR */}
          <div className="or-divider">
            <div className="or-line" />
            <span className="or-text">OR</span>
            <div className="or-line" />
          </div>

          {/* Email */}
          <div className="field">
            <span className="field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </span>
            <input
              type="email"
              placeholder="Enter Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <button className="submit-btn" onClick={handleGetPassword} disabled={loading}>
            {loading ? "Sending..." : "Get Password"}
          </button>

          <Link href="/auth/login" className="back-link">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back To Login
          </Link>

          <p className="footer-text">
            © 2026 <a href="#" className="footer-link">Change Life Marketing</a>
          </p>
        </div>
      </div>
    </>
  );
}