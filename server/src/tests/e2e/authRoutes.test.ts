import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { router as userRouter } from "../../routes/userRoutes";
import { TestDataSource } from "../test-data-source";
import { initializeUserRepositories } from "../../controllers/userController";

// --------------------------------------------------
// MOCK class-transformer per evitare Reflect.getMetadata
// --------------------------------------------------

describe("User API E2E", () => {
  let app: express.Express;

  beforeAll(async () => {
    // inizializza DB test
    await TestDataSource.initialize();
    await TestDataSource.synchronize(true);

    initializeUserRepositories(TestDataSource);

    // crea app Express
    app = express();
    app.use(express.json());

    app.use(
      session({
        secret: "testsecret",
        resave: false,
        saveUninitialized: false,
      })
    );

    app.use(passport.initialize());
    app.use(passport.session());

    // monta le rotte
    app.use("/api", userRouter);
  });

  afterAll(async () => {
    await TestDataSource.destroy();
  });

  // --------------------------------------------------
  // TEST: REGISTER
  // --------------------------------------------------
  it("POST /api/register -> crea un utente e lo autentica subito", async () => {
    const agent = request.agent(app);

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

    expect(res.body).toHaveProperty("username", "mario");
    expect(res.body).toHaveProperty("email", "mario@example.com");
  });

  // --------------------------------------------------
  // TEST: LOGIN
  // --------------------------------------------------
  it("POST /api/login -> login con credenziali corrette", async () => {
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

  it("POST /api/login -> fallisce con password errata", async () => {
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
  it("GET /api/session -> ritorna utente autenticato", async () => {
    const agent = request.agent(app);

    await agent.post("/api/login").send({
      username: "mario",
      password: "password123",
    }).expect(200);

    const ses = await agent.get("/api/session").expect(200);
    expect(ses.body).toHaveProperty("username", "mario");
  });

  it("GET /api/session -> 401 se non autenticato", async () => {
    const res = await request(app).get("/api/session").expect(401);
    expect(res.body).toHaveProperty("error", "Authentication required");
  });

  // --------------------------------------------------
  // TEST: LOGOUT
  // --------------------------------------------------
  it("POST /api/logout -> invalida la sessione", async () => {
    const agent = request.agent(app);

    await agent.post("/api/login").send({
      username: "mario",
      password: "password123",
    }).expect(200);

    const out = await agent.post("/api/logout").expect(200);
    expect(out.body).toHaveProperty("ok", true);

    const ses = await agent.get("/api/session").expect(401);
    expect(ses.body.error).toBe("Authentication required");
  });
});
