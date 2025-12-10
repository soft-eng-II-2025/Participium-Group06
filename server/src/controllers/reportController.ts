

import { CreateReportRequestDTO } from "../models/DTOs/CreateReportRequestDTO";
import { mapReportDAOToDTO as mapReportDAOToResponse, mapCreateReportRequestToDAO } from "../services/mapperService";
import { ReportResponseDTO } from "../models/DTOs/ReportResponseDTO";
import { ReportRepository } from "../repositories/ReportRepository";
import { StatusType } from "../models/StatusType";
import { DataSource } from "typeorm";
import { getMunicipalityOfficerDAOForNewRequest,getMunicipalityOfficerDAOByUsername } from "./adminController";
import { ReportPhoto } from "../models/ReportPhoto";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Notification } from "../models/Notification";
import { NotificationType } from "../models/NotificationType";
import { NotificationRepository } from "../repositories/NotificationRepository";
import { SocketService } from "../services/socketService";
import { Server } from "socket.io";
import { createChatLeadExternal, createChatOfficerUser } from "./messagingController";


let reportRepository: ReportRepository;
let notificationRepository: NotificationRepository;
let socketService: SocketService;


export function initializeReportRepositories(dataSource: DataSource, io: Server) {
    reportRepository = new ReportRepository(dataSource);
    notificationRepository = new NotificationRepository(dataSource);
    socketService = new SocketService(io);
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
    reportDAO.officer = undefined;
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



export async function updateReportStatus(
    reportId: number,
    newStatus: StatusType,
    explanation: string
): Promise<ReportResponseDTO> {
    const report = await reportRepository.findById(reportId);
    if (!report) throw appErr('REPORT_NOT_FOUND', 404);

    if (report.status === StatusType.PendingApproval) {
        report.officer = undefined;
    }

    report.status = newStatus;
    report.explanation = explanation;
    const updatedReport = await reportRepository.update(report);

    // Create & save notification for the user
    if (report.user) {
        const notification = new Notification();
        notification.user = report.user;
        notification.content = `Your report "${report.title}" has been updated to status: ${newStatus}`;
        notification.type = NotificationType.ReportChanged;
        notification.is_read = false;
        notification.created_at = new Date();

        const savedNotif = await notificationRepository.add(notification);

        // Send notification via socket if user is online
        socketService.sendNotificationToUser(report.user.id, savedNotif);
    }

    return mapReportDAOToResponse(updatedReport);
}


export async function updateReportOfficer(reportId: number, municipalityOfficer: MunicipalityOfficer, techLead: MunicipalityOfficer): Promise<ReportResponseDTO> {
    console.log(`Updating report ${reportId} to officer ${municipalityOfficer.username}`);
    const report = await reportRepository.findById(reportId);
    if (!report) throw appErr('REPORT_NOT_FOUND', 404);

    
    if(municipalityOfficer.external) {
        report.leadOfficer = techLead;
        await createChatLeadExternal(report);
        await createChatOfficerUser(report);
    } else {
        await createChatOfficerUser(report);
     
    }

    report.officer = municipalityOfficer;  
    const updatedReport = await reportRepository.update(report);
    return mapReportDAOToResponse(updatedReport);
}

export async function getAllReports():Promise<ReportResponseDTO[]> {
    const reports = await reportRepository.findAll();
    return reports.map(mapReportDAOToResponse);
}

export async function getReportById(reportId: number):Promise<ReportResponseDTO> {
    const report = await reportRepository.findById(reportId);
    if (!report) throw appErr('REPORT_NOT_FOUND', 404);
    return mapReportDAOToResponse(report);
}


export async function GetReportsByOfficerUsername(username: string):Promise<ReportResponseDTO[]> {
    const officer = await getMunicipalityOfficerDAOByUsername(username);
    const reports = await reportRepository.findByOfficer(officer);
    return reports.map(mapReportDAOToResponse);
}

export async function getAllAcceptedReports():Promise<ReportResponseDTO[]> {
    const reports = await reportRepository.findApproved();
    return reports.map(mapReportDAOToResponse);
}

export async function getReportsByCategoryIdAndStatus(categoryId :number, Status : StatusType[]):Promise<ReportResponseDTO[]> {
    const reports = await reportRepository.findByCategoryId(categoryId);
    const filteredReports = reports.filter(report => Status.includes(report.status));
    return filteredReports.map(mapReportDAOToResponse);
}   

export async function getUserReports(userId: number): Promise<ReportResponseDTO[]>{
    const reports = await reportRepository.findByUserId(userId);
    return reports.map(mapReportDAOToResponse);
}
