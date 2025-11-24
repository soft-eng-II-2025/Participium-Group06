import { IsNotEmpty } from "class-validator";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";

export class MessageDTO {
    report_id!: number;
    //municipality_officer!: MunicipalityOfficerResponseDTO;
    //user!: UserResponseDTO;
    @IsNotEmpty() 
    content!: string;
    created_at!: Date;
    @IsNotEmpty()
    sender!: 'USER' | 'OFFICER';
}