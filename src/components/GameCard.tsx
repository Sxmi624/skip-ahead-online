import { motion } from 'framer-motion';
import { Card as CardType } from '@/game/types';

interface GameCardProps {
  card?: CardType;
  faceDown?: boolean;
  onClick?: () => void;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
}

const sizeClasses = {
  sm: 'w-12 h-16 text-sm',
  md: 'w-16 h-22 text-lg',
  lg: 'w-20 h-28 text-xl',
};

function getCardColor(value: CardType['value']): string {
  if (value === 'JOKER') return 'text-joker font-bold';
  if (value <= 4) return 'text-accent font-bold';
  if (value <= 8) return 'text-primary font-bold';
  return 'text-secondary font-bold';
}

export default function GameCard({ card, faceDown, onClick, selected, size = 'md', count }: GameCardProps) {
  const sizeClass = sizeClasses[size];

  if (!card && !faceDown) {
    // Empty slot
    return (
      <div
        className={`${sizeClass} rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-gold/60 transition-colors`}
        onClick={onClick}
      >
        <span className="text-muted-foreground/40 text-xs">empty</span>
      </div>
    );
  }

  if (faceDown) {
    return (
      <div className={`${sizeClass} rounded-lg bg-card-back shadow-lg flex items-center justify-center relative border-2 border-card-back`}>
        <div className="absolute inset-1 rounded border border-foreground/10 flex items-center justify-center">
          <span className="font-display text-primary-foreground/70 text-xs">S·B</span>
        </div>
        {count !== undefined && count > 0 && (
          <div className="absolute -top-2 -right-2 bg-gold text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow">
            {count}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${sizeClass} rounded-lg bg-card shadow-lg flex items-center justify-center cursor-pointer relative border-2 transition-colors ${
        selected ? 'border-gold ring-2 ring-gold/50' : 'border-card/80 hover:border-gold/40'
      }`}
      onClick={onClick}
    >
      <span className={`font-display text-2xl ${card ? getCardColor(card.value) : ''}`}>
        {card?.value === 'JOKER' ? '★' : card?.value}
      </span>
      {card?.value === 'JOKER' && (
        <span className="absolute bottom-1 text-[8px] text-joker font-display">JOKER</span>
      )}
    </motion.div>
  );
}
