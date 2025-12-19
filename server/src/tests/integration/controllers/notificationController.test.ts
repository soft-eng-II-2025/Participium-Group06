// import {TestDataSource} from "../../test-data-source";
// import * as notificationController from "../../../controllers/notificationController"
// import {
//     createTestNotifications,
//     createTestUser1,
//     createTestUser2,
//     createTestUser3,
//     setupDb
// } from "../../utils";
// import {User} from "../../../models/User";
// import {Notification} from "../../../models/Notification";


// describe("notificationController (Integration Tests)", () => {

//     let ready: boolean
//     let testUser: User
//     let userWithoutNotification: User
//     let notifications: Notification[]
//     let notificationToBeDeleted: Notification
//     let otherUser: User
//     let notificationsOtherUser: Notification[]
//     let notificationToBeMarked: Notification;
//     let notificationOtherUser: Notification;

//     beforeEach(async () => {
//         if (TestDataSource.isInitialized) {
//             await TestDataSource.destroy();
//         }
//         await TestDataSource.initialize();

//         //Reset completo DB per ogni test

//         notificationController.initializeNotificationController(TestDataSource)

//         ready = await setupDb(TestDataSource)

//         if (!ready) {
//             throw new Error("Errore nel setup del db");
//         }

//         testUser = await createTestUser1(TestDataSource)
//         notifications = await createTestNotifications(TestDataSource, testUser)
//         userWithoutNotification = await createTestUser2(TestDataSource)
//         notificationToBeDeleted = notifications[0]
//         otherUser = await createTestUser3(TestDataSource)
//         notificationsOtherUser = await createTestNotifications(TestDataSource, otherUser)
//         notificationToBeMarked = notifications[1]
//         notificationOtherUser = notificationsOtherUser[0]

//     });

//     afterEach(async () => {
//         if (TestDataSource.isInitialized) {
//             await TestDataSource.destroy();
//         }
//     });

//     describe("getMyNotifications", () => {
//         it('should retrieve all notification by username', async () => {
//             const notifications = await notificationController.getMyNotifications(testUser.username);
//             expect(notifications.length).toBe(3); // la funzione createTestNotifications crea 3 notifiche
//         });

//         it('should throw an error if the user do not exist', async () => {
//             await expect(notificationController.getMyNotifications("wrong username")).rejects.toThrow("User not found");
//         });

//         it('should return an empthy list if the user do not have notification', async () => {
//             const notifications = await notificationController.getMyNotifications(userWithoutNotification.username);
//             expect(notifications).toEqual([]);
//         });
//     })




//     describe("deleteNotificationForUser", () => {

//         it('should delete a specific notification', async () => {
//             const result = await notificationController.deleteNotificationForUser(
//                 notificationToBeDeleted.id,
//                 testUser.username
//             );

//             expect(result).toEqual({ success: true });

//             const remainingNotifications = await notificationController.getMyNotifications(testUser.username);
//             expect(remainingNotifications.length).toBe(2); // Inizialmente erano 3

//             const ids = remainingNotifications.map(n => n.id);
//             expect(ids).not.toContain(notificationToBeDeleted.id);
//         });

//         it('should throw "User not found" if the username does not exist', async () => {
//             await expect(notificationController.deleteNotificationForUser(
//                 notificationToBeDeleted.id,
//                 "wrong username"
//             )).rejects.toThrow("User not found");

//             const notifications = await notificationController.getMyNotifications(testUser.username);
//             expect(notifications.length).toBe(3);
//         });

//         it('should throw "Notification not found" if the notification ID does not exist', async () => {
//             const nonExistentId = 9999;
//             await expect(notificationController.deleteNotificationForUser(
//                 nonExistentId,
//                 testUser.username
//             )).rejects.toThrow("Notification not found");
//         });

//         it('should throw "Not allowed" if the user attempts to delete another user\'s notification', async () => {
//             const notifIdToSteal = notificationsOtherUser[0].id;

//             // Tenta la cancellazione con testUser
//             await expect(notificationController.deleteNotificationForUser(
//                 notifIdToSteal,
//                 testUser.username // Utente sbagliato
//             )).rejects.toThrow("Not allowed");

//             const remainingOtherUserNotifications = await notificationController.getMyNotifications(otherUser.username);
//             expect(remainingOtherUserNotifications.length).toBe(3);
//         });

//     })


//     describe("markAsReadForUser",  () => {

//         it('should mark a specific notification as read and return the updated DTO', async () => {
//             // vedo se non è già stata letta
//             let initialNotifications = await notificationController.getMyNotifications(testUser.username);
//             let notifToUpdate = initialNotifications.find(n => n.id === notificationToBeMarked.id)!;
//             expect(notifToUpdate.is_read).toBe(false);

//             // act
//             const updatedNotification = await notificationController.markAsReadForUser(
//                 notificationToBeMarked.id,
//                 testUser.username
//             );

//             // verifico che adesso sia letta
//             expect(updatedNotification.id).toBe(notificationToBeMarked.id);
//             expect(updatedNotification.is_read).toBe(true);

//             // verifico anche nel db
//             const finalNotifications = await notificationController.getMyNotifications(testUser.username);
//             const updatedNotifInDb = finalNotifications.find(n => n.id === notificationToBeMarked.id)!;
//             expect(updatedNotifInDb.is_read).toBe(true);
//         });

//         it('should throw "User not found" if the username does not exist', async () => {
//             await expect(notificationController.markAsReadForUser(
//                 notificationToBeMarked.id,
//                 "wrong username"
//             )).rejects.toThrow("User not found");
//         });

//         it('should throw "Notification not found" if the notification ID does not exist', async () => {
//             const nonExistentId = 9999;
//             await expect(notificationController.markAsReadForUser(
//                 nonExistentId,
//                 testUser.username
//             )).rejects.toThrow("Notification not found");
//         });

//         it('should throw "Not allowed" if the user attempts to mark another user\'s notification as read', async () => {
//             const notifIdToSteal = notificationOtherUser.id; // Notifica di otherUser

//             // tenta di marcare come letta con testUser
//             await expect(notificationController.markAsReadForUser(
//                 notifIdToSteal,
//                 testUser.username // Utente sbagliato
//             )).rejects.toThrow("Not allowed");

//             // werifica che la notifica sia rimasta NON letta nel db dell'altro utente
//             const remainingOtherUserNotifications = await notificationController.getMyNotifications(otherUser.username);
//             const notifInDb = remainingOtherUserNotifications.find(n => n.id === notifIdToSteal);
//             expect(notifInDb?.is_read).toBe(false);
//         });

//     });

// });
