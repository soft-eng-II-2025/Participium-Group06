// src/tests/unit/ReportRepository.unit.test.ts
import { ReportRepository } from "../../../repositories/ReportRepository";
import { Report } from "../../../models/Report";
import { StatusType } from "../../../models/StatusType";
import { ReportPhoto } from "../../../models/ReportPhoto";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";

const mockOrmRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(), // Aggiunto findOneBy per completezza, anche se findById non lo usa
    save: jest.fn().mockImplementation(r => Promise.resolve(r)),
    remove: jest.fn().mockResolvedValue(undefined),
    manager: { findOne: jest.fn() }, // per add (Officer)
};
const mockPhotoRepository = {
    find: jest.fn(),
    save: jest.fn().mockImplementation(p => Promise.resolve(p)),
    remove: jest.fn().mockResolvedValue(undefined),
};
const mockUserRepository = { findOneBy: jest.fn() };
const mockCategoryRepository = { findOneBy: jest.fn() };

describe("ReportRepository - Unit Test (Mock ORM)", () => {
    let reportRepository: ReportRepository;
    const mockReport = { id: 1, title: "R1", status: StatusType.Assigned } as Report;
    const mockUser = { id: 10, username: "u1" };
    const mockCategory = { id: 5, name: "C1" };
    const mockOfficer = { id: 20, username: "o1" } as MunicipalityOfficer;

    beforeEach(() => {
        const mockDataSource = {
            getRepository: jest.fn((entity: any) => {
                if (entity.name === "Report") return mockOrmRepository;
                if (entity.name === "ReportPhoto") return mockPhotoRepository;
                if (entity.name === "User") return mockUserRepository;
                if (entity.name === "Category") return mockCategoryRepository;
                return {};
            }),
        };
        reportRepository = new ReportRepository(mockDataSource as any);
        jest.clearAllMocks();

        // Setup base per i finders
        mockOrmRepository.findOne.mockResolvedValue(mockReport);
        mockOrmRepository.find.mockResolvedValue([mockReport]);
    });

    // ------------------------------------------------------------------
    // Finders
    // ------------------------------------------------------------------
    it("dovrebbe chiamare find con where e relazioni per findByUserId", async () => {
        await reportRepository.findByUserId(10);
        expect(mockOrmRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { user: { id: 10 } },
            relations: ['category', 'photos', 'user', 'officer']
        }));
    });

    it("dovrebbe chiamare find con where e relazioni per findByOfficer", async () => {
        await reportRepository.findByOfficer(mockOfficer);
        expect(mockOrmRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { officer: { id: mockOfficer.id } },
        }));
    });

    it("dovrebbe chiamare find su photoRepository per findPhotosByReportId", async () => {
        await reportRepository.findPhotosByReportId(1);
        expect(mockPhotoRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { report: { id: 1 } }
        }));
    });

    // Test esistenti...
    it("dovrebbe chiamare find con relazioni per findAll", async () => {
        await reportRepository.findAll();
        expect(mockOrmRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            relations: ['category', 'photos', 'user']
        }));
    });

    it("dovrebbe chiamare find con where e relazioni per findByCategory", async () => {
        await reportRepository.findByCategory(5);
        expect(mockOrmRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { category: { id: 5 } },
        }));
    });

    it("dovrebbe chiamare findOne con where e relazioni per findById", async () => {
        await reportRepository.findById(1);
        expect(mockOrmRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 1 },
        }));
    });

    it("dovrebbe chiamare find con where per findApproved", async () => {
        await reportRepository.findApproved();
        expect(mockOrmRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { status: StatusType.Assigned },
        }));
    });

    it("dovrebbe chiamare find con where per findByCategoryId", async () => {
        await reportRepository.findByCategoryId(5);
        expect(mockOrmRepository.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { category: { id: 5 } },
        }));
    });


    // ------------------------------------------------------------------
    // CRUD e Updates
    // ------------------------------------------------------------------
    describe("add", () => {
        const reportToAdd = {
            title: "New", description: "D",
            user: { id: 10 },
            category: { id: 5 },
            officer: { id: 20 },
            // Simuliamo il DAO che non ha status né explanation
        } as Report;

        beforeEach(() => {
            mockUserRepository.findOneBy.mockResolvedValue(mockUser);
            mockCategoryRepository.findOneBy.mockResolvedValue(mockCategory);
            mockOrmRepository.manager.findOne.mockResolvedValue(mockOfficer);
        });

        it("dovrebbe salvare il report e caricare tutte le relazioni", async () => {
            await reportRepository.add(reportToAdd);

            expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: 10 });
            expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ id: 5 });
            expect(mockOrmRepository.manager.findOne).toHaveBeenCalledWith(MunicipalityOfficer, expect.objectContaining({ where: { id: 20 } }));
            expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);

            const savedReport = mockOrmRepository.save.mock.calls[0][0];
            expect(savedReport.status).toBe(StatusType.PendingApproval); // Default Status
            expect(savedReport.explanation).toBe(""); // Default Explanation
            expect(savedReport.user).toEqual(mockUser);
            expect(savedReport.officer).toEqual(mockOfficer);
        });

        it("dovrebbe lanciare errore se l'utente non è trovato", async () => {
            mockUserRepository.findOneBy.mockResolvedValue(null);
            await expect(reportRepository.add(reportToAdd)).rejects.toThrow("User not found for report creation.");
        });

        it("dovrebbe lanciare errore se la categoria non è trovata", async () => {
            mockCategoryRepository.findOneBy.mockResolvedValue(null);
            await expect(reportRepository.add(reportToAdd)).rejects.toThrow("Category not found for report creation.");
        });

        it("dovrebbe lanciare errore se l'ufficiale non è trovato", async () => {
            mockOrmRepository.manager.findOne.mockResolvedValue(null);
            await expect(reportRepository.add(reportToAdd)).rejects.toThrow("Officer not found for report creation.");
        });

        it("dovrebbe accettare uno status e una explanation definiti nel DAO di input", async () => {
            const definedReport = { ...reportToAdd, status: StatusType.Resolved, explanation: "Completed" };
            await reportRepository.add(definedReport);

            const savedReport = mockOrmRepository.save.mock.calls[0][0];
            expect(savedReport.status).toBe(StatusType.Resolved);
            expect(savedReport.explanation).toBe("Completed");
        });
    });

    it("dovrebbe chiamare remove per rimuovere un report", async () => {
        await reportRepository.remove(mockReport);
        expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockReport);
    });

    it("dovrebbe chiamare remove su photoRepository per rimuovere una foto", async () => {
        const mockPhoto = { id: 1, photo: "p1" } as ReportPhoto;
        await reportRepository.removePhoto(mockPhoto);
        expect(mockPhotoRepository.remove).toHaveBeenCalledWith(mockPhoto);
    });

    it("dovrebbe chiamare save per changeDescription e aggiornare il campo", async () => {
        const newDescription = "New description content";
        const result = await reportRepository.changeDescription(mockReport, newDescription);
        expect(result.description).toBe(newDescription);
        expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
    });

    it("dovrebbe chiamare save per changeTitle e aggiornare il campo", async () => {
        const newTitle = "New Title Content";
        const result = await reportRepository.changeTitle(mockReport, newTitle);
        expect(result.title).toBe(newTitle);
        expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
    });

    it("dovrebbe chiamare save per update", async () => {
        const reportToUpdate = { ...mockReport, title: "Updated" };
        await reportRepository.update(reportToUpdate);
        expect(mockOrmRepository.save).toHaveBeenCalledWith(reportToUpdate);
    });

    it("dovrebbe chiamare save su photoRepository per addPhotosToReport e impostare la relazione", async () => {
        const photos = [{ photo: "p1" } as ReportPhoto, { photo: "p2" } as ReportPhoto];
        await reportRepository.addPhotosToReport(mockReport, photos);

        expect(mockPhotoRepository.save).toHaveBeenCalledTimes(1);
        const savedPhotos = mockPhotoRepository.save.mock.calls[0][0];
        expect(savedPhotos.length).toBe(2);
        expect(savedPhotos[0].report).toBe(mockReport);
        expect(savedPhotos[1].report).toBe(mockReport);
    });
});