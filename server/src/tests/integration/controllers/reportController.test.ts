import {TestDataSource} from "../../test-data-source";
import {
    createTestMunicipalityOfficer,
    createTestLeadOfficer,
    createBasicReport,
    createTestUser1,
    setupDb,
    retrieveCategories,
    createTestExternalMunicipalityOfficer
} from "../../utils";
import {Report} from "../../../models/Report";
import {MunicipalityOfficer} from "../../../models/MunicipalityOfficer";
import * as reportController from '../../../controllers/reportController'
import * as messagingController from '../../../controllers/messagingController'
import {User} from "../../../models/User";
import {StatusType} from "../../../models/StatusType";
import {Category} from "../../../models/Category";
import {Repository} from "typeorm";
import {Chat} from "../../../models/Chat";
import {ChatType} from "../../../models/ChatType"
import * as adminController from "../../../controllers/adminController";
import { CreateReportRequestDTO } from "../../../models/DTOs/CreateReportRequestDTO";



describe("Report Controller (Pure Integration Tests)", () => {
    let ready: boolean
    let reportRepo: Repository<Report>;
    let chatRepo: Repository<Chat>;
    let testReport: Report;
    let techLead: MunicipalityOfficer;
    let internalOfficer: MunicipalityOfficer;
    let externalOfficer: MunicipalityOfficer;
    let reporter: User;
    let category: Category;

    // Mock per il server Socket.IO (necessario, ma non si verifica il suo funzionamento)
    const mockSocketIOServer = {
        emit: jest.fn(),
        on: jest.fn(),
    };

    beforeEach(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
        await TestDataSource.initialize();

        // Inizializzazione di tutti i repository
        reportController.initializeReportRepositories(TestDataSource, mockSocketIOServer as any);
        messagingController.initializeMessageRepositories(TestDataSource, mockSocketIOServer as any);
        adminController.initializeAdminRepositories(TestDataSource);


        reportRepo = TestDataSource.getRepository(Report);
        chatRepo = TestDataSource.getRepository(Chat);

        ready = await setupDb(TestDataSource)

        if (!ready) {
            throw new Error("Errore nel setup del db");
        }

        // Creazione degli utenti e dei dati di base
        techLead = await createTestLeadOfficer(TestDataSource);
        internalOfficer = await createTestMunicipalityOfficer(TestDataSource);
        externalOfficer = await createTestExternalMunicipalityOfficer(TestDataSource);
        reporter = await createTestUser1(TestDataSource)
        category = await retrieveCategories(TestDataSource, "Water Supply – Drinking Water")

        // Crea un report esistente da aggiornare
        testReport = await createBasicReport(TestDataSource, reporter, category, techLead, internalOfficer, StatusType.Assigned, false);

        // Pulisci le assegnazioni iniziali nel DB per il report di test
        testReport.officer = null as any;
        testReport.leadOfficer = null as any;
        await reportRepo.save(testReport);
    });

    afterEach(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
    });

    // --- Scenario 1: Officer Interno ---
    it("dovrebbe assegnare un INTERNAL officer, lead NULL, e creare 1 record di chat Officer-User nel DB", async () => {
        const reportId = testReport.id;

        await reportController.updateReportOfficer(
            reportId,
            internalOfficer,
            techLead
        );

        const updatedReport = await reportRepo.findOne({
            where: {id: reportId},
            relations: ["officer", "leadOfficer"],
        });

        // Verifica assegnazione DB
        expect(updatedReport?.officer?.username).toBe(internalOfficer.username);
        expect(updatedReport?.leadOfficer).toBeNull();

        // Verifica creazione chat nel DB
        const chats = await chatRepo.find({
            where: { report: { id: reportId } as any },
            relations: ['report']
        });

        expect(chats.length).toBe(1);
        expect(chats[0].type).toBe(ChatType.OFFICER_USER);
    });

    // --- Scenario 2: Officer Esterno ---
    it("dovrebbe assegnare un EXTERNAL officer, assegnare il lead, e creare 2 record di chat nel DB (Officer-User e Lead-External)", async () => {
        const reportId = testReport.id;

        await reportController.updateReportOfficer(
            reportId,
            externalOfficer,
            techLead
        );

        const updatedReport = await reportRepo.findOne({
            where: {id: reportId},
            relations: ["officer", "leadOfficer"],
        });

        // Verifica assegnazione DB
        expect(updatedReport?.officer?.username).toBe(externalOfficer.username);
        expect(updatedReport?.leadOfficer?.username).toBe(techLead.username);

        // Verifica creazione chat nel DB
        const chats = await chatRepo.find({
            where: { report: { id: reportId } as any }
        });

        expect(chats.length).toBe(2);

        // Verifica che entrambi i tipi di chat siano presenti
        const chatTypes = chats.map(c => c.type).sort();
        expect(chatTypes).toEqual([ChatType.LEAD_EXTERNAL, ChatType.OFFICER_USER]);
    });

    // --- Scenario 3: Errori ---
    it("dovrebbe lanciare REPORT_NOT_FOUND se l'ID del report non esiste", async () => {
        const nonExistentId = 99999;

        await expect(
            reportController.updateReportOfficer(
                nonExistentId,
                internalOfficer,
                techLead
            )
        ).rejects.toThrow('REPORT_NOT_FOUND');
    });


    describe("add report", () => {
        it("dovrebbe aggiungere un report", async () => {
            const reportData: CreateReportRequestDTO = {
                anonymous: false,
                longitude: 0,
                latitude: 0,
                title: "prova",
                description: "prova",
                userId: 1,
                categoryId: category.id,
                photos: ["photo.jpg"]
            }

            const reportResponse = await reportController.addReport(reportData);

            expect(reportResponse).toBeDefined();
            expect(reportResponse.title).toBe(reportData.title);
            expect(reportResponse.status).toBe("Pending Approval");
        });
    });


    describe("update report status", () => {
        it("dovrebbe aggiornare lo status del report", async () => {
            const reportResponse = await reportController.updateReportStatus(1, StatusType.Rejected, "Wrong category");

            expect(reportResponse).toBeDefined();
            expect(reportResponse.status).toBe(StatusType.Rejected);
            expect(reportResponse.explanation).toBe("Wrong category");
        });
    });


    describe("get all reports", () => {
        it("dovrebbe ritornare la lista di report", async () => {
            const reportRetrieve = await reportController.getAllReports();

            expect(reportRetrieve).toBeDefined();
            expect(reportRetrieve.length).toBe(1);
        });
    });


    describe("get report by id", () => {
        it("dovrebbe ritornare il report dato l'id", async () => {
            const retrievedReport = await reportController.getReportById(testReport.id);

            expect(retrievedReport).toBeDefined();
            expect(retrievedReport.title).toBe(testReport.title);
        });

        it("dovrebbe lanciare errore REPORT_NOT_FOUND", async () => {
            await expect(reportController.getReportById(99)).rejects.toThrow("REPORT_NOT_FOUND");
        });
    });


    describe("get reports by officer username", () => {
        it("dovrebbe restituire la lista dei report dato l'username dell'officer", async () => {
            await reportController.updateReportOfficer(testReport.id, internalOfficer, techLead);
            const retrievedReport = await reportController.GetReportsByOfficerUsername(internalOfficer.username);

            expect(retrievedReport).toBeDefined();
            expect(retrievedReport.length).toBe(1);
        });
    });


    describe("get all accepted reports", () => {
        it("dovrebbe ritornare la lista dei report accettato (non rejected e non pending approval)", async () => {
            const retrievedReport = await reportController.getAllAcceptedReports();

            expect(retrievedReport).toBeDefined();
            expect(retrievedReport.length).toBe(1);
        });
    });


    describe("get reports by category id and status", () => {
        it("dovrebbe ritornare i report di quella categoria con quello stato", async () => {
            const retrievedReport = await reportController.getReportsByCategoryIdAndStatus(category.id, [StatusType.Assigned]);

            expect(retrievedReport).toBeDefined();
            expect(retrievedReport.length).toBe(1);
        });;
    });


    describe("get user reports", () => {
        it("dovrebbe ritornare la lista dei report di un utente", async () => {
            const retrievedReport = await reportController.getUserReports(reporter.id);

            expect(retrievedReport).toBeDefined();
            expect(retrievedReport.length).toBe(1);
        });
    });
});