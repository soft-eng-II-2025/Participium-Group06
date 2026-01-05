import {TestDataSource} from "../../test-data-source";
import {
    createTestMunicipalityOfficer,
    createTestLeadOfficer,
    createBasicReport,
    createTestUser1,
    setupDb,
    retrieveCategories,
    createTestChatOfficerUser,
    createTestChatLeadExternal,
    createTestMessageOfficerUser
} from "../../utils";
import {Report} from "../../../models/Report";
import {MunicipalityOfficer} from "../../../models/MunicipalityOfficer";
import * as reportController from '../../../controllers/reportController'
import * as messagingController from '../../../controllers/messagingController'
import {User} from "../../../models/User";
import {StatusType} from "../../../models/StatusType";
import {Category} from "../../../models/Category";
import {Chat} from "../../../models/Chat";
import {ChatType} from "../../../models/ChatType"
import * as adminController from "../../../controllers/adminController";
import * as notificationController from "../../../controllers/notificationController";
import { CreateMessageDTO } from "../../../models/DTOs/CreateMessageDTO";
import { SenderType } from "../../../models/SenderType";


describe("Messaging Controller Integration Tests", () => {
    let ready: boolean
    let testReport: Report;
    let techLead: MunicipalityOfficer;
    let internalOfficer: MunicipalityOfficer;
    let reporter: User;
    let category: Category;
    let chatUserOfficer: Chat;
    let chatLeadExternal: Chat;

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
        notificationController.initializeNotificationController(TestDataSource);

        ready = await setupDb(TestDataSource)

        if (!ready) {
            throw new Error("Errore nel setup del db");
        }

        // Creazione degli utenti e dei dati di base
        techLead = await createTestLeadOfficer(TestDataSource);
        internalOfficer = await createTestMunicipalityOfficer(TestDataSource);
        reporter = await createTestUser1(TestDataSource)
        category = await retrieveCategories(TestDataSource, "Water Supply – Drinking Water")

        // Crea un report esistente da aggiornare
        testReport = await createBasicReport(TestDataSource, reporter, category, techLead, internalOfficer, StatusType.Assigned, false);
        chatUserOfficer = await createTestChatOfficerUser(TestDataSource, testReport);
        chatLeadExternal = await createTestChatLeadExternal(TestDataSource, testReport);
    });

    afterEach(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
    });


    describe("create chat officer user", () => {
        it("dovrebbe ritornare la chat tra officer e user", async () => {
            const chatCreated = await messagingController.createChatOfficerUser(testReport);

            expect(chatCreated).toBeDefined();
            expect(chatCreated.report.id).toBe(testReport.id);
        });
    });

    
    describe("create chat lead external", () => {
        it("dovrebbe ritornare la chat tra lead ed external", async () => {
            const chatCreated = await messagingController.createChatLeadExternal(testReport);

            expect(chatCreated).toBeDefined();
            expect(chatCreated.report.id).toBe(testReport.id);
        });
    });


    describe("send message", () => {
        it("dovrebbe mandare un messaggio a uno user", async () => {
            const messageDTO: CreateMessageDTO = {
                content: "Ciao",
                sender: SenderType.OFFICER
            }
            const messageResponse = await messagingController.sendMessage(chatUserOfficer.id, messageDTO);
            expect(messageResponse).toBeDefined();
            expect(messageDTO.sender).toBe(SenderType.OFFICER);
            expect(messageResponse.content).toBe(messageDTO.content);
        });

        it("dovrebbe mandare un messaggio a un external", async () => {
            const messageDTO: CreateMessageDTO = {
                content: "Ciao",
                sender: SenderType.LEAD
            }
            const messageResponse = await messagingController.sendMessage(chatLeadExternal.id, messageDTO);

            expect(messageResponse).toBeDefined();
            expect(messageDTO.sender).toBe(SenderType.LEAD);
            expect(messageResponse.content).toBe(messageDTO.content);
        });

        it("dovrebbe mandare un messaggio a un lead", async () => {
            const messageDTO: CreateMessageDTO = {
                content: "Ciao",
                sender: SenderType.EXTERNAL
            }
            const messageResponse = await messagingController.sendMessage(chatLeadExternal.id, messageDTO);

            expect(messageResponse).toBeDefined();
            expect(messageDTO.sender).toBe(SenderType.EXTERNAL);
            expect(messageResponse.content).toBe(messageDTO.content);
        });
    });

    describe("get messages by report", () => {
        it("dovrebbe ritornare tutti i messaggi dato un report id e un tipo di chat", async () => {
            await createTestMessageOfficerUser(TestDataSource, chatUserOfficer);
            const messageOfficerUser = await messagingController.getMessagesByReport(testReport.id, ChatType.OFFICER_USER);

            expect(messageOfficerUser).toBeDefined();
            expect(messageOfficerUser.length).toBe(1);
        });
    });

});