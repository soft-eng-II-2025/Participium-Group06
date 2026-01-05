// src/tests/integration/repositories/MessageRepository.test.ts
import { TestDataSource } from '../../test-data-source';
import { MessageRepository } from '../../../repositories/MessageRepository';
import { Message } from '../../../models/Message';
import { Chat } from '../../../models/Chat';
import { Report } from '../../../models/Report';
import { User } from '../../../models/User';
import { Category } from '../../../models/Category';
import { ChatType } from '../../../models/ChatType';
import { SenderType } from '../../../models/SenderType';
import { Repository } from 'typeorm';

describe('MessageRepository (integration)', () => {
  let messageRepository: MessageRepository;
  let chatRepository: Repository<Chat>;
  let reportRepository: Repository<Report>;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let messageOrmRepository: Repository<Message>;

  let testUser: User;
  let testCategory: Category;
  let testReport: Report;
  let testChat: Chat;

  beforeEach(async () => {
    // If we use runInBand, we want to ensure a clean state.
    // Sometimes synchronizing again helps with ENUM issues in Postgres
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    } else {
      await TestDataSource.synchronize(false); // don't drop, just sync
    }

    // Clean up tables using CASCADE for PostgreSQL
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`);
    }

    messageRepository = new MessageRepository(TestDataSource);
    chatRepository = TestDataSource.getRepository(Chat);
    reportRepository = TestDataSource.getRepository(Report);
    userRepository = TestDataSource.getRepository(User);
    categoryRepository = TestDataSource.getRepository(Category);
    messageOrmRepository = TestDataSource.getRepository(Message);

    // Setup basic hierarchy
    testUser = new User();
    testUser.username = 'testuser';
    testUser.email = 'test@example.com';
    testUser.password = 'password123';
    testUser.first_name = 'Test';
    testUser.last_name = 'User';
    await userRepository.save(testUser);

    testCategory = new Category();
    testCategory.name = 'Rifiuti';
    await categoryRepository.save(testCategory);

    testReport = new Report();
    testReport.title = 'Buca strada';
    testReport.description = 'Descrizione';
    testReport.latitude = 45.0;
    testReport.longitude = 9.0;
    testReport.user = testUser;
    testReport.category = testCategory;
    testReport.explanation = '';
    testReport.anonymous = false;
    await reportRepository.save(testReport);

    testChat = new Chat();
    testChat.type = ChatType.OFFICER_USER;
    testChat.report = testReport;
    await chatRepository.save(testChat);
  });

  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  it('should add/save a message', async () => {
    const message = new Message();
    message.content = 'Ciao, come va?';
    message.sender = SenderType.USER;
    message.chat = testChat;

    const saved = await messageRepository.add(message);

    expect(saved).toBeDefined();
    expect(saved.id).toBeDefined();
    expect(saved.content).toBe('Ciao, come va?');
    expect(saved.chat.id).toBe(testChat.id);
  });

  it('should find a message by ID', async () => {
    const message = new Message();
    message.content = 'Messaggio di prova';
    message.sender = SenderType.USER;
    message.chat = testChat;
    const saved = await messageRepository.add(message);

    const found = await messageRepository.findById(saved.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(saved.id);
    expect(found?.content).toBe('Messaggio di prova');
  });

  it('should find messages by chatId ordered by created_at ASC', async () => {
    const m1 = new Message();
    m1.content = 'Primo';
    m1.sender = SenderType.USER;
    m1.chat = testChat;
    await messageRepository.add(m1);

    // Delay slightly to ensure temporal order if needed, 
    // though usually save sequence works fine for timestamps in sequence
    const m2 = new Message();
    m2.content = 'Secondo';
    m2.sender = SenderType.OFFICER;
    m2.chat = testChat;
    await messageRepository.add(m2);

    const messages = await messageRepository.findByChatId(testChat.id);
    expect(messages.length).toBe(2);
    expect(messages[0].content).toBe('Primo');
    expect(messages[1].content).toBe('Secondo');
    
    // Verify nested relations check (from repo code)
    expect(messages[0].chat.report.user).toBeDefined();
    expect(messages[0].chat.report.user.id).toBe(testUser.id);
  });

  it('should remove a message', async () => {
    const message = new Message();
    message.content = 'Da eliminare';
    message.sender = SenderType.USER;
    message.chat = testChat;
    const saved = await messageRepository.add(message);

    await messageRepository.remove(saved);

    const found = await messageOrmRepository.findOneBy({ id: saved.id });
    expect(found).toBeNull();
  });

  it('should find all messages', async () => {
    const message = new Message();
    message.content = 'Test find all';
    message.sender = SenderType.USER;
    message.chat = testChat;
    await messageRepository.add(message);

    const messages = await messageRepository.findAll();
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].chat).toBeDefined();
  });
});
