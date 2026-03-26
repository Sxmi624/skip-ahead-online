import {
  Card, CardValue, CardSource, CardTarget,
  GameState, Player, GameMode, BlockedPile,
  PartyConfig, DEFAULT_PARTY_CONFIG,
} from './types';

let cardIdCounter = 0;

function createCard(value: CardValue): Card {
  return { id: `card-${cardIdCounter++}`, value };
}

function createDeck(mode: GameMode, stockpileSize: number, partyConfig: PartyConfig): Card[] {
  const cards: Card[] = [];
  for (let set = 0; set < 12; set++) {
    for (let v = 1; v <= 12; v++) cards.push(createCard(v as CardValue));
  }
  for (let j = 0; j < 18; j++) cards.push(createCard('JOKER'));

  if (mode === 'party') {
    const big = stockpileSize > 20;
    if (partyConfig.blockerEnabled) {
      const n = big ? 8 : 4;
      for (let i = 0; i < n; i++) cards.push(createCard('BLOCKER'));
    }
    if (partyConfig.stealEnabled) {
      const n = big ? 6 : 4;
      for (let i = 0; i < n; i++) cards.push(createCard('STEAL'));
    }
    if (partyConfig.skipEnabled) {
      const n = big ? 4 : 3;
      for (let i = 0; i < n; i++) cards.push(createCard('SKIP'));
    }
    if (partyConfig.bombEnabled) {
      const n = big ? 4 : 3;
      for (let i = 0; i < n; i++) cards.push(createCard('BOMB'));
    }
    if (partyConfig.swapEnabled) {
      const n = big ? 3 : 2;
      for (let i = 0; i < n; i++) cards.push(createCard('SWAP'));
    }
  }
  return cards;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initGame(
  stockpileSize: number = 20,
  mode: GameMode = 'standard',
  partyConfig: PartyConfig = DEFAULT_PARTY_CONFIG,
): GameState {
  cardIdCounter = 0;
  const deck = shuffle(createDeck(mode, stockpileSize, partyConfig));

  const player: Player = {
    name: 'Du',
    hand: [],
    stockpile: deck.splice(0, stockpileSize),
    discardPiles: [[], [], [], []],
    isAI: false,
  };
  const ai: Player = {
    name: 'Computer',
    hand: [],
    stockpile: deck.splice(0, stockpileSize),
    discardPiles: [[], [], [], []],
    isAI: true,
  };

  const state: GameState = {
    players: [player, ai],
    buildPiles: [[], [], [], []],
    drawPile: deck,
    currentPlayerIndex: 0,
    winner: null,
    stockpileSize,
    gameMode: mode,
    blockedPiles: [],
    skipNextTurnFor: null,
  };

  drawCards(state, 0);
  drawCards(state, 1);
  return state;
}

function drawCards(state: GameState, playerIndex: number) {
  const player = state.players[playerIndex];
  while (player.hand.length < 5 && state.drawPile.length > 0) {
    player.hand.push(state.drawPile.pop()!);
  }
  if (state.drawPile.length === 0) recycleBuildPiles(state);
}

function recycleBuildPiles(state: GameState) {
  for (let i = 0; i < 4; i++) {
    if (state.buildPiles[i].length === 12) {
      state.drawPile.push(...state.buildPiles[i]);
      state.buildPiles[i] = [];
    }
  }
  state.drawPile = shuffle(state.drawPile);
}

export function getTopCard(pile: Card[]): Card | undefined {
  return pile.length > 0 ? pile[pile.length - 1] : undefined;
}

export function getBuildPileNext(pile: Card[]): number {
  return pile.length + 1;
}

export function getCardNumericValue(card: Card, targetValue: number): number | null {
  if (card.value === 'JOKER') return targetValue;
  return card.value as number;
}

export function isPileBlockedFor(state: GameState, playerIndex: number, pileIndex: number): boolean {
  return state.blockedPiles.some(
    (b) => b.pileIndex === pileIndex && b.blockedByPlayerIndex !== playerIndex
  );
}

export function canPlayCard(state: GameState, playerIndex: number, source: CardSource, target: CardTarget): boolean {
  const player = state.players[playerIndex];

  let card: Card | undefined;
  if (source.type === 'hand') card = player.hand[source.index];
  else if (source.type === 'stockpile') card = getTopCard(player.stockpile);
  else if (source.type === 'discard') card = getTopCard(player.discardPiles[source.pileIndex]);
  if (!card) return false;

  const opponentIndex = 1 - playerIndex;

  switch (card.value) {
    case 'BLOCKER':
      if (source.type !== 'hand' || target.type !== 'build') return false;
      return getBuildPileNext(state.buildPiles[target.pileIndex]) <= 12;

    case 'STEAL':
      if (source.type !== 'hand' || target.type !== 'opponent-discard') return false;
      return state.players[opponentIndex].discardPiles[target.pileIndex].length > 0;

    case 'SKIP':
    case 'SWAP':
      if (source.type !== 'hand') return false;
      return target.type === 'use';

    case 'BOMB':
      if (source.type !== 'hand' || target.type !== 'opponent-discard') return false;
      return state.players[opponentIndex].discardPiles[target.pileIndex].length > 0;

    default: {
      // Normal / Joker
      if (target.type === 'build') {
        if (isPileBlockedFor(state, playerIndex, target.pileIndex)) return false;
        const needed = getBuildPileNext(state.buildPiles[target.pileIndex]);
        if (needed > 12) return false;
        return getCardNumericValue(card, needed) === needed;
      }
      if (target.type === 'discard') return source.type === 'hand';
      return false;
    }
  }
}

export function playCard(state: GameState, playerIndex: number, source: CardSource, target: CardTarget): GameState {
  const newState = structuredClone(state) as GameState;
  const player = newState.players[playerIndex];
  const opponentIndex = 1 - playerIndex;

  let card: Card;
  if (source.type === 'hand') card = player.hand.splice(source.index, 1)[0];
  else if (source.type === 'stockpile') card = player.stockpile.pop()!;
  else card = player.discardPiles[source.pileIndex].pop()!;

  // ── BLOCKER ───────────────────────────────────────────────────────────────
  if (card.value === 'BLOCKER' && target.type === 'build') {
    newState.blockedPiles = newState.blockedPiles.filter(
      (b) => !(b.pileIndex === target.pileIndex && b.blockedByPlayerIndex === playerIndex)
    );
    newState.blockedPiles.push({ pileIndex: target.pileIndex, blockedByPlayerIndex: playerIndex });
    if (player.hand.length === 0 && !newState.winner) drawCards(newState, playerIndex);
    return newState;
  }

  // ── STEAL ─────────────────────────────────────────────────────────────────
  if (card.value === 'STEAL' && target.type === 'opponent-discard') {
    const stolen = newState.players[opponentIndex].discardPiles[target.pileIndex].pop();
    if (stolen) player.hand.push(stolen);
    return newState;
  }

  // ── BOMB ──────────────────────────────────────────────────────────────────
  if (card.value === 'BOMB' && target.type === 'opponent-discard') {
    // Put opponent's discard pile cards into draw pile, clear it
    const pile = newState.players[opponentIndex].discardPiles[target.pileIndex];
    newState.drawPile.push(...pile);
    newState.players[opponentIndex].discardPiles[target.pileIndex] = [];
    newState.drawPile = shuffle(newState.drawPile);
    return newState;
  }

  // ── SKIP ──────────────────────────────────────────────────────────────────
  if (card.value === 'SKIP' && target.type === 'use') {
    newState.skipNextTurnFor = opponentIndex;
    return newState;
  }

  // ── SWAP ──────────────────────────────────────────────────────────────────
  if (card.value === 'SWAP' && target.type === 'use') {
    const myHand = player.hand;
    const oppHand = newState.players[opponentIndex].hand;
    player.hand = oppHand;
    newState.players[opponentIndex].hand = myHand;
    return newState;
  }

  // ── Build pile (normal / joker) ───────────────────────────────────────────
  if (target.type === 'build') {
    const needed = getBuildPileNext(newState.buildPiles[target.pileIndex]);
    if (card.value === 'JOKER') card.displayValue = needed;
    newState.buildPiles[target.pileIndex].push(card);
    if (newState.buildPiles[target.pileIndex].length === 12) {
      newState.drawPile.push(...newState.buildPiles[target.pileIndex]);
      newState.buildPiles[target.pileIndex] = [];
      newState.drawPile = shuffle(newState.drawPile);
      newState.blockedPiles = newState.blockedPiles.filter(b => b.pileIndex !== target.pileIndex);
    }
    if (player.stockpile.length === 0) newState.winner = playerIndex;
    if (player.hand.length === 0 && !newState.winner) drawCards(newState, playerIndex);
    return newState;
  }

  // ── Discard (ends turn) ───────────────────────────────────────────────────
  if (target.type === 'discard') {
    player.discardPiles[target.pileIndex].push(card);

    // Clear blockers placed by the other player (they've had their blocked turn)
    newState.blockedPiles = newState.blockedPiles.filter(
      (b) => b.blockedByPlayerIndex !== opponentIndex
    );

    const nextPlayer = (playerIndex + 1) % 2;
    newState.currentPlayerIndex = nextPlayer;
    drawCards(newState, nextPlayer);
  }

  return newState;
}

// ── AI ────────────────────────────────────────────────────────────────────────

export function executeAITurn(state: GameState): GameState {
  let s = structuredClone(state) as GameState;
  const ai = 1;

  // Handle skip
  if (s.skipNextTurnFor === ai) {
    s.skipNextTurnFor = null;
    s.currentPlayerIndex = 0;
    drawCards(s, 0);
    return s;
  }

  let played = true;
  while (played && !s.winner) {
    played = false;

    // Stockpile first
    for (let b = 0; b < 4; b++) {
      if (canPlayCard(s, ai, { type: 'stockpile' }, { type: 'build', pileIndex: b })) {
        s = playCard(s, ai, { type: 'stockpile' }, { type: 'build', pileIndex: b });
        played = true; break;
      }
    }
    if (played) continue;

    // Hand (skip special cards first pass)
    for (let h = 0; h < s.players[ai].hand.length; h++) {
      const c = s.players[ai].hand[h];
      const isSpecial = ['BLOCKER','STEAL','SKIP','BOMB','SWAP'].includes(c.value as string);
      if (isSpecial) continue;
      for (let b = 0; b < 4; b++) {
        if (canPlayCard(s, ai, { type: 'hand', index: h }, { type: 'build', pileIndex: b })) {
          s = playCard(s, ai, { type: 'hand', index: h }, { type: 'build', pileIndex: b });
          played = true; break;
        }
      }
      if (played) break;
    }
    if (played) continue;

    // Discard piles
    for (let d = 0; d < 4; d++) {
      for (let b = 0; b < 4; b++) {
        if (canPlayCard(s, ai, { type: 'discard', pileIndex: d }, { type: 'build', pileIndex: b })) {
          s = playCard(s, ai, { type: 'discard', pileIndex: d }, { type: 'build', pileIndex: b });
          played = true; break;
        }
      }
      if (played) break;
    }
  }

  // Party: use special cards before discarding
  if (!s.winner && s.gameMode === 'party') {
    s = executeAIPartyCards(s, ai);
  }

  // Discard to end turn
  if (!s.winner && s.players[ai].hand.length > 0) {
    let discardIdx = 0;
    // Prefer discarding non-special cards
    for (let h = 0; h < s.players[ai].hand.length; h++) {
      const c = s.players[ai].hand[h];
      if (!['BLOCKER','STEAL','SKIP','BOMB','SWAP'].includes(c.value as string)) {
        discardIdx = h; break;
      }
    }
    let bestPile = 0, bestLen = Infinity;
    for (let d = 0; d < 4; d++) {
      if (s.players[ai].discardPiles[d].length < bestLen) {
        bestLen = s.players[ai].discardPiles[d].length;
        bestPile = d;
      }
    }
    s = playCard(s, ai, { type: 'hand', index: discardIdx }, { type: 'discard', pileIndex: bestPile });
  }

  return s;
}

function executeAIPartyCards(state: GameState, ai: number): GameState {
  let s = state;
  const human = 1 - ai;

  for (let h = 0; h < s.players[ai].hand.length; h++) {
    const card = s.players[ai].hand[h];

    if (card.value === 'BLOCKER') {
      // Block pile with lowest needed value
      let bestPile = -1, bestNext = Infinity;
      for (let b = 0; b < 4; b++) {
        const next = getBuildPileNext(s.buildPiles[b]);
        if (next <= 12 && next < bestNext) { bestNext = next; bestPile = b; }
      }
      if (bestPile >= 0) return playCard(s, ai, { type: 'hand', index: h }, { type: 'build', pileIndex: bestPile });
    }

    if (card.value === 'STEAL') {
      // Steal highest-value card from opponent discard
      let bestPile = -1, bestVal = -1;
      for (let d = 0; d < 4; d++) {
        const top = getTopCard(s.players[human].discardPiles[d]);
        if (!top) continue;
        const val = typeof top.value === 'number' ? top.value : 0;
        if (val > bestVal) { bestVal = val; bestPile = d; }
      }
      if (bestPile >= 0) return playCard(s, ai, { type: 'hand', index: h }, { type: 'opponent-discard', pileIndex: bestPile });
    }

    if (card.value === 'BOMB') {
      // Bomb the opponent's largest discard pile
      let bestPile = -1, bestLen = 0;
      for (let d = 0; d < 4; d++) {
        const len = s.players[human].discardPiles[d].length;
        if (len > bestLen) { bestLen = len; bestPile = d; }
      }
      if (bestPile >= 0 && bestLen > 0) return playCard(s, ai, { type: 'hand', index: h }, { type: 'opponent-discard', pileIndex: bestPile });
    }

    if (card.value === 'SKIP') {
      // Use skip if human has fewer stockpile cards (they're winning)
      if (s.players[human].stockpile.length < s.players[ai].stockpile.length) {
        return playCard(s, ai, { type: 'hand', index: h }, { type: 'use' });
      }
    }

    if (card.value === 'SWAP') {
      // Swap if human has better hand (more numeric high cards)
      const humanHandScore = s.players[human].hand.reduce((sum, c) => sum + (typeof c.value === 'number' ? c.value : 0), 0);
      const aiHandScore = s.players[ai].hand.reduce((sum, c) => sum + (typeof c.value === 'number' ? c.value : 0), 0);
      if (humanHandScore > aiHandScore) {
        return playCard(s, ai, { type: 'hand', index: h }, { type: 'use' });
      }
    }
  }

  return s;
}
