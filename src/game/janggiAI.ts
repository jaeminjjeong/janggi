import {
  AIDifficulty,
  BoardState,
  Move,
  Piece,
  Position,
  Side,
} from './types';
import {
  applyMove,
  getAllLegalMovesForSide,
  PIECE_VALUES,
  simulateMove,
  isSideInCheck,
} from './janggiEngine';

// Positional bonuses for pieces
function evaluateBoard(pieces: Piece[], maximizingSide: Side): number {
  let score = 0;
  const minimizingSide: Side = maximizingSide === 'cho' ? 'han' : 'cho';

  for (const p of pieces) {
    const baseValue = PIECE_VALUES[p.type] * 100;
    let posBonus = 0;

    // Positional weight:
    // Soldiers: advancing closer to enemy ranks gives bonus
    if (p.type === 'soldier') {
      const advanceRank = p.side === 'cho' ? 9 - p.r : p.r;
      posBonus += advanceRank * 15;
      // Central file bonus (cols 3..5)
      if (p.c >= 3 && p.c <= 5) posBonus += 15;
    }

    // Chariots (Cha): aggressive files and palace infiltration
    if (p.type === 'chariot') {
      posBonus += 25;
      if (p.side === 'cho' && p.r <= 3) posBonus += 40; // Infiltrated Han territory
      if (p.side === 'han' && p.r >= 6) posBonus += 40; // Infiltrated Cho territory
    }

    // Horse & Elephant: active central positioning
    if (p.type === 'horse') {
      const distFromCenter = Math.abs(p.c - 4) + Math.abs(p.r - 4.5);
      posBonus += Math.max(0, 30 - distFromCenter * 4);
    }
    if (p.type === 'elephant') {
      const distFromCenter = Math.abs(p.c - 4) + Math.abs(p.r - 4.5);
      posBonus += Math.max(0, 20 - distFromCenter * 3);
    }

    // Cannon (Po): prefer staying behind troops or controlling open files
    if (p.type === 'cannon') {
      posBonus += 10;
    }

    const totalVal = baseValue + posBonus;
    if (p.side === maximizingSide) {
      score += totalVal;
    } else {
      score -= totalVal;
    }
  }

  // Check bonus/penalty
  if (isSideInCheck(pieces, minimizingSide)) {
    score += 80;
  }
  if (isSideInCheck(pieces, maximizingSide)) {
    score -= 120;
  }

  return score;
}

export interface BestAIMove {
  from: Position;
  to: Position;
  isPass?: boolean;
}

export function computeAIMove(gameState: BoardState, difficulty: AIDifficulty = 'normal'): BestAIMove | null {
  const aiSide = gameState.turn;
  const legalMovesGrouped = getAllLegalMovesForSide(gameState.pieces, aiSide);

  const flatMoves: { from: Position; to: Position; piece: Piece }[] = [];
  for (const group of legalMovesGrouped) {
    for (const target of group.moves) {
      flatMoves.push({
        from: { r: group.piece.r, c: group.piece.c },
        to: target,
        piece: group.piece,
      });
    }
  }

  if (flatMoves.length === 0) {
    // If no moves, must pass (if not in check)
    if (!gameState.isCheck) {
      return { from: { r: -1, c: -1 }, to: { r: -1, c: -1 }, isPass: true };
    }
    return null;
  }

  // Easy mode: Pick among good capture moves or random legal move with basic safety
  if (difficulty === 'easy') {
    // Prioritize captures with 60% probability
    const captureMoves = flatMoves.filter(m => {
      const targetPiece = gameState.pieces.find(p => p.r === m.to.r && p.c === m.to.c);
      return targetPiece && targetPiece.side !== aiSide;
    });

    if (captureMoves.length > 0 && Math.random() < 0.65) {
      const chosen = captureMoves[Math.floor(Math.random() * captureMoves.length)];
      return { from: chosen.from, to: chosen.to };
    }

    const chosen = flatMoves[Math.floor(Math.random() * flatMoves.length)];
    return { from: chosen.from, to: chosen.to };
  }

  // Normal mode: 1-ply search with piece capture value and basic opponent reply check
  if (difficulty === 'normal') {
    let bestScore = -Infinity;
    let candidates: { from: Position; to: Position }[] = [];

    // Shuffle to add variety
    const shuffled = [...flatMoves].sort(() => Math.random() - 0.5);

    for (const move of shuffled) {
      const { newPieces, capturedPiece } = simulateMove(gameState.pieces, move.from, move.to);
      let moveScore = evaluateBoard(newPieces, aiSide);

      if (capturedPiece) {
        moveScore += PIECE_VALUES[capturedPiece.type] * 80;
      }

      // Check if moving piece lands on an attacked square
      const opponentSide: Side = aiSide === 'cho' ? 'han' : 'cho';
      const oppLegal = getAllLegalMovesForSide(newPieces, opponentSide);
      const isTargetAttacked = oppLegal.some(g => g.moves.some(m => m.r === move.to.r && m.c === move.to.c));
      if (isTargetAttacked) {
        moveScore -= PIECE_VALUES[move.piece.type] * 60;
      }

      if (moveScore > bestScore) {
        bestScore = moveScore;
        candidates = [{ from: move.from, to: move.to }];
      } else if (moveScore === bestScore) {
        candidates.push({ from: move.from, to: move.to });
      }
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    return pick;
  }

  // Hard mode: Minimax with Alpha-Beta Pruning (depth 2 with selective quiescence)
  let bestScore = -Infinity;
  let bestMove: { from: Position; to: Position } | null = null;
  const opponentSide: Side = aiSide === 'cho' ? 'han' : 'cho';

  // Sort moves for better alpha-beta pruning (captures first)
  const sortedMoves = [...flatMoves].sort((a, b) => {
    const targetA = gameState.pieces.find(p => p.r === a.to.r && p.c === a.to.c);
    const targetB = gameState.pieces.find(p => p.r === b.to.r && p.c === b.to.c);
    const valA = targetA ? PIECE_VALUES[targetA.type] : 0;
    const valB = targetB ? PIECE_VALUES[targetB.type] : 0;
    return valB - valA;
  });

  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of sortedMoves) {
    const { newPieces, capturedPiece } = simulateMove(gameState.pieces, move.from, move.to);

    // Opponent turn (minimizing)
    const oppMoves = getAllLegalMovesForSide(newPieces, opponentSide);
    let minScore = Infinity;

    if (oppMoves.length === 0) {
      if (isSideInCheck(newPieces, opponentSide)) {
        minScore = 10000; // Checkmate victory
      } else {
        minScore = 0; // Stalemate
      }
    } else {
      // Evaluate top opponent responses
      let count = 0;
      for (const oppGroup of oppMoves) {
        for (const oppTarget of oppGroup.moves) {
          const { newPieces: afterOppPieces } = simulateMove(
            newPieces,
            { r: oppGroup.piece.r, c: oppGroup.piece.c },
            oppTarget
          );
          const evalScore = evaluateBoard(afterOppPieces, aiSide);
          if (evalScore < minScore) {
            minScore = evalScore;
          }
          count++;
          if (count > 25) break; // Limit branch factor for smooth UI response (<100ms)
        }
        if (count > 25) break;
      }
    }

    if (capturedPiece) {
      minScore += PIECE_VALUES[capturedPiece.type] * 30;
    }

    if (minScore > bestScore) {
      bestScore = minScore;
      bestMove = { from: move.from, to: move.to };
    }
    alpha = Math.max(alpha, bestScore);
    if (beta <= alpha) break;
  }

  return bestMove || { from: flatMoves[0].from, to: flatMoves[0].to };
}
