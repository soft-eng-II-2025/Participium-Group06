// src/tests/integration/repositories/CategoryRepository.test.ts
import { TestDataSource } from "../../test-data-source"; // Percorso relativo a test-data-source.ts
import { CategoryRepository } from "../../../repositories/CategoryRepository"; // Percorso relativo a CategoryRepository
import { Category } from "../../../models/Category";
import { Repository } from "typeorm"; // Importa Repository per i tipi

// Importa le altre entità se TestDataSource.entityMetadatas include anche quelle
// È una buona pratica importarle per la pulizia sebbene CategoryRepository non le usi direttamente
import { User } from "../../../models/User";
import { Report } from "../../../models/Report";
import { ReportPhoto } from "../../../models/ReportPhoto";
import { Role } from "../../../models/Role";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";

describe("CategoryRepository (integration)", () => {
  let categoryRepository: CategoryRepository;
  let categoryOrmRepository: Repository<Category>; // Per verifiche dirette sui dati

  // beforeEach viene eseguito prima di OGNI singolo test
  beforeEach(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }

    // Pulisci tutte le entità in ordine inverso di dipendenza per evitare violazioni FK
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE`
      );
    }

    // Istanzia CategoryRepository passandogli il TestDataSource
    categoryRepository = new CategoryRepository(TestDataSource);
    categoryOrmRepository = TestDataSource.getRepository(Category); // Ottieni repository per verifiche
  });

  afterAll(async () => {
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
  });

  // --- Test per i metodi di CategoryRepository ---

  it("dovrebbe aggiungere e trovare una categoria per nome", async () => {
    const category = new Category();
    category.name = "Dissesto Idrogeologico";

    const savedCategory = await categoryRepository.add(category);

    expect(savedCategory).toBeDefined();
    expect(savedCategory.id).toBeDefined();
    expect(savedCategory.name).toBe("Dissesto Idrogeologico");

    const foundCategory = await categoryRepository.findByName(
      "Dissesto Idrogeologico"
    );
    expect(foundCategory).not.toBeNull();
    expect(foundCategory?.name).toBe("Dissesto Idrogeologico");
  });

  it("dovrebbe trovare una categoria per ID", async () => {
    const category = new Category();
    category.name = "Rifiuti Abbandonati";
    const savedCategory = await categoryRepository.add(category);

    const foundCategory = await categoryRepository.findById(savedCategory.id);
    expect(foundCategory).not.toBeNull();
    expect(foundCategory?.name).toBe("Rifiuti Abbandonati");
    expect(foundCategory?.id).toBe(savedCategory.id);
  });

  it("dovrebbe trovare una categoria inesistente come null", async () => {
    const foundCategoryByName = await categoryRepository.findByName(
      "Categoria Inesistente"
    );
    expect(foundCategoryByName).toBeNull();

    const foundCategoryById = await categoryRepository.findById(9999); // ID inesistente
    expect(foundCategoryById).toBeNull();
  });

  it("dovrebbe trovare tutte le categorie", async () => {
    const category1 = new Category();
    category1.name = "Illuminazione Pubblica";
    await categoryRepository.add(category1);

    const category2 = new Category();
    category2.name = "Segnaletica Stradale";
    await categoryRepository.add(category2);

    const categories = await categoryRepository.findAll();
    expect(categories).toBeDefined();
    expect(categories.length).toBe(2);
    expect(categories.some((c) => c.name === "Illuminazione Pubblica")).toBe(
      true
    );
    expect(categories.some((c) => c.name === "Segnaletica Stradale")).toBe(
      true
    );
  });

  it("dovrebbe rimuovere una categoria", async () => {
    const category = new Category();
    category.name = "Categoria Da Rimuovere";
    const savedCategory = await categoryRepository.add(category);

    expect(
      await categoryOrmRepository.findOneBy({ id: savedCategory.id })
    ).toBeDefined();

    await categoryRepository.remove(savedCategory);

    const foundCategory = await categoryOrmRepository.findOneBy({
      id: savedCategory.id,
    });
    expect(foundCategory).toBeNull();
  });

  it("dovrebbe cambiare il nome di una categoria", async () => {
    const category = new Category();
    category.name = "Nome Vecchio";
    const savedCategory = await categoryRepository.add(category);

    const updatedCategory = await categoryRepository.changeName(
      savedCategory,
      "Nome Nuovo"
    );

    expect(updatedCategory.name).toBe("Nome Nuovo");
    const foundCategory = await categoryOrmRepository.findOneBy({
      id: savedCategory.id,
    });
    expect(foundCategory?.name).toBe("Nome Nuovo");
  });

  // Test per i vincoli di unicità sul nome della categoria
  // Questo test funzionerà solo se la tua entità Category ha { unique: true } sul campo 'name'.
  // Se non ce l'ha, puoi rimuovere questo test.
  it("dovrebbe lanciare un errore se si tenta di aggiungere una categoria con nome duplicato", async () => {
    const category1 = new Category();
    category1.name = "Categoria Unica";
    await categoryRepository.add(category1);

    const category2 = new Category();
    category2.name = "Categoria Unica"; // Nome duplicato

    await expect(categoryRepository.add(category2)).rejects.toThrow();
  });

  // --- Test per le relazioni Category <-> Role ---

  it("dovrebbe assegnare un ruolo a una categoria", async () => {
    const category = new Category();
    category.name = "Categoria con Ruolo";
    const savedCategory = await categoryRepository.add(category);

    const role = new Role();
    role.title = "Gestore Categoria";
    role.label = "Gestore";
    const savedRole = await TestDataSource.getRepository(Role).save(role);

    await categoryRepository.addRoleToCategory(savedCategory.id, savedRole.id);

    const categoryWithRoles = await categoryRepository.findById(
      savedCategory.id
    );
    expect(categoryWithRoles).toBeDefined();
    expect(categoryWithRoles?.roles).toBeDefined();
    expect(categoryWithRoles?.roles?.length).toBe(1);
    expect(categoryWithRoles?.roles?.[0].title).toBe("Gestore Categoria");
  });

  it("dovrebbe trovare categorie con ruoli", async () => {
    const category = new Category();
    category.name = "Cat With Role";
    const savedCategory = await categoryRepository.add(category);

    const role = new Role();
    role.title = "Role For Cat";
    role.label = "Role Label";
    const savedRole = await TestDataSource.getRepository(Role).save(role);

    await categoryRepository.addRoleToCategory(savedCategory.id, savedRole.id);

    const categories = await categoryRepository.findWithRoles();
    expect(categories).toBeDefined();
    const foundCat = categories.find((c) => c.id === savedCategory.id);
    expect(foundCat).toBeDefined();
    expect(foundCat?.roles).toBeDefined();
    expect(foundCat?.roles?.length).toBeGreaterThan(0);
    expect(foundCat?.roles?.[0].id).toBe(savedRole.id);
  });

  it("dovrebbe trovare categorie per roleId", async () => {
    const category = new Category();
    category.name = "Target Category";
    const savedCategory = await categoryRepository.add(category);

    const role = new Role();
    role.title = "Target Role";
    role.label = "Target Label";
    const savedRole = await TestDataSource.getRepository(Role).save(role);

    await categoryRepository.addRoleToCategory(savedCategory.id, savedRole.id);

    const foundCategories = await categoryRepository.findByRoleId(savedRole.id);
    expect(foundCategories).toBeDefined();
    expect(foundCategories.length).toBe(1);
    expect(foundCategories[0].id).toBe(savedCategory.id);
  });

  it("dovrebbe rimuovere un ruolo da una categoria", async () => {
    const category = new Category();
    category.name = "Remove Role Cat";
    const savedCategory = await categoryRepository.add(category);

    const role = new Role();
    role.title = "Role Remove";
    role.label = "Role Label";
    const savedRole = await TestDataSource.getRepository(Role).save(role);

    await categoryRepository.addRoleToCategory(savedCategory.id, savedRole.id);

    // Verifica aggiunta
    let cat = await categoryRepository.findById(savedCategory.id);
    expect(cat?.roles?.length).toBe(1);

    await categoryRepository.removeRoleFromCategory(
      savedCategory.id,
      savedRole.id
    );

    cat = await categoryRepository.findById(savedCategory.id);
    expect(cat?.roles).toBeDefined();
    expect(cat?.roles?.length).toBe(0);
  });

  it("dovrebbe sostituire i ruoli di una categoria", async () => {
    const category = new Category();
    category.name = "Replace Roles Cat";
    const savedCategory = await categoryRepository.add(category);

    const role1 = new Role();
    role1.title = "Role 1";
    role1.label = "Label 1";
    const savedRole1 = await TestDataSource.getRepository(Role).save(role1);

    const role2 = new Role();
    role2.title = "Role 2";
    role2.label = "Label 2";
    const savedRole2 = await TestDataSource.getRepository(Role).save(role2);

    // Inizia con role1
    await categoryRepository.addRoleToCategory(savedCategory.id, savedRole1.id);

    // Sostituisci con role2
    await categoryRepository.replaceCategoryRoles(savedCategory.id, [
      savedRole2.id,
    ]);

    const cat = await categoryRepository.findById(savedCategory.id);
    expect(cat?.roles?.length).toBe(1);
    expect(cat?.roles?.[0].id).toBe(savedRole2.id);
  });
});
