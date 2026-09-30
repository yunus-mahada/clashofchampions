import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizRoom, QuizPlayer } from '../utils/supabase';
import {
  multiplayerService,
  ScoreUpdatePayload,
  AnswerSubmittedPayload,
  PlayerPresence,
} from '../services/multiplayerService';

interface UseMultiplayerRoomOptions {
  roomCode: string;
  playerId: string;
  playerName: string;
  role: 'host' | 'player';
  initialRoom?: QuizRoom | null;
  onGameStart?: () => void;
  onGameFinish?: () => void;
  onTimeUp?: () => void;
}

export function useMultiplayerRoom({
  roomCode,
  playerId,
  playerName,
  role,
  initialRoom = null,
  onGameStart,
  onGameFinish,
  onTimeUp,
}: UseMultiplayerRoomOptions) {
  const [room, setRoom] = useState<QuizRoom | null>(initialRoom);
  const [players, setPlayers] = useState<QuizPlayer[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<
    'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'CHANNEL_ERROR'
  >('CONNECTING');
  const [presences, setPresences] = useState<Record<string, PlayerPresence[]>>({});
  const [recentScoreEvents, setRecentScoreEvents] = useState<ScoreUpdatePayload[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);

  const onGameStartRef = useRef(onGameStart);
  onGameStartRef.current = onGameStart;

  const onGameFinishRef = useRef(onGameFinish);
  onGameFinishRef.current = onGameFinish;

  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  // Countdown timer for match duration (in seconds)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return (initialRoom?.duration_minutes || 20) * 60;
  });

  useEffect(() => {
    if (!roomCode) return;

    setConnectionStatus('CONNECTING');

    const unsubscribe = multiplayerService.subscribeToRoom({
      roomCode,
      playerId,
      playerName,
      role,
      callbacks: {
        onRoomUpdate: (updatedRoom) => {
          setRoom(updatedRoom);
          if (updatedRoom.status === 'playing') {
            onGameStartRef.current?.();
          } else if (updatedRoom.status === 'finished') {
            onGameFinishRef.current?.();
          }
        },
        onPlayersUpdate: (updatedPlayers) => {
          const sorted = [...updatedPlayers].sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.correct_count !== a.correct_count) return b.correct_count - a.correct_count;
            if (a.is_finished && b.is_finished && a.finished_at && b.finished_at) {
              return new Date(a.finished_at).getTime() - new Date(b.finished_at).getTime();
            }
            return 0;
          });
          setPlayers(sorted);
        },
        onPlayerScoreUpdate: (payload) => {
          setPlayers((prev) => {
            const index = prev.findIndex((p) => p.id === payload.playerId);
            if (index === -1) return prev;

            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              score: payload.score,
              current_question: payload.currentQuestion,
              is_finished: payload.isFinished,
            };

            return updated.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              return b.correct_count - a.correct_count;
            });
          });

          setRecentScoreEvents((prev) => [payload, ...prev.slice(0, 9)]);
        },
        onCountdown: (payload) => {
          setCountdown(payload.count);
          if (payload.count === 0) {
            setTimeout(() => {
              setCountdown(null);
              onGameStartRef.current?.();
            }, 800);
          }
        },
        onGameStart: (payload) => {
          setRoom((prev) => (prev ? { ...prev, status: 'playing', duration_minutes: payload.durationMinutes, started_at: payload.startedAt } : null));
          setRemainingSeconds((payload.durationMinutes || 20) * 60);
          onGameStartRef.current?.();
        },
        onGameFinish: () => {
          setRoom((prev) => (prev ? { ...prev, status: 'finished' } : null));
          onGameFinishRef.current?.();
        },
        onPresenceChange: (presenceMap) => {
          setPresences(presenceMap);
        },
        onStatusChange: (status) => {
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('CONNECTED');
          } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            setConnectionStatus('CHANNEL_ERROR');
          } else if (status === 'CLOSED') {
            setConnectionStatus('DISCONNECTED');
          }
        },
      },
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, playerId, playerName, role]);

  // Synchronized countdown timer while playing
  useEffect(() => {
    if (!room || room.status !== 'playing') return;

    const calculateRemaining = () => {
      const durationSec = (room.duration_minutes || 20) * 60;
      if (!room.started_at) {
        return durationSec;
      }
      const startTime = new Date(room.started_at).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, durationSec - elapsed);
      return remaining;
    };

    setRemainingSeconds(calculateRemaining());

    const interval = setInterval(() => {
      const rem = calculateRemaining();
      setRemainingSeconds(rem);

      if (rem <= 0) {
        clearInterval(interval);
        onTimeUpRef.current?.();
        if (role === 'host') {
          multiplayerService.broadcastGameFinish(roomCode, 'time_up');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [room?.status, room?.started_at, room?.duration_minutes, role, roomCode]);

  const onlineCount = Object.keys(presences).length;

  /**
   * Triggers a synchronized 3, 2, 1 countdown sequence across all screens
   */
  const triggerCountdownAndStart = useCallback(
    async (totalQuestions: number, durationMinutes: number) => {
      if (!roomCode) return;

      // 3
      setCountdown(3);
      await multiplayerService.broadcastCountdown(roomCode, 3);
      await new Promise((r) => setTimeout(r, 1000));

      // 2
      setCountdown(2);
      await multiplayerService.broadcastCountdown(roomCode, 2);
      await new Promise((r) => setTimeout(r, 1000));

      // 1
      setCountdown(1);
      await multiplayerService.broadcastCountdown(roomCode, 1);
      await new Promise((r) => setTimeout(r, 1000));

      // 0 (GO / MULAI)
      setCountdown(0);
      await multiplayerService.broadcastCountdown(roomCode, 0);

      // Start match in Supabase and broadcast
      await multiplayerService.broadcastGameStart(roomCode, totalQuestions, durationMinutes);

      setTimeout(() => {
        setCountdown(null);
      }, 700);
    },
    [roomCode]
  );

  const broadcastGameFinish = useCallback(
    async (reason: 'time_up' | 'host_ended' | 'all_finished' = 'host_ended') => {
      if (!roomCode) return;
      await multiplayerService.broadcastGameFinish(roomCode, reason);
    },
    [roomCode]
  );

  const sendScoreUpdate = useCallback(
    async (data: {
      score: number;
      correctCount: number;
      wrongCount: number;
      currentQuestion: number;
      isFinished?: boolean;
      pointsEarned: number;
    }) => {
      if (!roomCode || !playerId) return;

      await multiplayerService.updatePlayerScoreAndProgress(playerId, roomCode, {
        ...data,
        playerName,
      });
    },
    [roomCode, playerId, playerName]
  );

  return {
    room,
    players,
    presences,
    onlineCount,
    connectionStatus,
    recentScoreEvents,
    countdown,
    remainingSeconds,
    triggerCountdownAndStart,
    broadcastGameFinish,
    sendScoreUpdate,
  };
}
