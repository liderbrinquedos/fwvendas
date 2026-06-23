# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files from frontend/ directory
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund

# Copy source
COPY frontend/ ./

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
