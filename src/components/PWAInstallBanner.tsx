import React, { useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (isInstallable) {
            install();
          } else {
            setShowModal(true);
          }
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 text-[#0B3B24]" />
        <span>Install App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Install App</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-stone-500 hover:text-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {isIOS
                ? 'Tap Share in your Safari toolbar, then select Add to Home Screen.'
                : 'Tap your browser menu and choose Install App or Add to Home Screen.'}
            </p>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B3B24] text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-800 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline mode active. Viewing cached data.</span>
    </div>
  );
};
