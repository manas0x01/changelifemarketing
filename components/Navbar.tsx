"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { useState } from "react";

interface NavbarProps {
  dropdownOpen: boolean;
  setDropdownOpen: (open: boolean) => void;
  setActivePage: (page: "dashboard" | "profile") => void;
}

export default function Navbar({ dropdownOpen, setDropdownOpen, setActivePage }: NavbarProps) {
  const { toggleSidebar, isOpen } = useSidebar();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setDropdownOpen(false);
        router.push('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        /* ── TOP NAV ── */
        .topnav {
          background: #fff;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          border-bottom: 3px solid #1de9b6;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 1px 6px rgba(0,0,0,0.08);
        }
        .topnav-left {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: #555;
        }
        .hamburger-icon { display: flex; flex-direction: column; gap: 4px; transition: all 0.3s ease; }
        .hamburger-icon span {
          width: 22px; height: 2px;
          background: #555; border-radius: 2px; transition: all 0.3s ease;
        }
        .hamburger-icon.active span:nth-child(1) {
          transform: rotate(45deg) translate(8px, 8px);
        }
        .hamburger-icon.active span:nth-child(2) {
          opacity: 0;
        }
        .hamburger-icon.active span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -7px);
        }
        .topnav-right {
          display: flex;
          align-items: center;
          gap: 10px;
          position: relative;
        }
        .user-name {
          font-size: 11.5px;
          font-weight: 500;
          color: #333;
          cursor: pointer;
        }
        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid #e0e0e0;
          flex-shrink: 0;
          object-fit: cover;
        }

        /* ── DROPDOWN ── */
        .dropdown {
          position: absolute;
          top: 46px;
          right: 0;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          width: 200px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          z-index: 200;
          overflow: hidden;
        }
        .dropdown-header {
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          color: #333;
          border-bottom: 1px solid #f0f0f0;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          font-size: 13px;
          color: #444;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dropdown-item:hover { background: #f5f5f5; }
        .dropdown-item.red { color: #e53935; }

        /* ── LINK STYLE ── */
        .dropdown a {
          text-decoration: none;
          color: inherit;
        }
      `}</style>

      <nav className="topnav">
        <div className="topnav-left">
          <div className={`hamburger-icon ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}>
            <span /><span /><span />
          </div>
        </div>
        <div className="topnav-right">
          <span className="user-name" onClick={() => setDropdownOpen(!dropdownOpen)}>
            ajay kumar ( Sm674643 )
          </span>
          <img
            src="/images/user.png"
            alt="User Avatar"
            className="user-avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ cursor: 'pointer' }}
          />

          {dropdownOpen && (
            <div className="dropdown">
              <div className="dropdown-header">Welcome, Sm674643</div>
              <Link href="/dashboard/profile">
                <div className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#4caf50"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                  Profile
                </div>
              </Link>
              <div className="dropdown-item red" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#e53935"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
                Logout
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
