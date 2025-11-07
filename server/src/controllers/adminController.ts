import { map } from "zod";
import { MunicipalityOfficerDTO } from "../models/DTOs/MunicipalityOfficerDTO";
import { MunicipalityOfficerRepository } from "../repositories/MunicipalityOfficerRepository";
import {mapMunicipalityOfficerDAOToDTO, mapMunicipalityOfficerDTOToDAO} from "../services/mapperService";
import {RoleRepository} from "../repositories/RoleRepository";
const municipalityOfficerRepository = new MunicipalityOfficerRepository(); // Placeholder for the actual repository
const roleRepository = new RoleRepository();
export async function addMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficerDTO> {
    const officerAdded = await municipalityOfficerRepository.add(mapMunicipalityOfficerDTOToDAO(officerData));
    return mapMunicipalityOfficerDAOToDTO(officerAdded);
}

export async function getAllMunicipalityOfficer(): Promise<MunicipalityOfficerDTO[]> {
    const allOfficerDao = await municipalityOfficerRepository.findAll();
    const allOfficerDto = allOfficerDao.map(mapMunicipalityOfficerDAOToDTO);
    return allOfficerDto;
}

export async function updateMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficerDTO> {
    const existingOfficer = await municipalityOfficerRepository.findByusername(officerData.username);
    if (!existingOfficer) {
        throw new Error("Municipality OfficerDTO doesn't exist");
    }
    if (existingOfficer.role?.id != null) {
        throw new Error("Municipality Officer already has a role assigned");
    }
    const officerDao = mapMunicipalityOfficerDTOToDAO(officerData)
    officerDao.id = existingOfficer.id;


    if (officerData.role) {
        const role = await roleRepository.findByTitle(officerData.role.title);
        if (!role) throw new Error("Role not found");
        officerDao.role = role;
    } else {
        throw new Error("The role cannot be null");
    }
    const updatedOfficer =  await municipalityOfficerRepository.update(officerDao);
    return mapMunicipalityOfficerDAOToDTO(updatedOfficer);
}