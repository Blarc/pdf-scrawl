# PDF Scrawl 📝🌀

PDF Scrawl is a real-time collaborative PDF annotation application. It allows multiple users to view, annotate, and comment on PDF documents simultaneously within isolated "rooms."

## 🚀 Features

- **Real-time Collaboration:** See other users' annotations, comments, and presence in real-time using CRDTs (Yjs).
- **PDF Annotation:** Draw rectangles, freehand lines, and use an eraser to highlight important parts of a document.
- **Threaded Comments:** Discuss specific parts of the PDF with other collaborators.
- **User Presence:** See who else is in the room with status indicators.
- **Isolated Rooms:** Share a unique URL to invite others to a specific document's collaboration session.
- **Ephemeral Storage:** Quick setup with temporary file storage for PDFs.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, [PDF.js](https://mozilla.github.io/pdf.js/) for rendering, [wouter](https://www.npmjs.com/package/wouter) for routing.
- **Real-time Sync:** [Yjs](https://yjs.dev/) (CRDTs) and [Hocuspocus](https://hocuspocus.dev/) for robust WebSocket-based synchronization.
- **Backend:** [Bun](https://bun.sh/) HTTP + WebSocket server.
- **Testing:** [Playwright](https://playwright.dev/) for end-to-end testing.

## 🏁 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0 or later recommended)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Blarc/pdf-scrawl.git
    cd pdf-scrawl
    ```

2.  **Install dependencies for all workspaces:**
    ```bash
    bun install
    ```

### Development

Start both the backend server and the frontend development server concurrently:

```bash
bun run dev
```

- **Frontend:** http://localhost:1234
- **Backend:** ws://localhost:1234 (also handles PDF uploads/downloads via HTTP)

Alternatively, you can start them separately:
- `bun run dev:server` — Starts only the Hocuspocus/HTTP server.
- `bun run dev:frontend` — Starts only the Vite frontend.

### Testing

Run the Playwright E2E tests:

```bash
bun test
```

### 🐳 Docker

You can run the entire application using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend & Backend:** http://localhost:1234

This setup uses a persistent volume for PDF storage, so uploaded files will survive container restarts.

## ⚙️ Configuration

The backend server can be configured via environment variables (all optional):

- `HOST`: The host to listen on (default: `localhost`).
- `PORT`: The port to listen on (default: `1234`).
- `SESSION_SECRET`: 32-character key for session encryption.

The frontend currently defaults to connecting to `localhost:1234`.

## 🏗️ Architecture

The project is structured as an npm monorepo with two workspaces:

- `frontend/`: The React application.
- `server/`: The Bun collaboration server.

Documents are isolated into rooms based on the URL hash. Each room corresponds to a unique Yjs document name. PDF files are stored ephemerally in `/tmp/pdf-rooms/` (resets on server restart).

## 📄 License

MIT
