"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type Tab = "overview" | "myprofile" | "editbank";

interface ProfileData {
  personalDetails: { label: string; value: string }[];
  bankDetails: { label: string; value: string }[];
  username: string;
  userId: string;
  avatar: string;
  fullName: string;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("profile");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/getprofile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        if (!response.ok) {
          let errorData;
          const contentType = response.headers.get("content-type");
          
          try {
            if (contentType?.includes("application/json")) {
              errorData = await response.json();
            } else {
              const text = await response.text();
              errorData = { error: text?.substring(0, 200) || "Unknown error" };
            }
          } catch (parseErr) {
            errorData = { error: "Failed to parse server response" };
          }
          throw new Error(errorData.error || "Failed to fetch profile");
        }
        
        const apiResponse = await response.json();
        const user = apiResponse.user;
        
        // Format joining date to DD/MM/YYYY HH:MM:SS
        const formatDate = (dateString: string) => {
          if (!dateString) return "N/A";
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return dateString;
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        };
        
        const transformedData: ProfileData = {
          username: user.username || "N/A",
          userId: user.userId || user._id || "N/A",
          avatar: "/images/user.png",
          fullName: user.fullName || "N/A",
          personalDetails: [
            { label: "Full Name", value: user.fullName || "N/A" },
            { label: "Email", value: user.email || "N/A" },
            { label: "Phone", value: user.mobileNo || user.phone || "N/A" },
            { label: "Member Type", value: user.memberType || "N/A" },
            { label: "Package", value: user.registeredPackage || "N/A" },
            { label: "Joining Date", value: formatDate(user.joiningDate) },
          ],
          bankDetails: [
            { label: "Bank Name", value: user.bankName || "N/A" },
            { label: "Account Number", value: user.accountNo || "N/A" },
            { label: "IFSC Code", value: user.ifsc || "N/A" },
            { label: "Account Type", value: user.accountType || "N/A" },
          ],
        };
        
