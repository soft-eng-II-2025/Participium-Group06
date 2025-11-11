import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Category } from '../models/Category';
import { Report } from '../models/Report';
import { ReportPhoto } from '../models/ReportPhoto';
import { MunicipalityOfficer } from '../models/MunicipalityOfficer';


export const TestDataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  synchronize: true,
  entities: [User, Role, Category, Report, ReportPhoto, MunicipalityOfficer],
});
