FROM node:20-slim

WORKDIR /app

# Copy the monorepo root package files
COPY package*.json ./

# Copy the server workspace
COPY server/package*.json ./server/

# Install dependencies (only for server and root)
RUN npm install -w server

# Copy the rest of the server code
COPY server/ ./server/

# Build or setup step if needed
# (Server currently uses tsx directly)

EXPOSE 1234

CMD ["npm", "start", "-w", "server"]
