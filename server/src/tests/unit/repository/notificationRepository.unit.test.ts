// // src/tests/unit/repository/notificationRepository.unit.test.ts
// import { NotificationRepository } from "../../../repositories/NotificationRepository";
// import { Notification } from "../../../models/Notification";
// import { NotificationType } from "../../../models/NotificationType";
// import { User } from "../../../models/User";

// // Mock of TypeORM repository
// const mockOrmRepository = {
//   find: jest.fn(),
//   findOne: jest.fn(),
//   save: jest.fn().mockImplementation(n => Promise.resolve(n)),
//   remove: jest.fn().mockResolvedValue(undefined),
// };

// describe("NotificationRepository - Unit Test (Mock ORM)", () => {
//   let notificationRepository: NotificationRepository;

//   // Mock data
//   const mockUser: User = {
//     id: 1,
//     username: "testuser",
//     email: "test@example.com",
//     password: "hashed_password",
//     first_name: "Test",
//     last_name: "User",
//     photo: null,
//     telegram_id: null,
//     flag_email: true,
//     verified: true,
//     reports: [],
//     notifications: [],
//   } as User;

//   const mockUser2: User = {
//     id: 2,
//     username: "anotheruser",
//     email: "another@example.com",
//     password: "hashed_password",
//     first_name: "Another",
//     last_name: "User",
//     photo: null,
//     telegram_id: null,
//     flag_email: false,
//     verified: true,
//     reports: [],
//     notifications: [],
//   } as User;

//   const mockNotification: Notification = {
//     id: 10,
//     type: NotificationType.ReportChanged,
//     content: "Your report has been updated",
//     is_read: false,
//     created_at: new Date("2025-01-10T10:00:00Z"),
//     user: mockUser,
//   } as Notification;

//   const mockNotification2: Notification = {
//     id: 11,
//     type: NotificationType.NewMessage,
//     content: "You have a new message",
//     is_read: false,
//     created_at: new Date("2025-01-11T11:00:00Z"),
//     user: mockUser,
//   } as Notification;

//   const mockReadNotification: Notification = {
//     id: 12,
//     type: NotificationType.ReportChanged,
//     content: "Previous report update",
//     is_read: true,
//     created_at: new Date("2025-01-09T09:00:00Z"),
//     user: mockUser,
//   } as Notification;

//   beforeEach(() => {
//     // Mock DataSource and getRepository
//     const mockDataSource = {
//       getRepository: jest.fn(() => mockOrmRepository),
//     };

//     notificationRepository = new NotificationRepository(mockDataSource as any);
//     jest.clearAllMocks();

//     // Default setup
//     mockOrmRepository.find.mockResolvedValue([mockNotification, mockNotification2]);
//     mockOrmRepository.findOne.mockResolvedValue(mockNotification);
//     mockOrmRepository.save.mockImplementation(n => Promise.resolve(n));
//   });

//   // ------------------------------------------------------------------
//   // Finders - findAll
//   // ------------------------------------------------------------------
//   it("should call find with user relations and descending order for findAll", async () => {
//     await notificationRepository.findAll();

//     expect(mockOrmRepository.find).toHaveBeenCalledWith({
//       relations: ["user"],
//       order: { created_at: "DESC" },
//     });
//   });

//   it("should return all notifications ordered by created_at descending", async () => {
//     const result = await notificationRepository.findAll();

//     expect(result).toHaveLength(2);
//     expect(result[0]).toEqual(mockNotification);
//     expect(result[1]).toEqual(mockNotification2);
//   });

//   // ------------------------------------------------------------------
//   // Finders - findById
//   // ------------------------------------------------------------------
//   it("should call findOne with relations for findById", async () => {
//     await notificationRepository.findById(10);

//     expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
//       where: { id: 10 },
//       relations: ["user"],
//     });
//   });

//   it("should return notification by id", async () => {
//     const result = await notificationRepository.findById(10);

//     expect(result).toEqual(mockNotification);
//   });

//   it("should return null when notification not found by id", async () => {
//     mockOrmRepository.findOne.mockResolvedValueOnce(null);

//     const result = await notificationRepository.findById(999);

//     expect(result).toBeNull();
//   });

//   // ------------------------------------------------------------------
//   // Finders - findByUser
//   // ------------------------------------------------------------------
//   it("should call find with user id filter and descending order for findByUser", async () => {
//     await notificationRepository.findByUser(1);

//     expect(mockOrmRepository.find).toHaveBeenCalledWith({
//       where: { user: { id: 1 } },
//       relations: ["user"],
//       order: { created_at: "DESC" },
//     });
//   });

//   it("should return all notifications for a specific user", async () => {
//     mockOrmRepository.find.mockResolvedValueOnce([mockNotification, mockNotification2, mockReadNotification]);

//     const result = await notificationRepository.findByUser(1);

//     expect(result).toHaveLength(3);
//     expect(result[0].user.id).toBe(1);
//   });

//   it("should return empty array when user has no notifications", async () => {
//     mockOrmRepository.find.mockResolvedValueOnce([]);

//     const result = await notificationRepository.findByUser(999);

//     expect(result).toEqual([]);
//   });

//   // ------------------------------------------------------------------
//   // Finders - findUnreadByUser
//   // ------------------------------------------------------------------
//   it("should call find with user id and is_read false filter for findUnreadByUser", async () => {
//     await notificationRepository.findUnreadByUser(1);

//     expect(mockOrmRepository.find).toHaveBeenCalledWith({
//       where: { user: { id: 1 }, is_read: false },
//       relations: ["user"],
//       order: { created_at: "DESC" },
//     });
//   });

