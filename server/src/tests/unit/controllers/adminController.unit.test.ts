// src/tests/integration/adminController.test.ts
import { TestDataSource } from '../../test-data-source';
import { DataSource, Repository } from 'typeorm';

// Importa adminController e la sua funzione di inizializzazione
import * as adminController from '../../../controllers/adminController';
// Per le istanze dei tuoi repository personalizzati, usiamo i loro tipi
import { MunicipalityOfficerRepository } from '../../../repositories/MunicipalityOfficerRepository';
import { RoleRepository } from '../../../repositories/RoleRepository';
import { MunicipalityOfficer } from '../../../models/MunicipalityOfficer';
import { Role } from '../../../models/Role';
import { LoginRequestDTO } from '../../../models/DTOs/LoginRequestDTO'; // Per loginOfficer
import { hashPassword } from '../../../services/passwordService';

// Importa tutte le entità per la pulizia del database
import { User } from '../../../models/User';
import { Report } from '../../../models/Report';
import { ReportPhoto } from '../../../models/ReportPhoto';
import { Category } from '../../../models/Category';


describe('adminController (Integration Tests - DB in Memory)', () => {
  // Variabili per le istanze dei tuoi repository personalizzati (chiamano i metodi del controller)
  let adminMunicipalityOfficerRepository: MunicipalityOfficerRepository;
  let adminRoleRepository: RoleRepository;

  // Variabili per i repository TypeORM diretti (usati per pre-popolazione e pulizia nel test)
  let typeOrmOfficerRepository: Repository<MunicipalityOfficer>;
  let typeOrmRoleRepository: Repository<Role>;
  let typeOrmUserRepository: Repository<User>;
  let typeOrmReportRepository: Repository<Report>;
  let typeOrmReportPhotoRepository: Repository<ReportPhoto>;
  let typeOrmCategoryRepository: Repository<Category>;


  let adminRole: Role;
  let officerRole: Role;
  let regularOfficerWithRole: MunicipalityOfficer; // Ufficiale con ruolo
  let regularOfficerWithoutRole: MunicipalityOfficer; // Ufficiale senza ruolo per i test di assegnazione

  // beforeEach viene eseguito prima di OGNI singolo test
  beforeEach(async () => {
    // Distrugge e reinizializza il DataSource per ogni test
    if (TestDataSource.isInitialized) {
      await TestDataSource.destroy();
    }
    await TestDataSource.initialize();

    // *** Inizializza i repository del controller con il TestDataSource ***
    adminController.initializeAdminRepositories(TestDataSource);

    // Istanzia i repository personalizzati per chiamare i loro metodi (es. findByUsername)
    adminMunicipalityOfficerRepository = new MunicipalityOfficerRepository(TestDataSource);
    adminRoleRepository = new RoleRepository(TestDataSource);

    // Ottieni le istanze dirette dei repository di TypeORM per pre-popolazione e pulizia
    typeOrmOfficerRepository = TestDataSource.getRepository(MunicipalityOfficer);
    typeOrmRoleRepository = TestDataSource.getRepository(Role);
    typeOrmUserRepository = TestDataSource.getRepository(User);
    typeOrmReportRepository = TestDataSource.getRepository(Report);
    typeOrmReportPhotoRepository = TestDataSource.getRepository(ReportPhoto);
    typeOrmCategoryRepository = TestDataSource.getRepository(Category);


    // Prepara i ruoli
    adminRole = new Role();
    adminRole.title = 'Admin';
    await typeOrmRoleRepository.save(adminRole);

    officerRole = new Role();
    officerRole.title = 'Officer';
    await typeOrmRoleRepository.save(officerRole);

    // Prepara un ufficiale REGOLARE CON RUOLO per i test di login, etc.
    const officerWithRole = new MunicipalityOfficer();
    officerWithRole.username = 'regular.officer';
    officerWithRole.email = 'regular@example.com';
    officerWithRole.password = await hashPassword('securepassword');
    officerWithRole.first_name = 'Regular';
    officerWithRole.last_name = 'Officer';
    officerWithRole.role = officerRole;
    regularOfficerWithRole = await typeOrmOfficerRepository.save(officerWithRole);

    // Prepara un ufficiale SENZA RUOLO per i test di assegnazione ruolo
    const officerWithoutRole = new MunicipalityOfficer();
    officerWithoutRole.username = 'assignme.officer';
    officerWithoutRole.email = 'assignme@example.com';
    officerWithoutRole.password = await hashPassword('assignpass');
    officerWithoutRole.first_name = 'Assign';
    officerWithoutRole.last_name = 'Me';
    // officerWithoutRole.role rimane undefined
    regularOfficerWithoutRole = await typeOrmOfficerRepository.save(officerWithoutRole);

  });


  // --- Test per addMunicipalityOfficer ---
  describe('addMunicipalityOfficer', () => {
    it('dovrebbe aggiungere un nuovo ufficiale con un ruolo esistente', async () => {
      const officerData = {
        username: 'new.officer',
        email: 'new@example.com',
        password: 'securepass',
        first_name: 'New',
        last_name: 'Officer',
      };

      const newOfficerDTO = await adminController.addMunicipalityOfficer(officerData);

      expect(newOfficerDTO).toBeDefined();
      expect(newOfficerDTO.username).toBe('new.officer');
      expect(newOfficerDTO.email).toBe('new@example.com');
      expect(newOfficerDTO.role).toBe(null);

      const savedOfficer = await typeOrmOfficerRepository.findOne({ where: { username: 'new.officer' }, relations: ['role'] });
      expect(savedOfficer).toBeDefined();
    });

    it('dovrebbe lanciare un errore se la password è vuota', async () => {
      const officerData = {
        username: 'failuser',
        email: 'fail@example.com',
        password: '', // Password vuota
        first_name: 'Fail',
        last_name: 'User',
      };
      await expect(adminController.addMunicipalityOfficer(officerData)).rejects.toThrow('PASSWORD_REQUIRED');
    });

    it('dovrebbe aggiungere un ufficiale senza ruolo', async () => {
      const officerData = {
        username: 'norole.officer',
        email: 'norole@example.com',
        password: 'securepass',
        first_name: 'No',
        last_name: 'Role',
        // nessun ruolo specificato
      };

      const newOfficerDTO = await adminController.addMunicipalityOfficer(officerData);
      expect(newOfficerDTO).toBeDefined();
      expect(newOfficerDTO.username).toBe('norole.officer');
      expect(newOfficerDTO.role).toBeNull(); // Verifica che non abbia un ruolo
    });

    it('dovrebbe lanciare un errore se username è duplicato', async () => {
      const officerData = {
        username: 'regular.officer', // Già esistente
        email: 'unique@example.com',
        password: 'securepass',
        first_name: 'Dup',
        last_name: 'User',
      };
      await expect(adminController.addMunicipalityOfficer(officerData)).rejects.toThrow();
    });

    it('dovrebbe lanciare un errore se email è duplicata', async () => {
      const officerData = {
        username: 'unique.user',
        email: 'regular@example.com', // Già esistente
        password: 'securepass',
        first_name: 'Dup',
        last_name: 'User',
      };
      await expect(adminController.addMunicipalityOfficer(officerData)).rejects.toThrow();
    });
  });

  // --- Test per getAllMunicipalityOfficer ---
  describe('getAllMunicipalityOfficer', () => {
    it('dovrebbe restituire tutti gli ufficiali visibili (escluso admin)', async () => {
      // Aggiungiamo un ufficiale "admin" che dovrebbe essere escluso
      const adminOfficer = new MunicipalityOfficer();
      adminOfficer.username = 'admin';
      adminOfficer.email = 'admin@example.com';
      adminOfficer.password = await hashPassword('adminpass');
      adminOfficer.first_name = 'Admin';
      adminOfficer.last_name = 'User';
      adminOfficer.role = adminRole;
      await typeOrmOfficerRepository.save(adminOfficer);

      const officers = await adminController.getAllMunicipalityOfficer();

      expect(officers).toBeDefined();
      expect(officers.length).toBe(2); // regularOfficerWithRole + regularOfficerWithoutRole
      expect(officers.some(o => o.username === regularOfficerWithRole.username)).toBe(true);
      expect(officers.some(o => o.username === regularOfficerWithoutRole.username)).toBe(true);
      expect(officers.some(o => o.username === 'admin')).toBe(false); // L'admin è escluso
    });

    it('dovrebbe restituire un array vuoto se non ci sono ufficiali visibili', async () => {
      // Pulisci tutti gli ufficiali
      await typeOrmOfficerRepository.clear();
      // Crea un solo ufficiale admin che verrà filtrato
      const adminOfficer = new MunicipalityOfficer();
      adminOfficer.username = 'admin';
      adminOfficer.email = 'admin@example.com';
      adminOfficer.password = await hashPassword('adminpass');
      adminOfficer.first_name = 'Admin';
      adminOfficer.last_name = 'User';
      adminOfficer.role = adminRole;
      await typeOrmOfficerRepository.save(adminOfficer);

      const officers = await adminController.getAllMunicipalityOfficer();
      expect(officers).toBeDefined();
      expect(officers).toHaveLength(0);
    });
  });

  // --- Test per updateMunicipalityOfficer ---
  describe('updateMunicipalityOfficer', () => {
    it('dovrebbe aggiornare il ruolo di un ufficiale con successo', async () => {
      const newRole = new Role();
      newRole.title = 'Supervisor';
      const supervisorRole = await typeOrmRoleRepository.save(newRole);

      const updateData = {
        username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
        roleTitle: supervisorRole.title ,
      };

      const updatedOfficerDTO = await adminController.updateMunicipalityOfficer(updateData);

      expect(updatedOfficerDTO).toBeDefined();
      expect(updatedOfficerDTO.username).toBe(regularOfficerWithoutRole.username);
      expect(updatedOfficerDTO.role).toBe('Supervisor');

      const savedOfficer = await typeOrmOfficerRepository.findOne({ where: { username: regularOfficerWithoutRole.username }, relations: ['role'] });
      expect(savedOfficer?.role?.id).toBe(supervisorRole.id);
    });

    it('dovrebbe lanciare un errore se username è mancante', async () => {
      const updateData = {
        username: '', // Mancante
          roleTitle : officerRole.title ,
      };
      await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow('USERNAME_REQUIRED');
    });

    it('dovrebbe lanciare un errore se l\'ufficiale non esiste', async () => {
      const updateData = {
        username: 'nonexistent.officer',
              roleTitle: officerRole.title ,
      };
      await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow('OFFICER_NOT_FOUND');
    });

    it('dovrebbe lanciare un errore se il ruolo è già assegnato', async () => {
      // Per questo test, usiamo l'ufficiale che ha già un ruolo dal beforeEach
      const updateData = {
        username: regularOfficerWithRole.username, // Ha già un ruolo
              roleTitle: officerRole.title ,
      };
      await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow('ROLE_ALREADY_ASSIGNED');
    });

    it('dovrebbe lanciare un errore se il titolo del ruolo è mancante', async () => {
      const updateData = {
        username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
              roleTitle: '' , // Titolo mancante
      };
      await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow('ROLE_TITLE_REQUIRED');
    });

    it('dovrebbe lanciare un errore se il ruolo non esiste (per assegnazione)', async () => {
      const updateData = {
        username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
              roleTitle: 'NonExistentRole' ,
      };
      await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow('ROLE_NOT_FOUND');
    });

    it('dovrebbe lanciare un errore se si tenta di assegnare un ruolo Admin (in update)', async () => {
      const updateData = {
        username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
              roleTitle: adminRole.title , // Admin role
      };
      await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow('ROLE_NOT_ASSIGNABLE');
    });

    it('dovrebbe lanciare un errore se si tenta di modificare l\'utente "admin"', async () => {
      // Creiamo un ufficiale con username 'admin' (non è l'admin officer vero e proprio)
      const adminUsernameOfficer = new MunicipalityOfficer();
      adminUsernameOfficer.username = 'admin';
      adminUsernameOfficer.email = 'admin_user@example.com';
      adminUsernameOfficer.password = await hashPassword('adminpass');
      adminUsernameOfficer.first_name = 'Admin';
      adminUsernameOfficer.last_name = 'User';
      adminUsernameOfficer.role = officerRole;
      await typeOrmOfficerRepository.save(adminUsernameOfficer);

      const updateData = {
        username: 'admin', // Username 'admin'
              roleTitle: officerRole.title ,
      };
      await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow('FORBIDDEN_ADMIN_ACCOUNT');
    });
  });

  // --- Test per loginOfficer ---
  describe('loginOfficer', () => {
    it('dovrebbe effettuare il login con successo per un ufficiale', async () => {
      const loginData: LoginRequestDTO = {
        username: regularOfficerWithRole.username,
        password: 'securepassword',
      };
      const loggedInOfficerDTO = await adminController.loginOfficer(loginData);
      expect(loggedInOfficerDTO).toBeDefined();
      expect(loggedInOfficerDTO.username).toBe(regularOfficerWithRole.username);

    });

    it('dovrebbe lanciare un errore con credenziali non valide per ufficiale', async () => {
      const loginData: LoginRequestDTO = {
        username: regularOfficerWithRole.username,
        password: 'wrongpassword',
      };
      await expect(adminController.loginOfficer(loginData)).rejects.toThrow('INVALID_CREDENTIALS');
    });
  });

  // --- Test per getAllRoles ---
  describe('getAllRoles', () => {
    it('dovrebbe restituire tutti i ruoli assegnabili (escluso Admin)', async () => {
      // Aggiungiamo un ruolo non admin per verificare il filtraggio di findAssignable
      const newRole = new Role();
      newRole.title = 'Viewer';
      await typeOrmRoleRepository.save(newRole);

      const roles = await adminController.getAllRoles();
      expect(roles).toBeDefined();
      // Assumendo che findAssignable filtri "Admin" e che "Officer", "Viewer" siano assegnabili
      expect(roles.length).toBe(2); // Officer, Viewer (adminRole è "Admin")
      expect(roles.some(r => r.title === 'Officer')).toBe(true);
      expect(roles.some(r => r.title === 'Viewer')).toBe(true);
      expect(roles.some(r => r.title === 'Admin')).toBe(false); // Admin role dovrebbe essere escluso
    });

    it('dovrebbe restituire un array vuoto se non ci sono ruoli assegnabili', async () => {
      // Pulisci tutti gli ufficiali (per evitare FK constraint failed su Role)
      await typeOrmOfficerRepository.clear();
      // Rimuovi tutti i ruoli
      await typeOrmRoleRepository.clear();
      // Aggiungi solo un ruolo "Admin"
      const onlyAdminRole = new Role();
      onlyAdminRole.title = 'Admin';
      await typeOrmRoleRepository.save(onlyAdminRole);

      const roles = await adminController.getAllRoles();
      expect(roles).toBeDefined();
      expect(roles).toHaveLength(0); // Nessun ruolo assegnabile
    });
  });

  // --- Test per getMunicipalityOfficerByUsername ---
  describe('getMunicipalityOfficerByUsername', () => {
    it('dovrebbe restituire un ufficiale con successo', async () => {
      const officerDTO = await adminController.getMunicipalityOfficerByUsername(regularOfficerWithRole.username);
      expect(officerDTO).toBeDefined();
      expect(officerDTO.username).toBe(regularOfficerWithRole.username);
      expect(officerDTO.role).toBe(officerRole.title);
    });

    it('dovrebbe lanciare un errore se l\'ufficiale non è stato trovato', async () => {
      await expect(adminController.getMunicipalityOfficerByUsername('nonexistent.officer')).rejects.toThrow('OFFICER_NOT_FOUND');
    });
  });
});