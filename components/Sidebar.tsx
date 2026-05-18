"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

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
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
  {
    id: "invoice",
    label: "Invoice",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    id: "buy-pins",
    label: "Buy Pins",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    id: "profile",
    label: "Profile Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    children: [{ label: "My Profile" }, { label: "Welcome Kit" }],
  },
  {
    id: "epin",
    label: "E-Pin Control",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
    children: [{ label: "Transfer" }, { label: "My E-pins" }, { label: "My Requests" }, { label: "Transferred/ Rejected" }],
  },
  {
    id: "my-network",
    label: "My Team",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    children: [{ label: "Direct Teams" }, { label: "Team Network" }, { label: "Network Tree" }, { label: "Booster" }, { label: "Booster Rewards" }],
  },
  {
    id: "reports",
    label: "Reports",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    children: [{ label: "Basic Income" }, { label: "Booster Counting" }, { label: "Booster Income" }],
  },
  {
    id: "daily-payout",
    label: "Daily Payout",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
    children: [{ label: "Success Payments" }, { label: "Admin & Processing" }, { label: "TDS" }, { label: "Withdrawal History" }],
  },
  {
    id: "chat-support",
    label: "Support Center",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    children: [{ label: "Change Password" }, { label: "Change Transaction Password" }],
  },
  {
    id: "logout",
    label: "Logout",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    ),
  },
];

const ChevronUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const ChevronDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
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
      await signOut({ redirect: false, callbackUrl: "/" });
      router.push("/");
    } catch { }
  };

  useEffect(() => {
    const routePatterns: Array<{ pattern: string; activeId: string; submenuId: string | null; menuToOpen?: string }> = [
      { pattern: "/dashboard/profile", activeId: "profile", submenuId: "profile-My Profile", menuToOpen: "profile" },
      { pattern: "/dashboard/welcomekit", activeId: "profile", submenuId: "profile-Welcome Kit", menuToOpen: "profile" },
      { pattern: "/dashboard/transferepin", activeId: "epin", submenuId: "epin-Transfer", menuToOpen: "epin" },
      { pattern: "/dashboard/myepins", activeId: "epin", submenuId: "epin-My E-pins", menuToOpen: "epin" },
      { pattern: "/dashboard/myrequests", activeId: "epin", submenuId: "epin-My Requests", menuToOpen: "epin" },
      { pattern: "/dashboard/transferred", activeId: "epin", submenuId: "epin-Transferred/ Rejected", menuToOpen: "epin" },
      { pattern: "/dashboard/directmembers", activeId: "my-network", submenuId: "my-network-Direct Members", menuToOpen: "my-network" },
      { pattern: "/dashboard/teamnetwork", activeId: "my-network", submenuId: "my-network-Team Network", menuToOpen: "my-network" },
      { pattern: "/dashboard/networktree", activeId: "my-network", submenuId: "my-network-Network Tree", menuToOpen: "my-network" },
      { pattern: "/dashboard/booster", activeId: "my-network", submenuId: "my-network-Booster", menuToOpen: "my-network" },
      { pattern: "/dashboard/booster-rewards", activeId: "my-network", submenuId: "my-network-Booster Rewards", menuToOpen: "my-network" },
      { pattern: "/dashboard/basicincome", activeId: "reports", submenuId: "reports-Basic Income", menuToOpen: "reports" },
      { pattern: "/dashboard/boostercounting", activeId: "reports", submenuId: "reports-Booster Counting", menuToOpen: "reports" },
      { pattern: "/dashboard/boosterincome", activeId: "reports", submenuId: "reports-Booster Income", menuToOpen: "reports" },
      { pattern: "/dashboard/changepassword", activeId: "settings", submenuId: "settings-Change Password", menuToOpen: "settings" },
      { pattern: "/dashboard/changetransactionpassword", activeId: "settings", submenuId: "settings-Change Transaction Password", menuToOpen: "settings" },
      { pattern: "/dashboard/successpayments", activeId: "daily-payout", submenuId: "daily-payout-Success Payments", menuToOpen: "daily-payout" },
      { pattern: "/dashboard/adminprocessing", activeId: "daily-payout", submenuId: "daily-payout-Admin & Processing", menuToOpen: "daily-payout" },
      { pattern: "/dashboard/tds", activeId: "daily-payout", submenuId: "daily-payout-TDS", menuToOpen: "daily-payout" },
      { pattern: "/dashboard/withdrawals", activeId: "daily-payout", submenuId: "daily-payout-Withdrawal History", menuToOpen: "daily-payout" },
      { pattern: "/dashboard/registration", activeId: "registration", submenuId: null },
      { pattern: "/dashboard/invoice", activeId: "invoice", submenuId: null },
    ];
    const route = routePatterns.find(r => pathname.includes(r.pattern));
    if (route) {
      setActiveId(route.activeId);
      setActiveSubmenuId(route.submenuId);
      if (route.menuToOpen) {
        const m = route.menuToOpen;
        setOpenMenus(prev => Array.from(new Set([...prev, m])));
      }
    } else if (pathname === "/dashboard") {
      setActiveId("dashboard");
      setActiveSubmenuId(null);
    }
  }, [pathname]);

  const routeMap: Record<string, string> = {
    dashboard: "/dashboard",
    registration: "/dashboard/registration",
    invoice: "/dashboard/invoice",
    "buy-pins": "/dashboard/buypins",
    "chat-support": "/dashboard/chatsupport",
  };

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.id === "logout") {
      handleLogout();
    } else if (item.children) {
      toggleMenu(item.id);
    } else {
      setActiveId(item.id);
      const route = routeMap[item.id];
      if (route) router.push(route);
    }
  };

  const handleSubmenuClick = (itemId: string, label: string) => {
    const key = `${itemId}-${label}`;
    setActiveSubmenuId(key);
    const routes: Record<string, string> = {
      "profile-My Profile": "/dashboard/profile",
      "profile-Welcome Kit": "/dashboard/welcomekit",
      "epin-Transfer": "/dashboard/transferepin",
      "epin-My E-pins": "/dashboard/myepins",
      "epin-My Requests": "/dashboard/myrequests",
      "epin-Transferred/ Rejected": "/dashboard/transferred",
      "my-network-Direct Teams": "/dashboard/directmembers",
      "my-network-Team Network": "/dashboard/teamnetwork",
      "my-network-Network Tree": "/dashboard/networktree",
      "my-network-Booster": "/dashboard/booster",
      "my-network-Booster Rewards": "/dashboard/booster-rewards",
      "reports-Basic Income": "/dashboard/basicincome",
      "reports-Booster Counting": "/dashboard/boostercounting",
      "reports-Booster Income": "/dashboard/boosterincome",
      "settings-Change Password": "/dashboard/changepassword",
      "settings-Change Transaction Password": "/dashboard/changetransactionpassword",
      "daily-payout-Success Payments": "/dashboard/successpayments",
      "daily-payout-Admin & Processing": "/dashboard/adminprocessing",
      "daily-payout-TDS": "/dashboard/tds",
      "daily-payout-Withdrawal History": "/dashboard/withdrawals",
    };
    if (routes[key]) router.push(routes[key]);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Nunito:wght@400;500;600;700;800&display=swap');

        :root {
          --sb-bg:        #120228;
          --sb-bg-mid:    #1a0533;
          --sb-card:      #200640;
          --sb-gold:      #ffe97c;
          --sb-gold-dim:  #ffe97c;
          --sb-gold-glow: rgba(255,233,124,0.18);
          --sb-purple:    #a855f7;
          --sb-border:    rgba(255,245,198,0.22);
          --sb-text:      #ffe97c;
          --sb-text-dim:  #ffe97c;
        }

        /* ── Sidebar shell ── */
        .sidebar {
          width: 248px;
          min-height: 100vh;
          background: linear-gradient(180deg, #110122 0%, #15022e 60%, #0d001a 100%);
          display: flex;
          flex-direction: column;
          font-family: 'Nunito', sans-serif;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(245,197,24,0.22);
        }

        /* Ambient purple glow top-left */
        .sidebar::before {
          content: '';
          position: absolute;
          top: -80px; left: -80px;
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(168,85,247,0.35) 0%, transparent 75%);
          pointer-events: none;
        }
        /* Ambient gold glow bottom-right */
        .sidebar::after {
          content: '';
          position: absolute;
          bottom: -60px; right: -60px;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(245,197,24,0.22) 0%, transparent 75%);
          pointer-events: none;
        }

        /* ── Logo area ── */
        .sidebar-logo {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 14px 6px 0px;
          position: relative;
        }
        .logo-image {
          max-width: 235px;
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 0 16px rgba(245,197,24,0.4));
        }

        /* ── Scrollable nav ── */
        .sidebar-nav {
          flex: 1;
          padding: 0 0 24px;
          overflow-y: auto;
          scrollbar-width: none;
          position: relative;
          z-index: 1;
        }
        .sidebar-nav::-webkit-scrollbar { display: none; }

        /* ── Menu item ── */
        .menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          cursor: pointer;
          position: relative;
          user-select: none;
          transition: background 0.22s, border-color 0.22s, box-shadow 0.22s;
          margin: 4px 10px;
          border-radius: 12px;
          border: 1.5px solid transparent;
        }
        .menu-item:hover {
          background: rgba(245,197,24,0.06);
          border-color: rgba(245,197,24,0.35);
          box-shadow: 0 0 12px rgba(245,197,24,0.15);
        }

        /* Active state */
        .menu-item.active {
          background: linear-gradient(90deg, rgba(245,197,24,0.12) 0%, rgba(168,85,24,0.06) 100%);
          border-color: var(--sb-gold);
          box-shadow: 
            0 0 18px rgba(245,197,24,0.35),
            inset 0 0 10px rgba(245,197,24,0.15);
        }
        .menu-item.active .menu-label { color: var(--sb-gold); font-weight: 700; }
        .menu-item.active .menu-icon  { color: var(--sb-gold); }

        .menu-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        /* Icon container */
        .menu-icon {
          color: var(--sb-gold-dim);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.18s, transform 0.18s;
          width: 22px;
          justify-content: center;
        }
        .menu-item:hover .menu-icon {
          color: var(--sb-gold);
          transform: scale(1.08);
        }

        .menu-label {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--sb-gold-dim);
          transition: color 0.18s;
          white-space: nowrap;
        }
        .menu-item:hover .menu-label {
          color: var(--sb-gold);
        }

        .menu-chevron {
          color: var(--sb-text-dim);
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transition: color 0.18s, transform 0.22s;
        }
        .menu-item.open .menu-chevron { color: var(--sb-gold-dim); }

        /* ── Submenu ── */
        .submenu {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.28s ease, opacity 0.22s ease;
          margin: 0 8px;
        }
        .submenu.open {
          max-height: 400px;
          opacity: 1;
        }

        /* Submenu container with left border line */
        .submenu-inner {
          border-left: 1.5px solid rgba(245,197,24,0.18);
          margin-left: 26px;
          padding: 4px 0 6px;
        }

        .submenu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--sb-text-dim);
          cursor: pointer;
          border-radius: 8px;
          margin: 1px 4px 1px 0;
          transition: color 0.15s, background 0.15s;
          position: relative;
        }
        .submenu-item::before {
          content: '';
          position: absolute;
          left: -1px; top: 50%;
          transform: translateY(-50%);
          width: 6px; height: 1.5px;
          background: rgba(245,197,24,0.3);
        }
        .submenu-item:hover {
          color: rgba(245,197,24,0.9);
          background: rgba(245,197,24,0.06);
        }
        .submenu-item.active {
          color: var(--sb-gold);
          font-weight: 700;
          background: rgba(245,197,24,0.08);
        }
        .submenu-item.active::before {
          background: var(--sb-gold);
          width: 8px;
        }

        /* Dot indicator */
        .submenu-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
          opacity: 0.6;
        }
        .submenu-item.active .submenu-dot { opacity: 1; }

        /* ── Divider ── */
        .menu-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,197,24,0.15), transparent);
          margin: 8px 16px;
        }

        /* ── Bottom user strip ── */
        .sidebar-footer {
          padding: 14px 16px;
          border-top: 1px solid var(--sb-border);
          background: rgba(0,0,0,0.2);
          position: relative;
          z-index: 1;
        }
        .footer-version {
          font-size: 10px;
          color: var(--sb-text-dim);
          text-align: center;
          letter-spacing: 1px;
          font-family: 'Cinzel', serif;
        }

        @media (max-width: 768px) {
          .sidebar { width: 240px; }
        }
      `}</style>

      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <img
            src="/images/WhatsApp_Image_2026-05-17_at_9.39.25_PM-removebg-preview.png"
            alt="Change Life Marketing"
            className="logo-image"
          />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const isOpen = openMenus.includes(item.id);
            const isActive = activeId === item.id;
            const hasChildren = !!item.children;

            return (
              <div key={item.id}>
                {item.id === "logout" && <div className="menu-divider" />}

                <div
                  className={`menu-item ${isActive ? "active" : ""} ${isOpen ? "open" : ""}`}
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
                    <div className="submenu-inner">
                      {item.children!.map((child) => {
                        const key = `${item.id}-${child.label}`;
                        const isSubmenuActive = activeSubmenuId === key;
                        return (
                          <div
                            key={child.label}
                            className={`submenu-item ${isSubmenuActive ? "active" : ""}`}
                            onClick={() => handleSubmenuClick(item.id, child.label)}
                          >
                            <span className="submenu-dot" />
                            {child.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="footer-version">Change Life Marketing</div>
        </div>
      </aside>
    </>
  );
}