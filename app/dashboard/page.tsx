"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CycleRow {
  date: string;
  cycles: { label: string; moon: boolean }[];
  matches: number[];
  cappings: number[];
}
interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}
interface BoosterIncome {
  amount: number;
  LG: number;
  RG: number;
  totalMatching: number;
}
interface DashboardData {
  totalTeam: { left: number; right: number };
  totalDirect: { left: number; right: number };
  totalActiveDirect: { left: number; right: number };
  totalLeftBasicUser: number;
  totalRightBasicUser: number;
  totalLeftBoosterUser: number;
  totalRightBoosterUser: number;
  basicIncome: number;
  boosterIncome: BoosterIncome;
  totalPins: { active: number; used: number; total: number };
  totalIncome: number;
  availableBalance?: number;
  userProfile: { fullName: string; userId: string; username: string; mobileNo: string; email: string; joiningDate: string };
  bankDetails: BankDetails;
  cycleHistory: CycleRow[];
  isBooster?: boolean;
}

/* ── Premium SVG Icons ── */
const TeamIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#ffe97c" />
  </svg>
);
const MoneyIcon = () => (
  <span style={{ fontSize: "22px", fontWeight: "800", color: "#ffe97c", display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1, fontFamily: "sans-serif" }}>₹</span>
);
const WalletIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="#ffe97c" />
  </svg>
);
const PinIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ffe97c" />
  </svg>
);
const UserIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="#ffe97c" />
  </svg>
);
const TrendUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" fill="#ffe97c" />
  </svg>
);
const MoonIcon = () => <span style={{ fontSize: 13 }}>🌙</span>;
const GearIcon = () => <span style={{ fontSize: 13 }}>⚙️</span>;

/* ── Card config ── */
const statCards = [
  { title: "Total Team", icon: <TeamIcon />, accent: "#a855f7", trend: "14.2%" },
  { title: "Basic Income", icon: <MoneyIcon />, accent: "#f59e0b", trend: "8.5%" },
  { title: "Booster Income", icon: <MoneyIcon />, accent: "#10b981", trend: "11.1%" },
  { title: "Total Direct", icon: <TeamIcon />, accent: "#06b6d4", trend: "9.3%" },
  { title: "Active Direct", icon: <TeamIcon />, accent: "#8b5cf6", trend: "12.0%" },
  { title: "Basic Users", icon: <TeamIcon />, accent: "#f97316", trend: "7.8%" },
  { title: "Booster Users", icon: <TeamIcon />, accent: "#22c55e", trend: "15.4%" },
  { title: "Total Pins", icon: <PinIcon />, accent: "#ec4899", trend: "6.2%" },
  { title: "Total Income", icon: <WalletIcon />, accent: "#ffe97c", trend: "12.5%" },
  { title: "Wallet Balance", icon: <WalletIcon />, accent: "#10b981", trend: "15.0%" },
];

