import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  BoardState,
  ChatMessage,
  Formation,
  Move,
  PlayerInfo,
  Position,
  RoomInfo,
  Side,
  WSMessage,
} from './src/game/types';
import {
  applyMove,
  applyPass,
  createInitialGameState,
} from './src/game/janggiEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json());

interface ConnectedClient {
  ws: WebSocket;
  roomId: string;
  name: string;
  side: Side | 'spectator';
}

interface ServerRoom {
  info: RoomInfo;
  gameState: BoardState;
  clients: Map<WebSocket, ConnectedClient>;
  drawOfferedBy: Side | null;
  rematchRequestedBy: Set<Side>;
  timerInterval: NodeJS.Timeout | null;
}

const rooms = new Map<string, ServerRoom>();

function broadcastToRoom(room: ServerRoom, message: WSMessage, excludeWs?: WebSocket) {
  const data = JSON.stringify(message);
  for (const [ws] of room.clients) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function stopRoomTimer(room: ServerRoom) {
  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
}

function startRoomTimer(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  stopRoomTimer(room);

  room.timerInterval = setInterval(() => {
    if (room.info.status !== 'playing' || room.gameState.winner) {
      stopRoomTimer(room);
      return;
    }

    const currentSide = room.gameState.turn;
    const player = currentSide === 'cho' ? room.info.choPlayer : room.info.hanPlayer;
    if (!player) return;

    if (player.timeLeft > 0) {
      player.timeLeft--;
    } else {
      // Byoyomi (초읽기) countdown
      if (player.byoyomiSeconds > 0) {
        player.byoyomiSeconds--;
      } else {
        // Byoyomi count decreases
        if (player.byoyomiCount > 1) {
          player.byoyomiCount--;
          player.byoyomiSeconds = 30;
        } else {
          // Timeout! Opponent wins
          stopRoomTimer(room);
          const opponentSide: Side = currentSide === 'cho' ? 'han' : 'cho';
          room.gameState.winner = opponentSide;
          room.gameState.winReason = `${currentSide === 'cho' ? '초(楚)' : '한(漢)'} 시간패`;
          room.info.status = 'ended';

          broadcastToRoom(room, {
            type: 'game_update',
            gameState: room.gameState,
          });
          return;
        }
      }
    }

    const choP = room.info.choPlayer;
    const hanP = room.info.hanPlayer;
    if (choP && hanP) {
      broadcastToRoom(room, {
        type: 'time_sync',
        choTime: choP.timeLeft,
        hanTime: hanP.timeLeft,
        choByo: choP.byoyomiSeconds,
        hanByo: hanP.byoyomiSeconds,
      });
    }
  }, 1000);
}

function startGameIfReady(room: ServerRoom) {
  if (
    room.info.choPlayer?.isReady &&
    room.info.hanPlayer?.isReady &&
    room.info.status === 'ready'
  ) {
    room.info.status = 'playing';
    room.gameState = createInitialGameState(
      room.info.choPlayer.formation,
      room.info.hanPlayer.formation
    );

    // Reset clocks
    const initialSeconds = room.info.initialTimeMinutes * 60;
    room.info.choPlayer.timeLeft = initialSeconds;
    room.info.choPlayer.byoyomiSeconds = 30;
    room.info.choPlayer.byoyomiCount = 3;

    room.info.hanPlayer.timeLeft = initialSeconds;
    room.info.hanPlayer.byoyomiSeconds = 30;
    room.info.hanPlayer.byoyomiCount = 3;

    broadcastToRoom(room, {
      type: 'game_update',
      gameState: room.gameState,
    });

    startRoomTimer(room.info.id);

    // Send system announcement
    const startMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      sender: '시스템',
      senderSide: 'system',
      text: '대국이 시작되었습니다. 초(楚)의 선공입니다!',
      timestamp: Date.now(),
    };
    broadcastToRoom(room, { type: 'chat_broadcast', message: startMsg });
  }
}

