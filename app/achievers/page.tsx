"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, Users, Zap, Target, ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AchieversGallery } from '@/entities';

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

export default function AchieversPage() {
  const [achievers] = useState<AchieversGallery[]>(mockAchievers);

  const placeholderSlots = Math.max(0, 8 - achievers.length);

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <Header />

      {/* Hero Section */}
      <section className="bg-[#0A6E5A] py-20">
        <div className="max-w-400 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Trophy className="w-16 h-16 text-[#C9A84C] mx-auto mb-6" />
            <h1 className="font-['Fraunces'] text-[2.25rem] md:text-[3.75rem] text-[#FFFFFF] mb-4">
              Hall of Fame
            </h1>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF] max-w-3xl mx-auto">
              Celebrating our Booster Plan achievers and award recipients
            </p>
          </motion.div>
        </div>
      </section>

      {/* First Booster Achiever Section */}
      {achievers.length > 0 && (
        <section className="py-20 bg-[#FFFFFF]">
          <div className="max-w-400 mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <Star className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
              <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] text-[#0A6E5A] mb-4">
                First Booster Achiever
              </h2>
              <p className="font-['Roboto'] text-[1.125rem] text-[#333333]">
                Pioneering success and inspiring the community
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto bg-linear-to-br from-[#C9A84C] to-[#F5A623] p-1 rounded-lg"
            >
              <div className="bg-[#FFFFFF] rounded-lg p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <div className="absolute -inset-4 bg-[#C9A84C] rounded-full opacity-20 animate-pulse"></div>
                    <Image
                      src={achievers[0].profilePhoto || ''}
                      alt={achievers[0].achieverName || 'First Achiever'}
                      className="relative w-48 h-48 rounded-full object-cover border-8 border-[#C9A84C]"
                      width={192}
                      height={192}
                    />
                    <div className="absolute -bottom-2 -right-2 bg-[#C9A84C] rounded-full p-3">
                      <Trophy className="w-8 h-8 text-[#FFFFFF]" />
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="font-['Fraunces'] text-[1.875rem] md:text-[2.25rem] text-[#0A6E5A] mb-2">
                      {achievers[0].achieverName}
                    </h3>
                    <p className="font-['Roboto'] text-[1.25rem] text-[#C9A84C] mb-4">
                      {achievers[0].rankAchievement}
                    </p>
                    <p className="font-['Roboto'] text-[1.125rem] text-[#333333] mb-4">
                      <span className="font-semibold">Location:</span> {achievers[0].locationState}
                    </p>
                    <p className="font-['Roboto'] text-[#333333]">
                      {achievers[0].description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Booster Achievers Grid */}
      <section className="py-20 bg-[#0A6E5A]">
        <div className="max-w-400 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Award className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
            <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] text-[#FFFFFF] mb-4">
              Booster Achievers Gallery
            </h2>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF]">
              Join our growing community of successful achievers
            </p>
          </motion.div>

          <div className="min-h-100">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
            >
              {achievers.slice(1).map((achiever, index) => (
                <motion.div
                  key={achiever._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#FFFFFF] rounded-lg p-6 text-center hover:shadow-2xl transition-shadow"
                >
                  <div className="relative mb-4">
                    <Image
                      src={achiever.profilePhoto || ''}
                      alt={achiever.achieverName || 'Achiever'}
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#C9A84C] mx-auto"
                      width={128}
                      height={128}
                    />
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#C9A84C] rounded-full p-2">
                      <Trophy className="w-5 h-5 text-[#FFFFFF]" />
                    </div>
                  </div>
                  <h3 className="font-['Fraunces'] text-[1.25rem] text-[#0A6E5A] mb-2">{achiever.achieverName}</h3>
                  <p className="font-['Roboto'] text-[0.875rem] text-[#C9A84C] mb-2">{achiever.rankAchievement}</p>
                  <p className="font-['Roboto'] text-[0.875rem] text-[#333333]">{achiever.locationState}</p>
                </motion.div>
              ))}

              {Array.from({ length: placeholderSlots }).map((_, index) => (
                <motion.div
                  key={`placeholder-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (achievers.length - 1 + index) * 0.1 }}
                  className="bg-[#FFFFFF] rounded-lg p-6 text-center border-4 border-dashed border-[#C9A84C]"
                >
                  <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                    <Star className="w-12 h-12 text-[#C9A84C]" />
                  </div>
                  <h3 className="font-['Fraunces'] text-[1.125rem] text-[#0A6E5A] mb-2">Next Achiever</h3>
                  <p className="font-['Roboto'] text-[0.875rem] text-[#C9A84C] font-semibold">Could Be You!</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}