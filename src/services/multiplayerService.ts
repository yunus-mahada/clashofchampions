import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { QuizRoom, QuizPlayer, generateRoomCode } from '../utils/supabase';

/**
 * Payload definitions for ultra-low latency WebSocket Broadcast events
 */
export interface ScoreUpdatePayload {
  playerId: string;
  playerName: string;
  roomCode: string;
  score: number;
  pointsEarned: number;
  currentQuestion: number;
  isFinished: boolean;
  timestamp: number;
}

export interface AnswerSubmittedPayload {
  playerId: string;
  playerName: string;
  roomCode: string;
  questionIndex: number;
  isCorrect: boolean;
  timestamp: number;
}

export interface GameStartPayload {
  roomCode: string;
  totalQuestions: number;
  durationMinutes: number;
  startedAt: string;
  timestamp: number;
}

export interface CountdownPayload {
  roomCode: string;
  count: number; // 3, 2, 1, 0 (GO)
  timestamp: number;
}

export interface GameFinishPayload {
  roomCode: string;
  reason?: 'time_up' | 'host_ended' | 'all_finished';
  timestamp: number;
}

export interface PlayerPresence {
  playerId: string;
  playerName: string;
  role: 'host' | 'player';
  onlineAt: string;
  currentQuestion?: number;
}

export interface RoomSubscriptionCallbacks {
  onRoomUpdate?: (room: QuizRoom) => void;
  onPlayersUpdate?: (players: QuizPlayer[]) => void;
  onPlayerScoreUpdate?: (event: ScoreUpdatePayload) => void;
  onAnswerSubmitted?: (event: AnswerSubmittedPayload) => void;
  onGameStart?: (event: GameStartPayload) => void;
  onCountdown?: (event: CountdownPayload) => void;
  onGameFinish?: (event: GameFinishPayload) => void;
  onPresenceChange?: (presences: Record<string, PlayerPresence[]>) => void;
  onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void;
}

export interface JoinRoomParams {
  roomCode: string;
  playerId: string;
  playerName: string;
  role: 'host' | 'player';
  callbacks: RoomSubscriptionCallbacks;
}

/**
 * Multiplayer Service
 * Manages room creation, joining via room codes, and real-time score propagation
 * using Supabase Realtime channels (Broadcast + Presence + Postgres Changes).
 */
