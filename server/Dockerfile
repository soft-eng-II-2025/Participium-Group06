# Passiamo a Bookworm (Debian 12) che ha GLIBC aggiornata
FROM node:20-bookworm-slim

WORKDIR /app

# Installiamo le dipendenze di build necessarie per compilare argon2
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 build-essential make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# npm ci installerà le dipendenze e compilerà i moduli nativi (come argon2) 
# direttamente per l'ambiente Linux del container
RUN npm ci

COPY . .

# Crea cartelle e compila
RUN mkdir -p /app/dist /app/uploads \
    && chmod -R 755 /app/uploads \
    && npm run build

# Copia gli assets se necessario
RUN cp -r /app/src/assets /app/dist/assets || true

RUN cp src/telegram-bot/turin-boundary.geojson dist/telegram-bot/turin-boundary.geojson || true

# Pulizia: rimuoviamo i tool di build per rendere l'immagine leggera
RUN apt-get purge -y --auto-remove python3 build-essential make g++

RUN chown -R node:node /app/dist /app/uploads
USER node

CMD ["node", "dist/index.js"]