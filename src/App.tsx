import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AIDifficulty,
  BoardState,
  ChatMessage,
  Formation,
  GameMode,
  Move,
  Piece,
  Position,
  RoomInfo,
  Side,
  WSMessage,
} from './game/types';
import {
  applyMove,
  applyPass,
  createInitialGameState,
  getLegalMoves,
} from './game/janggiEngine';
import { computeAIMove } from './game/janggiAI';
import { soundManager } from './utils/audio';
import { JanggiBoard } from './components/JanggiBoard';
import { PlayerCard } from './components/PlayerCard';
import { GameControls } from './components/GameControls';
import { OnlineLobbyModal } from './components/OnlineLobbyModal';
import { MoveHistoryModal } from './components/MoveHistoryModal';
import { ChatDrawer } from './components/ChatDrawer';
import { GameOverModal } from './components/GameOverModal';
import { RulesGuideModal } from './components/RulesGuideModal';
import {
  Swords,
  Bot,
  Users,
  BookOpen,
  MessageSquare,
  Sparkles,
  Wifi,
  WifiOff,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import heroBannerImg from './assets/images/janggi_hero_banner_1792546837716.jpg';

export default function App() {
  // Game Setup & Mode
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal');
  const [playerSide, setPlayerSide] = useState<Side>('cho'); // In AI mode: user side
  const [playerName, setPlayerName] = useState('기객_' + Math.floor(1000 + Math.random() * 9000));
  const [playerFormation, setPlayerFormation] = useState<Formation>('MSSM');
  const [opponentFormation, setOpponentFormation] = useState<Formation>('MSSM');

  // Board & Selection State
  const [gameState, setGameState] = useState<BoardState>(() =>
    createInitialGameState('MSSM', 'MSSM')
  );
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [useHanja, setUseHanja] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Timers (for offline / AI mode)
  const [choTime, setChoTime] = useState(600); // 10 minutes
  const [hanTime, setHanTime] = useState(600);
  const [choByo, setChoByo] = useState(30);
  const [hanByo, setHanByo] = useState(30);
  const [choByoCount, setChoByoCount] = useState(3);
  const [hanByoCount, setHanByoCount] = useState(3);

  // Online Multiplayer State
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [onlineYourSide, setOnlineYourSide] = useState<Side | 'spectator'>('cho');
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);
  const [incomingDrawOffer, setIncomingDrawOffer] = useState<Side | null>(null);
  const [incomingRematch, setIncomingRematch] = useState<Side | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Modals
  const [showLobby, setShowLobby] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);

  // AI Thinking State
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Sound sync
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Handle Game Over modal trigger
  useEffect(() => {
    if (gameState.winner) {
      soundManager.playVictory();
      setShowGameOver(true);
    }
  }, [gameState.winner]);

  // Handle Check alert sound
  useEffect(() => {
    if (gameState.isCheck && !gameState.winner) {
      soundManager.playCheck();
    }
  }, [gameState.isCheck, gameState.winner]);

  // Offline timer interval for AI & Pass-and-play
  useEffect(() => {
    if (gameMode === 'online' || gameState.winner) return;

    const timer = setInterval(() => {
      if (gameState.turn === 'cho') {
        setChoTime(prev => {
          if (prev > 0) return prev - 1;
          setChoByo(b => {
            if (b > 1) return b - 1;
            setChoByoCount(c => {
              if (c > 1) {
                setChoByo(30);
                return c - 1;
              }
              // Timeout!
              setGameState(s => ({
                ...s,
                winner: 'han',
                winReason: '초(楚) 시간패',
              }));
              return 0;
            });
            return 0;
          });
          return 0;
        });
      } else {
        setHanTime(prev => {
          if (prev > 0) return prev - 1;
          setHanByo(b => {
            if (b > 1) return b - 1;
            setHanByoCount(c => {
              if (c > 1) {
                setHanByo(30);
                return c - 1;
              }
              // Timeout!
              setGameState(s => ({
                ...s,
                winner: 'cho',
                winReason: '한(漢) 시간패',
              }));
              return 0;
            });
            return 0;
          });
          return 0;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode, gameState.turn, gameState.winner]);

  // AI Turn Trigger
  useEffect(() => {
    if (gameMode !== 'ai' || gameState.winner) return;

    const aiSide: Side = playerSide === 'cho' ? 'han' : 'cho';
    if (gameState.turn === aiSide && !isAiThinking) {
      setIsAiThinking(true);
      const thinkTime = 500 + Math.random() * 400;

      const timer = setTimeout(() => {
        const move = computeAIMove(gameState, aiDifficulty);
        if (move) {
          if (move.isPass) {
            const { nextState } = applyPass(gameState, aiSide);
            setGameState(nextState);
            soundManager.playMove();
          } else {
            const targetPiece = gameState.pieces.find(p => p.r === move.to.r && p.c === move.to.c);
            const { nextState, valid } = applyMove(gameState, move.from, move.to);
            if (valid) {
              setGameState(nextState);
              if (targetPiece) {
                soundManager.playCapture();
              } else {
                soundManager.playMove();
              }
            }
          }
        }
        setIsAiThinking(false);
      }, thinkTime);

      return () => clearTimeout(timer);
    }
  }, [gameState, gameMode, playerSide, aiDifficulty, isAiThinking]);

  // Online WebSocket Connection Management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onmessage = event => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        if (msg.type === 'room_state') {
          setCurrentRoom(msg.room);
          setGameState(msg.gameState);
          setOnlineYourSide(msg.yourSide);
          if (msg.yourSide === 'han') {
            setIsFlipped(true); // Flip board for Han player
          }
        } else if (msg.type === 'game_update') {
          setGameState(msg.gameState);
          setSelectedPos(null);
          setValidMoves([]);
          if (msg.move?.captured) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }
        } else if (msg.type === 'time_sync') {
          setChoTime(msg.choTime);
          setHanTime(msg.hanTime);
          setChoByo(msg.choByo);
          setHanByo(msg.hanByo);
        } else if (msg.type === 'chat_broadcast') {
          setChatMessages(prev => [...prev, msg.message]);
          if (!showChat) {
            setHasUnreadChat(true);
          }
        } else if (msg.type === 'draw_offered') {
          setIncomingDrawOffer(msg.fromSide);
        } else if (msg.type === 'rematch_requested') {
          setIncomingRematch(msg.fromSide);
        } else if (msg.type === 'error_msg') {
          alert(msg.message);
        }
      } catch {
        // Parse error
      }
    };
  }, [showChat]);

  // Start new local or AI match
  const startNewGame = (mode: GameMode, userSide: Side = 'cho', diff: AIDifficulty = 'normal') => {
    setGameMode(mode);
    setPlayerSide(userSide);
    setAiDifficulty(diff);
    setIsFlipped(userSide === 'han');

    const initialState = createInitialGameState(playerFormation, opponentFormation);
    setGameState(initialState);
    setSelectedPos(null);
    setValidMoves([]);

    // Reset clocks
    setChoTime(600);
    setHanTime(600);
    setChoByo(30);
    setHanByo(30);
    setChoByoCount(3);
    setHanByoCount(3);

    setShowGameOver(false);
  };

  // Online quick match handler
  const handleQuickMatch = () => {
    setGameMode('online');
    connectWebSocket();
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'quick_match',
            playerName,
            formation: playerFormation,
          })
        );
      }
    }, 200);
  };

  const handleCreateRoom = (timeMinutes: number) => {
    setGameMode('online');
    connectWebSocket();
    const customRoomId = `ROOM_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'join_room',
            roomId: customRoomId,
            playerName,
            formation: playerFormation,
          })
        );
      }
    }, 200);
  };

  const handleJoinRoom = (roomId: string) => {
    setGameMode('online');
    connectWebSocket();
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'join_room',
            roomId,
            playerName,
            formation: playerFormation,
          })
        );
      }
    }, 200);
  };

  // Online Ready toggle
  const handleToggleReady = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'player_ready' }));
    }
  };

  // Piece Selection on board
  const handleSelectPiece = (piece: Piece) => {
    if (gameState.winner) return;

    const currentTurn = gameState.turn;

    // Check if it's the current player's side
    if (gameMode === 'online') {
      if (onlineYourSide !== currentTurn) return;
      if (piece.side !== onlineYourSide) return;
    } else if (gameMode === 'ai') {
      if (piece.side !== playerSide || currentTurn !== playerSide) return;
    } else {
      // pass and play
      if (piece.side !== currentTurn) return;
    }

    if (selectedPos && selectedPos.r === piece.r && selectedPos.c === piece.c) {
      // Deselect
      setSelectedPos(null);
      setValidMoves([]);
      return;
    }

    setSelectedPos({ r: piece.r, c: piece.c });
    const moves = getLegalMoves(piece, gameState.pieces);
    setValidMoves(moves);
  };

  // Make move on board
  const handleMakeMove = (to: Position) => {
    if (!selectedPos || gameState.winner) return;

    if (gameMode === 'online') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'make_move',
            from: selectedPos,
            to,
          })
        );
      }
      setSelectedPos(null);
      setValidMoves([]);
      return;
    }

    // Local / AI mode
    const targetPiece = gameState.pieces.find(p => p.r === to.r && p.c === to.c);
    const { nextState, valid } = applyMove(gameState, selectedPos, to);

    if (valid) {
      setGameState(nextState);
      setSelectedPos(null);
      setValidMoves([]);

      if (targetPiece) {
        soundManager.playCapture();
      } else {
        soundManager.playMove();
      }

      // Reset byoyomi for that side
      if (gameState.turn === 'cho' && choTime === 0) setChoByo(30);
      if (gameState.turn === 'han' && hanTime === 0) setHanByo(30);
    }
  };

  // Pass turn
  const handlePass = () => {
    if (gameState.winner) return;

    if (gameMode === 'online') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'pass_turn' }));
      }
      return;
    }

    const { nextState, valid } = applyPass(gameState, gameState.turn);
    if (valid) {
      setGameState(nextState);
      soundManager.playMove();
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  // Resign
  const handleResign = () => {
    if (gameState.winner) return;
    if (!confirm('정말 기권하시겠습니까?')) return;

    if (gameMode === 'online') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'resign' }));
      }
      return;
    }

    const resigningSide = gameMode === 'ai' ? playerSide : gameState.turn;
    const winner: Side = resigningSide === 'cho' ? 'han' : 'cho';
    setGameState(prev => ({
      ...prev,
      winner,
      winReason: `${resigningSide === 'cho' ? '초(楚)' : '한(漢)'} 기권승`,
    }));
  };

  // Offer Draw
  const handleOfferDraw = () => {
    if (gameState.winner) return;

    if (gameMode === 'online') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'offer_draw' }));
        alert('상대방에게 무승부를 신청했습니다.');
      }
      return;
    }

    if (confirm('무승부에 합의하시겠습니까?')) {
      setGameState(prev => ({
        ...prev,
        winner: 'draw',
        winReason: '양자 합의 무승부',
      }));
    }
  };

  // Rematch
  const handleRematch = () => {
    if (gameMode === 'online') {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'request_rematch' }));
        setShowGameOver(false);
        alert('상대방에게 재대국을 요청했습니다.');
      }
      return;
    }

    // AI or Local: Swap sides or restart
    const nextSide: Side = playerSide === 'cho' ? 'han' : 'cho';
    startNewGame(gameMode, nextSide, aiDifficulty);
  };

  // Chat message send
  const handleSendMessage = (text: string, isEmote?: boolean) => {
    if (gameMode === 'online' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'send_chat', text, isEmote }));
    } else {
      // Local chat log
      const newMsg: ChatMessage = {
        id: `chat_${Date.now()}`,
        sender: playerName,
        senderSide: playerSide,
        text,
        timestamp: Date.now(),
        isEmote,
      };
      setChatMessages(prev => [...prev, newMsg]);
    }
  };

  // Determine active turn identity
  const isMyTurn =
    gameMode === 'online'
      ? onlineYourSide === gameState.turn
      : gameMode === 'ai'
      ? playerSide === gameState.turn
      : true;

  // Determine which player is Top vs Bottom on screen
  const isOpponentCho = isFlipped;
  const topPlayerSide: Side = isOpponentCho ? 'cho' : 'han';
  const bottomPlayerSide: Side = isOpponentCho ? 'han' : 'cho';

  const getPlayerDetails = (side: Side) => {
    if (gameMode === 'online' && currentRoom) {
      const p = side === 'cho' ? currentRoom.choPlayer : currentRoom.hanPlayer;
      return {
        name: p?.name || (side === 'cho' ? '초(楚) 대기중' : '한(漢) 대기중'),
        formation: p?.formation || 'MSSM',
        isReady: p?.isReady ?? false,
      };
    }
    if (gameMode === 'ai') {
      if (side === playerSide) {
        return { name: playerName, formation: playerFormation, isReady: true };
      }
      return {
        name: `한빛 AI (${aiDifficulty === 'easy' ? '초급' : aiDifficulty === 'normal' ? '중급' : '고급'})`,
        formation: opponentFormation,
        isReady: true,
      };
    }
    // Pass and play
    return {
      name: side === 'cho' ? '초(楚) 플레이어' : '한(漢) 플레이어',
      formation: side === 'cho' ? playerFormation : opponentFormation,
      isReady: true,
    };
  };

  const topDetails = getPlayerDetails(topPlayerSide);
  const bottomDetails = getPlayerDetails(bottomPlayerSide);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Universal Top Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="font-serif font-black text-lg sm:text-xl text-amber-500 tracking-tight whitespace-nowrap"
              style={{ fontFamily: '"Noto Serif KR", serif' }}
            >
              한빛 온라인 장기
            </span>
            {gameMode === 'online' && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                {isConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                )}
              </span>
            )}
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => setShowLobby(true)}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              온라인 대국실
            </button>
            <button
              onClick={() => startNewGame('ai', 'cho', 'normal')}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              인공지능 AI 대국
            </button>
            <button
              onClick={() => startNewGame('pass_and_play')}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              2인 맞대국
            </button>
            <button
              onClick={() => setShowRules(true)}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
            >
              장기 규칙
            </button>
          </nav>

          {/* Zone 3: Primary Action CTA */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowLobby(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md shadow-amber-600/20 active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>대국실 로비</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-2 sm:p-4 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4">
        {/* Left Column: Janggi Board Area */}
        <div className="w-full max-w-[500px] flex flex-col items-center">
          {/* Top Player Card (Opponent) */}
          <div className="w-full mb-1">
            <PlayerCard
              side={topPlayerSide}
              name={topDetails.name}
              isCurrentTurn={gameState.turn === topPlayerSide}
              score={gameState.scores[topPlayerSide]}
              timeLeft={topPlayerSide === 'cho' ? choTime : hanTime}
              byoyomiSeconds={topPlayerSide === 'cho' ? choByo : hanByo}
              byoyomiCount={topPlayerSide === 'cho' ? choByoCount : hanByoCount}
              formation={topDetails.formation}
              capturedPieces={topPlayerSide === 'cho' ? gameState.capturedCho : gameState.capturedHan}
              useHanja={useHanja}
              isSelf={gameMode === 'online' && onlineYourSide === topPlayerSide}
            />
          </div>

          {/* Status Kicker banner (e.g. 장군! / AI 수읽기 중 / 차례 알림) */}
          <div className="w-full flex items-center justify-between px-2 py-1 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold ${
                  gameState.turn === 'cho' ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                {gameState.turn === 'cho' ? '초(楚) 차례' : '한(漢) 차례'}
              </span>
              {isAiThinking && (
                <span className="text-amber-400 animate-pulse text-[11px] font-medium">
                  AI 수읽기 중...
                </span>
              )}
            </div>

            {gameState.isCheck && !gameState.winner && (
              <span className="px-2 py-0.5 rounded-full bg-red-600/90 text-white font-bold text-[11px] animate-bounce shadow-md">
                장군! (Check)
              </span>
            )}

            {gameMode === 'online' && currentRoom?.status === 'waiting' && (
              <span className="text-amber-400 text-[11px]">상대방 대기 중...</span>
            )}
          </div>

          {/* The Authentic Janggi Board */}
          <JanggiBoard
            gameState={gameState}
            selectedPos={selectedPos}
            validMoves={validMoves}
            playerSide={gameMode === 'online' ? onlineYourSide : playerSide}
            isFlipped={isFlipped}
            useHanja={useHanja}
            onSelectPiece={handleSelectPiece}
            onMakeMove={handleMakeMove}
          />

          {/* Bottom Player Card (You / Current) */}
          <div className="w-full mt-1">
            <PlayerCard
              side={bottomPlayerSide}
              name={bottomDetails.name}
              isCurrentTurn={gameState.turn === bottomPlayerSide}
              score={gameState.scores[bottomPlayerSide]}
              timeLeft={bottomPlayerSide === 'cho' ? choTime : hanTime}
              byoyomiSeconds={bottomPlayerSide === 'cho' ? choByo : hanByo}
              byoyomiCount={bottomPlayerSide === 'cho' ? choByoCount : hanByoCount}
              formation={bottomDetails.formation}
              capturedPieces={bottomPlayerSide === 'cho' ? gameState.capturedCho : gameState.capturedHan}
              useHanja={useHanja}
              isSelf={gameMode === 'online' ? onlineYourSide === bottomPlayerSide : true}
            />
          </div>

          {/* Online Ready Button if in setup stage */}
          {gameMode === 'online' && currentRoom?.status === 'ready' && (
            <div className="w-full mt-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-300">
                양 대국자 준비 시 즉시 대국이 시작됩니다.
              </span>
              <button
                onClick={handleToggleReady}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  (onlineYourSide === 'cho'
                    ? currentRoom.choPlayer?.isReady
                    : currentRoom.hanPlayer?.isReady)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 text-white animate-pulse'
                }`}
              >
                {(onlineYourSide === 'cho'
                  ? currentRoom.choPlayer?.isReady
                  : currentRoom.hanPlayer?.isReady)
                  ? '준비 완료'
                  : '준비하기'}
              </button>
            </div>
          )}

          {/* Game Thumb Controls */}
          <GameControls
            isMyTurn={isMyTurn}
            isInCheck={gameState.isCheck}
            isGameActive={!gameState.winner}
            soundEnabled={soundEnabled}
            useHanja={useHanja}
            isFlipped={isFlipped}
            onPass={handlePass}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            onToggleSound={() => setSoundEnabled(v => !v)}
            onToggleHanja={() => setUseHanja(v => !v)}
            onToggleFlip={() => setIsFlipped(v => !v)}
            onOpenHistory={() => setShowHistory(true)}
          />
        </div>

        {/* Right Column (Desktop Sidebar / Mode Selector & Information) */}
        <div className="w-full max-w-[500px] lg:max-w-xs space-y-4">
          {/* Quick Matchmaking & AI Card */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>대국 모드 선택</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {gameMode === 'online'
                  ? '온라인 대전'
                  : gameMode === 'ai'
                  ? '인공지능 대전'
                  : '2인 맞대국'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setShowLobby(true)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                  gameMode === 'online'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                온라인
              </button>
              <button
                onClick={() => startNewGame('ai', playerSide, aiDifficulty)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                  gameMode === 'ai'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                AI 대전
              </button>
              <button
                onClick={() => startNewGame('pass_and_play')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                  gameMode === 'pass_and_play'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                2인 대국
              </button>
            </div>

            {/* AI Difficulty Selector if in AI mode */}
            {gameMode === 'ai' && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <label className="text-[11px] text-slate-400 block font-medium">
                  인공지능 난이도
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['easy', 'normal', 'hard'] as AIDifficulty[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => {
                        setAiDifficulty(diff);
                        startNewGame('ai', playerSide, diff);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        aiDifficulty === diff
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {diff === 'easy' ? '초급' : diff === 'normal' ? '중급' : '고급'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Chat / Emote shortcut box */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>장기 인사말</span>
              </h3>
              <button
                onClick={() => {
                  setShowChat(true);
                  setHasUnreadChat(false);
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
              >
                대화창 열기
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {['장군입니다!', '멍군입니다!', '한수 쉽니다.', '잘 두었습니다.'].map(txt => (
                <button
                  key={txt}
                  onClick={() => handleSendMessage(txt, true)}
                  className="py-1.5 px-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs text-left truncate transition-colors active:scale-95"
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>

          {/* Traditional Janggi Hero Banner card */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            <img
              src={heroBannerImg}
              alt="한국 정통 장기 대국"
              className="w-full h-32 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-3 flex flex-col justify-end">
              <span className="text-xs font-bold text-amber-400">
                한국 정통 장기의 멋과 깊이
              </span>
              <p className="text-[10px] text-slate-300 line-clamp-1">
                초(楚)와 한(漢)의 천하패권을 다투는 정통 수읽기
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Trigger Button for Mobile (Thumb friendly) */}
      <div className="fixed bottom-4 right-4 z-30 lg:hidden">
        <button
          onClick={() => {
            setShowChat(true);
            setHasUnreadChat(false);
          }}
          className="relative w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center active:scale-95 transition-all"
          title="대화 및 상용구"
        >
          <MessageSquare className="w-5 h-5" />
          {hasUnreadChat && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-950" />
          )}
        </button>
      </div>

      {/* Draw Offer Notification Modal */}
      {incomingDrawOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="font-bold text-sm text-slate-100">무승부 신청</h4>
            <p className="text-xs text-slate-300">
              상대방이 무승부를 요청했습니다. 수락하시겠습니까?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'respond_draw', accept: true }));
                  }
                  setIncomingDrawOffer(null);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                수락
              </button>
              <button
                onClick={() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'respond_draw', accept: false }));
                  }
                  setIncomingDrawOffer(null);
                }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rematch Request Notification Modal */}
      {incomingRematch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs text-center space-y-3">
            <RotateCcw className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="font-bold text-sm text-slate-100">재대국 요청</h4>
            <p className="text-xs text-slate-300">
              상대방이 진영을 바꾸어 다시 대국하기를 요청했습니다.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'request_rematch' }));
                  }
                  setIncomingRematch(null);
                }}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
              >
                수락 및 시작
              </button>
              <button
                onClick={() => setIncomingRematch(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                거절
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals & Drawers */}
      <OnlineLobbyModal
        isOpen={showLobby}
        onClose={() => setShowLobby(false)}
        playerName={playerName}
        onUpdatePlayerName={setPlayerName}
        playerFormation={playerFormation}
        onUpdateFormation={setPlayerFormation}
        onQuickMatch={handleQuickMatch}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />

      <MoveHistoryModal
        moves={gameState.moveHistory}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <ChatDrawer
        messages={chatMessages}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        onSendMessage={handleSendMessage}
      />

      <RulesGuideModal
        isOpen={showRules}
        onClose={() => setShowRules(false)}
      />

      <GameOverModal
        winner={gameState.winner}
        winReason={gameState.winReason}
        scores={gameState.scores}
        playerSide={gameMode === 'online' ? onlineYourSide : playerSide}
        isOpen={showGameOver}
        onRematch={handleRematch}
        onOpenHistory={() => setShowHistory(true)}
        onClose={() => setShowGameOver(false)}
      />
    </div>
  );
}
