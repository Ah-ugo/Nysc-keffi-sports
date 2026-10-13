import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Firestore,
} from 'firebase/firestore';
import { getFunctions, httpsCallable, Functions } from 'firebase/functions';
import {
  AppEnvironment,
  AuditLogRecord,
  CompetitionCategory,
  CompetitionRecord,
  CompetitionStatus,
  FundraisingRecord,
  FundraisingRecordType,
  PlatformSettings,
  PlatoonWinningHistoryRecord,
  PredictionRecord,
  PrizeConfiguration,
  TransactionRecord,
  UserAccountStatus,
  UserRecord,
  UserRole,
  WinnerRecord,
  WinnerStatus,
} from '../types/models';
import { CAMP_MEDIA_LIBRARY } from './cloudinaryService';

const PLATOONS_1_TO_10 = [
  'Platoon 1',
  'Platoon 2',
  'Platoon 3',
  'Platoon 4',
  'Platoon 5',
  'Platoon 6',
  'Platoon 7',
  'Platoon 8',
  'Platoon 9',
  'Platoon 10',
];

export const PLATOON_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Platoon 1': { bg: 'bg-emerald-950/60', text: 'text-emerald-400', border: 'border-emerald-800' },
  'Platoon 2': { bg: 'bg-blue-950/60', text: 'text-blue-400', border: 'border-blue-800' },
  'Platoon 3': { bg: 'bg-amber-950/60', text: 'text-amber-400', border: 'border-amber-800' },
  'Platoon 4': { bg: 'bg-purple-950/60', text: 'text-purple-400', border: 'border-purple-800' },
  'Platoon 5': { bg: 'bg-red-950/60', text: 'text-red-400', border: 'border-red-800' },
  'Platoon 6': { bg: 'bg-cyan-950/60', text: 'text-cyan-400', border: 'border-cyan-800' },
  'Platoon 7': { bg: 'bg-yellow-950/60', text: 'text-yellow-400', border: 'border-yellow-800' },
  'Platoon 8': { bg: 'bg-teal-950/60', text: 'text-teal-400', border: 'border-teal-800' },
  'Platoon 9': { bg: 'bg-indigo-950/60', text: 'text-indigo-400', border: 'border-indigo-800' },
  'Platoon 10': { bg: 'bg-rose-950/60', text: 'text-rose-400', border: 'border-rose-800' },
};

const hasExternalFirebaseConfig = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_API_KEY !== 'MY_FIREBASE_API_KEY'
);

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let firebaseFunctions: Functions | null = null;

if (hasExternalFirebaseConfig) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  firebaseAuth = getAuth(firebaseApp);
  firestoreDb = getFirestore(firebaseApp);
  firebaseFunctions = getFunctions(
    firebaseApp,
    import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'europe-west1'
  );
}

interface InMemoryFirestoreDatabase {
  users: Map<string, UserRecord & { passwordHash: string }>;
  competitions: Map<string, CompetitionRecord>;
  predictions: Map<string, PredictionRecord>;
  transactions: Map<string, TransactionRecord>;
  winners: Map<string, WinnerRecord>;
  fundraising: Map<string, FundraisingRecord>;
  settings: Map<string, PlatformSettings>;
  platoonHistory: Map<string, PlatoonWinningHistoryRecord>;
  auditLogs: AuditLogRecord[];
  activeLocks: Set<string>;
}

const nowMs = Date.now();
const hourMs = 3600 * 1000;

