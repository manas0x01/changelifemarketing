"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";

export default function WelcomeKitPage() {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    fullName: "",
    username: "",
    mobileNo: "",
    email: "",
    address: "",
    createdAt: "",
  });
  
  const certRef    = useRef<HTMLDivElement>(null);
  const idRef      = useRef<HTMLDivElement>(null);
  const visitRef   = useRef<HTMLDivElement>(null);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/update-profile", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Format date
            let dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            if (data.data.createdAt) {
              dateStr = new Date(data.data.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
            }

            setUserData({
              fullName: data.data.fullName || "",
              username: data.data.username || "",
              mobileNo: data.data.mobileNo || "",
              email: data.data.email || "",
              address: data.data.address || "Jaysingpur, Taluka: Shirol, Dist: Kolhapur Pin code: 416 101",
              createdAt: dateStr,
            });
          }
        } else if (response.status === 401) {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleDownload = useCallback(async (ref: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!ref.current) return;

    try {
      const { default: html2pdfLib } = await import('html2pdf.js');
      
      const element = ref.current;
      const opt: any = {
        margin: 10,
        filename: `${filename}-${userData.username || 'document'}.pdf`,
        image: { type: 'png' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdfLib()
        .set(opt)
        .from(element)
        .save()
        .catch((err: any) => console.error('PDF download failed:', err));
    } catch (err) {
      console.error('Failed to load html2pdf:', err);
    }
  }, [userData.username]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .wk-root {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #f5f1e8 0%, #e8dcc8 100%);
          min-height: 100vh;
        }

        /* GREEN BAR */
        .green-bar { height: 8px; background: linear-gradient(90deg, #d4af37, #f4d03f); }

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
          color: #2a2a2a;
          margin-bottom: 10px;
        }

        /* DOWNLOAD BTN */
        .dl-btn {
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 10px 24px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          margin-bottom: 16px;
          transition: all 0.3s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
        }
        .dl-btn:hover { 
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
        }

        /* ═══════════════════════════════════════
           CERTIFICATE - GOLDEN BLUR
        ═══════════════════════════════════════ */
        .cert-wrap {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(212, 175, 55, 0.3);
          border-radius: 20px;
          width: 800px;
          max-width: 100%;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          min-height: 500px;
          display: flex;
          flex-direction: column;
          padding: 50px 40px;
          align-items: center;
        }

        .cert-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(244, 208, 63, 0.1), transparent),
                      radial-gradient(circle at bottom left, rgba(212, 175, 55, 0.08), transparent);
          pointer-events: none;
          border-radius: 20px;
        }

        /* Left & Right decorative columns hidden */
        .cert-left-deco, .cert-right-deco { display: none; }

        /* Certificate main content */
        .cert-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        /* Logo */
        .cert-logo {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        /* Certificate heading */
        .cert-heading {
          font-family: 'Playfair Display', serif;
          font-size: 42px;
          color: #d4af37;
          text-align: center;
          margin-bottom: 10px;
          letter-spacing: 2px;
        }

        .cert-presented {
          font-size: 14px; font-weight: 500;
          color: #666; text-align: center;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .cert-name {
          font-size: 38px; font-weight: 700;
          color: #1a1a1a; text-align: center;
          margin-bottom: 20px;
          font-family: 'Poppins', sans-serif;
        }
        .cert-body-text {
          font-size: 13px; color: #555;
          line-height: 1.8;
          margin-bottom: 28px;
          max-width: 600px;
        }

        /* Info grid */
        .cert-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          font-size: 12px;
          color: #333;
          width: 100%;
          max-width: 600px;
        }
        .cert-info-grid p { 
          line-height: 2;
          padding: 8px 12px;
          background: rgba(212, 175, 55, 0.05);
          border-left: 3px solid #d4af37;
          border-radius: 4px;
        }

        /* ═══════════════════════════════════════
           ID CARD - GOLDEN BLUR
        ═══════════════════════════════════════ */
        .id-card-wrap {
          width: 360px;
          max-width: 100%;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          min-height: 480px;
          display: flex;
          flex-direction: column;
          padding: 30px 25px;
          align-items: center;
        }

        .id-card-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(244, 208, 63, 0.08) 0%, rgba(212, 175, 55, 0.05) 100%);
          pointer-events: none;
          border-radius: 20px;
        }

        /* Wave bg lines */
        .id-wave-bg { display: none; }

        .id-top-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          text-align: center;
        }

        .id-logo {
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }

        .id-avatar {
          width: 100px; height: 100px; border-radius: 50%;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border: 4px solid #fff;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
          margin-bottom: 20px;
        }

        .id-info {
          text-align: center;
          font-size: 14px;
          color: #1a1a1a;
          line-height: 2.2;
          margin-bottom: 16px;
          width: 100%;
        }
        .id-info p { font-weight: 500; }

        .id-divider {
          width: 80%;
          border: none;
          border-top: 2px solid #d4af37;
          margin: 12px 0 8px;
        }
        .id-sig {
          font-size: 12px;
          font-weight: 700;
          color: #d4af37;
          text-align: center;
          margin-bottom: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* bottom wave */
        .id-bottom-wave {
          width: 100%;
          margin-top: auto;
          position: relative;
          z-index: 2;
        }

        .id-visit {
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          padding: 12px 16px;
          text-align: center;
          font-size: 11px;
          color: #fff;
          font-weight: 600;
          border-radius: 8px;
          margin-top: 12px;
        }

        /* ═══════════════════════════════════════
           VISITING CARD - GOLDEN BLUR
        ═══════════════════════════════════════ */
        .visit-card-wrap {
          width: 420px;
          max-width: 100%;
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          min-height: 300px;
          padding: 30px;
        }

        .visit-card-wrap::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(244, 208, 63, 0.08) 0%, rgba(212, 175, 55, 0.05) 100%);
          pointer-events: none;
          border-radius: 20px;
        }

        .visit-top {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 0 16px 0;
          position: relative;
          z-index: 2;
        }

        .visit-logo {
          display: flex; align-items: center; justify-content: center;
        }

        .visit-body {
          padding: 0;
          position: relative;
          z-index: 2;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }
        .visit-avatar {
          width: 70px; height: 70px; border-radius: 50%;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border: 3px solid #fff;
          box-shadow: 0 4px 12px rgba(212, 175, 55, 0.2);
          flex-shrink: 0;
        }
        .visit-member-info {
          display: flex; flex-direction: column; gap: 2px;
          padding-top: 8px;
        }
        .visit-member-id { font-size: 16px; font-weight: 700; color: #1a1a1a; }
        .visit-member-mobile { font-size: 13px; color: #d4af37; font-weight: 600; }

        .visit-details {
          padding: 12px;
          font-size: 13px;
          color: #333;
          line-height: 2.2;
          position: relative;
          z-index: 2;
          background: rgba(212, 175, 55, 0.05);
          border-left: 3px solid #d4af37;
          border-radius: 8px;
        }

        /* bottom wave for visiting */
        .visit-bottom-wave { display: none; }
        
        .visit-footer {
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          padding: 12px 16px;
          text-align: center;
          font-size: 11px;
          color: #fff;
          font-weight: 600;
          border-radius: 8px;
          margin-top: 12px;
          position: relative;
          z-index: 2;
        }

        /* spacing helpers */
        .kit-section { margin-bottom: 40px; }
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
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">Welcome Kit</span>
        </div>

        <div className="page-body">

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666', fontSize: '16px' }}>
              Loading your profile data...
            </div>
          ) : (
            <>
          {/* ══════════════════════════════
               CERTIFICATE
          ══════════════════════════════ */}
          <div className="kit-section">
            <h2 className="section-title">Certificate</h2>
            <button className="dl-btn" onClick={() => handleDownload(certRef, "Certificate")}>
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
                <p className="cert-name">{userData.fullName || "Member"}</p>

                <p className="cert-body-text">
                  For the Honourable Membership of the Change Life Management.<br />
                  Your cordial Association is welcome in the Business Family Wish you Bright<br />
                  Future of Growth.
                </p>

                <div className="cert-info-grid">
                  <div>
                    <p>Name : {userData.fullName || "N/A"}</p>
                    <p>Member ID : {userData.username || "N/A"}</p>
                    <p>Date : {userData.createdAt}</p>
                  </div>
                  <div>
                    <p>Address : {userData.address || "N/A"}</p>
                    <br />
                    <p>Website : https://changelifemarketing.in/</p>
                    <p>Email : {userData.email || "support@changelifemarketing.in"}</p>
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
            <button className="dl-btn" onClick={() => handleDownload(idRef, "ID-Card")}>
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
                  <p>Member - {userData.username || "N/A"}</p>
                  <p>Name - {userData.fullName || "N/A"}</p>
                  <p>Mobile No. - {userData.mobileNo || "N/A"}</p>
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
            <button className="dl-btn" onClick={() => handleDownload(visitRef, "Visiting-Card")}>
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
                  <span className="visit-member-id">{userData.username || "N/A"}</span>
                  <span className="visit-member-mobile">{userData.mobileNo || "N/A"}</span>
                </div>
              </div>

              {/* Details */}
              <div className="visit-details">
                <p>Name - {userData.fullName || "N/A"}</p>
                <p>Email - {userData.email || "N/A"}</p>
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

            </>
          )}
        </div>
      </div>
    </>
  );
}