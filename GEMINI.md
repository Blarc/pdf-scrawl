# GEMINI.md - PDF Scrawl

## Project Overview

**PDF Scrawl** is a real-time collaborative PDF annotation application. It allows multiple users to view, annotate (draw, highlight), and comment on PDF documents simultaneously within isolated collaborative "rooms."

### Core Technologies
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS (Design System), [PDF.js](https://mozilla.github.io/pdf.js/) for rendering, [wouter](https://github.com/molefrog/wouter) for routing.
- **Real-time Sync:** [Yjs](https://yjs.dev/) (CRDTs) for data consistency and [Hocuspocus](https://hocuspocus.dev/) for WebSocket-based synchronization.
- **Backend:** [Fastify](https://www.fastify.io/) running on [Bun](https://bun.sh/), handling both HTTP (PDF uploads/downloads) and WebSocket (collaboration) traffic.
- **Testing:** [Playwright](https://playwright.dev/) for end-to-end testing.

### Architecture
The project is a monorepo structured into two main workspaces:
- `frontend/`: The React-based user interface.
- `server/`: The Fastify/Bun server managing collaboration sessions and ephemeral PDF storage.

Collaboration is room-based, where each room is identified by a unique ID in the URL. Rooms are isolated Yjs documents, and PDF files are stored temporarily on the server (by default in `/tmp/pdf-rooms/`).

## Building and Running

### Prerequisites
- [Bun](https://bun.sh/) (v1.0 or later recommended)

### Setup
1. **Install dependencies:**
   ```bash
   bun install
   ```

### Development
Start both the backend server and the frontend development server concurrently:
```bash
bun run dev
```
- **Frontend:** [http://localhost:5173](http://localhost:5173) (or as reported by Vite)
- **Backend/API:** [http://localhost:1234](http://localhost:1234)

**Individual Workspace Commands:**
- `bun run dev:server` — Starts only the backend server (with hot reload).
- `bun run dev:frontend` — Starts only the Vite frontend.

### Testing
Run end-to-end tests using Playwright:
```bash
bun test
```

### Docker
Run the full stack using Docker Compose:
```bash
docker-compose up --build
```

## Development Conventions

### Coding Style
- **TypeScript:** Strict typing is encouraged. Interfaces and types should be defined in `frontend/src/types.ts` if they are shared.
- **React:** Functional components with Hooks.
- **State Management:** Local UI state is handled with standard React hooks (`useState`, `useCallback`, etc.). Collaborative state (annotations, comments) is managed via Yjs types and synchronized through the `useYjs` hook.
- **Styling:** Tailwind CSS is used for all styling. Components follow the "Living Blueprint" design system defined in `DESIGN.md`. Atomic UI components (Surface, Button, Typography) are located in `frontend/src/components/ui/`.
- **Key Design Rules:**
  - **No-Line Rule:** Boundaries are defined by background color shifts (`surface-container-low` to `surface-container-high`) instead of 1px borders.
  - **Typography Scale:** Editorial precision using Manrope (Architect), Inter (Utility), and Plus Jakarta Sans (Human).
  - **Glassmorphism:** Floating panels use `surface-bright` with backdrop blurs.

### Key Files & Directories
- `frontend/src/App.tsx`: Root component, handles routing and high-level room management.
- `frontend/src/hooks/useYjs.ts`: Manages Hocuspocus provider and Yjs document lifecycle.
- `frontend/src/hooks/useAnnotations.ts`: Custom hook for CRUD operations on PDF annotations.
- `frontend/src/components/PDFViewer.tsx`: Responsible for rendering PDF pages and overlaying the annotation layer.
- `server/src/server.ts`: Entry point for the Fastify server, configures Hocuspocus and HTTP routes.
- `server/src/plugins/app/pdf.ts`: Logic for PDF storage and retrieval.

### Important Notes
- **Ephemeral Storage:** The server stores PDFs in a temporary directory. Restarting the server will clear all uploaded PDFs and collaboration data unless configured otherwise.
- **CRDTs:** All collaborative data must be stored in Yjs types (Maps, Arrays) to ensure eventual consistency across all clients.
- **React StrictMode:** The `useYjs` hook contains logic to handle the double-mounting behavior of React StrictMode in development to prevent duplicate WebSocket connections.
