// tests/integration/reportController.test.ts
import { TestDataSource } from "../../test-data-source";
import { User } from "../../../models/User";
import { Category } from "../../../models/Category";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";
import { Role } from "../../../models/Role";
import {
    addReport,
    getAllAcceptedReports,
    getAllReports,
    getReportById,
    getReportsByCategoryIdAndStatus,
    GetReportsByOfficerUsername,
    updateReportOfficer,
    updateReportStatus,
    initializeReportRepositories
} from "../../../controllers/reportController";
import * as adminController from "../../../controllers/adminController";
import { StatusType } from "../../../models/StatusType";
import {initializeAdminRepositories} from "../../../controllers/adminController";
import { Server as SocketIOServer } from "socket.io";
// -------------------
// Setup dei dati
// -------------------
async function seedRole(): Promise<Role> {
    return TestDataSource.getRepository(Role).save({
        title: "ORGANIZATION_OFFICER", // deve corrispondere a quello cercato
        label: "Organization Officer"
    });
}

async function seedUser(): Promise<User> {
    return TestDataSource.getRepository(User).save({
        username: "user1",
        email: "u@test.com",
        password: "pwd",
        first_name: "A",
        last_name: "B",
        photo: "",
        telegram_id: "",
        flag_email: false
    });
}

async function seedCategory(): Promise<Category> {
    return TestDataSource.getRepository(Category).save({
        name: "Road",
        description: "street issues"
    });
}

async function seedOfficer(role: Role): Promise<MunicipalityOfficer> {
    return TestDataSource.getRepository(MunicipalityOfficer).save({
        username: "mofficer",
        email: "moff@test.com",
        password: "pwd",
        first_name: "Mario",
        last_name: "Rossi",
        role: role
    });
}

function buildCreateReportDTO(userId: number, categoryId: number) {
    return {
        longitude: 12.3,
        latitude: 44.1,
        title: "Buche sulla strada",
        description: "Davanti al bar",
        userId,
        categoryId,
        photos: ["a.jpg", "b.jpg"]
    };
}

// -------------------
// Test Suite
// -------------------
describe("ReportController Integration Tests", () => {
    let user: User;
    let category: Category;
    let officer: MunicipalityOfficer;
    let role: Role;

    beforeEach(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
        await TestDataSource.initialize();

        // Inizializza repository reali
        const io = new SocketIOServer();
        initializeReportRepositories(TestDataSource, io);
        initializeAdminRepositories(TestDataSource);

        // Seed dati
        role = await seedRole();
        user = await seedUser();
        category = await seedCategory();
        officer = await seedOfficer(role);
    });

    // ----------------------------------------------------------
    test("addReport → crea report con foto e status PendingApproval", async () => {
        const dto = buildCreateReportDTO(user.id, category.id);
        const result = await addReport(dto);

        expect(result.id).toBeDefined();
        expect(result.title).toBe("Buche sulla strada");
        expect(result.status).toBe(StatusType.PendingApproval);
        expect(result.photos).toHaveLength(2);
    });

    test("updateReportStatus → cambia stato e explanation", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));
        const updated = await updateReportStatus(created.id!, StatusType.Assigned, "OK");

        expect(updated.status).toBe(StatusType.Assigned);
        expect(updated.explanation).toBe("OK");
    });

    test("updateReportOfficer → aggiorna l'ufficiale del report", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));
        const updated = await updateReportOfficer(created.id!, officer);

        expect(updated.officer.username).toBe("mofficer");
    });

    test("getAllReports → ritorna tutti i report", async () => {
        await addReport(buildCreateReportDTO(user.id, category.id));
        await addReport(buildCreateReportDTO(user.id, category.id));

        const all = await getAllReports();
        expect(all.length).toBe(2);
    });

    test("getReportById → ritorna il report richiesto", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));
        const found = await getReportById(created.id!);

        expect(found.id).toBe(created.id);
    });

    test("GetReportsByOfficerUsername → ritorna report assegnati ad un officer", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));
        await updateReportOfficer(created.id!, officer);

        const list = await GetReportsByOfficerUsername("mofficer");
        expect(list.length).toBe(1);
        expect(list[0].officer.username).toBe("mofficer");
    });

    test("getAllAcceptedReports → ritorna solo report con status Assigned", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));
        await updateReportStatus(created.id!, StatusType.Assigned, "ok");

        const res = await getAllAcceptedReports();
        expect(res.length).toBe(1);
        expect(res[0].status).toBe(StatusType.Assigned);
    });

    test("getReportsByCategoryIdAndStatus → filtra per categoria e status", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));
        await updateReportStatus(created.id!, StatusType.Assigned, "ok");

        const list = await getReportsByCategoryIdAndStatus(category.id, [StatusType.Assigned]);
        expect(list.length).toBe(1);
        expect(list[0].category).toBe(category.name);
        expect(list[0].status).toBe(StatusType.Assigned);
    });
});
