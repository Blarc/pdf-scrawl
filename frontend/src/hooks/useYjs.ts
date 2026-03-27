import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEffect, useRef, useState } from 'react';

export interface YjsContext {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  awareness: WebsocketProvider['awareness'];
  connected: boolean;
}

interface YjsInstances {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
}

/**
 * serverUrl  – WebSocket base URL, e.g. "ws://localhost:1234"
 * roomName   – document/room identifier, e.g. "my-doc"
 *              Maps to the server path  /room/<roomName>  so rooms are isolated.
 * userName   – display name shown in presence avatars
 * authToken  – optional bearer token forwarded as ?token=<value>
 */
export function useYjs(
  serverUrl: string,
  roomName: string,
  userName: string,
  authToken?: string
): YjsContext {
  // useState lazy initializer runs exactly once per component mount (React
  // StrictMode included — it only double-invokes the render function, not the
  // initializer). We do NOT call connect() here so that the provider survives
  // the StrictMode double-effect cycle below.
  const [{ ydoc, provider }] = useState<YjsInstances>(() => {
    const doc = new Y.Doc();
    const color = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');

    const base = serverUrl.replace(/\/$/, '');
    const wsUrl = authToken
      ? `${base}?token=${encodeURIComponent(authToken)}`
      : base;

    const prov = new WebsocketProvider(
      wsUrl,
      `room/${encodeURIComponent(roomName)}`,
      doc,
      { connect: false } // connect in useEffect so cleanup can disconnect without destroy
    );
    prov.awareness.setLocalStateField('user', { name: userName, color });
    return { ydoc: doc, provider: prov };
  });

  const [connected, setConnected] = useState(false);
  // Track whether this is the real final mount (not StrictMode's first-pass
  // mount that is immediately cleaned up). We use a ref rather than state to
  // avoid an extra render cycle.
  const mountedRef = useRef(false);

  useEffect(() => {
    const handleStatus = ({ status }: { status: string }) => {
      setConnected(status === 'connected');
    };
    provider.on('status', handleStatus);

    // Connect (or reconnect if this is StrictMode's second mount).
    if (!provider.wsconnected && !provider.wsconnecting) {
      provider.connect();
    }
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      provider.off('status', handleStatus);
      // Disconnect the WebSocket but keep the provider alive so it can
      // reconnect on StrictMode's second useEffect invocation.  We only
      // fully destroy on component unmount, which we detect by checking
      // that no subsequent effect re-mounted us.  We defer the destroy
      // by one microtask so the StrictMode re-mount can set mountedRef
      // back to true before we decide to destroy.
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
