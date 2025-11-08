import type { CategoryDTO } from "../models/DTOs/CategoryDTO";
import type { MunicipalityOfficerDTO } from "../models/DTOs/MunicipalityOfficerDTO";
import type { ReportDTO } from "../models/DTOs/ReportDTO";
import type { RoleDTO } from "../models/DTOs/RoleDTO";
import type { UserDTO } from "../models/DTOs/UserDTO";

import { Category } from "../models/Category";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Report } from "../models/Report";
import { Role } from "../models/Role";
import { User } from "../models/User";
import { ReportPhoto } from "../models/ReportPhoto";

/* -------------------------------------------------------------------------- */
/*                              Helper Function                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                              DTO Constructors                              */
/* -------------------------------------------------------------------------- */

export function createCategoryDTO(
  name?: string,
  reports?: ReportDTO[]
): CategoryDTO {
  return removeNullAttributes({ name, reports }) as CategoryDTO;
}

export function createMunicipalityOfficerDTO(
  username?: string,
  email?: string,
  password?: string | null,
  first_name?: string,
  last_name?: string,
  role?: RoleDTO
): MunicipalityOfficerDTO {
  return removeNullAttributes({
    username,
    email,
    password,
    first_name,
    last_name,
    role,
  }) as MunicipalityOfficerDTO;
}

export function createReportDTO(
  longitude?: number,
  latitude?: number,
  title?: string,
  description?: string,
  userId?: number,
  categoryId?: number,
  photos?: string[]
): ReportDTO {
  return removeNullAttributes({
    longitude,
    latitude,
    title,
    description,
    userId,
    categoryId,
    photos,
  }) as ReportDTO;
}

export function createRoleDTO(
  title?: string,
  officers?: MunicipalityOfficerDTO[]
): RoleDTO {
  return removeNullAttributes({ title, officers }) as RoleDTO;
}

export function createUserDTO(
  username?: string,
  email?: string,
  password?: string | null,
  first_name?: string,
  last_name?: string,
  reports?: ReportDTO[]
): UserDTO {
  return removeNullAttributes({
    username,
    email,
    password,
    first_name,
    last_name,
    reports,
  }) as UserDTO;
}

/* -------------------------------------------------------------------------- */
/*                             DAO → DTO Mappers                              */
/* -------------------------------------------------------------------------- */

export function mapCategoryDAOToDTO(categoryDAO: Category): CategoryDTO {
  return createCategoryDTO(
    categoryDAO.name,
    categoryDAO.reports?.map((r: Report) => mapReportDAOToDTO(r))
  );
}

export function mapMunicipalityOfficerDAOToDTO(officerDAO: MunicipalityOfficer): MunicipalityOfficerDTO {
  return createMunicipalityOfficerDTO(
    officerDAO.username,
    officerDAO.email,
    null, // do not expose password
    officerDAO.first_name,
    officerDAO.last_name,
    officerDAO.role ? mapRoleDAOToDTO(officerDAO.role) : undefined
  );
}

export function mapReportDAOToDTO(reportDAO: Report): ReportDTO {
  return createReportDTO(
    reportDAO.longitude,
    reportDAO.latitude,
    reportDAO.title,
    reportDAO.description,
    reportDAO.user?.id,
    reportDAO.category?.id,
    reportDAO.photos?.map((p: ReportPhoto) => p.photo)
  );
}

export function mapRoleDAOToDTO(roleDAO: Role): RoleDTO {
  return createRoleDTO(
    roleDAO.title,
    roleDAO.municipalityOfficer?.map((o: MunicipalityOfficer) => mapMunicipalityOfficerDAOToDTO(o))
  );
}

export function mapUserDAOToDTO(userDAO: User): UserDTO {
  return createUserDTO(
    userDAO.username,
    userDAO.email,
    null, // do not expose password
    userDAO.first_name,
    userDAO.last_name,
    userDAO.reports?.map((r: Report) => mapReportDAOToDTO(r))
  );
}

/* -------------------------------------------------------------------------- */
/*                             DTO → DAO Mappers                              */
/* -------------------------------------------------------------------------- */

export function mapCategoryDTOToDAO(dto: CategoryDTO): Category {
  const dao = new Category();
  if (dto.name !== undefined) dao.name = dto.name;
  if (dto.reports && dto.reports.length > 0) {
    dao.reports = dto.reports.map((r: ReportDTO) => mapReportDTOToDAO(r));
  }
  return dao;
}

export function mapMunicipalityOfficerDTOToDAO(dto: MunicipalityOfficerDTO): MunicipalityOfficer {
  const dao = new MunicipalityOfficer();
  if (dto.username !== undefined) dao.username = dto.username;
  if (dto.email !== undefined) dao.email = dto.email;
  if (dto.password !== null && dto.password != undefined) dao.password = dto.password;
  if (dto.first_name !== undefined) dao.first_name = dto.first_name;
  if (dto.last_name !== undefined) dao.last_name = dto.last_name;
  if (dto.role !== undefined) {
    dao.role = mapRoleDTOToDAO(dto.role);
  }
  return dao;
}

export function mapReportDTOToDAO(dto: ReportDTO): Report {
  const dao = new Report();
  if (dto.longitude !== undefined) dao.longitude = dto.longitude;
  if (dto.latitude !== undefined) dao.latitude = dto.latitude;
  if (dto.title !== undefined) dao.title = dto.title;
  if (dto.description !== undefined) dao.description = dto.description;
  if (dto.user !== undefined) {
    dao.user = new User();
    dao.user.id = dto.user.userId;
  }
  if (dto.categoryId !== undefined) {
    dao.category = new Category();
    dao.category.id = dto.categoryId;
  }
  // photos handled separately, likely via relation
  return dao;
}

export function mapRoleDTOToDAO(dto: RoleDTO): Role {
  const dao = new Role();
  if (dto.title !== undefined) dao.title = dto.title;
  if (dto.officers && dto.officers.length > 0) {
    dao.municipalityOfficer = dto.officers.map((o: MunicipalityOfficerDTO) =>
      mapMunicipalityOfficerDTOToDAO(o)
    );
  }
  return dao;
}

export function mapUserDTOToDAO(dto: UserDTO): User {
  const dao = new User();
  if (dto.username !== undefined) dao.username = dto.username;
  if (dto.email !== undefined) dao.email = dto.email;
  if (dto.password !== null && dto.password !== undefined) dao.password = dto.password;
  if (dto.first_name !== undefined) dao.first_name = dto.first_name;
  if (dto.last_name !== undefined) dao.last_name = dto.last_name;
  if (dto.reports && dto.reports.length > 0) {
    dao.reports = dto.reports.map((r: ReportDTO) => mapReportDTOToDAO(r));
  }
  return dao;
}
