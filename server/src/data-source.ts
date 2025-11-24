import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './models/User';
import { Role } from './models/Role';
import { Category } from './models/Category';
import { Report } from './models/Report';
import { ReportPhoto } from './models/ReportPhoto';
import { MunicipalityOfficer } from './models/MunicipalityOfficer';
import { Message } from './models/Message';
import { Notification } from './models/Notification';

export const AppDataSource= new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5434),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'participium',
    synchronize: false,
    logging: false,
    entities: [User, Role, Category, Report, ReportPhoto, MunicipalityOfficer, Message, Notification],
    migrations: ['src/migrations/*.ts'],
});
