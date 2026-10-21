import { BoardState, Formation, Move, Piece, PieceType, Position, Side } from './types';

export const PIECE_VALUES: Record<PieceType, number> = {
  general: 0,
  chariot: 13,
  cannon: 7,
  horse: 5,
  elephant: 3,
  guard: 3,
  soldier: 2,
};

export const HAN_KOMI = 1.5;

export const PIECE_NAMES: Record<PieceType, { hanjaCho: string; hanjaHan: string; hangulCho: string; hangulHan: string }> = {
  general: { hanjaCho: '楚', hanjaHan: '漢', hangulCho: '궁', hangulHan: '궁' },
  chariot: { hanjaCho: '車', hanjaHan: '車', hangulCho: '차', hangulHan: '차' },
  cannon: { hanjaCho: '包', hanjaHan: '包', hangulCho: '포', hangulHan: '포' },
  horse: { hanjaCho: '馬', hanjaHan: '馬', hangulCho: '마', hangulHan: '마' },
  elephant: { hanjaCho: '象', hanjaHan: '象', hangulCho: '상', hangulHan: '상' },
  guard: { hanjaCho: '士', hanjaHan: '士', hangulCho: '사', hangulHan: '사' },
  soldier: { hanjaCho: '卒', hanjaHan: '兵', hangulCho: '졸', hangulHan: '병' },
};

export const FORMATION_NAMES: Record<Formation, string> = {
  MSSM: '안상차림 (마-상-상-마 / 귀마)',
  SMMS: '바깥상차림 (상-마-마-상 / 원앙마)',
  MSMS: '왼마오마 (마-상-마-상 / 엇마)',
  SMSM: '왼상오상 (상-마-상-마 / 엇상)',
};

export const FORMATION_SHORT_NAMES: Record<Formation, string> = {
  MSSM: '귀마 (마상상마)',
  SMMS: '원앙마 (상마마상)',
  MSMS: '엇마 (마상마상)',
  SMSM: '엇상 (상마상마)',
};

export function isInsideBoard(r: number, c: number): boolean {
  return r >= 0 && r < 10 && c >= 0 && c < 9;
}

export function isInsidePalace(r: number, c: number, side?: Side): boolean {
  if (c < 3 || c > 5) return false;
  if (side === 'han') return r >= 0 && r <= 2;
  if (side === 'cho') return r >= 7 && r <= 9;
  return (r >= 0 && r <= 2) || (r >= 7 && r <= 9);
}

// Palace diagonal lines lookup
// Returns list of connected diagonal neighbor positions
export function getPalaceDiagonalNeighbors(r: number, c: number): Position[] {
  // Han palace diagonals (center at (1,4))
  if (r === 0 && c === 3) return [{ r: 1, c: 4 }];
  if (r === 0 && c === 5) return [{ r: 1, c: 4 }];
  if (r === 2 && c === 3) return [{ r: 1, c: 4 }];
  if (r === 2 && c === 5) return [{ r: 1, c: 4 }];
  if (r === 1 && c === 4) return [
    { r: 0, c: 3 },
    { r: 0, c: 5 },
    { r: 2, c: 3 },
    { r: 2, c: 5 },
  ];

  // Cho palace diagonals (center at (8,4))
  if (r === 7 && c === 3) return [{ r: 8, c: 4 }];
  if (r === 7 && c === 5) return [{ r: 8, c: 4 }];
  if (r === 9 && c === 3) return [{ r: 8, c: 4 }];
  if (r === 9 && c === 5) return [{ r: 8, c: 4 }];
  if (r === 8 && c === 4) return [
    { r: 7, c: 3 },
    { r: 7, c: 5 },
    { r: 9, c: 3 },
    { r: 9, c: 5 },
  ];

  return [];
}

export function getPieceAt(pieces: Piece[], r: number, c: number): Piece | undefined {
  return pieces.find(p => p.r === r && p.c === c);
}