        setProfileData(transformedData);
        setError(null);
      } catch (err) {
      if (err instanceof Error && err.message.includes("Unauthorized")) {
          router.push("/auth/login");
          return;
        }
        
        setError(err instanceof Error ? err.message : "An error occurred");
        setProfileData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .profile-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,215,0,0.12) 0%, transparent 65%);
          min-height: 100vh;
        }

        /* ── GOLD BAR ── */
        .green-bar {
          height: 3px;
          background: linear-gradient(90deg, transparent, #FFD700, #FFD700, #FFD700, transparent);
        }

        /* ── BREADCRUMB ── */
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px;
          color: #FFD700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .breadcrumb a { color: #FFD700; text-decoration: none; opacity: 0.85; }
        .breadcrumb a:hover { text-decoration: underline; opacity: 1; }
        .breadcrumb .sep { color: rgba(255,215,0,0.4); }
        .breadcrumb .current { color: #FFD700; font-weight: 600; }
        .breadcrumb svg { fill: #FFD700 !important; }

        /* ── PROFILE HERO CARD ── */
        .hero-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,215,0,0.22);
          margin: 0 20px 20px;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        /* Banner */
        .hero-banner {
          width: 100%;
          height: 220px;
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1.5px solid rgba(255,215,0,0.2);
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
          background: linear-gradient(180deg, #FFD700 0%, #b8860b 50%, #5c4308 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
          font-family: 'Poppins', sans-serif;
          text-shadow: 0 0 12px rgba(255, 215, 0, 0.45);
        }
        .welcome-line2 {
          font-size: clamp(12px, 2vw, 22px);
          font-weight: 700;
          letter-spacing: 18px;
          text-transform: uppercase;
          background: linear-gradient(180deg, #FFD700 0%, #e6b800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 4px;
          font-family: 'Poppins', sans-serif;
          text-shadow: 0 0 8px rgba(255, 215, 0, 0.3);
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
          background: rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 10px 20px 14px;
          position: relative;
          border-bottom: 1.5px solid rgba(255,215,0,0.2);
        }
        .hero-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: 3.5px solid #FFD700;
          box-shadow: 0 4px 15px rgba(255,215,0,0.35);
          flex-shrink: 0;
          margin-top: -55px;
          position: relative;
          z-index: 2;
          object-fit: cover;
        }
        .hero-username {
          font-size: 20px;
          font-weight: 700;
          color: #FFD700;
          padding-bottom: 2px;
          text-shadow: 0 0 8px rgba(255,215,0,0.3);
        }

        /* ── TABS ── */
        .tabs {
          display: flex;
          gap: 0;
          padding: 0 20px;
          background: rgba(0,0,0,0.15);
        }
        .tab-btn {
          padding: 14px 20px;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(255,215,0,0.6);
          cursor: pointer;
          border: none;
          background: none;
          font-family: 'Poppins', sans-serif;
          position: relative;
          transition: color 0.18s;
          border-bottom: 2px solid transparent;
        }
        .tab-btn:hover { color: #FFD700; }
        .tab-btn.active {
          color: #FFD700;
          border-bottom: 2px solid #FFD700;
          text-shadow: 0 0 8px rgba(255,215,0,0.3);
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
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }
        .detail-header {
          background: linear-gradient(90deg, rgba(255,215,0,0.15), rgba(168,85,247,0.12));
          border-bottom: 1.5px solid rgba(255,215,0,0.25);
          padding: 13px 20px;
          font-size: 13px;
          font-weight: 700;
          color: #FFD700;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          text-shadow: 0 0 8px rgba(255,215,0,0.45);
        }

        /* ── DETAIL ROWS ── */
        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 13px 18px;
          border-bottom: 1px solid rgba(255,215,0,0.12);
          transition: background 0.12s;
        }
        .detail-row:last-child { border-bottom: none; }
        .detail-row:hover { background: rgba(255,215,0,0.04); }

        .detail-label {
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(255,215,0,0.7);
          flex-shrink: 0;
        }
        .detail-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #FFD700;
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

        /* ── SKELETON LOADER ── */
        .skeleton-avatar {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          margin-top: -55px;
          border: 3.5px solid rgba(255,215,0,0.3);
          flex-shrink: 0;
        }

        .skeleton-text {
          height: 20px;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 200% 100%;
          border-radius: 4px;
          animation: shimmer 2s infinite;
          margin-bottom: 8px;
        }

        .skeleton-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,215,0,0.22);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65);
        }

        .skeleton-header {
          background: rgba(255,215,0,0.1);
          height: 42px;
          padding: 11px 18px;
        }

        .skeleton-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 13px 18px;
          border-bottom: 1px solid rgba(255,215,0,0.1);
        }
        .skeleton-row:last-child { border-bottom: none; }

        .skeleton-label {
          height: 14px;
          width: 120px;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: shimmer 2s infinite;
        }

        .skeleton-value {
          height: 14px;
          width: 150px;
          background: linear-gradient(90deg, #2d0a5c 25%, #3d1475 50%, #2d0a5c 75%);
          background-size: 200% 100%;
          border-radius: 3px;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
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
            {loading ? (
              <>
                <div className="skeleton-avatar" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton-text" style={{ width: "200px" }} />
                  <div className="skeleton-text" style={{ width: "150px" }} />
                </div>
              </>
            ) : (
              <>
                <img 
                  src={profileData?.avatar || "/images/user.png"} 
                  alt="User Avatar" 
                  className="hero-avatar" 
                />
                <span className="hero-username">
                  {profileData?.fullName || "User"} ({profileData?.username || "ID"})
                </span>
              </>
            )}
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
            {loading ? (
              <>
                {/* Personal Details Skeleton */}
                <div className="skeleton-card">
                  <div className="skeleton-header" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div className="skeleton-row" key={i}>
                      <div className="skeleton-label" />
                      <div className="skeleton-value" />
                    </div>
                  ))}
                </div>

                {/* Bank Details Skeleton */}
                <div className="skeleton-card">
                  <div className="skeleton-header" />
                  {[1, 2, 3, 4].map((i) => (
                    <div className="skeleton-row" key={i}>
                      <div className="skeleton-label" />
                      <div className="skeleton-value" />
                    </div>
                  ))}
                </div>
              </>
            ) : error ? (
              <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "#d32f2f" }}>
                <p>Error: {error}</p>
              </div>
            ) : profileData ? (
              <>
                {/* Personal Details */}
                <div className="detail-card">
                  <div className="detail-header">Personal Details</div>
                  {profileData.personalDetails.map((row) => (
                    <div className="detail-row" key={row.label}>
                      <span className="detail-label">{row.label}</span>
                      <span className="detail-value">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Bank Details */}
                <div className="detail-card" style={{ alignSelf: "flex-start" }}>
                  <div className="detail-header">Bank Details</div>
                  {profileData.bankDetails.map((row) => (
                    <div className="detail-row" key={row.label}>
                      <span className="detail-label">{row.label}</span>
                      <span className="detail-value">{row.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}