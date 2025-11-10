import { IsNotEmpty } from "class-validator";
export class AssignRoleRequestDTO {

    @IsNotEmpty() username!: string;

    @IsNotEmpty() roleTitle!: string;

}
