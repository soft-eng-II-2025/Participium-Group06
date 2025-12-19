// import request from "supertest";
// import express from "express";
// import session from "express-session";
// import passport from "passport";

// import { router as adminRouter } from "../../routes/adminRoutes";
// import { TestDataSource } from "../test-data-source";
// import { initializeAdminRepositories } from "../../controllers/adminController";
// import { Role } from "../../models/Role";
// import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";

// // Mock requireAdmin to bypass authentication
// jest.mock("../../middlewares/authMiddleware", () => ({
//   requireAdmin: (_req: any, _res: any, next: any) => next()
// }));

// let app: express.Express;

// beforeAll(async () => {
//   await TestDataSource.initialize();
//   initializeAdminRepositories(TestDataSource);

//   // Create express app for E2E
//   app = express();
//   app.use(express.json());
//   app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
//   app.use(passport.initialize());
//   app.use(passport.session());

//   app.use("/admin", adminRouter);

//   // Insert base roles
//   const roleRepo = TestDataSource.getRepository(Role);
//   await roleRepo.save([
//     roleRepo.create({ title: "ADMIN", label: "Administrator" }),
//     roleRepo.create({ title: "MUNICIPALITY_OFFICER", label: "Municipality Officer" }),
//     roleRepo.create({ title: "ORGANIZATION_OFFICER", label: "Organization Officer" }),
//   ]);
// });

// afterAll(async () => {
//   await TestDataSource.destroy();
// });

// describe("Admin Routes E2E", () => {
//   test("POST /admin/accounts/register → creates an officer (no password in response)", async () => {
//     // Note: DTO requires `external` boolean, include it here (false by default)
//     const response = await request(app)
//       .post("/admin/accounts/register")
//       .send({
//         username: "john",
//         email: "john@example.com",
//         password: "Password123",
//         first_name: "John",
//         last_name: "Doe",
//         external: false
//       });

//     expect(response.status).toBe(201);
//     expect(response.body).toHaveProperty("username", "john");
//     // Ensure password is not leaked back in response
//     expect(response.body).not.toHaveProperty("password");
//   });

//   test("GET /admin/accounts/list → returns list of officers including created one", async () => {
//     const res = await request(app).get("/admin/accounts/list");

//     expect(res.status).toBe(200);
//     expect(Array.isArray(res.body)).toBe(true);
//     // At least one officer should exist (the one created above)
//     expect(res.body.length).toBeGreaterThanOrEqual(1);
//     // Find the created officer in the list
//     const found = res.body.find((o: any) => o.username === "john");
//     expect(found).toBeDefined();
//   });

//   test("PUT /admin/accounts/assign → assigns a role to an officer", async () => {
//     // DTO requires external boolean; pass false because this officer is internal
//     const res = await request(app)
//       .put("/admin/accounts/assign")
//       .send({
//         username: "john",
//         roleTitle: "ORGANIZATION_OFFICER",
//         external: false
//       });

//     expect(res.status).toBe(200);
//     expect(res.body).toHaveProperty("username", "john");

//     // Role field in response may be either a string title or an object.
//     // Accept either case:
//     const roleField = res.body.role;
//     const roleIncludesExpected =
//       roleField === "ORGANIZATION_OFFICER" ||
//       (typeof roleField === "object" && (roleField.title === "ORGANIZATION_OFFICER" || JSON.stringify(roleField).includes("ORGANIZATION_OFFICER"))) ||
//       (typeof roleField === "string" && roleField.includes("ORGANIZATION_OFFICER"));

//     expect(roleIncludesExpected).toBe(true);
//   });

//   test("GET /admin/roles/list → returns assignable roles (title + label)", async () => {
//     const res = await request(app).get("/admin/roles/list");

//     expect(res.status).toBe(200);
//     expect(Array.isArray(res.body)).toBe(true);
//     expect(res.body.length).toBeGreaterThan(0);
//     // Each item should have title and label
//     expect(res.body[0]).toHaveProperty("title");
//     expect(res.body[0]).toHaveProperty("label");
//   });
// });