import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, CardSource, CardTarget } from '@/game/types';
import { canPlayCard, playCard, executeAITurn, getTopCard, getBuildPileNext } from '@/game/engine';
import GameCard from './GameCard';
import { Button } from '@/components/ui/button';

interface GameBoardProps {
  initialState: GameState;
  onRestart: () => void;
}

export default function GameBoard({ initialState, onRestart }: GameBoardProps) {
  const [state, setState] = useState<GameState>(initialState);
  const [selectedSource, setSelectedSource] = useState<CardSource | null>(null);
  const [aiThinking, setAiThinking] = useState(false);

  const isMyTurn = state.currentPlayerIndex === 0 && state.winner === null;
  const me = state.players[0];
  const opponent = state.players[1];

  const handleSourceClick = useCallback((source: CardSource) => {
    if (!isMyTurn || aiThinking) return;
    setSelectedSource((prev) => {
      if (prev && prev.type === source.type) {
        if (source.type === 'hand' && prev.type === 'hand' && source.index === prev.index) return null;
        if (source.type === 'discard' && prev.type === 'discard' && source.pileIndex === prev.pileIndex) return null;
        if (source.type === 'stockpile' && prev.type === 'stockpile') return null;
      }
      return source;
    });
  }, [isMyTurn, aiThinking]);

  const handleTargetClick = useCallback((target: CardTarget) => {
    if (!selectedSource || !isMyTurn) return;
    if (canPlayCard(state, 0, selectedSource, target)) {
      const newState = playCard(state, 0, selectedSource, target);
      setState(newState);
      setSelectedSource(null);
    } else if (target.type === 'discard' && selectedSource.type === 'hand') {
      // Discard to end turn
      const newState = playCard(state, 0, selectedSource, target);
      setState(newState);
      setSelectedSource(null);
    }
  }, [selectedSource, isMyTurn, state]);

  // AI turn
  useEffect(() => {
    if (state.currentPlayerIndex === 1 && state.winner === null) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const newState = executeAITurn(state);
        setState(newState);
        setAiThinking(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayerIndex, state.winner]);

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-4xl mx-auto">
      {/* Winner overlay */}
      <AnimatePresence>
        {state.winner !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-felt-dark/80 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="bg-muted rounded-2xl p-8 text-center shadow-2xl border border-border"
            >
              <h2 className="font-display text-4xl text-gold mb-4">
                {state.winner === 0 ? '🎉 You Win!' : '😞 Computer Wins'}
              </h2>
              <Button onClick={onRestart} className="bg-primary text-primary-foreground font-display text-lg px-8 py-4">
                Play Again
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status bar */}
      <div className="text-center">
        <span className="font-display text-2xl text-gold">Stack-Bo</span>
        <div className="text-muted-foreground text-sm mt-1">
          {aiThinking ? '💭 Computer is thinking...' : isMyTurn ? 'Your turn — select a card, then a target' : ''}
        </div>
      </div>

      {/* Opponent area */}
      <div className="bg-muted/30 rounded-xl p-3 border border-border/50">
        <div className="text-muted-foreground text-xs font-display mb-2">Computer • Stock: {opponent.stockpile.length}</div>
        <div className="flex gap-2 items-end flex-wrap">
          <GameCard faceDown count={opponent.stockpile.length} size="sm" />
          <div className="flex gap-1 ml-2">
            {opponent.hand.map((_, i) => (
              <GameCard key={i} faceDown size="sm" />
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {opponent.discardPiles.map((pile, i) => (
              <div key={i} className="relative">
                {pile.length > 0 ? (
                  <GameCard card={getTopCard(pile)} size="sm" />
                ) : (
                  <GameCard size="sm" />
                )}
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground">{pile.length}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Build piles (center) */}
      <div className="bg-felt-dark/50 rounded-xl p-4 border border-border/30">
        <div className="text-muted-foreground text-xs font-display mb-2 text-center">Building Piles</div>
        <div className="flex justify-center gap-4">
          {state.buildPiles.map((pile, i) => {
            const top = getTopCard(pile);
            const next = getBuildPileNext(pile);
            return (
              <div key={i} className="text-center">
                <div onClick={() => handleTargetClick({ type: 'build', pileIndex: i })}>
                  {top ? (
                    <GameCard card={top} size="lg" />
                  ) : (
                    <GameCard size="lg" onClick={() => handleTargetClick({ type: 'build', pileIndex: i })} />
                  )}
                </div>
                <span className="text-muted-foreground text-[10px] mt-1 block">
                  needs {next <= 12 ? next : '✓'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player area */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mt-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground font-display text-sm">Your Cards</span>
          <span className="text-gold font-display text-sm">Stock: {me.stockpile.length}</span>
        </div>

        <div className="flex gap-3 items-end flex-wrap">
          {/* Stockpile */}
          <div
            className="cursor-pointer"
            onClick={() => handleSourceClick({ type: 'stockpile' })}
          >
            {me.stockpile.length > 0 ? (
              <div className="relative">
                <GameCard
                  card={getTopCard(me.stockpile)}
                  selected={selectedSource?.type === 'stockpile'}
                  size="lg"
                />
                <div className="absolute -top-2 -right-2 bg-gold text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
                  {me.stockpile.length}
                </div>
              </div>
            ) : (
              <GameCard size="lg" />
            )}
            <span className="text-[10px] text-muted-foreground text-center block mt-1">stock</span>
          </div>

          {/* Hand */}
          <div className="flex gap-2 ml-4">
            {me.hand.map((card, i) => (
              <div key={card.id}>
                <GameCard
                  card={card}
                  selected={selectedSource?.type === 'hand' && selectedSource.index === i}
                  onClick={() => handleSourceClick({ type: 'hand', index: i })}
                  size="lg"
                />
              </div>
            ))}
          </div>

          {/* Discard piles */}
          <div className="flex gap-2 ml-auto">
            {me.discardPiles.map((pile, i) => {
              const top = getTopCard(pile);
              return (
                <div key={i} className="text-center">
                  <div
                    onClick={() => {
                      if (selectedSource) {
                        handleTargetClick({ type: 'discard', pileIndex: i });
                      } else if (top) {
                        handleSourceClick({ type: 'discard', pileIndex: i });
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <GameCard
                      card={top}
                      selected={selectedSource?.type === 'discard' && selectedSource.pileIndex === i}
                      size="lg"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    discard {pile.length}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
