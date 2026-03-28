import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { useEffect, useRef, useState } from 'react';

export interface YjsContext {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  awareness: HocuspocusProvider['awareness'];
  connected: boolean;
}

interface YjsInstances {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
}

/**
 * serverUrl  – WebSocket base URL, e.g. "ws://localhost:1234"
 * roomName   – document/room identifier, e.g. "my-doc"
 * userName   – display name shown in presence avatars
 * authToken  – optional bearer token passed to Hocuspocus
 */
export function useYjs(
  serverUrl: string,
  roomName: string,
  userName: string,
  authToken?: string
): YjsContext {
  // useState lazy initializer runs exactly once per component mount.
  const [{ ydoc, provider }] = useState<YjsInstances>(() => {
    const doc = new Y.Doc();
    const color = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

    const prov = new HocuspocusProvider({
      url: serverUrl,
      name: `room/${roomName}`, // Match the old /room/<name> structure
      document: doc,
      token: authToken,
      connect: false, // connect in useEffect so cleanup can disconnect without destroy
    });
    prov.awareness.setLocalStateField('user', { name: userName, color });
    return { ydoc: doc, provider: prov };
  });

  const [connected, setConnected] = useState(false);
  // Track whether this is the real final mount (not StrictMode's first-pass mount).
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleStatus = ({ status }: { status: string }) => {
      setConnected(status === 'connected');
    };
    provider.on('status', handleStatus);

    // Connect (or reconnect if this is StrictMode's second mount).
    if (!provider.isConnected && !provider.isConnecting) {
      provider.connect();
    }
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      provider.off('status', handleStatus);
      // Disconnect the WebSocket but keep the provider alive so it can
      // reconnect on StrictMode's second useEffect invocation.
      provider.disconnect();
      Promise.resolve().then(() => {
        if (!mountedRef.current) {
          provider.destroy();
          ydoc.destroy();
        } else {
          // StrictMode re-mounted: reconnect the provider
          provider.connect();
        }
      });
    };
  }, [provider, ydoc]);

  return {
    ydoc,
    provider,
    awareness: provider.awareness,
    connected,
  };
}
