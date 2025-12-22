// src/tests/unit/repository/roleRepository.unit.test.ts
import { RoleRepository } from "../../../repositories/RoleRepository";
import { Role } from "../../../models/Role";
import { Category } from "../../../models/Category";

// Mock of TypeORM repository
const mockOrmRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn().mockImplementation(r => Promise.resolve(r)),
  remove: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn(),
};

const mockCategoryRepository = {
  findOneBy: jest.fn(),
  findBy: jest.fn(),
};

describe("RoleRepository - Unit Test (Mock ORM)", () => {
  let roleRepository: RoleRepository;

  // Mock data
  const mockCategory1: Category = {
    id: 1,
    name: "Water Supply – Drinking Water",
    reports:[],
    roles: [],
  } as Category;

  const mockCategory2: Category = {
    id: 2,
    name: "Infrastructure",
    reports:[],
    roles: [],
  } as Category;

  const mockRole: Role = {
    id: 1,
    title: "TECH_AGENT_INFRASTRUCTURE",
    label: "Tech Agent, Infrastructure",
    municipalityOfficers: [],
    categories: [mockCategory1],
  } as Role;

  const mockAdminRole: Role = {
    id: 2,
    title: "ADMIN",
    label: "Administrator",
    municipalityOfficers: [],
    categories: [],
  } as Role;

  const mockSuperAdminRole: Role = {
    id: 3,
    title: "SUPER ADMIN",
    label: "Super Administrator",
    municipalityOfficers: [],
    categories: [],
  } as Role;

  const mockTechLeadRole: Role = {
    id: 4,
    title: "TECH_LEAD_INFRASTRUCTURE",
    label: "Tech Lead, Infrastructure",
    municipalityOfficers: [],
    categories: [mockCategory1, mockCategory2],
  } as Role;

  beforeEach(() => {
    // Mock DataSource and getRepository
    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === Role) return mockOrmRepository;
        if (entity === Category) return mockCategoryRepository;
      }),
    };

    roleRepository = new RoleRepository(mockDataSource as any);
    jest.clearAllMocks();

    // Default setup
    mockOrmRepository.find.mockResolvedValue([mockRole, mockTechLeadRole]);
    mockOrmRepository.findOne.mockResolvedValue(mockRole);
    mockOrmRepository.save.mockImplementation(r => Promise.resolve(r));
    mockCategoryRepository.findOneBy.mockResolvedValue(mockCategory1);
    mockCategoryRepository.findBy.mockResolvedValue([mockCategory1, mockCategory2]);
  });

  // ------------------------------------------------------------------
  // Finders - findAll
  // ------------------------------------------------------------------
  it("should call find without relations for findAll", async () => {
    await roleRepository.findAll();

    expect(mockOrmRepository.find).toHaveBeenCalledWith();
  });

  it("should return all roles", async () => {
    const result = await roleRepository.findAll();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(mockRole);
    expect(result[1]).toEqual(mockTechLeadRole);
  });

  // ------------------------------------------------------------------
  // Finders - findAllWithCategories
  // ------------------------------------------------------------------
  it("should call find with categories relations for findAllWithCategories", async () => {
    await roleRepository.findAllWithCategories();

    expect(mockOrmRepository.find).toHaveBeenCalledWith({
      relations: ["categories"],
    });
  });

  it("should return all roles with categories loaded", async () => {
    mockOrmRepository.find.mockResolvedValueOnce([mockRole, mockTechLeadRole]);

    const result = await roleRepository.findAllWithCategories();

    expect(result).toHaveLength(2);
    expect(result[0].categories).toBeDefined();
    expect(result[1].categories).toBeDefined();
  });

  // ------------------------------------------------------------------
  // Finders - findByTitle
  // ------------------------------------------------------------------
  it("should call findOne with title filter and categories relations for findByTitle", async () => {
    await roleRepository.findByTitle("TECH_AGENT_INFRASTRUCTURE");

    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { title: "TECH_AGENT_INFRASTRUCTURE" },
      relations: ["categories"],
    });
  });

  it("should return role by title", async () => {
    const result = await roleRepository.findByTitle("TECH_AGENT_INFRASTRUCTURE");

    expect(result).toEqual(mockRole);
  });

  it("should return null when role not found by title", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    const result = await roleRepository.findByTitle("NONEXISTENT");

    expect(result).toBeNull();
  });

  // ------------------------------------------------------------------
  // Finders - findById
  // ------------------------------------------------------------------
  it("should call findOne with id filter and categories relations for findById", async () => {
    await roleRepository.findById(1);

    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ["categories"],
    });
  });

  it("should return role by id", async () => {
    const result = await roleRepository.findById(1);

    expect(result).toEqual(mockRole);
  });

  it("should return null when role not found by id", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    const result = await roleRepository.findById(999);

    expect(result).toBeNull();
  });

  // ------------------------------------------------------------------
  // Finders - findAssignable
  // ------------------------------------------------------------------
  it("should use queryBuilder to find assignable roles (excluding admin variants)", async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockRole, mockTechLeadRole]),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await roleRepository.findAssignable();

    expect(mockOrmRepository.createQueryBuilder).toHaveBeenCalledWith("r");
    expect(mockQueryBuilder.where).toHaveBeenCalledWith(
      "LOWER(r.title) NOT IN (:...bad)",
      { bad: ["admin", "super admin"] }
    );
    expect(mockQueryBuilder.getMany).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
  });

  it("should exclude admin role from findAssignable", async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockRole, mockTechLeadRole]),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    await roleRepository.findAssignable();

    const whereCall = (mockQueryBuilder.where as jest.Mock).mock.calls[0];
    expect(whereCall[1].bad).toContain("admin");
    expect(whereCall[1].bad).toContain("super admin");
  });

  it("should exclude super admin role from findAssignable", async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockRole, mockTechLeadRole]),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    await roleRepository.findAssignable();

    const whereCall = (mockQueryBuilder.where as jest.Mock).mock.calls[0];
    expect(whereCall[0]).toContain("LOWER(r.title) NOT IN");
  });

  // ------------------------------------------------------------------
  // CRUD Operations - add
  // ------------------------------------------------------------------
  it("should call save for add", async () => {
    await roleRepository.add(mockRole);

    expect(mockOrmRepository.save).toHaveBeenCalledWith(mockRole);
  });

  it("should return the saved role from add", async () => {
    mockOrmRepository.save.mockResolvedValueOnce(mockRole);

    const result = await roleRepository.add(mockRole);

    expect(result).toEqual(mockRole);
  });

  // ------------------------------------------------------------------
  // CRUD Operations - remove
  // ------------------------------------------------------------------
  it("should call remove for remove", async () => {
    await roleRepository.remove(mockRole);

    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockRole);
  });

  it("should handle removing multiple roles in sequence", async () => {
    await roleRepository.remove(mockRole);
    await roleRepository.remove(mockTechLeadRole);

    expect(mockOrmRepository.remove).toHaveBeenCalledTimes(2);
    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockRole);
    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockTechLeadRole);
  });

  // ------------------------------------------------------------------
  // Category Management - addCategoryToRole
  // ------------------------------------------------------------------
  it("should add a category to a role with addCategoryToRole", async () => {
    const roleWithoutCategory: Role = { ...mockRole, categories: [] };
    mockOrmRepository.findOne.mockResolvedValueOnce(roleWithoutCategory);
    mockCategoryRepository.findOneBy.mockResolvedValueOnce(mockCategory1);
    mockOrmRepository.save.mockResolvedValueOnce(roleWithoutCategory);

    await roleRepository.addCategoryToRole(1, 1);

    expect(mockOrmRepository.findOne).toHaveBeenCalled();
    expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(roleWithoutCategory.categories).toContain(mockCategory1);
    expect(mockOrmRepository.save).toHaveBeenCalled();
  });

  it("should throw error if role not found in addCategoryToRole", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    await expect(roleRepository.addCategoryToRole(999, 1)).rejects.toThrow(
      "Role or Category not found"
    );
  });

  it("should throw error if category not found in addCategoryToRole", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(mockRole);
    mockCategoryRepository.findOneBy.mockResolvedValueOnce(null);

    await expect(roleRepository.addCategoryToRole(1, 999)).rejects.toThrow(
      "Role or Category not found"
    );
  });

  it("should not duplicate a category if already assigned", async () => {
    const roleWithCategory: Role = { ...mockRole, categories: [mockCategory1] };
    mockOrmRepository.findOne.mockResolvedValueOnce(roleWithCategory);
    mockCategoryRepository.findOneBy.mockResolvedValueOnce(mockCategory1);

    await roleRepository.addCategoryToRole(1, 1);

    expect(roleWithCategory.categories.filter(c => c.id === 1)).toHaveLength(1);
  });

  // ------------------------------------------------------------------
  // Category Management - removeCategoryFromRole
  // ------------------------------------------------------------------
  it("should remove a category from a role with removeCategoryFromRole", async () => {
    const roleWithCategories: Role = {
      ...mockRole,
      categories: [mockCategory1, mockCategory2],
    };
    mockOrmRepository.findOne.mockResolvedValueOnce(roleWithCategories);
    mockOrmRepository.save.mockResolvedValueOnce(roleWithCategories);

    await roleRepository.removeCategoryFromRole(1, 1);

    expect(roleWithCategories.categories).toEqual([mockCategory2]);
    expect(mockOrmRepository.save).toHaveBeenCalled();
  });

  it("should throw error if role not found in removeCategoryFromRole", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    await expect(roleRepository.removeCategoryFromRole(999, 1)).rejects.toThrow(
      "Role not found"
    );
  });

  // ------------------------------------------------------------------
  // Category Management - replaceRoleCategories
  // ------------------------------------------------------------------
  it("should replace all categories for a role with replaceRoleCategories", async () => {
    const roleWithCategories: Role = { ...mockRole, categories: [mockCategory1] };
    mockOrmRepository.findOne.mockResolvedValueOnce(roleWithCategories);
    mockCategoryRepository.findBy.mockResolvedValueOnce([mockCategory2]);
    mockOrmRepository.save.mockResolvedValueOnce(roleWithCategories);

    await roleRepository.replaceRoleCategories(1, [2]);

    expect(mockCategoryRepository.findBy).toHaveBeenCalledWith({ id: [2] });
    expect(roleWithCategories.categories).toEqual([mockCategory2]);
    expect(mockOrmRepository.save).toHaveBeenCalled();
  });

  it("should throw error if role not found in replaceRoleCategories", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    await expect(roleRepository.replaceRoleCategories(999, [1])).rejects.toThrow(
      "Role not found"
    );
  });

  it("should replace with empty array if no categories provided", async () => {
    const roleWithCategories: Role = {
      ...mockRole,
      categories: [mockCategory1, mockCategory2],
    };
    mockOrmRepository.findOne.mockResolvedValueOnce(roleWithCategories);
    mockCategoryRepository.findBy.mockResolvedValueOnce([]);
    mockOrmRepository.save.mockResolvedValueOnce(roleWithCategories);

    await roleRepository.replaceRoleCategories(1, []);

    expect(roleWithCategories.categories).toEqual([]);
    expect(mockOrmRepository.save).toHaveBeenCalled();
  });

  // ------------------------------------------------------------------
  // Edge Cases
  // ------------------------------------------------------------------
  it("should handle roles with no categories", async () => {
    const roleNoCategories: Role = { ...mockRole, categories: [] };
    mockOrmRepository.findOne.mockResolvedValueOnce(roleNoCategories);

    const result = await roleRepository.findById(1);

    expect(result?.categories).toEqual([]);
  });

  it("should handle roles with multiple categories", async () => {
    const roleMultipleCategories: Role = {
      ...mockRole,
      categories: [mockCategory1, mockCategory2],
    };
    mockOrmRepository.findOne.mockResolvedValueOnce(roleMultipleCategories);

    const result = await roleRepository.findById(1);

    expect(result?.categories).toHaveLength(2);
    expect(result?.categories).toContain(mockCategory1);
    expect(result?.categories).toContain(mockCategory2);
  });

  it("should differentiate between admin role variants in findAssignable", async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockRole]),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    await roleRepository.findAssignable();

    const whereCall = (mockQueryBuilder.where as jest.Mock).mock.calls[0];
    expect(whereCall[1].bad).toEqual(["admin", "super admin"]);
  });
});