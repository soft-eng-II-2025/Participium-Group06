// src/tests/integration/repositories/MunicipalityOfficerRepository.test.ts
import { TestDataSource } from '../../test-data-source';
import { MunicipalityOfficerRepository } from '../../../repositories/MunicipalityOfficerRepository';
import { MunicipalityOfficer } from '../../../models/MunicipalityOfficer';
import { Role } from '../../../models/Role';
import { DataSource, Repository } from 'typeorm';

// Importa tutte le entità per la pulizia del database
import { User } from '../../../models/User';
import { Report } from '../../../models/Report';
import { ReportPhoto } from '../../../models/ReportPhoto';
import { Category } from '../../../models/Category';


describe('MunicipalityOfficerRepository (integration)', () => {
  let municipalityOfficerRepository: MunicipalityOfficerRepository;
  let municipalityOfficerOrmRepository: Repository<MunicipalityOfficer>;
  let roleRepository: Repository<Role>;

  let adminRole: Role;
  let officerRole: Role;
  let adminOfficer: MunicipalityOfficer; // Per il test findAllVisible
  let regularOfficer: MunicipalityOfficer; // Per il test findAllVisible

  // beforeEach viene eseguito prima di OGNI singolo test
  beforeEach(async () => {
    // Distrugge e reinizializza il DataSource per ogni test
    // Questo garantisce un database completamente fresco e pulito per ogni test,
    // ricreando lo schema e tutti i vincoli.
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
    await TestDataSource.initialize();

    // Istanzia Repository
    municipalityOfficerRepository = new MunicipalityOfficerRepository(TestDataSource);

    // Ottieni i repository direttamente dal TestDataSource per l'uso nei test
    municipalityOfficerOrmRepository = TestDataSource.getRepository(MunicipalityOfficer);
    roleRepository = TestDataSource.getRepository(Role);

    // Prepara i ruoli per i test
    adminRole = new Role();
    adminRole.title = 'admin'; // Assumiamo che ci sia un ruolo 'admin'
    await roleRepository.save(adminRole);

    officerRole = new Role();
    officerRole.title = 'officer';
    await roleRepository.save(officerRole);

    // Prepara un ufficiale "admin" e uno "normale" per findAllVisible
    adminOfficer = new MunicipalityOfficer();
    adminOfficer.username = 'admin';
    adminOfficer.email = 'admin@example.com';
    adminOfficer.password = 'hashedadminpass';
    adminOfficer.first_name = 'Super';
    adminOfficer.last_name = 'Admin';
    adminOfficer.role = adminRole;
    await municipalityOfficerRepository.add(adminOfficer);

    regularOfficer = new MunicipalityOfficer();
    regularOfficer.username = 'john.doe';
    regularOfficer.email = 'john.doe@example.com';
    regularOfficer.password = 'hashedjohnpass';
    regularOfficer.first_name = 'John';
    regularOfficer.last_name = 'Doe';
    regularOfficer.role = officerRole;
    await municipalityOfficerRepository.add(regularOfficer);

  });

  // --- Test per i metodi di MunicipalityOfficerRepository ---

  it('dovrebbe aggiungere e trovare un ufficiale per username (con ruolo)', async () => {
    const newOfficer = new MunicipalityOfficer();
    newOfficer.username = 'new.officer';
    newOfficer.email = 'new.officer@example.com';
    newOfficer.password = 'hashedpass';
    newOfficer.first_name = 'New';
    newOfficer.last_name = 'Officer';
    newOfficer.role = officerRole; // Assegna un ruolo esistente

    const savedOfficer = await municipalityOfficerRepository.add(newOfficer);

    expect(savedOfficer).toBeDefined();
    expect(savedOfficer.id).toBeDefined();
    expect(savedOfficer.username).toBe('new.officer');
    expect(savedOfficer.role?.id).toBe(officerRole.id);

    const foundOfficer = await municipalityOfficerRepository.findByUsername('new.officer');
    expect(foundOfficer).not.toBeNull();
    expect(foundOfficer?.email).toBe('new.officer@example.com');
    expect(foundOfficer?.role).toBeDefined(); // Verifica che il ruolo sia caricato
    expect(foundOfficer?.role?.title).toBe('officer');
  });

  it('dovrebbe trovare tutti gli ufficiali (con ruoli)', async () => {
    // Vengono presi anche adminOfficer e regularOfficer da beforeEach
    const officers = await municipalityOfficerRepository.findAll();
    expect(officers).toBeDefined();
    expect(officers.length).toBe(2); // adminOfficer + regularOfficer
    expect(officers.some(o => o.username === 'admin')).toBe(true);
    expect(officers.some(o => o.username === 'john.doe')).toBe(true);

    const adminFound = officers.find(o => o.username === 'admin');
    expect(adminFound?.role).toBeDefined();
    expect(adminFound?.role?.title).toBe('admin');

    const johnFound = officers.find(o => o.username === 'john.doe');
    expect(johnFound?.role).toBeDefined();
    expect(johnFound?.role?.title).toBe('officer');
  });

  it('dovrebbe trovare gli ufficiali visibili (escluso admin)', async () => {
    const visibleOfficers = await municipalityOfficerRepository.findAllVisible();
    expect(visibleOfficers).toBeDefined();
    expect(visibleOfficers.length).toBe(1); // Dovrebbe escludere 'admin'
    expect(visibleOfficers[0].username).toBe('john.doe');
    expect(visibleOfficers[0].role).toBeDefined(); // Verifica che il ruolo sia caricato dal QueryBuilder
    expect(visibleOfficers[0].role?.title).toBe('officer');
  });

  it('dovrebbe trovare un ufficiale per email', async () => {
    const foundOfficer = await municipalityOfficerRepository.findByEmail('john.doe@example.com');
    expect(foundOfficer).not.toBeNull();
    expect(foundOfficer?.username).toBe('john.doe');
    // findByEmail non carica il ruolo per default (findOneBy), quindi non dovrebbe esserci
    expect(foundOfficer?.role).toBeUndefined();
  });

  it('dovrebbe trovare un ufficiale inesistente per username come null', async () => {
    const foundOfficer = await municipalityOfficerRepository.findByUsername('nonexistent');
    expect(foundOfficer).toBeNull();
  });

  it('dovrebbe trovare un ufficiale inesistente per email come null', async () => {
    const foundOfficer = await municipalityOfficerRepository.findByEmail('nonexistent@example.com');
    expect(foundOfficer).toBeNull();
  });

  it('dovrebbe aggiornare un ufficiale esistente', async () => {
    regularOfficer.first_name = 'Jonathan';
    regularOfficer.email = 'jonathan.doe@example.com';
    regularOfficer.role = adminRole; // Cambia anche il ruolo

    const updatedOfficer = await municipalityOfficerRepository.update(regularOfficer);

    expect(updatedOfficer.first_name).toBe('Jonathan');
    expect(updatedOfficer.email).toBe('jonathan.doe@example.com');
    expect(updatedOfficer.role?.id).toBe(adminRole.id); // Verifica il nuovo ruolo

    const foundOfficer = await municipalityOfficerRepository.findByUsername('john.doe');
    expect(foundOfficer?.first_name).toBe('Jonathan');
    expect(foundOfficer?.email).toBe('jonathan.doe@example.com');
    expect(foundOfficer?.role?.title).toBe('admin');
  });

  // Test per i vincoli di unicità (username ed email)
  it('dovrebbe lanciare un errore se si tenta di aggiungere un ufficiale con username duplicato', async () => {
    const duplicateOfficer = new MunicipalityOfficer();
    duplicateOfficer.username = 'john.doe'; // Username duplicato
    duplicateOfficer.email = 'another.unique@example.com';
    duplicateOfficer.password = 'pass';
    duplicateOfficer.first_name = 'Dup';
    duplicateOfficer.last_name = 'Licato';
    duplicateOfficer.role = officerRole;

    await expect(municipalityOfficerRepository.add(duplicateOfficer)).rejects.toThrow();
  });

  it('dovrebbe lanciare un errore se si tenta di aggiungere un ufficiale con email duplicata', async () => {
    const duplicateOfficer = new MunicipalityOfficer();
    duplicateOfficer.username = 'another.unique.username';
    duplicateOfficer.email = 'john.doe@example.com'; // Email duplicata
    duplicateOfficer.password = 'pass';
    duplicateOfficer.first_name = 'Dup';
    duplicateOfficer.last_name = 'Licato';
    duplicateOfficer.role = officerRole;

    await expect(municipalityOfficerRepository.add(duplicateOfficer)).rejects.toThrow();
  });
});