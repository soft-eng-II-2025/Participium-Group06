import { IsBoolean, IsNotEmpty } from "class-validator";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "./UserResponseDTO";
import { NotificationType } from "../NotificationType";

export class NotificationDTO {
    user!: UserResponseDTO;
    @IsNotEmpty() 
    content!: string;
    type!: NotificationType;
    @IsBoolean() 
    is_read!: boolean;
    created_at!: Date;
}