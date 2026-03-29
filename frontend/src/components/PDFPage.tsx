import { useMemo, memo } from 'react';
import type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';
import { AnnotationLayer } from './AnnotationLayer';
import { PDFCanvas } from './PDFCanvas';
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

export const PDFPage = memo(function PDFPage({
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
  // Memoize the viewport so it only changes when scale or originalViewport changes.
  // This prevents the PDFCanvas from re-rendering when annotations or toolMode change.
  const viewport = useMemo(
    () => originalViewport.clone({ scale }),
    [originalViewport, scale]
  );

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
      {/* 
        Layer 1: PDF Canvas. 
        Wrapped in memo, it only re-renders if pdfDoc, pageNum, or viewport change.
      */}
      <PDFCanvas
        pdfDoc={pdfDoc}
        pageNum={pageNum}
        viewport={viewport}
      />

      {/* 
        Layer 2: Annotation SVG overlay.
        This layer will re-render when toolMode or annotations change, 
        but it won't affect the PDFCanvas below it.
      */}
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
});
