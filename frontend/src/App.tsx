import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './hooks/useMediaQuery';
import { RoomApp } from './components/RoomApp';
import { LandingView } from './components/LandingView';
import { LoginView } from './components/LoginView';
import { useAuth } from './AuthContext';
import { getRoomFromHash, generateRoomId, API_URL } from './config';
import type { ToolMode } from './types';
import { Route, Switch, useLocation } from "wouter";
import { Surface } from './components/ui/Surface';

export function App() {
  const { user, loading } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(() => getRoomFromHash());
  const [copyLabel, setCopyLabel] = useState('Share link');
  const [preRoomToolMode, setPreRoomToolMode] = useState<ToolMode>('select');
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();

  useEffect(() => {
    const onHashChange = () => setRoomId(getRoomFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const id = generateRoomId();
    const bytes = await file.arrayBuffer();
    await fetch(`${API_URL}/rooms/${id}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf' },
      body: bytes,
      credentials: 'include',
    });

    navigate(`/rooms/${id}`);
  }, [navigate]);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Share link'), 2000);
    });
  }, []);

  if (loading) {
    return (
      <Surface level="base" className="flex items-center justify-center h-screen">
        <div className="animate-pulse font-manrope text-on-surface opacity-50">Loading...</div>
      </Surface>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <Surface level="base" className="flex flex-col h-screen overflow-hidden">
      <Switch>
        <Route path="/">
          <LandingView
            isMobile={isMobile}
            preRoomToolMode={preRoomToolMode}
            setPreRoomToolMode={setPreRoomToolMode}
            handleUpload={handleUpload}
            currentUser={user.username}
          />
        </Route>
        <Route path="/rooms/:id">
          {params => (
            <RoomApp
              key={params.id}
              roomId={params.id}
              onCopyLink={handleCopyLink}
              copyLabel={copyLabel}
              currentUser={user.username}
            />
          )}
        </Route>
        <Route path="/login">
          <LoginView />
        </Route>
      </Switch>
    </Surface>
  );
}
