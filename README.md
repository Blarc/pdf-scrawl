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

- **Frontend:** React 18, TypeScript, Vite, [PDF.js](https://mozilla.github.io/pdf.js/) for rendering.
- **Real-time Sync:** [Yjs](https://yjs.dev/) (CRDTs) and [Hocuspocus](https://hocuspocus.dev/) for robust WebSocket-based synchronization.
- **Backend:** Node.js HTTP + WebSocket server.
- **Testing:** [Playwright](https://playwright.dev/) for end-to-end testing.

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Blarc/pdf-scrawl.git
    cd pdf-scrawl
    ```

2.  **Install dependencies for all workspaces:**
    ```bash
    npm install
    ```

### Development

Start both the backend server and the frontend development server concurrently:

```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** ws://localhost:1234 (also handles PDF uploads/downloads via HTTP)

Alternatively, you can start them separately:
- `npm run dev:server` — Starts only the Hocuspocus/HTTP server.
- `npm run dev:frontend` — Starts only the Vite frontend.

### Testing

Run the Playwright E2E tests:

```bash
npm test
```

### 🐳 Docker

You can run the entire application using Docker Compose:

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:8080
- **Backend:** http://localhost:1234

This setup uses a persistent volume for PDF storage, so uploaded files will survive container restarts.

## ⚙️ Configuration

The backend server can be configured via environment variables (all optional):

- `HOST`: The host to listen on (default: `localhost`).
- `PORT`: The port to listen on (default: `1234`).
- `AUTH_TOKEN`: If set, enables basic bearer token authentication via the `?token=` query parameter for WebSocket connections.

The frontend currently defaults to connecting to `localhost:1234`.

## 🏗️ Architecture

The project is structured as an npm monorepo with two workspaces:

- `frontend/`: The React application.
- `server/`: The Node.js collaboration server.

Documents are isolated into rooms based on the URL hash. Each room corresponds to a unique Yjs document name. PDF files are stored ephemerally in `/tmp/pdf-rooms/` (resets on server restart).

## 📄 License

MIT
