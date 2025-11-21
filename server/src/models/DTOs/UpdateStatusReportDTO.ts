import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from "class-validator";
import { StatusType } from "../StatusType";

export class UpdateStatusReportDTO {
    @IsEnum(StatusType)
    @IsNotEmpty()
    newStatus!: StatusType;

    @ValidateIf(o => o.newStatus === StatusType.Rejected)
    @IsNotEmpty()
    explanation?: string;
}