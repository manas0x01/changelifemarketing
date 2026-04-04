"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ArrowRight, Play, Shield, CheckCircle, Building2, Users, Package, TrendingUp, Award, FileText, Landmark, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MessageCircle } from 'lucide-react';
import TeamPromotersSection from '@/components/TeamPromotersSection';

const MOCK_STATISTICS = [
  { _id: '1', statisticName: 'Members Joined', statisticValue: 15000, description: 'Total number of members who have joined our platform since inception.', unit: 'members', displayOrder: 1 },
  { _id: '2', statisticName: 'Products Available', statisticValue: 250, description: 'The total count of unique products currently available in our catalog.', unit: 'products', displayOrder: 2 },
  { _id: '3', statisticName: 'States Active', statisticValue: 15, description: 'Number of states where our services are actively operational.', unit: 'states', displayOrder: 3 },
  { _id: '4', statisticName: 'Income Distributed', statisticValue: 5000000, description: 'Cumulative income distributed to our partners and members.', unit: '₹', displayOrder: 4 },
];

const MOCK_LEGAL_DOCS = [
  {
    _id: '1',
    documentName: 'Goods and Services Tax (GST) Certificate',
    documentTypeLabel: 'GST',
    description: 'Official registration certificate for Goods and Services Tax (GSTIN) for Company.',
    thumbnailImage: '/images/gstcertificate.png',
    documentUrl: '#',
  },
  {
    _id: '2',
    documentName: 'MSME Udyam Registration Certificate',
    documentTypeLabel: 'MSME',
    description: 'Certificate of registration under the Micro, Small and Medium Enterprises (MSME) Development Act, 2006.',
    thumbnailImage: '/images/msmecertificate.png',
    documentUrl: '#',
  },
  {
    _id: '3',
    documentName: 'Permanent Account Number (PAN) Card',
    documentTypeLabel: 'PAN',
    description: 'Official PAN card for Company, issued by the Indian Income Tax Department..',
    thumbnailImage: '/images/pancard.png',
    documentUrl: '#',
  },
  {
    _id: '4',
    documentName: 'Aadhar Card - Director Ajay Kumar',
    documentTypeLabel: 'Aadhar',
    description: 'Aadhar card of a key personnel for identity verification purposes.',
    thumbnailImage: '/images/aadharcard.png',
    documentUrl: '#',
  },
  {
    _id: '5',
    documentName: 'Certificate of Incorporation',
    documentTypeLabel: 'Incorporation',
    description: 'Official document certifying the legal formation and existence of Company.',
    thumbnailImage: '/images/companyregistration.png',
    documentUrl: '#',
  }
];

const SectionHeading = ({
  title,
  subtitle,
  align = 'center',
  light = false,
}: {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
}) => (
  <div className={`mb-10 sm:mb-12 md:mb-16 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2
        className={`font-['Fraunces'] text-3xl sm:text-4xl md:text-5xl lg:text-[3.75rem] tracking-tight mb-4 sm:mb-6 leading-tight ${
          light ? 'text-[#FFFFFF]' : 'text-[#0A6E5A]'
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`font-['Roboto'] text-base sm:text-lg md:text-xl max-w-3xl leading-relaxed ${
            align === 'center' ? 'mx-auto' : ''
          } ${light ? 'text-[#FFFFFF]/80' : 'text-[#333333]/80'}`}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.2, ease: 'easeInOut' }}
      className={`h-px w-16 sm:w-24 mt-6 sm:mt-8 ${align === 'center' ? 'mx-auto' : ''} ${
        light ? 'bg-[#C9A84C]' : 'bg-[#0A6E5A]/20'
      }`}
      style={{ transformOrigin: align === 'center' ? 'center' : 'left' }}
    />
  </div>
);

