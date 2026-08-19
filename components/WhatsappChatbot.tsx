'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Send } from 'lucide-react';

interface Message {
  id: string;
  from: 'bot' | 'user';
  text: string;
  time: string;
  quickReplies?: QuickReply[];
}

interface QuickReply {
  label: string;
  value: string;
}

const AGENT_NAME = 'CLM Support';
const AGENT_SUBTITLE = 'Change Life Marketing • Typically replies instantly';
const WA_NUMBER = '918544167221';

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  from: 'bot',
  text: `🙏 *Namaste! Welcome to Change Life Marketing*\n\nEmpowering individuals through natural health products & sustainable business opportunities.\n\nHow can we help you today?`,
  time: getTime(),
  quickReplies: [
    { label: '🚀 Join Kaise Kare', value: 'join' },
    { label: '💰 Business Plan & Income', value: 'business' },
    { label: '🌿 Products Info', value: 'products' },
    { label: '🏆 Ranks & Awards', value: 'ranks' },
    { label: '📚 Training & Support', value: 'training' },
    { label: '👤 Talk to Team Leader', value: 'leader' },
  ],
};

const BOT_RESPONSES: Record<string, { text: string; quickReplies?: QuickReply[] }> = {
  greeting: {
    text: `🙏 *Namaste! Kaise hain aap?*\n\nChange Life Marketing chatbot mein aapka swagat hai! Main aapki kya sahayata kar sakta hoon?\n\nAap niche diye gaye topics chun sakte hain ya koi bhi sawal type kar sakte hain! 😊`,
    quickReplies: WELCOME_MESSAGE.quickReplies,
  },
  about: {
    text: `🏛️ *About Change Life Marketing*\n\nChange Life Marketing is a 100% legal, GST registered & MSME certified direct selling organisation focused on natural health products & business opportunities.\n\n✨ *100% Legal & Govt Certified*\n✨ *Lab-Tested Health Products*\n✨ *High-Income Business Opportunity*\n\nHamara Lakshya: Health + Wealth for Everyone! 🌟`,
    quickReplies: [
      { label: '🚀 Join Kaise Kare', value: 'join' },
      { label: '💰 Business Plan', value: 'business' },
      { label: '👤 Talk to Team Leader', value: 'leader' },
      { label: '🔙 Main Menu', value: 'menu' },
    ],
  },
  join: {
    text: `🚀 *Join Kaise Kare / Registration*\n\n✅ *No Joining Fee* — Bilkul Free!\n✅ Sirf ek product purchase se shuru karo\n✅ Turant ID milegi\n✅ Same day activation\n\n📋 *Required Documents:*\n• Aadhar Card\n• PAN Card\n• Bank Account Details\n• Passport Size Photo\n\n🏛️ GST Registered & MSME Certified company — 100% Legal & Transparent!\n\nAaj hi join karo aur apni journey shuru karo! 🌟`,
    quickReplies: [
      { label: '💬 Register on WhatsApp', value: 'whatsapp' },
      { label: '💰 Business Plan Dekhein', value: 'business' },
      { label: '🔙 Main Menu', value: 'menu' },
    ],
  },
  business: {
    text: `💰 *Business Plan & Income (Double Phase)*\n\nChange Life Marketing aapke liye laaya hai sabse solid high-payout income plan:\n\n1️⃣ *Phase 1 — Basic Level:*\n• Har Matching Pair pe: *₹1,000*\n• Capping: *1 pair per session* (₹2,000 Daily Max)\n• Cut Pairs: Pair sequence *#3, #6, #9, & #12* subject to system cuts (₹0 payout)\n• Carry Forward: No carry-forward, session close pe flash-out hota hai.\n\n2️⃣ *Phase 2 — Booster Level:*\n• Har matching pair pe: *₹1,000*\n• Capping: *10 pairs per session* (₹10,000 per session / ₹20,000 Daily Max!)\n• Carry Forward: Unpaired units permanently *carry forward indefinitely*!\n• Cuts: *No cuts applied* on Booster pairs!\n• Qualification: Complete 12 valid Basic sessions to upgrade to Booster.\n\n📈 Stable calculations and automated payouts at the end of each session window!`,
    quickReplies: [
      { label: '🏆 Ranks Dekhein', value: 'ranks' },
      { label: '💬 Full Plan WhatsApp pe', value: 'whatsapp' },
      { label: '🔙 Main Menu', value: 'menu' },
    ],
  },
  products: {
    text: `🌿 *Natural Health Products*\n\n✨ *100% Natural Ingredients*\n✨ Lab Tested & Quality Certified\n✨ No Side Effects\n\n🛒 *Product Categories:*\n• 💊 Health Supplements\n• 🌱 Herbal Wellness Products\n• 💪 Immunity Boosters\n• 🧴 Personal Care Range\n• 🍵 Nutritional Drinks\n\n🏆 *Why Our Products?*\n✅ Premium Quality\n✅ Affordable Pricing\n✅ Direct from Manufacturer\n✅ Home Delivery Available\n\nHealth + Wealth — dono saath! 🌟`,
    quickReplies: [
      { label: '💬 Product List WhatsApp pe', value: 'whatsapp' },
      { label: '🚀 Join Karo', value: 'join' },
      { label: '🔙 Main Menu', value: 'menu' },
    ],
  },
  ranks: {
    text: `🏆 *Booster Awards & Ranks System*\n\nHamare Booster Level achievers ke liye special Rewards & Recognition:\n\n⚠️ *Dhyan dein:* Awards progressive and non-cumulative (fresh pairs basis) par work karte hain. Har rank ke naye matches complete hone par picche matched pairs consume ho jaate hain.\n\n🥇 *1. Gold Rank* (5 Pairs) ➔ Bag + Business Kit\n🥈 *2. Super Gold* (10 Pairs) ➔ Smart Watch (Gold ke baad 10 fresh pairs matches. Lifetime = 15 matched pairs)\n🎖️ *3. Gold Star* (25 Pairs) ➔ Suit Length (Super Gold ke baad 25 fresh matches. Lifetime = 40 matched pairs)\n🔮 *4. Pearl Ex* (50 Pairs) ➔ Mixer Grinder (50 fresh matches. Lifetime = 90 matched pairs)\n💚 *5. Emerald* (100 Pairs) ➔ Refrigerator (100 fresh matches. Lifetime = 190 matched pairs)\n❤️ *6. Ruby* (200 Pairs) ➔ Mobile Phone (200 fresh matches)\n💻 *7. Platinum* (500 Pairs) ➔ Laptop (500 fresh matches)\n🏍️ *8. Diamond* (1000 Pairs) ➔ Motorcycle (1000 fresh matches)\n💎 *9. Double Diamond* (2000 Pairs) ➔ ₹1.5 Lakh Gift\n⬛ *10. Black Diamond* (4000 Pairs) ➔ ₹2.5 Lakh Gift\n🔵 *11. Blue Diamond* (8000 Pairs) ➔ ₹5 Lakh Gift\n👑 *12. Royal Diamond* (16000 Pairs) ➔ ₹7.5 Lakh Gift\n🏆 *13. Crown Diamond* (32000 Pairs) ➔ ₹10 Lakh Gift!\n\nAll awards are credited automatically as your fresh matching count grows! 🎁`,
    quickReplies: [
      { label: '💰 Business Plan Dekhein', value: 'business' },
      { label: '💬 More Details WhatsApp pe', value: 'whatsapp' },
      { label: '🔙 Main Menu', value: 'menu' },
    ],
  },
  training: {
    text: `📚 *Training & Support System*\n\n🎓 *Free Training Provided:*\n• Product Knowledge Sessions\n• Business Plan Training\n• Team Building Workshops\n• Online & Offline Seminars\n• Weekly Zoom Meetings\n\n📱 *Support Channels:*\n• WhatsApp Group Support\n• Personal Mentor Assigned\n• Marketing Materials Free\n• Social Media Training\n• Mobile App Access\n\n🤝 *We believe in:*\n"Your Success = Our Success"\n\nHar step pe hamari team aapke saath hai! 💪`,
    quickReplies: [
      { label: '💬 Training Schedule WhatsApp pe', value: 'whatsapp' },
      { label: '👤 Team Leader se Baat Karo', value: 'leader' },
      { label: '🔙 Main Menu', value: 'menu' },
    ],
  },
  leader: {
    text: `👤 *Talk to Our Team Leader*\n\nHamara senior team leader personally aapki help karega.\n\n🧑‍💼 *Mr Prem Kumar*\nBusiness Coach And Company Pramoter\n10+ years experience\n\n⏰ Available: Mon–Sat, 9AM–8PM\n📱 WhatsApp: +91 8544167221\n\nClick below to directly connect on WhatsApp — we respond within 5 minutes! 🚀`,
    quickReplies: [
      { label: '💬 Open WhatsApp', value: 'whatsapp' },
      { label: '🚀 Join Karo', value: 'join' },
      { label: '🔙 Main Menu', value: 'menu' },
    ],
  },
  menu: {
    text: `Aur kaise help kar sakta hoon aapki? 😊`,
    quickReplies: WELCOME_MESSAGE.quickReplies,
  },
  whatsapp: {
    text: `WhatsApp pe connect ho rahe hain... 🚀\n\nHamari team 5 minutes mein reply karegi.\n\nChange Life Marketing mein aapka swagat hai! 🌟`,
  },
  default: {
    text: `Aapka sawal samajhne mein thodi dikkat hui. 😊\n\nAap niche diye gaye main options chun sakte hain ya direct WhatsApp par team leader se baat kar sakte hain!`,
    quickReplies: [
      { label: '💬 Talk on WhatsApp', value: 'whatsapp' },
      ...(WELCOME_MESSAGE.quickReplies || []),
    ],
  },
};

