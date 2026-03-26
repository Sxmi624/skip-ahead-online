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
  sm: 'w-10 h-14 sm:w-12 sm:h-16 text-xs sm:text-sm',
  md: 'w-14 h-20 sm:w-16 sm:h-22 text-base sm:text-lg',
  lg: 'w-16 h-24 sm:w-20 sm:h-28 text-lg sm:text-xl',
};

function getCardColor(value: CardType['value']): string {
  if (value === 'JOKER') return 'text-joker font-bold';
  if (['BLOCKER','STEAL','SKIP','BOMB','SWAP'].includes(value as string)) return 'text-white font-bold';
  if (value <= 4) return 'text-accent font-bold';
  if (value <= 8) return 'text-primary font-bold';
  return 'text-secondary font-bold';
}

const SPECIAL_CARDS: Record<string, any> = {
  BLOCKER: { emoji: '🚫', label: 'BLOCK',  bg: 'bg-red-700',    border: 'border-red-500' },
  STEAL:   { emoji: '🃏', label: 'STEAL',  bg: 'bg-amber-600',  border: 'border-amber-400' },
  SKIP:    { emoji: '⏭️', label: 'SKIP',   bg: 'bg-blue-700',   border: 'border-blue-400' },
  BOMB:    { emoji: '💣', label: 'BOMB',   bg: 'bg-orange-700', border: 'border-orange-400' },
  SWAP:    { emoji: '🔄', label: 'SWAP',   bg: 'bg-purple-700', border: 'border-purple-400' },
};

export default function GameCard({ card, faceDown, onClick, selected, size = 'md', count }: GameCardProps) {
  const sizeClass = sizeClasses[size];

  // Die Animation, wenn die Karte erscheint
  const appearance = {
    initial: { opacity: 0, y: 100, scale: 0.3, rotate: -10 },
    animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
    transition: { 
      type: "spring", 
      stiffness: 150, 
      damping: 15,
      mass: 0.8
    }
  };

  // Drag-Einstellungen
  const dragConfig = {
    drag: true,
    dragSnapToOrigin: true, // Karte springt zurück, wenn nicht auf Feld gedroppt
    whileDrag: { scale: 1.1, zIndex: 100, rotate: 5, cursor: 'grabbing' },
    dragTransition: { bounceStiffness: 600, bounceDamping: 20 },
    dragElastic: 0.4
  };

  const commonClasses = `${sizeClass} rounded-lg shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing relative border-2 transition-colors shrink-0`;

  if (!card && !faceDown) {
    return (
      <motion.div
        layout
        className={`${sizeClass} rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center`}
      >
        <span className="text-muted-foreground/40 text-[10px]">–</span>
      </motion.div>
    );
  }

  if (faceDown) {
    return (
      <motion.div 
        layout {...appearance}
        className={`${commonClasses} bg-card-back border-card-back`}
      >
        <span className="font-display text-primary-foreground/70 text-[10px] sm:text-xs">S·B</span>
        {count !== undefined && count > 0 && (
          <div className="absolute -top-2 -right-2 bg-gold text-secondary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">
            {count}
          </div>
        )}
      </motion.div>
    );
  }

  const special = card ? SPECIAL_CARDS[card.value as string] : undefined;

  return (
    <motion.div
      layout
      {...appearance}
      {...(onClick ? {} : dragConfig)} // Drag nur an, wenn kein einfacher Klick-Modus
      drag={true}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.5}
      dragSnapToOrigin={true}
      whileHover={{ y: -10, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onDragEnd={(_, info) => {
        // Hier prüfen wir später, ob die Karte über einem Feld losgelassen wurde
        if (Math.abs(info.offset.y) > 100 && onClick) {
          onClick(); // Simuliert das Ausspielen beim Hochwischen
        }
      }}
      className={`${commonClasses} ${special ? special.bg : 'bg-card'} ${
        selected ? 'border-gold ring-2 ring-gold/50' : special ? special.border : 'border-card/80'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center pointer-events-none">
        <span className={`font-display ${special ? 'text-2xl' : `text-xl ${getCardColor(card.value)}`}`}>
          {special ? special.emoji : (card?.value === 'JOKER' ? '★' : card?.value)}
        </span>
        {special && <span className="text-white/80 text-[7px] font-display uppercase">{special.label}</span>}
      </div>
    </motion.div>
  );
}