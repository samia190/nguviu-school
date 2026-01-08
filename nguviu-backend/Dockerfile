# Use Alpine-based Node.js for minimal image size
FROM node:20-alpine AS base

# Add necessary build tools for native dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application source
COPY . .

# Create necessary directories for uploads/downloads
RUN mkdir -p public/uploads downloads && \
    chown -R node:node /app

# Use non-root user for security
USER node

# Expose port (Railway will override with $PORT)
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "index.js"]
