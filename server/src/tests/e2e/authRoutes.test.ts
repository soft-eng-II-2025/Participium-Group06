// // Load reflect-metadata before any modules using class-transformer
// import 'reflect-metadata';

// import request from "supertest";
// import express from "express";
// import session from "express-session";
// import passport from "passport";

// import { router as authRouter } from "../../routes/authRoutes";
// import { TestDataSource } from "../test-data-source";
// import { initializeUserRepositories } from "../../controllers/userController";
// import { initializeAdminRepositories } from "../../controllers/adminController";
// import { initializeReportRepositories } from "../../controllers/reportController";
// import { Role } from "../../models/Role";

// // Mock VerificationService to avoid sending real emails during E2E tests.
// jest.mock("../../services/verificationService", () => {
//   return {
//     VerificationService: jest.fn().mockImplementation(() => ({
//       generateAndSend: jest.fn().mockResolvedValue(undefined),
//       verifyCode: jest.fn().mockResolvedValue(true),
//       cleanupExpired: jest.fn().mockResolvedValue(undefined),
//     })),
//   };
// });

// // Mock SocketService to avoid Socket.io initialization in tests.
// // This is necessary because SocketService tries to call io.on("connection", ...) 
// // which fails when io is just an empty mock object.
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

// // Import passport config so serialize/deserialize and local strategy are registered.
// // This is required so `req.logIn`, `req.isAuthenticated` and session-based auth behave correctly.
// import "../../auth/passport";

// describe("User API E2E", () => {
//   let app: express.Express;

//   beforeAll(async () => {
//     // initialize test DB and schema
//     await TestDataSource.initialize();
//     await TestDataSource.synchronize(true);

//     // initialize all repository controllers
//     initializeUserRepositories(TestDataSource);
//     initializeAdminRepositories(TestDataSource);
//     // initializeReportRepositories now works because SocketService is mocked
//     initializeReportRepositories(TestDataSource, {} as any);

//     // insert base roles required by some tests
//     const roleRepo = TestDataSource.getRepository(Role);
//     await roleRepo.save([
//       roleRepo.create({ title: "ADMIN", label: "Administrator" }),
//       roleRepo.create({ title: "ORGANIZATION_OFFICER", label: "Organization Officer" }),
//     ]);

//     // create express app
//     app = express();
//     app.use(express.json());

//     // configure sessions + passport
//     app.use(
//       session({
//         secret: "testsecret",
//         resave: false,
//         saveUninitialized: false,
//       })
//     );

//     app.use(passport.initialize());
//     app.use(passport.session());

//     // mount auth routes under /api (register, login, logout, session, verify)
//     app.use("/api", authRouter);
//   });

//   afterAll(async () => {
//     await TestDataSource.destroy();
//   });

//   // --------------------------------------------------
//   // TEST: REGISTER
//   // --------------------------------------------------
//   it("POST /api/register -> creates a user and logs them in", async () => {
//     const agent = request.agent(app);

//     // perform registration
//     const res = await agent
//       .post("/api/register")
//       .send({
//         username: "mario",
//         email: "mario@example.com",
//         password: "password123",
//         first_name: "Mario",
//         last_name: "Rossi",
//       })
//       .expect(201);

//     // response contains safe user DTO
//     expect(res.body).toHaveProperty("username", "mario");
//     expect(res.body).toHaveProperty("email", "mario@example.com");
//     // registration should trigger automatic login via req.logIn
//     expect(res.body).toHaveProperty("verification_sent", true);
//   });

//   // --------------------------------------------------
//   // TEST: LOGIN
//   // --------------------------------------------------
//   it("POST /api/login -> login with valid credentials", async () => {
//     const agent = request.agent(app);

//     const res = await agent
//       .post("/api/login")
//       .send({
//         username: "mario",
//         password: "password123",
//       })
//       .expect(200);

//     expect(res.body).toHaveProperty("username", "mario");
//   });

//   it("POST /api/login -> fails with wrong password", async () => {
//     const res = await request(app)
//       .post("/api/login")
//       .send({
//         username: "mario",
//         password: "WRONGPASS",
//       })
//       .expect(401);

//     expect(res.body.message).toBeDefined();
//   });

//   // --------------------------------------------------
//   // TEST: GET SESSION
//   // --------------------------------------------------
//   it("GET /api/session -> returns authenticated user", async () => {
//     const agent = request.agent(app);

//     // login first to obtain session cookie
//     await agent.post("/api/login").send({
//       username: "mario",
//       password: "password123",
//     }).expect(200);

//     // then request session
//     const ses = await agent.get("/api/session").expect(200);
//     expect(ses.body).toHaveProperty("username", "mario");
//   });

//   it("GET /api/session -> 401 when not authenticated", async () => {
//     const res = await request(app).get("/api/session").expect(401);
//     expect(res.body).toHaveProperty("error", "Authentication required");
//   });

//   // --------------------------------------------------
//   // TEST: LOGOUT
//   // --------------------------------------------------
//   it("POST /api/logout -> invalidates session", async () => {
//     const agent = request.agent(app);

//     await agent.post("/api/login").send({
//       username: "mario",
//       password: "password123",
//     }).expect(200);

//     const out = await agent.post("/api/logout").expect(200);
//     expect(out.body).toHaveProperty("ok", true);

//     // after logout, session should be invalid
//     await agent.get("/api/session").expect(401);
//   });
// });