import { useState } from 'react';
import { useYjs } from '../hooks/useYjs';
import { useAnnotations } from '../hooks/useAnnotations';
import { PDFViewer } from './PDFViewer';
import { Toolbar } from './Toolbar';
import { CommentPanel } from './CommentPanel';
import { Header } from './Header';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useFetchPdf } from '../hooks/useFetchPdf';
import { WS_URL } from '../config';
import type { ToolMode } from '../types';
import { Surface } from './ui/Surface';

interface RoomAppProps {
  roomId: string;
  onCopyLink: () => void;
  copyLabel: string;
  currentUser: string;
}

export function RoomApp({ roomId, onCopyLink, copyLabel, currentUser }: RoomAppProps) {
  const { ydoc, awareness, connected } = useYjs(WS_URL, roomId, currentUser);
  const { annotations, addAnnotation, resolveAnnotation, deleteAnnotation } =
    useAnnotations(ydoc);

  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const isMobile = useIsMobile();

  const { pdfBytes, pdfError } = useFetchPdf(roomId);

  const handleAnnotationSelect = (id: string) => {
    setSelectedId(id);
    if (isMobile) setShowComments(true);
  };

  const handleCommentSelect = (id: string) => {
    setSelectedId(id);
    if (isMobile) setShowComments(false);
  };

  const handleAnnotationCreate = (ann: any) => {
    addAnnotation(ann);
    setSelectedId(ann.id);
    setToolMode('select');
  };

  return (
    <Surface level="base" className="flex flex-col flex-1 overflow-hidden relative">
      <Header
        title="PDF Scrawl"
        isMobile={isMobile}
        showComments={showComments}
        onToggleComments={() => setShowComments(!showComments)}
        onCopyLink={onCopyLink}
        copyLabel={copyLabel}
        commentCount={annotations.length}
        awareness={awareness!}
        connected={connected}
      />

      <Toolbar
        mode={toolMode}
        onModeChange={setToolMode}
        onUpload={() => {}}
        fileName={null}
        hideUpload
      />

      <div
        className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}
      >
        {(!isMobile || !showComments) && (
          <PDFViewer
            file={null}
            pdfBytes={pdfBytes}
            pdfError={pdfError}
            annotations={annotations}
            toolMode={toolMode}
            onAnnotationCreate={handleAnnotationCreate}
            onAnnotationSelect={handleAnnotationSelect}
            onAnnotationDelete={deleteAnnotation}
            selectedId={selectedId}
            currentUser={currentUser}
          />
        )}
        {(!isMobile || showComments) && (
          <CommentPanel
            annotations={annotations}
            selectedId={selectedId}
            onSelect={handleCommentSelect}
            onResolve={resolveAnnotation}
            onDelete={deleteAnnotation}
            ydoc={ydoc}
            currentUser={currentUser}
            isMobile={isMobile}
          />
        )}
      </div>
    </Surface>
  );
}
