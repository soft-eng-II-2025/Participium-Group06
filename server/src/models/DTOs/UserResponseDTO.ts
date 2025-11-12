import { IsEmail, IsNotEmpty } from "class-validator";
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

    reports!: ReportResponseDTO[];
}
