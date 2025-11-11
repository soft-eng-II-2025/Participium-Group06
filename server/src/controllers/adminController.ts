import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import { MunicipalityOfficerRepository } from "../repositories/MunicipalityOfficerRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { verifyPassword, hashPassword } from "../services/passwordService";
import { mapMunicipalityOfficerDAOToDTO as mapMunicipalityOfficerDAOToResponse } from "../services/mapperService";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { AppDataSource } from "../data-source";

function appErr(code: string, status = 400) { const e: any = new Error(code); e.status = status; return e; }

export async function addMunicipalityOfficer(officerData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: { title: string };
}, dataSource = AppDataSource): Promise<MunicipalityOfficerResponseDTO> {
    if (!officerData.password?.trim()) throw appErr("PASSWORD_REQUIRED", 400);
    const roleRepository = new RoleRepository(dataSource);
    const municipalityOfficerRepository = new MunicipalityOfficerRepository(dataSource);
    // costruiamo il DAO manualmente (niente mapper DTO->DAO qui)
    const dao = new MunicipalityOfficer();
    dao.username = officerData.username.trim().toLowerCase();
    dao.email = officerData.email.trim().toLowerCase();
    dao.password = await hashPassword(officerData.password);
    dao.first_name = officerData.first_name;
    dao.last_name = officerData.last_name;

    // se vuoi permettere la creazione con ruolo già assegnato (opzionale)
    if (officerData.role?.title) {
        const role = await roleRepository.findByTitle(officerData.role.title.trim());
        if (!role) throw appErr("ROLE_NOT_FOUND", 404);
        dao.role = role;
    }

    const officerAdded = await municipalityOfficerRepository.add(dao);
    return mapMunicipalityOfficerDAOToResponse(officerAdded);
}

export async function getAllMunicipalityOfficer(dataSource = AppDataSource): Promise<MunicipalityOfficerResponseDTO[]> {
    const municipalityOfficerRepository = new MunicipalityOfficerRepository(dataSource);
    const allOfficerDao = await municipalityOfficerRepository.findAll();
    return allOfficerDao.map(mapMunicipalityOfficerDAOToResponse);
}

// usata dall'endpoint /accounts/assign (retro-compat con adapter)
export async function updateMunicipalityOfficer(officerData: { username: string; role?: { title: string } }, dataSource = AppDataSource): Promise<MunicipalityOfficerResponseDTO> {
    const municipalityOfficerRepository = new MunicipalityOfficerRepository(dataSource);
    const roleRepository = new RoleRepository(dataSource);
    const existingOfficer = await municipalityOfficerRepository.findByusername(officerData.username.trim().toLowerCase());
    if (!existingOfficer) throw appErr("OFFICER_NOT_FOUND", 404);
    if (existingOfficer.role != null) throw appErr("ROLE_ALREADY_ASSIGNED", 409);

    if (!officerData.role?.title) throw appErr("ROLE_TITLE_REQUIRED", 400);
    const role = await roleRepository.findByTitle(officerData.role.title.trim());
    if (!role) throw appErr("ROLE_NOT_FOUND", 404);

    existingOfficer.role = role;
    const updatedOfficer = await municipalityOfficerRepository.update(existingOfficer);
    return mapMunicipalityOfficerDAOToResponse(updatedOfficer);
}

export async function loginOfficer(loginData: LoginRequestDTO, dataSource = AppDataSource) {
    const username = loginData.username?.trim().toLowerCase();
    const password = loginData.password ?? "";

    if (!username || !password) throw appErr("MISSING_CREDENTIALS", 400);

    const municipalityOfficerRepository = new MunicipalityOfficerRepository(dataSource);
    const officer = await municipalityOfficerRepository.findByusername(username);
    const ok = officer && await verifyPassword(officer.password, password);

    if (!ok) throw appErr("INVALID_CREDENTIALS", 401);

    return mapMunicipalityOfficerDAOToResponse(officer);
}
