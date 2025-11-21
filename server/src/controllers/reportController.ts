import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import { mapReportDAOToDTO as mapReportDAOToResponse, mapCreateReportRequestToDAO } from "../services/mapperService";
import { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { StatusType } from "../models/StatusType";
import { DataSource } from "typeorm";
import { getMunicipalityOfficerDAOForNewRequest,getMunicipalityOfficerDAOByUsername } from "./adminController";
import { ReportPhoto } from "../models/ReportPhoto";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";

let reportRepository: ReportRepository;

export function initializeReportRepositories(dataSource: DataSource) {
    reportRepository = new ReportRepository(dataSource);
}

function appErr(code: string, status = 400) { const e: any = new Error(code); e.status = status; return e; }


export async function addReport(reportData: CreateReportRequestDTO): Promise<ReportResponseDTO> {
    console.log('Adding report with data:', reportData);
    // In un sistema autenticato, l'ID dell'utente dovrebbe venire dal token/sessione.
    // Per ora, assumiamo che reportData.userId sia valido.
    const reportDAO = mapCreateReportRequestToDAO(reportData);
    reportDAO.status = StatusType.PendingApproval;

    // Here we need an additional step to decide the officer and set it
    // reportDAO.officer = await reportRepository.assignOfficerToReport(addedReport);
    reportDAO.officer = await getMunicipalityOfficerDAOForNewRequest() // Temporary: assign first officer
    const addedReport = await reportRepository.add(reportDAO);
    // Ora, aggiungiamo le foto al report aggiunto
    if (reportData.photos && reportData.photos.length > 0) {
        const photoDAOs = reportData.photos.map(photoUrl => {
            const reportPhoto = new ReportPhoto();
            reportPhoto.photo = photoUrl; // photoUrl ora è un percorso locale (es. /uploads/nomefile.jpg)
            reportPhoto.report = addedReport;
            return reportPhoto;
        });
        await reportRepository.addPhotosToReport(addedReport, photoDAOs);
        // Per assicurarsi che l'oggetto addedReport restituito contenga le foto
        addedReport.photos = photoDAOs;
    }
    return mapReportDAOToResponse(addedReport);
}

export async function UpdateReportStatus(reportId: number, newStatus: StatusType, explanation: string): Promise<ReportResponseDTO> {
    console.log(`Updating report ${reportId} to status ${newStatus}`);
    const report = await reportRepository.findById(reportId);
    if (!report) throw appErr('REPORT_NOT_FOUND', 404);
    
    report.status = newStatus;
    report.explanation = explanation;   
    const updatedReport = await reportRepository.update(report);
    return mapReportDAOToResponse(updatedReport);
}

export async function UpdateReportOfficer(reportId: number, MunicipalityOfficer: MunicipalityOfficer): Promise<ReportResponseDTO> {
    console.log(`Updating report ${reportId} to officer ${MunicipalityOfficer.username}`);
    const report = await reportRepository.findById(reportId);
    if (!report) throw appErr('REPORT_NOT_FOUND', 404);
    
    report.officer = MunicipalityOfficer;  
    const updatedReport = await reportRepository.update(report);
    return mapReportDAOToResponse(updatedReport);
}

export async function GetAllReports():Promise<ReportResponseDTO[]> {
    const reports = await reportRepository.findAll();
    return reports.map(mapReportDAOToResponse);
}

export async function GetReportsByUserId(userId: number):Promise<ReportResponseDTO[]> {
    const reports = await reportRepository.findByUserId(userId);
    return reports.map(mapReportDAOToResponse);
}

export async function GetReportsByOfficerUsername(username: string):Promise<ReportResponseDTO[]> {
    const officer = await getMunicipalityOfficerDAOByUsername(username);
    const reports = await reportRepository.findByOfficer(officer);
    return reports.map(mapReportDAOToResponse);
}

export async function GetReportById(reportId: number):Promise<ReportResponseDTO> {
    const report = await reportRepository.findById(reportId);
    if (!report) throw appErr('REPORT_NOT_FOUND', 404);
    return mapReportDAOToResponse(report);
}