import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";

import { router as userRouter } from "../../routes/userRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeUserRepositories } from "../../controllers/userController";

// Mock VerificationService to avoid sending real emails during E2E tests.
// This ensures generateAndSend/verifyCode do not perform network I/O.
jest.mock("../../services/verificationService", () => {
  return {
    VerificationService: jest.fn().mockImplementation(() => ({
      generateAndSend: jest.fn().mockResolvedValue(undefined),
      verifyCode: jest.fn().mockResolvedValue(true),
      cleanupExpired: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Import passport config so serialize/deserialize and local strategy are registered.
// This is required so `req.logIn`, `req.isAuthenticated` and session-based auth behave correctly.
import "../../auth/passport";

describe("User API E2E", () => {
  let app: express.Express;

  beforeAll(async () => {
    // initialize test DB and schema
    await TestDataSource.initialize();
    await TestDataSource.synchronize(true);

    initializeUserRepositories(TestDataSource);

    // create express app
    app = express();
    app.use(express.json());

    // configure sessions + passport
    app.use(
      session({
        secret: "testsecret",
        resave: false,
        saveUninitialized: false,
      })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // mount user routes under /api
    app.use("/api", userRouter);
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  // --------------------------------------------------
  // TEST: REGISTER
  // --------------------------------------------------
  it("POST /api/register -> creates a user and logs them in", async () => {
    const agent = request.agent(app);

    // perform registration
    const res = await agent
      .post("/api/register")
      .send({
        username: "mario",
        email: "mario@example.com",
        password: "password123",
        first_name: "Mario",
        last_name: "Rossi",
      })
      .expect(201);

    // response contains safe user DTO
    expect(res.body).toHaveProperty("username", "mario");
    expect(res.body).toHaveProperty("email", "mario@example.com");

    // server should have created a session cookie
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
  });

  // --------------------------------------------------
  // TEST: LOGIN
  // --------------------------------------------------
  it("POST /api/login -> login with valid credentials", async () => {
    const agent = request.agent(app);

    const res = await agent
      .post("/api/login")
      .send({
        username: "mario",
        password: "password123",
      })
      .expect(200);

    expect(res.body).toHaveProperty("username", "mario");
  });

  it("POST /api/login -> fails with wrong password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({
        username: "mario",
        password: "WRONGPASS",
      })
      .expect(401);

    expect(res.body.message).toBeDefined();
  });

  // --------------------------------------------------
  // TEST: GET SESSION
  // --------------------------------------------------
  it("GET /api/session -> returns authenticated user", async () => {
    const agent = request.agent(app);

    // login first to obtain session cookie
    await agent.post("/api/login").send({
      username: "mario",
      password: "password123",
    }).expect(200);

    // then request session
    const ses = await agent.get("/api/session").expect(200);
    expect(ses.body).toHaveProperty("username", "mario");
  });

  it("GET /api/session -> 401 when not authenticated", async () => {
    const res = await request(app).get("/api/session").expect(401);
    expect(res.body).toHaveProperty("error", "Authentication required");
  });

  // --------------------------------------------------
  // TEST: LOGOUT
  // --------------------------------------------------
  it("POST /api/logout -> invalidates session", async () => {
    const agent = request.agent(app);

    await agent.post("/api/login").send({
      username: "mario",
      password: "password123",
    }).expect(200);

    const out = await agent.post("/api/logout").expect(200);
    expect(out.body).toHaveProperty("ok", true);

    // after logout, session should be invalid
    await agent.get("/api/session").expect(401);
  });
});