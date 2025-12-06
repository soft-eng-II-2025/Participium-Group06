import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateOfficerRequestDTO {
    @IsNotEmpty()
    username!: string;

    @IsEmail()
    email!: string;

    @MinLength(8)
    password!: string;

    @IsNotEmpty()
    first_name!: string;

    @IsNotEmpty()
    last_name!: string;

    @IsNotEmpty()
    external!: boolean;
}
