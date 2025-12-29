import {IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateIf} from "class-validator";
export class AssignRoleRequestDTO {

    @IsNotEmpty() username!: string;

    @IsNotEmpty() rolesTitle!: string[];

    @IsBoolean()
    external!: boolean;

    // Validazione Condizionale per companyName:
    // 1. Se external è TRUE, allora companyName NON può essere null/vuoto
    // 2. Se external è FALSE, il campo viene ignorato dalla validazione
    @IsString()
    @IsOptional()
    @ValidateIf(o => o.external === true)
    @IsNotEmpty({ message: 'companyName is required when external is true' })
    companyName!: string | null;

}
