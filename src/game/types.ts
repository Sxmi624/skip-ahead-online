export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'JOKER' | 'BLOCKER' | 'STEAL' | 'SKIP' | 'BOMB' | 'SWAP';

export type GameMode = 'standard' | 'party';

export interface PartyConfig {
  blockerEnabled: boolean;
  stealEnabled: boolean;
  skipEnabled: boolean;
  bombEnabled: boolean;
  swapEnabled: boolean;
}

export const DEFAULT_PARTY_CONFIG: PartyConfig = {
  blockerEnabled: true,
  stealEnabled: true,
  skipEnabled: true,
  bombEnabled: true,
  swapEnabled: true,
};

export interface Card {
  id: string;
  value: CardValue;
  displayValue?: number; // For jokers: the value they represent when played
}

export interface BlockedPile {
  pileIndex: number;
  /** The player who placed the blocker (the OPPONENT of this player is blocked). */
  blockedByPlayerIndex: number;
}

export interface Player {
  name: string;
  hand: Card[];
  stockpile: Card[];
  discardPiles: [Card[], Card[], Card[], Card[]];
  isAI: boolean;
}

export interface GameState {
  players: Player[];
  buildPiles: [Card[], Card[], Card[], Card[]];
  drawPile: Card[];
  currentPlayerIndex: number;
  winner: number | null;
  stockpileSize: number;
  gameMode: GameMode;
  /** Piles currently blocked by a BLOCKER card. */
  blockedPiles: BlockedPile[];
  /** If set, this player's next turn is skipped (they auto-pass). */
  skipNextTurnFor: number | null;
}

export type CardSource =
  | { type: 'hand'; index: number }
  | { type: 'stockpile' }
  | { type: 'discard'; pileIndex: number };

export type CardTarget =
  | { type: 'build'; pileIndex: number }
  | { type: 'discard'; pileIndex: number }
  | { type: 'opponent-discard'; pileIndex: number } // Used by STEAL and BOMB
  | { type: 'use' }; // Instant-effect cards: SKIP, SWAP
