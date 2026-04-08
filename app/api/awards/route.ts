export async function GET() {
  try {
    const awards = [
      {
        _id: '1',
        rankName: 'Gold',
        rankLevel: 1,
        requiredPairs: '5-5',
        award: 'Bag + Business Kit'
      },
      {
        _id: '2',
        rankName: 'Super Gold',
        rankLevel: 2,
        requiredPairs: '10-10',
        award: 'Smart Watch'
      },
      {
        _id: '3',
        rankName: 'Gold Star',
        rankLevel: 3,
        requiredPairs: '25-25',
        award: 'Suit Length'
      },
      {
        _id: '4',
        rankName: 'Pearl ex',
        rankLevel: 4,
        requiredPairs: '50-50',
        award: 'Mixi-Grinder'
      },
      {
        _id: '5',
        rankName: 'Emerald',
        rankLevel: 5,
        requiredPairs: '100-100',
        award: 'Fridge ( Refrigerator )'
      },
      {
        _id: '6',
        rankName: 'Ruby',
        rankLevel: 6,
        requiredPairs: '200-200',
        award: 'Mobile'
      },
      {
        _id: '7',
        rankName: 'Platinum',
        rankLevel: 7,
        requiredPairs: '500-500',
        award: 'Laptop'
      },
      {
        _id: '8',
        rankName: 'Diamond',
        rankLevel: 8,
        requiredPairs: '1000-1000',
        award: 'Bike'
      },
      {
        _id: '9',
        rankName: 'Double Diamond',
        rankLevel: 9,
        requiredPairs: '2000-2000',
        award: '1.5 Lakh Gift'
      },
      {
        _id: '10',
        rankName: 'Black Diamond',
        rankLevel: 10,
        requiredPairs: '4000-4000',
        award: '2.5 Lakh Gift'
      },
      {
        _id: '11',
        rankName: 'Blue Diamond',
        rankLevel: 11,
        requiredPairs: '8000-8000',
        award: '5 Lakh ₹'
      },
      {
        _id: '12',
        rankName: 'Royal Diamond',
        rankLevel: 12,
        requiredPairs: '16000-16000',
        award: '7.5 Lakh ₹'
      },
      {
        _id: '13',
        rankName: 'Crown Diamond',
        rankLevel: 13,
        requiredPairs: '32000-32000',
        award: '10 Lakh ₹'
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
