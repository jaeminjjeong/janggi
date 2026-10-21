import React, { useState, useEffect } from 'react';
import { Formation, RoomInfo, Side } from '../game/types';
import { FormationPicker } from './FormationPicker';
import { Users, Swords, Plus, LogIn, RefreshCw, X, Sparkles } from 'lucide-react';

interface OnlineLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  playerFormation: Formation;
  onUpdateFormation: (f: Formation) => void;
  onQuickMatch: () => void;
  onCreateRoom: (timeMinutes: number) => void;
  onJoinRoom: (roomId: string) => void;
}

export const OnlineLobbyModal: React.FC<OnlineLobbyModalProps> = ({
  isOpen,
  onClose,
  playerName,
  onUpdatePlayerName,
  playerFormation,
  onUpdateFormation,
  onQuickMatch,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'rooms' | 'create'>('quick');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [timeControl, setTimeControl] = useState<number>(10);
  const [roomsList, setRoomsList] = useState<RoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRoomsList(data.rooms || []);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'rooms') {
      fetchRooms();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-base text-slate-100">온라인 대국실 로비</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Profile & Formation Setup */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              내 기객명 (닉네임)
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => onUpdatePlayerName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              placeholder="닉네임 입력 (최대 12자)"
              maxLength={12}
            />
          </div>

          <FormationPicker
            side="cho"
            selectedFormation={playerFormation}
            onSelect={onUpdateFormation}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-2 bg-slate-950/40 border-b border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>빠른 매칭</span>
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'rooms'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>대국실 목록</span>
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>방 만들기</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeTab === 'quick' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Swords className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">실시간 빠른 대국</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  접속 중인 기객과 1:1로 즉시 매칭되거나 새로운 공개 대국실이 열립니다.
                </p>
              </div>

              <button
                onClick={() => {
                  onQuickMatch();
                  onClose();
                }}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-600/30 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>대국 찾기 시작</span>
              </button>

              {/* Join with code box */}
              <div className="pt-4 border-t border-slate-800 text-left">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  초대 코드로 특정 방 입장
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="예: ROOM_ABC123"
                    className="flex-1 h-10 px-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => {
                      if (roomCodeInput.trim()) {
                        onJoinRoom(roomCodeInput.trim());
                        onClose();
                      }
                    }}
                    disabled={!roomCodeInput.trim()}
                    className="px-4 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium transition-colors"
                  >
                    입장
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rooms' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>실시간 열린 방 목록</span>
                <button
                  onClick={fetchRooms}
                  disabled={isLoadingRooms}
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                  <span>새로고침</span>
                </button>
              </div>

              {roomsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  현재 대기 중인 공개 대국실이 없습니다.
                  <br />새로운 방을 만들어 상대를 기다려보세요!
                </div>
              ) : (
                <div className="space-y-2">
                  {roomsList.map(r => (
                    <div
                      key={r.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-200 truncate">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          제한시간 {r.initialTimeMinutes}분 · 관전자 {r.spectatorCount}명
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onJoinRoom(r.id);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors shrink-0"
                      >
                        {r.status === 'playing' ? '관전하기' : '대국 입장'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  대국 제한시간 설정
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setTimeControl(mins)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        timeControl === mins
                          ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {mins}분 (초읽기 30초)
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  onCreateRoom(timeControl);
                  onClose();
                }}
                className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
              >
                대국실 개설하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