// REST API
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values())
    .filter(r => !r.info.isPrivate)
    .map(r => ({
      ...r.info,
      choPlayer: r.info.choPlayer ? { name: r.info.choPlayer.name, formation: r.info.choPlayer.formation } : null,
      hanPlayer: r.info.hanPlayer ? { name: r.info.hanPlayer.name, formation: r.info.hanPlayer.formation } : null,
    }));
  res.json({ rooms: roomList });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebSocket Handler
wss.on('connection', (ws: WebSocket) => {
  let clientInfo: ConnectedClient | null = null;

  ws.on('message', (raw: string) => {
    try {
      const msg: WSMessage = JSON.parse(raw.toString());

      if (msg.type === 'quick_match' || msg.type === 'join_room') {
        const playerName = (msg.playerName || '장기 기객').slice(0, 16);
        let targetRoomId = msg.type === 'join_room' ? msg.roomId : '';
        const userPreferredSide = msg.type === 'join_room' ? msg.preferredSide : 'any';
        const userFormation: Formation = msg.formation || 'MSSM';

        let room: ServerRoom | undefined;

        if (msg.type === 'quick_match') {
          // Look for an open room with 1 player
          for (const [id, r] of rooms) {
            if (!r.info.isPrivate && r.info.status === 'waiting') {
              targetRoomId = id;
              room = r;
              break;
            }
          }
          if (!room) {
            // Create a new room
            targetRoomId = `room_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          }
        }

        if (!room) {
          room = rooms.get(targetRoomId);
        }

        if (!room) {
          // Initialize new room
          const newRoomInfo: RoomInfo = {
            id: targetRoomId,
            name: `${playerName}님의 대국실`,
            createdAt: Date.now(),
            status: 'waiting',
            choPlayer: null,
            hanPlayer: null,
            spectatorCount: 0,
            isPrivate: false,
            initialTimeMinutes: 10,
          };

          room = {
            info: newRoomInfo,
            gameState: createInitialGameState(userFormation, 'MSSM'),
            clients: new Map(),
            drawOfferedBy: null,
            rematchRequestedBy: new Set(),
            timerInterval: null,
          };
          rooms.set(targetRoomId, room);
        }

        // Determine player side
        let assignedSide: Side | 'spectator' = 'spectator';
        const choTaken = !!room.info.choPlayer;
        const hanTaken = !!room.info.hanPlayer;

        if (userPreferredSide === 'cho' && !choTaken) {
          assignedSide = 'cho';
        } else if (userPreferredSide === 'han' && !hanTaken) {
          assignedSide = 'han';
        } else if (!choTaken) {
          assignedSide = 'cho';
        } else if (!hanTaken) {
          assignedSide = 'han';
        } else {
          assignedSide = 'spectator';
        }

        if (assignedSide !== 'spectator') {
          const player: PlayerInfo = {
            id: `p_${Math.random().toString(36).substring(2, 9)}`,
            name: playerName,
            side: assignedSide,
            formation: userFormation,
            timeLeft: room.info.initialTimeMinutes * 60,
            byoyomiSeconds: 30,
            byoyomiCount: 3,
            isReady: false,
            isConnected: true,
          };

          if (assignedSide === 'cho') {
            room.info.choPlayer = player;
          } else {
            room.info.hanPlayer = player;
          }

          if (room.info.choPlayer && room.info.hanPlayer) {
            room.info.status = 'ready';
          }
        } else {
          room.info.spectatorCount++;
        }

        clientInfo = {
          ws,
          roomId: targetRoomId,
          name: playerName,
          side: assignedSide,
        };

        room.clients.set(ws, clientInfo);

        // Send room state to the newly joined client
        ws.send(JSON.stringify({
          type: 'room_state',
          room: room.info,
          gameState: room.gameState,
          yourSide: assignedSide,
        } as WSMessage));

        // Notify room about participant joining
        const joinMsg: ChatMessage = {
          id: `chat_${Date.now()}`,
          sender: '알림',
          senderSide: 'system',
          text: `${playerName}님이 ${assignedSide === 'spectator' ? '관전자로' : (assignedSide === 'cho' ? '초(楚) 플레이어로' : '한(漢) 플레이어로')} 입장하셨습니다.`,
          timestamp: Date.now(),
        };
        broadcastToRoom(room, { type: 'chat_broadcast', message: joinMsg }, ws);
        return;
      }

      if (!clientInfo) return;
      const room = rooms.get(clientInfo.roomId);
      if (!room) return;

      if (msg.type === 'change_formation' && clientInfo.side !== 'spectator') {
        if (room.info.status === 'waiting' || room.info.status === 'ready') {
          if (clientInfo.side === 'cho' && room.info.choPlayer) {
            room.info.choPlayer.formation = msg.formation;
            room.gameState.choFormation = msg.formation;
          } else if (clientInfo.side === 'han' && room.info.hanPlayer) {
            room.info.hanPlayer.formation = msg.formation;
            room.gameState.hanFormation = msg.formation;
          }
          // Regenerate initial pieces preview
          room.gameState = createInitialGameState(
            room.info.choPlayer?.formation || 'MSSM',
            room.info.hanPlayer?.formation || 'MSSM'
          );
          broadcastToRoom(room, {
            type: 'room_state',
            room: room.info,
            gameState: room.gameState,
            yourSide: clientInfo.side,
          });
        }
      }

      if (msg.type === 'player_ready' && clientInfo.side !== 'spectator') {
        const player = clientInfo.side === 'cho' ? room.info.choPlayer : room.info.hanPlayer;
        if (player) {
          player.isReady = !player.isReady;
          broadcastToRoom(room, {
            type: 'room_state',
            room: room.info,
            gameState: room.gameState,
            yourSide: clientInfo.side,
          });
          startGameIfReady(room);
        }
      }

      if (msg.type === 'make_move' && clientInfo.side !== 'spectator') {
        if (room.info.status !== 'playing' || room.gameState.winner) return;
        if (room.gameState.turn !== clientInfo.side) {
          ws.send(JSON.stringify({ type: 'error_msg', message: '본인 차례가 아닙니다.' }));
          return;
        }

        const { nextState, valid, error } = applyMove(room.gameState, msg.from, msg.to);
        if (!valid) {
          ws.send(JSON.stringify({ type: 'error_msg', message: error || '잘못된 수입니다.' }));
          return;
        }

        room.gameState = nextState;

        // Reset byoyomi for this player if moved within turn
        const movedPlayer = clientInfo.side === 'cho' ? room.info.choPlayer : room.info.hanPlayer;
        if (movedPlayer && movedPlayer.timeLeft === 0) {
          movedPlayer.byoyomiSeconds = 30; // Successfully made move in byoyomi
        }

        if (nextState.winner) {
          room.info.status = 'ended';
          stopRoomTimer(room);
        }

        broadcastToRoom(room, {
          type: 'game_update',
          gameState: room.gameState,
          move: nextState.lastMove || undefined,
        });
      }

      if (msg.type === 'pass_turn' && clientInfo.side !== 'spectator') {
        if (room.info.status !== 'playing' || room.gameState.winner) return;
        const { nextState, valid, error } = applyPass(room.gameState, clientInfo.side);
        if (!valid) {
          ws.send(JSON.stringify({ type: 'error_msg', message: error || '한수 쉼을 할 수 없습니다.' }));
          return;
        }

        room.gameState = nextState;
        if (nextState.winner) {
          room.info.status = 'ended';
          stopRoomTimer(room);
        }

        broadcastToRoom(room, {
          type: 'game_update',
          gameState: room.gameState,
          move: nextState.lastMove || undefined,
        });

        const passNotice: ChatMessage = {
          id: `chat_${Date.now()}`,
          sender: clientInfo.name,
          senderSide: clientInfo.side,
          text: '한수 쉽니다.',
          timestamp: Date.now(),
        };
        broadcastToRoom(room, { type: 'chat_broadcast', message: passNotice });
      }

      if (msg.type === 'resign' && clientInfo.side !== 'spectator') {
        if (room.info.status !== 'playing' || room.gameState.winner) return;
        const winningSide: Side = clientInfo.side === 'cho' ? 'han' : 'cho';
        room.gameState.winner = winningSide;
        room.gameState.winReason = `${clientInfo.side === 'cho' ? '초(楚)' : '한(漢)'} 기권승`;
        room.info.status = 'ended';
        stopRoomTimer(room);

        broadcastToRoom(room, {
          type: 'game_update',
          gameState: room.gameState,
        });

        const resignNotice: ChatMessage = {
          id: `chat_${Date.now()}`,
          sender: '알림',
          senderSide: 'system',
          text: `${clientInfo.name}님이 기권하셨습니다.`,
          timestamp: Date.now(),
        };
        broadcastToRoom(room, { type: 'chat_broadcast', message: resignNotice });
      }

      if (msg.type === 'offer_draw' && clientInfo.side !== 'spectator') {
        if (room.info.status !== 'playing' || room.gameState.winner) return;
        room.drawOfferedBy = clientInfo.side;
        const otherSide: Side = clientInfo.side === 'cho' ? 'han' : 'cho';
        // Send notification to other player
        for (const [clientWs, cl] of room.clients) {
          if (cl.side === otherSide) {
            clientWs.send(JSON.stringify({ type: 'draw_offered', fromSide: clientInfo.side }));
          }
        }
      }

      if (msg.type === 'respond_draw' && clientInfo.side !== 'spectator') {
        if (room.drawOfferedBy && room.drawOfferedBy !== clientInfo.side) {
          if (msg.accept) {
            room.gameState.winner = 'draw';
            room.gameState.winReason = '양자 합의 무승부';
            room.info.status = 'ended';
            stopRoomTimer(room);
            broadcastToRoom(room, {
              type: 'game_update',
              gameState: room.gameState,
            });
          }
          room.drawOfferedBy = null;
        }
      }

      if (msg.type === 'send_chat') {
        const chatMsg: ChatMessage = {
          id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          sender: clientInfo.name,
          senderSide: clientInfo.side,
          text: msg.text.slice(0, 80),
          timestamp: Date.now(),
          isEmote: msg.isEmote,
        };
        broadcastToRoom(room, { type: 'chat_broadcast', message: chatMsg });
      }

      if (msg.type === 'request_rematch' && clientInfo.side !== 'spectator') {
        room.rematchRequestedBy.add(clientInfo.side);
        if (room.rematchRequestedBy.has('cho') && room.rematchRequestedBy.has('han')) {
          // Both agreed: Reset game, swap sides
          room.rematchRequestedBy.clear();
          const oldCho = room.info.choPlayer;
          const oldHan = room.info.hanPlayer;
          if (oldCho && oldHan) {
            oldCho.side = 'han';
            oldHan.side = 'cho';
            oldCho.isReady = true;
            oldHan.isReady = true;
            room.info.choPlayer = oldHan;
            room.info.hanPlayer = oldCho;
            room.info.status = 'ready';
            startGameIfReady(room);
          }
        } else {
          broadcastToRoom(room, { type: 'rematch_requested', fromSide: clientInfo.side }, ws);
        }
      }
    } catch {
      // JSON parse error or client disconnect
    }
  });

  ws.on('close', () => {
    if (clientInfo) {
      const room = rooms.get(clientInfo.roomId);
      if (room) {
        room.clients.delete(ws);
        if (clientInfo.side === 'cho') {
          room.info.choPlayer = null;
        } else if (clientInfo.side === 'han') {
          room.info.hanPlayer = null;
        } else {
          room.info.spectatorCount = Math.max(0, room.info.spectatorCount - 1);
        }

        if (room.clients.size === 0) {
          stopRoomTimer(room);
          rooms.delete(clientInfo.roomId);
        } else {
          const leaveMsg: ChatMessage = {
            id: `sys_${Date.now()}`,
            sender: '알림',
            senderSide: 'system',
            text: `${clientInfo.name}님이 퇴장하셨습니다.`,
            timestamp: Date.now(),
          };
          broadcastToRoom(room, { type: 'chat_broadcast', message: leaveMsg });
        }
      }
    }
  });
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const PORT = 3000;

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Janggi Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
