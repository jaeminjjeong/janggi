import React from 'react';
import { Formation, PieceType, Side } from '../game/types';
import { FORMATION_SHORT_NAMES, PIECE_NAMES } from '../game/janggiEngine';
import { Clock, Shield } from 'lucide-react';

interface PlayerCardProps {
  side: Side;
  name: string;
  isCurrentTurn: boolean;
  score: number;
  timeLeft: number;
  byoyomiSeconds: number;
  byoyomiCount: number;
  formation: Formation;
  capturedPieces: PieceType[];
  useHanja?: boolean;
  isSelf?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  side,
  name,
  isCurrentTurn,
  score,
  timeLeft,
  byoyomiSeconds,
  byoyomiCount,
  formation,
  capturedPieces,
  useHanja = true,
  isSelf = false,
}) => {
  const isCho = side === 'cho';

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative w-full rounded-xl p-2.5 sm:p-3 transition-all ${
        isCurrentTurn
          ? isCho
            ? 'bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-blue-900/80 border-2 border-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-gradient-to-r from-red-950/80 via-slate-900/90 to-red-900/80 border-2 border-red-500 shadow-lg shadow-red-500/20'
          : 'bg-slate-900/70 border border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Emblem & Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Side Octagon Seal */}
          <div
            className={`w-9 h-9 shrink-0 flex items-center justify-center font-serif font-black text-sm shadow-md ${
              isCho
                ? 'bg-blue-600 text-white border border-blue-400'
                : 'bg-red-600 text-white border border-red-400'
            }`}
            style={{
              clipPath:
                'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
            }}
          >
            {isCho ? '楚' : '漢'}
          </div>

          {/* Name & Metadata */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-slate-100 truncate">
                {name}
              </span>
              {isSelf && (
                <span className="text-[10px] text-amber-400 font-medium">
                  (나)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate">
                {FORMATION_SHORT_NAMES[formation]}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-300 font-medium">
                {score.toFixed(1)}점
              </span>
            </div>
          </div>
        </div>

        {/* Right: Timer & Turn */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Captured pieces preview mini strip */}
          <div className="hidden sm:flex items-center gap-0.5 max-w-[120px] overflow-hidden">
            {capturedPieces.slice(-6).map((pt, i) => (
              <span
                key={i}
                className={`text-[11px] font-serif px-1 py-0.5 rounded ${
                  isCho ? 'bg-red-950/60 text-red-300' : 'bg-blue-950/60 text-blue-300'
                }`}
                title={PIECE_NAMES[pt].hangulCho}
              >
                {useHanja ? (isCho ? PIECE_NAMES[pt].hanjaHan : PIECE_NAMES[pt].hanjaCho) : PIECE_NAMES[pt].hangulCho}
              </span>
            ))}
          </div>

          {/* Clock Display */}
          <div
            className={`flex flex-col items-end px-2.5 py-1 rounded-lg ${
              isCurrentTurn
                ? isCho
                  ? 'bg-blue-900/50 text-blue-200'
                  : 'bg-red-900/50 text-red-200'
                : 'bg-slate-800/80 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1 font-mono text-sm font-bold tabular-nums">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            {timeLeft === 0 && (
              <span className="text-[10px] font-mono tabular-nums text-amber-400">
                초읽기 {byoyomiSeconds}초 ({byoyomiCount}회)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
