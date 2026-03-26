import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GameMode, PartyConfig, DEFAULT_PARTY_CONFIG } from '@/game/types';
import { useLanguage } from '@/i18n/LanguageContext';
import { Language } from '@/i18n/translations';

interface GameSetupProps {
  onStart: (stockpileSize: number, mode: GameMode, partyConfig: PartyConfig) => void;
  onPlayOnline: () => void;
}

const LANG_FLAGS: Record<Language, string> = { de: '🇩🇪', en: '🇬🇧', sl: '🇸🇮' };
const LANG_LABELS: Record<Language, string> = { de: 'DE', en: 'EN', sl: 'SL' };

interface CardToggleProps {
  emoji: string;
  name: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  color: string;
}

function CardToggle({ emoji, name, description, enabled, onToggle, color }: CardToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
        enabled ? `${color} shadow-sm` : 'border-border/40 bg-muted/20 opacity-50'
      }`}
    >
      <span className="text-xl flex-shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="font-display text-sm text-foreground">{name}</div>
        <div className="text-muted-foreground text-xs leading-tight">{description}</div>
      </div>
      <div className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-colors ${enabled ? 'bg-gold' : 'bg-muted'}`}>
        <motion.div
          animate={{ x: enabled ? 16 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        />
      </div>
    </button>
  );
}

export default function GameSetup({ onStart, onPlayOnline }: GameSetupProps) {
  const { language, setLanguage, t } = useLanguage();
  const [size, setSize] = useState(20);
  const [mode, setMode] = useState<GameMode>('standard');
  const [cfg, setCfg] = useState<PartyConfig>(DEFAULT_PARTY_CONFIG);

  const toggle = (key: keyof PartyConfig) =>
    setCfg((prev) => ({ ...prev, [key]: !prev[key] }));

  const anyEnabled = Object.values(cfg).some(Boolean);

  const cardDefs: { key: keyof PartyConfig; emoji: string; color: string }[] = [
    { key: 'blockerEnabled', emoji: '🚫', color: 'border-red-500/60 bg-red-900/20' },
    { key: 'stealEnabled',   emoji: '🃏', color: 'border-amber-500/60 bg-amber-900/20' },
    { key: 'skipEnabled',    emoji: '⏭️', color: 'border-blue-500/60 bg-blue-900/20' },
    { key: 'bombEnabled',    emoji: '💣', color: 'border-orange-500/60 bg-orange-900/20' },
    { key: 'swapEnabled',    emoji: '🔄', color: 'border-purple-500/60 bg-purple-900/20' },
  ];

  const cardNames: Record<keyof PartyConfig, string> = {
    blockerEnabled: t.cardBlocker,
    stealEnabled:   t.cardSteal,
    skipEnabled:    t.cardSkip,
    bombEnabled:    t.cardBomb,
    swapEnabled:    t.cardSwap,
  };
  const cardDescs: Record<keyof PartyConfig, string> = {
    blockerEnabled: t.cardBlockerDesc,
    stealEnabled:   t.cardStealDesc,
    skipEnabled:    t.cardSkipDesc,
    bombEnabled:    t.cardBombDesc,
    swapEnabled:    t.cardSwapDesc,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/80 backdrop-blur rounded-2xl p-8 max-w-md w-full shadow-2xl border border-border"
      >
        {/* ── Language switcher ── */}
        <div className="flex justify-end gap-1 mb-4">
          {(['de', 'en', 'sl'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-1 rounded-lg text-xs font-display transition-all ${
                language === lang
                  ? 'bg-gold text-secondary-foreground shadow'
                  : 'bg-muted text-muted-foreground hover:bg-border'
              }`}
            >
              {LANG_FLAGS[lang]} {LANG_LABELS[lang]}
            </button>
          ))}
        </div>

        <h1 className="font-display text-5xl text-gold mb-2 text-center">Stack-Bo</h1>
        <p className="text-muted-foreground mb-6 text-center text-sm">{t.tagline}</p>

        {/* ── Spielmodus ── */}
        <div className="mb-5">
          <label className="block text-foreground font-display text-base mb-2">{t.gameMode}</label>
          <div className="flex gap-3">
            {(['standard', 'party'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-xl p-3 border-2 transition-all text-left ${
                  mode === m ? 'border-gold bg-gold/10 shadow-lg' : 'border-border hover:border-gold/40 bg-muted/40'
                }`}
              >
                <div className="text-lg mb-0.5">{m === 'standard' ? '🃏' : '🎉'}</div>
                <div className={`font-display text-sm ${mode === m ? 'text-gold' : 'text-foreground'}`}>
                  {m === 'standard' ? t.standard : t.party}
                </div>
                <div className="text-muted-foreground text-xs mt-0.5">
                  {m === 'standard' ? t.standardDesc : t.partyDesc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Party card toggles ── */}
        <AnimatePresence>
          {mode === 'party' && (
            <motion.div
              key="party"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <label className="block text-foreground font-display text-sm mb-2">{t.activeCards}</label>
              <div className="flex flex-col gap-1.5">
                {cardDefs.map(({ key, emoji, color }) => (
                  <CardToggle
                    key={key}
                    emoji={emoji}
                    name={cardNames[key]}
                    description={cardDescs[key]}
                    enabled={cfg[key]}
                    onToggle={() => toggle(key)}
                    color={color}
                  />
                ))}
              </div>
              {!anyEnabled && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-amber-400 text-xs mt-2 text-center">
                  {t.atLeastOneCard}
                </motion.p>
              )}
              {anyEnabled && (
                <p className="text-muted-foreground text-xs mt-2 text-center">
                  {t.deckInfo(size > 20)}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stapelgröße ── */}
        <div className="mb-6">
          <label className="block text-foreground font-display text-base mb-2">{t.stackSize}</label>
          <div className="flex items-center justify-center gap-2">
            {[10, 15, 20, 25, 30].map((v) => (
              <button
                key={v}
                onClick={() => setSize(v)}
                className={`w-12 h-12 rounded-lg font-display text-lg transition-all ${
                  size === v
                    ? 'bg-gold text-secondary-foreground shadow-lg scale-110'
                    : 'bg-muted text-muted-foreground hover:bg-border'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => onStart(size, mode, cfg)}
          disabled={mode === 'party' && !anyEnabled}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display text-xl py-6 rounded-xl shadow-lg mb-3 disabled:opacity-40"
        >
          {t.vsAI}
        </Button>
        <Button
          onClick={onPlayOnline}
          variant="outline"
          className="w-full font-display text-xl py-6 rounded-xl border-gold/50 text-gold hover:bg-gold/10 shadow-lg"
        >
          {t.playOnline}
        </Button>
      </motion.div>
    </div>
  );
}
