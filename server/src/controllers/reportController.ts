import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import { mapReportDAOToDTO as mapReportDAOToResponse, mapCreateReportRequestToDAO } from "../services/mapperService";
import { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { StatusType } from "../models/StatusType";
import { DataSource } from "typeorm";
import { getMunicipalityOfficerForNewRequest } from "./userController";
import { ReportPhoto } from "../models/ReportPhoto";

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
    reportDAO.officer = await getMunicipalityOfficerForNewRequest() // Temporary: assign first officer
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