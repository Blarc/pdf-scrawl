import type * as Y from 'yjs';
import type { Annotation } from '../types';
import { CommentThread } from './CommentThread';

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
        <div
          key={ann.id}
          style={{
            borderBottom: '1px solid #eee',
            padding: '10px 12px',
            background: selectedId === ann.id ? '#f0f7ff' : 'transparent',
            cursor: 'pointer',
            opacity: ann.resolved ? 0.65 : 1,
          }}
          onClick={() => onSelect(ann.id)}
        >
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 4,
            }}
          >
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: ann.type === 'freehand' ? '50%' : 2,
                  background: ann.color,
                  marginRight: 5,
                  verticalAlign: 'middle',
                }}
              />
              <strong>p.{ann.pageNum}</strong> · {ann.type} · {ann.author}
              {ann.resolved && (
                <span
                  style={{
                    marginLeft: 6,
                    fontSize: 11,
                    color: '#4caf50',
                    fontWeight: 600,
                  }}
                >
                  Resolved
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResolve(ann.id, !ann.resolved);
                }}
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: '1px solid #ccc',
                  background: ann.resolved ? '#e8f5e9' : '#fff',
                  cursor: 'pointer',
                  color: '#333',
                }}
              >
                {ann.resolved ? 'Reopen' : 'Resolve'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(ann.id);
                }}
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 4,
                  border: '1px solid #ffcdd2',
                  background: '#fff',
                  cursor: 'pointer',
                  color: '#c62828',
                }}
                title="Delete annotation"
              >
                ×
              </button>
            </div>
          </div>

          <CommentThread
            annotationId={ann.id}
            ydoc={ydoc}
            currentUser={currentUser}
            onInputClick={(e) => e.stopPropagation()}
          />
        </div>
      ))}
    </aside>
  );
}
