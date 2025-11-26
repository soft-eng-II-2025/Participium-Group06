import { IsNotEmpty } from "class-validator";

export class CreateMessageDTO {
    @IsNotEmpty() 
    content!: string;
    @IsNotEmpty()
    sender!: 'USER' | 'OFFICER';
}