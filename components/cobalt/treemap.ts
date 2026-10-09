// Squarified treemap (Bruls, Huizing, van Wijk). Lays items out in `rect`, largest first,
// keeping each row's worst aspect ratio as close to 1 as it can. Units follow `rect`.

export interface Rect { x: number; y: number; w: number; h: number }

function worst(areas: number[], side: number) {
  const total = areas.reduce((sum, area) => sum + area, 0);
  const max = Math.max(...areas);
  const min = Math.min(...areas);
  return Math.max((side * side * max) / (total * total), (total * total) / (side * side * min));
}

export function squarify<T>(items: Array<{ value: number; data: T }>, rect: Rect): Array<Rect & { value: number; data: T }> {
  const sorted = items.filter((item) => item.value > 0).sort((a, b) => b.value - a.value);
  const total = sorted.reduce((sum, item) => sum + item.value, 0);
  if (!total || rect.w <= 0 || rect.h <= 0) return [];
  const scale = (rect.w * rect.h) / total;
  const out: Array<Rect & { value: number; data: T }> = [];
  let free = { ...rect };
  let index = 0;

  while (index < sorted.length) {
    const side = Math.min(free.w, free.h);
    const row = [sorted[index]];
    let areas = [sorted[index].value * scale];
    index += 1;
    while (index < sorted.length) {
      const next = [...areas, sorted[index].value * scale];
      if (worst(next, side) > worst(areas, side)) break;
      areas = next;
      row.push(sorted[index]);
      index += 1;
    }
    const rowArea = areas.reduce((sum, area) => sum + area, 0);
    if (free.w >= free.h) {
      const width = rowArea / free.h;
      let y = free.y;
      row.forEach((item, i) => {
        const height = areas[i] / width;
        out.push({ x: free.x, y, w: width, h: height, value: item.value, data: item.data });
        y += height;
      });
      free = { x: free.x + width, y: free.y, w: free.w - width, h: free.h };
    } else {
      const height = rowArea / free.w;
      let x = free.x;
      row.forEach((item, i) => {
        const width = areas[i] / height;
        out.push({ x, y: free.y, w: width, h: height, value: item.value, data: item.data });
        x += width;
      });
      free = { x: free.x, y: free.y + height, w: free.w, h: free.h - height };
    }
  }
  return out;
}
