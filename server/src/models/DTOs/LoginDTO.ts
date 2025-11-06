import { IsNotEmpty, MinLength } from "class-validator";

export class LoginDTO {

    @IsNotEmpty()
    username!: string;

    @MinLength(6)
    password!: string;

}
