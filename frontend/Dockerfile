# Stage 1: Build the frontend
FROM node:20-slim AS builder

WORKDIR /app

# Copy the monorepo root package files
COPY package*.json ./

# Copy the frontend workspace
COPY frontend/package*.json ./frontend/

# Install dependencies (only for frontend and root)
RUN npm install -w frontend

# Copy the rest of the frontend code
COPY frontend/ ./frontend/

# Build the frontend
# Use build arguments for production URLs
ARG VITE_WS_URL
ARG VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build -w frontend

# Stage 2: Serve the frontend using Nginx
FROM nginx:alpine

# Copy the build result from the builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Optional: Add custom nginx config for SPA routing
RUN echo 'server { 
    listen 80; 
    location / { 
        root /usr/share/nginx/html; 
        index index.html index.htm; 
        try_files $uri $uri/ /index.html; 
    } 
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
