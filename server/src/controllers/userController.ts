import { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import { CreateUserRequestDTO } from "../models/DTOs/CreateUserRequestDTO";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { AppDataSource } from "../data-source";
import { mapReportDAOToDTO as mapReportDAOToResponse, mapCreateReportRequestToDAO, mapUserDAOToDTO as mapUserDAOToResponse } from "../services/mapperService";
import { hashPassword, verifyPassword } from "../services/passwordService";
import { User } from "../models/User";

const userRepository: UserRepository = new UserRepository(AppDataSource);
const reportRepository: ReportRepository = new ReportRepository(AppDataSource);

function appErr(code: string, status = 400) { const e: any = new Error(code); e.status = status; return e; }

export async function addReport(reportData: CreateReportRequestDTO): Promise<ReportResponseDTO> {
    const reportDAO = mapCreateReportRequestToDAO(reportData);
    const addedReport = await reportRepository.add(reportDAO);
    return mapReportDAOToResponse(addedReport);
}

export async function createUser(userData: CreateUserRequestDTO): Promise<UserResponseDTO> {
    if (!userData.password?.trim()) throw appErr("PASSWORD_REQUIRED", 400);

    const username = userData.username.trim().toLowerCase();
    const email = userData.email.trim().toLowerCase();

    if (await userRepository.findByUsername(username)) throw appErr('USERNAME_TAKEN', 409);
    if (await userRepository.findByEmail(email)) throw appErr('EMAIL_TAKEN', 409);

    const hashed = await hashPassword(userData.password);

    const userDao = new User();
    userDao.username = username;
    userDao.email = email;
    userDao.password = hashed;
    userDao.first_name = userData.first_name;
    userDao.last_name = userData.last_name;

    const addedUserDao = await userRepository.add(userDao);
    return mapUserDAOToResponse(addedUserDao); // password nulla in output
}

export async function loginUser(loginData: LoginRequestDTO) {
    const username = loginData.username?.trim().toLowerCase();
    const password = loginData.password ?? "";

    if (!username || !password) throw appErr("MISSING_CREDENTIALS", 400);

    const user = await userRepository.findByUsername(username);
    const ok = user && await verifyPassword(user.password, password);

    if (!ok) throw appErr("INVALID_CREDENTIALS", 401);

    return mapUserDAOToResponse(user);
}

export async function getUserByUsername(username: string): Promise<UserResponseDTO> {
    const user = await userRepository.findByUsername(username);
    if (!user) throw appErr("USER_NOT_FOUND", 404);
    return mapUserDAOToResponse(user);
}