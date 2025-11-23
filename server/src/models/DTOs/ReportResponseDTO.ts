import { MunicipalityOfficer } from "../MunicipalityOfficer";
import { StatusType } from "../StatusType";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";

export class ReportResponseDTO {
    id!: number;

    longitude!: number;

    latitude!: number;

    title!: string;

    description!: string;

    user!: UserResponseDTO;

    categoryId!: number;

    status!: string;

    explanation!: string;

    officer!: MunicipalityOfficerResponseDTO;

    photos!: string[];

    createdAt!: Date;
}
