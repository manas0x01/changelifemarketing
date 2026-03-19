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
    // Simulate API call
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .forgot-password-page {
          min-height: 100vh;
          width: 100%;
          background: linear-gradient(135deg, #1565c0 0%, #1976d2 40%, #0d47a1 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Poppins', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 20px;
        }

        /* Decorative arc rings - bottom left */
        .arc-left {
          position: absolute;
          bottom: -80px;
          left: -60px;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          border: 28px solid rgba(255,255,255,0.18);
          pointer-events: none;
        }
        .arc-left-inner {
          position: absolute;
          bottom: -30px;
          left: 10px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          border: 18px solid rgba(255,255,255,0.1);
          pointer-events: none;
        }

        /* Decorative arc rings - right */
        .arc-right {
          position: absolute;
          bottom: -60px;
          right: -40px;
          width: 340px;
          height: 340px;
          border-radius: 50%;
          border: 26px solid rgba(0, 200, 180, 0.25);
          pointer-events: none;
        }
        .arc-right-inner {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          border: 16px solid rgba(0, 200, 180, 0.15);
          pointer-events: none;
        }

        /* Glow blobs top-right */
        .blob-teal {
          position: absolute;
          top: 80px;
          right: 160px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,230,200,0.55) 0%, transparent 70%);
          filter: blur(8px);
          pointer-events: none;
        }
        .blob-blue {
          position: absolute;
          top: 140px;
          right: 100px;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(100,200,255,0.4) 0%, transparent 70%);
          filter: blur(6px);
          pointer-events: none;
        }

        /* Card */
        .card {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 720px;
          min-height: 450px;
          display: flex;
          flex-direction: row;
          overflow: hidden;
          position: relative;
          z-index: 10;
          box-shadow: 0 24px 60px rgba(0,0,0,0.22);
        }

        /* Left illustration panel */
        .card-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: #fff;
        }

        .illustration-wrapper {
          width: 100%;
          max-width: 240px;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* SVG illustration inline */
        .illustration-svg {
          width: 100%;
          height: auto;
        }

        /* Right form panel */
        .card-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 36px;
          border-left: 1px solid #f0f0f0;
        }

        /* Logo */
        .logo {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 18px;
        }
        .logo-bar {
          width: 4px;
          height: 36px;
          background: #2e7d32;
          border-radius: 2px;
          margin-right: 6px;
        }
        .logo-text {
          font-size: 26px;
          font-weight: 700;
          color: #1a237e;
          letter-spacing: -0.5px;
        }
        .logo-life {
          font-size: 16px;
          font-weight: 600;
          color: #e53935;
          font-style: italic;
          margin-left: 1px;
          vertical-align: super;
          line-height: 1;
        }

        .forgot-title {
          font-size: 26px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 8px;
        }

        .forgot-subtitle {
          font-size: 14px;
          color: #666;
          margin-bottom: 24px;
          line-height: 1.4;
        }

        /* Input fields */
        .input-group {
          display: flex;
          align-items: center;
          border-bottom: 1.5px solid #d0d0d0;
          margin-bottom: 18px;
          padding-bottom: 6px;
          gap: 8px;
          transition: border-color 0.2s;
        }
        .input-group:focus-within {
          border-color: #1565c0;
        }

        .input-icon {
          color: #888;
          font-size: 16px;
          flex-shrink: 0;
        }

        .input-field {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          background: transparent;
          padding: 2px 0;
          suppressHydrationWarning: true;
        }
        .input-field::placeholder {
          color: #aaa;
        }

        /* Error message */
        .error-msg {
          color: #e53935;
          font-size: 12px;
          margin-bottom: 10px;
          margin-top: -8px;
          padding: 8px 12px;
          background: #ffebee;
          border-radius: 4px;
        }

        /* Success message */
        .success-msg {
          color: #2e7d32;
          font-size: 12px;
          margin-bottom: 10px;
          margin-top: -8px;
          padding: 8px 12px;
          background: #e8f5e9;
          border-radius: 4px;
        }

        /* Back to Login link */
        .back-link {
          display: inline-block;
          color: #1565c0;
          font-size: 13px;
          text-decoration: underline;
          margin-bottom: 22px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #0d47a1;
        }

        /* Get Password button */
        .get-password-btn {
          background: #1565c0;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 40px;
          font-size: 15px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          letter-spacing: 0.3px;
          transition: background 0.2s, transform 0.1s;
          margin-bottom: 12px;
          align-self: flex-start;
        }
        .get-password-btn:hover {
          background: #0d47a1;
        }
        .get-password-btn:active {
          transform: scale(0.98);
        }
        .get-password-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Divider */
        .divider {
          margin: 20px 0;
          border: none;
          border-top: 1px solid #e0e0e0;
        }

        .divider-text {
          text-align: center;
          color: #999;
          font-size: 12px;
          margin: 16px 0;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .card {
            flex-direction: column;
            max-width: 400px;
            min-height: auto;
          }
          .card-left {
            padding: 30px 20px 10px;
          }
          .illustration-wrapper {
            max-width: 160px;
          }
          .card-right {
            border-left: none;
            border-top: 1px solid #f0f0f0;
            padding: 28px 24px;
          }
          .arc-left { width: 260px; height: 260px; }
          .arc-right { width: 240px; height: 240px; }
          .forgot-title {
            font-size: 22px;
          }
        }
      `}</style>

      <div className="forgot-password-page">
        {/* Background decorative elements */}
        <div className="arc-left" />
        <div className="arc-left-inner" />
        <div className="arc-right" />
        <div className="arc-right-inner" />
        <div className="blob-teal" />
        <div className="blob-blue" />

        {/* Card */}
        <div className="card">
          {/* Left — Illustration */}
          <div className="card-left">
            <div className="illustration-wrapper">
              <img
                src="/images/login.png"
                alt="Forgot Password"
                className="illustration-svg"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Right — Form */}
          <div className="card-right">
            {/* Logo */}
            <img
              src="/images/changelifemarketinglogo.png"
              alt="Change Life Marketing"
              style={{
                height: '60px',
                marginBottom: '18px',
                objectFit: 'contain'
              }}
            />

            <h2 className="forgot-title">Forgot Password?</h2>
            <p className="forgot-subtitle">
              Enter your User ID or Email address and we'll send you a link to reset your password.
            </p>

            {/* User ID */}
            <div className="input-group">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="Enter User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                suppressHydrationWarning={true}
              />
            </div>

            <div className="divider-text">OR</div>

            {/* Email */}
            <div className="input-group">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </span>
              <input
                type="email"
                className="input-field"
                placeholder="Enter Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                suppressHydrationWarning={true}
              />
            </div>

            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}

            {/* Get Password button */}
            <button
              className="get-password-btn"
              onClick={handleGetPassword}
              disabled={loading}
            >
              {loading ? "Sending..." : "Get Password"}
            </button>

            {/* Back to Login */}
            <Link href="/auth/login" className="back-link">
              Back To Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
