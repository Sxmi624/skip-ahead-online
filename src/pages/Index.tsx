import { useState } from 'react';
import GameSetup from '@/components/GameSetup';
import GameBoard from '@/components/GameBoard';
import { initGame } from '@/game/engine';
import { GameState } from '@/game/types';

const Index = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  const handleStart = (stockpileSize: number) => {
    setGameState(initGame(stockpileSize));
  };

  const handleRestart = () => {
    setGameState(null);
  };

  if (!gameState) {
    return <GameSetup onStart={handleStart} />;
  }

  return <GameBoard initialState={gameState} onRestart={handleRestart} />;
};

export default Index;
