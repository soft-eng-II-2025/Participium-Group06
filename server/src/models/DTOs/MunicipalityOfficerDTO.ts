import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import {RoleDTO} from "./RoleDTO";

export class MunicipalityOfficerDTO {

    @IsNotEmpty()
    username!: string;

    @IsEmail()
    email!: string;

    @MinLength(6)
    password!: string;

    @IsNotEmpty()
    first_name!: string;

    @IsNotEmpty()
    last_name!: string;

    role?: RoleDTO;

}

