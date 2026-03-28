import type { PageViewport } from 'pdfjs-dist';

/**
 * Convert a point from screen (CSS pixels, e.g. from a mouse event) to
 * normalized PDF page coordinates in the range [0, 1].
 *
 * We divide by the element's CSS (layout) size — clientWidth/clientHeight —
 * rather than viewport.width/height.  viewport.width/height reflect the
 * rendered pixel dimensions at the current pdfjs scale factor but do NOT
 * account for device pixel ratio (DPR) scaling applied to the canvas element.
 * On HiDPI / Retina screens the canvas is rendered at a larger backing
 * resolution while its CSS size (clientWidth/clientHeight) matches what the
 * user sees.  Using clientWidth ensures the normalized coordinates are always
 * in [0, 1] regardless of DPR.
 */
export function screenToNormalized(
  screenX: number,
  screenY: number,
  el: Element
): [number, number] {
  const rect = el.getBoundingClientRect();
  return [
    (screenX - rect.left) / rect.width,
    (screenY - rect.top) / rect.height,
  ];
}

/**
 * Convert normalized coordinates back to viewport (CSS pixel) coordinates.
 */
export function normalizedToViewport(
  normX: number,
  normY: number,
  viewport: PageViewport
): [number, number] {
  return [normX * viewport.width, normY * viewport.height];
}

/**
 * Scale a normalized rect to actual pixel dimensions for SVG overlay rendering.
 * The SVG element is sized to viewport.width × viewport.height (CSS pixels),
 * so viewport dimensions are the correct multiplier here.
 */
export function normRectToPixel(
  x: number,
  y: number,
  w: number,
  h: number,
  viewport: PageViewport
): { x: number; y: number; w: number; h: number } {
  return {
    x: x * viewport.width,
    y: y * viewport.height,
    w: w * viewport.width,
    h: h * viewport.height,
  };
}

/**
 * Build a normalized RectData from two normalized corner points.
 * Handles drag direction (user may drag from bottom-right to top-left).
 */
export function makeNormRect(
  p1: [number, number],
  p2: [number, number]
): { x: number; y: number; w: number; h: number } {
  const x = Math.min(p1[0], p2[0]);
  const y = Math.min(p1[1], p2[1]);
  const w = Math.abs(p2[0] - p1[0]);
  const h = Math.abs(p2[1] - p1[1]);
  return { x, y, w, h };
}

/**
 * Simplify a freehand path using a distance threshold in normalized units.
 *
 * A fixed-step filter (keep every Nth point) produces angular artifacts on
 * slow/precise strokes because adjacent points are very close together.
 * Instead, we keep a point only if it is at least `minDist` away from the
 * last kept point (in normalized units).  For the viewport width of ~800px
 * at scale 1.5, a minDist of 0.003 corresponds to roughly 2–3 px, which
 * preserves perceptible direction changes while discarding redundant points.
 */
export function simplifyPoints(
  points: Array<[number, number]>,
  minDist = 0.003
): Array<[number, number]> {
  if (points.length <= 2) return points;

  const result: Array<[number, number]> = [points[0]];
  let [lastX, lastY] = points[0];

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const dx = px - lastX;
    const dy = py - lastY;
    if (Math.sqrt(dx * dx + dy * dy) >= minDist) {
      result.push(points[i]);
      lastX = px;
      lastY = py;
    }
  }

  // Always include the final point so the stroke ends where the mouse lifted
  result.push(points[points.length - 1]);
  return result;
}

/**
 * Convert an array of normalized points to an SVG path string.
 * The SVG coordinate space is in viewport CSS pixels.
 */
export function pointsToSvgPath(
  points: Array<[number, number]>,
  viewport: PageViewport
): string {
  if (points.length < 2) return '';
  return points
    .map(([nx, ny], i) => {
      const px = nx * viewport.width;
      const py = ny * viewport.height;
      return i === 0 ? `M ${px} ${py}` : `L ${px} ${py}`;
    })
    .join(' ');
}
