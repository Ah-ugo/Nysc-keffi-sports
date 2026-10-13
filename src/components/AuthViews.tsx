import React, { useState } from 'react';
import { AppEnvironment, UserRecord } from '../types/models';
import { firebaseService } from '../services/firebaseService';
import { NYSCLogo } from './NYSCLogo';
import {
  UserIcon,
  ShieldTickIcon,
  LogoutIcon,
  CheckIcon,
  CloseIcon,
  LockIcon,
} from './Iconsax';

interface AuthViewProps {
  mode: 'login' | 'register' | 'forgot';
  environment: AppEnvironment;
  onModeChange: (mode: 'login' | 'register' | 'forgot') => void;
  onAuthSuccess: (user: UserRecord, message: string) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode,
  environment,
  onModeChange,
  onAuthSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const user = await firebaseService.login(email, password);
        onAuthSuccess(user, `Welcome back, ${user.fullName.split(' ')[0]}.`);
      } else if (mode === 'register') {
        const user = await firebaseService.register({
          fullName,
          email,
          phone,
          password,
        });
        onAuthSuccess(
          user,
          `Account created for ${user.fullName}. You can now participate in open competitions.`
        );
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

  const handleQuickAccount = (userId: string) => {
    try {
      const user = firebaseService.switchStagingDemoUser(userId);
      onAuthSuccess(user, `Signed in as ${user.fullName}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not switch account.');
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 text-white">
      <div className="rounded-2xl bg-[#161B18] border border-[#27322A] p-6 sm:p-8 shadow-xl">
        <div className="mb-6 space-y-1">
          <NYSCLogo size={32} />
          <h1 className="text-xl font-bold text-white tracking-tight pt-2">
            {mode === 'login' && 'Sign In'}
            {mode === 'register' && 'Create Participant Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-xs text-stone-400">
            {mode === 'register'
              ? 'Participation is open to all Nigerians.'
              : mode === 'login'
              ? 'View your competition predictions or enter open pools.'
              : 'Enter your email to receive password reset link.'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-[#121614] rounded-xl border border-[#242C26] mb-5">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setResetMessage(null);
              onModeChange('login');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'login'
                ? 'bg-[#263129] text-white'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setResetMessage(null);
              onModeChange('register');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'register'
                ? 'bg-[#263129] text-white'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setResetMessage(null);
              onModeChange('forgot');
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'forgot'
                ? 'bg-[#263129] text-white'
                : 'text-stone-400 hover:text-white'
            }`}
          >
            Reset
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-[#2E1515] border border-[#522525] p-3 text-xs text-red-200">
            {error}
          </div>
        )}

        {resetMessage && (
          <div className="mb-4 rounded-xl bg-[#14281C] border border-[#224E31] p-3 text-xs text-emerald-200">
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Prince Ugochukwu Ahuekwe"
                className="w-full h-10 px-3.5 rounded-xl bg-[#121614] border border-[#27322A] text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#008751]"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.ng"
              className="w-full h-10 px-3.5 rounded-xl bg-[#121614] border border-[#27322A] text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#008751]"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Nigerian Phone Number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0803 123 4567"
                className="w-full h-10 px-3.5 rounded-xl bg-[#121614] border border-[#27322A] text-xs sm:text-sm text-white font-mono focus:outline-hidden focus:border-[#008751]"
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3.5 rounded-xl bg-[#121614] border border-[#27322A] text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#008751]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#008751] text-white font-semibold text-xs sm:text-sm hover:bg-[#007545] transition-colors disabled:opacity-60 cursor-pointer mt-1"
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'register'
              ? 'Create Account'
              : 'Send Password Reset Link'}
          </button>
        </form>

        {/* Quick Demo Login */}
        <div className="mt-5 pt-4 border-t border-[#232B25]">
          <p className="text-[10px] font-mono uppercase text-stone-400 mb-2">
            One-Click Test Login:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickAccount('user-1')}
              className="p-2.5 rounded-xl bg-[#1C231F] hover:bg-[#252E29] border border-[#27342B] text-left cursor-pointer"
            >
              <span className="font-semibold block text-white truncate">Chinedu</span>
              <span className="text-[10px] text-stone-400">Corps Member</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickAccount('admin-1')}
              className="p-2.5 rounded-xl bg-[#17261D] hover:bg-[#1E3327] border border-[#234532] text-left cursor-pointer"
            >
              <span className="font-semibold block text-emerald-300 truncate">Captain Bala</span>
              <span className="text-[10px] text-emerald-400 font-mono">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProfileViewProps {
  user: UserRecord;
  environment: AppEnvironment;
  onUserUpdated: (user: UserRecord, message: string) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUserUpdated,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const updated = await firebaseService.updateProfile(user.id, {
        fullName,
        phone,
      });
      onUserUpdated(updated, 'Profile details updated.');
      setMsg('Profile successfully saved.');
    } catch {
      setMsg('Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 text-white space-y-6">
      <div className="rounded-2xl bg-[#161B18] border border-[#27322A] p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#232B25]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1E2520] border border-[#2A352D] flex items-center justify-center font-bold text-white text-base">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{user.fullName}</h1>
              <p className="text-xs text-stone-400 font-mono">Role: {user.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#261818] hover:bg-[#341F1F] text-xs font-semibold text-red-300 border border-[#482424] cursor-pointer"
          >
            <LogoutIcon size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-[#14281C] border border-[#224E31] text-xs text-emerald-200">
            {msg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#121614] border border-[#27322A] text-xs sm:text-sm text-white focus:outline-hidden focus:border-[#008751]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Email (Account Identity)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full h-10 px-3.5 rounded-xl bg-[#121614] border border-[#222824] text-xs sm:text-sm text-stone-400 cursor-not-allowed opacity-80"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl bg-[#121614] border border-[#27322A] text-xs sm:text-sm text-white font-mono focus:outline-hidden focus:border-[#008751]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-[#008751] hover:bg-[#007545] text-white font-semibold text-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};
