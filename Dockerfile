# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN npm install -w frontend
COPY frontend/ ./frontend/
# For a single process deployment, these URLs can often be left as 
# empty or relative, but let's default them to the same host.
RUN npm run build -w frontend

# Stage 2: Final production image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copy root package files
COPY package*.json ./
# Copy server package files
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm install --omit=dev -w server

# Copy server code
COPY server/ ./server/
# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 1234
# Run the server directly using tsx (already a dependency)
CMD ["npm", "start", "-w", "server"]
