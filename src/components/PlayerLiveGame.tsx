import React, { useState, useMemo, useEffect, useCallback } from 'react';
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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
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
      currentQuestion: currentIndex + 1,
      playerName: player.player_name,
      pointsEarned: 0,
      isFinished: true,
    });

    setTimeout(() => {
      onFinish(score, correctCount, wrongCount);
    }, 1500);
  }, [player.id, player.player_name, room.room_code, score, correctCount, wrongCount, currentIndex, onFinish]);

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

  const totalParticipants = livePlayers.length > 0 ? livePlayers.length : 1;
  const currentQ = roomQuestions[currentIndex];
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
      questionIndex: currentIndex,
      isCorrect,
    });

    if (isCorrect) {
      // Perhitungan skor adu cepat & benar
      try {
        const { data: currentPlayers } = await supabase
          .from('quiz_players')
          .select('id, current_question, correct_count')
          .eq('room_code', room.room_code);

        const currentTotal = Math.max(currentPlayers?.length || 1, totalParticipants, 1);

        const alreadyAnsweredCount = currentPlayers
          ? currentPlayers.filter(
              (p) => p.id !== player.id && p.current_question >= currentIndex + 1
            ).length
          : 0;

        pointsEarned = Math.max(1, currentTotal - alreadyAnsweredCount);
      } catch {
        pointsEarned = Math.max(1, totalParticipants);
      }
    } else {
      pointsEarned = 0;
    }

    const nextScore = score + pointsEarned;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextWrong = wrongCount + (isCorrect ? 0 : 1);
    const nextQuestionNum = currentIndex + 1;

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
      pointsEarned,
      isFinished: false,
    });
  };

  const handleNext = async () => {
    audioManager.playClick();
    Haptics.click();

    if (currentIndex + 1 >= total) {
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
    setCurrentIndex((prev) => prev + 1);
  };

  if (!currentQ) return null;

  return (
    <div className="flex-1 w-full flex flex-col justify-between overflow-hidden relative z-10">
      {/* Top Status Bar: Managed via MultiplayerHUD */}
      <MultiplayerHUD
        room={room}
        player={player}
        currentIndex={currentIndex}
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

