import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, QuizRoom, QuizPlayer } from '../utils/supabase';
import { Question } from '../types/game';
import { QuestionScreen } from './QuestionScreen';
import { CountdownOverlay } from './CountdownOverlay';
import { MultiplayerHUD } from './MultiplayerHUD';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';
import { multiplayerService } from '../services/multiplayerService';
import { useMultiplayerRoom } from '../hooks/useMultiplayerRoom';

interface PlayerLiveGameProps {
  room: QuizRoom;
  player: QuizPlayer;
  allQuestions: Question[];
  onFinish: (finalScore: number, correctCount: number, wrongCount: number) => void;
  onLeave?: () => void;
}

export const PlayerLiveGame: React.FC<PlayerLiveGameProps> = ({
  room,
  player,
  allQuestions,
  onFinish,
  onLeave,
}) => {
  // Filter questions that belong to this room
  const roomQuestions = useMemo(() => {
    if (room.question_ids && room.question_ids.length > 0) {
      return room.question_ids
        .map((id) => allQuestions.find((q) => q.id === id))
        .filter(Boolean) as Question[];
    }
    return allQuestions.slice(0, room.total_questions || 15);
  }, [room, allQuestions]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [answeredIds, setAnsweredIds] = useState<number[]>(() => {
    // Resume previous progress if player reconnects
    try {
      const saved = localStorage.getItem(`room_${room.room_code}_answeredIds`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    if (player.current_question > 0) {
      return allQuestions.slice(0, player.current_question).map(q => q.id);
    }
    return [];
  });
  const [score, setScore] = useState(player.score || 0);
  const [correctCount, setCorrectCount] = useState(player.correct_count || 0);
  const [wrongCount, setWrongCount] = useState(player.wrong_count || 0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [timeUpNotice, setTimeUpNotice] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleTimeUp = useCallback(async () => {
    setTimeUpNotice(true);
    audioManager.playGameComplete();
    Haptics.celebrate();

    await multiplayerService.updatePlayerScoreAndProgress(player.id, room.room_code, {
      score,
      correctCount,
      wrongCount,
      currentQuestion: answeredIds.length + 1,
      playerName: player.player_name,
      pointsEarned: 0,
      isFinished: true,
    });

    setTimeout(() => {
      onFinish(score, correctCount, wrongCount);
    }, 1500);
  }, [player.id, player.player_name, room.room_code, score, correctCount, wrongCount, answeredIds.length, onFinish]);

  const {
    players: livePlayers,
    connectionStatus,
    remainingSeconds,
    countdown,
  } = useMultiplayerRoom({
    roomCode: room.room_code,
    playerId: player.id,
    playerName: player.player_name,
    role: 'player',
    initialRoom: room,
    onTimeUp: handleTimeUp,
    onGameFinish: () => {
      onFinish(score, correctCount, wrongCount);
    },
  });

  // Sync local score with DB if player refreshed and lost local state
  useEffect(() => {
    const liveMe = livePlayers.find(p => p.id === player.id);
    if (liveMe && !isAnswered && !isSyncing) {
      if (liveMe.score > score) setScore(liveMe.score);
      if (liveMe.correct_count > correctCount) setCorrectCount(liveMe.correct_count);
      if (liveMe.wrong_count > wrongCount) setWrongCount(liveMe.wrong_count);
    }
  }, [livePlayers, player.id, isAnswered, isSyncing, score, correctCount, wrongCount]);

  const totalParticipants = livePlayers.length > 0 ? livePlayers.length : 1;
  const currentQ = selectedQuestionId ? roomQuestions.find(q => q.id === selectedQuestionId) : null;
  const total = roomQuestions.length;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswer = async (
    isCorrect: boolean,
    timeTaken: number,
    userAnswer: string | string[]
  ) => {
    let pointsEarned = 0;

    // Suara netral agar peserta tidak tahu apakah jawabannya benar atau salah
    audioManager.playClick();
    Haptics.click();

    // Broadcast instant answer event over WebSocket for speed ranking
    multiplayerService.broadcastAnswerSubmitted(room.room_code, {
      playerId: player.id,
      playerName: player.player_name,
      questionIndex: answeredIds.length,
      isCorrect,
    });

    try {
      // 1. Insert jawaban ke tabel quiz_answers untuk tracking spesifik per soal
      const { data: answerData, error } = await supabase
        .from('quiz_answers')
        .insert([{
          room_code: room.room_code,
          player_id: player.id,
          question_id: currentQ.id,
          is_correct: isCorrect
        }])
        .select()
        .single();

      if (error) throw error;

      if (isCorrect) {
        // 2. Hitung berapa orang yang sudah menjawab BENAR untuk soal INI sebelum pemain ini
        const { count } = await supabase
          .from('quiz_answers')
          .select('*', { count: 'exact', head: true })
          .eq('room_code', room.room_code)
          .eq('question_id', currentQ.id)
          .eq('is_correct', true)
          .lt('created_at', answerData.created_at);

        const currentTotal = Math.max(totalParticipants, 1);
        const alreadyAnsweredCount = count || 0;

        // Base points based on order: 1st gets 10, 2nd gets 9, etc.
        const basePoints = Math.max(1, currentTotal - alreadyAnsweredCount);
        // Fractional speed bonus just to act as tie-breaker for same position
        const speedFraction = Math.max(0, 60 - timeTaken) / 1000; 
        pointsEarned = basePoints + speedFraction;
      }
    } catch {
      if (isCorrect) {
        pointsEarned = Math.max(1, totalParticipants);
      }
    }

    const nextScore = score + pointsEarned;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextWrong = wrongCount + (isCorrect ? 0 : 1);
    const nextQuestionNum = answeredIds.length + 1;
    setAnsweredIds(prev => {
      const updated = currentQ ? [...prev, currentQ.id] : prev;
      localStorage.setItem(`room_${room.room_code}_answeredIds`, JSON.stringify(updated));
      return updated;
    });

    setScore(nextScore);
    setCorrectCount(nextCorrect);
    setWrongCount(nextWrong);
    setIsAnswered(true);
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1200);

    // Instant WebSocket broadcast score propagation + DB persistence
    multiplayerService.updatePlayerScoreAndProgress(player.id, room.room_code, {
      score: nextScore,
      correctCount: nextCorrect,
      wrongCount: nextWrong,
      currentQuestion: nextQuestionNum,
      playerName: player.player_name,
      pointsEarned: Math.floor(pointsEarned),
      isFinished: false,
    });

    // Update local storage session so a refresh doesn't reset score to 0
    const sessionStr = localStorage.getItem('mahada_player_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.player) {
          session.player.score = nextScore;
          session.player.correct_count = nextCorrect;
          session.player.wrong_count = nextWrong;
          session.player.current_question = nextQuestionNum;
          localStorage.setItem('mahada_player_session', JSON.stringify(session));
        }
      } catch (e) {}
    }
  };

  const handleNext = async () => {
    audioManager.playClick();
    Haptics.click();

    if (answeredIds.length >= total) {
      // Selesai seluruh soal dalam room
      audioManager.playGameComplete();
      Haptics.celebrate();

      await multiplayerService.updatePlayerScoreAndProgress(player.id, room.room_code, {
        score,
        correctCount,
        wrongCount,
        currentQuestion: total,
        playerName: player.player_name,
        pointsEarned: 0,
        isFinished: true,
      });

      onFinish(score, correctCount, wrongCount);
      return;
    }

    setIsAnswered(false);
    setSelectedQuestionId(null);
  };

  // --- Grid Selection Screen ---
  if (!currentQ) {
    return (
      <div className="flex-1 w-full flex flex-col overflow-y-auto no-scrollbar relative z-10 pb-10">
        <MultiplayerHUD
          room={room}
          player={player}
          currentIndex={answeredIds.length}
          totalQuestions={total}
          remainingSeconds={remainingSeconds}
          totalParticipants={totalParticipants}
          connectionStatus={connectionStatus}
          isSyncing={isSyncing}
          onExitRequest={onLeave ? () => setShowExitConfirm(true) : undefined}
        />

        <div className="flex-1 px-4 py-6 flex flex-col">
          <div className="mb-5 text-center">
            <h3 className="text-lg font-black text-amber-400 font-cinzel">PILIH SOAL BERIKUTNYA</h3>
            <p className="text-xs text-slate-400 mt-1">Pilih kategori & soal yang ingin dijawab.</p>
          </div>
          
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-w-sm mx-auto w-full">
            {roomQuestions.map((q, idx) => {
              const isAnsweredQ = answeredIds.includes(q.id);
              return (
                <button
                  key={q.id}
                  disabled={isAnsweredQ}
                  onClick={() => {
                    audioManager.playClick();
                    Haptics.click();
                    setSelectedQuestionId(q.id);
                  }}
                  className={`aspect-square rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                    isAnsweredQ
                      ? 'bg-slate-800/50 border-slate-750 text-slate-600 cursor-not-allowed opacity-40'
                      : 'bg-slate-900 border-amber-500/40 hover:bg-slate-800 active:scale-95 shadow-md shadow-amber-500/10'
                  }`}
                >
                  <span className={`text-2xl font-black ${isAnsweredQ ? 'text-slate-600' : 'text-slate-200'}`}>
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col gap-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-xl font-bold">⚠️</div>
              <h3 className="text-base font-black text-slate-100">Keluar dari Pertandingan?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">Jawabanmu yang sudah tersimpan akan tetap terhitung di papan skor Host.</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button type="button" onClick={() => setShowExitConfirm(false)} className="min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold active:scale-95 transition">Tetap Lanjut</button>
                <button type="button" onClick={() => { setShowExitConfirm(false); onLeave?.(); }} className="min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold active:scale-95 transition">Ya, Keluar</button>
              </div>
            </div>
          </div>
        )}
        <CountdownOverlay count={countdown} />
      </div>
    );
  }

  // --- Active Question Screen ---
  return (
    <div className="flex-1 w-full flex flex-col justify-between overflow-y-auto no-scrollbar relative z-10">
      {/* Top Status Bar: Managed via MultiplayerHUD */}
      <MultiplayerHUD
        room={room}
        player={player}
        currentIndex={answeredIds.length}
        totalQuestions={total}
        remainingSeconds={remainingSeconds}
        totalParticipants={totalParticipants}
        connectionStatus={connectionStatus}
        isSyncing={isSyncing}
        onExitRequest={onLeave ? () => setShowExitConfirm(true) : undefined}
      />

      {/* Main Question Challenge Screen dengan blindMode */}
      <QuestionScreen
        question={currentQ}
        combo={0}
        isPaused={showExitConfirm || timeUpNotice}
        isAnswered={isAnswered}
        blindMode={true}
        feedbackData={null}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />

      {/* Time Up Notification Modal */}
      {timeUpNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-amber-500/60 p-6 shadow-2xl flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl font-bold">
              ⏰
            </div>
            <h3 className="text-lg font-black text-slate-100 font-cinzel">
              WAKTU PERTANDINGAN HABIS!
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Batas waktu {room.duration_minutes || 20} menit telah selesai. Membuka hasil pertandingan...
            </p>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-750 p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-base font-black text-slate-100">
              Keluar dari Pertandingan?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Jawabanmu yang sudah tersimpan akan tetap terhitung di papan skor Host.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold active:scale-95 transition"
              >
                Tetap Lanjut
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onLeave?.();
                }}
                className="min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold active:scale-95 transition"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Synchronized 3-2-1 Countdown Overlay */}
      <CountdownOverlay count={countdown} />
    </div>
  );
};

