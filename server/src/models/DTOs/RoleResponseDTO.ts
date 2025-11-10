import { IsNotEmpty } from "class-validator";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";

export class RoleResponseDTO {
    @IsNotEmpty() title!: string;
    officers!: MunicipalityOfficerResponseDTO[];
}
