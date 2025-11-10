import { IsNotEmpty, MinLength } from "class-validator";

export class LoginRequestDTO {
    @IsNotEmpty() username!: string;
    @MinLength(6) password!: string;
}
