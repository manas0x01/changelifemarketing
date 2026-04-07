export async function GET() {
  try {
    const awards = [
      {
        _id: '1',
        rankName: 'Gold',
        rankLevel: 1,
        requiredPairs: 5,
        award: 'Bag + Business Kit'
      },
      {
        _id: '2',
        rankName: 'Super Gold',
        rankLevel: 2,
        requiredPairs: 15,
        award: '₹150 - Silver recognition plaque and a bonus cash reward.'
      },
      {
        _id: '3',
        rankName: 'Gold Associate',
        rankLevel: 3,
        requiredPairs: 30,
        award: '₹300 - Gold-plated trophy and a luxury brand gift voucher.'
      },
      {
        _id: '4',
        rankName: 'Platinum Associate',
        rankLevel: 4,
        requiredPairs: 60,
        award: '₹600 - Exclusive Platinum ring and an invitation to the annual leadership retreat.'
      },
      {
        _id: '5',
        rankName: 'Ruby Director',
        rankLevel: 5,
        requiredPairs: 120,
        award: '₹1200 - Ruby Director custom watch and a significant cash bonus.'
      },
      {
        _id: '6',
        rankName: 'Emerald Director',
        rankLevel: 6,
        requiredPairs: 250,
        award: '₹2500 - All-expenses-paid luxury vacation for two.'
      },
      {
        _id: '7',
        rankName: 'Diamond Director',
        rankLevel: 7,
        requiredPairs: 500,
        award: '₹5000 - Custom Diamond Director pendant and a substantial car allowance.'
      },
      {
        _id: '8',
        rankName: 'Blue Diamond Director',
        rankLevel: 8,
        requiredPairs: 1000,
        award: '₹10000 - Luxury timepiece and a down payment for a new home.'
      },
      {
        _id: '9',
        rankName: 'Black Diamond Director',
        rankLevel: 9,
        requiredPairs: 2000,
        award: '₹20000 - Exclusive Black Diamond ring and a significant investment portfolio contribution.'
      },
      {
        _id: '10',
        rankName: 'Crown Diamond Director',
        rankLevel: 10,
        requiredPairs: 4000,
        award: '₹40000 - Custom-designed Crown Diamond trophy and a luxury car of choice.'
      },
      {
        _id: '11',
        rankName: 'Presidential Diamond',
        rankLevel: 11,
        requiredPairs: 8000,
        award: '₹80000 - Lifetime achievement award and a substantial cash prize for financial freedom.'
      },
      {
        _id: '12',
        rankName: 'Ambassador',
        rankLevel: 12,
        requiredPairs: 15000,
        award: '₹150000 - Global recognition trip and a personalized philanthropic fund.'
      },
      {
        _id: '13',
        rankName: 'Global Ambassador',
        rankLevel: 13,
        requiredPairs: 30000,
        award: '₹300000 - Ultimate legacy award, a custom estate, and a private jet experience.'
      }
    ];

    return Response.json({ success: true, data: awards });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching awards' },
      { status: 500 }
    );
  }
}
