# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm install -w frontend
COPY frontend/ ./frontend/
RUN npm run build -w frontend

# Stage 2: Build the server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm install -w server
COPY server/ ./server/
RUN npm run build -w server

# Stage 3: Final production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy root package files
COPY package*.json ./
# Copy server package files
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --omit=dev -w server

# Copy built server from Stage 2
COPY --from=server-builder /app/server/dist ./server/dist
# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 1234
# Run the server directly
CMD ["npm", "start", "-w", "server"]
