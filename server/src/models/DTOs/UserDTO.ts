import { IsEmail, IsNotEmpty, IsNumber, MinLength } from "class-validator";
import {ReportDTO} from "./ReportDTO";

export class UserDTO {

    userId!: number;

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

