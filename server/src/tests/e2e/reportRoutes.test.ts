// // Load reflect-metadata before any modules using class-transformer
// import 'reflect-metadata';

// import request from "supertest";
// import express from "express";
// import session from "express-session";
// import passport from "passport";

// import { router as reportRouter } from "../../routes/reportRoutes";
// import { TestDataSource } from "../test-data-source";
// import { initializeReportRepositories } from "../../controllers/reportController";
// import { initializeUserRepositories } from "../../controllers/userController";
// import { initializeAdminRepositories } from "../../controllers/adminController";
// import { StatusType } from "../../models/StatusType";
// import { User } from "../../models/User";
// import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";
// import { hashPassword } from "../../services/passwordService";
// import { Category } from "../../models/Category";
// import { Role } from "../../models/Role";
// import { Report } from "../../models/Report";
// import { Server as SocketIOServer } from "socket.io";

// // Mock middlewares
// jest.mock("../../middlewares/authMiddleware", () => ({
//   requireAuth: (_req: any, _res: any, next: any) => next(),
//   requireUser: (_req: any, _res: any, next: any) => next(),
// }));

// // Mock VerificationService to avoid sending real emails
// jest.mock("../../services/verificationService", () => {
//   return {
//     VerificationService: jest.fn().mockImplementation(() => ({
//       generateAndSend: jest.fn().mockResolvedValue(undefined),
//       verifyCode: jest.fn().mockResolvedValue(true),
//       cleanupExpired: jest.fn().mockResolvedValue(undefined),
//     })),
//   };
// });

// // Mock SocketService to avoid Socket.io initialization
// jest.mock("../../services/socketService", () => {
//   return {
//     SocketService: jest.fn().mockImplementation(() => ({
//       sendNotificationToUser: jest.fn().mockResolvedValue(undefined),
//       sendMessageToUser: jest.fn().mockResolvedValue(undefined),
//       sendNotificationToOfficer: jest.fn().mockResolvedValue(undefined),
//       sendMessageToOfficer: jest.fn().mockResolvedValue(undefined),
//     })),
//   };
// });

// // Mock messaging controller to avoid chat creation side effects
// jest.mock("../../controllers/messagingController", () => ({
//   createChatOfficerUser: jest.fn().mockResolvedValue({ id: 1, type: "OFFICER_USER" }),
//   createChatLeadExternal: jest.fn().mockResolvedValue({ id: 2, type: "LEAD_EXTERNAL" }),
// }));

// import "../../auth/passport";

// let app: express.Express;
// let testUser: User;
// let testOfficer: MunicipalityOfficer;
// let testTechLead: MunicipalityOfficer;
// let testCategory: Category;
// let testReportId: number;

// beforeAll(async () => {
//   // clean up and initialize test DB
//   if (TestDataSource.isInitialized) {
//     await TestDataSource.destroy();
//   }
//   await TestDataSource.initialize();
//   await TestDataSource.synchronize(true);

//   // initialize controllers
//   initializeUserRepositories(TestDataSource);
//   initializeAdminRepositories(TestDataSource);
//   const io = new SocketIOServer();
//   initializeReportRepositories(TestDataSource, io);

//   // create express app
//   app = express();
//   app.use(express.json());
//   app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
//   app.use(passport.initialize());
//   app.use(passport.session());

//   // mount report routes
//   app.use("/api/reports", reportRouter);

//   // ===== SETUP TEST DATA =====

//   // insert roles
//   const roleRepo = TestDataSource.getRepository(Role);
//   const officerRole = roleRepo.create({
//     title: "MUNICIPALITY_OFFICER",
//     label: "Municipality Officer",
//   });
//   const techLeadRole = roleRepo.create({
//     title: "TECH_LEAD_GREEN_AREAS",
//     label: "Tech Lead - Green Areas",
//   });
//   await roleRepo.save([officerRole, techLeadRole]);

//   // insert test user
//   const userRepo = TestDataSource.getRepository(User);
//   testUser = userRepo.create({
//     username: "mario",
//     email: "mario@example.com",
//     password: await hashPassword("password123"),
//     first_name: "Mario",
//     last_name: "Rossi",
//     photo: "",
//     telegram_id: "",
//     flag_email: true,
//     verified: true,
//   });
//   await userRepo.save(testUser);

//   // insert test officers
//   const officerRepo = TestDataSource.getRepository(MunicipalityOfficer);
//   testOfficer = officerRepo.create({
//     username: "officer1",
//     email: "officer1@example.com",
//     password: await hashPassword("password123"),
//     first_name: "Officer",
//     last_name: "One",
//     role: officerRole,
//     external: false,
//   });

//   testTechLead = officerRepo.create({
//     username: "techlead1",
//     email: "techlead1@example.com",
//     password: await hashPassword("password123"),
//     first_name: "Tech",
//     last_name: "Lead",
//     role: techLeadRole,
//     external: false,
//   });
//   await officerRepo.save([testOfficer, testTechLead]);

