export async function GET() {
  try {
    const legalDocs = [
      {
        _id: '1',
        documentName: 'UDYAM REGISTRATION CERTIFICATE (MSME)',
        documentTypeLabel: 'MSME',
        description: 'Official Udyam Registration Certificate issued by the Ministry of MSME, Government of India. This certificate validates that Change Life Marketing is a registered Micro, Small and Medium Enterprise. All small businesses in India are required to register under the Udyam scheme for eligibility and benefits.',
        thumbnailImage: '/images/msmecertificate.jpeg',
        documentUrl: '#',
      },
      {
        _id: '2',
        documentName: 'UDYAM REGISTRATION NUMBER (MSME)',
        documentTypeLabel: 'MSME',
        description: 'The unique Udyam Registration Number assigned to Change Life Marketing by the Ministry of MSME. This alphanumeric identifier is used for all government compliance, tax benefits, and official documentation related to our MSME status.',
        thumbnailImage: '/images/msmeregistartionnumber.jpeg',
        documentUrl: '#',
      },
      {
        _id: '3',
        documentName: 'TAX DEDUCTION ACCOUNT NUMBER (TAN) CARD',
        documentTypeLabel: 'TAN',
        description: 'The TAN card for Change Life Marketing issued by the Indian Income Tax Department (ITD). This 10-character unique identifier is mandatory for all tax-related transactions, bank accounts, and income tax filing in India.',
        thumbnailImage: '/images/tancard.jpeg',
        documentUrl: '#',
      },
      {
        _id: '4',
        documentName: 'Labour Resource Department Registration',
        documentTypeLabel: 'Labour',
        description: 'Official registration with the Labour Resource Department for Change Life Marketing. This certificate ensures compliance with labour laws and regulations.',
        thumbnailImage: '/images/labourregistration.jpeg',
        documentUrl: '#',
      },
      {
        _id: '5',
        documentName: 'Goods and Services Tax (GST) Certificate',
        documentTypeLabel: 'GST',
        description: 'Official registration certificate for Goods and Services Tax (GSTIN) for Change Life Marketing. This ensures our compliance with the Indian taxation system.',
        thumbnailImage: '/images/GST.jpeg',
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
