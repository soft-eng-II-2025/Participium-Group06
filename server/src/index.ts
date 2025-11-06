import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { AppDataSource } from './data-source';
import {errorHandler} from "./middlewares/errorMiddleware";
import {router} from "./routes/routes";


const PORT = Number(process.env.PORT ?? 3000);
export const app = express();


app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use("/api", router);
app.use(errorHandler);

async function main() {
    await AppDataSource.initialize()
    .then(() => {
        console.log('Database connesso');

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
