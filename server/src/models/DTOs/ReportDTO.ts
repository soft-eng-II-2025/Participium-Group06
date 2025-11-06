import {ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, Length, Max, Min} from "class-validator";
import {UserDTO} from "./UserDTO";

export class ReportDTO {

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

    user!: UserDTO;


    categoryId!: number;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    @IsString({ each: true })
    photos!: string[];
}