// Generate starting board with chosen formations
export function createInitialPieces(choFormation: Formation = 'MSSM', hanFormation: Formation = 'MSSM'): Piece[] {
  const pieces: Piece[] = [];
  let idCounter = 1;

  const getBackRankPattern = (formation: Formation): PieceType[] => {
    switch (formation) {
      case 'MSSM': return ['horse', 'elephant', 'elephant', 'horse'];
      case 'SMMS': return ['elephant', 'horse', 'horse', 'elephant'];
      case 'MSMS': return ['horse', 'elephant', 'horse', 'elephant'];
      case 'SMSM': return ['elephant', 'horse', 'elephant', 'horse'];
    }
  };

  // Han Pieces (Rank 0..3)
  const hanPattern = getBackRankPattern(hanFormation);
  // Rank 0
  pieces.push({ id: `han_${idCounter++}`, type: 'chariot', side: 'han', r: 0, c: 0 });
  pieces.push({ id: `han_${idCounter++}`, type: hanPattern[0], side: 'han', r: 0, c: 1 });
  pieces.push({ id: `han_${idCounter++}`, type: hanPattern[1], side: 'han', r: 0, c: 2 });
  pieces.push({ id: `han_${idCounter++}`, type: 'guard', side: 'han', r: 0, c: 3 });
  pieces.push({ id: `han_${idCounter++}`, type: 'guard', side: 'han', r: 0, c: 5 });
  pieces.push({ id: `han_${idCounter++}`, type: hanPattern[2], side: 'han', r: 0, c: 6 });
  pieces.push({ id: `han_${idCounter++}`, type: hanPattern[3], side: 'han', r: 0, c: 7 });
  pieces.push({ id: `han_${idCounter++}`, type: 'chariot', side: 'han', r: 0, c: 8 });

  // Rank 1: Han General
  pieces.push({ id: `han_${idCounter++}`, type: 'general', side: 'han', r: 1, c: 4 });

  // Rank 2: Han Cannons
  pieces.push({ id: `han_${idCounter++}`, type: 'cannon', side: 'han', r: 2, c: 1 });
  pieces.push({ id: `han_${idCounter++}`, type: 'cannon', side: 'han', r: 2, c: 7 });

  // Rank 3: Han Soldiers (Byeong)
  for (let c = 0; c <= 8; c += 2) {
    pieces.push({ id: `han_${idCounter++}`, type: 'soldier', side: 'han', r: 3, c });
  }

  // Cho Pieces (Rank 6..9)
  const choPattern = getBackRankPattern(choFormation);
  // Rank 6: Cho Soldiers (Jol)
  for (let c = 0; c <= 8; c += 2) {
    pieces.push({ id: `cho_${idCounter++}`, type: 'soldier', side: 'cho', r: 6, c });
  }

  // Rank 7: Cho Cannons
  pieces.push({ id: `cho_${idCounter++}`, type: 'cannon', side: 'cho', r: 7, c: 1 });
  pieces.push({ id: `cho_${idCounter++}`, type: 'cannon', side: 'cho', r: 7, c: 7 });

  // Rank 8: Cho General
  pieces.push({ id: `cho_${idCounter++}`, type: 'general', side: 'cho', r: 8, c: 4 });

  // Rank 9: Cho Backrank
  pieces.push({ id: `cho_${idCounter++}`, type: 'chariot', side: 'cho', r: 9, c: 0 });
  pieces.push({ id: `cho_${idCounter++}`, type: choPattern[0], side: 'cho', r: 9, c: 1 });
  pieces.push({ id: `cho_${idCounter++}`, type: choPattern[1], side: 'cho', r: 9, c: 2 });
  pieces.push({ id: `cho_${idCounter++}`, type: 'guard', side: 'cho', r: 9, c: 3 });
  pieces.push({ id: `cho_${idCounter++}`, type: 'guard', side: 'cho', r: 9, c: 5 });
  pieces.push({ id: `cho_${idCounter++}`, type: choPattern[2], side: 'cho', r: 9, c: 6 });
  pieces.push({ id: `cho_${idCounter++}`, type: choPattern[3], side: 'cho', r: 9, c: 7 });
  pieces.push({ id: `cho_${idCounter++}`, type: 'chariot', side: 'cho', r: 9, c: 8 });

  return pieces;
}

