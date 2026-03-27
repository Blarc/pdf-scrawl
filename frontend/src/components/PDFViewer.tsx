import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy, PageViewport } from 'pdfjs-dist';
import { AnnotationLayer } from './AnnotationLayer';
import type { Annotation, ToolMode } from '../types';

// Set worker URL once at module load — never inside a component render.
// The ?url Vite suffix emits the worker file as a separate static asset and
// returns its URL, which is the correct pattern for pdfjs v4+ with Vite.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

const SCALE = 1.5;

interface PageInfo {
  pageNum: number; // 1-indexed
  viewport: PageViewport;
}

interface Props {
  file: File | null;
  pdfBytes?: Uint8Array | null;
  pdfError?: string | null;
  annotations: Annotation[];
  toolMode: ToolMode;
  onAnnotationCreate: (a: Annotation) => void;
  onAnnotationSelect: (id: string) => void;
  onAnnotationDelete: (id: string) => void;
  selectedId: string | null;
  currentUser: string;
}

export function PDFViewer({
  file,
  pdfBytes,
  pdfError,
  annotations,
  toolMode,
  onAnnotationCreate,
  onAnnotationSelect,
  onAnnotationDelete,
  selectedId,
  currentUser,
}: Props) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  // Stable map from pageNum → canvas ref so we can render into them
  const canvasRefs = useRef<Map<number, HTMLCanvasElement | null>>(new Map());

  // Resolve PDF data: local File takes priority over synced bytes.
  // Always return a fresh copy so pdfjs can transfer/detach the buffer without
  // affecting subsequent calls (pdfjs may transfer the ArrayBuffer internally).
  const getPdfData = async (): Promise<Uint8Array | null> => {
    if (file) return new Uint8Array(await file.arrayBuffer());
    if (pdfBytes) return new Uint8Array(pdfBytes); // copy to ensure own buffer
    return null;
  };

  const hasPdf = file !== null || (pdfBytes !== null && pdfBytes !== undefined && pdfBytes.byteLength > 0);

  useEffect(() => {
    if (!hasPdf) {
      setPages([]);
      return;
    }

    let cancelled = false;
    let pdfDoc: PDFDocumentProxy | null = null;

    (async () => {
      try {
        const data = await getPdfData();
        if (!data || cancelled) return;
        pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;

        const infos: PageInfo[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page: PDFPageProxy = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: SCALE });
          infos.push({ pageNum: i, viewport });
          page.cleanup();
        }
        if (!cancelled) setPages(infos);
      } catch (err) {
        if (!cancelled) console.error('PDF load error:', err);
      }
    })();

    return () => {
      cancelled = true;
      pdfDoc?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, pdfBytes]);

  // Render each page to its canvas after page info is set
  useEffect(() => {
    if (!hasPdf || pages.length === 0) return;

    let pdfDoc: PDFDocumentProxy | null = null;
    let cancelled = false;
    const renderTasks: Array<{ cancel: () => void }> = [];

    (async () => {
      try {
        const data = await getPdfData();
        if (!data || cancelled) return;
        pdfDoc = await pdfjsLib.getDocument({ data }).promise;
        if (cancelled) return;

        for (const { pageNum, viewport } of pages) {
          const canvas = canvasRefs.current.get(pageNum);
          if (!canvas || cancelled) continue;

          const dpr = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * dpr);
          canvas.height = Math.floor(viewport.height * dpr);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.scale(dpr, dpr);

          const page = await pdfDoc.getPage(pageNum);
          if (cancelled) { page.cleanup(); break; }

          const task = page.render({ canvasContext: ctx, viewport });
          renderTasks.push(task);
          await task.promise;
          page.cleanup();
        }
      } catch (err) {
        if (!cancelled) console.error('PDF render error:', err);
      }
    })();

    return () => {
      cancelled = true;
      renderTasks.forEach((t) => { try { t.cancel(); } catch { /* already complete */ } });
      pdfDoc?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, pdfBytes, pages]);

  if (!hasPdf) {
    const message = pdfError ?? 'Loading PDF…';
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: pdfError ? '#c00' : '#aaa',
          fontSize: 15,
        }}
      >
        {message}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#e8e8e8', padding: '16px 0' }}>
      {pages.map(({ pageNum, viewport }) => (
        <div
          key={pageNum}
          style={{
            position: 'relative',
            width: viewport.width,
            height: viewport.height,
            margin: '0 auto 16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            background: '#fff',
          }}
        >
          {/* Layer 1: PDF canvas */}
          <canvas
            ref={(el) => canvasRefs.current.set(pageNum, el)}
            style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
          />
          {/* Layer 2: Annotation SVG overlay */}
          <AnnotationLayer
            pageNum={pageNum}
            viewport={viewport}
            annotations={annotations.filter((a) => a.pageNum === pageNum)}
            toolMode={toolMode}
            onAnnotationCreate={onAnnotationCreate}
            onAnnotationSelect={onAnnotationSelect}
            onAnnotationDelete={onAnnotationDelete}
            selectedId={selectedId}
            currentUser={currentUser}
          />
        </div>
      ))}
    </div>
  );
}