function matchIntent(userText: string): string {
  const text = userText.toLowerCase().trim();

  // Greetings: hi, hello, helloe, hey, namaste, gm, etc.
  if (
    /^(hi+|hello+|helo+|helloe+|hey+|hye+|namaste+|namaskar+|hallo+|gm|gn|good\s*morning|good\s*evening|kaise\s*ho|kaise\s*h|kya\s*haal|who\s*are\s*you)/i.test(text) ||
    text === 'hi' ||
    text === 'hello' ||
    text === 'hey' ||
    text === 'namaste' ||
    text === 'helloe'
  ) {
    return 'greeting';
  }

  // Join / Registration / Start
  if (/(join|register|registration|id\b|sign\s*up|signup|kaise\s*start|start\s*kare|document|joining|account)/i.test(text)) {
    return 'join';
  }

  // Business Plan / Income / Payout / Commission / Pair
  if (/(business|plan|income|earning|payout|pair|capping|booster|basic|paisa|money|commission|rates|math)/i.test(text)) {
    return 'business';
  }

  // Products / Supplements / Price / Delivery
  if (/(product|item|supplement|herbal|health|dawa|dawai|medicine|price|catalogue|delivery|order|rate)/i.test(text)) {
    return 'products';
  }

  // Ranks / Awards / Rewards / Laptop / Bike / Diamond
  if (/(rank|award|reward|gift|bike|car|laptop|diamond|gold|star|trophy|prize)/i.test(text)) {
    return 'ranks';
  }

  // Training / Support / Zoom / Learn
  if (/(training|support|meeting|zoom|learn|seekho|guide|class|help|assist)/i.test(text)) {
    return 'training';
  }

  // Leader / Contact / Call / Phone
  if (/(leader|contact|talk|speak|call|phone|number|prem|human|owner|sir|baat|person|agent)/i.test(text)) {
    return 'leader';
  }

  // About / Legal / Company / GST / Address
  if (/(about|company|legal|gst|msme|real|fake|office|address|location|details)/i.test(text)) {
    return 'about';
  }

  // WhatsApp
  if (/(whatsapp|wa\b|chat\b)/i.test(text)) {
    return 'whatsapp';
  }

  return 'default';
}

