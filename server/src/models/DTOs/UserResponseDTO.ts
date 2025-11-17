import { IsBoolean, IsEmail, IsNotEmpty } from "class-validator";
import { ReportResponseDTO } from "./ReportResponseDTO";

export class UserResponseDTO {
    userId!: number;

    @IsNotEmpty()
    username!: string;

    @IsEmail()
    email!: string;

    @IsNotEmpty()
    first_name!: string;

    @IsNotEmpty()
    last_name!: string;

    photo!: string | null;

    telegram_id!: string | null;

    @IsBoolean() flag_email!: boolean;

    reports!: ReportResponseDTO[];
}
