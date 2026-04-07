export async function GET() {
  try {
    const awards = [
      {
        _id: '1',
        rankName: 'Gold',
        rankLevel: 1,
        requiredPairs: 5-5,
        award: 'Bag + Business Kit'
      },
      {
        _id: '2',
        rankName: 'Super Gold',
        rankLevel: 2,
        requiredPairs: 10-10,
        award: 'Smart Watch'
      },
      {
        _id: '3',
        rankName: 'Gold Star',
        rankLevel: 3,
        requiredPairs: 25-25,
        award: 'Suit Length'
      },
      {
        _id: '4',
        rankName: 'Pearl ex',
        rankLevel: 4,
        requiredPairs: 50-50,
        award: 'Mixi-Grinder'
      },
      {
        _id: '5',
        rankName: 'Emerald',
        rankLevel: 5,
        requiredPairs: 100-100,
        award: 'Fridge ( Refrigerator )'
      },
      {
        _id: '6',
        rankName: 'Ruby',
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
