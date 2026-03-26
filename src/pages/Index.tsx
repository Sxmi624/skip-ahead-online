import { useState, useCallback, useEffect } from 'react';
import GameSetup from '@/components/GameSetup';
import GameBoard from '@/components/GameBoard';
import OnlineSetup from '@/components/OnlineSetup';
import { initGame } from '@/game/engine';
import { GameState, GameMode, PartyConfig, DEFAULT_PARTY_CONFIG } from '@/game/types';
import { useMultiplayer } from '@/hooks/useMultiplayer';

type AppMode = 'menu' | 'local' | 'online-setup' | 'online-playing';

const Index = () => {
  const [mode, setMode] = useState<AppMode>('menu');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerIndex, setMyPlayerIndex] = useState<0 | 1>(0);
  const [gameMode, setGameMode] = useState<GameMode>('standard');
  const [partyConfig, setPartyConfig] = useState<PartyConfig>(DEFAULT_PARTY_CONFIG);
  const multiplayer = useMultiplayer();

  // Called when both online players are connected
  const handleOnlineGameStart = useCallback((
    stockpileSize: number,
    pIdx: 0 | 1,
    oppName: string,
  ) => {
    setMyPlayerIndex(pIdx);

    if (pIdx === 0) {
      const state = initGame(stockpileSize, gameMode, partyConfig);
      state.players[0].isAI = false;
      state.players[1].isAI = false;
      state.players[1].name = oppName;
      setGameState(state);
      multiplayer.sendState(state);
    }

    setMode('online-playing');
  }, [multiplayer, gameMode, partyConfig]);

  // Guest receives state updates from host
  useEffect(() => {
    if (mode === 'online-playing') {
      multiplayer.setOnStateUpdate((incoming: GameState) => {
        setGameState(incoming);
      });
    }
    return () => { multiplayer.setOnStateUpdate(null); };
  }, [mode, multiplayer]);

  const handleStartLocal = (stockpileSize: number, selectedMode: GameMode, cfg: PartyConfig) => {
    setMyPlayerIndex(0);
    setGameMode(selectedMode);
    setPartyConfig(cfg);
    setGameState(initGame(stockpileSize, selectedMode, cfg));
    setMode('local');
  };

  const handleRestart = () => {
    multiplayer.disconnect();
    setGameState(null);
    setMode('menu');
  };

  if (mode === 'menu') {
    return (
      <GameSetup
        onStart={handleStartLocal}
        onPlayOnline={() => setMode('online-setup')}
      />
    );
  }

  if (mode === 'online-setup') {
    return (
      <OnlineSetup
        multiplayer={multiplayer}
        onGameStart={handleOnlineGameStart}
        onBack={() => setMode('menu')}
      />
    );
  }

  if (mode === 'local' && gameState) {
    return (
      <GameBoard
        initialState={gameState}
        onRestart={handleRestart}
        myPlayerIndex={0}
        isMultiplayer={false}
      />
    );
  }

  if (mode === 'online-playing') {
    if (!gameState) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="font-display text-3xl text-gold mb-4">Stack-Bo</div>
            <div className="text-muted-foreground">⏳ Warte auf Spielstart…</div>
          </div>
        </div>
      );
    }
    return (
      <GameBoard
        initialState={gameState}
        onRestart={handleRestart}
        myPlayerIndex={myPlayerIndex}
        isMultiplayer={true}
        multiplayer={multiplayer}
      />
    );
  }

  return null;
};

export default Index;
