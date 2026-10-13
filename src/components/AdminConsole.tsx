import React, { useState } from 'react';
import {
  AppEnvironment,
  CompetitionCategory,
  CompetitionRecord,
  CompetitionStatus,
  PlatformSettings,
  PlatoonWinningHistoryRecord,
  UserRecord,
  WinnerRecord,
  WinnerStatus,
} from '../types/models';
import { firebaseService, PLATOON_COLORS } from '../services/firebaseService';
import {
  CAMP_MEDIA_LIBRARY,
  uploadMediaToCloudinary,
} from '../services/cloudinaryService';
import { CampImage } from './CampImage';
import { NYSCLogo } from './NYSCLogo';
import {
  ChartIcon,
  TrophyIcon,
  DocumentIcon,
  WalletIcon,
  VerifyIcon,
  UserIcon,
  SettingIcon,
  PlusIcon,
  ArrowLeftIcon,
  CloseIcon,
  CheckIcon,
  ShieldTickIcon,
  SearchIcon,
  TrashIcon,
} from './Iconsax';

export type AdminTab =
  | 'dashboard'
  | 'competitions'
  | 'winners-history'
  | 'predictions'
  | 'payments'
  | 'winners'
  | 'fundraising'
  | 'users'
  | 'auditLogs';

interface AdminConsoleProps {
  currentUser: UserRecord;
  environment: AppEnvironment;
  settings: PlatformSettings;
  onRefreshState: () => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  onExitAdmin: () => void;
}

