import { TestDataSource } from "../../test-data-source";

import {
    initializeAdminRepositories,
    addMunicipalityOfficer,
    getAllMunicipalityOfficer,
    updateMunicipalityOfficer,
    loginOfficer,
    getAllRoles,
    getMunicipalityOfficerByUsername,
    getMunicipalityOfficerDAOForNewRequest,
    getMunicipalityOfficerDAOByUsername,
    assignTechAgent,
    getAgentsByTechLeadUsername,
    getTechReports,
    getTechLeadReports
} from "../../../controllers/adminController";
import { initializeReportRepositories } from "../../../controllers/reportController";

import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";
import { Role } from "../../../models/Role";
import { Category } from "../../../models/Category";
import { Report } from "../../../models/Report";
import { StatusType } from "../../../models/StatusType";
import { initializeUserRepositories } from "../../../controllers/userController";
import { User } from "../../../models/User";
import { Server as SocketIOServer } from "socket.io";
// --------------------------------------
// SEED UTILI
// --------------------------------------
async function seedRole(title: string = "ORGANIZATION_OFFICER") {
    return TestDataSource.getRepository(Role).save({
        title,
        label: title.replace("_", " ")
    });
}

async function seedOfficer(role: Role, username = "off1") {
    return TestDataSource.getRepository(MunicipalityOfficer).save({
        username,
        email: `${username}@test.com`,
        password: "$2b$10$ABCDEFGHIJKLMNOPQRSTUV", // hash fake
        first_name: "A",
        last_name: "B",
        role
    });
}

async function seedCategory(role: Role) {
    return TestDataSource.getRepository(Category).save({
        name: "Road",
        description: "Street issues",
        roles: [role]
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

async function seedReport(category: Category, officer: MunicipalityOfficer, user: User) {
    const repo = TestDataSource.getRepository(Report);
    return repo.save({
        title: "R1",
        description: "desc",
        latitude: 1,
        longitude: 1,
        status: StatusType.Assigned,
        explanation: "",               // <-- richiesto per not-null
        category,
        officer,
        user
    });
}

// --------------------------------------
// TEST SUITE
// --------------------------------------
describe("AdminController Integration Tests", () => {
    let role: Role;
    let techLead: Role;
    let techAgent: Role;
    let user: User;

    beforeEach(async () => {
        if (TestDataSource.isInitialized) await TestDataSource.destroy();
        await TestDataSource.initialize();

        initializeAdminRepositories(TestDataSource);
        const io = new SocketIOServer();
        initializeReportRepositories(TestDataSource, io);
        initializeUserRepositories(TestDataSource);

        role = await seedRole("ORGANIZATION_OFFICER");
        techLead = await seedRole("TECH_LEAD_ROAD");
        techAgent = await seedRole("TECH_AGENT_ROAD");
        user = await seedUser();
    });

    // ---------------------------
    describe("addMunicipalityOfficer", () => {
        it("crea un officer", async () => {
            const dto = {
                username: "newoff",
                email: "new@test.com",
                password: "pwd",
                first_name: "X",
                last_name: "Y"
            };

            const res = await addMunicipalityOfficer(dto);

            expect(res.username).toBe("newoff");
            expect(res.email).toBe("new@test.com");
        });
    });

    // ---------------------------
    describe("getAllMunicipalityOfficer", () => {
        it("esclude admin", async () => {
            await seedOfficer(role, "off1");
            await seedOfficer(role, "admin");

            const res = await getAllMunicipalityOfficer();

            expect(res.length).toBe(1);
            expect(res[0].username).toBe("off1");
        });
    });

    // ---------------------------
    describe("getAllRoles", () => {
        it("ritorna solo ruoli assegnabili", async () => {
            await seedRole("ADMIN");

            const roles = await getAllRoles();

            expect(roles.find(r => r.title === "ADMIN")).toBeUndefined();
            expect(roles.some(r => r.title === "ORGANIZATION_OFFICER")).toBe(true);
        });
    });

    // ---------------------------
    describe("getMunicipalityOfficerByUsername", () => {
        it("ritorna officer", async () => {
            await seedOfficer(role, "offx");

            const res = await getMunicipalityOfficerByUsername("offx");

            expect(res.username).toBe("offx");
        });
    });

    // ---------------------------
    describe("getMunicipalityOfficerDAOForNewRequest", () => {
        it("prende ORGANIZATION_OFFICER", async () => {
            await seedOfficer(role, "org1");

            const res = await getMunicipalityOfficerDAOForNewRequest();

            expect(res.username).toBe("org1");
        });
    });

    // ---------------------------
    describe("getMunicipalityOfficerDAOByUsername", () => {
        it("ritorna DAO", async () => {
            await seedOfficer(role, "daoUser");

            const res = await getMunicipalityOfficerDAOByUsername("daoUser");

            expect(res.username).toBe("daoUser");
        });
    });

    // ---------------------------
    describe("assignTechAgent", () => {
        it("assegna officer al report", async () => {
            const category = await seedCategory(techLead);
            await seedOfficer(techLead, "lead");
            const agent = await seedOfficer(techAgent, "agent");

            // Officer dummy per il report
            const dummy = await seedOfficer(role, "dummy");
            // Officer extra richiesto dal controller
            await seedOfficer(role, "extra");

            const rep = await seedReport(category, dummy, user);
            console.log("ReportId:", rep.id);

            const res = await assignTechAgent(rep.id, "agent");
            console.log("Response:", res);

            expect(res.officer!.username).toBe("agent");
        });
    });

    // ---------------------------
    describe("getAgentsByTechLeadUsername", () => {
        it("ritorna TECH_AGENT associati", async () => {
            await seedOfficer(techLead, "lead1");
            await seedOfficer(techAgent, "agent1");
            // officer extra richiesto dal controller
            await seedOfficer(role, "extra1");

            const list = await getAgentsByTechLeadUsername("lead1");

            expect(list.length).toBe(1);
            expect(list[0].username).toBe("agent1");
        });
    });

    // ---------------------------
    describe("getTechReports", () => {
        it("ritorna report dell'agente tecnico", async () => {
            const agent = await seedOfficer(techAgent, "agent5");
            const category = await seedCategory(techLead);
            // officer extra
            await seedOfficer(role, "extra2");

            await seedReport(category, agent, user);
            await seedReport(category, agent, user);

            const list = await getTechReports("agent5");

            expect(list.length).toBe(2);
        });
    });

    // ---------------------------
    describe("getTechLeadReports", () => {
        it("ritorna report delle categorie del tech lead", async () => {
            const lead = await seedOfficer(techLead, "lead2");
            const category = await seedCategory(techLead);
            // officer extra
            await seedOfficer(role, "extra3");

            const dummy = await seedOfficer(role, "xx");
            await seedReport(category, lead, user);

            const list = await getTechLeadReports(lead.username);

            expect(list.length).toBe(1);
        });
    });

});
