import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import {MunicipalityOfficerDTO} from "./MunicipalityOfficerDTO";

export class RoleDTO {
    @IsNotEmpty()
    title!: string;
    officers!: MunicipalityOfficerDTO[];
}