import type * as Y from 'yjs';
import type { Annotation } from '../types';
import { CommentThread } from './CommentThread';

interface CommentItemProps {
  annotation: Annotation;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onResolve: (id: string, resolved: boolean) => void;
  onDelete: (id: string) => void;
  ydoc: Y.Doc;
  currentUser: string;
}

export function CommentItem({
  annotation,
  isSelected,
  onSelect,
  onResolve,
  onDelete,
  ydoc,
  currentUser,
}: CommentItemProps) {
  return (
    <div
      style={{
        borderBottom: '1px solid #eee',
        padding: '10px 12px',
        background: isSelected ? '#f0f7ff' : 'transparent',
        cursor: 'pointer',
        opacity: annotation.resolved ? 0.65 : 1,
      }}
      onClick={() => onSelect(annotation.id)}
    >
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
              borderRadius: annotation.type === 'freehand' ? '50%' : 2,
              background: annotation.color,
              marginRight: 5,
              verticalAlign: 'middle',
            }}
          />
          <strong>p.{annotation.pageNum}</strong> · {annotation.type} · {annotation.author}
          {annotation.resolved && (
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
              onResolve(annotation.id, !annotation.resolved);
            }}
            style={{
              fontSize: 11,
              padding: '2px 7px',
              borderRadius: 4,
              border: '1px solid #ccc',
              background: annotation.resolved ? '#e8f5e9' : '#fff',
              cursor: 'pointer',
              color: '#333',
            }}
          >
            {annotation.resolved ? 'Reopen' : 'Resolve'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(annotation.id);
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
        annotationId={annotation.id}
        ydoc={ydoc}
        currentUser={currentUser}
        onInputClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
