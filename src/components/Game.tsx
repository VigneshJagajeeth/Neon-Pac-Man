import React, { useEffect, useRef, useState } from 'react';
import { GameSettings, CellType, Direction, Point, DIRECTION_VECTORS } from '../types';
import { MapGenerator } from '../lib/MapGenerator';
import { bfs } from '../lib/AI';
import { soundManager } from '../lib/SoundManager';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Home, Ghost as GhostIcon, Zap, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

const TILE_SIZE = 32;
const PACMAN_SPEED = 0.12;

interface Ghost {
  pos: Point;
  target: Point;
  color: string;
  direction: Direction;
  isScared: boolean;
  id: number;
  offset: Point;
}

interface GameProps {
  settings: GameSettings;
  onBack: () => void;
}

export const Game: React.FC<GameProps> = ({ settings, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [grid, setGrid] = useState<CellType[][]>([]);
  
  const stateRef = useRef({
    pacman: { x: 1, y: 1 },
    pacmanDir: Direction.NONE,
    nextDir: Direction.NONE,
    ghosts: [] as Ghost[],
    pelletsLeft: 0,
    powerMode: 0, // frames left
    lastUpdate: 0,
    animationFrame: 0,
    grid: [] as CellType[][],
  });

  useEffect(() => {
    const generator = new MapGenerator();
    const density = settings.difficulty === 'easy' ? 0.3 : settings.difficulty === 'medium' ? 0.5 : 0.7;
    const newGrid = settings.mapType === 'classic' ? generator.getClassicMap() : generator.generate(21, 21, density);
    
    let pellets = 0;
    newGrid.forEach(row => row.forEach(cell => {
      if (cell === 'pellet' || cell === 'powerPellet') pellets++;
    }));

    const midX = settings.mapType === 'classic' ? 10 : Math.floor(newGrid[0].length / 2);
    const midY = settings.mapType === 'classic' ? 11 : Math.floor(newGrid.length / 2);
    const pacX = settings.mapType === 'classic' ? 10 : 1;
    const pacY = settings.mapType === 'classic' ? 15 : 1;

    const colors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb852'];
    const ghosts: Ghost[] = Array.from({ length: settings.ghostCount }).map((_, i) => ({
      pos: { x: midX, y: midY },
      target: { x: midX, y: midY },
      color: colors[i % colors.length],
      direction: Direction.NONE,
      isScared: false,
      id: i,
      offset: { x: 0, y: 0 }
    }));

    stateRef.current = {
      pacman: { x: pacX, y: pacY },
      pacmanDir: Direction.NONE,
      nextDir: Direction.NONE,
      ghosts,
      pelletsLeft: pellets,
      powerMode: 0,
      lastUpdate: performance.now(),
      animationFrame: 0,
      grid: JSON.parse(JSON.stringify(newGrid)),
    };
    setGrid(newGrid);
    setScore(0);
    setLives(3);
    setGameState('playing');

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': stateRef.current.nextDir = Direction.UP; break;
        case 'ArrowDown': stateRef.current.nextDir = Direction.DOWN; break;
        case 'ArrowLeft': stateRef.current.nextDir = Direction.LEFT; break;
        case 'ArrowRight': stateRef.current.nextDir = Direction.RIGHT; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const loop = (time: number) => {
      update(time);
      draw();
      stateRef.current.animationFrame = requestAnimationFrame(loop);
    };
    stateRef.current.animationFrame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(stateRef.current.animationFrame);
    };
  }, [settings]);

  const update = (time: number) => {
    if (gameState !== 'playing') return;
    
    const dt = time - stateRef.current.lastUpdate;
    if (dt < 16) return; // Cap at ~60fps
    stateRef.current.lastUpdate = time;

    const { pacman, pacmanDir, nextDir, grid: currentGrid, ghosts, powerMode } = stateRef.current;

    // Handle power mode timer
    if (powerMode > 0) {
      stateRef.current.powerMode -= dt;
      if (stateRef.current.powerMode <= 0) {
        ghosts.forEach(g => g.isScared = false);
      }
    }

    // Try to change direction
    if (nextDir !== Direction.NONE) {
      const vec = DIRECTION_VECTORS[nextDir];
      const nx = Math.round(pacman.x + vec.x);
      const ny = Math.round(pacman.y + vec.y);
      if (currentGrid[ny]?.[nx] !== 'wall') {
        stateRef.current.pacmanDir = nextDir;
        stateRef.current.nextDir = Direction.NONE;
      }
    }

    // Move Pac-Man
    if (stateRef.current.pacmanDir !== Direction.NONE) {
      const vec = DIRECTION_VECTORS[stateRef.current.pacmanDir];
      
      // Calculate next position
      let nx = pacman.x + vec.x * PACMAN_SPEED;
      let ny = pacman.y + vec.y * PACMAN_SPEED;
      
      const width = currentGrid[0].length;
      
      // Teleportation
      if (nx < -0.5) nx = width - 0.5;
      if (nx >= width - 0.5) nx = -0.5;

      const gridX = Math.floor(nx + 0.5);
      const safeGridX = (gridX + width) % width;
      const gridY = Math.round(ny);

      if (currentGrid[gridY]?.[safeGridX] !== 'wall') {
        // Strict grid alignment: snap to center of track if moving perpendicular
        if (vec.x !== 0) ny = Math.round(ny);
        if (vec.y !== 0) nx = Math.round(nx);
        
        stateRef.current.pacman = { x: nx, y: ny };

        // Eat pellets
        const cell = currentGrid[gridY][safeGridX];
        if (cell === 'pellet') {
          currentGrid[gridY][safeGridX] = 'empty';
          setScore(s => s + 10);
          stateRef.current.pelletsLeft--;
          soundManager.playEat();
        } else if (cell === 'powerPellet') {
          currentGrid[gridY][safeGridX] = 'empty';
          setScore(s => s + 50);
          stateRef.current.pelletsLeft--;
          stateRef.current.powerMode = 8000; // 8 seconds
          ghosts.forEach(g => g.isScared = true);
          soundManager.playPowerUp();
        }

        if (stateRef.current.pelletsLeft === 0) {
          setGameState('won');
          soundManager.playWin();
        }
      } else {
        // Snap to grid if hitting wall
        stateRef.current.pacman = { x: Math.round(pacman.x), y: Math.round(pacman.y) };
        stateRef.current.pacmanDir = Direction.NONE;
      }
    }

    // Move Ghosts
    ghosts.forEach(ghost => {
      // Vary speed slightly based on ID to prevent exact overlapping
      const ghostSpeed = settings.ghostSpeed * (ghost.isScared ? 0.6 : 1) * (1 - ghost.id * 0.05);
      
      // AI decision at grid intersections
      if (Math.abs(ghost.pos.x - Math.round(ghost.pos.x)) < 0.1 && Math.abs(ghost.pos.y - Math.round(ghost.pos.y)) < 0.1) {
        const gridPos = { x: Math.round(ghost.pos.x), y: Math.round(ghost.pos.y) };
        
        // Anti-stacking: Each ghost has a unique target strategy
        let target = { x: Math.round(pacman.x), y: Math.round(pacman.y) };
        
        if (ghost.isScared) {
          // Run to different corners based on ID
          const corners = [
            { x: 1, y: 1 },
            { x: currentGrid[0].length - 2, y: 1 },
            { x: 1, y: currentGrid.length - 2 },
            { x: currentGrid[0].length - 2, y: currentGrid.length - 2 }
          ];
          target = corners[ghost.id % corners.length];
        } else {
          // Unique Chase Behaviors
          switch (ghost.id % 4) {
            case 0: // Blinky: Direct chase
              target = { x: Math.round(pacman.x), y: Math.round(pacman.y) };
              break;
            case 1: // Pinky: Target 4 tiles ahead
              const pvec = DIRECTION_VECTORS[stateRef.current.pacmanDir];
              target = { 
                x: Math.round(pacman.x + pvec.x * 4), 
                y: Math.round(pacman.y + pvec.y * 4) 
              };
              break;
            case 2: // Inky: Target 2 tiles behind
              const bvec = DIRECTION_VECTORS[stateRef.current.pacmanDir];
              target = { 
                x: Math.round(pacman.x - bvec.x * 2), 
                y: Math.round(pacman.y - bvec.y * 2) 
              };
              break;
            case 3: // Clyde: Target random spot if too close, otherwise chase
              const distToPac = Math.sqrt(Math.pow(ghost.pos.x - pacman.x, 2) + Math.pow(ghost.pos.y - pacman.y, 2));
              if (distToPac < 8) {
                target = { x: 1, y: currentGrid.length - 2 };
              } else {
                target = { x: Math.round(pacman.x), y: Math.round(pacman.y) };
              }
              break;
          }

          // Add extra offset for ghosts beyond the first 4 to prevent stacking
          if (ghost.id >= 4) {
            target.x += (ghost.id % 2 === 0 ? 2 : -2);
            target.y += (ghost.id % 3 === 0 ? 2 : -2);
          }
        }

        const nextDir = bfs(gridPos, target, currentGrid);
        if (nextDir !== Direction.NONE) {
          ghost.direction = nextDir;
        }
      }

      const vec = DIRECTION_VECTORS[ghost.direction];
      let nx = ghost.pos.x + vec.x * ghostSpeed;
      let ny = ghost.pos.y + vec.y * ghostSpeed;

      const width = currentGrid[0].length;
      
      // Teleportation
      if (nx < -0.5) nx = width - 0.5;
      if (nx >= width - 0.5) nx = -0.5;

      const gridX = Math.floor(nx + 0.5);
      const safeGridX = (gridX + width) % width;
      const gridY = Math.round(ny);

      if (currentGrid[gridY]?.[safeGridX] !== 'wall') {
        if (vec.x !== 0) ny = Math.round(ny);
        if (vec.y !== 0) nx = Math.round(nx);
        ghost.pos = { x: nx, y: ny };
      } else {
        ghost.pos = { x: Math.round(ghost.pos.x), y: Math.round(ghost.pos.y) };
        // Force new direction decision next frame
        ghost.direction = Direction.NONE;
      }

      // Collision with Pac-Man
      const dist = Math.sqrt(Math.pow(ghost.pos.x - pacman.x, 2) + Math.pow(ghost.pos.y - pacman.y, 2));
      if (dist < 0.7) {
        if (ghost.isScared) {
          // Eat ghost
          ghost.pos = { x: Math.floor(currentGrid[0].length / 2), y: Math.floor(currentGrid.length / 2) };
          ghost.isScared = false;
          setScore(s => s + 200);
          soundManager.playGhostEat();
        } else {
          // Pac-Man dies
          setLives(l => {
            if (l <= 1) {
              setGameState('lost');
              soundManager.playDeath();
              return 0;
            }
            // Reset positions
            const midX = settings.mapType === 'classic' ? 10 : Math.floor(currentGrid[0].length / 2);
            const midY = settings.mapType === 'classic' ? 11 : Math.floor(currentGrid.length / 2);
            const pacX = settings.mapType === 'classic' ? 10 : 1;
            const pacY = settings.mapType === 'classic' ? 15 : 1;
            
            stateRef.current.pacman = { x: pacX, y: pacY };
            stateRef.current.pacmanDir = Direction.NONE;
            ghosts.forEach(g => {
              g.pos = { x: midX, y: midY };
              g.direction = Direction.NONE;
            });
            soundManager.playDeath();
            return l - 1;
          });
        }
      }
    });
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { pacman, pacmanDir, ghosts, grid: currentGrid, powerMode } = stateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    currentGrid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 'wall') {
          ctx.fillStyle = '#1a1a2e';
          ctx.strokeStyle = '#00f2ff';
          ctx.lineWidth = 2;
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.strokeRect(x * TILE_SIZE + 2, y * TILE_SIZE + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        } else if (cell === 'pellet') {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === 'powerPellet') {
          ctx.fillStyle = '#fff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#fff';
          ctx.beginPath();
          ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
    });

    // Draw Pac-Man
    const px = pacman.x * TILE_SIZE + TILE_SIZE / 2;
    const py = pacman.y * TILE_SIZE + TILE_SIZE / 2;
    
    ctx.save();
    ctx.translate(px, py);
    if (pacmanDir === Direction.UP) ctx.rotate(-Math.PI / 2);
    if (pacmanDir === Direction.DOWN) ctx.rotate(Math.PI / 2);
    if (pacmanDir === Direction.LEFT) ctx.rotate(Math.PI);
    
    ctx.fillStyle = '#ffff00';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffff00';
    
    const mouthOpen = Math.abs(Math.sin(Date.now() / 100)) * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, TILE_SIZE / 2 - 2, mouthOpen * Math.PI, (2 - mouthOpen) * Math.PI);
    ctx.fill();
    ctx.restore();

    // Draw Ghosts
    ghosts.forEach(ghost => {
      const gx = (ghost.pos.x + ghost.offset.x) * TILE_SIZE + TILE_SIZE / 2;
      const gy = (ghost.pos.y + ghost.offset.y) * TILE_SIZE + TILE_SIZE / 2;
      
      ctx.fillStyle = ghost.isScared ? (powerMode < 2000 && Math.floor(Date.now() / 200) % 2 === 0 ? '#fff' : '#0000ff') : ghost.color;
      ctx.shadowBlur = 25;
      ctx.shadowColor = ctx.fillStyle as string;
      
      // Ghost Body
      ctx.beginPath();
      ctx.arc(gx, gy - 2, TILE_SIZE / 2 - 4, Math.PI, 0);
      ctx.lineTo(gx + TILE_SIZE / 2 - 4, gy + TILE_SIZE / 2 + 4);
      
      // Wavy bottom
      for (let i = 0; i <= 3; i++) {
        const x = gx + (TILE_SIZE / 2 - 4) - (i * (TILE_SIZE - 8) / 3);
        const y = gy + TILE_SIZE / 2 + 4 + (Math.sin(Date.now() / 100 + i) * 2);
        ctx.lineTo(x, y);
      }
      
      ctx.lineTo(gx - TILE_SIZE / 2 + 4, gy + TILE_SIZE / 2 + 4);
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(gx - 5, gy - 4, 4, 0, Math.PI * 2);
      ctx.arc(gx + 5, gy - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(gx - 5, gy - 4, 2, 0, Math.PI * 2);
      ctx.arc(gx + 5, gy - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  const width = grid[0]?.length || 21;
  const height = grid.length || 21;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#050505] text-white p-4 font-mono flex flex-col items-center">
      <div className="w-full max-w-2xl flex justify-between items-center mb-4 bg-[#1a1a2e]/80 backdrop-blur-md p-4 rounded-xl border border-[#00f2ff]/30 shadow-[0_0_20px_rgba(0,242,255,0.1)] shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-[#00f2ff]/60">Score</span>
            <span className="text-2xl font-bold text-[#00f2ff]">{score.toString().padStart(6, '0')}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart 
              key={i} 
              className={cn(
                "w-6 h-6 transition-all duration-300",
                i < lives ? "text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "text-gray-800"
              )} 
            />
          ))}
        </div>

        <button 
          onClick={onBack}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-[#00f2ff]"
        >
          <Home className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#00f2ff] to-[#7000ff] rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 pointer-events-none"></div>
        <canvas 
          ref={canvasRef} 
          width={width * TILE_SIZE} 
          height={height * TILE_SIZE}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          className="relative z-10 bg-black rounded-lg border-2 border-[#00f2ff]/50 shadow-[0_0_30px_rgba(0,242,255,0.2)]"
        />

        <AnimatePresence>
          {gameState !== 'playing' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg z-20"
            >
              <div className="text-center p-8 border-2 border-[#00f2ff] rounded-2xl bg-[#050505] shadow-[0_0_50px_rgba(0,242,255,0.3)]">
                <h2 className={cn(
                  "text-5xl font-black mb-6 uppercase tracking-tighter italic",
                  gameState === 'won' ? "text-[#00f2ff] drop-shadow-[0_0_15px_rgba(0,242,255,0.8)]" : "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                )}>
                  {gameState === 'won' ? 'Victory!' : 'Game Over'}
                </h2>
                <div className="flex flex-col gap-4">
                  <div className="text-2xl text-white/80 mb-4">
                    Final Score: <span className="text-[#00f2ff] font-bold">{score}</span>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-[#00f2ff] text-black font-bold rounded-xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Play Again
                  </button>
                  <button 
                    onClick={onBack}
                    className="px-8 py-4 border-2 border-[#00f2ff] text-[#00f2ff] font-bold rounded-xl hover:bg-[#00f2ff]/10 transition-all uppercase tracking-widest"
                  >
                    Main Menu
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-8 text-[10px] text-white/40 uppercase tracking-[0.2em] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00f2ff] animate-pulse"></div>
          <span>BFS Search AI</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#7000ff] animate-pulse"></div>
          <span>Procedural Maze v3.0</span>
        </div>
      </div>
    </div>
  );
};
