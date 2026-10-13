import React, { useState } from 'react';
import { CompetitionRecord, PredictionRecord } from '../types/models';
import { NYSCLogo } from './NYSCLogo';
import { CloseIcon, CopyIcon, CheckIcon, ShareIcon } from './Iconsax';

export interface PoolShareContent {
  competition: CompetitionRecord;
  prediction?: PredictionRecord;
}

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pool: PoolShareContent | null;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  pool,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !pool) return null;

  const comp = pool.competition;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const poolUrl = `${baseUrl}?pool=${comp.id}`;

  const shareTitle = `${comp.name} — Keffi Camp Charity Lottery`;
  const shareMessage = `Predict the winner for ${comp.name} at NYSC Keffi Camp! Entry: ₦${comp.entryFee.toLocaleString()} | Prize Pool: ₦${comp.prizeConfiguration.totalPrizeAmount.toLocaleString()}${
    pool.prediction ? `\nMy Pick: ${pool.prediction.selectedOption}` : ''
  }\n100% of proceeds support Keffi community development.\nJoin here: ${poolUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(poolUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(
      `🏆 *${comp.name}*\n\n` +
      `Predict the winning platoon at NYSC Orientation Camp, Keffi!\n` +
      `• Entry Fee: ₦${comp.entryFee.toLocaleString()}\n` +
      `• Total Prize Pool: ₦${comp.prizeConfiguration.totalPrizeAmount.toLocaleString()}\n` +
      (pool.prediction ? `• My Selection: *${pool.prediction.selectedOption}*\n` : '') +
      `\nSupport Keffi host community development:\n${poolUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(
      `Predict the winner of ${comp.name} at NYSC Keffi Orientation Camp! Entry: ₦${comp.entryFee.toLocaleString()} | Prize: ₦${comp.prizeConfiguration.totalPrizeAmount.toLocaleString()}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(poolUrl)}&hashtags=NYSCLottery,KeffiCamp`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const shareTelegram = () => {
    const text = encodeURIComponent(
      `${comp.name} — NYSC Keffi Camp Charity Prediction Pool`
    );
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(poolUrl)}&text=${text}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;
  const handleNativeShare = async () => {
    if (hasNativeShare) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareMessage,
          url: poolUrl,
        });
        onClose();
      } catch {
        // Dismissed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#161A17] border border-[#2B352E] text-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#242C26] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NYSCLogo size={32} />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                Share Competition Pool
              </span>
              <h2 className="text-base font-bold text-white tracking-tight">
                {comp.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-[#222823] transition-colors cursor-pointer"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Pool Summary Box (Solid surface, no gradients) */}
        <div className="p-5 space-y-4">
          <div className="rounded-xl bg-[#1D231F] border border-[#28322B] p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-stone-400">
              <span>Category</span>
              <span className="font-semibold text-white">{comp.category}</span>
            </div>
            <div className="flex items-center justify-between text-stone-400">
              <span>Entry Ticket</span>
              <span className="font-mono font-bold text-white">₦{comp.entryFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-stone-400">
              <span>Prize Pool</span>
              <span className="font-mono font-bold text-emerald-400">₦{comp.prizeConfiguration.totalPrizeAmount.toLocaleString()}</span>
            </div>
            {pool.prediction && (
              <div className="pt-2 border-t border-[#262E29] flex items-center justify-between font-semibold">
                <span className="text-stone-300">Your Selection</span>
                <span className="text-emerald-300 bg-[#14291E] px-2 py-0.5 rounded border border-[#234A35]">
                  {pool.prediction.selectedOption}
                </span>
              </div>
            )}
          </div>

          {/* Social Buttons (Solid Clean Surfaces) */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#1E2520] hover:bg-[#242D27] border border-[#2D3830] text-white transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center font-bold text-xs">
                WA
              </div>
              <span className="text-xs font-medium">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={shareTwitter}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#1E2520] hover:bg-[#242D27] border border-[#2D3830] text-white transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-black border border-stone-700 text-white flex items-center justify-center font-bold text-xs">
                X
              </div>
              <span className="text-xs font-medium">X / Twitter</span>
            </button>

            <button
              type="button"
              onClick={shareTelegram}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#1E2520] hover:bg-[#242D27] border border-[#2D3830] text-white transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#229ED9] text-white flex items-center justify-center font-bold text-xs">
                TG
              </div>
              <span className="text-xs font-medium">Telegram</span>
            </button>
          </div>

          {/* Native Device Share */}
          {hasNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#008751] hover:bg-[#007545] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <ShareIcon size={16} />
              <span>Share via Device Sheet</span>
            </button>
          )}

          {/* Copy Direct Pool Link */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[#121614] border border-[#28322B]">
            <input
              type="text"
              readOnly
              value={poolUrl}
              className="flex-1 bg-transparent text-xs text-stone-300 px-2 font-mono outline-hidden select-all truncate"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#263028] hover:bg-[#303D33] text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <CheckIcon size={14} className="text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <CopyIcon size={14} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
