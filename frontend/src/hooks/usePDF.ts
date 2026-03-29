import { useState, useEffect, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, PageViewport } from 'pdfjs-dist';

// Set worker URL once at module load — never inside a component render.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export function usePDFDocument(file: File | null, pdfBytes: Uint8Array | null | undefined) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasPdf = file !== null || (pdfBytes !== null && pdfBytes !== undefined && pdfBytes.byteLength > 0);
    if (!hasPdf) {
      setPdfDoc(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let doc: PDFDocumentProxy | null = null;

    (async () => {
      setLoading(true);
      try {
        const data = file ? new Uint8Array(await file.arrayBuffer()) : new Uint8Array(pdfBytes!);
        if (cancelled) return;
        doc = await pdfjsLib.getDocument({ data }).promise;
        if (!cancelled) setPdfDoc(doc);
      } catch (err) {
        if (!cancelled) {
          console.error('PDF document load error:', err);
          setError('Failed to load PDF document');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [file, pdfBytes]);

  return { pdfDoc, error, loading };
}

export interface PageInfo {
  pageNum: number;
  originalViewport: PageViewport;
}

export function usePDFPages(pdfDoc: PDFDocumentProxy | null) {
  const [pages, setPages] = useState<PageInfo[]>([]);

  useEffect(() => {
    if (!pdfDoc) {
      setPages([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const infos: PageInfo[] = [];
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const originalViewport = page.getViewport({ scale: 1 });
          infos.push({ pageNum: i, originalViewport });
          page.cleanup();
        }
        if (!cancelled) setPages(infos);
      } catch (err) {
        if (!cancelled) console.error('PDF pages fetch error:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc]);

  return pages;
}
