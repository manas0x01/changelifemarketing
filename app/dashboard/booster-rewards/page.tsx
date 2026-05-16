"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";

const RANKS = [
  { rank: 1, name: "GOLD", left: 5, right: 5, award: "BAG + BUSINESS KIT", image: "/awards/gold.png", color: "#FFD700" },
  { rank: 2, name: "SUPER GOLD", left: 10, right: 10, award: "SMART WATCH", image: "/awards/super_gold.png", color: "#FFDF00" },
  { rank: 3, name: "GOLD STAR", left: 25, right: 25, award: "SUIT LENGTH", image: "/awards/gold_star.png", color: "#F9A602" },
  { rank: 4, name: "PEARL EX", left: 50, right: 50, award: "MIXI - GRINDER", image: "/awards/pearl_ex.png", color: "#E5E4E2" },
  { rank: 5, name: "EMERALD", left: 100, right: 100, award: "FRIDGE REFRIGERATOR", image: "/awards/emerald_ruby.png", color: "#50C878" },
  { rank: 6, name: "RUBY", left: 200, right: 200, award: "MOBILE", image: "/awards/emerald_ruby.png", color: "#E0115F" },
  { rank: 7, name: "PLATINUM", left: 500, right: 500, award: "LAPTOP", image: "/awards/platinum_diamond.png", color: "#E5E4E2" },
  { rank: 8, name: "DIAMOND", left: 1000, right: 1000, award: "BIKE", image: "/awards/platinum_diamond.png", color: "#B9F2FF" },
  { rank: 9, name: "DOUBLE DIAMOND", left: 2000, right: 2000, award: "1.5 LAKH RUPEES GIFT", image: "/awards/ultimate.png", color: "#E1F5FE" },
  { rank: 10, name: "BLACK DIAMOND", left: 4000, right: 4000, award: "2.5 LAKH RUPEES GIFT", image: "/awards/ultimate.png", color: "#1A1A1A" },
  { rank: 11, name: "BLUE DIAMOND", left: 8000, right: 8000, award: "5 LAKH RUPEES GIFT", image: "/awards/ultimate.png", color: "#0000FF" },
  { rank: 12, name: "ROYAL DIAMOND", left: 16000, right: 16000, award: "7.5 LAKH RUPEES GIFT", image: "/awards/ultimate.png", color: "#E0115F" },
  { rank: 13, name: "CROWN DIAMOND", left: 32000, right: 32000, award: "10 LAKH RUPEES GIFT", image: "/awards/ultimate.png", color: "#FFD700" },
];

