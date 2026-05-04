"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import styles from "./TimeSlots.module.css";

interface TimeSlotData {
  currentSessionType: "morning" | "evening";
  sessionStatus: "active" | "expired";
  availablePairs: number;
  leftPairs: number;
  rightPairs: number;
  hasLeftChild: boolean;
  hasRightChild: boolean;
  user: {
    id: string;
    name: string;
    lastSessionType?: "morning" | "evening";
    lastSessionDate?: string;
    basicPairs: number;
    isBooster: boolean;
  };
}

interface PairCompletionData {
  success: boolean;
  message: string;
  income: {
    amount: number;
    pairNumber: number;
    description: string;
  };
  session: {
    type: "morning" | "evening";
    date: string;
  };
  user: {
    id: string;
    basicPairs: number;
    basicIncome: number;
    isBooster: boolean;
    boosterAchievedAt?: string;
  };
  pairCompleted: {
    position: string;
    leftPairs: number;
    rightPairs: number;
  };
}

export default function TimeSlotsPage() {
  const router = useRouter();
  const [timeSlotData, setTimeSlotData] = useState<TimeSlotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completingPair, setCompletingPair] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<"left" | "right" | null>(null);
  const [userId, setUserId] = useState("");

  // Fetch current session data
  const fetchTimeSlotData = async () => {
    try {
      const res = await fetch("/api/user/time-slots", { method: "GET" });
      const data = await res.json();
      
      if (data.success) {
        setTimeSlotData(data);
        setUserId(data.user.id);
        // Show flush message if pairs were flashed out
        if (data.flushMessage) {
          setFlushMessage(data.flushMessage);
          toast.warning(data.flushMessage, { duration: 5000 });
        } else {
          setFlushMessage("");
        }
      } else {
        toast.error(data.message || "Failed to load time slot data");
      }
    } catch (error) {
      console.error("Error fetching time slot data:", error);
      toast.error("Failed to load time slot data");
    }
  };

  // Change time and trigger session change check with flash out
  const handleChangeTime = async () => {
    if (!selectedTestTime) {
      toast.error("Please select a session first");
      return;
    }

    setChangingTime(true);
    try {
      const manualTime = getTestTimeISO(selectedTestTime);
      const selectedLabel = testTimeOptions.find(opt => opt.value === selectedTestTime)?.label || selectedTestTime;
      const sessionType = selectedTestTime === "morning" ? "Morning Session" : "Evening Session";
      
      const res = await fetch("/api/user/time-slots", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualTime }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setTimeSlotData(data);
        setUserId(data.user.id);
        
        toast.success(`✅ Session changed to ${sessionType}`);
        
        // Show flush message if pairs were flashed out
        if (data.flushMessage) {
          setFlushMessage(data.flushMessage);
          toast.warning(data.flushMessage, { duration: 8000 });
        } else if (data.sessionChanged) {
          toast.success(`Session changed to ${data.currentSessionType}! No incomplete pairs to flash out.`);
          setFlushMessage("");
        } else {
          toast.success(`Current session: ${data.currentSessionType}`);
          setFlushMessage("");
        }
      } else {
        toast.error(data.message || "Failed to change session");
      }
    } catch (error) {
      console.error("Error changing session:", error);
      toast.error("Failed to change session");
    } finally {
      setChangingTime(false);
    }
  };

  const [selectedTestTime, setSelectedTestTime] = useState<string>("");
  const [changingTime, setChangingTime] = useState(false);
  const [flushMessage, setFlushMessage] = useState<string>("");

  // Preset IST test times for different scenarios - SIMPLIFIED TO ONLY TWO OPTIONS
  const testTimeOptions = [
    { label: "🌅 Change Session to Morning", value: "morning" },
    { label: "🌆 Change Session to Evening", value: "evening" },
  ];

  // Get ISO string for selected test time (IST = UTC+5:30)
  const getTestTimeISO = (timeKey: string): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    // Simplified: just morning and evening
    const timeMap: Record<string, string> = {
      "morning": `${year}-${month}-${day}T04:30:00.000Z`,    // 10:00 AM IST = 04:30 UTC (Morning session)
      "evening": `${year}-${month}-${day}T13:30:00.000Z`,   // 7:00 PM IST = 13:30 UTC (Evening session)
    };
    return timeMap[timeKey] || "";
  };

  // Complete a pair
  const completePair = async (position: "left" | "right") => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    setCompletingPair(true);
    try {
      const requestBody: any = { userId, position };
      
      // Add manual time if a test time is selected
      if (selectedTestTime) {
        requestBody.manualTime = getTestTimeISO(selectedTestTime);
        const selectedLabel = testTimeOptions.find(opt => opt.value === selectedTestTime)?.label || selectedTestTime;
        toast.info(`Testing with: ${selectedLabel}`);
      }
      
      const res = await fetch("/api/user/complete-pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      const data: PairCompletionData = await res.json();
      
      if (data.success) {
        toast.success(`✅ ${data.message}`);
        toast.success(`💰 Income added: ₹${data.income.amount}`);
        
        // Refresh time slot data
        await fetchTimeSlotData();
      } else {
        toast.error(data.message || "Failed to complete pair");
      }
    } catch (error) {
      console.error("Error completing pair:", error);
      toast.error("Failed to complete pair");
    } finally {
      setCompletingPair(false);
    }
  };

  useEffect(() => {
    fetchTimeSlotData();
  }, []);

  const getSessionIcon = () => {
    if (!timeSlotData) return "🕐";
    return timeSlotData.currentSessionType === "morning" ? "🌅" : "🌆";
  };

  const getSessionLabel = () => {
    if (!timeSlotData) return "Loading...";
    return timeSlotData.currentSessionType === "morning" ? "Morning Session" : "Evening Session";
  };

  const getSessionTime = () => {
    if (!timeSlotData) return "";
    return timeSlotData.currentSessionType === "morning" ? "12:00 AM - 12:00 PM" : "12:00 PM - 12:00 AM";
  };

  const getStatusColor = () => {
    if (!timeSlotData) return "#666";
    return timeSlotData.sessionStatus === "active" ? "#4CAF50" : "#F44336";
  };

  const getStatusText = () => {
    if (!timeSlotData) return "Loading...";
    return timeSlotData.sessionStatus === "active" ? "Active" : "Expired";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Time Slot Management</h1>
        <p>Complete pairs within 12-hour time slots to earn income</p>
      </div>

      {timeSlotData && (
        <>
          {/* Current Session Info */}
          <div className={styles.sessionCard}>
            <div className={styles.sessionHeader}>
              <div className={styles.sessionIcon}>
                {getSessionIcon()}
              </div>
              <div className={styles.sessionInfo}>
                <h2>{getSessionLabel()}</h2>
                <p>{getSessionTime()}</p>
                <div className={styles.sessionStatus} style={{ backgroundColor: getStatusColor() }}>
                  {getStatusText()}
                </div>
              </div>
            </div>

            {/* Test Time Selector */}
            <div className={styles.testTimeSection}>
              <label className={styles.testTimeLabel}>🧪 Test Time (IST):</label>
              <select
                className={styles.testTimeSelect}
                value={selectedTestTime}
                onChange={(e) => {
                  setSelectedTestTime(e.target.value);
                }}
              >
                {testTimeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedTestTime && (
                <span className={styles.testModeBadge}>TEST MODE ACTIVE</span>
              )}
              
              {/* Change Time Button */}
              <button
                className={styles.changeTimeButton}
                onClick={handleChangeTime}
                disabled={changingTime || !selectedTestTime}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: changingTime ? "#ccc" : "#FF9800",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: changingTime || !selectedTestTime ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: "14px",
                  width: "100%",
                }}
              >
                {changingTime ? "⏳ Changing Time..." : "🕐 Change Time & Check Session"}
              </button>
              
              {/* Flush Message Alert */}
              {flushMessage && (
                <div style={{
                  marginTop: "10px",
                  padding: "12px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "6px",
                  color: "#856404",
                  fontSize: "13px",
                  fontWeight: 500,
                }}>
                  ⚠️ {flushMessage}
                </div>
              )}
            </div>

            {/* Pair Success Section */}
            <div className={styles.sessionDetails}>
              <h3 style={{ marginBottom: "15px", color: "#4CAF50" }}>✅ Pair Completion Status</h3>
              <div className={styles.detailItem}>
                <span className={styles.label}>Session Type:</span>
                <span className={styles.value}>{timeSlotData.currentSessionType === "morning" ? "🌅 Morning Session" : "🌆 Evening Session"}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Pairs Completed This Session:</span>
                <span className={styles.value} style={{ color: "#4CAF50", fontWeight: "bold" }}>
                  {timeSlotData.availablePairs > 0 ? "1 Pair Completed" : "No Pair Yet"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Income Earned This Session:</span>
                <span className={styles.value} style={{ color: "#4CAF50", fontWeight: "bold" }}>
                  {timeSlotData.availablePairs > 0 ? "₹1000" : "₹0"}
                </span>
              </div>
            </div>

            {/* Filtered Pairs Section */}
            <div className={styles.sessionDetails} style={{ marginTop: "20px" }}>
              <h3 style={{ marginBottom: "15px", color: "#FF9800" }}>⚠️ Filtered/Flushed Pairs</h3>
              <div className={styles.detailItem}>
                <span className={styles.label}>Left Pairs Flushed:</span>
                <span className={styles.value} style={{ color: "#FF9800", fontWeight: "bold" }}>
                  {flushMessage ? "1" : "0"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Right Pairs Flushed:</span>
                <span className={styles.value} style={{ color: "#FF9800", fontWeight: "bold" }}>
                  {flushMessage ? "1" : "0"}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.label}>Flush Message:</span>
                <span className={styles.value} style={{ color: "#856404", fontSize: "12px" }}>
                  {flushMessage || "No pairs flushed"}
                </span>
              </div>
            </div>
          </div>

          {/* Pair Completion Section */}
          <div className={styles.pairSection}>
            <h3>Complete Pairs</h3>
            <p>Both sides must have at least 1 member to complete a pair</p>
            
            <div className={styles.pairGrid}>
              {/* Left Side */}
              <div className={styles.pairCard}>
                <div className={styles.pairHeader}>
                  <h4>Left Side</h4>
                  <div className={styles.pairStatus}>
                    Members: {timeSlotData.leftPairs}
                  </div>
                </div>
                <div className={styles.pairInfo}>
                  <div className={styles.childStatus}>
                    {timeSlotData.hasLeftChild ? "✅ Filled" : "🔴 Empty"}
                  </div>
                  <div className={styles.availablePairs}>
                    Available: {timeSlotData.availablePairs > 0 && !timeSlotData.hasLeftChild ? 1 : 0}
                  </div>
                </div>
                <button
                  className={styles.completeButton}
                  disabled={timeSlotData.hasLeftChild || timeSlotData.availablePairs === 0 || completingPair}
                  onClick={() => completePair("left")}
                >
                  {completingPair && selectedPosition === "left" ? "Completing..." : "Complete Left Pair"}
                </button>
              </div>

              {/* Right Side */}
              <div className={styles.pairCard}>
                <div className={styles.pairHeader}>
                  <h4>Right Side</h4>
                  <div className={styles.pairStatus}>
                    Members: {timeSlotData.rightPairs}
                  </div>
                </div>
                <div className={styles.pairInfo}>
                  <div className={styles.childStatus}>
                    {timeSlotData.hasRightChild ? "✅ Filled" : "🔴 Empty"}
                  </div>
                  <div className={styles.availablePairs}>
                    Available: {timeSlotData.availablePairs > 0 && !timeSlotData.hasRightChild ? 1 : 0}
                  </div>
                </div>
                <button
                  className={styles.completeButton}
                  disabled={timeSlotData.hasRightChild || timeSlotData.availablePairs === 0 || completingPair}
                  onClick={() => completePair("right")}
                >
                  {completingPair && selectedPosition === "right" ? "Completing..." : "Complete Right Pair"}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className={styles.instructions}>
            <h3>⚠️ Time Slot Rules - DUAL SESSION RESTRICTION</h3>
            <ul>
              <li><strong>Morning Session:</strong> 12:00 AM - 12:00 PM</li>
              <li><strong>Evening Session:</strong> 12:00 PM - 12:00 AM</li>
              <li><strong>Income:</strong> ₹1000 per completed pair (Basic Plan)</li>
              <li><strong>Booster Upgrade:</strong> Complete 10 pairs to become Booster User</li>
              <li><strong>Flash Out:</strong> Incomplete pairs expire when session changes</li>
              <li><strong>Single Side:</strong> Can continue building on one side without requiring both</li>
              <li><strong>🚨 DUAL SESSION RESTRICTION:</strong></li>
              <li>• <strong>Morning Session:</strong> If you fill 1st position at 7AM, you must fill 2nd position by 12:00 PM</li>
              <li>• <strong>Evening Session:</strong> If you fill 1st position at 7PM, you must fill 2nd position by 12:00 AM</li>
              <li>• <strong>Pair Completion:</strong> Both positions must be filled within the <strong>same session</strong> to complete a pair</li>
              <li>• <strong>Examples:</strong></li>
              <li>  - Morning: Fill Left at 8AM → Fill Right by 11AM → Pair Complete</li>
              <li>  - Evening: Fill Left at 8PM → Wait until 12AM → Fill Right → Pair Complete</li>
              <li>  - <strong>NOT ALLOWED:</strong> Fill Left at 8PM, wait until 12AM, then try to fill Right in next day's session</li>
            </ul>
          </div>
        </>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading time slot data...</p>
        </div>
      )}
    </div>
  );
}
