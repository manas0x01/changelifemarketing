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

  /* ── SIDEBAR SLIDE ANIMATION ── */
  .sidebar-wrap {
    width: 240px;
    overflow: hidden;
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
  }

  .sidebar-wrap.collapsed {
    width: 0;
  }

  /* ── MAIN CONTENT ── */
  .dashboard-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: flex 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .dashboard-content {
    flex: 1;
    overflow-y: auto;
    background: #f0f2f5;
  }
`}</style>

      <div className="dashboard-wrapper">
  {/* Sidebar with slide */}
  <div className={`sidebar-wrap ${!isOpen ? "collapsed" : ""}`}>
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
