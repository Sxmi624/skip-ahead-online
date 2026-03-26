import { Card, CardValue, CardSource, CardTarget, GameState, Player } from './types';

let cardIdCounter = 0;

function createCard(value: CardValue): Card {
  return { id: `card-${cardIdCounter++}`, value };
}

function createDeck(): Card[] {
  const cards: Card[] = [];
  // 12 sets of cards 1-12 (144 cards) + 18 jokers = 162 cards
  for (let set = 0; set < 12; set++) {
    for (let v = 1; v <= 12; v++) {
      cards.push(createCard(v as CardValue));
    }
  }
  for (let j = 0; j < 18; j++) {
    cards.push(createCard('JOKER'));
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

export function initGame(stockpileSize: number = 20): GameState {
  cardIdCounter = 0;
  const deck = shuffle(createDeck());

  const player: Player = {
    name: 'You',
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
  // If draw pile empty, recycle completed build piles
  if (state.drawPile.length === 0) {
    recycleBuildPiles(state);
  }
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
  return card.value;
}

export function canPlayCard(state: GameState, playerIndex: number, source: CardSource, target: CardTarget): boolean {
  const player = state.players[playerIndex];

  let card: Card | undefined;
  if (source.type === 'hand') {
    card = player.hand[source.index];
  } else if (source.type === 'stockpile') {
    card = getTopCard(player.stockpile);
  } else if (source.type === 'discard') {
    card = getTopCard(player.discardPiles[source.pileIndex]);
  }

  if (!card) return false;

  if (target.type === 'build') {
    const needed = getBuildPileNext(state.buildPiles[target.pileIndex]);
    if (needed > 12) return false;
    const numValue = getCardNumericValue(card, needed);
    return numValue === needed;
  }

  if (target.type === 'discard') {
    // Can only discard from hand
    return source.type === 'hand';
  }

  return false;
}

export function playCard(state: GameState, playerIndex: number, source: CardSource, target: CardTarget): GameState {
  const newState = structuredClone(state);
  const player = newState.players[playerIndex];

  let card: Card;
  if (source.type === 'hand') {
    card = player.hand.splice(source.index, 1)[0];
  } else if (source.type === 'stockpile') {
    card = player.stockpile.pop()!;
  } else {
    card = player.discardPiles[source.pileIndex].pop()!;
  }

  if (target.type === 'build') {
    const needed = getBuildPileNext(newState.buildPiles[target.pileIndex]);
    // Set display value on joker
    if (card.value === 'JOKER') {
      card.displayValue = needed;
    }
    newState.buildPiles[target.pileIndex].push(card);
    // Check if pile is complete (12)
    if (newState.buildPiles[target.pileIndex].length === 12) {
      newState.drawPile.push(...newState.buildPiles[target.pileIndex]);
      newState.buildPiles[target.pileIndex] = [];
      newState.drawPile = shuffle(newState.drawPile);
    }
    // Check win
    if (player.stockpile.length === 0) {
      newState.winner = playerIndex;
    }
    // If hand empty, draw more
    if (player.hand.length === 0 && newState.winner === null) {
      drawCards(newState, playerIndex);
    }
  } else if (target.type === 'discard') {
    player.discardPiles[target.pileIndex].push(card);
    // End turn
    newState.currentPlayerIndex = (newState.currentPlayerIndex + 1) % 2;
    drawCards(newState, newState.currentPlayerIndex);
  }

  return newState;
}

export function executeAITurn(state: GameState): GameState {
  let s = structuredClone(state);
  const ai = 1;
  let played = true;

  while (played && s.winner === null) {
    played = false;

    // Try stockpile first
    for (let b = 0; b < 4; b++) {
      if (canPlayCard(s, ai, { type: 'stockpile' }, { type: 'build', pileIndex: b })) {
        s = playCard(s, ai, { type: 'stockpile' }, { type: 'build', pileIndex: b });
        played = true;
        break;
      }
    }
    if (played) continue;

    // Try hand cards
    for (let h = 0; h < s.players[ai].hand.length; h++) {
      for (let b = 0; b < 4; b++) {
        if (canPlayCard(s, ai, { type: 'hand', index: h }, { type: 'build', pileIndex: b })) {
          s = playCard(s, ai, { type: 'hand', index: h }, { type: 'build', pileIndex: b });
          played = true;
          break;
        }
      }
      if (played) break;
    }
    if (played) continue;

    // Try discard piles
    for (let d = 0; d < 4; d++) {
      for (let b = 0; b < 4; b++) {
        if (canPlayCard(s, ai, { type: 'discard', pileIndex: d }, { type: 'build', pileIndex: b })) {
          s = playCard(s, ai, { type: 'discard', pileIndex: d }, { type: 'build', pileIndex: b });
          played = true;
          break;
        }
      }
      if (played) break;
    }
  }

  // If no more plays, discard a card
  if (s.winner === null && s.players[ai].hand.length > 0) {
    // Find best discard pile
    const handIndex = 0;
    let bestPile = 0;
    let bestLen = Infinity;
    for (let d = 0; d < 4; d++) {
      if (s.players[ai].discardPiles[d].length < bestLen) {
        bestLen = s.players[ai].discardPiles[d].length;
        bestPile = d;
      }
    }
    s = playCard(s, ai, { type: 'hand', index: handIndex }, { type: 'discard', pileIndex: bestPile });
  }

  return s;
}
