
// reportController.unit.test.ts
import { initializeReportRepositories, getAllAcceptedReports, updateReportStatus } from "../../../controllers/reportController";
import { mapReportDAOToDTO as mapReportDAOToResponse } from "../../../services/mapperService";
import { ReportRepository } from "../../../repositories/ReportRepository";
import { NotificationRepository } from "../../../repositories/NotificationRepository";
import { SocketService } from "../../../services/socketService";
import { ReportResponseDTO } from "../../../models/DTOs/ReportResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../../../models/DTOs/MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "../../../models/DTOs/UserResponseDTO";
import { StatusType } from "../../../models/StatusType";

// Mock delle dipendenze
jest.mock("../../../repositories/ReportRepository");
jest.mock("../../../repositories/NotificationRepository");
jest.mock("../../../services/socketService");
jest.mock("../../../services/mapperService");

describe("getAllAcceptedReports - unit test puro", () => {
    const mockReportsDAO = [
        { id: 1, title: "Report 1", status: "Approved" },
        { id: 2, title: "Report 2", status: "Approved" },
    ];

    const mockMappedReports: ReportResponseDTO[] = [
        {
            id: 1,
            longitude: 12.34,
            latitude: 56.78,
            title: "Report 1",
            description: "Description 1",
            user: {
                userId: 1,
                username: "user1",
                email: "user1@example.com",
                first_name: "User",
                last_name: "One",
                photo: null,
                telegram_id: null,
                flag_email: true,
                reports: [],
            } as UserResponseDTO,
            category: "category1",
            status: "Approved",
            explanation: "",
            officer: {
                username: "officer1",
                email: "officer1@example.com",
                first_name: "Officer",
                last_name: "One",
                role: "Admin",
            } as MunicipalityOfficerResponseDTO,
            photos: ["photo1.jpg"],
            createdAt: new Date("2025-01-01"),
        },
        {
            id: 2,
            longitude: 23.45,
            latitude: 67.89,
            title: "Report 2",
            description: "Description 2",
            user: {
                userId: 2,
                username: "user2",
                email: "user2@example.com",
                first_name: "User",
                last_name: "Two",
                photo: null,
                telegram_id: null,
                flag_email: false,
                reports: [],
            } as UserResponseDTO,
            category: "category2",
            status: "Approved",
            explanation: "",
            officer: {
                username: "officer2",
                email: "officer2@example.com",
                first_name: "Officer",
                last_name: "Two",
                role: null,
            } as MunicipalityOfficerResponseDTO,
            photos: ["photo2.jpg"],
            createdAt: new Date("2025-01-02"),
        },
    ];

    const reportRepositoryMock = {
        findApproved: jest.fn().mockResolvedValue(mockReportsDAO),
        findById: jest.fn(),
        update: jest.fn(),
    };

    const notificationRepositoryMock = {
        add: jest.fn(),
    };

    const socketServiceMock = {
        sendNotificationToUser: jest.fn(),
    };

    beforeAll(() => {
        // Quando ReportRepository viene istanziato internamente, restituisce il mock
        (ReportRepository as jest.Mock).mockImplementation(() => reportRepositoryMock as any);
        (NotificationRepository as jest.Mock).mockImplementation(() => notificationRepositoryMock as any);
        (SocketService as jest.Mock).mockImplementation(() => socketServiceMock as any);
        // Inizializza la variabile interne con i mock
        initializeReportRepositories({} as any, {to: jest.fn().mockReturnThis(),  emit: jest.fn()  } as any);


        // Mock del mapper
        (mapReportDAOToResponse as jest.Mock).mockImplementation(
            dao => mockMappedReports.find(r => r.title === dao.title)!
        );
    });

    it("should return mapped approved reports", async () => {
        const result = await getAllAcceptedReports();

        expect(result).toEqual(mockMappedReports);
        expect(reportRepositoryMock.findApproved).toHaveBeenCalledTimes(1);
        expect(mapReportDAOToResponse).toHaveBeenCalledTimes(mockReportsDAO.length);
    });
    it("should return empty array if no approved reports", async () => {
        reportRepositoryMock.findApproved.mockResolvedValue([]);

        const result = await getAllAcceptedReports();

        expect(result).toEqual([]);
        expect(reportRepositoryMock.findApproved).toHaveBeenCalledTimes(1);
        expect(mapReportDAOToResponse).not.toHaveBeenCalled();
    });

    // UPDATE report status
    it("updateReportStatus - should update, create notification and send socket when report has user", async () => {
        const reportId = 99;
        const explanation = "explained";
        const newStatus = StatusType.Resolved;

        const reportDAO: any = {
            id: reportId,
            title: "My Report",
            status: StatusType.PendingApproval,
            explanation: "",
            user: { id: 42, username: "user42" },
        };

        const updatedDAO = { ...reportDAO, status: newStatus, explanation };

        const savedNotif = { id: 7, user: reportDAO.user, content: 'notif' };

        reportRepositoryMock.findById.mockResolvedValue(reportDAO);
        reportRepositoryMock.update.mockResolvedValue(updatedDAO);
        notificationRepositoryMock.add.mockResolvedValue(savedNotif);

        const mappedDto: ReportResponseDTO = {
            id: reportId,
            longitude: 0,
            latitude: 0,
            title: reportDAO.title,
            description: "",
            user: {
                userId: 42,
                username: "user42",
                email: "u@example.com",
                first_name: "U",
                last_name: "L",
                photo: null,
                telegram_id: null,
                flag_email: false,
                reports: [],
            } as UserResponseDTO,
            category: "cat",
            status: newStatus,
            explanation,
            officer: null as any,
            photos: [],
            createdAt: new Date(),
        };

        (mapReportDAOToResponse as jest.Mock).mockImplementation(dao => mappedDto);

        const result = await updateReportStatus(reportId, newStatus as any, explanation);

        expect(reportRepositoryMock.findById).toHaveBeenCalledWith(reportId);
        expect(reportRepositoryMock.update).toHaveBeenCalledWith(expect.objectContaining({ status: newStatus, explanation }));
        expect(notificationRepositoryMock.add).toHaveBeenCalledTimes(1);
        expect(socketServiceMock.sendNotificationToUser).toHaveBeenCalledWith(reportDAO.user.id, savedNotif);
        expect(result).toEqual(mappedDto);
    });

    it("updateReportStatus - should update and not create notification when report has no user", async () => {
        const reportId = 100;
        const explanation = "no user";
        const newStatus = StatusType.Assigned;

        const reportDAO: any = {
            id: reportId,
            title: "NoUser Report",
            status: StatusType.PendingApproval,
            explanation: "",
            user: null,
        };

        const updatedDAO = { ...reportDAO, status: newStatus, explanation };

        reportRepositoryMock.findById.mockResolvedValue(reportDAO);
        reportRepositoryMock.update.mockResolvedValue(updatedDAO);

        const mappedDto: ReportResponseDTO = {
            id: reportId,
            longitude: 0,
            latitude: 0,
            title: reportDAO.title,
            description: "",
            user: null as any,
            category: "cat",
            status: newStatus,
            explanation,
            officer: null as any,
            photos: [],
            createdAt: new Date(),
        };

        (mapReportDAOToResponse as jest.Mock).mockImplementation(dao => mappedDto);

        const result = await updateReportStatus(reportId, newStatus as any, explanation);

        expect(reportRepositoryMock.findById).toHaveBeenCalledWith(reportId);
        expect(reportRepositoryMock.update).toHaveBeenCalledWith(expect.objectContaining({ status: newStatus, explanation }));
        expect(notificationRepositoryMock.add).not.toHaveBeenCalled();
        expect(socketServiceMock.sendNotificationToUser).not.toHaveBeenCalled();
        expect(result).toEqual(mappedDto);
    });

    it("updateReportStatus - should throw REPORT_NOT_FOUND when report not found", async () => {
        const reportId = 555;
        reportRepositoryMock.findById.mockResolvedValue(null);

        await expect(updateReportStatus(reportId, StatusType.Rejected as any, "x")).rejects.toMatchObject({ message: 'REPORT_NOT_FOUND', status: 404 });
    });

});
