export async function GET() {
  try {
    const achievers = [
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
      }
    ];

    return Response.json({ success: true, data: achievers });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching achievers' },
      { status: 500 }
    );
  }
}
