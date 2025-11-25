import { MunicipalityOfficer } from "../MunicipalityOfficer";
import { StatusType } from "../StatusType";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";
import { CategoryResponseDTO } from "./CategoryResponseDTO";

export class ReportResponseDTO {
    id: number | undefined;
    
    longitude!: number;

    latitude!: number;

    title!: string;

    description!: string;

    user!: UserResponseDTO;

    category!: string;

    status!: string;

    explanation!: string;

    officer!: MunicipalityOfficerResponseDTO;

    photos!: string[];

    createdAt!: Date;
}
