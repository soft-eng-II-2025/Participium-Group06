import { ReportDTO } from "../models/DTOs/ReportDTO";
import { UserDTO } from "../models/DTOs/UserDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { UserRepository } from "../repositories/UserRepository";
import {mapReportDAOToDTO, mapReportDTOToDAO, mapUserDAOToDTO, mapUserDTOToDAO} from "../services/mapperService";
import {CategoryRepository} from "../repositories/CategoryRepository";

const userRepository: UserRepository = new UserRepository();
const reportRepository: ReportRepository = new ReportRepository();

export async function addReport(reportData: ReportDTO): Promise<ReportDTO> {
    const reportDAO = mapReportDTOToDAO(reportData);
    const addedReport = await reportRepository.add(reportDAO);
    return mapReportDAOToDTO(addedReport);
}


export async function createUser(UserData: UserDTO): Promise<UserDTO> {
    const adeddUserDao = await userRepository.add(mapUserDTOToDAO(UserData));
    return mapUserDAOToDTO(adeddUserDao);
}