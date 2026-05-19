"use client";

import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";

interface Message {
  id: number;
  text: string;
  sender: "user" | "admin";
  time: string;
}

function getTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const quickQuestions = [
  { label: "💼 How does the business plan work?", query: "How does the business plan work and how can I earn?" },
  { label: "🚀 How do I upgrade to Booster?", query: "How do I upgrade to the Booster level?" },
  { label: "💰 What is the daily income cap?", query: "What is the daily income capping and limit?" },
  { label: "✂️ Why was my pair payout cut?", query: "Why was my 3rd/6th/9th/12th pair unpaid (payout cuts)?" },
  { label: "🔄 Does my unpaid balance carry forward?", query: "Does my unpaid balance carry forward to the next session?" },
  { label: "🏆 What awards can I win?", query: "What awards and rewards can I win as a Booster?" },
  { label: "⏰ What are the session timings?", query: "What are the daily session timings?" },
];

const autoReplies = [
  "Thank you for contacting support. How can I assist you today?",
  "We have received your message and will get back to you shortly.",
  "Our team is looking into your issue. Please hold on.",
  "Could you please provide more details about your concern?",
  "Your issue has been noted. We will resolve it within 24 hours.",
];

function getBotReply(query: string, replyIdx: number): string {
  const q = query.toLowerCase();

  // 1. Business Plan / How it works
  if (q.includes("business plan") || q.includes("how does") || q.includes("how do i earn") || q.includes("how it works") || q.includes("work") || q.includes("earn")) {
    return `💼 **CLM Business Plan Overview:**
ChangeLife Marketing has a two-phase income system designed to maximize your earning potential:

1. **Basic Phase (Phase 1)**:
   • Earn ₹1,000 per matched pair (1 Left + 1 Right user).
   • Capped at **1 pair per session** (up to ₹2,000 daily).
   • All unpaired units flush out at the end of the session.
   • Pairs #3, #6, #9, and #12 are subject to system cuts (₹0 payout).

2. **Booster Phase (Phase 2)**:
   • Earn ₹1,000 per matched pair.
   • Capped at **10 pairs per session** (up to ₹20,000 daily).
   • Unpaired units **carry forward** indefinitely!
   • Upgrade happens automatically after achieving 12 basic pairs.`;
  }

  // 2. Booster / Upgrade
  if (q.includes("upgrade") || q.includes("booster level") || q.includes("become booster") || q.includes("qualify") || q.includes("booster")) {
    return `⚡ **How to Upgrade to Booster Level:**
To upgrade from Basic to the **Booster Level**, you must complete **12 valid basic sessions** (reach 12 basic pairs in your lifetime account). 

Once you achieve 12 pairs:
• Your account automatically upgrades to **BOOSTER LEVEL**!
• You unlock the ₹10,000 per session capping (10 pairs).
• Unpaired members will now **carry forward** instead of flushing.
• You become eligible for high-value **Award Ranks and Rewards**!`;
  }

  // 3. Capping / Limits
  if (q.includes("cap") || q.includes("limit") || q.includes("max") || q.includes("capping")) {
    return `💰 **Income Capping Limits:**
Our plan has structured capping limits to ensure long-term stability:

• **Basic Phase**: Max **1 pair paid per session** (₹1,000). Total daily potential is ₹2,000 (Morning + Evening).
• **Booster Phase**: Max **10 pairs paid per session** (₹10,000). Total daily potential is ₹20,000 (Morning + Evening).
• **Extra Pairs**: In Booster, pairs above 10 in a single session are flushed (they remain in the tree but don't pay out).`;
  }

  // 4. Cuts / Deductions / Sequence #3, #6, #9, #12
  if (q.includes("cut") || q.includes("deduction") || q.includes("unpaid") || q.includes("3rd") || q.includes("6th") || q.includes("9th") || q.includes("12th") || q.includes("deductions")) {
    return `✂️ **Pair Payout Cuts Rule:**
In the **Basic Phase (Phase 1)**, the system applies cuts on specific lifetime pair matching sequences to maintain the plan's mathematical integrity:
• Pairs **#3, #6, #9, and #12** are cut (credited ₹0).
• All other basic pairs are paid the full ₹1,000.

Once you upgrade to the **Booster Phase (Phase 2)**, **NO MORE CUTS** are applied to your matched pairs!`;
  }

  // 5. Carry Forward / Spillover
  if (q.includes("carry") || q.includes("forward") || q.includes("spillover") || q.includes("unpaired") || q.includes("balance")) {
    return `🔄 **Carry-Forward Rules:**
• **Basic Phase**: Unpaired members do **NOT** carry forward. Any matching triggers a full session flush-out of left and right counts.
• **Booster Phase**: Yes! All unpaired members in your Left or Right leg **carry forward indefinitely** to subsequent sessions. Only matched pairs are consumed.`;
  }

  // 6. Awards / Rewards / Ranks
  if (q.includes("award") || q.includes("reward") || q.includes("rank") || q.includes("gift")) {
    return `🏆 **Awards & Rewards (Booster Achievers):**
As a Booster member, you unlock fantastic rewards based on matching Booster pairs in your team:
• **5 Pairs**: Gold Rank ➔ Bag + Business Kit
• **10 Pairs**: Super Gold Rank ➔ Smart Watch
• **25 Pairs**: Gold Star Rank ➔ Suit Length
• **50 Pairs**: Pearl Ex Rank ➔ Mixer Grinder
• **100 Pairs**: Emerald Rank ➔ Refrigerator
• **200 Pairs**: Ruby Rank ➔ Mobile Phone
• **500 Pairs**: Platinum Rank ➔ Laptop
• **1,000 Pairs**: Diamond Rank ➔ Motorcycle
• **Ranks go up to Crown Diamond (32,000 pairs)** yielding a ₹10 Lakh Gift!`;
  }

  // 7. Session Timings / Daily Sessions
  if (q.includes("session timing") || q.includes("timing") || q.includes("time") || q.includes("hour") || q.includes("hours") || q.includes("daily session")) {
    return `⏰ **Daily Income Session Timings:**
The ChangeLife system calculates matching and credits payouts in two 12-hour session windows daily:
1. **Morning Session**: 12:00 AM (Midnight) to 11:59 AM
2. **Evening Session**: 12:00 PM (Noon) to 11:59 PM

Make sure your pairs are placed in the network tree before the session closes to count towards that session's payout!`;
  }

  // 8. Basic Phase Specific query
  if (q.includes("basic") || q.includes("phase 1") || q.includes("phase1")) {
    return `🌟 **Basic Phase (Phase 1) Rules:**
• **Earning**: ₹1,000 per matched pair (1 Left + 1 Right user within a session).
• **Session Cap**: Maximum 1 pair is paid per session (₹1,000 cap).
• **No Carry-Forward**: All unpaired members are flushed out at the end of the session.
• **Pair Cuts**: Payouts for pair sequence numbers **#3, #6, #9, and #12** are cut (you receive ₹0 for these). Other pairs pay ₹1,000.
• **Upgrade**: Complete 12 valid sessions (12 basic pairs) to upgrade to the **Booster Level**!`;
  }

  // 9. Withdrawal
  if (q.includes("withdraw") || q.includes("payout") || q.includes("bank")) {
    return `💳 **Withdrawal & Payout Process:**
• Go to the **Withdraw Request** section in your dashboard.
• Enter your desired withdrawal amount and click submit.
• Ensure your bank account details are correctly configured.
• The admin team reviews and approves requests, and funds are credited directly to your bank account.`;
  }

  // 10. General Greetings / Hellos
  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("support")) {
    return `👋 Hello! Welcome to the **ChangeLife Marketing (CLM) Support Center**. 

I am here to assist you with our **Official Business & Income Plan**. Feel free to click any of the quick-help options below or ask your question directly!`;
  }

  // FALLBACK: Auto Replies
  return autoReplies[replyIdx % autoReplies.length];
}

