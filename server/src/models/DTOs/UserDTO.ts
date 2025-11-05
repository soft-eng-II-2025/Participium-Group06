import { ReportDto } from "./ReportDTO";

export class UserDto {
    username!: string;
    email!: string;
    password!: string;
    first_name!: string;
    last_name!: string;
    reports!: ReportDto[];
  }