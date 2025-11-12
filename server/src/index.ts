import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import './auth/passport';
import { AppDataSource } from './data-source';
import {errorHandler} from "./middlewares/errorMiddleware";
import {router} from "./routes/routes";
import { initializeUserRepositories } from './controllers/userController';
import { initializeAdminRepositories } from './controllers/adminController';


const PORT = Number(process.env.PORT ?? 3000);
export const app = express();


// allow credentials (cookies) and reflect origin
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
// session + passport setup for authentication
app.use(
    session({
        secret: process.env.SESSION_SECRET ?? 'dev-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api", router);
app.use(errorHandler);

async function main() {
    await AppDataSource.initialize()
    .then(() => {
        console.log('Database connesso');
        initializeUserRepositories(AppDataSource);
        initializeAdminRepositories(AppDataSource);

        app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Errore DB:', err);
    });
}

main().catch((error) => {
  console.error("[FATAL]", error);
  process.exit(1);
});
