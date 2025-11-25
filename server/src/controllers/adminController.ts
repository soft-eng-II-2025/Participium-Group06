// src/controllers/adminController.ts
import { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import { MunicipalityOfficerRepository } from "../repositories/MunicipalityOfficerRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { LoginRequestDTO } from "../models/DTOs/LoginRequestDTO";
import { verifyPassword, hashPassword } from "../services/passwordService";
import { mapMunicipalityOfficerDAOToDTO as mapMunicipalityOfficerDAOToResponse, mapReportDAOToDTO as mapReportDAOToResponse } from "../services/mapperService";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { AppDataSource } from "../data-source";
import {AssignRoleRequestDTO} from "../models/DTOs/AssignRoleRequestDTO";
import {CreateUserRequestDTO} from "../models/DTOs/CreateUserRequestDTO";
import { DataSource } from "typeorm";
import { get } from "http";
import { updateReportOfficer,getReportsByCategoryIdAndStatus } from "./reportController";
import { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import { StatusType } from "../models/StatusType";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { ReportRepository } from "../repositories/ReportRepository";

/*const municipalityOfficerRepository = new MunicipalityOfficerRepository(AppDataSource);
const roleRepository = new RoleRepository(AppDataSource);*/

let municipalityOfficerRepository: MunicipalityOfficerRepository;
let roleRepository: RoleRepository;
let categoryRepository: CategoryRepository;
let reportRepository: ReportRepository;

export function initializeAdminRepositories(dataSource: DataSource) {
    municipalityOfficerRepository = new MunicipalityOfficerRepository(dataSource);
    roleRepository = new RoleRepository(dataSource);
    categoryRepository = new CategoryRepository(dataSource);
    reportRepository = new ReportRepository(dataSource);
}

function appErr(code: string, status = 400) {
    const e: any = new Error(code);
    e.status = status;
    return e;
}

// helpers per bloccare admin user/role
const isAdminRole = (t?: string) => !!t && /^(admin|super\s*admin)$/i.test(t.trim());
const isAdminUser = (u?: string) => !!u && /^admin$/i.test(u.trim());

export async function addMunicipalityOfficer(officerData: CreateUserRequestDTO, dataSource = AppDataSource): Promise<MunicipalityOfficerResponseDTO> {
    if (!officerData.password?.trim()) throw appErr("PASSWORD_REQUIRED", 400);

    // costruzione DAO manuale
    const dao = new MunicipalityOfficer();
    dao.username = officerData.username;
    dao.email = officerData.email.toLowerCase();
    dao.password = await hashPassword(officerData.password);
    dao.first_name = officerData.first_name;
    dao.last_name = officerData.last_name;


    const officerAdded = await municipalityOfficerRepository.add(dao);
    return mapMunicipalityOfficerDAOToResponse(officerAdded);
}

export async function getAllMunicipalityOfficer(): Promise<MunicipalityOfficerResponseDTO[]> {
    // usa la lista "safe" che esclude l'utente admin
    const allOfficerDao = await municipalityOfficerRepository.findAllVisible();
    return allOfficerDao.map(mapMunicipalityOfficerDAOToResponse);
}

// usata dall'endpoint /accounts/assign (retro-compat con adapter)
export async function updateMunicipalityOfficer(officerData: AssignRoleRequestDTO): Promise<MunicipalityOfficerResponseDTO> {
    const username = officerData.username?.trim();
    if (!username) throw appErr("USERNAME_REQUIRED", 400);

    // non toccare l'utente admin
    if (isAdminUser(username)) throw appErr("FORBIDDEN_ADMIN_ACCOUNT", 403);

    const existingOfficer = await municipalityOfficerRepository.findByUsername(username);
    if (!existingOfficer) throw appErr("OFFICER_NOT_FOUND", 404);
    if (existingOfficer.role != null) throw appErr("ROLE_ALREADY_ASSIGNED", 409);

    if (!officerData.roleTitle) throw appErr("ROLE_TITLE_REQUIRED", 400);
    const roleTitle = officerData.roleTitle;
    if (isAdminRole(roleTitle)) throw appErr("ROLE_NOT_ASSIGNABLE", 403);

    const role = await roleRepository.findByTitle(roleTitle);
    if (!role) throw appErr("ROLE_NOT_FOUND", 404);

    existingOfficer.role = role;
    const updatedOfficer = await municipalityOfficerRepository.update(existingOfficer);
    return mapMunicipalityOfficerDAOToResponse(updatedOfficer);
}

export async function loginOfficer(loginData: LoginRequestDTO) {
    const username = loginData.username;
    const password = loginData.password;

    if (!username || !password) throw appErr("MISSING_CREDENTIALS", 400);

    const officer = await municipalityOfficerRepository.findByUsername(username);
    const ok = officer && (await verifyPassword(officer.password, password));

    if (!ok) throw appErr("INVALID_CREDENTIALS", 401);

    return mapMunicipalityOfficerDAOToResponse(officer);
}

// NEW: lista ruoli (solo id + title + label) per UI - solo assegnabili
type RoleListItem = { id: number; title: string, label: string };

export async function getAllRoles(): Promise<RoleListItem[]> {
    const roles = await roleRepository.findAssignable(); // <-- esclude admin/super admin
    return roles.map((r) => ({ id: r.id, title: r.title, label: r.label }));
}

export async function getMunicipalityOfficerByUsername(username: string): Promise<MunicipalityOfficerResponseDTO> {
    const officer = await municipalityOfficerRepository.findByUsername(username);
    if (!officer) throw appErr("OFFICER_NOT_FOUND", 404);
    return mapMunicipalityOfficerDAOToResponse(officer);
}

export async function getMunicipalityOfficerDAOForNewRequest () : Promise<MunicipalityOfficer> {
    return municipalityOfficerRepository.findByRoleTitle("ORGANIZATION_OFFICER").then(officers => {
        if (officers.length === 0) {
            throw appErr("NO_OFFICER_AVAILABLE", 404);
        }
        return officers[0]; // Only one Organization Officer is expected
    });
}

export async function getMunicipalityOfficerDAOByUsername(username: string): Promise<MunicipalityOfficer> {
    const officer = await municipalityOfficerRepository.findByUsername(username);
    if (!officer) throw appErr("OFFICER_NOT_FOUND", 404);
    return officer;
}

export async function assignTechAgent(reportId:number, officerUsername:string):Promise<ReportResponseDTO> {
    const officer = await municipalityOfficerRepository.findByUsername(officerUsername);
    if (!officer) throw appErr("OFFICER_NOT_FOUND", 404);
    return updateReportOfficer(reportId, officer);
}

export async function getAgentsByTechLeadUsername(techLeadUsername :string):Promise<MunicipalityOfficerResponseDTO[]> {
    const officerTitle = (await municipalityOfficerRepository.findByUsername(techLeadUsername))?.role?.title;
    if (!officerTitle) {
        throw appErr("OFFICER_NOT_FOUND", 404);
    }
    if (officerTitle.slice(0,9) != "TECH_LEAD") {
        throw appErr("INVALID_TECH_LEAD_LABEL", 400);
    }
    const tech_agent_title= "TECH_AGENT"+officerTitle.slice(9,officerTitle.length);
    const tech_agents = await municipalityOfficerRepository.findByRoleTitle(tech_agent_title);
    return tech_agents.map(mapMunicipalityOfficerDAOToResponse);
}

export async function getTechReports(officerUsername :string):Promise<ReportResponseDTO[]> {
    const officer = await municipalityOfficerRepository.findByusername(officerUsername);
    if (!officer) {
        throw appErr("OFFICER_NOT_FOUND", 404);
    }
    const reports = await reportRepository.findByOfficer(officer);
    
    return reports.map(mapReportDAOToResponse);
}

export async function getTechLeadReports(username :string):Promise<ReportResponseDTO[]> {
    const officer = await municipalityOfficerRepository.findByUsername(username);
    if (!officer) {
        throw appErr("OFFICER_NOT_FOUND", 404);
    }
    let reports: ReportResponseDTO[] = [];
    const categories = await categoryRepository.findByRoleId(officer.role!.id);
    for (const category of categories) {
        const status = [StatusType.Assigned,StatusType.InProgress,StatusType.Resolved,StatusType.Rejected,StatusType.Suspended];
        const categoryReports = await getReportsByCategoryIdAndStatus(category.id, status);
        reports = reports.concat(categoryReports);
    }
    return reports;
}

export async function getOfficerById(OfficerId: number): Promise<MunicipalityOfficerResponseDTO> {
    const officer = await municipalityOfficerRepository.findById(OfficerId);
    if (!officer) throw appErr("OFFICER_NOT_FOUND", 404);
    return mapMunicipalityOfficerDAOToResponse(officer);
}

export async function getOfficerIdByEmail(username: string): Promise<number> {
    const officer = await municipalityOfficerRepository.findByEmail(username);
    if (!officer) throw appErr("OFFICER_NOT_FOUND", 404);
    return officer.id;
}
export async function getOfficerIdByUsername(username: string): Promise<number> {
    const officer = await municipalityOfficerRepository.findByUsername(username);
    if (!officer) throw appErr("OFFICER_NOT_FOUND", 404);
    return officer.id;
}