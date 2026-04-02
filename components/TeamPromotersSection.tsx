"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MessageCircle, Star, ChevronRight } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TeamMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  whatsapp: string;
  badges?: string[];
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Mr. Prem Kumar',
    role: 'Business Coach & Company Promoter',
    description:
      'Experienced network marketer and business coach helping members unlock financial freedom through proven strategies.',
    image: '/images/premkumar.png',   // <-- swap with actual path
    whatsapp: '918299471579',
    badges: ['Business Coach', 'Top Promoter'],
  },
  {
    id: '2',
    name: 'Mr. Ajay Kumar',
    role: 'Director & Founder',
    description:
      'Graphics Designer with 10 years of network marketing experience, leading the vision of Change Life Marketing.',
    image: '/images/ajaykumar.png',
    whatsapp: '918299471579',
    badges: ['Founder', 'Director'],
  },
];

// ─── WhatsApp URL helper ───────────────────────────────────────────────────────
const whatsappUrl = (number: string, name: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(
    `Hello ${name}, I am interested in Change Life Marketing. Please guide me.`
  )}`;

// ─── Card Component ───────────────────────────────────────────────────────────
const TeamCard = ({ member, index }: { member: TeamMember; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
    className="group relative flex flex-col bg-[#FFFFFF] border border-[#0A6E5A]/10 hover:border-[#C9A84C]/60 transition-all duration-500 overflow-hidden"
  >
    {/* Gold corner accent */}
    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#C9A84C] pointer-events-none z-10" />

    {/* Profile Image */}
    <div className="relative w-full aspect-square bg-[#0A6E5A]/5 overflow-hidden flex items-center justify-center">
      {/* Decorative ring */}
      <div className="absolute inset-6 rounded-full border-2 border-[#C9A84C]/20 z-0 group-hover:border-[#C9A84C]/50 transition-colors duration-500" />

      <div className="relative w-[72%] aspect-square rounded-full overflow-hidden border-4 border-[#FFFFFF] shadow-xl z-10 group-hover:scale-105 transition-transform duration-700 ease-out">
        <Image
          src={member.image}
          alt={member.name}
          fill
          className="object-cover object-top"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>

      {/* Subtle green overlay on hover */}
      <div className="absolute inset-0 bg-[#0A6E5A]/0 group-hover:bg-[#0A6E5A]/5 transition-colors duration-500" />
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1 p-6 md:p-8">
      {/* Badges */}
      {member.badges && member.badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {member.badges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#C9A84C]/10 text-[#0A6E5A] text-[0.7rem] font-['Roboto'] font-semibold uppercase tracking-wider"
            >
              <Star className="w-3 h-3 text-[#C9A84C]" />
              {badge}
            </span>
          ))}
        </div>
      )}

      <h3 className="font-['Fraunces'] text-[1.5rem] md:text-[1.75rem] text-[#0A6E5A] leading-tight mb-1">
        {member.name}
      </h3>

      <p className="font-['Roboto'] text-[0.8rem] text-[#C9A84C] font-semibold uppercase tracking-widest mb-4">
        {member.role}
      </p>

      <div className="h-px w-12 bg-[#0A6E5A]/20 mb-4" />

      <p className="font-['Roboto'] text-[0.875rem] text-[#333333]/70 leading-relaxed flex-1">
        {member.description}
      </p>

      {/* WhatsApp CTA */}
      <a
        href={whatsappUrl(member.whatsapp, member.name)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Contact ${member.name} on WhatsApp`}
        className="mt-6 group/btn relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] hover:bg-[#1ebe5d] transition-colors duration-300 font-['Roboto'] font-semibold text-[#FFFFFF] text-[0.95rem] rounded-none"
      >
        {/* shimmer */}
        <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <MessageCircle className="w-5 h-5" />
        Contact on WhatsApp
        <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
      </a>
    </div>
  </motion.div>
);

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function TeamPromotersSection() {
  return (
    <section className="py-28 md:py-36 bg-[#F9F7F4] relative overflow-hidden">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, #0A6E5A 1px, transparent 1px)',
          backgroundSize: '2.5rem 2.5rem',
        }}
      />

      {/* Decorative gold bar */}
      <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#C9A84C]/0 via-[#C9A84C]/60 to-[#C9A84C]/0" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="font-['Roboto'] text-[0.8rem] text-[#C9A84C] uppercase tracking-[0.3em] font-semibold mb-4">
              Our Team
            </p>
            <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] lg:text-[3.75rem] tracking-tight text-[#0A6E5A] mb-6">
              Meet the Visionaries
            </h2>
            <p className="font-['Roboto'] text-[1.125rem] md:text-[1.25rem] text-[#333333]/70 max-w-2xl mx-auto">
              Our coaches and promoters are here to guide you every step of the
              way. Connect directly on WhatsApp.
            </p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2, ease: 'easeInOut' }}
            className="h-px w-24 mt-8 mx-auto bg-[#0A6E5A]/20"
            style={{ transformOrigin: 'center' }}
          />
        </div>

        {/* Cards Grid — responsive: 1 col → 2 col → up to 4 col */}
        <div
          className={`grid gap-8 md:gap-10
            grid-cols-1
            ${TEAM_MEMBERS.length === 2 ? 'sm:grid-cols-2 max-w-3xl mx-auto' : ''}
            ${TEAM_MEMBERS.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}
            ${TEAM_MEMBERS.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : ''}
          `}
        >
          {TEAM_MEMBERS.map((member, i) => (
            <TeamCard key={member.id} member={member} index={i} />
          ))}
        </div>

        {/* Bottom CTA strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 border border-[#0A6E5A]/10 bg-[#FFFFFF] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <h3 className="font-['Fraunces'] text-[1.75rem] md:text-[2rem] text-[#0A6E5A] mb-2">
              Have Questions? We're Here.
            </h3>
            <p className="font-['Roboto'] text-[#333333]/70 text-[0.95rem]">
              Reach out directly to our team on WhatsApp — no waiting, no
              hassle.
            </p>
          </div>

          <a
            href={`https://wa.me/918299471579?text=${encodeURIComponent(
              'Hello! I want to know more about Change Life Marketing.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1ebe5d] transition-colors font-['Roboto'] font-semibold text-[#FFFFFF] text-[1rem] whitespace-nowrap"
          >
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <MessageCircle className="w-5 h-5" />
            Chat with Us Now
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}