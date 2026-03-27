import * as Y from 'yjs';
import { useSyncExternalStore, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import type { Comment } from '../types';

export function useComments(ydoc: Y.Doc, annotationId: string) {
  const commentsMap = ydoc.getMap<Y.Array<Comment>>('comments');
  const snapshotRef = useRef<Comment[]>([]);
  // Track the Y.Array we've attached an inner observer to so we can remove it
  // cleanly and avoid double-subscribing on re-attach.
  const innerArrayRef = useRef<Y.Array<Comment> | null>(null);
  const innerCbRef = useRef<(() => void) | null>(null);

  const comments = useSyncExternalStore(
    (onStoreChange) => {
      // Inner observer helper — attaches to the Y.Array when it exists.
      // Extracted so it can be called both on initial subscribe and whenever
      // the outer map fires (handling the case where the Y.Array is created
      // after this component mounts by a remote peer).
      const attachInner = () => {
        const arr = commentsMap.get(annotationId);
        if (arr && arr !== innerArrayRef.current) {
          // Detach from any previously observed array first
          if (innerArrayRef.current && innerCbRef.current) {
            innerArrayRef.current.unobserve(innerCbRef.current);
          }
          innerArrayRef.current = arr;
          innerCbRef.current = () => onStoreChange();
          arr.observe(innerCbRef.current);
        }
      };

      const outerCb = () => {
        // Re-attach inner observer whenever the outer map changes —
        // covers the case where the Y.Array is created after mount.
        attachInner();
        onStoreChange();
      };

      commentsMap.observe(outerCb);
      attachInner(); // attach immediately if the array already exists

      return () => {
        commentsMap.unobserve(outerCb);
        if (innerArrayRef.current && innerCbRef.current) {
          innerArrayRef.current.unobserve(innerCbRef.current);
          innerArrayRef.current = null;
          innerCbRef.current = null;
        }
      };
    },
    () => {
      const arr = commentsMap.get(annotationId)?.toArray() ?? [];
      if (
        snapshotRef.current.length === arr.length &&
        arr.every((c, i) => c === snapshotRef.current[i])
      ) {
        return snapshotRef.current;
      }
      snapshotRef.current = arr;
      return snapshotRef.current;
    },
    () => [] as Comment[]
  );

  const addComment = useCallback(
    (author: string, text: string) => {
      const yarray = commentsMap.get(annotationId);
      if (!yarray) return;
      const comment: Comment = {
        id: uuid(),
        author,
        text,
        createdAt: Date.now(),
      };
      yarray.push([comment]);
    },
    [commentsMap, annotationId]
  );

  return { comments, addComment };
}
