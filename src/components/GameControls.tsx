import React from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  History,
  Languages,
  Flag,
  Handshake,
  SkipForward,
} from 'lucide-react';

interface GameControlsProps {
  isMyTurn: boolean;
  isInCheck: boolean;
  isGameActive: boolean;
  soundEnabled: boolean;
  useHanja: boolean;
  isFlipped: boolean;
  onPass: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onToggleSound: () => void;
  onToggleHanja: () => void;
  onToggleFlip: () => void;
  onOpenHistory: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  isMyTurn,
  isInCheck,
  isGameActive,
  soundEnabled,
  useHanja,
  isFlipped,
  onPass,
  onResign,
  onOfferDraw,
  onToggleSound,
  onToggleHanja,
  onToggleFlip,
  onOpenHistory,
}) => {
  return (
    <div className="w-full max-w-[500px] mx-auto mt-2">
      {/* Primary Actions (Pass / Resign / Draw) */}
      <div className="grid grid-cols-3 gap-2 mb-2">
        {/* Pass Button (한수 쉼) */}
        <button
          onClick={onPass}
          disabled={!isGameActive || !isMyTurn || isInCheck}
          className={`flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm ${
            !isGameActive || !isMyTurn || isInCheck
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-amber-600 hover:bg-amber-500 active:scale-95 text-white shadow-amber-600/20'
          }`}
          title={isInCheck ? '장군 상태에서는 한수 쉼 불가' : '한수 쉼 (차례 넘기기)'}
        >
          <SkipForward className="w-4 h-4 shrink-0" />
          <span className="truncate">한수 쉼</span>
        </button>

        {/* Draw Offer Button (무승부) */}
        <button
          onClick={onOfferDraw}
          disabled={!isGameActive}
          className={`flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm ${
            !isGameActive
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700'
          }`}
        >
          <Handshake className="w-4 h-4 shrink-0 text-slate-400" />
          <span className="truncate">무승부 신청</span>
        </button>

        {/* Resign Button (기권) */}
        <button
          onClick={onResign}
          disabled={!isGameActive}
          className={`flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm ${
            !isGameActive
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 active:scale-95 text-rose-200'
          }`}
        >
          <Flag className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="truncate">기권</span>
        </button>
      </div>

      {/* Utility Bar (Settings & Inspection) */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
        {/* Toggle Hanja / Hangul */}
        <button
          onClick={onToggleHanja}
          className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="기물 표기 방식 (한자 / 한글)"
        >
          <Languages className="w-3.5 h-3.5 text-amber-400" />
          <span>{useHanja ? '한자 (漢字)' : '한글 (궁/차/포)'}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-800" />

        {/* Flip Board */}
        <button
          onClick={onToggleFlip}
          className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="장기판 상하 회전"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span>{isFlipped ? '한(漢) 시점' : '초(楚) 시점'}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-800" />

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="효과음 켜기/끄기"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>소리 ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span>소리 OFF</span>
            </>
          )}
        </button>

        <div className="w-[1px] h-4 bg-slate-800" />

        {/* Move History */}
        <button
          onClick={onOpenHistory}
          className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="기보 보기"
        >
          <History className="w-3.5 h-3.5 text-purple-400" />
          <span>기보</span>
        </button>
      </div>
    </div>
  );
};
