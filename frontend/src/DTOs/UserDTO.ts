import {ReportDTO} from "./ReportDTO";

export interface UserDTO {
    userId: number;
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    reports: ReportDTO[];
}