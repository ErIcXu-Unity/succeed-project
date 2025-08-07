# Frontend Dockerfile with multi-stage build
# Stage 1: Development (can be used for dev mode)
FROM node:18-alpine as development

WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Copy source code
COPY . .

# Expose port 3000 for development
EXPOSE 3000

# Default command for development
CMD ["npm", "start"]

# Stage 2: Build stage for production
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 3: Production stage with nginx
FROM nginx:alpine as production

# Install curl for health checks
RUN apk --no-cache add curl

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Set proper permissions for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html

# Note: Running nginx as root for Docker simplicity
# In production, consider proper user management

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]