FROM node:20-bullseye-slim

WORKDIR /app

# Copia package.json e package-lock.json e installa le dipendenze
COPY package*.json ./
# Install build tools required for native modules (argon2, sqlite3, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential make g++ && \
    rm -rf /var/lib/apt/lists/* && \
    npm ci && \
    # remove build tools to keep image smaller (they may be needed at build time only)
    apt-get purge -y --auto-remove python3 build-essential make g++ || true

# Copia tutto il codice
COPY . .

# Crea cartelle necessarie
RUN mkdir -p /app/dist /app/uploads \
    && chmod -R 755 /app/uploads

# Compila TypeScript come root (perché node non ha ancora dist)
RUN npm run build

# Cambia proprietario per runtime
RUN chown -R node:node /app/dist /app/uploads

# Usa l’utente node per eseguire
USER node

# Default command
CMD ["node", "dist/index.js"]