function createSeedDatabase(): InMemoryFirestoreDatabase {
  const users = new Map<string, UserRecord & { passwordHash: string }>();

  const sampleUsers: Array<UserRecord & { passwordHash: string }> = [
    {
      id: 'usr_prince_01',
      fullName: 'Prince Ugochukwu Ahuekwe',
      email: 'ahuekweprinceugo@gmail.com',
      phone: '08034567890',
      role: 'superAdmin',
      status: 'Active',
      createdAt: new Date(nowMs - 14 * 24 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 2 * hourMs).toISOString(),
      passwordHash: 'Keffi2026!',
    },
    {
      id: 'usr_amina_02',
      fullName: 'Amina Suleiman Danjuma',
      email: 'amina.danjuma@example.ng',
      phone: '08062349811',
      role: 'user',
      status: 'Active',
      createdAt: new Date(nowMs - 10 * 24 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 24 * hourMs).toISOString(),
      passwordHash: 'Keffi2026!',
    },
    {
      id: 'usr_admin_04',
      fullName: 'Bala Abdullahi (Camp Coordinator)',
      email: 'admin.keffi@example.ng',
      phone: '08091122334',
      role: 'admin',
      status: 'Active',
      createdAt: new Date(nowMs - 20 * 24 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 5 * hourMs).toISOString(),
      passwordHash: 'Admin2026!',
    },
  ];

  for (const u of sampleUsers) {
    users.set(u.id, u);
  }

  const competitions = new Map<string, CompetitionRecord>();

  const seedCompetitions: CompetitionRecord[] = [
    {
      id: 'comp_football_final_stg',
      name: 'Platoon Football Final',
      category: 'Sports Competitions',
      description:
        '[SAMPLE / TEST DATA] The flagship inter-platoon 11-a-side football championship final on the main Keffi Orientation Camp grass pitch. All 10 platoons entered the group stages; select the platoon you predict will lift the Camp Trophy.',
      imageUrl: CAMP_MEDIA_LIBRARY.football.imageUrl,
      imagePublicId: CAMP_MEDIA_LIBRARY.football.imagePublicId,
      options: PLATOONS_1_TO_10,
      entryFee: 500,
      currency: 'NGN',
      opensAt: new Date(nowMs - 48 * hourMs).toISOString(),
      closesAt: new Date(nowMs + 6 * hourMs).toISOString(),
      competitionAt: new Date(nowMs + 7 * hourMs).toISOString(),
      status: 'Open',
      result: null,
      prizeConfiguration: {
        totalPrizeAmount: 50000,
        numberOfWinners: 5,
        winningCondition:
          'Qualifying participants who correctly predicted the winning platoon before closing time share or receive the published prize pool according to order of verified entry.',
        prizeAllocationPercent: 35,
        beneficiaryAllocationPercent: 55,
        approvedExpensesPercent: 10,
        payoutWorkflowNote:
          'Subject to official camp committee result publication and identity verification.',
        lockedAt: new Date(nowMs - 48 * hourMs).toISOString(),
      },
      rules: [
        'Strictly one prediction per participant for this competition.',
        'Predictions close 60 minutes before kick-off.',
        'Penalty shootout winner counts as the official match winner if tied after regulation time.',
        'Open to members of the public and camp supporters in accordance with published eligibility rules.',
      ],
      isFeatured: true,
      isSampleData: true,
      environment: 'STAGING',
      createdAt: new Date(nowMs - 72 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 2 * hourMs).toISOString(),
    },
    {
      id: 'comp_cultural_carnival_stg',
      name: 'Inter-Platoon Cultural Carnival & Dance',
      category: 'Cultural & Talent',
      description:
        '[SAMPLE / TEST DATA] Annual cultural showcase featuring traditional Nigerian music, attire, choreography and heritage drama performed by each of the 10 platoons at the Keffi Camp pavilion.',
      imageUrl: CAMP_MEDIA_LIBRARY.cultural.imageUrl,
      imagePublicId: CAMP_MEDIA_LIBRARY.cultural.imagePublicId,
      options: PLATOONS_1_TO_10,
      entryFee: 500,
      currency: 'NGN',
      opensAt: new Date(nowMs - 24 * hourMs).toISOString(),
      closesAt: new Date(nowMs + 1.5 * hourMs).toISOString(),
      competitionAt: new Date(nowMs + 2 * hourMs).toISOString(),
      status: 'Closing Soon',
      result: null,
      prizeConfiguration: {
        totalPrizeAmount: 30000,
        numberOfWinners: 3,
        winningCondition:
          'First 3 verified predictions matching the panel of judges’ 1st-place platoon win ₦10,000 each.',
        prizeAllocationPercent: 35,
        beneficiaryAllocationPercent: 55,
        approvedExpensesPercent: 10,
        payoutWorkflowNote: 'Verified by Camp Cultural Committee official score sheet.',
        lockedAt: new Date(nowMs - 24 * hourMs).toISOString(),
      },
      rules: [
        'One prediction per user per competition.',
        'Official winner is determined strictly by the published Camp Cultural Panel score sheet.',
        'Once confirmed via Paystack, predictions cannot be edited or cancelled.',
      ],
      isFeatured: false,
      isSampleData: true,
      environment: 'STAGING',
      createdAt: new Date(nowMs - 48 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 1 * hourMs).toISOString(),
    },
    {
      id: 'comp_tug_of_war_live_stg',
      name: 'Inter-Platoon Tug of War Showdown',
      category: 'Sports Competitions',
      description:
        '[SAMPLE / TEST DATA] High-energy elimination tug-of-war contest taking place live on the Keffi parade ground. Predictions are now closed while platoons compete.',
      imageUrl: CAMP_MEDIA_LIBRARY.drill.imageUrl,
      imagePublicId: CAMP_MEDIA_LIBRARY.drill.imagePublicId,
      options: PLATOONS_1_TO_10,
      entryFee: 300,
      currency: 'NGN',
      opensAt: new Date(nowMs - 36 * hourMs).toISOString(),
      closesAt: new Date(nowMs - 1 * hourMs).toISOString(),
      competitionAt: new Date(nowMs - 0.5 * hourMs).toISOString(),
      status: 'Live',
      liveUpdateNote:
        'Semi-Finals in progress on Parade Ground: Platoon 4 vs Platoon 8 (1–0), Platoon 2 vs Platoon 7 next.',
      result: null,
      prizeConfiguration: {
        totalPrizeAmount: 20000,
        numberOfWinners: 4,
        winningCondition: 'Qualifying predictions for the winning platoon receive ₦5,000 each.',
        prizeAllocationPercent: 35,
        beneficiaryAllocationPercent: 55,
        approvedExpensesPercent: 10,
        payoutWorkflowNote: 'Manual verification following official referee sign-off.',
        lockedAt: new Date(nowMs - 36 * hourMs).toISOString(),
      },
      rules: [
        'Predictions closed prior to the first pull.',
        'Results become official only when published by an authorized administrator.',
      ],
      isFeatured: false,
      isSampleData: true,
      environment: 'STAGING',
      createdAt: new Date(nowMs - 60 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 0.2 * hourMs).toISOString(),
    },
    {
      id: 'comp_march_past_upcoming_stg',
      name: 'Commandant Parade & March-Past Drill',
      category: 'Parade & Drill',
      description:
        '[SAMPLE / TEST DATA] Ceremonial platoon march-past and precision drill inspection judged on turnout, cadence, and platoon commander salute.',
      imageUrl: CAMP_MEDIA_LIBRARY.hero.imageUrl,
      imagePublicId: CAMP_MEDIA_LIBRARY.hero.imagePublicId,
      options: PLATOONS_1_TO_10,
      entryFee: 500,
      currency: 'NGN',
      opensAt: new Date(nowMs + 12 * hourMs).toISOString(),
      closesAt: new Date(nowMs + 48 * hourMs).toISOString(),
      competitionAt: new Date(nowMs + 50 * hourMs).toISOString(),
      status: 'Upcoming',
      result: null,
      prizeConfiguration: {
        totalPrizeAmount: 40000,
        numberOfWinners: 4,
        winningCondition: 'Qualifying predictions matching the 1st-place Parade Platoon.',
        prizeAllocationPercent: 35,
        beneficiaryAllocationPercent: 55,
        approvedExpensesPercent: 10,
        payoutWorkflowNote: 'Processed after official Parade inspection results are published.',
        lockedAt: new Date(nowMs - 12 * hourMs).toISOString(),
      },
      rules: [
        'Predictions open tomorrow morning at 9:00 AM.',
        'One prediction per participant.',
      ],
      isFeatured: false,
      isSampleData: true,
      environment: 'STAGING',
      createdAt: new Date(nowMs - 24 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 6 * hourMs).toISOString(),
    },
    {
      id: 'comp_volleyball_completed_stg',
      name: 'Platoon Volleyball Championship',
      category: 'Sports Competitions',
      description:
        '[SAMPLE / TEST DATA] Completed inter-platoon volleyball finals held at the Keffi Camp outdoor court.',
      imageUrl: CAMP_MEDIA_LIBRARY.volleyball.imageUrl,
      imagePublicId: CAMP_MEDIA_LIBRARY.volleyball.imagePublicId,
      options: PLATOONS_1_TO_10,
      entryFee: 500,
      currency: 'NGN',
      opensAt: new Date(nowMs - 96 * hourMs).toISOString(),
      closesAt: new Date(nowMs - 30 * hourMs).toISOString(),
      competitionAt: new Date(nowMs - 28 * hourMs).toISOString(),
      status: 'Completed',
      result: {
        winningOption: 'Platoon 3',
        officialScoreNote: 'Platoon 3 defeated Platoon 9 (3 sets to 1: 25-21, 22-25, 25-18, 25-19)',
        publishedAt: new Date(nowMs - 25 * hourMs).toISOString(),
        publishedBy: 'Bala Abdullahi (Camp Coordinator)',
      },
      prizeConfiguration: {
        totalPrizeAmount: 25000,
        numberOfWinners: 2,
        winningCondition: 'Qualifying predictions for Platoon 3 share the ₦25,000 prize pool.',
        prizeAllocationPercent: 35,
        beneficiaryAllocationPercent: 55,
        approvedExpensesPercent: 10,
        payoutWorkflowNote: 'Official result published and winners identified.',
        lockedAt: new Date(nowMs - 96 * hourMs).toISOString(),
      },
      rules: [
        'One prediction per participant.',
        'Official result published by authorized camp administrator.',
      ],
      isFeatured: false,
      isSampleData: true,
      environment: 'STAGING',
      createdAt: new Date(nowMs - 100 * hourMs).toISOString(),
      updatedAt: new Date(nowMs - 25 * hourMs).toISOString(),
    },
  ];

  for (const c of seedCompetitions) {
    competitions.set(c.id, c);
  }

  const predictions = new Map<string, PredictionRecord>();
  const transactions = new Map<string, TransactionRecord>();
  const winners = new Map<string, WinnerRecord>();

  const seedPred1Id = 'STAGING_usr_prince_01_comp_volleyball_completed_stg';
  const seedTxn1Id = 'txn_KCCL_STAGING_VOLLEY_001';
  transactions.set(seedTxn1Id, {
    id: seedTxn1Id,
    userId: 'usr_prince_01',
    userFullName: 'Prince Ugochukwu Ahuekwe',
    userEmail: 'ahuekweprinceugo@gmail.com',
    competitionId: 'comp_volleyball_completed_stg',
    competitionName: 'Platoon Volleyball Championship',
    predictionId: seedPred1Id,
    selectedOption: 'Platoon 3',
    amount: 500,
    currency: 'NGN',
    paystackReference: 'KCCL_STAGING_VOLLEY_001',
    status: 'Successful',
    environment: 'STAGING',
    channel: 'card (Paystack Test)',
    gatewayResponse: 'Approved [TEST]',
    createdAt: new Date(nowMs - 36 * hourMs).toISOString(),
    verifiedAt: new Date(nowMs - 36 * hourMs + 15000).toISOString(),
  });

  predictions.set(seedPred1Id, {
    id: seedPred1Id,
    userId: 'usr_prince_01',
    userFullName: 'Prince Ugochukwu Ahuekwe',
    userEmail: 'ahuekweprinceugo@gmail.com',
    userPhone: '08034567890',
    competitionId: 'comp_volleyball_completed_stg',
    competitionName: 'Platoon Volleyball Championship',
    competitionCategory: 'Sports Competitions',
    selectedOption: 'Platoon 3',
    entryAmount: 500,
    transactionId: seedTxn1Id,
    paystackReference: 'KCCL_STAGING_VOLLEY_001',
    paymentStatus: 'Successful',
    predictionStatus: 'Won',
    environment: 'STAGING',
    createdAt: new Date(nowMs - 36 * hourMs).toISOString(),
    updatedAt: new Date(nowMs - 25 * hourMs).toISOString(),
  });

  winners.set(`win_${seedPred1Id}`, {
    id: `win_${seedPred1Id}`,
    competitionId: 'comp_volleyball_completed_stg',
    competitionName: 'Platoon Volleyball Championship',
    predictionId: seedPred1Id,
    userId: 'usr_prince_01',
    userFullName: 'Prince Ugochukwu Ahuekwe',
    userEmail: 'ahuekweprinceugo@gmail.com',
    userPhone: '08034567890',
    selectedOption: 'Platoon 3',
    prizeAmount: 12500,
    status: 'Pending',
    payoutReference: null,
    environment: 'STAGING',
    createdAt: new Date(nowMs - 25 * hourMs).toISOString(),
    updatedAt: new Date(nowMs - 25 * hourMs).toISOString(),
  });

  const fundraising = new Map<string, FundraisingRecord>();
  fundraising.set('fnd_stg_01', {
    id: 'fnd_stg_01',
    type: 'Beneficiary Allocation',
    title: '[SAMPLE / TEST RECORD] Host Community Borehole & Clinic Sanitation Allocation',
    amount: 550,
    beneficiaryName: 'Keffi Host Community Development Project',
    disbursementDate: null,
    reference: 'STG-ALLOC-2026-01',
    notes: '55% statutory allocation from verified test competition entries in Staging.',
    recordedBy: 'Bala Abdullahi (Camp Coordinator)',
    environment: 'STAGING',
    createdAt: new Date(nowMs - 24 * hourMs).toISOString(),
  });

  const settings = new Map<string, PlatformSettings>();
  settings.set('platform_config', {
    id: 'platform_config',
    activeEnvironment: 'STAGING',
    initiativeTitle: 'Keffi Camp Host Community Support Initiative',
    initiativePurpose:
      'Supporting approved community development and camp welfare projects in Keffi, Nasarawa State through transparent inter-platoon competition predictions.',
    approvedBeneficiaryName:
      'Designated Host Community Beneficiary (Configure in Admin Settings prior to Live launch)',
    approvedBeneficiaryDescription:
      'Proceeds from each competition entry are allocated transparently across the published prize pool, approved operational costs, and the designated host community beneficiary.',
    approvalReferenceNote:
      'Operate Live mode only in accordance with applicable regulatory approvals and published competition rules.',
    defaultPrizePercent: 35,
    defaultBeneficiaryPercent: 55,
    defaultExpensesPercent: 10,
    updatedAt: new Date(nowMs - 12 * hourMs).toISOString(),
  });

  const auditLogs: AuditLogRecord[] = [
    {
      id: 'log_001',
      adminId: 'usr_admin_04',
      adminName: 'Bala Abdullahi (Camp Coordinator)',
      action: 'Competition created',
      affectedRecord: 'competitions/comp_football_final_stg',
      previousValue: 'None',
      newValue: 'Platoon Football Final (Entry: ₦500, Status: Open)',
      environment: 'STAGING',
      timestamp: new Date(nowMs - 72 * hourMs).toISOString(),
    },
    {
      id: 'log_002',
      adminId: 'usr_admin_04',
      adminName: 'Bala Abdullahi (Camp Coordinator)',
      action: 'Result published',
      affectedRecord: 'competitions/comp_volleyball_completed_stg',
      previousValue: 'Unpublished (Status: Closed)',
      newValue: 'Winner: Platoon 3 (1 qualifying prediction identified)',
      environment: 'STAGING',
      timestamp: new Date(nowMs - 25 * hourMs).toISOString(),
    },
  ];

  const platoonHistory = new Map<string, PlatoonWinningHistoryRecord>();
  const seedHistory: PlatoonWinningHistoryRecord[] = [
    {
      id: 'hist_volley_2026_a1',
      competitionId: 'comp_volleyball_completed_stg',
      competitionName: 'Platoon Volleyball Championship',
      category: 'Sports Competitions',
      edition: '2026 Batch A Stream 1',
      winningPlatoon: 'Platoon 3',
      runnerUpPlatoon: 'Platoon 9',
      thirdPlacePlatoon: 'Platoon 5',
      officialScoreNote: 'Platoon 3 defeated Platoon 9 (3 sets to 1: 25-21, 22-25, 25-18, 25-19)',
      prizeAmount: 25000,
      highlight: 'Dominant blocking performance led by Corp Member Musa (Spiker).',
      declaredDate: new Date(nowMs - 25 * hourMs).toISOString(),
      recordedBy: 'Bala Abdullahi (Camp Coordinator)',
    },
    {
      id: 'hist_foot_2025_c',
      competitionId: 'comp_football_final_stg',
      competitionName: 'Platoon Football Final',
      category: 'Sports Competitions',
      edition: '2025 Batch C',
      winningPlatoon: 'Platoon 7',
      runnerUpPlatoon: 'Platoon 4',
      thirdPlacePlatoon: 'Platoon 1',
      officialScoreNote: 'Platoon 7 won 2 - 1 on penalty shootout (0 - 0 after extra time)',
      prizeAmount: 150000,
      highlight: 'Dramatic penalty shootout stop by goalkeeper in sudden death.',
      declaredDate: '2025-11-20T16:30:00Z',
      recordedBy: 'Bala Abdullahi (Camp Coordinator)',
    },
    {
      id: 'hist_foot_2025_b',
      competitionId: 'comp_football_final_stg',
      competitionName: 'Platoon Football Final',
      category: 'Sports Competitions',
      edition: '2025 Batch B',
      winningPlatoon: 'Platoon 2',
      runnerUpPlatoon: 'Platoon 6',
      thirdPlacePlatoon: 'Platoon 8',
      officialScoreNote: 'Platoon 2 edged Platoon 6 (1 - 0 with an 88th-minute header)',
      prizeAmount: 120000,
      highlight: 'Last-gasp header off a corner kick to seal the trophy.',
      declaredDate: '2025-07-14T17:15:00Z',
      recordedBy: 'Camp Sports Officer',
    },
    {
      id: 'hist_foot_2024_c',
      competitionId: 'comp_football_final_stg',
      competitionName: 'Platoon Football Final',
      category: 'Sports Competitions',
      edition: '2024 Batch C',
      winningPlatoon: 'Platoon 4',
      runnerUpPlatoon: 'Platoon 10',
      thirdPlacePlatoon: 'Platoon 3',
      officialScoreNote: 'Platoon 4 defeated Platoon 10 (3 - 2 in open play)',
      prizeAmount: 100000,
      highlight: 'Highest scoring football final in Keffi orientation camp history.',
      declaredDate: '2024-11-18T16:45:00Z',
      recordedBy: 'Camp Sports Officer',
    },
    {
      id: 'hist_cult_2025_c',
      competitionId: 'comp_cultural_carnival_stg',
      competitionName: 'Inter-Platoon Cultural Carnival & Dance',
      category: 'Cultural & Talent',
      edition: '2025 Batch C',
      winningPlatoon: 'Platoon 8',
      runnerUpPlatoon: 'Platoon 3',
      thirdPlacePlatoon: 'Platoon 7',
      officialScoreNote: 'Scored 94.8% for Hausa/Fulani & Tiv traditional wedding enactment',
      prizeAmount: 90000,
      highlight: 'Unanimous 1st place awarded by the Ministry of Arts and Culture judges.',
      declaredDate: '2025-11-22T20:00:00Z',
      recordedBy: 'Camp Cultural Director',
    },
    {
      id: 'hist_cult_2025_b',
      competitionId: 'comp_cultural_carnival_stg',
      competitionName: 'Inter-Platoon Cultural Carnival & Dance',
      category: 'Cultural & Talent',
      edition: '2025 Batch B',
      winningPlatoon: 'Platoon 5',
      runnerUpPlatoon: 'Platoon 1',
      thirdPlacePlatoon: 'Platoon 9',
      officialScoreNote: 'Scored 92.5% for Yoruba Eyo & Igbo Atilogwu energetic dance medley',
      prizeAmount: 80000,
      highlight: 'Acrobatic flips and traditional percussion captivated the camp crowd.',
      declaredDate: '2025-07-16T19:30:00Z',
      recordedBy: 'Camp Cultural Director',
    },
    {
      id: 'hist_drill_2025_c',
      competitionId: 'comp_march_past_upcoming_stg',
      competitionName: 'Commandant Parade & March-Past Drill',
      category: 'Parade & Drill',
      edition: '2025 Batch C',
      winningPlatoon: 'Platoon 10',
      runnerUpPlatoon: 'Platoon 6',
      thirdPlacePlatoon: 'Platoon 2',
      officialScoreNote: 'Turnout & Bearing 98.4% (Precision salute and cadence alignment)',
      prizeAmount: 100000,
      highlight: 'Commanded by Platoon Commander Corporal Danladi.',
      declaredDate: '2025-11-24T11:00:00Z',
      recordedBy: 'Military Drill Instructor',
    },
    {
      id: 'hist_drill_2025_b',
      competitionId: 'comp_march_past_upcoming_stg',
      competitionName: 'Commandant Parade & March-Past Drill',
      category: 'Parade & Drill',
      edition: '2025 Batch B',
      winningPlatoon: 'Platoon 6',
      runnerUpPlatoon: 'Platoon 1',
      thirdPlacePlatoon: 'Platoon 4',
      officialScoreNote: 'Turnout & Bearing 96.2%',
      prizeAmount: 80000,
      highlight: 'Exemplary sword drill by the Platoon 6 corps marshal.',
      declaredDate: '2025-07-18T10:45:00Z',
      recordedBy: 'Military Drill Instructor',
    },
    {
      id: 'hist_tug_2025_c',
      competitionId: 'comp_tug_of_war_live_stg',
      competitionName: 'Inter-Platoon Tug of War Showdown',
      category: 'Sports Competitions',
      edition: '2025 Batch C',
      winningPlatoon: 'Platoon 5',
      runnerUpPlatoon: 'Platoon 7',
      thirdPlacePlatoon: 'Platoon 2',
      officialScoreNote: 'Won 2 - 0 straight rope pulls in the final showdown',
      prizeAmount: 50000,
      highlight: 'Unbeaten across 4 consecutive elimination rounds.',
      declaredDate: '2025-11-19T17:00:00Z',
      recordedBy: 'Camp Sports Officer',
    },
    {
      id: 'hist_tug_2025_b',
      competitionId: 'comp_tug_of_war_live_stg',
      competitionName: 'Inter-Platoon Tug of War Showdown',
      category: 'Sports Competitions',
      edition: '2025 Batch B',
      winningPlatoon: 'Platoon 9',
      runnerUpPlatoon: 'Platoon 3',
      thirdPlacePlatoon: 'Platoon 8',
      officialScoreNote: 'Won 2 - 1 in intense 6-minute tiebreak pull',
      prizeAmount: 40000,
      highlight: 'Anchor corps member held the baseline with extraordinary endurance.',
      declaredDate: '2025-07-15T16:30:00Z',
      recordedBy: 'Camp Sports Officer',
    },
    {
      id: 'hist_tennis_2025_c',
      competitionName: 'Inter-Platoon Table Tennis Championship',
      category: 'Sports Competitions',
      edition: '2025 Batch C',
      winningPlatoon: 'Platoon 4',
      runnerUpPlatoon: 'Platoon 8',
      thirdPlacePlatoon: 'Platoon 1',
      officialScoreNote: 'Defeated Platoon 8 (3 - 1 in singles sets: 11-8, 9-11, 11-7, 11-6)',
      prizeAmount: 30000,
      highlight: 'Fast-paced backhand rallies in the camp games room.',
      declaredDate: '2025-11-21T18:00:00Z',
      recordedBy: 'Camp Sports Officer',
    },
    {
      id: 'hist_cook_2025_c',
      competitionName: 'Camp Inter-Platoon Cooking & Nutrition Contest',
      category: 'Cultural & Talent',
      edition: '2025 Batch C',
      winningPlatoon: 'Platoon 6',
      runnerUpPlatoon: 'Platoon 1',
      thirdPlacePlatoon: 'Platoon 10',
      officialScoreNote: 'Scored 96.0% for Nasarawa Tuwo Shinkafa, Miyan Kuka & Zobo refreshment',
      prizeAmount: 50000,
      highlight: 'Praised by Camp State Coordinator for taste, hygiene and plating.',
      declaredDate: '2025-11-23T15:00:00Z',
      recordedBy: 'Camp Nutrition Officer',
    },
  ];

  for (const h of seedHistory) {
    platoonHistory.set(h.id, h);
  }

  return {
    users,
    competitions,
    predictions,
    transactions,
    winners,
    fundraising,
    settings,
    platoonHistory,
    auditLogs,
    activeLocks: new Set<string>(),
  };
}

