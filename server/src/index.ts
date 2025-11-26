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
import { initializeMessageRepositories } from './controllers/messagingController';
import { initializeNotificationController } from "./controllers/notificationController";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { DataSource } from "typeorm";
import path from "path";

const PORT = Number(process.env.PORT ?? 3000);

export const app = express(); // Esposta per i test

// ------------------- Express Middlewares -------------------
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

app.use("api/users/uploads", express.static(path.join(__dirname, "../uploads")));

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

// ------------------- HTTP & Socket.IO Setup -------------------
const server = http.createServer(app);
export const io = new SocketIOServer(server, {
    cors: {
        origin: true,       // or your frontend URL
        credentials: true,
    },
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
});

// ------------------- App Initialization -------------------
export async function initializeApp(dataSource: DataSource) {
    if (!dataSource.isInitialized) {
        await dataSource.initialize();
    }
    console.log('Database connesso');

    initializeUserRepositories(dataSource);
    initializeAdminRepositories(dataSource);
    initializeReportRepositories(dataSource, io);
    initializeMessageRepositories(dataSource, io);
    initializeNotificationController(dataSource);
}

// ------------------- Main -------------------
async function main() {
    await initializeApp(AppDataSource);

    // Only use server.listen for both Express + Socket.IO
    server.listen(PORT, () => {
        console.log(`Server started on http://localhost:${PORT}`);
    });
}

if (require.main === module) {
    main().catch((error) => {
        console.error("[FATAL]", error);
        process.exit(1);
    });
}
