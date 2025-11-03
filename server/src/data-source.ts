import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from './models/User';
import { Role } from './models/Role';
import { Category } from './models/Category';
import { Report } from './models/Report';
import { ReportPhoto } from './models/ReportPhoto';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'participium',
  synchronize: true,
  logging: true,
  entities: [User, Role, Category, Report, ReportPhoto],
});
