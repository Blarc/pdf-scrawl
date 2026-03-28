# PDF Scrawl

Real-time collaborative PDF annotation app. Users share a room link to simultaneously view, annotate, and comment on a PDF.

## Architecture

npm monorepo with two workspaces:
- `frontend/` — React 18 + TypeScript + Vite, PDF.js for rendering, Yjs (CRDT) for real-time sync
- `server/` — Node.js HTTP + WebSocket server, Hocuspocus for Yjs sync, temporary PDF storage in `/tmp/pdf-rooms/`

## Commands

```bash
npm run dev          # Start both server (port 1234) and frontend (port 5173) concurrently
npm run dev:server   # Server only
npm run dev:frontend # Frontend only
npm test             # Playwright E2E tests
```

## Key Files

| File | Purpose |
|------|---------|
| `server/server.ts` | HTTP + WebSocket server, PDF upload/download, room routing |
| `frontend/src/App.tsx` | Root component, room lifecycle, upload flow |
| `frontend/src/types.ts` | Shared TypeScript interfaces |
| `frontend/src/hooks/useYjs.ts` | Hocuspocus provider, connection management |
| `frontend/src/hooks/useAnnotations.ts` | Annotation CRDT operations |
| `frontend/src/hooks/useComments.ts` | Comment CRDT operations |
| `frontend/src/components/PDFViewer.tsx` | PDF rendering, annotation layer overlay |
| `frontend/src/components/AnnotationLayer.tsx` | Canvas-based drawing (rect, freehand, eraser) |
| `frontend/src/components/CommentPanel.tsx` | Threaded comments sidebar |
| `frontend/src/components/UserPresence.tsx` | Connected users + cursor awareness |

## Environment

Server env vars (all optional):
- `HOST` — default `localhost`
- `PORT` — default `1234`
- `AUTH_TOKEN` — enables bearer token auth via `?token=` query param

Frontend hardcodes `ws://localhost:1234` and `http://localhost:1234` in `App.tsx`.

## Notes

- Rooms are URL-hash based; each room is an isolated Yjs document
- PDF storage is ephemeral (`/tmp/pdf-rooms/`) — resets on server restart
- `useYjs` handles React StrictMode double-mount cleanup explicitly
- PDF.js is excluded from Vite pre-bundling optimizations
