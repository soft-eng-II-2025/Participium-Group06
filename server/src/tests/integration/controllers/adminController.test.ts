import {TestDataSource} from "../../test-data-source";
import {
    createTestMunicipalityOfficer,
    createTestLeadOfficer,
    createBasicReport,
    createTestUser1,
    setupDb, retrieveCategories, createTestExternalMunicipalityOfficer
} from "../../utils";
import {Report} from "../../../models/Report";
import {MunicipalityOfficer} from "../../../models/MunicipalityOfficer";
import * as adminController from '../../../controllers/adminController'
import * as reportController from '../../../controllers/reportController'
import * as messagingController from '../../../controllers/messagingController'
import {User} from "../../../models/User";
import {StatusType} from "../../../models/StatusType";
import {Category} from "../../../models/Category";
import {Repository} from "typeorm";
import { CreateOfficerRequestDTO } from "../../../models/DTOs/CreateOfficerRequestDTO";
import { AssignRoleRequestDTO } from "../../../models/DTOs/AssignRoleRequestDTO";
import { MunicipalityOfficerResponseDTO } from "../../../models/DTOs/MunicipalityOfficerResponseDTO";
import { ReportResponseDTO } from "../../../models/DTOs/ReportResponseDTO";


describe("adminController (Integration Tests)", () => {
    let ready: boolean
    let reportRepo: Repository<Report>;
    let officerRepo: Repository<MunicipalityOfficer>;
    let testReport: Report;
    let techLead: MunicipalityOfficer;
    let officer: MunicipalityOfficer;
    let reporter: User;
    let category: Category;
    let externalOfficer: MunicipalityOfficer;
    let testReportForExternalOfficer: Report;

    // Definisce il mock all'esterno per poterne verificare le chiamate (se necessario)
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

        adminController.initializeAdminRepositories(TestDataSource);
        reportController.initializeReportRepositories(TestDataSource, mockSocketIOServer as any);
        messagingController.initializeMessageRepositories(TestDataSource, mockSocketIOServer as any);
        reportRepo = TestDataSource.getRepository(Report);

        ready = await setupDb(TestDataSource)

        if (!ready) {
            throw new Error("Errore nel setup del db");
        }

        techLead = await createTestLeadOfficer(TestDataSource);
        officer = await createTestMunicipalityOfficer(TestDataSource);
        externalOfficer = await createTestExternalMunicipalityOfficer(TestDataSource);
        reporter = await createTestUser1(TestDataSource)
        category = await retrieveCategories(TestDataSource, "Water Supply – Drinking Water")
        testReport = await createBasicReport(TestDataSource, reporter, category, techLead, officer, StatusType.Assigned)
        testReportForExternalOfficer = await createBasicReport(TestDataSource, reporter, category, techLead, externalOfficer, StatusType.Assigned)

        // Rendo il report SENZA officer e lead prima dell'assegnazione
        testReport.officer = null as any;
        testReport.leadOfficer = null as any;
        await TestDataSource.getRepository(Report).save(testReport);
        testReportForExternalOfficer.officer = null as any;
        testReportForExternalOfficer.leadOfficer = null as any;
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

        const updatedReport = await reportRepo.findOne({
            where: {id: testReport.id},
            relations: ["officer", "leadOfficer"],
        });

        expect(updatedReport?.officer?.username).toBe(officer.username);
        expect(updatedReport?.leadOfficer).toBeNull()

    });

    it("dovrebbe assegnare un external officer e il tech lead dovrebbe essere il tech lead di quella categoria", async () => {
        const response = await adminController.assignTechAgent(
            testReportForExternalOfficer.id,
            externalOfficer.username,
            techLead.username
        );

        expect(response).toBeDefined();
        expect(response.id).toBe(testReportForExternalOfficer.id);

        const updatedReport = await reportRepo.findOne({
            where: {id: testReportForExternalOfficer.id},
            relations: ["officer", "leadOfficer"],
        });

        expect(updatedReport?.officer?.username).toBe(externalOfficer.username);
        expect(updatedReport?.leadOfficer?.username).toBe(techLead.username)


    });


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


    describe("Create new Municipality Officer", () => {
        it("dovrebbe creare un nuovo Municipality Officer", async () => {
            const newOfficerData: CreateOfficerRequestDTO = {
                username: "new_officer",
                email: "new_officer@gmail.com",
                password: "securePassword123",
                first_name: "New",
                last_name: "Officer",
                external: false
            }

            const newOfficer = await adminController.addMunicipalityOfficer(newOfficerData);

            expect(newOfficer).toBeDefined();
            expect(newOfficer.username).toBe(newOfficerData.username);
            expect(newOfficer.email).toBe(newOfficerData.email);
            expect(newOfficer.first_name).toBe(newOfficerData.first_name);
            expect(newOfficer.last_name).toBe(newOfficerData.last_name);
            expect(newOfficer.external).toBe(newOfficerData.external);

        });

        it("dovrebbe lanciare errore se si prova a creare un officer senza password", async () => {
            const newOfficerData: CreateOfficerRequestDTO = {
                username: "new_officer",
                email: "new_officer@gmail.com",
                password: "",
                first_name: "New",
                last_name: "Officer",
                external: false
            }

            await expect(adminController.addMunicipalityOfficer(newOfficerData)).rejects.toThrow("PASSWORD_REQUIRED");
        });
    });


    describe("Get all Municipality Officers", () => {
        it("dovrebbe ritornare tutti i Municipality Officers esistenti", async () => {
            const allOfficers = await adminController.getAllMunicipalityOfficer();

            expect(allOfficers).toBeDefined();
            expect(allOfficers.length).toBe(3); // techLead, officer, externalOfficer (creati nel beforeEach)
        });
    });


    describe("Update Municipality Officer", () => {
        it("dovrebbe aggiornare un Municipality Officer assegnandogli un ruolo", async () => {
            const newOfficerData: CreateOfficerRequestDTO = {
                username: "new_officer",
                email: "new_officer@gmail.com",
                password: "securePassword123",
                first_name: "New",
                last_name: "Officer",
                external: false
            }

            const newOfficer = await adminController.addMunicipalityOfficer(newOfficerData);
            const officerData: AssignRoleRequestDTO = {
                username: newOfficer.username,
                rolesTitle: ["TECH_AGENT_INFRASTRUCTURE"],
                external: false,
                companyName: null
            }
            const updatedOfficer = await adminController.updateMunicipalityOfficer(officerData);
            expect(updatedOfficer).toBeDefined();
            expect(updatedOfficer.username).toBe(newOfficer.username);
            expect(updatedOfficer.roles).toBeDefined();
            expect(updatedOfficer.roles[0]).toBe("TECH_AGENT_INFRASTRUCTURE");
        });

        it("dovrebbe lanciare errore se si prova ad aggiornare l'admin", async () => {
            const officerData: AssignRoleRequestDTO = {
                username: "admin",
                rolesTitle: ["TECH_AGENT_INFRASTRUCTURE"],
                external: false,
                companyName: null
            }
            await expect(adminController.updateMunicipalityOfficer(officerData)).rejects.toThrow("FORBIDDEN_ADMIN_ACCOUNT");
        });

        it("dovrebbe lanciare errore se si prova ad aggiornare un officer non esistente", async () => {
            const officerData: AssignRoleRequestDTO = {
                username: "nonexistent_officer",
                rolesTitle: ["TECH_AGENT_INFRASTRUCTURE"],
                external: false,
                companyName: null
            }
            await expect(adminController.updateMunicipalityOfficer(officerData)).rejects.toThrow("OFFICER_NOT_FOUND");
        });

        // it("dovrebbe lanciare errore se si prova ad assegnare un ruolo già assegnato", async () => {
        //     const officerData: AssignRoleRequestDTO = {
        //         username: officer.username,
        //         rolesTitle: ["TECH_AGENT_INFRASTRUCTURE"],
        //         external: false,
        //         companyName: null
        //     }
        //     // Prima assegnazione del ruolo
        //     await expect(adminController.updateMunicipalityOfficer(officerData)).rejects.toThrow("ROLE_ALREADY_ASSIGNED");
        // });
                
    });


    describe("Get Officer By Username", () => {
        it("dovrebbe ritornare un officer dato l'username", async () => {
            const retrievedOfficer = await adminController.getMunicipalityOfficerByUsername(officer.username);

            expect(retrievedOfficer).toBeDefined();
            expect(retrievedOfficer.first_name).toBe(officer.first_name);
            expect(retrievedOfficer.last_name).toBe(officer.last_name);
        });

        it("dovrebbe lanciare errore di officer not found", async () => {
            await expect(adminController.getMunicipalityOfficerByUsername("ciao")).rejects.toThrow("OFFICER_NOT_FOUND");
        });
    });


    describe("Get Officer DAO for new request", () => {
        it("dovrebbe lanciare errore No officer available", async () => {
            await expect(adminController.getMunicipalityOfficerDAOForNewRequest()).rejects.toThrow("NO_OFFICER_AVAILABLE");
        });
    });


    describe("get officerDAO by username", () => {
        it("dovrebbe ritornare un officerDAO", async () => {
            const retrievedOfficer: MunicipalityOfficer = await adminController.getMunicipalityOfficerDAOByUsername(officer.username);

            expect(retrievedOfficer).toBeDefined();
            expect(retrievedOfficer.username).toBe(officer.username);
        });
    });


    describe("get agents by tech-lead username", () => {
        it("dovrebbe ritornare la lista degli agenti che hanno il ruolo del tech lead", async () => {
            const retrievedOfficers: MunicipalityOfficerResponseDTO[] = await adminController.getAgentsByTechLeadUsername(techLead.username);

            expect(retrievedOfficers).toBeDefined();
            expect(retrievedOfficers.length).toBe(2);
        });
    });


    describe("get tech reports", () => {
        it("dovrebbe ritornare la lista dei report associati a un tech agent", async () => {
            await adminController.assignTechAgent(testReport.id, officer.username, techLead.username);
            const retrievedReports: ReportResponseDTO[] = await adminController.getTechReports(officer.username);

            expect(retrievedReports).toBeDefined();
            expect(retrievedReports.length).toBe(1);
        });
    });


    describe("get tech lead reports", () => {
        it("dovrebbe ritornare la lista dei report associati a un tech agent", async () => {
            const retrievedReports: ReportResponseDTO[] = await adminController.getTechLeadReports(techLead.username);

            expect(retrievedReports).toBeDefined();
            expect(retrievedReports.length).toBe(2);
        });
    });


    describe("get officer by id", () => {
        it("dovrebbe ritornare l'officer dato l'id", async () => {
            const retrievedOfficer = await adminController.getOfficerById(officer.id);

            expect(retrievedOfficer).toBeDefined();
            expect(retrievedOfficer.username).toBe(officer.username);
        });
    })


    describe("get officer id by email", () => {
        it("dovrebbe ritornare l'officer id data l'email", async () => {
            const retrievedOfficerId = await adminController.getOfficerIdByEmail(officer.email);

            expect(retrievedOfficerId).toBeDefined();
            expect(retrievedOfficerId).toBe(officer.id);
        });
    })


    describe("get officer id by username", () => {
        it("dovrebbe ritornare l'officer id dato l'username", async () => {
            const retrievedOfficerId = await adminController.getOfficerIdByUsername(officer.username);

            expect(retrievedOfficerId).toBeDefined();
            expect(retrievedOfficerId).toBe(officer.id);
        });
    })
});
