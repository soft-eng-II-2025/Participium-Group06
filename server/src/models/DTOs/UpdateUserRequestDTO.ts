// src/models/DTOs/UpdateUserRequestDTO.ts

import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateUserRequestDTO {
    @IsOptional()
    @IsString()
    telegram_id?: string;

    @IsOptional()
    @IsString()
    photo?: string;

    @IsOptional()
    @IsBoolean()
    flag_email?: boolean;
}
