import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState } from '@/game/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export type MultiplayerStatus =
  | 'idle'
  | 'connecting'
  | 'waiting'        // Room created, waiting for opponent
  | 'playing'
  | 'opponent-left'
  | 'error';

export interface GameStartData {
  playerIndex: 0 | 1;
  opponentName: string;
  stockpileSize: number;
}

export interface UseMultiplayerReturn {
  status: MultiplayerStatus;
  inviteCode: string | null;
  playerIndex: 0 | 1 | null;
  opponentName: string | null;
  joinError: string | null;
  createRoom: (stockpileSize: number, playerName: string) => void;
  joinRoom: (code: string, playerName: string) => void;
  sendState: (gameState: GameState) => void;
  setOnStateUpdate: (cb: ((state: GameState) => void) | null) => void;
  setOnGameStart: (cb: ((data: GameStartData) => void) | null) => void;
  disconnect: () => void;
}

export function useMultiplayer(): UseMultiplayerReturn {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<MultiplayerStatus>('idle');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [playerIndex, setPlayerIndex] = useState<0 | 1 | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const stateUpdateCbRef = useRef<((state: GameState) => void) | null>(null);
  const gameStartCbRef = useRef<((data: GameStartData) => void) | null>(null);

  const getOrCreateSocket = useCallback((): Socket => {
    if (socketRef.current?.connected) return socketRef.current;

    const socket = io(SERVER_URL, { autoConnect: false });
    socketRef.current = socket;

    socket.on('room-created', ({ code }: { code: string; playerIndex: 0 | 1 }) => {
      setInviteCode(code);
      setStatus('waiting');
    });

    socket.on('game-start', (data: GameStartData) => {
      setStatus('playing');
      setPlayerIndex(data.playerIndex);
      setOpponentName(data.opponentName);
      gameStartCbRef.current?.(data);
    });

    socket.on('state-update', ({ gameState }: { gameState: GameState }) => {
      stateUpdateCbRef.current?.(gameState);
    });

    socket.on('join-error', ({ message }: { message: string }) => {
      setJoinError(message);
      setStatus('error');
    });

    socket.on('opponent-left', () => {
      setStatus('opponent-left');
    });

    socket.on('disconnect', () => {
      if (status === 'playing') {
        setStatus('opponent-left');
      }
    });

    socket.connect();
    return socket;
  }, []);

  const createRoom = useCallback((stockpileSize: number, playerName: string) => {
    setStatus('connecting');
    setJoinError(null);
    const socket = getOrCreateSocket();
    socket.emit('create-game', { stockpileSize, playerName });
  }, [getOrCreateSocket]);

  const joinRoom = useCallback((code: string, playerName: string) => {
    setStatus('connecting');
    setJoinError(null);
    const socket = getOrCreateSocket();
    socket.emit('join-game', { code: code.trim().toUpperCase(), playerName });
  }, [getOrCreateSocket]);

  const sendState = useCallback((gameState: GameState) => {
    socketRef.current?.emit('send-state', { gameState });
  }, []);

  const setOnStateUpdate = useCallback((cb: ((state: GameState) => void) | null) => {
    stateUpdateCbRef.current = cb;
  }, []);

  const setOnGameStart = useCallback((cb: ((data: GameStartData) => void) | null) => {
    gameStartCbRef.current = cb;
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus('idle');
    setInviteCode(null);
    setPlayerIndex(null);
    setOpponentName(null);
    setJoinError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return {
    status,
    inviteCode,
    playerIndex,
    opponentName,
    joinError,
    createRoom,
    joinRoom,
    sendState,
    setOnStateUpdate,
    setOnGameStart,
    disconnect,
  };
}
