import { useState, useEffect, useCallback } from 'react';
import { useYjs } from './hooks/useYjs';
import { useAnnotations } from './hooks/useAnnotations';
import { PDFViewer } from './components/PDFViewer';
import { Toolbar } from './components/Toolbar';
import { CommentPanel } from './components/CommentPanel';
import { UserPresence } from './components/UserPresence';
import { useIsMobile } from './hooks/useMediaQuery';
import type { ToolMode } from './types';

// In production, derive these from environment variables or use window.location.
const USER_NAME = `User-${Math.floor(Math.random() * 9000) + 1000}`;

// Use window.location to derive URLs if env vars are missing
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = import.meta.env.VITE_WS_URL || `${protocol}//${window.location.host}`;
const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}`;

/** Read the room ID from the URL hash, e.g. "#abc123" → "abc123". */
function getRoomFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  return hash.length > 0 ? hash : null;
}

/** Generate a short random room ID (lowercase alphanumeric, 16 chars). */
function generateRoomId(): string {
  return Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// RoomApp — rendered with key={roomId} so useYjs gets a fresh doc per room
// ---------------------------------------------------------------------------

interface RoomAppProps {
  roomId: string;
  onCopyLink: () => void;
  copyLabel: string;
}

function RoomApp({ roomId, onCopyLink, copyLabel }: RoomAppProps) {
  const { ydoc, awareness, connected } = useYjs(WS_URL, roomId, USER_NAME);
  const { annotations, addAnnotation, resolveAnnotation, deleteAnnotation } =
    useAnnotations(ydoc);

  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const isMobile = useIsMobile();

  // PDF bytes fetched from the server — shared by both owner (after upload) and joiners.
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Fetch the PDF from the server when the room mounts.
  // The owner's upload completes before RoomApp renders, so the GET succeeds
  // for both the owner (page reload) and joiners.
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
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
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [roomId]);

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
          height: 44,
          borderBottom: '1px solid #ddd',
          background: '#fff',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
          PDF Scrawl (Responsive)
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isMobile && (
            <button
              onClick={() => setShowComments(!showComments)}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                background: showComments ? '#0066cc' : '#f0f0f0',
                color: showComments ? '#fff' : '#333',
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              {showComments ? 'PDF' : `Comments (${annotations.length})`}
            </button>
          )}
          <button
            onClick={onCopyLink}
            title="Copy shareable link to clipboard"
            style={{
              padding: '4px 12px',
              fontSize: 12,
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            {isMobile ? 'Share' : copyLabel}
          </button>
          {!isMobile && <UserPresence awareness={awareness!} connected={connected} />}
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <Toolbar
        mode={toolMode}
        onModeChange={setToolMode}
        onUpload={() => {}}
        fileName={null}
        hideUpload
      />

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div
        className="app-main"
        style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}
      >
        {(!isMobile || !showComments) && (
          <PDFViewer
            file={null}
            pdfBytes={pdfBytes}
            pdfError={pdfError}
            annotations={annotations}
            toolMode={toolMode}
            onAnnotationCreate={(ann) => {
              addAnnotation(ann);
              setSelectedId(ann.id);
              setToolMode('select');
            }}
            onAnnotationSelect={(id) => {
              setSelectedId(id);
              if (isMobile) setShowComments(true);
            }}
            onAnnotationDelete={deleteAnnotation}
            selectedId={selectedId}
            currentUser={USER_NAME}
          />
        )}
        {(!isMobile || showComments) && (
          <CommentPanel
            annotations={annotations}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (isMobile) setShowComments(false);
            }}
            onResolve={resolveAnnotation}
            onDelete={deleteAnnotation}
            ydoc={ydoc}
            currentUser={USER_NAME}
            isMobile={isMobile}
          />
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// App — manages room lifecycle and renders either the upload screen or RoomApp
// ---------------------------------------------------------------------------

export function App() {
  const [roomId, setRoomId] = useState<string | null>(() => getRoomFromHash());
  const [copyLabel, setCopyLabel] = useState('Share link');
  const [preRoomToolMode, setPreRoomToolMode] = useState<ToolMode>('select');

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const onHashChange = () => setRoomId(getRoomFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const id = generateRoomId();

    // Upload the PDF to the server before switching to the room view,
    // so that when RoomApp mounts and fetches the PDF it's already available.
    const bytes = await file.arrayBuffer();
    await fetch(`${API_URL}/room/${id}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: bytes,
    });

    window.location.hash = id;
    setRoomId(id);
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Share link'), 2000);
    });
  }, []);

  const isMobile = useIsMobile();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {roomId ? (
        // key={roomId} ensures a fresh component tree (and fresh useYjs) per room
        <RoomApp
          key={roomId}
          roomId={roomId}
          onCopyLink={handleCopyLink}
          copyLabel={copyLabel}
        />
      ) : (
        <>
          {/* ── Header (pre-room) ─────────────────────────────────── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 16px',
              height: 44,
              borderBottom: '1px solid #ddd',
              background: '#fff',
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
              PDF Annotate (Responsive)
            </span>
          </div>

          {/* ── Toolbar (pre-room) ────────────────────────────────── */}
          <Toolbar
            mode={preRoomToolMode}
            onModeChange={setPreRoomToolMode}
            onUpload={handleUpload}
            fileName={null}
          />

          {/* ── Empty state ───────────────────────────────────────── */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontSize: 15,
                padding: 20,
                textAlign: 'center',
              }}
            >
              Upload a PDF to get started
            </div>
            {!isMobile && (
              <div
                style={{
                  width: 320,
                  borderLeft: '1px solid #ddd',
                  background: '#fafafa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#bbb',
                  fontSize: 13,
                }}
              >
                No annotations yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
