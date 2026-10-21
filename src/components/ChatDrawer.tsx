import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Side } from '../game/types';
import { MessageSquare, Send, X, Smile } from 'lucide-react';

interface ChatDrawerProps {
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string, isEmote?: boolean) => void;
}

const QUICK_EMOTES = [
  '장군입니다!',
  '멍군입니다!',
  '한수 쉽니다.',
  '좋은 수네요!',
  '아뿔싸, 실수!',
  '잘 두었습니다.',
  '감사합니다!',
  '잠시 생각 중입니다.',
];

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  messages,
  isOpen,
  onClose,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  const handleEmoteClick = (emote: string) => {
    onSendMessage(emote, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg mx-auto bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl flex flex-col h-[70vh] max-h-[550px]">
        {/* Grab bar */}
        <div className="w-10 h-1.5 bg-slate-700 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-sm text-slate-100">대국 대화 및 상용구</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Janggi Emotes Bar */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-1.5 mb-2 text-xs text-slate-400 font-medium">
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span>장기 상용구 (터치하여 즉시 전송)</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {QUICK_EMOTES.map((emote, idx) => (
              <button
                key={idx}
                onClick={() => handleEmoteClick(emote)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 transition-all active:scale-95 whitespace-nowrap"
              >
                {emote}
              </button>
            ))}
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {messages.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              주고받은 대화가 없습니다. 상용구를 눌러 인사를 건네보세요!
            </div>
          ) : (
            messages.map(msg => {
              const isSystem = msg.senderSide === 'system';
              const isCho = msg.senderSide === 'cho';
              const isHan = msg.senderSide === 'han';

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center my-1.5">
                    <span className="text-[11px] text-amber-400/90 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-900/40 inline-block">
                      {msg.text}
                    </span>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex flex-col space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span
                      className={`font-semibold ${
                        isCho ? 'text-blue-400' : isHan ? 'text-red-400' : 'text-slate-400'
                      }`}
                    >
                      {msg.sender}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] self-start ${
                      msg.isEmote
                        ? 'bg-amber-950/40 text-amber-200 border border-amber-800/50 font-medium'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/50'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="대화 메시지 입력..."
            className="flex-1 h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            maxLength={80}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs flex items-center justify-center transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
