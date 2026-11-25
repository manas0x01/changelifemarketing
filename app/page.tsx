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

const SectionHeading = ({ title, subtitle, align = 'center', light = false }: { title: string, subtitle?: string, align?: 'left' | 'center', light?: boolean }) => (
  <div className={`mb-16 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <h2 className={`font-['Fraunces'] text-[2.25rem] md:text-[3rem] lg:text-[3.75rem] tracking-tight mb-6 ${light ? 'text-[#FFFFFF]' : 'text-[#0A6E5A]'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`font-['Roboto'] text-[1.125rem] md:text-[1.25rem] max-w-3xl ${align === 'center' ? 'mx-auto' : ''} ${light ? 'text-[#FFFFFF]/80' : 'text-[#333333]/80'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.2, ease: "easeInOut" }}
      className={`h-px w-24 mt-8 ${align === 'center' ? 'mx-auto' : ''} ${light ? 'bg-[#C9A84C]' : 'bg-[#0A6E5A]/20'}`}
      style={{ transformOrigin: align === 'center' ? 'center' : 'left' }}
    />
  </div>
);

export default function HomePage() {
  const [legalDocs, setLegalDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docsRes = await fetch('/api/legal-docs');

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setLegalDocs(docsData.data || []);
          setIsLoadingDocs(false);
        }
      } catch (error) {
        setIsLoadingDocs(false);
      }
    };

    fetchData();
  }, []);


  return (
    <div className="min-h-screen bg-[#FFFFFF] selection:bg-[#C9A84C]/30 selection:text-[#0A6E5A] overflow-clip">
      <Header />

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative w-full h-svh flex items-center justify-center overflow-hidden bg-[#0A6E5A]">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0 z-0">
          <Image
            src="/images/professionalbusinessbackground.png"
            alt="Professional business background"
            className="w-full h-full object-cover"
            width={1920}
            height={1024}
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#0A6E5A]/80 via-[#0A6E5A]/60 to-[#0A6E5A]/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-[#0A6E5A]/30"></div>
        </motion.div>

        <div className="relative z-10 w-full max-w-480 mx-auto px-6 md:px-12 flex flex-col items-center text-center mt-16">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Fraunces'] text-[3rem] md:text-[4.5rem] lg:text-[6rem] text-[#FFFFFF] mb-8 max-w-6xl leading-[1.1] tracking-tight text-balance drop-shadow-lg"
          >
            Join the Revolution of <span className="text-[#C9A84C] italic pr-2">Smart Earning</span> & Powerful Networking
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="/contact" className="group relative overflow-hidden rounded-none bg-[#C9A84C] px-10 py-5 transition-all hover:bg-[#FFFFFF]">
              <div className="absolute inset-0 w-0 bg-[#FFFFFF] transition-all duration-250 ease-out group-hover:w-full"></div>
              <span className="relative flex items-center gap-3 font-['Roboto'] font-semibold text-[1.125rem] text-[#0A6E5A] group-hover:text-[#0A6E5A]">
                Get Started
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>

            <Link href="https://youtu.be/hhJbAEcvm9k?si=DIbidN-ORtv4zsNt" className="group flex items-center gap-3 px-10 py-5 border border-[#FFFFFF]/30 hover:border-[#FFFFFF] transition-colors rounded-none backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full border border-[#FFFFFF] flex items-center justify-center group-hover:bg-[#FFFFFF] group-hover:text-[#0A6E5A] transition-colors text-[#FFFFFF]">
                <Play className="w-4 h-4 ml-1" />
              </div>
              <span className="font-['Roboto'] font-medium text-[1.125rem] text-[#FFFFFF]">Watch Plan Video</span>
            </Link>
          </motion.div>
        </div>

        {/* Elegant Ticker */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0A6E5A]/95 backdrop-blur-md border-t border-[#FFFFFF]/10 py-4 overflow-hidden z-20">
          <motion.div
            animate={{ x: [0, -1920] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="flex whitespace-nowrap items-center"
          >
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center">
                <span className="font-['Roboto'] text-[0.875rem] md:text-[1rem] text-[#C9A84C]/90 px-8 uppercase tracking-widest flex items-center gap-8">
                  <span>Established Jan 2026</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50"></span>
                  <span>Head Office: Masaurhi, Patna</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50"></span>
                  <span>Direct Selling</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50"></span>
                  <span>No Joining Fee</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50"></span>
                  <span>Natural Health Products</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]/50"></span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ABOUT US / COMPANY OVERVIEW */}
      <section className="py-32 bg-[#FFFFFF] relative">
        <div className="max-w-480 mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">

            {/* Left: Image Composition */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative"
            >
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-sm">
                <Image
                  src="/images/changelifemarketingcorporateoffice.png"
                  alt="Change Life Marketing Corporate Office"
                  className="w-full h-full object-cover"
                  width={800}
                  height={960}
                />
                <div className="absolute inset-0 border border-[#0A6E5A]/10 m-4 rounded-sm pointer-events-none"></div>
              </div>

              {/* Director Profile Overlay */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="absolute -bottom-12 -right-6 md:-right-12 bg-[#FFFFFF] p-6 shadow-2xl border-l-4 border-[#C9A84C] max-w-70"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#C9A84C]/30 shrink-0">
                    <Image
                      src="/images/new-pfp.jpeg"
                      alt="Mr. Ajay Kumar"
                      className="w-full h-full object-cover"
                      width={80}
                      height={80}
                    />
                  </div>
                  <div>
                    <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A] leading-tight">Mr. Ajay Kumar</h3>
                    <p className="font-['Roboto'] text-[0.875rem] text-[#C9A84C] font-medium">Director & Founder</p>
                  </div>
                </div>
                <p className="font-['Roboto'] text-[0.75rem] text-[#333333]/70 leading-relaxed">
                  Graphics Designer with 10 Years of Network Marketing experience, leading the vision of Change Life Marketing.
                </p>
              </motion.div>
            </motion.div>

            {/* Right: Content */}
            <div className="lg:col-span-7 pt-12 lg:pt-0">
              <SectionHeading title="A Legacy of Trust & Growth" align="left" />
              <div className="space-y-12">
                {/* Company Details Grid */}
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-[0.875rem] font-['Roboto'] text-[#C9A84C] uppercase tracking-wider font-semibold">Established</p>
                    <p className="font-['Fraunces'] text-[1.5rem] text-[#0A6E5A]">22 Jan 2026</p>
                    <p className="text-[0.8rem] text-[#333333]/70 font-['Roboto']">Direct Selling Govt. Registered</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[0.875rem] font-['Roboto'] text-[#C9A84C] uppercase tracking-wider font-semibold">Registered Office</p>
                    <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/80 leading-relaxed">
                      Ward No. 21, Holding No. 120,<br />Dak Bangla Road, Masaurhi,<br />Patna, Bihar - 804452
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[0.875rem] font-['Roboto'] text-[#C9A84C] uppercase tracking-wider font-semibold">Corporate Office</p>
                    <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/80 leading-relaxed">
                      Near Masaurhi Court,<br />Railway Station, Masaurhi,<br />Patna, Bihar - 804452
                    </p>
                  </div>
                </div>
                <div className="h-px w-full bg-[#0A6E5A]/10"></div>
                {/* Mission & Vision */}
                <div className="grid md:grid-cols-2 gap-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative pl-6 border-l border-[#C9A84C]"
                  >
                    <h3 className="font-['Fraunces'] text-[1.5rem] text-[#0A6E5A] mb-4 flex items-center gap-3">
                      <Award className="w-6 h-6 text-[#C9A84C]" />
                      Our Mission
                    </h3>
                    <p className="font-['Roboto'] text-[#333333]/80 leading-relaxed">
                      "To promote a healthy life through natural products and provide opportunities for financial freedom."
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="relative pl-6 border-l border-[#C9A84C]"
                  >
                    <h3 className="font-['Fraunces'] text-[1.5rem] text-[#0A6E5A] mb-4 flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-[#C9A84C]" />
                      Our Vision
                    </h3>
                    <p className="font-['Roboto'] text-[#333333]/80 leading-relaxed">
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

      {/* BANKING PARTNER SECTION */}
      <section className="py-32 bg-[#0A6E5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}></div>

        <div className="max-w-480 mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            <div>
              <SectionHeading title="Secure Banking Partner" subtitle="We ensure transparent and secure transactions through India's most trusted banking institution." align="left" light />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex items-start gap-4 mb-8"
              >
                <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                  <Shield className="w-6 h-6 text-[#C9A84C]" />
                </div>
                <div>
                  <h4 className="font-['Fraunces'] text-[1.25rem] text-[#FFFFFF] mb-2">100% Secure Transactions</h4>
                  <p className="font-['Roboto'] text-[#FFFFFF]/70">All payouts and deposits are routed through verified corporate accounts, ensuring complete financial safety for our network.</p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#FFFFFF] p-8 md:p-12 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-[#C9A84C] m-4"></div>

              <div className="flex items-center gap-6 mb-10 border-b border-[#0A6E5A]/10 pb-8">
                <div className="w-20 h-20 bg-[#0A6E5A]/5 rounded-full flex items-center justify-center">
                  <Landmark className="w-10 h-10 text-[#0A6E5A]" />
                </div>
                <div>
                  <h3 className="font-['Fraunces'] text-[1.875rem] text-[#0A6E5A]">State Bank of India</h3>
                  <p className="font-['Roboto'] text-[#C9A84C] font-medium tracking-wide uppercase text-[0.875rem] mt-1">Official Banking Partner</p>
                </div>
              </div>

              <div className="space-y-6 font-['Roboto']">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-[#0A6E5A]/5 pb-4">
                  <span className="text-[#333333]/60 text-[0.875rem] uppercase tracking-wider mb-1 sm:mb-0">Account Name</span>
                  <span className="text-[#0A6E5A] font-semibold text-[1.125rem]">Change Life Marketing</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-[#0A6E5A]/5 pb-4">
                  <span className="text-[#333333]/60 text-[0.875rem] uppercase tracking-wider mb-1 sm:mb-0">Account Number</span>
                  <span className="text-[#0A6E5A] font-['Fraunces'] text-[1.5rem] tracking-wider">44684442171</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end pb-2">
                  <span className="text-[#333333]/60 text-[0.875rem] uppercase tracking-wider mb-1 sm:mb-0">IFSC Code</span>
                  <span className="text-[#C9A84C] font-semibold text-[1.25rem] tracking-wider">SBIN0004708</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* CTA TEASER SECTION */}
      <section className="py-24 bg-[#FFFFFF] border-t border-[#0A6E5A]/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] text-[#0A6E5A] mb-6">Ready to Change Your Life?</h2>
            <p className="font-['Roboto'] text-[1.125rem] text-[#333333]/70 mb-10 max-w-2xl mx-auto">
              Explore our natural health products and discover a business plan designed for your financial freedom. No joining fee required.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/products" className="px-8 py-4 bg-[#0A6E5A] text-[#FFFFFF] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/90 transition-colors">
                Explore Products
              </Link>
              <Link href="/business-plan" className="px-8 py-4 border border-[#0A6E5A] text-[#0A6E5A] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/5 transition-colors">
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