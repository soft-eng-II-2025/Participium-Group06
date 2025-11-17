import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from "class-validator";
import { StatusType } from "../StatusType";
import { MunicipalityOfficerResponseDTO } from "./MunicipalityOfficerResponseDTO";
import { Type } from "class-transformer";

export class CreateReportRequestDTO {

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude!: number;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude!: number;

    @IsNotEmpty()
    title!: string;

    @IsNotEmpty()
    description!: string;

    @IsNumber()
    userId!: number;

    @IsNumber() categoryId!: number;
    @IsOptional()
    @ValidateNested()
    @Type(() => MunicipalityOfficerResponseDTO)
    officer?: MunicipalityOfficerResponseDTO;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    @IsString({ each: true })
    photos!: string[];

}
