// src/tests/unit/reportController.unit.test.ts

import {
    initializeReportRepositories,
    getAllAcceptedReports,
    addReport,
    updateReportStatus,
    updateReportOfficer,
    getAllReports,
    getReportById,
    GetReportsByOfficerUsername,
    getReportsByCategoryIdAndStatus,
} from "../../../controllers/reportController";
import {
    mapCreateReportRequestToDAO,
    mapReportDAOToDTO as mapReportDAOToResponse
} from "../../../services/mapperService";
import { ReportRepository } from "../../../repositories/ReportRepository";
import { ReportResponseDTO } from "../../../models/DTOs/ReportResponseDTO";
import { MunicipalityOfficerResponseDTO } from "../../../models/DTOs/MunicipalityOfficerResponseDTO";
import { UserResponseDTO } from "../../../models/DTOs/UserResponseDTO";
import { ReportPhoto } from "../../../models/ReportPhoto";
import { StatusType } from "../../../models/StatusType";
import {
    getMunicipalityOfficerDAOForNewRequest,
    getMunicipalityOfficerDAOByUsername,
} from "../../../controllers/adminController";
import { CreateReportRequestDTO } from "../../../models/DTOs/CreateReportRequestDTO";

// ------------------------------------------------------------------
// 1. OGGETTI MOCK GLOBALI
// ------------------------------------------------------------------
const mockOfficerDao = { id: 10, username: "org_officer", role: { title: "ORGANIZATION_OFFICER" } };
const mockReportDaoIn = { title: "R1", status: StatusType.PendingApproval, user: { id: 1 } };
const mockReportDaoAdded = { id: 1, ...mockReportDaoIn };
const mockReportDto = { id: 1, title: "R1 DTO", status: "PendingApproval" };
const mockPhotoUrls = ["photo1.jpg", "photo2.jpg"];

// ------------------------------------------------------------------
// 2. MOCK DIPENDENZE
// ------------------------------------------------------------------
// Mock di adminController per le funzioni richiamate
jest.mock("../../../controllers/adminController", () => ({
    getMunicipalityOfficerDAOForNewRequest: jest.fn(),
    getMunicipalityOfficerDAOByUsername: jest.fn(),
}));

// Mock delle dipendenze
jest.mock("../../../repositories/ReportRepository");
jest.mock("../../../services/mapperService");

// ------------------------------------------------------------------
// 3. ISTANZA MOCK DEL REPOSITORY (Deve essere definita qui per lo scope globale)
// ------------------------------------------------------------------
const reportRepositoryMock = {
    add: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    findByOfficer: jest.fn(),
    findByCategoryId: jest.fn(),
    findApproved: jest.fn(),
    addPhotosToReport: jest.fn(),
};

// ------------------------------------------------------------------
// 4. SETUP GENERALE PER TUTTE LE SUITE
// ------------------------------------------------------------------

beforeEach(() => {
    // 4.1 Re-implementa ReportRepository con l'istanza mock
    (ReportRepository as unknown as jest.Mock).mockImplementation(
        () => reportRepositoryMock as any,
    );

    // 4.2 Re-inizializza il controller per iniettare l'istanza mock
    initializeReportRepositories({} as any);

    // 4.3 Pulisci tutti i mock prima di ogni test
    jest.clearAllMocks();

    // 4.4 Resetta le implementazioni di base
    reportRepositoryMock.add.mockResolvedValue(mockReportDaoAdded);
    reportRepositoryMock.update.mockResolvedValue(mockReportDaoAdded);
    reportRepositoryMock.findById.mockResolvedValue(mockReportDaoAdded);
    reportRepositoryMock.findAll.mockResolvedValue([]);
    reportRepositoryMock.findByOfficer.mockResolvedValue([]);
    reportRepositoryMock.findByCategoryId.mockResolvedValue([]);
    reportRepositoryMock.findApproved.mockResolvedValue([]);
    reportRepositoryMock.addPhotosToReport.mockResolvedValue([]);

    (getMunicipalityOfficerDAOForNewRequest as jest.Mock).mockResolvedValue(mockOfficerDao);
    (getMunicipalityOfficerDAOByUsername as jest.Mock).mockResolvedValue(mockOfficerDao);
    (mapReportDAOToResponse as jest.Mock).mockReturnValue(mockReportDto);
    (mapCreateReportRequestToDAO as jest.Mock).mockReturnValue({ ...mockReportDaoIn });
});

