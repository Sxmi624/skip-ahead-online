export type Language = 'de' | 'en' | 'sl';

export interface Translations {
  // ── Menu ──────────────────────────────────────────────────────────────
  tagline: string;
  gameMode: string;
  standard: string;
  standardDesc: string;
  party: string;
  partyDesc: string;
  activeCards: string;
  stackSize: string;
  vsAI: string;
  playOnline: string;
  atLeastOneCard: string;

  // ── Party card names & descriptions ───────────────────────────────────
  cardBlocker: string;
  cardBlockerDesc: string;
  cardSteal: string;
  cardStealDesc: string;
  cardSkip: string;
  cardSkipDesc: string;
  cardBomb: string;
  cardBombDesc: string;
  cardSwap: string;
  cardSwapDesc: string;

  // ── Deck info ─────────────────────────────────────────────────────────
  deckInfo: (big: boolean) => string;

  // ── Online Setup ──────────────────────────────────────────────────────
  playOnlineTitle: string;
  createGame: string;
  joinGame: string;
  yourName: string;
  namePlaceholder: string;
  inviteCode: string;
  codeLabel: string;
  codePlaceholder: string;
  sendCodeHint: string;
  clickToCopy: string;
  copied: string;
  waitingForOpponent: string;
  connecting: string;
  createRoom: string;
  joinRoom: string;
  back: string;

  // ── Game Board ────────────────────────────────────────────────────────
  yourTurn: string;
  waitForOpponent: (name: string) => string;
  aiThinking: string;
  buildPiles: string;
  needs: string;
  complete: string;
  stockLabel: string;
  discardLabel: (n: number) => string;
  stock: string;
  online: string;
  partyBadge: string;

  // ── Special card hints ────────────────────────────────────────────────
  hintBlocker: string;
  hintSteal: string;
  hintBomb: string;
  hintSkip: string;
  hintSwap: string;
  activate: string;
  cancel: string;

  // ── Blocked pile ──────────────────────────────────────────────────────
  blocked: string;
  opponentBlocked: string;

  // ── Skip turn ─────────────────────────────────────────────────────────
  yourTurnSkipped: string;

  // ── Winner / Disconnect ───────────────────────────────────────────────
  youWin: string;
  opponentWins: (name: string) => string;
  playAgain: string;
  connectionLost: string;
  opponentLeft: string;
  backToMenu: string;

  // ── Opponent ──────────────────────────────────────────────────────────
  opponentLabel: (name: string, stock: number) => string;
}

const de: Translations = {
  tagline: 'Ein Skip-Bo inspiriertes Kartenspiel',
  gameMode: 'Spielmodus',
  standard: 'Standard',
  standardDesc: 'Klassisches Skip-Bo',
  party: 'Party',
  partyDesc: 'Mit Spezialkarten',
  activeCards: 'Aktive Spezialkarten',
  stackSize: 'Stapelgröße',
  vsAI: '🤖 Gegen KI spielen',
  playOnline: '🌐 Online gegen Freunde',
  atLeastOneCard: '⚠️ Mindestens eine Spezialkarte aktivieren',

  cardBlocker: 'Blocker',
  cardBlockerDesc: 'Sperrt einen Aufbaustapel für eine Runde',
  cardSteal: 'Steal',
  cardStealDesc: 'Klau die oberste Karte vom Gegner',
  cardSkip: 'Skip',
  cardSkipDesc: 'Gegner muss eine Runde aussetzen',
  cardBomb: 'Bomb',
  cardBombDesc: "Leert einen Ablagestapel des Gegners",
  cardSwap: 'Swap',
  cardSwapDesc: 'Tausche deine Hand mit der des Gegners',

  deckInfo: (big) =>
    big
      ? '8× 🚫 · 6× 🃏 · 4× ⏭️ · 4× 💣 · 3× 🔄 im Deck'
      : '4× 🚫 · 4× 🃏 · 3× ⏭️ · 3× 💣 · 2× 🔄 im Deck',

  playOnlineTitle: 'Online gegen Freunde spielen',
  createGame: '🎮 Spiel erstellen',
  joinGame: '🔗 Spiel beitreten',
  yourName: 'Dein Name',
  namePlaceholder: 'z.B. Max',
  inviteCode: 'Einladungs-Code',
  codeLabel: 'Einladungs-Code',
  codePlaceholder: 'z.B. AB12CD',
  sendCodeHint: 'Schicke diesen Code deinem Freund:',
  clickToCopy: '📋 Klicken zum Kopieren',
  copied: '✅ Kopiert!',
  waitingForOpponent: 'Warte auf Gegner…',
  connecting: '⏳ Verbinde…',
  createRoom: '🎮 Raum erstellen',
  joinRoom: '🔗 Beitreten',
  back: '← Zurück',

  yourTurn: 'Du bist dran — wähle eine Karte, dann ein Ziel',
  waitForOpponent: (name) => `⏳ Warte auf ${name}…`,
  aiThinking: '💭 Computer denkt…',
  buildPiles: 'Aufbaustapel',
  needs: 'braucht',
  complete: '✓',
  stockLabel: 'Stapel:',
  discardLabel: (n) => `Ablage ${n}`,
  stock: 'Stapel',
  online: 'Online',
  partyBadge: 'Party 🎉',

  hintBlocker: '🚫 BLOCKER aktiv — klicke auf einen Aufbaustapel',
  hintSteal: '🃏 STEAL aktiv — klicke auf einen Ablagestapel des Gegners',
  hintBomb: '💣 BOMB aktiv — klicke auf einen Ablagestapel des Gegners',
  hintSkip: '⏭️ SKIP bereit — drücke Aktivieren',
  hintSwap: '🔄 SWAP bereit — drücke Aktivieren',
  activate: '✅ Aktivieren',
  cancel: 'Abbrechen',

  blocked: 'GESPERRT',
  opponentBlocked: 'Gegner gesperrt',

  yourTurnSkipped: '⏭️ Dein Zug wurde übersprungen!',

  youWin: '🎉 Du gewinnst!',
  opponentWins: (name) => `😞 ${name} gewinnt`,
  playAgain: 'Nochmal spielen',
  connectionLost: 'Verbindung getrennt',
  opponentLeft: 'Dein Gegner hat das Spiel verlassen.',
  backToMenu: 'Zurück zum Menü',

  opponentLabel: (name, stock) => `${name} • Stapel: ${stock}`,
};

