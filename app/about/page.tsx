"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Target, Heart, Zap, Globe, CheckCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AchieversGallery, AwardsandRewards } from '@/entities';
import Link from 'next/link';

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

const mockAwards: AwardsandRewards[] = [
  {
    _id: '1',
    rankName: 'Bronze Associate',
    rankLevel: 1,
    requiredPairs: 5,
    monetaryValue: 50,
    awardDescription: 'Certificate of Achievement and exclusive Bronze pin.'
  },
  {
    _id: '2',
    rankName: 'Silver Associate',
    rankLevel: 2,
    requiredPairs: 15,
    monetaryValue: 150,
    awardDescription: 'Silver recognition plaque and a bonus cash reward.'
  },
  {
    _id: '3',
    rankName: 'Gold Associate',
    rankLevel: 3,
    requiredPairs: 30,
    monetaryValue: 300,
    awardDescription: 'Gold-plated trophy and a luxury brand gift voucher.'
  },
  {
    _id: '4',
    rankName: 'Platinum Associate',
    rankLevel: 4,
    requiredPairs: 60,
    monetaryValue: 600,
    awardDescription: 'Exclusive Platinum ring and an invitation to the annual leadership retreat.'
  },
  {
    _id: '5',
    rankName: 'Ruby Director',
    rankLevel: 5,
    requiredPairs: 120,
    monetaryValue: 1200,
    awardDescription: 'Ruby Director custom watch and a significant cash bonus.'
  },
  {
    _id: '6',
    rankName: 'Emerald Director',
    rankLevel: 6,
    requiredPairs: 250,
    monetaryValue: 2500,
    awardDescription: 'All-expenses-paid luxury vacation for two.'
  },
  {
    _id: '7',
    rankName: 'Diamond Director',
    rankLevel: 7,
    requiredPairs: 500,
    monetaryValue: 5000,
    awardDescription: 'Custom Diamond Director pendant and a substantial car allowance.'
  },
  {
    _id: '8',
    rankName: 'Blue Diamond Director',
    rankLevel: 8,
    requiredPairs: 1000,
    monetaryValue: 10000,
    awardDescription: 'Luxury timepiece and a down payment for a new home.'
  },
  {
    _id: '9',
    rankName: 'Black Diamond Director',
    rankLevel: 9,
    requiredPairs: 2000,
    monetaryValue: 20000,
    awardDescription: 'Exclusive Black Diamond ring and a significant investment portfolio contribution.'
  },
  {
    _id: '10',
    rankName: 'Crown Diamond Director',
    rankLevel: 10,
    requiredPairs: 4000,
    monetaryValue: 40000,
    awardDescription: 'Custom-designed Crown Diamond trophy and a luxury car of choice.'
  },
  {
    _id: '11',
    rankName: 'Presidential Diamond',
    rankLevel: 11,
    requiredPairs: 8000,
    monetaryValue: 80000,
    awardDescription: 'Lifetime achievement award and a substantial cash prize for financial freedom.'
  },
  {
    _id: '12',
    rankName: 'Ambassador',
    rankLevel: 12,
    requiredPairs: 15000,
    monetaryValue: 150000,
    awardDescription: 'Global recognition trip and a personalized philanthropic fund.'
  },
  {
    _id: '13',
    rankName: 'Global Ambassador',
    rankLevel: 13,
    requiredPairs: 30000,
    monetaryValue: 300000,
    awardDescription: 'Ultimate legacy award, a custom estate, and a private jet experience.'
  }
];

