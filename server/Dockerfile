# server/Dockerfile
FROM node:20-alpine

# Set workdir
WORKDIR /app

# Install deps first (better caching)
COPY package*.json ./
RUN npm ci

# Copy sources
COPY . .

# Default command is overridden by docker-compose (migrator/api)
# Keep a harmless default so the image is runnable alone.
CMD ["node", "-v"]
