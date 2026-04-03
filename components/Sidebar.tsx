"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: { label: string }[];
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      </svg>
    ),
  },
  {
    id: "registration",
    label: "Create Account",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <line x1="19" y1="8" x2="19" y2="14"/>
        <line x1="22" y1="11" x2="16" y2="11"/>
      </svg>
    ),
  },
  {
    id: "buy-pins",
    label: "Buy Pins",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    children: [{ label: "My Profile" }, { label: "Welcome Kit" }],
  },
  {
    id: "epin",
    label: "E-Pin Control",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    ),
    children: [{ label: "Transfer" }, { label: "My E-pins" }, { label: "My Requests" },{label:"Transferred/ Rejected"}],
  },
  {
    id: "my-network",
    label: "My Team",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    children: [{ label: "Direct Members" }, { label: "Downline Members" }, { label: "Network Tree" },{label: "Gold Downline Members"}],
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    children: [{ label: "Silver Binary Income" }, { label: "Gold Counting" },{ label: "Gold Binary Income" }],
  },
  {
    id: "daily-payout",
    label: "Daily Payout",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <line x1="2" y1="10" x2="22" y2="10"/>
      </svg>
    ),
    children: [{ label: "Processed Payments" }, { label: "Reimbursement of Expenditure" },{ label: "TDS Charge" }],
  },
  {
    id: "chat-support",
    label: "Support Center",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    children: [{ label: "Change Password" }, { label: "Change Transaction Password" }],
  },
  {
    id: "logout",
    label: "Logout",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
  },
];

