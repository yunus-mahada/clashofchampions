import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Smartphone, User, KeyRound, AlertCircle, LogIn, Sparkles } from 'lucide-react';
import { BackButton } from './BackButton';
import { QuizRoom, QuizPlayer } from '../utils/supabase';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';
import { multiplayerService } from '../services/multiplayerService';
import { animals } from '../utils/avatars';

interface PlayerJoinProps {
  onJoinSuccess: (room: QuizRoom, player: QuizPlayer) => void;
  onBack: () => void;
}

export const PlayerJoin: React.FC<PlayerJoinProps> = ({ onJoinSuccess, onBack }) => {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const avatars = animals.slice(0, 16); // Ambil 16 hewan pertama untuk pilihan
  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);

  useEffect(() => {
    const session = localStorage.getItem('mahada_player_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.roomCode && parsed.playerName && parsed.avatar) {
          setRoomCode(parsed.roomCode);
          setPlayerName(parsed.playerName);
          setSelectedAvatar(parsed.avatar);
          // Auto attempt to reconnect
          performJoin(parsed.roomCode, parsed.playerName, parsed.avatar, true);
        }
      } catch (e) {
        localStorage.removeItem('mahada_player_session');
      }
    }
  }, []);

  const performJoin = async (code: string, name: string, avatar: string, isAuto = false) => {
    setIsLoading(true);
    setErrorMessage(null);
    
    if (!isAuto) {
      audioManager.playClick();
      Haptics.click();
    }

    try {
      const fullDisplayName = `${avatar} ${name}`;
      const result = await multiplayerService.joinRoom(code, fullDisplayName);

      if (result.error || !result.room || !result.player) {
        setErrorMessage(result.error || 'Gagal bergabung ke room.');
        setIsLoading(false);
        if (isAuto) {
          localStorage.removeItem('mahada_player_session');
          setErrorMessage('Sesi sebelumnya sudah tidak valid. Silakan masukkan ulang.');
        }
        return;
      }

      if (!isAuto) {
        audioManager.playCorrect();
        Haptics.correct();
      }
      
      localStorage.setItem('mahada_player_session', JSON.stringify({
        roomCode: code,
        playerName: name,
        avatar: avatar
      }));

      onJoinSuccess(result.room, result.player);
    } catch (err: any) {
      setErrorMessage('Koneksi terputus. Pastikan internet aktif dan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formattedCode = roomCode.trim().toUpperCase();
    const cleanName = playerName.trim();

    if (!formattedCode) {
      setErrorMessage('Masukkan kode room terlebih dahulu.');
      return;
    }
    if (!cleanName) {
      setErrorMessage('Masukkan nama peserta kamu.');
      return;
    }

    performJoin(formattedCode, cleanName, selectedAvatar);
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between p-4 sm:p-6 overflow-y-auto no-scrollbar relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <BackButton onClick={onBack} label="Kembali" size="sm" />

        <span className="text-xs font-black uppercase tracking-wider text-emerald-400 font-cinzel">
          GABUNG ARENA
        </span>

        <div className="w-8" />
      </div>

      {/* Main Form Box */}
      <motion.form
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleJoin}
        className="flex flex-col gap-4 my-auto py-2"
      >
        <div className="text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto mb-2 border border-emerald-500/30">
            <Smartphone className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-100 font-cinzel">
            MASUKKAN KODE ROOM
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bergabunglah dengan pertandingan langsung dari smartphone
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Room Code Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Kode Room Undangan:</span>
          </label>
          <input
            type="text"
            placeholder="Contoh: COC-XXXX"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            required
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 border-2 border-slate-750 focus:border-amber-400 text-center font-mono font-black text-lg tracking-widest text-amber-300 placeholder-slate-600 focus:outline-none transition uppercase"
          />
        </div>

        {/* Player Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nama / Nickname Kamu:</span>
          </label>
          <input
            type="text"
            placeholder="Masukkan namamu..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            required
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 border border-slate-750 focus:border-emerald-400 text-sm font-bold text-slate-100 placeholder-slate-600 focus:outline-none transition"
          />
        </div>

        {/* Avatar Picker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300">
            Pilih Ikon Avatar:
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {avatars.map((av) => (
              <button
                key={av}
                type="button"
                onClick={() => setSelectedAvatar(av)}
                className={`py-2 rounded-xl text-lg flex items-center justify-center transition ${
                  selectedAvatar === av
                    ? 'bg-amber-500/20 border-2 border-amber-400 scale-105'
                    : 'bg-slate-900 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-emerald-500/25 active:scale-98 transition disabled:opacity-50 mt-2"
        >
          <LogIn className="w-4 h-4 stroke-[3]" />
          <span>{isLoading ? 'MENGECEK ROOM...' : 'GABUNG PERTANDINGAN'}</span>
        </button>
      </motion.form>
    </div>
  );
};
