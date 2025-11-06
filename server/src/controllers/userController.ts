import { ReportDTO } from "../models/DTOs/ReportDTO";
import { UserDTO } from "../models/DTOs/UserDTO";
import { User } from "../models/User";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import { mapReportDTOToDAO, mapUserDAOToDTO, mapUserDTOToDAO } from "../services/mapperService";

const userRepository: UserRepository = new UserRepository();
const reportRepository: ReportRepository = new ReportRepository();

export async function addReport(reportData: ReportDTO): Promise<ReportDTO> {
    const reportDAO = mapReportDTOToDAO(reportData);
    reportRepository.add(reportDAO);
    return reportData;
}

export async function createUser(UserData: UserDTO): Promise<User> {
    return userRepository.add(mapUserDTOToDAO(UserData));
}