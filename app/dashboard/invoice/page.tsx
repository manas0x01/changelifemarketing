"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import html2pdf from "html2pdf.js";
import { useSidebar } from "@/context/SidebarContext";

export default function TaxInvoicePage() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const { toggleSidebar } = useSidebar();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!invoiceRef.current) return;

    const element = invoiceRef.current;
    const opt = {
      margin: [0.2, 0, 0.2, 0] as [number, number, number, number], // top, left, bottom, right
      filename: `Invoice_${userData?.username || 'CLM'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794
      },
      jsPDF: { unit: 'in', format: 'a4' as const, orientation: 'portrait' as const },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const url = userIdParam
          ? `/api/user/getprofile?userId=${userIdParam}`
          : "/api/user/getprofile";

        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const result = await response.json();
        if (result.success) {
          setUserData(result.user);
        } else {
          setError(result.message || "Failed to load user profile");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userIdParam]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#e8e8e8' }}>Loading Invoice...</div>;
  if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#e8e8e8', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="invoice-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Lato:wght@400;700;900&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .invoice-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          min-height: 100vh;
          background: #1a0533;
          background-image:
            radial-gradient(ellipse 80% 50% at 20% 0%, rgba(168,85,247,0.2) 0%, transparent 65%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(255,233,124,0.12) 0%, transparent 65%);
          padding: 0 0 40px 0;
          font-family: 'Lato', sans-serif;
          gap: 20px;
          width: 100%;
          overflow-x: hidden;
        }

        /* ── TOP NAV BAR ── */
        .top-menubar {
          width: 100%;
          height: 60px;
          background: #2d0a5c;
          display: flex;
          align-items: center;
          padding: 0 20px;
          color: #ffe97c;
          position: sticky;
          top: 0;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          border-bottom: 1.5px solid rgba(255,233,124,0.25);
        }

        .menu-toggle-btn {
          background: transparent;
          border: none;
          color: #ffe97c;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          margin-right: 15px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .menu-toggle-btn:hover {
          background: rgba(255,233,124,0.15);
        }

        .page-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #ffe97c;
          text-shadow: 0 0 8px rgba(255,233,124,0.3);
        }

        .download-btn {
          background: linear-gradient(135deg, #ffe97c 0%, #f0a500 100%);
          color: #120228;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.25);
          font-family: 'Lato', sans-serif;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 13px;
          margin: 10px 0;
        }

        .download-btn:hover {
          opacity: 0.95;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 215, 0, 0.35);
        }

        .download-btn svg {
          width: 18px;
          height: 18px;
          stroke: #120228 !important;
        }

        .invoice-container {
          width: 100%;
          max-width: 794px;
          min-height: 1123px;
          background: #ffffff;
          position: relative;
          overflow: hidden;
          border: 1px solid #ddd;
          box-shadow: 0 4px 30px rgba(0,0,0,0.1);
          page-break-inside: avoid;
          margin: 0 auto;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .invoice-wrapper {
            padding: 0 0 20px 0;
            gap: 10px;
          }

          .invoice-container {
            width: calc(100% - 10px); /* Tighter margins for mobile */
            max-width: 100%;
            min-height: auto;
            border-radius: 4px;
            margin: 0 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }

          .tax-invoice-title {
            font-size: 24px !important;
            letter-spacing: 1px !important;
          }

          .company-details-body {
            flex-direction: column;
            padding: 12px !important;
            gap: 15px !important;
          }

          .company-info {
            border-right: none !important;
            border-bottom: 1px solid #eee;
            padding-right: 0 !important;
            padding-bottom: 12px;
          }

          .invoice-meta {
            flex: none !important;
            padding-left: 0 !important;
            width: 100% !important;
            gap: 8px !important;
          }

          .meta-row .meta-value {
            font-size: 14px !important;
          }

          .items-table {
            margin: 0 8px 12px !important;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .items-table table {
            min-width: 550px;
          }

          .totals-section {
            margin: 0 8px 12px !important;
          }

          .totals-section table td {
            font-size: 12px !important;
          }

          .bottom-section {
            margin: 0 8px 15px !important;
            flex-direction: column;
            gap: 12px !important;
          }

          .right-column {
            flex: none !important;
            width: 100% !important;
          }

          .payout-row .p-label {
            width: 90px !important;
            font-size: 11px;
          }

          .payout-row .p-value {
            font-size: 11.5px !important;
            word-break: break-word;
          }

          .package-banner {
            margin: 8px 8px 12px !important;
            padding: 6px 12px !important;
          }

          .package-banner span {
            font-size: 11px !important;
            letter-spacing: 1.5px !important;
          }

          .header {
            padding: 15px 15px 8px !important;
          }

          .logo-img {
            width: 100px !important;
          }

          .invoice-title-section {
            padding: 8px 15px !important;
          }

          .invoice-footer {
            padding: 12px 15px 15px !important;
          }
        }

        @media (max-width: 480px) {
          .tax-invoice-title {
            font-size: 20px !important;
          }
          .dot { width: 4px !important; height: 4px !important; }
          .dots { gap: 6px !important; }
        }

        /* Gold corner decorations */
        .corner-top-right {
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          z-index: 10;
        }

        .corner-bottom-left {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100px;
          height: 100px;
          z-index: 10;
        }

        /* Header */
        .header {
          padding: 24px 32px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          position: relative;
        }

        .logo-img {
          width: 140px;
          height: auto;
          object-fit: contain;
        }

        /* Gold divider line */
        .gold-divider {
          height: 2px;
          background: linear-gradient(to right, transparent, #c8943a 20%, #c8943a 80%, transparent);
          margin: 0 32px;
        }

        /* TAX INVOICE banner */
        .invoice-title-section {
          text-align: center;
          padding: 12px 32px 8px;
          position: relative;
        }

        .invoice-title-section .dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .dots .h-line {
          flex: 1;
          height: 1.5px;
          background: #c8943a;
        }

        .dots .dot {
          width: 6px;
          height: 6px;
          background: #c8943a;
          border-radius: 50%;
        }

        .tax-invoice-title {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 800;
          color: #1a4a2e;
          letter-spacing: 3px;
          text-transform: uppercase;
          line-height: 1;
        }

        .product-sale-text {
          font-size: 14px;
          color: #555;
          margin-top: 4px;
        }

        /* Package banner */
        .package-banner {
          background: #1a4a2e;
          color: #ffffff;
          text-align: center;
          padding: 8px 32px;
          margin: 10px 32px 16px;
          position: relative;
          clip-path: polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%);
        }

        .package-banner span {
          font-size: 16px;
          font-weight: 900;
          letter-spacing: 4px;
          text-transform: uppercase;
        }

        /* Company Details Box */
        .company-details-section {
          margin: 0 20px;
          border: 1.5px solid #1a4a2e;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .company-details-header {
          background: #1a4a2e;
          color: white;
          padding: 6px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .company-details-body {
          display: flex;
          padding: 14px;
          gap: 16px;
        }

        .company-info {
          flex: 1;
          border-right: 1.5px solid #1a4a2e;
          padding-right: 16px;
        }

        .company-info h2 {
          font-size: 18px;
          font-weight: 900;
          color: #1a4a2e;
          margin-bottom: 6px;
        }

        .company-info .address {
          display: flex;
          gap: 6px;
          align-items: flex-start;
          font-size: 12.5px;
          color: #333;
          line-height: 1.6;
        }

        .company-info .address svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .invoice-meta {
          flex: 0 0 260px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-left: 16px;
        }

        .meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .meta-row .meta-icon {
          width: 28px;
          height: 28px;
          border: 1.5px solid #333;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .meta-row .meta-label {
          font-size: 13px;
          color: #555;
          width: 80px;
          font-weight: 600;
        }

        .meta-row .meta-value {
          font-size: 15px;
          font-weight: 900;
          color: #111;
          letter-spacing: 0.5px;
        }

        /* Items Table */
        .items-table {
          margin: 0 20px 14px;
          border: 1.5px solid #1a4a2e;
          border-radius: 6px;
          overflow: hidden;
        }

        .items-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .items-table thead tr {
          background: #1a4a2e;
        }

        .items-table thead th {
          color: white;
          font-size: 13px;
          font-weight: 700;
          padding: 9px 10px;
          text-align: center;
          letter-spacing: 0.3px;
        }

        .items-table thead th:nth-child(2) {
          text-align: left;
        }

        .items-table tbody tr {
          border-bottom: 1px solid #dce8dc;
        }

        .items-table tbody tr:last-child {
          border-bottom: none;
        }

        .items-table tbody td {
          padding: 10px;
          font-size: 13px;
          color: #222;
          text-align: center;
          vertical-align: middle;
        }

        .items-table tbody td:nth-child(2) {
          text-align: left;
        }

        .items-table tbody td .product-name {
          font-weight: 700;
          font-size: 13.5px;
        }

        .items-table tbody td .product-sub {
          font-size: 11.5px;
          color: #666;
        }

        .bv-value {
          font-weight: 900;
          color: #1a4a2e;
        }

        /* Totals Section */
        .totals-section {
          margin: 0 20px;
          border: 1.5px solid #1a4a2e;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .totals-section table {
          width: 100%;
          border-collapse: collapse;
        }

        .totals-section .total-row {
          border-bottom: 1px solid #dce8dc;
        }

        .totals-section .total-row td {
          padding: 8px 12px;
          font-size: 13px;
          color: #222;
        }

        .totals-section .subtotal-row td {
          padding: 9px 12px;
          font-size: 13.5px;
          font-weight: 700;
          color: #111;
          border-bottom: 1px solid #dce8dc;
        }

        .totals-section .grand-total-row {
          background: #1a4a2e;
        }

        .totals-section .grand-total-row td {
          padding: 10px 12px;
          color: white;
          font-size: 15px;
          font-weight: 900;
        }

        .totals-section .grand-total-row .amount {
          text-align: right;
          font-size: 20px;
          font-weight: 900;
        }

        .text-right {
          text-align: right !important;
        }

        .bv-center {
          text-align: center !important;
          font-weight: 700;
        }

        /* GST Details Section */
        .gst-section {
          margin: 0 20px;
          border: 1.5px solid #1a4a2e;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .gst-section table {
          width: 100%;
          border-collapse: collapse;
        }

        .gst-section .gst-header-row {
          background: #1a4a2e;
        }

        .gst-section .gst-header-row td {
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: white;
        }

        .gst-section .gst-row {
          border-bottom: 1px solid #dce8dc;
        }

        .gst-section .gst-row td {
          padding: 7px 12px;
          font-size: 13px;
          color: #222;
        }

        .gst-section .gst-row td:last-child {
          text-align: right;
          font-weight: 700;
        }

        .gst-section .gst-note-row td {
          padding: 5px 12px;
          font-size: 11px;
          color: #777;
          font-style: italic;
          border-bottom: 1px solid #dce8dc;
        }

        .gst-section .gst-grand-row {
          background: #1a4a2e;
        }

        .gst-section .gst-grand-row td {
          padding: 10px 12px;
          color: white;
          font-size: 15px;
          font-weight: 900;
        }

        .gst-section .gst-grand-row td:last-child {
          text-align: right;
          font-size: 18px;
        }

        .gst-badge {
          display: inline-block;
          background: #c8943a;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 3px;
          letter-spacing: 0.5px;
          margin-left: 6px;
          text-transform: uppercase;
          vertical-align: middle;
        }

        /* Bottom two-column section */
        .bottom-section {
          margin: 0 20px 20px;
          display: flex;
          gap: 14px;
        }

        /* Payout Statement */
        .payout-statement {
          flex: 1;
          border: 1.5px solid #1a4a2e;
          border-radius: 6px;
          overflow: hidden;
        }

        .section-header {
          background: #1a4a2e;
          color: white;
          padding: 7px 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .payout-body {
          padding: 12px;
        }

        .payout-row {
          display: flex;
          gap: 8px;
          margin-bottom: 7px;
          font-size: 12.5px;
          align-items: flex-start;
        }

        .payout-row .p-label {
          font-weight: 700;
          color: #222;
          width: 90px;
          flex-shrink: 0;
        }

        .payout-row .p-colon {
          color: #555;
          flex-shrink: 0;
        }

        .payout-row .p-value {
          color: #333;
          line-height: 1.5;
        }

        /* Right column */
        .right-column {
          flex: 0 0 320px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        /* Declaration */
        .declaration-box {
          border: 1.5px solid #1a4a2e;
          border-radius: 6px;
          overflow: hidden;
        }

        .declaration-body {
          padding: 10px 12px;
        }

        .declaration-body ul {
          list-style: none;
          padding: 0;
        }

        .declaration-body ul li {
          font-size: 11.5px;
          color: #333;
          padding: 2px 0 2px 14px;
          position: relative;
          line-height: 1.5;
        }

        .declaration-body ul li::before {
          content: "•";
          position: absolute;
          left: 2px;
          color: #1a4a2e;
          font-weight: 900;
        }

        /* Payout Details */
        .payout-details-box {
          border: 1.5px solid #fcfcfcff;
          border-radius: 6px;
          overflow: hidden;
        }

        .payout-details-box table {
          width: 100%;
          border-collapse: collapse;
        }

        .payout-details-box .pd-header {
          background: #1a4a2e;
          color: white;
        }

        .payout-details-box .pd-header td {
          padding: 7px 12px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: white;
        }

        .payout-details-box .pd-header td:last-child {
          text-align: right;
          font-size: 16px;
        }

        .payout-details-box tbody tr {
          border-bottom: 1px solid #dce8dc;
        }

        .payout-details-box tbody tr:last-child {
          border-bottom: none;
        }

        .payout-details-box tbody td {
          padding: 7px 12px;
          font-size: 12.5px;
          color: #222;
        }

        .payout-details-box tbody td:last-child {
          text-align: right;
        }

        .payout-details-box .net-pay-row {
          background: #e8f0e8;
        }

        .payout-details-box .net-pay-row td {
          font-weight: 900;
          font-size: 14px;
          color: #1a4a2e;
          padding: 8px 12px;
        }

        .payout-details-box .net-pay-row td:last-child {
          text-align: right;
          font-size: 16px;
        }

        /* Footer */
        .invoice-footer {
          text-align: center;
          padding: 16px 32px 20px;
          border-top: 1.5px solid #e0e0e0;
          position: relative;
        }

        .footer-ornament {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }

        .footer-ornament svg {
          width: 40px;
          height: 20px;
        }

        .footer-signatory {
          font-size: 12px;
          color: #555;
          letter-spacing: 0.5px;
        }

        .footer-company {
          font-size: 16px;
          font-weight: 900;
          color: #1a4a2e;
          letter-spacing: 1px;
        }

        /* Gold corner SVG styles */
        .corner-svg path {
          fill: #c8943a;
        }

        @media print {
          body {
            background: white !important;
          }
          .invoice-wrapper {
            padding: 0 !important;
            background: white !important;
          }
          .download-btn {
            display: none !important;
          }
          .invoice-container {
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* TOP MENUBAR */}
      <div className="top-menubar">
        <button className="menu-toggle-btn" onClick={toggleSidebar} aria-label="Toggle Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <span className="page-title">Tax Invoice</span>
      </div>

      {/* DOWNLOAD BUTTON */}
      <button className="download-btn" onClick={handleDownload}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download as PDF
      </button>

      <div className="invoice-container" ref={invoiceRef}>

        {/* TOP RIGHT GOLD CORNER */}
        <svg className="corner-top-right" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="100,0 100,100 60,100 100,60" fill="#c8943a" opacity="0.25" />
          <polygon points="100,0 100,60 60,0" fill="#c8943a" opacity="0.5" />
          <polygon points="100,0 100,30 70,0" fill="#c8943a" />
          <polygon points="100,0 100,6 94,0" fill="#1a4a2e" />
        </svg>

        {/* BOTTOM LEFT GOLD CORNER */}
        <svg className="corner-bottom-left" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,100 100,100 100,60 40,100" fill="#c8943a" opacity="0.25" />
          <polygon points="0,100 40,100 0,60" fill="#c8943a" opacity="0.5" />
          <polygon points="0,100 30,100 0,70" fill="#c8943a" />
          <polygon points="0,100 0,94 6,100" fill="#1a4a2e" />
        </svg>

        {/* HEADER */}
        <div className="header">
          <img
            src="/images/clm-new-logo.png"
            alt="Change Life Marketing Logo"
            className="logo-img"
          />
        </div>

        <div className="gold-divider" />

        {/* TAX INVOICE TITLE */}
        <div className="invoice-title-section">
          <div className="dots">
            <span className="h-line" />
            <span className="dot" />
            <span className="tax-invoice-title">Tax Invoice</span>
            <span className="dot" />
            <span className="h-line" />
          </div>
          <div className="product-sale-text">(Product Sale Invoice)</div>
        </div>

        {/* PACKAGE BANNER */}
        <div style={{ padding: "0 32px", marginBottom: "14px" }}>
          <div className="package-banner">
            <span>{userData?.registeredPackage || "Healthcare PACK-A"}</span>
          </div>
        </div>

        {/* COMPANY DETAILS */}
        <div className="company-details-section">
          <div className="company-details-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="12" rx="1" stroke="white" strokeWidth="1.5" />
              <line x1="4" y1="5" x2="12" y2="5" stroke="white" strokeWidth="1.2" />
              <line x1="4" y1="8" x2="12" y2="8" stroke="white" strokeWidth="1.2" />
              <line x1="4" y1="11" x2="9" y2="11" stroke="white" strokeWidth="1.2" />
            </svg>
            Company Details
          </div>
          <div className="company-details-body">
            <div className="company-info">
              <h2>Change Life Marketing</h2>
              <div className="address">
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                  <path d="M7 1C4.239 1 2 3.239 2 6c0 4 5 9 5 9s5-5 5-9c0-2.761-2.239-5-5-5z" stroke="#1a4a2e" strokeWidth="1.5" fill="none" />
                  <circle cx="7" cy="6" r="2" fill="#1a4a2e" />
                </svg>
                <span>House No 120, Ward No 21,<br />Dak Bungalow Road,<br />Masaurhi, Patna – 804452</span>
              </div>
            </div>

            <div className="invoice-meta">
              <div className="meta-row">
                <div className="meta-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="11" rx="1" stroke="#333" strokeWidth="1.3" />
                    <line x1="4" y1="6" x2="12" y2="6" stroke="#333" strokeWidth="1" />
                    <line x1="4" y1="9" x2="10" y2="9" stroke="#333" strokeWidth="1" />
                    <line x1="4" y1="12" x2="8" y2="12" stroke="#333" strokeWidth="1" />
                  </svg>
                </div>
                <span className="meta-label">Invoice No.</span>
                <span className="meta-value">CLM-{userData?.username?.slice(-4) || "1001"}</span>
              </div>
              <div className="meta-row">
                <div className="meta-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="2" width="14" height="13" rx="1" stroke="#333" strokeWidth="1.3" />
                    <line x1="5" y1="1" x2="5" y2="4" stroke="#333" strokeWidth="1.3" />
                    <line x1="11" y1="1" x2="11" y2="4" stroke="#333" strokeWidth="1.3" />
                    <line x1="1" y1="6" x2="15" y2="6" stroke="#333" strokeWidth="1.3" />
                    <circle cx="5" cy="9" r="0.8" fill="#333" />
                    <circle cx="8" cy="9" r="0.8" fill="#333" />
                    <circle cx="11" cy="9" r="0.8" fill="#333" />
                    <circle cx="5" cy="12" r="0.8" fill="#333" />
                    <circle cx="8" cy="12" r="0.8" fill="#333" />
                  </svg>
                </div>
                <span className="meta-label">Date</span>
                <span className="meta-value">{new Date().toLocaleDateString("en-GB")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="items-table">
          <table>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>S.No.</th>
                <th>Description</th>
                <th style={{ width: "70px" }}>HSN/SAC</th>
                <th style={{ width: "40px" }}>Qty</th>
                <th style={{ width: "90px" }}>Unit Price</th>
                <th style={{ width: "90px" }}>Amount</th>
                <th style={{ width: "90px" }}>BV</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <div className="product-name">Sea Buckthorn Capsule</div>
                  <div className="product-sub">(1 Box)</div>
                </td>
                <td>300490</td>
                <td>1</td>
                <td>₹800.00</td>
                <td>₹800.00</td>
                <td><span className="bv-value">700 BV</span></td>
              </tr>
              <tr>
                <td>2</td>
                <td>
                  <div className="product-name">Acidity Support Drop</div>
                  <div className="product-sub">(1 Bottle)</div>
                </td>
                <td>300490</td>
                <td>1</td>
                <td>₹499.00</td>
                <td>₹499.00</td>
                <td><span className="bv-value">300 BV</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="totals-section">
          <table>
            <tbody>
              <tr className="subtotal-row">
                <td><strong>Subtotal</strong></td>
                <td className="text-right" style={{ fontWeight: 700 }}>₹1,299.00</td>
                <td className="bv-center" style={{ width: "100px" }}>1000 BV</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* GST DETAILS */}
        {(() => {
          const isBihar = (userData?.state || "").toLowerCase().includes("bihar");
          const taxableValue = "₹1,237.14";
          const cgst = "₹30.93";
          const sgst = "₹30.93";
          const igst = "₹61.86";
          const grandTotal = "₹1,299.00";
          return (
            <div className="gst-section">
              <table>
                <tbody>
                  <tr className="gst-header-row">
                    <td colSpan={2}>
                      GST Details
                      {isBihar
                        ? <span className="gst-badge">Bihar — Intra-State</span>
                        : <span className="gst-badge">Inter-State</span>
                      }
                    </td>
                  </tr>
                  <tr className="gst-row">
                    <td>Taxable Value (Base Price excl. GST)</td>
                    <td>{taxableValue}</td>
                  </tr>
                  {isBihar ? (
                    <>
                      <tr className="gst-row">
                        <td>CGST @2.5%</td>
                        <td>{cgst}</td>
                      </tr>
                      <tr className="gst-row">
                        <td>SGST @2.5%</td>
                        <td>{sgst}</td>
                      </tr>
                    </>
                  ) : (
                    <tr className="gst-row">
                      <td>IGST @5%</td>
                      <td>{igst}</td>
                    </tr>
                  )}
                  <tr className="gst-note-row">
                    <td colSpan={2}>
                      {isBihar
                        ? "* CGST & SGST applicable — supply within Bihar (Intra-State)"
                        : `* IGST applicable — supply outside Bihar (Inter-State) to ${userData?.state || "your state"}`
                      }
                    </td>
                  </tr>
                  <tr className="gst-grand-row">
                    <td>GRAND TOTAL (Incl. GST)</td>
                    <td>{grandTotal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* BOTTOM SECTION */}
        <div className="bottom-section">

          {/* PAYOUT STATEMENT */}
          <div className="payout-statement">
            <div className="section-header">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="1" width="14" height="14" rx="1" stroke="white" strokeWidth="1.3" />
                <line x1="4" y1="5" x2="7" y2="5" stroke="white" strokeWidth="1.2" />
                <line x1="9" y1="5" x2="12" y2="5" stroke="white" strokeWidth="1.2" />
                <line x1="4" y1="8" x2="7" y2="8" stroke="white" strokeWidth="1.2" />
                <line x1="9" y1="8" x2="12" y2="8" stroke="white" strokeWidth="1.2" />
                <line x1="4" y1="11" x2="7" y2="11" stroke="white" strokeWidth="1.2" />
                <line x1="9" y1="11" x2="12" y2="11" stroke="white" strokeWidth="1.2" />
              </svg>
              Payout Statement
            </div>
            <div className="payout-body">
              {[
                { label: "Payout No.", value: `S${userData?.username?.slice(-4) || "1002"}` },
                { label: "Period", value: `From [ ${new Date(userData?.createdAt).toLocaleDateString("en-US", { month: 'short', day: '2-digit', year: 'numeric' })} 12:00 PM ]\nTo [ ${new Date(userData?.createdAt).toLocaleDateString("en-US", { month: 'short', day: '2-digit', year: 'numeric' })} 11:59 PM ]` },
                { label: "User ID", value: userData?.username || "CLM204" },
                { label: "Name", value: userData?.fullName || "Ajay Kumar" },
                { label: "Address", value: `${userData?.address || ""},\n${userData?.city || ""}, ${userData?.state || ""} – ${userData?.pincode || ""}` },
                { label: "Country", value: "India" },
                { label: "Mobile No.", value: userData?.mobileNo || "" },
                { label: "Email ID", value: userData?.email || "" },
              ].map((row) => (
                <div key={row.label} className="payout-row">
                  <span className="p-label">{row.label}</span>
                  <span className="p-colon">:</span>
                  <span className="p-value" style={{ whiteSpace: "pre-line" }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="right-column">

            {/* DECLARATION */}
            <div className="declaration-box">
              <div className="section-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1 L14 4 L14 9 C14 12.5 11 14.5 8 15 C5 14.5 2 12.5 2 9 L2 4 Z" stroke="white" strokeWidth="1.3" fill="none" />
                  <path d="M5 8 L7 10 L11 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Declaration
              </div>
              <div className="declaration-body">
                <ul>
                  <li>This invoice represents the sale of health supplement products only.</li>
                  <li>No joining or membership fee is charged.</li>
                  <li>Income is generated from product purchase and sales network.</li>
                  <li>GST is applicable only on product value as per law.</li>
                  <li>TDS is deducted on commission as per applicable rules.</li>
                  <li>Company operates under Direct Selling Guidelines, 2021.</li>
                </ul>
              </div>
            </div>

            {/* PAYOUT DETAILS */}
            <div className="payout-details-box">
              <table>
                <tbody>
                  <tr className="pd-header">
                    <td>Payout Details</td>
                    <td style={{ textAlign: "right" }}>₹</td>
                  </tr>
                  <tr>
                    <td>Income</td>
                    <td>₹1,000.00</td>
                  </tr>
                  <tr>
                    <td>Admin Processing &amp; Delivery Charges (18%)</td>
                    <td>₹180.00</td>
                  </tr>
                  <tr>
                    <td>TDS (2%)</td>
                    <td>₹20.00</td>
                  </tr>
                  <tr className="net-pay-row">
                    <td><strong>Net Pay</strong></td>
                    <td><strong>₹800.00</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="invoice-footer">
          <div className="footer-ornament">
            <svg viewBox="0 0 80 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12 Q20 4 30 12 Q40 20 50 12 Q60 4 70 12" stroke="#c8943a" strokeWidth="1.5" fill="none" />
              <circle cx="40" cy="12" r="3" fill="#c8943a" />
              <circle cx="10" cy="12" r="2" fill="#c8943a" />
              <circle cx="70" cy="12" r="2" fill="#c8943a" />
            </svg>
          </div>
          <div className="footer-signatory">Authorized Signatory</div>
          <div className="footer-company">Change Life Marketing</div>
          <div style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid #e0e0e0',
            fontSize: '11px',
            color: '#777',
            lineHeight: '1.6',
          }}>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#1a4a2e',
                textDecoration: 'underline',
                fontWeight: 700,
                fontSize: '11.5px',
              }}
            >
              📄 Terms & Conditions / नियम और शर्तें
            </a>
            <div style={{ marginTop: '4px', fontSize: '10.5px', color: '#999' }}>
              By registration, you acknowledge that you have read, understood and agreed to the Company&apos;s Policies & Terms.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}