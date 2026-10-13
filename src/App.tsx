import React, { useState, useEffect } from 'react';
import {
  CompetitionRecord,
  TransactionRecord,
  UserRecord,
} from './types/models';
import { firebaseService } from './services/firebaseService';
import {
  CompetitionDetailPage,
  CompetitionsListPage,
  HomePage,
  HowItWorksPage,
  ResultsPage,
  UserDashboardPage,
  WhereMoneyGoesPage,
} from './components/PublicPages';
import { AuthView, ProfileView } from './components/AuthViews';
import { AdminConsole } from './components/AdminConsole';
import { PaystackCheckoutModal } from './components/PaystackCheckoutModal';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallBanner';
import { NYSCLogo } from './components/NYSCLogo';
import { SocialShareModal, PoolShareContent } from './components/SocialShareModal';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  TrophyIcon,
  UserIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  ShieldTickIcon,
  WalletIcon,
  DocumentIcon,
} from './components/Iconsax';

type PageRoute =
  | 'home'
  | 'competitions'
  | 'competition-detail'
  | 'my-predictions'
  | 'results'
  | 'transparency'
  | 'how-it-works'
  | 'auth'
  | 'profile'
  | 'admin';

export function App() {
  const [route, setRoute] = useState<PageRoute>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authContextMessage, setAuthContextMessage] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Per-pool share state (strictly per competition pool)
  const [poolToShare, setPoolToShare] = useState<PoolShareContent | null>(null);

  // Modern Toast Notification Stack
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [currentUser, setCurrentUser] = useState<UserRecord | null>(() =>
    firebaseService.getCurrentUser()
  );
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);

  const [activeTransaction, setActiveTransaction] = useState<TransactionRecord | null>(null);

  const [, setRefreshTick] = useState(0);
  const triggerRefresh = () => setRefreshTick((t) => t + 1);

  // Requirement: "if I go to new page go to top automatically"
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setMobileMenuOpen(false);
  }, [route]);

  const settings = firebaseService.getSettings();
  const environment = settings.activeEnvironment;
  const competitions = firebaseService.getCompetitions(environment);
  const userPredictions = currentUser
    ? firebaseService.getUserPredictions(currentUser.id, environment)
    : [];
  const allWinners = firebaseService.getAllWinners(environment);
  const fundraisingSummary = firebaseService.getFundraisingSummary(environment);

  // Check URL query for direct pool sharing (e.g. ?pool=comp_football_final_stg)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const poolId = params.get('pool');
      if (poolId) {
        const found = competitions.find((c) => c.id === poolId);
        if (found) {
          setSelectedCompetitionId(found.id);
          setRoute('competition-detail');
        }
      }
    }
  }, [competitions]);

  const selectedCompetition: CompetitionRecord | null = selectedCompetitionId
    ? competitions.find((c) => c.id === selectedCompetitionId) || null
    : null;

  const handleOpenCompetition = (comp: CompetitionRecord) => {
    setSelectedCompetitionId(comp.id);
    setRoute('competition-detail');
  };

  const handleInitiatePredictAndPay = async (selectedOption: string) => {
    if (!selectedCompetition) return;

    // Strict Auth Restriction: Only logged-in users can initiate payment
    if (!currentUser) {
      setAuthContextMessage(`Sign in to pick ${selectedOption} for this match`);
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const { transaction } = await firebaseService.initializePredictionPayment({
        user: currentUser,
        competitionId: selectedCompetition.id,
        selectedOption,
        environment,
      });
      setActiveTransaction(transaction);
    } catch (err) {
      addToast(
        'error',
        err instanceof Error ? err.message : 'Could not start payment. Please try again.',
        'Payment Notice'
      );
    }
  };

  const handleVerifySuccess = async (channel: string) => {
    if (!activeTransaction) return;
    try {
      const res = await firebaseService.verifyPaystackTransaction({
        paystackReference: activeTransaction.paystackReference,
        environment,
        channel,
      });
      setActiveTransaction(null);
      triggerRefresh();
      addToast(
        'success',
        `Your ticket for ${res.prediction.selectedOption} is confirmed! (Ref: ${res.transaction.paystackReference})`,
        'Ticket Confirmed'
      );
    } catch (err) {
      addToast('error', 'Payment verification could not be completed.', 'Verification Notice');
    }
  };

  const handleSimulateWebhookAndVerify = async (channel: string) => {
    if (!activeTransaction) return;
    try {
      await firebaseService.verifyPaystackTransaction({
        paystackReference: activeTransaction.paystackReference,
        environment,
        channel,
      });
      setActiveTransaction(null);
      triggerRefresh();
      addToast('success', 'Payment verified through Paystack! Your ticket is active.', 'Ticket Confirmed');
    } catch {
      addToast('error', 'Webhook verification failed.', 'Notice');
    }
  };

  const handleFailPayment = async () => {
    if (!activeTransaction) return;
    await firebaseService.markTransactionFailedOrCancelled({
      paystackReference: activeTransaction.paystackReference,
      status: 'Failed',
      reason: 'Payment failed',
    });
    setActiveTransaction(null);
    triggerRefresh();
    addToast('error', 'Payment was not successful. Please try again.', 'Payment Incomplete');
  };

  const handleCancelPayment = async () => {
    if (!activeTransaction) return;
    await firebaseService.markTransactionFailedOrCancelled({
      paystackReference: activeTransaction.paystackReference,
      status: 'Cancelled',
      reason: 'Cancelled by user',
    });
    setActiveTransaction(null);
    triggerRefresh();
    addToast('info', 'Payment checkout was cancelled.', 'Cancelled');
  };

  const isAdminUser = currentUser && ['admin', 'superAdmin'].includes(currentUser.role);

  // Quick switch between test accounts for rapid testing
  const handleQuickSwitchUser = (userId: string, label: string) => {
    try {
      const u = firebaseService.switchStagingDemoUser(userId);
      setCurrentUser(u);
      addToast('success', `Signed in as ${u.fullName} (${label}).`, 'Account Ready');
      triggerRefresh();
    } catch {
      addToast('error', 'Could not switch demo profile.', 'Notice');
    }
  };

  // If in admin console
  if (route === 'admin') {
    if (!isAdminUser || !currentUser) {
      return (
        <div className="min-h-screen bg-[#111413] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#181C1A] border border-[#2B352E] rounded-2xl p-6 text-center space-y-4">
            <ShieldTickIcon size={36} className="text-emerald-400 mx-auto" />
            <h1 className="text-xl font-bold">Admin Authorization Required</h1>
            <p className="text-xs text-stone-400">
              This area is restricted to camp administration accounts. Sign in with administrative privileges to continue.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => handleQuickSwitchUser('admin-1', 'Camp Admin')}
                className="px-4 py-2 rounded-xl bg-[#008751] hover:bg-[#007545] text-xs font-semibold text-white cursor-pointer"
              >
                Sign In as Admin
              </button>
              <button
                type="button"
                onClick={() => setRoute('home')}
                className="px-4 py-2 rounded-xl bg-[#222824] hover:bg-[#2C342F] text-xs font-semibold text-white cursor-pointer"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <AdminConsole
          currentUser={currentUser}
          environment={environment}
          settings={settings}
          onRefreshState={triggerRefresh}
          onNotify={(type, message) => addToast(type, message)}
          onExitAdmin={() => setRoute('home')}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#111413] text-[#F3F4F6] selection:bg-[#008751] selection:text-white">
      {/* Modern Floating Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* 1. TOP HEADER (Completely immune to overflow, spacious, responsive) */}
      <header className="sticky top-0 z-40 bg-[#161B18]/95 backdrop-blur-md border-b border-[#252E27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => setRoute('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer text-left min-w-0 shrink"
          >
            <NYSCLogo size={32} />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-emerald-400 truncate">
                NYSC Keffi Camp
              </span>
              <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Charity Lottery
              </span>
            </div>
          </button>

          {/* Desktop Nav Links (Clean, non-cramped) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-stone-300 shrink-0">
            <button
              type="button"
              onClick={() => setRoute('home')}
              className={`hover:text-white transition-colors cursor-pointer py-1 ${
                route === 'home' ? 'text-white border-b-2 border-[#008751]' : ''
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setRoute('competitions')}
              className={`hover:text-white transition-colors cursor-pointer py-1 ${
                route === 'competitions' || route === 'competition-detail'
                  ? 'text-white border-b-2 border-[#008751]'
                  : ''
              }`}
            >
              Competitions
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setRoute('my-predictions');
                } else {
                  setAuthContextMessage('Sign in to view your tickets');
                  setIsAuthModalOpen(true);
                }
              }}
              className={`hover:text-white transition-colors cursor-pointer py-1 ${
                route === 'my-predictions' ? 'text-white border-b-2 border-[#008751]' : ''
              }`}
            >
              My Tickets
            </button>
            <button
              type="button"
              onClick={() => setRoute('results')}
              className={`hover:text-white transition-colors cursor-pointer py-1 ${
                route === 'results' ? 'text-white border-b-2 border-[#008751]' : ''
              }`}
            >
              Results
            </button>
            <button
              type="button"
              onClick={() => setRoute('transparency')}
              className={`hover:text-white transition-colors cursor-pointer py-1 ${
                route === 'transparency' ? 'text-white border-b-2 border-[#008751]' : ''
              }`}
            >
              Where Money Goes
            </button>
            <button
              type="button"
              onClick={() => setRoute('how-it-works')}
              className={`hover:text-white transition-colors cursor-pointer py-1 ${
                route === 'how-it-works' ? 'text-white border-b-2 border-[#008751]' : ''
              }`}
            >
              How It Works
            </button>
          </nav>

          {/* User Auth Controls & Mobile Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {isAdminUser && (
              <button
                type="button"
                onClick={() => setRoute('admin')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182B1F] hover:bg-[#203627] text-xs font-semibold text-emerald-300 border border-[#274A34] transition-colors cursor-pointer"
              >
                <ShieldTickIcon size={14} />
                <span>Admin Panel</span>
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRoute('profile')}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-[#222B25] hover:bg-[#2A352E] rounded-xl border border-[#303D34] transition-colors cursor-pointer truncate max-w-[120px] sm:max-w-none"
                >
                  Hi, {currentUser.fullName.split(' ')[0]}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await firebaseService.logout();
                    setCurrentUser(null);
                    setRoute('home');
                    addToast('success', 'You have signed out.', 'Signed Out');
                  }}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#222B25] transition-colors cursor-pointer"
                >
                  <LogoutIcon size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthContextMessage(undefined);
                  setIsAuthModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#008751] hover:bg-[#007545] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                Sign In
              </button>
            )}

            {/* Mobile Hamburger (Drawer toggle) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-300 hover:text-white hover:bg-[#202722] transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#161B18] border-b border-[#252E27] px-4 py-3 space-y-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setRoute('home')}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#202722] text-stone-200"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setRoute('competitions')}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#202722] text-stone-200"
            >
              Competitions
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentUser) {
                  setRoute('my-predictions');
                } else {
                  setAuthContextMessage('Sign in to view your tickets');
                  setIsAuthModalOpen(true);
                }
              }}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#202722] text-stone-200"
            >
              My Tickets
            </button>
            <button
              type="button"
              onClick={() => setRoute('results')}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#202722] text-stone-200"
            >
              Official Results
            </button>
            <button
              type="button"
              onClick={() => setRoute('transparency')}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#202722] text-stone-200"
            >
              Where the Money Goes
            </button>
            <button
              type="button"
              onClick={() => setRoute('how-it-works')}
              className="w-full text-left py-2 px-3 rounded-lg hover:bg-[#202722] text-stone-200"
            >
              How It Works
            </button>
            {isAdminUser && (
              <button
                type="button"
                onClick={() => setRoute('admin')}
                className="w-full text-left py-2 px-3 rounded-lg bg-[#182B1F] text-emerald-300 font-semibold"
              >
                Open Admin Panel
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Viewport */}
      <main className="flex-1">
        {route === 'home' && (
          <HomePage
            competitions={competitions}
            userPredictions={userPredictions}
            environment={environment}
            onSelectCompetition={handleOpenCompetition}
            onNavigate={(dest) => setRoute(dest)}
            onSharePool={(pool) => setPoolToShare(pool)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            currentUser={currentUser}
          />
        )}

        {route === 'competitions' && (
          <CompetitionsListPage
            competitions={competitions}
            userPredictions={userPredictions}
            onSelectCompetition={handleOpenCompetition}
            onSharePool={(pool) => setPoolToShare(pool)}
          />
        )}

        {route === 'competition-detail' && selectedCompetition && (
          <CompetitionDetailPage
            competition={selectedCompetition}
            existingPrediction={
              currentUser
                ? firebaseService.getUserPredictionForCompetition(
                    currentUser.id,
                    selectedCompetition.id,
                    environment
                  )
                : null
            }
            currentUser={currentUser}
            onBack={() => setRoute('competitions')}
            onInitiatePredictAndPay={handleInitiatePredictAndPay}
            onSharePool={(pool) => setPoolToShare(pool)}
            onOpenAuth={() => {
              setAuthContextMessage(`Sign in to make a prediction on ${selectedCompetition.name}`);
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {route === 'my-predictions' && (
          currentUser ? (
            <UserDashboardPage
              user={currentUser}
              predictions={userPredictions}
              competitions={competitions}
              winners={allWinners}
              onSelectCompetition={handleOpenCompetition}
              onSharePool={(pool) => setPoolToShare(pool)}
            />
          ) : (
            <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
              <ShieldTickIcon size={36} className="text-emerald-400 mx-auto" />
              <h1 className="text-xl font-bold">Sign In Required</h1>
              <p className="text-xs text-stone-400">
                Sign in to view your tickets and see if you won!
              </p>
              <button
                type="button"
                onClick={() => {
                  setAuthContextMessage('Sign in to view your tickets');
                  setIsAuthModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#008751] hover:bg-[#007545] text-white text-xs font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )
        )}

        {route === 'results' && (
          <ResultsPage
            competitions={competitions}
            onSelectCompetition={handleOpenCompetition}
            onSharePool={(pool) => setPoolToShare(pool)}
          />
        )}

        {route === 'transparency' && (
          <WhereMoneyGoesPage
            settings={settings}
            summary={fundraisingSummary}
          />
        )}

        {route === 'how-it-works' && (
          <HowItWorksPage
            onBrowseCompetitions={() => setRoute('competitions')}
            onViewTransparency={() => setRoute('transparency')}
          />
        )}

        {route === 'auth' && (
          <AuthView
            mode={authMode}
            environment={environment}
            onModeChange={setAuthMode}
            onAuthSuccess={(user, msg) => {
              setCurrentUser(user);
              addToast('success', msg, 'Welcome');
              setRoute('home');
            }}
          />
        )}

        {route === 'profile' && currentUser && (
          <ProfileView
            user={currentUser}
            environment={environment}
            onUserUpdated={(updated, msg) => {
              setCurrentUser(updated);
              addToast('success', msg, 'Profile Saved');
            }}
            onLogout={async () => {
              await firebaseService.logout();
              setCurrentUser(null);
              setRoute('home');
              addToast('success', 'You have signed out.', 'Signed Out');
            }}
          />
        )}
      </main>

      {/* Footer (Clean, Simple, Helpful) */}
      <footer className="bg-[#0E1210] border-t border-[#1F2721] py-8 px-4 sm:px-6 lg:px-8 mb-16 md:mb-0 text-xs text-stone-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <NYSCLogo size={32} />
            <div>
              <p className="font-bold text-white">
                Keffi Camp Charity Lottery
              </p>
              <p className="text-[11px] text-stone-400">
                NYSC Permanent Orientation Camp, Keffi, Nasarawa State
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setRoute('how-it-works')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => setRoute('transparency')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Where the Money Goes
            </button>
            <button
              type="button"
              onClick={() => setRoute('results')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Match Results
            </button>

            {/* Quick Demo Switcher in footer for testing convenience */}
            <span className="text-stone-600">|</span>
            <button
              type="button"
              onClick={() => handleQuickSwitchUser('admin-1', 'Admin')}
              className="text-emerald-400 hover:underline cursor-pointer"
            >
              Demo: Test Admin
            </button>
            <button
              type="button"
              onClick={() => handleQuickSwitchUser('user-1', 'Corps Member')}
              className="text-stone-300 hover:underline cursor-pointer"
            >
              Demo: Test Corps Member
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-4 mt-5 border-t border-[#1C231E] text-center text-[11px] text-stone-500">
          Open to all Nigerians · Powered by Firebase & Paystack · Proceeds help the Keffi host community.
        </div>
      </footer>

      {/* Mobile Bottom Dock (4 clear tabs, zero cramping) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161B18]/95 backdrop-blur-md border-t border-[#252E27] grid grid-cols-4 items-center h-16">
        <button
          type="button"
          onClick={() => setRoute('home')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            route === 'home' ? 'text-emerald-400 font-semibold' : 'text-stone-400'
          }`}
        >
          <TrophyIcon size={18} />
          <span className="text-[10px] mt-1">Home</span>
        </button>

        <button
          type="button"
          onClick={() => setRoute('competitions')}
          className={`flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            route === 'competitions' || route === 'competition-detail'
              ? 'text-emerald-400 font-semibold'
              : 'text-stone-400'
          }`}
        >
          <DocumentIcon size={18} />
          <span className="text-[10px] mt-1">Matches</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (currentUser) {
              setRoute('my-predictions');
            } else {
              setAuthContextMessage('Sign in to view your tickets');
              setIsAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            route === 'my-predictions' ? 'text-emerald-400 font-semibold' : 'text-stone-400'
          }`}
        >
          <WalletIcon size={18} />
          <span className="text-[10px] mt-1">Tickets</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (currentUser) {
              setRoute('profile');
            } else {
              setAuthContextMessage(undefined);
              setIsAuthModalOpen(true);
            }
          }}
          className={`flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            route === 'profile' || route === 'auth'
              ? 'text-emerald-400 font-semibold'
              : 'text-stone-400'
          }`}
        >
          <UserIcon size={18} />
          <span className="text-[10px] mt-1">{currentUser ? 'Account' : 'Sign In'}</span>
        </button>
      </nav>

      {/* 2. AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        contextMessage={authContextMessage}
        onSuccess={(user, msg) => {
          setCurrentUser(user);
          addToast('success', msg, 'Welcome');
          triggerRefresh();
        }}
      />

      {/* 3. PER-POOL SOCIAL MEDIA SHARE MODAL */}
      <SocialShareModal
        isOpen={!!poolToShare}
        onClose={() => setPoolToShare(null)}
        pool={poolToShare}
      />

      {/* 4. PAYSTACK CHECKOUT & SERVER VERIFICATION MODAL */}
      {activeTransaction && (
        <PaystackCheckoutModal
          transaction={activeTransaction}
          environment={environment}
          onVerifySuccess={handleVerifySuccess}
          onSimulateWebhookAndVerify={handleSimulateWebhookAndVerify}
          onFailPayment={handleFailPayment}
          onCancelPayment={handleCancelPayment}
        />
      )}

      <OfflineIndicator />
    </div>
  );
}

export default App;
