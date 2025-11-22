// reportController.unit.test.ts
import { initializeReportRepositories, getAllAcceptedReports } from "../../../controllers/reportController";
import { mapReportDAOToDTO as mapReportDAOToResponse } from "../../../services/mapperService";
import { ReportRepository } from "../../../repositories/ReportRepository";
import { ReportResponseDTO } from "../../../models/DTOs/ReportResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../../../models/DTOs/MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "../../../models/DTOs/UserResponseDTO";

// Mock delle dipendenze
jest.mock("../../../repositories/ReportRepository");
jest.mock("../../../services/mapperService");

describe("getAllAcceptedReports - unit test puro", () => {
    const mockReportsDAO = [
        { id: 1, title: "Report 1", status: "Approved" },
        { id: 2, title: "Report 2", status: "Approved" },
    ];

    const mockMappedReports: ReportResponseDTO[] = [
        {
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
            categoryId: 101,
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
            categoryId: 102,
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
    };

    beforeAll(() => {
        // Quando ReportRepository viene istanziato internamente, restituisce il mock
        (ReportRepository as jest.Mock).mockImplementation(() => reportRepositoryMock as any);
        // Inizializza la variabile interna reportRepository con il mock
        initializeReportRepositories({} as any);

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

});
