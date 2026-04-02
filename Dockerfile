# syntax=docker/dockerfile:1

FROM oven/bun:latest AS base
WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY package.json bun.lock ./
COPY frontend/package.json ./frontend/
COPY server/package.json ./server/

FROM base AS frontend-builder
COPY frontend/ ./frontend/
RUN bun install --filter=frontend
RUN cd frontend && bun run build

FROM base AS server-builder
COPY server/ ./server/
RUN bun install --filter=server
RUN cd server && bun run build

FROM base AS runtime
ENV NODE_ENV=production

# Server production dependencies only.
RUN bun install --production --filter=server

# Keep runtime layout aligned with:
# FRONTEND_DIST = join(process.cwd(), '../frontend/dist')
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/server
EXPOSE 1234
CMD ["bun", "dist/server.js"]
