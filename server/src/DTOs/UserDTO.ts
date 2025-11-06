import { IsEmail, IsNotEmpty, MinLength } from "class-validator";
import {ReportDTO} from "./ReportDTO";

export class UserDTO {

    @IsNotEmpty()
    username!: string;

    @IsEmail()
    email!: string;

    @MinLength(6)
    password!: string;

    @IsNotEmpty()
    first_name!: string;

    @IsNotEmpty()
    last_name!: string;

    reports!: ReportDTO[];

}