export default function ChatSupportPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [messages,     setMessages]     = useState<Message[]>([
    { 
      id: 1, 
      text: "👋 Hello! Welcome to the CLM Support Center. I can answer any questions about our Business Plan, including Basic Phase rules, Booster Upgrade, Carry Forward logic, Cuts, and Awards. How can I help you today?", 
      sender: "admin", 
      time: getTime() 
    },
  ]);
  const [input,        setInput]        = useState("");
  const [isTyping,     setIsTyping]     = useState(false);
  const [replyIdx,     setReplyIdx]     = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const processResponse = (userText: string) => {
    setIsTyping(true);

    setTimeout(() => {
      const reply = getBotReply(userText, replyIdx);
      setReplyIdx(prev => prev + 1);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: reply,
        sender: "admin",
        time: getTime(),
      }]);
    }, 800 + Math.random() * 600);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now(), text, sender: "user", time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    processResponse(text);
  };

  const handleQuickQuestion = (queryText: string) => {
    const userMsg: Message = { id: Date.now(), text: queryText, sender: "user", time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    processResponse(queryText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        .cs-root {
          font-family: 'Poppins', sans-serif;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,233,124,0.12) 0%, transparent 65%);
          min-height: 100vh;
          color: #fff;
        }

        /* GOLD BAR */
        .gold-bar { height:4px; background:linear-gradient(90deg, #ffe97c, #f0a500); }

        /* BREADCRUMB */
        .breadcrumb { padding:12px 20px; font-size:13px; color:rgba(255,233,124,0.7); display:flex; align-items:center; gap:6px; }
        .breadcrumb a { color:rgba(255,233,124,0.7); text-decoration:none; }
        .breadcrumb a:hover { color:#ffe97c; text-decoration:underline; }
        .breadcrumb .sep { color:rgba(255,233,124,0.4); }
        .breadcrumb .current { color:#ffe97c; font-weight:700; }

        /* PAGE BODY */
        .page-body {
          padding:0 20px 40px;
          display:flex; justify-content:center;
        }

        /* CHAT CARD */
        .chat-card {
          width:100%; max-width:680px;
          background: linear-gradient(135deg, #1d033a 0%, #110122 100%);
          border: 1.5px solid rgba(255,233,124,0.22);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(168,85,247,0.15);
        }

        /* CHAT HEADER */
        .chat-header {
          background: linear-gradient(90deg, #1d033a, #110122);
          border-bottom: 1.5px solid rgba(255,233,124,0.22);
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* Admin avatar circle */
        .admin-avatar-wrap {
          position:relative;
          flex-shrink:0;
        }
        .admin-avatar {
          width:58px; height:58px; border-radius:50%;
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          display:flex; align-items:center; justify-content:center;
          border: 2px solid rgba(255,255,255,0.2);
          overflow:hidden;
        }
        /* Online dot */
        .online-dot {
          position:absolute; bottom:2px; right:2px;
          width:14px; height:14px; border-radius:50%;
          background:#00ff88;
          border:2px solid #1a0533;
          box-shadow: 0 0 8px #00ff88;
        }

        .admin-info { flex:1; }
        .admin-name { font-size:17px; font-weight:800; color:#ffe97c; margin-bottom:2px; text-shadow: 0 0 6px rgba(255,233,124,0.25); }
        .admin-status { font-size:13px; color:rgba(0,255,136,0.9); font-weight:600; display:flex; align-items:center; gap:5px; }

        /* MESSAGES AREA */
        .messages-area {
          background: rgba(0,0,0,0.15);
          padding: 20px;
          min-height: 300px;
          max-height: 380px;
          overflow-y:auto;
          display:flex;
          flex-direction:column;
          gap:14px;
          scrollbar-width:thin;
          scrollbar-color: rgba(255,233,124,0.2) transparent;
        }
        .messages-area::-webkit-scrollbar { width:6px; }
        .messages-area::-webkit-scrollbar-thumb { background: rgba(255,233,124,0.25); border-radius:4px; }
        .messages-area::-webkit-scrollbar-thumb:hover { background: #ffe97c; }

        /* Message bubbles */
        .msg-row { display:flex; align-items:flex-end; gap:10px; }
        .msg-row.user { flex-direction:row-reverse; }

        .msg-avatar-sm {
          width:32px; height:32px; border-radius:50%;
          flex-shrink:0; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
          border: 1px solid rgba(255,233,124,0.2);
        }
        .msg-avatar-sm.admin-sm {
          background: linear-gradient(135deg, #1d033a, #110122);
        }
        .msg-avatar-sm.user-sm {
          background: linear-gradient(135deg, #a855f7, #7c3aed);
        }

        .msg-bubble {
          max-width:72%;
          padding:11px 16px;
          border-radius:18px;
          font-size:13.5px;
          line-height:1.5;
          word-break:break-word;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          white-space: pre-line;
        }

        /* CHIPS CONTAINER & CHIPS */
        .chips-container {
          display: flex;
          gap: 8px;
          padding: 12px 20px;
          overflow-x: auto;
          background: rgba(0,0,0,0.25);
          border-top: 1.5px solid rgba(255,233,124,0.15);
          scrollbar-width: none; /* Firefox */
        }
        .chips-container::-webkit-scrollbar {
          display: none; /* Safari and Chrome */
        }
        .chip-btn {
          background: rgba(255,233,124,0.06);
          border: 1px solid rgba(255,233,124,0.25);
          border-radius: 20px;
          color: #ffe97c;
          padding: 7px 14px;
          font-size: 12px;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .chip-btn:hover {
          background: rgba(255,233,124,0.18);
          border-color: #ffe97c;
          transform: translateY(-1px);
        }
        .chip-btn:active {
          transform: translateY(0);
        }

        .msg-bubble.admin {
          background: rgba(255, 255, 255, 0.08);
          color:#ffffff;
          border: 1px solid rgba(255,233,124,0.2);
          border-bottom-left-radius:4px;
        }
        .msg-bubble.user {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          color:#120228;
          font-weight: 600;
          border-bottom-right-radius:4px;
        }

        .msg-time {
          font-size:10px;
          color: rgba(255,233,124,0.55);
          margin-top:4px;
          white-space:nowrap;
        }
        .msg-col { display:flex; flex-direction:column; }
        .msg-col.user { align-items:flex-end; }

        /* Typing indicator */
        .typing-row { display:flex; align-items:center; gap:8px; }
        .typing-bubble {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255,233,124,0.2);
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          padding: 12px 18px;
          display: flex; align-items: center; gap: 5px;
        }
        .dot {
          width:6px; height:6px; border-radius:50%;
          background:#ffe97c;
          animation:bounce 1.2s infinite;
        }
        .dot:nth-child(2) { animation-delay:.2s; }
        .dot:nth-child(3) { animation-delay:.4s; }
        @keyframes bounce {
          0%,60%,100% { transform:translateY(0); }
          30% { transform:translateY(-5px); }
        }

        /* INPUT AREA */
        .input-area {
          background: rgba(0,0,0,0.25);
          border-top: 1.5px solid rgba(255,233,124,0.22);
          padding:14px 20px;
          display:flex;
          align-items:center;
          gap:12px;
        }

        .mic-btn {
          background:none; border:none; cursor:pointer;
          color: rgba(255,233,124,0.6); padding:6px; display:flex; align-items:center;
          transition: all 0.2s;
          flex-shrink:0;
        }
        .mic-btn:hover { color:#ffe97c; transform: scale(1.08); }

        .msg-input {
          flex:1;
          border:none;
          outline:none;
          font-size:14px;
          font-family:'Poppins',sans-serif;
          color:#fff;
          background:transparent;
        }
        .msg-input::placeholder { color:rgba(255,233,124,0.35); }

        .send-btn {
          background:none; border:none; cursor:pointer;
          color: rgba(255,233,124,0.45); padding:6px; display:flex; align-items:center;
          transition: all 0.2s, transform .15s;
          flex-shrink:0;
        }
        .send-btn:hover { color:#ffe97c; transform:scale(1.15); }
        .send-btn:active { transform:scale(0.96); }
        .send-btn.active { color:#ffe97c; filter: drop-shadow(0 0 8px rgba(255,233,124,0.5)); }
      `}</style>

      <div className="cs-root" onClick={() => dropdownOpen && setDropdownOpen(false)}>

        {/* NAVBAR COMPONENT */}
        <Navbar dropdownOpen={dropdownOpen} setDropdownOpen={setDropdownOpen} setActivePage={() => {}} />

        {/* Gold bar */}
        <div className="gold-bar" />

        {/* BREADCRUMB */}
        <div className="breadcrumb">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffe97c"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <a href="/dashboard">Home</a>
          <span className="sep">/</span>
          <span className="current">Support Center</span>
        </div>

        <div className="page-body">
          <div className="chat-card">

            {/* CHAT HEADER */}
            <div className="chat-header">
              <div className="admin-avatar-wrap">
                <div className="admin-avatar">
                  {/* Admin person SVG */}
                  <svg width="42" height="42" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="25" cy="18" rx="10" ry="11" fill="#120228"/>
                    <ellipse cx="25" cy="10" rx="10" ry="6" fill="#ffe97c"/>
                    <ellipse cx="16" cy="14" rx="4" ry="6" fill="#ffe97c"/>
                    <ellipse cx="34" cy="14" rx="4" ry="6" fill="#ffe97c"/>
                    <path d="M10 45 Q12 33 25 31 Q38 33 40 45 Z" fill="#120228"/>
                    <rect x="22" y="30" width="6" height="16" fill="#ffe97c" opacity="0.4"/>
                  </svg>
                </div>
                <div className="online-dot" />
              </div>
              <div className="admin-info">
                <div className="admin-name">Support Center</div>
                <div className="admin-status">🟢 Active Now</div>
              </div>
            </div>

            {/* MESSAGES */}
            <div className="messages-area">
              {messages.map((msg) => (
                <div key={msg.id} className={`msg-row ${msg.sender}`}>
                  <div className={`msg-avatar-sm ${msg.sender === "admin" ? "admin-sm" : "user-sm"}`}>
                    {msg.sender === "admin" ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffe97c" opacity="0.9">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" opacity="0.9">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    )}
                  </div>
                  <div className={`msg-col ${msg.sender}`}>
                    <div className={`msg-bubble ${msg.sender}`}>{msg.text}</div>
                    <span className="msg-time">{msg.time}</span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="typing-row">
                  <div className="msg-avatar-sm admin-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffe97c" opacity="0.9">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                    </svg>
                  </div>
                  <div className="typing-bubble">
                    <div className="dot" />
                    <div className="dot" />
                    <div className="dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* QUICK SUGGESTIONS CHIPS */}
            <div className="chips-container">
              {quickQuestions.map((q, idx) => (
                <button 
                  key={idx}
                  className="chip-btn"
                  onClick={() => handleQuickQuestion(q.query)}
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* INPUT AREA */}
            <div className="input-area">
              {/* Mic icon */}
              <button className="mic-btn" title="Voice message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                className="msg-input"
                type="text"
                placeholder="Enter Message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />

              {/* Send icon */}
              <button
                className={`send-btn ${input.trim() ? "active" : ""}`}
                onClick={sendMessage}
                title="Send"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}