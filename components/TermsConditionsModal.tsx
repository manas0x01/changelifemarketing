"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface TermsConditionsModalProps {
  /** localStorage key to track acceptance */
  storageKey: string;
  /** Variant controls contextual messaging */
  variant?: "registration" | "dashboard" | "checkout" | "welcomekit" | "default";
}

export default function TermsConditionsModal({
  storageKey,
  variant = "default",
}: TermsConditionsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    // Check if user has already accepted
    const accepted = localStorage.getItem(storageKey);
    if (!accepted) {
      setIsVisible(true);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [storageKey]);

  const handleClose = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    document.body.style.overflow = "";
  };

  const handleProceed = () => {
    if (!isChecked) return;
    handleClose();
  };

  if (!isVisible) return null;

  const getContextMessage = () => {
    switch (variant) {
      case "registration":
        return {
          en: "Before registering a new member, please read and understand the company's terms, conditions, and policies carefully.",
          hi: "नया सदस्य पंजीकृत करने से पहले, कृपया कंपनी के नियम, शर्तें और नीतियों को ध्यानपूर्वक पढ़ें और समझें।",
        };
      case "dashboard":
        return {
          en: "Welcome! Please review the company's important notice and terms before proceeding.",
          hi: "स्वागत है! आगे बढ़ने से पहले कृपया कंपनी की महत्वपूर्ण सूचना और शर्तों की समीक्षा करें।",
        };
      case "checkout":
        return {
          en: "Before making a payment, please read the important payment notice below.",
          hi: "भुगतान करने से पहले, कृपया नीचे दी गई महत्वपूर्ण भुगतान सूचना पढ़ें।",
        };
      case "welcomekit":
        return {
          en: "Before downloading your Welcome Kit, please review the company's terms and conditions.",
          hi: "अपना वेलकम किट डाउनलोड करने से पहले, कृपया कंपनी के नियम और शर्तों की समीक्षा करें।",
        };
      default:
        return {
          en: "Please review the company's important notice and terms before proceeding.",
          hi: "आगे बढ़ने से पहले कृपया कंपनी की महत्वपूर्ण सूचना और शर्तों की समीक्षा करें।",
        };
    }
  };

  const contextMsg = getContextMessage();

  return (
    <>
      <style>{`
        .tandc-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(6px);
          padding: 16px;
          animation: tandc-fadeIn 0.3s ease-out;
        }

        @keyframes tandc-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tandc-slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .tandc-modal {
          background: #ffffff;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05);
          animation: tandc-slideUp 0.35s ease-out;
          position: relative;
        }

        /* Header */
        .tandc-header {
          background: linear-gradient(135deg, #0A6E5A 0%, #085a49 100%);
          padding: 20px 24px;
          border-radius: 16px 16px 0 0;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .tandc-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 20;
          line-height: 1;
        }

        .tandc-close-btn:hover {
          background: rgba(255, 255, 255, 0.35);
          transform: scale(1.08);
        }


        .tandc-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            45deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 1px,
            transparent 20px
          );
          pointer-events: none;
        }

        .tandc-header-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 50%;
          margin-bottom: 10px;
        }

        .tandc-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .tandc-header p {
          margin: 6px 0 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.5;
        }

        /* Body */
        .tandc-body {
          padding: 20px 24px;
        }

        /* Context message */
        .tandc-context {
          background: #FFF8E1;
          border: 1px solid #FFE082;
          border-left: 4px solid #C9A84C;
          border-radius: 8px;
          padding: 14px 16px;
          margin-bottom: 16px;
        }

        .tandc-context p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #5D4037;
        }

        .tandc-context p + p {
          margin-top: 6px;
          color: #6D4C41;
          font-style: italic;
        }

        /* Image */
        .tandc-image-wrap {
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid #e0e0e0;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        .tandc-image-wrap img {
          width: 100%;
          height: auto;
          display: block;
        }

        /* Notice box */
        .tandc-notice {
          background: linear-gradient(135deg, #FFF3E0, #FFF8E1);
          border: 1.5px solid #FFB74D;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
        }

        .tandc-notice-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #E65100;
        }

        .tandc-notice-title svg {
          flex-shrink: 0;
        }

        .tandc-notice-text {
          font-size: 13px;
          line-height: 1.7;
          color: #4E342E;
          margin: 0;
        }

        .tandc-notice-text + .tandc-notice-text {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px dashed rgba(255, 152, 0, 0.3);
          color: #5D4037;
        }

        .tandc-notice-text strong {
          color: #BF360C;
        }

        /* Checkbox */
        .tandc-checkbox-wrap {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: #F5F7F6;
          border: 1.5px solid #0A6E5A30;
          border-radius: 10px;
          margin-bottom: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tandc-checkbox-wrap:hover {
          border-color: #0A6E5A60;
          background: #EFF5F3;
        }

        .tandc-checkbox-wrap.checked {
          border-color: #0A6E5A;
          background: #E8F5E9;
        }

        .tandc-checkbox {
          width: 22px;
          height: 22px;
          border: 2px solid #999;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          transition: all 0.2s;
          background: #fff;
        }

        .tandc-checkbox.checked {
          background: #0A6E5A;
          border-color: #0A6E5A;
        }

        .tandc-checkbox-label {
          font-size: 13px;
          line-height: 1.6;
          color: #333;
          user-select: none;
        }

        .tandc-checkbox-label span {
          display: block;
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        /* T&C Link */
        .tandc-link {
          text-align: center;
          margin-bottom: 16px;
        }

        .tandc-link a {
          font-size: 13px;
          color: #0A6E5A;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        .tandc-link a:hover {
          color: #085a49;
        }

        /* Proceed button */
        .tandc-proceed-btn {
          width: 100%;
          padding: 14px 24px;
          border: none;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.3px;
        }

        .tandc-proceed-btn.active {
          background: linear-gradient(135deg, #0A6E5A, #085a49);
          color: #ffffff;
          box-shadow: 0 4px 16px rgba(10, 110, 90, 0.35);
        }

        .tandc-proceed-btn.active:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(10, 110, 90, 0.45);
        }

        .tandc-proceed-btn.disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
        }

        /* Desktop vs Mobile notice toggles */
        .tandc-notice-mobile {
          display: none;
        }

        .tandc-notice-desktop {
          display: block;
        }

        /* Responsive Mobile Layout */
        @media (max-width: 640px) {
          .tandc-overlay {
            padding: 10px;
          }

          .tandc-modal {
            max-height: 94vh;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          }

          .tandc-header {
            padding: 12px 14px;
            border-radius: 14px 14px 0 0;
          }

          .tandc-header h2 {
            font-size: 15px;
          }

          .tandc-header p {
            font-size: 11px;
            margin-top: 2px;
          }

          .tandc-header-icon {
            width: 32px;
            height: 32px;
            margin-bottom: 4px;
          }

          .tandc-body {
            padding: 12px 14px;
            overflow-y: visible;
          }

          /* Hide large banner image and context message on mobile to avoid vertical scrolling */
          .tandc-image-wrap,
          .tandc-context {
            display: none !important;
          }

          .tandc-notice-desktop {
            display: none !important;
          }

          .tandc-notice-mobile {
            display: block !important;
          }

          .tandc-notice {
            padding: 10px 12px;
            margin-bottom: 10px;
            border-radius: 8px;
          }

          .tandc-notice-title {
            font-size: 12px;
            margin-bottom: 4px;
          }

          .tandc-link {
            margin-bottom: 10px;
          }

          .tandc-link a {
            font-size: 11px;
          }

          .tandc-checkbox-wrap {
            padding: 10px 12px;
            margin-bottom: 10px;
            gap: 8px;
            border-radius: 8px;
          }

          .tandc-checkbox {
            width: 18px;
            height: 18px;
            margin-top: 1px;
          }

          .tandc-checkbox-label {
            font-size: 11px;
            line-height: 1.35;
          }

          .tandc-checkbox-label span {
            font-size: 10px;
            margin-top: 1px;
          }

          .tandc-close-btn {
            top: 10px;
            right: 10px;
            width: 28px;
            height: 28px;
            font-size: 14px;
          }

          .tandc-proceed-btn {
            font-size: 13.5px;
            padding: 10px 16px;
            border-radius: 8px;
          }
        }
      `}</style>

      <div className="tandc-overlay">
        <div className="tandc-modal">
          {/* Header */}
          <div className="tandc-header">
            <button
              className="tandc-close-btn"
              onClick={handleClose}
              aria-label="Close Notice"
              title="Close Notice"
            >
              ✕
            </button>
            <div className="tandc-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h2>⚠️ Important Notice / महत्वपूर्ण सूचना</h2>
            <p>Change Life Marketing — Terms & Conditions</p>
          </div>

          {/* Body */}
          <div className="tandc-body">
            {/* Context Message */}
            <div className="tandc-context">
              <p>🔔 {contextMsg.en}</p>
              <p>🔔 {contextMsg.hi}</p>
            </div>

            {/* T&C Image */}
            <div className="tandc-image-wrap">
              <img
                src="/images/tandc.jpeg"
                alt="Change Life Marketing - Terms and Conditions / नियम और शर्तें"
                loading="eager"
              />
            </div>

            {/* Notice */}
            <div className="tandc-notice">
              <div className="tandc-notice-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Formal Notice / औपचारिक सूचना
              </div>

              {/* Desktop Notice */}
              <div className="tandc-notice-desktop">
                <p className="tandc-notice-text">
                  <strong>English:</strong> The company only charges <strong>₹1,299 per ID</strong> for a health product pack along with 1000 BV. Do not make any payment more than ₹1,299 per ID. If anyone asks for ₹5,000, ₹10,000, ₹20,000, ₹50,000 or any other additional amount, <strong>do not pay</strong>. Change Life Marketing is not responsible for any private transactions. By registration, you are considered to have read, understood and agreed to the company&apos;s policies and terms.
                </p>
                <p className="tandc-notice-text">
                  <strong>हिंदी:</strong> कंपनी एक हेल्थ प्रोडक्ट पैक के लिए प्रति ID केवल <strong>₹1,299</strong> लेती है, साथ में 1000 BV मिलता है। प्रति ID ₹1,299 से अधिक कोई भी भुगतान न करें। यदि कोई व्यक्ति ₹5,000, ₹10,000, ₹20,000, ₹50,000 या कोई अन्य अतिरिक्त राशि मांगता है, तो <strong>भुगतान न करें</strong>। Change Life Marketing किसी भी निजी लेनदेन के लिए जिम्मेदार नहीं है। पंजीकरण करने पर, यह माना जाएगा कि आपने कंपनी की नीतियों और शर्तों को पढ़, समझ और स्वीकार कर लिया है।
                </p>
              </div>

              {/* Mobile Short Notice */}
              <div className="tandc-notice-mobile">
                <p style={{ margin: 0, fontWeight: 600 }}>
                  📌 <strong>English:</strong> Company fee is strictly <strong>₹1,299 per ID</strong> (1000 BV). Do not pay more to anyone.
                </p>
                <p style={{ margin: "4px 0 0", fontWeight: 600, color: "#5D4037" }}>
                  📌 <strong>हिंदी:</strong> प्रति ID शुल्क केवल <strong>₹1,299</strong> (1000 BV) है। किसी को भी इससे अधिक न दें।
                </p>
              </div>
            </div>

            {/* T&C Link */}
            <div className="tandc-link">
              <Link href="/terms" target="_blank">
                📄 Read Full Terms & Conditions / पूर्ण नियम और शर्तें पढ़ें →
              </Link>
            </div>

            {/* Checkbox */}
            <div
              className={`tandc-checkbox-wrap ${isChecked ? "checked" : ""}`}
              onClick={() => setIsChecked(!isChecked)}
            >
              <div className={`tandc-checkbox ${isChecked ? "checked" : ""}`}>
                {isChecked && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="tandc-checkbox-label">
                I have read and agree to all the Terms & Conditions of Change Life Marketing.
                <span>मैंने Change Life Marketing के सभी नियम और शर्तें पढ़ ली हैं और मैं सहमत हूँ।</span>
              </div>
            </div>

            {/* Proceed Button */}
            <button
              className={`tandc-proceed-btn ${isChecked ? "active" : "disabled"}`}
              onClick={handleProceed}
              disabled={!isChecked}
            >
              {isChecked ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Proceed / आगे बढ़ें
                </>
              ) : (
                "Please accept the Terms & Conditions to proceed"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

