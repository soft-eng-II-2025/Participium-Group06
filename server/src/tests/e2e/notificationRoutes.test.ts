// import 'reflect-metadata';
// import request from "supertest";
// import express, { Request, Response, NextFunction, Application } from "express";
// import session from "express-session";
// import passport from "passport";
// import { router as notificationRouter } from "../../routes/notificationRoutes";
// import { TestDataSource } from "../test-data-source";
// import { User } from "../../models/User";
// import { Notification } from "../../models/Notification";
// import { NotificationType } from "../../models/NotificationType";
// import { UserResponseDTO } from "../../models/DTOs/UserResponseDTO";
// import * as notificationController from "../../controllers/notificationController";

// // Mock VerificationService to avoid sending emails
// jest.mock("../../services/verificationService", () => ({
//     generateAndSend: jest.fn().mockResolvedValue(undefined),
// }));

// // Mock SocketService to avoid initializing Socket.io
// jest.mock("../../services/socketService", () => ({
//     SocketService: jest.fn().mockImplementation(() => ({
//         io: {},
//         emitMessage: jest.fn(),
//         emitNotification: jest.fn(),
//     })),
// }));

// // Mock requireAuth to inject authenticated user
// let mockUser: UserResponseDTO | null = null;
// jest.mock("../../middlewares/authMiddleware", () => ({
//     requireAuth: (req: Request, res: Response, next: NextFunction) => {
//         if (!mockUser) {
//             return res.status(401).json({ error: "Unauthorized" });
//         }
//         req.user = mockUser;
//         next();
//     },
// }));

// import "../../auth/passport";

// describe("Notification Routes E2E Tests", () => {
//     let app: Application;
//     let user1: User;
//     let user2: User;
//     let notification1: Notification;
//     let notification2: Notification;
//     let notification3: Notification;

//     beforeAll(async () => {
//         // Initialize test database
//         await TestDataSource.initialize();
//         await TestDataSource.synchronize(true); // Reset database

//         // Initialize controller with test data source
//         notificationController.initializeNotificationController(TestDataSource);

//         // Setup express app with session
//         app = express();
//         app.use(express.json());
//         app.use(
//             session({
//                 secret: "test-secret",
//                 resave: false,
//                 saveUninitialized: false,
//             })
//         );
//         app.use(passport.initialize());
//         app.use(passport.session());

//         // Mount notification routes
//         app.use("/api/notifications", notificationRouter);

//         // Create test users
//         const userRepo = TestDataSource.getRepository(User);
//         user1 = userRepo.create({
//             username: "testuser1",
//             email: "testuser1@example.com",
//             password: "hashedpassword123",
//             first_name: "Test",
//             last_name: "User1",
//             verified: true,
//             flag_email: true,
//         });
//         await userRepo.save(user1);

//         user2 = userRepo.create({
//             username: "testuser2",
//             email: "testuser2@example.com",
//             password: "hashedpassword456",
//             first_name: "Test",
//             last_name: "User2",
//             verified: true,
//             flag_email: false,
//         });
//         await userRepo.save(user2);

//         // Create test notifications for user1
//         const notifRepo = TestDataSource.getRepository(Notification);
//         notification1 = notifRepo.create({
//             user: user1,
//             content: "Your report has been approved",
//             type: NotificationType.ReportChanged,
//             is_read: false,
//         });
//         await notifRepo.save(notification1);

//         notification2 = notifRepo.create({
//             user: user1,
//             content: "New message on your report",
//             type: NotificationType.NewMessage,
//             is_read: false,
//         });
//         await notifRepo.save(notification2);

//         // Create notification for user2
//         notification3 = notifRepo.create({
//             user: user2,
//             content: "Report status updated",
//             type: NotificationType.ReportChanged,
//             is_read: true,
//         });
//         await notifRepo.save(notification3);
//     });

//     afterAll(async () => {
//         await TestDataSource.destroy();
//     });

//     beforeEach(() => {
//         // Reset mock user before each test
//         mockUser = null;
//     });

//     describe("GET /api/notifications", () => {
//         it("should return all notifications for authenticated user", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             const response = await request(app)
//                 .get("/api/notifications")
//                 .expect(200);

//             expect(Array.isArray(response.body)).toBe(true);
//             expect(response.body.length).toBe(2);
//             expect(response.body[0]).toHaveProperty("content");
//             expect(response.body[0]).toHaveProperty("type");
//             expect(response.body[0]).toHaveProperty("is_read");
//         });

