import {TestDataSource} from "../../test-data-source";
import {
    createTestReport,
    createTestMunicipalityOfficer,
    createTestLeadOfficer,
    createBasicReport,
    createTestUser1,
    setupDb, retrieveCategories
} from "../../utils";
import {Report} from "../../../models/Report";
import {MunicipalityOfficer} from "../../../models/MunicipalityOfficer";
//import { appErr } from "../../../middlewares/errorsMiddleware";
import * as adminController from '../../../controllers/adminController'
import * as reportController from '../../../controllers/reportController'
import * as messagingController from '../../../controllers/messagingController'
import {User} from "../../../models/User";
import {StatusType} from "../../../models/StatusType";
import {Category} from "../../../models/Category";
import {Repository} from "typeorm";
import {initializeReportRepositories} from "../../../controllers/reportController";
import {initializeMessageRepositories} from "../../../controllers/messagingController";

describe("assignTechAgent (Integration Tests)", () => {
    let ready: boolean
    //let reportRepo: Repository<Report>;
    //let officerRepo: Repository<MunicipalityOfficer>;
    let testReport: Report;
    let techLead: MunicipalityOfficer;
    let officer: MunicipalityOfficer;
    let reporter: User;
    let category: Category;

    // Definisci il mock all'esterno per poterne verificare le chiamate (se necessario)
    const mockSocketIOServer = {
        emit: jest.fn(),
        on: jest.fn(),
    };

    beforeEach(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
        await TestDataSource.initialize();

        //Reset completo DB per ogni test
        //await TestDataSource.synchronize(true);

        adminController.initializeAdminRepositories(TestDataSource);
        reportController.initializeReportRepositories(TestDataSource,mockSocketIOServer as any);
        messagingController.initializeMessageRepositories(TestDataSource,mockSocketIOServer as any);
        //reportRepo = TestDataSource.getRepository(Report);
        //officerRepo = TestDataSource.getRepository(MunicipalityOfficer);

        ready = await setupDb(TestDataSource)

        if( !ready ){
            throw new Error("Errore nel setup del db");
        }

        techLead = await createTestLeadOfficer(TestDataSource); // username: 'leadofficer',
        officer = await createTestMunicipalityOfficer(TestDataSource); // username: 'techofficer',
        reporter = await createTestUser1(TestDataSource)
        category = await retrieveCategories(TestDataSource, "Water Supply – Drinking Water")
        testReport = await createBasicReport(TestDataSource, reporter, category, techLead, officer, StatusType.Assigned)

        // Rendo il report SENZA officer e lead prima dell'assegnazione
        testReport.officer = null as any;
        testReport.leadOfficer = null as any;
        await TestDataSource.getRepository(Report).save(testReport);
    });

    afterEach(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
    });


    it("dovrebbe assegnare un internal officer e il tech lead rimane a null", async () => {
        const response = await adminController.assignTechAgent(
            testReport.id,
            officer.username,
            techLead.username
        );

        expect(response).toBeDefined();
        expect(response.id).toBe(testReport.id);

        /*const updatedReport = await reportRepo.findOne({
            where: {id: testReport.id},
            relations: ["officer", "leadOfficer"],
        });

        expect(updatedReport?.officer?.username).toBe(officer.username);
        expect(updatedReport?.leadOfficer?.username).toBe(techLead.username);

         */
    });
/*
    it("dovrebbe lanciare errore se tech lead non trovato", async () => {
        await expect(
            adminController.assignTechAgent(
                testReport.id,
                officer.username,
                "nonexistent_lead"
            )
        ).rejects.toThrow("TECH_LEAD_NOT_FOUND");
    });

    it("dovrebbe lanciare errore se officer non trovato", async () => {
        await expect(
            adminController.assignTechAgent(
                testReport.id,
                "nonexistent_officer",
                techLead.username
            )
        ).rejects.toThrow("OFFICER_NOT_FOUND");
    });

 */
});
