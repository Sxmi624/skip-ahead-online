export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'JOKER';

export interface Card {
  id: string;
  value: CardValue;
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
}

export type CardSource =
  | { type: 'hand'; index: number }
  | { type: 'stockpile' }
  | { type: 'discard'; pileIndex: number };

export type CardTarget =
  | { type: 'build'; pileIndex: number }
  | { type: 'discard'; pileIndex: number };
