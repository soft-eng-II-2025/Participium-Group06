import { IsNumber, IsString } from "class-validator";

export class VerificationCodeDTO {

    @IsString()
    username?: string;

    @IsNumber()
    code?: number;
}