export default function BoosterRewardsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/get-booster-rewards");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.message || "Failed to load rewards data.");
        }
      } catch (err) {
        console.error(err);
        setError("A network error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentRank = data?.awardRankStatus?.rank || 0;
  const boosterCount = data?.boosterCount || { left: 0, right: 0 };
  const usedCount = data?.boosterCountUsedForRank || { left: 0, right: 0 };

  const availableLeft = boosterCount.left - usedCount.left;
  const availableRight = boosterCount.right - usedCount.right;

  const nextRank = RANKS[currentRank];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-['Poppins']">
      <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        .reward-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reward-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.05);
        }
        .reward-card.achieved {
          border-color: #f59e0b;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);
        }
        .glass-panel {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .progress-bar-bg {
          background: rgba(255, 255, 255, 0.1);
        }
        .progress-bar-fill {
          background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
        }
        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">Third Level Rewards</h1>
          <p className="text-slate-400 text-lg">Exclusive Booster Network Achievement Milestones</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : error || !data ? (
          <div className="glass-panel rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Unable to Load Rewards</h2>
            <p className="text-slate-400 mb-8">{error || "We encountered an issue fetching your reward status. Please try refreshing the page."}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-8 rounded-full transition-all"
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <>
            {/* Booster Required Notice for non-boosters */}
            {!data.isBooster && (
              <div className="glass-panel rounded-3xl p-8 text-center mb-12 border-amber-500/30 bg-amber-500/5">
                <h2 className="text-2xl font-bold mb-2 text-amber-500">Booster Status Required</h2>
                <p className="text-slate-400">
                  This elite reward tier is exclusively for Booster qualified members. 
                  Achieve 12 basic pairs to unlock your journey to the Crown Diamond rank.
                </p>
              </div>
            )}

            {/* Current Status Hero */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 ${!data.isBooster ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="lg:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                
                <h3 className="text-slate-400 font-medium uppercase tracking-widest mb-2">Current Rank</h3>
                <h2 className="text-5xl font-extrabold mb-6 text-amber-500">{data.awardRankStatus?.rankName || "Booster Member"}</h2>
                
                <div className="flex flex-wrap gap-8 mb-8">
                  <div>
                    <span className="block text-slate-400 text-sm mb-1">Total Booster Pairs</span>
                    <span className="text-3xl font-bold">{Math.min(boosterCount.left, boosterCount.right)}</span>
                  </div>
                  <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                  <div>
                    <span className="block text-slate-400 text-sm mb-1">Used for Ranks</span>
                    <span className="text-3xl font-bold">{Math.min(usedCount.left, usedCount.right)}</span>
                  </div>
                  <div className="w-px h-12 bg-white/10 hidden sm:block"></div>
                  <div>
                    <span className="block text-slate-400 text-sm mb-1">Current Progress</span>
                    <span className="text-3xl font-bold text-emerald-400">{Math.min(availableLeft, availableRight)}</span>
                  </div>
                </div>

                {nextRank ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-slate-300 font-medium">Progress to {nextRank.name}</span>
                      <span className="text-sm font-bold text-amber-500">
                        {Math.min(availableLeft, availableRight)} / {nextRank.left} Pairs
                      </span>
                    </div>
                    <div className="h-4 progress-bar-bg rounded-full overflow-hidden">
                      <div 
                        className="h-full progress-bar-fill transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (Math.min(availableLeft, availableRight) / nextRank.left) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-slate-400 text-sm italic">Count resets to 0 after achieving each rank.</p>
                  </div>
                ) : (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
                    <p className="text-amber-500 font-bold text-xl">🎉 Ultimate Rank Achieved!</p>
                    <p className="text-slate-400">You have completed the Third Level Reward journey. Congratulations!</p>
                  </div>
                )}
              </div>

              <div className="glass-panel rounded-3xl p-8 flex flex-col justify-between items-center text-center">
                 <h3 className="text-slate-400 font-medium uppercase tracking-widest mb-4">Latest Award</h3>
                 {data.awardRankStatus?.rank > 0 ? (
                   <div className="animate-float">
                     <img 
                      src={RANKS[data.awardRankStatus.rank - 1].image} 
                      alt="Award" 
                      className="w-48 h-48 object-contain mb-4 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                    />
                    <h4 className="text-2xl font-bold text-amber-400">{RANKS[data.awardRankStatus.rank - 1].award}</h4>
                    <p className="text-slate-500 text-sm">Achieved on {new Date(data.awardRankStatus.achievementDate).toLocaleDateString()}</p>
                   </div>
                 ) : (
                   <div className="opacity-30">
                     <svg className="w-32 h-32 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                     </svg>
                     <p className="text-slate-500 italic">No awards yet</p>
                   </div>
                 )}
              </div>
            </div>

            {/* Ranks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {RANKS.map((rank, idx) => {
                const isAchieved = currentRank >= rank.rank;
                const isNext = currentRank + 1 === rank.rank;
                
                return (
                  <div key={idx} className={`reward-card rounded-2xl p-6 flex flex-col items-center text-center ${isAchieved ? 'achieved' : ''}`}>
                    <div className="relative mb-6">
                      <img 
                        src={rank.image} 
                        alt={rank.name} 
                        className={`w-32 h-32 object-contain transition-all ${!isAchieved ? 'grayscale opacity-30' : 'drop-shadow-lg'}`}
                      />
                      {isAchieved && (
                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-1 shadow-lg">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Rank {rank.rank}</span>
                    <h4 className="text-xl font-bold mb-2" style={{ color: isAchieved ? rank.color : '#fff' }}>{rank.name}</h4>
                    
                    <div className="w-full h-px bg-white/5 my-4"></div>
                    
                    <div className="space-y-2 mb-6">
                      <p className="text-slate-400 text-sm">Target: <span className="text-white font-semibold">{rank.left}-{rank.right} Pairs</span></p>
                      <p className="text-amber-500 font-medium text-sm leading-tight">{rank.award}</p>
                    </div>

                    {!isAchieved ? (
                      <div className="mt-auto w-full">
                         {isNext ? (
                            <div className="text-xs font-bold py-2 px-4 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                              IN PROGRESS
                            </div>
                         ) : (
                            <div className="text-xs font-bold py-2 px-4 rounded-full bg-white/5 text-slate-500 border border-white/5">
                              LOCKED
                            </div>
                         )}
                      </div>
                    ) : (
                      <div className="mt-auto w-full">
                        <div className="text-xs font-bold py-2 px-4 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                          ACHIEVED
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