// ------------------------------------------------------------------
// 5. SUITE: getAllAcceptedReports (Test esistente)
// ------------------------------------------------------------------

describe("getAllAcceptedReports - unit test puro", () => {
    const mockReportsDAO = [
        { id: 1, title: "Report 1", status: "Approved" },
        { id: 2, title: "Report 2", status: "Approved" },
    ];

    const mockMappedReports: ReportResponseDTO[] = [
        // Uso un subset del DTO per semplificare, ma mantengo l'identificazione
        { id: 1, title: "Report 1", status: "Approved" } as ReportResponseDTO,
        { id: 2, title: "Report 2", status: "Approved" } as ReportResponseDTO,
    ];

    beforeEach(() => {
        // Mock del mapper: dato un DAO (identificato dal title), ritorna il DTO corrispondente
        (mapReportDAOToResponse as jest.Mock).mockImplementation((dao: any) => {
            return mockMappedReports.find(r => r.title === dao.title) ?? mockReportDto;
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

// ------------------------------------------------------------------
// 6. SUITE: Funzioni CRUD (Test esistenti e corretti)
// ------------------------------------------------------------------

describe("reportController - Funzioni CRUD e Find", () => {
    // ------------------------------------------------------------------
    // updateReportStatus
    // ------------------------------------------------------------------
    describe("updateReportStatus", () => {
        it("dovrebbe aggiornare lo stato e la spiegazione di un report", async () => {
            const updatedReportDao = { ...mockReportDaoAdded, status: StatusType.Resolved, explanation: "Done" };
            reportRepositoryMock.findById.mockResolvedValue(mockReportDaoAdded);
            reportRepositoryMock.update.mockResolvedValue(updatedReportDao);

            await updateReportStatus(1, StatusType.Resolved, "Done");

            expect(reportRepositoryMock.findById).toHaveBeenCalledWith(1);
            expect(reportRepositoryMock.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: StatusType.Resolved, explanation: "Done" })
            );
        });

        it("dovrebbe lanciare REPORT_NOT_FOUND se il report non esiste", async () => {
            reportRepositoryMock.findById.mockResolvedValue(null);

            await expect(
                updateReportStatus(99, StatusType.Resolved, "Done")
            ).rejects.toThrow("REPORT_NOT_FOUND");
        });
    });

    // ------------------------------------------------------------------
    // updateReportOfficer
    // ------------------------------------------------------------------
    describe("updateReportOfficer", () => {
        it("dovrebbe aggiornare l'ufficiale di un report", async () => {
            reportRepositoryMock.findById.mockResolvedValue(mockReportDaoAdded);
            const newOfficer = { id: 20, username: "new_officer" };
            const updatedReportDao = { ...mockReportDaoAdded, officer: newOfficer };
            reportRepositoryMock.update.mockResolvedValue(updatedReportDao);

            await updateReportOfficer(1, newOfficer as any);

            expect(reportRepositoryMock.findById).toHaveBeenCalledWith(1);
            expect(reportRepositoryMock.update).toHaveBeenCalledWith(
                expect.objectContaining({ officer: newOfficer })
            );
        });
    });

    // ------------------------------------------------------------------
    // getAllReports
    // ------------------------------------------------------------------
    describe("getAllReports", () => {
        it("dovrebbe restituire tutti i report mappati", async () => {
            const mockReportsDao = [{ id: 1 }, { id: 2 }];
            reportRepositoryMock.findAll.mockResolvedValue(mockReportsDao);
            (mapReportDAOToResponse as jest.Mock).mockImplementation(dao => ({ id: dao.id }));

            const result = await getAllReports();

            expect(reportRepositoryMock.findAll).toHaveBeenCalledTimes(1);
            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        });
    });

    // ------------------------------------------------------------------
    // getReportById
    // ------------------------------------------------------------------
    describe("getReportById", () => {
        it("dovrebbe restituire un report specifico", async () => {
            reportRepositoryMock.findById.mockResolvedValue(mockReportDaoAdded);
            await getReportById(1);
            expect(reportRepositoryMock.findById).toHaveBeenCalledWith(1);
            expect(mapReportDAOToResponse).toHaveBeenCalledWith(mockReportDaoAdded);
        });

        it("dovrebbe lanciare REPORT_NOT_FOUND", async () => {
            reportRepositoryMock.findById.mockResolvedValue(null);
            await expect(getReportById(99)).rejects.toThrow("REPORT_NOT_FOUND");
        });
    });

    // ------------------------------------------------------------------
    // GetReportsByOfficerUsername
    // ------------------------------------------------------------------
    describe("GetReportsByOfficerUsername", () => {
        it("dovrebbe restituire i report per username dell'ufficiale", async () => {
            const reportsDao = [{ id: 1 }, { id: 2 }];
            reportRepositoryMock.findByOfficer.mockResolvedValue(reportsDao);

            const result = await GetReportsByOfficerUsername("org_officer");

            expect(getMunicipalityOfficerDAOByUsername).toHaveBeenCalledWith("org_officer");
            expect(reportRepositoryMock.findByOfficer).toHaveBeenCalledWith(mockOfficerDao);
            expect(result.length).toBe(reportsDao.length);
        });
    });

    // ------------------------------------------------------------------
    // getReportsByCategoryIdAndStatus
    // ------------------------------------------------------------------
    describe("getReportsByCategoryIdAndStatus", () => {
        it("dovrebbe filtrare i report per stato dopo averli trovati per categoria", async () => {
            const statusFilter = [StatusType.Assigned, StatusType.InProgress];
            const rawReports = [
                { id: 1, status: StatusType.Assigned },
                { id: 2, status: StatusType.Resolved },
                { id: 3, status: StatusType.InProgress },
                { id: 4, status: StatusType.PendingApproval },
            ];
            reportRepositoryMock.findByCategoryId.mockResolvedValue(rawReports);
            (mapReportDAOToResponse as jest.Mock).mockImplementation(dao => ({
                id: dao.id,
                status: dao.status,
            }));

            const result = await getReportsByCategoryIdAndStatus(1, statusFilter);

            expect(reportRepositoryMock.findByCategoryId).toHaveBeenCalledWith(1);
            expect(result.length).toBe(2);
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ id: 1, status: StatusType.Assigned }),
                    expect.objectContaining({ id: 3, status: StatusType.InProgress }),
                ])
            );
        });
    });
});