const memoryStore: InMemoryFirestoreDatabase = createSeedDatabase();
let currentAuthenticatedUserId: string | null = 'usr_prince_01';

export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+?234|0)[789][01]\d{8}$/.test(cleaned);
}

export const firebaseService = {
  isExternalFirebaseConfigured(): boolean {
    return hasExternalFirebaseConfig;
  },

  getCurrentUser(): UserRecord | null {
    if (!currentAuthenticatedUserId) return null;
    const u = memoryStore.users.get(currentAuthenticatedUserId);
    if (!u) return null;
    const { passwordHash: _, ...cleanUser } = u;
    return cleanUser;
  },

  async login(email: string, password: string): Promise<UserRecord> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Please enter both your email address and password.');
    }

    if (hasExternalFirebaseConfig && firebaseAuth && firestoreDb) {
      const cred = await signInWithEmailAndPassword(firebaseAuth, normalizedEmail, password);
      const snap = await getDoc(doc(firestoreDb, 'users', cred.user.uid));
      if (!snap.exists()) {
        throw new Error('Account profile not found. Please contact support.');
      }
      return snap.data() as UserRecord;
    }

    for (const u of memoryStore.users.values()) {
      if (u.email.toLowerCase() === normalizedEmail) {
        if (u.status === 'Suspended') {
          throw new Error('Your account is currently suspended.');
        }
        currentAuthenticatedUserId = u.id;
        const { passwordHash: _, ...clean } = u;
        return clean;
      }
    }

    throw new Error('Invalid email or password. Please check your details and try again.');
  },

  async register(input: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<UserRecord> {
    const fullName = input.fullName.trim();
    const email = input.email.trim().toLowerCase();
    const phone = input.phone.trim();

    if (fullName.length < 3) throw new Error('Please enter your full name.');
    if (!email.includes('@')) throw new Error('Please enter a valid email address.');
    if (!isValidNigerianPhone(phone)) {
      throw new Error('Please enter a valid Nigerian phone number (e.g. 0803 123 4567).');
    }
    if (input.password.length < 6) throw new Error('Password must be at least 6 characters.');

    if (hasExternalFirebaseConfig && firebaseAuth && firestoreDb) {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, input.password);
      const nowIso = new Date().toISOString();
      const newUser: UserRecord = {
        id: cred.user.uid,
        fullName,
        email,
        phone,
        role: 'user',
        status: 'Active',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await setDoc(doc(firestoreDb, 'users', cred.user.uid), newUser);
      return newUser;
    }

    for (const existing of memoryStore.users.values()) {
      if (existing.email.toLowerCase() === email) {
        throw new Error('An account with this email address already exists.');
      }
    }

    const nowIso = new Date().toISOString();
    const id = `usr_${Date.now().toString(36)}`;
    const newRecord: UserRecord & { passwordHash: string } = {
      id,
      fullName,
      email,
      phone,
      role: 'user',
      status: 'Active',
      createdAt: nowIso,
      updatedAt: nowIso,
      passwordHash: input.password,
    };
    memoryStore.users.set(id, newRecord);
    currentAuthenticatedUserId = id;
    const { passwordHash: _, ...clean } = newRecord;
    return clean;
  },

  async logout(): Promise<void> {
    if (hasExternalFirebaseConfig && firebaseAuth) {
      await signOut(firebaseAuth);
    }
    currentAuthenticatedUserId = null;
  },

  async sendPasswordReset(email: string): Promise<string> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter your registered email address.');
    }
    if (hasExternalFirebaseConfig && firebaseAuth) {
      await sendPasswordResetEmail(firebaseAuth, cleanEmail);
    }
    return `Password reset instructions have been sent to ${cleanEmail}.`;
  },

  async updateProfile(
    userId: string,
    updates: { fullName: string; phone: string }
  ): Promise<UserRecord> {
    if (!updates.fullName.trim()) throw new Error('Full name cannot be empty.');
    if (!isValidNigerianPhone(updates.phone)) {
      throw new Error('Please enter a valid Nigerian phone number.');
    }

    if (hasExternalFirebaseConfig && firestoreDb) {
      const ref = doc(firestoreDb, 'users', userId);
      await updateDoc(ref, {
        fullName: updates.fullName.trim(),
        phone: updates.phone.trim(),
        updatedAt: new Date().toISOString(),
      });
      const snap = await getDoc(ref);
      return snap.data() as UserRecord;
    }

    const user = memoryStore.users.get(userId);
    if (!user) throw new Error('User account not found.');
    user.fullName = updates.fullName.trim();
    user.phone = updates.phone.trim();
    user.updatedAt = new Date().toISOString();
    const { passwordHash: _, ...clean } = user;
    return clean;
  },

  switchStagingDemoUser(userId: string): UserRecord {
    const u = memoryStore.users.get(userId);
    if (!u) throw new Error('Sample user not found.');
    currentAuthenticatedUserId = u.id;
    const { passwordHash: _, ...clean } = u;
    return clean;
  },

  getSettings(): PlatformSettings {
    return memoryStore.settings.get('platform_config')!;
  },

  async switchEnvironment(
    adminUser: UserRecord,
    targetEnvironment: AppEnvironment,
    confirmationNote: string
  ): Promise<PlatformSettings> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) {
      throw new Error('Only administrators can switch the environment.');
    }

    const settings = memoryStore.settings.get('platform_config')!;
    const previousEnv = settings.activeEnvironment;
    if (previousEnv === targetEnvironment) return settings;

    const nowIso = new Date().toISOString();
    settings.activeEnvironment = targetEnvironment;
    settings.updatedAt = nowIso;

    memoryStore.auditLogs.unshift({
      id: `log_${Date.now()}`,
      adminId: adminUser.id,
      adminName: adminUser.fullName,
      action: 'Environment changed',
      affectedRecord: 'settings/platform_config',
      previousValue: `${previousEnv} MODE`,
      newValue: `${targetEnvironment} MODE (${confirmationNote || 'Confirmed by admin'})`,
      environment: targetEnvironment,
      timestamp: nowIso,
    });

    return { ...settings };
  },

  async updatePlatformSettings(
    adminUser: UserRecord,
    updates: Partial<PlatformSettings>
  ): Promise<PlatformSettings> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) {
      throw new Error('Only administrators can update settings.');
    }
    const settings = memoryStore.settings.get('platform_config')!;
    const updated: PlatformSettings = {
      ...settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    memoryStore.settings.set('platform_config', updated);
    return updated;
  },

  getCompetitions(environment: AppEnvironment): CompetitionRecord[] {
    const list: CompetitionRecord[] = [];
    const now = Date.now();

    for (const comp of memoryStore.competitions.values()) {
      if (comp.environment !== environment) continue;

      const closesAtMs = new Date(comp.closesAt).getTime();
      let effectiveStatus = comp.status;
      if ((comp.status === 'Open' || comp.status === 'Closing Soon') && now >= closesAtMs) {
        effectiveStatus = 'Closed';
      }

      list.push({ ...comp, status: effectiveStatus });
    }

    return list.sort(
      (a, b) => new Date(a.competitionAt).getTime() - new Date(b.competitionAt).getTime()
    );
  },

  getUserPredictionForCompetition(
    userId: string,
    competitionId: string,
    environment: AppEnvironment
  ): PredictionRecord | null {
    const deterministicId = `${environment}_${userId}_${competitionId}`;
    const pred = memoryStore.predictions.get(deterministicId);
    if (pred && pred.paymentStatus === 'Successful') return pred;
    return null;
  },

  getUserPredictions(userId: string, environment: AppEnvironment): PredictionRecord[] {
    const list: PredictionRecord[] = [];
    for (const p of memoryStore.predictions.values()) {
      if (p.userId === userId && p.environment === environment) list.push(p);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getAllPredictions(environment: AppEnvironment): PredictionRecord[] {
    const list: PredictionRecord[] = [];
    for (const p of memoryStore.predictions.values()) {
      if (p.environment === environment) list.push(p);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getAllTransactions(environment: AppEnvironment): TransactionRecord[] {
    const list: TransactionRecord[] = [];
    for (const t of memoryStore.transactions.values()) {
      if (t.environment === environment) list.push(t);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getAllWinners(environment: AppEnvironment): WinnerRecord[] {
    const list: WinnerRecord[] = [];
    for (const w of memoryStore.winners.values()) {
      if (w.environment === environment) list.push(w);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getFundraisingRecords(environment: AppEnvironment): FundraisingRecord[] {
    const list: FundraisingRecord[] = [];
    for (const f of memoryStore.fundraising.values()) {
      if (f.environment === environment) list.push(f);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getFundraisingSummary(environment: AppEnvironment) {
    const txns = this.getAllTransactions(environment).filter((t) => t.status === 'Successful');
    const records = this.getFundraisingRecords(environment);

    const totalEntriesCount = txns.length;
    const totalProceedsNaira = txns.reduce((sum, t) => sum + t.amount, 0);

    const prizeAllocated = records
      .filter((r) => r.type === 'Prize Allocation')
      .reduce((sum, r) => sum + r.amount, 0);

    const approvedExpenses = records
      .filter((r) => r.type === 'Approved Expense')
      .reduce((sum, r) => sum + r.amount, 0);

    const beneficiaryAllocated = records
      .filter((r) => r.type === 'Beneficiary Allocation')
      .reduce((sum, r) => sum + r.amount, 0);

    const amountDisbursed = records
      .filter((r) => r.type === 'Beneficiary Disbursement')
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalEntriesCount,
      totalProceedsNaira,
      prizeAllocated,
      approvedExpenses,
      beneficiaryAllocated,
      amountDisbursed,
    };
  },

  getAllUsers(): UserRecord[] {
    const list: UserRecord[] = [];
    for (const u of memoryStore.users.values()) {
      const { passwordHash: _, ...clean } = u;
      list.push(clean);
    }
    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getAuditLogs(): AuditLogRecord[] {
    return [...memoryStore.auditLogs];
  },

  async initializePredictionPayment(params: {
    user: UserRecord;
    competitionId: string;
    selectedOption: string;
    environment: AppEnvironment;
  }): Promise<{
    transaction: TransactionRecord;
    predictionId: string;
  }> {
    const { user, competitionId, selectedOption, environment } = params;

    if (user.status !== 'Active') {
      throw new Error('Your account is not active.');
    }

    if (hasExternalFirebaseConfig && firebaseFunctions) {
      const initFn = httpsCallable(firebaseFunctions, 'initializePaystackPayment');
      const res = await initFn({ competitionId, selectedOption, environment });
      const data = res.data as {
        transactionId: string;
        predictionId: string;
        paystackReference: string;
        amount: number;
      };
      const txn: TransactionRecord = {
        id: data.transactionId,
        userId: user.id,
        userFullName: user.fullName,
        userEmail: user.email,
        competitionId,
        competitionName: '',
        predictionId: data.predictionId,
        selectedOption,
        amount: data.amount,
        currency: 'NGN',
        paystackReference: data.paystackReference,
        status: 'Pending',
        environment,
        createdAt: new Date().toISOString(),
        verifiedAt: null,
      };
      return { transaction: txn, predictionId: data.predictionId };
    }

    const comp = memoryStore.competitions.get(competitionId);
    if (!comp || comp.environment !== environment) {
      throw new Error('Competition not found.');
    }

    const now = Date.now();
    const opensAtMs = new Date(comp.opensAt).getTime();
    const closesAtMs = new Date(comp.closesAt).getTime();

    if (now < opensAtMs || comp.status === 'Upcoming' || comp.status === 'Draft') {
      throw new Error('Predictions for this competition are not open yet.');
    }

    if (now >= closesAtMs || ['Closed', 'Completed', 'Live'].includes(comp.status)) {
      throw new Error('Predictions for this competition are now closed.');
    }

    if (!comp.options.includes(selectedOption)) {
      throw new Error('Please select a valid option.');
    }

    const predictionId = `${environment}_${user.id}_${competitionId}`;
    const existingPrediction = memoryStore.predictions.get(predictionId);
    if (existingPrediction && existingPrediction.paymentStatus === 'Successful') {
      throw new Error('You already have a prediction for this competition.');
    }

    const paystackReference = `KCCL_${environment}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;
    const transactionId = `txn_${paystackReference}`;

    const transaction: TransactionRecord = {
      id: transactionId,
      userId: user.id,
      userFullName: user.fullName,
      userEmail: user.email,
      competitionId: comp.id,
      competitionName: comp.name,
      predictionId,
      selectedOption,
      amount: comp.entryFee,
      currency: 'NGN',
      paystackReference,
      status: 'Pending',
      environment,
      createdAt: new Date().toISOString(),
      verifiedAt: null,
    };

    memoryStore.transactions.set(transactionId, transaction);
    return { transaction, predictionId };
  },

  async verifyPaystackTransaction(params: {
    paystackReference: string;
    environment: AppEnvironment;
    channel?: string;
  }): Promise<{
    prediction: PredictionRecord;
    transaction: TransactionRecord;
    alreadyVerified: boolean;
  }> {
    const { paystackReference, environment, channel = 'card' } = params;

    let targetTxn: TransactionRecord | undefined;
    for (const t of memoryStore.transactions.values()) {
      if (t.paystackReference === paystackReference) {
        targetTxn = t;
        break;
      }
    }

    if (!targetTxn) throw new Error('Transaction reference not found.');

    if (targetTxn.status === 'Successful') {
      const existingPred = memoryStore.predictions.get(targetTxn.predictionId);
      if (existingPred) {
        return {
          prediction: existingPred,
          transaction: targetTxn,
          alreadyVerified: true,
        };
      }
    }

    const comp = memoryStore.competitions.get(targetTxn.competitionId);
    if (!comp) throw new Error('Competition not found.');

    const user = memoryStore.users.get(targetTxn.userId);
    const nowIso = new Date().toISOString();

    targetTxn.status = 'Successful';
    targetTxn.channel = `${channel} (Paystack Verified)`;
    targetTxn.gatewayResponse = 'Approved';
    targetTxn.verifiedAt = nowIso;

    const confirmedPrediction: PredictionRecord = {
      id: targetTxn.predictionId,
      userId: targetTxn.userId,
      userFullName: targetTxn.userFullName,
      userEmail: targetTxn.userEmail,
      userPhone: user?.phone || '',
      competitionId: comp.id,
      competitionName: comp.name,
      competitionCategory: comp.category,
      selectedOption: targetTxn.selectedOption,
      entryAmount: comp.entryFee,
      transactionId: targetTxn.id,
      paystackReference: targetTxn.paystackReference,
      paymentStatus: 'Successful',
      predictionStatus: 'Pending',
      environment,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    memoryStore.predictions.set(confirmedPrediction.id, confirmedPrediction);
    return {
      prediction: confirmedPrediction,
      transaction: targetTxn,
      alreadyVerified: false,
    };
  },

  async markTransactionFailedOrCancelled(params: {
    paystackReference: string;
    status: 'Failed' | 'Cancelled';
    reason: string;
  }): Promise<TransactionRecord> {
    for (const t of memoryStore.transactions.values()) {
      if (t.paystackReference === params.paystackReference) {
        if (t.status === 'Successful') {
          throw new Error('Cannot cancel an already confirmed transaction.');
        }
        t.status = params.status;
        t.gatewayResponse = params.reason;
        t.verifiedAt = new Date().toISOString();
        return t;
      }
    }
    throw new Error('Transaction record not found.');
  },

  async saveCompetition(
    adminUser: UserRecord,
    input: {
      id?: string;
      name: string;
      category: CompetitionCategory;
      description: string;
      imageUrl: string;
      imagePublicId: string;
      options: string[];
      entryFee: number;
      opensAt: string;
      closesAt: string;
      competitionAt: string;
      status: CompetitionStatus;
      liveUpdateNote?: string;
      prizeConfiguration: PrizeConfiguration;
      rules: string[];
      isFeatured?: boolean;
      environment: AppEnvironment;
    }
  ): Promise<CompetitionRecord> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) {
      throw new Error('Unauthorized.');
    }

    const nowIso = new Date().toISOString();
    const existing = input.id ? memoryStore.competitions.get(input.id) : undefined;

    if (existing) {
      const updated: CompetitionRecord = {
        ...existing,
        ...input,
        updatedAt: nowIso,
      };
      memoryStore.competitions.set(updated.id, updated);
      return updated;
    }

    const newId = `comp_${Date.now().toString(36)}`;
    const created: CompetitionRecord = {
      id: newId,
      name: input.name,
      category: input.category,
      description: input.description,
      imageUrl: input.imageUrl,
      imagePublicId: input.imagePublicId,
      options: input.options,
      entryFee: Number(input.entryFee),
      currency: 'NGN',
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      competitionAt: input.competitionAt,
      status: input.status,
      liveUpdateNote: input.liveUpdateNote || '',
      result: null,
      prizeConfiguration: input.prizeConfiguration,
      rules: input.rules,
      isFeatured: Boolean(input.isFeatured),
      environment: input.environment,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    memoryStore.competitions.set(created.id, created);
    return created;
  },

  async publishCompetitionResult(
    adminUser: UserRecord,
    params: {
      competitionId: string;
      winningOption: string;
      officialScoreNote: string;
    }
  ): Promise<{
    competition: CompetitionRecord;
    qualifyingWinnersCount: number;
  }> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) throw new Error('Unauthorized.');

    const comp = memoryStore.competitions.get(params.competitionId);
    if (!comp) throw new Error('Competition not found.');

    const nowIso = new Date().toISOString();
    comp.status = 'Completed';
    comp.result = {
      winningOption: params.winningOption,
      officialScoreNote: params.officialScoreNote,
      publishedAt: nowIso,
      publishedBy: adminUser.fullName,
    };

    const compPredictions: PredictionRecord[] = [];
    for (const p of memoryStore.predictions.values()) {
      if (p.competitionId === comp.id && p.paymentStatus === 'Successful') {
        compPredictions.push(p);
      }
    }

    const matching = compPredictions.filter((p) => p.selectedOption === params.winningOption);
    const maxWinners = comp.prizeConfiguration.numberOfWinners || matching.length || 1;
    const qualifying = matching.slice(0, maxWinners);
    const qualifyingIds = new Set(qualifying.map((q) => q.id));

    const prizePerWinner =
      qualifying.length > 0
        ? Math.floor(comp.prizeConfiguration.totalPrizeAmount / qualifying.length)
        : 0;

    for (const pred of compPredictions) {
      if (qualifyingIds.has(pred.id)) {
        pred.predictionStatus = 'Won';
        pred.updatedAt = nowIso;

        const winnerId = `win_${pred.id}`;
        if (!memoryStore.winners.has(winnerId)) {
          memoryStore.winners.set(winnerId, {
            id: winnerId,
            competitionId: comp.id,
            competitionName: comp.name,
            predictionId: pred.id,
            userId: pred.userId,
            userFullName: pred.userFullName,
            userEmail: pred.userEmail,
            userPhone: pred.userPhone,
            selectedOption: pred.selectedOption,
            prizeAmount: prizePerWinner,
            status: 'Pending',
            payoutReference: null,
            environment: comp.environment,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
        }
      } else {
        pred.predictionStatus = 'Lost';
        pred.updatedAt = nowIso;
      }
    }

    // Auto-record into official Platoon Winning History
    const historyId = `hist_${comp.id}_${Date.now().toString(36)}`;
    const historyEntry: PlatoonWinningHistoryRecord = {
      id: historyId,
      competitionId: comp.id,
      competitionName: comp.name,
      category: comp.category,
      edition: '2026 Batch A Stream 1',
      winningPlatoon: params.winningOption,
      officialScoreNote: params.officialScoreNote,
      prizeAmount: comp.prizeConfiguration.totalPrizeAmount,
      highlight: `Official result declared by ${adminUser.fullName}.`,
      declaredDate: nowIso,
      recordedBy: adminUser.fullName,
    };
    memoryStore.platoonHistory.set(historyId, historyEntry);

    return { competition: { ...comp }, qualifyingWinnersCount: qualifying.length };
  },

  getPlatoonHistory(params?: {
    competitionId?: string;
    category?: CompetitionCategory;
    platoon?: string;
  }): PlatoonWinningHistoryRecord[] {
    const list = Array.from(memoryStore.platoonHistory.values());
    return list
      .filter((h) => {
        if (params?.competitionId && h.competitionId && h.competitionId !== params.competitionId) return false;
        if (params?.category && h.category !== params.category) return false;
        if (params?.platoon && h.winningPlatoon !== params.platoon && h.runnerUpPlatoon !== params.platoon) return false;
        return true;
      })
      .sort((a, b) => new Date(b.declaredDate).getTime() - new Date(a.declaredDate).getTime());
  },

  async addPlatoonHistoryRecord(
    adminUser: UserRecord,
    input: {
      competitionId?: string;
      competitionName: string;
      category: CompetitionCategory;
      edition: string;
      winningPlatoon: string;
      runnerUpPlatoon?: string;
      thirdPlacePlatoon?: string;
      officialScoreNote: string;
      prizeAmount?: number;
      highlight?: string;
    }
  ): Promise<PlatoonWinningHistoryRecord> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) throw new Error('Unauthorized.');
    const newId = `hist_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const record: PlatoonWinningHistoryRecord = {
      id: newId,
      ...input,
      declaredDate: new Date().toISOString(),
      recordedBy: adminUser.fullName,
    };
    memoryStore.platoonHistory.set(newId, record);
    return record;
  },

  async deletePlatoonHistoryRecord(
    adminUser: UserRecord,
    historyId: string
  ): Promise<boolean> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) throw new Error('Unauthorized.');
    const exists = memoryStore.platoonHistory.has(historyId);
    if (!exists) return false;
    memoryStore.platoonHistory.delete(historyId);
    return true;
  },

  async updateWinnerPayoutStatus(
    adminUser: UserRecord,
    params: {
      winnerId: string;
      status: WinnerStatus;
      payoutReference: string;
    }
  ): Promise<WinnerRecord> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) throw new Error('Unauthorized.');
    const winner = memoryStore.winners.get(params.winnerId);
    if (!winner) throw new Error('Winner not found.');

    winner.status = params.status;
    winner.payoutReference = params.payoutReference || winner.payoutReference;
    winner.updatedAt = new Date().toISOString();
    return { ...winner };
  },

  async addFundraisingRecord(
    adminUser: UserRecord,
    input: {
      type: FundraisingRecordType;
      title: string;
      amount: number;
      beneficiaryName: string;
      disbursementDate: string | null;
      reference: string;
      notes: string;
      environment: AppEnvironment;
    }
  ): Promise<FundraisingRecord> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) throw new Error('Unauthorized.');
    const record: FundraisingRecord = {
      id: `fnd_${Date.now().toString(36)}`,
      ...input,
      recordedBy: adminUser.fullName,
      createdAt: new Date().toISOString(),
    };
    memoryStore.fundraising.set(record.id, record);
    return record;
  },

  async updateUserAdminControl(
    adminUser: UserRecord,
    params: {
      targetUserId: string;
      status?: UserAccountStatus;
      role?: UserRole;
    }
  ): Promise<UserRecord> {
    if (!['admin', 'superAdmin'].includes(adminUser.role)) throw new Error('Unauthorized.');
    const target = memoryStore.users.get(params.targetUserId);
    if (!target) throw new Error('User not found.');

    if (params.status) target.status = params.status;
    if (params.role) target.role = params.role;
    target.updatedAt = new Date().toISOString();

    const { passwordHash: _, ...clean } = target;
    return clean;
  },
};
