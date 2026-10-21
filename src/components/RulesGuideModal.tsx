import React from 'react';
import { BookOpen, X, Shield, Swords, Award } from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-100">한국 정통 장기 규칙 가이드</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Summary Box */}
          <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>한국 장기의 주요 특징</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              한국 장기는 10행 9열 격자의 선이 만나는 교차점 위에 기물을 놓으며, 초(楚·청)의 선공으로 시작합니다. 후공인 한(漢·홍)에게는 덤 1.5점이 주어집니다.
            </p>
          </div>

          {/* Piece Movements */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1">
              기물별 행마법 (이동 규칙)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-blue-400">차 (車) · 13점</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  전후좌우 장애물이 없는 한 무제한 직선 이동. 궁성 안에서는 대각선 선을 타고 가로지를 수 있습니다.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-amber-400">포 (包) · 7점</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  반드시 기물 1개를 다리삼아 넘어야 이동/포획 가능. <strong className="text-red-400">포는 포를 넘을 수 없고 포를 잡을 수 없습니다.</strong>
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-emerald-400">마 (馬) · 5점</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  1칸 직진 후 대각선 1칸(날 일자 日). 직진하는 길목(멱)에 기물이 있으면 갈 수 없습니다.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-cyan-400">상 (象) · 3점</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  1칸 직진 후 대각선 2칸(쓸 용자 用). 직진 멱이나 1차 대각선 멱이 막히면 갈 수 없습니다.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-purple-400">궁 (楚/漢) & 사 (士) · 3점</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  궁성(3×3) 내부에서만 선(직선 및 대각선)을 따라 1칸씩 이동합니다.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="font-bold text-rose-400">졸 / 병 (卒/兵) · 2점</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  전진 1칸 또는 좌우 1칸(후퇴 불가). 적 궁성에 진입하면 전진 대각선으로도 이동할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Formations */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1">
              초기 4대 포진 (차림)
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
              <li><strong className="text-slate-200">귀마 (마-상-상-마)</strong>: 가장 균형 잡히고 유연하여 프로 기사들도 애용하는 정통 포진</li>
              <li><strong className="text-slate-200">원앙마 (상-마-마-상)</strong>: 마가 중앙에 나란히 모여 서로를 지켜주는 두터운 방어형 포진</li>
              <li><strong className="text-slate-200">엇마 / 엇상</strong>: 좌우 비대칭으로 상대를 교란시키는 변칙 포진</li>
            </ul>
          </div>

          {/* Special Korean Rules */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-100 text-sm border-b border-slate-800 pb-1">
              한수 쉼 및 점수제 규칙
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              장군을 받지 않은 상태라면 자신의 차례를 건너뛰는 <strong>한수 쉼</strong>이 허용됩니다. 양 대국자가 연속으로 한수 쉼을 할 경우 즉시 대국이 종료되며, 남아있는 기물의 총점(한은 덤 1.5점 가산)으로 승패를 가립니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
