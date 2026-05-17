"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FileText, ChevronRight, CheckCircle, Shield, X, ExternalLink, ArrowLeft, Landmark, Award } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface LegalDoc {
  _id: string;
  documentName: string;
  documentTypeLabel: string;
  description: string;
  thumbnailImage: string;
  documentUrl: string;
}

const LEGAL_DOCS: LegalDoc[] = [
  {
    _id: '1',
    documentName: 'UDYAM REGISTRATION CERTIFICATE (MSME)',
    documentTypeLabel: 'MSME',
    description:
      'Official Udyam Registration Certificate issued by the Ministry of MSME, Government of India. This certificate validates that Change Life Marketing is a registered Micro, Small and Medium Enterprise. All small businesses in India are required to register under the Udyam scheme for eligibility and benefits.',
    thumbnailImage: '/images/msmecertificate.jpeg',
    documentUrl: '#',
  },
  {
    _id: '2',
    documentName: 'UDYAM REGISTRATION NUMBER (MSME)',
    documentTypeLabel: 'MSME',
    description:
      'The unique Udyam Registration Number assigned to Change Life Marketing by the Ministry of MSME. This alphanumeric identifier is used for all government compliance, tax benefits, and official documentation related to our MSME status.',
    thumbnailImage: '/images/msmeregistartionnumber.jpeg',
    documentUrl: '#',
  },
  {
    _id: '3',
    documentName: 'TAX DEDUCTION ACCOUNT NUMBER (TAN) CARD',
    documentTypeLabel: 'TAN',
    description:
      'The TAN card for Change Life Marketing issued by the Indian Income Tax Department (ITD). This 10-character unique identifier is mandatory for all tax-related transactions, bank accounts, and income tax filing in India.',
    thumbnailImage: '/images/tancard.jpeg',
    documentUrl: '#',
  },
  {
    _id: '4',
    documentName: 'Labour Resource Department Registration',
    documentTypeLabel: 'Labour',
    description:
      'Official registration with the Labour Resource Department for Change Life Marketing. This certificate ensures compliance with labour laws and regulations.',
    thumbnailImage: '/images/labourregistration.jpeg',
    documentUrl: '#',
  },
  {
    _id: '5',
    documentName: 'Goods and Services Tax (GST) Certificate',
    documentTypeLabel: 'GST',
    description:
      'Official registration certificate for Goods and Services Tax (GSTIN) for Change Life Marketing. This ensures our compliance with the Indian taxation system.',
    thumbnailImage: '/images/GST.jpeg',
    documentUrl: '#',
  },
];