export class MultiplayerService {
  private activeChannels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribes to a multiplayer room WebSocket channel.
   * Enables host-player synchronization, instant score propagation, and presence.
   */
  public subscribeToRoom({
    roomCode,
    playerId,
    playerName,
    role,
    callbacks,
  }: JoinRoomParams): () => void {
    const channelKey = `quiz_room_${roomCode}`;

    // Clean up existing channel for the same room if present
    this.unsubscribeFromRoom(roomCode);

    const channel = supabase.channel(channelKey, {
      config: {
        broadcast: { self: false },
        presence: { key: playerId },
      },
    });

    // 1. WebSocket Broadcast: Instant Score Propagation
    channel.on(
      'broadcast',
      { event: 'player:score_update' },
      ({ payload }: { payload: ScoreUpdatePayload }) => {
        callbacks.onPlayerScoreUpdate?.(payload);
      }
    );

    // 2. WebSocket Broadcast: Instant Answer Submitted (for speed-ranking alerts)
    channel.on(
      'broadcast',
      { event: 'player:answer_submitted' },
      ({ payload }: { payload: AnswerSubmittedPayload }) => {
        callbacks.onAnswerSubmitted?.(payload);
      }
    );

    // 3. WebSocket Broadcast: Host Synchronized 3-2-1 Countdown
    channel.on(
      'broadcast',
      { event: 'host:countdown' },
      ({ payload }: { payload: CountdownPayload }) => {
        callbacks.onCountdown?.(payload);
      }
    );

    // 4. WebSocket Broadcast: Host Starts Match
    channel.on(
      'broadcast',
      { event: 'host:game_start' },
      ({ payload }: { payload: GameStartPayload }) => {
        callbacks.onGameStart?.(payload);
      }
    );

    // 5. WebSocket Broadcast: Host Finishes Match or Time Expired
    channel.on(
      'broadcast',
      { event: 'host:game_finish' },
      ({ payload }: { payload: GameFinishPayload }) => {
        callbacks.onGameFinish?.(payload);
      }
    );

    // 6. WebSocket Presence: Live online/active presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState<PlayerPresence>();
      callbacks.onPresenceChange?.(presenceState);
    });

    // 7. Postgres Changes: Room mutations (status, time limit, questions)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quiz_rooms',
        filter: `room_code=eq.${roomCode}`,
      },
      (payload) => {
        if (payload.new) {
          callbacks.onRoomUpdate?.(payload.new as QuizRoom);
        }
      }
    );

    // 8. Postgres Changes: Player records mutations (authoritative DB sync)
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quiz_players',
        filter: `room_code=eq.${roomCode}`,
      },
      async () => {
        const { data } = await supabase
          .from('quiz_players')
          .select('*')
          .eq('room_code', roomCode);
        if (data) {
          callbacks.onPlayersUpdate?.(data as QuizPlayer[]);
        }
      }
    );

    // Connect to channel & track initial presence
    channel.subscribe(async (status) => {
      callbacks.onStatusChange?.(status);

      if (status === 'SUBSCRIBED') {
        try {
          await channel.track({
            playerId,
            playerName,
            role,
            onlineAt: new Date().toISOString(),
          });
        } catch {
          // Presence tracking retry handled by supabase
        }
      }
    });

    this.activeChannels.set(roomCode, channel);

    // Initial fetch of room data & player list
    this.fetchRoomDetails(roomCode).then(({ room, players }) => {
      if (room) callbacks.onRoomUpdate?.(room);
      if (players.length > 0) callbacks.onPlayersUpdate?.(players);
    });

    return () => {
      this.unsubscribeFromRoom(roomCode);
    };
  }

  /**
   * Unsubscribes and tears down the WebSocket channel for a room
   */
  public unsubscribeFromRoom(roomCode: string): void {
    const channel = this.activeChannels.get(roomCode);
    if (channel) {
      try {
        channel.untrack();
        supabase.removeChannel(channel);
      } catch {}
      this.activeChannels.delete(roomCode);
    }
  }

  /**
   * Broadcasts a real-time score update across WebSockets to all connected peers
   */
  public async broadcastScoreUpdate(
    roomCode: string,
    payload: Omit<ScoreUpdatePayload, 'timestamp' | 'roomCode'>
  ): Promise<void> {
    const channel = this.activeChannels.get(roomCode);
    const eventPayload: ScoreUpdatePayload = {
      ...payload,
      roomCode,
      timestamp: Date.now(),
    };

    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'player:score_update',
          payload: eventPayload,
        });
      } catch {}
    }
  }

  /**
   * Broadcasts instant answer notification (for speed ranking determination)
   */
  public async broadcastAnswerSubmitted(
    roomCode: string,
    payload: Omit<AnswerSubmittedPayload, 'timestamp' | 'roomCode'>
  ): Promise<void> {
    const channel = this.activeChannels.get(roomCode);
    const eventPayload: AnswerSubmittedPayload = {
      ...payload,
      roomCode,
      timestamp: Date.now(),
    };

    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'player:answer_submitted',
          payload: eventPayload,
        });
      } catch {}
    }
  }

  /**
   * Host broadcasts countdown (e.g. 3, 2, 1, 0) before match begins
   */
  public async broadcastCountdown(roomCode: string, count: number): Promise<void> {
    const channel = this.activeChannels.get(roomCode);
    const eventPayload: CountdownPayload = {
      roomCode,
      count,
      timestamp: Date.now(),
    };

    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'host:countdown',
          payload: eventPayload,
        });
      } catch {}
    }
  }

  /**
   * Host broadcasts game start trigger with synchronized startedAt & durationMinutes
   */
  public async broadcastGameStart(
    roomCode: string,
    totalQuestions: number,
    durationMinutes: number = 20
  ): Promise<void> {
    const startedAt = new Date().toISOString();
    const channel = this.activeChannels.get(roomCode);
    const eventPayload: GameStartPayload = {
      roomCode,
      totalQuestions,
      durationMinutes,
      startedAt,
      timestamp: Date.now(),
    };

    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'host:game_start',
          payload: eventPayload,
        });
      } catch {}
    }

    // Update database status with started_at
    await supabase
      .from('quiz_rooms')
      .update({
        status: 'playing',
        started_at: startedAt,
        duration_minutes: durationMinutes,
      })
      .eq('room_code', roomCode);
  }

  /**
   * Host broadcasts game finish trigger (e.g. when time is up or host clicks end match)
   */
  public async broadcastGameFinish(
    roomCode: string,
    reason: 'time_up' | 'host_ended' | 'all_finished' = 'host_ended'
  ): Promise<void> {
    const channel = this.activeChannels.get(roomCode);
    const eventPayload: GameFinishPayload = {
      roomCode,
      reason,
      timestamp: Date.now(),
    };

    if (channel) {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'host:game_finish',
          payload: eventPayload,
        });
      } catch {}
    }

    // Update database status
    await supabase
      .from('quiz_rooms')
      .update({ status: 'finished' })
      .eq('room_code', roomCode);
  }

  /**
   * Creates a new multiplayer room in Supabase with custom duration (10 - 60 minutes)
   */
  public async createRoom(
    hostId: string,
    options: {
      categories: string[];
      totalQuestions: number;
      durationMinutes: number; // 10, 20, 30, 40, 50, 60 minutes
      questionIds: number[];
    }
  ): Promise<{ room: QuizRoom | null; error: Error | null }> {
    const roomCode = generateRoomCode();

    const roomPayload: QuizRoom = {
      room_code: roomCode,
      host_id: hostId,
      total_questions: options.totalQuestions,
      duration_minutes: options.durationMinutes,
      categories: options.categories,
      status: 'waiting',
      question_ids: options.questionIds,
    };

    try {
      const { data, error } = await supabase
        .from('quiz_rooms')
        .insert([roomPayload])
        .select()
        .single();

      if (error) throw error;
      return { room: data as QuizRoom, error: null };
    } catch (err: any) {
      return { room: null, error: err };
    }
  }

  /**
   * Registers a player joining an existing room via room code
   */
  public async joinRoom(
    roomCode: string,
    playerName: string
  ): Promise<{
    room: QuizRoom | null;
    player: QuizPlayer | null;
    error: string | null;
  }> {
    const formattedCode = roomCode.trim().toUpperCase();
    const cleanName = playerName.trim();

    try {
      // 1. Check room existence & status
      const { data: roomData, error: roomError } = await supabase
        .from('quiz_rooms')
        .select('*')
        .eq('room_code', formattedCode)
        .maybeSingle();

      if (roomError || !roomData) {
        return {
          room: null,
          player: null,
          error: 'Kode room tidak ditemukan. Pastikan Host sudah membuat room!',
        };
      }

      if (roomData.status === 'finished') {
        return {
          room: null,
          player: null,
          error: 'Pertandingan di room ini sudah selesai.',
        };
      }

      // Check if player already exists in this room with this name
      const { data: existingPlayer } = await supabase
        .from('quiz_players')
        .select('*')
        .eq('room_code', formattedCode)
        .eq('player_name', cleanName)
        .maybeSingle();

      if (existingPlayer) {
        return {
          room: roomData as QuizRoom,
          player: existingPlayer as QuizPlayer,
          error: null,
        };
      }

      // 2. Register participant
      const { data: playerData, error: playerError } = await supabase
        .from('quiz_players')
        .insert([
          {
            room_code: formattedCode,
            player_name: cleanName,
            score: 0,
            correct_count: 0,
            wrong_count: 0,
            current_question: 0,
            is_finished: false,
          },
        ])
        .select()
        .single();

      if (playerError || !playerData) {
        return {
          room: null,
          player: null,
          error: 'Gagal bergabung ke room: ' + (playerError?.message || 'Error'),
        };
      }

      return {
        room: roomData as QuizRoom,
        player: playerData as QuizPlayer,
        error: null,
      };
    } catch {
      return {
        room: null,
        player: null,
        error: 'Terjadi kendala koneksi ke server.',
      };
    }
  }

  /**
   * Fetches room details and participant list from Supabase
   */
  public async fetchRoomDetails(roomCode: string): Promise<{
    room: QuizRoom | null;
    players: QuizPlayer[];
  }> {
    try {
      const [roomRes, playersRes] = await Promise.all([
        supabase
          .from('quiz_rooms')
          .select('*')
          .eq('room_code', roomCode)
          .maybeSingle(),
        supabase
          .from('quiz_players')
          .select('*')
          .eq('room_code', roomCode),
      ]);

      return {
        room: (roomRes.data as QuizRoom) || null,
        players: (playersRes.data as QuizPlayer[]) || [],
      };
    } catch {
      return { room: null, players: [] };
    }
  }

  /**
   * Persists player score & progress to database, and triggers real-time broadcast
   */
  public async updatePlayerScoreAndProgress(
    playerId: string,
    roomCode: string,
    data: {
      score: number;
      correctCount: number;
      wrongCount: number;
      currentQuestion: number;
      isFinished?: boolean;
      playerName: string;
      pointsEarned: number;
    }
  ): Promise<void> {
    // 1. Optimistic instant WebSocket broadcast to host and other players
    this.broadcastScoreUpdate(roomCode, {
      playerId,
      playerName: data.playerName,
      score: data.score,
      pointsEarned: data.pointsEarned,
      currentQuestion: data.currentQuestion,
      isFinished: !!data.isFinished,
    });

    // 2. Authoritative persistence in Supabase
    try {
      await supabase
        .from('quiz_players')
        .update({
          score: data.score,
          correct_count: data.correctCount,
          wrong_count: data.wrongCount,
          current_question: data.currentQuestion,
          is_finished: !!data.isFinished,
          finished_at: data.isFinished ? new Date().toISOString() : null,
        })
        .eq('id', playerId);
    } catch {}
  }
}

export const multiplayerService = new MultiplayerService();
