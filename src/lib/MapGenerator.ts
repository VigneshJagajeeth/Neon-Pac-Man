import { createNoise2D } from 'simplex-noise';
import { CellType, Point } from '../types';

const CLASSIC_MAP_TEMPLATE = [
  "WWWWWWWWWWWWWWWWWWWWW",
  "W........   ........W",
  "W.WWW.WWW W WWW.WWW.W",
  "WoW W.W W W W W.W WoW",
  "W.WWW.WWW W WWW.WWW.W",
  "W...................W",
  "W.WWW.W.WWWWW.W.WWW.W",
  "W.....W...W...W.....W",
  "WWWWW.WWW W WWW.WWWWW",
  "    W.W       W.W    ",
  "WWWWW.W WW WW W.WWWWW",
  "     .  W   W  .     ",
  "WWWWW.W WWWWW W.WWWWW",
  "    W.W       W.W    ",
  "WWWWW.W WWWWW W.WWWWW",
  "W......... .........W",
  "W.WWW.WWW W WWW.WWW.W",
  "Wo..W...........W..oW",
  "WWW.W.W.WWWWW.W.W.WWW",
  "W.....W...W...W.....W",
  "WWWWWWWWWWWWWWWWWWWWW"
];

export class MapGenerator {
  private noise2D = createNoise2D();

  getClassicMap(): CellType[][] {
    return CLASSIC_MAP_TEMPLATE.map(row => 
      row.split('').map(char => {
        if (char === 'W') return 'wall';
        if (char === '.') return 'pellet';
        if (char === 'o') return 'powerPellet';
        return 'empty';
      })
    ) as CellType[][];
  }

  generate(width: number, height: number, density: number): CellType[][] {
    const w = width % 2 === 0 ? width + 1 : width;
    const h = height % 2 === 0 ? height + 1 : height;
    let grid: CellType[][] = Array(h).fill(null).map(() => Array(w).fill('wall'));

    // DFS Maze Generation
    const carve = (x: number, y: number) => {
      grid[y][x] = 'empty';
      const dirs = [
        { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
        { dx: -2, dy: 0 }, { dx: 2, dy: 0 }
      ].sort(() => Math.random() - 0.5);

      for (const { dx, dy } of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === 'wall') {
          grid[y + dy / 2][x + dx / 2] = 'empty';
          carve(nx, ny);
        }
      }
    };

    carve(1, 1);

    // Add loops by breaking random walls
    const extraPaths = Math.floor((w * h) * density * 0.5);
    for (let i = 0; i < extraPaths; i++) {
      const x = Math.floor(Math.random() * (w - 2)) + 1;
      const y = Math.floor(Math.random() * (h - 2)) + 1;
      if (grid[y][x] === 'wall') {
        // Ensure we don't break outer boundary
        if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
          grid[y][x] = 'empty';
        }
      }
    }

    // Ensure center is open for ghosts
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    for(let y = cy - 1; y <= cy + 1; y++) {
      for(let x = cx - 1; x <= cx + 1; x++) {
        grid[y][x] = 'empty';
      }
    }

    // Populate pellets
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (grid[y][x] === 'empty') {
          if (Math.random() < 0.05) {
            grid[y][x] = 'powerPellet';
          } else {
            grid[y][x] = 'pellet';
          }
        }
      }
    }

    // Clear spawn areas
    grid[1][1] = 'empty';
    grid[cy][cx] = 'empty';

    return grid;
  }
}
