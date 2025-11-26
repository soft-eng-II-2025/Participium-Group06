import { IsEmail, IsNotEmpty } from "class-validator";
import { RoleResponseDTO } from "./RoleResponseDTO";

export class MunicipalityOfficerResponseDTO {
    id!: number;

    @IsNotEmpty() username!: string;

    @IsEmail() email!: string;

    @IsNotEmpty() first_name!: string;

    @IsNotEmpty() last_name!: string;

    role: string | null = null;
}
