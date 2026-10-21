import React from 'react';
import { Move } from '../game/types';
import { X, Copy, Check } from 'lucide-react';

interface MoveHistoryModalProps {
  moves: Move[];
  isOpen: boolean;
  onClose: () => void;
}

export const MoveHistoryModal: React.FC<MoveHistoryModalProps> = ({
  moves,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyHistory = () => {
    const text = moves
      .map((m, idx) => `${idx + 1}. [${m.side === 'cho' ? '초' : '한'}] ${m.notation}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-100">대국 기보 (棋譜)</h3>
            <p className="text-xs text-slate-400">총 {moves.length}수 진행</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHistory}
              disabled={moves.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="기보 텍스트 복사"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사됨' : '복사'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Moves List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {moves.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              아직 착수된 기보가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-slate-800/60 font-mono text-xs">
              {moves.map((move, index) => {
                const isCho = move.side === 'cho';
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-1 hover:bg-slate-800/40 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 w-8 tabular-nums">
                        {(index + 1).toString().padStart(2, '0')}.
                      </span>
                      <span
                        className={`font-semibold ${
                          isCho ? 'text-blue-400' : 'text-red-400'
                        }`}
                      >
                        {isCho ? '초(楚)' : '한(漢)'}
                      </span>
                      <span className="text-slate-200">
                        {move.notation}
                      </span>
                    </div>
                    {move.captured && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 font-sans">
                        포획
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 font-medium text-xs transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