//   it("should return only unread notifications for a specific user", async () => {
//     mockOrmRepository.find.mockResolvedValueOnce([mockNotification, mockNotification2]);

//     const result = await notificationRepository.findUnreadByUser(1);

//     expect(result).toHaveLength(2);
//     expect(result.every(n => n.is_read === false)).toBe(true);
//   });

//   it("should return empty array when user has no unread notifications", async () => {
//     mockOrmRepository.find.mockResolvedValueOnce([]);

//     const result = await notificationRepository.findUnreadByUser(1);

//     expect(result).toEqual([]);
//   });

//   // ------------------------------------------------------------------
//   // CRUD Operations - add
//   // ------------------------------------------------------------------
//   it("should call save for add", async () => {
//     await notificationRepository.add(mockNotification);

//     expect(mockOrmRepository.save).toHaveBeenCalledWith(mockNotification);
//   });

//   it("should return the saved notification from add", async () => {
//     mockOrmRepository.save.mockResolvedValueOnce(mockNotification);

//     const result = await notificationRepository.add(mockNotification);

//     expect(result).toEqual(mockNotification);
//   });

//   // ------------------------------------------------------------------
//   // CRUD Operations - remove
//   // ------------------------------------------------------------------
//   it("should call remove for remove", async () => {
//     await notificationRepository.remove(mockNotification);

//     expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockNotification);
//   });

//   it("should handle removing multiple notifications in sequence", async () => {
//     await notificationRepository.remove(mockNotification);
//     await notificationRepository.remove(mockNotification2);

//     expect(mockOrmRepository.remove).toHaveBeenCalledTimes(2);
//     expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockNotification);
//     expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockNotification2);
//   });

//   // ------------------------------------------------------------------
//   // Status Updates - markAsRead
//   // ------------------------------------------------------------------
//   it("should set is_read to true and save for markAsRead", async () => {
//     const unreadNotif = { ...mockNotification, is_read: false };
//     mockOrmRepository.save.mockResolvedValueOnce({ ...unreadNotif, is_read: true });

//     const result = await notificationRepository.markAsRead(unreadNotif);

//     expect(unreadNotif.is_read).toBe(true);
//     expect(mockOrmRepository.save).toHaveBeenCalledWith(unreadNotif);
//     expect(result.is_read).toBe(true);
//   });

//   it("should return the updated notification from markAsRead", async () => {
//     const readNotif = { ...mockNotification, is_read: true };
//     mockOrmRepository.save.mockResolvedValueOnce(readNotif);

//     const result = await notificationRepository.markAsRead(mockNotification);

//     expect(result.is_read).toBe(true);
//   });

//   // ------------------------------------------------------------------
//   // Edge Cases and Ordering
//   // ------------------------------------------------------------------
//   it("should maintain chronological order (DESC) when fetching notifications", async () => {
//     const notif1 = { ...mockNotification, id: 1, created_at: new Date("2025-01-01") };
//     const notif2 = { ...mockNotification, id: 2, created_at: new Date("2025-01-02") };
//     const notif3 = { ...mockNotification, id: 3, created_at: new Date("2025-01-03") };

//     mockOrmRepository.find.mockResolvedValueOnce([notif3, notif2, notif1]);

//     const result = await notificationRepository.findByUser(1);

//     expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
//     expect(result[1].created_at.getTime()).toBeGreaterThan(result[2].created_at.getTime());
//   });

//   it("should handle different notification types", async () => {
//     const notifReportChanged = { ...mockNotification, type: NotificationType.ReportChanged };
//     const notifNewMessage = { ...mockNotification2, type: NotificationType.NewMessage };

//     mockOrmRepository.find.mockResolvedValueOnce([notifReportChanged, notifNewMessage]);

//     const result = await notificationRepository.findByUser(1);

//     expect(result[0].type).toBe(NotificationType.ReportChanged);
//     expect(result[1].type).toBe(NotificationType.NewMessage);
//   });

//   it("should handle notifications from different users separately", async () => {
//     const notif1 = { ...mockNotification, user: mockUser };
//     const notif2 = { ...mockNotification2, user: mockUser2 };

//     mockOrmRepository.find.mockResolvedValueOnce([notif1]);

//     const result = await notificationRepository.findByUser(1);

//     expect(result.every(n => n.user.id === 1)).toBe(true);
//     expect(mockOrmRepository.find).toHaveBeenCalledWith({
//       where: { user: { id: 1 } },
//       relations: ["user"],
//       order: { created_at: "DESC" },
//     });
//   });

//     it("should correctly filter read vs unread notifications", async () => {
//     // Create fresh unread notifications for this test
//     const freshUnreadNotif1: Notification = {
//         id: 20,
//         type: NotificationType.ReportChanged,
//         content: "Fresh notification 1",
//         is_read: false,
//         created_at: new Date("2025-01-15T10:00:00Z"),
//         user: mockUser,
//     } as Notification;

//     const freshUnreadNotif2: Notification = {
//         id: 21,
//         type: NotificationType.NewMessage,
//         content: "Fresh notification 2",
//         is_read: false,
//         created_at: new Date("2025-01-16T11:00:00Z"),
//         user: mockUser,
//     } as Notification;

//     mockOrmRepository.find.mockResolvedValueOnce([freshUnreadNotif1, freshUnreadNotif2]);

//     const result = await notificationRepository.findUnreadByUser(1);

//     expect(result).toHaveLength(2);
//     expect(result.every(n => n.is_read === false)).toBe(true);
//     });
// });