export default function ChangeLifeMarketingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const t = setTimeout(() => setShowPulse(true), 3000);
    return () => clearTimeout(t);
  }, []);

  function openChat() {
    setIsOpen(true);
    setShowPulse(false);
  }

  function sendUserMessage(text: string, value?: string) {
    const userMsg: Message = { id: makeId(), from: 'user', text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const botMsg: Message = {
        id: makeId(),
        from: 'bot',
        text: BOT_RESPONSES.whatsapp.text,
        time: getTime(),
      };
      setMessages(prev => [...prev, botMsg]);

      const waMsg = text
        ? `Namaste! ${text}`
        : 'Namaste! Main Change Life Marketing ke baare mein jaanna chahta hoon.';

      window.open(
        `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waMsg)}`,
        '_blank'
      );
    }, 600);
  }

  function handleSend() {
    if (!inputVal.trim()) return;
    sendUserMessage(inputVal.trim());
    setInputVal('');
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSend();
  }

  function formatText(text: string) {
    return text.split('\n').map((line, i, arr) => {
      const parts = line.split(/\*([^*]+)\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          )}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });
  }

  const GREEN = '#0A6E5A';
  const LIGHT_GREEN = '#0d8a70';
  const GOLD = '#C9A84C';
  const WHITE = '#FFFFFF';

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
        onClick={openChat}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9999,
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${GREEN}, ${LIGHT_GREEN})`,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 24px rgba(10,110,90,0.5)`,
        }}
      >
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
          <path d="M16 3C8.82 3 3 8.82 3 16c0 2.32.64 4.5 1.75 6.37L3 29l6.82-1.73A12.93 12.93 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm0 23.5a10.44 10.44 0 01-5.32-1.46l-.38-.23-3.95 1.04 1.05-3.84-.25-.4A10.5 10.5 0 1116 26.5zm5.77-7.87c-.32-.16-1.87-.92-2.16-1.02-.29-.1-.5-.16-.71.16-.21.32-.82 1.02-1 1.23-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.5.14-.66.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.55-.08-.16-.71-1.71-.97-2.34-.26-.61-.52-.53-.71-.54l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.07-1.1 2.61s1.13 3.03 1.29 3.24c.16.21 2.23 3.4 5.4 4.77.75.33 1.34.52 1.8.66.76.24 1.45.21 2 .13.61-.09 1.87-.77 2.13-1.5.26-.74.26-1.37.18-1.5-.08-.13-.29-.21-.61-.37z" />
        </svg>

        <AnimatePresence>
          {showPulse && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '1rem',
                height: '1rem',
                borderRadius: '50%',
                backgroundColor: '#FF3B3B',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.5rem',
                color: 'white',
                fontWeight: 700,
              }}
            >
              1
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              bottom: '6.5rem',
              right: '1.5rem',
              zIndex: 9998,
              width: 'min(390px, calc(100vw - 2rem))',
              height: 'min(600px, calc(100vh - 8rem))',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: `0 20px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(10,110,90,0.2)`,
              fontFamily: '"Roboto", "Segoe UI", system-ui, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{
              background: `linear-gradient(135deg, ${GREEN} 0%, ${LIGHT_GREEN} 100%)`,
              borderBottom: `1px solid rgba(201,168,76,0.3)`,
              padding: '0.875rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexShrink: 0,
            }}>
              {/* Avatar */}
              <div style={{
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: '50%',
                background: `rgba(255,255,255,0.15)`,
                border: `2px solid rgba(201,168,76,0.5)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
                position: 'relative',
              }}>
                🌿
                <div style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '0.6rem',
                  height: '0.6rem',
                  borderRadius: '50%',
                  backgroundColor: '#25D366',
                  border: `2px solid ${GREEN}`,
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  color: GOLD,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  margin: 0,
                  lineHeight: 1.2,
                  fontFamily: '"Fraunces", Georgia, serif',
                  letterSpacing: '0.01em',
                }}>
                  {AGENT_NAME}
                </p>
                <p style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.68rem',
                  margin: 0,
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  letterSpacing: '0.02em',
                }}>
                  {AGENT_SUBTITLE}
                </p>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: `rgba(255,255,255,0.8)`, padding: '0.25rem',
                  display: 'flex', alignItems: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = WHITE)}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              >
                <ChevronDown size={20} />
              </button>
            </div>
            {/* Chat Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 0.75rem',
              backgroundColor: '#F0F7F4',
              backgroundImage: `
                radial-gradient(ellipse at 10% 80%, rgba(10,110,90,0.06) 0%, transparent 50%),
                radial-gradient(ellipse at 90% 10%, rgba(201,168,76,0.05) 0%, transparent 50%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230A6E5A' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
              `,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {/* Date stamp */}
              <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                <span style={{
                  background: 'rgba(10,110,90,0.1)',
                  color: GREEN,
                  fontSize: '0.65rem',
                  padding: '0.2rem 0.9rem',
                  borderRadius: '0.75rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  border: `1px solid rgba(10,110,90,0.15)`,
                  fontWeight: 600,
                }}>
                  TODAY
                </span>
              </div>

              {messages.map((msg) => (
                <div key={msg.id}>
                  <div style={{
                    display: 'flex',
                    justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start',
                  }}>
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        maxWidth: '83%',
                        backgroundColor: msg.from === 'user'
                          ? `#DCF8C6`
                          : WHITE,
                        borderRadius: msg.from === 'user'
                          ? '0.875rem 0.875rem 0 0.875rem'
                          : '0.875rem 0.875rem 0.875rem 0',
                        padding: '0.55rem 0.8rem 0.35rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        border: msg.from === 'bot'
                          ? `1px solid rgba(10,110,90,0.08)`
                          : 'none',
                      }}
                    >
                      <p style={{
                        margin: 0,
                        fontSize: '0.84rem',
                        lineHeight: '1.5',
                        color: '#1a1a1a',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {formatText(msg.text)}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '0.2rem',
                        marginTop: '3px',
                      }}>
                        <span style={{ fontSize: '0.62rem', color: '#888' }}>{msg.time}</span>
                        {msg.from === 'user' && (
                          <svg viewBox="0 0 16 11" width="14" height="10" fill={GREEN} opacity="0.7">
                            <path d="M11.071.653a.75.75 0 00-1.142.972L11.64 3.5H6.75a.75.75 0 000 1.5h4.89l-1.711 1.875a.75.75 0 101.142.972l2.75-3.016a.75.75 0 000-.972L11.07.653zM1 3.5a.75.75 0 000 1.5h2a.75.75 0 000-1.5H1z" />
                          </svg>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {/* Quick Replies */}
                  {msg.quickReplies && msg.from === 'bot' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.4rem',
                        marginTop: '0.4rem',
                        paddingLeft: '0.25rem',
                      }}
                    >
                      {msg.quickReplies.map((qr) => (
                        <button
                          key={qr.value}
                          onClick={() => sendUserMessage(qr.label, qr.value)}
                          style={{
                            backgroundColor: WHITE,
                            border: `1px solid rgba(10,110,90,0.35)`,
                            color: GREEN,
                            fontSize: '0.73rem',
                            fontWeight: 600,
                            padding: '0.3rem 0.65rem',
                            borderRadius: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => {
                            const btn = e.target as HTMLButtonElement;
                            btn.style.backgroundColor = GREEN;
                            btn.style.color = WHITE;
                          }}
                          onMouseLeave={e => {
                            const btn = e.target as HTMLButtonElement;
                            btn.style.backgroundColor = WHITE;
                            btn.style.color = GREEN;
                          }}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                  >
                    <div style={{
                      backgroundColor: WHITE,
                      borderRadius: '0.875rem 0.875rem 0.875rem 0',
                      padding: '0.65rem 1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: `1px solid rgba(10,110,90,0.08)`,
                      display: 'flex',
                      gap: '4px',
                      alignItems: 'center',
                    }}>
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                          style={{
                            width: '7px', height: '7px',
                            borderRadius: '50%',
                            backgroundColor: GREEN,
                            opacity: 0.6,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div style={{
              backgroundColor: WHITE,
              padding: '0.6rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              flexShrink: 0,
              borderTop: `1px solid rgba(10,110,90,0.12)`,
            }}>
              <input
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  border: `1px solid rgba(10,110,90,0.2)`,
                  borderRadius: '1.5rem',
                  padding: '0.55rem 1rem',
                  fontSize: '0.85rem',
                  backgroundColor: '#F9FFFE',
                  outline: 'none',
                  fontFamily: 'inherit',
                  color: '#1a1a1a',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = `rgba(10,110,90,0.5)`)}
                onBlur={e => (e.target.style.borderColor = `rgba(10,110,90,0.2)`)}
              />

              <button
                onClick={handleSend}
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${GREEN}, ${LIGHT_GREEN})`,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: `0 2px 10px rgba(10,110,90,0.35)`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.boxShadow = `0 4px 16px rgba(10,110,90,0.5)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = `0 2px 10px rgba(10,110,90,0.35)`;
                }}
              >
                <Send size={15} color="white" />
              </button>
            </div>

            {/* Footer */}
            <div style={{
              backgroundColor: WHITE,
              textAlign: 'center',
              padding: '0.3rem',
              borderTop: `1px solid rgba(10,110,90,0.08)`,
            }}>
              <span style={{
                fontSize: '0.62rem',
                color: `rgba(10,110,90,0.5)`,
                letterSpacing: '0.05em',
              }}>
                🌿 Change Life Marketing · GST & MSME Certified
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}