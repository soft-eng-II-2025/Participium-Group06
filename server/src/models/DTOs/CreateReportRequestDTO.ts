import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

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

    @IsNumber()
    categoryId!: number;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(3)
    @IsString({ each: true })
    photos!: string[];

}
