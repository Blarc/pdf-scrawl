import { Header } from './Header';
import { Toolbar } from './Toolbar';
import { Typography } from './ui/Typography';
import { Surface } from './ui/Surface';
import type { ToolMode } from '../types';

interface LandingViewProps {
  isMobile: boolean;
  preRoomToolMode: ToolMode;
  setPreRoomToolMode: (mode: ToolMode) => void;
  handleUpload: (file: File) => void;
  currentUser: string;
}

export function LandingView({
  isMobile,
  preRoomToolMode,
  setPreRoomToolMode,
  handleUpload,
  currentUser,
}: LandingViewProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-surface">
      <Header title="PDF Scrawl" isMobile={isMobile} />
      
      <Toolbar
        mode={preRoomToolMode}
        onModeChange={setPreRoomToolMode}
        onUpload={handleUpload}
        fileName={null}
      />

      <div className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container-lowest">
          <Typography level="display-lg" as="h2" className="text-on-surface opacity-10 mb-4 select-none">
            SCRAWL
          </Typography>
          <Typography level="headline" as="h3" className="text-on-surface mb-2">
            The Living Blueprint
          </Typography>
          <Typography level="body" className="text-on-surface opacity-60 max-w-md">
            Upload a PDF to start a real-time collaborative session.
            Draw, highlight, and comment with your team.
          </Typography>
        </div>

        {!isMobile && (
          <Surface
            level="low"
            className="w-80 flex flex-col items-center justify-center border-l border-outline-variant border-opacity-10"
          >
            <Typography level="label-sm" className="text-on-surface opacity-30">
              No annotations yet
            </Typography>
          </Surface>
        )}
      </div>
    </div>
  );
}
