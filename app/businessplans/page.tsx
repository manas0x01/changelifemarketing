"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Gift, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IncomePlans, AwardsandRewards } from '@/entities';
import Image from 'next/image';

const mockIncomePlans: IncomePlans[] = [];

const mockAwards: AwardsandRewards[] = [];

export default function BusinessPlanPage() {
  const [incomePlans, setIncomePlans] = useState<IncomePlans[]>([]);
  const [awards, setAwards] = useState<AwardsandRewards[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, awardsRes] = await Promise.all([
          fetch('/api/income-plans'),
          fetch('/api/awards')
        ]);

        if (plansRes.ok) {
          const plansData = await plansRes.json();
          setIncomePlans(plansData.data || []);
        }

        if (awardsRes.ok) {
          const awardsData = await awardsRes.json();
          setAwards(awardsData.data || []);
        }
      } catch (error) {
        setIncomePlans([]);
        setAwards([]);
      }
    };

    fetchData();
  }, []);

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
            <TrendingUp className="w-16 h-16 text-[#C9A84C] mx-auto mb-6" />
            <h1 className="font-['Fraunces'] text-[2.25rem] md:text-[3.75rem] text-[#FFFFFF] mb-4">
              Business & Income Plan
            </h1>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF] max-w-3xl mx-auto">
              Discover multiple income streams and unlimited earning potential
            </p>
          </motion.div>
        </div>
      </section>

      {/* Income Plans Section */}
      <section className="py-20 bg-[#FFFFFF]">
        <div className="max-w-400 mx-auto px-6">
          <div className="min-h-100">
            {incomePlans.length > 0 ? (
              <div className="space-y-16">
                {incomePlans.map((plan, index) => (
                  <motion.div
                    key={plan._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`${
                      index % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#0A6E5A]'
                    } rounded-lg overflow-hidden border-4 ${
                      index % 2 === 0 ? 'border-[#0A6E5A]' : 'border-[#C9A84C]'
                    }`}
                  >
                    <div className={`p-8 md:p-12 ${index % 2 === 0 ? '' : 'text-[#FFFFFF]'}`}>
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`w-16 h-16 rounded-full ${
                          index % 2 === 0 ? 'bg-[#C9A84C]' : 'bg-[#FFFFFF]'
                        } flex items-center justify-center`}>
                          <span className={`font-['Fraunces'] text-[1.5rem] ${
                            index % 2 === 0 ? 'text-[#FFFFFF]' : 'text-[#0A6E5A]'
                          }`}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <div>
                          <h2 className={`font-['Fraunces'] text-[1.875rem] md:text-[2.25rem] ${
                            index % 2 === 0 ? 'text-[#0A6E5A]' : 'text-[#C9A84C]'
                          }`}>
                            {plan.planName}
                          </h2>
                          {plan.isComingSoon && (
                            <span className="inline-block bg-[#F5A623] text-[#FFFFFF] px-3 py-1 rounded text-[0.875rem] font-['Roboto'] font-semibold mt-2">
                              Coming Soon
                            </span>
                          )}
                        </div>
                      </div>

                      <p className={`font-['Roboto'] text-[1.125rem] mb-6 ${
                        index % 2 === 0 ? 'text-black' : 'text-[#FFFFFF]'
                      }`}>
                        {plan.shortDescription}
                      </p>

                      {plan.diagramImage && (
                        <div className="mb-6">
                          <Image
                            src={plan.diagramImage}
                            alt={`${plan.planName} Diagram`}
                            className="w-full max-w-2xl mx-auto rounded-lg"
                            width={800}
                          />
                        </div>
                      )}

                      <div className={`${
                        index % 2 === 0 ? 'bg-[#0A6E5A]' : 'bg-[#FFFFFF]'
                      } p-6 rounded-lg mb-6`}>
                        <h3 className={`font-['Fraunces'] text-[1.25rem] mb-4 ${
                          index % 2 === 0 ? 'text-[#C9A84C]' : 'text-[#0A6E5A]'
                        }`}>
                          Detailed Explanation:
                        </h3>
                        <p className="font-['Roboto'] whitespace-pre-line text-[#C9A84C]">
                          {plan.detailedExplanation}
                        </p>
                      </div>

                      {plan.matchingPairDetails && (
                        <div className={`${
                          index % 2 === 0 ? 'bg-[#C9A84C]' : 'bg-[#1B7A6B]'
                        } p-6 rounded-lg mb-6`}>
                          <h3 className="font-['Fraunces'] text-[1.25rem] mb-4 text-[#FFFFFF]">
                            Matching Pair Details:
                          </h3>
                          <p className="font-['Roboto'] whitespace-pre-line text-[#FFFFFF]">
                            {plan.matchingPairDetails}
                          </p>
                        </div>
                      )}

                      {plan.incomePotential && (
                        <div className={`border-4 ${
                          index % 2 === 0 ? 'border-[#C9A84C]' : 'border-[#FFFFFF]'
                        } p-6 rounded-lg`}>
                          <h3 className="font-['Fraunces'] text-[1.5rem] mb-4 text-[#C9A84C]">
                            Income Potential:
                          </h3>
                          <p className="font-['Roboto'] text-[1.25rem] whitespace-pre-line text-[#C9A84C]">
                            {plan.incomePotential}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Awards & Rewards Section */}
      <section className="py-20 bg-[#0A6E5A]">
        <div className="max-w-400 mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Award className="w-16 h-16 text-[#C9A84C] mx-auto mb-6" />
            <h2 className="font-['Fraunces'] text-[2.25rem] md:text-[3rem] text-[#FFFFFF] mb-4">
              Awards & Rewards
            </h2>
            <p className="font-['Roboto'] text-[1.125rem] text-[#FFFFFF]">
              Exclusive rewards for Booster Plan achievers
            </p>
          </motion.div>

          <div className="min-h-100">
            {awards.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-[#FFFFFF] rounded-lg overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#C9A84C]">
                      <tr>
                        <th className="font-['Fraunces'] text-[1.125rem] text-[#FFFFFF] px-6 py-4 text-left">Rank Level</th>
                        <th className="font-['Fraunces'] text-[1.125rem] text-[#FFFFFF] px-6 py-4 text-left">Rank Name</th>
                        <th className="font-['Fraunces'] text-[1.125rem] text-[#FFFFFF] px-6 py-4 text-left">Required Pairs</th>
                        <th className="font-['Fraunces'] text-[1.125rem] text-[#FFFFFF] px-6 py-4 text-left">Award Description</th>
                        <th className="font-['Fraunces'] text-[1.125rem] text-[#FFFFFF] px-6 py-4 text-left">Monetary Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awards.map((award, index) => (
                        <tr
                          key={award._id}
                          className={`${
                            index % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-gray-50'
                          } border-b border-gray-200`}
                        >
                          <td className="font-['Roboto'] px-6 py-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 bg-[#0A6E5A] text-[#FFFFFF] rounded-full font-semibold">
                              {award.rankLevel}
                            </span>
                          </td>
                          <td className="font-['Fraunces'] text-[1.125rem] text-[#0A6E5A] px-6 py-4">
                            {award.rankName}
                          </td>
                          <td className="font-['Roboto'] text-[#C9A84C] px-6 py-4">
                            {award.requiredPairs?.toLocaleString()} pairs
                          </td>
                          <td className="font-['Roboto'] text-[#C9A84C] px-6 py-4">
                            {award.awardDescription}
                          </td>
                          <td className="font-['Fraunces'] text-[1.25rem] text-[#C9A84C] px-6 py-4">
                            {award.monetaryValue ? `₹${award.monetaryValue.toLocaleString()}` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}