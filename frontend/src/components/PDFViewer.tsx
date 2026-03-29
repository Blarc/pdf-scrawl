import { useRef, useState, useEffect } from 'react';
import { PDFPage } from './PDFPage';
import { usePDFDocument, usePDFPages } from '../hooks/usePDF';
import { useContainerWidth } from '../hooks/useContainerWidth';
import type { Annotation, ToolMode } from '../types';

const DEFAULT_SCALE = 1.5;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  const { pdfDoc, error: docError } = usePDFDocument(file, pdfBytes);
  const pages = usePDFPages(pdfDoc);

  const hasPdf = file !== null || (pdfBytes !== null && pdfBytes !== undefined && pdfBytes.byteLength > 0);

  // Adjust scale when containerWidth or pages change
  useEffect(() => {
    if (containerWidth > 0 && pages.length > 0) {
      const firstPage = pages[0];
      const padding = 32; // 16px padding on each side
      const availableWidth = containerWidth - padding;
      const targetScale = Math.min(DEFAULT_SCALE, availableWidth / firstPage.originalViewport.width);
      setScale(targetScale);
    }
  }, [containerWidth, pages]);

  if (!hasPdf) {
    const message = pdfError ?? docError ?? 'Loading PDF…';
    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: (pdfError || docError) ? '#c00' : '#aaa',
          fontSize: 15,
        }}
      >
        {message}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, width: '100%', overflowY: 'auto', background: '#e8e8e8', padding: '16px 0' }}
    >
      {pdfDoc && pages.map(({ pageNum, originalViewport }) => (
        <PDFPage
          key={pageNum}
          pageNum={pageNum}
          pdfDoc={pdfDoc}
          scale={scale}
          originalViewport={originalViewport}
          annotations={annotations.filter((a) => a.pageNum === pageNum)}
          toolMode={toolMode}
          onAnnotationCreate={onAnnotationCreate}
          onAnnotationSelect={onAnnotationSelect}
          onAnnotationDelete={onAnnotationDelete}
          selectedId={selectedId}
          currentUser={currentUser}
        />
      ))}
    </div>
  );
}