const en: Translations = {
  tagline: 'A Skip-Bo inspired card game',
  gameMode: 'Game Mode',
  standard: 'Standard',
  standardDesc: 'Classic Skip-Bo',
  party: 'Party',
  partyDesc: 'With special cards',
  activeCards: 'Active Special Cards',
  stackSize: 'Stack Size',
  vsAI: '🤖 Play vs AI',
  playOnline: '🌐 Play Online',
  atLeastOneCard: '⚠️ Enable at least one special card',

  cardBlocker: 'Blocker',
  cardBlockerDesc: 'Locks a build pile for one round',
  cardSteal: 'Steal',
  cardStealDesc: "Steal opponent's top discard card",
  cardSkip: 'Skip',
  cardSkipDesc: "Opponent must skip their next turn",
  cardBomb: 'Bomb',
  cardBombDesc: "Clear one of opponent's discard piles",
  cardSwap: 'Swap',
  cardSwapDesc: "Swap your hand with opponent's",

  deckInfo: (big) =>
    big
      ? '8× 🚫 · 6× 🃏 · 4× ⏭️ · 4× 💣 · 3× 🔄 in deck'
      : '4× 🚫 · 4× 🃏 · 3× ⏭️ · 3× 💣 · 2× 🔄 in deck',

  playOnlineTitle: 'Play online with friends',
  createGame: '🎮 Create Game',
  joinGame: '🔗 Join Game',
  yourName: 'Your Name',
  namePlaceholder: 'e.g. Max',
  inviteCode: 'Invite Code',
  codeLabel: 'Invite Code',
  codePlaceholder: 'e.g. AB12CD',
  sendCodeHint: 'Send this code to your friend:',
  clickToCopy: '📋 Click to copy',
  copied: '✅ Copied!',
  waitingForOpponent: 'Waiting for opponent…',
  connecting: '⏳ Connecting…',
  createRoom: '🎮 Create Room',
  joinRoom: '🔗 Join',
  back: '← Back',

  yourTurn: 'Your turn — pick a card, then a target',
  waitForOpponent: (name) => `⏳ Waiting for ${name}…`,
  aiThinking: '💭 Computer is thinking…',
  buildPiles: 'Build Piles',
  needs: 'needs',
  complete: '✓',
  stockLabel: 'Stock:',
  discardLabel: (n) => `Discard ${n}`,
  stock: 'Stock',
  online: 'Online',
  partyBadge: 'Party 🎉',

  hintBlocker: '🚫 BLOCKER ready — click a build pile',
  hintSteal: '🃏 STEAL ready — click an opponent discard pile',
  hintBomb: '💣 BOMB ready — click an opponent discard pile',
  hintSkip: '⏭️ SKIP ready — press Activate',
  hintSwap: '🔄 SWAP ready — press Activate',
  activate: '✅ Activate',
  cancel: 'Cancel',

  blocked: 'BLOCKED',
  opponentBlocked: 'Opp. blocked',

  yourTurnSkipped: '⏭️ Your turn was skipped!',

  youWin: '🎉 You Win!',
  opponentWins: (name) => `😞 ${name} Wins`,
  playAgain: 'Play Again',
  connectionLost: 'Connection Lost',
  opponentLeft: 'Your opponent left the game.',
  backToMenu: 'Back to Menu',

  opponentLabel: (name, stock) => `${name} • Stock: ${stock}`,
};

