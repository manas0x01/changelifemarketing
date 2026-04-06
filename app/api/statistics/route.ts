import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET() {
  try {
    await connectDB();

    const totalUsers = await User.countDocuments();
    const usersWithEmail = await User.countDocuments({ email: { $exists: true, $ne: null } });

    const statistics = [
      {
        _id: '1',
        statisticName: 'Members Joined',
        statisticValue: totalUsers,
        description: 'Total number of members who have joined our platform.',
        unit: 'members',
        displayOrder: 1
      },
      {
        _id: '2',
        statisticName: 'Products Available',
        statisticValue: 250,
        description: 'The total count of unique products currently available in our catalog.',
        unit: 'products',
        displayOrder: 2
      },
      {
        _id: '3',
        statisticName: 'States Active',
        statisticValue: 15,
        description: 'Number of states where our services are actively operational.',
        unit: 'states',
        displayOrder: 3
      },
      {
        _id: '4',
        statisticName: 'Income Distributed',
        statisticValue: 5000000,
        description: 'Cumulative income distributed to our partners and members.',
        unit: '₹',
        displayOrder: 4
      }
    ];

    return Response.json({ success: true, data: statistics });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching statistics' },
      { status: 500 }
    );
  }
}
