// src/tests/integration/repositories/RoleRepository.test.ts
import { TestDataSource } from '../../test-data-source'; // Percorso relativo a test-data-source.ts
import { RoleRepository } from '../../../repositories/RoleRepository'; // Percorso relativo a RoleRepository
import { Role } from '../../../models/Role';
import { DataSource } from 'typeorm'; // Importa DataSource per i tipi

describe('RoleRepository (integration)', () => {
  let roleRepository: RoleRepository;

  // beforeEach viene eseguito prima di OGNI singolo test
  beforeEach(async () => {
    // Pulisci tutte le entità prima di ogni test per garantire isolamento.
    // Questo è cruciale in test di integrazione con DB in memoria.
    const entities = TestDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = TestDataSource.getRepository(entity.name);
      // Utilizza query diretta per DELETE FROM per maggiore sicurezza con SQLite in memoria
      // o assicurati che le tue entità abbiano un metodo clear() implementato.
      await repository.query(`DELETE FROM "${entity.tableName}"`);
    }

    // Istanzia RoleRepository passandogli il TestDataSource
    roleRepository = new RoleRepository(TestDataSource);
  });

  // --- Test per i metodi di RoleRepository ---

  it('dovrebbe aggiungere e trovare un ruolo per titolo', async () => {
    const role = new Role();
    role.title = 'Admin';

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
    await roleRepository.add(role1);

    const role2 = new Role();
    role2.title = 'Moderator';
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

    const savedRole = await roleRepository.add(role);
    expect(await roleRepository.findByTitle('DaRimuovere')).toBeDefined(); // Verifica che sia stato aggiunto

    await roleRepository.remove(savedRole);

    const foundRole = await roleRepository.findByTitle('DaRimuovere');
    expect(foundRole).toBeNull();
  });

  it('dovrebbe lanciare un errore se si tenta di aggiungere un ruolo con titolo duplicato', async () => {
    const role1 = new Role();
    role1.title = 'RuoloDuplicato';
    await roleRepository.add(role1);

    const role2 = new Role();
    role2.title = 'RuoloDuplicato'; // Titolo duplicato

    // TypeORM lancerà un errore per violazione di UNIQUE constraint
    // Se la tua entità Role non ha { unique: true } sul campo 'title', questo test fallirà o non lancerà errore.
    // Assumendo che 'title' debba essere unico, se non lo è nell'entità, aggiungilo: @Column({ unique: true })
    await expect(roleRepository.add(role2)).rejects.toThrow();
  });
});