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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [captchaValid, setCaptchaValid] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [smtpFallbackOtp, setSmtpFallbackOtp] = useState("");

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;
    setCaptcha({ num1, num2 });
    setCaptchaAnswer("");
    setCaptchaValid(false);
  };

  useEffect(() => {
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
        otp: showOtp ? otp.trim() : "",
        redirect: false,
      });
      if (!result?.ok) {
        if (result?.error?.startsWith("2FA_REQUIRED")) {
          const parts = result.error.split(":");
          const fallbackCode = parts[1] || "";
          setShowOtp(true);
          if (fallbackCode) {
            setSmtpFallbackOtp(fallbackCode);
            setOtp(fallbackCode);
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
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Nunito:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --gold: #c8962a;
          --gold-light: #f5c842;
          --gold-text: linear-gradient(135deg, #c8962a 0%, #f5c842 50%, #c8962a 100%);
          --page-bg: #e8eaf0;
          --card-bg: #eef0f5;
          --neu-light: #ffffff;
          --neu-dark: #c5c8d0;
          --text-dark: #1a1f3a;
          --text-mid: #5a6080;
          --text-light: #8890b0;
          --blue-primary: #1e3fa8;
          --blue-dark: #112485;
          --radius-card: 28px;
          --radius-input: 14px;
        }

        html, body { height: 100%; width: 100%; overflow: hidden; }

        /* ── Root layout ── */
        .lp-root {
          height: 100vh;
          height: 100svh;
          width: 100%;
          font-family: 'Nunito', sans-serif;
          background: var(--page-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          position: relative;
          overflow: hidden;
        }

        /* Soft ambient blobs */
        .lp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 15% 20%, rgba(255,200,80,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 85% 75%, rgba(30,63,168,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 70% 40% at 50% 90%, rgba(200,150,42,0.05) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        /* Decorative circles (corner orbs like the screenshot) */
        .orb {
          position: fixed;
          border-radius: 50%;
          background: rgba(255,255,255,0.55);
          box-shadow: inset -4px -4px 10px rgba(180,185,200,0.5), inset 4px 4px 10px rgba(255,255,255,0.9);
          pointer-events: none;
          z-index: 0;
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          55% { transform: translate(15px, -15px) scale(1.05); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          45% { transform: translate(-10px, 20px) scale(0.95); }
        }
        .orb-1 { width: 90px; height: 90px; top: 30px; left: -20px; opacity: 0.7; animation: floatOrb1 14s ease-in-out infinite; }
        .orb-2 { width: 60px; height: 60px; top: 80px; right: 10px; opacity: 0.6; animation: floatOrb2 12s ease-in-out infinite 1s; }
        .orb-3 { width: 50px; height: 50px; bottom: 120px; left: 20px; opacity: 0.5; animation: floatOrb1 16s ease-in-out infinite 2s; }
        .orb-4 { width: 70px; height: 70px; bottom: 40px; right: 30px; opacity: 0.6; animation: floatOrb2 15s ease-in-out infinite 0.5s; }
        .orb-5 { width: 40px; height: 40px; top: 45%; left: 5px; opacity: 0.4; animation: floatOrb1 10s ease-in-out infinite 3s; }
        .orb-6 { width: 35px; height: 35px; top: 35%; right: 8px; opacity: 0.35; animation: floatOrb2 11s ease-in-out infinite 1.5s; }

        /* ── Desktop: 2-column layout ── */
        .lp-wrapper {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 960px;
          display: flex;
          align-items: stretch;
          gap: 0;
        }

        /* Left panel — branding */
        .lp-brand-panel {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 36px;
          background: linear-gradient(155deg, #0b1d5e 0%, #1e3fa8 40%, #0d3180 70%, #071550 100%);
          position: relative;
          overflow: hidden;
          flex: 0 0 42%;
        }

        /* Gold arc decorations inside brand panel */
        .brand-arcs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .brand-arcs svg { width: 100%; height: 100%; }

        /* Stars in brand panel */
        .brand-stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .bstar {
          position: absolute;
          border-radius: 50%;
          background: #fff;
          animation: btwinkle var(--dur, 3s) ease-in-out infinite var(--delay, 0s);
          opacity: 0;
        }
        @keyframes btwinkle {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: var(--op, 0.8); transform: scale(1.3); }
        }

        .brand-logo-wrap {
          position: relative;
          z-index: 2;
          margin-bottom: 24px;
          filter: drop-shadow(0 0 28px rgba(255,200,50,0.45));
          animation: floatLogo 4s ease-in-out infinite;
        }
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .brand-logo-wrap img {
          width: 130px;
          height: 130px;
          object-fit: contain;
        }

        .brand-name {
          position: relative;
          z-index: 2;
          font-family: 'Cinzel', serif;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: 5px;
          background: linear-gradient(135deg, #f5c842 0%, #fff8d0 40%, #c8962a 70%, #f5c842 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 6px;
          text-align: center;
        }

        .brand-tagline {
          position: relative;
          z-index: 2;
          color: rgba(255,255,255,0.6);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 36px;
        }

        .brand-tagline span {
          display: block;
          color: rgba(245,200,66,0.8);
          font-size: 10px;
          margin-top: 2px;
          letter-spacing: 3px;
        }

        .brand-divider {
          position: relative;
          z-index: 2;
          width: 80px;
          height: 1.5px;
          background: linear-gradient(90deg, transparent, rgba(245,200,66,0.6), transparent);
          margin: 0 auto 28px;
        }

        .brand-pills {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        @keyframes floatPill {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .brand-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 12px 16px;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        .brand-pill:nth-child(1) { animation: floatPill 6s ease-in-out infinite; }
        .brand-pill:nth-child(2) { animation: floatPill 7s ease-in-out infinite 0.8s; }
        .brand-pill:nth-child(3) { animation: floatPill 6.5s ease-in-out infinite 1.6s; }

        .brand-pill:hover {
          transform: translateY(-2px) scale(1.03);
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(245, 200, 66, 0.35);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .brand-pill-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(245,200,66,0.15);
          border: 1px solid rgba(245,200,66,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #f5c842;
        }

        .brand-pill-text {
          flex: 1;
        }
        .brand-pill-text strong {
          display: block;
          color: rgba(255,255,255,0.9);
          font-size: 13px;
          font-weight: 700;
        }
        .brand-pill-text span {
          font-size: 11px;
          color: rgba(255,255,255,0.45);
        }

        /* ── Right panel — card ── */
        .lp-card-panel {
          flex: 1;
          background: var(--card-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 36px;
          position: relative;
        }

        /* Mobile: top logo above card */
        .mobile-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: -8px;
          flex-shrink: 0;
        }
        .mobile-logo img {
          width: 180px;
          height: 180px;
          object-fit: contain;
          filter: drop-shadow(0 6px 24px rgba(200,150,42,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.12));
          animation: floatLogo 4s ease-in-out infinite;
        }

        .card-inner {
          width: 100%;
          max-width: 340px;
        }

        .card-title {
          font-family: 'Nunito', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: var(--text-dark);
          margin-bottom: 4px;
          letter-spacing: -0.3px;
          text-align: center;
        }

        .card-subtitle {
          font-size: 13px;
          color: var(--text-light);
          margin-bottom: 28px;
          font-weight: 400;
        }

        /* Title underline accent */
        .title-accent {
          width: 36px;
          height: 3px;
          background: linear-gradient(90deg, var(--gold), var(--gold-light));
          border-radius: 2px;
          margin-bottom: 24px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ── Neumorphic input fields ── */
        .neu-field {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--card-bg);
          border-radius: var(--radius-input);
          padding: 14px 16px;
          margin-bottom: 14px;
          box-shadow:
            inset 4px 4px 10px rgba(160,165,180,0.45),
            inset -4px -4px 10px rgba(255,255,255,0.85);
          transition: box-shadow 0.25s;
          position: relative;
        }

        .neu-field:focus-within {
          box-shadow:
            inset 4px 4px 10px rgba(140,145,165,0.5),
            inset -4px -4px 10px rgba(255,255,255,0.9),
            0 0 0 2px rgba(200,150,42,0.2);
        }

        .field-icon {
          color: var(--text-light);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          transition: color 0.25s, transform 0.25s;
        }
        .neu-field:focus-within .field-icon {
          color: var(--gold);
          transform: scale(1.08);
        }

        .neu-field input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Nunito', sans-serif;
          font-size: 14px;
          color: var(--text-dark);
          font-weight: 500;
        }
        .neu-field input::placeholder { color: var(--text-light); font-weight: 400; }

        .eye-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-light);
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.2s;
        }
        .eye-btn:hover { color: var(--text-mid); }

        /* ── Captcha ── */
        .captcha-label {
          font-size: 12px;
          font-weight: 800;
          color: #e53935;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .captcha-nums {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(229, 57, 53, 0.08);
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 13px;
          font-weight: 700;
        }
        .cap-num { color: #e53935; }
        .cap-op { color: #e53935; }

        /* ── Row: Remember + Forgot ── */
        .options-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
          margin-top: 4px;
        }

        .remember-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .neu-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          background: var(--card-bg);
          box-shadow:
            2px 2px 5px rgba(160,165,180,0.5),
            -2px -2px 5px rgba(255,255,255,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: none;
          outline: none;
        }
        .neu-checkbox.checked {
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          box-shadow:
            inset 2px 2px 4px rgba(150,100,0,0.3),
            inset -1px -1px 3px rgba(255,255,200,0.4);
          color: white;
        }

        .remember-label {
          font-size: 12.5px;
          color: var(--text-mid);
          font-weight: 500;
          cursor: pointer;
          user-select: none;
        }

        .forgot-link {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--blue-primary);
          text-decoration: none;
          transition: color 0.2s;
        }
        .forgot-link:hover { color: var(--gold); }

        /* ── Sign In Button ── */
        .signin-btn {
          width: 100%;
          padding: 15px 20px;
          border-radius: var(--radius-input);
          border: none;
          background: linear-gradient(135deg, #1e3fa8 0%, #112485 100%);
          color: #fff;
          font-family: 'Nunito', sans-serif;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 1.5px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow:
            6px 6px 18px rgba(30,63,168,0.4),
            -2px -2px 8px rgba(255,255,255,0.6),
            inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.25s;
          margin-bottom: 20px;
          position: relative;
          overflow: hidden;
        }
        .signin-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .signin-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 40%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.25),
            transparent
          );
          transform: skewX(-25deg);
          pointer-events: none;
        }
        .signin-btn:hover:not(:disabled)::before {
          animation: btnShine 1.5s infinite;
        }
        @keyframes btnShine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .signin-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            8px 10px 24px rgba(30,63,168,0.5),
            -2px -2px 8px rgba(255,255,255,0.6),
            inset 0 1px 0 rgba(255,255,255,0.15);
        }
        .signin-btn:hover:not(:disabled) .btn-arrow {
          transform: translateX(4px);
        }
        .signin-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
        .signin-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        .btn-arrow {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255,255,255,0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.25s ease;
        }

        /* ── Login form shadow card ── */
        .login-card {
          background: var(--card-bg);
          border-radius: 22px;
          padding: 20px 20px 20px;
          margin-bottom: 16px;
          box-shadow:
            10px 10px 30px rgba(140,145,165,0.55),
            -6px -6px 20px rgba(255,255,255,1),
            0 2px 50px rgba(0,0,0,0.06);
        }

        /* ── Social ── */
        .social-row {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
          margin-top: 4px;
        }
        .social-icon {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .social-icon:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        .social-icon svg {
          width: 100%;
          height: 100%;
          border-radius: 11px;
          display: block;
        }

        /* ── Secure badge ── */
        .secure-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--card-bg);
          border-radius: 12px;
          padding: 10px 16px;
          box-shadow:
            3px 3px 8px rgba(160,165,180,0.4),
            -3px -3px 8px rgba(255,255,255,0.85);
        }
        .secure-icon {
          color: var(--gold);
          display: flex;
          align-items: center;
        }
        .secure-text strong {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-dark);
        }
        .secure-text span {
          font-size: 10px;
          color: var(--text-light);
        }

        /* ── Error ── */
        .error-msg {
          color: #e53935;
          font-size: 12px;
          margin-bottom: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(229,57,53,0.07);
          border-radius: 8px;
          padding: 8px 12px;
        }

        /* ── OTP screen ── */
        .otp-info {
          background: var(--card-bg);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          box-shadow:
            inset 3px 3px 7px rgba(160,165,180,0.4),
            inset -2px -2px 6px rgba(255,255,255,0.8);
          font-size: 13px;
          color: var(--text-mid);
          line-height: 1.5;
        }

        .otp-fallback {
          background: #fff8e1;
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          text-align: center;
        }
        .otp-fallback-label {
          font-size: 11px;
          color: #92400e;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .otp-code {
          font-size: 30px;
          font-weight: 900;
          letter-spacing: 10px;
          color: #1e3a8a;
          font-family: monospace;
          background: #e0f2fe;
          border-radius: 8px;
          padding: 8px 16px;
          display: inline-block;
          margin-bottom: 6px;
        }
        .otp-fallback-note {
          font-size: 11px;
          color: #78350f;
        }

        .back-btn {
          background: none;
          border: none;
          color: var(--blue-primary);
          font-family: 'Nunito', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          display: block;
          width: 100%;
          text-align: center;
          margin-bottom: 16px;
          transition: color 0.2s;
        }
        .back-btn:hover { color: var(--gold); }

        /* ── Responsive ── */

        /* Desktop */
        @media (min-width: 768px) {
          .lp-root {
            padding: 32px 24px;
          }
          .lp-brand-panel {
            display: flex;
          }
          .mobile-logo {
            display: none;
          }
          .lp-card-panel {
            padding: 48px 44px;
          }
          .card-inner {
            max-width: 320px;
          }
          .orb-1 { width: 130px; height: 130px; top: -20px; left: -30px; animation: floatOrb1 18s ease-in-out infinite; }
          .orb-2 { width: 90px; height: 90px; top: 60px; right: 40px; animation: floatOrb2 15s ease-in-out infinite 1s; }
          .orb-3 { width: 70px; height: 70px; bottom: 100px; left: 40px; animation: floatOrb1 20s ease-in-out infinite 2s; }
          .orb-4 { width: 100px; height: 100px; bottom: 20px; right: 60px; animation: floatOrb2 18s ease-in-out infinite 0.5s; }
          .orb-5 { display: none; }
          .orb-6 { display: none; }
        }

        /* Large desktop */
        @media (min-width: 1024px) {
          .lp-wrapper {
            max-width: 1000px;
          }
          .lp-brand-panel {
            flex: 0 0 44%;
            padding: 56px 44px;
          }
          .brand-name { font-size: 32px; }
          .lp-card-panel {
            padding: 56px 52px;
          }
        }

        /* Mobile-only tweaks */
        @media (max-width: 767px) {
          .lp-root {
            padding: 0;
            align-items: stretch;
          }
          .lp-wrapper {
            flex-direction: column;
            width: 100%;
            height: 100%;
            max-height: 100svh;
          }
          .lp-card-panel {
            padding: 16px 20px 20px;
            flex: 1;
            overflow-y: auto;
            justify-content: flex-start;
          }
        }

        @media (max-width: 380px) {
          .lp-card-panel { padding: 12px 16px 16px; }
          .card-title { font-size: 20px; }
          .mobile-logo { margin-bottom: -6px; }
          .mobile-logo img { width: 140px; height: 140px; }
          .neu-field { padding: 10px 14px; margin-bottom: 10px; }
          .signin-btn { padding: 12px 16px; margin-bottom: 14px; }
          .options-row { margin-bottom: 14px; }
          .secure-badge { padding: 8px 12px; }
          .captcha-label { font-size: 11px; }
          .social-row { margin-bottom: 14px; }
        }

        /* Fade-in animation */
        .fade-in {
          animation: fadeInUp 0.5s ease both;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-delay { animation-delay: 0.1s; }
        .fade-in-delay2 { animation-delay: 0.2s; }
      `}</style>

      <div className="lp-root">
        {/* Decorative orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />
        <div className="orb orb-6" />

        <div className="lp-wrapper fade-in">

          {/* ── Left brand panel (desktop only) ── */}
          <div className="lp-brand-panel">
            {/* Stars */}
            <div className="brand-stars">
              {Array.from({ length: 40 }, (_, i) => {
                const s = i * 73;
                return (
                  <div key={i} className="bstar" suppressHydrationWarning style={{
                    width: `${(seededRandom(s) * 2 + 1).toFixed(5)}px`,
                    height: `${(seededRandom(s) * 2 + 1).toFixed(5)}px`,
                    top: `${(seededRandom(s + 2) * 100).toFixed(5)}%`,
                    left: `${(seededRandom(s + 3) * 100).toFixed(5)}%`,
                    ['--dur' as string]: `${(seededRandom(s + 4) * 3 + 2).toFixed(1)}s`,
                    ['--delay' as string]: `${(seededRandom(s + 5) * 4).toFixed(1)}s`,
                    ['--op' as string]: `${(seededRandom(s + 6) * 0.5 + 0.4).toFixed(2)}`,
                  }} />
                );
              })}
            </div>

            {/* Gold arc decorations */}
            <div className="brand-arcs" aria-hidden>
              <svg viewBox="0 0 500 700" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="40%" stopColor="#c8962a" stopOpacity="0.5" />
                    <stop offset="70%" stopColor="#f5e06e" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path d="M-50,150 Q150,60 350,220 Q450,280 550,200" stroke="url(#g1)" strokeWidth="1.5" fill="none" />
                <path d="M-50,230 Q100,120 300,300 Q420,370 550,290" stroke="url(#g1)" strokeWidth="1" fill="none" opacity="0.6" />
                <path d="M-50,500 Q200,440 350,560 Q450,600 550,540" stroke="url(#g1)" strokeWidth="1.2" fill="none" opacity="0.5" />
                {[[80, 130], [200, 90], [340, 185], [420, 220], [150, 200], [300, 270]].map(([cx, cy], i) => (
                  <circle key={i} cx={cx} cy={cy} r="2.5" fill="#f5c842" opacity="0.7" />
                ))}
              </svg>
            </div>

            {/* Logo */}
            <div className="brand-logo-wrap">
              <img src="/images/login.png" alt="Change Life Marketing" />
            </div>

            <div className="brand-name">CHANGE LIFE</div>
            <div className="brand-tagline">
              MARKETING
              <span>SMART EARNING. POWERFUL NETWORKING.</span>
            </div>
            <div className="brand-divider" />

            {/* Feature pills */}
            <div className="brand-pills">
              <div className="brand-pill">
                <div className="brand-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                </div>
                <div className="brand-pill-text">
                  <strong>Smart Earnings</strong>
                  <span>Track income in real time</span>
                </div>
              </div>
              <div className="brand-pill">
                <div className="brand-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="brand-pill-text">
                  <strong>Powerful Network</strong>
                  <span>Build your downline effortlessly</span>
                </div>
              </div>
              <div className="brand-pill">
                <div className="brand-pill-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="brand-pill-text">
                  <strong>Better Life</strong>
                  <span>Financial freedom awaits you</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right card panel ── */}
          <div className="lp-card-panel">

            {/* Mobile logo (hidden on desktop) */}
            <div className="mobile-logo fade-in">
              <img src="/images/WhatsApp_Image_2026-06-11_at_9.53.38_AM-removebg-preview.png" alt="Change Life Marketing" />
            </div>

            <div className="card-inner fade-in fade-in-delay">
              {showOtp ? (
                <>
                  <div className="card-title">Two-Factor Auth</div>
                  <div className="title-accent" />

                  {smtpFallbackOtp ? (
                    <div className="otp-fallback">
                      <div className="otp-fallback-label">⚠️ Email not configured — Use this code</div>
                      <div className="otp-code">{smtpFallbackOtp}</div>
                      <div className="otp-fallback-note">Configure SMTP in environment variables to receive codes by email.</div>
                    </div>
                  ) : (
                    <div className="otp-info">
                      A 6-digit verification code has been sent to your administrative email. Enter it below to complete login.
                    </div>
                  )}

                  {/* OTP field */}
                  <div className="neu-field">
                    <span className="field-icon">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input type="text" placeholder="6-digit OTP code" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} suppressHydrationWarning />
                  </div>

                  {error && <div className="error-msg">⚠ {error}</div>}

                  <button className="signin-btn" onClick={handleLogin} disabled={loading} suppressHydrationWarning>
                    {loading ? "Verifying..." : "Verify & Login"}
                    <span className="btn-arrow">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </button>

                  <button className="back-btn" type="button" onClick={() => { setShowOtp(false); setOtp(""); setError(""); generateCaptcha(); }}>
                    ← Back to Login
                  </button>
                </>
              ) : (
                <>
                  <div className="login-card">
                    <div className="card-title">Login</div>
                    <div className="title-accent" />

                    {/* Username */}
                    <div className="neu-field">
                      <span className="field-icon">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input type="text" placeholder="Username / Member ID" value={username} onChange={e => setUsername(e.target.value)} suppressHydrationWarning />
                    </div>

                    {/* Password */}
                    <div className="neu-field">
                      <span className="field-icon">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </span>
                      <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} suppressHydrationWarning />
                      <button className="eye-btn" type="button" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Captcha */}
                    <div className="captcha-label">
                      Solve:&nbsp;
                      <span className="captcha-nums">
                        <span className="cap-num">{captcha.num1}</span>
                        <span className="cap-op"> + </span>
                        <span className="cap-num">{captcha.num2}</span>
                        <span className="cap-op"> = ?</span>
                      </span>
                    </div>
                    <div className={`neu-field${captchaValid ? " neu-field-valid" : ""}`} style={captchaValid ? { boxShadow: 'inset 4px 4px 10px rgba(140,145,165,0.45), inset -4px -4px 10px rgba(255,255,255,0.9), 0 0 0 2px rgba(46,204,113,0.25)' } : {}}>
                      <span className="field-icon" style={{ color: captchaValid ? '#2ecc71' : undefined }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 11 12 14 22 4" />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                      </span>
                      <input type="number" placeholder="Enter your answer" value={captchaAnswer} onChange={e => handleCaptchaChange(e.target.value)} suppressHydrationWarning />
                      {captchaValid && (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    {/* Remember + Forgot */}
                    <div className="options-row">
                      <div className="remember-wrap" onClick={() => setRememberMe(r => !r)}>
                        <div className={`neu-checkbox${rememberMe ? " checked" : ""}`}>
                          {rememberMe && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <span className="remember-label">Remember me</span>
                      </div>
                      <Link href="/auth/forgotpassword" className="forgot-link">Forgot Password?</Link>
                    </div>

                    {error && <div className="error-msg">⚠ {error}</div>}

                    {/* Sign In */}
                    <button className="signin-btn" onClick={handleLogin} disabled={loading} suppressHydrationWarning>
                      {loading ? "Signing in..." : "Sign In"}
                      <span className="btn-arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </svg>
                      </span>
                    </button>

                  </div>{/* end login-card */}

                  {/* Social */}
                  <div className="social-row">
                    <a href="https://www.instagram.com/changelifemarketing?igsh=dzYxYWsza29qZHhm" className="social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                      <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <radialGradient id="ig2" cx="30%" cy="107%" r="150%">
                            <stop offset="0%" stopColor="#fdf497" />
                            <stop offset="5%" stopColor="#fdf497" />
                            <stop offset="45%" stopColor="#fd5949" />
                            <stop offset="60%" stopColor="#d6249f" />
                            <stop offset="90%" stopColor="#285aeb" />
                          </radialGradient>
                        </defs>
                        <rect width="44" height="44" rx="11" fill="url(#ig2)" />
                        <rect x="12" y="12" width="20" height="20" rx="5.5" stroke="white" strokeWidth="2.2" fill="none" />
                        <circle cx="22" cy="22" r="5.5" stroke="white" strokeWidth="2.2" fill="none" />
                        <circle cx="29" cy="15" r="1.5" fill="white" />
                      </svg>
                    </a>
                    <a href="https://www.facebook.com/share/183CFq7YEz/" className="social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                      <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                        <rect width="44" height="44" rx="11" fill="#1877F2" />
                        <path d="M26 14h-3a2 2 0 0 0-2 2v3h-3v4h3v10h4V23h3l.5-4H24v-2.5A.5.5 0 0 1 24.5 16H26v-2z" fill="white" />
                      </svg>
                    </a>
                  </div>

                  {/* Secure badge */}
                  <div className="secure-badge">
                    <div className="secure-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" />
                      </svg>
                    </div>
                    <div className="secure-text">
                      <strong>Secure Login</strong>
                      <span>Your data is protected</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}