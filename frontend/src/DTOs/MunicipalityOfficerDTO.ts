import {RoleDTO} from "./RoleDTO";

export interface MunicipalityOfficerDTO {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role?: RoleDTO;
}