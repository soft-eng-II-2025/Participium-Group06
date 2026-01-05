// src/tests/integration/repositories/RoleRepository.test.ts
import { TestDataSource } from '../../test-data-source'; // Percorso relativo a test-data-source.ts
import { RoleRepository } from '../../../repositories/RoleRepository'; // Percorso relativo a RoleRepository
import { Role } from '../../../models/Role';
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
});