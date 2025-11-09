// src/controllers/adminController.ts
import { MunicipalityOfficerDTO } from "../models/DTOs/MunicipalityOfficerDTO";
import { MunicipalityOfficerRepository } from "../repositories/MunicipalityOfficerRepository";
import { mapMunicipalityOfficerDAOToDTO, mapMunicipalityOfficerDTOToDAO } from "../services/mapperService";
import { RoleRepository } from "../repositories/RoleRepository";

const municipalityOfficerRepository = new MunicipalityOfficerRepository();
const roleRepository = new RoleRepository();

export async function addMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficerDTO> {
    const officerAdded = await municipalityOfficerRepository.add(mapMunicipalityOfficerDTOToDAO(officerData));
    return mapMunicipalityOfficerDAOToDTO(officerAdded);
}

export async function getAllMunicipalityOfficer(): Promise<MunicipalityOfficerDTO[]> {
    const allOfficerDao = await municipalityOfficerRepository.findAll();
    return allOfficerDao.map(mapMunicipalityOfficerDAOToDTO);
}

export async function updateMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficerDTO> {
    const existingOfficer = await municipalityOfficerRepository.findByusername(officerData.username);
    if (!existingOfficer) {
        throw new Error("Municipality Officer doesn't exist");
    }
    if (existingOfficer.role != null) {
        throw new Error("Municipality Officer already has a role assigned");
    }

    const officerDao = mapMunicipalityOfficerDTOToDAO(officerData);
    officerDao.id = existingOfficer.id;

    if (!officerData.role) {
        throw new Error("The role cannot be null");
    }
    const role = await roleRepository.findByTitle(officerData.role.title);
    if (!role) throw new Error("Role not found");

    officerDao.role = role;

    const updatedOfficer = await municipalityOfficerRepository.update(officerDao);
    return mapMunicipalityOfficerDAOToDTO(updatedOfficer);
}

// NEW: lista ruoli (solo id + title)
type RoleListItem = { id: number; title: string };

export async function getAllRoles(): Promise<RoleListItem[]> {
    const roles = await roleRepository.findAll();
    return roles.map(r => ({ id: r.id, title: r.title }));
}
