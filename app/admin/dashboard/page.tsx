"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  ShoppingBag,
  Wallet,
  Trophy,
  KeyRound,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Bell,
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  IndianRupee,
  ChevronUp,
  Loader2,
} from "lucide-react";


// Types for dynamic data
interface DashboardData {
  stats: {
    totalUsers: string;
    totalOrders: string;
    withdrawPending: string;
    activeAchievers: string;
    pinRequests: string;
    pendingOrders: string;
    newUsersToday: string;
    revenueToday: string;
    pendingWithdrawals: string;
    totalAchievers: string;
    monthlyRevenue: string;
  };
  recentOrders: Array<{
    id: string;
    user: string;
    product: string;
    amount: string;
    status: string;
  }>;
  recentWithdrawals: Array<{
    user: string;
    amount: string;
    bank: string;
    date: string;
    status: string;
  }>;
  topAchievers: Array<{
    rank: number;
    name: string;
    level: string;
    earnings: string;
  }>;
}

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { icon: React.ElementType; cls: string }> = {
    Completed: { icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    Approved:  { icon: CheckCircle, cls: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    Pending:   { icon: Clock,       cls: "text-amber-600 bg-amber-50 border-amber-100" },
    Cancelled: { icon: XCircle,     cls: "text-rose-500 bg-rose-50 border-rose-100" },
    Rejected:  { icon: XCircle,     cls: "text-rose-500 bg-rose-50 border-rose-100" },
  };
  const { icon: Icon, cls } = map[status] ?? map.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border text-[0.72rem] font-['Roboto'] font-semibold uppercase tracking-wide ${cls}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-[#FFFFFF] border border-[#0A6E5A]/10 rounded-sm shadow-sm ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-[#0A6E5A]/8">
    <h3 className="font-['Fraunces'] text-[1.1rem] text-[#0A6E5A]">{title}</h3>
    {action}
  </div>
);

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard-stats");
        const json = await response.json();
        if (json.success) {
          setData(json);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7F6] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0A6E5A] animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Total Users",
      value: data?.stats.totalUsers || "0",
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "text-[#0A6E5A]",
      bg: "bg-[#0A6E5A]/8",
      border: "border-[#0A6E5A]/20",
    },
    {
      label: "Total Orders",
      value: data?.stats.totalOrders || "0",
      change: "+0%",
      trend: "up",
      icon: ShoppingBag,
      color: "text-[#C9A84C]",
      bg: "bg-[#C9A84C]/8",
      border: "border-[#C9A84C]/20",
    },
    {
      label: "Withdraw Pending",
      value: data?.stats.withdrawPending || "₹0",
      change: "-0%",
      trend: "down",
      icon: Wallet,
      color: "text-rose-500",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      label: "Active Achievers",
      value: data?.stats.activeAchievers || "0",
      change: "+0%",
      trend: "up",
      icon: Trophy,
      color: "text-purple-500",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
  ];

  const stagger: any = {
    container: {
      hidden: {},
      show: { transition: { staggerChildren: 0.08 } },
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      show: { 
        opacity: 1, 
        y: 0, 
        transition: { 
          duration: 0.55, 
        } 
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#F5F7F6] flex font-['Roboto']">
      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top Bar ── */}
        <header className="sticky top-0 z-20 bg-[#FFFFFF]/95 backdrop-blur border-b border-[#0A6E5A]/10 px-6 lg:px-8 py-4 flex items-center gap-4">
          {/* Left gap on mobile for hamburger */}
          <div className="w-10 lg:w-0 shrink-0" />

          {/* Search */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A6E5A]/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users, orders…"
              className="w-full pl-9 pr-4 py-2.5 text-[0.875rem] bg-[#F5F7F6] border border-[#0A6E5A]/15 rounded-sm outline-none focus:border-[#0A6E5A]/50 text-[#333333] placeholder:text-[#333333]/40 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-sm bg-[#F5F7F6] flex items-center justify-center text-[#0A6E5A]/60 hover:text-[#0A6E5A] hover:bg-[#0A6E5A]/8 transition-colors border border-[#0A6E5A]/10">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-sm bg-[#0A6E5A] flex items-center justify-center shrink-0">
                <span className="font-['Fraunces'] text-[#C9A84C] text-sm font-bold">A</span>
              </div>
              <div className="hidden md:block">
                <p className="text-[0.8rem] font-semibold text-[#0A6E5A] leading-tight">Admin</p>
                <p className="text-[0.7rem] text-[#333333]/50">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* ── Scrollable Body ── */}
        <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-8 space-y-8">

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[0.75rem] uppercase tracking-widest text-[#C9A84C] font-semibold mb-1">Overview</p>
            <h1 className="font-['Fraunces'] text-[1.875rem] md:text-[2.25rem] text-[#0A6E5A] leading-tight">
              Admin Dashboard
            </h1>
          </motion.div>

          {/* ── KPI Cards ── */}
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
          >
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              const isUp = kpi.trend === "up";
              return (
                <motion.div key={kpi.label} variants={stagger.item}>
                  <Card className="p-5 hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-11 h-11 rounded-sm ${kpi.bg} border ${kpi.border} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${kpi.color}`} />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[0.72rem] font-semibold px-2 py-0.5 rounded-sm ${
                          isUp
                            ? "text-emerald-600 bg-emerald-50"
                            : "text-rose-500 bg-rose-50"
                        }`}
                      >
                        {isUp ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {kpi.change}
                      </span>
                    </div>
                    <p className="font-['Fraunces'] text-[1.875rem] text-[#0A6E5A] leading-none mb-1">
                      {kpi.value}
                    </p>
                    <p className="text-[0.8rem] text-[#333333]/55 uppercase tracking-wider font-medium">
                      {kpi.label}
                    </p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── Quick Stats Bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <Card className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-[#0A6E5A]/8">
              {[
                { label: "PIN Requests", value: data?.stats.pinRequests || "0", icon: KeyRound },
                { label: "Pending Orders", value: data?.stats.pendingOrders || "0", icon: ShoppingBag },
                { label: "New Users Today", value: data?.stats.newUsersToday || "0", icon: Users },
                { label: "Revenue Today", value: data?.stats.revenueToday || "₹0", icon: IndianRupee },
                { label: "Pending Withdrawals", value: data?.stats.pendingWithdrawals || "0", icon: Wallet },
                { label: "Total Achievers", value: data?.stats.totalAchievers || "0", icon: Trophy },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center py-5 px-4 text-center gap-2 hover:bg-[#0A6E5A]/3 transition-colors"
                >
                  <Icon className="w-4 h-4 text-[#C9A84C]" />
                  <p className="font-['Fraunces'] text-[1.375rem] text-[#0A6E5A]">{value}</p>
                  <p className="text-[0.65rem] uppercase tracking-wider text-[#333333]/50 font-medium leading-snug">{label}</p>
                </div>
              ))}
            </Card>
          </motion.div>

          {/* ── Orders + Withdrawals ── */}
          <div className="grid lg:grid-cols-5 gap-6">

            {/* Recent Orders — 3 cols */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3"
            >
              <Card className="h-full">
                <CardHeader
                  title="Recent Orders"
                  action={
                    <a href="/admin/orders" className="flex items-center gap-1 text-[0.75rem] text-[#C9A84C] font-semibold hover:text-[#0A6E5A] transition-colors uppercase tracking-wide">
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  }
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-[0.82rem]">
                    <thead>
                      <tr className="border-b border-[#0A6E5A]/8">
                        {["Order ID", "User", "Product", "Amount", "Status"].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left font-semibold text-[0.7rem] uppercase tracking-wider text-[#333333]/45"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A6E5A]/5">
                      {(data?.recentOrders || []).map((order) => (
                        <tr key={order.id} className="hover:bg-[#0A6E5A]/2 transition-colors">
                          <td className="px-5 py-3.5 font-['Fraunces'] text-[#0A6E5A] text-[0.85rem]">{order.id}</td>
                          <td className="px-5 py-3.5 text-[#333333]/80 whitespace-nowrap">{order.user}</td>
                          <td className="px-5 py-3.5 text-[#333333]/60 max-w-36 truncate">{order.product}</td>
                          <td className="px-5 py-3.5 font-semibold text-[#0A6E5A] whitespace-nowrap">{order.amount}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Withdraw Requests — 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <Card className="h-full">
                <CardHeader
                  title="Withdraw Requests"
                  action={
                    <a href="/admin/dashboard/withdrawrequests" className="flex items-center gap-1 text-[0.75rem] text-[#C9A84C] font-semibold hover:text-[#0A6E5A] transition-colors uppercase tracking-wide">
                      All <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  }
                />
                <div className="divide-y divide-[#0A6E5A]/5">
                  {(data?.recentWithdrawals || []).map((w, i) => (
                    <div key={i} className="px-5 py-4 hover:bg-[#0A6E5A]/2 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div>
                          <p className="font-semibold text-[#0A6E5A] text-[0.85rem]">{w.user}</p>
                          <p className="text-[0.72rem] text-[#333333]/50">{w.bank}</p>
                        </div>
                        <StatusBadge status={w.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-['Fraunces'] text-[1.1rem] text-[#C9A84C]">{w.amount}</span>
                        <span className="text-[0.7rem] text-[#333333]/45">{w.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── PIN Requests + Top Achievers ── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* PIN Requests */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-1"
            >
              <Card className="h-full">
                <CardHeader
                  title="PIN Requests"
                  action={
                    <a href="/admin/pin-requests" className="flex items-center gap-1 text-[0.75rem] text-[#C9A84C] font-semibold hover:text-[#0A6E5A] transition-colors uppercase tracking-wide">
                      All <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  }
                />
                <div className="divide-y divide-[#0A6E5A]/5">
                  {(data?.recentOrders?.filter(o => o.status === "Pending") || []).map((p, i) => (
                    <div key={i} className="px-5 py-4 hover:bg-[#0A6E5A]/2 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-[#0A6E5A] text-[0.85rem]">{p.user}</p>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[0.75rem] text-[#333333]/55">
                          <KeyRound className="inline w-3 h-3 mr-1 text-[#C9A84C]" />
                          {p.product}
                        </span>
                        <span className="text-[0.7rem] text-[#333333]/40">{p.amount}</span>
                      </div>
                    </div>
                  ))}
                  {(!data?.recentOrders?.filter(o => o.status === "Pending").length) && (
                    <div className="px-5 py-10 text-center text-[#333333]/40 text-[0.8rem]">
                      No pending requests
                    </div>
                  )}
                </div>

                {/* Quick Create PIN CTA */}
                <div className="px-5 pb-5 pt-3">
                  <a
                    href="/admin/create-pin"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#0A6E5A] text-[#FFFFFF] rounded-sm text-[0.8rem] font-semibold hover:bg-[#0A6E5A]/90 transition-colors"
                  >
                    <KeyRound className="w-4 h-4" />
                    Create New PIN
                  </a>
                </div>
              </Card>
            </motion.div>

            {/* Top Achievers */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="lg:col-span-2"
            >
              <Card className="h-full">
                <CardHeader
                  title="Top Achievers"
                  action={
                    <a href="/admin/achievers" className="flex items-center gap-1 text-[0.75rem] text-[#C9A84C] font-semibold hover:text-[#0A6E5A] transition-colors uppercase tracking-wide">
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  }
                />
                <div className="p-5 space-y-3">
                  {(data?.topAchievers || []).map((a) => {
                    const rankColor =
                      a.rank === 1 ? "text-[#C9A84C]" :
                      a.rank === 2 ? "text-slate-400" :
                      "text-amber-700";
                    const levelBg =
                      a.level === "Diamond" ? "bg-purple-50 text-purple-600 border-purple-100" :
                      a.level === "Gold"    ? "bg-amber-50 text-amber-600 border-amber-100" :
                                              "bg-slate-50 text-slate-500 border-slate-100";
                    return (
                      <div
                        key={a.rank}
                        className="flex items-center gap-4 p-4 rounded-sm bg-[#F5F7F6] border border-[#0A6E5A]/8 hover:border-[#0A6E5A]/20 hover:shadow-sm transition-all"
                      >
                        <span className={`font-['Fraunces'] text-[1.5rem] w-8 text-center shrink-0 ${rankColor}`}>
                          #{a.rank}
                        </span>
                        <div className="w-10 h-10 rounded-sm bg-[#0A6E5A] flex items-center justify-center shrink-0">
                          <span className="font-['Fraunces'] text-[#C9A84C] font-bold">
                            {a.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#0A6E5A] text-[0.9rem] truncate">{a.name}</p>
                          <span className={`inline-block text-[0.65rem] uppercase tracking-wide font-bold px-2 py-0.5 rounded-sm border mt-0.5 ${levelBg}`}>
                            {a.level}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-['Fraunces'] text-[1.1rem] text-[#C9A84C]">{a.earnings}</p>
                          <p className="text-[0.68rem] text-[#333333]/45 uppercase tracking-wide">Total Earned</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Revenue graphic strip */}
                <div className="mx-5 mb-5 rounded-sm bg-[#0A6E5A] p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-[#C9A84C] text-[0.7rem] uppercase tracking-widest font-semibold mb-0.5">Monthly Revenue</p>
                    <p className="font-['Fraunces'] text-[1.5rem] text-[#FFFFFF]">{data?.stats.monthlyRevenue || "₹0"}</p>
                    <p className="text-[0.72rem] text-[#FFFFFF]/50 mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">+0%</span> vs last month
                    </p>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                      <div
                        key={i}
                        className="w-4 rounded-sm bg-[#C9A84C]/30 hover:bg-[#C9A84C]/60 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[0.72rem] text-[#333333]/35 pb-4 uppercase tracking-widest">
            Change Life Marketing · Admin Panel · {new Date().getFullYear()}
          </p>
        </main>
      </div>
    </div>
  );
}