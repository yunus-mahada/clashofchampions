import React, { useState } from 'react';
import { Download, CheckCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
        <CheckCircle className="w-3.5 h-3.5" />
        <span>Terinstall</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    audioManager.playClick();
    Haptics.click();
    await install();
  };

  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-95 transition-all ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
        }`}
      >
        <Download className="w-4 h-4" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            audioManager.playClick();
            Haptics.click();
            setShowIOSGuide(true);
          }}
          className={`flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 transition-all ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-lg">📲</span> Cara Pasang di iPhone/iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-amber-400">1.</span>
                  <span>Buka website ini menggunakan browser <strong>Safari</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-amber-400">2.</span>
                  <span>Tekan tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) di bawah layar.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 font-bold text-amber-400">3.</span>
                  <span>Gulir ke bawah dan pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</span>
                </li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
