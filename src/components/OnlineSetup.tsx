import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { UseMultiplayerReturn, GameStartData } from '@/hooks/useMultiplayer';
import { useLanguage } from '@/i18n/LanguageContext';

interface OnlineSetupProps {
  multiplayer: UseMultiplayerReturn;
  onGameStart: (stockpileSize: number, playerIndex: 0 | 1, opponentName: string) => void;
  onBack: () => void;
}

type Screen = 'choose' | 'create' | 'join';

export default function OnlineSetup({ multiplayer, onGameStart, onBack }: OnlineSetupProps) {
  const { t } = useLanguage();
  const [screen, setScreen] = useState<Screen>('choose');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [stockpileSize, setStockpileSize] = useState(20);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    multiplayer.setOnGameStart((data: GameStartData) => {
      onGameStart(data.stockpileSize, data.playerIndex, data.opponentName);
    });
    return () => { multiplayer.setOnGameStart(null); };
  }, [multiplayer, onGameStart]);

  const copyCode = () => {
    if (multiplayer.inviteCode) {
      navigator.clipboard.writeText(multiplayer.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/80 backdrop-blur rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-border"
      >
        <h1 className="font-display text-4xl text-gold mb-1">Stack-Bo</h1>
        <p className="text-muted-foreground mb-6 text-sm">{t.playOnlineTitle}</p>

        {multiplayer.status === 'opponent-left' && (
          <div className="mb-4 bg-destructive/20 border border-destructive/50 rounded-lg p-3 text-destructive text-sm">
            {t.opponentLeft}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── CHOOSE ── */}
          {screen === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col gap-3 mb-6">
                <Button onClick={() => setScreen('create')}
                  className="w-full bg-primary text-primary-foreground font-display text-lg py-6 rounded-xl">
                  {t.createGame}
                </Button>
                <Button onClick={() => setScreen('join')} variant="outline"
                  className="w-full font-display text-lg py-6 rounded-xl border-gold/40 text-gold hover:bg-gold/10">
                  {t.joinGame}
                </Button>
              </div>
              <button onClick={onBack} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                {t.back}
              </button>
            </motion.div>
          )}

          {/* ── CREATE ── */}
          {screen === 'create' && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {multiplayer.status === 'waiting' && multiplayer.inviteCode ? (
                <div>
                  <p className="text-muted-foreground text-sm mb-4">{t.sendCodeHint}</p>
                  <div onClick={copyCode} title="Klicken zum Kopieren"
                    className="bg-felt-dark rounded-xl p-4 mb-4 cursor-pointer hover:bg-felt-dark/80 transition-colors">
                    <span className="font-display text-5xl text-gold tracking-[0.3em]">{multiplayer.inviteCode}</span>
                    <p className="text-muted-foreground text-xs mt-2">{copied ? t.copied : t.clickToCopy}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-gold/40 border-t-gold rounded-full" />
                    {t.waitingForOpponent}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4 text-left">
                    <label className="block text-foreground font-display text-sm mb-2">{t.yourName}</label>
                    <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                      placeholder={t.namePlaceholder} maxLength={20}
                      className="w-full bg-felt-dark border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60" />
                  </div>
                  <div className="mb-6 text-left">
                    <label className="block text-foreground font-display text-sm mb-2">{t.stackSize}</label>
                    <div className="flex gap-2 justify-center">
                      {[10, 15, 20, 25, 30].map((v) => (
                        <button key={v} onClick={() => setStockpileSize(v)}
                          className={`w-11 h-11 rounded-lg font-display text-base transition-all ${
                            stockpileSize === v ? 'bg-gold text-secondary-foreground shadow-lg scale-110' : 'bg-muted text-muted-foreground hover:bg-border'
                          }`}>{v}</button>
                      ))}
                    </div>
                  </div>
                  {multiplayer.status === 'error' && multiplayer.joinError && (
                    <p className="text-destructive text-sm mb-3">{multiplayer.joinError}</p>
                  )}
                  <Button onClick={() => multiplayer.createRoom(stockpileSize, playerName.trim())}
                    disabled={!playerName.trim() || multiplayer.status === 'connecting'}
                    className="w-full bg-primary text-primary-foreground font-display text-lg py-5 rounded-xl mb-3">
                    {multiplayer.status === 'connecting' ? t.connecting : t.createRoom}
                  </Button>
                </div>
              )}
              <button onClick={() => setScreen('choose')}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors mt-4 block mx-auto">
                {t.back}
              </button>
            </motion.div>
          )}

          {/* ── JOIN ── */}
          {screen === 'join' && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="mb-4 text-left">
                <label className="block text-foreground font-display text-sm mb-2">{t.yourName}</label>
                <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)}
                  placeholder={t.namePlaceholder} maxLength={20}
                  className="w-full bg-felt-dark border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60" />
              </div>
              <div className="mb-6 text-left">
                <label className="block text-foreground font-display text-sm mb-2">{t.codeLabel}</label>
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t.codePlaceholder} maxLength={6}
                  className="w-full bg-felt-dark border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/60 font-display text-2xl tracking-[0.3em] text-center uppercase" />
              </div>
              {multiplayer.status === 'error' && multiplayer.joinError && (
                <p className="text-destructive text-sm mb-3">{multiplayer.joinError}</p>
              )}
              <Button onClick={() => multiplayer.joinRoom(joinCode, playerName.trim())}
                disabled={!playerName.trim() || joinCode.length < 6 || multiplayer.status === 'connecting'}
                className="w-full bg-primary text-primary-foreground font-display text-lg py-5 rounded-xl mb-3">
                {multiplayer.status === 'connecting' ? t.connecting : t.joinRoom}
              </Button>
              <button onClick={() => setScreen('choose')}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors mt-2 block mx-auto">
                {t.back}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
