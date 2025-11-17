import { MunicipalityOfficer } from "../MunicipalityOfficer";
import { StatusType } from "../StatusType";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";

export class ReportResponseDTO {
    longitude!: number;

    latitude!: number;

    title!: string;

    description!: string;

    userId!: number;

    categoryId!: number;

    status!: StatusType;

    explanation!: string;

    officer!: MunicipalityOfficerResponseDTO;

    photos!: string[];
}