export function calculateScores(pieces: Piece[]): { cho: number; han: number } {
  let cho = 0;
  let han = HAN_KOMI; // Han gets 1.5 Komi

  for (const piece of pieces) {
    const val = PIECE_VALUES[piece.type];
    if (piece.side === 'cho') {
      cho += val;
    } else {
      han += val;
    }
  }

  return { cho, han: Math.round(han * 10) / 10 };
}

// Calculate pseudo-legal candidate moves for a piece (ignoring check on own General)
export function getPseudoLegalMoves(piece: Piece, pieces: Piece[]): Position[] {
  const moves: Position[] = [];
  const { r, c, type, side } = piece;

  const isEnemyOrEmpty = (targetR: number, targetC: number): boolean => {
    const target = getPieceAt(pieces, targetR, targetC);
    return !target || target.side !== side;
  };

  switch (type) {
    case 'general':
    case 'guard': {
      // 1 step along palace lines within palace only
      const palaceSide = side; // General & Guard never leave their own palace
      const deltas = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];
      for (const d of deltas) {
        const nr = r + d.dr;
        const nc = c + d.dc;
        if (isInsidePalace(nr, nc, palaceSide) && isEnemyOrEmpty(nr, nc)) {
          moves.push({ r: nr, c: nc });
        }
      }
      // Diagonal lines in palace
      const diagNeighbors = getPalaceDiagonalNeighbors(r, c);
      for (const pos of diagNeighbors) {
        if (isInsidePalace(pos.r, pos.c, palaceSide) && isEnemyOrEmpty(pos.r, pos.c)) {
          moves.push(pos);
        }
      }
      break;
    }

    case 'chariot': {
      // Orthogonal rays
      const directions = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];
      for (const { dr, dc } of directions) {
        let nr = r + dr;
        let nc = c + dc;
        while (isInsideBoard(nr, nc)) {
          const target = getPieceAt(pieces, nr, nc);
          if (!target) {
            moves.push({ r: nr, c: nc });
          } else {
            if (target.side !== side) {
              moves.push({ r: nr, c: nc });
            }
            break;
          }
          nr += dr;
          nc += dc;
        }
      }

      // Palace diagonal movement for Chariot
      // If chariot is on a palace diagonal corner, it can slide through center to opposite corner
      const checkPalaceChariotDiagonals = (palaceCenterR: number, palaceCenterC: number) => {
        if (r === palaceCenterR && c === palaceCenterC) {
          // At center: can move 1 step to any of the 4 corners
          const corners = [
            { r: palaceCenterR - 1, c: palaceCenterC - 1 },
            { r: palaceCenterR - 1, c: palaceCenterC + 1 },
            { r: palaceCenterR + 1, c: palaceCenterC - 1 },
            { r: palaceCenterR + 1, c: palaceCenterC + 1 },
          ];
          for (const pos of corners) {
            if (isEnemyOrEmpty(pos.r, pos.c)) moves.push(pos);
          }
        } else if (
          (Math.abs(r - palaceCenterR) === 1 && Math.abs(c - palaceCenterC) === 1)
        ) {
          // At a corner: can move to center, and if center is empty, can continue to opposite corner
          const oppR = palaceCenterR + (palaceCenterR - r);
          const oppC = palaceCenterC + (palaceCenterC - c);
          const centerTarget = getPieceAt(pieces, palaceCenterR, palaceCenterC);
          if (!centerTarget) {
            moves.push({ r: palaceCenterR, c: palaceCenterC });
            const oppTarget = getPieceAt(pieces, oppR, oppC);
            if (!oppTarget || oppTarget.side !== side) {
              moves.push({ r: oppR, c: oppC });
            }
          } else if (centerTarget.side !== side) {
            moves.push({ r: palaceCenterR, c: palaceCenterC });
          }
        }
      };

      if (isInsidePalace(r, c, 'han')) checkPalaceChariotDiagonals(1, 4);
      if (isInsidePalace(r, c, 'cho')) checkPalaceChariotDiagonals(8, 4);
      break;
    }

    case 'cannon': {
      // Orthogonal jump
      // Must jump over exactly one non-cannon piece, and target cannot be a cannon!
      const directions = [
        { dr: -1, dc: 0 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 },
        { dr: 0, dc: 1 },
      ];

      for (const { dr, dc } of directions) {
        let nr = r + dr;
        let nc = c + dc;
        let bridgeFound = false;

        while (isInsideBoard(nr, nc)) {
          const target = getPieceAt(pieces, nr, nc);
          if (!bridgeFound) {
            if (target) {
              // Bridge candidate: CANNOT BE A CANNON!
              if (target.type === 'cannon') {
                break; // A cannon cannot jump over a cannon
              }
              bridgeFound = true;
            }
          } else {
            // Already found bridge
            if (!target) {
              moves.push({ r: nr, c: nc });
            } else {
              // Target hit: can capture only if enemy and NOT A CANNON!
              if (target.side !== side && target.type !== 'cannon') {
                moves.push({ r: nr, c: nc });
              }
              break;
            }
          }
          nr += dr;
          nc += dc;
        }
      }

      // Palace diagonal jump for Cannon:
      // From corner over center to opposite corner (center must be occupied by non-cannon)
      const checkPalaceCannonDiagonals = (palaceCenterR: number, palaceCenterC: number) => {
        if (Math.abs(r - palaceCenterR) === 1 && Math.abs(c - palaceCenterC) === 1) {
          const centerPiece = getPieceAt(pieces, palaceCenterR, palaceCenterC);
          if (centerPiece && centerPiece.type !== 'cannon') {
            const oppR = palaceCenterR + (palaceCenterR - r);
            const oppC = palaceCenterC + (palaceCenterC - c);
            const oppPiece = getPieceAt(pieces, oppR, oppC);
            if (!oppPiece) {
              moves.push({ r: oppR, c: oppC });
            } else if (oppPiece.side !== side && oppPiece.type !== 'cannon') {
              moves.push({ r: oppR, c: oppC });
            }
          }
        }
      };

      if (isInsidePalace(r, c, 'han')) checkPalaceCannonDiagonals(1, 4);
      if (isInsidePalace(r, c, 'cho')) checkPalaceCannonDiagonals(8, 4);
      break;
    }

    case 'horse': {
      // 1 step orthogonal, then 1 step diagonal
      // Blocked if orthogonal step (멱) is occupied
      const horseSteps = [
        // Up
        { ortho: { dr: -1, dc: 0 }, target: { dr: -2, dc: -1 } },
        { ortho: { dr: -1, dc: 0 }, target: { dr: -2, dc: 1 } },
        // Down
        { ortho: { dr: 1, dc: 0 }, target: { dr: 2, dc: -1 } },
        { ortho: { dr: 1, dc: 0 }, target: { dr: 2, dc: 1 } },
        // Left
        { ortho: { dr: 0, dc: -1 }, target: { dr: -1, dc: -2 } },
        { ortho: { dr: 0, dc: -1 }, target: { dr: 1, dc: -2 } },
        // Right
        { ortho: { dr: 0, dc: 1 }, target: { dr: -1, dc: 2 } },
        { ortho: { dr: 0, dc: 1 }, target: { dr: 1, dc: 2 } },
      ];

      for (const step of horseSteps) {
        const orthoR = r + step.ortho.dr;
        const orthoC = c + step.ortho.dc;
        if (!isInsideBoard(orthoR, orthoC)) continue;
        if (getPieceAt(pieces, orthoR, orthoC)) continue; // 멱이 막힘

        const tr = r + step.target.dr;
        const tc = c + step.target.dc;
        if (isInsideBoard(tr, tc) && isEnemyOrEmpty(tr, tc)) {
          moves.push({ r: tr, c: tc });
        }
      }
      break;
    }

    case 'elephant': {
      // 1 step orthogonal, then 2 steps diagonal
      // Blocked if either orthogonal step OR 1st diagonal step is occupied
      const elephantSteps = [
        // Up
        { ortho: { dr: -1, dc: 0 }, diag1: { dr: -2, dc: -1 }, target: { dr: -3, dc: -2 } },
        { ortho: { dr: -1, dc: 0 }, diag1: { dr: -2, dc: 1 }, target: { dr: -3, dc: 2 } },
        // Down
        { ortho: { dr: 1, dc: 0 }, diag1: { dr: 2, dc: -1 }, target: { dr: 3, dc: -2 } },
        { ortho: { dr: 1, dc: 0 }, diag1: { dr: 2, dc: 1 }, target: { dr: 3, dc: 2 } },
        // Left
        { ortho: { dr: 0, dc: -1 }, diag1: { dr: -1, dc: -2 }, target: { dr: -2, dc: -3 } },
        { ortho: { dr: 0, dc: -1 }, diag1: { dr: 1, dc: -2 }, target: { dr: 2, dc: -3 } },
        // Right
        { ortho: { dr: 0, dc: 1 }, diag1: { dr: -1, dc: 2 }, target: { dr: -2, dc: 3 } },
        { ortho: { dr: 0, dc: 1 }, diag1: { dr: 1, dc: 2 }, target: { dr: 2, dc: 3 } },
      ];

      for (const step of elephantSteps) {
        const oR = r + step.ortho.dr;
        const oC = c + step.ortho.dc;
        if (!isInsideBoard(oR, oC) || getPieceAt(pieces, oR, oC)) continue; // 1차 멱

        const d1R = r + step.diag1.dr;
        const d1C = c + step.diag1.dc;
        if (!isInsideBoard(d1R, d1C) || getPieceAt(pieces, d1R, d1C)) continue; // 2차 멱

        const tr = r + step.target.dr;
        const tc = c + step.target.dc;
        if (isInsideBoard(tr, tc) && isEnemyOrEmpty(tr, tc)) {
          moves.push({ r: tr, c: tc });
        }
      }
      break;
    }

    case 'soldier': {
      // Cho Jol moves UP (r - 1) and left/right
      // Han Byeong moves DOWN (r + 1) and left/right
      const forwardDr = side === 'cho' ? -1 : 1;
      const candidates = [
        { r: r + forwardDr, c },
        { r, c: c - 1 },
        { r, c: c + 1 },
      ];

      for (const pos of candidates) {
        if (isInsideBoard(pos.r, pos.c) && isEnemyOrEmpty(pos.r, pos.c)) {
          moves.push(pos);
        }
      }

      // Forward diagonal inside enemy palace!
      if (side === 'cho' && isInsidePalace(r, c, 'han')) {
        // In Han palace (ranks 0..2, cols 3..5), moving towards rank 0
        if (r === 2 && (c === 3 || c === 5)) {
          if (isEnemyOrEmpty(1, 4)) moves.push({ r: 1, c: 4 });
        } else if (r === 1 && c === 4) {
          if (isEnemyOrEmpty(0, 3)) moves.push({ r: 0, c: 3 });
          if (isEnemyOrEmpty(0, 5)) moves.push({ r: 0, c: 5 });
        }
      } else if (side === 'han' && isInsidePalace(r, c, 'cho')) {
        // In Cho palace (ranks 7..9, cols 3..5), moving towards rank 9
        if (r === 7 && (c === 3 || c === 5)) {
          if (isEnemyOrEmpty(8, 4)) moves.push({ r: 8, c: 4 });
        } else if (r === 8 && c === 4) {
          if (isEnemyOrEmpty(9, 3)) moves.push({ r: 9, c: 3 });
          if (isEnemyOrEmpty(9, 5)) moves.push({ r: 9, c: 5 });
        }
      }
      break;
    }
  }

  return moves;
}

