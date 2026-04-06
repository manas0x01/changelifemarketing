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
interface EPin {
  pin: string;
  packageName: string;
  status: string;
}
interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

// ── ICONS ──
const TeamIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="white" opacity="0.9">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);
const MoneyIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="white" opacity="0.9">
    <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
  </svg>
);
const WalletIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="white" opacity="0.9">
    <path d="M21 18v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  </svg>
);
const MoonIcon = () => <span style={{ fontSize: 14 }}>🌙</span>;
const GearIcon = () => <span style={{ fontSize: 14 }}>⚙️</span>;

// ── STAT CARDS CONFIG ──
const statCards = [
  {
    title: "Total Team",
    gradient: "linear-gradient(135deg, #9CAF00 0%, #7A8C00 100%)",
    icon: <TeamIcon />,
  },
  {
    title: "Basic Income",
    gradient: "linear-gradient(135deg, #FF9800 0%, #F57C00 100%)",
    icon: <MoneyIcon />,
  },
  {
    title: "Booster Income",
    gradient: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
    icon: <MoneyIcon />,
  },
  {
    title: "Total Direct",
    gradient: "linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)",
    icon: <TeamIcon />,
  },
  {
    title: "Total Income",
    gradient: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
    icon: <WalletIcon />,
  },
];

