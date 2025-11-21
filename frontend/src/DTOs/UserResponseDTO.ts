import {ReportDTO} from "./ReportDTO";

export interface UserResponseDTO {
    userId?: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    reports?: ReportDTO[];
    photo?: string;
    telegram_id?: string;
    flag_email?: boolean;
}
