import {RoleResponseDTO} from "./RoleResponseDTO";

export interface MunicipalityOfficerResponseDTO {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    external: boolean;
    role: string | null;
}