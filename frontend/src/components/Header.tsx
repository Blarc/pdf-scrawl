import { UserPresence } from './UserPresence';
import type { Awareness } from 'y-protocols/awareness';
import { useAuth } from '../AuthContext';
import { Surface } from './ui/Surface';
import { Button } from './ui/Button';
import { Typography } from './ui/Typography';

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
    <Surface
      level="lowest"
      className="flex items-center justify-between h-11 px-4 shrink-0 transition-colors duration-200"
    >
      <div className="flex items-center gap-3">
        <Typography level="title-sm" as="h1" className="text-on-surface">
          {title}
        </Typography>
        {user && (
          <Typography level="label-sm" className="text-on-surface opacity-60 ml-2">
            Hi, {user.username}
          </Typography>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isMobile && onToggleComments && (
          <Button
            onClick={onToggleComments}
            size="sm"
            variant={showComments ? 'primary' : 'secondary'}
          >
            {showComments ? 'PDF' : `Comments (${commentCount})`}
          </Button>
        )}
        
        {onCopyLink && (
          <Button
            onClick={onCopyLink}
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
            title="Copy shareable link to clipboard"
          >
            {copyLabel}
          </Button>
        )}

        {onCopyLink && isMobile && (
          <Button
            onClick={onCopyLink}
            variant="primary"
            size="sm"
            className="sm:hidden"
            title="Copy shareable link to clipboard"
          >
            Share
          </Button>
        )}

        {!isMobile && awareness && (
          <UserPresence awareness={awareness} connected={connected ?? false} />
        )}

        <Button
          onClick={logout}
          variant="secondary"
          size="sm"
          className="text-error border-error border-opacity-20 hover:bg-error hover:bg-opacity-5"
        >
          Logout
        </Button>
      </div>
    </Surface>
  );
}
