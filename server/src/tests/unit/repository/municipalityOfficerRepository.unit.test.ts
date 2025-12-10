// src/tests/unit/repository/municipalityOfficerRepository.unit.test.ts
import { MunicipalityOfficerRepository } from "../../../repositories/MunicipalityOfficerRepository";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";
import { Role } from "../../../models/Role";

// Mock of TypeORM repository
const mockOrmRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn().mockImplementation(o => Promise.resolve(o)),
  createQueryBuilder: jest.fn(),
};

describe("MunicipalityOfficerRepository - Unit Test (Mock ORM)", () => {
  let municipalityOfficerRepository: MunicipalityOfficerRepository;

  // Mock data
  const mockRole: Role = {
    id: 1,
    title: "TECH_AGENT_INFRASTRUCTURE",
    label: "Tech Agent, Infrastructure",
    municipalityOfficer: [],
    categories: [],
  } as Role;

  const mockAdminRole: Role = {
    id: 2,
    title: "ADMIN",
    label: "Administrator",
    municipalityOfficer: [],
    categories: [],
  } as Role;

  const mockOfficer: MunicipalityOfficer = {
    id: 100,
    username: "testofficer",
    email: "officer@example.com",
    password: "hashed_password",
    first_name: "Officer",
    last_name: "Test",
    external: false,
    companyName: null,
    role: mockRole,
    reports: [],
    leadReports: [],
  } as MunicipalityOfficer;

  const mockAdmin: MunicipalityOfficer = {
    id: 101,
    username: "admin",
    email: "admin@example.com",
    password: "hashed_password",
    first_name: "Admin",
    last_name: "User",
    external: false,
    companyName: null,
    role: mockAdminRole,
    reports: [],
    leadReports: [],
  } as MunicipalityOfficer;

  const mockExternalOfficer: MunicipalityOfficer = {
    id: 102,
    username: "externaloffice",
    email: "external@example.com",
    password: "hashed_password",
    first_name: "External",
    last_name: "Officer",
    external: true,
    companyName: "Tech Company Inc",
    role: mockRole,
    reports: [],
    leadReports: [],
  } as MunicipalityOfficer;

  beforeEach(() => {
    // Mock DataSource and getRepository
    const mockDataSource = {
      getRepository: jest.fn(() => mockOrmRepository),
    };

    municipalityOfficerRepository = new MunicipalityOfficerRepository(mockDataSource as any);
    jest.clearAllMocks();

    // Default setup
    mockOrmRepository.find.mockResolvedValue([mockOfficer, mockExternalOfficer]);
    mockOrmRepository.findOne.mockResolvedValue(mockOfficer);
    mockOrmRepository.findOneBy.mockResolvedValue(mockOfficer);
    mockOrmRepository.save.mockImplementation(o => Promise.resolve(o));
  });

  // ------------------------------------------------------------------
  // Finders - findAll
  // ------------------------------------------------------------------
  it("should call find with role relations for findAll", async () => {
    await municipalityOfficerRepository.findAll();

    expect(mockOrmRepository.find).toHaveBeenCalledWith({
      relations: ["role"],
    });
  });

  it("should return all officers with roles", async () => {
    const result = await municipalityOfficerRepository.findAll();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockOfficer);
    expect(result[1]).toEqual(mockExternalOfficer);
  });

  // ------------------------------------------------------------------
  // Finders - findByusername (lowercase typo version)
  // ------------------------------------------------------------------
  it("should call findOne for findByusername (lowercase)", async () => {
    await municipalityOfficerRepository.findByusername("testofficer");

    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { username: "testofficer" },
      relations: ["role"],
    });
  });

  it("should return officer by username (lowercase method)", async () => {
    const result = await municipalityOfficerRepository.findByusername("testofficer");

    expect(result).toEqual(mockOfficer);
  });

  // ------------------------------------------------------------------
  // Finders - findAllVisible (excludes admin)
  // ------------------------------------------------------------------
  it("should use queryBuilder to find all visible officers (excluding admin)", async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockOfficer, mockExternalOfficer]),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await municipalityOfficerRepository.findAllVisible();

    expect(mockOrmRepository.createQueryBuilder).toHaveBeenCalledWith("u");
    expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith("u.role", "role");
    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      "LOWER(u.username) <> :admin",
      { admin: "admin" }
    );
    expect(mockQueryBuilder.getMany).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
  });

  it("should exclude admin user from findAllVisible", async () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockOfficer, mockExternalOfficer]),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    await municipalityOfficerRepository.findAllVisible();

    // Verify the admin filter condition
    const whereCall = (mockQueryBuilder.where as jest.Mock).mock.calls[0];
    expect(whereCall[0]).toContain("LOWER(u.username) <> :admin");
    expect(whereCall[1].admin).toBe("admin");
  });

  // ------------------------------------------------------------------
  // Finders - findByUsername (correct capitalization)
  // ------------------------------------------------------------------
  it("should call findOne with relations for findByUsername", async () => {
    await municipalityOfficerRepository.findByUsername("testofficer");

    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { username: "testofficer" },
      relations: ["role"],
    });
  });

  it("should return officer by username", async () => {
    const result = await municipalityOfficerRepository.findByUsername("testofficer");

    expect(result).toEqual(mockOfficer);
  });

  it("should return null when officer not found by username", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    const result = await municipalityOfficerRepository.findByUsername("nonexistent");

    expect(result).toBeNull();
  });

  // ------------------------------------------------------------------
  // Finders - findByEmail
  // ------------------------------------------------------------------
  it("should call findOneBy for findByEmail", async () => {
    await municipalityOfficerRepository.findByEmail("officer@example.com");

    expect(mockOrmRepository.findOneBy).toHaveBeenCalledWith({
      email: "officer@example.com",
    });
  });

  it("should return officer by email", async () => {
    const result = await municipalityOfficerRepository.findByEmail("officer@example.com");

    expect(result).toEqual(mockOfficer);
  });

  it("should return null when officer not found by email", async () => {
    mockOrmRepository.findOneBy.mockResolvedValueOnce(null);

    const result = await municipalityOfficerRepository.findByEmail("nonexistent@example.com");

    expect(result).toBeNull();
  });

  // ------------------------------------------------------------------
  // Finders - findById
  // ------------------------------------------------------------------
  it("should call findOne with relations for findById", async () => {
    await municipalityOfficerRepository.findById(100);

    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: 100 },
      relations: ["role"],
    });
  });

  it("should return officer by id", async () => {
    const result = await municipalityOfficerRepository.findById(100);

    expect(result).toEqual(mockOfficer);
  });

  it("should return null when officer not found by id", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    const result = await municipalityOfficerRepository.findById(999);

    expect(result).toBeNull();
  });

  // ------------------------------------------------------------------
  // Finders - findByRoleTitle
  // ------------------------------------------------------------------
  it("should call find with role title filter for findByRoleTitle", async () => {
    await municipalityOfficerRepository.findByRoleTitle("TECH_AGENT_INFRASTRUCTURE");

    expect(mockOrmRepository.find).toHaveBeenCalledWith({
      where: { role: { title: "TECH_AGENT_INFRASTRUCTURE" } },
      relations: ["role"],
    });
  });

  it("should return all officers with given role title", async () => {
    mockOrmRepository.find.mockResolvedValueOnce([mockOfficer, mockExternalOfficer]);

    const result = await municipalityOfficerRepository.findByRoleTitle("TECH_AGENT_INFRASTRUCTURE");

    expect(result).toHaveLength(2);
    expect(result[0].role?.title).toBe("TECH_AGENT_INFRASTRUCTURE");
  });

  it("should return empty array when no officers found for role title", async () => {
    mockOrmRepository.find.mockResolvedValueOnce([]);

    const result = await municipalityOfficerRepository.findByRoleTitle("NONEXISTENT_ROLE");

    expect(result).toEqual([]);
  });

  // ------------------------------------------------------------------
  // CRUD Operations
  // ------------------------------------------------------------------
  it("should call save for add", async () => {
    await municipalityOfficerRepository.add(mockOfficer);

    expect(mockOrmRepository.save).toHaveBeenCalledWith(mockOfficer);
  });

  it("should return the saved officer from add", async () => {
    mockOrmRepository.save.mockResolvedValueOnce(mockOfficer);

    const result = await municipalityOfficerRepository.add(mockOfficer);

    expect(result).toEqual(mockOfficer);
  });

  it("should call save for update", async () => {
    const updatedOfficer = { ...mockOfficer, first_name: "UpdatedName" };

    await municipalityOfficerRepository.update(updatedOfficer);

    expect(mockOrmRepository.save).toHaveBeenCalledWith(updatedOfficer);
  });

  it("should return the updated officer from update", async () => {
    const updatedOfficer = { ...mockOfficer, first_name: "UpdatedName" };
    mockOrmRepository.save.mockResolvedValueOnce(updatedOfficer);

    const result = await municipalityOfficerRepository.update(updatedOfficer);

    expect(result.first_name).toBe("UpdatedName");
  });

  // ------------------------------------------------------------------
  // Edge Cases
  // ------------------------------------------------------------------
  it("should handle external officers correctly", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(mockExternalOfficer);

    const result = await municipalityOfficerRepository.findById(102);

    expect(result?.external).toBe(true);
    expect(result?.companyName).toBe("Tech Company Inc");
  });

  it("should handle officers with null role", async () => {
    const officerNoRole: MunicipalityOfficer = { ...mockOfficer, role: undefined };
    mockOrmRepository.findOne.mockResolvedValueOnce(officerNoRole);

    const result = await municipalityOfficerRepository.findById(100);

    expect(result?.role).toBeUndefined();
  });

  it("should distinguish between findByusername and findByUsername", async () => {
    // Both should call findOne
    await municipalityOfficerRepository.findByusername("test");
    await municipalityOfficerRepository.findByUsername("test");

    // Both should have called findOne
    expect(mockOrmRepository.findOne).toHaveBeenCalledTimes(2);
  });
});