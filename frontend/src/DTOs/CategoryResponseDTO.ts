import {ReportResponseDTO} from "./ReportResponseDTO";


export interface CategoryResponseDTO {
    id: number;
    name: string;
    reports?: ReportResponseDTO[];
    reportsCount?: number;
}

