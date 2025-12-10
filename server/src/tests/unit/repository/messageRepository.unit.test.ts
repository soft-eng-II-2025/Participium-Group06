// src/tests/unit/repository/messageRepository.unit.test.ts
import { MessageRepository } from "../../../repositories/MessageRepository";
import { Message } from "../../../models/Message";
import { Chat } from "../../../models/Chat";
import { Report } from "../../../models/Report";
import { User } from "../../../models/User";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";
import { ChatType } from "../../../models/ChatType";

// Mock of TypeORM repository
const mockOrmRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn().mockImplementation(m => Promise.resolve(m)),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe("MessageRepository - Unit Test (Mock ORM)", () => {
  let messageRepository: MessageRepository;

  // Mock data
  const mockUser: User = {
    id: 1,
    username: "testuser",
    email: "test@example.com",
    password: "hashed",
    first_name: "Test",
    last_name: "User",
    photo: null,
    telegram_id: null,
    flag_email: true,
    verified: true,
    reports: [],
    notifications: [],
  } as User;

  const mockOfficer: MunicipalityOfficer = {
    id: 100,
    username: "testofficer",
    email: "officer@example.com",
    password: "hashed",
    first_name: "Officer",
    last_name: "Test",
    external: false,
    companyName: null,
    role: { id: 1, title: "TECH_AGENT", label: "Tech Agent" } as any,
    reports: [],
    leadReports: [],
  } as MunicipalityOfficer;

  const mockLeadOfficer: MunicipalityOfficer = {
    id: 101,
    username: "testlead",
    email: "lead@example.com",
    password: "hashed",
    first_name: "Lead",
    last_name: "Officer",
    external: false,
    companyName: null,
    role: { id: 2, title: "TECH_LEAD", label: "Tech Lead" } as any,
    reports: [],
    leadReports: [],
  } as MunicipalityOfficer;

  const mockReport: Report = {
    id: 5,
    title: "Test Report",
    description: "Test description",
    longitude: 7.5,
    latitude: 45.0,
    status: "Pending Approval" as any,
    explanation: "",
    createdAt: new Date(),
    user: mockUser,
    officer: mockOfficer,
    leadOfficer: mockLeadOfficer,
    category: { id: 1, name: "Water" } as any,
    photos: [],
    chats: [],
  } as Report;

  const mockChat: Chat = {
    id: 20,
    type: ChatType.OFFICER_USER,
    report: mockReport,
    messages: [],
  } as Chat;

  const mockMessage: Message = {
    id: 30,
    content: "Test message content",
    sender: "USER",
    created_at: new Date(),
    chat: mockChat,
  } as Message;

  const mockMessage2: Message = {
    id: 31,
    content: "Second message",
    sender: "OFFICER",
    created_at: new Date(Date.now() + 60000),
    chat: mockChat,
  } as Message;

  beforeEach(() => {
    // Mock DataSource and getRepository
    const mockDataSource = {
      getRepository: jest.fn(() => mockOrmRepository),
    };

    messageRepository = new MessageRepository(mockDataSource as any);
    jest.clearAllMocks();

    // Default setup
    mockOrmRepository.find.mockResolvedValue([mockMessage, mockMessage2]);
    mockOrmRepository.findOne.mockResolvedValue(mockMessage);
    mockOrmRepository.save.mockImplementation(m => Promise.resolve(m));
  });

  // ------------------------------------------------------------------
  // Finders
  // ------------------------------------------------------------------
  it("should call find with relations for findAll", async () => {
    await messageRepository.findAll();

    expect(mockOrmRepository.find).toHaveBeenCalledWith({
      relations: ["user", "municipality_officer"],
      order: { created_at: "ASC" },
    });
  });

  it("should return all messages sorted by created_at ascending", async () => {
    const result = await messageRepository.findAll();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockMessage);
    expect(result[1]).toEqual(mockMessage2);
  });

  it("should call findOne for findById", async () => {
    await messageRepository.findById(30);

    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: 30 },
    });
  });

  it("should return null when findById does not find message", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    const result = await messageRepository.findById(999);

    expect(result).toBeNull();
  });

  it("should call find with chat id filter and relations for findByChatId", async () => {
    await messageRepository.findByChatId(20);

    expect(mockOrmRepository.find).toHaveBeenCalledWith({
      where: { chat: { id: 20 } },
      order: { created_at: "ASC" },
      relations: {
        chat: {
          report: {
            user: true,
            officer: {
              role: true,
            },
            leadOfficer: {
              role: true,
            },
          },
        },
      },
    });
  });

  it("should return messages for a chat sorted by created_at", async () => {
    const result = await messageRepository.findByChatId(20);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockMessage);
    expect(result[1]).toEqual(mockMessage2);
  });

  it("should return empty array when no messages found for chat", async () => {
    mockOrmRepository.find.mockResolvedValueOnce([]);

    const result = await messageRepository.findByChatId(999);

    expect(result).toEqual([]);
  });

  // ------------------------------------------------------------------
  // CRUD Operations
  // ------------------------------------------------------------------
  it("should call save for add", async () => {
    await messageRepository.add(mockMessage);

    expect(mockOrmRepository.save).toHaveBeenCalledWith(mockMessage);
  });

  it("should return the saved message from add", async () => {
    mockOrmRepository.save.mockResolvedValueOnce(mockMessage);

    const result = await messageRepository.add(mockMessage);

    expect(result).toEqual(mockMessage);
  });

  it("should call remove for remove", async () => {
    await messageRepository.remove(mockMessage);

    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockMessage);
  });

  it("should update a message when saving with existing id", async () => {
    const updatedMessage: Message = {
      ...mockMessage,
      content: "Updated content",
    };
    mockOrmRepository.save.mockResolvedValueOnce(updatedMessage);

    const result = await messageRepository.add(updatedMessage);

    expect(result.content).toBe("Updated content");
    expect(mockOrmRepository.save).toHaveBeenCalledWith(updatedMessage);
  });

  // ------------------------------------------------------------------
  // Edge Cases and Order
  // ------------------------------------------------------------------
  it("should maintain chronological order when finding messages by chat", async () => {
    const msg1 = { ...mockMessage, id: 1, created_at: new Date("2025-01-01") };
    const msg2 = { ...mockMessage, id: 2, created_at: new Date("2025-01-02") };
    const msg3 = { ...mockMessage, id: 3, created_at: new Date("2025-01-03") };

    mockOrmRepository.find.mockResolvedValueOnce([msg1, msg2, msg3]);

    const result = await messageRepository.findByChatId(20);

    expect(result[0].created_at.getTime()).toBeLessThan(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeLessThan(result[2].created_at.getTime());
  });

  it("should handle multiple removes in sequence", async () => {
    await messageRepository.remove(mockMessage);
    await messageRepository.remove(mockMessage2);

    expect(mockOrmRepository.remove).toHaveBeenCalledTimes(2);
    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockMessage);
    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockMessage2);
  });

  it("should load nested relations for chat and report data", async () => {
    await messageRepository.findByChatId(20);

    const callArgs = (mockOrmRepository.find as jest.Mock).mock.calls[0][0];
    expect(callArgs.relations.chat).toBeDefined();
    expect(callArgs.relations.chat.report).toBeDefined();
    expect(callArgs.relations.chat.report.user).toBe(true);
    expect(callArgs.relations.chat.report.officer).toBeDefined();
    expect(callArgs.relations.chat.report.officer.role).toBe(true);
    expect(callArgs.relations.chat.report.leadOfficer).toBeDefined();
    expect(callArgs.relations.chat.report.leadOfficer.role).toBe(true);
  });
});