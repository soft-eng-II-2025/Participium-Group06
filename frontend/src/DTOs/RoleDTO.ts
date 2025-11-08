import {MunicipalityOfficerDTO} from "./MunicipalityOfficerDTO";

export interface RoleDTO {
    title: string;
    officers: MunicipalityOfficerDTO[];
}