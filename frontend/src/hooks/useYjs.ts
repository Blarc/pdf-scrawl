import * as Y from 'yjs';
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider';
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
 * serverUrl  – WebSocket base URL, e.g. \"ws://localhost:1234\"
 * roomName   – document/room identifier, e.g. \"my-doc\"
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

    const websocketProvider = new HocuspocusProviderWebsocket({
      url: serverUrl,
      autoConnect: false,
    });

    const prov = new HocuspocusProvider({
      websocketProvider,
      name: `room/${roomName}`,
      document: doc,
      token: authToken,
    });

    // Required when passing a custom websocketProvider instance.
    // Without this, the WS can connect but the provider won't send handshake/doc messages.
    prov.attach();
    
    if (prov.awareness) {
      prov.awareness.setLocalStateField('user', { name: userName, color });
    }
    return { ydoc: doc, provider: prov };
  });

  const [connected, setConnected] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleStatus = ({ status }: { status: string }) => {
      setConnected(status === 'connected');
    };
    provider.on('status', handleStatus);

    // Connect (or reconnect if this is StrictMode's second mount).
    const wsProvider = provider.configuration.websocketProvider;
    if (wsProvider.status !== 'connected' && wsProvider.status !== 'connecting') {
      console.log("Connecting...")
      wsProvider.connect();
    }
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      provider.off('status', handleStatus);

      const wsProv = provider.configuration.websocketProvider;
      wsProv.disconnect();

      Promise.resolve().then(() => {
        if (!mountedRef.current) {
          provider.destroy();
          ydoc.destroy();
        } else {
          // StrictMode re-mounted: reconnect the provider
          wsProv.connect();
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
