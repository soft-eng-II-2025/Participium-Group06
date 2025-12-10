// Load reflect-metadata before any modules using class-transformer
import 'reflect-metadata';

import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";

import { router as techRouter } from "../../routes/techRoutes";
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
import { Server as SocketIOServer } from "socket.io";

// Mock VerificationService to avoid sending real emails
jest.mock("../../services/verificationService", () => {
  return {
    VerificationService: jest.fn().mockImplementation(() => ({
      generateAndSend: jest.fn().mockResolvedValue(undefined),
      verifyCode: jest.fn().mockResolvedValue(true),
      cleanupExpired: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock SocketService to avoid Socket.io initialization
jest.mock("../../services/socketService", () => {
  return {
    SocketService: jest.fn().mockImplementation(() => ({
      sendNotificationToUser: jest.fn().mockResolvedValue(undefined),
      sendMessageToUser: jest.fn().mockResolvedValue(undefined),
      sendNotificationToOfficer: jest.fn().mockResolvedValue(undefined),
      sendMessageToOfficer: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock messaging controller to avoid chat creation side effects
jest.mock("../../controllers/messagingController", () => ({
  createChatOfficerUser: jest.fn().mockResolvedValue({ id: 1, type: "OFFICER_USER" }),
  createChatLeadExternal: jest.fn().mockResolvedValue({ id: 2, type: "LEAD_EXTERNAL" }),
}));

// Mock requireTechAgent middleware to inject authenticated tech agent user
jest.mock("../../middlewares/authMiddleware", () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireTechAgent: (req: any, _res: any, next: any) => {
    // Inject authenticated tech agent user into req.user
    req.user = { username: "agent1" };
    next();
  },
}));

import "../../auth/passport";

let app: express.Express;
let testUser: User;
let techAgent1: MunicipalityOfficer;
let techAgent2: MunicipalityOfficer;
let testCategory: Category;
let testReport1: Report;
let testReport2: Report;
let testReport3: Report;

beforeAll(async () => {
  // initialize test DB
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
  await TestDataSource.initialize();
  await TestDataSource.synchronize(true);

  // initialize controllers
  initializeAdminRepositories(TestDataSource);
  initializeUserRepositories(TestDataSource);
  const io = new SocketIOServer();
  initializeReportRepositories(TestDataSource, io);

  // create express app
  app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  // mount tech routes
  app.use("/api/tech", techRouter);

  // ===== SETUP TEST DATA =====

  // insert role
  const roleRepo = TestDataSource.getRepository(Role);
  const techAgentRole = roleRepo.create({
    title: "TECH_AGENT_WASTE",
    label: "Tech Agent - Waste Management",
  });
  await roleRepo.save(techAgentRole);

  // insert test user (citizen)
  const userRepo = TestDataSource.getRepository(User);
  testUser = userRepo.create({
    username: "mario",
    email: "mario@example.com",
    password: await hashPassword("password123"),
    first_name: "Mario",
    last_name: "Rossi",
    photo: "",
    telegram_id: "",
    flag_email: true,
    verified: true,
  });
  await userRepo.save(testUser);

  // insert tech agents
  const officerRepo = TestDataSource.getRepository(MunicipalityOfficer);
  techAgent1 = officerRepo.create({
    username: "agent1",
    email: "agent1@example.com",
    password: await hashPassword("password123"),
    first_name: "Agent",
    last_name: "One",
    role: techAgentRole,
    external: false,
  });

  techAgent2 = officerRepo.create({
    username: "agent2",
    email: "agent2@example.com",
    password: await hashPassword("password123"),
    first_name: "Agent",
    last_name: "Two",
    role: techAgentRole,
    external: false,
  });
  await officerRepo.save([techAgent1, techAgent2]);

  // insert category
  const categoryRepo = TestDataSource.getRepository(Category);
  testCategory = categoryRepo.create({
    name: "Waste Management",
    roles: [techAgentRole],
  });
  await categoryRepo.save(testCategory);

  // insert test reports with various statuses assigned to agent1
  const reportRepo = TestDataSource.getRepository(Report);
  testReport1 = reportRepo.create({
    longitude: 10.5,
    latitude: 20.5,
    title: "Overflowing trash bin - Main St",
    description: "Large bin needs urgent collection",
    status: StatusType.Assigned,
    explanation: "Assigned to agent1",
    user: testUser,
    category: testCategory,
    officer: techAgent1,
    createdAt: new Date(),
    chats: [],
  });

  testReport2 = reportRepo.create({
    longitude: 10.6,
    latitude: 20.6,
    title: "Illegal dumping site - Park Ave",
    description: "Unauthorized waste disposal area",
    status: StatusType.InProgress,
    explanation: "Under investigation",
    user: testUser,
    category: testCategory,
    officer: techAgent1,
    createdAt: new Date(),
    chats: [],
  });

  testReport3 = reportRepo.create({
    longitude: 10.7,
    latitude: 20.7,
    title: "Debris on sidewalk - Oak St",
    description: "Scattered waste blocking pedestrians",
    status: StatusType.Resolved,
    explanation: "Cleaned up",
    user: testUser,
    category: testCategory,
    officer: techAgent1,
    createdAt: new Date(),
    chats: [],
  });
  await reportRepo.save([testReport1, testReport2, testReport3]);
});

afterAll(async () => {
  await TestDataSource.destroy();
});

describe("Tech Agent Routes E2E", () => {
  // --------------------------------------------------
  // GET /api/tech/reports/list - Get tech agent reports
  // --------------------------------------------------
  it("GET /api/tech/reports/list → returns list of reports assigned to authenticated tech agent", async () => {
    const res = await request(app)
      .get("/api/tech/reports/list")
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
    // Verify all three test reports are present
    expect(res.body.some((r: any) => r.id === testReport1.id)).toBe(true);
    expect(res.body.some((r: any) => r.id === testReport2.id)).toBe(true);
    expect(res.body.some((r: any) => r.id === testReport3.id)).toBe(true);
  });

  it("GET /api/tech/reports/list → returns only reports assigned to authenticated agent", async () => {
    const res = await request(app)
      .get("/api/tech/reports/list")
      .expect(200);

    // All returned reports should be assigned to agent1
    res.body.forEach((report: any) => {
      expect(report.officer.username).toBe("agent1");
    });
  });

  it("GET /api/tech/reports/list → returns reports with expected fields", async () => {
    const res = await request(app)
      .get("/api/tech/reports/list")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const report = res.body[0];
    expect(report).toHaveProperty("id");
    expect(report).toHaveProperty("title");
    expect(report).toHaveProperty("description");
    expect(report).toHaveProperty("status");
    expect(report).toHaveProperty("user");
    expect(report).toHaveProperty("category");
    expect(report).toHaveProperty("officer");
    expect(report).toHaveProperty("longitude");
    expect(report).toHaveProperty("latitude");
  });

  it("GET /api/tech/reports/list → includes reports with different statuses", async () => {
    const res = await request(app)
      .get("/api/tech/reports/list")
      .expect(200);

    const statuses = res.body.map((r: any) => r.status);
    expect(statuses).toContain(StatusType.Assigned);
    expect(statuses).toContain(StatusType.InProgress);
    expect(statuses).toContain(StatusType.Resolved);
  });

  it("GET /api/tech/reports/list → returns reports with user information", async () => {
    const res = await request(app)
      .get("/api/tech/reports/list")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const report = res.body[0];
    expect(report.user).toHaveProperty("username", "mario");
    expect(report.user).toHaveProperty("email", "mario@example.com");
  });

  it("GET /api/tech/reports/list → returns reports with category information", async () => {
    const res = await request(app)
      .get("/api/tech/reports/list")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const report = res.body[0];
    // category is returned as a string (the name) not an object
    expect(typeof report.category).toBe("string");
    expect(report.category).toBe("Waste Management");
  });

  it("GET /api/tech/reports/list → returns reports with officer information", async () => {
    const res = await request(app)
      .get("/api/tech/reports/list")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const report = res.body[0];
    expect(report.officer).toHaveProperty("username", "agent1");
    expect(report.officer).toHaveProperty("email", "agent1@example.com");
  });
});