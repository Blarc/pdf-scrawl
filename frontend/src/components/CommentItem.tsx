import type * as Y from 'yjs';
import type { Annotation } from '../types';
import { CommentThread } from './CommentThread';
import { Surface } from './ui/Surface';
import { Typography } from './ui/Typography';
import { Button } from './ui/Button';

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
    <Surface
      level={isSelected ? 'high' : 'low'}
      className={`
        group flex flex-col p-3 rounded-lg cursor-pointer transition-all duration-200
        ${isSelected ? 'shadow-sm' : 'hover:bg-surface-container-high'}
        ${annotation.resolved ? 'opacity-60' : 'opacity-100'}
      `}
      onClick={() => onSelect(annotation.id)}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`
                inline-block w-2.5 h-2.5 shrink-0
                ${annotation.type === 'freehand' ? 'rounded-full' : 'rounded-sm'}
              `}
              style={{ background: annotation.color }}
            />
            <Typography level="label-sm" className="text-on-surface font-bold truncate">
              {annotation.author}
            </Typography>
          </div>
          <Typography level="body" className="text-on-surface opacity-60 text-xs">
            Page {annotation.pageNum} · {annotation.type}
            {annotation.resolved && (
              <span className="ml-2 text-success-foreground font-bold text-[#4caf50]">
                Resolved
              </span>
            )}
          </Typography>
        </div>

        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onResolve(annotation.id, !annotation.resolved);
            }}
            variant="secondary"
            size="sm"
            className="!px-2 !py-0.5 !text-[10px]"
          >
            {annotation.resolved ? 'Reopen' : 'Resolve'}
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(annotation.id);
            }}
            variant="secondary"
            size="sm"
            className="!px-2 !py-0.5 !text-[10px] text-error border-error border-opacity-20"
            title="Delete annotation"
          >
            ×
          </Button>
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} className="mt-1">
        <CommentThread
          annotationId={annotation.id}
          ydoc={ydoc}
          currentUser={currentUser}
          onInputClick={(e) => e.stopPropagation()}
        />
      </div>
    </Surface>
  );
}
