// ------------------------------------------------------------------
// Utility per creare utente, categoria, ruolo e officer prima dei test
// ------------------------------------------------------------------
import {TestDataSource} from "../../test-data-source";
import {User} from "../../../models/User";
import {Category} from "../../../models/Category";
import {MunicipalityOfficer} from "../../../models/MunicipalityOfficer";
import {Role} from "../../../models/Role";
import {
    addReport,
    getAllAcceptedReports,
    getAllReports,
    getReportById,
    getReportsByCategoryIdAndStatus,
    GetReportsByOfficerUsername,
    updateReportOfficer,
    updateReportStatus,
} from "../../../controllers/reportController";
import {StatusType} from "../../../models/StatusType";
import * as reportController from "../../../controllers/reportController";
import * as adminController from '../../../controllers/adminController';

async function seedRole(): Promise<Role> {
    const repo = TestDataSource.getRepository(Role);
    return repo.save({
        title: "Municipality_Officer",
        label: "Municipality Officer"
    });
}

async function seedUser() {
    const repo = TestDataSource.getRepository(User);
    return repo.save({
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

async function seedCategory() {
    const repo = TestDataSource.getRepository(Category);
    return repo.save({
        name: "Road",
        description: "street issues"
    });
}

async function seedOfficer(role: Role): Promise<MunicipalityOfficer> {
    const repo = TestDataSource.getRepository(MunicipalityOfficer);
    return await repo.save({
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

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------
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

        // Seed dati
        role = await seedRole();
        user = await seedUser();
        category = await seedCategory();
        officer = await seedOfficer(role);

        // Inizializza repository del controller (obbligatorio!)
        reportController.initializeReportRepositories(TestDataSource);

        // Mock della funzione che altrimenti crasha
        jest.spyOn(adminController, 'getMunicipalityOfficerDAOForNewRequest')
            .mockImplementation(async () => officer);
        // Mock per getMunicipalityOfficerDAOByUsername
        jest.spyOn(adminController, 'getMunicipalityOfficerDAOByUsername')
            .mockImplementation(async (username: string) => officer);
    });

    // ----------------------------------------------------------
    // addReport
    // ----------------------------------------------------------
    test("addReport → crea report con foto e status PendingApproval", async () => {
        const dto = buildCreateReportDTO(user.id, category.id);

        const result = await addReport(dto);

        expect(result.id).toBeDefined();
        expect(result.title).toBe("Buche sulla strada");
        expect(result.status).toBe(StatusType.PendingApproval);
        expect(result.photos).toHaveLength(2);
    });

    // ----------------------------------------------------------
    // updateReportStatus
    // ----------------------------------------------------------
    test("updateReportStatus → cambia stato e explanation", async () => {
        const dto = buildCreateReportDTO(user.id, category.id);
        const created = await addReport(dto);

        const updated = await updateReportStatus(created.id!, StatusType.Assigned, "OK");

        expect(updated.status).toBe(StatusType.Assigned);
        expect(updated.explanation).toBe("OK");
    });

    // ----------------------------------------------------------
    // updateReportOfficer
    // ----------------------------------------------------------
    test("updateReportOfficer → aggiorna l'ufficiale del report", async () => {
        const dto = buildCreateReportDTO(user.id, category.id);
        const created = await addReport(dto);

        const updated = await updateReportOfficer(created.id!, officer);

        expect(updated.officer.username).toBe("mofficer");
    });

    // ----------------------------------------------------------
    // getAllReports
    // ----------------------------------------------------------
    test("getAllReports → ritorna tutti i report", async () => {
        await addReport(buildCreateReportDTO(user.id, category.id));
        await addReport(buildCreateReportDTO(user.id, category.id));

        const all = await getAllReports();

        expect(all.length).toBe(2);
    });

    // ----------------------------------------------------------
    // getReportById
    // ----------------------------------------------------------
    test("getReportById → ritorna il report richiesto", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));

        const found = await getReportById(created.id!);

        expect(found.id).toBe(created.id);
    });

    // ----------------------------------------------------------
    // GetReportsByOfficerUsername
    // ----------------------------------------------------------
    test("GetReportsByOfficerUsername → ritorna report assegnati ad un officer", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));

        await updateReportOfficer(created.id!, officer);

        const list = await GetReportsByOfficerUsername("mofficer");

        expect(list.length).toBe(1);
        expect(list[0].officer.username).toBe("mofficer");
    });

    // ----------------------------------------------------------
    // getAllAcceptedReports
    // ----------------------------------------------------------
    test("getAllAcceptedReports → ritorna solo report con status Assigned", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));

        await updateReportStatus(created.id!, StatusType.Assigned, "ok");

        const res = await getAllAcceptedReports();

        expect(res.length).toBe(1);
        expect(res[0].status).toBe(StatusType.Assigned);
    });

    // ----------------------------------------------------------
    // getReportsByCategoryIdAndStatus
    // ----------------------------------------------------------
    test("getReportsByCategoryIdAndStatus → filtra per categoria e status", async () => {
        const created = await addReport(buildCreateReportDTO(user.id, category.id));

        await updateReportStatus(created.id!, StatusType.Assigned, "ok");

        const list = await getReportsByCategoryIdAndStatus(category.id, [StatusType.Assigned]);

        expect(list.length).toBe(1);
        expect(list[0].category).toBe(category.name);
        expect(list[0].status).toBe(StatusType.Assigned);
    });

});
