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

const autoReplies = [
  "Thank you for contacting support. How can I assist you today?",
  "We have received your message and will get back to you shortly.",
  "Our team is looking into your issue. Please hold on.",
  "Could you please provide more details about your concern?",
  "Your issue has been noted. We will resolve it within 24 hours.",
];

export default function ChatSupportPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [messages,     setMessages]     = useState<Message[]>([
    { id: 1, text: "Hello! How can I help you today?", sender: "admin", time: getTime() },
  ]);
  const [input,        setInput]        = useState("");
  const [isTyping,     setIsTyping]     = useState(false);
  const [replyIdx,     setReplyIdx]     = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { id: Date.now(), text, sender: "user", time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const reply = autoReplies[replyIdx % autoReplies.length];
      setReplyIdx(i => i + 1);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: reply,
        sender: "admin",
        time: getTime(),
      }]);
    }, 1200 + Math.random() * 800);
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