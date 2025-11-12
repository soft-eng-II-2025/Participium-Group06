// src/index.ts (VERSIONE CORRETTA PER AMBIENTE TEST)
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

const PORT = Number(process.env.PORT ?? 3000);

export const app = express(); // Esposta per i test

app.use(cors({ origin: true, credentials: true }));
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

// Esporta la funzione di inizializzazione per i test E2E
export async function initializeApp(dataSource: any = AppDataSource) {
    await dataSource.initialize();
    console.log('Database connesso');
    initializeUserRepositories(dataSource);
    initializeAdminRepositories(dataSource);
    // app.listen non deve essere chiamato qui, sarà chiamato da main()
}

// La funzione main originale ora chiama initializeApp E app.listen
async function main() {
    await initializeApp(AppDataSource); // Usa AppDataSource di default
    app.listen(PORT, () => {
        console.log(`Server started on http://localhost:${PORT}`);
    });
}

// <---------- MODIFICA CRUCIALE QUI ---------->
// Esegui main() SOLO se il file è il punto di ingresso principale
// (cioè, non è importato come modulo da un altro file come un test).
if (require.main === module) {
    main().catch((error) => {
        console.error("[FATAL]", error);
        process.exit(1);
    });
}
// <---------- FINE MODIFICA CRUCIALE ---------->