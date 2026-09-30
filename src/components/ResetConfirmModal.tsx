import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { formatScore } from '../utils/scoring';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface ResetConfirmModalProps {
  isOpen: boolean;
  answeredCount: number;
  currentScore: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  answeredCount,
  currentScore,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col items-center text-center gap-4"
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-100 uppercase tracking-wide">
              Hapus Seluruh Progress?
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Progress <strong className="text-amber-300">{answeredCount}/60 soal</strong> dan skor{' '}
              <strong className="text-amber-300">{formatScore(currentScore)}</strong> akan dihapus dan direset kembali ke awal.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={() => {
                audioManager.playClick();
                Haptics.click();
                onCancel();
              }}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs font-bold active:scale-95 transition"
            >
              BATAL
            </button>
            <button
              onClick={() => {
                audioManager.playClick();
                Haptics.click();
                onConfirm();
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 active:scale-95 transition"
            >
              RESET
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
