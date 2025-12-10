// Load reflect-metadata before any modules using class-transformer
import 'reflect-metadata';

import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";

import { router as messageRouter } from "../../routes/messageRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeAdminRepositories } from "../../controllers/adminController";
import { initializeUserRepositories } from "../../controllers/userController";
import { initializeReportRepositories } from "../../controllers/reportController";
import { initializeMessageRepositories } from "../../controllers/messagingController";
import { MunicipalityOfficer } from "../../models/MunicipalityOfficer";
import { Role } from "../../models/Role";
import { hashPassword } from "../../services/passwordService";
import { User } from "../../models/User";
import { Category } from "../../models/Category";
import { StatusType } from "../../models/StatusType";
import { Report } from "../../models/Report";
import { Chat } from "../../models/Chat";
import { ChatType } from "../../models/ChatType";
import { Message } from "../../models/Message";
import { SenderType } from "../../models/SenderType";
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

// Mock requireAuth middleware to inject authenticated user
jest.mock("../../middlewares/authMiddleware", () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { username: "mario", id: 1 };
    next();
  },
}));

import "../../auth/passport";

let app: express.Express;
let testUser: User;
let testOfficer: MunicipalityOfficer;
let testLeadOfficer: MunicipalityOfficer;
let testCategory: Category;
let testReport: Report;
let testChatOfficerUser: Chat;
let testChatLeadExternal: Chat;

beforeAll(async () => {
  // initialize test DB
  if (TestDataSource.isInitialized) {
    await TestDataSource.destroy();
  }
  await TestDataSource.initialize();
  await TestDataSource.synchronize(true);

  // initialize controllers
  const io = new SocketIOServer();
  initializeAdminRepositories(TestDataSource);
  initializeUserRepositories(TestDataSource);
  initializeReportRepositories(TestDataSource, io);
  initializeMessageRepositories(TestDataSource, io);

  // create express app
  app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  // mount message routes
  app.use("/api/messages", messageRouter);

  // ===== SETUP TEST DATA =====

  // insert roles
  const roleRepo = TestDataSource.getRepository(Role);
  const techAgentRole = roleRepo.create({
    title: "TECH_AGENT_WASTE",
    label: "Tech Agent - Waste Management",
  });
  const techLeadRole = roleRepo.create({
    title: "TECH_LEAD_WASTE",
    label: "Tech Lead - Waste Management",
  });
  await roleRepo.save([techAgentRole, techLeadRole]);

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

  // insert officers
  const officerRepo = TestDataSource.getRepository(MunicipalityOfficer);
  testOfficer = officerRepo.create({
    username: "agent1",
    email: "agent1@example.com",
    password: await hashPassword("password123"),
    first_name: "Agent",
    last_name: "One",
    role: techAgentRole,
    external: true,
  });

  testLeadOfficer = officerRepo.create({
    username: "techlead1",
    email: "techlead1@example.com",
    password: await hashPassword("password123"),
    first_name: "Tech",
    last_name: "Lead",
    role: techLeadRole,
    external: false,
  });
  await officerRepo.save([testOfficer, testLeadOfficer]);

  // insert category
  const categoryRepo = TestDataSource.getRepository(Category);
  testCategory = categoryRepo.create({
    name: "Waste Management",
    roles: [techAgentRole, techLeadRole],
  });
  await categoryRepo.save(testCategory);

  // insert test report
  const reportRepo = TestDataSource.getRepository(Report);
  testReport = reportRepo.create({
    longitude: 10.5,
    latitude: 20.5,
    title: "Overflowing trash bin - Main St",
    description: "Large bin needs urgent collection",
    status: StatusType.Assigned,
    explanation: "Assigned to agent1",
    user: testUser,
    category: testCategory,
    officer: testOfficer,
    leadOfficer: testLeadOfficer,
    createdAt: new Date(),
    chats: [],
  });
  await reportRepo.save(testReport);

  // insert chats
  const chatRepo = TestDataSource.getRepository(Chat);
  testChatOfficerUser = chatRepo.create({
    type: ChatType.OFFICER_USER,
    report: testReport,
  });
  testChatLeadExternal = chatRepo.create({
    type: ChatType.LEAD_EXTERNAL,
    report: testReport,
  });
  await chatRepo.save([testChatOfficerUser, testChatLeadExternal]);

  // insert initial messages
  const messageRepo = TestDataSource.getRepository(Message);
  const message1 = messageRepo.create({
    chat: testChatOfficerUser,
    content: "Hello, I reported a trash bin issue",
    sender: SenderType.USER,
    created_at: new Date(),
  });
  const message2 = messageRepo.create({
    chat: testChatOfficerUser,
    content: "Thank you, we are looking into it",
    sender: SenderType.OFFICER,
    created_at: new Date(),
  });
  await messageRepo.save([message1, message2]);
});

afterAll(async () => {
  await TestDataSource.destroy();
});

