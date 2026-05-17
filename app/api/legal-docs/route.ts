export async function GET() {
  try {
    const legalDocs = [
      {
        _id: '1',
        documentName: 'Goods and Services Tax (GST) Certificate',
        documentTypeLabel: 'GST',
        description: 'Official registration certificate for Goods and Services Tax (GSTIN) for Company.',
        thumbnailImage: '/images/GST.jpeg',
        documentUrl: '#',
      },
      {
        _id: '2',
        documentName: 'MSME Udyam Registration Certificate',
        documentTypeLabel: 'MSME',
        description: 'Certificate of registration under the Micro, Small and Medium Enterprises (MSME) Development Act, 2006.',
        thumbnailImage: '/images/msmecertificate.png',
        documentUrl: '#',
      },
      {
        _id: '3',
        documentName: 'Permanent Account Number (PAN) Card',
        documentTypeLabel: 'PAN',
        description: 'Official PAN card for Company, issued by the Indian Income Tax Department.',
        thumbnailImage: '/images/pancard.png',
        documentUrl: '#',
      },
      {
        _id: '4',
        documentName: 'Aadhar Card - Director Ajay Kumar',
        documentTypeLabel: 'Aadhar',
        description: 'Aadhar card of a key personnel for identity verification purposes.',
        thumbnailImage: '/images/aadharcard.png',
        documentUrl: '#',
      },
      {
        _id: '5',
        documentName: 'Certificate of Incorporation',
        documentTypeLabel: 'Incorporation',
        description: 'Official document certifying the legal formation and existence of Company.',
        thumbnailImage: '/images/companyregistration.png',
        documentUrl: '#',
      }
    ];

    return Response.json({ success: true, data: legalDocs });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Error fetching legal documents' },
      { status: 500 }
    );
  }
}