const sl: Translations = {
  tagline: 'Igra s kartami, navdihnjena s Skip-Bo',
  gameMode: 'Način igre',
  standard: 'Standard',
  standardDesc: 'Klasični Skip-Bo',
  party: 'Zabava',
  partyDesc: 'S posebnimi kartami',
  activeCards: 'Aktivne posebne karte',
  stackSize: 'Velikost sklada',
  vsAI: '🤖 Igraj proti AI',
  playOnline: '🌐 Igraj online',
  atLeastOneCard: '⚠️ Aktiviraj vsaj eno posebno karto',

  cardBlocker: 'Bloker',
  cardBlockerDesc: 'Zaklene en gradbeni sklad za eno rundo',
  cardSteal: 'Kraja',
  cardStealDesc: 'Ukradni vrhnjo karto iz nasprotnikove odlagalne kupe',
  cardSkip: 'Preskoči',
  cardSkipDesc: 'Nasprotnik mora preskočiti svojo naslednjo potezo',
  cardBomb: 'Bomba',
  cardBombDesc: 'Izprazni eno nasprotnikovo odlagalno kupo',
  cardSwap: 'Zamenjaj',
  cardSwapDesc: 'Zamenjaj svojo roko z nasprotnikovo',

  deckInfo: (big) =>
    big
      ? '8× 🚫 · 6× 🃏 · 4× ⏭️ · 4× 💣 · 3× 🔄 v kupčku'
      : '4× 🚫 · 4× 🃏 · 3× ⏭️ · 3× 💣 · 2× 🔄 v kupčku',

  playOnlineTitle: 'Igraj online s prijatelji',
  createGame: '🎮 Ustvari igro',
  joinGame: '🔗 Pridruži se igri',
  yourName: 'Tvoje ime',
  namePlaceholder: 'npr. Max',
  inviteCode: 'Koda povabila',
  codeLabel: 'Koda povabila',
  codePlaceholder: 'npr. AB12CD',
  sendCodeHint: 'Pošlji to kodo svojemu prijatelju:',
  clickToCopy: '📋 Klikni za kopiranje',
  copied: '✅ Kopirano!',
  waitingForOpponent: 'Čakam nasprotnika…',
  connecting: '⏳ Povezujem…',
  createRoom: '🎮 Ustvari sobo',
  joinRoom: '🔗 Pridruži se',
  back: '← Nazaj',

  yourTurn: 'Tvoja poteza — izberi karto, nato cilj',
  waitForOpponent: (name) => `⏳ Čakam na ${name}…`,
  aiThinking: '💭 Računalnik razmišlja…',
  buildPiles: 'Gradbene kupe',
  needs: 'potrebuje',
  complete: '✓',
  stockLabel: 'Sklad:',
  discardLabel: (n) => `Odlaganje ${n}`,
  stock: 'Sklad',
  online: 'Online',
  partyBadge: 'Zabava 🎉',

  hintBlocker: '🚫 BLOKER aktiven — klikni gradbeno kupo',
  hintSteal: '🃏 KRAJA aktivna — klikni nasprotnikovo odlagalno kupo',
  hintBomb: '💣 BOMBA aktivna — klikni nasprotnikovo odlagalno kupo',
  hintSkip: '⏭️ PRESKOČI pripravljeno — pritisni Aktiviraj',
  hintSwap: '🔄 ZAMENJAJ pripravljeno — pritisni Aktiviraj',
  activate: '✅ Aktiviraj',
  cancel: 'Prekliči',

  blocked: 'BLOKIRANO',
  opponentBlocked: 'Nasp. blokiran',

  yourTurnSkipped: '⏭️ Tvoja poteza je bila preskočena!',

  youWin: '🎉 Zmagaš!',
  opponentWins: (name) => `😞 ${name} zmaga`,
  playAgain: 'Igraj znova',
  connectionLost: 'Izgubljena povezava',
  opponentLeft: 'Tvoj nasprotnik je zapustil igro.',
  backToMenu: 'Nazaj v meni',

  opponentLabel: (name, stock) => `${name} • Sklad: ${stock}`,
};

export const TRANSLATIONS: Record<Language, Translations> = { de, en, sl };
