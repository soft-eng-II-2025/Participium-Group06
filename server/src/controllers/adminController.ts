import { map } from "zod";
import { MunicipalityOfficerDTO } from "../models/DTOs/MunicipalityOfficerDTO";
import { MunicipalityOfficerRepository } from "../repositories/MunicipalityOfficerRepository";
import { mapMunicipalityOfficerDTOToDAO } from "../services/mapperService";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
const municipalityOfficerRepository = new MunicipalityOfficerRepository(); // Placeholder for the actual repository
export async function addMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficerDTO> {
    municipalityOfficerRepository.add(mapMunicipalityOfficerDTOToDAO(officerData));
    return officerData;
}

export async function getAllMunicipalityOfficer(): Promise<MunicipalityOfficer[]> {
    return municipalityOfficerRepository.findAll();
}

export async function updateMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficer> {
    return municipalityOfficerRepository.update(mapMunicipalityOfficerDTOToDAO(officerData));
}