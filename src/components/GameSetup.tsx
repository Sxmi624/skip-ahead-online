import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface GameSetupProps {
  onStart: (stockpileSize: number) => void;
}

export default function GameSetup({ onStart }: GameSetupProps) {
  const [size, setSize] = useState(20);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/80 backdrop-blur rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-border"
      >
        <h1 className="font-display text-5xl text-gold mb-2">Stack-Bo</h1>
        <p className="text-muted-foreground mb-8">A Skip-Bo inspired card game</p>

        <div className="mb-8">
          <label className="block text-foreground font-display text-lg mb-3">
            Stockpile Size
          </label>
          <div className="flex items-center justify-center gap-4">
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
          onClick={() => onStart(size)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-display text-xl py-6 rounded-xl shadow-lg"
        >
          Start Game
        </Button>
      </motion.div>
    </div>
  );
}
