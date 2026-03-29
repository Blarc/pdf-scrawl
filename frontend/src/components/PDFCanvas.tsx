import { useRef, useEffect, memo } from 'react';
import type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';

interface PDFCanvasProps {
  pageNum: number;
  pdfDoc: PDFDocumentProxy;
  viewport: PageViewport;
}

export const PDFCanvas = memo(function PDFCanvas({
  pageNum,
  pdfDoc,
  viewport,
}: PDFCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        if (cancelled) {
          page.cleanup();
          return;
        }

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
  }, [pdfDoc, pageNum, viewport]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
    />
  );
});
