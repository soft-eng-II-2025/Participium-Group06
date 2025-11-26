// src/tests/unit/reportController.unit.test.ts

import {
    initializeReportRepositories,
    getAllAcceptedReports,
    updateReportStatus,
} from "../../../controllers/reportController";
import { mapReportDAOToDTO as mapReportDAOToResponse } from "../../../services/mapperService";
import { ReportRepository } from "../../../repositories/ReportRepository";
import { ReportResponseDTO } from "../../../models/DTOs/ReportResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../../../models/DTOs/MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "../../../models/DTOs/UserResponseDTO";
import { StatusType } from "../../../models/StatusType";

// Mock delle dipendenze
jest.mock("../../../repositories/ReportRepository");
jest.mock("../../../services/mapperService");

// Mock condiviso del repository
const reportRepositoryMock: {
    findApproved: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
} = {
    findApproved: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
};

describe("getAllAcceptedReports - unit test puro", () => {
    // DAO finti restituiti dal repository
    const mockReportsDAO = [
        { id: 1, title: "Report 1", status: "Approved" },
        { id: 2, title: "Report 2", status: "Approved" },
    ];

    // DTO mappati, CONFORMI a ReportResponseDTO
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
            category: "Road",
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
            category: "Pothole",
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

    beforeEach(() => {
        jest.clearAllMocks();

        reportRepositoryMock.findApproved = jest.fn();
        reportRepositoryMock.findById = jest.fn();
        reportRepositoryMock.update = jest.fn();

        // Quando ReportRepository viene istanziato internamente, restituisce il mock
        (ReportRepository as unknown as jest.Mock).mockImplementation(
            () => reportRepositoryMock as any,
        );

        // Inizializza la variabile interna reportRepository con il mock
        initializeReportRepositories({} as any);

        // Mock del mapper: dato un DAO (identificato dal title), ritorna il DTO corrispondente
        (mapReportDAOToResponse as jest.Mock).mockImplementation((dao: any) => {
            const dto = mockMappedReports.find(r => r.title === dao.title);
            if (!dto) {
                throw new Error(`No mock DTO found for title ${dao.title}`);
            }
            return dto;
        });
    });

    it("should return mapped approved reports", async () => {
        reportRepositoryMock.findApproved.mockResolvedValue(mockReportsDAO);

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
});

describe("updateReportStatus - unit test (logica attuale)", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        reportRepositoryMock.findApproved = jest.fn();
        reportRepositoryMock.findById = jest.fn();
        reportRepositoryMock.update = jest.fn();

        (ReportRepository as unknown as jest.Mock).mockImplementation(
            () => reportRepositoryMock as any,
        );

        initializeReportRepositories({} as any);

        // Per questi test ci basta che il mapper ritorni lo stesso oggetto
        (mapReportDAOToResponse as jest.Mock).mockImplementation((dao: any) => dao);
    });

    it("aggiorna status ed explanation quando il report esiste", async () => {
        const reportDAO = {
            id: 1,
            title: "R1",
            status: StatusType.PendingApproval,
            explanation: "",
        };

        reportRepositoryMock.findById.mockResolvedValue(reportDAO);
        reportRepositoryMock.update.mockImplementation(async (r: any) => r);

        const newStatus = StatusType.Assigned;
        const newExplanation = "Preso in carico dall'ufficio tecnico";

        const result = await updateReportStatus(1, newStatus, newExplanation);

        expect(reportRepositoryMock.findById).toHaveBeenCalledWith(1);
        expect(reportDAO.status).toBe(newStatus);
        expect(reportDAO.explanation).toBe(newExplanation);
        expect(reportRepositoryMock.update).toHaveBeenCalledWith(reportDAO);

        expect(result.status).toBe(newStatus);
        expect(result.explanation).toBe(newExplanation);
    });

    it("permette explanation vuota senza errori", async () => {
        const reportDAO = {
            id: 2,
            title: "R2",
            status: StatusType.PendingApproval,
            explanation: "vecchia spiegazione",
        };

        reportRepositoryMock.findById.mockResolvedValue(reportDAO);
        reportRepositoryMock.update.mockImplementation(async (r: any) => r);

        const result = await updateReportStatus(
            2,
            StatusType.InProgress,
            "",
        );

        expect(reportRepositoryMock.findById).toHaveBeenCalledWith(2);
        expect(reportDAO.status).toBe(StatusType.InProgress);
        expect(reportDAO.explanation).toBe("");
        expect(reportRepositoryMock.update).toHaveBeenCalledWith(reportDAO);

        expect(result.status).toBe(StatusType.InProgress);
        expect(result.explanation).toBe("");
    });

    it("lancia REPORT_NOT_FOUND se il report non esiste", async () => {
        reportRepositoryMock.findById.mockResolvedValue(null);

        await expect(
            updateReportStatus(999, StatusType.Rejected, "motivo"),
        ).rejects.toThrow("REPORT_NOT_FOUND");

        expect(reportRepositoryMock.update).not.toHaveBeenCalled();
    });
});
