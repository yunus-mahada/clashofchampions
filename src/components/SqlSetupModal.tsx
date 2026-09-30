import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Database, ExternalLink } from 'lucide-react';
import { SUPABASE_SETUP_SQL } from '../utils/supabase';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface SqlSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlSetupModal: React.FC<SqlSetupModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    audioManager.playClick();
    Haptics.click();
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-750 p-5 sm:p-6 shadow-2xl flex flex-col gap-3.5 text-left max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Setup Tabel Supabase Realtime
                </h3>
                <span className="text-[10px] text-slate-400">
                  Jalankan 1x di Supabase SQL Editor
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                audioManager.playClick();
                Haptics.click();
                onClose();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-2 shrink-0">
            <p>
              Agar fitur <strong>Room & Realtime Scoreboard</strong> berjalan, pastikan Anda telah menjalankan skrip SQL berikut di Dashboard Supabase:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
              <li>Buka dashboard project Supabase Anda.</li>
              <li>Pilih menu <strong>SQL Editor</strong> di sidebar kiri.</li>
              <li>Salin skrip di bawah ini, tempel (*paste*), lalu klik tombol <strong>Run</strong>.</li>
            </ol>
          </div>

          {/* Code block */}
          <div className="relative flex-1 overflow-hidden rounded-2xl bg-slate-950 border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800 text-[11px] text-slate-400 font-mono">
              <span>setup_quiz_realtime.sql</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition text-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>
            </div>
            <pre className="flex-1 p-3 text-[10px] font-mono text-emerald-300 overflow-y-auto no-scrollbar whitespace-pre-wrap select-all leading-relaxed">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>

          <div className="flex items-center gap-2 pt-1 shrink-0">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs active:scale-98 transition shadow-lg shadow-emerald-500/20"
            >
              <Copy className="w-4 h-4" />
              <span>{copied ? 'Berhasil Tersalin!' : 'Salin Seluruh Skrip SQL'}</span>
            </button>
            <button
              onClick={() => {
                audioManager.playClick();
                onClose();
              }}
              className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-750 active:scale-98"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
