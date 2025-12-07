import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Category } from '../models/Category';
import { Report } from '../models/Report';
import { ReportPhoto } from '../models/ReportPhoto';
import { MunicipalityOfficer } from '../models/MunicipalityOfficer';
import { Notification } from '../models/Notification';
import { Message } from '../models/Message';
import { Chat } from '../models/Chat';
import { VerificationCode } from '../models/VerificationCode';



export const TestDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5435, // stessa porta di postgres-test
  username: "test_user",
  password: "test_password",
  database: "participium_test",
  synchronize: true,
  dropSchema: true,
  logging: false,
  entities: [User, Role, Category, Report, ReportPhoto, MunicipalityOfficer, Message, Notification, VerificationCode, Chat],
});
