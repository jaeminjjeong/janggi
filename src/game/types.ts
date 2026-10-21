export type Side = 'cho' | 'han';

export type PieceType = 'general' | 'guard' | 'chariot' | 'cannon' | 'horse' | 'elephant' | 'soldier';

export interface Position {
  r: number; // 0 to 9 (0: Han back rank, 9: Cho back rank)
  c: number; // 0 to 8
}

export interface Piece {
  id: string;
  type: PieceType;
  side: Side;
  r: number;
  c: number;
}

// 4 classic opening formations for Cho / Han (left-to-right setup of Ma and Sang on back ranks):
// MSMS: 마 - 상 - 마 - 상 (왼마오마 / 엇마)
// SMSM: 상 - 마 - 상 - 마 (왼상오상 / 엇상)
// MSSM: 마 - 상 - 상 - 마 (안상차림 / 귀마)
// SMMS: 상 - 마 - 마 - 상 (바깥상차림 / 원앙마)
export type Formation = 'MSSM' | 'SMMS' | 'MSMS' | 'SMSM';

export interface Move {
  from: Position;
  to: Position;
  pieceType: PieceType;
  side: Side;
  captured?: PieceType;
  isPass?: boolean;
  timestamp?: number;
  notation: string;
}

export interface BoardState {
  pieces: Piece[]; // All active pieces on board
  turn: Side;
  consecutivePasses: number;
  moveHistory: Move[];
  capturedCho: PieceType[]; // Pieces captured by Han (Cho's losses)
  capturedHan: PieceType[]; // Pieces captured by Cho (Han's losses)
  isCheck: boolean;
  isCheckmate: boolean;
  winner: Side | 'draw' | null;
  winReason?: string;
  lastMove?: Move | null;
  choFormation: Formation;
  hanFormation: Formation;
  scores: {
    cho: number;
    han: number;
  };
}

export interface PlayerInfo {
  id: string;
  name: string;
  side: Side;
  rating?: number;
  formation: Formation;
  timeLeft: number; // seconds
  byoyomiSeconds: number; // e.g. 30
  byoyomiCount: number; // e.g. 3
  isReady: boolean;
  isConnected: boolean;
}

export type GameMode = 'online' | 'ai' | 'pass_and_play';
export type AIDifficulty = 'easy' | 'normal' | 'hard';

export interface RoomInfo {
  id: string;
  name: string;
  createdAt: number;
  status: 'waiting' | 'ready' | 'playing' | 'ended';
  choPlayer?: PlayerInfo | null;
  hanPlayer?: PlayerInfo | null;
  spectatorCount: number;
  isPrivate: boolean;
  initialTimeMinutes: number;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderSide?: Side | 'spectator' | 'system';
  text: string;
  timestamp: number;
  isEmote?: boolean;
}

// WebSocket protocol events
export type WSMessage =
  | { type: 'join_room'; roomId: string; playerName: string; preferredSide?: Side | 'any'; formation?: Formation }
  | { type: 'quick_match'; playerName: string; formation?: Formation }
  | { type: 'change_formation'; formation: Formation }
  | { type: 'player_ready' }
  | { type: 'make_move'; from: Position; to: Position }
  | { type: 'pass_turn' }
  | { type: 'resign' }
  | { type: 'offer_draw' }
  | { type: 'respond_draw'; accept: boolean }
  | { type: 'send_chat'; text: string; isEmote?: boolean }
  | { type: 'request_rematch' }
  | { type: 'room_state'; room: RoomInfo; gameState: BoardState; yourSide: Side | 'spectator' }
  | { type: 'game_update'; gameState: BoardState; move?: Move }
  | { type: 'chat_broadcast'; message: ChatMessage }
  | { type: 'time_sync'; choTime: number; hanTime: number; choByo: number; hanByo: number }
  | { type: 'draw_offered'; fromSide: Side }
  | { type: 'rematch_requested'; fromSide: Side }
  | { type: 'error_msg'; message: string };