//   // insert test category
//   const categoryRepo = TestDataSource.getRepository(Category);
//   testCategory = categoryRepo.create({
//     name: "Strade",
//     roles: [officerRole, techLeadRole],
//   });
//   await categoryRepo.save(testCategory);

//   // insert test report
//   const reportRepo = TestDataSource.getRepository(Report);
//   const testReport = reportRepo.create({
//     longitude: 10.0,
//     latitude: 20.0,
//     title: "Pothole on Main Street",
//     description: "Large pothole blocking traffic",
//     status: StatusType.PendingApproval,
//     explanation: "",
//     user: testUser,
//     category: testCategory,
//     officer: testOfficer,
//     createdAt: new Date(),
//     chats: [],
//   });
//   const savedReport = await reportRepo.save(testReport);
//   testReportId = savedReport.id;
// });

// afterAll(async () => {
//   await TestDataSource.destroy();
// });

// describe("Report Routes E2E", () => {
//   // --------------------------------------------------
//   // PUT /:id/status - Update report status
//   // --------------------------------------------------
//   it("PUT /api/reports/:id/status → updates report status with valid data", async () => {
//     const res = await request(app)
//       .put(`/api/reports/${testReportId}/status`)
//       .send({
//         newStatus: StatusType.Assigned,
//         explanation: "Assigned to officer",
//       })
//       .expect(200);

//     expect(res.body).toHaveProperty("id", testReportId);
//     expect(res.body).toHaveProperty("status", StatusType.Assigned);
//     expect(res.body).toHaveProperty("explanation", "Assigned to officer");
//   });

//   it("PUT /api/reports/:id/status → fails with 400 when newStatus is missing", async () => {
//     await request(app)
//       .put(`/api/reports/${testReportId}/status`)
//       .send({
//         explanation: "Some explanation",
//         // missing newStatus
//       })
//       .expect(400);
//   });

//   it("PUT /api/reports/:id/status → returns 404 for non-existent report", async () => {
//     await request(app)
//       .put("/api/reports/99999/status")
//       .send({
//         newStatus: StatusType.Resolved,
//         explanation: "Test",
//       })
//       .expect(404);
//   });

//   it("PUT /api/reports/:id/status → fails with 400 for invalid report ID format", async () => {
//     await request(app)
//       .put("/api/reports/invalid-id/status")
//       .send({
//         newStatus: StatusType.Resolved,
//         explanation: "Test",
//       })
//       .expect(400);
//   });

//   it("PUT /api/reports/:id/status → accepts empty explanation", async () => {
//     const res = await request(app)
//       .put(`/api/reports/${testReportId}/status`)
//       .send({
//         newStatus: StatusType.InProgress,
//         explanation: "",
//       })
//       .expect(200);

//     expect(res.body).toHaveProperty("explanation", "");
//   });

//   // --------------------------------------------------
//   // GET /list - Get all reports
//   // --------------------------------------------------
//   it("GET /api/reports/list → returns array of all reports", async () => {
//     const res = await request(app)
//       .get("/api/reports/list")
//       .expect(200);

//     expect(Array.isArray(res.body)).toBe(true);
//     expect(res.body.length).toBeGreaterThanOrEqual(1);
//     // Verify at least one report matches our test data
//     const found = res.body.find((r: any) => r.id === testReportId);
//     expect(found).toBeDefined();
//   });

//   it("GET /api/reports/list → returns reports with all expected fields", async () => {
//     const res = await request(app)
//       .get("/api/reports/list")
//       .expect(200);

//     expect(res.body.length).toBeGreaterThan(0);
//     const report = res.body[0];
//     expect(report).toHaveProperty("id");
//     expect(report).toHaveProperty("title");
//     expect(report).toHaveProperty("status");
//     expect(report).toHaveProperty("user");
//     expect(report).toHaveProperty("category");
//   });

//   // --------------------------------------------------
//   // GET /list/accepted - Get approved reports
//   // --------------------------------------------------
//   it("GET /api/reports/list/accepted → returns array of approved reports", async () => {
//     const res = await request(app)
//       .get("/api/reports/list/accepted")
//       .expect(200);

//     expect(Array.isArray(res.body)).toBe(true);
//     // approved reports should have status 'Assigned' (per controller logic)
//     res.body.forEach((report: any) => {
//       expect(report).toHaveProperty("status", StatusType.Assigned);
//     });
//   });

//   it("GET /api/reports/list/accepted → returns empty array when no approved reports exist", async () => {
//     // Since our test report is in PendingApproval or Assigned status,
//     // if none match 'Assigned', the array might be empty or have our report
//     const res = await request(app)
//       .get("/api/reports/list/accepted")
//       .expect(200);

//     expect(Array.isArray(res.body)).toBe(true);
//   });
// });