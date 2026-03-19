"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { isOpen } = useSidebar();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .dashboard-wrapper {
          display: flex;
          height: 100vh;
          background: #f0f2f5;
        }

        /* ── SIDEBAR HIDDEN STATE ── */
        .sidebar-hidden {
          display: none;
        }

        /* ── MAIN CONTENT ── */
        .dashboard-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .dashboard-content {
          flex: 1;
          overflow-y: auto;
          background: #f0f2f5;
        }
      `}</style>

      <div className="dashboard-wrapper">
        {/* Sidebar Component */}
        <div className={!isOpen ? "sidebar-hidden" : ""}>
          <Sidebar />
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          <div className="dashboard-content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}
