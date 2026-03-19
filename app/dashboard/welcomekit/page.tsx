"use client";

import React from "react";
import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";

export default function WelcomeKitPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const certRef    = useRef<HTMLDivElement>(null);
  const idRef      = useRef<HTMLDivElement>(null);
  const visitRef   = useRef<HTMLDivElement>(null);

  const handleDownload = (label: string) => {
    alert(`Downloading ${label}…`);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=UnifrakturMaguntia&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .wk-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }

        /* GREEN BAR */
        .green-bar { height: 8px; background: linear-gradient(90deg,#00c853,#1de9b6); }

        /* BREADCRUMB */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px; color: #555;
          display: flex; align-items: center; gap: 6px;
        }
        .breadcrumb a { color: #555; text-decoration: none; }
        .breadcrumb a:hover { text-decoration: underline; }
        .breadcrumb .sep { color: #999; }
        .breadcrumb .current { color: #333; font-weight: 500; }

        /* PAGE BODY */
        .page-body { padding: 0 20px 40px; }

        /* SECTION TITLE */
        .section-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a2e;
          margin-bottom: 10px;
        }

        /* DOWNLOAD BTN */
        .dl-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 9px 22px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          margin-bottom: 16px;
          transition: background .18s, transform .15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .dl-btn:hover { background: #1565c0; transform: translateY(-1px); }

        /* ═══════════════════════════════════════
           CERTIFICATE
        ═══════════════════════════════════════ */
        .cert-wrap {
          border: 2px solid #c97b3b;
          border-radius: 4px;
          width: 760px;
          max-width: 100%;
          overflow: hidden;
          position: relative;
          background: #fff;
          min-height: 500px;
          display: flex;
        }

        /* Left decorative column */
        .cert-left-deco {
          width: 130px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .cert-deco-navy {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 90px;
          background: #1a3561;
          clip-path: ellipse(90px 120% at 0% 50%);
        }
        .cert-deco-green-top {
          position: absolute;
          top: -10px; right: -10px;
          width: 100px; height: 220px;
          background: #5cb85c;
          border-radius: 0 0 50% 0;
          transform: rotate(-10deg);
        }
        .cert-deco-teal-bottom {
          position: absolute;
          bottom: -10px; right: -20px;
          width: 100px; height: 200px;
          background: #5bc8c8;
          border-radius: 50% 0 0 0;
          transform: rotate(10deg);
        }
        .cert-deco-green-bottom {
          position: absolute;
          bottom: 40px; left: 0;
          width: 80px; height: 120px;
          background: #4caf50;
          border-radius: 0 50% 0 0;
        }

        /* Right decorative column */
        .cert-right-deco {
          width: 100px;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .cert-rdeco-navy {
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 70px;
          background: #1a3561;
          clip-path: ellipse(70px 120% at 100% 50%);
        }
        .cert-rdeco-green {
          position: absolute;
          top: -10px; left: 0;
          width: 80px; height: 200px;
          background: #6bc76b;
          border-radius: 0 0 0 50%;
          transform: rotate(8deg);
        }
        .cert-rdeco-teal {
          position: absolute;
          top: 120px; left: -10px;
          width: 80px; height: 160px;
          background: #4dd0e1;
          border-radius: 50% 0 0 0;
          transform: rotate(-5deg);
        }

        /* Certificate main content */
        .cert-content {
          flex: 1;
          padding: 36px 32px 32px;
          display: flex;
          flex-direction: column;
        }

        /* Logo */
        .cert-logo {
          display: flex; align-items: center; justify-content: center;
          gap: 4px; margin-bottom: 20px;
        }
        .cert-logo-bar { width: 4px; height: 32px; background: #2e7d32; border-radius: 2px; margin-right: 4px; }
        .cert-logo-text { font-size: 22px; font-weight: 700; color: #1a237e; letter-spacing: -0.3px; }
        .cert-logo-life { font-size: 14px; font-weight: 600; color: #e53935; font-style: italic; vertical-align: super; }

        /* Certificate heading */
        .cert-heading {
          font-family: 'UnifrakturMaguntia', cursive;
          font-size: 32px;
          color: #111;
          text-align: center;
          margin-bottom: 22px;
        }

        .cert-presented {
          font-size: 15px; font-weight: 400;
          color: #333; text-align: center;
          margin-bottom: 6px;
        }
        .cert-name {
          font-size: 34px; font-weight: 700;
          color: #111; text-align: center;
          margin-bottom: 18px;
          font-family: 'Poppins', sans-serif;
        }
        .cert-body-text {
          font-size: 13px; color: #333;
          line-height: 1.7;
          margin-bottom: 28px;
          padding-left: 4px;
        }

        /* Info grid */
        .cert-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
          font-size: 13px;
          color: #333;
        }
        .cert-info-grid p { line-height: 1.8; }

        /* ═══════════════════════════════════════
           ID CARD
        ═══════════════════════════════════════ */
        .id-card-wrap {
          width: 320px;
          max-width: 100%;
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          background: linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 40%, #80deea 70%, #26c6da 100%);
          min-height: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 0;
        }

        /* Wave bg lines */
        .id-wave-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .id-top-section {
          width: 100%;
          padding: 22px 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        .id-logo {
          display: flex; align-items: center; justify-content: center; gap: 3px;
          margin-bottom: 16px;
        }
        .id-logo-bar { width: 3px; height: 26px; background: #2e7d32; border-radius: 2px; margin-right: 3px; }
        .id-logo-text { font-size: 18px; font-weight: 700; color: #1a237e; }
        .id-logo-life { font-size: 12px; font-weight: 600; color: #e53935; font-style: italic; vertical-align: super; }

        .id-avatar {
          width: 90px; height: 90px; border-radius: 50%;
          background: linear-gradient(135deg, #ff9800 50%, #5c6bc0 50%);
          border: 3px solid #fff;
          box-shadow: 0 3px 12px rgba(0,0,0,0.15);
          margin-bottom: 18px;
        }

        .id-info {
          text-align: center;
          font-size: 14px;
          color: #1a1a2e;
          line-height: 2;
          margin-bottom: 12px;
        }
        .id-info p { font-weight: 400; }

        .id-divider {
          width: 70%;
          border: none;
          border-top: 1.5px dashed #555;
          margin: 8px 0 4px;
        }
        .id-sig {
          font-size: 13px;
          font-weight: 700;
          color: #111;
          text-align: center;
          margin-bottom: 0;
        }

        /* bottom blue wave */
        .id-bottom-wave {
          width: 100%;
          margin-top: auto;
          position: relative;
          z-index: 2;
        }

        .id-visit {
          background: linear-gradient(90deg, #29b6f6, #0288d1);
          padding: 10px 16px;
          text-align: center;
          font-size: 12px;
          color: #fff;
          font-weight: 500;
        }

        /* ═══════════════════════════════════════
           VISITING CARD
        ═══════════════════════════════════════ */
        .visit-card-wrap {
          width: 400px;
          max-width: 100%;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          background: linear-gradient(160deg, #e0f7fa 0%, #b2ebf2 50%, #4dd0e1 100%);
          min-height: 260px;
        }

        .visit-top {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 18px 8px;
          position: relative;
          z-index: 2;
        }

        .visit-logo {
          display: flex; align-items: center; justify-content: center; gap: 3px;
        }
        .visit-logo-bar { width: 3px; height: 24px; background: #2e7d32; border-radius: 2px; margin-right: 3px; }
        .visit-logo-text { font-size: 17px; font-weight: 700; color: #1a237e; }
        .visit-logo-life { font-size: 11px; font-weight: 600; color: #e53935; font-style: italic; vertical-align: super; }

        .visit-body {
          padding: 4px 18px 0;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .visit-avatar {
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, #ff9800 50%, #5c6bc0 50%);
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          flex-shrink: 0;
        }
        .visit-member-info {
          display: flex; flex-direction: column; gap: 1px;
          padding-top: 6px;
        }
        .visit-member-id { font-size: 15px; font-weight: 700; color: #111; }
        .visit-member-mobile { font-size: 12.5px; color: #555; }

        .visit-details {
          padding: 14px 18px 0;
          font-size: 13px;
          color: #222;
          line-height: 2;
          position: relative;
          z-index: 2;
        }

        /* bottom blue wave for visiting */
        .visit-bottom-wave {
          margin-top: 16px;
          position: relative;
          z-index: 2;
        }
        .visit-footer {
          background: linear-gradient(90deg, #29b6f6, #0288d1);
          padding: 10px 16px;
          text-align: center;
          font-size: 12px;
          color: #fff;
          font-weight: 500;
        }

        /* spacing helpers */
        .kit-section { margin-bottom: 36px; }
      `}</style>

      <div className="wk-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* Navbar Component */}
        <Navbar 
          dropdownOpen={dropdownOpen} 
          setDropdownOpen={setDropdownOpen}
          setActivePage={() => {}}
        />

        {/* Green bar */}
        <div className="green-bar" />

        {/* ── BREADCRUMB ── */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="#">Home</a>
          <span className="sep">/</span>
          <span className="current">Welcome Kit</span>
        </div>

        <div className="page-body">

          {/* ══════════════════════════════
               CERTIFICATE
          ══════════════════════════════ */}
          <div className="kit-section">
            <h2 className="section-title">Certificate</h2>
            <button className="dl-btn" onClick={() => handleDownload("Certificate")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Download
            </button>

            <div ref={certRef} className="cert-wrap">
              {/* Left deco */}
              <div className="cert-left-deco">
                <div className="cert-deco-navy" />
                <div className="cert-deco-green-top" />
                <div className="cert-deco-teal-bottom" />
                <div className="cert-deco-green-bottom" />
              </div>

              {/* Main content */}
              <div className="cert-content">
                {/* Logo */}
                <div className="cert-logo">
                  <img src="/images/changelifemarketinglogo.png" alt="Change Life Marketing" style={{ maxWidth: '140px', height: 'auto' }} />
                </div>

                <div className="cert-heading">Certificate of Membership</div>

                <p className="cert-presented">Presented to</p>
                <p className="cert-name">ajay kumar</p>

                <p className="cert-body-text">
                  For the Honourable Membership of the Swamini.<br />
                  Your cordial Association is welcome in the Business Family Wish you Bright<br />
                  Future of Growth.
                </p>

                <div className="cert-info-grid">
                  <div>
                    <p>Name : ajay kumar</p>
                    <p>Member ID : Sm674643</p>
                    <p>Date : 24 May 2020</p>
                  </div>
                  <div>
                    <p>Address : Kadage Building, Behind Post Office,</p>
                    <p>Jaysingpur, Taluka: Shirol, Dist: Kolhapur Pin code: 416 101</p>
                    <br />
                    <p>Website : https://changelifemarketing.in/</p>
                    <p>Email : support@changelifemarketing.in</p>
                  </div>
                </div>
              </div>

              {/* Right deco */}
              <div className="cert-right-deco">
                <div className="cert-rdeco-navy" />
                <div className="cert-rdeco-green" />
                <div className="cert-rdeco-teal" />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════
               ID CARD
          ══════════════════════════════ */}
          <div className="kit-section">
            <h2 className="section-title">ID Card</h2>
            <button className="dl-btn" onClick={() => handleDownload("ID Card")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Download
            </button>

            <div ref={idRef} className="id-card-wrap">
              {/* SVG wave lines background */}
              <div className="id-wave-bg">
                <svg width="100%" height="100%" viewBox="0 0 320 420" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M-20 300 Q80 260 160 300 Q240 340 340 300 L340 420 L-20 420 Z" fill="#29b6f6" opacity="0.4"/>
                  <path d="M-20 330 Q80 290 160 330 Q240 370 340 330 L340 420 L-20 420 Z" fill="#0288d1" opacity="0.5"/>
                  <path d="M-20 360 Q80 320 160 360 Q240 400 340 360 L340 420 L-20 420 Z" fill="#0277bd" opacity="0.55"/>
                  {/* decorative wave lines top */}
                  {[0,10,20,30,40].map((i,idx) => (
                    <path key={idx} d={`M-20 ${60+i} Q80 ${40+i} 160 ${60+i} Q240 ${80+i} 340 ${60+i}`}
                      stroke="#29b6f6" strokeWidth="1.2" fill="none" opacity="0.4"/>
                  ))}
                </svg>
              </div>

              <div className="id-top-section">
                {/* Logo */}
                <div className="id-logo">
                  <img src="/images/changelifemarketinglogo.png" alt="Change Life Marketing" style={{ maxWidth: '120px', height: 'auto' }} />
                </div>

                {/* Avatar */}
                <img src="/images/user.png" alt="User Profile" className="id-avatar" />

                {/* Info */}
                <div className="id-info">
                  <p>Member - Sm674643</p>
                  <p>Name - ajay kumar</p>
                  <p>Mobile No. - 6204720770</p>
                </div>

                <hr className="id-divider" />
                <p className="id-sig">Authorized Signature</p>
              </div>

              {/* Bottom wave + footer */}
              <div className="id-bottom-wave" style={{ width: "100%", marginTop: "auto" }}>
                <svg viewBox="0 0 320 60" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
                  <path d="M0 40 Q80 0 160 30 Q240 60 320 20 L320 60 L0 60 Z" fill="#29b6f6" opacity="0.6"/>
                  <path d="M0 50 Q80 15 160 40 Q240 65 320 35 L320 60 L0 60 Z" fill="#0288d1" opacity="0.7"/>
                </svg>
                <div className="id-visit">
                  Visit Us - https://changelifemarketing.in/
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════
               VISITING CARD
          ══════════════════════════════ */}
          <div className="kit-section">
            <h2 className="section-title">Visiting Card</h2>
            <button className="dl-btn" onClick={() => handleDownload("Visiting Card")}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
              Download
            </button>

            <div ref={visitRef} className="visit-card-wrap">
              {/* SVG wave bg */}
              <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
                viewBox="0 0 400 260" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 180 Q100 140 200 170 Q300 200 400 160 L400 260 L0 260 Z" fill="#29b6f6" opacity="0.4"/>
                <path d="M0 200 Q100 165 200 190 Q300 215 400 185 L400 260 L0 260 Z" fill="#0288d1" opacity="0.45"/>
                {[0,10,20].map((i,idx) => (
                  <path key={idx} d={`M0 ${30+i} Q100 ${10+i} 200 ${30+i} Q300 ${50+i} 400 ${30+i}`}
                    stroke="#4dd0e1" strokeWidth="1" fill="none" opacity="0.35"/>
                ))}
              </svg>

              {/* Logo top-right */}
              <div className="visit-top">
                <div className="visit-logo">
                  <img src="/images/changelifemarketinglogo.png" alt="Change Life Marketing" style={{ maxWidth: '110px', height: 'auto' }} />
                </div>
              </div>

              {/* Avatar + Member Info */}
              <div className="visit-body">
                <img src="/images/user.png" alt="User Profile" className="visit-avatar" />
                <div className="visit-member-info">
                  <span className="visit-member-id">Sm674643</span>
                  <span className="visit-member-mobile">6204720770</span>
                </div>
              </div>

              {/* Details */}
              <div className="visit-details">
                <p>Name - ajay kumar</p>
                <p>Email - ajaysharmamlm71@gmail.com</p>
              </div>

              {/* Bottom wave + footer */}
              <div className="visit-bottom-wave" style={{ width: "100%", marginTop: "auto" }}>
                <svg viewBox="0 0 400 50" xmlns="http://www.w3.org/2000/svg" style={{ display:"block", width:"100%" }}>
                  <path d="M0 30 Q100 0 200 25 Q300 50 400 20 L400 50 L0 50 Z" fill="#29b6f6" opacity="0.6"/>
                  <path d="M0 38 Q100 10 200 32 Q300 55 400 30 L400 50 L0 50 Z" fill="#0288d1" opacity="0.7"/>
                </svg>
                <div className="visit-footer">
                  Visit Us - https://changelifemarketing.in/
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}