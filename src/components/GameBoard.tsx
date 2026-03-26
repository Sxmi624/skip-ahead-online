import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, CardSource, CardTarget } from '@/game/types';
import {
  canPlayCard, playCard, executeAITurn, getTopCard,
  getBuildPileNext, isPileBlockedFor,
} from '@/game/engine';
import GameCard from './GameCard';
import DiscardPile from './DiscardPile';
import { Button } from '@/components/ui/button';
import { UseMultiplayerReturn } from '@/hooks/useMultiplayer';
import { useLanguage } from '@/i18n/LanguageContext';

interface GameBoardProps {
  initialState: GameState;
  onRestart: () => void;
  myPlayerIndex?: 0 | 1;
  isMultiplayer?: boolean;
  multiplayer?: UseMultiplayerReturn;
}

const SPECIAL_VALS = new Set(['BLOCKER','STEAL','SKIP','BOMB','SWAP']);

export default function GameBoard({
  initialState,
  onRestart,
  myPlayerIndex = 0,
  isMultiplayer = false,
  multiplayer,
}: GameBoardProps) {
  const { t } = useLanguage();
  const [state, setState] = useState<GameState>(initialState);
  const [selectedSource, setSelectedSource] = useState<CardSource | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [skipMessage, setSkipMessage] = useState(false);

  const opponentIndex = (1 - myPlayerIndex) as 0 | 1;
  const isMyTurn = state.currentPlayerIndex === myPlayerIndex && !state.winner;
  const me = state.players[myPlayerIndex];
  const opponent = state.players[opponentIndex];
  const isParty = state.gameMode === 'party';

  const selectedCard = selectedSource?.type === 'hand' ? me.hand[selectedSource.index] : null;
  const isStealMode  = selectedCard?.value === 'STEAL';
  const isBombMode   = selectedCard?.value === 'BOMB';
  const isBlockerMode = selectedCard?.value === 'BLOCKER';
  const isInstantMode = selectedCard?.value === 'SKIP' || selectedCard?.value === 'SWAP';

  // ── Multiplayer: receive state ───────────────────────────────────────
  useEffect(() => {
    if (!isMultiplayer || !multiplayer) return;
    multiplayer.setOnStateUpdate((incoming: GameState) => {
      setState(incoming);
      setSelectedSource(null);
    });
    return () => { multiplayer.setOnStateUpdate(null); };
  }, [isMultiplayer, multiplayer]);

  const opponentLeft = isMultiplayer && multiplayer?.status === 'opponent-left';

  // ── AI turn ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isMultiplayer) return;
    if (state.currentPlayerIndex === 1 && !state.winner) {
      setAiThinking(true);
      const timer = setTimeout(() => {
        const newState = executeAITurn(state);
        setState(newState);
        setAiThinking(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.currentPlayerIndex, state.winner, isMultiplayer]);

  // ── Handle skip for human player ─────────────────────────────────────
  useEffect(() => {
    if (state.skipNextTurnFor === myPlayerIndex && !state.winner) {
      setSkipMessage(true);
      const timer = setTimeout(() => {
        setSkipMessage(false);
        setState((s) => {
          const ns = { ...s, skipNextTurnFor: null, currentPlayerIndex: opponentIndex };
          return ns;
        });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [state.skipNextTurnFor, myPlayerIndex, opponentIndex]);

  // ── Move helpers ─────────────────────────────────────────────────────
  const applyMove = useCallback((newState: GameState) => {
    setState(newState);
    setSelectedSource(null);
    if (isMultiplayer && multiplayer) multiplayer.sendState(newState);
  }, [isMultiplayer, multiplayer]);

  const handleSourceClick = useCallback((source: CardSource) => {
    if (!isMyTurn || aiThinking || state.skipNextTurnFor === myPlayerIndex) return;
    setSelectedSource((prev) => {
      if (prev?.type === source.type) {
        if (source.type === 'hand' && prev.type === 'hand' && source.index === prev.index) return null;
        if (source.type === 'discard' && prev.type === 'discard' && source.pileIndex === prev.pileIndex) return null;
        if (source.type === 'stockpile' && prev.type === 'stockpile') return null;
      }
      return source;
    });
  }, [isMyTurn, aiThinking, state.skipNextTurnFor, myPlayerIndex]);

  const handleTargetClick = useCallback((target: CardTarget) => {
    if (!selectedSource || !isMyTurn) return;
    if (canPlayCard(state, myPlayerIndex, selectedSource, target)) {
      applyMove(playCard(state, myPlayerIndex, selectedSource, target));
    } else if (target.type === 'discard' && selectedSource.type === 'hand') {
      applyMove(playCard(state, myPlayerIndex, selectedSource, target));
    }
  }, [selectedSource, isMyTurn, state, myPlayerIndex, applyMove]);

  const handleOpponentDiscardClick = useCallback((pileIndex: number) => {
    if (!(isStealMode || isBombMode) || !selectedSource || !isMyTurn) return;
    const target: CardTarget = { type: 'opponent-discard', pileIndex };
    if (canPlayCard(state, myPlayerIndex, selectedSource, target)) {
      applyMove(playCard(state, myPlayerIndex, selectedSource, target));
    }
  }, [isStealMode, isBombMode, selectedSource, isMyTurn, state, myPlayerIndex, applyMove]);

  const handleActivateInstant = useCallback(() => {
    if (!selectedSource || !isMyTurn) return;
    const target: CardTarget = { type: 'use' };
    if (canPlayCard(state, myPlayerIndex, selectedSource, target)) {
      applyMove(playCard(state, myPlayerIndex, selectedSource, target));
    }
  }, [selectedSource, isMyTurn, state, myPlayerIndex, applyMove]);

  // ── Status text ──────────────────────────────────────────────────────
  const statusText = (() => {
    if (opponentLeft) return `⚠️ ${t.opponentLeft}`;
    if (isStealMode) return t.hintSteal;
    if (isBombMode) return t.hintBomb;
    if (isBlockerMode) return t.hintBlocker;
    if (isInstantMode) return selectedCard?.value === 'SKIP' ? t.hintSkip : t.hintSwap;
    if (isMultiplayer) return isMyTurn ? t.yourTurn : t.waitForOpponent(opponent.name);
    if (aiThinking) return t.aiThinking;
    if (isMyTurn) return t.yourTurn;
    return '';
  })();

  const winnerLabel = state.winner === null ? ''
    : state.winner === myPlayerIndex ? t.youWin
    : t.opponentWins(opponent.name);

  return (
    <div className="min-h-screen flex flex-col p-4 gap-4 max-w-4xl mx-auto">

      {/* ── Overlays ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {state.winner !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-felt-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-muted rounded-2xl p-8 text-center shadow-2xl border border-border">
              <h2 className="font-display text-4xl text-gold mb-4">{winnerLabel}</h2>
              <Button onClick={onRestart} className="bg-primary text-primary-foreground font-display text-lg px-8 py-4">
                {t.playAgain}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opponentLeft && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 bg-felt-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              className="bg-muted rounded-2xl p-8 text-center shadow-2xl border border-border">
              <h2 className="font-display text-3xl text-gold mb-2">{t.connectionLost}</h2>
              <p className="text-muted-foreground mb-6">{t.opponentLeft}</p>
              <Button onClick={onRestart} className="bg-primary text-primary-foreground font-display text-lg px-8 py-4">
                {t.backToMenu}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip message toast */}
      <AnimatePresence>
        {skipMessage && (
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-blue-700 text-white font-display text-lg px-6 py-3 rounded-xl shadow-xl"
          >
            {t.yourTurnSkipped}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="font-display text-2xl text-gold">Stack-Bo</span>
          {isParty && (
            <span className="text-xs bg-purple-700/40 text-purple-300 border border-purple-500/30 rounded-full px-2 py-0.5">
              {t.partyBadge}
            </span>
          )}
          {isMultiplayer && (
            <span className="text-xs bg-gold/20 text-gold border border-gold/30 rounded-full px-2 py-0.5">
              {t.online}
            </span>
          )}
        </div>
        <div className={`text-sm mt-1 transition-colors ${
          isStealMode || isBombMode ? 'text-amber-400 font-display' :
          isBlockerMode ? 'text-red-400 font-display' :
          isInstantMode ? 'text-blue-400 font-display' :
          'text-muted-foreground'
        }`}>
          {statusText}
        </div>

        {/* Instant card activate button */}
        <AnimatePresence>
          {isInstantMode && isMyTurn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="mt-2 flex gap-2 justify-center"
            >
              <Button
                onClick={handleActivateInstant}
                className="bg-blue-600 hover:bg-blue-500 text-white font-display px-6"
              >
                {t.activate}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedSource(null)}
                className="font-display px-4 border-muted-foreground/40"
              >
                {t.cancel}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Opponent area ─────────────────────────────────────────────── */}
      <div className={`bg-muted/30 rounded-xl p-3 border transition-colors ${
        (isStealMode || isBombMode) ? 'border-amber-500/60 shadow-amber-500/20 shadow-lg' : 'border-border/50'
      }`}>
        <div className="text-muted-foreground text-xs font-display mb-2">
          {t.opponentLabel(opponent.name, opponent.stockpile.length)}
        </div>
        <div className="flex gap-2 items-end flex-wrap">

          {/* Opponent stockpile — top card face-up */}
          <div className="relative">
            {opponent.stockpile.length > 0 ? (
              <>
                {opponent.stockpile.length > 1 && (
                  <div className="absolute top-0.5 left-0.5 w-12 h-16 rounded-lg bg-card-back opacity-60" />
                )}
                <div className="relative">
                  <GameCard card={getTopCard(opponent.stockpile)} size="sm" />
                  <div className="absolute -top-2 -right-2 bg-gold text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow">
                    {opponent.stockpile.length}
                  </div>
                </div>
              </>
            ) : <GameCard size="sm" />}
            <span className="text-[9px] text-muted-foreground text-center block mt-1">{t.stock}</span>
          </div>

          {/* Opponent hand (face-down) */}
          <div className="flex gap-1 ml-2">
            {opponent.hand.map((_, i) => <GameCard key={i} faceDown size="sm" />)}
          </div>

          {/* Opponent discard piles */}
          <div className="flex gap-3 ml-auto">
            {opponent.discardPiles.map((pile, i) => {
              const clickable = (isStealMode || isBombMode) && pile.length > 0 && isMyTurn;
              const ringColor = isBombMode ? 'ring-orange-500 shadow-orange-400/40' : 'ring-amber-400 shadow-amber-400/40';
              return (
                <div key={i} className="text-center">
                  <div
                    className={`transition-all rounded-lg ${clickable ? `ring-2 ${ringColor} cursor-pointer scale-110 shadow-lg` : ''}`}
                    onClick={clickable ? () => handleOpponentDiscardClick(i) : undefined}
                  >
                    <DiscardPile pile={pile} size="sm" maxVisible={4} />
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1 block">{pile.length}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Build piles ───────────────────────────────────────────────── */}
      <div className="bg-felt-dark/50 rounded-xl p-4 border border-border/30">
        <div className="text-muted-foreground text-xs font-display mb-2 text-center">{t.buildPiles}</div>
        <div className="flex justify-center gap-4">
          {state.buildPiles.map((pile, i) => {
            const top = getTopCard(pile);
            const next = getBuildPileNext(pile);
            const blockedForMe = isPileBlockedFor(state, myPlayerIndex, i);
            const blockedForOpp = isPileBlockedFor(state, opponentIndex, i);
            return (
              <div key={i} className="text-center">
                <div
                  className="relative"
                  onClick={() => handleTargetClick({ type: 'build', pileIndex: i })}
                >
                  {top ? <GameCard card={top} size="lg" /> : (
                    <GameCard size="lg" onClick={() => handleTargetClick({ type: 'build', pileIndex: i })} />
                  )}
                  {(blockedForMe || blockedForOpp) && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`absolute inset-0 rounded-lg flex items-center justify-center ${
                        blockedForMe ? 'bg-red-900/80 border-2 border-red-500' : 'bg-red-900/40 border-2 border-red-700/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl">🚫</div>
                        <div className={`text-[9px] font-display ${blockedForMe ? 'text-red-300' : 'text-red-400/70'}`}>
                          {blockedForMe ? t.blocked : t.opponentBlocked}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {isBlockerMode && !blockedForMe && next <= 12 && (
                    <div className="absolute inset-0 rounded-lg border-2 border-red-400/60 animate-pulse pointer-events-none" />
                  )}
                </div>
                <span className="text-muted-foreground text-[10px] mt-1 block">
                  {t.needs} {next <= 12 ? next : t.complete}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── My area ───────────────────────────────────────────────────── */}
      <div className="bg-muted/30 rounded-xl p-4 border border-border/50 mt-auto">
        <div className="flex justify-between items-center mb-3">
          <span className="text-foreground font-display text-sm">
            {me.name} {isMultiplayer ? '(Du)' : ''}
          </span>
          <span className="text-gold font-display text-sm">{t.stockLabel} {me.stockpile.length}</span>
        </div>
        <div className="flex gap-3 items-end flex-wrap">

          {/* My stockpile */}
          <div className="cursor-pointer" onClick={() => handleSourceClick({ type: 'stockpile' })}>
            {me.stockpile.length > 0 ? (
              <div className="relative">
                <GameCard card={getTopCard(me.stockpile)} selected={selectedSource?.type === 'stockpile'} size="lg" />
                <div className="absolute -top-2 -right-2 bg-gold text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
                  {me.stockpile.length}
                </div>
              </div>
            ) : <GameCard size="lg" />}
            <span className="text-[10px] text-muted-foreground text-center block mt-1">{t.stock}</span>
          </div>

          {/* My hand */}
          <div className="flex gap-2 ml-4">
            {me.hand.map((card, i) => (
              <GameCard
                key={card.id}
                card={card}
                selected={selectedSource?.type === 'hand' && selectedSource.index === i}
                onClick={() => handleSourceClick({ type: 'hand', index: i })}
                size="lg"
              />
            ))}
          </div>

          {/* My discard piles */}
          <div className="flex gap-3 ml-auto">
            {me.discardPiles.map((pile, i) => {
              const top = getTopCard(pile);
              return (
                <div key={i} className="text-center">
                  <DiscardPile
                    pile={pile} size="lg"
                    selected={selectedSource?.type === 'discard' && selectedSource.pileIndex === i}
                    onClick={() => {
                      if (selectedSource) handleTargetClick({ type: 'discard', pileIndex: i });
                      else if (top) handleSourceClick({ type: 'discard', pileIndex: i });
                    }}
                  />
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {t.discardLabel(i + 1)}
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
