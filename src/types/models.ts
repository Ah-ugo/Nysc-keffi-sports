export type AppEnvironment = 'STAGING' | 'LIVE';

export type UserRole = 'user' | 'admin' | 'superAdmin';
export type UserAccountStatus = 'Active' | 'Suspended';

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserAccountStatus;
  createdAt: string;
  updatedAt: string;
}

export type CompetitionStatus =
  | 'Draft'
  | 'Upcoming'
  | 'Open'
  | 'Closing Soon'
  | 'Live'
  | 'Closed'
  | 'Completed';

export type CompetitionCategory =
  | 'Sports Competitions'
  | 'Cultural & Talent'
  | 'Parade & Drill';

export interface PrizeConfiguration {
  totalPrizeAmount: number;
  numberOfWinners: number;
  winningCondition: string;
  prizeAllocationPercent: number;
  beneficiaryAllocationPercent: number;
  approvedExpensesPercent: number;
  payoutWorkflowNote: string;
  lockedAt: string;
}

export interface CompetitionResult {
  winningOption: string;
  officialScoreNote: string;
  publishedAt: string;
  publishedBy: string;
}

export interface PlatoonWinningHistoryRecord {
  id: string;
  competitionId?: string;
  competitionName: string;
  category: CompetitionCategory;
  edition: string; // e.g. '2026 Batch A Stream 1', '2025 Batch C', '2025 Batch B', etc.
  winningPlatoon: string; // e.g. 'Platoon 3'
  runnerUpPlatoon?: string; // e.g. 'Platoon 9'
  thirdPlacePlatoon?: string; // e.g. 'Platoon 1'
  officialScoreNote: string; // e.g. 'Won 3-1 in sets against Platoon 9'
  prizeAmount?: number;
  highlight?: string;
  declaredDate: string;
  recordedBy?: string;
}

export interface CompetitionRecord {
  id: string;
  name: string;
  category: CompetitionCategory;
  description: string;
  imageUrl: string;
  imagePublicId: string;
  options: string[];
  entryFee: number;
  currency: 'NGN';
  opensAt: string;
  closesAt: string;
  competitionAt: string;
  status: CompetitionStatus;
  liveUpdateNote?: string;
  result: CompetitionResult | null;
  prizeConfiguration: PrizeConfiguration;
  rules: string[];
  isFeatured?: boolean;
  isSampleData?: boolean;
  environment: AppEnvironment;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus =
  | 'Pending'
  | 'Successful'
  | 'Failed'
  | 'Cancelled'
  | 'Refunded';

export type PredictionOutcomeStatus =
  | 'Pending'
  | 'Won'
  | 'Lost'
  | 'Cancelled';

export interface PredictionRecord {
  id: string; // Deterministic: {environment}_{userId}_{competitionId}
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  competitionId: string;
  competitionName: string;
  competitionCategory: CompetitionCategory;
  selectedOption: string;
  entryAmount: number;
  transactionId: string;
  paystackReference: string;
  paymentStatus: PaymentStatus;
  predictionStatus: PredictionOutcomeStatus;
  environment: AppEnvironment;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  competitionId: string;
  competitionName: string;
  predictionId: string;
  selectedOption: string;
  amount: number;
  currency: 'NGN';
  paystackReference: string;
  status: PaymentStatus;
  environment: AppEnvironment;
  channel?: string;
  gatewayResponse?: string;
  createdAt: string;
  verifiedAt: string | null;
}

export type WinnerStatus =
  | 'Pending'
  | 'Processing'
  | 'Paid'
  | 'Failed'
  | 'Cancelled';

export interface WinnerRecord {
  id: string;
  competitionId: string;
  competitionName: string;
  predictionId: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone: string;
  selectedOption: string;
  prizeAmount: number;
  status: WinnerStatus;
  payoutReference: string | null;
  environment: AppEnvironment;
  createdAt: string;
  updatedAt: string;
}

export type FundraisingRecordType =
  | 'Prize Allocation'
  | 'Approved Expense'
  | 'Beneficiary Allocation'
  | 'Beneficiary Disbursement';

export interface FundraisingRecord {
  id: string;
  type: FundraisingRecordType;
  title: string;
  amount: number;
  beneficiaryName: string;
  disbursementDate: string | null;
  reference: string;
  notes: string;
  recordedBy: string;
  environment: AppEnvironment;
  createdAt: string;
}

export interface PlatformSettings {
  id: string;
  activeEnvironment: AppEnvironment;
  initiativeTitle: string;
  initiativePurpose: string;
  approvedBeneficiaryName: string;
  approvedBeneficiaryDescription: string;
  approvalReferenceNote: string;
  defaultPrizePercent: number;
  defaultBeneficiaryPercent: number;
  defaultExpensesPercent: number;
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  affectedRecord: string;
  previousValue: string;
  newValue: string;
  environment: AppEnvironment;
  timestamp: string;
}
