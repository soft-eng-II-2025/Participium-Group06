import {CreateReportDTO} from "./CreateReportDTO";

export interface UserResponseDTO {
    userId?: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    reports?: CreateReportDTO[];
}
