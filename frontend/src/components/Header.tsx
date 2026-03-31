import { UserPresence } from './UserPresence';
import type { Awareness } from 'y-protocols/awareness';
import { useAuth } from '../AuthContext';

interface HeaderProps {
  title: string;
  isMobile: boolean;
  showComments?: boolean;
  onToggleComments?: () => void;
  onCopyLink?: () => void;
  copyLabel?: string;
  commentCount?: number;
  awareness?: Awareness;
  connected?: boolean;
}

export function Header({
  title,
  isMobile,
  showComments,
  onToggleComments,
  onCopyLink,
  copyLabel,
  commentCount,
  awareness,
  connected,
}: HeaderProps) {
  const { logout, user } = useAuth();

  return (
    <header
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>
          {title}
        </span>
        {user && (
          <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
            Hi, {user.displayName}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isMobile && onToggleComments && (
          <button
            onClick={onToggleComments}
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
            {showComments ? 'PDF' : `Comments (${commentCount})`}
          </button>
        )}
        {onCopyLink && (
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
        )}
        {!isMobile && awareness && (
          <UserPresence awareness={awareness} connected={connected ?? false} />
        )}
        <button
          onClick={logout}
          style={{
            padding: '4px 8px',
            fontSize: 12,
            background: '#fff',
            color: '#d9534f',
            border: '1px solid #d43f3a',
            borderRadius: 4,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
