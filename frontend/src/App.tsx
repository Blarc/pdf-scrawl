import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './hooks/useMediaQuery';
import { RoomApp } from './components/RoomApp';
import { LandingView } from './components/LandingView';
import { LoginView } from './components/LoginView';
import { useAuth } from './AuthContext';
import { getRoomFromHash, generateRoomId, API_URL } from './config';
import type { ToolMode } from './types';

export function App() {
  const { user, loading } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(() => getRoomFromHash());
  const [copyLabel, setCopyLabel] = useState('Share link');
  const [preRoomToolMode, setPreRoomToolMode] = useState<ToolMode>('select');
  const isMobile = useIsMobile();

  // Listen for hash changes (back/forward navigation)
  useEffect(() => {
    const onHashChange = () => setRoomId(getRoomFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const id = generateRoomId();

    // Upload the PDF to the server before switching to the room view,
    // so that when RoomApp mounts and fetches the PDF it's already available.
    const bytes = await file.arrayBuffer();
    await fetch(`${API_URL}/rooms/${id}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: bytes,
      credentials: 'include',
    });

    window.location.hash = id;
    setRoomId(id);
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Share link'), 2000);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {roomId ? (
        <RoomApp
          key={roomId}
          roomId={roomId}
          onCopyLink={handleCopyLink}
          copyLabel={copyLabel}
          currentUser={user.username}
        />
      ) : (
        <LandingView
          isMobile={isMobile}
          preRoomToolMode={preRoomToolMode}
          setPreRoomToolMode={setPreRoomToolMode}
          handleUpload={handleUpload}
          currentUser={user.username}
        />
      )}
    </div>
  );
}
