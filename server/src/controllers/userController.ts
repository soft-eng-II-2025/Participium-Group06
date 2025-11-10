import { ReportDTO } from "../models/DTOs/ReportDTO";
import { UserDTO } from "../models/DTOs/UserDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import {mapReportDAOToDTO, mapReportDTOToDAO, mapUserDAOToDTO, mapUserDTOToDAO} from "../services/mapperService";
import {CategoryRepository} from "../repositories/CategoryRepository";
import { hashPassword, verifyPassword } from "../services/passwordService";
import { User } from "../models/User";
import { string } from "zod";
import { LoginDTO } from "../models/DTOs/LoginDTO";

const userRepository: UserRepository = new UserRepository();
const reportRepository: ReportRepository = new ReportRepository();

export async function addReport(reportData: ReportDTO): Promise<ReportDTO> {
    const reportDAO = mapReportDTOToDAO(reportData);
    const addedReport = await reportRepository.add(reportDAO);
    return mapReportDAOToDTO(addedReport);
}


export async function createUser(userData: UserDTO): Promise<UserDTO> {
  // hash incoming plain password
  let hashed: string = "";
  if (userData.password != null && userData.password != undefined) {
    hashed = await hashPassword(userData.password);
  } else { 
    throw new Error("Password is required");
  }
  // build DAO manually to avoid relying on input DTO exposing reports etc.
  const userDao = new User();
  userDao.username = userData.username;
  userDao.email = userData.email;
  userDao.password = hashed;
  userDao.first_name = userData.first_name;
  userDao.last_name = userData.last_name;

  const addedUserDao = await userRepository.add(userDao);
  return mapUserDAOToDTO(addedUserDao); // mapper sets password null for output
}

export async function login(loginData: LoginDTO): Promise<UserDTO> {
  // Adjust lookup method names to your repository (by email or username)
  const userDao = (await userRepository.findByUsername(loginData.username));

  if (!userDao) { 
    const e = new Error("User not found");
    e.name = "USER_NOT_FOUND";
    throw e;
  }

  if (loginData.password == null || loginData.password == undefined) {
    const e = new Error("Password is required");
    e.name = "PASSWORD_REQUIRED";
    throw e;
  }

  const ok = await verifyPassword(userDao.password, loginData.password);
  if (!ok) {
    const e = new Error("Wrong password");
    e.name = "WRONG_PASSWORD";
    throw e;
  }

  return mapUserDAOToDTO(userDao); // safe: mapper will not expose the hash
}