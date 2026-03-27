import * as Y from 'yjs';
import { useSyncExternalStore, useCallback, useRef } from 'react';
import type { Annotation } from '../types';

export function useAnnotations(ydoc: Y.Doc) {
  const ymap = ydoc.getMap<Annotation>('annotations');
  const snapshotRef = useRef<Annotation[]>([]);

  const annotations = useSyncExternalStore(
    (onStoreChange) => {
      ymap.observe(onStoreChange);
      return () => ymap.unobserve(onStoreChange);
    },
    () => {
      const next = Array.from(ymap.values());
      // Stable reference: only return a new array if the content actually changed
      if (
        snapshotRef.current.length === next.length &&
        next.every((a, i) => a === snapshotRef.current[i])
      ) {
        return snapshotRef.current;
      }
      snapshotRef.current = next;
      return snapshotRef.current;
    },
    () => [] as Annotation[]
  );

  const addAnnotation = useCallback(
    (annotation: Annotation) => {
      ydoc.transact(() => {
        ymap.set(annotation.id, annotation);
        const commentsMap = ydoc.getMap<Y.Array<unknown>>('comments');
        if (!commentsMap.has(annotation.id)) {
          commentsMap.set(annotation.id, new Y.Array());
        }
      });
    },
    [ydoc, ymap]
  );

  const updateAnnotation = useCallback(
    (id: string, patch: Partial<Annotation>) => {
      ydoc.transact(() => {
        const existing = ymap.get(id);
        if (existing) {
          ymap.set(id, { ...existing, ...patch });
        }
      });
    },
    [ydoc, ymap]
  );

  const deleteAnnotation = useCallback(
    (id: string) => {
      ydoc.transact(() => {
        ymap.delete(id);
        ydoc.getMap<Y.Array<unknown>>('comments').delete(id);
      });
    },
    [ydoc, ymap]
  );

  const resolveAnnotation = useCallback(
    (id: string, resolved: boolean) => {
      updateAnnotation(id, { resolved });
    },
    [updateAnnotation]
  );

  return { annotations, addAnnotation, updateAnnotation, deleteAnnotation, resolveAnnotation };
}
