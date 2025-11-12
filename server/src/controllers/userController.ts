import { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import { CreateUserRequestDTO } from "../models/DTOs/CreateUserRequestDTO";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { AppDataSource } from "../data-source";
//import { mapReportDAOToDTO as mapReportDAOToResponse, mapCreateReportRequestToDAO, mapUserDAOToDTO as mapUserDAOToResponse } from "../services/mapperService";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { CategoryResponseDTO } from "../models/DTOs/CategoryResponseDTO";
import { mapReportDAOToDTO as mapReportDAOToResponse, mapCreateReportRequestToDAO, mapUserDAOToDTO as mapUserDAOToResponse, mapCategoryDAOToDTO } from "../services/mapperService";
import { hashPassword, verifyPassword } from "../services/passwordService";
import { User } from "../models/User";
import { map } from "zod";
import { ReportPhoto } from "../models/ReportPhoto";
import { DataSource } from "typeorm";

/*const userRepository: UserRepository = new UserRepository(AppDataSource);
const reportRepository: ReportRepository = new ReportRepository(AppDataSource);
const categoryRepository: CategoryRepository = new CategoryRepository(AppDataSource);*/

let userRepository: UserRepository;
let reportRepository: ReportRepository;
let categoryRepository: CategoryRepository;

export function initializeUserRepositories(dataSource: DataSource) {
  userRepository = new UserRepository(dataSource);
  reportRepository = new ReportRepository(dataSource);
  categoryRepository = new CategoryRepository(dataSource);
}

function appErr(code: string, status = 400) { const e: any = new Error(code); e.status = status; return e; }

export async function addReport(reportData: CreateReportRequestDTO): Promise<ReportResponseDTO> {
    // In un sistema autenticato, l'ID dell'utente dovrebbe venire dal token/sessione.
    // Per ora, assumiamo che reportData.userId sia valido.
    const reportDAO = mapCreateReportRequestToDAO(reportData);
    const addedReport = await reportRepository.add(reportDAO);
    // Ora, aggiungiamo le foto al report aggiunto
    if (reportData.photos && reportData.photos.length > 0) {
        const photoDAOs = reportData.photos.map(photoUrl => {
            const reportPhoto = new ReportPhoto();
            reportPhoto.photo = photoUrl; // photoUrl ora è un percorso locale (es. /uploads/nomefile.jpg)
            reportPhoto.report = addedReport;
            return reportPhoto;
        });
        await reportRepository.addPhotosToReport(addedReport, photoDAOs);
        // Per assicurarsi che l'oggetto addedReport restituito contenga le foto
        addedReport.photos = photoDAOs;
    }
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

export async function getUserIdByUsername(username: string): Promise<number> {
    const user = await userRepository.findByUsername(username);
    if (!user) throw appErr("USER_NOT_FOUND", 404);
    return user.id;
}

export async function getAllCategories(): Promise<CategoryResponseDTO[]> {
    const categories = await categoryRepository.findAll();
    return categories.map(mapCategoryDAOToDTO);
}