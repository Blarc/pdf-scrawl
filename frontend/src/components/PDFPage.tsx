import { useRef, useEffect } from 'react';
import type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';
import { AnnotationLayer } from './AnnotationLayer';
import type { Annotation, ToolMode } from '../types';

interface PDFPageProps {
  pageNum: number;
  pdfDoc: PDFDocumentProxy;
  scale: number;
  originalViewport: PageViewport;
  annotations: Annotation[];
  toolMode: ToolMode;
  onAnnotationCreate: (a: Annotation) => void;
  onAnnotationSelect: (id: string) => void;
  onAnnotationDelete: (id: string) => void;
  selectedId: string | null;
  currentUser: string;
}

export function PDFPage({
  pageNum,
  pdfDoc,
  scale,
  originalViewport,
  annotations,
  toolMode,
  onAnnotationCreate,
  onAnnotationSelect,
  onAnnotationDelete,
  selectedId,
  currentUser,
}: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewport = originalViewport.clone({ scale });

  useEffect(() => {
    let cancelled = false;
    let renderTask: { promise: Promise<void>; cancel: () => void } | null = null;

    (async () => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const page = await pdfDoc.getPage(pageNum);
        if (cancelled) { page.cleanup(); return; }

        renderTask = page.render({ canvasContext: ctx, viewport });
        await renderTask.promise;
        page.cleanup();
      } catch (err) {
        if (!cancelled) console.error(`PDF page ${pageNum} render error:`, err);
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pdfDoc, pageNum, scale, viewport]);

  return (
    <div
      style={{
        position: 'relative',
        width: viewport.width,
        height: viewport.height,
        margin: '0 auto 16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        background: '#fff',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
      />
      <AnnotationLayer
        pageNum={pageNum}
        viewport={viewport}
        annotations={annotations}
        toolMode={toolMode}
        onAnnotationCreate={onAnnotationCreate}
        onAnnotationSelect={onAnnotationSelect}
        onAnnotationDelete={onAnnotationDelete}
        selectedId={selectedId}
        currentUser={currentUser}
      />
    </div>
  );
}
