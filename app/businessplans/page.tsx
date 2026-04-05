"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Gift, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { IncomePlans, AwardsandRewards } from '@/entities';
import Image from 'next/image';

const mockIncomePlans: IncomePlans[] = [
  {
    _id: '1',
    planName: 'Direct Income',
    shortDescription: 'Earn directly from products you sell to customers',
    detailedExplanation: 'Direct Income is earned when you sell Change Life Marketing products directly to retail customers or distributors.\n\n• Earn 20-30% commission on all personal sales\n• No minimum monthly purchase requirement\n• Commissions credited weekly\n• Transparent commission structure\n• Lifetime customer relationships',
    matchingPairDetails: 'Not applicable for Direct Income. Focus on building your customer base and personal sales volume.',
    incomePotential: 'Monthly Income Potential: ₹5,000 - ₹50,000\n\nExample: Sell ₹10,000 of products = ₹2,000 - ₹3,000 commission',
    isComingSoon: false,
    diagramImage: ''
  },
  {
    _id: '2',
    planName: 'Binary Income (Booster Plan)',
    shortDescription: 'Earn from building a binary network structure',
    detailedExplanation: 'The Booster plan is our flagship income stream where you build a binary network.\n\n• Create pairs in your left and right legs\n• Earn commission on pair matching\n• Unlimited depth earning\n• Weekly bonus calculations\n• Fast track to leadership positions',
    matchingPairDetails: 'A matching pair consists of:\n• Minimum ₹2,000 from left leg + Minimum ₹2,000 from right leg\n• Commission: ₹400 per matching pair\n• Unlimited pairs per week\n• Carryover from one week to next for spillover bonus',
    incomePotential: 'Monthly Income Potential: ₹10,000 - ₹500,000+\n\nExample: 10 pairs/week = ₹4,000/week = ₹16,000/month\nWith spillover and bonuses, earn significantly more',
    isComingSoon: false,
    diagramImage: ''
  },
  {
    _id: '3',
    planName: 'Leadership Bonus',
    shortDescription: 'Additional income for team leaders',
    detailedExplanation: 'Once you achieve leadership ranks, earn additional bonuses.\n\n• Based on your organization size\n• 5% bonus on organization sales\n• Leadership level incentives\n• Team building rewards\n• Exclusive leader benefits',
    matchingPairDetails: 'Leadership bonuses are calculated based on:\n• Your current rank level\n• Total organization volume\n• Active distributor count\n• Monthly bonus pool distribution',
    incomePotential: 'Monthly Income Potential: ₹20,000 - ₹300,000\n\nBased on your team size and volume growth',
    isComingSoon: false,
    diagramImage: ''
  },
  {
    _id: '4',
    planName: 'Repurchase Bonus',
    shortDescription: 'Recurring income from team purchases',
    detailedExplanation: 'Earn bonus when your team members make monthly purchases.\n\n• 10% bonus on team purchases\n• Applied to every team member transaction\n• Automated monthly payouts\n• Builds passive recurring income\n• Incentivizes team loyalty',
    matchingPairDetails: 'Repurchase bonus applies to:\n• First level direct members\n• First 2 levels through matching legs\n• Monthly purchase volumes\n• Minimum purchase requirement: ₹1,000',
    incomePotential: 'Monthly Passive Income: ₹5,000 - ₹50,000\n\nExample: 50 team members × ₹2,000 avg purchase × 10% = ₹10,000/month',
    isComingSoon: false,
    diagramImage: ''
  }
];

const mockAwards: AwardsandRewards[] = [
  { _id: '1', rankLevel: 1, rankName: 'Bronze Member', requiredPairs: 1, monetaryValue: 1000, awardDescription: 'Starting your journey with us. Build your network and earn through direct sales.' },
  { _id: '2', rankLevel: 2, rankName: 'Silver Member', requiredPairs: 5, monetaryValue: 5000, awardDescription: 'Recognized performer building a solid downline. Enjoy increased commission rates.' },
  { _id: '3', rankLevel: 3, rankName: 'Gold Member', requiredPairs: 10, monetaryValue: 15000, awardDescription: 'Elite achiever with significant network growth. Access exclusive benefits and training.' },
  { _id: '4', rankLevel: 4, rankName: 'Platinum Member', requiredPairs: 25, monetaryValue: 50000, awardDescription: 'Top-tier performer with exceptional leadership. International recognition and incentives.' },
  { _id: '5', rankLevel: 5, rankName: 'Diamond Member', requiredPairs: 50, monetaryValue: 150000, awardDescription: 'Ultimate achievement in our organization. Lifetime benefits and executive privileges.' },
  { _id: '6', rankLevel: 6, rankName: 'Crown Member', requiredPairs: 100, monetaryValue: 500000, awardDescription: 'Highest honor reserved for visionary leaders. Global recognition and special rewards.' }
];

export default function BusinessPlanPage() {
  const [incomePlans] = useState<IncomePlans[]>(mockIncomePlans);
  const [awards] = useState<AwardsandRewards[]>(mockAwards);

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