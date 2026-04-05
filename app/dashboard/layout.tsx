"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { isOpen, toggleSidebar } = useSidebar();

  return (
    <>
<style>{`
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

  .dashboard-wrapper {
    display: flex;
    height: 100vh;
    background: #f0f2f5;
    position: relative;
  }

  /* ── SIDEBAR SLIDE ANIMATION ── */
  .sidebar-wrap {
    width: 240px;
    overflow-y: auto;
    overflow-x: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    flex-shrink: 0;
    position: relative;
    max-height: 100vh;
    scrollbar-width: none; /* Firefox */
  }

  .sidebar-wrap::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  .sidebar-wrap.collapsed {
    width: 0;
  }

  /* ── MOBILE OVERLAY ── */
  .sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 35;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar-overlay.active {
    display: block;
    opacity: 1;
    pointer-events: auto;
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
    scrollbar-width: none; /* Firefox */
  }

  .dashboard-content::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }

  /* ── DESKTOP: SIDEBAR VISIBLE BY DEFAULT ── */
  @media (min-width: 769px) {
    .sidebar-overlay {
      display: none !important;
    }
    
    .sidebar-wrap {
      width: 240px;
      position: relative;
      z-index: 10;
    }
  }

  /* ── MOBILE: SIDEBAR SLIDES FROM LEFT ── */
  @media (max-width: 768px) {
    .dashboard-wrapper {
      position: relative;
    }

    .sidebar-wrap {
      position: fixed;
      left: 0;
      top: 0;
      height: 100vh;
      width: 240px;
      background: transparent;
      box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
      z-index: 40;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar-wrap.collapsed {
      transform: translateX(-100%);
    }

    .sidebar-wrap:not(.collapsed) {
      transform: translateX(0);
    }

    .dashboard-main {
      width: 100%;
      z-index: 20;
    }

    .dashboard-content {
      width: 100%;
    }
  }

  @media (max-width: 480px) {
    .sidebar-wrap {
      width: 240px;
      max-width: 80vw;
    }
  }
`}</style>

      <div className="dashboard-wrapper">
        {/* Mobile Overlay */}
        {isOpen && (
          <div 
            className="sidebar-overlay active"
            onClick={() => toggleSidebar()}
          />
        )}

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
