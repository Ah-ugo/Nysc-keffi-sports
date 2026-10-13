import React, { useState } from 'react';
import {
  AppEnvironment,
  CompetitionRecord,
  PlatformSettings,
  PredictionRecord,
  UserRecord,
  WinnerRecord,
} from '../types/models';
import { CampImage } from './CampImage';
import { NYSCLogo } from './NYSCLogo';
import { Carousel } from './Carousel';
import { PoolShareContent } from './SocialShareModal';
import {
  TrophyIcon,
  ShareIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
} from './Iconsax';
import { firebaseService } from '../services/firebaseService';

function formatCampDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatCampTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ==========================================
// COMPETITION CARD
// ==========================================
interface CompetitionCardProps {
  competition: CompetitionRecord;
  userPrediction?: PredictionRecord | null;
  onSelectCompetition: (comp: CompetitionRecord) => void;
  onSharePool: (pool: PoolShareContent) => void;
  cardWidthClass?: string;
}

export const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  userPrediction,
  onSelectCompetition,
  onSharePool,
  cardWidthClass = 'w-full',
}) => {
  const isOpen = competition.status === 'Open' || competition.status === 'Closing Soon';
  const isLive = competition.status === 'Live';

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSharePool({
      competition,
      prediction: userPrediction || undefined,
    });
  };

  return (
    <div
      onClick={() => onSelectCompetition(competition)}
      className={`group rounded-2xl bg-[#161B18] border border-[#27322A] hover:border-[#38483C] overflow-hidden flex flex-col justify-between transition-colors cursor-pointer select-none shrink-0 ${cardWidthClass}`}
    >
      <div>
        {/* Media Frame */}
        <div className="relative h-44 sm:h-48 bg-[#0E1210] overflow-hidden">
          <CampImage
            imageUrl={competition.imageUrl}
            imagePublicId={competition.imagePublicId}
            alt={competition.name}
            preset="card"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase ${
                isLive
                  ? 'bg-red-600 text-white'
                  : isOpen
                  ? 'bg-[#008751] text-white'
                  : 'bg-stone-800 text-stone-300'
              }`}
            >
              {isLive ? 'Playing Now' : isOpen ? 'Open' : competition.status}
            </span>

            <button
              type="button"
              onClick={handleShareClick}
              title={`Share ${competition.name}`}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-[#008751] text-white transition-colors cursor-pointer"
            >
              <ShareIcon size={15} />
            </button>
          </div>

          {/* Bottom figures on image */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
            <div>
              <span className="text-[10px] text-stone-300 uppercase font-mono block">
                Cash Prize
              </span>
              <span className="text-base font-bold font-mono text-[#E5A93C] tabular-nums">
                ₦{competition.prizeConfiguration.totalPrizeAmount.toLocaleString()}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-stone-300 uppercase font-mono block">
                Entry Fee
              </span>
              <span className="text-xs sm:text-sm font-semibold font-mono text-white tabular-nums">
                ₦{competition.entryFee.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-mono">
            <span>{competition.category}</span>
            <span>·</span>
            <span>{formatCampDate(competition.competitionAt)}</span>
          </div>

          <h3 className="text-base font-bold text-white leading-snug line-clamp-2">
            {competition.name}
          </h3>

          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {competition.description}
          </p>

          {isLive && competition.liveUpdateNote && (
            <div className="p-2 rounded-lg bg-[#2B1414] border border-[#482020] text-xs font-medium text-red-300">
              Live score: {competition.liveUpdateNote}
            </div>
          )}

          {competition.status === 'Completed' && competition.result && (
            <div className="p-2 rounded-lg bg-[#14261C] border border-[#224431] text-xs font-semibold text-emerald-300 flex items-center justify-between">
              <span>Winner: {competition.result.winningOption}</span>
              <span className="text-[10px] text-stone-400">Match Ended</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="p-4 pt-0">
        <div className="pt-2.5 border-t border-[#232B25] flex items-center justify-between gap-3">
          <div className="text-xs text-stone-400">
            {userPrediction ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckIcon size={14} />
                <span>You Picked: {userPrediction.selectedOption}</span>
              </span>
            ) : (
              <span>{competition.options.length} Platoons</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectCompetition(competition);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              userPrediction
                ? 'bg-[#1F2722] text-white hover:bg-[#28332C] border border-[#2F3D32]'
                : isOpen
                ? 'bg-[#008751] text-white hover:bg-[#007545]'
                : 'bg-[#222824] text-stone-300 hover:bg-[#2C342F]'
            }`}
          >
            {userPrediction
              ? 'View My Pick'
              : isOpen
              ? 'Predict Now'
              : competition.status === 'Completed'
              ? 'See Result'
              : 'Details'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// HOME PAGE
// ==========================================
interface HomePageProps {
  competitions: CompetitionRecord[];
  userPredictions: PredictionRecord[];
  environment: AppEnvironment;
  onSelectCompetition: (comp: CompetitionRecord) => void;
  onNavigate: (page: 'competitions' | 'how-it-works' | 'results' | 'transparency') => void;
  onSharePool: (pool: PoolShareContent) => void;
  onOpenAuth: () => void;
  currentUser: UserRecord | null;
}

export const HomePage: React.FC<HomePageProps> = ({
  competitions,
  userPredictions,
  onSelectCompetition,
  onNavigate,
  onSharePool,
  onOpenAuth,
  currentUser,
}) => {
  const featuredComp =
    competitions.find(
      (c) => c.isFeatured && (c.status === 'Open' || c.status === 'Closing Soon')
    ) ||
    competitions.find((c) => c.status === 'Open') ||
    competitions[0];

  const findUserPrediction = (compId: string) =>
    userPredictions.find((p) => p.competitionId === compId) || null;

  return (
    <div className="space-y-10 sm:space-y-14 pb-20 text-white">
      {/* 1. HERO SECTION (Simple, Friendly, Accessible) */}
      <section className="border-b border-[#222A25] bg-[#121614]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2.5 p-1.5 pr-3.5 rounded-xl bg-[#181F1A] border border-[#27342B]">
              <NYSCLogo size={30} />
              <span className="text-xs font-semibold text-white">
                NYSC Orientation Camp, Keffi · Charity Lottery
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Support Keffi. Pick Your Winning Platoon.
            </h1>

            <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed">
              Predict who will win inter-platoon football, volleyball, or dance competitions at camp. If you are correct, you share the cash prize! Your ₦500 entry fee directly helps repair clean water boreholes and support Keffi General Hospital.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('competitions')}
                className="px-5 py-2.5 rounded-xl bg-[#008751] hover:bg-[#007545] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                See Competitions
              </button>
              <button
                type="button"
                onClick={() => onNavigate('how-it-works')}
                className="px-4 py-2.5 rounded-xl bg-[#1A201C] hover:bg-[#222A25] border border-[#2B352E] text-stone-200 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                How It Works
              </button>
            </div>
          </div>

          {/* Right Column: Featured Competition */}
          <div className="lg:col-span-5">
            {featuredComp && (
              <div
                onClick={() => onSelectCompetition(featuredComp)}
                className="rounded-2xl bg-[#171D19] border border-[#2B382F] hover:border-[#3D4F42] overflow-hidden transition-colors cursor-pointer"
              >
                <div className="relative h-48 sm:h-56 bg-[#0F1311]">
                  <CampImage
                    imageUrl={featuredComp.imageUrl}
                    imagePublicId={featuredComp.imagePublicId}
                    alt={featuredComp.name}
                    preset="hero"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/45" />

                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-[#008751] text-white">
                      Featured Match
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSharePool({ competition: featuredComp });
                      }}
                      className="p-1.5 rounded-lg bg-black/60 hover:bg-[#008751] text-white transition-colors"
                      title="Share this match"
                    >
                      <ShareIcon size={15} />
                    </button>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4">
                    <span className="text-[11px] font-mono text-stone-300 uppercase block">
                      {featuredComp.category} · {featuredComp.options.length} Platoons Competing
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5 line-clamp-2">
                      {featuredComp.name}
                    </h2>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#121614] border border-[#242C26] text-xs">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">
                        Cash Prize
                      </span>
                      <span className="text-base font-bold font-mono text-[#E5A93C]">
                        ₦{featuredComp.prizeConfiguration.totalPrizeAmount.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">
                        Entry Fee
                      </span>
                      <span className="text-base font-bold font-mono text-white">
                        ₦{featuredComp.entryFee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCompetition(featuredComp);
                    }}
                    className="w-full py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#008751] hover:bg-[#007545] text-white transition-colors cursor-pointer"
                  >
                    Select Your Platoon
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. COMPETITION CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Carousel
          badge="Live & Upcoming"
          title="Camp Competitions"
          subtitle="Choose any competition below and pick who will win."
          action={
            <button
              type="button"
              onClick={() => onNavigate('competitions')}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({competitions.length})</span>
              <ArrowRightIcon size={14} />
            </button>
          }
        >
          {competitions.map((comp) => (
            <CompetitionCard
              key={comp.id}
              competition={comp}
              userPrediction={findUserPrediction(comp.id)}
              onSelectCompetition={onSelectCompetition}
              onSharePool={onSharePool}
              cardWidthClass="w-[270px] sm:w-[310px] md:w-[340px]"
            />
          ))}
        </Carousel>
      </section>

      {/* 3. RECENT WINNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#141916] border border-[#252E27] p-5 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#202722]">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Recent Winners & Payouts
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Participants who made correct predictions and got paid
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('results')}
              className="text-xs font-semibold text-stone-300 hover:text-white underline cursor-pointer self-start sm:self-auto"
            >
              See All Match Results
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#1A211D] border border-[#27322A] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[11px]">Football Final</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#14281D] text-emerald-400 border border-[#234B34]">
                  Paid
                </span>
              </div>
              <p className="text-sm font-bold text-white">Chinedu O.</p>
              <p className="text-xs text-stone-400">Predicted Platoon 4</p>
              <div className="pt-1.5 border-t border-[#232B25] flex items-center justify-between text-xs">
                <span className="text-stone-400">Prize Won</span>
                <span className="font-mono font-bold text-[#E5A93C]">₦150,000</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A211D] border border-[#27322A] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[11px]">Volleyball Cup</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#14281D] text-emerald-400 border border-[#234B34]">
                  Paid
                </span>
              </div>
              <p className="text-sm font-bold text-white">Fatima A.</p>
              <p className="text-xs text-stone-400">Predicted Platoon 7</p>
              <div className="pt-1.5 border-t border-[#232B25] flex items-center justify-between text-xs">
                <span className="text-stone-400">Prize Won</span>
                <span className="font-mono font-bold text-[#E5A93C]">₦80,000</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A211D] border border-[#27322A] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[11px]">Cultural Dance</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#14281D] text-emerald-400 border border-[#234B34]">
                  Paid
                </span>
              </div>
              <p className="text-sm font-bold text-white">Babajide T.</p>
              <p className="text-xs text-stone-400">Predicted Platoon 1</p>
              <div className="pt-1.5 border-t border-[#232B25] flex items-center justify-between text-xs">
                <span className="text-stone-400">Prize Won</span>
                <span className="font-mono font-bold text-[#E5A93C]">₦100,000</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1A211D] border border-[#27322A] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400 font-mono text-[11px]">March-Past</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#14281D] text-emerald-400 border border-[#234B34]">
                  Paid
                </span>
              </div>
              <p className="text-sm font-bold text-white">Ngozi E.</p>
              <p className="text-xs text-stone-400">Predicted Platoon 3</p>
              <div className="pt-1.5 border-t border-[#232B25] flex items-center justify-between text-xs">
                <span className="text-stone-400">Prize Won</span>
                <span className="font-mono font-bold text-[#E5A93C]">₦75,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHERE THE MONEY GOES (Plain Community English) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-[#141916] border border-[#252E27] p-5 sm:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-xl font-bold text-white">
                How Your ₦500 Helps the Keffi Community
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5 max-w-2xl">
                Every ticket fee helps build and fix important facilities for the people living in Keffi.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('transparency')}
              className="px-3.5 py-1.5 rounded-lg bg-[#1F2722] hover:bg-[#28332C] border border-[#2C3830] text-xs font-semibold text-white transition-colors cursor-pointer self-start md:self-auto"
            >
              See Full Breakdown
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-[#1A211D] border border-[#27322A] space-y-1.5">
              <h3 className="text-sm font-bold text-white">
                Clean Water Solar Borehole
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Fixing borehole pumps so families and children around Keffi camp have clean drinking water.
              </p>
              <div className="pt-2 border-t border-[#232B25] flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Total Spent</span>
                <span className="text-emerald-400 font-semibold">₦1,250,000</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1A211D] border border-[#27322A] space-y-1.5">
              <h3 className="text-sm font-bold text-white">
                Hospital Maternity Ward Kits
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Buying delivery kits and medical monitors for pregnant mothers at Keffi General Hospital.
              </p>
              <div className="pt-2 border-t border-[#232B25] flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Total Spent</span>
                <span className="text-emerald-400 font-semibold">₦850,000</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#1A211D] border border-[#27322A] space-y-1.5">
              <h3 className="text-sm font-bold text-white">
                School Study Desks
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Making 200 dual study desks for primary and secondary school children in Keffi town.
              </p>
              <div className="pt-2 border-t border-[#232B25] flex items-center justify-between text-xs font-mono">
                <span className="text-stone-400">Total Spent</span>
                <span className="text-emerald-400 font-semibold">₦600,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ==========================================
// COMPETITIONS LIST PAGE
// ==========================================
interface CompetitionsListPageProps {
  competitions: CompetitionRecord[];
  userPredictions: PredictionRecord[];
  onSelectCompetition: (comp: CompetitionRecord) => void;
  onSharePool: (pool: PoolShareContent) => void;
}

export const CompetitionsListPage: React.FC<CompetitionsListPageProps> = ({
  competitions,
  userPredictions,
  onSelectCompetition,
  onSharePool,
}) => {
  const [filter, setFilter] = useState<'All' | 'Sports' | 'Cultural' | 'Drill'>('All');

  const filtered = competitions.filter((c) => {
    if (filter === 'All') return true;
    if (filter === 'Sports') return c.category === 'Sports Competitions';
    if (filter === 'Cultural') return c.category === 'Cultural & Talent';
    if (filter === 'Drill') return c.category === 'Parade & Drill';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5 pb-24 text-white">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">
            NYSC Orientation Camp, Keffi
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            All Competitions
          </h1>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#161B18] border border-[#27322A] overflow-x-auto">
          {(['All', 'Sports', 'Cultural', 'Drill'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filter === cat
                  ? 'bg-[#008751] text-white'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((comp) => (
          <CompetitionCard
            key={comp.id}
            competition={comp}
            userPrediction={userPredictions.find((p) => p.competitionId === comp.id) || null}
            onSelectCompetition={onSelectCompetition}
            onSharePool={onSharePool}
          />
        ))}
      </div>
    </div>
  );
};

// ==========================================
// COMPETITION DETAIL & PREDICTION PAGE
// ==========================================
interface CompetitionDetailPageProps {
  competition: CompetitionRecord;
  existingPrediction: PredictionRecord | null;
  currentUser: UserRecord | null;
  onBack: () => void;
  onInitiatePredictAndPay: (selectedOption: string) => void;
  onSharePool: (pool: PoolShareContent) => void;
  onOpenAuth: () => void;
}

export const CompetitionDetailPage: React.FC<CompetitionDetailPageProps> = ({
  competition,
  existingPrediction,
  currentUser,
  onBack,
  onInitiatePredictAndPay,
  onSharePool,
  onOpenAuth,
}) => {
  const [selectedOption, setSelectedOption] = useState<string>(
    existingPrediction?.selectedOption || competition.options[0] || 'Platoon 1'
  );

  const now = Date.now();
  const opensAtMs = new Date(competition.opensAt).getTime();
  const closesAtMs = new Date(competition.closesAt).getTime();
  const isClosed =
    now >= closesAtMs || ['Closed', 'Completed', 'Live'].includes(competition.status);
  const canPredict = !existingPrediction && !isClosed && now >= opensAtMs;

  const pastHistory = firebaseService.getPlatoonHistory().filter(
    (h) =>
      h.competitionId === competition.id ||
      h.competitionName.toLowerCase().trim() === competition.name.toLowerCase().trim()
  );

  const handleShare = () => {
    onSharePool({
      competition,
      prediction: existingPrediction || undefined,
    });
  };

  const handlePredictClick = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    onInitiatePredictAndPay(selectedOption);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-36 space-y-5 text-white">
      {/* Top Nav Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeftIcon size={16} />
          <span>Back to Competitions</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181F1A] border border-[#27342B] text-xs font-medium text-stone-200 hover:text-white transition-colors cursor-pointer"
        >
          <ShareIcon size={14} />
          <span>Share Match</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl bg-[#161B18] border border-[#27322A] overflow-hidden">
        <div className="relative h-52 sm:h-64 bg-[#0E1210]">
          <CampImage
            imageUrl={competition.imageUrl}
            imagePublicId={competition.imagePublicId}
            alt={competition.name}
            preset="hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase bg-black/70 text-emerald-400 border border-stone-800">
              {competition.category}
            </span>
            <span className="px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase bg-[#008751] text-white">
              {competition.status}
            </span>
          </div>

          <div className="absolute bottom-3 left-4 right-4">
            <span className="text-[11px] font-mono text-stone-300 block">
              Match Date: {formatCampDate(competition.competitionAt)} at {formatCampTime(competition.competitionAt)}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              {competition.name}
            </h1>
          </div>
        </div>

        {/* Spec figures bar */}
        <div className="p-3.5 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#111613] border-b border-[#222A24] text-xs">
          <div>
            <span className="text-[10px] font-mono text-stone-400 uppercase block">
              Entry Fee
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-white">
              ₦{competition.entryFee.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-stone-400 uppercase block">
              Cash Prize
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-[#E5A93C]">
              ₦{competition.prizeConfiguration.totalPrizeAmount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-stone-400 uppercase block">
              Entry Closes
            </span>
            <span className="font-medium text-stone-200">
              {formatCampDate(competition.closesAt)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono text-stone-400 uppercase block">
              Rule
            </span>
            <span className="font-semibold text-emerald-400">1 Entry Per Person</span>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 sm:p-5 space-y-2.5">
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            {competition.description}
          </p>

          {competition.result && (
            <div className="p-3.5 rounded-xl bg-[#14261C] border border-[#224431] text-xs text-white space-y-1">
              <span className="font-bold text-emerald-300 block text-sm">
                Winning Platoon: {competition.result.winningOption}
              </span>
              <p className="text-stone-300">{competition.result.officialScoreNote}</p>
            </div>
          )}
        </div>
      </div>

      {/* Existing prediction ticket badge */}
      {existingPrediction && (
        <div className="p-4 rounded-xl bg-[#17231B] border border-[#274530] text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-300">
              You Have Entered This Competition
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="px-2.5 py-1 rounded bg-[#203626] text-white hover:bg-[#284430] font-semibold text-[11px]"
            >
              Share My Pick
            </button>
          </div>
          <p className="text-stone-300">
            Selected Platoon: <strong className="text-white">{existingPrediction.selectedOption}</strong> · Ref: {existingPrediction.paystackReference}
          </p>
        </div>
      )}

      {/* Previous Winning Platoons for this Match */}
      {pastHistory.length > 0 && (
        <div className="rounded-2xl bg-[#161B18] border border-[#27322A] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrophyIcon size={16} className="text-[#E5A93C]" />
              <h3 className="text-sm font-bold text-white">
                Previous Winning Platoons for this Match ({pastHistory.length})
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">NYSC Keffi Archives</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {pastHistory.map((h) => (
              <div
                key={h.id}
                className="p-3 rounded-xl bg-[#111613] border border-[#232D25] space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                  <span className="px-1.5 py-0.5 rounded bg-[#1C2520] text-emerald-300 border border-[#283C2F] font-semibold">
                    {h.edition}
                  </span>
                  <span className="text-[#E5A93C] font-bold">🏆 Champion</span>
                </div>
                <p className="font-bold text-emerald-400 text-sm mt-1">
                  {h.winningPlatoon}
                </p>
                <p className="text-[11px] text-stone-300">
                  {h.officialScoreNote}
                </p>
                {h.runnerUpPlatoon && (
                  <p className="text-[10px] text-stone-400">
                    Runner-up: {h.runnerUpPlatoon}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platoon Selection Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white">
            Pick Who Will Win
          </h2>
          <span className="text-xs text-stone-400 font-mono">
            {competition.options.length} Platoons
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {competition.options.map((option) => {
            const isSelected = selectedOption === option;
            return (
              <button
                key={option}
                type="button"
                disabled={!canPredict}
                onClick={() => setSelectedOption(option)}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#008751] bg-[#172D20] text-white'
                    : 'border-[#263028] bg-[#151A17] text-stone-300 hover:border-[#38483C]'
                } ${!canPredict ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="text-[10px] font-mono text-stone-400 uppercase block mb-0.5">
                  Choice
                </span>
                <span className="text-sm font-bold text-white block truncate">
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Prediction Bar (Compact, zero overlap) */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-[#121614]/95 backdrop-blur-md border-t border-[#232B25] p-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-stone-300 truncate">
              <span>Your Pick: </span>
              <strong className="text-white font-bold">{selectedOption}</strong>
              <span> · Fee: </span>
              <strong className="font-mono text-emerald-400 font-semibold">
                ₦{competition.entryFee.toLocaleString()}
              </strong>
            </div>
            <span className="text-[10px] text-stone-400 hidden sm:block">
              Win a share of ₦{competition.prizeConfiguration.totalPrizeAmount.toLocaleString()}
            </span>
          </div>

          <div className="shrink-0">
            {existingPrediction ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#17231B] text-emerald-300 border border-[#274530]">
                Ticket Confirmed
              </span>
            ) : isClosed ? (
              <span className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#261515] text-red-300 border border-[#442222]">
                Entries Closed
              </span>
            ) : !currentUser ? (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Sign In to Enter
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePredictClick}
                className="px-4 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Predict & Pay ₦{competition.entryFee.toLocaleString()}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// USER DASHBOARD / MY TICKETS
// ==========================================
interface UserDashboardPageProps {
  user: UserRecord;
  predictions: PredictionRecord[];
  competitions: CompetitionRecord[];
  winners: WinnerRecord[];
  onSelectCompetition: (comp: CompetitionRecord) => void;
  onSharePool: (pool: PoolShareContent) => void;
}

export const UserDashboardPage: React.FC<UserDashboardPageProps> = ({
  user,
  predictions,
  competitions,
  onSelectCompetition,
  onSharePool,
}) => {
  const firstName = user.fullName.split(' ')[0] || 'Participant';
  const activeCount = predictions.filter((p) => p.predictionStatus === 'Pending').length;
  const totalCount = predictions.length;
  const winsCount = predictions.filter((p) => p.predictionStatus === 'Won').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-5 text-white">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Welcome, {firstName}
        </h1>
        <p className="text-xs text-stone-400 mt-0.5">
          {user.email} · {user.phone}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#27322A]">
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Active Tickets</span>
          <span className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5 block">
            {activeCount}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#27322A]">
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Total Entered</span>
          <span className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5 block">
            {totalCount}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#27322A]">
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Matches Won</span>
          <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5 block">
            {winsCount}
          </span>
        </div>
      </div>

      {/* Slips List */}
      <div className="rounded-xl bg-[#161B18] border border-[#27322A] overflow-hidden">
        <div className="p-3.5 border-b border-[#232B25] flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">My Predictions</h2>
          <span className="text-xs font-mono text-stone-400">{predictions.length} Total</span>
        </div>

        {predictions.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            You have not made any predictions yet. Browse competitions to make your first pick!
          </div>
        ) : (
          <div className="divide-y divide-[#202722] text-xs">
            {predictions.map((p) => {
              const comp = competitions.find((c) => c.id === p.competitionId);
              return (
                <div
                  key={p.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1A211D] transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-white block text-sm">
                      {p.competitionName}
                    </span>
                    <div className="text-stone-400 flex flex-wrap gap-2 text-[11px]">
                      <span>Your Pick: <strong className="text-white">{p.selectedOption}</strong></span>
                      <span>·</span>
                      <span className="font-mono">Ref: {p.paystackReference}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <div className="text-right">
                      <span className="font-mono font-bold text-white block">
                        ₦{p.entryAmount}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                          p.predictionStatus === 'Won'
                            ? 'bg-[#15281D] text-emerald-300'
                            : p.predictionStatus === 'Lost'
                            ? 'bg-[#281515] text-red-300'
                            : 'bg-[#1D2420] text-stone-300'
                        }`}
                      >
                        {p.predictionStatus === 'Won' ? 'You Won!' : p.predictionStatus}
                      </span>
                    </div>

                    {comp && (
                      <button
                        type="button"
                        onClick={() =>
                          onSharePool({
                            competition: comp,
                            prediction: p,
                          })
                        }
                        title="Share your prediction"
                        className="p-1.5 rounded-lg bg-[#202722] hover:bg-[#28322B] text-stone-300 hover:text-white transition-colors cursor-pointer"
                      >
                        <ShareIcon size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// RESULTS PAGE
// ==========================================
export const ResultsPage: React.FC<{
  competitions: CompetitionRecord[];
  onSelectCompetition: (comp: CompetitionRecord) => void;
  onSharePool: (pool: PoolShareContent) => void;
}> = ({ competitions, onSelectCompetition, onSharePool }) => {
  const [activeSubTab, setActiveSubTab] = useState<'results' | 'history'>('results');
  const [historyCategory, setHistoryCategory] = useState<string>('All');
  const completed = competitions.filter((c) => c.status === 'Completed' && c.result);
  const allHistory = firebaseService.getPlatoonHistory();

  const filteredHistory = allHistory.filter((h) => {
    if (historyCategory === 'All') return true;
    return h.category === historyCategory;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-5 text-white">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Camp Results & Winning History
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Confirmed scores, official champions, and past tournament winning platoons
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#161B18] border border-[#27322A] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('results')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'results'
                ? 'bg-[#008751] text-white'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Match Results ({completed.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-[#008751] text-white'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Platoon History ({allHistory.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'results' ? (
        completed.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 rounded-xl bg-[#161B18] border border-[#27322A]">
            No live competitions have declared official results yet. Check back once matches conclude!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {completed.map((comp) => (
              <div
                key={comp.id}
                className="p-4 rounded-xl bg-[#161B18] border border-[#27322A] space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                  <span>{comp.category}</span>
                  <span>{formatCampDate(comp.competitionAt)}</span>
                </div>

                <h3 className="text-base font-bold text-white">{comp.name}</h3>

                <div className="p-2.5 rounded-lg bg-[#111613] border border-[#222A24] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">
                      Official Winner
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {comp.result?.winningOption}
                    </span>
                  </div>
                  <TrophyIcon size={18} className="text-emerald-400" />
                </div>

                <p className="text-xs text-stone-400 leading-relaxed">
                  {comp.result?.officialScoreNote}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-[#202722]">
                  <button
                    type="button"
                    onClick={() => onSelectCompetition(comp)}
                    className="text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
                  >
                    View Match Details →
                  </button>
                  <button
                    type="button"
                    onClick={() => onSharePool({ competition: comp })}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-white cursor-pointer"
                  >
                    <ShareIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#161B18] border border-[#27322A] overflow-x-auto w-fit">
            {['All', 'Sports Competitions', 'Cultural & Talent', 'Parade & Drill'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setHistoryCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  historyCategory === cat
                    ? 'bg-[#008751] text-white'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                {cat === 'Sports Competitions'
                  ? 'Sports'
                  : cat === 'Cultural & Talent'
                  ? 'Cultural'
                  : cat === 'Parade & Drill'
                  ? 'Drill'
                  : 'All'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredHistory.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-xl bg-[#161B18] border border-[#27322A] space-y-2 hover:border-[#38483C] transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-[#1C2520] text-emerald-300 border border-[#273C2F] text-[10px]">
                    {h.edition}
                  </span>
                  <span className="text-stone-400 text-[11px]">{h.category}</span>
                </div>

                <h3 className="text-base font-bold text-white">{h.competitionName}</h3>

                <div className="p-2.5 rounded-lg bg-[#111613] border border-[#222A24] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase font-mono block">
                      Champion Platoon
                    </span>
                    <span className="text-sm font-bold text-[#E5A93C]">
                      🏆 {h.winningPlatoon}
                    </span>
                  </div>
                  {h.runnerUpPlatoon && (
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 uppercase font-mono block">
                        Runner-Up
                      </span>
                      <span className="text-xs font-semibold text-stone-300">
                        🥈 {h.runnerUpPlatoon}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {h.officialScoreNote}
                </p>

                {h.highlight && (
                  <p className="text-[11px] text-stone-400 italic">
                    &ldquo;{h.highlight}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// WHERE THE MONEY GOES (Plain Language)
// ==========================================
export const WhereMoneyGoesPage: React.FC<{
  settings: PlatformSettings;
  summary: {
    totalEntriesCount: number;
    totalProceedsNaira: number;
    prizeAllocated: number;
    approvedExpenses: number;
    beneficiaryAllocated: number;
    amountDisbursed: number;
  };
}> = ({ settings, summary }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6 text-white">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Where the Money Goes
        </h1>
        <p className="text-xs sm:text-sm text-stone-400 mt-1 max-w-2xl">
          We believe in complete openness. Here is how your ticket fees are divided between cash prizes for winners and community help for Keffi.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#27322A]">
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Total Tickets Bought</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white mt-1 block">
            ₦{summary.totalProceedsNaira.toLocaleString()}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#27322A]">
          <span className="text-[10px] font-mono text-stone-400 uppercase block">For Hospital & Water</span>
          <span className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-1 block">
            ₦{summary.beneficiaryAllocated.toLocaleString()}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#27322A]">
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Cash Prizes for Winners</span>
          <span className="text-base sm:text-lg font-bold font-mono text-[#E5A93C] mt-1 block">
            ₦{summary.prizeAllocated.toLocaleString()}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-[#161B18] border border-[#27322A]">
          <span className="text-[10px] font-mono text-stone-400 uppercase block">Help Done in Keffi</span>
          <span className="text-base sm:text-lg font-bold font-mono text-white mt-1 block">
            ₦{summary.amountDisbursed.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// HOW IT WORKS (Plain Language)
// ==========================================
export const HowItWorksPage: React.FC<{
  onBrowseCompetitions: () => void;
  onViewTransparency: () => void;
}> = ({ onBrowseCompetitions, onViewTransparency }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-5 text-white">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          How to Play and Win
        </h1>
        <p className="text-xs text-stone-400 mt-0.5">
          Everything you need to know in 4 simple steps
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
        <div className="p-4 rounded-xl bg-[#161B18] border border-[#27322A] space-y-1.5">
          <span className="font-mono text-emerald-400 font-bold block">1. Pick a Competition</span>
          <h3 className="font-bold text-white">Choose Your Match</h3>
          <p className="text-stone-400 leading-relaxed">
            See the open platoon competitions (Football, Volleyball, Carnival Dance, or March-Past) taking place at Keffi Camp.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#161B18] border border-[#27322A] space-y-1.5">
          <span className="font-mono text-emerald-400 font-bold block">2. Select Your Platoon</span>
          <h3 className="font-bold text-white">One Ticket Per Person</h3>
          <p className="text-stone-400 leading-relaxed">
            Select the platoon you think will win. Each participant is allowed one prediction per match to make sure the game is fair.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#161B18] border border-[#27322A] space-y-1.5">
          <span className="font-mono text-emerald-400 font-bold block">3. Pay ₦500 Securely</span>
          <h3 className="font-bold text-white">Instant Paystack Payment</h3>
          <p className="text-stone-400 leading-relaxed">
            Pay with your ATM card, bank transfer, or USSD code. You get an immediate digital prediction ticket with your reference number.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#161B18] border border-[#27322A] space-y-1.5">
          <span className="font-mono text-emerald-400 font-bold block">4. Win Cash & Help Keffi</span>
          <h3 className="font-bold text-white">Collect Your Prize</h3>
          <p className="text-stone-400 leading-relaxed">
            When the match ends, results are published immediately. Winners share the prize money, and non-prize money helps fix water and healthcare in Keffi.
          </p>
        </div>
      </div>

      <div className="pt-2 flex gap-3">
        <button
          type="button"
          onClick={onBrowseCompetitions}
          className="px-4 py-2.5 rounded-xl bg-[#008751] hover:bg-[#007545] text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          See Competitions
        </button>
        <button
          type="button"
          onClick={onViewTransparency}
          className="px-4 py-2.5 rounded-xl bg-[#161B18] hover:bg-[#202722] border border-[#2B352E] text-stone-200 font-semibold text-xs transition-colors cursor-pointer"
        >
          See Where the Money Goes
        </button>
      </div>
    </div>
  );
};
