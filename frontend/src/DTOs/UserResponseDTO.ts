import {ReportResponseDTO} from "./ReportResponseDTO";

export interface UserResponseDTO {
    userId?: number;
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    reports: ReportResponseDTO[];
}
