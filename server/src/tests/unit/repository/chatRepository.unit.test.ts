// src/tests/unit/repository/chatRepository.unit.test.ts
import { ChatRepository } from "../../../repositories/ChatRepository";
import { Chat } from "../../../models/Chat";
import { Report } from "../../../models/Report";
import { ChatType } from "../../../models/ChatType";
import { User } from "../../../models/User";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";
import { Message } from "../../../models/Message";

// Mock of TypeORM repository
const mockOrmRepository = {
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
  save: jest.fn().mockImplementation(c => Promise.resolve(c)),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe("ChatRepository - Unit Test (Mock ORM)", () => {
  let chatRepository: ChatRepository;

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

  const mockMessage: Message = {
    id: 10,
    content: "Test message",
    sender: "USER",
    created_at: new Date(),
    chat: null as any,
  } as Message;

  const mockChat: Chat = {
    id: 20,
    type: ChatType.OFFICER_USER,
    report: mockReport,
    messages: [mockMessage],
  } as Chat;

  beforeEach(() => {
    // Mock DataSource and getRepository
    const mockDataSource = {
      getRepository: jest.fn(() => mockOrmRepository),
    };

    chatRepository = new ChatRepository(mockDataSource as any);
    jest.clearAllMocks();

    // Default setup
    mockOrmRepository.find.mockResolvedValue([mockChat]);
    mockOrmRepository.save.mockImplementation(c => Promise.resolve(c));
  });

  // ------------------------------------------------------------------
  // Finders
  // ------------------------------------------------------------------
  it("should call find with report id filter for findAllByReportId", async () => {
    await chatRepository.findAllByReportId(5);

    expect(mockOrmRepository.find).toHaveBeenCalledWith({
      where: { report: { id: 5 } },
      relations: ["messages", "report"],
    });
  });

  it("should use queryBuilder to find chat by id with relations", async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockChat),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await chatRepository.findById(20);

    expect(mockOrmRepository.createQueryBuilder).toHaveBeenCalledWith("chat");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("chat.report", "report");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("report.user", "user");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("report.officer", "officer");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("officer.role", "officerRole");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("report.leadOfficer", "leadOfficer");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("chat.messages", "messages");
    expect(mockQueryBuilder.where).toHaveBeenCalledWith("chat.id = :id", { id: 20 });
    expect(mockQueryBuilder.getOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockChat);
  });

  it("should return null when findById does not find chat", async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await chatRepository.findById(999);

    expect(result).toBeNull();
  });

  it("should use queryBuilder to find chat by report id and type", async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(mockChat),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await chatRepository.findByReportIdAndType(5, ChatType.OFFICER_USER);

    expect(mockOrmRepository.createQueryBuilder).toHaveBeenCalledWith("chat");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("chat.report", "report");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("chat.messages", "messages");
    expect(mockQueryBuilder.where).toHaveBeenCalledWith("report.id = :reportId", { reportId: 5 });
    expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith("chat.type = :type", { type: ChatType.OFFICER_USER });
    expect(mockQueryBuilder.getOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockChat);
  });

  it("should return null when findByReportIdAndType does not find chat", async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await chatRepository.findByReportIdAndType(999, ChatType.OFFICER_USER);

    expect(result).toBeNull();
  });

  // ------------------------------------------------------------------
  // CRUD Operations
  // ------------------------------------------------------------------
  it("should call save for add", async () => {
    await chatRepository.add(mockChat);

    expect(mockOrmRepository.save).toHaveBeenCalledWith(mockChat);
  });

  it("should call remove for remove", async () => {
    await chatRepository.remove(mockChat);

    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockChat);
  });

  // ------------------------------------------------------------------
  // Chat Creation
  // ------------------------------------------------------------------
  it("should create OFFICER_USER chat with addReportToChatOfficerUser", async () => {
    mockOrmRepository.save.mockResolvedValueOnce(mockChat);

    const result = await chatRepository.addReportToChatOfficerUser(mockReport);

    expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
    const savedChat = (mockOrmRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedChat.type).toBe(ChatType.OFFICER_USER);
    expect(savedChat.report).toEqual({ id: mockReport.id });
    expect(result).toEqual(mockChat);
  });

  it("should create LEAD_EXTERNAL chat with addReportToLeadExternalUser", async () => {
    mockOrmRepository.save.mockResolvedValueOnce(mockChat);

    const result = await chatRepository.addReportToLeadExternalUser(mockReport);

    expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
    const savedChat = (mockOrmRepository.save as jest.Mock).mock.calls[0][0];
    expect(savedChat.type).toBe(ChatType.LEAD_EXTERNAL);
    expect(savedChat.report).toEqual({ id: mockReport.id });
    expect(result).toEqual(mockChat);
  });

  it("should set only report id without loading full report object", async () => {
    mockOrmRepository.save.mockResolvedValueOnce(mockChat);

    await chatRepository.addReportToChatOfficerUser(mockReport);

    const savedChat = (mockOrmRepository.save as jest.Mock).mock.calls[0][0];
    // Verify that report is a partial object with only id
    expect(savedChat.report).toEqual({ id: mockReport.id });
  });
});