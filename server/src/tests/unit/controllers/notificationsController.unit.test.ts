// import {
//   getMyNotifications,
//   deleteNotificationForUser,
//   markAsReadForUser,
//   initializeNotificationController
// } from '../../../controllers/notificationController';

// import { NotificationRepository } from '../../../repositories/NotificationRepository';
// import { UserRepository } from '../../../repositories/UserRepository';
// import { DataSource } from 'typeorm';
// import { Notification } from '../../../models/Notification';
// import { User } from '../../../models/User';
// import { NotificationType } from '../../../models/NotificationType';

// // Mock external modules
// jest.mock('../../../repositories/NotificationRepository');
// jest.mock('../../../repositories/UserRepository');
// jest.mock('../../../services/mapperService');

// describe('notificationController (unit)', () => {
//   let mockNotificationRepository: any;
//   let mockUserRepository: any;
//   const mockMapper = require('../../../services/mapperService');

//   // Mock DAO/DTO data
//   const mockUser: User = {
//     id: 1,
//     username: 'testuser',
//     email: 'test@example.com',
//     password: 'hashed',
//     first_name: 'Test',
//     last_name: 'User',
//     photo: null,
//     telegram_id: null,
//     flag_email: true,
//     verified: true,
//     reports: [],
//     notifications: []
//   } as User;

//   const mockNotificationDAO: Notification = {
//     id: 10,
//     user: mockUser,
//     content: 'Test notification content',
//     type: NotificationType.ReportChanged,
//     is_read: false,
//     created_at: new Date()
//   } as Notification;

//   const mockNotificationDTO = {
//     id: 10,
//     content: 'Test notification content',
//     type: NotificationType.ReportChanged,
//     is_read: false,
//     created_at: mockNotificationDAO.created_at
//   };

//   beforeEach(() => {
//     jest.clearAllMocks();

//     mockNotificationRepository = {
//       findByUser: jest.fn(),
//       findById: jest.fn(),
//       remove: jest.fn(),
//       markAsRead: jest.fn()
//     };

//     mockUserRepository = {
//       findByUsername: jest.fn()
//     };

//     (NotificationRepository as unknown as jest.Mock).mockImplementation(() => mockNotificationRepository);
//     (UserRepository as unknown as jest.Mock).mockImplementation(() => mockUserRepository);

//     // default mapper behavior
//     (mockMapper.mapNotificationDAOToDTO as jest.Mock).mockReturnValue(mockNotificationDTO);

//     initializeNotificationController({} as DataSource);
//   });

//   // getMyNotifications: success
//   it('getMyNotifications should return mapped notifications for user', async () => {
//     const notifList = [
//       { ...mockNotificationDAO, id: 10 },
//       { ...mockNotificationDAO, id: 11 }
//     ];

//     mockUserRepository.findByUsername.mockResolvedValueOnce(mockUser);
//     mockNotificationRepository.findByUser.mockResolvedValueOnce(notifList);
//     (mockMapper.mapNotificationDAOToDTO as jest.Mock).mockImplementation((dao: any) => ({
//       id: dao.id,
//       content: dao.content
//     }));

//     const res = await getMyNotifications(mockUser.username);

//     expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(mockUser.username);
//     expect(mockNotificationRepository.findByUser).toHaveBeenCalledWith(mockUser.id);
//     expect(res).toHaveLength(2);
//     expect(res[0]).toEqual({ id: 10, content: 'Test notification content' });
//   });

//   // getMyNotifications: user not found
//   it('getMyNotifications should throw when user not found', async () => {
//     mockUserRepository.findByUsername.mockResolvedValueOnce(null);

//     await expect(getMyNotifications('nonexistent')).rejects.toThrow('User not found');
//     expect(mockNotificationRepository.findByUser).not.toHaveBeenCalled();
//   });

//   // deleteNotificationForUser: success
//   it('deleteNotificationForUser should remove notification and return success', async () => {
//     const notifId = 10;

//     mockUserRepository.findByUsername.mockResolvedValueOnce(mockUser);
//     mockNotificationRepository.findById.mockResolvedValueOnce(mockNotificationDAO);
//     mockNotificationRepository.remove.mockResolvedValueOnce(true);

//     const res = await deleteNotificationForUser(notifId, mockUser.username);

