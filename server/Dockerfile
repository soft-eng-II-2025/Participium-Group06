FROM node:20-alpine

WORKDIR /app

# Copia package.json e package-lock.json e installa le dipendenze
COPY package*.json ./
RUN npm install

# Copia tutto il codice
COPY . .

# Compila TypeScript
RUN npm run build

# Default command (può essere sovrascritto dal Compose)
CMD ["npm", "run", "start"]
