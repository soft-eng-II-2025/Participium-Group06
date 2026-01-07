// Load reflect-metadata before any modules using class-transformer
import 'reflect-metadata';

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

// Mock requireTechLead middleware to inject authenticated tech lead user
jest.mock("../../middlewares/authMiddleware", () => ({
  requireAuth: (_req: any, _res: any, next: any) => next(),
  requireTechLead: (req: any, _res: any, next: any) => {
    // Inject authenticated tech lead user into req.user
    req.user = { username: "techlead1" };
    next();
  },
}));

import "../../auth/passport";

let app: express.Express;
let testUser: User;
let techLead: MunicipalityOfficer;
let techAgent1: MunicipalityOfficer;
let techAgent2: MunicipalityOfficer;
let testCategory: Category;
let testReport1: Report;
let testReport2: Report;

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

  // mount tech lead routes
  app.use("/api/tech-lead", techLeadRouter);

  // ===== SETUP TEST DATA =====

  // insert roles
  const roleRepo = TestDataSource.getRepository(Role);
  const techLeadRole = roleRepo.create({
    title: "TECH_LEAD_WASTE",
    label: "Tech Lead - Waste Management",
  });
  const techAgentRole = roleRepo.create({
    title: "TECH_AGENT_WASTE",
    label: "Tech Agent - Waste Management",
  });
  await roleRepo.save([techLeadRole, techAgentRole]);

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

  // insert tech lead officer
  const officerRepo = TestDataSource.getRepository(MunicipalityOfficer);
  techLead = officerRepo.create({
    username: "techlead1",
    email: "techlead1@example.com",
    password: await hashPassword("passwordTL"),
    first_name: "Tech",
    last_name: "Lead",
    roles: [techLeadRole],
    external: false,
  });
  await officerRepo.save(techLead);

  // insert tech agents
  techAgent1 = officerRepo.create({
    username: "agent1",
    email: "agent1@example.com",
    password: await hashPassword("password123"),
    first_name: "Agent",
    last_name: "One",
    roles: [techAgentRole],
    external: false,
  });
  techAgent2 = officerRepo.create({
    username: "agent2",
    email: "agent2@example.com",
    password: await hashPassword("password123"),
    first_name: "Agent",
    last_name: "Two",
    roles: [techAgentRole],
    external: false,
  });
  await officerRepo.save([techAgent1, techAgent2]);

  // insert category
  const categoryRepo = TestDataSource.getRepository(Category);
  testCategory = categoryRepo.create({
    name: "Waste Management",
    roles: [techLeadRole, techAgentRole],
  });
  await categoryRepo.save(testCategory);

  // insert test reports with various statuses
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
    anonymous : false,
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
    anonymous : false,
  });
  await reportRepo.save([testReport1, testReport2]);
});

afterAll(async () => {
  await TestDataSource.destroy();
});

describe("TechLead Routes E2E", () => {
  // --------------------------------------------------
  // GET /api/tech-lead/agents - Get tech agents
  // --------------------------------------------------
  it("GET /api/tech-lead/agents → returns list of agents assigned to tech lead", async () => {
    const res = await request(app)
      .get("/api/tech-lead/agents")
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    // Verify both agents are present
    expect(res.body.some((o: any) => o.username === "agent1")).toBe(true);
    expect(res.body.some((o: any) => o.username === "agent2")).toBe(true);
  });

  it("GET /api/tech-lead/agents → returns agents with expected fields", async () => {
    const res = await request(app)
      .get("/api/tech-lead/agents")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const agent = res.body[0];
    expect(agent).toHaveProperty("username");
    expect(agent).toHaveProperty("email");
    expect(agent).toHaveProperty("first_name");
    expect(agent).toHaveProperty("last_name");
  });

  // --------------------------------------------------
  // GET /api/tech-lead/reports/list - Get tech lead reports
  // --------------------------------------------------
  it("GET /api/tech-lead/reports/list → returns reports assigned to tech lead category", async () => {
    const res = await request(app)
      .get("/api/tech-lead/reports/list")
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    // Verify test reports are included
    expect(res.body.some((r: any) => r.id === testReport1.id)).toBe(true);
    expect(res.body.some((r: any) => r.id === testReport2.id)).toBe(true);
  });

  it("GET /api/tech-lead/reports/list → returns reports with correct status filtering", async () => {
    const res = await request(app)
      .get("/api/tech-lead/reports/list")
      .expect(200);

    // All returned reports should have one of the tech lead statuses
    const validStatuses = [
      StatusType.Assigned,
      StatusType.InProgress,
      StatusType.Resolved,
      StatusType.Rejected,
      StatusType.Suspended,
    ];
    res.body.forEach((report: any) => {
      expect(validStatuses).toContain(report.status);
    });
  });

  it("GET /api/tech-lead/reports/list → returns reports with expected fields", async () => {
    const res = await request(app)
      .get("/api/tech-lead/reports/list")
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const report = res.body[0];
    expect(report).toHaveProperty("id");
    expect(report).toHaveProperty("title");
    expect(report).toHaveProperty("status");
    expect(report).toHaveProperty("user");
    expect(report).toHaveProperty("category");
    expect(report).toHaveProperty("officer");
  });

  // --------------------------------------------------
  // PUT /api/tech-lead/report/:reportId - Assign agent to report
  // --------------------------------------------------
  it("PUT /api/tech-lead/report/:reportId → assigns new agent to report", async () => {
    const res = await request(app)
      .put(`/api/tech-lead/report/${testReport1.id}`)
      .send({ officerUsername: "agent2" })
      .expect(200);

    expect(res.body).toHaveProperty("id", testReport1.id);
    expect(res.body).toHaveProperty("officer");
    expect(res.body.officer.username).toBe("agent2");
  });

  it("PUT /api/tech-lead/report/:reportId → returns updated report with all fields", async () => {
    const res = await request(app)
      .put(`/api/tech-lead/report/${testReport1.id}`)
      .send({ officerUsername: "agent1" })
      .expect(200);

    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("status");
    expect(res.body).toHaveProperty("user");
    expect(res.body).toHaveProperty("category");
    expect(res.body).toHaveProperty("officer");
  });

  it("PUT /api/tech-lead/report/:reportId → fails with 404 for non-existent report", async () => {
    await request(app)
      .put("/api/tech-lead/report/99999")
      .send({ officerUsername: "agent1" })
      .expect(404);
  });

  it("PUT /api/tech-lead/report/:reportId → fails with 404 when officer not found", async () => {
    await request(app)
      .put(`/api/tech-lead/report/${testReport1.id}`)
      .send({ officerUsername: "nonexistent_officer" })
      .expect(404);
  });
});