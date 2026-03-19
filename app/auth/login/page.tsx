"use client";

import { useState, useEffect } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Generate random captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    setCaptcha({ num1, num2 });
    setCaptchaAnswer("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    if (parseInt(captchaAnswer) !== captcha.num1 + captcha.num2) {
      setError("Incorrect captcha answer. Please try again.");
      generateCaptcha();
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setError("Invalid credentials. Please try again.");
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

        .login-page {
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
          min-height: 420px;
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

        .sign-in-title {
          font-size: 26px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 24px;
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
        }
        .input-field::placeholder {
          color: #aaa;
        }

        /* Captcha */
        .captcha-question {
          color: #e53935;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .captcha-input-group {
          display: flex;
          align-items: center;
          border-bottom: 1.5px solid #d0d0d0;
          margin-bottom: 18px;
          padding-bottom: 6px;
          gap: 8px;
          transition: border-color 0.2s;
        }
        .captcha-input-group:focus-within {
          border-color: #1565c0;
        }
        .captcha-arrow {
          color: #555;
          font-size: 16px;
          flex-shrink: 0;
        }

        /* Error message */
        .error-msg {
          color: #e53935;
          font-size: 12px;
          margin-bottom: 10px;
          margin-top: -8px;
        }

        /* Forgot password */
        .forgot-link {
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
        }
        .forgot-link:hover {
          color: #0d47a1;
        }

        /* Login button */
        .login-btn {
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
          margin-bottom: 24px;
          align-self: flex-start;
        }
        .login-btn:hover {
          background: #0d47a1;
        }
        .login-btn:active {
          transform: scale(0.98);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Social icons */
        .social-icons {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 20px;
        }

        .social-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          text-decoration: none;
        }
        .social-icon:hover {
          transform: scale(1.1);
          opacity: 0.85;
        }

        .footer-text {
          font-size: 12px;
          color: #888;
        }
        .footer-link {
          color: #1565c0;
          text-decoration: underline;
          cursor: pointer;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .card {
            flex-direction: column;
            max-width: 400px;
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
        }
      `}</style>

      <div className="login-page">
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
                alt="Change Life Marketing Logo"
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

            <h2 className="sign-in-title">Sign In</h2>

            {/* Username */}
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
                placeholder="Username / Member ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <span className="input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type="password"
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Captcha */}
            <div className="captcha-question">
              {captcha.num1} + {captcha.num2} =
            </div>
            <div className="captcha-input-group">
              <span className="captcha-arrow">→</span>
              <input
                type="number"
                className="input-field"
                placeholder="Enter Correct Answer"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
              />
            </div>

            {error && <div className="error-msg">{error}</div>}

            {/* Forgot password */}
            <button className="forgot-link" onClick={() => {}}>
              Forgot password?
            </button>

            {/* Login button */}
            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            {/* Social icons */}
            <div className="social-icons">
              {/* Instagram */}
              <a href="#" className="social-icon" aria-label="Instagram">
                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="igGrad" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497"/>
                      <stop offset="5%" stopColor="#fdf497"/>
                      <stop offset="45%" stopColor="#fd5949"/>
                      <stop offset="60%" stopColor="#d6249f"/>
                      <stop offset="90%" stopColor="#285aeb"/>
                    </radialGradient>
                  </defs>
                  <rect width="36" height="36" rx="9" fill="url(#igGrad)"/>
                  <rect x="10" y="10" width="16" height="16" rx="4.5" stroke="white" strokeWidth="2" fill="none"/>
                  <circle cx="18" cy="18" r="4.5" stroke="white" strokeWidth="2" fill="none"/>
                  <circle cx="24" cy="12" r="1.2" fill="white"/>
                </svg>
              </a>

              {/* Facebook */}
              <a href="#" className="social-icon" aria-label="Facebook">
                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <rect width="36" height="36" rx="9" fill="#1877F2"/>
                  <path d="M21 12h-2.5A1.5 1.5 0 0 0 17 13.5V16h4l-.5 4H17v9h-4v-9h-3v-4h3v-2.5C13 11.01 15.01 9 17.5 9H21v3z" fill="white"/>
                </svg>
              </a>

              {/* WhatsApp */}
              <a href="#" className="social-icon" aria-label="WhatsApp">
                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <rect width="36" height="36" rx="9" fill="#25D366"/>
                  <path d="M18 8C12.48 8 8 12.48 8 18c0 1.74.46 3.37 1.26 4.78L8 28l5.36-1.24A9.93 9.93 0 0 0 18 28c5.52 0 10-4.48 10-10S23.52 8 18 8zm4.98 13.98c-.22.62-1.28 1.18-1.76 1.22-.44.04-.86.2-2.86-.6-2.4-.96-3.94-3.38-4.06-3.54-.12-.16-.98-1.3-.98-2.48s.62-1.76.86-2c.22-.24.48-.3.64-.3h.48c.16 0 .38-.06.58.44.22.52.74 1.8.8 1.94.06.14.1.3.02.48-.08.18-.12.3-.24.46-.12.16-.26.36-.36.48-.12.14-.24.28-.1.54.14.26.62 1.02 1.34 1.64.92.82 1.68 1.08 1.92 1.2.24.12.38.1.52-.06.14-.18.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.16 1.18z" fill="white"/>
                </svg>
              </a>

              {/* YouTube */}
              <a href="#" className="social-icon" aria-label="YouTube">
                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <rect width="36" height="36" rx="9" fill="#FF0000"/>
                  <polygon points="13,10 13,26 27,18" fill="white"/>
                </svg>
              </a>
            </div>

            {/* Footer */}
            <p className="footer-text">
              © 2026 <a href="#" className="footer-link">Change Life Marketing</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}