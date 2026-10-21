import React from 'react';
import { Piece, PieceType, Side } from '../game/types';
import { PIECE_NAMES } from '../game/janggiEngine';

interface JanggiPieceProps {
  piece: Piece;
  isSelected?: boolean;
  isLastMove?: boolean;
  isInCheck?: boolean;
  useHanja?: boolean;
  onClick?: () => void;
  size?: number; // px size
}

// Relative piece sizing according to traditional Janggi hierarchy:
// General (Largest) > Chariot, Cannon, Horse, Elephant (Medium) > Guard, Soldier (Small)
const PIECE_SIZE_MULTIPLIERS: Record<PieceType, number> = {
  general: 1.0,
  chariot: 0.9,
  cannon: 0.9,
  horse: 0.88,
  elephant: 0.88,
  guard: 0.78,
  soldier: 0.75,
};

export const JanggiPiece: React.FC<JanggiPieceProps> = ({
  piece,
  isSelected = false,
  isLastMove = false,
  isInCheck = false,
  useHanja = true,
  onClick,
  size = 44,
}) => {
  const isCho = piece.side === 'cho';
  const multiplier = PIECE_SIZE_MULTIPLIERS[piece.type];
  const pieceDiameter = Math.round(size * multiplier);

  // Inscribed text
  const names = PIECE_NAMES[piece.type];
  const char = useHanja
    ? (isCho ? names.hanjaCho : names.hanjaHan)
    : (isCho ? names.hangulCho : names.hangulHan);

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform duration-150 active:scale-95 ${
        isSelected ? 'z-20 scale-110 -translate-y-1' : 'z-10'
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      title={`${isCho ? '초(楚)' : '한(漢)'} ${names.hangulCho}`}
    >
      {/* Octagonal Janggi Stone */}
      <div
        className={`relative flex items-center justify-center font-bold shadow-md transition-all ${
          isCho
            ? 'bg-gradient-to-br from-[#f8fafc] via-[#e2e8f0] to-[#cbd5e1] border-2 border-[#1e3a8a] text-[#0f172a]'
            : 'bg-gradient-to-br from-[#fff1f2] via-[#ffe4e6] to-[#fecdd3] border-2 border-[#991b1b] text-[#881337]'
        } ${isSelected ? 'ring-4 ring-amber-400 shadow-xl' : ''} ${
          isLastMove ? 'ring-2 ring-amber-500/80 shadow-md' : ''
        } ${
          isInCheck ? 'ring-4 ring-red-600 animate-pulse' : ''
        }`}
        style={{
          width: `${pieceDiameter}px`,
          height: `${pieceDiameter}px`,
          clipPath:
            'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          boxShadow: isSelected
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.8)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
        }}
      >
        {/* Subtle inner octagonal rim */}
        <div
          className={`absolute inset-[3px] border pointer-events-none ${
            isCho ? 'border-[#3b82f6]/40' : 'border-[#ef4444]/40'
          }`}
          style={{
            clipPath:
              'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
          }}
        />

        {/* Traditional Inscribed Lettering */}
        <span
          className={`relative tracking-tight font-serif select-none ${
            isCho ? 'text-[#1e3a8a]' : 'text-[#b91c1c]'
          }`}
          style={{
            fontFamily: '"Noto Serif KR", serif',
            fontSize: `${Math.round(pieceDiameter * 0.52)}px`,
            fontWeight: piece.type === 'general' ? 900 : 700,
            textShadow: isCho
              ? '0 1px 0 rgba(255,255,255,0.8), 0 -1px 0 rgba(30,58,138,0.2)'
              : '0 1px 0 rgba(255,255,255,0.8), 0 -1px 0 rgba(185,28,28,0.2)',
          }}
        >
          {char}
        </span>
      </div>
    </div>
  );
};