export default function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");
  const [showTotalTeamInfo, setShowTotalTeamInfo] = useState(false);
  const [showTotalDirectInfo, setShowTotalDirectInfo] = useState(false);
  const [showActiveDirectInfo, setShowActiveDirectInfo] = useState(false);
  const [showBasicUsersInfo, setShowBasicUsersInfo] = useState(false);
  const [showBoosterUsersInfo, setShowBoosterUsersInfo] = useState(false);
  const [showBasicIncomeInfo, setShowBasicIncomeInfo] = useState(false);
  const [showBoosterIncomeInfo, setShowBoosterIncomeInfo] = useState(false);
  const [showTotalPinsInfo, setShowTotalPinsInfo] = useState(false);
  const [showTotalIncomeInfo, setShowTotalIncomeInfo] = useState(false);
  const [showWalletBalanceInfo, setShowWalletBalanceInfo] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalTeam: { left: 0, right: 0 },
    totalDirect: { left: 0, right: 0 },
    totalActiveDirect: { left: 0, right: 0 },
    totalLeftBasicUser: 0,
    totalRightBasicUser: 0,
    totalLeftBoosterUser: 0,
    totalRightBoosterUser: 0,
    basicIncome: 0,
    boosterIncome: { amount: 0, LG: 0, RG: 0, totalMatching: 0 },
    totalPins: { active: 0, used: 0, total: 0 },
    totalIncome: 0,
    availableBalance: 0,
    userProfile: { fullName: "N/A", userId: "N/A", username: "N/A", mobileNo: "N/A", email: "N/A", joiningDate: "N/A" },
    bankDetails: { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" },
    cycleHistory: [] as CycleRow[],
    isBooster: false,
  });
  const {
    totalTeam, totalDirect, totalActiveDirect,
    totalLeftBasicUser, totalRightBasicUser,
    totalLeftBoosterUser, totalRightBoosterUser,
    basicIncome, boosterIncome, totalPins, totalIncome,
    availableBalance = 0,
    userProfile, bankDetails, cycleHistory,
    isBooster = false
  } = dashboardData;
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/dashboard", { method: "GET", credentials: "include" });
      if (res.status === 401) { window.location.href = "/auth/login"; return; }
      const result = await res.json();
      if (result.success) {
        const d = result.data;
        const incoming = d.boosterIncome || {};
        const amount = d.boosterIncome?.amount ?? d.boosterIncomeAmount ?? 0;
        const totalMatching = d.boosterIncome?.totalMatching ?? d.boosterIncome?.totalBoosterMatching ?? 0;
        setDashboardData((prev: DashboardData) => ({
          ...prev,
          totalTeam: d.totalTeam ?? prev.totalTeam,
          totalDirect: d.totalDirect ?? prev.totalDirect,
          totalActiveDirect: d.totalActiveDirect ?? prev.totalActiveDirect,
          totalLeftBasicUser: d.totalLeftBasicUser ?? prev.totalLeftBasicUser,
          totalRightBasicUser: d.totalRightBasicUser ?? prev.totalRightBasicUser,
          totalLeftBoosterUser: d.totalLeftBoosterUser ?? prev.totalLeftBoosterUser,
          totalRightBoosterUser: d.totalRightBoosterUser ?? prev.totalRightBoosterUser,
          basicIncome: d.basicIncome ?? prev.basicIncome,
          boosterIncome: { amount, LG: incoming.LG ?? 0, RG: incoming.RG ?? 0, totalMatching },
          totalIncome: d.totalIncome ?? prev.totalIncome,
          availableBalance: d.availableBalance ?? prev.availableBalance ?? 0,
          totalPins: d.totalPins ?? prev.totalPins,
          userProfile: d.userProfile ?? prev.userProfile,
          bankDetails: d.bankDetails ?? prev.bankDetails,
          cycleHistory: d.cycleHistory ?? prev.cycleHistory,
          isBooster: d.isBooster ?? prev.isBooster ?? false,
        }));
      }
    } catch (error: any) {
      console.error("❌ Dashboard Error:", error?.message ?? error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shouldReload = sessionStorage.getItem("reloadDashboard");
      if (shouldReload === "true") { sessionStorage.removeItem("reloadDashboard"); fetchDashboardData(); }
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, []);

  const handleWithdraw = async () => {
    setWithdrawError(""); setWithdrawSuccess("");
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amt)) { setWithdrawError("Please enter a valid amount."); return; }
    if (amt < 1000) { setWithdrawError("Minimum withdrawal amount is ₹1000."); return; }
    if (amt > availableBalance) { setWithdrawError("Amount exceeds your available wallet balance."); return; }
    try {
      setWithdrawLoading(true);
      const res = await fetch("/api/user/withdraw", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      if (res.status === 401) { window.location.href = "/auth/login"; return; }
      const data = await res.json();
      if (!res.ok) {
        setWithdrawError(data.error || data.message || "Withdrawal failed.");
      } else {
        setWithdrawSuccess(data.message || "Withdrawal request submitted!");
        setDashboardData((prev: DashboardData) => ({
          ...prev,
          availableBalance: data.remainingBalance ?? (prev.availableBalance ? prev.availableBalance - amt : prev.totalIncome - amt)
        }));
        setWithdrawAmount("");
      }
    } catch { setWithdrawError("Network error. Please try again."); }
    finally { setWithdrawLoading(false); }
  };

  const totalLeftRight = totalTeam.left + totalTeam.right;
  const leftPct = totalLeftRight === 0 ? 50 : Math.round((totalTeam.left / totalLeftRight) * 100);
  const rightPct = 100 - leftPct;

  const getActionableAdvice = () => {
    if (availableBalance >= 1000) {
      return "🎉 Ready for Withdrawal! Your wallet has reached the minimum ₹1,000 limit. Click 'Withdraw' above to submit your request.";
    }
    
    if (totalDirect.left === 0 || totalDirect.right === 0) {
      return "💡 Quick Tip: sponsor at least 1 direct member on both Left and Right to unlock pair matching and start earning!";
    }
    
    if (totalTeam.left > totalTeam.right) {
      return "💡 Strategy: Your Left team is stronger. Place your next sign-up on the RIGHT to maximize paired matching income!";
    } else if (totalTeam.right > totalTeam.left) {
      return "💡 Strategy: Your Right team is stronger. Place your next sign-up on the LEFT to maximize paired matching income!";
    }
    
    return "🚀 Keep up the momentum! Encourage your direct members to activate their accounts to accelerate matching commissions.";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Nunito:wght@400;500;600;700;800&display=swap');

        :root {
          --royal: #1a0533;
          --royal-mid: #2d0a5c;
          --royal-card: #250845;
          --royal-border: rgba(255,245,198,0.25);
          --gold: #ffe97c;
          --gold-light: #ffe97c;
          --gold-dim: #ffd24d;
          --purple-glow: rgba(168,85,247,0.35);
          --text-primary: #ffe97c;
          --text-secondary: #ffe97c;
          --text-gold: #ffe97c;
        }

        * { margin:0; padding:0; box-sizing:border-box; }

        .dash-root {
          font-family: 'Nunito', sans-serif;
          background: var(--royal);
          min-height: 100vh;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.25) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,245,198,0.12) 0%, transparent 65%),
            radial-gradient(circle at 50% 50%, rgba(168,85,247,0.05) 0%, transparent 50%);
        }

        /* ── Gold shimmer top bar ── */
        .gold-bar {
          height: 3px;
          background: linear-gradient(90deg, transparent, #ffe97c, #ffe97c, #ffe97c, transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
        }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .page-content {
          padding: 20px 18px 40px;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* ── Section label ── */
        .section-label {
          font-family: 'Cinzel', serif;
          font-size: 12px;
          letter-spacing: 2.8px;
          text-transform: uppercase;
          color: var(--text-primary);
          text-shadow: 0 0 8px rgba(255,245,198,0.45);
          margin-bottom: 16px;
          padding-left: 2px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, rgba(245,197,24,0.6), transparent);
        }

        /* ── STAT CARDS GRID ── */
        .stat-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 28px;
        }
        @media (min-width: 900px)  { .stat-cards { grid-template-columns: repeat(5, 1fr); } }
        @media (min-width: 1200px) { .stat-cards { grid-template-columns: repeat(6, 1fr); } }
        @media (max-width: 480px)  { .stat-cards { grid-template-columns: repeat(2, 1fr); } }

        /* ── Individual stat card ── */
        .stat-card {
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(168,85,247,0.25);
          border-radius: 16px;
          padding: 18px 14px 14px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
          box-shadow: 0 8px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.02);
        }
        .stat-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(245,197,24,0.12) 0%, transparent 60%);
          pointer-events: none;
          transition: opacity 0.22s;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(245,197,24,0.55);
          box-shadow: 
            0 12px 32px rgba(0,0,0,0.55), 
            0 0 20px rgba(168,85,247,0.25),
            inset 0 0 12px rgba(245,197,24,0.1);
        }

        /* Glow dot accent */
        .stat-card-glow {
          position: absolute;
          top: -18px; right: -18px;
          width: 70px; height: 70px;
          border-radius: 50%;
          opacity: 0.18;
          filter: blur(18px);
        }

        .stat-icon-wrap {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: rgba(245,197,24,0.15);
          border: 1.5px solid rgba(245,197,24,0.35);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
          box-shadow: 0 0 10px rgba(245,197,24,0.25);
        }

        .stat-card-title {
          font-size: 11.5px;
          font-weight: 800;
          color: var(--text-primary);
          text-shadow: 0 0 8px rgba(255,245,198,0.3);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .stat-card-value {
          font-size: 22px;
          font-weight: 900;
          color: var(--text-primary);
          text-shadow: 0 0 10px rgba(255,245,198,0.3);
          line-height: 1.2;
          animation: fadeIn 0.3s ease;
        }
        .stat-card-value-split {
          font-size: 17px;
          font-weight: 900;
          color: var(--text-primary);
          text-shadow: 0 0 10px rgba(255,245,198,0.3);
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }

        .stat-view-hint {
          font-size: 10.5px;
          color: var(--text-primary);
          font-weight: 700;
          letter-spacing: 0.3px;
          display: inline-flex;
          text-shadow: 0 0 4px rgba(255,245,198,0.3);
          align-items: center;
          gap: 4px;
        }
        .stat-view-hint::after { content: '›'; font-size: 14px; }

        /* Withdraw pill */
        .withdraw-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: linear-gradient(135deg, var(--gold) 0%, #E5A900 100%);
          color: #1a0533;
          border: none;
          border-radius: 20px;
          padding: 6px 15px;
          font-size: 11px;
          font-weight: 800;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          margin-top: 8px;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 15px rgba(255,245,198,0.25);
          letter-spacing: 0.3px;
        }
        .withdraw-pill:hover {
          transform: scale(1.06);
          box-shadow: 0 6px 20px rgba(255,245,198,0.45), 0 0 10px rgba(255,245,198,0.2);
        }

        /* ── BOTTOM GRID ── */
        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        @media (max-width: 800px) { .bottom-grid { grid-template-columns: 1fr; } }

        /* ── Section cards ── */
        .section-card {
          background: linear-gradient(145deg, var(--royal-card) 0%, rgba(37, 8, 69, 0.9) 100%);
          border: 1.5px solid rgba(255,233,124,0.25);
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.55), 0 0 25px rgba(168,85,247,0.1);
        }

        .section-header {
          background: linear-gradient(90deg, rgba(255,233,124,0.22), rgba(168,85,247,0.18));
          border-bottom: 1.5px solid rgba(255,233,124,0.35);
          padding: 14px 20px;
          font-family: 'Cinzel', serif;
          font-size: 11.5px;
          font-weight: 700;
          color: #ffe97c;
          text-shadow: 0 0 6px rgba(245,197,24,0.35);
          letter-spacing: 1.8px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-header::before {
          content: '';
          width: 4px; height: 14px;
          background: linear-gradient(180deg, #ffe97c, #a855f7);
          border-radius: 2px;
          flex-shrink: 0;
          box-shadow: 0 0 8px rgba(245,197,24,0.5);
        }

        /* ── Cycle Table ── */
        .data-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .data-table thead tr {
          background: rgba(245,197,24,0.08);
        }
        .data-table thead th {
          padding: 10px 14px;
          text-align: left;
          color: var(--gold);
          font-weight: 700;
          font-size: 11px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border-bottom: 1px solid var(--royal-border);
        }
        .data-table tbody tr {
          border-bottom: 1px solid rgba(245,197,24,0.05);
          transition: background 0.15s;
        }
        .data-table tbody tr:hover { background: rgba(245,197,24,0.05); }
        .data-table tbody td {
          padding: 9px 14px;
          color: var(--text-secondary);
          vertical-align: middle;
          font-size: 12.5px;
        }
        .cycle-cell { display:flex; align-items:center; gap:5px; }
        .cycle-label {
          background: rgba(168,85,247,0.15);
          border: 1px solid rgba(168,85,247,0.3);
          color: #c084fc;
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
        }

        /* ── Profile card ── */
        .profile-banner {
          width: 100%;
          height: 160px;
          background: linear-gradient(135deg, #3b0764 0%, #1e0a4a 40%, #2d0a5c 100%);
          position: relative;
          overflow: hidden;
        }
        .profile-banner-pattern {
          position: absolute;
          inset: 0;
          background-image:
            repeating-linear-gradient(45deg, rgba(245,197,24,0.04) 0px, rgba(245,197,24,0.04) 1px, transparent 1px, transparent 30px),
            repeating-linear-gradient(-45deg, rgba(245,197,24,0.04) 0px, rgba(245,197,24,0.04) 1px, transparent 1px, transparent 30px);
        }
        .profile-banner-glow {
          position: absolute;
          top: -30px; left: 50%;
          transform: translateX(-50%);
          width: 200px; height: 120px;
          background: radial-gradient(ellipse, rgba(168,85,247,0.35), transparent 70%);
        }
        .profile-banner-title {
          position: absolute;
          bottom: 16px; left: 20px;
          font-family: 'Cinzel', serif;
          font-size: 13px;
          color: var(--gold);
          letter-spacing: 2px;
          text-shadow: 0 2px 12px rgba(245,197,24,0.4);
        }
        .profile-avatar-wrap {
          position: relative;
          margin: -44px auto 12px;
          width: fit-content;
        }
        .profile-avatar {
          width: 80px; height: 80px;
          border-radius: 50%;
          border: 3px solid var(--gold);
          box-shadow: 0 0 0 4px rgba(245,197,24,0.15), 0 4px 20px rgba(0,0,0,0.4);
          object-fit: cover;
          background: linear-gradient(135deg, #a855f7, #3b0764);
        }
        .avatar-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1.5px solid rgba(245,197,24,0.3);
          animation: rotate 8s linear infinite;
        }
        @keyframes rotate { to { transform: rotate(360deg); } }

        .profile-info { text-align: center; padding: 0 20px 12px; }
        .profile-info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 7px 0;
          border-bottom: 1px solid rgba(245,197,24,0.05);
          font-size: 12.5px;
        }
        .profile-info-row:last-child { border-bottom: none; }
        .profile-info-label {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 11.5px;
        }
        .profile-info-value {
          color: var(--text-primary);
          font-weight: 700;
          font-size: 12px;
          text-align: right;
        }

        .profile-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--royal-border), transparent);
          margin: 10px 20px;
        }
        .profile-actions {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 6px 20px 18px;
          gap: 12px;
        }
        .action-btn {
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #ffe97c 0%, #ffe97c 50%, #d49a00 100%);
          color: #1a0533;
          border: none; border-radius: 10px;
          padding: 10px 20px;
          font-size: 12.5px; font-weight: 800;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
          text-decoration: none;
          box-shadow: 0 4px 18px rgba(245,197,24,0.45);
          flex: 1; justify-content: center;
        }
        .action-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(245,197,24,0.65), 0 0 15px rgba(245,197,24,0.3);
        }
        .action-btn-secondary {
          background: rgba(245,197,24,0.1);
          color: var(--gold);
          border: 1px solid rgba(245,197,24,0.45);
          box-shadow: none;
        }
        .action-btn-secondary:hover {
          background: rgba(245,197,24,0.18);
          border-color: rgba(245,197,24,0.7);
          box-shadow: 0 4px 20px rgba(245,197,24,0.25);
        }

        /* ── Message card ── */
        .message-body { padding: 20px; text-align: center; }
        .message-body p {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 18px;
          line-height: 1.6;
        }
        .social-row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .social-btn {
          width: 46px; height: 46px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
          text-decoration: none;
          border: 1.5px solid rgba(245,197,24,0.15);
        }
        .social-btn:hover { transform: scale(1.12); box-shadow: 0 4px 16px rgba(0,0,0,0.4); }

        /* ── Empty state ── */
        .empty-state {
          padding: 32px 20px;
          text-align: center;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .empty-state-icon { font-size: 32px; margin-bottom: 10px; opacity: 0.5; }

        /* ── Loading shimmer ── */
        .loading-bar {
          height: 2px;
          background: linear-gradient(90deg, transparent, #ffe97c, transparent);
          background-size: 200%;
          animation: shimmer 1.5s infinite;
          border-radius: 2px;
          margin: 3px 0;
        }

        /* ── Dialog overrides ── */
        .dialog-field { margin-bottom: 14px; }
        .dialog-field label {
          font-size: 10.5px; font-weight: 800; color: var(--gold-dim);
          display: block; margin-bottom: 6px;
          text-transform: uppercase; letter-spacing: 0.8px;
        }
        .dialog-field .val {
          font-size: 13.5px; color: var(--gold); font-weight: 700;
          background: rgba(245,197,24,0.06);
          padding: 10px 14px; border-radius: 10px;
          border-left: 3px solid var(--gold);
        }
        .dialog-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,197,24,0.2), transparent);
          margin: 16px 0;
        }
        .income-badge {
          display: inline-block;
          background: linear-gradient(135deg, rgba(245,197,24,0.15), rgba(168,85,247,0.15));
          border: 1.5px solid rgba(245,197,24,0.4);
          color: var(--gold);
          border-radius: 14px;
          padding: 14px 28px;
          font-size: 22px; font-weight: 900;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 20px rgba(245,197,24,0.2);
        }
        .error-msg {
          color: #f87171; font-size: 12px; margin-top: 8px;
          font-weight: 700; display: flex; align-items: center; gap: 6px;
        }
        .success-msg {
          color: #ffe97c; font-size: 12px; margin-top: 8px;
          font-weight: 700; display: flex; align-items: center; gap: 6px;
        }
      `}</style>

      <div className="dash-root">
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={setActivePage} />
        <div className="gold-bar" />

        <div className="page-content" onClick={() => dropdownOpen && setDropdownOpen(false)}>
          {activePage === "dashboard" ? (
            <>
              {/* ── Section label ── */}
              <div className="section-label">Overview</div>

              {/* ── STAT CARDS ── */}
              <div className="stat-cards">
                {statCards.map((card) => {
                  const isActive =
                    (card.title === "Total Team" && showTotalTeamInfo) ||
                    (card.title === "Basic Income" && showBasicIncomeInfo) ||
                    (card.title === "Booster Income" && showBoosterIncomeInfo) ||
                    (card.title === "Total Direct" && showTotalDirectInfo) ||
                    (card.title === "Active Direct" && showActiveDirectInfo) ||
                    (card.title === "Basic Users" && showBasicUsersInfo) ||
                    (card.title === "Booster Users" && showBoosterUsersInfo) ||
                    (card.title === "Total Pins" && showTotalPinsInfo) ||
                    (card.title === "Total Income" && showTotalIncomeInfo) ||
                    (card.title === "Wallet Balance" && showWalletBalanceInfo);

                  return (
                    <div
                      key={card.title}
                      className="stat-card"
                      style={{
                        borderColor: isActive ? "#ffe97c" : "rgba(168,85,247,0.22)",
                        boxShadow: isActive ? `0 12px 36px rgba(0,0,0,0.65), 0 0 25px rgba(245,197,24,0.45), inset 0 0 12px rgba(245,197,24,0.2)` : undefined
                      }}
                      onClick={() => {
                        if (card.title === "Total Team") setShowTotalTeamInfo(!showTotalTeamInfo);
                        else if (card.title === "Basic Income") setShowBasicIncomeInfo(!showBasicIncomeInfo);
                        else if (card.title === "Booster Income") setShowBoosterIncomeInfo(!showBoosterIncomeInfo);
                        else if (card.title === "Total Direct") setShowTotalDirectInfo(!showTotalDirectInfo);
                        else if (card.title === "Active Direct") setShowActiveDirectInfo(!showActiveDirectInfo);
                        else if (card.title === "Basic Users") setShowBasicUsersInfo(!showBasicUsersInfo);
                        else if (card.title === "Booster Users") setShowBoosterUsersInfo(!showBoosterUsersInfo);
                        else if (card.title === "Total Pins") setShowTotalPinsInfo(!showTotalPinsInfo);
                        else if (card.title === "Total Income") setShowTotalIncomeInfo(!showTotalIncomeInfo);
                        else if (card.title === "Wallet Balance") setShowWalletBalanceInfo(!showWalletBalanceInfo);
                      }}
                    >
                      {/* Glow blob */}
                      <div className="stat-card-glow" style={{ background: card.accent }} />

                      <div className="stat-icon-wrap" style={{ background: `${card.accent}15`, borderColor: `${card.accent}35`, boxShadow: `0 0 10px ${card.accent}20` }}>
                        {card.icon}
                      </div>

                      <div className="stat-card-title">{card.title}</div>

                      <div className="stat-card-value">
                        {card.title === "Total Team" && isActive ? (
                          <span className="stat-card-value-split">L: {totalTeam.left} <span style={{ color: 'rgba(245,197,24,0.3)' }}>|</span> R: {totalTeam.right}</span>
                        ) : card.title === "Basic Income" && isActive ? (
                          <>₹ {basicIncome.toLocaleString("en-IN")}</>
                        ) : card.title === "Booster Income" && isActive ? (
                          <div>
                            ₹ {boosterIncome.amount.toLocaleString("en-IN")}
                            <div style={{ fontSize: 10, color: 'rgba(245,197,24,0.7)', marginTop: 4, fontWeight: 700, letterSpacing: '0.2px' }}>
                              LG:{boosterIncome.LG} | RG:{boosterIncome.RG} | M:{boosterIncome.totalMatching}
                            </div>
                          </div>
                        ) : card.title === "Total Direct" && isActive ? (
                          <span className="stat-card-value-split">L: {totalDirect.left} <span style={{ color: 'rgba(245,197,24,0.3)' }}>|</span> R: {totalDirect.right}</span>
                        ) : card.title === "Active Direct" && isActive ? (
                          <span className="stat-card-value-split">L: {totalActiveDirect.left} <span style={{ color: 'rgba(245,197,24,0.3)' }}>|</span> R: {totalActiveDirect.right}</span>
                        ) : card.title === "Basic Users" && isActive ? (
                          <span className="stat-card-value-split">L: {totalLeftBasicUser} <span style={{ color: 'rgba(245,197,24,0.3)' }}>|</span> R: {totalRightBasicUser}</span>
                        ) : card.title === "Booster Users" && isActive ? (
                          <span className="stat-card-value-split">L: {totalLeftBoosterUser} <span style={{ color: 'rgba(245,197,24,0.3)' }}>|</span> R: {totalRightBoosterUser}</span>
                        ) : card.title === "Total Pins" && isActive ? (
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#ffe97c' }}>
                            A:{totalPins.active} | U:{totalPins.used} | T:{totalPins.total}
                          </div>
                        ) : card.title === "Total Income" && isActive ? (
                          <div>
                            ₹ {totalIncome.toLocaleString("en-IN")}
                            <br />
                            <button
                              className="withdraw-pill"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                setWithdrawOpen(true);
                                setWithdrawError(""); setWithdrawSuccess(""); setWithdrawAmount("");
                              }}
                            >
                              💸 Withdraw
                            </button>
                          </div>
                        ) : card.title === "Wallet Balance" && isActive ? (
                          <div>
                            ₹ {availableBalance.toLocaleString("en-IN")}
                            <br />
                            <button
                              className="withdraw-pill"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                setWithdrawOpen(true);
                                setWithdrawError(""); setWithdrawSuccess(""); setWithdrawAmount("");
                              }}
                            >
                              💸 Withdraw
                            </button>
                          </div>
                        ) : (
                          <span className="stat-view-hint">Tap to view</span>
                        )}
                      </div>

                      {/* Trend / Growth Indicator from reference image */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        marginTop: 8, fontSize: 10, fontWeight: 700,
                        color: '#ffe97c', textShadow: '0 0 6px rgba(255,233,124,0.35)'
                      }}>
                        <TrendUpIcon />
                        <span>{card.trend} growth</span>
                      </div>

                      {/* Active indicator line */}
                      {isActive && (
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: 2.5,
                          background: `linear-gradient(90deg, transparent, #ffe97c, transparent)`,
                          boxShadow: `0 0 10px #ffe97c`
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Cycle History ── */}
              <div className="section-label">Cycle History</div>
              <div style={{ marginBottom: 20 }}>
                <div className="section-card">
                  <div className="section-header">Last Cycle History — Silver</div>
                  <div style={{ padding: 0 }}>
                    {cycleHistory.length === 0 ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">🔄</div>
                        No cycle history available
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Cycle</th>
                            <th>Match</th>
                            <th>Capping</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cycleHistory.map((row, ri) =>
                            row.cycles.map((cycle, ci) => (
                              <tr key={`${ri}-${ci}`}>
                                {ci === 0 && (
                                  <td rowSpan={2} style={{ color: '#ffe97c', fontWeight: 700, fontSize: 12 }}>
                                    {row.date}
                                  </td>
                                )}
                                <td>
                                  <div className="cycle-cell">
                                    <span className="cycle-label">{cycle.label}</span>
                                    {cycle.moon ? <MoonIcon /> : <GearIcon />}
                                  </div>
                                </td>
                                <td style={{ color: '#c084fc', fontWeight: 700 }}>{row.matches[ci]}</td>
                                <td style={{ color: '#ffe97c', fontWeight: 700 }}>{row.cappings[ci]}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Profile + Insight ── */}
              <div className="section-label">Profile</div>
              <div className="bottom-grid">
                <div className="section-card">
                  {/* Banner */}
                  <div className="profile-banner">
                    <div className="profile-banner-pattern" />
                    <div className="profile-banner-glow" />
                    <div className="profile-banner-title">MEMBER PROFILE</div>
                  </div>

                  {/* Avatar */}
                  <div className="profile-avatar-wrap">
                    <div className="avatar-ring" />
                    <img src="/images/user.png" alt="User Profile" className="profile-avatar" />
                  </div>

                  {/* Info rows */}
                  <div className="profile-info">
                    {[
                      { label: "Name", value: userProfile.fullName },
                      { label: "User ID", value: userProfile.userId },
                      { label: "Mobile", value: userProfile.mobileNo },
                      { label: "Email", value: userProfile.email },
                      {
                        label: "Activation",
                        value: (() => {
                          if (!userProfile.joiningDate || userProfile.joiningDate === "N/A") return "N/A";
                          const d = new Date(userProfile.joiningDate);
                          if (isNaN(d.getTime())) return userProfile.joiningDate;
                          return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                        })()
                      },
                    ].map(item => (
                      <div className="profile-info-row" key={item.label}>
                        <span className="profile-info-label">{item.label}</span>
                        <span className="profile-info-value">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="profile-divider" />

                  <div className="profile-actions">
                    <Link href="/dashboard/profile" className="action-btn">
                      <UserIcon />
                      My Profile
                    </Link>
                    <Link href="https://www.changelifemarketing.in/" className="action-btn action-btn-secondary">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                      </svg>
                      Website
                    </Link>
                  </div>
                </div>

                {/* Insight panel */}
                <div className="section-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="section-header">Insights & Strategy</div>
                  <div style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                    
                    {/* Advice card */}
                    <div style={{
                      background: 'rgba(255,233,124,0.06)',
                      borderLeft: '4px solid #ffe97c',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#ffe97c',
                      lineHeight: '1.5',
                      textShadow: '0 0 4px rgba(255,233,124,0.25)'
                    }}>
                      {getActionableAdvice()}
                    </div>

                    {/* Team balance bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: 'rgba(255,233,124,0.65)', marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                        <span>Left Team ({totalTeam.left} members)</span>
                        <span>Right Team ({totalTeam.right} members)</span>
                      </div>
                      <div style={{ height: 8, background: 'rgba(255,245,198,0.1)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${leftPct}%`, background: 'linear-gradient(90deg, #ffe97c, #ffd24d)', height: '100%' }} />
                        <div style={{ width: `${rightPct}%`, background: 'linear-gradient(90deg, #a855f7, #8b5cf6)', height: '100%' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'rgba(255,233,124,0.5)', marginTop: 4, fontWeight: 700 }}>
                        <span>Ratio: {leftPct}%</span>
                        <span>{rightPct}%</span>
                      </div>
                    </div>

                    {/* Key indicators grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
                      <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,245,198,0.1)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,233,124,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Booster Phase</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#ffe97c' }}>
                          {isBooster ? "🚀 Booster Qualified" : "⭐ Basic Phase"}
                        </div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: 12, border: '1px solid rgba(255,245,198,0.1)' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,233,124,0.5)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>EPINs Available</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#ffe97c' }}>
                          {totalPins.active} Active
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* ── Message / Social ── */}
              <div className="section-label">Connect</div>
              <div style={{ maxWidth: 500 }}>
                <div className="section-card">
                  <div className="section-header">Message</div>
                  <div className="message-body">
                    <p>Follow the links below for daily updates and community news.</p>
                    <div className="social-row">
                      {/* Instagram */}
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
                          <defs><radialGradient id="ig2" cx="30%" cy="107%" r="150%">
                            <stop offset="0%" stopColor="#fdf497" />
                            <stop offset="45%" stopColor="#fd5949" />
                            <stop offset="60%" stopColor="#d6249f" />
                            <stop offset="90%" stopColor="#285aeb" />
                          </radialGradient></defs>
                          <rect width="46" height="46" rx="13" fill="url(#ig2)" />
                          <rect x="13" y="13" width="20" height="20" rx="5.5" stroke="white" strokeWidth="2.2" fill="none" />
                          <circle cx="23" cy="23" r="5.5" stroke="white" strokeWidth="2.2" fill="none" />
                          <circle cx="30" cy="16" r="1.4" fill="white" />
                        </svg>
                      </a>
                      {/* Facebook */}
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
                          <rect width="46" height="46" rx="13" fill="#1877F2" />
                          <path d="M27 15h-3a2 2 0 0 0-2 2v3h-3v4h3v9h4v-9h3l.5-4H25v-2.5A.5.5 0 0 1 25.5 17H28v-2z" fill="white" />
                        </svg>
                      </a>
                      {/* WhatsApp */}
                      <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
                          <rect width="46" height="46" rx="13" fill="#25D366" />
                          <path d="M23 11C16.37 11 11 16.37 11 23c0 2.13.56 4.13 1.54 5.86L10 35l6.29-1.52A12 12 0 1 0 23 11zm5.97 16.44c-.27.75-1.56 1.44-2.15 1.49-.54.05-1.05.24-3.49-.73-2.93-1.17-4.82-4.14-4.96-4.33-.14-.19-1.2-1.59-1.2-3.03s.76-2.15 1.05-2.44c.27-.29.59-.37.79-.37h.58c.19 0 .46-.07.71.54.27.63.91 2.2.99 2.36.07.17.12.36.02.58-.1.22-.15.36-.29.56-.14.19-.3.43-.44.58-.14.17-.29.34-.12.66.17.32.76 1.25 1.64 2.01 1.12.99 2.06 1.32 2.35 1.46.29.14.46.12.63-.07.17-.22.73-.85.93-1.14.19-.29.39-.24.66-.14.27.1 1.71.81 2 .95.29.14.49.22.56.34.07.12.07.7-.2 1.46z" fill="white" />
                        </svg>
                      </a>
                      {/* YouTube */}
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="46" height="46" viewBox="0 0 46 46" xmlns="http://www.w3.org/2000/svg">
                          <rect width="46" height="46" rx="13" fill="#FF0000" />
                          <polygon points="19,28 19,18 30,23" fill="white" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bottom-grid">
              {/* Profile page — unchanged */}
            </div>
          )}
        </div>
      </div>

      {/* ── WITHDRAW DIALOG ── */}
      <Dialog open={withdrawOpen} onOpenChange={(open: boolean) => {
        setWithdrawOpen(open);
        setWithdrawError(""); setWithdrawSuccess("");
      }}>
        <DialogContent style={{
          fontFamily: "'Nunito', sans-serif",
          maxWidth: "min(95vw, 480px)",
          width: "100%",
          background: "linear-gradient(145deg, #1e0642 0%, #250845 100%)",
          border: "1px solid rgba(245,197,24,0.25)",
          borderRadius: 20,
          padding: "clamp(20px,5vw,32px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.2)",
          zIndex: 9999,
          maxHeight: "90vh",
          overflowY: "auto",
        }}>
          <DialogHeader>
            <DialogTitle style={{
              fontSize: "clamp(18px,5vw,22px)",
              fontWeight: 900,
              color: "#ffe97c",
              marginBottom: 6,
              fontFamily: "'Cinzel', serif",
              letterSpacing: "1px",
            }}>
              💸 Withdraw
            </DialogTitle>
            <DialogDescription style={{ fontSize: 13, color: "rgba(245,197,24,0.5)", fontWeight: 600 }}>
              Minimum withdrawal amount is ₹1,000
            </DialogDescription>
          </DialogHeader>

          <div style={{ marginTop: 10 }}>
            <div className="dialog-field">
              <label>Username</label>
              <div className="val">{userProfile.username}</div>
            </div>

            <div className="dialog-divider" />

            <div style={{
              marginBottom: 14,
              fontSize: 11,
              fontWeight: 800,
              color: "#ffe97c",
              textTransform: "uppercase",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              🏦 Bank Details
            </div>

            {bankDetails.accountHolderName || bankDetails.accountNumber ? (
              <>
                {[
                  { label: "Account Holder", value: bankDetails.accountHolderName || "—" },
                  { label: "Account Number", value: bankDetails.accountNumber || "—" },
                  { label: "IFSC Code", value: bankDetails.ifscCode || "—" },
                  { label: "Bank Name", value: bankDetails.bankName || "—" },
                ].map(f => (
                  <div className="dialog-field" key={f.label}>
                    <label>{f.label}</label>
                    <div className="val">{f.value}</div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#f87171", marginBottom: 10, fontWeight: 700 }}>
                ⚠️ Bank details not added. Please update your profile first.
              </div>
            )}

            <div className="dialog-divider" />

            <div className="dialog-field" style={{ textAlign: "center" }}>
              <label style={{ textAlign: "center", display: "block" }}>Total Earned Income</label>
              <div className="income-badge">₹ {totalIncome.toLocaleString("en-IN")}</div>
            </div>

            <div className="dialog-divider" />

            <div className="dialog-field">
              <Label htmlFor="withdrawAmount" style={{
                fontSize: 11, fontWeight: 800, color: "rgba(245,197,24,0.6)",
                textTransform: "uppercase", letterSpacing: "0.8px",
              }}>
                Amount{" "}
                <span style={{ color: "rgba(245,197,24,0.35)", fontWeight: 400, textTransform: "none" }}>
                  (Min ₹1,000)
                </span>
              </Label>
              <Input
                id="withdrawAmount"
                type="number"
                min={1000}
                max={totalIncome}
                placeholder="e.g. 1000"
                value={withdrawAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setWithdrawAmount(e.target.value);
                  setWithdrawError(""); setWithdrawSuccess("");
                }}
                style={{
                  marginTop: 8,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 16, fontWeight: 800,
                  padding: "12px 14px",
                  background: "rgba(245,197,24,0.06)",
                  border: "1.5px solid rgba(245,197,24,0.25)",
                  borderRadius: 10,
                  color: "var(--gold)",
                  width: "100%",
                  outline: "none",
                }}
              />
              {withdrawError && <div className="error-msg">⚠️ {withdrawError}</div>}
              {withdrawSuccess && <div className="success-msg">✅ {withdrawSuccess}</div>}
            </div>
          </div>

          <DialogFooter style={{
            gap: 10, marginTop: 20, paddingTop: 20,
            borderTop: "1px solid rgba(245,197,24,0.15)",
            flexDirection: "column-reverse",
          }}>
            <Button
              variant="outline"
              onClick={() => setWithdrawOpen(false)}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 14, fontWeight: 800,
                color: "rgba(245,197,24,0.8)",
                background: "transparent",
                border: "1.5px solid rgba(245,197,24,0.3)",
                borderRadius: 10,
                padding: "10px 24px",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawLoading}
              style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: 14, fontWeight: 900,
                background: "linear-gradient(135deg, #ffe97c 0%, #E5A900 100%)",
                color: "#1a0533",
                border: "none",
                borderRadius: 10,
                padding: "11px 24px",
                cursor: withdrawLoading ? "not-allowed" : "pointer",
                opacity: withdrawLoading ? 0.7 : 1,
                boxShadow: "0 4px 16px rgba(245,197,24,0.35)",
                width: "100%",
              }}
            >
              {withdrawLoading ? "Processing..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}