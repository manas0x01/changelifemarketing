'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface IncomeData {
  pairs: number;
  gross: number;
  net: number;
  carryForward?: number;
}

interface SessionData {
  type: string;
  basicIncome: IncomeData;
  boosterIncome: IncomeData;
  totalGross: number;
  totalNet: number;
}

interface SessionBalance {
  date: string;
  morning: SessionData;
  evening: SessionData;
  daily: {
    totalGross: number;
    totalNet: number;
    basicCappingStatus: string;
    boosterCappingStatus: string;
  };
}

export default function SessionBalanceComponent() {
  const [balance, setBalance] = useState<SessionBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessionBalance();
    const interval = setInterval(fetchSessionBalance, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchSessionBalance = async () => {
    try {
      const res = await fetch('/api/user/session-balance');
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch balance');
        return;
      }

      setBalance(data.balance);
      setError('');
    } catch (err) {
      console.error('Error fetching session balance:', err);
      setError('Could not fetch session balance');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSpinner}>Loading session balance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>{error}</div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>No balance data available</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>💰 Session Balance</h2>
        <p style={styles.date}>{balance.date}</p>
      </div>

      {/* Morning Session */}
      <div style={styles.sessionCard}>
        <div style={{ ...styles.sessionHeader, background: '#FFD700' }}>
          <span>🌅 MORNING SESSION</span>
          <small>12:00 AM - 11:59 AM</small>
        </div>
        <div style={styles.sessionBody}>
          {/* Basic Income */}
          <div style={styles.incomeRow}>
            <div style={styles.incomeLabel}>
              <span style={styles.incomeTitle}>📊 Basic Income</span>
              <span style={styles.pairs}>{balance.morning.basicIncome.pairs} pair(s)</span>
            </div>
            <div style={styles.incomeAmount}>
              <div style={styles.gross}>₹{balance.morning.basicIncome.gross}</div>
              <div style={styles.net}>↳ ₹{balance.morning.basicIncome.net} (after deductions)</div>
            </div>
          </div>

          {/* Booster Income */}
          <div style={styles.incomeRow}>
            <div style={styles.incomeLabel}>
              <span style={styles.incomeTitle}>🚀 Booster Income</span>
              <span style={styles.pairs}>{balance.morning.boosterIncome.pairs} pair(s)</span>
            </div>
            <div style={styles.incomeAmount}>
              <div style={styles.gross}>₹{balance.morning.boosterIncome.gross}</div>
              <div style={styles.net}>↳ ₹{balance.morning.boosterIncome.net}</div>
              {(balance.morning.boosterIncome.carryForward ?? 0) > 0 && (
                <div style={styles.carryForward}>
                  📌 Carry Forward: {balance.morning.boosterIncome.carryForward} pair(s)
                </div>
              )}
            </div>
          </div>

          {/* Session Total */}
          <div style={styles.sessionTotal}>
            <span>Session Total (Morning):</span>
            <span style={styles.totalAmount}>₹{balance.morning.totalNet}</span>
          </div>
        </div>
      </div>

      {/* Evening Session */}
      <div style={styles.sessionCard}>
        <div style={{ ...styles.sessionHeader, background: '#FF8C00' }}>
          <span>🌆 EVENING SESSION</span>
          <small>12:00 PM - 11:59 PM</small>
        </div>
        <div style={styles.sessionBody}>
          {/* Basic Income */}
          <div style={styles.incomeRow}>
            <div style={styles.incomeLabel}>
              <span style={styles.incomeTitle}>📊 Basic Income</span>
              <span style={styles.pairs}>{balance.evening.basicIncome.pairs} pair(s)</span>
            </div>
            <div style={styles.incomeAmount}>
              <div style={styles.gross}>₹{balance.evening.basicIncome.gross}</div>
              <div style={styles.net}>↳ ₹{balance.evening.basicIncome.net} (after deductions)</div>
            </div>
          </div>

          {/* Booster Income */}
          <div style={styles.incomeRow}>
            <div style={styles.incomeLabel}>
              <span style={styles.incomeTitle}>🚀 Booster Income</span>
              <span style={styles.pairs}>{balance.evening.boosterIncome.pairs} pair(s)</span>
            </div>
            <div style={styles.incomeAmount}>
              <div style={styles.gross}>₹{balance.evening.boosterIncome.gross}</div>
              <div style={styles.net}>↳ ₹{balance.evening.boosterIncome.net}</div>
              {(balance.evening.boosterIncome.carryForward ?? 0) > 0 && (
                <div style={styles.carryForward}>
                  📌 Carry Forward: {balance.evening.boosterIncome.carryForward} pair(s)
                </div>
              )}
            </div>
          </div>

          {/* Session Total */}
          <div style={styles.sessionTotal}>
            <span>Session Total (Evening):</span>
            <span style={styles.totalAmount}>₹{balance.evening.totalNet}</span>
          </div>
        </div>
      </div>

      {/* Daily Summary */}
      <div style={styles.dailySummary}>
        <div style={styles.summaryHeader}>📈 24-HOUR SUMMARY</div>
        <div style={styles.summaryContent}>
          <div style={styles.summaryRow}>
            <span>Total Net Income (Today):</span>
            <span style={styles.summaryTotal}>₹{balance.daily.totalNet}</span>
          </div>

          <div style={styles.cappingRow}>
            <div style={styles.cappingItem}>
              <span style={styles.cappingLabel}>Basic Income Cap</span>
              <div style={styles.cappingBar}>
                <div
                  style={{
                    ...styles.cappingFill,
                    width: `${(parseInt(balance.daily.basicCappingStatus.split('/')[0]) / 2000) * 100}%`,
                    background: '#4CAF50',
                  }}
                />
              </div>
              <span style={styles.cappingText}>{balance.daily.basicCappingStatus}</span>
            </div>

            <div style={styles.cappingItem}>
              <span style={styles.cappingLabel}>Booster Income Cap</span>
              <div style={styles.cappingBar}>
                <div
                  style={{
                    ...styles.cappingFill,
                    width: `${(parseInt(balance.daily.boosterCappingStatus.split('/')[0]) / 20000) * 100}%`,
                    background: '#2196F3',
                  }}
                />
              </div>
              <span style={styles.cappingText}>{balance.daily.boosterCappingStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={styles.legendIcon}>💡</span>
          <span>Gross Income = Before TDS (5%) & Service Charge (15%)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendIcon}>✓</span>
          <span>Net Income = After deductions are applied</span>
        </div>
        <div style={styles.legendItem}>
          <span style={styles.legendIcon}>📌</span>
          <span>Carry Forward = Pairs beyond session limit (max 10 pairs)</span>
        </div>
      </div>

      {/* Refresh Button */}
      <div style={styles.refreshButton}>
        <button
          onClick={fetchSessionBalance}
          style={{
            padding: '10px 20px',
            background: '#26a69a',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          🔄 Refresh Balance
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    background: '#f5f5f5',
    borderRadius: '8px',
    fontFamily: "'Poppins', sans-serif",
  },
  header: {
    marginBottom: '20px',
    borderBottom: '2px solid #26a69a',
    paddingBottom: '12px',
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    fontWeight: 700,
    color: '#333',
  },
  date: {
    margin: 0,
    fontSize: '12px',
    color: '#999',
    fontWeight: 500,
  },
  sessionCard: {
    background: 'white',
    borderRadius: '8px',
    marginBottom: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  sessionHeader: {
    padding: '12px 16px',
    color: 'white',
    fontWeight: 700,
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionBody: {
    padding: '16px',
  },
  incomeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #eee',
  },
  incomeLabel: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  incomeTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  pairs: {
    fontSize: '12px',
    color: '#999',
    fontWeight: 500,
  },
  incomeAmount: {
    textAlign: 'right' as const,
  },
  gross: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#26a69a',
  },
  net: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px',
  },
  carryForward: {
    fontSize: '11px',
    color: '#FF9800',
    fontWeight: 600,
    marginTop: '4px',
  },
  sessionTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    background: '#f0f0f0',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  totalAmount: {
    color: '#26a69a',
    fontSize: '16px',
  },
  dailySummary: {
    background: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  summaryHeader: {
    padding: '12px 16px',
    background: '#26a69a',
    color: 'white',
    fontWeight: 700,
    fontSize: '14px',
  },
  summaryContent: {
    padding: '16px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: 600,
  },
  summaryTotal: {
    color: '#26a69a',
    fontSize: '18px',
  },
  cappingRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  cappingItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  cappingLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#333',
  },
  cappingBar: {
    height: '8px',
    background: '#eee',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  cappingFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  cappingText: {
    fontSize: '11px',
    color: '#666',
    fontWeight: 500,
  },
  legend: {
    marginTop: '20px',
    padding: '12px',
    background: '#f9f9f9',
    borderRadius: '5px',
    fontSize: '12px',
    color: '#666',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  legendIcon: {
    fontSize: '14px',
  },
  loadingSpinner: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#999',
    fontSize: '14px',
  },
  errorBox: {
    padding: '16px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 600,
  },
  refreshButton: {
    marginTop: '20px',
    textAlign: 'center' as const,
  },
};
