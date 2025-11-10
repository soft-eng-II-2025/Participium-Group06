import { map } from "zod";
import { MunicipalityOfficerDTO } from "../models/DTOs/MunicipalityOfficerDTO";
import { MunicipalityOfficerRepository } from "../repositories/MunicipalityOfficerRepository";
import {mapMunicipalityOfficerDAOToDTO, mapMunicipalityOfficerDTOToDAO} from "../services/mapperService";
import {RoleRepository} from "../repositories/RoleRepository";
import { LoginDTO } from "../models/DTOs/LoginDTO";
import { verifyPassword,hashPassword } from "../services/passwordService";

const municipalityOfficerRepository = new MunicipalityOfficerRepository(); // Placeholder for the actual repository
const roleRepository = new RoleRepository();

export async function addMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficerDTO> {
    if (officerData.password == null || officerData.password == undefined) {
        throw new Error("Password is required");
    }
    else{officerData.password = await hashPassword(officerData.password);
    const officerAdded = await municipalityOfficerRepository.add(mapMunicipalityOfficerDTOToDAO(officerData));
    return mapMunicipalityOfficerDAOToDTO(officerAdded);
}}

export async function getAllMunicipalityOfficer(): Promise<MunicipalityOfficerDTO[]> {
    const allOfficerDao = await municipalityOfficerRepository.findAll();
    const allOfficerDto = allOfficerDao.map(mapMunicipalityOfficerDAOToDTO);
    return allOfficerDto;
}

export async function updateMunicipalityOfficer(officerData: MunicipalityOfficerDTO): Promise<MunicipalityOfficerDTO> {
    const existingOfficer = await municipalityOfficerRepository.findByusername(officerData.username);
    console.log(`updateMunicipalityOfficer: existingOfficer =>role:${existingOfficer?.role} id: ${existingOfficer?.role?.id}`);
    if (!existingOfficer) {
        throw new Error("Municipality OfficerDTO doesn't exist");
    }
    if (existingOfficer.role != null ) {
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

export async function login(loginData: LoginDTO): Promise<MunicipalityOfficerDTO> {
  // Adjust lookup method names to your repository (by email or username)
  const MunicipalityOfficerDAO = (await municipalityOfficerRepository.findByusername(loginData.username));

  if (!MunicipalityOfficerDAO) { 
    const e = new Error("Officer not found");
    e.name = "OFFICER_NOT_FOUND";
    throw e;
  }

  if (loginData.password == null || loginData.password == undefined) {
    const e = new Error("Password is required");
    e.name = "PASSWORD_REQUIRED";
    throw e;
  }

  const ok = await verifyPassword(MunicipalityOfficerDAO.password, loginData.password);
  if (!ok) {
    const e = new Error("Wrong password");
    e.name = "WRONG_PASSWORD";
    throw e;
  }

  return mapMunicipalityOfficerDAOToDTO(MunicipalityOfficerDAO); // safe: mapper will not expose the hash
}