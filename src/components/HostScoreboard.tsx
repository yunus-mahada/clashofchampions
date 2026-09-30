import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Check,
  X,
  Clock,
  Radio,
  Flame,
  Volume2,
  VolumeX,
  Wifi,
  Zap,
} from 'lucide-react';
import { BackButton } from './BackButton';
import { QuizRoom, QuizPlayer, supabase } from '../utils/supabase';
import { formatScore } from '../utils/scoring';
import { Question } from '../types/game';
import { particleSystem } from '../game/ParticleSystem';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';
import { useMultiplayerRoom } from '../hooks/useMultiplayerRoom';

interface HostScoreboardProps {
  room: QuizRoom;
  allQuestions: Question[];
  onExit: () => void;
}

export const HostScoreboard: React.FC<HostScoreboardProps> = ({ room, allQuestions, onExit }) => {
  const [isFinished, setIsFinished] = useState(room.status === 'finished');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevLeaderIdRef = useRef<string | null>(null);

  const handleFinishMatch = async () => {
    audioManager.playClick();
    Haptics.click();
    await broadcastGameFinish();
    setIsFinished(true);
    particleSystem.emitCelebrationConfetti();
    audioManager.playGameComplete();
    Haptics.celebrate();
  };

  const {
    players,
    connectionStatus,
    onlineCount,
    recentScoreEvents,
    remainingSeconds,
    broadcastGameFinish,
  } = useMultiplayerRoom({
    roomCode: room.room_code,
    playerId: room.host_id || 'host',
    playerName: 'Host Scoreboard',
    role: 'host',
    initialRoom: room,
    onTimeUp: () => {
      if (!isFinished) {
        handleFinishMatch();
      }
    },
    onGameFinish: () => {
      setIsFinished(true);
      particleSystem.emitCelebrationConfetti();
      audioManager.playGameComplete();
    },
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Sound effect when leaderboard leader changes
  useEffect(() => {
    if (players.length > 0) {
      const topPlayerId = players[0].id;
      if (prevLeaderIdRef.current && prevLeaderIdRef.current !== topPlayerId) {
        if (soundEnabled) audioManager.playCombo(3);
      }
      prevLeaderIdRef.current = topPlayerId;
    }
  }, [players, soundEnabled]);

  const finishedCount = players.filter((p) => p.is_finished).length;
  const allFinished = players.length > 0 && finishedCount === players.length;

  const top3 = players.slice(0, 3);
  const others = players.slice(3);

  const latestScoreEvent = recentScoreEvents[0];

  const roomQuestions = room.question_ids && room.question_ids.length > 0
    ? room.question_ids.map(id => allQuestions.find(q => q.id === id)!).filter(Boolean)
    : allQuestions.slice(0, room.total_questions || 15);

  const [reportQuestionNum, setReportQuestionNum] = useState<number | null>(null);
  const [reportData, setReportData] = useState<{ playerName: string, points: number, order: number }[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  const openReport = async (qId: number, qNum: number) => {
    setReportQuestionNum(qNum);
    setIsLoadingReport(true);
    setReportData([]);
    audioManager.playClick();
    
    try {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('player_id, created_at')
        .eq('room_code', room.room_code)
        .eq('question_id', qId)
        .eq('is_correct', true)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        const totalParticipants = Math.max(players.length, 1);
        const mappedData = data.map((d, index) => {
           const p = players.find(x => x.id === d.player_id);
           const points = Math.max(1, totalParticipants - index);
           return {
             playerName: p ? p.player_name : 'Pemain Anonim',
             points,
             order: index + 1
           };
        });
        setReportData(mappedData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-between p-4 sm:p-6 overflow-y-auto no-scrollbar relative z-10">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <BackButton onClick={onExit} label="Keluar" size="sm" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-750">
            <Radio
              className={`w-3.5 h-3.5 ${
                isFinished ? 'text-amber-400' : 'text-rose-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-200">
              {isFinished ? 'PERTANDINGAN SELESAI' : 'LIVE SCOREBOARD'}
            </span>
          </div>

          <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-black">
            {room.room_code}
          </div>

          {/* Match Countdown Clock */}
          {!isFinished && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-black border transition ${
                remainingSeconds <= 60
                  ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse'
                  : remainingSeconds <= 180
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-750 text-slate-200'
              }`}
              title="Hitungan Mundur Sisa Waktu Pertandingan"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{formatTime(remainingSeconds)}</span>
            </div>
          )}

          {/* WebSocket & Presence Status */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse'
            }`}
            title="Koneksi WebSocket Supabase Realtime"
          >
            <Wifi className="w-3 h-3" />
            <span>{connectionStatus === 'CONNECTED' ? `WebSocket Aktif (${onlineCount || players.length} online)` : 'Menghubungkan...'}</span>
          </div>
        </div>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* Real-time score propagation ticker */}
      <AnimatePresence>
        {latestScoreEvent && !isFinished && (
          <motion.div
            key={latestScoreEvent.timestamp}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="my-1.5 py-1 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-medium text-amber-300 shadow-sm"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />
              <span className="font-bold">{latestScoreEvent.playerName}</span>
              <span className="text-slate-400 text-[11px]">menjawab soal {latestScoreEvent.currentQuestion}:</span>
            </div>
            <span className="font-mono font-black text-emerald-400 shrink-0">
              +{latestScoreEvent.pointsEarned} PT
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overview Stat Ribbon */}
      <div className="flex items-center justify-between my-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-semibold">Status Penyelesaian:</span>
          <span className="font-mono font-bold text-amber-300">
            {finishedCount} / {players.length} Pemain Selesai
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isFinished ? (
            <button
              onClick={handleFinishMatch}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition active:scale-95 shadow-md shadow-amber-500/20"
            >
              {allFinished ? '🏆 TAMPILKAN PODIUM JUARA' : 'Selesaikan Sekarang'}
            </button>
          ) : (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4 stroke-[3]" /> Hasil Final Terkunci
            </span>
          )}
        </div>
      </div>

      {/* Podium for Top 3 (Clash of Champions Style) */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 my-2 items-end">
          {/* Rank 2 (Silver) */}
          {top3[1] ? (
            <motion.div
              layout
              className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-t from-slate-900 via-slate-850 to-slate-800 border-2 border-slate-400/50 text-center shadow-xl"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-300 text-slate-950 font-black text-sm mb-1.5 shadow-md">
                2
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-100 truncate w-full">
                {top3[1].player_name}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-slate-300 mt-1">
                {formatScore(top3[1].score)} <span className="text-xs font-normal text-slate-400">PT</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {top3[1].correct_count} Benar
              </span>
              {top3[1].is_finished && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold mt-1">
                  Selesai ✓
                </span>
              )}
            </motion.div>
          ) : (
            <div />
          )}

          {/* Rank 1 (Gold Champion) */}
          {top3[0] && (
            <motion.div
              layout
              className="flex flex-col items-center p-4 rounded-3xl bg-gradient-to-t from-amber-950/60 via-amber-900/30 to-amber-800/40 border-2 border-amber-400 text-center shadow-2xl scale-105 z-10 relative"
            >
              <Crown className="w-6 h-6 text-amber-400 animate-bounce absolute -top-3" />
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-lg mb-1.5 shadow-lg shadow-amber-500/40">
                1
              </div>
              <span className="text-sm sm:text-base font-black text-amber-200 truncate w-full">
                {top3[0].player_name}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1">
                {formatScore(top3[0].score)} <span className="text-xs font-normal text-amber-400/80">PT</span>
              </span>
              <span className="text-xs text-emerald-400 font-extrabold">
                {top3[0].correct_count} Benar
              </span>
              {top3[0].is_finished ? (
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black mt-1">
                  Selesai Juara! 🏆
                </span>
              ) : (
                <span className="text-[10px] text-amber-300 animate-pulse mt-1">
                  Sedang Menjawab...
                </span>
              )}
            </motion.div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] ? (
            <motion.div
              layout
              className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-t from-slate-900 via-slate-850 to-slate-800 border-2 border-amber-700/50 text-center shadow-xl"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-700 text-white font-black text-sm mb-1.5 shadow-md">
                3
              </div>
              <span className="text-xs sm:text-sm font-black text-slate-100 truncate w-full">
                {top3[2].player_name}
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-amber-400 mt-1">
                {formatScore(top3[2].score)} <span className="text-xs font-normal text-amber-500/80">PT</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                {top3[2].correct_count} Benar
              </span>
              {top3[2].is_finished && (
                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold mt-1">
                  Selesai ✓
                </span>
              )}
            </motion.div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Full Leaderboard List */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 mt-3 pb-6">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Daftar Peringkat Lengkap:
        </span>

        {players.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Menunggu data peserta...
          </div>
        ) : (
          players.map((p, idx) => {
            const progressPct = Math.round(
              (p.current_question / (room.total_questions || 15)) * 100
            );

            return (
              <motion.div
                key={p.id}
                layout
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  idx === 0
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-md'
                    : idx === 1
                    ? 'bg-slate-900/90 border-slate-700'
                    : idx === 2
                    ? 'bg-slate-900/80 border-amber-800/40'
                    : 'bg-slate-900/60 border-slate-800/80'
                }`}
              >
                {/* Left: Rank & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-xl font-mono text-xs font-black shrink-0 ${
                      idx === 0
                        ? 'bg-amber-400 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-slate-100 truncate">
                      {p.player_name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-semibold">
                        {p.correct_count} Benar
                      </span>
                      <span>·</span>
                      <span className="text-rose-400">
                        {p.wrong_count} Salah
                      </span>
                      <span>·</span>
                      <span>
                        Soal {p.current_question}/{room.total_questions || 15}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score & Status */}
                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="text-base font-black font-mono text-amber-300">
                    {formatScore(p.score)} <span className="text-xs font-normal text-slate-400">PT</span>
                  </span>
                  {p.is_finished ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" /> Selesai
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">
                      {progressPct}%
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Per-Question Report Trigger Row */}
      <div className="mt-2 pt-4 border-t border-slate-800 shrink-0">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 block mb-2">
          Laporan Jawaban Per Soal:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
          {roomQuestions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => openReport(q.id, idx + 1)}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900 border border-slate-750 flex flex-col items-center justify-center hover:bg-slate-800 hover:border-emerald-500/50 active:scale-95 transition"
              title={`Lihat Siapa yang Menjawab Soal No. ${idx + 1}`}
            >
              <span className="text-xs font-black text-slate-300">{idx + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportQuestionNum !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-5 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                  Hasil Soal No. {reportQuestionNum}
                </h3>
                <button
                  onClick={() => {
                    audioManager.playClick();
                    setReportQuestionNum(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-2">
                {isLoadingReport ? (
                  <div className="text-center text-slate-500 text-xs py-6 animate-pulse font-medium">
                    Memuat data...
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-6 font-medium">
                    Belum ada yang menjawab benar.
                  </div>
                ) : (
                  reportData.map((d) => (
                    <div key={d.order} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black shrink-0 ${
                          d.order === 1 ? 'bg-amber-400 text-slate-900' :
                          d.order === 2 ? 'bg-slate-300 text-slate-900' :
                          d.order === 3 ? 'bg-amber-700 text-white' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {d.order}
                        </span>
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {d.playerName}
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-400 shrink-0">
                        +{d.points} PT
                      </span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
