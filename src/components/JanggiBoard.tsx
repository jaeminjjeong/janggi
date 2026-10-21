import React, { useMemo } from 'react';
import { BoardState, Piece, Position, Side } from '../game/types';
import { JanggiPiece } from './JanggiPiece';
import boardWoodBg from '../assets/images/janggi_board_wood_1792546836656.jpg';

interface JanggiBoardProps {
  gameState: BoardState;
  selectedPos: Position | null;
  validMoves: Position[];
  playerSide?: Side | 'spectator';
  isFlipped?: boolean;
  useHanja?: boolean;
  onSelectPiece: (piece: Piece) => void;
  onMakeMove: (to: Position) => void;
}

export const JanggiBoard: React.FC<JanggiBoardProps> = ({
  gameState,
  selectedPos,
  validMoves,
  playerSide = 'cho',
  isFlipped = false,
  useHanja = true,
  onSelectPiece,
  onMakeMove,
}) => {
  // 10 rows (0..9) and 9 columns (0..8)
  // Determine coordinate mapping based on isFlipped
  // If isFlipped is true, display row 0 at the bottom and col 8 at the left
  const displayRow = (r: number) => (isFlipped ? 9 - r : r);
  const displayCol = (c: number) => (isFlipped ? 8 - c : c);
  const actualRow = (dr: number) => (isFlipped ? 9 - dr : dr);
  const actualCol = (dc: number) => (isFlipped ? 8 - dc : dc);

  // SVG dimensions for scalable, sharp board lines
  // Width: 8 intervals * 50 = 400 + 40 margin = 440
  // Height: 9 intervals * 50 = 450 + 40 margin = 490
  const SVG_MARGIN = 24;
  const CELL_SIZE = 46;
  const SVG_WIDTH = 8 * CELL_SIZE + 2 * SVG_MARGIN;
  const SVG_HEIGHT = 9 * CELL_SIZE + 2 * SVG_MARGIN;

  // Map board intersection (r, c) to SVG pixel coordinates
  const getPixelCoord = (r: number, c: number) => {
    const dr = displayRow(r);
    const dc = displayCol(c);
    return {
      x: SVG_MARGIN + dc * CELL_SIZE,
      y: SVG_MARGIN + dr * CELL_SIZE,
    };
  };

  const selectedPiece = useMemo(() => {
    if (!selectedPos) return null;
    return gameState.pieces.find(p => p.r === selectedPos.r && p.c === selectedPos.c);
  }, [selectedPos, gameState.pieces]);

  // Points that have flower/star cross marks (화점)
  const flowerPoints: Position[] = [
    { r: 2, c: 1 }, { r: 2, c: 7 }, // Han Cannon
    { r: 3, c: 0 }, { r: 3, c: 2 }, { r: 3, c: 4 }, { r: 3, c: 6 }, { r: 3, c: 8 }, // Han Byeong
    { r: 6, c: 0 }, { r: 6, c: 2 }, { r: 6, c: 4 }, { r: 6, c: 6 }, { r: 6, c: 8 }, // Cho Jol
    { r: 7, c: 1 }, { r: 7, c: 7 }, // Cho Cannon
  ];

  const lastMove = gameState.lastMove;

  return (
    <div className="relative w-full max-w-[500px] mx-auto select-none p-2 sm:p-4">
      {/* Outer wooden border container */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-[#8c5828]/80 bg-[#d99b59]"
        style={{
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Background wood texture with fallback color */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-90 pointer-events-none"
          style={{
            backgroundImage: `url(${boardWoodBg})`,
            backgroundColor: '#deb887',
          }}
        />

        {/* Board Surface with SVG Lines and Intersections */}
        <div className="relative w-full aspect-[440/490]">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Board Background soft glow/gradient */}
            <rect
              x={SVG_MARGIN - 8}
              y={SVG_MARGIN - 8}
              width={8 * CELL_SIZE + 16}
              height={9 * CELL_SIZE + 16}
              fill="rgba(255, 255, 255, 0.08)"
              rx="6"
            />

            {/* 10 Horizontal lines */}
            {Array.from({ length: 10 }).map((_, dr) => {
              const y = SVG_MARGIN + dr * CELL_SIZE;
              return (
                <line
                  key={`h-${dr}`}
                  x1={SVG_MARGIN}
                  y1={y}
                  x2={SVG_WIDTH - SVG_MARGIN}
                  y2={y}
                  stroke="#54300d"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              );
            })}

            {/* 9 Vertical lines (Full lines across board - distinct to Korean Janggi) */}
            {Array.from({ length: 9 }).map((_, dc) => {
              const x = SVG_MARGIN + dc * CELL_SIZE;
              return (
                <line
                  key={`v-${dc}`}
                  x1={x}
                  y1={SVG_MARGIN}
                  x2={x}
                  y2={SVG_HEIGHT - SVG_MARGIN}
                  stroke="#54300d"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Han Palace Diagonals: rows 0..2, cols 3..5 */}
            {(() => {
              const p03 = getPixelCoord(0, 3);
              const p25 = getPixelCoord(2, 5);
              const p05 = getPixelCoord(0, 5);
              const p23 = getPixelCoord(2, 3);
              return (
                <g stroke="#54300d" strokeWidth="1.8" strokeLinecap="round">
                  <line x1={p03.x} y1={p03.y} x2={p25.x} y2={p25.y} />
                  <line x1={p05.x} y1={p05.y} x2={p23.x} y2={p23.y} />
                </g>
              );
            })()}

            {/* Cho Palace Diagonals: rows 7..9, cols 3..5 */}
            {(() => {
              const p73 = getPixelCoord(7, 3);
              const p95 = getPixelCoord(9, 5);
              const p75 = getPixelCoord(7, 5);
              const p93 = getPixelCoord(9, 3);
              return (
                <g stroke="#54300d" strokeWidth="1.8" strokeLinecap="round">
                  <line x1={p73.x} y1={p73.y} x2={p95.x} y2={p95.y} />
                  <line x1={p75.x} y1={p75.y} x2={p93.x} y2={p93.y} />
                </g>
              );
            })()}

            {/* Traditional Flower / Star markers (화점) */}
            {flowerPoints.map((pt, idx) => {
              const { x, y } = getPixelCoord(pt.r, pt.c);
              const d = 5;
              const g = 2.5;
              return (
                <g key={`flower-${idx}`} stroke="#54300d" strokeWidth="1.2" fill="none">
                  {/* Top-left bracket */}
                  <path d={`M ${x - d} ${y - g} L ${x - g} ${y - g} L ${x - g} ${y - d}`} />
                  {/* Top-right bracket */}
                  <path d={`M ${x + d} ${y - g} L ${x + g} ${y - g} L ${x + g} ${y - d}`} />
                  {/* Bottom-left bracket */}
                  <path d={`M ${x - d} ${y + g} L ${x - g} ${y + g} L ${x - g} ${y + d}`} />
                  {/* Bottom-right bracket */}
                  <path d={`M ${x + d} ${y + g} L ${x + g} ${y + g} L ${x + g} ${y + d}`} />
                </g>
              );
            })}

            {/* Last move indicator tracks */}
            {lastMove && lastMove.from.r >= 0 && (
              (() => {
                const pFrom = getPixelCoord(lastMove.from.r, lastMove.from.c);
                const pTo = getPixelCoord(lastMove.to.r, lastMove.to.c);
                return (
                  <g>
                    {/* From point ring */}
                    <circle
                      cx={pFrom.x}
                      cy={pFrom.y}
                      r="16"
                      fill="rgba(245, 158, 11, 0.25)"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                    {/* To point ring */}
                    <circle
                      cx={pTo.x}
                      cy={pTo.y}
                      r="18"
                      fill="rgba(245, 158, 11, 0.3)"
                      stroke="#d97706"
                      strokeWidth="2"
                    />
                  </g>
                );
              })()
            )}
          </svg>

          {/* Interactive Layer: Pieces and Clickable Hitboxes */}
          {/* We position each intersection using percentage based on SVG dimensions */}
          {Array.from({ length: 10 }).map((_, dr) =>
            Array.from({ length: 9 }).map((_, dc) => {
              const r = actualRow(dr);
              const c = actualCol(dc);
              const piece = gameState.pieces.find(p => p.r === r && p.c === c);
              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const isValidTarget = validMoves.some(m => m.r === r && m.c === c);
              const isTargetWithEnemy = isValidTarget && piece && piece.side !== gameState.turn;

              const isGeneralInCheck =
                piece?.type === 'general' &&
                gameState.isCheck &&
                piece.side === gameState.turn;

              // Percentage coordinates
              const leftPercent = ((SVG_MARGIN + dc * CELL_SIZE) / SVG_WIDTH) * 100;
              const topPercent = ((SVG_MARGIN + dr * CELL_SIZE) / SVG_HEIGHT) * 100;

              return (
                <div
                  key={`cell-${r}-${c}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `${CELL_SIZE}px`,
                    height: `${CELL_SIZE}px`,
                  }}
                  onClick={() => {
                    if (isValidTarget) {
                      onMakeMove({ r, c });
                    } else if (piece) {
                      onSelectPiece(piece);
                    }
                  }}
                >
                  {/* Valid move indicator */}
                  {isValidTarget && (
                    <div
                      className={`absolute z-30 flex items-center justify-center transition-all ${
                        isTargetWithEnemy
                          ? 'w-10 h-10 rounded-full border-2 border-red-500 bg-red-500/30 ring-2 ring-red-400 animate-pulse'
                          : 'w-4 h-4 rounded-full bg-emerald-600 border border-white shadow-md ring-4 ring-emerald-400/40'
                      }`}
                    />
                  )}

                  {/* Piece */}
                  {piece && (
                    <JanggiPiece
                      piece={piece}
                      isSelected={isSelected}
                      isLastMove={lastMove?.to.r === r && lastMove?.to.c === c}
                      isInCheck={isGeneralInCheck}
                      useHanja={useHanja}
                      size={CELL_SIZE - 2}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
