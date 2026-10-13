import React, { useState } from 'react';
import { UserRecord } from '../types/models';
import { firebaseService } from '../services/firebaseService';
import { NYSCLogo } from './NYSCLogo';
import { CloseIcon, UserIcon, LockIcon, ShieldTickIcon, CheckIcon } from './Iconsax';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
  onSuccess: (user: UserRecord, message: string) => void;
  contextMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess,
  contextMessage,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await firebaseService.login(email, password);
        onSuccess(user, `Welcome back, ${user.fullName.split(' ')[0]}.`);
        onClose();
      } else if (mode === 'register') {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter a valid email address.');
        if (!phone.trim()) throw new Error('Please provide your phone number.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const user = await firebaseService.register({
          fullName,
          email,
          phone,
          password,
        });
        onSuccess(
          user,
          `Account created for ${user.fullName}. You can now make your prediction.`
        );
        onClose();
      } else {
        const msg = await firebaseService.sendPasswordReset(email);
        setResetMessage(msg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (userId: string, label: string) => {
    try {
      const user = firebaseService.switchStagingDemoUser(userId);
      onSuccess(user, `Signed in as ${user.fullName} (${label}).`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not activate demo profile.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#141815] border border-[#2B352E] text-white shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#232B25] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NYSCLogo size={34} />
            <div>
              <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-emerald-400">
                NYSC Keffi Camp
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {mode === 'login' && 'Sign In to Continue'}
                {mode === 'register' && 'Create Participant Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#202722] transition-colors cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Context banner if opened during a prediction */}
        {contextMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-[#1B281F] border border-[#2C4A35] text-xs text-emerald-200">
            {contextMessage}
          </div>
        )}

        {/* Tab switch */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-[#1A201C] rounded-xl border border-[#263028]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setResetMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-[#28352C] text-white'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setResetMessage(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'bg-[#28352C] text-white'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-[#2D1616] border border-[#522525] text-xs text-red-200">
              {error}
            </div>
          )}

          {resetMessage && (
            <div className="p-3 rounded-xl bg-[#14281C] border border-[#224E31] text-xs text-emerald-200">
              {resetMessage}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chinedu Okafor"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#1A201C] border border-[#2B352E] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-[#008751]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1A201C] border border-[#2B352E] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-[#008751]"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Nigerian Phone (Paystack Verified)
              </label>
              <input
                type="tel"
                required
                placeholder="0803 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#1A201C] border border-[#2B352E] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-[#008751]"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-stone-300">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1A201C] border border-[#2B352E] rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-hidden focus:border-[#008751]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-xs sm:text-sm bg-[#008751] hover:bg-[#007545] text-white transition-colors cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading
              ? 'Processing...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'register'
              ? 'Create Account'
              : 'Send Reset Link'}
          </button>
        </form>

        {/* Fast Instant Demo Accounts for Testing */}
        <div className="px-6 pb-6 pt-2 border-t border-[#232B25]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-2">
            One-Click Test Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleQuickDemo('user-1', 'Corps Member')}
              className="p-2.5 rounded-xl bg-[#1B221E] hover:bg-[#232D27] border border-[#2D3930] text-[11px] text-stone-200 transition-colors cursor-pointer"
            >
              <span className="font-semibold block text-white truncate">Chinedu</span>
              <span className="text-[10px] text-stone-400">Platoon 4</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('user-2', 'Spectator')}
              className="p-2.5 rounded-xl bg-[#1B221E] hover:bg-[#232D27] border border-[#2D3930] text-[11px] text-stone-200 transition-colors cursor-pointer"
            >
              <span className="font-semibold block text-white truncate">Fatima</span>
              <span className="text-[10px] text-stone-400">Supporter</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin-1', 'Admin')}
              className="p-2.5 rounded-xl bg-[#14281E] hover:bg-[#1B3629] border border-[#214D35] text-[11px] text-emerald-300 transition-colors cursor-pointer"
            >
              <span className="font-semibold block truncate">Captain Bala</span>
              <span className="text-[10px] text-emerald-400 font-mono">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