//         it("should verify notification fields structure", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             const response = await request(app)
//                 .get("/api/notifications")
//                 .expect(200);

//             const notif = response.body[0];
//             expect(notif).toHaveProperty("id");
//             expect(notif).toHaveProperty("content");
//             expect(notif).toHaveProperty("type");
//             expect(notif).toHaveProperty("is_read");
//             expect(notif).toHaveProperty("created_at");
//             expect(typeof notif.content).toBe("string");
//             expect(typeof notif.is_read).toBe("boolean");
//         });

//         it("should return empty array if user has no notifications", async () => {
//             // Create new user without notifications
//             const userRepo = TestDataSource.getRepository(User);
//             const user3 = userRepo.create({
//                 username: "testuser3",
//                 email: "testuser3@example.com",
//                 password: "hashedpassword789",
//                 first_name: "Test",
//                 last_name: "User3",
//                 verified: true,
//                 flag_email: true,
//             });
//             await userRepo.save(user3);

//             mockUser = { username: user3.username } as UserResponseDTO;

//             const response = await request(app)
//                 .get("/api/notifications")
//                 .expect(200);

//             expect(Array.isArray(response.body)).toBe(true);
//             expect(response.body.length).toBe(0);
//         });

//         it("should return 401 if user is not authenticated", async () => {
//             const response = await request(app)
//                 .get("/api/notifications")
//                 .expect(401);

//             expect(response.body).toHaveProperty("error", "Unauthorized");
//         });
//     });

//     describe("DELETE /api/notifications/:id", () => {
//         it("should delete notification for authenticated user", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             const response = await request(app)
//                 .delete(`/api/notifications/${notification1.id}`)
//                 .expect(200);

//             expect(response.body).toHaveProperty("success", true);

//             // Verify notification is deleted
//             const notifRepo = TestDataSource.getRepository(Notification);
//             const deletedNotif = await notifRepo.findOne({ where: { id: notification1.id } });
//             expect(deletedNotif).toBeNull();
//         });

//         it("should return 400 for invalid notification ID", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             const response = await request(app)
//                 .delete("/api/notifications/invalid")
//                 .expect(400);

//             expect(response.body).toHaveProperty("error", "Invalid notification ID");
//         });

//         it("should return 500 when trying to delete another user's notification", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             await request(app)
//                 .delete(`/api/notifications/${notification3.id}`)
//                 .expect(500);
//         });

//         it("should return 401 if user is not authenticated", async () => {
//             const response = await request(app)
//                 .delete(`/api/notifications/${notification2.id}`)
//                 .expect(401);

//             expect(response.body).toHaveProperty("error", "Unauthorized");
//         });
//     });

//     describe("PATCH /api/notifications/:id/read", () => {
//         it("should mark notification as read for authenticated user", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             const response = await request(app)
//                 .patch(`/api/notifications/${notification2.id}/read`)
//                 .expect(200);

//             expect(response.body).toHaveProperty("is_read", true);
//             expect(response.body).toHaveProperty("id", notification2.id);

//             // Verify notification is marked as read in database
//             const notifRepo = TestDataSource.getRepository(Notification);
//             const updatedNotif = await notifRepo.findOne({ where: { id: notification2.id } });
//             expect(updatedNotif?.is_read).toBe(true);
//         });

//         it("should return updated notification DTO", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             const response = await request(app)
//                 .patch(`/api/notifications/${notification2.id}/read`)
//                 .expect(200);

//             expect(response.body).toHaveProperty("id");
//             expect(response.body).toHaveProperty("content");
//             expect(response.body).toHaveProperty("type");
//             expect(response.body).toHaveProperty("is_read");
//             expect(response.body).toHaveProperty("created_at");
//         });

//         it("should return 400 for invalid notification ID", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             const response = await request(app)
//                 .patch("/api/notifications/notanumber/read")
//                 .expect(400);

//             expect(response.body).toHaveProperty("error", "Invalid notification ID");
//         });

//         it("should return 500 when trying to mark another user's notification as read", async () => {
//             mockUser = { username: user1.username } as UserResponseDTO;

//             await request(app)
//                 .patch(`/api/notifications/${notification3.id}/read`)
//                 .expect(500);
//         });

//         it("should return 401 if user is not authenticated", async () => {
//             const response = await request(app)
//                 .patch(`/api/notifications/${notification2.id}/read`)
//                 .expect(401);

//             expect(response.body).toHaveProperty("error", "Unauthorized");
//         });
//     });
// });