// ── MAIN COMPONENT ──
export default function Dashboard() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");

  // Stat toggles
  const [showTotalTeamInfo, setShowTotalTeamInfo] = useState(false);
  const [showTotalDirectInfo, setShowTotalDirectInfo] = useState(false);
  const [showBasicIncomeInfo, setShowBasicIncomeInfo] = useState(false);
  const [showBoosterIncomeInfo, setShowBoosterIncomeInfo] = useState(false);
  const [showTotalIncomeInfo, setShowTotalIncomeInfo] = useState(false);

  // Data states
  const [totalTeam, setTotalTeam] = useState({ left: 0, right: 0 });
  const [totalDirect, setTotalDirect] = useState({ left: 0, right: 0 });
  const [totalDirectAmount, setTotalDirectAmount] = useState(0);
  const [basicIncome, setBasicIncome] = useState(0);
  const [boosterIncomeAmount, setBoosterIncomeAmount] = useState(0);
  const [boosterIncome, setBoosterIncome] = useState({ LG: 0, RG: 0, totalGoldMatching: 0 });
  const [totalIncome, setTotalIncome] = useState(0);
  const [userProfile, setUserProfile] = useState({
    fullName: "N/A", userId: "N/A", username: "N/A", mobileNo: "N/A", email: "N/A", joiningDate: "N/A",
  });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "",
  });
  const [cycleHistory, setCycleHistory] = useState<CycleRow[]>([]);
  const [ePins, setEPins] = useState<EPin[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdraw dialog states
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          teamResponse, directResponse, directAmountResponse,
          incomeResponse, boosterResponse, boosterAmountResponse,
          profileResponse, ePinsResponse, totalIncomeResponse,
        ] = await Promise.all([
          fetch('/api/user/total-team', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/total-direct', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/total-direct-amount', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/basic-income', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/booster-income', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/booster-income-amount', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/get-profile', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/get-epins', { method: 'GET', credentials: 'include' }),
          fetch('/api/user/total-income', { method: 'GET', credentials: 'include' }),
        ]);

        if (teamResponse.ok) {
          const d = await teamResponse.json();
          setTotalTeam(d.totalTeam || { left: 0, right: 0 });
        }
        if (directResponse.ok) {
          const d = await directResponse.json();
          setTotalDirect(d.totalDirect || { left: 0, right: 0 });
        }
        if (directAmountResponse.ok) {
          const d = await directAmountResponse.json();
          setTotalDirectAmount(d.totalDirectAmount || 0);
        }
        if (incomeResponse.ok) {
          const d = await incomeResponse.json();
          setBasicIncome(d.basicIncome || 0);
        }
        if (boosterResponse.ok) {
          const d = await boosterResponse.json();
          setBoosterIncome(d.boosterIncome || { LG: 0, RG: 0, totalGoldMatching: 0 });
        }
        if (boosterAmountResponse.ok) {
          const d = await boosterAmountResponse.json();
          setBoosterIncomeAmount(d.boosterIncomeAmount || 0);
        }
        if (profileResponse.ok) {
          const d = await profileResponse.json();
          if (d.user) setUserProfile({ ...d.user, username: d.user.username || "N/A" });
        }
        if (ePinsResponse.ok) {
          const d = await ePinsResponse.json();
          setEPins(d.ePins || []);
        }
        if (totalIncomeResponse.ok) {
          const d = await totalIncomeResponse.json();
          setTotalIncome(d.totalIncome || 0);
          setBankDetails(d.bankAccountDetails || {
            accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "",
          });
        }
      } catch (error: any) {
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // ── WITHDRAW HANDLER ──
  const handleWithdraw = async () => {
    setWithdrawError("");
    setWithdrawSuccess("");
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || isNaN(amt)) {
      setWithdrawError("Please enter a valid amount.");
      return;
    }
    if (amt < 800) {
      setWithdrawError("Minimum withdrawal amount is ₹800.");
      return;
    }
    if (amt > totalIncome) {
      setWithdrawError("Amount exceeds your total income balance.");
      return;
    }
    try {
      setWithdrawLoading(true);
      const res = await fetch('/api/user/withdraw', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWithdrawError(data.error || "Withdrawal failed.");
      } else {
        setWithdrawSuccess(data.message || "Withdrawal request submitted!");
        setTotalIncome(data.remainingBalance ?? totalIncome - amt);
        setWithdrawAmount("");
      }
    } catch {
      setWithdrawError("Network error. Please try again.");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .dash-root { font-family: 'Poppins', sans-serif; background: #f0f2f5; min-height: 100vh; }
        .green-bar { height: 8px; background: linear-gradient(90deg, #00c853, #1de9b6); }
        .page-content { padding: 20px; max-width: 1400px; margin: 0 auto; }

        /* 5 cards in a row */
        .stat-cards {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }
        @media (max-width: 1100px) { .stat-cards { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 700px) { .stat-cards { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 400px) { .stat-cards { grid-template-columns: 1fr; } }

        .stat-card {
          border-radius: 10px; padding: 22px 18px;
          display: flex; align-items: center; gap: 14px;
          position: relative; overflow: hidden; cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
        .stat-card-icon {
          background: rgba(255,255,255,0.18); border-radius: 50%;
          width: 58px; height: 58px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .stat-card-info { flex: 1; }
        .stat-card-title { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 6px; }
        .stat-card-link { font-size: 12px; color: rgba(255,255,255,0.85); cursor: pointer; }
        .stat-card::after {
          content: ''; position: absolute; right: -20px; bottom: -20px;
          width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,0.1);
        }
        .stat-card::before {
          content: ''; position: absolute; right: 20px; bottom: -30px;
          width: 70px; height: 70px; border-radius: 50%; background: rgba(255,255,255,0.07);
        }

        /* Withdraw button inside card */
        .withdraw-btn {
          display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.22);
          border: 1.5px solid rgba(255,255,255,0.7);
          color: #fff; border-radius: 20px;
          padding: 4px 14px; font-size: 11.5px; font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer; margin-top: 6px;
          transition: background 0.18s, transform 0.15s;
          letter-spacing: 0.3px;
        }
        .withdraw-btn:hover { background: rgba(255,255,255,0.35); transform: scale(1.04); }

        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
        @media (max-width: 800px) { .bottom-grid { grid-template-columns: 1fr; } }

        .section-card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
        .section-header {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 10px 16px; font-size: 12.5px; font-weight: 600;
          color: #fff; letter-spacing: 0.5px; text-transform: uppercase;
        }
        .section-body { padding: 14px; }

        .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table thead tr { background: #546e7a; }
        .data-table thead th { padding: 10px 12px; text-align: left; color: #fff; font-weight: 600; font-size: 13px; }
        .data-table tbody tr:nth-child(odd) { background: #e8eaf6; }
        .data-table tbody tr:nth-child(even) { background: #f3e5f5; }
        .data-table tbody td { padding: 8px 12px; color: #333; vertical-align: middle; border-bottom: 1px solid rgba(0,0,0,0.04); font-size: 13px; }
        .cycle-cell { display: flex; align-items: center; gap: 4px; white-space: nowrap; }

        .epin-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .epin-table thead tr { background: #546e7a; }
        .epin-table thead th { padding: 10px 14px; color: #fff; font-weight: 600; text-align: left; font-size: 13px; }
        .epin-table tbody tr:nth-child(odd) { background: #e0f7fa; }
        .epin-table tbody tr:nth-child(even) { background: #f0fdf4; }
        .epin-table tbody td { padding: 10px 14px; color: #333; font-size: 13px; border-bottom: 1px solid rgba(0,0,0,0.04); }
        .epin-view-link { color: #1565c0; text-decoration: underline; cursor: pointer; font-size: 13px; }

        .profile-banner {
          width: 100%; height: 220px;
          background: linear-gradient(135deg, #4dd0e1 0%, #00bfa5 60%, #69f0ae 100%);
          position: relative; border-radius: 0; overflow: hidden;
        }
        .profile-banner-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.12);
          display: flex; align-items: center; justify-content: center;
        }
        .laptop-css { width: 180px; height: 110px; background: #263238; border-radius: 8px 8px 0 0; position: relative; margin-bottom: 14px; }
        .laptop-screen { position: absolute; inset: 6px; background: linear-gradient(135deg, #37474f, #546e7a); border-radius: 4px; display: flex; align-items: center; justify-content: center; }
        .laptop-base { width: 210px; height: 12px; background: #37474f; border-radius: 0 0 6px 6px; margin-top: 0; }
        .laptop-wrapper { display: flex; flex-direction: column; align-items: center; opacity: 0.6; }

        .profile-avatar-wrap { position: relative; margin: -44px auto 14px; width: fit-content; }
        .profile-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #ff9800 50%, #5c6bc0 50%); border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.15); }
        .profile-info { text-align: center; padding: 0 20px 16px; }
        .profile-info p { font-size: 13.5px; color: #444; margin-bottom: 5px; }
        .profile-divider { height: 1px; background: #e0e0e0; margin: 14px 20px; }
        .profile-actions { display: flex; align-items: center; justify-content: space-around; padding: 0 20px 20px; }
        .profile-actions-divider { width: 1px; height: 36px; background: #e0e0e0; }
        .action-btn {
          display: flex; align-items: center; gap: 6px;
          background: linear-gradient(90deg, #26c6da, #1de9b6);
          color: #fff; border: none; border-radius: 6px;
          padding: 9px 18px; font-size: 13px; font-weight: 500;
          font-family: 'Poppins', sans-serif; cursor: pointer;
          transition: opacity 0.18s, transform 0.18s; text-decoration: none;
        }
        .action-btn:hover { opacity: 0.88; transform: translateY(-1px); }
        .message-section { margin-top: 16px; }
        .message-body { padding: 16px; text-align: center; }
        .message-body p { font-size: 13.5px; color: #555; margin-bottom: 14px; }
        .social-row { display: flex; gap: 12px; justify-content: center; }
        .social-btn { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.18s; text-decoration: none; }
        .social-btn:hover { transform: scale(1.1); }
        .insight-section { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.06); margin-top: 0; }

        /* Dialog overrides */
        .dialog-field { margin-bottom: 14px; }
        .dialog-field label { font-size: 11.5px; font-weight: 700; color: #555; display: block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
        .dialog-field .val { font-size: 14px; color: #1a1a2e; font-weight: 600; background: #f5f5f7; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #7C3AED; }
        .dialog-divider { height: 1px; background: linear-gradient(90deg, transparent, #e0e0e0, transparent); margin: 16px 0; }
        .income-badge {
          display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%);
          color: #fff; border-radius: 12px; padding: 12px 24px;
          font-size: 18px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
        }
        .error-msg { color: #e53935; font-size: 12.5px; margin-top: 8px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
        .success-msg { color: #2e7d32; font-size: 12.5px; margin-top: 8px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
      `}</style>

      <div className="dash-root">
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={setActivePage} />
        <div className="green-bar" />

        <div className="page-content" onClick={() => dropdownOpen && setDropdownOpen(false)}>
          {activePage === "dashboard" ? (
            <>
              {/* ── STAT CARDS ── */}
              <div className="stat-cards">
                {statCards.map((card) => (
                  <div
                    key={card.title}
                    className="stat-card"
                    style={{ background: card.gradient }}
                    onClick={() => {
                      if (card.title === "Total Team") setShowTotalTeamInfo(!showTotalTeamInfo);
                      else if (card.title === "Basic Income") setShowBasicIncomeInfo(!showBasicIncomeInfo);
                      else if (card.title === "Booster Income") setShowBoosterIncomeInfo(!showBoosterIncomeInfo);
                      else if (card.title === "Total Direct") setShowTotalDirectInfo(!showTotalDirectInfo);
                      else if (card.title === "Total Income") setShowTotalIncomeInfo(!showTotalIncomeInfo);
                    }}
                  >
                    <div className="stat-card-icon">{card.icon}</div>
                    <div className="stat-card-info">
                      <div className="stat-card-title">{card.title}</div>

                      {card.title === "Total Team" && showTotalTeamInfo ? (
                        <span className="stat-card-link">Left : {totalTeam.left} | Right : {totalTeam.right}</span>
                      ) : card.title === "Basic Income" && showBasicIncomeInfo ? (
                        <span className="stat-card-link">₹ {basicIncome}</span>
                      ) : card.title === "Booster Income" && showBoosterIncomeInfo ? (
                        <span className="stat-card-link">₹ {boosterIncomeAmount} | LG : {boosterIncome.LG} | RG : {boosterIncome.RG} | Matching : {boosterIncome.totalGoldMatching}</span>
                      ) : card.title === "Total Direct" && showTotalDirectInfo ? (
                        <span className="stat-card-link">₹ {totalDirectAmount} | Left : {totalDirect.left} | Right : {totalDirect.right}</span>
                      ) : card.title === "Total Income" ? (
                        showTotalIncomeInfo ? (
                          <div>
                            <span className="stat-card-link">₹ {totalIncome}</span>
                            <br />
                            <button
                              className="withdraw-btn"
                              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                setWithdrawOpen(true);
                                setWithdrawError("");
                                setWithdrawSuccess("");
                                setWithdrawAmount("");
                              }}
                            >
                              💸 Withdraw
                            </button>
                          </div>
                        ) : (
                          <span className="stat-card-link" style={{ cursor: 'pointer' }}>View</span>
                        )
                      ) : (
                        <span className="stat-card-link" style={{ cursor: 'pointer' }}>View</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── BOTTOM GRID ── */}
              <div className="bottom-grid">
                {/* Cycle History */}
                <div className="section-card">
                  <div className="section-header">Last Cycle History (Silver)</div>
                  <div className="section-body" style={{ padding: 0 }}>
                    {cycleHistory.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>No cycle history available</div>
                    ) : (
                      <table className="data-table">
                        <thead><tr><th>Date</th><th>Cycle</th><th>Match</th><th>Capping</th></tr></thead>
                        <tbody>
                          {cycleHistory.map((row, ri) =>
                            row.cycles.map((cycle, ci) => (
                              <tr key={`${ri}-${ci}`}>
                                {ci === 0 && <td rowSpan={2} style={{ fontWeight: 500 }}>{row.date}</td>}
                                <td><div className="cycle-cell">{cycle.label}{cycle.moon ? <MoonIcon /> : <GearIcon />}</div></td>
                                <td>{row.matches[ci]}</td>
                                <td>{row.cappings[ci]}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Available E-Pins */}
                <div className="section-card">
                  <div className="section-header">Available E-Pins</div>
                  <div style={{ padding: 0 }}>
                    {ePins.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                        No E-Pins available. <a href="/dashboard/buypins" style={{ color: '#1976d2', textDecoration: 'underline' }}>Buy E-Pins</a>
                      </div>
                    ) : (
                      <table className="epin-table">
                        <thead><tr><th>Package Name</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                          {ePins.map((ep, idx) => (
                            <tr key={idx}>
                              <td>{ep.packageName}</td>
                              <td>
                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', color: '#fff', background: ep.status === 'Active' ? '#26a69a' : ep.status === 'Used' ? '#1976d2' : ep.status === 'Transferred' ? '#f57c00' : '#e53935' }}>
                                  {ep.status}
                                </span>
                              </td>
                              <td><span className="epin-view-link">View</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>

              {/* ── PROFILE + INSIGHT ── */}
              <div className="bottom-grid">
                <div className="section-card">
                  <div className="profile-banner">
                    <div className="profile-banner-overlay">
                      <div className="laptop-wrapper">
                        <div className="laptop-css">
                          <div className="laptop-screen">
                            <svg width="60" height="40" viewBox="0 0 60 40" fill="none">
                              <rect x="4" y="4" width="52" height="32" rx="2" fill="rgba(255,255,255,0.1)" />
                              <rect x="8" y="8" width="44" height="20" rx="1" fill="rgba(255,255,255,0.08)" />
                            </svg>
                          </div>
                        </div>
                        <div className="laptop-base" />
                      </div>
                    </div>
                  </div>
                  <div className="profile-avatar-wrap">
                    <img src="/images/user.png" alt="User Profile" className="profile-avatar" style={{ objectFit: 'cover' }} />
                  </div>
                  <div className="profile-info">
                    <p>Name : {userProfile.fullName}</p>
                    <p>User ID : {userProfile.userId}</p>
                    <p>Mobile No. : {userProfile.mobileNo}</p>
                    <p>Email ID : {userProfile.email}</p>
                    <p>Activation Date : {userProfile.joiningDate}</p>
                  </div>
                  <div className="profile-divider" />
                  <div className="profile-actions">
                    <Link href="/dashboard/profile" className="action-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
                      My Profile
                    </Link>
                    <div className="profile-actions-divider" />
                    <Link href="https://www.changelifemarketing.in/" className="action-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                      Visit Website
                    </Link>
                  </div>
                </div>
                <div className="insight-section">
                  <div className="section-header"></div>
                  <div style={{ padding: 20, minHeight: 200 }} />
                </div>
              </div>

              {/* ── MESSAGE ── */}
              <div className="bottom-grid" style={{ marginTop: 22 }}>
                <div className="section-card">
                  <div className="section-header">Message</div>
                  <div className="message-body">
                    <p>Follow The Links for Daily Updates.</p>
                    <div className="social-row">
                      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                          <defs><radialGradient id="ig1" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497" /><stop offset="45%" stopColor="#fd5949" /><stop offset="60%" stopColor="#d6249f" /><stop offset="90%" stopColor="#285aeb" /></radialGradient></defs>
                          <rect width="44" height="44" rx="12" fill="url(#ig1)" />
                          <rect x="12" y="12" width="20" height="20" rx="5.5" stroke="white" strokeWidth="2.2" fill="none" />
                          <circle cx="22" cy="22" r="5.5" stroke="white" strokeWidth="2.2" fill="none" />
                          <circle cx="29" cy="15" r="1.4" fill="white" />
                        </svg>
                      </a>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect width="44" height="44" rx="12" fill="#1877F2" /><path d="M26 14h-3a2 2 0 0 0-2 2v3h-3v4h3v9h4v-9h3l.5-4H24v-2.5A.5.5 0 0 1 24.5 16H27v-2z" fill="white" /></svg>
                      </a>
                      <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect width="44" height="44" rx="12" fill="#25D366" /><path d="M22 10C15.37 10 10 15.37 10 22c0 2.13.56 4.13 1.54 5.86L10 34l6.29-1.52A12 12 0 1 0 22 10zm5.97 16.44c-.27.75-1.56 1.44-2.15 1.49-.54.05-1.05.24-3.49-.73-2.93-1.17-4.82-4.14-4.96-4.33-.14-.19-1.2-1.59-1.2-3.03s.76-2.15 1.05-2.44c.27-.29.59-.37.79-.37h.58c.19 0 .46-.07.71.54.27.63.91 2.2.99 2.36.07.17.12.36.02.58-.1.22-.15.36-.29.56-.14.19-.3.43-.44.58-.14.17-.29.34-.12.66.17.32.76 1.25 1.64 2.01 1.12.99 2.06 1.32 2.35 1.46.29.14.46.12.63-.07.17-.22.73-.85.93-1.14.19-.29.39-.24.66-.14.27.1 1.71.81 2 .95.29.14.49.22.56.34.07.12.07.7-.2 1.46z" fill="white" /></svg>
                      </a>
                      <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-btn">
                        <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect width="44" height="44" rx="12" fill="#FF0000" /><polygon points="18,27 18,18 28,22.5" fill="white" /></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Profile page — same as before */
            <div className="bottom-grid">
              {/* ... keep your existing profile page JSX here unchanged ... */}
            </div>
          )}
        </div>
      </div>

      {/* ── WITHDRAW DIALOG ── */}
      <Dialog open={withdrawOpen} onOpenChange={(open: boolean) => { setWithdrawOpen(open); setWithdrawError(""); setWithdrawSuccess(""); }}>
        <DialogContent style={{
          fontFamily: "'Poppins', sans-serif",
          maxWidth: 480,
          background: "linear-gradient(135deg, #ffffff 0%, #f8f9fb 100%)",
          border: "1px solid #e0e0e0",
          borderRadius: 16,
          padding: "28px 32px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
          zIndex: 9999
        }}>
          <DialogHeader>
            <DialogTitle style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#1a1a2e",
              marginBottom: 8,
              background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              💸 Withdraw Request
            </DialogTitle>
            <DialogDescription style={{
              fontSize: 13,
              color: "#666",
              fontWeight: 500
            }}>
              Submit your withdrawal request. Minimum ₹800
            </DialogDescription>
          </DialogHeader>

          <div style={{ marginTop: 8 }}>
            <div className="dialog-field">
              <label>Username</label>
              <div className="val">{userProfile.username}</div>
            </div>

            <div className="dialog-divider" />

            {/* Bank Details */}
            <div style={{ marginBottom: 14, fontSize: 11.5, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>🏦</span>
              Bank Account Details
            </div>
            {bankDetails.accountHolderName || bankDetails.accountNumber ? (
              <>
                <div className="dialog-field">
                  <label>Account Holder Name</label>
                  <div className="val">{bankDetails.accountHolderName || "—"}</div>
                </div>
                <div className="dialog-field">
                  <label>Account Number</label>
                  <div className="val">{bankDetails.accountNumber || "—"}</div>
                </div>
                <div className="dialog-field">
                  <label>IFSC Code</label>
                  <div className="val">{bankDetails.ifscCode || "—"}</div>
                </div>
                <div className="dialog-field">
                  <label>Bank Name</label>
                  <div className="val">{bankDetails.bankName || "—"}</div>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "#e53935", marginBottom: 10 }}>
                ⚠️ Bank details not added. Please update your profile first.
              </div>
            )}

            <div className="dialog-divider" />

            {/* Total Income */}
            <div className="dialog-field" style={{ textAlign: "center" }}>
              <label style={{ textAlign: "center", display: "block" }}>Total Earned Income</label>
              <div className="income-badge">₹ {totalIncome.toLocaleString("en-IN")}</div>
            </div>

            <div className="dialog-divider" />

            {/* Amount Input */}
            <div className="dialog-field">
              <Label htmlFor="withdrawAmount" style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.3px"
              }}>
                Enter Withdrawal Amount <span style={{ color: "#999", fontWeight: 400, textTransform: "none" }}>(Min ₹800)</span>
              </Label>
              <Input
                id="withdrawAmount"
                type="number"
                min={800}
                max={totalIncome}
                placeholder="e.g. 1000"
                value={withdrawAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setWithdrawAmount(e.target.value); setWithdrawError(""); setWithdrawSuccess(""); }}
                style={{
                  marginTop: 8,
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "12px 14px",
                  border: "2px solid #e0e0e0",
                  borderRadius: 8,
                  color: "#1a1a2e",
                  transition: "all 0.3s"
                }}
              />
              {withdrawError && <div className="error-msg">⚠️ {withdrawError}</div>}
              {withdrawSuccess && <div className="success-msg">✅ {withdrawSuccess}</div>}
            </div>
          </div>

          <DialogFooter style={{ gap: 12, marginTop: 20, paddingTop: 20, borderTop: "1px solid #e0e0e0" }}>
            <Button
              variant="outline"
              onClick={() => setWithdrawOpen(false)}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: "#7C3AED",
                border: "2px solid #7C3AED",
                borderRadius: 8,
                padding: "10px 24px",
                cursor: "pointer",
                transition: "all 0.3s"
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={withdrawLoading}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 32px",
                cursor: withdrawLoading ? "not-allowed" : "pointer",
                opacity: withdrawLoading ? 0.7 : 1,
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.3)",
                transition: "all 0.3s"
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