// Find General for a side
export function findGeneral(pieces: Piece[], side: Side): Piece | undefined {
  return pieces.find(p => p.type === 'general' && p.side === side);
}

// Check if a side's General is under attack by enemy
export function isSideInCheck(pieces: Piece[], side: Side): boolean {
  const general = findGeneral(pieces, side);
  if (!general) return false;

  const enemySide: Side = side === 'cho' ? 'han' : 'cho';
  const enemyPieces = pieces.filter(p => p.side === enemySide);

  for (const enemy of enemyPieces) {
    const moves = getPseudoLegalMoves(enemy, pieces);
    if (moves.some(m => m.r === general.r && m.c === general.c)) {
      return true;
    }
  }

  return false;
}

// Simulate move and return updated pieces array
export function simulateMove(pieces: Piece[], from: Position, to: Position): { newPieces: Piece[]; capturedPiece?: Piece } {
  let capturedPiece: Piece | undefined;
  const movingPiece = getPieceAt(pieces, from.r, from.c);
  if (!movingPiece) return { newPieces: pieces };

  const newPieces: Piece[] = [];
  for (const p of pieces) {
    if (p.r === to.r && p.c === to.c) {
      capturedPiece = p; // Captured!
    } else if (p.r === from.r && p.c === from.c) {
      newPieces.push({ ...p, r: to.r, c: to.c });
    } else {
      newPieces.push(p);
    }
  }

  return { newPieces, capturedPiece };
}

