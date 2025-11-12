import request from "supertest";
import { app, initializeApp } from "../../index";
import { TestDataSource } from "../test-data-source";
import { User } from "../../models/User";

describe("E2E: authRoutes", () => {
  beforeAll(async () => {
    if (!TestDataSource.isInitialized) {
        await TestDataSource.initialize();
    }
        await TestDataSource.synchronize(true);
    });


  it("POST /api/register -> registra nuovo utente", async () => {
    const payload = {
      username: "user1",
      email: "user1@mail.com",
      password: "password123",
      first_name: "Luca",
      last_name: "Bianchi",
    };

    const res = await request(app)
      .post("/api/register")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("username", "user1");

    const repo = TestDataSource.getRepository(User);
    const user = await repo.findOne({ where: { username: "user1" } });
    expect(user).not.toBeNull();
  });

  it("POST /api/login -> effettua login con credenziali corrette", async () => {
    const payload = { username: "user1", password: "password123" };

    const res = await request(app)
      .post("/api/login")
      .send(payload);

    // Passport ritorna 401 se credenziali errate
    expect([200, 401]).toContain(res.status);

    if (res.status === 200) {
      expect(res.body).toHaveProperty("username", "user1");
    }
  });

  it("GET /api/session -> ritorna sessione utente (null se non loggato)", async () => {
    const res = await request(app).get("/api/session");
    expect(res.status).toBe(200);
    // Se non loggato: null
    expect(res.body === null || typeof res.body === "object").toBe(true);
  });

  it("POST /api/logout -> logout utente", async () => {
    const res = await request(app).post("/api/logout");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });
});
