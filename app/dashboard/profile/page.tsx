"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Tab = "overview" | "myprofile" | "editbank";

const personalDetails = [
  { label: "Full Name",     value: "ajay kumar" },
  { label: "Gender",        value: "Male" },
  { label: "Date of Birth", value: "01 Jan 1991" },
  { label: "Mobile No.",    value: "6204720770" },
  { label: "Pan No.",       value: "FVEPK3555E" },
  { label: "Email",         value: "ajaysharmamlm71@gmail.com" },
  { label: "State",         value: "Bihar" },
  { label: "District",      value: "Patna" },
  { label: "City",          value: "Masaurhi" },
  { label: "Address",       value: "Kailuachk" },
  { label: "Pincode",       value: "804452" },
];

const bankDetails = [
  { label: "Bank Name",    value: "CENTER BANK OF INDIA" },
  { label: "Branch Name",  value: "MASAURHI" },
  { label: "Account No.",  value: "5511182971" },
  { label: "IFSC",         value: "CBIN0284349" },
  { label: "Account Type", value: "SAVING" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("profile");
  const router = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .profile-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        /* ── GREEN BAR ── */
        .green-bar {
          height: 8px;
          background: linear-gradient(90deg, #00c853, #1de9b6);
        }

        /* ── BREADCRUMB ── */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px;
          color: #555;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb a { color: #555; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .breadcrumb .sep { color: #999; }
        .breadcrumb .current { color: #333; font-weight: 500; }

        /* ── PROFILE HERO CARD ── */
        .hero-card {
          background: #fff;
          margin: 0 20px 20px;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
        }

        /* Banner */
        .hero-banner {
          width: 100%;
          height: 220px;
          background: #111;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* WELCOME text rendered purely in CSS */
        .welcome-text {
          text-align: center;
          user-select: none;
          pointer-events: none;
        }
        .welcome-line1 {
          font-size: clamp(32px, 6vw, 72px);
          font-weight: 900;
          letter-spacing: 10px;
          text-transform: uppercase;
          background: linear-gradient(180deg, #ffffff 0%, #888888 50%, #444 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          text-shadow: none;
          font-family: 'Poppins', sans-serif;
        }
        .welcome-line2 {
          font-size: clamp(12px, 2vw, 22px);
          font-weight: 600;
          letter-spacing: 18px;
          text-transform: uppercase;
          background: linear-gradient(180deg, #cccccc 0%, #666 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 4px;
          font-family: 'Poppins', sans-serif;
        }

        /* Subtle dark vignette overlay */
        .hero-banner::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%);
          pointer-events: none;
        }

        /* Avatar + name strip */
        .hero-strip {
          background: #111;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 10px 20px 14px;
          position: relative;
        }
        .hero-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 4px solid #fff;
          box-shadow: 0 3px 12px rgba(0,0,0,0.25);
          flex-shrink: 0;
          margin-top: -55px;
          position: relative;
          z-index: 2;
          object-fit: cover;
        }
        .hero-username {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          padding-bottom: 2px;
        }

        /* ── TABS ── */
        .tabs {
          display: flex;
          gap: 0;
          padding: 0 20px;
          border-bottom: 1px solid #e0e0e0;
          background: #fff;
        }
        .tab-btn {
          padding: 12px 20px;
          font-size: 13.5px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          border: none;
          background: none;
          font-family: 'Poppins', sans-serif;
          position: relative;
          transition: color 0.18s;
          border-bottom: 2px solid transparent;
        }
        .tab-btn:hover { color: #333; }
        .tab-btn.active {
          color: #e53935;
          border-bottom: 2px solid #e53935;
        }

        /* ── CONTENT GRID ── */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          padding: 20px;
        }
        @media (max-width: 768px) {
          .content-grid { grid-template-columns: 1fr; }
          .hero-avatar { width: 80px; height: 80px; margin-top: -40px; }
          .hero-banner { height: 160px; }
        }

        /* ── DETAIL CARD ── */
        .detail-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        .detail-header {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 11px 18px;
          font-size: 12.5px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        /* ── DETAIL ROWS ── */
        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 18px;
          border-bottom: 1px solid #f0f0f0;
          transition: background 0.12s;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-row:hover { background: #fafafa; }

        .detail-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #222;
          flex-shrink: 0;
        }
        .detail-value {
          font-size: 13.5px;
          font-weight: 400;
          color: #555;
          text-align: right;
          margin-left: 16px;
          word-break: break-all;
        }

        /* ── MY PROFILE TAB ── */
        .edit-form {
          padding: 20px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

        .form-group { display: flex; flex-direction: column; gap: 5px; }
        .form-label { font-size: 12.5px; font-weight: 600; color: #444; }
        .form-input {
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 9px 12px;
          font-size: 13px;
          font-family: 'Poppins', sans-serif;
          color: #333;
          outline: none;
          transition: border-color 0.18s;
        }
        .form-input:focus { border-color: #26a69a; }

        .save-btn {
          margin-top: 18px;
          background: linear-gradient(90deg, #26c6da, #1de9b6);
          color: #fff;
          border: none;
          border-radius: 7px;
          padding: 10px 28px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: opacity 0.18s, transform 0.15s;
        }
        .save-btn:hover { opacity: 0.88; transform: translateY(-1px); }
      `}</style>

      <div className="profile-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* ── TOP NAV COMPONENT ── */}
        <Navbar
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          setActivePage={setActivePage}
        />

        {/* Green accent bar */}
        <div className="green-bar" />

        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          <Link href="/dashboard">Home</Link>
          <span className="sep">/</span>
          <Link href="/dashboard/profile">Profile Management</Link>
          <span className="sep">/</span>
          <span className="current">Profile</span>
        </div>

        {/* ── HERO CARD ── */}
        <div className="hero-card">
          {/* Banner */}
          <div className="hero-banner">
            <div className="welcome-text">
              <div className="welcome-line1">WELCOME</div>
              <div className="welcome-line2">TO &nbsp;&nbsp; MY &nbsp;&nbsp; PROFILE</div>
            </div>
          </div>

          {/* Avatar + Name strip */}
          <div className="hero-strip">
            <img src="/images/user.png" alt="User Avatar" className="hero-avatar" />
            <span className="hero-username">ajay kumar (Sm674643)</span>
          </div>

          {/* Tabs */}
          <div className="tabs">
            {(["overview", "myprofile", "editbank"] as Tab[]).map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => {
                  if (tab === "myprofile") {
                    router.push("/dashboard/updateprofile");
                  } else if (tab === "editbank") {
                    router.push("/dashboard/editbank");
                  } else {
                    setActiveTab(tab);
                  }
                }}
              >
                {tab === "overview" ? "Overview" : tab === "myprofile" ? "My Profile" : "Edit Bank"}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        {(activeTab === "overview" || activeTab === "myprofile") && (
          <div className="content-grid">
            {/* Personal Details */}
            <div className="detail-card">
              <div className="detail-header">Personal Details</div>
              {personalDetails.map((row) => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Bank Details */}
            <div className="detail-card" style={{ alignSelf: "flex-start" }}>
              <div className="detail-header">Bank Details</div>
              {bankDetails.map((row) => (
                <div className="detail-row" key={row.label}>
                  <span className="detail-label">{row.label}</span>
                  <span className="detail-value">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}