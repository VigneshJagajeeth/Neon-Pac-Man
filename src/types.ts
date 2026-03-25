export interface GameSettings {
  ghostCount: number;
  ghostSpeed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  mapType: 'procedural' | 'classic';
}

export type CellType = 'wall' | 'path' | 'pellet' | 'powerPellet' | 'empty';

export interface Point {
  x: number;
  y: number;
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  NONE = 'NONE'
}

export const DIRECTION_VECTORS: Record<Direction, Point> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
  [Direction.NONE]: { x: 0, y: 0 }
};
