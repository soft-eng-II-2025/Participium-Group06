import { UserResponseDTO } from "../models/DTOs/UserResponseDTO";
import { UpdateUserRequestDTO } from "../models/DTOs/UpdateUserRequestDTO";
import { CreateUserRequestDTO } from "../models/DTOs/CreateUserRequestDTO";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { UserRepository } from "../repositories/UserRepository";
import {
    mapReportDAOToDTO as mapReportDAOToResponse,
    mapCreateReportRequestToDAO,
    mapUserDAOToDTO as mapUserDAOToResponse,
    mapCategoryDAOToDTO
} from "../services/mapperService";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { CategoryResponseDTO } from "../models/DTOs/CategoryResponseDTO";
import { hashPassword, verifyPassword } from "../services/passwordService";
import { User } from "../models/User";
import { DataSource } from "typeorm";
import { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";


/*const userRepository: UserRepository = new UserRepository(AppDataSource);
const reportRepository: ReportRepository = new ReportRepository(AppDataSource);
const categoryRepository: CategoryRepository = new CategoryRepository(AppDataSource);*/

let userRepository: UserRepository;
let categoryRepository: CategoryRepository;

export function initializeUserRepositories(dataSource: DataSource) {
  userRepository = new UserRepository(dataSource);
  categoryRepository = new CategoryRepository(dataSource);
}

function appErr(code: string, status = 400) { const e: any = new Error(code); e.status = status; return e; }

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
    userDao.photo = "";
    userDao.telegram_id = "";
    userDao.flag_email = true;

    const addedUserDao = await userRepository.add(userDao);
    return mapUserDAOToResponse(addedUserDao); // password nulla in output
}

export async function updateUser(username: string, updatedData:UpdateUserRequestDTO): Promise<UserResponseDTO> {
    const user = await userRepository.findByUsername(username)
    if (!user) throw appErr("USER_NOT_FOUND", 404);

    if (updatedData.photo !== undefined) {
        await userRepository.changePhoto(user, updatedData.photo ? String(updatedData.photo) : "");
    }
    if (updatedData.telegram_id !== undefined) {
        await userRepository.changeTelegramId(user, updatedData.telegram_id ? String(updatedData.telegram_id) : "");
    }
    if (updatedData.flag_email !== undefined) {
        await userRepository.changeFlagEmail(user, Boolean(updatedData.flag_email));
    }
    
    const updatedUser = await userRepository.findByUsername(username);
    return mapUserDAOToResponse(updatedUser!); 
}

export async function loginUser(loginData: LoginRequestDTO) {
    const username = loginData.username;
    const password = loginData.password;

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

export async function getUserById(userId: number): Promise<UserResponseDTO> {
    const user = await userRepository.findByid(userId);
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

export async function updateUserProfile(
    userId: number,
    payload: UpdateUserRequestDTO
) {
    // TODO: implement updateUserProfile (carica utente, aggiorna campi, salva, ritorna DTO)
    throw new Error("updateUserProfile not implemented");
}

export async function getUserIdByTelegramUsername(telegram_username: string): Promise<number> {
    const user = await userRepository.findByTelegramUsername(telegram_username);
    if (!user) throw appErr("USER_NOT_FOUND", 404);
    return user.id;
}