// Chevron icon
const ChevronUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeId, setActiveId] = useState("dashboard");
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const [openMenus, setOpenMenus] = useState<string[]>(["profile-management"]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update active menu based on current pathname
  useEffect(() => {
    if (pathname.includes("/dashboard/profile")) {
      setActiveId("profile");
      setActiveSubmenuId("profile-My Profile");
      setOpenMenus((prev) => Array.from(new Set([...prev, "profile"])));
    } else if (pathname.includes("/dashboard/welcomekit")) {
      setActiveId("profile");
      setActiveSubmenuId("profile-Welcome Kit");
      setOpenMenus((prev) => Array.from(new Set([...prev, "profile"])));
    } else if (pathname.includes("/dashboard/transferepin")) {
      setActiveId("epin");
      setActiveSubmenuId("epin-Transfer");
      setOpenMenus((prev) => Array.from(new Set([...prev, "epin"])));
    } else if (pathname.includes("/dashboard/myepins")) {
      setActiveId("epin");
      setActiveSubmenuId("epin-My E-pins");
      setOpenMenus((prev) => Array.from(new Set([...prev, "epin"])));
    } else if (pathname.includes("/dashboard/myrequests")) {
      setActiveId("epin");
      setActiveSubmenuId("epin-My Requests");
      setOpenMenus((prev) => Array.from(new Set([...prev, "epin"])));
    } else if (pathname.includes("/dashboard/transferred")) {
      setActiveId("epin");
      setActiveSubmenuId("epin-Transferred/ Rejected");
      setOpenMenus((prev) => Array.from(new Set([...prev, "epin"])));
    } else if (pathname.includes("/dashboard/directmembers")) {
      setActiveId("my-network");
      setActiveSubmenuId("my-network-Direct Members");
      setOpenMenus((prev) => Array.from(new Set([...prev, "my-network"])));
    } else if (pathname.includes("/dashboard/downlinemembers")) {
      setActiveId("my-network");
      setActiveSubmenuId("my-network-Downline Members");
      setOpenMenus((prev) => Array.from(new Set([...prev, "my-network"])));
    } else if (pathname.includes("/dashboard/mothertree")) {
      setActiveId("my-network");
      setActiveSubmenuId("my-network-Mother Tree");
      setOpenMenus((prev) => Array.from(new Set([...prev, "my-network"])));
    } else if (pathname.includes("/dashboard/golddownlinemembers")) {
      setActiveId("my-network");
      setActiveSubmenuId("my-network-Gold Downline Members");
      setOpenMenus((prev) => Array.from(new Set([...prev, "my-network"])));
    } else if (pathname.includes("/dashboard/silverbinaryincome")) {
      setActiveId("reports");
      setActiveSubmenuId("reports-Silver Binary Income");
      setOpenMenus((prev) => Array.from(new Set([...prev, "reports"])));
    } else if (pathname.includes("/dashboard/goldcounting")) {
      setActiveId("reports");
      setActiveSubmenuId("reports-Gold Counting");
      setOpenMenus((prev) => Array.from(new Set([...prev, "reports"])));
    } else if (pathname.includes("/dashboard/goldbinaryincome")) {
      setActiveId("reports");
      setActiveSubmenuId("reports-Gold Binary Income");
      setOpenMenus((prev) => Array.from(new Set([...prev, "reports"])));
    } else if (pathname.includes("/dashboard/changepassword")) {
      setActiveId("settings");
      setActiveSubmenuId("settings-Change Password");
      setOpenMenus((prev) => Array.from(new Set([...prev, "settings"])));
    } else if (pathname.includes("/dashboard/changetransactionpassword")) {
      setActiveId("settings");
      setActiveSubmenuId("settings-Change Transaction Password");
      setOpenMenus((prev) => Array.from(new Set([...prev, "settings"])));
    } else if (pathname.includes("/dashboard/payouttdscharge")) {
      setActiveId("daily-payout");
      setActiveSubmenuId("daily-payout-TDS Charge");
      setOpenMenus((prev) => Array.from(new Set([...prev, "daily-payout"])));
    } else if (pathname.includes("/dashboard/registration")) {
      setActiveId("registration");
    } else if (pathname === "/dashboard") {
      setActiveId("dashboard");
      setActiveSubmenuId(null);
    }
  }, [pathname]);

  // Route mapping for menu items
  const routeMap: Record<string, string> = {
    "dashboard": "/dashboard",
    "registration": "/dashboard/registration",
    "buy-pins": "/dashboard/buypins",
    "profile-management": "/dashboard/profile",
    "epin": "/dashboard/epin",
    "my-network": "/dashboard/network",
    "reports": "/dashboard/reports",
    "daily-payout": "/dashboard/payout",
    "chat-support": "/dashboard/chatsupport",
    "settings": "/dashboard/settings",
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.id === "logout") {
      handleLogout();
    } else if (item.children) {
      toggleMenu(item.id);
    } else {
      setActiveId(item.id);
      // Navigate to the corresponding route
      const route = routeMap[item.id];
      if (route) {
        router.push(route);
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: linear-gradient(180deg, #1a2a6c 0%, #1e3a8a 30%, #1b4fa8 60%, #1565c0 100%);
          display: flex;
          flex-direction: column;
          font-family: 'Poppins', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Subtle radial glow bottom */
        .sidebar::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 200px;
          background: radial-gradient(ellipse at center bottom, rgba(21,101,192,0.4) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Logo area */
        .sidebar-logo {
          display: flex;
          justify-content: left;
          align-items: center;
          gap: 6px;
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 6px;
        }
        .logo-bar {
          width: 4px;
          height: 36px;
          background: #2e7d32;
          border-radius: 2px;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .logo-image {
          max-width: 150px;
          height: auto;
          display: block;
        }
        .logo-text {
          font-size: 22px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
          line-height: 1;
        }
        .logo-life {
          font-size: 13px;
          font-weight: 600;
          color: #e53935;
          font-style: italic;
          vertical-align: super;
          line-height: 1;
          margin-left: 1px;
        }

        /* Nav */
        .sidebar-nav {
          flex: 1;
          padding: 4px 0 20px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }

        /* Menu item */
        .menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 18px;
          cursor: pointer;
          transition: background 0.18s;
          position: relative;
          user-select: none;
        }
        .menu-item:hover {
          background: rgba(255,255,255,0.07);
        }
        .menu-item.active {
          background: rgba(255,255,255,0.06);
        }
        .menu-item.active .menu-label {
          color: #f5a623;
        }
        .menu-item.active .menu-icon {
          color: #f5a623;
        }

        /* Active left accent bar */
        .menu-item.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 4px;
          bottom: 4px;
          width: 3px;
          background: #f5a623;
          border-radius: 0 2px 2px 0;
        }

        .menu-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .menu-icon {
          color: rgba(255,255,255,0.75);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.18s;
        }

        .menu-label {
          font-size: 13.5px;
          font-weight: 500;
          color: rgba(255,255,255,0.88);
          transition: color 0.18s;
          white-space: nowrap;
        }

        .menu-chevron {
          color: rgba(255,255,255,0.55);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.18s;
        }

        /* Submenu */
        .submenu {
          overflow: hidden;
          transition: max-height 0.25s ease, opacity 0.2s ease;
          max-height: 0;
          opacity: 0;
        }
        .submenu.open {
          max-height: 300px;
          opacity: 1;
        }

        .submenu-item {
          display: flex;
          align-items: center;
          padding: 9px 18px 9px 48px;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }
        .submenu-item:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.05);
        }
        .submenu-item.active {
          color: #f5a623;
          font-weight: 500;
        }

        /* Divider */
        .menu-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 4px 14px;
        }
        .sidebar {
  width: 240px;
  height: 100%;
      }
}
      `}</style>

      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img src="/images/changelifemarketinglogo.png" alt="Change Life Marketing" className="logo-image" />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const isOpen = openMenus.includes(item.id);
            const isActive = activeId === item.id;
            const hasChildren = !!item.children;

            return (
              <div key={item.id}>
                {/* Divider before Logout */}
                {item.id === "logout" && <div className="menu-divider" />}

                <div
                  className={`menu-item ${isActive ? "active" : ""}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="menu-left">
                    <span className="menu-icon">{item.icon}</span>
                    <span className="menu-label">{item.label}</span>
                  </div>
                  {hasChildren && (
                    <span className="menu-chevron">
                      {isOpen ? <ChevronUp /> : <ChevronDown />}
                    </span>
                  )}
                </div>

                {hasChildren && (
                  <div className={`submenu ${isOpen ? "open" : ""}`}>
                    {item.children!.map((child) => {
                      const submenuItemId = `${item.id}-${child.label}`;
                      const isSubmenuActive = activeSubmenuId === submenuItemId;
                      return (
                        <div
                          key={child.label}
                          className={`submenu-item ${isSubmenuActive ? "active" : ""}`}
                          onClick={() => {
                            setActiveSubmenuId(submenuItemId);
                            if (item.id === "profile" && child.label === "My Profile") {
                              router.push("/dashboard/profile");
                            } else if (item.id === "profile" && child.label === "Welcome Kit") {
                              router.push("/dashboard/welcomekit");
                            } else if (item.id === "epin" && child.label === "Transfer") {
                              router.push("/dashboard/transferepin");
                            } else if (item.id === "epin" && child.label === "My E-pins") {
                              router.push("/dashboard/myepins");
                            } else if (item.id === "epin" && child.label === "My Requests") {
                              router.push("/dashboard/myrequests");
                            } else if (item.id === "epin" && child.label === "Transferred/ Rejected") {
                              router.push("/dashboard/transferred");
                            } else if (item.id === "my-network" && child.label === "Direct Teams") {
                              router.push("/dashboard/directmembers");
                            } else if (item.id === "my-network" && child.label === "Team Network") {
                              router.push("/dashboard/downlinemembers");
                            } else if (item.id === "my-network" && child.label === "Network Tree") {
                              router.push("/dashboard/mothertree");
                            } else if (item.id === "my-network" && child.label === "Booster") {
                              router.push("/dashboard/golddownlinemembers");
                            } else if (item.id === "reports" && child.label === "Silver Binary Income") {
                              router.push("/dashboard/silverbinaryincome");
                            } else if (item.id === "reports" && child.label === "Gold Counting") {
                              router.push("/dashboard/goldcounting");
                            } else if (item.id === "reports" && child.label === "Gold Binary Income") {
                              router.push("/dashboard/goldbinaryincome");
                            } else if (item.id === "settings" && child.label === "Change Password") {
                              router.push("/dashboard/changepassword");
                            } else if (item.id === "settings" && child.label === "Change Transaction Password") {
                              router.push("/dashboard/changetransactionpassword");
                            } else if (item.id === "daily-payout" && child.label === "Processed Payments") {
                              router.push("/dashboard/payoutprocessed");
                            } else if (item.id === "daily-payout" && child.label === "Reimbursement of Expenditure") {
                              router.push("/dashboard/reimbursementofexpenditure");
                            } else if (item.id === "daily-payout" && child.label === "TDS Charge") {
                              router.push("/dashboard/payouttdscharge");
                            }
                          }}
                        >
                          {child.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}