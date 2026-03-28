# Unified Build (experimental)
# This Dockerfile builds both frontend and server and runs the server.
# Note: The server currently doesn't serve the frontend static files.
# Use docker-compose.yml for a fully functional setup.

FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY server/package*.json ./server/

RUN npm install

COPY . .

# Build frontend (to have it ready)
RUN npm run build -w frontend

EXPOSE 1234

CMD ["npm", "start", "-w", "server"]
