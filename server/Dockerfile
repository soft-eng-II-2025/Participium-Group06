FROM node:20-alpine

WORKDIR /app

# Copia package.json e package-lock.json e installa le dipendenze
COPY package*.json ./
RUN npm ci

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
