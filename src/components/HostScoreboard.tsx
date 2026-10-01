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
import { getAvatar } from '../utils/avatars';

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
  const [reportData, setReportData] = useState<{ playerName: string, points: number, order: number, isCorrect: boolean }[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [answeredCounts, setAnsweredCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    const fetchAnswerCounts = async () => {
      if (!room.room_code) return;
      try {
        const { data, error } = await supabase
          .from('quiz_answers')
          .select('question_id, player_id')
          .eq('room_code', room.room_code);
          
        if (!error && data) {
          const counts: Record<number, Set<string>> = {};
          data.forEach((d: any) => {
            if (!counts[d.question_id]) {
              counts[d.question_id] = new Set();
            }
            counts[d.question_id].add(d.player_id);
          });
          
          const finalCounts: Record<number, number> = {};
          Object.keys(counts).forEach(k => {
            finalCounts[Number(k)] = counts[Number(k)].size;
          });
          setAnsweredCounts(finalCounts);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchAnswerCounts();
  }, [room.room_code, recentScoreEvents]);

  const openReport = async (qId: number, qNum: number) => {
    setReportQuestionNum(qNum);
    setIsLoadingReport(true);
    setReportData([]);
    audioManager.playClick();
    
    try {
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('player_id, created_at, is_correct')
        .eq('room_code', room.room_code)
        .eq('question_id', qId)
        .order('created_at', { ascending: true });
        
      if (!error && data) {
        const totalParticipants = Math.max(players.length, 1);
        let correctOrder = 1;
        const mappedData = data.map((d, index) => {
           const p = players.find(x => x.id === d.player_id);
           let points = 0;
           let order = 0;
           if (d.is_correct) {
             points = Math.max(1, totalParticipants - (correctOrder - 1));
             order = correctOrder;
             correctOrder++;
           }
           return {
             playerName: p ? p.player_name : 'Pemain Anonim',
             points,
             order,
             isCorrect: d.is_correct
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
    <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col p-4 sm:p-5 overflow-hidden relative z-10">
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

      {/* Main Content: 2 Columns on Large Screens */}
      <div className="flex flex-col lg:flex-row gap-5 mt-3 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: LEADERBOARD TOP 1-10 */}
        <div className="w-full lg:w-2/5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
              Top 10 Pohon Leaderboard:
            </span>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center pt-3 pb-8 relative w-full">
            {/* Background Pine Tree Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 via-emerald-950/5 to-transparent pointer-events-none rounded-t-[100px] w-full" />
            
            {players.length > 0 ? (
              <div className="flex flex-col items-center justify-start gap-3 w-full relative z-10">
                
                {/* Level 1: Rank 1 */}
                <div className="flex items-center justify-center w-full">
                  {players[0] && (
                    <motion.div
                      layout
                      key={players[0].id}
                      className="flex flex-col items-center justify-center p-2 rounded-[1.25rem] border-2 shadow-lg relative w-24 h-24 bg-gradient-to-t from-amber-950/80 via-amber-900/40 to-amber-800/50 border-amber-400"
                    >
                      <Crown className="w-6 h-6 text-amber-400 animate-bounce absolute -top-4" />
                      <div className="absolute -top-2 -right-2 flex items-center justify-center rounded-full font-black shadow-md w-7 h-7 bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 text-xs shadow-amber-500/40">1</div>
                      <div className="text-4xl mb-1 leading-none filter drop-shadow-md">{getAvatar(players[0].player_name || players[0].id)}</div>
                      <span className="font-black truncate w-full text-center text-[11px] text-amber-200 tracking-wide">{players[0].player_name}</span>
                      <span className="font-black font-mono mt-auto text-[10px] text-amber-300 bg-black/30 px-2 py-0.5 rounded-full">{formatScore(players[0].score)}</span>
                    </motion.div>
                  )}
                </div>
                
                {/* Level 2: Rank 2, 3 */}
                {(players[1] || players[2]) && (
                  <div className="flex items-center justify-center gap-5 w-full mt-1">
                    {players[1] && (
                      <motion.div layout key={players[1].id} className="flex flex-col items-center justify-center p-1.5 rounded-2xl border-2 shadow-md relative w-20 h-20 bg-gradient-to-t from-slate-900 via-slate-850 to-slate-800 border-slate-300/60">
                        <div className="absolute -top-2 -left-2 flex items-center justify-center rounded-full font-black shadow-md w-5 h-5 bg-slate-200 text-slate-900 text-[10px]">2</div>
                        <div className="text-3xl mb-1 leading-none">{getAvatar(players[1].player_name || players[1].id)}</div>
                        <span className="font-black truncate w-full text-center text-[10px] text-slate-100">{players[1].player_name}</span>
                        <span className="font-black font-mono mt-auto text-[9px] text-slate-300">{formatScore(players[1].score)}</span>
                      </motion.div>
                    )}
                    {players[2] && (
                      <motion.div layout key={players[2].id} className="flex flex-col items-center justify-center p-1.5 rounded-2xl border-2 shadow-md relative w-20 h-20 bg-gradient-to-t from-slate-900 via-slate-850 to-slate-800 border-amber-700/60">
                        <div className="absolute -top-2 -right-2 flex items-center justify-center rounded-full font-black shadow-md w-5 h-5 bg-amber-600 text-white text-[10px]">3</div>
                        <div className="text-3xl mb-1 leading-none">{getAvatar(players[2].player_name || players[2].id)}</div>
                        <span className="font-black truncate w-full text-center text-[10px] text-slate-100">{players[2].player_name}</span>
                        <span className="font-black font-mono mt-auto text-[9px] text-amber-600/90">{formatScore(players[2].score)}</span>
                      </motion.div>
                    )}
                  </div>
                )}
                
                {/* Level 3: Rank 4, 5, 6 */}
                {(players[3] || players[4] || players[5]) && (
                  <div className="flex items-center justify-center gap-3 w-full mt-1">
                    {[3, 4, 5].map(idx => {
                      const p = players[idx];
                      if (!p) return null;
                      return (
                        <motion.div layout key={p.id} className="flex flex-col items-center justify-center p-1.5 rounded-xl border border-slate-700/80 shadow-sm relative w-[4.25rem] h-[4.25rem] bg-slate-800/80">
                          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full font-bold shadow-sm w-4 h-4 bg-slate-700 text-slate-300 text-[8px]">{idx + 1}</div>
                          <div className="text-2xl mb-1 leading-none">{getAvatar(p.player_name || p.id)}</div>
                          <span className="font-bold truncate w-full text-center text-[9px] text-slate-300">{p.player_name}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                
                {/* Level 4: Rank 7, 8, 9, 10 */}
                {(players[6] || players[7] || players[8] || players[9]) && (
                  <div className="flex items-center justify-center gap-2 w-full mt-1">
                    {[6, 7, 8, 9].map(idx => {
                      const p = players[idx];
                      if (!p) return null;
                      return (
                        <motion.div layout key={p.id} className="flex flex-col items-center justify-center p-1 rounded-xl border border-slate-800/80 relative w-[3.75rem] h-[3.75rem] bg-slate-900/90">
                          <div className="absolute -top-1 -right-1 flex items-center justify-center rounded-full font-bold w-3.5 h-3.5 bg-slate-800 text-slate-400 text-[7px]">{idx + 1}</div>
                          <div className="text-xl mb-0.5 leading-none">{getAvatar(p.player_name || p.id)}</div>
                          <span className="font-medium truncate w-full text-center text-[8px] text-slate-400">{p.player_name}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

              </div>
            ) : (
               <div className="p-8 text-center text-slate-500 text-xs relative z-10">Menunggu data peserta...</div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL TABLE & ACTIONS */}
        <div className="w-full lg:w-3/5 flex flex-col min-h-0 gap-3">
          
          {/* Overview Stat Ribbon */}
          <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] shrink-0">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-semibold">Selesai:</span>
              <span className="font-mono font-bold text-amber-300">
                {finishedCount} / {players.length} Pemain
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isFinished ? (
                <button
                  onClick={handleFinishMatch}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition active:scale-95 shadow-md shadow-amber-500/20"
                >
                  {allFinished ? '🏆 PODIUM JUARA' : 'Selesaikan Sekarang'}
                </button>
              ) : (
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" /> Hasil Terkunci
                </span>
              )}
            </div>
          </div>

          {/* Table: Perolehan Detail */}
          <div className="flex-1 flex flex-col bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden min-h-0">
            <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              <div className="w-1/3 truncate px-1">Nama Peserta</div>
              <div className="w-2/3 flex items-center justify-between px-1">
                <div className="w-1/4 text-center">Benar</div>
                <div className="w-1/4 text-center">Salah</div>
                <div className="w-1/4 text-center">Sisa</div>
                <div className="w-1/4 text-right">Total PT</div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1.5">
              {players.map((p) => {
                 const answered = p.correct_count + p.wrong_count;
                 const remaining = (room.total_questions || 15) - answered;
                 return (
                   <div key={p.id} className="flex items-center p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs hover:bg-slate-800/80 transition-colors">
                     <div className="w-1/3 font-semibold text-slate-200 truncate px-1 flex items-center gap-1.5" title={p.player_name}>
                       <span className="text-sm leading-none shrink-0">{getAvatar(p.player_name || p.id)}</span>
                       <span className="truncate">{p.player_name}</span>
                     </div>
                     <div className="w-2/3 flex items-center justify-between px-1">
                       <div className="w-1/4 text-center font-bold text-emerald-400">{p.correct_count}</div>
                       <div className="w-1/4 text-center font-bold text-rose-400">{p.wrong_count}</div>
                       <div className="w-1/4 text-center font-bold text-slate-300">{remaining}</div>
                       <div className="w-1/4 text-right font-bold font-mono text-amber-400 truncate">
                         {formatScore(p.score)}
                       </div>
                     </div>
                   </div>
                 );
              })}
              {players.length === 0 && (
                <div className="text-center text-slate-500 text-xs py-8">Belum ada peserta</div>
              )}
            </div>
          </div>

          {/* Per-Question Report Trigger Row */}
          <div className="pt-2 border-t border-slate-800 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 block mb-1.5">
              Laporan Jawaban Per Soal:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 px-1">
              {roomQuestions.map((q, idx) => {
                const isAllAnswered = players.length > 0 && answeredCounts[q.id] >= players.length;
                return (
                  <button
                    key={q.id}
                    onClick={() => openReport(q.id, idx + 1)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg border flex flex-col items-center justify-center active:scale-95 transition ${
                      isAllAnswered 
                        ? 'bg-amber-400 border-amber-300 shadow-md shadow-amber-500/20' 
                        : 'bg-slate-900 border-slate-750 hover:bg-slate-800 hover:border-emerald-500/50'
                    }`}
                    title={`Lihat Siapa yang Menjawab Soal No. ${idx + 1}`}
                  >
                    <span className={`text-[10px] font-black ${isAllAnswered ? 'text-slate-900' : 'text-slate-300'}`}>{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
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
                    Belum ada yang menjawab soal ini.
                  </div>
                ) : (
                  reportData.map((d, i) => (
                    <div key={i} className={`flex items-center justify-between p-2.5 rounded-xl border ${d.isCorrect ? 'bg-slate-800/50 border-slate-700/50' : 'bg-rose-950/20 border-rose-900/30'}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        {d.isCorrect ? (
                          <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black shrink-0 ${
                            d.order === 1 ? 'bg-amber-400 text-slate-900' :
                            d.order === 2 ? 'bg-slate-300 text-slate-900' :
                            d.order === 3 ? 'bg-amber-700 text-white' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {d.order}
                          </span>
                        ) : (
                          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-rose-500/20 text-rose-500 shrink-0">
                            <X className="w-4 h-4" />
                          </span>
                        )}
                        <span className="text-sm leading-none shrink-0 ml-1">
                          {getAvatar(d.playerName)}
                        </span>
                        <span className={`text-xs font-bold truncate ${d.isCorrect ? 'text-slate-200' : 'text-rose-400/80'}`}>
                          {d.playerName}
                        </span>
                      </div>
                      <span className={`text-xs font-black font-mono shrink-0 ${d.isCorrect ? 'text-emerald-400' : 'text-rose-500'}`}>
                        {d.isCorrect ? `+${d.points} PT` : '0 PT'}
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
