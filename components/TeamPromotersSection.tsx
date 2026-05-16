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
      'Experienced network marketer and business coach helping members unlock financial freedom through proven strategies. With over a decade of experience in network marketing, Prem Kumar has successfully guided hundreds of individuals towards their financial goals. His expertise in business development and mentoring makes him the perfect guide for your journey.',
    image: '/images/premkumar.png',
    whatsapp: '9185441672221',
    badges: ['Business Coach', 'Top Promoter'],
  },
];

// ─── WhatsApp URL helper ───────────────────────────────────────────────────────
const whatsappUrl = (number: string, name: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(
    `Hello ${name}, I am interested in Change Life Marketing. Please guide me.`
  )}`;

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function TeamPromotersSection() {
  const member = TEAM_MEMBERS[0];

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
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* LEFT: Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative group"
          >
            <div className="relative aspect-3/4 w-full overflow-hidden bg-[#0A6E5A]/5">
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#C9A84C] z-10" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#C9A84C] z-10" />

              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-[#0A6E5A]/0 group-hover:bg-[#0A6E5A]/5 transition-colors duration-500" />
            </div>
          </motion.div>

          {/* RIGHT: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col"
          >
            {/* Label */}
            <p className="font-['Roboto'] text-[0.8rem] text-[#C9A84C] uppercase tracking-[0.3em] font-semibold mb-4">
              Our Coach
            </p>

            {/* Name */}
            <h2 className="font-['Fraunces'] text-[2.5rem] md:text-[3.5rem] text-[#0A6E5A] leading-tight mb-2">
              {member.name}
            </h2>

            {/* Role */}
            <p className="font-['Roboto'] text-[1rem] md:text-[1.125rem] text-[#C9A84C] font-semibold mb-6">
              {member.role}
            </p>

            {/* Divider */}
            <div className="h-px w-16 bg-[#0A6E5A]/20 mb-8" />

            {/* Badges */}
            {member.badges && member.badges.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {member.badges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/10 text-[#0A6E5A] text-[0.75rem] font-['Roboto'] font-semibold uppercase tracking-wider"
                  >
                    <Star className="w-4 h-4 text-[#C9A84C]" />
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <p className="font-['Roboto'] text-[1rem] text-[#333333]/75 leading-relaxed mb-10 flex-1">
              {member.description}
            </p>

            {/* WhatsApp Button */}
            <a
              href={whatsappUrl(member.whatsapp, member.name)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Contact ${member.name} on WhatsApp`}
              className="group/btn relative overflow-hidden inline-flex items-center justify-center gap-3 w-full md:w-auto px-8 md:px-10 py-4 bg-[#25D366] hover:bg-[#1ebe5d] transition-colors duration-300 font-['Roboto'] font-semibold text-[#FFFFFF] text-[1rem]"
            >
              {/* shimmer */}
              <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <MessageCircle className="w-5 h-5" />
              <span>Connect on WhatsApp</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}