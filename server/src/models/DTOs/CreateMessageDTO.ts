import { IsNotEmpty } from "class-validator";
import { SenderType } from "../SenderType";

export class CreateMessageDTO {
    @IsNotEmpty() 
    content!: string;
    @IsNotEmpty()
    sender!: SenderType;
}