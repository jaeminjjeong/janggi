import React from 'react';
import { Formation, Side } from '../game/types';
import { FORMATION_NAMES } from '../game/janggiEngine';

interface FormationPickerProps {
  side: Side;
  selectedFormation: Formation;
  onSelect: (formation: Formation) => void;
  disabled?: boolean;
}

const FORMATIONS: { id: Formation; label: string; desc: string; order: string[] }[] = [
  {
    id: 'MSSM',
    label: '귀마 (안상차림)',
    desc: '가장 대중적이고 유연한 정통 포진',
    order: ['車', '馬', '象', '士', '', '士', '象', '馬', '車'],
  },
  {
    id: 'SMMS',
    label: '원앙마 (바깥상차림)',
    desc: '마가 중앙을 단단히 지키는 견고한 방어형',
    order: ['車', '象', '馬', '士', '', '士', '馬', '象', '車'],
  },
  {
    id: 'MSMS',
    label: '엇마 (왼마오마)',
    desc: '좌우 비대칭으로 기습 공격에 능한 포진',
    order: ['車', '馬', '象', '士', '', '士', '馬', '象', '車'],
  },
  {
    id: 'SMSM',
    label: '엇상 (왼상오상)',
    desc: '상을 전진 배치하여 상대 멱을 노리는 포진',
    order: ['車', '象', '馬', '士', '', '士', '象', '馬', '車'],
  },
];

export const FormationPicker: React.FC<FormationPickerProps> = ({
  side,
  selectedFormation,
  onSelect,
  disabled = false,
}) => {
  const isCho = side === 'cho';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>초기 포진 (차림) 선택</span>
        <span className="text-slate-500 font-mono text-[11px]">
          {FORMATION_NAMES[selectedFormation]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {FORMATIONS.map(item => {
          const isSelected = selectedFormation === item.id;
          return (
            <button
              key={item.id}
              disabled={disabled}
              onClick={() => onSelect(item.id)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? isCho
                    ? 'bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                    : 'bg-red-950/60 border-red-500 ring-2 ring-red-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {item.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                {item.desc}
              </p>

              {/* Mini back rank visual illustration */}
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800/80 text-[10px] font-serif text-slate-400">
                {item.order.map((char, idx) => (
                  <span
                    key={idx}
                    className={`w-3.5 text-center ${
                      char === '馬'
                        ? 'text-amber-400 font-bold'
                        : char === '象'
                        ? 'text-cyan-400 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {char || '·'}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
