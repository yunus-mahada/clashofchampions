import React from 'react';
import { motion } from 'motion/react';
import { Radio, Users, Wifi, Clock } from 'lucide-react';
import { QuizRoom, QuizPlayer } from '../utils/supabase';
import { BackButton } from './BackButton';
import { CountdownOverlay } from './CountdownOverlay';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';
import { useMultiplayerRoom } from '../hooks/useMultiplayerRoom';

interface PlayerLobbyProps {
  room: QuizRoom;
  player: QuizPlayer;
  onGameStart: () => void;
  onLeave: () => void;
}

export const PlayerLobby: React.FC<PlayerLobbyProps> = ({
  room,
  player,
  onGameStart,
  onLeave,
}) => {
  const { players: realtimePlayers, connectionStatus, countdown } = useMultiplayerRoom({
    roomCode: room.room_code,
    playerId: player.id,
    playerName: player.player_name,
    role: 'player',
    initialRoom: room,
    onGameStart: () => {
      audioManager.playCategoryComplete();
      Haptics.celebrate();
      onGameStart();
    },
  });

  const participants = realtimePlayers.length > 0 ? realtimePlayers : [player];

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between p-4 sm:p-6 overflow-y-auto no-scrollbar relative z-10">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <BackButton onClick={onLeave} label="Keluar" size="sm" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold font-mono text-amber-300">
              {room.room_code}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
            }`}
          >
            <Wifi className="w-3 h-3" />
            <span>{connectionStatus === 'CONNECTED' ? 'Live' : 'Sync'}</span>
          </div>
        </div>
      </div>

      {/* Hero Waiting Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center text-center my-auto py-4"
      >
        {/* Animated Radar Pulse */}
        <div className="relative flex items-center justify-center w-28 h-28 my-3">
          <div className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping opacity-30" />
          <div className="absolute inset-3 rounded-full border border-emerald-400/40 animate-pulse" />
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border-2 border-amber-400 text-3xl shadow-xl shadow-amber-500/20">
            ⏳
          </div>
        </div>

        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 mt-2">
          LOBBY PESERTA
        </span>
        <h2 className="text-xl sm:text-2xl font-black text-slate-100 font-cinzel mt-0.5">
          MENUNGGU HOST MEMULAI
        </h2>
        <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
          Pertandingan akan otomatis dimulai dengan hitungan mundur begitu Host menekan Mulai.
        </p>

        {/* Room configuration info badge */}
        <div className="flex items-center gap-3 mt-3 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-semibold text-slate-300">
          <span>📝 {room.total_questions || 15} Soal</span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Durasi: {room.duration_minutes || 20} Menit
          </span>
        </div>

        {/* You as participant card */}
        <div className="mt-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center gap-2.5 shadow-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-semibold text-slate-400">Kamu:</span>
          <span className="text-xs font-black text-emerald-300 truncate">
            {player.player_name}
          </span>
        </div>
      </motion.div>



      {/* Synchronized 3-2-1 Countdown Overlay */}
      <CountdownOverlay count={countdown} />
    </div>
  );
};
