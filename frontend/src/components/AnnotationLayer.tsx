import { useRef, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { PageViewport } from 'pdfjs-dist';
import type { Annotation, ToolMode, RectData, FreehandData } from '../types';
import {
  screenToNormalized,
  normRectToPixel,
  makeNormRect,
  simplifyPoints,
  pointsToSvgPath,
} from '../utils/pdfCoords';

interface Props {
  pageNum: number;
  viewport: PageViewport;
  annotations: Annotation[];
  toolMode: ToolMode;
  onAnnotationCreate: (a: Annotation) => void;
  onAnnotationSelect: (id: string) => void;
  onAnnotationDelete: (id: string) => void;
  selectedId: string | null;
  currentUser: string;
}

type DrawState =
  | { type: 'idle' }
  | { type: 'rect'; start: [number, number]; current: [number, number] }
  | { type: 'freehand'; points: Array<[number, number]> };

export function AnnotationLayer({
  pageNum,
  viewport,
  annotations,
  toolMode,
  onAnnotationCreate,
  onAnnotationSelect,
  onAnnotationDelete,
  selectedId,
  currentUser,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawState, setDrawState] = useState<DrawState>({ type: 'idle' });

  const getEventNorm = useCallback(
    (e: React.MouseEvent | React.TouchEvent): [number, number] => {
      let clientX, clientY;
      if ('touches' in e) {
        if (e.touches.length === 0) return [0, 0];
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return screenToNormalized(clientX, clientY, svgRef.current!);
    },
    []
  );

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (toolMode === 'rect') {
      const pt = getEventNorm(e);
      setDrawState({ type: 'rect', start: pt, current: pt });
    } else if (toolMode === 'freehand') {
      const pt = getEventNorm(e);
      setDrawState({ type: 'freehand', points: [pt] });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (drawState.type === 'rect') {
      const current = getEventNorm(e);
      setDrawState((s) => (s.type === 'rect' ? { ...s, current } : s));
    } else if (drawState.type === 'freehand') {
      const pt = getEventNorm(e);
      setDrawState((s) =>
        s.type === 'freehand' ? { ...s, points: [...s.points, pt] } : s
      );
    }
  };

  const handleMouseUp = () => {
    if (drawState.type === 'rect') {
      const normRect = makeNormRect(drawState.start, drawState.current);
      // Ignore accidental tiny clicks (< 1% of page dimension in either axis)
      if (normRect.w > 0.01 && normRect.h > 0.01) {
        onAnnotationCreate({
          id: uuid(),
          pageNum,
          type: 'rect',
          data: normRect as RectData,
          color: '#e53935',
          author: currentUser,
          createdAt: Date.now(),
          resolved: false,
        });
      }
      setDrawState({ type: 'idle' });
    } else if (drawState.type === 'freehand') {
      const simplified = simplifyPoints(drawState.points);
      if (simplified.length > 2) {
        onAnnotationCreate({
          id: uuid(),
          pageNum,
          type: 'freehand',
          data: { points: simplified } as FreehandData,
          color: '#1565c0',
          author: currentUser,
          createdAt: Date.now(),
          resolved: false,
        });
      }
      setDrawState({ type: 'idle' });
    }
  };

  // Cancel draw if pointer leaves the SVG
  const handleMouseLeave = () => {
    if (drawState.type !== 'idle') setDrawState({ type: 'idle' });
  };

  const isDrawing = toolMode === 'rect' || toolMode === 'freehand';

  return (
    <svg
      ref={svgRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: viewport.width,
        height: viewport.height,
        cursor:
          toolMode === 'select'
            ? 'default'
            : toolMode === 'eraser'
              ? 'crosshair'
              : 'crosshair',
        // Pass pointer events through to PDF canvas when in select mode with
        // no hit-tested annotation; annotation elements re-enable pointer
        // events individually via their own onClick.
        pointerEvents: isDrawing ? 'all' : 'none',
        touchAction: isDrawing ? 'none' : 'auto',
      }}
      onMouseDown={isDrawing ? handleMouseDown : undefined}
      onMouseMove={isDrawing ? handleMouseMove : undefined}
      onMouseUp={isDrawing ? handleMouseUp : undefined}
      onMouseLeave={isDrawing ? handleMouseLeave : undefined}
      onTouchStart={isDrawing ? handleMouseDown : undefined}
      onTouchMove={isDrawing ? handleMouseMove : undefined}
      onTouchEnd={isDrawing ? handleMouseUp : undefined}
      onTouchCancel={isDrawing ? handleMouseLeave : undefined}
    >
      {/* ── Persisted annotations ─────────────────────────────────────── */}
      {annotations.map((ann) => {
        const isSelected = ann.id === selectedId;
        const strokeColor = ann.resolved ? '#aaa' : ann.color;
        const strokeWidth = isSelected ? 3 : 1.5;
        const strokeDash = ann.resolved ? '5 3' : undefined;

        if (ann.type === 'rect') {
          const d = ann.data as RectData;
          const px = normRectToPixel(d.x, d.y, d.w, d.h, viewport);
          return (
            <rect
              key={ann.id}
              x={px.x}
              y={px.y}
              width={px.w}
              height={px.h}
              fill={isSelected ? `${ann.color}22` : 'none'}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              style={{ cursor: toolMode === 'eraser' ? 'pointer' : 'pointer', pointerEvents: 'all' }}
              onClick={(e) => {
                e.stopPropagation();
                if (toolMode === 'eraser') {
                  onAnnotationDelete(ann.id);
                } else {
                  onAnnotationSelect(ann.id);
                }
              }}
            />
          );
        }

        if (ann.type === 'freehand') {
          const d = ann.data as FreehandData;
          const pathD = pointsToSvgPath(d.points, viewport);
          if (!pathD) return null;
          return (
            <path
              key={ann.id}
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
              onClick={(e) => {
                e.stopPropagation();
                if (toolMode === 'eraser') {
                  onAnnotationDelete(ann.id);
                } else {
                  onAnnotationSelect(ann.id);
                }
              }}
            />
          );
        }

        return null;
      })}

      {/* ── Live drawing preview ──────────────────────────────────────── */}
      {drawState.type === 'rect' && (() => {
        const nr = makeNormRect(drawState.start, drawState.current);
        const px = normRectToPixel(nr.x, nr.y, nr.w, nr.h, viewport);
        return (
          <rect
            x={px.x}
            y={px.y}
            width={px.w}
            height={px.h}
            fill="rgba(229,57,53,0.08)"
            stroke="#e53935"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            pointerEvents="none"
          />
        );
      })()}

      {drawState.type === 'freehand' && drawState.points.length > 1 && (
        <path
          d={pointsToSvgPath(drawState.points, viewport)}
          fill="none"
          stroke="#1565c0"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
