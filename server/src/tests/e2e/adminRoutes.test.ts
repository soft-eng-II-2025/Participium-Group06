import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";

import { router as adminRouter } from "../../routes/adminRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeAdminRepositories } from "../../controllers/adminController";
import { Role } from "../../models/Role";
import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";
import { hashPassword } from "../../services/passwordService";

// Mock di requireAdmin → bypassa l'autenticazione
jest.mock("../../middlewares/authMiddleware", () => ({
    requireAdmin: (_req: any, _res: any, next: any) => next()
}));

let app: express.Express;

beforeAll(async () => {
    await TestDataSource.initialize();
    initializeAdminRepositories(TestDataSource);

    // Creiamo app Express
    app = express();
    app.use(express.json());
    app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
    app.use(passport.initialize());
    app.use(passport.session());

    app.use("/admin", adminRouter);

    // Inseriamo ruoli base
    const roleRepo = TestDataSource.getRepository(Role);
    await roleRepo.save([
        roleRepo.create({ title: "ADMIN", label: "Administrator" }),
        roleRepo.create({ title: "MUNICIPALITY_OFFICER", label: "Municipality Officer" }),
        roleRepo.create({ title: "ORGANIZATION_OFFICER", label: "Organization Officer" }),
    ]);
});

afterAll(async () => {
    await TestDataSource.destroy();
});

describe("Admin Routes E2E", () => {

    test("POST /admin/accounts/register → crea un officer", async () => {

        const response = await request(app)
            .post("/admin/accounts/register")
            .send({
                username: "john",
                email: "john@example.com",
                password: "Password123",
                first_name: "John",
                last_name: "Doe"
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("username", "john");
        expect(response.body).not.toHaveProperty("password");
    });

    test("GET /admin/accounts/list → ritorna la lista di officers", async () => {
        const res = await request(app).get("/admin/accounts/list");

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].username).toBe("john");
    });

    test("PUT /admin/accounts/assign → assegna un ruolo a un officer", async () => {
        const res = await request(app)
            .put("/admin/accounts/assign")
            .send({
                username: "john",
                roleTitle: "ORGANIZATION_OFFICER"
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("username");
        expect(res.body).toHaveProperty("role");
        expect(res.body.role).toContain("ORGANIZATION_OFFICER");
    });

    test("GET /admin/roles/list → ritorna tutti i ruoli assegnabili", async () => {
        const res = await request(app).get("/admin/roles/list");

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty("title");
        expect(res.body[0]).toHaveProperty("label");
    });

});
