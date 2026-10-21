import React from 'react';
import { Side } from '../game/types';
import { Trophy, RotateCcw, Share2, Award, History } from 'lucide-react';

interface GameOverModalProps {
  winner: Side | 'draw' | null;
  winReason?: string;
  scores: { cho: number; han: number };
  playerSide?: Side | 'spectator';
  isOpen: boolean;
  onRematch: () => void;
  onOpenHistory: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  winReason,
  scores,
  playerSide = 'cho',
  isOpen,
  onRematch,
  onOpenHistory,
  onClose,
}) => {
  if (!isOpen || !winner) return null;

  const isDraw = winner === 'draw';
  const isWinner = !isDraw && winner === playerSide;
  const isChoWinner = winner === 'cho';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-center space-y-4">
        {/* Victory/Defeat Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
            isDraw
              ? 'bg-slate-800 text-slate-300 border border-slate-700'
              : isWinner
              ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-white shadow-amber-500/30'
              : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
          }`}
        >
          {isDraw ? <Award className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
        </div>

        <div>
          <h3 className="text-xl font-black text-white font-serif">
            {isDraw
              ? '무승부'
              : isWinner
              ? '대국 승리!'
              : `${isChoWinner ? '초(楚)' : '한(漢)'} 승리`}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {winReason || '대국이 종료되었습니다.'}
          </p>
        </div>

        {/* Score comparison card */}
        <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-around">
          <div>
            <div className="text-xs font-semibold text-blue-400">초(楚) 점수</div>
            <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
              {scores.cho.toFixed(1)}점
            </div>
          </div>
          <div className="text-xs text-slate-600 font-bold">VS</div>
          <div>
            <div className="text-xs font-semibold text-red-400">한(漢) 점수 (덤 1.5)</div>
            <div className="font-mono text-lg font-bold text-slate-100 tabular-nums">
              {scores.han.toFixed(1)}점
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={onRematch}
            className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>재대국 신청</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenHistory();
            }}
            className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>기보 복기하기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
