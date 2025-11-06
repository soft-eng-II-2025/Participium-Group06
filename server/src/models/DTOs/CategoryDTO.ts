import { IsNotEmpty } from "class-validator";
import {ReportDTO} from "./ReportDTO";

export class CategoryDTO {
    @IsNotEmpty()
    name!: string;
    reports!: ReportDTO[];
}