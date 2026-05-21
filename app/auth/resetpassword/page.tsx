"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stars, setStars] = useState<any[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 60 }).map((_, i) => ({
      width: `${Math.random() * 2.5 + 1}px`,
      height: `${Math.random() * 2.5 + 1}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      dur: `${(Math.random() * 3 + 2).toFixed(1)}s`,
      delay: `${(Math.random() * 4).toFixed(1)}s`,
      op: `${(Math.random() * 0.5 + 0.4).toFixed(2)}`,
    }));
    setStars(generated);
  }, []);

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setError("Invalid reset token. Please request a new password reset link.");
        setValidating(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/resetpassword/validate?token=${token}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setTokenValid(true);
          setUsername(data.username || "");
        } else {
          setError(data.message || "Your password reset link is invalid or has expired.");
        }
      } catch (err) {
        setError("Could not validate the reset link. Please try again.");
      } finally {
        setValidating(false);
        setLoading(false);
      }
    }

    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 5) {
      setError("Password must be at least 5 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/resetpassword/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to reset password.");
        return;
      }

      setSuccess(data.message || "Your password has been successfully reset.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Nunito:wght@400;500;600;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        .rp-root {
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
        .rp-bg {
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
          margin-bottom: clamp(14px, 2.5vw, 20px);
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

        /* ── Messages ── */
        .error-msg {
          color: #e53935;
          font-size: 11.5px;
          margin-bottom: 14px;
          padding: 10px 14px;
          background: #fff0f0;
          border-radius: 8px;
          border-left: 3px solid #e53935;
          line-height: 1.4;
        }
        .success-msg {
          color: #1b7c3a;
          font-size: 11.5px;
          margin-bottom: 14px;
          padding: 10px 14px;
          background: #f0fff5;
          border-radius: 8px;
          border-left: 3px solid #2ecc71;
          line-height: 1.4;
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

        /* Spinner */
        .spinner {
          border: 3px solid rgba(13, 63, 166, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #1a4ec0;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 10px;
        }

        @media (max-width: 380px) {
          .card { padding: 12px clamp(10px, 2vw, 14px); border-radius: 16px; }
        }
      `}</style>

      <div className="rp-root">
        <div className="rp-bg" />

        {/* Stars */}
        <div className="stars">
          {stars.map((star, i) => (
            <div key={i} className="star" style={{
              width: star.width,
              height: star.height,
              top: star.top,
              left: star.left,
              ['--dur' as string]: star.dur,
              ['--delay' as string]: star.delay,
              ['--op' as string]: star.op,
            }} style-attributes-fix="" />
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
          </svg>
        </div>

        {/* Brand logo above card */}
        <div className="card-logo">
          <img src="/images/login.png" alt="Reset Password" />
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="card-title">Reset Password</h2>

          {validating ? (
            <div className="spinner-container">
              <div className="spinner" />
              <p className="card-subtitle" style={{ textAlign: "center", marginBottom: 0 }}>
                Verifying your reset link...
              </p>
            </div>
          ) : error && !tokenValid ? (
            <div>
              <div className="error-msg">{error}</div>
              <Link href="/auth/forgotpassword" className="back-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Request New Link
              </Link>
            </div>
          ) : success ? (
            <div>
              <div className="success-msg">{success}</div>
              <Link href="/auth/login" className="submit-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                Proceed to Login
              </Link>
            </div>
          ) : (
            <div>
              <p className="card-subtitle">
                Set a new password for user <strong>{username}</strong>.
              </p>

              {error && <div className="error-msg">{error}</div>}

              {/* Password */}
              <div className="field">
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Enter New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Confirm Password */}
              <div className="field">
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Resetting..." : "Reset Password"}
              </button>

              <Link href="/auth/login" className="back-link">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Back To Login
              </Link>
            </div>
          )}

          <p className="footer-text">
            © 2026 <a href="#" className="footer-link">Change Life Marketing</a>
          </p>
        </div>
      </div>
    </>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="rp-root" style={{ height: "100vh", width: "100%", background: "#020d2e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            border: "3px solid rgba(26, 78, 192, 0.1)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            borderLeftColor: "#1a4ec0",
            animation: "spin 1s linear infinite"
          }} />
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
