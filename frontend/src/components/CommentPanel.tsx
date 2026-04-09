import type * as Y from 'yjs';
import type { Annotation } from '../types';
import { CommentItem } from './CommentItem';
import { Surface } from './ui/Surface';
import { Typography } from './ui/Typography';

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
    <Surface
      level="bright"
      className={`
        flex flex-col shrink-0 overflow-hidden
        ${isMobile ? 'w-full flex-1' : 'w-80 border-l border-outline-variant border-opacity-10'}
      `}
    >
      <Surface
        level="low"
        className="px-4 py-2.5 shrink-0 border-b border-outline-variant border-opacity-10"
      >
        <Typography level="title-sm" className="text-on-surface">
          Annotations ({annotations.length})
        </Typography>
      </Surface>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-2">
        {annotations.length === 0 && (
          <div className="p-8 text-center">
            <Typography level="body" className="text-on-surface opacity-30 italic">
              No annotations yet. Use the drawing tools to annotate the PDF.
            </Typography>
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
        
        {/* Spacer for bottom padding without using borders */}
        <div className="h-4 shrink-0" />
      </div>
    </Surface>
  );
}
