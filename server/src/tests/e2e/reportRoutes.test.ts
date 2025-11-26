import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";

import { router as reportRouter } from "../../routes/reportRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeReportRepositories } from "../../controllers/reportController";
import { StatusType } from "../../models/StatusType";
import { User } from "../../models/User";
import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";
import { hashPassword } from "../../services/passwordService";
import { before } from "node:test";
import { Category } from "../../models/Category";
import { Role } from "../../models/Role";
import { ReportPhoto } from "../../models/ReportPhoto";
import { Report } from "../../models/Report";

// Mock di requireAuth → bypassa l'autenticazione
jest.mock("../../middlewares/authMiddleware", () => ({
    requireAuth: (_req: any, _res: any, next: any) => next()
}));

let app: express.Express;
let testUser: User;
let testOfficer: MunicipalityOfficer;
let reportId: number;
let photoId: number;
let initialReportId: number;

beforeAll(async () => {
    if(TestDataSource.isInitialized) {
        await TestDataSource.destroy();
    }
    await TestDataSource.initialize();
    initializeReportRepositories(TestDataSource);

    app = express();
    app.use(express.json());
    app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.use("/api/reports", reportRouter);

    // Inseriamo un utente e un officer di test

    const roleRepo = TestDataSource.getRepository(Role);
    const officerRole = roleRepo.create({ title: "MUNICIPALITY_OFFICER", label: "Municipality Officer" });
    await roleRepo.save(officerRole);

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
    testOfficer = officerRepo.create({
        username: "officer1",
        email: "officer1@example.com",
        password: await hashPassword("password123"),
        first_name: "Officer",
        last_name: "Uno",
        role: officerRole
    });
    await officerRepo.save(testOfficer);

    const categoryRepo = TestDataSource.getRepository(Category);
    const category = categoryRepo.create({ name: "Strade", roles: [officerRole] });
    await categoryRepo.save(category);

    const reportRepo = TestDataSource.getRepository(Report);
    const initialReport = reportRepo.create({
        longitude: 10.0,
        latitude: 20.0,
        title: "Test Report",
        description: "This is a test report",
        status: StatusType.PendingApproval,
        explanation: "",
        user: testUser,
        category: category,
        officer: testOfficer,
        createdAt: new Date(),
    });
    const savedReport = await reportRepo.save(initialReport);
    initialReportId = savedReport.id;
    reportId = savedReport.id;

    const reportPhotoRepo = TestDataSource.getRepository(ReportPhoto);
    const photo1 = reportPhotoRepo.create({ photo: "photo1.jpg" });
    await reportPhotoRepo.save([photo1]);
});

afterAll(async () => {
    await TestDataSource.destroy();
});

describe("Report Status API E2E", () => {

    test("PUT /api/reports/:id/status → aggiorna lo status", async () => {
        const res = await request(app)
            .put(`/api/reports/${reportId}/status`)
            .send({
                newStatus: "Assigned", // Usa stringa esatta dell'enum!
                explanation: "Assegnato a un officer"
            })
            .expect(200);

        expect(res.body).toHaveProperty("status", "Assigned");
        expect(res.body).toHaveProperty("explanation", "Assegnato a un officer");
    });

    test("PUT /api/reports/:id/status → 400 se campo mancante", async () => {
        await request(app)
            .put(`/api/reports/${reportId}/status`)
            .send({ }) // niente newStatus
            .expect(400);
    });

    test("GET /api/reports/list → ritorna tutti i report", async () => {
        const res = await request(app)
            .get("/api/reports/list")
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

});
