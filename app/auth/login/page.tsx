"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

interface Star {
  id: number;
  width: number;
  height: number;
  top: number;
  left: number;
  dur: number;
  delay: number;
  op: number;
}

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stars, setStars] = useState<Star[]>([]);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [smtpFallbackOtp, setSmtpFallbackOtp] = useState(""); // shown on-screen when SMTP not configured

  const generateStars = () => {
    const newStars: Star[] = Array.from({ length: 60 }, (_, i) => {
      const baseSeed = i * 73;
      return {
        id: i,
        width: seededRandom(baseSeed) * 2.5 + 1,
        height: seededRandom(baseSeed + 1) * 2.5 + 1,
        top: seededRandom(baseSeed + 2) * 100,
        left: seededRandom(baseSeed + 3) * 100,
        dur: seededRandom(baseSeed + 4) * 3 + 2,
        delay: seededRandom(baseSeed + 5) * 4,
        op: seededRandom(baseSeed + 6) * 0.5 + 0.4,
      };
    });
    setStars(newStars);
  };

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    setCaptcha({ num1, num2 });
    setCaptchaAnswer("");
    setCaptchaValid(false);
  };

  useEffect(() => { 
    generateStars();
    generateCaptcha(); 
  }, []);

  const handleCaptchaChange = (val: string) => {
    setCaptchaAnswer(val);
    setCaptchaValid(parseInt(val) === captcha.num1 + captcha.num2);
  };

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) { setError("Please enter username and password."); return; }
    if (showOtp && !otp.trim()) { setError("Please enter the 2FA code."); return; }
    if (!showOtp && !captchaValid) { setError("Incorrect captcha answer. Please try again."); generateCaptcha(); return; }
    setLoading(true);
    
    try {
      const result = await signIn("credentials", {
        username,
        password,
        // Always pass otp as a string — NextAuth drops undefined values before
        // they reach the authorize callback, so passing undefined when the user
        // hasn't entered an OTP would make the server think no OTP was supplied
        // even on the second (verify) step.
        otp: showOtp ? otp.trim() : "",
        redirect: false,
      });
      if (!result?.ok) {
        // Handle 2FA required — could be "2FA_REQUIRED" (email sent)
        // or "2FA_REQUIRED:XXXXXX" (SMTP not configured, code shown on screen)
        if (result?.error?.startsWith("2FA_REQUIRED")) {
          const parts = result.error.split(":");
          const fallbackCode = parts[1] || "";
          setShowOtp(true);
          if (fallbackCode) {
            // SMTP not configured — surface the OTP directly to the admin
            setSmtpFallbackOtp(fallbackCode);
            setOtp(fallbackCode); // auto-fill so admin can just click verify
          } else {
            setSmtpFallbackOtp("");
          }
          setError("");
          setLoading(false);
          return;
        }
        setError(result?.error || "Login failed. Please try again.");
        if (!showOtp) generateCaptcha();
        setLoading(false);
        return;
      }
      setLoading(false);
      sessionStorage.setItem("reloadDashboard", "true");
      // Fetch the session to check role and redirect accordingly
      const { getSession } = await import("next-auth/react");
      const session = await getSession();
      const role = (session?.user as any)?.role;
      setTimeout(() => {
        if (role === "admin" || role === "sub-admin") {
          router.push("/clm-portal/dashboard");
        } else {
          router.push("/dashboard");
        }
      }, 100);
    } catch (err) {
      setError("An error occurred. Please try again.");
      if (!showOtp) generateCaptcha();
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Nunito:wght@400;500;600;700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        .lp-root {
          height: 100vh;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(10px, 2vw, 12px) clamp(10px, 2vw, 12px);
          position: relative;
          overflow: hidden;
          background: #020d2e;
        }

        /* ── Starfield background ── */
        .lp-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, #0d3fa6 0%, transparent 70%),
            radial-gradient(ellipse 60% 50% at 80% 100%, #061a6e 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 20% 80%, #05134d 0%, transparent 60%),
            #020d2e;
          pointer-events: none;
        }

        /* Animated stars */
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

        /* Gold arc lines */
        .arcs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .arcs svg {
          width: 100%;
          height: 100%;
        }

        /* ── Branding above card ── */
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
          text-shadow: none;
          line-height: 1.1;
        }

        .brand-tagline {
          color: rgba(255,255,255,0.75);
          font-size: clamp(10px, 2vw, 12px);
          font-weight: 400;
          letter-spacing: 1.2px;
          margin-top: 2px;
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

        .card-logo {
          width: clamp(100px, 14vw, 110px);
          height: clamp(75px, 14vw, 110px);
          margin: clamp(6px, 1.5vw, 12px) auto clamp(10px, 1.5vw, 14px);
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

        .card-title {
          font-family: 'Nunito', sans-serif;
          font-size: clamp(17px, 3.5vw, 24px);
          font-weight: 700;
          color: #0d1d4a;
          margin-bottom: clamp(12px, 2.5vw, 20px);
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

        /* ── Captcha ── */
        .captcha-eq {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: clamp(4px, 1.5vw, 8px);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .cap-num { color: #e53935; }
        .cap-op, .cap-eq  { color: #333; }
        .cap-result { color: #111; }

        .captcha-field {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0f3ff;
          border: 1.5px solid #c8cfe8;
          border-radius: 10px;
          padding: 8px 12px;
          margin-bottom: clamp(4px, 1.5vw, 6px);
          transition: border-color 0.2s;
        }
        .captcha-field:focus-within { border-color: #1a4ec0; }
        .captcha-field.valid { border-color: #2ecc71; background: #f0fff5; }

        .captcha-field input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Nunito', sans-serif;
          font-size: clamp(13px, 3.5vw, 15px);
          color: #1a1a3e;
        }
        .captcha-field input::placeholder { color: #a0aac4; }
        .cap-check { color: #2ecc71; font-size: 18px; }

        .error-msg { color: #e53935; font-size: 11px; margin-bottom: clamp(6px, 1.5vw, 8px); }

        /* ── Forgot ── */
        .forgot {
          display: inline-block;
          color: #1565c0;
          font-size: 13px;
          font-weight: 600;
          text-decoration: underline;
          margin-bottom: clamp(11px, 2.5vw, 16px);
        }

        /* ── Login Button ── */
        .login-btn {
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
          margin-bottom: clamp(12px, 3vw, 18px);
        }
        .login-btn:hover { filter: brightness(1.12); }
        .login-btn:active { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* ── Social ── */
        .social-row {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-bottom: clamp(8px, 2vw, 14px);
        }
        .social-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .social-icon:hover { transform: translateY(-2px) scale(1.06); box-shadow: 0 6px 18px rgba(0,0,0,0.2); }

        .footer-text {
          text-align: center;
          font-size: 11px;
          color: #8895b5;
          margin-top: clamp(6px, 1.5vw, 10px);
        }
        .footer-link { color: #1565c0; text-decoration: underline; }

        /* ── Responsive ── */
        @media (max-width: 380px) {
          .card { padding: 12px clamp(10px, 2vw, 14px); border-radius: 16px; }
          .brand-tagline { word-spacing: 100vw; margin-top: 1px; }
          .brand-name { font-size: clamp(18px, 4vw, 28px); }
          .social-icon svg { width: 36px; height: 36px; }
        }
        @media (min-width: 768px) {
          .lp-root { justify-content: center; }
        }
      `}</style>

      <div className="lp-root">
        {/* Background */}
        <div className="lp-bg" />

        {/* Stars */}
        <div className="stars">
          {stars.map((star) => (
            <div key={star.id} className="star" style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              ['--dur' as string]: `${star.dur.toFixed(1)}s`,
              ['--delay' as string]: `${star.delay.toFixed(1)}s`,
              ['--op' as string]: `${star.op.toFixed(2)}`,
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
            {/* Top arcs */}
            <path d="M-100,200 Q300,80 700,320 Q900,420 1100,280" stroke="url(#gold1)" strokeWidth="1.5" fill="none"/>
            <path d="M-100,280 Q200,120 600,380 Q850,480 1100,360" stroke="url(#gold2)" strokeWidth="1" fill="none"/>
            <path d="M-50,350 Q250,160 650,440 Q880,540 1100,420" stroke="url(#gold1)" strokeWidth="0.8" fill="none" opacity="0.6"/>
            {/* Bottom arcs */}
            <path d="M-100,550 Q400,480 750,600 Q900,640 1100,580" stroke="url(#gold2)" strokeWidth="1.2" fill="none" opacity="0.5"/>
            <path d="M-100,620 Q350,540 700,660 Q900,700 1100,640" stroke="url(#gold1)" strokeWidth="0.9" fill="none" opacity="0.4"/>
            {/* Dots on arcs */}
            {[
              [140, 170], [320, 115], [520, 140], [720, 280], [850, 330],
              [200, 240], [450, 190], [650, 380], [820, 420],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r="3" fill="#f5c842" opacity="0.75"/>
            ))}
          </svg>
        </div>

        {/* Login Logo */}
        <div className="card-logo">
          <img src="/images/login.png" alt="Login" />
        </div>

        {/* Card */}
        <div className="card">
          <h2 className="card-title">{showOtp ? "Two-Factor Auth" : "Sign In"}</h2>

          {showOtp ? (
            <>
              {smtpFallbackOtp ? (
                /* SMTP not configured — show OTP directly on screen */
                <div style={{
                  background: "#fff8e1",
                  border: "2px solid #f59e0b",
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "16px",
                  textAlign: "center"
                }}>
                  <p style={{ fontSize: "12px", color: "#92400e", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    ⚠️ Email not configured — Use this code
                  </p>
                  <div style={{
                    fontSize: "28px",
                    fontWeight: 900,
                    letterSpacing: "8px",
                    color: "#1e3a8a",
                    fontFamily: "monospace",
                    background: "#e0f2fe",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    display: "inline-block",
                    marginBottom: "6px"
                  }}>
                    {smtpFallbackOtp}
                  </div>
                  <p style={{ fontSize: "11px", color: "#78350f", marginTop: "4px" }}>
                    Configure SMTP in environment variables to receive codes by email.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: "13px", color: "#556", marginBottom: "16px", lineHeight: "1.4" }}>
                  A 6-digit verification code has been sent to your administrative email. Please enter it below to complete your login.
                </p>
              )}
              {/* OTP Code */}
              <div className="field">
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input type="text" placeholder="6-digit OTP Code" value={otp} onChange={e => setOtp(e.target.value)} suppressHydrationWarning={true}/>
              </div>
            </>
          ) : (
            <>
              {/* Username */}
              <div className="field">
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input type="text" placeholder="Username / Member ID" value={username} onChange={e => setUsername(e.target.value)} suppressHydrationWarning={true}/>
              </div>

              {/* Password */}
              <div className="field">
                <span className="field-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} suppressHydrationWarning={true}/>
              </div>

              {/* Captcha */}
              <div className="captcha-eq">
                <span className="cap-num">{captcha.num1}</span>
                <span className="cap-op"> + </span>
                <span className="cap-num">{captcha.num2}</span>
                <span className="cap-op"> = </span>
                <span className="cap-result">{captchaValid ? captcha.num1 + captcha.num2 : "?"}</span>
              </div>
              <div className={`captcha-field${captchaValid ? " valid" : ""}`}>
                <input
                  type="number"
                  placeholder="Enter Correct Answer"
                  value={captchaAnswer}
                  onChange={e => handleCaptchaChange(e.target.value)}
                  suppressHydrationWarning={true}
                />
                {captchaValid && <span className="cap-check">✓</span>}
              </div>
            </>
          )}

          {error && <div className="error-msg">{error}</div>}

          {/* Forgot */}
          {!showOtp && (
            <Link href="/auth/forgotpassword" className="forgot">Forgot password?</Link>
          )}

          {showOtp && (
            <button
              type="button"
              style={{
                background: "none",
                border: "none",
                color: "#1565c0",
                textDecoration: "underline",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                marginBottom: "16px",
                display: "block",
                textAlign: "center",
                width: "100%"
              }}
              onClick={() => {
                setShowOtp(false);
                setOtp("");
                setError("");
                generateCaptcha();
              }}
            >
              Back to Login
            </button>
          )}

          {/* Login */}
          <button className="login-btn" onClick={handleLogin} disabled={loading} suppressHydrationWarning>
            {loading ? (showOtp ? "Verifying..." : "Logging in...") : (showOtp ? "Verify & Login" : "Login")}
          </button>

          {/* Social */}
          {!showOtp && (
            <div className="social-row">
              <a href="https://www.instagram.com/changelifemarketing?igsh=dzYxYWsza29qZHhm" className="social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <radialGradient id="ig2" cx="30%" cy="107%" r="150%">
                      <stop offset="0%" stopColor="#fdf497"/>
                      <stop offset="5%" stopColor="#fdf497"/>
                      <stop offset="45%" stopColor="#fd5949"/>
                      <stop offset="60%" stopColor="#d6249f"/>
                      <stop offset="90%" stopColor="#285aeb"/>
                    </radialGradient>
                  </defs>
                  <rect width="44" height="44" rx="11" fill="url(#ig2)"/>
                  <rect x="12" y="12" width="20" height="20" rx="5.5" stroke="white" strokeWidth="2.2" fill="none"/>
                  <circle cx="22" cy="22" r="5.5" stroke="white" strokeWidth="2.2" fill="none"/>
                  <circle cx="29" cy="15" r="1.5" fill="white"/>
                </svg>
              </a>
              <a href="https://www.facebook.com/share/183CFq7YEz/" className="social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                  <rect width="44" height="44" rx="11" fill="#1877F2"/>
                  <path d="M26 14h-3a2 2 0 0 0-2 2v3h-3v4h3v10h4V23h3l.5-4H24v-2.5A.5.5 0 0 1 24.5 16H26v-2z" fill="white"/>
                </svg>
              </a>
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