describe("Message Routes E2E", () => {
  // --------------------------------------------------
  // POST /:chatId - Send a new message
  // --------------------------------------------------
  it("POST /api/messages/:chatId → sends a new message to chat", async () => {
    const res = await request(app)
      .post(`/api/messages/${testChatOfficerUser.id}`)
      .send({
        sender: SenderType.USER,
        content: "Is there an update on my report?",
      })
      .expect(200);

    expect(res.body).toHaveProperty("content", "Is there an update on my report?");
    expect(res.body).toHaveProperty("sender", SenderType.USER);
    expect(res.body).toHaveProperty("chatId", testChatOfficerUser.id);
  });

  it("POST /api/messages/:chatId → officer can send message to user", async () => {
    const res = await request(app)
      .post(`/api/messages/${testChatOfficerUser.id}`)
      .send({
        sender: SenderType.OFFICER,
        content: "We will resolve this by tomorrow",
      })
      .expect(200);

    expect(res.body).toHaveProperty("content", "We will resolve this by tomorrow");
    expect(res.body).toHaveProperty("sender", SenderType.OFFICER);
  });

  it("POST /api/messages/:chatId → tech lead can send message in officer-user chat", async () => {
    const res = await request(app)
      .post(`/api/messages/${testChatOfficerUser.id}`)
      .send({
        sender: SenderType.LEAD,
        content: "I am monitoring this case",
      })
      .expect(200);

    expect(res.body).toHaveProperty("content", "I am monitoring this case");
    expect(res.body).toHaveProperty("sender", SenderType.LEAD);
  });

  it("POST /api/messages/:chatId → external officer can send message in lead-external chat", async () => {
    const res = await request(app)
      .post(`/api/messages/${testChatLeadExternal.id}`)
      .send({
        sender: SenderType.EXTERNAL,
        content: "We need additional equipment",
      })
      .expect(200);

    expect(res.body).toHaveProperty("content", "We need additional equipment");
    expect(res.body).toHaveProperty("sender", SenderType.EXTERNAL);
  });

  it("POST /api/messages/:chatId → fails with 400 when chat not found", async () => {
    const res = await request(app)
      .post("/api/messages/99999")
      .send({
        sender: SenderType.USER,
        content: "Test message",
      })
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });

  // --------------------------------------------------
  // GET /:reportId/officer-user - Get officer-user messages
  // --------------------------------------------------
  it("GET /api/messages/:reportId/officer-user → returns messages for officer-user chat", async () => {
    const res = await request(app)
      .get(`/api/messages/${testReport.id}/officer-user`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    // Verify initial messages are present
    expect(res.body.some((m: any) => m.content === "Hello, I reported a trash bin issue")).toBe(true);
    expect(res.body.some((m: any) => m.content === "Thank you, we are looking into it")).toBe(true);
  });

  it("GET /api/messages/:reportId/officer-user → returns messages with expected fields", async () => {
    const res = await request(app)
      .get(`/api/messages/${testReport.id}/officer-user`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const message = res.body[0];
    expect(message).toHaveProperty("content");
    expect(message).toHaveProperty("sender");
    expect(message).toHaveProperty("chatId");
    expect(message).toHaveProperty("reportId");
  });

  it("GET /api/messages/:reportId/officer-user → fails with 400 for invalid report ID", async () => {
    const res = await request(app)
      .get("/api/messages/invalid-id/officer-user")
      .expect(400);

    expect(res.body).toHaveProperty("error", "Invalid report ID");
  });

  // --------------------------------------------------
  // GET /:reportId/lead-external - Get lead-external messages
  // --------------------------------------------------
  it("GET /api/messages/:reportId/lead-external → returns messages for lead-external chat", async () => {
    // First, add a message to lead-external chat
    await request(app)
      .post(`/api/messages/${testChatLeadExternal.id}`)
      .send({
        sender: SenderType.LEAD,
        content: "Status update needed",
      });

    const res = await request(app)
      .get(`/api/messages/${testReport.id}/lead-external`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((m: any) => m.content === "Status update needed")).toBe(true);
  });

  it("GET /api/messages/:reportId/lead-external → returns messages with correct chat type", async () => {
    const res = await request(app)
      .get(`/api/messages/${testReport.id}/lead-external`)
      .expect(200);

    // All messages should belong to lead-external chat
    res.body.forEach((message: any) => {
      expect(message.chatId).toBe(testChatLeadExternal.id);
    });
  });

  it("GET /api/messages/:reportId/lead-external → fails with 400 for invalid report ID", async () => {
    const res = await request(app)
      .get("/api/messages/invalid-id/lead-external")
      .expect(400);

    expect(res.body).toHaveProperty("error", "Invalid report ID");
  });

  it("GET /api/messages/:reportId/lead-external → returns empty array when no messages exist", async () => {
    // Create a new report without lead-external messages
    const reportRepo = TestDataSource.getRepository(Report);
    const newReport = reportRepo.create({
      longitude: 11.0,
      latitude: 21.0,
      title: "New report without messages",
      description: "Test",
      status: StatusType.PendingApproval,
      explanation: "",
      user: testUser,
      category: testCategory,
      officer: testOfficer,
      createdAt: new Date(),
      chats: [],
    });
    const savedReport = await reportRepo.save(newReport);

    // Create chat but no messages
    const chatRepo = TestDataSource.getRepository(Chat);
    const newChat = chatRepo.create({
      type: ChatType.LEAD_EXTERNAL,
      report: savedReport,
    });
    await chatRepo.save(newChat);

    const res = await request(app)
      .get(`/api/messages/${savedReport.id}/lead-external`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});