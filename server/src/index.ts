// src/index.ts (modificato)

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import './auth/passport';

import { AppDataSource } from './data-source';
import { errorHandler } from "./middlewares/errorMiddleware";
import { router } from "./routes/routes";
import { initializeUserRepositories } from './controllers/userController';
import { initializeAdminRepositories } from './controllers/adminController';
import { initializeReportRepositories } from './controllers/reportController';
import { initializeMessageRepositories } from './controllers/messagingController'; // Assicurati che questo sia il nome del controller corretto (messageController o messagingController)

import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { DataSource } from "typeorm";

const PORT = Number(process.env.PORT ?? 3000);

export const app = express(); // Esposta per i test

// La tua configurazione CORS per Express
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:8080', credentials: true })); // <-- Suggerimento: usa la variabile d'ambiente FRONTEND_URL
app.use(morgan('dev'));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET ?? 'dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);

app.use(errorHandler);

// Creazione del server HTTP e aggancio di Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080', // <-- DEVE essere l'esatta origine del tuo frontend per 'credentials: true'
    credentials: true,
  },
  path: "/socket.io/", // Path di default, è corretto così
});

export async function initializeApp(dataSource: DataSource) {
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }
    console.log('Database connesso');

    initializeUserRepositories(dataSource);
    initializeAdminRepositories(dataSource);
    initializeReportRepositories(dataSource);
    // Assicurati che initializeMessageRepositories accetti 'io' come secondo parametro
    initializeMessageRepositories(dataSource, io); // <-- QUI passi l'istanza 'io'
}

async function main() {
    await initializeApp(AppDataSource);

    // *** QUI C'È LA MODIFICA FONDAMENTALE ***
    server.listen(PORT, () => { // <-- CAMBIATO DA app.listen A server.listen
        console.log(`Server started on http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    main().catch((error) => {
        console.error("[FATAL]", error);
        process.exit(1);
    });
}