// ------------------------------------------------------------------
// 7. SUITE: addReport (Corretta)
// ------------------------------------------------------------------

describe("addReport - Copertura Completa", () => {

    // ------------------------------------------------------------------
    // Caso 1: Successo con foto
    // ------------------------------------------------------------------
    it("dovrebbe assegnare l'ufficiale, salvare il report con PendingApproval e salvare le foto", async () => {
        const reportData: CreateReportRequestDTO = {
            title: "R1", description: "D", latitude: 10, longitude: 20, userId: 1, categoryId: 5,
            photos: mockPhotoUrls, // <-- Include foto
        };
        const reportDaoWithPhotos = { ...mockReportDaoAdded, photos: [{ photo: 'photo1.jpg' } as ReportPhoto] };

        // Simula il DAO ritornato che contiene le foto aggiunte
        reportRepositoryMock.add.mockResolvedValue(reportDaoWithPhotos);
        (mapReportDAOToResponse as jest.Mock).mockReturnValue({
            ...mockReportDto,
            photos: mockPhotoUrls
        });

        await addReport(reportData);

        // 1. Verifica l'assegnazione iniziale dell'ufficiale
        expect(getMunicipalityOfficerDAOForNewRequest).toHaveBeenCalledTimes(1);

        // 2. Verifica che reportDAO.officer sia impostato
        const reportDAO = (mapCreateReportRequestToDAO as jest.Mock).mock.results[0].value;
        expect(reportDAO.officer).toBe(mockOfficerDao);
        expect(reportDAO.status).toBe(StatusType.PendingApproval);

        // 3. Verifica il salvataggio del report
        expect(reportRepositoryMock.add).toHaveBeenCalledTimes(1);

        // 4. Verifica il salvataggio delle foto
        expect(reportRepositoryMock.addPhotosToReport).toHaveBeenCalledTimes(1);
        const [reportForPhotos, photoDAOs] = reportRepositoryMock.addPhotosToReport.mock.calls[0];

        expect(reportForPhotos).toBe(reportDaoWithPhotos); // Deve usare l'oggetto ritornato dal salvataggio
        expect(photoDAOs.length).toBe(mockPhotoUrls.length);
        expect(photoDAOs[0]).toBeInstanceOf(ReportPhoto);
    });

    // ------------------------------------------------------------------
    // Caso 2: Successo senza foto
    // ------------------------------------------------------------------
    it("dovrebbe salvare il report e NON chiamare addPhotosToReport se mancano le foto", async () => {
        const reportData: CreateReportRequestDTO = {
            title: "R2", description: "D", latitude: 10, longitude: 20, userId: 1, categoryId: 5,
            photos: [], // <-- Array vuoto
        };

        await addReport(reportData);

        expect(getMunicipalityOfficerDAOForNewRequest).toHaveBeenCalledTimes(1);
        expect(reportRepositoryMock.add).toHaveBeenCalledTimes(1);

        // 4. Verifica che il salvataggio delle foto non sia chiamato
        expect(reportRepositoryMock.addPhotosToReport).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------
    // Caso 3: Fallimento assegnazione Ufficiale
    // ------------------------------------------------------------------
    it("dovrebbe propagare l'errore se getMunicipalityOfficerDAOForNewRequest fallisce", async () => {
        // Simula l'errore NO_OFFICER_AVAILABLE
        (getMunicipalityOfficerDAOForNewRequest as jest.Mock).mockRejectedValue(new Error("NO_OFFICER_AVAILABLE"));

        const reportData: CreateReportRequestDTO = {
            title: "R3", description: "D", latitude: 10, longitude: 20, userId: 1, categoryId: 5, photos: [],
        };

        await expect(addReport(reportData)).rejects.toThrow("NO_OFFICER_AVAILABLE");

        // Verifica che il report non sia stato salvato
        expect(reportRepositoryMock.add).not.toHaveBeenCalled();
    });

    // ------------------------------------------------------------------
    // Caso 4: Fallimento salvataggio Report (es. User/Category ID non valido)
    // ------------------------------------------------------------------
    it("dovrebbe propagare l'errore se reportRepository.add fallisce", async () => {
        // Simula l'errore di validazione/FK non trovata nel repository
        reportRepositoryMock.add.mockRejectedValue(new Error("Category not found for report creation."));

        const reportData: CreateReportRequestDTO = {
            title: "R4", description: "D", latitude: 10, longitude: 20, userId: 1, categoryId: 999, photos: [],
        };

        await expect(addReport(reportData)).rejects.toThrow("Category not found for report creation.");

        // Verifica che il salvataggio delle foto non sia chiamato
        expect(reportRepositoryMock.addPhotosToReport).not.toHaveBeenCalled();
    });
});