// Get all strictly legal moves for a piece (that don't leave own general in check)
export function getLegalMoves(piece: Piece, pieces: Piece[]): Position[] {
  const pseudoMoves = getPseudoLegalMoves(piece, pieces);
  const legalMoves: Position[] = [];

  for (const target of pseudoMoves) {
    const { newPieces } = simulateMove(pieces, { r: piece.r, c: piece.c }, target);
    if (!isSideInCheck(newPieces, piece.side)) {
      legalMoves.push(target);
    }
  }

  return legalMoves;
}

// Get all legal moves for an entire side
export function getAllLegalMovesForSide(pieces: Piece[], side: Side): { piece: Piece; moves: Position[] }[] {
  const playerPieces = pieces.filter(p => p.side === side);
  const result: { piece: Piece; moves: Position[] }[] = [];

  for (const piece of playerPieces) {
    const moves = getLegalMoves(piece, pieces);
    if (moves.length > 0) {
      result.push({ piece, moves });
    }
  }

  return result;
}

// Standard Janggi notation (e.g. 77포→74 or 車 00→04)
export function formatJanggiNotation(from: Position, to: Position, pieceType: PieceType, side: Side, captured?: PieceType): string {
  const name = PIECE_NAMES[pieceType][side === 'cho' ? 'hangulCho' : 'hangulHan'];
  const captureMark = captured ? `×${PIECE_NAMES[captured][side === 'cho' ? 'hangulHan' : 'hangulCho']}` : '';
  return `${name} (${from.c},${from.r}) → (${to.c},${to.r})${captureMark}`;
}

