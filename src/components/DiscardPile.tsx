import { Card } from '@/game/types';
import GameCard from './GameCard';

interface DiscardPileProps {
  pile: Card[];
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selected?: boolean;
  maxVisible?: number;
}

const offsetMap = {
  sm: 20,
  md: 26,
  lg: 32,
};

export default function DiscardPile({ pile, size = 'lg', onClick, selected, maxVisible = 6 }: DiscardPileProps) {
  const offset = offsetMap[size];
  const visible = pile.slice(-maxVisible);
  const hiddenCount = pile.length - visible.length;
  const totalHeight = offset * (visible.length - 1) + (size === 'sm' ? 64 : size === 'md' ? 88 : 112);

  if (pile.length === 0) {
    return (
      <div className="text-center cursor-pointer" onClick={onClick}>
        <GameCard size={size} onClick={onClick} />
      </div>
    );
  }

  return (
    <div
      className="relative cursor-pointer"
      style={{ height: totalHeight, width: size === 'sm' ? 48 : size === 'md' ? 64 : 80 }}
      onClick={onClick}
    >
      {hiddenCount > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 text-[8px] text-muted-foreground bg-muted/80 rounded px-1 z-10"
          style={{ top: -12 }}
        >
          +{hiddenCount}
        </div>
      )}
      {visible.map((card, idx) => {
        const isTop = idx === visible.length - 1;
        return (
          <div
            key={card.id}
            className="absolute left-0"
            style={{ top: idx * offset, zIndex: idx }}
          >
            <GameCard
              card={card}
              size={size}
              selected={isTop && selected}
            />
          </div>
        );
      })}
    </div>
  );
}