const mockAchievers: AchieversGallery[] = [
  {
    _id: '1',
    achieverName: 'Priya Sharma',
    profilePhoto: '/images/priyasharma.png',
    rankAchievement: 'Top Performer - Q3 2023',
    locationState: 'Maharashtra, India',
    description: 'Consistent effort and the Booster Plan\'s resources were key to my success. Truly grateful for the support!'
  },
  {
    _id: '2',
    achieverName: 'David Chen',
    profilePhoto: '/images/davidchen.png',
    rankAchievement: 'Innovation Award Winner',
    locationState: 'California, USA',
    description: 'The Booster Plan provided the perfect environment to experiment and bring my ideas to life. This award means a lot.'
  },
  {
    _id: '3',
    achieverName: 'Fatima Zahra',
    profilePhoto: '/images/fatimazahra.png',
    rankAchievement: 'Highest Growth Achiever',
    locationState: 'Dubai, UAE',
    description: 'I never thought I could achieve so much in such a short time. The structured approach of the Booster Plan made all the difference.'
  },
  {
    _id: '4',
    achieverName: 'Carlos Rodriguez',
    profilePhoto: '/images/carlosrodriguez.png',
    rankAchievement: 'Community Leader of the Year',
    locationState: 'Madrid, Spain',
    description: 'Being part of this community and contributing to its growth has been incredibly rewarding. Thank you for this recognition!'
  },
  {
    _id: '5',
    achieverName: 'Sophie Dubois',
    profilePhoto: '/images/sophiedubois.png',
    rankAchievement: 'Excellence in Project Management',
    locationState: 'Paris, France',
    description: 'Effective planning and the collaborative tools from the Booster Plan were instrumental in delivering our project ahead of schedule and under budget.'
  },
];

