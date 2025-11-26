import "reflect-metadata"; // necessario per class-validator
import request from "supertest";
import express, { Request, Response } from "express";
import session from "express-session";
import passport from "passport";
import { router as userRouter } from "../../routes/userRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeReportRepositories } from "../../controllers/reportController";
import { initializeAdminRepositories } from "../../controllers/adminController";
import { initializeUserRepositories } from "../../controllers/userController";
import { User } from "../../models/User";
import { Category } from "../../models/Category";
import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";
import { Role } from "../../models/Role";

// 🔥 MOCK AUTH: req.user sempre presente
jest.mock("../../middlewares/authMiddleware", () => ({
    requireUser: (req: any, _res: any, next: any) => {
        req.user = { username: "testuser" };
        next();
    },
    requireAuth: (req: any, _res: any, next: any) => next(),
}));

describe("User Routes E2E (senza multer)", () => {
    let app: express.Express;
    let testUser: User;
    let testCategory: Category;
    let testOfficer: MunicipalityOfficer;

    beforeAll(async () => {
        await TestDataSource.initialize();
        initializeReportRepositories(TestDataSource);
        initializeAdminRepositories(TestDataSource);
        initializeUserRepositories(TestDataSource);

        app = express();
        app.use(express.json());
        app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use("/users", userRouter);

        // Ruolo e utenti di test
        const roleRepo = TestDataSource.getRepository(Role);
        const officerRole = roleRepo.create({ title: "ORGANIZATION_OFFICER", label: "Organization Officer" });
        await roleRepo.save(officerRole);

        const userRepo = TestDataSource.getRepository(User);
        testUser = userRepo.create({
            username: "testuser",
            email: "testuser@example.com",
            password: "hashedpassword",
            first_name: "Test",
            last_name: "User",
            photo: "",
            telegram_id: "",
            flag_email: false
        });
        await userRepo.save(testUser);

        const officerRepo = TestDataSource.getRepository(MunicipalityOfficer);
        testOfficer = officerRepo.create({
            username: "officer1",
            email: "officer1@example.com",
            password: "hashedpassword",
            first_name: "Officer",
            last_name: "Uno",
            role: officerRole
        });
        await officerRepo.save(testOfficer);

        const categoryRepo = TestDataSource.getRepository(Category);
        testCategory = categoryRepo.create({ name: "Strade", roles: [officerRole] });
        await categoryRepo.save(testCategory);
    });

    afterAll(async () => {
        await TestDataSource.destroy();
    });

    test("POST /users/reports → crea un nuovo report (bypass foto come stringhe)", async () => {
        const payload = {
            longitude: 12.34,
            latitude: 45.67,
            title: "Problema Stradale",
            description: "Buco in strada",
            userId: testUser.id,
            categoryId: testCategory.id,
            photos: ["photo1.jpg", "photo2.jpg"]
        };

        const res = await request(app).post("/users/reports").send(payload).expect(201);
        //expect(res.body).toHaveProperty("title", "Problema Stradale");
        //expect(res.body).toHaveProperty("description", "Buco in strada");
        //expect(res.body.officer).toHaveProperty("username", "officer1");
        expect(Array.isArray(res.body.photos)).toBe(true);
        expect(res.body.photos.length).toBe(2);
    });

    test("GET /users/reports/categories → ritorna le categorie", async () => {
        const res = await request(app).get("/users/reports/categories").expect(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.some((c: any) => c.name === "Strade")).toBe(true);
    });

    test("PUT /users/me → aggiorna profilo utente JSON", async () => {
        const payload = {
            telegram_id: "12345",
            flag_email: true,
            photo: "avatar.jpg"
        };

        const res = await request(app).put("/users/me").send(payload).expect(200);
        expect(res.body.telegram_id).toBe("12345");
        expect(res.body.flag_email).toBe(true);
        expect(res.body.photo).toBe("avatar.jpg");
    });
});
