// src/tests/integration/repositories/RoleRepository.test.ts
import { TestDataSource } from '../../test-data-source'; // Percorso relativo a test-data-source.ts
import { RoleRepository } from '../../../repositories/RoleRepository'; // Percorso relativo a RoleRepository
import { Role } from '../../../models/Role';
import { Category } from '../../../models/Category';
import { DataSource } from 'typeorm'; // Importa DataSource per i tipi

describe('RoleRepository (integration)', () => {
  let roleRepository: RoleRepository;

  beforeEach(async () => {
    if (!TestDataSource.isInitialized) {
      await TestDataSource.initialize();
    }
    // Pulisci tutte le entità prima di ogni test per garantire isolamento.
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM "${entity.tableName}" CASCADE`);
    }

    // Istanzia RoleRepository passandogli il TestDataSource
    roleRepository = new RoleRepository(TestDataSource);
  });

  // --- Test per i metodi di RoleRepository ---

  it('dovrebbe aggiungere e trovare un ruolo per titolo', async () => {
    const role = new Role();
    role.title = 'Admin';
    role.label = 'Administrator';

    const savedRole = await roleRepository.add(role);

    expect(savedRole).toBeDefined();
    expect(savedRole.id).toBeDefined();
    expect(savedRole.title).toBe('Admin');

    const foundRole = await roleRepository.findByTitle('Admin');
    expect(foundRole).not.toBeNull();
    expect(foundRole?.title).toBe('Admin');
  });

  it('dovrebbe trovare un ruolo inesistente come null', async () => {
    const foundRole = await roleRepository.findByTitle('NonEsistente');
    expect(foundRole).toBeNull();
  });

  it('dovrebbe trovare tutti i ruoli', async () => {
    const role1 = new Role();
    role1.title = 'User';
    role1.label = 'Standard User';
    await roleRepository.add(role1);

    const role2 = new Role();
    role2.title = 'Moderator';
    role2.label = 'Moderator User';
    await roleRepository.add(role2);

    const roles = await roleRepository.findAll();
    expect(roles).toBeDefined();
    expect(roles.length).toBe(2);
    expect(roles.some(r => r.title === 'User')).toBe(true);
    expect(roles.some(r => r.title === 'Moderator')).toBe(true);
  });

  it('dovrebbe rimuovere un ruolo', async () => {
    const role = new Role();
    role.title = 'DaRimuovere';
    role.label = 'To Be Removed';

    const savedRole = await roleRepository.add(role);
    expect(await roleRepository.findByTitle('DaRimuovere')).toBeDefined(); // Verifica che sia stato aggiunto

    await roleRepository.remove(savedRole);

    const foundRole = await roleRepository.findByTitle('DaRimuovere');
    expect(foundRole).toBeNull();
  });

  it('dovrebbe lanciare un errore se si tenta di aggiungere un ruolo con titolo duplicato', async () => {
    const role1 = new Role();
    role1.title = 'RuoloDuplicato';
    role1.label = 'Label 1';
    await roleRepository.add(role1);

    const role2 = new Role();
    role2.title = 'RuoloDuplicato'; // Titolo duplicato
    role2.label = 'Label 2';

    // TypeORM lancerà un errore per violazione di UNIQUE constraint
    // Se la tua entità Role non ha { unique: true } sul campo 'title', questo test fallirà o non lancerà errore.
    // Assumendo che 'title' debba essere unico, se non lo è nell'entità, aggiungilo: @Column({ unique: true })
    await expect(roleRepository.add(role2)).rejects.toThrow();
  });

  // --- Test per le relazioni Role <-> Category e metodi specifici ---

  it('dovrebbe trovare ruoli con categorie', async () => {
    const role = new Role();
    role.title = 'Role With Cat';
    role.label = 'Label';
    const savedRole = await roleRepository.add(role);

    const category = new Category();
    category.name = 'Cat For Role';
    const savedCategory = await TestDataSource.getRepository(Category).save(category);

    await roleRepository.addCategoryToRole(savedRole.id, savedCategory.id);

    const roles = await roleRepository.findAllWithCategories();
    expect(roles).toBeDefined();
    const foundRole = roles.find(r => r.id === savedRole.id);
    expect(foundRole).toBeDefined();
    expect(foundRole?.categories).toBeDefined();
    expect(foundRole?.categories?.length).toBeGreaterThan(0);
    expect(foundRole?.categories?.[0].id).toBe(savedCategory.id);
  });

  it('dovrebbe trovare ruoli assegnabili (escludendo admin/super admin)', async () => {
    const adminRole = new Role();
    adminRole.title = 'Admin';
    adminRole.label = 'Admin';
    await roleRepository.add(adminRole);

    const superAdminRole = new Role();
    superAdminRole.title = 'Super Admin';
    superAdminRole.label = 'Super Admin';
    await roleRepository.add(superAdminRole);

    const userRole = new Role();
    userRole.title = 'User';
    userRole.label = 'User';
    await roleRepository.add(userRole);

    const assignableRoles = await roleRepository.findAssignable();
    expect(assignableRoles).toBeDefined();
    
    const titles = assignableRoles.map(r => r.title.toLowerCase());
    expect(titles).toContain('user');
    expect(titles).not.toContain('admin');
    expect(titles).not.toContain('super admin');
  });

  it('dovrebbe aggiungere una categoria a un ruolo', async () => {
    const role = new Role();
    role.title = 'Role Add Cat';
    role.label = 'Label';
    const savedRole = await roleRepository.add(role);

    const category = new Category();
    category.name = 'Added Cat';
    const savedCategory = await TestDataSource.getRepository(Category).save(category);

    await roleRepository.addCategoryToRole(savedRole.id, savedCategory.id);

    const updatedRole = await roleRepository.findById(savedRole.id);
    expect(updatedRole?.categories).toBeDefined();
    expect(updatedRole?.categories?.length).toBe(1);
    expect(updatedRole?.categories?.[0].name).toBe('Added Cat');
  });

  it('dovrebbe rimuovere una categoria da un ruolo', async () => {
    const role = new Role();
    role.title = 'Role Remove Cat';
    role.label = 'Label';
    const savedRole = await roleRepository.add(role);

    const category = new Category();
    category.name = 'Removed Cat';
    const savedCategory = await TestDataSource.getRepository(Category).save(category);

    await roleRepository.addCategoryToRole(savedRole.id, savedCategory.id);

    await roleRepository.removeCategoryFromRole(savedRole.id, savedCategory.id);

    const updatedRole = await roleRepository.findById(savedRole.id);
    expect(updatedRole?.categories).toBeDefined();
    expect(updatedRole?.categories?.length).toBe(0);
  });

  it('dovrebbe sostituire le categorie di un ruolo', async () => {
    const role = new Role();
    role.title = 'Role Replace Cat';
    role.label = 'Label';
    const savedRole = await roleRepository.add(role);

    const cat1 = new Category();
    cat1.name = 'Cat 1';
    const savedCat1 = await TestDataSource.getRepository(Category).save(cat1);

    const cat2 = new Category();
    cat2.name = 'Cat 2';
    const savedCat2 = await TestDataSource.getRepository(Category).save(cat2);

    await roleRepository.addCategoryToRole(savedRole.id, savedCat1.id);

    await roleRepository.replaceRoleCategories(savedRole.id, [savedCat2.id]);

    const updatedRole = await roleRepository.findById(savedRole.id);
    expect(updatedRole?.categories?.length).toBe(1);
    expect(updatedRole?.categories?.[0].id).toBe(savedCat2.id);
  });

  it('dovrebbe trovare le categorie di un ruolo specifico', async () => {
    const role = new Role();
    role.title = 'Role Specific Cat';
    role.label = 'Label';
    const savedRole = await roleRepository.add(role);

    const category = new Category();
    category.name = 'Specific Cat';
    const savedCategory = await TestDataSource.getRepository(Category).save(category);

    await roleRepository.addCategoryToRole(savedRole.id, savedCategory.id);

    const categories = await roleRepository.findCategoriesForRole(savedRole.id);
    expect(categories).toBeDefined();
    expect(categories.length).toBe(1);
    expect(categories[0].id).toBe(savedCategory.id);
  });
});