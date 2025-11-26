import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";

import { router as techRouter } from "../../routes/techRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeAdminRepositories } from "../../controllers/adminController";
import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";
import { Role } from "../../models/Role";
import { hashPassword } from "../../services/passwordService";
import { User } from "../../models/User";
import { Category } from "../../models/Category";
import { StatusType } from "../../models/StatusType";
import { Report } from "../../models/Report";

// MOCK middleware per bypassare autenticazione
jest.mock("../../middlewares/authMiddleware", () => ({
    requireTechAgent: (req: any, _res: any, next: any) => {
        req.user = { username: "agent1" }; // Simula TechAgent
        next();
    }
}));

let app: express.Express;
let testUser: User;
let techAgent: MunicipalityOfficer;
let testCategory: Category;
let testReport: Report;

beforeAll(async () => {
    await TestDataSource.initialize();
    initializeAdminRepositories(TestDataSource);

    app = express();
    app.use(express.json());
    app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use("/tech", techRouter);

    const roleRepo = TestDataSource.getRepository(Role);
    const techAgentRole = roleRepo.create({ title: "TECH_AGENT_WASTE", label: "Tech Agent Waste" });
    await roleRepo.save(techAgentRole);

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

    techAgent = officerRepo.create({
        username: "agent1",
        email: "agent1@example.com",
        password: await hashPassword("password123"),
        first_name: "Agent",
        last_name: "Uno",
        role: techAgentRole
    });
    await officerRepo.save(techAgent);

    const categoryRepo = TestDataSource.getRepository(Category);
    testCategory = categoryRepo.create({ name: "Rifiuti", roles: [techAgentRole] });
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
        officer: techAgent,
        createdAt: new Date()
    });
    await reportRepo.save(testReport);
});

afterAll(async () => {
    await TestDataSource.destroy();
});

describe("Tech Routes E2E", () => {
    test("GET /tech/reports/list → ritorna i report assegnati al TechAgent", async () => {
        const res = await request(app).get("/tech/reports/list").expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].id).toBe(testReport.id);
        expect(res.body[0].officer.username).toBe("agent1");
        expect(res.body[0].title).toBe("Segnalazione Rifiuti");
    });
});