export default function HomePage() {
  const [statistics, setStatistics] = useState(MOCK_STATISTICS);
  const [legalDocs, setLegalDocs] = useState(MOCK_LEGAL_DOCS);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && statistics.length > 0) {
            statistics.forEach((stat) => {
              animateCount(stat._id, stat.statisticValue || 0);
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    const element = document.getElementById('stats-trigger');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [statistics]);

  const animateCount = (id: string, target: number) => {
    let current = 0;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    const stepTime = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCounts((prev) => ({ ...prev, [id]: target }));
        clearInterval(timer);
      } else {
        setCounts((prev) => ({ ...prev, [id]: Math.floor(current) }));
      }
    }, stepTime);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] selection:bg-[#C9A84C]/30 selection:text-[#0A6E5A] overflow-x-hidden">
      <Header />

      {/* ─────────────────────── HERO SECTION ─────────────────────── */}
      <section
        ref={heroRef}
        className="relative w-full min-h-svh flex items-center justify-center overflow-hidden bg-[#0A6E5A]"
      >
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <Image
            src="/images/professionalbusinessbackground.png"
            alt="Professional business background"
            className="w-full h-full object-cover"
            fill
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A6E5A]/80 via-[#0A6E5A]/60 to-[#0A6E5A]/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[#0A6E5A]/30" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-12 flex flex-col items-center text-center mt-16 sm:mt-20 pb-28 sm:pb-32">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Fraunces'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[6rem] text-[#FFFFFF] mb-8 sm:mb-10 max-w-6xl leading-[1.1] tracking-tight text-balance drop-shadow-lg"
          >
            Join the Revolution of{' '}
            <span className="text-[#C9A84C] italic pr-1 sm:pr-2">Smart Earning</span> &amp;{' '}
            Powerful Networking
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col xs:flex-row gap-4 sm:gap-6 justify-center items-center w-full max-w-sm xs:max-w-none"
          >
            <Link
              href="/join-now"
              className="group relative overflow-hidden rounded-none bg-[#C9A84C] px-7 sm:px-10 py-4 sm:py-5 transition-all hover:bg-[#FFFFFF] w-full xs:w-auto text-center"
            >
              <div className="absolute inset-0 w-0 bg-[#FFFFFF] transition-all duration-250 ease-out group-hover:w-full" />
              <span className="relative flex items-center justify-center gap-3 font-['Roboto'] font-semibold text-base sm:text-lg text-[#0A6E5A] group-hover:text-[#0A6E5A]">
                Get Started
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link
              href="/business-plan"
              className="group flex items-center justify-center gap-3 px-7 sm:px-10 py-4 sm:py-5 border border-[#FFFFFF]/30 hover:border-[#FFFFFF] transition-colors rounded-none backdrop-blur-sm w-full xs:w-auto"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#FFFFFF] flex items-center justify-center group-hover:bg-[#FFFFFF] group-hover:text-[#0A6E5A] transition-colors text-[#FFFFFF] shrink-0">
                <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />
              </div>
              <span className="font-['Roboto'] font-medium text-base sm:text-lg text-[#FFFFFF]">Watch Plan Video</span>
            </Link>
          </motion.div>
        </div>

        {/* Ticker */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0A6E5A]/95 backdrop-blur-md border-t border-[#FFFFFF]/10 py-3 sm:py-4 overflow-hidden z-20">
          <motion.div
            animate={{ x: [0, -1920] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex whitespace-nowrap items-center"
          >
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center">
                <span className="font-['Roboto'] text-xs sm:text-sm md:text-base text-[#C9A84C]/90 px-6 sm:px-8 uppercase tracking-widest flex items-center gap-5 sm:gap-8">
                  <span>Established Jan 2026</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50" />
                  <span>Head Office: Masaurhi, Patna</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50" />
                  <span>Direct Selling</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50" />
                  <span>No Joining Fee</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50" />
                  <span>Natural Health Products</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50" />
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────── ABOUT / COMPANY OVERVIEW ─────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 bg-[#FFFFFF] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid lg:grid-cols-12 gap-10 sm:gap-16 lg:gap-24 items-start">

            {/* Left: Image Composition */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              {/* Image wrapper — extra bottom padding on mobile to accommodate the overlay card */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm">
                <Image
                  src="/images/changelifemarketingcorporateoffice.png"
                  alt="Change Life Marketing Corporate Office"
                  className="w-full h-full object-cover"
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                />
                <div className="absolute inset-0 border border-[#0A6E5A]/10 m-4 rounded-sm pointer-events-none" />
              </div>

              {/* Director Profile Overlay */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="
                  /* Mobile: full-width below the image */
                  relative mt-4 mx-0
                  /* sm+: overlap bottom-right like original */
                  sm:absolute sm:mt-0 sm:-bottom-12 sm:-right-6 md:sm:-right-12
                  bg-[#FFFFFF] p-4 sm:p-6 shadow-2xl border-l-4 border-[#C9A84C]
                  max-w-full sm:max-w-xs
                "
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-[#C9A84C]/30 shrink-0">
                    <Image
                      src="/images/ajaykumar.png"
                      alt="Mr. Ajay Kumar"
                      className="w-full h-full object-cover"
                      width={80}
                      height={80}
                    />
                  </div>
                  <div>
                    <h3 className="font-['Fraunces'] text-lg sm:text-xl text-[#0A6E5A] leading-tight">Mr. Ajay Kumar</h3>
                    <p className="font-['Roboto'] text-xs sm:text-sm text-[#C9A84C] font-medium">Director &amp; Founder</p>
                  </div>
                </div>
                <p className="font-['Roboto'] text-xs text-[#333333]/70 leading-relaxed">
                  Graphics Designer with 10 Years of Network Marketing experience, leading the vision of Change Life Marketing.
                </p>
              </motion.div>
            </motion.div>

            {/* Right: Content */}
            <div className="lg:col-span-7 pt-6 sm:pt-16 lg:pt-0">
              <SectionHeading title="A Legacy of Trust &amp; Growth" align="left" />

              <div className="space-y-8 sm:space-y-12">
                {/* Company Details Grid */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-['Roboto'] text-[#C9A84C] uppercase tracking-wider font-semibold">Established</p>
                    <p className="font-['Fraunces'] text-xl sm:text-2xl text-[#0A6E5A]">26 Jan 2026</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm font-['Roboto'] text-[#C9A84C] uppercase tracking-wider font-semibold">Headquarters</p>
                    <p className="font-['Roboto'] text-sm sm:text-base text-[#333333]/80 leading-relaxed">
                      Ward No. 21, Holding No. 120,<br />
                      Dak Bangla Road, Masaurhi,<br />
                      Patna, Bihar - 804452
                    </p>
                  </div>
                </div>

                <div className="h-px w-full bg-[#0A6E5A]/10" />

                {/* Mission & Vision */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative pl-5 sm:pl-6 border-l border-[#C9A84C]"
                  >
                    <h3 className="font-['Fraunces'] text-xl sm:text-2xl text-[#0A6E5A] mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A84C] shrink-0" />
                      Our Mission
                    </h3>
                    <p className="font-['Roboto'] text-sm sm:text-base text-[#333333]/80 leading-relaxed">
                      "To promote a healthy life through natural products and provide opportunities for financial freedom."
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="relative pl-5 sm:pl-6 border-l border-[#C9A84C]"
                  >
                    <h3 className="font-['Fraunces'] text-xl sm:text-2xl text-[#0A6E5A] mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                      <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A84C] shrink-0" />
                      Our Vision
                    </h3>
                    <p className="font-['Roboto'] text-sm sm:text-base text-[#333333]/80 leading-relaxed">
                      "To make Change Life Marketing an inspiring brand that brings positive change to everyone's life."
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TeamPromotersSection />

      {/* ─────────────────────── STATISTICS STRIP ─────────────────────── */}
      <section className="bg-[#0A6E5A] py-16 sm:py-20 md:py-24 relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-[10%] w-[70%] h-[200%] bg-[#FFFFFF]/5 rotate-12 blur-3xl" />
          <div className="absolute -bottom-1/2 -right-[10%] w-[70%] h-[200%] bg-[#C9A84C]/5 -rotate-12 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
          <div
            id="stats-trigger"
            className="
              grid grid-cols-2 lg:grid-cols-4
              gap-8 sm:gap-10 md:gap-8
              divide-x-0 lg:divide-x divide-[#FFFFFF]/10
            "
          >
            {isLoadingStats ? (
              <div className="col-span-full text-center text-[#FFFFFF]/50 py-12">Loading statistics...</div>
            ) : statistics.length > 0 ? (
              statistics.map((stat, index) => {
                const icons = [Users, Package, Building2, TrendingUp];
                const Icon = icons[index % icons.length];
                return (
                  <motion.div
                    key={stat._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="text-center px-2 sm:px-4"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#FFFFFF]/5 mb-4 sm:mb-6">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#C9A84C]" />
                    </div>
                    <div className="font-['Fraunces'] text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#FFFFFF] mb-2 flex items-baseline justify-center gap-1 flex-wrap">
                      <span>{counts[stat._id] || 0}</span>
                      {stat.unit && (
                        <span className="text-xl sm:text-2xl md:text-3xl text-[#C9A84C]">{stat.unit}</span>
                      )}
                    </div>
                    <p className="font-['Roboto'] text-xs sm:text-sm md:text-base text-[#FFFFFF]/70 uppercase tracking-widest">
                      {stat.statisticName}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-full text-center text-[#FFFFFF]/50 py-12">Statistics data unavailable.</div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────── BANKING PARTNER SECTION ─────────────────────── */}
      <section className="py-16 sm:py-24 md:py-32 bg-[#0A6E5A] relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 md:gap-16 items-center">

            {/* Left: Text */}
            <div>
              <SectionHeading
                title="Secure Banking Partner"
                subtitle="We ensure transparent and secure transactions through India's most trusted banking institution."
                align="left"
                light
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-start gap-4 mb-8"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A84C]" />
                </div>
                <div>
                  <h4 className="font-['Fraunces'] text-lg sm:text-xl text-[#FFFFFF] mb-2">100% Secure Transactions</h4>
                  <p className="font-['Roboto'] text-sm sm:text-base text-[#FFFFFF]/70 leading-relaxed">
                    All payouts and deposits are routed through verified corporate accounts, ensuring complete financial safety for our network.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Right: Bank Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#FFFFFF] p-6 sm:p-8 md:p-12 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-12 h-12 sm:w-16 sm:h-16 border-t-4 border-r-4 border-[#C9A84C] m-3 sm:m-4" />

              <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 sm:gap-6 mb-8 sm:mb-10 border-b border-[#0A6E5A]/10 pb-6 sm:pb-8">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#0A6E5A]/5 rounded-full flex items-center justify-center shrink-0">
                  <Landmark className="w-7 h-7 sm:w-10 sm:h-10 text-[#0A6E5A]" />
                </div>
                <div>
                  <h3 className="font-['Fraunces'] text-2xl sm:text-3xl text-[#0A6E5A]">State Bank of India</h3>
                  <p className="font-['Roboto'] text-[#C9A84C] font-medium tracking-wide uppercase text-xs sm:text-sm mt-1">Official Banking Partner</p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6 font-['Roboto']">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-[#0A6E5A]/5 pb-3 sm:pb-4 gap-1">
                  <span className="text-[#333333]/60 text-xs sm:text-sm uppercase tracking-wider">Account Name</span>
                  <span className="text-[#0A6E5A] font-semibold text-base sm:text-lg">Change Life Marketing</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-[#0A6E5A]/5 pb-3 sm:pb-4 gap-1">
                  <span className="text-[#333333]/60 text-xs sm:text-sm uppercase tracking-wider">Account Number</span>
                  <span className="text-[#0A6E5A] font-['Fraunces'] text-xl sm:text-2xl md:text-3xl tracking-wider">44684442171</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end pb-2 gap-1">
                  <span className="text-[#333333]/60 text-xs sm:text-sm uppercase tracking-wider">IFSC Code</span>
                  <span className="text-[#C9A84C] font-semibold text-lg sm:text-xl md:text-2xl tracking-wider">SBIN0004708</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─────────────────────── CTA TEASER SECTION ─────────────────────── */}
      <section className="py-16 sm:py-20 md:py-24 bg-[#FFFFFF] border-t border-[#0A6E5A]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-['Fraunces'] text-3xl sm:text-4xl md:text-5xl text-[#0A6E5A] mb-4 sm:mb-6 leading-tight">
              Ready to Change Your Life?
            </h2>
            <p className="font-['Roboto'] text-base sm:text-lg text-[#333333]/70 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Explore our natural health products and discover a business plan designed for your financial freedom. No joining fee required.
            </p>
            <div className="flex flex-col xs:flex-row justify-center gap-3 sm:gap-4">
              <Link
                href="/products"
                className="px-7 sm:px-8 py-3 sm:py-4 bg-[#0A6E5A] text-[#FFFFFF] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/90 transition-colors text-sm sm:text-base"
              >
                Explore Products
              </Link>
              <Link
                href="/business-plan"
                className="px-7 sm:px-8 py-3 sm:py-4 border border-[#0A6E5A] text-[#0A6E5A] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/5 transition-colors text-sm sm:text-base"
              >
                View Business Plan
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}