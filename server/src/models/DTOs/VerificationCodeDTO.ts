import { IsNumber, IsString } from "class-validator";

export class VerificationCodeDTO {

    @IsString()
    username?: string;

    @IsString()
    code?: string;
}
