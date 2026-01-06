// src/tests/integration/repositories/ChatRepository.test.ts
import { TestDataSource } from '../../test-data-source';
import { ChatRepository } from '../../../repositories/ChatRepository';
import { Chat } from '../../../models/Chat';
import { Report } from '../../../models/Report';
import { User } from '../../../models/User';
import { Category } from '../../../models/Category';
import { ChatType } from '../../../models/ChatType';
import { Repository } from 'typeorm';

describe('ChatRepository (integration)', () => {
    let chatRepository: ChatRepository;
    let reportRepository: Repository<Report>;
    let userRepository: Repository<User>;
    let categoryRepository: Repository<Category>;
    let chatOrmRepository: Repository<Chat>;

    let testUser: User;
    let testCategory: Category;
    let testReport: Report;

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

        chatRepository = new ChatRepository(TestDataSource);
        reportRepository = TestDataSource.getRepository(Report);
        userRepository = TestDataSource.getRepository(User);
        categoryRepository = TestDataSource.getRepository(Category);
        chatOrmRepository = TestDataSource.getRepository(Chat);

        // Prepara un utente
        testUser = new User();
        testUser.username = 'reporteruser';
        testUser.email = 'reporter@example.com';
        testUser.password = 'password123';
        testUser.first_name = 'Test';
        testUser.last_name = 'User';
        await userRepository.save(testUser);

        // Prepara una categoria
        testCategory = new Category();
        testCategory.name = 'Dissesto';
        await categoryRepository.save(testCategory);

        // Prepara un report
        testReport = new Report();
        testReport.title = 'Buca';
        testReport.description = 'Descrizione';
        testReport.latitude = 45.0;
        testReport.longitude = 9.0;
        testReport.user = testUser;
        testReport.category = testCategory;
        testReport.explanation = ''; 
        testReport.anonymous = false;
        await reportRepository.save(testReport);
    });

    afterAll(async () => {
        if (TestDataSource.isInitialized) {
            await TestDataSource.destroy();
        }
    });

    it('should add a chat to a report', async () => {
        const chat = new Chat();
        chat.type = ChatType.OFFICER_USER;
        chat.report = testReport;

        const savedChat = await chatRepository.add(chat);

        expect(savedChat).toBeDefined();
        expect(savedChat.id).toBeDefined();
        expect(savedChat.type).toBe(ChatType.OFFICER_USER);
        expect(savedChat.report.id).toBe(testReport.id);
    });

    it('should find all chats by report ID', async () => {
        const chat1 = new Chat();
        chat1.type = ChatType.OFFICER_USER;
        chat1.report = testReport;
        await chatRepository.add(chat1);

        const chat2 = new Chat();
        chat2.type = ChatType.LEAD_EXTERNAL;
        chat2.report = testReport;
        await chatRepository.add(chat2);

        const chats = await chatRepository.findAllByReportId(testReport.id);
        expect(chats.length).toBe(2);
        expect(chats.some(c => c.type === ChatType.OFFICER_USER)).toBe(true);
        expect(chats.some(c => c.type === ChatType.LEAD_EXTERNAL)).toBe(true);
    });

    it('should find a chat by ID with relations', async () => {
        const chat = new Chat();
        chat.type = ChatType.OFFICER_USER;
        chat.report = testReport;
        const saved = await chatRepository.add(chat);

        const found = await chatRepository.findById(saved.id);
        expect(found).not.toBeNull();
        expect(found?.id).toBe(saved.id);
        expect(found?.report).toBeDefined();
        expect(found?.report.id).toBe(testReport.id);
        expect(found?.report.user).toBeDefined();
    });

    it('should find a chat by report ID and type', async () => {
        const chat = new Chat();
        chat.type = ChatType.OFFICER_USER;
        chat.report = testReport;
        await chatRepository.add(chat);

        const found = await chatRepository.findByReportIdAndType(testReport.id, ChatType.OFFICER_USER);
        expect(found).not.toBeNull();
        expect(found?.type).toBe(ChatType.OFFICER_USER);
        expect(found?.report.id).toBe(testReport.id);

        const notFound = await chatRepository.findByReportIdAndType(testReport.id, ChatType.LEAD_EXTERNAL);
        expect(notFound).toBeNull();
    });

    it('should remove a chat', async () => {
        const chat = new Chat();
        chat.type = ChatType.OFFICER_USER;
        chat.report = testReport;
        const saved = await chatRepository.add(chat);

        await chatRepository.remove(saved);

        const found = await chatOrmRepository.findOneBy({ id: saved.id });
        expect(found).toBeNull();
    });

    it('should add an OFFICER_USER chat to a report using addReportToChatOfficerUser', async () => {
        const chat = await chatRepository.addReportToChatOfficerUser(testReport);
        
        expect(chat).toBeDefined();
        expect(chat.type).toBe(ChatType.OFFICER_USER);
        expect(chat.report.id).toBe(testReport.id);
        
        const found = await chatOrmRepository.findOne({ where: { id: chat.id }, relations: ['report'] });
        expect(found?.type).toBe(ChatType.OFFICER_USER);
    });

    it('should add a LEAD_EXTERNAL chat to a report using addReportToLeadExternalUser', async () => {
        const chat = await chatRepository.addReportToLeadExternalUser(testReport);
        
        expect(chat).toBeDefined();
        expect(chat.type).toBe(ChatType.LEAD_EXTERNAL);
        expect(chat.report.id).toBe(testReport.id);
        
        const found = await chatOrmRepository.findOne({ where: { id: chat.id }, relations: ['report'] });
        expect(found?.type).toBe(ChatType.LEAD_EXTERNAL);
    });
});
