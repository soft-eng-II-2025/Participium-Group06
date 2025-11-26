import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";

import { router as techLeadRouter } from "../../routes/tech-leadRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeAdminRepositories } from "../../controllers/adminController";
import { initializeUserRepositories } from "../../controllers/userController";
import { initializeReportRepositories } from "../../controllers/reportController";
import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";
import { Role } from "../../models/Role";
import { hashPassword } from "../../services/passwordService";
import { User } from "../../models/User";
import { Category } from "../../models/Category";
import { StatusType } from "../../models/StatusType";
import { Report } from "../../models/Report";

// MOCK middleware per bypassare autenticazione
jest.mock("../../middlewares/authMiddleware", () => ({
    requireTechLead: (req: any, _res: any, next: any) => {
        req.user = { username: "techlead1" };
        next();
    }
}));

let app: express.Express;
let testUser: User;
let techLead: MunicipalityOfficer;
let techAgent1: MunicipalityOfficer;
let techAgent2: MunicipalityOfficer;
let testCategory: Category;
let testReport: Report;

beforeAll(async () => {
    await TestDataSource.initialize();
    initializeAdminRepositories(TestDataSource);
    initializeUserRepositories(TestDataSource);
    initializeReportRepositories(TestDataSource);

    app = express();
    app.use(express.json());
    app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use("/techlead", techLeadRouter);

    const roleRepo = TestDataSource.getRepository(Role);
    const techLeadRole = roleRepo.create({ title: "TECH_LEAD_WASTE", label: "Tech Lead Waste" });
    const techAgentRole = roleRepo.create({ title: "TECH_AGENT_WASTE", label: "Tech Agent Waste" });
    await roleRepo.save([techLeadRole, techAgentRole]);

    const userRepo = TestDataSource.getRepository(User);
    testUser = userRepo.create({
        username: "mario",
        email: "mario@example.com",
        password: await hashPassword("password123"),
        first_name: "Mario",
        last_name: "Rossi",
        photo: "",
        telegram_id: "",
        flag_email: false,
    });
    await userRepo.save(testUser);

    const officerRepo = TestDataSource.getRepository(MunicipalityOfficer);

    // TechLead
    techLead = officerRepo.create({
        username: "techlead1",
        email: "techlead1@example.com",
        password: await hashPassword("passwordTL"),
        first_name: "Tech",
        last_name: "Lead",
        role: techLeadRole
    });
    await officerRepo.save(techLead);

    // Tech Agents
    techAgent1 = officerRepo.create({
        username: "agent1",
        email: "agent1@example.com",
        password: await hashPassword("password123"),
        first_name: "Agent",
        last_name: "Uno",
        role: techAgentRole
    });
    techAgent2 = officerRepo.create({
        username: "agent2",
        email: "agent2@example.com",
        password: await hashPassword("password123"),
        first_name: "Agent",
        last_name: "Due",
        role: techAgentRole
    });
    await officerRepo.save([techAgent1, techAgent2]);

    const categoryRepo = TestDataSource.getRepository(Category);
    testCategory = categoryRepo.create({ name: "Rifiuti", roles: [techLeadRole, techAgentRole] });
    await categoryRepo.save(testCategory);

    const reportRepo = TestDataSource.getRepository(Report);
    testReport = reportRepo.create({
        longitude: 10.0,
        latitude: 20.0,
        title: "Segnalazione Rifiuti",
        description: "Cestino pieno",
        status: StatusType.Assigned,
        explanation: "",
        user: testUser,
        category: testCategory,
        officer: techAgent1,
        createdAt: new Date()
    });
    await reportRepo.save(testReport);
});

afterAll(async () => {
    await TestDataSource.destroy();
});

describe("TechLead Routes E2E", () => {

    test("GET /techlead/agents → ritorna gli agenti del TechLead", async () => {
        const res = await request(app).get("/techlead/agents").expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
        expect(res.body.some((o: any) => o.username === "agent1")).toBe(true);
        expect(res.body.some((o: any) => o.username === "agent2")).toBe(true);
    });

    test("GET /techlead/reports/list → ritorna i report assegnati al TechLead", async () => {
        const res = await request(app).get("/techlead/reports/list").expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((r: any) => r.id === testReport.id)).toBe(true);
    });

    test("PUT /techlead/report/:reportId → assegna un agente a un report", async () => {
        const res = await request(app)
            .put(`/techlead/report/${testReport.id}`)
            .send({ officerUsername: "agent2" })
            .expect(200);

        expect(res.body).toHaveProperty("officer");
        expect(res.body.officer.username).toBe("agent2");
    });
});
