// src/tests/integration/repositories/NotificationRepository.test.ts
import { TestDataSource } from '../../test-data-source';
import { NotificationRepository } from '../../../repositories/NotificationRepository';
import { Notification } from '../../../models/Notification';
import { User } from '../../../models/User';
import { NotificationType } from '../../../models/NotificationType';
import { Repository } from 'typeorm';

describe('NotificationRepository (integration)', () => {
  let notificationRepository: NotificationRepository;
  let userOrmRepository: Repository<User>;
  let notificationOrmRepository: Repository<Notification>;
  let testUser: User;

  beforeEach(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }

    // Clean up tables using CASCADE for PostgreSQL
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`);
    }

    notificationRepository = new NotificationRepository(TestDataSource);
    userOrmRepository = TestDataSource.getRepository(User);
    notificationOrmRepository = TestDataSource.getRepository(Notification);

    // Create a test user common to most tests
    testUser = new User();
    testUser.username = 'testuser';
    testUser.email = 'test@example.com';
    testUser.password = 'password123';
    testUser.first_name = 'Test';
    testUser.last_name = 'User';
    await userOrmRepository.save(testUser);
  });

  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  it('should add a notification', async () => {
    const notification = new Notification();
    notification.type = NotificationType.ReportChanged;
    notification.content = 'Il tuo report è stato aggiornato';
    notification.user = testUser;

    const savedNotification = await notificationRepository.add(notification);

    expect(savedNotification).toBeDefined();
    expect(savedNotification.id).toBeDefined();
    expect(savedNotification.content).toBe('Il tuo report è stato aggiornato');
    expect(savedNotification.user.id).toBe(testUser.id);
  });

  it('should find all notifications ordered by created_at DESC', async () => {
    const n1 = new Notification();
    n1.type = NotificationType.ReportChanged;
    n1.content = 'Notifica 1';
    n1.user = testUser;
    await notificationRepository.add(n1);

    // Small delay to ensure different timestamps if needed, 
    // though usually direct sequence is enough for DESC check if IDs are handled
    const n2 = new Notification();
    n2.type = NotificationType.NewMessage;
    n2.content = 'Notifica 2';
    n2.user = testUser;
    await notificationRepository.add(n2);

    const allNotifications = await notificationRepository.findAll();
    expect(allNotifications.length).toBe(2);
    // DESC order means the second one added should be first
    expect(allNotifications[0].content).toBe('Notifica 2');
    expect(allNotifications[1].content).toBe('Notifica 1');
  });

  it('should find a notification by ID', async () => {
    const notification = new Notification();
    notification.type = NotificationType.ReportChanged;
    notification.content = 'Trova per ID';
    notification.user = testUser;
    const saved = await notificationRepository.add(notification);

    const found = await notificationRepository.findById(saved.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.content).toBe('Trova per ID');
    expect(found?.user.id).toBe(testUser.id);
  });

  it('should find notifications by user', async () => {
    // Another user to check isolation
    const otherUser = new User();
    otherUser.username = 'other';
    otherUser.email = 'other@example.com';
    otherUser.password = 'pass';
    otherUser.first_name = 'Other';
    otherUser.last_name = 'User';
    await userOrmRepository.save(otherUser);

    const n1 = new Notification();
    n1.type = NotificationType.ReportChanged;
    n1.content = 'User Test';
    n1.user = testUser;
    await notificationRepository.add(n1);

    const n2 = new Notification();
    n2.type = NotificationType.ReportChanged;
    n2.content = 'User Other';
    n2.user = otherUser;
    await notificationRepository.add(n2);

    const userNotifications = await notificationRepository.findByUser(testUser.id);
    expect(userNotifications.length).toBe(1);
    expect(userNotifications[0].content).toBe('User Test');
    expect(userNotifications[0].user.id).toBe(testUser.id);
  });

  it('should find only unread notifications by user', async () => {
    const n1 = new Notification();
    n1.type = NotificationType.ReportChanged;
    n1.content = 'Unread';
    n1.is_read = false;
    n1.user = testUser;
    await notificationRepository.add(n1);

    const n2 = new Notification();
    n2.type = NotificationType.ReportChanged;
    n2.content = 'Read';
    n2.is_read = true;
    n2.user = testUser;
    await notificationRepository.add(n2);

    const unreadNotifications = await notificationRepository.findUnreadByUser(testUser.id);
    expect(unreadNotifications.length).toBe(1);
    expect(unreadNotifications[0].content).toBe('Unread');
    expect(unreadNotifications[0].is_read).toBe(false);
  });

  it('should mark a notification as read', async () => {
    const notification = new Notification();
    notification.type = NotificationType.ReportChanged;
    notification.content = 'Da leggere';
    notification.is_read = false;
    notification.user = testUser;
    await notificationRepository.add(notification);

    const updated = await notificationRepository.markAsRead(notification);
    expect(updated.is_read).toBe(true);

    const found = await notificationOrmRepository.findOneBy({ id: notification.id });
    expect(found?.is_read).toBe(true);
  });

  it('should remove a notification', async () => {
    const notification = new Notification();
    notification.type = NotificationType.ReportChanged;
    notification.content = 'Da eliminare';
    notification.user = testUser;
    await notificationRepository.add(notification);

    await notificationRepository.remove(notification);

    const found = await notificationOrmRepository.findOneBy({ id: notification.id });
    expect(found).toBeNull();
  });
});