const TRUST_BADGES = [
  'GST Registered',
  'MSME Certified',
  'Direct Selling Company',
  'No Joining Fee Policy',
];

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-[#FFFFFF] max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top border */}
        <div className="h-1 w-full bg-[#C9A84C]" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center border border-[#0A6E5A]/20 hover:bg-[#0A6E5A] hover:text-white transition-colors text-[#0A6E5A] z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image */}
        <div className="bg-[#0A6E5A]/5 p-10 flex items-center justify-center min-h-64">
          <Image
            src={doc.thumbnailImage || '/images/default-document.png'}
            alt={doc.documentName}
            width={500}
            height={360}
            className="max-h-72 w-auto object-contain drop-shadow-lg"
          />
        </div>

        {/* Content */}
        <div className="p-8">
          <span className="inline-block px-3 py-1 bg-[#C9A84C]/10 text-[#0A6E5A] text-[0.7rem] font-['Roboto'] font-semibold uppercase tracking-wider mb-4">
            {doc.documentTypeLabel}
          </span>
          <h3 className="font-['Fraunces'] text-[1.5rem] md:text-[1.875rem] text-[#0A6E5A] leading-tight mb-4">
            {doc.documentName}
          </h3>
          <div className="h-px w-full bg-[#0A6E5A]/10 mb-4" />
          <p className="font-['Roboto'] text-[#333333]/70 text-[0.9rem] leading-relaxed mb-8">
            {doc.description}
          </p>
          {doc.documentUrl && doc.documentUrl !== '#' ? (
            <a
              href={doc.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A6E5A] text-[#FFFFFF] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/90 transition-colors text-[0.875rem]"
            >
              <ExternalLink className="w-4 h-4" />
              Open Full Document
            </a>
          ) : (
            <span className="text-[#333333]/40 text-[0.875rem] font-['Roboto']">
              Document preview only
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// ─── Doc Card ─────────────────────────────────────────────────────────────────
const DocCard = ({
  doc,
  index,
  onPreview,
}: {
  doc: LegalDoc;
  index: number;
  onPreview: (doc: LegalDoc) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 36 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.65, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    className="group flex flex-col bg-[#FFFFFF] border border-[#0A6E5A]/10 hover:border-[#C9A84C]/60 transition-all duration-400 relative overflow-hidden"
  >
    {/* corner accent */}
    <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-[#C9A84C] pointer-events-none z-10" />

    {/* Image area */}
    <button
      onClick={() => onPreview(doc)}
      className="relative aspect-4/3 w-full overflow-hidden bg-[#0A6E5A]/5 p-8 flex items-center justify-center cursor-pointer"
      aria-label={`Preview ${doc.documentName}`}
    >
      <div className="absolute inset-0 bg-[#0A6E5A]/0 group-hover:bg-[#0A6E5A]/5 transition-colors duration-500 z-10" />
      <Image
        src={doc.thumbnailImage || '/images/default-document.png'}
        alt={doc.documentName || 'Legal Document'}
        width={400}
        height={300}
        className="w-full h-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-700 ease-out"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
        <div className="bg-[#FFFFFF]/90 px-4 py-2 flex items-center gap-2 shadow-lg">
          <FileText className="w-4 h-4 text-[#0A6E5A]" />
          <span className="font-['Roboto'] text-[0.75rem] font-semibold text-[#0A6E5A] uppercase tracking-wider">
            Click to Preview
          </span>
        </div>
      </div>
    </button>

    {/* Text content */}
    <div className="p-6 md:p-8 flex flex-col grow border-t border-[#0A6E5A]/5">
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-[#C9A84C]/10 text-[#0A6E5A] text-[0.7rem] font-['Roboto'] font-semibold uppercase tracking-wider mb-3">
          {doc.documentTypeLabel || 'Certificate'}
        </span>
        <h3 className="font-['Fraunces'] text-[1.25rem] md:text-[1.5rem] text-[#0A6E5A] leading-tight">
          {doc.documentName}
        </h3>
      </div>
      <p className="font-['Roboto'] text-[#333333]/70 text-[0.875rem] leading-relaxed mb-6 grow">
        {doc.description}
      </p>

      <div className="flex items-center gap-4 mt-auto">
        <button
          onClick={() => onPreview(doc)}
          className="inline-flex items-center gap-2 text-[#0A6E5A] font-['Roboto'] font-semibold hover:text-[#C9A84C] transition-colors text-[0.875rem] group/link"
        >
          Preview Document
          <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
        </button>

        {doc.documentUrl && doc.documentUrl !== '#' && (
          <>
            <span className="text-[#0A6E5A]/20">|</span>
            <a
              href={doc.documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#C9A84C] font-['Roboto'] text-[0.8rem] hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </a>
          </>
        )}
      </div>
    </div>
  </motion.div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LegalPage() {
  const [activeDoc, setActiveDoc] = useState<LegalDoc | null>(null);

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
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#FFFFFF]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
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
            <ChevronRight className="w-3.5 h-3.5 text-[#FFFFFF]/30" />
            <span className="font-['Roboto'] text-[0.8rem] text-[#C9A84C] uppercase tracking-wider">
              Legal Documents
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#C9A84C]/20 flex items-center justify-center">
                <Shield className="w-7 h-7 text-[#C9A84C]" />
              </div>
              <span className="font-['Roboto'] text-[0.8rem] text-[#C9A84C] uppercase tracking-[0.3em] font-semibold">
                Verified & Transparent
              </span>
            </div>

            <h1 className="font-['Fraunces'] text-[2.5rem] md:text-[3.75rem] lg:text-[4.5rem] text-[#FFFFFF] leading-[1.1] tracking-tight mb-6">
              100% Legal &{' '}
              <span className="text-[#C9A84C] italic">Verified</span>
            </h1>
            <p className="font-['Roboto'] text-[1.125rem] md:text-[1.25rem] text-[#FFFFFF]/75 leading-relaxed max-w-2xl">
              Transparency is our foundation. Every certificate and registration
              listed here is government-approved and verifiable. We have nothing
              to hide.
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-14 flex flex-wrap gap-8 md:gap-16"
          >
            {[
              { label: 'Certificates', value: `5` },
              { label: 'Established', value: 'Jan 2026' },
              { label: 'Compliance', value: '100%' },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-['Fraunces'] text-[2rem] text-[#C9A84C]">{s.value}</div>
                <div className="font-['Roboto'] text-[0.75rem] text-[#FFFFFF]/60 uppercase tracking-widest mt-1">
                  {s.label}
                </div>
              </div>
            ))}
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

      {/* ── TRUST BADGES ── */}
      <section className="py-8 bg-[#FFFFFF] border-b border-[#0A6E5A]/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex flex-wrap justify-center gap-6 md:gap-12"
          >
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#C9A84C] shrink-0" />
                <span className="font-['Roboto'] font-semibold text-[#0A6E5A] tracking-wide text-[0.875rem] md:text-[1rem]">
                  {badge}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DOCUMENTS GRID ── */}
      <section className="py-24 md:py-32 bg-[#F9F7F4] relative">
        {/* dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #0A6E5A 1px, transparent 1px)',
            backgroundSize: '2.5rem 2.5rem',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-4 mb-14"
          >
            <div className="h-px flex-1 max-w-16 bg-[#C9A84C]/40" />
            <span className="font-['Roboto'] text-[0.75rem] text-[#C9A84C] uppercase tracking-[0.3em] font-semibold">
              Official Certifications
            </span>
            <div className="h-px flex-1 max-w-16 bg-[#C9A84C]/40" />
          </motion.div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {LEGAL_DOCS.map((doc, index) => (
              <DocCard
                key={doc._id}
                doc={doc}
                index={index}
                onPreview={setActiveDoc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPANY COMPLIANCE STRIP ── */}
      <section className="py-20 bg-[#0A6E5A] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
          }}
        />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid md:grid-cols-3 gap-12 md:gap-8 text-center md:text-left md:divide-x md:divide-[#FFFFFF]/10">
            {[
              {
                icon: <Shield className="w-8 h-8 text-[#C9A84C]" />,
                title: 'Government Registered',
                desc: 'Fully compliant with all Indian government regulations including GST, MSME, and MCA.',
              },
              {
                icon: <Award className="w-8 h-8 text-[#C9A84C]" />,
                title: 'No Hidden Fees',
                desc: 'Our No Joining Fee policy is legally backed. Everything is transparent and documented.',
              },
              {
                icon: <Landmark className="w-8 h-8 text-[#C9A84C]" />,
                title: 'Verified Banking',
                desc: 'All financial transactions are routed through our SBI corporate account for full traceability.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="flex flex-col items-center md:items-start px-0 md:px-10 gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-[#FFFFFF]/5 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-['Fraunces'] text-[1.25rem] text-[#FFFFFF] mb-2">{item.title}</h4>
                  <p className="font-['Roboto'] text-[0.875rem] text-[#FFFFFF]/65 leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="py-20 bg-[#FFFFFF] border-t border-[#0A6E5A]/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-['Fraunces'] text-[2rem] md:text-[2.5rem] text-[#0A6E5A] mb-4">
              Still Have Questions?
            </h2>
            <p className="font-['Roboto'] text-[#333333]/70 text-[1rem] mb-10 max-w-xl mx-auto">
              Our team is happy to verify any document or answer compliance
              questions directly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/join-now"
                className="px-8 py-4 bg-[#0A6E5A] text-[#FFFFFF] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/90 transition-colors"
              >
                Join Now — It's Free
              </Link>
              <Link
                href="/"
                className="px-8 py-4 border border-[#0A6E5A] text-[#0A6E5A] font-['Roboto'] font-semibold hover:bg-[#0A6E5A]/5 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* ── LIGHTBOX ── */}
      {activeDoc && (
        <Lightbox doc={activeDoc} onClose={() => setActiveDoc(null)} />
      )}
    </div>
  );
}