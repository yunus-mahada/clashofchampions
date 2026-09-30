import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { audioManager } from '../game/AudioManager';
import { Haptics } from '../utils/haptics';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Kembali',
  className = '',
  size = 'md',
  ariaLabel = 'Kembali',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioManager.playClick();
    Haptics.click();
    onClick();
  };

  const sizeClasses = {
    sm: 'min-h-[40px] px-3 py-1.5 text-xs gap-1.5',
    md: 'min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs gap-2',
    lg: 'min-h-[48px] min-w-[48px] px-4 py-2.5 text-sm gap-2',
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center font-bold rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:bg-slate-750 active:scale-95 border border-slate-750/90 hover:border-amber-500/40 text-slate-200 hover:text-white shadow-md backdrop-blur-md transition-all duration-150 select-none touch-manipulation cursor-pointer ${sizeClasses} ${className}`}
    >
      <ArrowLeft className="w-4 h-4 stroke-[2.5] text-amber-400 shrink-0" />
      {label && <span className="font-semibold tracking-wide">{label}</span>}
    </button>
  );
};