//     expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(mockUser.username);
//     expect(mockNotificationRepository.findById).toHaveBeenCalledWith(notifId);
//     expect(mockNotificationRepository.remove).toHaveBeenCalledWith(mockNotificationDAO);
//     expect(res).toEqual({ success: true });
//   });

//   // deleteNotificationForUser: user not found
//   it('deleteNotificationForUser should throw when user not found', async () => {
//     mockUserRepository.findByUsername.mockResolvedValueOnce(null);

//     await expect(deleteNotificationForUser(10, 'nonexistent')).rejects.toThrow('User not found');
//     expect(mockNotificationRepository.findById).not.toHaveBeenCalled();
//   });

//   // deleteNotificationForUser: notification not found
//   it('deleteNotificationForUser should throw when notification not found', async () => {
//     mockUserRepository.findByUsername.mockResolvedValueOnce(mockUser);
//     mockNotificationRepository.findById.mockResolvedValueOnce(null);

//     await expect(deleteNotificationForUser(999, mockUser.username)).rejects.toThrow('Notification not found');
//     expect(mockNotificationRepository.remove).not.toHaveBeenCalled();
//   });

//   // deleteNotificationForUser: user is not owner
//   it('deleteNotificationForUser should throw when user is not owner of notification', async () => {
//     const otherUser = { ...mockUser, id: 99, username: 'otheruser' };
//     const notifId = 10;

//     mockUserRepository.findByUsername.mockResolvedValueOnce(otherUser);
//     mockNotificationRepository.findById.mockResolvedValueOnce(mockNotificationDAO);

//     await expect(deleteNotificationForUser(notifId, otherUser.username)).rejects.toThrow('Not allowed');
//     expect(mockNotificationRepository.remove).not.toHaveBeenCalled();
//   });

//   // markAsReadForUser: success
//   it('markAsReadForUser should mark notification as read and return mapped DTO', async () => {
//     const notifId = 10;
//     const readNotification = { ...mockNotificationDAO, is_read: true };

//     mockUserRepository.findByUsername.mockResolvedValueOnce(mockUser);
//     mockNotificationRepository.findById.mockResolvedValueOnce(mockNotificationDAO);
//     mockNotificationRepository.markAsRead.mockResolvedValueOnce(readNotification);
//     (mockMapper.mapNotificationDAOToDTO as jest.Mock).mockReturnValueOnce(mockNotificationDTO);

//     const res = await markAsReadForUser(notifId, mockUser.username);

//     expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(mockUser.username);
//     expect(mockNotificationRepository.findById).toHaveBeenCalledWith(notifId);
//     expect(mockNotificationRepository.markAsRead).toHaveBeenCalledWith(mockNotificationDAO);
//     expect(res).toEqual(mockNotificationDTO);
//   });

//   // markAsReadForUser: user not found
//   it('markAsReadForUser should throw when user not found', async () => {
//     mockUserRepository.findByUsername.mockResolvedValueOnce(null);

//     await expect(markAsReadForUser(10, 'nonexistent')).rejects.toThrow('User not found');
//     expect(mockNotificationRepository.findById).not.toHaveBeenCalled();
//   });

//   // markAsReadForUser: notification not found
//   it('markAsReadForUser should throw when notification not found', async () => {
//     mockUserRepository.findByUsername.mockResolvedValueOnce(mockUser);
//     mockNotificationRepository.findById.mockResolvedValueOnce(null);

//     await expect(markAsReadForUser(999, mockUser.username)).rejects.toThrow('Notification not found');
//     expect(mockNotificationRepository.markAsRead).not.toHaveBeenCalled();
//   });

//   // markAsReadForUser: user is not owner
//   it('markAsReadForUser should throw when user is not owner of notification', async () => {
//     const otherUser = { ...mockUser, id: 99, username: 'otheruser' };
//     const notifId = 10;

//     mockUserRepository.findByUsername.mockResolvedValueOnce(otherUser);
//     mockNotificationRepository.findById.mockResolvedValueOnce(mockNotificationDAO);

//     await expect(markAsReadForUser(notifId, otherUser.username)).rejects.toThrow('Not allowed');
//     expect(mockNotificationRepository.markAsRead).not.toHaveBeenCalled();
//   });
// });