// Create initial clean game state
export function createInitialGameState(choFormation: Formation = 'MSSM', hanFormation: Formation = 'MSSM'): BoardState {
  const pieces = createInitialPieces(choFormation, hanFormation);
  const scores = calculateScores(pieces);

  return {
    pieces,
    turn: 'cho', // Cho always moves first in Korean Janggi
    consecutivePasses: 0,
    moveHistory: [],
    capturedCho: [],
    capturedHan: [],
    isCheck: false,
    isCheckmate: false,
    winner: null,
    lastMove: null,
    choFormation,
    hanFormation,
    scores,
  };
}

// Apply a move to game state
export function applyMove(
  currentState: BoardState,
  from: Position,
  to: Position
): { nextState: BoardState; valid: boolean; error?: string } {
  if (currentState.winner) {
    return { nextState: currentState, valid: false, error: '대국이 이미 종료되었습니다.' };
  }

  const piece = getPieceAt(currentState.pieces, from.r, from.c);
  if (!piece) {
    return { nextState: currentState, valid: false, error: '선택한 위치에 기물이 없습니다.' };
  }

  if (piece.side !== currentState.turn) {
    return { nextState: currentState, valid: false, error: '상대방의 차례입니다.' };
  }

  const legalMoves = getLegalMoves(piece, currentState.pieces);
  const isMoveLegal = legalMoves.some(m => m.r === to.r && m.c === to.c);

  if (!isMoveLegal) {
    return { nextState: currentState, valid: false, error: '해당 위치로는 이동할 수 없습니다.' };
  }

  const { newPieces, capturedPiece } = simulateMove(currentState.pieces, from, to);
  const nextTurn: Side = currentState.turn === 'cho' ? 'han' : 'cho';

  const newCapturedCho = [...currentState.capturedCho];
  const newCapturedHan = [...currentState.capturedHan];

  if (capturedPiece) {
    if (capturedPiece.side === 'cho') {
      newCapturedCho.push(capturedPiece.type);
    } else {
      newCapturedHan.push(capturedPiece.type);
    }
  }

  const scores = calculateScores(newPieces);
  const notation = formatJanggiNotation(from, to, piece.type, piece.side, capturedPiece?.type);

  const moveRecord: Move = {
    from,
    to,
    pieceType: piece.type,
    side: piece.side,
    captured: capturedPiece?.type,
    timestamp: Date.now(),
    notation,
  };

  // Check if enemy general is in check after this move
  const isEnemyCheck = isSideInCheck(newPieces, nextTurn);

  // Check if enemy has any legal moves
  const enemyLegalMoves = getAllLegalMovesForSide(newPieces, nextTurn);
  const isCheckmate = enemyLegalMoves.length === 0 && isEnemyCheck;

  let winner: Side | 'draw' | null = null;
  let winReason: string | undefined;

  if (isCheckmate) {
    winner = currentState.turn;
    winReason = `${currentState.turn === 'cho' ? '초(楚)' : '한(漢)'}의 외통승 (체크메이트)`;
  } else if (capturedPiece?.type === 'general') {
    // If king captured directly
    winner = currentState.turn;
    winReason = `${currentState.turn === 'cho' ? '초(楚)' : '한(漢)'}의 궁 포획 승리`;
  }

  const nextState: BoardState = {
    ...currentState,
    pieces: newPieces,
    turn: nextTurn,
    consecutivePasses: 0,
    moveHistory: [...currentState.moveHistory, moveRecord],
    capturedCho: newCapturedCho,
    capturedHan: newCapturedHan,
    isCheck: isEnemyCheck,
    isCheckmate,
    winner,
    winReason,
    lastMove: moveRecord,
    scores,
  };

  return { nextState, valid: true };
}

