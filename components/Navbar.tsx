"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSidebar } from "@/context/SidebarContext";
import { useUser } from "@/context/UserContext";
import { useCallback, memo } from "react";

interface NavbarProps {
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  setActivePage: (page: "dashboard" | "profile") => void;
}

function Navbar({ dropdownOpen, setDropdownOpen, setActivePage }: NavbarProps) {
  const { toggleSidebar, isOpen } = useSidebar();
  const router = useRouter();
  const { userData } = useUser();

  const handleLogout = useCallback(async () => {
    try {
      await signOut({ redirect: false, callbackUrl: "/" });
      setDropdownOpen(false);
      router.push("/");
    } catch { }
  }, [setDropdownOpen, router]);

  const handleDropdownToggle = useCallback(() => {
    setDropdownOpen(!dropdownOpen);
  }, [dropdownOpen, setDropdownOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Nunito:wght@400;600;700;800&display=swap');

        /* ── Top navbar ── */
        .topnav {
          background: radial-gradient(circle at 50% 0%, #220645 0%, #120228 100%);
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid rgba(245,197,24,0.25);
          box-shadow: 0 10px 30px rgba(0,0,0,0.55), 0 1px 0 rgba(245,197,24,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
          font-family: 'Nunito', sans-serif;
        }

        /* Shimmer line under navbar */
        .topnav::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #FFD700, #FFD700, #FFD700, transparent);
          background-size: 200%;
          animation: navshimmer 2.5s infinite linear;
          box-shadow: 0 0 12px rgba(245,197,24,0.8);
        }
        @keyframes navshimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Left: hamburger ── */
        .topnav-left {
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
        }

        .hamburger-btn {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: rgba(245,197,24,0.08);
          border: 1px solid rgba(245,197,24,0.18);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s, transform 0.15s;
          flex-shrink: 0;
        }
        .hamburger-btn:hover {
          background: rgba(245,197,24,0.18);
          border-color: rgba(245,197,24,0.6);
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(245,197,24,0.35);
        }
        .hamburger-btn span {
          display: block;
          height: 2px;
          background: #FFD700;
          border-radius: 2px;
          transition: width 0.2s;
        }
        .hamburger-btn span:nth-child(1) { width: 18px; }
        .hamburger-btn span:nth-child(2) { width: 13px; }
        .hamburger-btn span:nth-child(3) { width: 18px; }
        .hamburger-btn:hover span { width: 18px; }

        /* Brand label beside hamburger */
        .nav-brand {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          letter-spacing: 2px;
          color: #FFD700;
          text-transform: uppercase;
          display: none;
        }
        @media (min-width: 600px) { .nav-brand { display: block; } }

        /* ── Right section ── */
        .topnav-right {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        /* Notification bell */
        .nav-bell {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: rgba(245,197,24,0.08);
          border: 1px solid rgba(245,197,24,0.18);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          position: relative;
          transition: background 0.18s;
        }
        .nav-bell:hover { background: rgba(245,197,24,0.15); }
        .nav-bell-badge {
          position: absolute;
          top: -3px; right: -3px;
          width: 16px; height: 16px;
          background: linear-gradient(135deg, #FFD700, #FFD700);
          border-radius: 50%;
          font-size: 9px;
          font-weight: 800;
          color: #120228;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #120228;
          box-shadow: 0 0 10px rgba(245,197,24,0.6);
          animation: bellpulse 2s infinite alternate;
        }
        @keyframes bellpulse {
          0% { transform: scale(1); box-shadow: 0 0 4px rgba(245,197,24,0.5); }
          100% { transform: scale(1.12); box-shadow: 0 0 12px rgba(245,197,24,0.9); }
        }

        /* User name chip */
        .user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(245,197,24,0.07);
          border: 1px solid rgba(245,197,24,0.18);
          border-radius: 24px;
          padding: 5px 14px 5px 6px;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
        }
        .user-chip:hover {
          background: rgba(245,197,24,0.15);
          border-color: rgba(245,197,24,0.6);
          box-shadow: 0 0 15px rgba(245,197,24,0.25);
        }

        .user-avatar-ring {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 1.5px solid #F5C518;
          padding: 1.5px;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(245,197,24,0.3);
        }
        .user-avatar {
          width: 100%; height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .user-name-text {
          font-size: 12.5px;
          font-weight: 700;
          color: rgba(245,197,24,0.9);
          white-space: nowrap;
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 0 6px rgba(245,197,24,0.25);
        }
        .user-name-text span {
          color: #F5C518;
          font-weight: 800;
        }

        /* Skeleton */
        .skeleton-loader {
          height: 14px; width: 130px;
          background: linear-gradient(90deg,
            rgba(245,197,24,0.08) 25%,
            rgba(245,197,24,0.15) 50%,
            rgba(245,197,24,0.08) 75%);
          background-size: 200% 100%;
          animation: navshimmer 1.5s infinite;
          border-radius: 6px;
        }

        /* Chevron */
        .chip-chevron {
          color: rgba(245,197,24,0.5);
          display: flex; align-items: center;
          transition: transform 0.2s;
        }
        .chip-chevron.open { transform: rotate(180deg); }

        /* ── Dropdown ── */
        .dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: linear-gradient(160deg, #1e0642 0%, #250845 100%);
          border: 1px solid rgba(245,197,24,0.4);
          border-radius: 16px;
          width: 220px;
          box-shadow:
            0 16px 48px rgba(0,0,0,0.7),
            0 0 25px rgba(245,197,24,0.25);
          z-index: 200;
          overflow: hidden;
          animation: dropIn 0.18s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .dropdown-header {
          padding: 14px 16px 12px;
          border-bottom: 1px solid rgba(245,197,24,0.12);
          background: rgba(245,197,24,0.05);
        }
        .dropdown-welcome {
          font-size: 10px;
          font-weight: 700;
          color: rgba(245,197,24,0.6);
          letter-spacing: 1.2px;
          text-transform: uppercase;
          margin-bottom: 3px;
        }
        .dropdown-username {
          font-size: 14px;
          font-weight: 800;
          color: #F5C518;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 16px;
          font-size: 13.5px;
          font-weight: 600;
          color: rgba(245,197,24,0.75);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          text-decoration: none;
        }
        .dropdown-item:hover {
          background: rgba(245,197,24,0.12);
          color: #FFE066;
          box-shadow: inset 0 0 8px rgba(245,197,24,0.15);
        }
        .dropdown-item .item-icon {
          width: 30px; height: 30px;
          border-radius: 8px;
          background: rgba(245,197,24,0.1);
          border: 1px solid rgba(245,197,24,0.18);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .dropdown-item.danger { color: rgba(248,113,113,0.85); }
        .dropdown-item.danger:hover { background: rgba(239,68,68,0.08); color: #f87171; }
        .dropdown-item.danger .item-icon {
          background: rgba(239,68,68,0.1);
          border-color: rgba(239,68,68,0.2);
        }

        .dropdown-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,197,24,0.15), transparent);
          margin: 2px 0;
        }
      `}</style>

      <nav className="topnav">
        {/* Left */}
        <div className="topnav-left">
          <div className="hamburger-btn" onClick={toggleSidebar}>
            <span /><span /><span />
          </div>
          <span className="nav-brand">Dashboard</span>
        </div>

        {/* Right */}
        <div className="topnav-right">
          {/* Bell */}
          <div className="nav-bell">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5C518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <div className="nav-bell-badge">3</div>
          </div>

          {/* User chip */}
          {userData ? (
            <div className="user-chip" onClick={handleDropdownToggle}>
              <div className="user-avatar-ring">
                <img src="/images/user.png" alt="User" className="user-avatar" />
              </div>
              <span className="user-name-text">
                {userData.fullName}&nbsp;<span>( {userData.username} )</span>
              </span>
              <span className={`chip-chevron ${dropdownOpen ? "open" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </div>
          ) : (
            <div className="skeleton-loader" />
          )}

          {/* Dropdown */}
          {dropdownOpen && userData && (
            <div className="dropdown">
              <div className="dropdown-header">
                <div className="dropdown-welcome">Welcome back</div>
                <div className="dropdown-username">{userData.username}</div>
              </div>

              <Link href="/dashboard/profile" style={{ textDecoration: "none" }}>
                <div className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <div className="item-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#F5C518">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  </div>
                  My Profile
                </div>
              </Link>

              <div className="dropdown-divider" />

              <div
                className="dropdown-item danger"
                onClick={() => { setDropdownOpen(false); handleLogout(); }}
              >
                <div className="item-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f87171">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                </div>
                Logout
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

export default memo(Navbar);