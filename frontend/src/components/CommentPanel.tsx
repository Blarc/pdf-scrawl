import type * as Y from 'yjs';
import type { Annotation } from '../types';
import { CommentItem } from './CommentItem';

interface Props {
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  ydoc: Y.Doc;
  currentUser: string;
  isMobile?: boolean;
}

export function CommentPanel({
  annotations,
  selectedId,
  onSelect,
  onResolve,
  onDelete,
  ydoc,
  currentUser,
  isMobile = false,
}: Props) {
  const sorted = [...annotations].sort((a, b) => a.createdAt - b.createdAt);
  const unresolved = sorted.filter((a) => !a.resolved);
  const resolved = sorted.filter((a) => a.resolved);
  const groups = [...unresolved, ...resolved];

  return (
    <aside
      style={{
        width: isMobile ? '100%' : 300,
        minWidth: isMobile ? '100%' : 260,
        borderLeft: isMobile ? 'none' : '1px solid #ddd',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#fff',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          fontWeight: 600,
          borderBottom: '1px solid #eee',
          fontSize: 13,
          color: '#333',
          background: '#fafafa',
          flexShrink: 0,
        }}
      >
        Annotations ({annotations.length})
      </div>

      {annotations.length === 0 && (
        <div style={{ padding: 16, color: '#999', fontSize: 13 }}>
          No annotations yet. Use the drawing tools to annotate the PDF.
        </div>
      )}

      {groups.map((ann) => (
        <CommentItem
          key={ann.id}
          annotation={ann}
          isSelected={selectedId === ann.id}
          onSelect={onSelect}
          onResolve={onResolve}
          onDelete={onDelete}
          ydoc={ydoc}
          currentUser={currentUser}
        />
      ))}
    </aside>
  );
}
