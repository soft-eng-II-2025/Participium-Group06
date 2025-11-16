import type { CategoryResponseDTO } from "../models/DTOs/CategoryResponseDTO";
import type { MunicipalityOfficerResponseDTO } from "../models/DTOs/MunicipalityOfficerResponseDTO";
import type { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import type { RoleResponseDTO } from "../models/DTOs/RoleResponseDTO";
import type { UserResponseDTO } from "../models/DTOs/UserResponseDTO";

import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";

import { Category } from "../models/Category";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Report } from "../models/Report";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { ReportPhoto } from "../models/ReportPhoto";
import { StatusType } from "../models/StatusType";
import { get } from "http";

/* Helper */
function removeNullAttributes<T extends Record<string, any>>(dto: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(dto).filter(
            ([, value]) =>
                value !== null &&
                value !== undefined &&
                (!Array.isArray(value) || value.length > 0)
        )
    ) as Partial<T>;
}

/* ----------- DTO constructors (Response) ----------- */

export function createCategoryDTO(name?: string, reports?: ReportResponseDTO[]): CategoryResponseDTO {
    return removeNullAttributes({ name, reports }) as CategoryResponseDTO;
}

export function createMunicipalityOfficerDTO(
    username?: string,
    email?: string,
    password?: string | null,
    first_name?: string,
    last_name?: string,
    role?: RoleResponseDTO
): MunicipalityOfficerResponseDTO {
    return removeNullAttributes({
        username,
        email,
        password,
        first_name,
        last_name,
        role,
    }) as MunicipalityOfficerResponseDTO;
}

export function createReportDTO(
    longitude?: number,
    latitude?: number,
    title?: string,
    description?: string,
    userId?: number,
    categoryId?: number,
    status?: StatusType,
    explanation?: string,
    officer?: MunicipalityOfficerResponseDTO,
    photos?: string[]
): ReportResponseDTO {
    return removeNullAttributes({
        longitude,
        latitude,
        title,
        description,
        userId,
        categoryId,
        photos,
    }) as ReportResponseDTO;
}

export function createRoleDTO(title?: string, officers?: MunicipalityOfficerResponseDTO[]): RoleResponseDTO {
    return removeNullAttributes({ title, officers }) as RoleResponseDTO;
}

export function createUserDTO(
    username?: string,
    email?: string,
    password?: string | null,
    first_name?: string,
    last_name?: string,
    photo?: string | null,
    telegram_id?: string | null,
    flag_email?: boolean,
    reports?: ReportResponseDTO[]
): UserResponseDTO {
    return removeNullAttributes({
        username,
        email,
        password,
        first_name,
        last_name,
        photo,
        telegram_id,
        flag_email,
        reports,
    }) as UserResponseDTO;
}

/* ----------- DAO -> Response mappers ----------- */

export function mapCategoryDAOToDTO(categoryDAO: Category): CategoryResponseDTO {
    const dto: CategoryResponseDTO = {
        id: categoryDAO.id,
        name: categoryDAO.name,
    };

    // Se la relazione 'reports' è caricata, popola anche l'array e il conteggio
    /*if (Array.isArray(categoryDAO.reports)) {
        dto.reports = categoryDAO.reports.map((r: Report) => mapReportDAOToDTO(r));
        dto.reportsCount = categoryDAO.reports.length; // opzionale
    }*/

    return dto;
}

export function mapMunicipalityOfficerDAOToDTO(officerDAO: MunicipalityOfficer): MunicipalityOfficerResponseDTO {
    return createMunicipalityOfficerDTO(
        officerDAO.username,
        officerDAO.email,
        null,
        officerDAO.first_name,
        officerDAO.last_name,
        officerDAO.role ? mapRoleDAOToDTO(officerDAO.role) : undefined
    );
}

export function mapReportDAOToDTO(reportDAO: Report): ReportResponseDTO {
    return createReportDTO(
        reportDAO.longitude,
        reportDAO.latitude,
        reportDAO.title,
        reportDAO.description,
        reportDAO.user?.id,
        reportDAO.category?.id,
        reportDAO.status,
        reportDAO.explanation,
        reportDAO.officer ? mapMunicipalityOfficerDAOToDTO(reportDAO.officer) : undefined,
        reportDAO.photos?.map((p: ReportPhoto) => p.photo)
    );
}

export function mapRoleDAOToDTO(roleDAO: Role): RoleResponseDTO {
    return createRoleDTO(
        roleDAO.title,
        roleDAO.municipalityOfficer?.map((o: MunicipalityOfficer) => mapMunicipalityOfficerDAOToDTO(o))
    );
}

export function mapUserDAOToDTO(userDAO: User): UserResponseDTO {
    return createUserDTO(
        userDAO.username,
        userDAO.email,
        null,
        userDAO.first_name,
        userDAO.last_name,
        userDAO.photo,
        userDAO.telegram_id,
        userDAO.flag_email,
        userDAO.reports?.map((r: Report) => mapReportDAOToDTO(r))
    );
}

/* ----------- Request -> DAO mappers ----------- */

// Nuovo: mappa CreateReportRequest -> Report (DAO)
export function mapCreateReportRequestToDAO(dto: CreateReportRequestDTO): Report {
    const dao = new Report();
    dao.longitude = dto.longitude;
    dao.latitude = dto.latitude;
    dao.title = dto.title;
    dao.description = dto.description;

    dao.user = new User();
    dao.user.id = dto.userId;
    dao.status = StatusType.PendingApproval;
    dao.officer = undefined; // verrà assegnato successivamente
    dao.explanation = "";
    dao.category = new Category();
    dao.category.id = dto.categoryId;

    return dao;
}
