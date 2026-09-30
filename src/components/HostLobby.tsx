import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Check,
  Users,
  Play,
  Settings,
  Sparkles,
  AlertCircle,
  Database,
  Radio,
  Clock,
} from 'lucide-react';
import { BackButton } from './BackButton';
import { CountdownOverlay } from './CountdownOverlay';
import { supabase, generateRoomCode, getOrCreatePlayerId, QuizRoom, QuizPlayer } from '../utils/supabase';
import { Question } from '../types/game';
import { CATEGORIES } from '../data/categories';
import { SqlSetupModal } from './SqlSetupModal';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';
import { multiplayerService } from '../services/multiplayerService';

interface HostLobbyProps {
  allQuestions: Question[];
  onStartScoreboard: (room: QuizRoom) => void;
  onBack: () => void;
}

export const HostLobby: React.FC<HostLobbyProps> = ({
  allQuestions,
  onStartScoreboard,
  onBack,
}) => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [totalQuestions, setTotalQuestions] = useState<number>(15);
  const [durationMinutes, setDurationMinutes] = useState<number>(20);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'alfatihah',
    'shalat',
    'kisah',
    'umum',
  ]);
  const [players, setPlayers] = useState<QuizPlayer[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [roomCreated, setRoomCreated] = useState(false);
  const [activeRoom, setActiveRoom] = useState<QuizRoom | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Initialize room code
  useEffect(() => {
    setRoomCode(generateRoomCode());
  }, []);

  // Subscribe to players joining room via WebSocket service
  useEffect(() => {
    if (!roomCreated || !activeRoom) return;

    const unsubscribe = multiplayerService.subscribeToRoom({
      roomCode: activeRoom.room_code,
      playerId: activeRoom.host_id || 'host',
      playerName: 'Host',
      role: 'host',
      callbacks: {
        onPlayersUpdate: (updatedPlayers) => {
          setPlayers(updatedPlayers);
          audioManager.playClick();
          Haptics.click();
        },
      },
    });

    return () => {
      unsubscribe();
    };
  }, [roomCreated, activeRoom]);

  const handleCreateRoom = async () => {
    setIsCreating(true);
    setErrorMessage(null);
    audioManager.playClick();
    Haptics.click();

    // Select questions matching categories
    const matching = allQuestions.filter((q) => selectedCategories.includes(q.category));
    // Shuffle and pick desired count
    const shuffled = [...matching].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(totalQuestions, shuffled.length));
    const questionIds = chosen.map((q) => q.id);

    const newRoom: QuizRoom = {
      room_code: roomCode,
      host_id: getOrCreatePlayerId(),
      total_questions: chosen.length,
      duration_minutes: durationMinutes,
      categories: selectedCategories,
      status: 'waiting',
      question_ids: questionIds,
    };

    try {
      const { error } = await supabase.from('quiz_rooms').insert([newRoom]);

      if (error) {
        console.error('Supabase room insert error:', error);
        setErrorMessage(
          error.message?.includes('Failed to fetch')
            ? 'Koneksi jaringan terhalang. Sedang mencoba ulang via jalur proxy dev...'
            : `Gagal membuat room di Supabase: ${error.message}. Pastikan Anda sudah menjalankan SQL Setup di Dashboard Supabase!`
        );
        setIsCreating(false);
        return;
      }

      setActiveRoom(newRoom);
      setRoomCreated(true);
      audioManager.playCorrect();
      Haptics.correct();
    } catch (err: any) {
      console.error('Room create exception:', err);
      setErrorMessage(
        err?.message?.includes('Failed to fetch')
          ? 'Koneksi ke Supabase terhalang. Kami telah mengaktifkan jalur proxy, silakan coba klik Buat Room sekali lagi.'
          : 'Koneksi gagal. Pastikan tabel quiz_rooms sudah dibuat di Supabase.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = () => {
    if (!activeRoom) return;
    audioManager.playClick();
    Haptics.click();
    navigator.clipboard.writeText(activeRoom.room_code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    });
  };

  const handleStartGame = async () => {
    if (!activeRoom) return;
    setIsStarting(true);
    audioManager.playClick();
    Haptics.click();

    try {
      const matchDuration = activeRoom.duration_minutes || durationMinutes;

      // 1. Synchronized 3-2-1 Countdown Sequence
      setCountdown(3);
      await multiplayerService.broadcastCountdown(activeRoom.room_code, 3);
      await new Promise((r) => setTimeout(r, 1000));

      setCountdown(2);
      await multiplayerService.broadcastCountdown(activeRoom.room_code, 2);
      await new Promise((r) => setTimeout(r, 1000));

      setCountdown(1);
      await multiplayerService.broadcastCountdown(activeRoom.room_code, 1);
      await new Promise((r) => setTimeout(r, 1000));

      setCountdown(0);
      await multiplayerService.broadcastCountdown(activeRoom.room_code, 0);

      // 2. Broadcast instant game start over WebSocket and update Supabase DB
      await multiplayerService.broadcastGameStart(
        activeRoom.room_code,
        activeRoom.total_questions || 15,
        matchDuration
      );

      audioManager.playCategoryComplete();
      Haptics.celebrate();

      setTimeout(() => {
        setCountdown(null);
        onStartScoreboard({
          ...activeRoom,
          status: 'playing',
          duration_minutes: matchDuration,
          started_at: new Date().toISOString(),
        });
      }, 700);
    } catch (err: any) {
      setErrorMessage('Gagal memulai pertandingan: ' + (err?.message || 'Error'));
      setIsStarting(false);
      setCountdown(null);
    }
  };

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      if (selectedCategories.length <= 1) return; // minimal 1
      setSelectedCategories(selectedCategories.filter((c) => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  return (
    <div className="flex-1 w-full max-w-lg mx-auto flex flex-col justify-between p-4 sm:p-6 overflow-y-auto no-scrollbar relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <BackButton onClick={onBack} label="Kembali" size="sm" />

        <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-cinzel">
          <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
          <span>Host Room Lobby</span>
        </span>

        <button
          onClick={() => setShowSqlModal(true)}
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 text-xs hover:text-white"
          title="Petunjuk Setup SQL Supabase"
        >
          <Database className="w-4 h-4" />
        </button>
      </div>

      {errorMessage && (
        <div className="my-2 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{errorMessage}</p>
            <button
              onClick={() => setShowSqlModal(true)}
              className="mt-1 text-[11px] underline font-bold text-amber-300"
            >
              Klik di sini untuk melihat & menyalin Skrip SQL Supabase
            </button>
          </div>
        </div>
      )}

      {/* Before Room is Created: Config Screen */}
      {!roomCreated ? (
        <div className="flex flex-col gap-4 my-auto py-2">
          <div className="text-center">
            <h2 className="text-xl font-black text-slate-100 font-cinzel">
              ATUR PERTANDINGAN
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sesuaikan jumlah soal dan topik sebelum membuka room
            </p>
          </div>

          {/* Question Count selector */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">
              Jumlah Soal yang Dimainkan:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 30, 60].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalQuestions(num)}
                  className={`py-2 rounded-xl text-xs font-black transition ${
                    totalQuestions === num
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {num} Soal
                </button>
              ))}
            </div>
          </div>

          {/* Match Duration Selector (10, 20, 30, 40, 50, 60 minutes) */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Batas Waktu Pertandingan:</span>
              </label>
              <span className="text-[11px] font-bold text-amber-300 font-mono">
                {durationMinutes} Menit
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[10, 20, 30, 40, 50, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`py-2 rounded-xl text-xs font-black transition ${
                    durationMinutes === mins
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400">
              Pertandingan akan otomatis selesai saat waktu habis ({durationMinutes} menit).
            </span>
          </div>

          {/* Categories Selector */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-300">
              Kategori yang Diikutsertakan:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                      isSelected
                        ? 'bg-slate-800 border-amber-400/60 text-slate-100 shadow-sm'
                        : 'bg-slate-950 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="truncate">{cat.name.replace('Bedah Surat ', '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateRoom}
            disabled={isCreating}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-amber-500/20 active:scale-98 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>{isCreating ? 'Membuka Room...' : 'BUAT ROOM & DAPATKAN KODE'}</span>
          </button>
        </div>
      ) : (
        /* After Room is Created: Waiting Lobby for Host */
        <div className="flex flex-col gap-4 my-auto py-2">
          {/* Room Code Card */}
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-600/10 to-slate-900 border-2 border-amber-400/60 p-5 shadow-2xl flex flex-col items-center text-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
              KODE ROOM PERTANDINGAN
            </span>

            <div className="flex items-center gap-3 bg-slate-950/80 px-6 py-2.5 rounded-2xl border border-amber-400/40">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-amber-300">
                {activeRoom?.room_code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition active:scale-95 shadow-md"
                title="Salin Kode Room"
              >
                {copiedCode ? <Check className="w-5 h-5 stroke-[3]" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-amber-300/90 font-semibold">
              <span className="flex items-center gap-1">
                <span>📝</span> {activeRoom?.total_questions || totalQuestions} Soal
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {activeRoom?.duration_minutes || durationMinutes} Menit
              </span>
            </div>

            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Minta peserta membuka aplikasi di HP masing-masing, klik <strong>"Gabung Room"</strong>, dan masukkan kode di atas.
            </p>
          </div>

          {/* Joined Players List */}
          <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">
                  Peserta yang Bergabung:
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                {players.length} Pemain
              </span>
            </div>

            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <div className="w-8 h-8 rounded-full border-2 border-amber-400/40 border-t-amber-400 animate-spin mb-2" />
                <span className="text-xs">Menunggu peserta bergabung...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                {players.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-200 truncate">
                      {p.player_name}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Big Start Button */}
          <button
            onClick={handleStartGame}
            disabled={isStarting || players.length === 0}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-xl shadow-emerald-500/25 active:scale-98 transition disabled:opacity-40 disabled:pointer-events-none"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>
              {players.length === 0
                ? 'MENUNGGU PESERTA...'
                : isStarting
                ? 'MEMULAI...'
                : `MULAI GAME DENGAN ${players.length} PEMAIN!`}
            </span>
          </button>
        </div>
      )}

      {/* Synchronized 3-2-1 Countdown Overlay */}
      <CountdownOverlay count={countdown} />

      <SqlSetupModal isOpen={showSqlModal} onClose={() => setShowSqlModal(false)} />
    </div>
  );
};
