import { IsNotEmpty } from "class-validator";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";

export class MessageDTO {
    @IsNotEmpty() 
    content!: string;
    created_at!: Date;
    @IsNotEmpty()
    sender!: 'USER' | 'OFFICER';
}