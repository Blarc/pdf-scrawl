import { useSyncExternalStore, useRef } from 'react';
import type { Awareness } from 'y-protocols/awareness';
import type { AwarenessState } from '../types';

interface Props {
  awareness: Awareness;
  connected: boolean;
}

type AwarenessEntry = [number, AwarenessState];

export function UserPresence({ awareness, connected }: Props) {
  const snapshotRef = useRef<AwarenessEntry[]>([]);

  const entries = useSyncExternalStore(
    (onChange) => {
      const cb = () => onChange();
      awareness.on('change', cb);
      return () => awareness.off('change', cb);
    },
    (): AwarenessEntry[] => {
      // Keyed by clientId so React can track avatar identity across join/leave
      const next = Array.from(
        awareness.getStates().entries()
      ) as AwarenessEntry[];
      // Stable reference: only return a new array if the content changed
      if (
        next.length === snapshotRef.current.length &&
        next.every(
          ([id, s], i) =>
            id === snapshotRef.current[i][0] &&
            s?.user?.name === snapshotRef.current[i][1]?.user?.name &&
            s?.user?.color === snapshotRef.current[i][1]?.user?.color
        )
      ) {
        return snapshotRef.current;
      }
      snapshotRef.current = next;
      return snapshotRef.current;
    },
    () => [] as AwarenessEntry[]
  );

  const users = entries.filter(([, s]) => s?.user);

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <span
        title={connected ? 'Connected' : 'Disconnected'}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: connected ? '#4caf50' : '#f44336',
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      {users.map(([clientId, state]) => (
        <div
          key={clientId}
          title={state.user.name}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: state.user.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 11,
            fontWeight: 'bold',
            flexShrink: 0,
            border: '2px solid #fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          {state.user.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  );
}