// Pass turn (한수 쉼)
export function applyPass(currentState: BoardState, passingSide: Side): { nextState: BoardState; valid: boolean; error?: string } {
  if (currentState.winner) {
    return { nextState: currentState, valid: false, error: '대국이 이미 종료되었습니다.' };
  }

  if (currentState.turn !== passingSide) {
    return { nextState: currentState, valid: false, error: '본인 차례가 아닙니다.' };
  }

  // Janggi rule: Cannot pass while under check!
  if (currentState.isCheck) {
    return { nextState: currentState, valid: false, error: '장군 상태에서는 한수 쉼을 할 수 없습니다.' };
  }

  const passes = currentState.consecutivePasses + 1;
  const nextTurn: Side = currentState.turn === 'cho' ? 'han' : 'cho';

  let winner: Side | 'draw' | null = null;
  let winReason: string | undefined;

  // Two consecutive passes end the game by points comparison!
  if (passes >= 2) {
    if (currentState.scores.cho > currentState.scores.han) {
      winner = 'cho';
      winReason = `양자 연속 한수 쉼 점수 판정승 (초 ${currentState.scores.cho}점 vs 한 ${currentState.scores.han}점)`;
    } else if (currentState.scores.han > currentState.scores.cho) {
      winner = 'han';
      winReason = `양자 연속 한수 쉼 점수 판정승 (한 ${currentState.scores.han}점 vs 초 ${currentState.scores.cho}점)`;
    } else {
      winner = 'draw';
      winReason = '양자 연속 한수 쉼 동점 무승부';
    }
  }

  const moveRecord: Move = {
    from: { r: -1, c: -1 },
    to: { r: -1, c: -1 },
    pieceType: 'general',
    side: passingSide,
    isPass: true,
    timestamp: Date.now(),
    notation: `${passingSide === 'cho' ? '초(楚)' : '한(漢)'} 한수 쉼`,
  };

  const nextState: BoardState = {
    ...currentState,
    turn: nextTurn,
    consecutivePasses: passes,
    moveHistory: [...currentState.moveHistory, moveRecord],
    winner,
    winReason,
    lastMove: moveRecord,
  };

  return { nextState, valid: true };
}
