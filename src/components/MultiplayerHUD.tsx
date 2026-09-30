import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Users,
  Wifi,
  Lock,
  Radio,
  Flame,
  CheckCircle2,
  AlertCircle,
  EyeOff,
} from 'lucide-react';
import { BackButton } from './BackButton';
import { QuizRoom, QuizPlayer } from '../utils/supabase';

export interface MultiplayerHUDProps {
  room: QuizRoom;
  player: QuizPlayer;
  currentIndex: number;
  totalQuestions: number;
  remainingSeconds: number;
  totalParticipants: number;
  connectionStatus: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'CHANNEL_ERROR' | 'SYNC';
  isSyncing?: boolean; // flashes when answer/score is propagated to Supabase
  onExitRequest?: () => void;
}

export const MultiplayerHUD: React.FC<MultiplayerHUDProps> = ({
  room,
  player,
  currentIndex,
  totalQuestions,
  remainingSeconds,
  totalParticipants,
  connectionStatus,
  isSyncing = false,
  onExitRequest,
}) => {
  const [showBlindInfo, setShowBlindInfo] = useState(false);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.round(((currentIndex + 1) / Math.max(1, totalQuestions)) * 100));
  const isUrgent = remainingSeconds <= 180 && remainingSeconds > 60;
  const isCritical = remainingSeconds <= 60;

  return (
    <div className="w-full flex flex-col bg-slate-900/95 border-b border-slate-800 backdrop-blur-md sticky top-0 z-30 select-none shadow-md">
      {/* Top Primary Bar */}
      <div className="w-full flex items-center justify-between px-3 sm:px-4 py-2">
        {/* Left Side: Exit button, Room Code, Question Counter */}
        <div className="flex items-center gap-2">
          {onExitRequest && (
            <BackButton
              onClick={onExitRequest}
              label=""
              size="sm"
              ariaLabel="Keluar dari pertandingan arena"
            />
          )}

          {/* Room Code Badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
            <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
            <span>{room.room_code}</span>
          </div>

          {/* Question Number Tracker */}
          <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
            <span>Soal</span>
            <span className="text-amber-400 font-mono">{currentIndex + 1}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400 font-mono">{totalQuestions}</span>
          </div>
        </div>

        {/* Center: Live Countdown Timer (Synchronized from started_at) */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-black border transition-all ${
            isCritical
              ? 'bg-rose-500/25 border-rose-500/70 text-rose-300 shadow-lg shadow-rose-500/30 animate-pulse scale-105'
              : isUrgent
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              : 'bg-slate-800/90 border-slate-700/80 text-slate-100'
          }`}
          title="Sisa Waktu Pertandingan"
        >
          {isCritical ? (
            <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span>{formatTime(remainingSeconds)}</span>
        </div>

        {/* Right Side: Blind Mode Indicator, Participants, WebSocket Live badge */}
        <div className="flex items-center gap-2">
          {/* Blind Arena Badge (Clash of Champions Rule: Scores Hidden from Player) */}
          <button
            type="button"
            onClick={() => setShowBlindInfo(!showBlindInfo)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-semibold text-slate-300 hover:text-amber-300 transition"
            title="Sistem Skor Rahasia (Blind Arena): Skor dan peringkat dirahasiakan dari pemain dan hanya ditampilkan di Layar Utama Host"
          >
            <EyeOff className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">Skor Rahasia</span>
          </button>

          {/* Sync indicator pulse */}
          <AnimatePresence>
            {isSyncing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Tersinkron</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Participant count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">{totalParticipants}</span>
          </div>

          {/* WebSocket Connection Indicator */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
            }`}
            title="Status Realtime WebSocket Supabase"
          >
            <Wifi className="w-3 h-3" />
            <span className="hidden sm:inline">
              {connectionStatus === 'CONNECTED' ? 'Live' : 'Sync'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Ribbon */}
      <div className="w-full bg-slate-800/60 h-1 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ ease: 'easeOut', duration: 0.3 }}
        />
      </div>

      {/* Blind Mode Informative Banner (dismissible) */}
      <AnimatePresence>
        {showBlindInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 shadow-inner"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Blind Arena Match:</strong> Skor dan posisi klasemen dirahasiakan di HP kamu untuk menjaga ketegangan. Skor kamu langsung masuk ke <strong>Layar Host</strong> secara real-time.
              </span>
            </div>
            <button
              onClick={() => setShowBlindInfo(false)}
              className="text-[11px] text-amber-400 font-bold hover:underline shrink-0 ml-2"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
