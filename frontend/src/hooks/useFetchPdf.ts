import { useState, useEffect } from 'react';
import { API_URL } from '../config';

export function useFetchPdf(roomId: string | null) {
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setPdfBytes(null);
      setPdfError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/room/${roomId}/pdf`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          if (!cancelled) setPdfError(`PDF not found (${res.status})`);
          return;
        }
        const buf = await res.arrayBuffer();
        if (!cancelled) setPdfBytes(new Uint8Array(buf));
      } catch (err) {
        if (!cancelled && !(err instanceof DOMException && err.name === 'AbortError')) {
          setPdfError('Failed to load PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [roomId]);

  return { pdfBytes, pdfError, loading };
}
