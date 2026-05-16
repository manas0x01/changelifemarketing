"use client";

import { useState } from "react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

export default function SessionTransitionPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activePage, setActivePage] = useState<"dashboard" | "profile">("dashboard");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleManualTrigger = async () => {
    // Manual trigger is disabled as requested by user
    toast.info("Session transition is now fully automated and triggers at 12 AM / 12 PM.");
    return;
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentSession = () => {
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 0 && currentHour < 12 ? "Morning (12 AM - 12 PM)" : "Evening (12 PM - 12 AM)";
  };

  const isTransitionPeriod = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    return (currentHour === 11 && currentMinute >= 50) || 
           (currentHour === 23 && currentMinute >= 50);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .st-root {
          font-family: 'Poppins', sans-serif;
          background: #f0f2f5;
          min-height: 100vh;
        }
        
        .green-bar {
          height: 8px;
          background: linear-gradient(90deg, #00c853, #1de9b6);
        }
        
        .breadcrumb {
          padding: 12px 20px;
          font-size: 13px;
          color: #555;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .breadcrumb a {
          color: #555;
          text-decoration: none;
        }
        
        .breadcrumb a:hover {
          text-decoration: underline;
        }
        
        .breadcrumb .sep {
          color: #999;
        }
        
        .page-body {
          padding: 0 20px 40px;
        }
        
        .main-card {
          background: #fff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.07);
        }
        
        .section-header {
          background: linear-gradient(90deg, #26a69a, #1de9b6);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        
        .card-content {
          padding: 24px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .info-card {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #26a69a;
        }
        
        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        
        .status-active {
          color: #26a69a;
        }
        
        .status-inactive {
          color: #e53935;
        }
        
        .trigger-btn {
          background: #1976d2;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 12px 32px;
          font-size: 14px;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s;
        }
        
        .trigger-btn:hover:not(:disabled) {
          background: #1565c0;
          transform: translateY(-1px);
        }
        
        .trigger-btn:disabled {
          background: #9e9e9e;
          cursor: not-allowed;
        }
        
        .result-box {
          margin-top: 24px;
          padding: 16px;
          background: #e8f5e9;
          border-radius: 8px;
          border: 1px solid #26a69a;
        }
        
        .result-title {
          font-size: 14px;
          font-weight: 600;
          color: #1b5e20;
          margin-bottom: 12px;
        }
        
        .result-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #c8e6c9;
        }
        
        .result-item:last-child {
          border-bottom: none;
        }
        
        .result-label {
          color: #424242;
        }
        
        .result-value {
          font-weight: 600;
          color: #1b5e20;
        }
        
        .note-text {
          color: #f57c00;
          font-size: 13px;
          margin-top: 16px;
          padding: 12px;
          background: #fff3e0;
          border-radius: 6px;
        }
      `}</style>

      <div className="st-root">
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={setActivePage} />

        <div className="green-bar" />

        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#555"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span>Admin</span>
          <span className="sep">/</span>
          <span>Session Transition</span>
        </div>

        <div className="page-body">
          <div className="main-card">
            <div className="section-header">
              <span className="section-title">Session Transition Control</span>
            </div>

            <div className="card-content">
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-label">Current Time</div>
                  <div className="info-value">{getCurrentTime()}</div>
                </div>
                
                <div className="info-card">
                  <div className="info-label">Current Session</div>
                  <div className="info-value">{getCurrentSession()}</div>
                </div>
                
                <div className="info-card">
                  <div className="info-label">Transition Period</div>
                  <div className={`info-value ${isTransitionPeriod() ? 'status-active' : 'status-inactive'}`}>
                    {isTransitionPeriod() ? 'ACTIVE (11:50-12:00)' : 'INACTIVE'}
                  </div>
                </div>
              </div>

              <button
                className="trigger-btn"
                onClick={handleManualTrigger}
                disabled={true}
              >
                Transition is now Automated
              </button>

              <div className="note-text">
                ℹ️ Session transition is now automatically handled by the system at 12:00 AM (Morning start) and 12:00 PM (Evening start). Manual triggers are no longer required.
              </div>

              {result && (
                <div className="result-box">
                  <div className="result-title">Transition Completed Successfully</div>
                  <div className="result-item">
                    <span className="result-label">Users Processed</span>
                    <span className="result-value">{result.usersProcessed}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Total Income Added</span>
                    <span className="result-value">₹{result.totalIncomeAdded.toLocaleString()}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">Total Pairs Flushed</span>
                    <span className="result-value">{result.totalPairsFlushed}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">From Session</span>
                    <span className="result-value">{result.fromSession}</span>
                  </div>
                  <div className="result-item">
                    <span className="result-label">To Session</span>
                    <span className="result-value">{result.toSession}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