const DEFAULT_PLATOONS = [
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

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  environment,
  settings,
  onRefreshState,
  onNotify,
  onExitAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [showEnvConfirmModal, setShowEnvConfirmModal] = useState(false);
  const [envChangeReason, setEnvChangeReason] = useState('');

  // Competition modal
  const [editingComp, setEditingComp] = useState<CompetitionRecord | null>(null);
  const [showCompModal, setShowCompModal] = useState(false);
  const [compName, setCompName] = useState('');
  const [compCategory, setCompCategory] = useState<CompetitionCategory>('Sports Competitions');
  const [compDesc, setCompDesc] = useState('');
  const [compImageUrl, setCompImageUrl] = useState(CAMP_MEDIA_LIBRARY.football.imageUrl);
  const [compImagePublicId, setCompImagePublicId] = useState(CAMP_MEDIA_LIBRARY.football.imagePublicId);
  const [compOptionsText, setCompOptionsText] = useState(DEFAULT_PLATOONS.join(', '));
  const [compEntryFee, setCompEntryFee] = useState(500);
  const [compOpensAt, setCompOpensAt] = useState('');
  const [compClosesAt, setCompClosesAt] = useState('');
  const [compCompetitionAt, setCompCompetitionAt] = useState('');
  const [compStatus, setCompStatus] = useState<CompetitionStatus>('Open');
  const [compPrizeAmount, setCompPrizeAmount] = useState(50000);
  const [compWinnersCount, setCompWinnersCount] = useState(5);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Result publishing modal
  const [publishingComp, setPublishingComp] = useState<CompetitionRecord | null>(null);
  const [winningOption, setWinningOption] = useState('');
  const [officialScoreNote, setOfficialScoreNote] = useState('');

  // Winner modal
  const [processingWinner, setProcessingWinner] = useState<WinnerRecord | null>(null);
  const [winnerNextStatus, setWinnerNextStatus] = useState<WinnerStatus>('Paid');
  const [payoutReference, setPayoutReference] = useState('');

  // Record Past Champion Modal (Winning Platoons History)
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  const [histCompId, setHistCompId] = useState<string>('');
  const [histCompName, setHistCompName] = useState<string>('');
  const [histCategory, setHistCategory] = useState<CompetitionCategory>('Sports Competitions');
  const [histEdition, setHistEdition] = useState<string>('2025 Batch C');
  const [histWinningPlatoon, setHistWinningPlatoon] = useState<string>('Platoon 1');
  const [histRunnerUp, setHistRunnerUp] = useState<string>('');
  const [histThirdPlace, setHistThirdPlace] = useState<string>('');
  const [histScoreNote, setHistScoreNote] = useState<string>('');
  const [histPrize, setHistPrize] = useState<number>(50000);
  const [histHighlight, setHistHighlight] = useState<string>('');

  // History filters
  const [historyFilterCategory, setHistoryFilterCategory] = useState<'All' | CompetitionCategory>('All');
  const [historyFilterPlatoon, setHistoryFilterPlatoon] = useState<string>('All');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  const competitions = firebaseService.getCompetitions(environment);
  const predictions = firebaseService.getAllPredictions(environment);
  const transactions = firebaseService.getAllTransactions(environment);
  const winners = firebaseService.getAllWinners(environment);
  const fundraisingRecords = firebaseService.getFundraisingRecords(environment);
  const fundraisingSummary = firebaseService.getFundraisingSummary(environment);
  const users = firebaseService.getAllUsers();
  const auditLogs = firebaseService.getAuditLogs();
  const allHistoryRecords = firebaseService.getPlatoonHistory();

  // Completed competitions that have declared winning platoons
  const completedWithWinners = competitions.filter(
    (c) => c.status === 'Completed' && c.result && c.result.winningOption
  );

  // Tally platoon championship counts & prize totals across historical archives AND live results
  const platoonTally: Record<
    string,
    { count: number; prizeSum: number; events: Array<{ name: string; edition: string; score: string }> }
  > = {};

  DEFAULT_PLATOONS.forEach((p) => {
    platoonTally[p] = { count: 0, prizeSum: 0, events: [] };
  });

  allHistoryRecords.forEach((h) => {
    const winner = h.winningPlatoon;
    if (!platoonTally[winner]) {
      platoonTally[winner] = { count: 0, prizeSum: 0, events: [] };
    }
    platoonTally[winner].count += 1;
    platoonTally[winner].prizeSum += h.prizeAmount || 0;
    platoonTally[winner].events.push({
      name: h.competitionName,
      edition: h.edition,
      score: h.officialScoreNote,
    });
  });

  const sortedPlatoonLeaderboard = Object.entries(platoonTally).sort(
    (a, b) => b[1].count - a[1].count
  );

  // Filtered history records
  const filteredHistoryRecords = allHistoryRecords.filter((rec) => {
    if (historyFilterCategory !== 'All' && rec.category !== historyFilterCategory) return false;
    if (historyFilterPlatoon !== 'All' && rec.winningPlatoon !== historyFilterPlatoon && rec.runnerUpPlatoon !== historyFilterPlatoon) {
      return false;
    }
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      const matchComp = rec.competitionName.toLowerCase().includes(q);
      const matchWinner = rec.winningPlatoon.toLowerCase().includes(q);
      const matchEdition = rec.edition.toLowerCase().includes(q);
      const matchScore = rec.officialScoreNote.toLowerCase().includes(q);
      if (!matchComp && !matchWinner && !matchEdition && !matchScore) return false;
    }
    return true;
  });

  const openCreateCompModal = () => {
    const now = Date.now();
    const hour = 3600 * 1000;
    setEditingComp(null);
    setCompName('');
    setCompCategory('Sports Competitions');
    setCompDesc('');
    setCompImageUrl(CAMP_MEDIA_LIBRARY.football.imageUrl);
    setCompImagePublicId(CAMP_MEDIA_LIBRARY.football.imagePublicId);
    setCompOptionsText(DEFAULT_PLATOONS.join(', '));
    setCompEntryFee(500);
    setCompOpensAt(new Date(now - hour).toISOString().slice(0, 16));
    setCompClosesAt(new Date(now + 24 * hour).toISOString().slice(0, 16));
    setCompCompetitionAt(new Date(now + 26 * hour).toISOString().slice(0, 16));
    setCompStatus('Open');
    setCompPrizeAmount(50000);
    setCompWinnersCount(5);
    setShowCompModal(true);
  };

  const openEditCompModal = (comp: CompetitionRecord) => {
    setEditingComp(comp);
    setCompName(comp.name);
    setCompCategory(comp.category);
    setCompDesc(comp.description);
    setCompImageUrl(comp.imageUrl);
    setCompImagePublicId(comp.imagePublicId);
    setCompOptionsText(comp.options.join(', '));
    setCompEntryFee(comp.entryFee);
    setCompOpensAt(comp.opensAt.slice(0, 16));
    setCompClosesAt(comp.closesAt.slice(0, 16));
    setCompCompetitionAt(comp.competitionAt.slice(0, 16));
    setCompStatus(comp.status);
    setCompPrizeAmount(comp.prizeConfiguration.totalPrizeAmount);
    setCompWinnersCount(comp.prizeConfiguration.numberOfWinners);
    setShowCompModal(true);
  };

  const openAddHistoryModalForComp = (comp?: CompetitionRecord) => {
    if (comp) {
      setHistCompId(comp.id);
      setHistCompName(comp.name);
      setHistCategory(comp.category);
      setHistPrize(comp.prizeConfiguration.totalPrizeAmount);
    } else {
      setHistCompId('');
      setHistCompName('');
      setHistCategory('Sports Competitions');
      setHistPrize(50000);
    }
    setHistEdition('2025 Batch C');
    setHistWinningPlatoon('Platoon 1');
    setHistRunnerUp('Platoon 2');
    setHistThirdPlace('');
    setHistScoreNote('');
    setHistHighlight('');
    setShowAddHistoryModal(true);
  };

  const handleCloudinaryFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const uploaded = await uploadMediaToCloudinary(file);
      setCompImageUrl(uploaded.imageUrl);
      setCompImagePublicId(uploaded.imagePublicId);
      onNotify('success', `Poster uploaded to Cloudinary.`);
    } catch {
      onNotify('error', 'Cloudinary upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const options = compOptionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      await firebaseService.saveCompetition(currentUser, {
        id: editingComp?.id,
        name: compName,
        category: compCategory,
        description: compDesc,
        imageUrl: compImageUrl,
        imagePublicId: compImagePublicId,
        options,
        entryFee: Number(compEntryFee),
        opensAt: new Date(compOpensAt).toISOString(),
        closesAt: new Date(compClosesAt).toISOString(),
        competitionAt: new Date(compCompetitionAt).toISOString(),
        status: compStatus,
        prizeConfiguration: {
          totalPrizeAmount: Number(compPrizeAmount),
          numberOfWinners: Number(compWinnersCount),
          winningCondition: 'Qualifying predictions share prize pool.',
          prizeAllocationPercent: settings.defaultPrizePercent,
          beneficiaryAllocationPercent: settings.defaultBeneficiaryPercent,
          approvedExpensesPercent: settings.defaultExpensesPercent,
          payoutWorkflowNote: 'Subject to official camp committee result verification.',
          lockedAt: editingComp?.prizeConfiguration.lockedAt || new Date().toISOString(),
        },
        rules: editingComp?.rules || ['Strictly 1 prediction per participant.'],
        environment,
      });

      setShowCompModal(false);
      onRefreshState();
      onNotify('success', 'Competition saved successfully.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Save failed.');
    }
  };

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingComp) return;
    try {
      const res = await firebaseService.publishCompetitionResult(currentUser, {
        competitionId: publishingComp.id,
        winningOption,
        officialScoreNote,
      });
      setPublishingComp(null);
      onRefreshState();
      onNotify(
        'success',
        `Official result published! ${res.qualifyingWinnersCount} winner(s) identified. Platoon history updated.`
      );
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not publish result.');
    }
  };

  const handleSaveHistoryRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!histCompName.trim() || !histWinningPlatoon) return;
    try {
      await firebaseService.addPlatoonHistoryRecord(currentUser, {
        competitionId: histCompId || undefined,
        competitionName: histCompName.trim(),
        category: histCategory,
        edition: histEdition.trim(),
        winningPlatoon: histWinningPlatoon,
        runnerUpPlatoon: histRunnerUp.trim() || undefined,
        thirdPlacePlatoon: histThirdPlace.trim() || undefined,
        officialScoreNote: histScoreNote.trim() || `Champion of ${histEdition}`,
        prizeAmount: Number(histPrize) || undefined,
        highlight: histHighlight.trim() || undefined,
      });
      setShowAddHistoryModal(false);
      onRefreshState();
      onNotify('success', `Historical champion for ${histCompName} recorded successfully!`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Could not save historical record.');
    }
  };

  const handleDeleteHistoryRecord = async (rec: PlatoonWinningHistoryRecord) => {
    if (!confirm(`Delete historical champion record for "${rec.edition}: ${rec.winningPlatoon}"?`)) {
      return;
    }
    try {
      await firebaseService.deletePlatoonHistoryRecord(currentUser, rec.id);
      onRefreshState();
      onNotify('success', 'Historical champion record deleted.');
    } catch {
      onNotify('error', 'Could not delete historical record.');
    }
  };

  const handleWinnerPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingWinner) return;
    try {
      await firebaseService.updateWinnerPayoutStatus(currentUser, {
        winnerId: processingWinner.id,
        status: winnerNextStatus,
        payoutReference,
      });
      setProcessingWinner(null);
      onRefreshState();
      onNotify('success', 'Winner payout status updated.');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleConfirmSwitchEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    const target: AppEnvironment = environment === 'STAGING' ? 'LIVE' : 'STAGING';
    try {
      await firebaseService.switchEnvironment(currentUser, target, envChangeReason);
      setShowEnvConfirmModal(false);
      setEnvChangeReason('');
      onRefreshState();
      onNotify('success', `Switched environment to ${target} MODE.`);
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Environment switch failed.');
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Overview', icon: <ChartIcon size={16} /> },
    { id: 'competitions', label: 'Competitions', icon: <TrophyIcon size={16} /> },
    { id: 'winners-history', label: 'Winning History', icon: <TrophyIcon size={16} /> },
    { id: 'predictions', label: 'Predictions', icon: <DocumentIcon size={16} /> },
    { id: 'payments', label: 'Payments', icon: <WalletIcon size={16} /> },
    { id: 'winners', label: 'Payouts', icon: <VerifyIcon size={16} /> },
    { id: 'fundraising', label: 'Community Help', icon: <ShieldTickIcon size={16} /> },
    { id: 'users', label: 'Users', icon: <UserIcon size={16} /> },
    { id: 'auditLogs', label: 'Audit Logs', icon: <SettingIcon size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0E1210] text-[#F3F4F6] flex flex-col font-sans">
      {/* 1. TOP COMMAND BAR (Non-overflowing, strict flex alignment) */}
      <header className="sticky top-0 z-30 bg-[#141916] border-b border-[#232B25] px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 min-w-0">
          {/* Left: Brand & Return */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1D2520] hover:bg-[#253029] border border-[#2B382F] text-xs font-semibold text-stone-200 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeftIcon size={14} />
              <span className="hidden xs:inline">Public Site</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-[#242D26] min-w-0">
              <NYSCLogo size={22} />
              <span className="text-xs font-bold text-white tracking-tight truncate hidden sm:inline">
                Admin Console
              </span>
            </div>
          </div>

          {/* Right: Environment Selector Pill & User */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                  environment === 'LIVE'
                    ? 'bg-[#3D1414] text-red-300 border-red-700'
                    : 'bg-[#14261C] text-emerald-400 border-emerald-700'
                }`}
              >
                {environment}
              </span>
              <button
                type="button"
                onClick={() => setShowEnvConfirmModal(true)}
                className="text-[11px] text-stone-400 hover:text-white underline cursor-pointer"
              >
                Switch
              </button>
            </div>

            <div className="text-xs font-medium text-stone-400 pl-2 border-l border-[#242D26] hidden md:block truncate max-w-[120px]">
              {currentUser.fullName.split(' ')[0]}
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: Sleek Sidebar + Viewport */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto min-w-0">
        {/* Sidebar Tabs */}
        <aside className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-[#202722] bg-[#121614] p-2 sm:p-2.5 lg:py-6">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#008751] text-white'
                    : 'text-stone-400 hover:bg-[#18201B] hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 space-y-6 min-w-0 overflow-y-auto">
          {/* TAB 1: DASHBOARD / OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">Administration Overview</h1>
                  <p className="text-xs text-stone-400 mt-0.5 truncate">
                    Operational metrics and champion records for NYSC Keffi Orientation Camp
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAddHistoryModalForComp()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C2520] hover:bg-[#25322A] border border-[#2B3930] text-xs font-semibold text-emerald-300 transition-colors cursor-pointer"
                  >
                    <TrophyIcon size={14} />
                    <span>Record Past Champion</span>
                  </button>
                  <button
                    type="button"
                    onClick={openCreateCompModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
                  >
                    <PlusIcon size={14} />
                    <span>Create Pool</span>
                  </button>
                </div>
              </div>

              {/* 4 Sleek Metric Cards (100% Overflow-Proof on mobile & desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#161B18] border border-[#263028] min-w-0 overflow-hidden">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block truncate">
                    Active Pools
                  </span>
                  <span className="text-base sm:text-xl md:text-2xl font-bold font-mono text-white mt-1 block truncate">
                    {competitions.length}
                  </span>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#161B18] border border-[#263028] min-w-0 overflow-hidden">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block truncate">
                    Tickets Sold
                  </span>
                  <span className="text-base sm:text-xl md:text-2xl font-bold font-mono text-white mt-1 block truncate">
                    {fundraisingSummary.totalEntriesCount}
                  </span>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#161B18] border border-[#263028] min-w-0 overflow-hidden">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block truncate">
                    Total Raised
                  </span>
                  <span className="text-base sm:text-xl md:text-2xl font-bold font-mono text-[#E5A93C] mt-1 block truncate tabular-nums">
                    ₦{fundraisingSummary.totalProceedsNaira.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#161B18] border border-[#263028] min-w-0 overflow-hidden">
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block truncate">
                    Historical Titles
                  </span>
                  <span className="text-base sm:text-xl md:text-2xl font-bold font-mono text-emerald-400 mt-1 block truncate">
                    {allHistoryRecords.length}
                  </span>
                </div>
              </div>

              {/* Platoon Championship Banner */}
              <div className="rounded-xl bg-[#161B18] border border-[#263028] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#14261C] border border-[#234731] flex items-center justify-center shrink-0 text-emerald-400">
                    <TrophyIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">Platoon Winning History & Records</h3>
                    <p className="text-xs text-stone-400 truncate">
                      {allHistoryRecords.length} tournament champions on record · Top Leader:{' '}
                      <strong className="text-white">{sortedPlatoonLeaderboard[0]?.[0]}</strong> ({sortedPlatoonLeaderboard[0]?.[1].count} titles)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('winners-history')}
                  className="px-3 py-1.5 rounded-lg bg-[#1F2722] hover:bg-[#28332C] text-xs font-semibold text-emerald-300 border border-[#2B3930] transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  View All Archives →
                </button>
              </div>

              {/* Recent Activity Previews */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
                {/* Active Competitions Preview */}
                <div className="rounded-xl bg-[#161B18] border border-[#263028] p-4 space-y-3 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222A24]">
                    <h2 className="text-sm font-bold text-white">Active Competitions</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('competitions')}
                      className="text-xs text-emerald-400 hover:underline cursor-pointer"
                    >
                      Manage ({competitions.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {competitions.slice(0, 3).map((c) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-lg bg-[#121614] border border-[#222A24] flex items-center justify-between gap-2.5 text-xs min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{c.name}</p>
                          <p className="text-stone-400 text-[11px] truncate">{c.category} · Entry: ₦{c.entryFee}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#16271D] text-emerald-400 border border-[#244531] shrink-0">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions Preview */}
                <div className="rounded-xl bg-[#161B18] border border-[#263028] p-4 space-y-3 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222A24]">
                    <h2 className="text-sm font-bold text-white">Recent Transactions</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('payments')}
                      className="text-xs text-emerald-400 hover:underline cursor-pointer"
                    >
                      See All ({transactions.length})
                    </button>
                  </div>
                  <div className="space-y-2">
                    {transactions.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-lg bg-[#121614] border border-[#222A24] flex items-center justify-between gap-2.5 text-xs min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{t.userFullName}</p>
                          <p className="text-stone-400 text-[11px] font-mono truncate">{t.paystackReference}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-white font-mono">₦{t.amount}</p>
                          <span className="text-[10px] text-emerald-400">{t.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPETITIONS (100% Overflow-Proof with dedicated previous winners section) */}
          {activeTab === 'competitions' && (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">Competition Pools</h1>
                  <p className="text-xs text-stone-400 truncate">
                    Manage camp match pools and inspect previous winning platoons for each event
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAddHistoryModalForComp()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C2520] hover:bg-[#25322A] border border-[#2B3930] text-xs font-semibold text-emerald-300 transition-colors cursor-pointer"
                  >
                    <TrophyIcon size={14} />
                    <span>Record Past Champion</span>
                  </button>
                  <button
                    type="button"
                    onClick={openCreateCompModal}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] text-xs font-semibold text-white transition-colors cursor-pointer shrink-0"
                  >
                    <PlusIcon size={14} />
                    <span>Create Pool</span>
                  </button>
                </div>
              </div>

              {/* Cards List (Engineered for clean zero-overflow) */}
              <div className="space-y-3.5 min-w-0">
                {competitions.map((comp) => {
                  // Find previous winning platoons for this competition
                  const compHistory = allHistoryRecords.filter(
                    (h) => h.competitionId === comp.id || h.competitionName.toLowerCase() === comp.name.toLowerCase()
                  );

                  return (
                    <div
                      key={comp.id}
                      className="p-3.5 sm:p-5 rounded-2xl bg-[#161B18] border border-[#263028] flex flex-col gap-3 min-w-0 overflow-hidden"
                    >
                      {/* Top Row: Thumbnail + Core Specs */}
                      <div className="flex items-start gap-3 min-w-0">
                        <CampImage
                          imageUrl={comp.imageUrl}
                          imagePublicId={comp.imagePublicId}
                          alt={comp.name}
                          preset="admin_preview"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1C241E] text-stone-300">
                              {comp.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                comp.status === 'Completed'
                                  ? 'bg-[#15281D] text-emerald-300 border border-[#244833]'
                                  : comp.status === 'Live'
                                  ? 'bg-red-950/80 text-red-300 border border-red-800'
                                  : 'bg-[#18201B] text-stone-300'
                              }`}
                            >
                              {comp.status}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-white break-words line-clamp-2">
                            {comp.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400">
                            <span>
                              Entry: <strong className="text-white font-mono">₦{comp.entryFee}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Prize Pool: <strong className="text-[#E5A93C] font-mono">₦{comp.prizeConfiguration.totalPrizeAmount.toLocaleString()}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Options: <strong className="text-stone-300 font-mono">{comp.options.length} Platoons</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current declared result (if any) */}
                      {comp.result && (
                        <div className="p-2.5 rounded-xl bg-[#14291E] border border-[#224A35] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-w-0">
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">
                              Declared Champion
                            </span>
                            <p className="font-bold text-white break-words">
                              🏆 {comp.result.winningOption} — {comp.result.officialScoreNote}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-stone-400 shrink-0">
                            Published by {comp.result.publishedBy}
                          </span>
                        </div>
                      )}

                      {/* PREVIOUS WINNING PLATOONS SECTION FOR THIS COMPETITION */}
                      <div className="p-3 rounded-xl bg-[#121614] border border-[#222A24] space-y-2 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-stone-300 flex items-center gap-1.5">
                            <TrophyIcon size={14} className="text-[#E5A93C]" />
                            <span>Previous Winning Platoons ({compHistory.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => openAddHistoryModalForComp(comp)}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
                          >
                            + Record Winner
                          </button>
                        </div>

                        {compHistory.length === 0 ? (
                          <p className="text-[11px] text-stone-400 italic">
                            No previous edition champions recorded yet. Click &ldquo;Record Winner&rdquo; to add past batch champions.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {compHistory.map((h) => (
                              <div
                                key={h.id}
                                className="p-2 rounded-lg bg-[#161B18] border border-[#263028] text-xs flex items-center justify-between gap-2 min-w-0"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-stone-400 truncate">
                                      {h.edition}
                                    </span>
                                    <span className="font-bold text-emerald-400 truncate">
                                      {h.winningPlatoon}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-400 truncate">
                                    {h.officialScoreNote}
                                  </p>
                                </div>
                                <span className="text-[10px] font-mono text-[#E5A93C] shrink-0 font-semibold">
                                  🏆
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons (Clean responsive wrap, non-overflowing) */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#222A24]">
                        <button
                          type="button"
                          onClick={() => openAddHistoryModalForComp(comp)}
                          className="px-3 py-1.5 rounded-lg bg-[#1A221D] hover:bg-[#232F27] border border-[#29372D] text-xs font-semibold text-stone-200 transition-colors cursor-pointer"
                        >
                          + Add Edition Winner
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditCompModal(comp)}
                          className="px-3 py-1.5 rounded-lg border border-[#2C3830] hover:bg-[#1E2621] text-xs font-semibold text-stone-200 transition-colors cursor-pointer"
                        >
                          Edit Pool
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPublishingComp(comp);
                            setWinningOption(comp.options[0] || 'Platoon 1');
                            setOfficialScoreNote('');
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-[#008751] hover:bg-[#007545] text-xs font-semibold text-white transition-colors cursor-pointer"
                        >
                          Publish Result
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: WINNING HISTORY & PLATOON ARCHIVES (Dedicated, Sleek, Complete) */}
          {activeTab === 'winners-history' && (
            <div className="space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold text-white truncate">
                    Platoon Winning History & Champions Archive
                  </h1>
                  <p className="text-xs text-stone-400 mt-0.5 truncate">
                    Official tournament titles, past batch editions, and medal leaderboard for all 10 platoons
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddHistoryModalForComp()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] text-xs font-semibold text-white transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <PlusIcon size={14} />
                  <span>Record Past Champion</span>
                </button>
              </div>

              {/* Platoon Championship Tally (10 Platoons Hall of Fame, completely responsive) */}
              <div className="rounded-2xl bg-[#161B18] border border-[#263028] p-4 sm:p-5 space-y-3 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between pb-2 border-b border-[#222A24]">
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrophyIcon size={16} className="text-[#E5A93C]" />
                    <span>Platoon Championship Leaderboard</span>
                  </h2>
                  <span className="text-xs font-mono text-stone-400">10 Platoons · Keffi Camp</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                  {sortedPlatoonLeaderboard.map(([platoonName, data], idx) => {
                    const hasWins = data.count > 0;
                    const colors = PLATOON_COLORS[platoonName] || {
                      bg: 'bg-[#18261E]',
                      text: 'text-emerald-400',
                      border: 'border-[#254A34]',
                    };

                    return (
                      <div
                        key={platoonName}
                        onClick={() =>
                          setHistoryFilterPlatoon(
                            historyFilterPlatoon === platoonName ? 'All' : platoonName
                          )
                        }
                        className={`p-3 rounded-xl border transition-all cursor-pointer select-none min-w-0 overflow-hidden ${
                          historyFilterPlatoon === platoonName
                            ? 'ring-2 ring-[#008751] bg-[#1A261F] border-[#008751]'
                            : hasWins
                            ? `${colors.bg} ${colors.border}`
                            : 'bg-[#121614] border-[#222A24]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono text-stone-400 font-bold shrink-0">
                            #{idx + 1}
                          </span>
                          {hasWins ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#E5A93C] text-black shrink-0">
                              {data.count} {data.count === 1 ? 'Title' : 'Titles'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone-400 shrink-0">0 wins</span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-white mt-1.5 truncate">
                          {platoonName}
                        </h3>
                        <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                          {hasWins ? `${data.events.length} match won` : 'Awaiting 1st title'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filters & Search Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-w-0">
                {/* Search */}
                <div className="relative flex-1 min-w-0 max-w-md">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-400">
                    <SearchIcon size={14} />
                  </div>
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Search competition, edition, or score..."
                    className="w-full h-9 pl-9 pr-3 rounded-xl bg-[#161B18] border border-[#27322A] text-xs text-white placeholder-stone-400 focus:outline-hidden focus:border-[#008751]"
                  />
                </div>

                {/* Category & Platoon Selectors */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                  <select
                    value={historyFilterCategory}
                    onChange={(e) => setHistoryFilterCategory(e.target.value as any)}
                    className="h-9 px-3 rounded-xl bg-[#161B18] border border-[#27322A] text-xs text-white focus:outline-hidden"
                  >
                    <option value="All">All Categories</option>
                    <option value="Sports Competitions">Sports Competitions</option>
                    <option value="Cultural & Talent">Cultural & Talent</option>
                    <option value="Parade & Drill">Parade & Drill</option>
                  </select>

                  <select
                    value={historyFilterPlatoon}
                    onChange={(e) => setHistoryFilterPlatoon(e.target.value)}
                    className="h-9 px-3 rounded-xl bg-[#161B18] border border-[#27322A] text-xs text-white focus:outline-hidden"
                  >
                    <option value="All">All Platoons</option>
                    {DEFAULT_PLATOONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chronological Winning Match Archives Cards Grid */}
              <div className="space-y-3 min-w-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-white">
                    Historical Champion Records ({filteredHistoryRecords.length})
                  </h2>
                  {(historyFilterCategory !== 'All' ||
                    historyFilterPlatoon !== 'All' ||
                    historySearchQuery) && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryFilterCategory('All');
                        setHistoryFilterPlatoon('All');
                        setHistorySearchQuery('');
                      }}
                      className="text-xs text-emerald-400 hover:underline cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {filteredHistoryRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400 rounded-2xl bg-[#161B18] border border-[#263028]">
                    No historical championship records match your filter. Try clearing your search or add a new record.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    {filteredHistoryRecords.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-4 rounded-xl bg-[#161B18] border border-[#263028] flex flex-col justify-between gap-3 min-w-0 overflow-hidden hover:border-[#38483C] transition-colors"
                      >
                        <div className="space-y-2 min-w-0">
                          {/* Header tags */}
                          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-[#1C2520] text-emerald-300 border border-[#283C30]">
                              {rec.edition}
                            </span>
                            <span className="text-stone-400 truncate max-w-[150px]">
                              {rec.category}
                            </span>
                          </div>

                          {/* Competition Name */}
                          <h3 className="text-sm font-bold text-white break-words">
                            {rec.competitionName}
                          </h3>

                          {/* Champion Ribbon */}
                          <div className="p-2.5 rounded-lg bg-[#14281E] border border-[#224A34] flex items-center justify-between gap-2 min-w-0">
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">
                                Champion Platoon
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-white truncate block">
                                🏆 {rec.winningPlatoon}
                              </span>
                            </div>
                            {rec.runnerUpPlatoon && (
                              <div className="text-right shrink-0">
                                <span className="text-[10px] font-mono uppercase text-stone-400 block">
                                  Runner-Up
                                </span>
                                <span className="text-xs font-semibold text-stone-300">
                                  🥈 {rec.runnerUpPlatoon}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Score and highlight */}
                          <div className="text-xs space-y-1">
                            <p className="text-stone-300 break-words">
                              Score: <strong className="text-white">{rec.officialScoreNote}</strong>
                            </p>
                            {rec.highlight && (
                              <p className="text-[11px] text-stone-400 italic break-words">
                                &ldquo;{rec.highlight}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Footer row: Prize & actions */}
                        <div className="pt-2 border-t border-[#222A24] flex items-center justify-between text-[11px] min-w-0">
                          <span className="font-mono text-stone-400 truncate">
                            Prize: <strong className="text-[#E5A93C]">₦{(rec.prizeAmount || 0).toLocaleString()}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistoryRecord(rec)}
                            className="p-1 rounded text-stone-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                            title="Delete record"
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PREDICTIONS */}
          {activeTab === 'predictions' && (
            <div className="space-y-4 min-w-0">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Participant Predictions</h1>
                <p className="text-xs text-stone-400">{predictions.length} Total verified predictions logged</p>
              </div>

              <div className="rounded-xl bg-[#161B18] border border-[#263028] overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[550px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#232B25] bg-[#121614] text-stone-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 sm:px-4">Participant</th>
                      <th className="py-2.5 px-3 sm:px-4">Competition</th>
                      <th className="py-2.5 px-3 sm:px-4">Platoon</th>
                      <th className="py-2.5 px-3 sm:px-4">Fee</th>
                      <th className="py-2.5 px-3 sm:px-4">Status</th>
                      <th className="py-2.5 px-3 sm:px-4">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202722]">
                    {predictions.map((p) => (
                      <tr key={p.id} className="hover:bg-[#19211D]">
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-white truncate max-w-[140px]">{p.userFullName}</td>
                        <td className="py-2.5 px-3 sm:px-4 text-stone-300 truncate max-w-[150px]">{p.competitionName}</td>
                        <td className="py-2.5 px-3 sm:px-4 text-emerald-400 font-semibold">{p.selectedOption}</td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-white">₦{p.entryAmount}</td>
                        <td className="py-2.5 px-3 sm:px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              p.predictionStatus === 'Won'
                                ? 'bg-[#15281D] text-emerald-300'
                                : p.predictionStatus === 'Lost'
                                ? 'bg-[#281515] text-red-300'
                                : 'bg-[#1C241E] text-stone-300'
                            }`}
                          >
                            {p.predictionStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-stone-400 text-[11px] truncate max-w-[120px]">{p.paystackReference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4 min-w-0">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Paystack Transactions</h1>
                <p className="text-xs text-stone-400">{transactions.length} Payment records logged</p>
              </div>

              <div className="rounded-xl bg-[#161B18] border border-[#263028] overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[550px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#232B25] bg-[#121614] text-stone-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 sm:px-4">User</th>
                      <th className="py-2.5 px-3 sm:px-4">Paystack Ref</th>
                      <th className="py-2.5 px-3 sm:px-4">Amount</th>
                      <th className="py-2.5 px-3 sm:px-4">Status</th>
                      <th className="py-2.5 px-3 sm:px-4">Channel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202722]">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-[#19211D]">
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-white truncate max-w-[140px]">{t.userFullName}</td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-stone-300 text-[11px] truncate max-w-[130px]">{t.paystackReference}</td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-white">₦{t.amount}</td>
                        <td className="py-2.5 px-3 sm:px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#15281D] text-emerald-400">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-stone-400">{t.channel || 'Card/Transfer'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: WINNERS & PAYOUTS */}
          {activeTab === 'winners' && (
            <div className="space-y-4 min-w-0">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Winner Payout Management</h1>
                <p className="text-xs text-stone-400">Verify and disburse prize shares to qualifying participants</p>
              </div>

              <div className="rounded-xl bg-[#161B18] border border-[#263028] overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[550px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#232B25] bg-[#121614] text-stone-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 sm:px-4">Winner</th>
                      <th className="py-2.5 px-3 sm:px-4">Competition</th>
                      <th className="py-2.5 px-3 sm:px-4">Prize</th>
                      <th className="py-2.5 px-3 sm:px-4">Status</th>
                      <th className="py-2.5 px-3 sm:px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202722]">
                    {winners.map((w) => (
                      <tr key={w.id} className="hover:bg-[#19211D]">
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-white truncate max-w-[140px]">{w.userFullName}</td>
                        <td className="py-2.5 px-3 sm:px-4 text-stone-300 truncate max-w-[150px]">{w.competitionName}</td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono font-bold text-[#E5A93C]">₦{w.prizeAmount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 sm:px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              w.status === 'Paid'
                                ? 'bg-[#15281D] text-emerald-300'
                                : 'bg-[#2A2012] text-amber-300'
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4">
                          <button
                            type="button"
                            onClick={() => {
                              setProcessingWinner(w);
                              setWinnerNextStatus('Paid');
                              setPayoutReference(w.payoutReference || `payout_pstk_${Date.now()}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#1F2722] hover:bg-[#28332C] border border-[#2B3830] text-stone-200 text-xs font-semibold cursor-pointer"
                          >
                            Payout
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: COMMUNITY HELP */}
          {activeTab === 'fundraising' && (
            <div className="space-y-4 min-w-0">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Community Projects in Keffi</h1>
                <p className="text-xs text-stone-400">Allocated and disbursed charitable funds in Keffi LGA</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#263028] min-w-0 overflow-hidden">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block truncate">Total Collected</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-white mt-0.5 block truncate">
                    ₦{fundraisingSummary.totalProceedsNaira.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#263028] min-w-0 overflow-hidden">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block truncate">For Projects</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5 block truncate">
                    ₦{fundraisingSummary.beneficiaryAllocated.toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#263028] min-w-0 overflow-hidden">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block truncate">Already Disbursed</span>
                  <span className="text-base sm:text-lg font-bold font-mono text-white mt-0.5 block truncate">
                    ₦{fundraisingSummary.amountDisbursed.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 min-w-0">
                {fundraisingRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl bg-[#161B18] border border-[#263028] flex items-center justify-between text-xs gap-3 min-w-0 overflow-hidden"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate">{r.title}</p>
                      <p className="text-stone-400 text-[11px] truncate">{r.beneficiaryName} · Ref: {r.reference}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 shrink-0">₦{r.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4 min-w-0">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Registered Users</h1>
                <p className="text-xs text-stone-400">{users.length} Total users in database</p>
              </div>

              <div className="rounded-xl bg-[#161B18] border border-[#263028] overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[500px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#232B25] bg-[#121614] text-stone-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 sm:px-4">Full Name</th>
                      <th className="py-2.5 px-3 sm:px-4">Email</th>
                      <th className="py-2.5 px-3 sm:px-4">Phone</th>
                      <th className="py-2.5 px-3 sm:px-4">Role</th>
                      <th className="py-2.5 px-3 sm:px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202722]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#19211D]">
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-white truncate max-w-[140px]">{u.fullName}</td>
                        <td className="py-2.5 px-3 sm:px-4 text-stone-300 truncate max-w-[160px]">{u.email}</td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-stone-400">{u.phone}</td>
                        <td className="py-2.5 px-3 sm:px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${u.role === 'admin' ? 'bg-[#182C1F] text-emerald-300' : 'bg-[#1C241E] text-stone-300'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 sm:px-4 text-emerald-400">{u.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: AUDIT LOGS */}
          {activeTab === 'auditLogs' && (
            <div className="space-y-4 min-w-0">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">System Audit Trail</h1>
                <p className="text-xs text-stone-400">Immutable administrative and payment action logs</p>
              </div>

              <div className="rounded-xl bg-[#161B18] border border-[#263028] overflow-x-auto w-full no-scrollbar">
                <table className="w-full min-w-[550px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#232B25] bg-[#121614] text-stone-400 font-mono text-[11px]">
                      <th className="py-2.5 px-3 sm:px-4">Admin</th>
                      <th className="py-2.5 px-3 sm:px-4">Action</th>
                      <th className="py-2.5 px-3 sm:px-4">Record</th>
                      <th className="py-2.5 px-3 sm:px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202722]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#19211D]">
                        <td className="py-2.5 px-3 sm:px-4 font-semibold text-white truncate max-w-[140px]">{log.adminName}</td>
                        <td className="py-2.5 px-3 sm:px-4 text-stone-200 truncate max-w-[160px]">{log.action}</td>
                        <td className="py-2.5 px-3 sm:px-4 font-mono text-stone-400 text-[11px] truncate max-w-[150px]">{log.affectedRecord}</td>
                        <td className="py-2.5 px-3 sm:px-4 text-stone-400 text-[11px]">{new Date(log.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: CREATE / EDIT COMPETITION */}
      {showCompModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#161B18] border border-[#28322B] text-white p-5 sm:p-6 shadow-2xl my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A24]">
              <h2 className="text-base font-bold text-white">
                {editingComp ? 'Edit Competition Pool' : 'Create New Competition Pool'}
              </h2>
              <button
                type="button"
                onClick={() => setShowCompModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCompetition} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Competition Title</label>
                <input
                  type="text"
                  required
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="e.g. Inter-Platoon Football Final"
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden focus:border-[#008751]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Category</label>
                  <select
                    value={compCategory}
                    onChange={(e) => setCompCategory(e.target.value as CompetitionCategory)}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  >
                    <option value="Sports Competitions">Sports Competitions</option>
                    <option value="Cultural & Talent">Cultural & Talent</option>
                    <option value="Parade & Drill">Parade & Drill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Status</label>
                  <select
                    value={compStatus}
                    onChange={(e) => setCompStatus(e.target.value as CompetitionStatus)}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  >
                    <option value="Open">Open</option>
                    <option value="Live">Live</option>
                    <option value="Closing Soon">Closing Soon</option>
                    <option value="Closed">Closed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Platoon Options (comma separated)</label>
                <input
                  type="text"
                  required
                  value={compOptionsText}
                  onChange={(e) => setCompOptionsText(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Entry Fee (₦)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={compEntryFee}
                    onChange={(e) => setCompEntryFee(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Prize Pool (₦)</label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={compPrizeAmount}
                    onChange={(e) => setCompPrizeAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={compDesc}
                  onChange={(e) => setCompDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Poster Image (Cloudinary)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCloudinaryFileSelect}
                  className="block w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#202722] file:text-white file:cursor-pointer"
                />
                {uploadingImage && <p className="text-[11px] text-emerald-400 mt-1">Uploading to Cloudinary...</p>}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222A24]">
                <button
                  type="button"
                  onClick={() => setShowCompModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202722] text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] font-semibold text-white"
                >
                  Save Competition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PUBLISH OFFICIAL RESULT */}
      {publishingComp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#161B18] border border-[#28322B] text-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A24]">
              <h2 className="text-base font-bold text-white">Publish Official Match Result</h2>
              <button
                type="button"
                onClick={() => setPublishingComp(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Declare the official winner for <strong>{publishingComp.name}</strong>. This will automatically identify qualifying winners, calculate prize shares, and record into the Platoon Winning History.
            </p>

            <form onSubmit={handlePublishResult} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Official Winning Platoon</label>
                <select
                  value={winningOption}
                  onChange={(e) => setWinningOption(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                >
                  {publishingComp.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Official Score Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platoon 4 defeated Platoon 7 (2 - 1 on penalties)"
                  value={officialScoreNote}
                  onChange={(e) => setOfficialScoreNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222A24]">
                <button
                  type="button"
                  onClick={() => setPublishingComp(null)}
                  className="px-4 py-2 rounded-xl bg-[#202722] text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] font-semibold text-white"
                >
                  Confirm & Publish Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WINNER PAYOUT UPDATE */}
      {processingWinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#161B18] border border-[#28322B] text-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A24]">
              <h2 className="text-base font-bold text-white">Record Winner Payout</h2>
              <button
                type="button"
                onClick={() => setProcessingWinner(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Updating payout for <strong>{processingWinner.userFullName}</strong> (₦{processingWinner.prizeAmount.toLocaleString()}).
            </p>

            <form onSubmit={handleWinnerPayout} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Payout Status</label>
                <select
                  value={winnerNextStatus}
                  onChange={(e) => setWinnerNextStatus(e.target.value as WinnerStatus)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                >
                  <option value="Paid">Paid</option>
                  <option value="Processing">Processing</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Paystack Payout Reference</label>
                <input
                  type="text"
                  required
                  value={payoutReference}
                  onChange={(e) => setPayoutReference(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222A24]">
                <button
                  type="button"
                  onClick={() => setProcessingWinner(null)}
                  className="px-4 py-2 rounded-xl bg-[#202722] text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] font-semibold text-white"
                >
                  Save Payout Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: RECORD PAST CHAMPION (Winning Platoons History) */}
      {showAddHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#161B18] border border-[#28322B] text-white p-5 sm:p-6 shadow-2xl my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A24]">
              <div className="flex items-center gap-2">
                <TrophyIcon size={18} className="text-[#E5A93C]" />
                <h2 className="text-base font-bold text-white">Record Historical Tournament Champion</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddHistoryModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Add past tournament winners from earlier batches or competitions to the official Platoon Winning History archives.
            </p>

            <form onSubmit={handleSaveHistoryRecord} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Competition Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Platoon Football Final"
                  value={histCompName}
                  onChange={(e) => setHistCompName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden focus:border-[#008751]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Category</label>
                  <select
                    value={histCategory}
                    onChange={(e) => setHistCategory(e.target.value as CompetitionCategory)}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  >
                    <option value="Sports Competitions">Sports Competitions</option>
                    <option value="Cultural & Talent">Cultural & Talent</option>
                    <option value="Parade & Drill">Parade & Drill</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Batch / Edition</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025 Batch C"
                    value={histEdition}
                    onChange={(e) => setHistEdition(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-400 font-medium mb-1">🏆 Champion Platoon</label>
                  <select
                    value={histWinningPlatoon}
                    onChange={(e) => setHistWinningPlatoon(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden font-bold"
                  >
                    {DEFAULT_PLATOONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">🥈 Runner-Up (Optional)</label>
                  <select
                    value={histRunnerUp}
                    onChange={(e) => setHistRunnerUp(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  >
                    <option value="">None</option>
                    {DEFAULT_PLATOONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Official Final Score / Judges Citation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Won 2 - 1 on penalty shootout (0 - 0 after extra time)"
                  value={histScoreNote}
                  onChange={(e) => setHistScoreNote(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-300 font-medium mb-1">Prize Distributed (₦)</label>
                  <input
                    type="number"
                    min={0}
                    value={histPrize}
                    onChange={(e) => setHistPrize(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-300 font-medium mb-1">🥉 3rd Place (Optional)</label>
                  <select
                    value={histThirdPlace}
                    onChange={(e) => setHistThirdPlace(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                  >
                    <option value="">None</option>
                    {DEFAULT_PLATOONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">Match Highlight / Story (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Decisive sudden-death penalty stop by goalkeeper to bring trophy to Platoon 7."
                  value={histHighlight}
                  onChange={(e) => setHistHighlight(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222A24]">
                <button
                  type="button"
                  onClick={() => setShowAddHistoryModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202722] text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] font-semibold text-white"
                >
                  Save Historical Champion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: SWITCH STAGING / LIVE ENVIRONMENT */}
      {showEnvConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-[#161B18] border border-[#28322B] text-white p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#222A24]">
              <h2 className="text-base font-bold text-white">Switch Application Environment</h2>
              <button
                type="button"
                onClick={() => setShowEnvConfirmModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-white"
              >
                <CloseIcon size={16} />
              </button>
            </div>

            <p className="text-xs text-stone-300">
              Current mode: <strong>{environment}</strong>. Switching will change the active database environment to{' '}
              <strong className="text-emerald-400">{environment === 'STAGING' ? 'LIVE' : 'STAGING'}</strong>.
            </p>

            <form onSubmit={handleConfirmSwitchEnvironment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">Reason for Switch (Logged to Audit Trail)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepared staging test match schedule for platoon sports"
                  value={envChangeReason}
                  onChange={(e) => setEnvChangeReason(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-[#121614] border border-[#263028] text-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#222A24]">
                <button
                  type="button"
                  onClick={() => setShowEnvConfirmModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202722] text-stone-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] font-semibold text-white"
                >
                  Confirm Switch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
