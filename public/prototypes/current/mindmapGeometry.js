import { PORT_OUTSET } from './mindmapConstants.js';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function marqueeRectFromPoints(start, current) {
  const left = Math.min(start.x, current.x);
  const top = Math.min(start.y, current.y);
  const right = Math.max(start.x, current.x);
  const bottom = Math.max(start.y, current.y);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}

export function rectsOverlap(a, b, margin = 0) {
  if (!a || !b) return false;
  return a.left < b.right + margin && a.right > b.left - margin && a.top < b.bottom + margin && a.bottom > b.top - margin;
}

export function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function autoPort(rect, target) {
  const dx = target.cx - rect.cx;
  const dy = target.cy - rect.cy;
  if (Math.abs(dx / Math.max(1, rect.w)) > Math.abs(dy / Math.max(1, rect.h))) return dx >= 0 ? 'right' : 'left';
  return dy >= 0 ? 'bottom' : 'top';
}

export function sideVector(side) {
  if (side === 'top') return { x: 0, y: -1 };
  if (side === 'right') return { x: 1, y: 0 };
  if (side === 'bottom') return { x: 0, y: 1 };
  if (side === 'left') return { x: -1, y: 0 };
  return { x: 0, y: 0 };
}

export function portPoint(rect, port, target) {
  const side = port && port !== 'auto' ? port : autoPort(rect, target);
  if (side === 'top') return { cx: rect.cx, cy: rect.y - PORT_OUTSET, side };
  if (side === 'right') return { cx: rect.x + rect.w + PORT_OUTSET, cy: rect.cy, side };
  if (side === 'bottom') return { cx: rect.cx, cy: rect.y + rect.h + PORT_OUTSET, side };
  if (side === 'left') return { cx: rect.x - PORT_OUTSET, cy: rect.cy, side };
  return { cx: rect.cx, cy: rect.cy, side: 'center' };
}

export function cubicPoint(a, c1, c2, b, t = 0.5) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * a.cx + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t * t * t * b.cx,
    y: mt * mt * mt * a.cy + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t * t * t * b.cy,
  };
}

export function quadPoint(a, c, b, t = 0.5) {
  const mt = 1 - t;
  return { x: mt * mt * a.cx + 2 * mt * t * c.x + t * t * b.cx, y: mt * mt * a.cy + 2 * mt * t * c.y + t * t * b.cy };
}

export function edgeGeometry(a, b, shape) {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const dist = Math.max(1, Math.hypot(dx, dy));
  const mx = (a.cx + b.cx) / 2;
  const my = (a.cy + b.cy) / 2;
  const av = sideVector(a.side);
  const bv = sideVector(b.side);
  if (shape === 'straight') return { d: `M ${a.cx} ${a.cy} L ${b.cx} ${b.cy}`, mid: { x: mx, y: my } };
  if (shape === 'elbow') {
    const lead = clamp(dist * 0.12, 18, 58);
    const a1 = { x: a.cx + av.x * lead, y: a.cy + av.y * lead };
    const b1 = { x: b.cx + bv.x * lead, y: b.cy + bv.y * lead };
    const horizontalFirst = a.side === 'left' || a.side === 'right';
    if (horizontalFirst) {
      const xMid = (a1.x + b1.x) / 2;
      return {
        d: `M ${a.cx} ${a.cy} L ${a1.x} ${a1.y} L ${xMid} ${a1.y} L ${xMid} ${b1.y} L ${b1.x} ${b1.y} L ${b.cx} ${b.cy}`,
        mid: { x: xMid, y: (a1.y + b1.y) / 2 },
      };
    }
    const yMid = (a1.y + b1.y) / 2;
    return {
      d: `M ${a.cx} ${a.cy} L ${a1.x} ${a1.y} L ${a1.x} ${yMid} L ${b1.x} ${yMid} L ${b1.x} ${b1.y} L ${b.cx} ${b.cy}`,
      mid: { x: (a1.x + b1.x) / 2, y: yMid },
    };
  }
  if (shape === 'arc') {
    const bend = clamp(dist * 0.10, 8, 54);
    const nx = -dy / dist;
    const ny = dx / dist;
    const c = { x: mx + nx * bend, y: my + ny * bend };
    return { d: `M ${a.cx} ${a.cy} Q ${c.x} ${c.y} ${b.cx} ${b.cy}`, mid: quadPoint(a, c, b, 0.5) };
  }
  const handle = clamp(dist * 0.28, 32, 150);
  const c1 = { x: a.cx + av.x * handle, y: a.cy + av.y * handle };
  const c2 = { x: b.cx + bv.x * handle, y: b.cy + bv.y * handle };
  return { d: `M ${a.cx} ${a.cy} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.cx} ${b.cy}`, mid: cubicPoint(a, c1, c2, b, 0.5) };
}
