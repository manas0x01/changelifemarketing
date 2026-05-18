"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Trophy,
  KeyRound,
  ClipboardList,
  ShoppingBag,
  Users,
  Wallet,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Landmark,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Achievers",
    href: "/admin/dashboard/achievers",
    icon: Trophy,
  },
  {
    label: "Create PIN",
    href: "/admin/dashboard/createepin",
    icon: KeyRound,
  },
  {
    label: "PIN Requests",
    href: "/admin/dashboard/pinrequests",
    icon: ClipboardList,
  },
  {
    label: "Orders",
    href: "/admin/dashboard/orders",
    icon: ShoppingBag,
  },
  {
    label: "Users",
    href: "/admin/dashboard/users",
    icon: Users,
  },
  {
    label: "Bank Approvals",
    href: "/admin/dashboard/bank-approvals",
    icon: Landmark,
  },
  {
    label: "Withdraw Requests",
    href: "/admin/dashboard/withdrawrequests",
    icon: Wallet,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div
        className={`flex items-center gap-3 px-5 py-6 border-b border-[#FFFFFF]/10 ${
          collapsed && !mobile ? "justify-center" : ""
        }`}
      >
        <div className="w-10 h-10 rounded-sm bg-[#C9A84C] flex items-center justify-center shrink-0">
          <span className="font-['Fraunces'] text-[#0A6E5A] text-lg font-bold leading-none">
            C
          </span>
        </div>
        <AnimatePresence initial={false}>
          {(!collapsed || mobile) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-['Fraunces'] text-[#FFFFFF] text-[1.1rem] leading-tight whitespace-nowrap">
                Change Life
              </p>
              <p className="font-['Roboto'] text-[#C9A84C] text-[0.65rem] uppercase tracking-widest whitespace-nowrap">
                Admin Panel
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed && !mobile ? item.label : undefined}
              className={`
                group relative flex items-center gap-3 px-3 py-3 rounded-sm
                transition-all duration-200
                ${
                  isActive
                    ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                    : "text-[#FFFFFF]/60 hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/5"
                }
                ${collapsed && !mobile ? "justify-center" : ""}
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#C9A84C] rounded-r"
                />
              )}

              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? "text-[#C9A84C]" : "group-hover:text-[#FFFFFF]"
                }`}
              />

              <AnimatePresence initial={false}>
                {(!collapsed || mobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`font-['Roboto'] text-[0.9rem] font-medium whitespace-nowrap overflow-hidden ${
                      isActive ? "text-[#C9A84C]" : ""
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t border-[#FFFFFF]/10 pt-4">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          suppressHydrationWarning={true}
          className={`
            w-full flex items-center gap-3 px-3 py-3 rounded-sm
            text-[#FFFFFF]/50 hover:text-red-400 hover:bg-red-400/10
            transition-all duration-200
            ${collapsed && !mobile ? "justify-center" : ""}
          `}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence initial={false}>
            {(!collapsed || mobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-['Roboto'] text-[0.9rem] font-medium whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col h-screen bg-[#0A6E5A] border-r border-[#FFFFFF]/10 fixed left-0 top-0 shrink-0 z-30"
      >
        <SidebarContent />

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          suppressHydrationWarning={true}
          className="absolute -right-3 top-22 w-6 h-6 rounded-full bg-[#0A6E5A] border border-[#FFFFFF]/20 flex items-center justify-center text-[#FFFFFF]/60 hover:text-[#C9A84C] transition-colors shadow-md z-40"
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </motion.aside>

      {/* ── Mobile Hamburger Button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        suppressHydrationWarning={true}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-sm bg-[#0A6E5A] flex items-center justify-center text-[#FFFFFF] shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-[#0A6E5A] z-50 flex flex-col shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                suppressHydrationWarning={true}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#FFFFFF]/60 hover:text-[#FFFFFF]"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}