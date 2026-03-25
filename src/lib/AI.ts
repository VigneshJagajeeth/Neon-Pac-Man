import { Point, Direction, CellType } from '../types';

export function bfs(start: Point, target: Point, grid: CellType[][]): Direction {
  const queue: { x: number; y: number; path: Direction[] }[] = [
    { x: Math.round(start.x), y: Math.round(start.y), path: [] }
  ];
  const visited = new Set<string>();
  visited.add(`${Math.round(start.x)},${Math.round(start.y)}`);

  const directions = [
    { x: 0, y: -1, dir: Direction.UP },
    { x: 0, y: 1, dir: Direction.DOWN },
    { x: -1, y: 0, dir: Direction.LEFT },
    { x: 1, y: 0, dir: Direction.RIGHT }
  ];

  while (queue.length > 0) {
    const { x, y, path } = queue.shift()!;

    if (x === Math.round(target.x) && y === Math.round(target.y)) {
      return path.length > 0 ? path[0] : Direction.NONE;
    }

    for (const { x: dx, y: dy, dir } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        ny >= 0 && ny < grid.length &&
        nx >= 0 && nx < grid[0].length &&
        grid[ny][nx] !== 'wall' &&
        !visited.has(`${nx},${ny}`)
      ) {
        visited.add(`${nx},${ny}`);
        queue.push({ x: nx, y: ny, path: [...path, dir] });
      }
    }
  }

  return Direction.NONE;
}
