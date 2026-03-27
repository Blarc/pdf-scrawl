import { useState } from 'react';
import type * as Y from 'yjs';
import { useComments } from '../hooks/useComments';

const MAX_COMMENT_LENGTH = 2000;

// Enforce a plain-text contract: strip everything that isn't a printable
// character or common whitespace so the string is safe even if it later
// ends up in a context that uses dangerouslySetInnerHTML.
function sanitizePlainText(value: string): string {
  // Allow printable ASCII, accented characters (Latin-1 supplement and
  // beyond), standard spaces, newlines, and tabs.  Drop control characters
  // (U+0000–U+001F except \t/\n/\r, and U+007F).
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

interface Props {
  annotationId: string;
  ydoc: Y.Doc;
  currentUser: string;
}

export function CommentThread({ annotationId, ydoc, currentUser }: Props) {
  const { comments, addComment } = useComments(ydoc, annotationId);
  const [text, setText] = useState('');

  const remaining = MAX_COMMENT_LENGTH - text.length;
  const isOverLimit = remaining < 0;

  const submit = () => {
    const trimmed = sanitizePlainText(text.trim());
    if (!trimmed || trimmed.length > MAX_COMMENT_LENGTH) return;
    addComment(sanitizePlainText(currentUser), trimmed);
    setText('');
  };

  return (
    <div style={{ marginTop: 8 }}>
      {comments.map((c) => (
        <div key={c.id} style={{ marginBottom: 4, fontSize: 13, lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, color: '#333' }}>{c.author}: </span>
          <span style={{ color: '#555' }}>{c.text}</span>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add comment…"
            maxLength={MAX_COMMENT_LENGTH + 1} // allow typing one char over so the counter turns red
            style={{
              width: '100%',
              fontSize: 12,
              padding: '4px 8px',
              border: `1px solid ${isOverLimit ? '#f44336' : '#ccc'}`,
              borderRadius: 4,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          {text.length > MAX_COMMENT_LENGTH - 100 && (
            <span
              style={{
                position: 'absolute',
                right: 6,
                bottom: -16,
                fontSize: 10,
                color: isOverLimit ? '#f44336' : '#999',
              }}
            >
              {remaining}
            </span>
          )}
        </div>
        <button
          onClick={submit}
          disabled={isOverLimit}
          style={{
            fontSize: 12,
            padding: '4px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: '#fff',
            cursor: isOverLimit ? 'not-allowed' : 'pointer',
            opacity: isOverLimit ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
