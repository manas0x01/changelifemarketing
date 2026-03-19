export interface AchieversGallery {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  achieverName?: string;
  profilePhoto?: string;
  locationState?: string;
  rankAchievement?: string;
  description?: string;
}

export interface AwardsandRewards {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  rankName?: string;
  rankLevel?: number;
  requiredPairs?: number;
  awardDescription?: string;
  monetaryValue?: number;
}

export interface CompanyStatistics {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  statisticName?: string;
  statisticValue?: number;
  description?: string;
  unit?: string;
  displayOrder?: number;
}

export interface ContactInquiries {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  message?: string;
  /** @wixFieldType datetime */
  submissionDate?: Date | string;
}

export interface IncomePlans {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  planName?: string;
  shortDescription?: string;
  detailedExplanation?: string;
  matchingPairDetails?: string;
  incomePotential?: string;
  diagramImage?: string;
  isComingSoon?: boolean;
}

export interface LegalDocuments {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  documentName?: string;
  documentTypeLabel?: string;
  thumbnailImage?: string;
  documentUrl?: string;
  description?: string;
}

export interface MemberRegistrations {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  fullName?: string;
  mobileNumber?: string;
  email?: string;
  sponsorId?: string;
  selectedPack?: string;
  address?: string;
  state?: string;
  submissionDate?: Date | string;
}

export interface Products {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  itemName?: string;
  itemPrice?: number;
  itemImage?: string;
  productNameHindi?: string;
  bvValue?: number;
  pvValue?: number;
  keyBenefits?: string;
  usageInstructions?: string;
}

export interface StarterPacks {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  itemName?: string;
  itemPrice?: number;
  itemImage?: string;
  itemDescription?: string;
  totalBV?: number;
  totalPV?: number;
  binaryIncomeInfo?: string;
}

export interface TermsandConditions {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  policyNumber?: string;
  policyTitle?: string;
  policyContent?: string;
  isReimbursementPolicy?: boolean;
  isSponsorRequirement?: boolean;
  isPlanSpecificRule?: boolean;
}
