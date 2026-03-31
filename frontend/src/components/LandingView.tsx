import { Header } from './Header';
import { Toolbar } from './Toolbar';
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
    <>
      <Header title="PDF Annotate (Responsive)" isMobile={isMobile} />
      
      <Toolbar
        mode={preRoomToolMode}
        onModeChange={setPreRoomToolMode}
        onUpload={handleUpload}
        fileName={null}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontSize: 15,
            padding: 20,
            textAlign: 'center',
          }}
        >
          Upload a PDF to get started
        </div>
        {!isMobile && (
          <div
            className="sidebar-desktop"
            style={{
              width: 320,
              borderLeft: '1px solid #ddd',
              background: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bbb',
              fontSize: 13,
            }}
          >
            No annotations yet
          </div>
        )}
      </div>
    </>
  );
}
