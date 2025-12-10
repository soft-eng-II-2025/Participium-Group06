// src/tests/unit/repository/categoryRepository.unit.test.ts
import { CategoryRepository } from "../../../repositories/CategoryRepository";
import { Category } from "../../../models/Category";
import { Role } from "../../../models/Role";

// Mock della repository di TypeORM
const mockOrmRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn().mockImplementation(c => Promise.resolve(c)),
  remove: jest.fn().mockResolvedValue(undefined),
  createQueryBuilder: jest.fn(),
};

const mockRoleRepository = {
  findOneBy: jest.fn(),
  findBy: jest.fn(),
};

describe("CategoryRepository - Unit Test (Mock ORM)", () => {
  let categoryRepository: CategoryRepository;

  // Mock Category e Role per i test
  const mockRole: Role = {
    id: 1,
    title: "TECH_AGENT_INFRASTRUCTURE",
    label: "Tech Agent, Infrastructure",
    municipalityOfficer: [],
    categories: [],
  } as Role;

  const mockRole2: Role = {
    id: 2,
    title: "TECH_LEAD_INFRASTRUCTURE",
    label: "Tech Lead, Infrastructure",
    municipalityOfficer: [],
    categories: [],
  } as Role;

  const mockCategory: Category = {
    id: 1,
    name: "Water Supply – Drinking Water",
    roles: [mockRole],
  } as Category;

  beforeEach(() => {
    // Simula il costruttore del DataSource e getRepository
    const mockDataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === Category) return mockOrmRepository;
        if (entity === Role) return mockRoleRepository;
      }),
    };

    categoryRepository = new CategoryRepository(mockDataSource as any);
    jest.clearAllMocks();

    // Setup base
    mockOrmRepository.findOne.mockResolvedValue(mockCategory);
    mockOrmRepository.find.mockResolvedValue([mockCategory]);
    mockOrmRepository.save.mockImplementation(c => Promise.resolve(c));
    mockRoleRepository.findOneBy.mockResolvedValue(mockRole);
    mockRoleRepository.findBy.mockResolvedValue([mockRole, mockRole2]);
  });

  // ------------------------------------------------------------------
  // Finders
  // ------------------------------------------------------------------
  it("dovrebbe chiamare find per findAll", async () => {
    await categoryRepository.findAll();
    expect(mockOrmRepository.find).toHaveBeenCalledTimes(1);
  });

  it("dovrebbe chiamare find con relations per findWithRoles", async () => {
    await categoryRepository.findWithRoles();
    expect(mockOrmRepository.find).toHaveBeenCalledWith({ relations: ["roles"] });
  });

  it("dovrebbe chiamare findOne per findByName", async () => {
    await categoryRepository.findByName("Water Supply – Drinking Water");
    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { name: "Water Supply – Drinking Water" },
      relations: ["roles"],
    });
  });

  it("dovrebbe chiamare findOne per findById", async () => {
    await categoryRepository.findById(1);
    expect(mockOrmRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ["roles"],
    });
  });

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------
  it("dovrebbe chiamare save per add", async () => {
    await categoryRepository.add(mockCategory);
    expect(mockOrmRepository.save).toHaveBeenCalledWith(mockCategory);
  });

  it("dovrebbe chiamare remove per remove", async () => {
    await categoryRepository.remove(mockCategory);
    expect(mockOrmRepository.remove).toHaveBeenCalledWith(mockCategory);
  });

  // ------------------------------------------------------------------
  // Category-specific operations
  // ------------------------------------------------------------------
  it("dovrebbe chiamare save per changeName e aggiornare il campo", async () => {
    const newName = "New Category Name";
    const result = await categoryRepository.changeName(mockCategory, newName);
    expect(result.name).toBe(newName);
    expect(mockOrmRepository.save).toHaveBeenCalledTimes(1);
  });

  it("dovrebbe trovare categorie per roleId usando queryBuilder", async () => {
    const mockQueryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockCategory]),
    };

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const result = await categoryRepository.findByRoleId(1);

    expect(mockOrmRepository.createQueryBuilder).toHaveBeenCalledWith("category");
    expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith(
      "category.roles",
      "role",
      "role.id = :roleId",
      { roleId: 1 }
    );
    expect(mockQueryBuilder.getMany).toHaveBeenCalledTimes(1);
    expect(result).toEqual([mockCategory]);
  });

  // ------------------------------------------------------------------
  // Role management
  // ------------------------------------------------------------------
  it("dovrebbe aggiungere un ruolo a una categoria con addRoleToCategory", async () => {
    const categoryWithoutRole: Category = { id: 1, name: "Test", roles: [], reports: [] } as Category;
    mockOrmRepository.findOne.mockResolvedValueOnce(categoryWithoutRole);
    mockRoleRepository.findOneBy.mockResolvedValueOnce(mockRole);
    mockOrmRepository.save.mockResolvedValueOnce(categoryWithoutRole);

    await categoryRepository.addRoleToCategory(1, 1);

    expect(mockOrmRepository.findOne).toHaveBeenCalled();
    expect(mockRoleRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(categoryWithoutRole.roles).toContain(mockRole);
    expect(mockOrmRepository.save).toHaveBeenCalled();
  });

  it("dovrebbe lanciare errore se categoria non trovata in addRoleToCategory", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    await expect(categoryRepository.addRoleToCategory(999, 1)).rejects.toThrow(
      "Category or Role not found"
    );
  });

  it("dovrebbe lanciare errore se ruolo non trovato in addRoleToCategory", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(mockCategory);
    mockRoleRepository.findOneBy.mockResolvedValueOnce(null);

    await expect(categoryRepository.addRoleToCategory(1, 999)).rejects.toThrow(
      "Category or Role not found"
    );
  });

  it("non dovrebbe duplicare un ruolo se già assegnato", async () => {
    const categoryWithRole: Category = {
      id: 1,
      name: "Test",
      roles: [mockRole],
    } as Category;
    mockOrmRepository.findOne.mockResolvedValueOnce(categoryWithRole);
    mockRoleRepository.findOneBy.mockResolvedValueOnce(mockRole);

    await categoryRepository.addRoleToCategory(1, 1);

    // save dovrebbe essere chiamato una volta, ma roles non dovrebbe avere duplicati
    expect(categoryWithRole.roles.filter(r => r.id === 1)).toHaveLength(1);
  });

  it("dovrebbe rimuovere un ruolo da una categoria con removeRoleFromCategory", async () => {
    const categoryWithRoles: Category = {
      id: 1,
      name: "Test",
      roles: [mockRole, mockRole2],
    } as Category;
    mockOrmRepository.findOne.mockResolvedValueOnce(categoryWithRoles);
    mockOrmRepository.save.mockResolvedValueOnce(categoryWithRoles);

    await categoryRepository.removeRoleFromCategory(1, 1);

    expect(categoryWithRoles.roles).toEqual([mockRole2]);
    expect(mockOrmRepository.save).toHaveBeenCalled();
  });

  it("dovrebbe lanciare errore se categoria non trovata in removeRoleFromCategory", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    await expect(categoryRepository.removeRoleFromCategory(999, 1)).rejects.toThrow(
      "Category not found"
    );
  });

  it("dovrebbe rimpiazzare tutti i ruoli di una categoria con replaceCategoryRoles", async () => {
    const categoryWithRoles: Category = {
      id: 1,
      name: "Test",
      roles: [mockRole],
    } as Category;
    mockOrmRepository.findOne.mockResolvedValueOnce(categoryWithRoles);
    mockRoleRepository.findBy.mockResolvedValueOnce([mockRole2]);
    mockOrmRepository.save.mockResolvedValueOnce(categoryWithRoles);

    await categoryRepository.replaceCategoryRoles(1, [2]);

    expect(mockRoleRepository.findBy).toHaveBeenCalledWith({ id: [2] });
    expect(categoryWithRoles.roles).toEqual([mockRole2]);
    expect(mockOrmRepository.save).toHaveBeenCalled();
  });

  it("dovrebbe lanciare errore se categoria non trovata in replaceCategoryRoles", async () => {
    mockOrmRepository.findOne.mockResolvedValueOnce(null);

    await expect(categoryRepository.replaceCategoryRoles(999, [1])).rejects.toThrow(
      "Category not found"
    );
  });
});