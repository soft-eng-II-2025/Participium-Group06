// src/controllers/adminController.ts
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import { MunicipalityOfficerRepository } from "../repositories/MunicipalityOfficerRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { verifyPassword, hashPassword } from "../services/passwordService";
import { mapMunicipalityOfficerDAOToDTO as mapMunicipalityOfficerDAOToResponse } from "../services/mapperService";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { AppDataSource } from "../data-source";

const municipalityOfficerRepository = new MunicipalityOfficerRepository();
const roleRepository = new RoleRepository();

function appErr(code: string, status = 400) {
    const e: any = new Error(code);
    e.status = status;
    return e;
}

// helpers per bloccare admin user/role
const isAdminRole = (t?: string) => !!t && /^(admin|super\s*admin)$/i.test(t.trim());
const isAdminUser = (u?: string) => !!u && /^admin$/i.test(u.trim());

export async function addMunicipalityOfficer(officerData: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: { title: string };
}, dataSource = AppDataSource): Promise<MunicipalityOfficerResponseDTO> {
    if (!officerData.password?.trim()) throw appErr("PASSWORD_REQUIRED", 400);

    // costruzione DAO manuale
    const dao = new MunicipalityOfficer();
    dao.username = officerData.username.trim().toLowerCase();
    dao.email = officerData.email.trim().toLowerCase();
    dao.password = await hashPassword(officerData.password);
    dao.first_name = officerData.first_name;
    dao.last_name = officerData.last_name;

    // eventuale ruolo in creazione: blocca admin/super admin
    if (officerData.role?.title) {
        if (isAdminRole(officerData.role.title)) throw appErr("ROLE_NOT_ASSIGNABLE", 403);
        const role = await roleRepository.findByTitle(officerData.role.title.trim());
        if (!role) throw appErr("ROLE_NOT_FOUND", 404);
        dao.role = role;
    }

    const officerAdded = await municipalityOfficerRepository.add(dao);
    return mapMunicipalityOfficerDAOToResponse(officerAdded);
}

export async function getAllMunicipalityOfficer(): Promise<MunicipalityOfficerResponseDTO[]> {
    // usa la lista "safe" che esclude l'utente admin
    const allOfficerDao = await municipalityOfficerRepository.findAllVisible();
    return allOfficerDao.map(mapMunicipalityOfficerDAOToResponse);
}

// usata dall'endpoint /accounts/assign (retro-compat con adapter)
export async function updateMunicipalityOfficer(officerData: {
    username: string;
    role?: { title: string };
}): Promise<MunicipalityOfficerResponseDTO> {
    const username = officerData.username?.trim().toLowerCase();
    if (!username) throw appErr("USERNAME_REQUIRED", 400);

    // non toccare l'utente admin
    if (isAdminUser(username)) throw appErr("FORBIDDEN_ADMIN_ACCOUNT", 403);

    const existingOfficer = await municipalityOfficerRepository.findByUsername(username);
    if (!existingOfficer) throw appErr("OFFICER_NOT_FOUND", 404);
    if (existingOfficer.role != null) throw appErr("ROLE_ALREADY_ASSIGNED", 409);

    if (!officerData.role?.title) throw appErr("ROLE_TITLE_REQUIRED", 400);
    const roleTitle = officerData.role.title.trim();
    if (isAdminRole(roleTitle)) throw appErr("ROLE_NOT_ASSIGNABLE", 403);

    const role = await roleRepository.findByTitle(roleTitle);
    if (!role) throw appErr("ROLE_NOT_FOUND", 404);

    existingOfficer.role = role;
    const updatedOfficer = await municipalityOfficerRepository.update(existingOfficer);
    return mapMunicipalityOfficerDAOToResponse(updatedOfficer);
}

export async function loginOfficer(loginData: LoginRequestDTO) {
    const username = loginData.username?.trim().toLowerCase();
    const password = loginData.password ?? "";

    if (!username || !password) throw appErr("MISSING_CREDENTIALS", 400);

    const officer = await municipalityOfficerRepository.findByUsername(username);
    const ok = officer && (await verifyPassword(officer.password, password));

    if (!ok) throw appErr("INVALID_CREDENTIALS", 401);

    return mapMunicipalityOfficerDAOToResponse(officer);
}

// NEW: lista ruoli (solo id + title) per UI - solo assegnabili
type RoleListItem = { id: number; title: string };

export async function getAllRoles(): Promise<RoleListItem[]> {
    const roles = await roleRepository.findAssignable(); // <-- esclude admin/super admin
    return roles.map((r) => ({ id: r.id, title: r.title }));
}
