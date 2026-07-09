"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Shield, FileText, IndianRupee, ScrollText, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] selection:bg-[#C9A84C]/30 selection:text-[#0A6E5A] overflow-clip">
      <Header />

      {/* ── PAGE HERO ── */}
      <section className="relative bg-[#0A6E5A] pt-32 pb-24 overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
          }}
        />
        {/* Glow blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-10"
          >
            <Link
              href="/"
              className="flex items-center gap-2 font-['Roboto'] text-[0.8rem] text-[#FFFFFF]/60 hover:text-[#C9A84C] transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Home
            </Link>
            <span className="font-['Roboto'] text-[0.8rem] text-[#FFFFFF]/30 uppercase mx-1">/</span>
            <span className="font-['Roboto'] text-[0.8rem] text-[#C9A84C] uppercase tracking-wider">
              Terms &amp; Policies
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-[#C9A84C]" />
              </div>
              <span className="font-['Roboto'] text-[0.8rem] text-[#C9A84C] uppercase tracking-[0.3em] font-semibold">
                Official Document
              </span>
            </div>

            <h1 className="font-['Fraunces'] text-[2.5rem] md:text-[3.5rem] text-[#FFFFFF] leading-[1.1] tracking-tight mb-6">
              Terms, Policies &amp; <br />
              <span className="text-[#C9A84C] italic">Compensation Plan</span>
            </h1>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF]/75 leading-relaxed max-w-2xl">
              Please read these terms and conditions carefully before registering as a member or purchasing products from Change Life Marketing.
            </p>
          </motion.div>
        </div>

        {/* Bottom wave divider */}
        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
          <svg
            viewBox="0 0 1440 48"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path d="M0 48 L1440 48 L1440 0 Q720 48 0 0 Z" fill="#FFFFFF" />
          </svg>
        </div>
      </section>

      {/* ── CONTENT BODY ── */}
      <section className="py-20 md:py-28 relative">
        <div className="max-w-4xl mx-auto px-6 md:px-12">

          {/* Compliance Notice Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-l-4 border-[#C9A84C] bg-[#F9F7F4] p-8 md:p-10 mb-16 rounded-r-lg shadow-sm"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#C9A84C] shrink-0 mt-1" />
              <div>
                <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A] mb-2">Direct Selling Compliance Notice</h3>
                <p className="font-['Roboto'] text-[0.95rem] text-[#333333]/70 leading-relaxed mb-0">
                  <strong>Change Life Marketing</strong> is a Proprietorship Firm operating in India. The business is conducted in accordance with all applicable laws of India and follows the <strong>Consumer Protection (Direct Selling) Rules, 2021</strong>.
                  We do not promote or operate any pyramid scheme or money circulation scheme prohibited under Indian law.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Section 1: General Terms */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="w-6 h-6 text-[#0A6E5A]" />
              <h2 className="font-['Fraunces'] text-[2rem] text-[#0A6E5A]">1. General Terms &amp; Conditions</h2>
            </div>
            
            <div className="space-y-6 font-['Roboto'] text-[1rem] text-[#333333]/75 leading-relaxed">
              <p>
                By registering as a Direct Seller / Distributor / Member with Change Life Marketing, you agree to abide by the following terms and conditions. The company reserves the right to modify these terms at any time with prior notice provided on the official website.
              </p>
              <ul className="space-y-4 pl-2">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A84C] shrink-0 mt-0.5" />
                  <span><strong>Age Requirement:</strong> You must be at least 18 years of age to register as a direct seller.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A84C] shrink-0 mt-0.5" />
                  <span><strong>Pin Registration:</strong> To register and join Change Life Marketing, a Pin of ₹1299 must be purchased.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A84C] shrink-0 mt-0.5" />
                  <span><strong>Independent Contractor Status:</strong> You are an independent contractor, not an employee, agent, or partner of Change Life Marketing. You are responsible for your own taxes and business expenses.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A84C] shrink-0 mt-0.5" />
                  <span><strong>KYC Mandatory:</strong> Submission of valid KYC documents (Aadhar Card, PAN Card, and Bank Details) is mandatory for the disbursement of any incentives or commissions.</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="w-full h-px bg-[#0A6E5A]/10 mb-16" />

          {/* Section 2: Policies */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <ScrollText className="w-6 h-6 text-[#0A6E5A]" />
              <h2 className="font-['Fraunces'] text-[2rem] text-[#0A6E5A]">2. Company Policies</h2>
            </div>
            
            <div className="space-y-6 font-['Roboto'] text-[1rem] text-[#333333]/75 leading-relaxed">
              <h3 className="text-[1.25rem] font-semibold text-[#333333]">Product Purchase & Sales</h3>
              <p>
                Products purchased are for personal use or for retail sales to consumers. There is no compulsion to buy inventory in large quantities. Distributors should only purchase products they can reasonably consume or sell.
              </p>
              
              <h3 className="text-[1.25rem] font-semibold text-[#333333] mt-8">Refund & Buy-Back Policy</h3>
              <p>
                As per the Consumer Protection (Direct Selling) Rules, 2021, we offer a reasonable Buy-Back/Refund policy for currently marketable goods returned by the direct seller within 30 days of purchase, provided the products are in resalable condition (unopened, unexpired, and undamaged).
              </p>

              <h3 className="text-[1.25rem] font-semibold text-[#333333] mt-8">Ethical Marketing</h3>
              <p>
                Distributors must not make any false, misleading, or exaggerated claims regarding the company's products or the income opportunity. All product benefits and income representations must strictly align with official company literature.
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-[#0A6E5A]/10 mb-16" />

          {/* Section 3: Compensation Plan */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <IndianRupee className="w-6 h-6 text-[#0A6E5A]" />
              <h2 className="font-['Fraunces'] text-[2rem] text-[#0A6E5A]">3. Compensation & Booster Plan</h2>
            </div>
            
            <div className="space-y-6 font-['Roboto'] text-[1rem] text-[#333333]/75 leading-relaxed">
              <div className="bg-[#0A6E5A]/5 p-6 rounded-lg border border-[#0A6E5A]/10 mb-8">
                <p className="font-semibold text-[#0A6E5A] mb-2">Important Disclaimer:</p>
                <p className="text-[0.95rem]">
                  Income, incentives, and rewards are strictly based on the sale of products and the performance of your sales network. <strong>No income or success is guaranteed.</strong> Merely enrolling individuals without the sale of products does not generate any income.
                </p>
              </div>

              <p>
                The Change Life Marketing compensation plan is designed to reward active distributors for their sales efforts. It operates on a dual-team (Left/Right) pairing system.
              </p>

              <h3 className="text-[1.25rem] font-semibold text-[#333333] mt-8">Phase 1: Basic Level Income Rules</h3>
              <p>
                Every new distributor starts at the Basic Level. The following rules apply:
              </p>
              <ul className="space-y-4 pl-2 list-disc list-inside">
                <li><strong>Income per Pair:</strong> ₹1,000 per matched pair.</li>
                <li><strong>Session Capping:</strong> A maximum of 1 pair can be matched per session (₹2,000 Daily Max).</li>
                <li><strong>System Cuts:</strong> Pair sequences #3, #6, #9, and #12 are subject to system cuts and yield ₹0 payout.</li>
                <li><strong>Carry Forward:</strong> There is no carry-forward in the Basic Level. Unpaired volume is flushed out at session close.</li>
              </ul>

              <h3 className="text-[1.25rem] font-semibold text-[#333333] mt-8">Phase 2: Booster Level Upgrade</h3>
              <p>
                To qualify for the Booster Level, a distributor must successfully complete <strong>12 valid Basic sessions</strong>. Once upgraded, the distributor is eligible for the Booster matching income.
              </p>

              <h3 className="text-[1.25rem] font-semibold text-[#333333] mt-8">Booster Pair Income Rules</h3>
              <ul className="space-y-4 pl-2 list-disc list-inside">
                <li><strong>Pair Definition:</strong> 1 valid active sale on the Left side + 1 valid active sale on the Right side = 1 Pair.</li>
                <li><strong>Income per Pair:</strong> ₹1,000 per matched pair.</li>
                <li><strong>Session Capping:</strong> A maximum of 10 pairs can be matched per session.</li>
                <li><strong>Session Maximum:</strong> The maximum income per session is capped at ₹10,000.</li>
                <li><strong>Daily Maximum:</strong> With two sessions per day (Morning & Evening), the maximum possible daily income is capped at ₹20,000.</li>
              </ul>

              <h3 className="text-[1.25rem] font-semibold text-[#333333] mt-8">Flush-Out & Carry Forward Rule</h3>
              <p>
                If the total number of pairs in a single session exceeds the cap of 10 pairs, the income for the extra pairs is "flushed out" and will not be credited. However, any unpaired sales volume (either on the left or right side) will be carried forward to the next session for future matching.
              </p>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="mt-20 text-center">
            <Link
              href="/legal"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#0A6E5A] text-[#FFFFFF] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/90 transition-colors rounded-md shadow-lg shadow-[#0A6E5A]/20"
            >
              View Official Legal Documents
            </Link>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
