export async function GET() {
  try {
    const incomePlans = [
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

    return Response.json({ success: true, data: incomePlans });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching income plans' },
      { status: 500 }
    );
  }
}