export default function AboutPage() {
  const [achievers] = useState<AchieversGallery[]>(mockAchievers);
  const [awards] = useState<AwardsandRewards[]>(mockAwards);

  return (
    <div className="min-h-screen bg-[#FFFFFF] selection:bg-[#C9A84C]/30 selection:text-[#0A6E5A] overflow-clip">
      <Header />

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden bg-[#0A6E5A] py-24">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/aboutusbackground.png"
            alt="About us background"
            className="w-full h-full object-cover"
            width={1920}
            height={1024}
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#0A6E5A]/80 via-[#0A6E5A]/60 to-[#0A6E5A]/90 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-[#0A6E5A]/30"></div>
        </div>

        <div className="relative z-10 w-full max-w-480 mx-auto px-6 md:px-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Fraunces'] text-[3rem] md:text-[4.5rem] lg:text-[6rem] text-[#FFFFFF] mb-8 max-w-6xl leading-[1.1] tracking-tight text-balance drop-shadow-lg mx-auto"
          >
            About <span className="text-[#C9A84C] italic">Change Life Marketing</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-['Roboto'] text-[1.25rem] md:text-[1.5rem] text-[#FFFFFF]/90 max-w-3xl mx-auto"
          >
            Empowering individuals through natural health products and sustainable business opportunities
          </motion.p>
        </div>
      </section>

      {/* OUR STORY SECTION */}
      <section className="py-32 bg-[#FFFFFF] relative">
        <div className="max-w-480 mx-auto px-6 md:px-12">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative aspect-4/5 w-full overflow-hidden rounded-sm">
                <Image
                  src="/images/changelifemarketingteam.png"
                  alt="Change Life Marketing Team"
                  className="w-full h-full object-cover"
                  width={800}
                  height={960}
                />
                <div className="absolute inset-0 border border-[#0A6E5A]/10 m-4 rounded-sm pointer-events-none"></div>
              </div>
            </motion.div>
            <div className="lg:pt-0">
              <SectionHeading title="Our Story" align="left" />
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="space-y-4"
                >
                  <p className="font-['Roboto'] text-[1.125rem] text-[#333333]/80 leading-relaxed">
                    Founded in January 2026, Change Life Marketing emerged from a vision to revolutionize the direct selling industry in India. We believe in the power of natural health products combined with ethical business practices.
                  </p>
                  <p className="font-['Roboto'] text-[1.125rem] text-[#333333]/80 leading-relaxed">
                    Our founder, Mr. Ajay Kumar, brings over 10 years of network marketing expertise and a passion for creating genuine opportunities. With a background in graphics design and deep understanding of the industry, he envisioned a company that prioritizes member success over profit maximization.
                  </p>
                </motion.div>

                <div className="h-px w-full bg-[#0A6E5A]/10"></div>

                <div className="grid sm:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-6 h-6 text-[#C9A84C]" />
                      <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A]">Integrity First</h3>
                    </div>
                    <p className="font-['Roboto'] text-[#333333]/70">We operate with complete transparency and ethical practices in all business dealings.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-6 h-6 text-[#C9A84C]" />
                      <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A]">Innovation</h3>
                    </div>
                    <p className="font-['Roboto'] text-[#333333]/70">Continuously evolving our products and business model to meet market demands.</p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE VALUES SECTION */}
      <section className="py-32 bg-[#0A6E5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}></div>

        <div className="max-w-480 mx-auto px-6 md:px-12 relative z-10">
          <SectionHeading title="Our Core Values" subtitle="The principles that guide everything we do" light />

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Target, title: "Member Success", description: "Your success is our success. We're committed to providing tools, training, and support for sustainable growth." },
              { icon: Globe, title: "Natural Health", description: "We believe in the power of nature. All our products are carefully formulated with natural ingredients." },
              { icon: Users, title: "Community", description: "Building a supportive network where members uplift each other and grow together." }
            ].map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-[#FFFFFF]/10 backdrop-blur-sm p-8 rounded-sm border border-[#FFFFFF]/10 hover:border-[#C9A84C]/30 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-[#C9A84C]/20 flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-[#C9A84C]" />
                  </div>
                  <h3 className="font-['Fraunces'] text-[1.5rem] text-[#FFFFFF] mb-4">{value.title}</h3>
                  <p className="font-['Roboto'] text-[#FFFFFF]/80">{value.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AWARDS & RECOGNITION SECTION */}
      <section className="py-32 bg-[#FFFFFF]">
        <div className="max-w-480 mx-auto px-6 md:px-12">
          <SectionHeading
            title="Ranks & Recognition"
            subtitle="Celebrating the achievements of our top performers"
          />

          <div className="min-h-100">
            {awards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {awards.map((award, index) => (
                  <motion.div
                    key={award._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-[#FFFFFF] border border-[#0A6E5A]/10 hover:border-[#C9A84C]/50 transition-colors p-8 rounded-sm group"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0">
                        <Award className="w-6 h-6 text-[#C9A84C]" />
                      </div>
                      <div>
                        <h3 className="font-['Fraunces'] text-[1.5rem] text-[#0A6E5A]">{award.rankName}</h3>
                        <p className="font-['Roboto'] text-[0.875rem] text-[#C9A84C] font-semibold uppercase tracking-wider mt-1">Level {award.rankLevel}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6 border-y border-[#0A6E5A]/10 py-6">
                      <div className="flex justify-between items-center">
                        <span className="font-['Roboto'] text-[#333333]/60 text-[0.875rem]">Required Pairs</span>
                        <span className="font-['Fraunces'] text-[1.5rem] text-[#0A6E5A]">{award.requiredPairs}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-['Roboto'] text-[#333333]/60 text-[0.875rem]">Monetary Value</span>
                        <span className="font-['Fraunces'] text-[1.5rem] text-[#C9A84C]">₹{award.monetaryValue?.toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="font-['Roboto'] text-[#333333]/70 text-[0.875rem] leading-relaxed">
                      {award.awardDescription}
                    </p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[#333333]/50 py-12">No rank information available at this time.</div>
            )}
          </div>
        </div>
      </section>

      {/* ACHIEVERS GALLERY SECTION */}
      <section className="py-32 bg-[#0A6E5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #ffffff 1px, transparent 1px)', backgroundSize: '3rem 3rem' }}></div>

        <div className="max-w-480 mx-auto px-6 md:px-12 relative z-10">
          <SectionHeading
            title="Meet Our Achievers"
            subtitle="Inspiring stories from members who transformed their lives"
            light
          />

          <div className="min-h-100">
            {achievers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {achievers.map((achiever, index) => (
                  <motion.div
                    key={achiever._id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-[#FFFFFF]/10 backdrop-blur-sm border border-[#FFFFFF]/20 hover:border-[#C9A84C]/50 transition-all duration-300 overflow-hidden group rounded-sm"
                  >
                    <div className="relative aspect-3/4 overflow-hidden bg-[#0A6E5A]/20">
                      {achiever.profilePhoto ? (
                        <Image
                          src={achiever.profilePhoto}
                          alt={achiever.achieverName || 'Achiever'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          width={400}
                          height={533}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0A6E5A]/30">
                          <Users className="w-16 h-16 text-[#FFFFFF]/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-[#0A6E5A]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-['Fraunces'] text-[1.5rem] text-[#FFFFFF] mb-2">{achiever.achieverName}</h3>

                      <div className="space-y-2 mb-4">
                        {achiever.rankAchievement && (
                          <p className="font-['Roboto'] text-[#C9A84C] font-semibold text-[0.875rem] uppercase tracking-wider">
                            {achiever.rankAchievement}
                          </p>
                        )}
                        {achiever.locationState && (
                          <p className="font-['Roboto'] text-[#FFFFFF]/70 text-[0.875rem]">
                            📍 {achiever.locationState}
                          </p>
                        )}
                      </div>

                      {achiever.description && (
                        <p className="font-['Roboto'] text-[#FFFFFF]/80 text-[0.875rem] leading-relaxed">
                          {achiever.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[#FFFFFF]/50 py-12">No achievers to display at this time.</div>
            )}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className="py-32 bg-[#FFFFFF]">
        <div className="max-w-480 mx-auto px-6 md:px-12">
          <SectionHeading
            title="Why Choose Us?"
            subtitle="What sets Change Life Marketing apart"
          />

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {[
              { title: "No Joining Fee", description: "Start your journey without any upfront investment. We believe in removing barriers to entry." },
              { title: "Natural Products", description: "All our products are formulated with premium natural ingredients for optimal health benefits." },
              { title: "Transparent Structure", description: "Clear, ethical compensation plan with no hidden terms. Know exactly what you're earning." },
              { title: "Comprehensive Support", description: "Training, mentorship, and marketing materials provided to ensure your success." },
              { title: "Government Registered", description: "GST registered and MSME certified. Operating with full legal compliance and transparency." },
              { title: "Secure Banking", description: "All transactions routed through State Bank of India for maximum security and trust." }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                className="flex gap-6"
              >
                <div className="w-12 h-12 rounded-full bg-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle className="w-6 h-6 text-[#C9A84C]" />
                </div>
                <div>
                  <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A] mb-2">{item.title}</h3>
                  <p className="font-['Roboto'] text-[#333333]/70">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* CTA SECTION */}
      <section className="py-24 bg-[#0A6E5A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '4rem 4rem' }}></div>

        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] text-[#FFFFFF] mb-6">Join Our Growing Community</h2>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF]/80 mb-10 max-w-2xl mx-auto">
              Be part of a movement that's changing lives through natural health products and ethical business practices.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/join-now" className="group relative overflow-hidden rounded-none bg-[#C9A84C] px-10 py-5 transition-all hover:bg-[#FFFFFF]">
                <div className="absolute inset-0 w-0 bg-[#FFFFFF] transition-all duration-250 ease-out group-hover:w-full"></div>
                <span className="relative flex items-center justify-center gap-3 font-['Roboto'] font-semibold text-[1.125rem] text-[#0A6E5A] group-hover:text-[#0A6E5A]">
                  Get Started Today
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
              <Link href="/contact" className="px-10 py-5 border border-[#FFFFFF] text-[#FFFFFF] font-['Roboto'] font-semibold hover:bg-[#FFFFFF]/10 transition-colors">
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
  );
}