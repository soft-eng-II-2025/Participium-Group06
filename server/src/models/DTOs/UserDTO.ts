import { IsEmail, IsNotEmpty, IsNumber, MinLength } from "class-validator";
import {ReportDTO} from "./ReportDTO";

export class UserDTO {

    userId!: number;

    @IsNotEmpty()
    username!: string;

    @IsEmail()
    email!: string;

    // password should not be validated here (output DTO). make it optional/null.
    password?: string | null;

    @IsNotEmpty()
    first_name!: string;

    @IsNotEmpty()
    last_name!: string;

    reports!: ReportDTO[];

}

