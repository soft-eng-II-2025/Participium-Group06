// src/tests/integration/adminController.test.ts
import { TestDataSource } from '../../test-data-source';
import { Repository } from 'typeorm';

// Importa adminController e la sua funzione di inizializzazione
import * as adminController from '../../../controllers/adminController';
import { initializeReportRepositories } from '../../../controllers/reportController';

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
import { StatusType } from '../../../models/StatusType';

// helper per creare un Role con label non null
function makeRole(title: string, label?: string): Role {
    const r = new Role();
    r.title = title;
    r.label = label ?? title;
    return r;
}

describe('adminController (Unit Test - DB in Memory)', () => {
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

        // Inizializza i repository di reportController con il TestDataSource
        initializeReportRepositories(TestDataSource);

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

        // Prepara i ruoli base (con label valorizzata)
        adminRole = makeRole('Admin');
        await typeOrmRoleRepository.save(adminRole);

        officerRole = makeRole('Officer');
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

            const savedOfficer = await typeOrmOfficerRepository.findOne({
                where: { username: 'new.officer' },
                relations: ['role'],
            });
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
            await expect(adminController.addMunicipalityOfficer(officerData)).rejects.toThrow(
                'PASSWORD_REQUIRED',
            );
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
            expect(officers.some((o) => o.username === regularOfficerWithRole.username)).toBe(true);
            expect(officers.some((o) => o.username === regularOfficerWithoutRole.username)).toBe(true);
            expect(officers.some((o) => o.username === 'admin')).toBe(false); // L'admin è escluso
        });

        it('dovrebbe restituire un array vuoto se non ci sono ufficiali visibili', async () => {
            // Rimuovi gli ufficiali creati nel beforeEach (regular con/senza ruolo)
            await typeOrmOfficerRepository.remove([
                regularOfficerWithRole,
                regularOfficerWithoutRole,
            ]);

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
            const newRole = makeRole('Supervisor');
            const supervisorRole = await typeOrmRoleRepository.save(newRole);

            const updateData = {
                username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
                roleTitle: supervisorRole.title,
            };

            const updatedOfficerDTO = await adminController.updateMunicipalityOfficer(updateData);

            expect(updatedOfficerDTO).toBeDefined();
            expect(updatedOfficerDTO.username).toBe(regularOfficerWithoutRole.username);
            expect(updatedOfficerDTO.role).toBe('Supervisor');

            const savedOfficer = await typeOrmOfficerRepository.findOne({
                where: { username: regularOfficerWithoutRole.username },
                relations: ['role'],
            });
            expect(savedOfficer?.role?.id).toBe(supervisorRole.id);
        });

        it('dovrebbe lanciare un errore se username è mancante', async () => {
            const updateData = {
                username: '', // Mancante
                roleTitle: officerRole.title,
            };
            await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow(
                'USERNAME_REQUIRED',
            );
        });

        it("dovrebbe lanciare un errore se l'ufficiale non esiste", async () => {
            const updateData = {
                username: 'nonexistent.officer',
                roleTitle: officerRole.title,
            };
            await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow(
                'OFFICER_NOT_FOUND',
            );
        });

        it('dovrebbe lanciare un errore se il ruolo è già assegnato', async () => {
            // Per questo test, usiamo l'ufficiale che ha già un ruolo dal beforeEach
            const updateData = {
                username: regularOfficerWithRole.username, // Ha già un ruolo
                roleTitle: officerRole.title,
            };
            await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow(
                'ROLE_ALREADY_ASSIGNED',
            );
        });

        it('dovrebbe lanciare un errore se il titolo del ruolo è mancante', async () => {
            const updateData = {
                username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
                roleTitle: '', // Titolo mancante
            };
            await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow(
                'ROLE_TITLE_REQUIRED',
            );
        });

        it('dovrebbe lanciare un errore se il ruolo non esiste (per assegnazione)', async () => {
            const updateData = {
                username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
                roleTitle: 'NonExistentRole',
            };
            await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow(
                'ROLE_NOT_FOUND',
            );
        });

        it('dovrebbe lanciare un errore se si tenta di assegnare un ruolo Admin (in update)', async () => {
            const updateData = {
                username: regularOfficerWithoutRole.username, // Usa l'ufficiale senza ruolo
                roleTitle: adminRole.title, // Admin role
            };
            await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow(
                'ROLE_NOT_ASSIGNABLE',
            );
        });

        it('dovrebbe lanciare un errore se si tenta di modificare l\'utente "admin"', async () => {
            // Creiamo un ufficiale con username 'admin'
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
                roleTitle: officerRole.title,
            };
            await expect(adminController.updateMunicipalityOfficer(updateData)).rejects.toThrow(
                'FORBIDDEN_ADMIN_ACCOUNT',
            );
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
            await expect(adminController.loginOfficer(loginData)).rejects.toThrow(
                'INVALID_CREDENTIALS',
            );
        });
    });

    // --- Test per getAllRoles ---
    describe('getAllRoles', () => {
        it('dovrebbe restituire tutti i ruoli assegnabili (escluso Admin)', async () => {
            // Aggiungiamo un ruolo non admin per verificare il filtraggio di findAssignable
            const newRole = makeRole('Viewer');
            await typeOrmRoleRepository.save(newRole);

            const roles = await adminController.getAllRoles();
            expect(roles).toBeDefined();
            // Assumendo che findAssignable filtri "Admin" e che "Officer", "Viewer" siano assegnabili
            expect(roles.length).toBe(2); // Officer, Viewer (adminRole è "Admin")
            expect(roles.some((r) => r.title === 'Officer')).toBe(true);
            expect(roles.some((r) => r.title === 'Viewer')).toBe(true);
            expect(roles.some((r) => r.title === 'Admin')).toBe(false); // Admin role dovrebbe essere escluso
        });

        it('dovrebbe restituire un array vuoto se non ci sono ruoli assegnabili', async () => {
            // Rimuovi gli ufficiali che referenziano i ruoli
            await typeOrmOfficerRepository.remove([
                regularOfficerWithRole,
                regularOfficerWithoutRole,
            ]);

            // Rimuovi il ruolo "Officer", lasciando solo "Admin"
            await typeOrmRoleRepository.remove(officerRole);

            const roles = await adminController.getAllRoles();
            expect(roles).toBeDefined();
            expect(roles).toHaveLength(0); // Nessun ruolo assegnabile
        });
    });

    // --- Test per getMunicipalityOfficerByUsername ---
    describe('getMunicipalityOfficerByUsername', () => {
        it('dovrebbe restituire un ufficiale con successo', async () => {
            const officerDTO = await adminController.getMunicipalityOfficerByUsername(
                regularOfficerWithRole.username,
            );
            expect(officerDTO).toBeDefined();
            expect(officerDTO.username).toBe(regularOfficerWithRole.username);
            expect(officerDTO.role).toBe(officerRole.title);
        });

        it("dovrebbe lanciare un errore se l'ufficiale non è stato trovato", async () => {
            await expect(
                adminController.getMunicipalityOfficerByUsername('nonexistent.officer'),
            ).rejects.toThrow('OFFICER_NOT_FOUND');
        });
    });

    // --- Test per assignTechAgent ---
    describe('assignTechAgent', () => {
        it('dovrebbe assegnare un tech agent a un report', async () => {
            // ruolo TECH_AGENT
            const techAgentRole = makeRole('TECH_AGENT_AREA1');
            await typeOrmRoleRepository.save(techAgentRole);

            // officer tech agent
            const techAgent = new MunicipalityOfficer();
            techAgent.username = 'tech.agent1';
            techAgent.email = 'tech.agent1@example.com';
            techAgent.password = await hashPassword('agentpass');
            techAgent.first_name = 'Tech';
            techAgent.last_name = 'Agent';
            techAgent.role = techAgentRole;
            const savedAgent = await typeOrmOfficerRepository.save(techAgent);

            // category
            const category = new Category();
            category.name = 'Streets';
            await typeOrmCategoryRepository.save(category);

            // user
            const user = new User();
            user.username = 'citizen1';
            user.email = 'citizen1@example.com';
            user.password = await hashPassword('citizenpass');
            user.first_name = 'Citizen';
            user.last_name = 'One';
            user.photo = 'test-photo-url';
            user.telegram_id = 'test-telegram-id';
            user.flag_email=false;
            const savedUser = await typeOrmUserRepository.save(user);

            // report
            const report = new Report();
            report.title = 'Hole in the road';
            report.description = 'Big hole';
            report.latitude = 45.0;
            report.longitude = 7.0;
            report.status = StatusType.Assigned;
            report.user = savedUser;
            report.category = category;
            report.explanation = 'Explanation';
            const savedReport = await typeOrmReportRepository.save(report);

            const updatedReportDTO = await adminController.assignTechAgent(
                savedReport.id,
                savedAgent.id,
            );

            expect(updatedReportDTO).toBeDefined();
            expect(updatedReportDTO.officer).toBeDefined();
            expect(updatedReportDTO.officer.username).toBe('tech.agent1');

            const reloaded = await typeOrmReportRepository.findOne({
                where: { id: savedReport.id },
                relations: ['officer'],
            });
            expect(reloaded?.officer?.id).toBe(savedAgent.id);
        });

        it('dovrebbe lanciare OFFICER_NOT_FOUND se il tech agent non esiste', async () => {
            await expect(adminController.assignTechAgent(123, 99999)).rejects.toThrow(
                'OFFICER_NOT_FOUND',
            );
        });
    });

    // --- Test per getAgentsByTechLeadId ---
    describe('getAgentsByTechLeadId', () => {
        it('dovrebbe restituire tutti i tech agent per un tech lead valido', async () => {
            // ruoli TECH_LEAD / TECH_AGENT con stessa suffix area
            const techLeadRole = makeRole('TECH_LEAD_AREA1');
            await typeOrmRoleRepository.save(techLeadRole);

            const techAgentRole = makeRole('TECH_AGENT_AREA1');
            await typeOrmRoleRepository.save(techAgentRole);

            // tech lead
            const techLead = new MunicipalityOfficer();
            techLead.username = 'tech.lead1';
            techLead.email = 'tech.lead1@example.com';
            techLead.password = await hashPassword('leadpass');
            techLead.first_name = 'Tech';
            techLead.last_name = 'Lead';
            techLead.role = techLeadRole;
            const savedLead = await typeOrmOfficerRepository.save(techLead);

            // agent 1
            const agent1 = new MunicipalityOfficer();
            agent1.username = 'tech.agent1';
            agent1.email = 'tech.agent1@example.com';
            agent1.password = await hashPassword('pass1');
            agent1.first_name = 'Tech';
            agent1.last_name = 'Agent1';
            agent1.role = techAgentRole;
            await typeOrmOfficerRepository.save(agent1);

            // agent 2
            const agent2 = new MunicipalityOfficer();
            agent2.username = 'tech.agent2';
            agent2.email = 'tech.agent2@example.com';
            agent2.password = await hashPassword('pass2');
            agent2.first_name = 'Tech';
            agent2.last_name = 'Agent2';
            agent2.role = techAgentRole;
            await typeOrmOfficerRepository.save(agent2);

            // agent con ruolo diverso (non deve comparire)
            const otherRole = makeRole('TECH_AGENT_AREA2');
            await typeOrmRoleRepository.save(otherRole);

            const otherAgent = new MunicipalityOfficer();
            otherAgent.username = 'other.agent';
            otherAgent.email = 'other.agent@example.com';
            otherAgent.password = await hashPassword('other');
            otherAgent.first_name = 'Other';
            otherAgent.last_name = 'Agent';
            otherAgent.role = otherRole;
            await typeOrmOfficerRepository.save(otherAgent);

            const result = await adminController.getAgentsByTechLeadId(savedLead.id);

            expect(result).toHaveLength(2);
            const usernames = result.map((a) => a.username);
            expect(usernames).toEqual(
                expect.arrayContaining(['tech.agent1', 'tech.agent2']),
            );
        });

        it('dovrebbe lanciare OFFICER_NOT_FOUND se il tech lead non esiste', async () => {
            await expect(adminController.getAgentsByTechLeadId(99999)).rejects.toThrow(
                'OFFICER_NOT_FOUND',
            );
        });

        it('dovrebbe lanciare INVALID_TECH_LEAD_LABEL se il ruolo non è TECH_LEAD', async () => {
            // regularOfficerWithRole ha ruolo "Officer"
            await expect(
                adminController.getAgentsByTechLeadId(regularOfficerWithRole.id),
            ).rejects.toThrow('INVALID_TECH_LEAD_LABEL');
        });
    });

    // --- Test per getTechReports ---
    describe('getTechReports', () => {
        it('dovrebbe restituire tutti i report assegnati a un tech agent', async () => {
            const techAgentRole = makeRole('TECH_AGENT_AREA1');
            await typeOrmRoleRepository.save(techAgentRole);

            const techAgent = new MunicipalityOfficer();
            techAgent.username = 'tech.agent1';
            techAgent.email = 'tech.agent1@example.com';
            techAgent.password = await hashPassword('agentpass');
            techAgent.first_name = 'Tech';
            techAgent.last_name = 'Agent';
            techAgent.role = techAgentRole;
            const savedAgent = await typeOrmOfficerRepository.save(techAgent);

            const category = new Category();
            category.name = 'Roads';
            await typeOrmCategoryRepository.save(category);

            const user = new User();
            user.username = 'citizen2';
            user.email = 'citizen2@example.com';
            user.password = await hashPassword('citizenpass2');
            user.first_name = 'Citizen';
            user.last_name = 'Two';
            user.photo = 'test-photo-url';
            user.telegram_id = 'test-telegram-id';
            user.flag_email=false;
            const savedUser = await typeOrmUserRepository.save(user);

            const r1 = new Report();
            r1.title = 'R1';
            r1.description = 'Report 1';
            r1.latitude = 45.1;
            r1.longitude = 7.1;
            r1.status = StatusType.Assigned;
            r1.user = savedUser;
            r1.category = category;
            r1.officer = savedAgent;
            r1.explanation = 'Explanation!!';
            await typeOrmReportRepository.save(r1);

            const r2 = new Report();
            r2.title = 'R2';
            r2.description = 'Report 2';
            r2.latitude = 45.2;
            r2.longitude = 7.2;
            r2.status = StatusType.InProgress;
            r2.user = savedUser;
            r2.category = category;
            r2.officer = savedAgent;
            r2.explanation = 'Explanation!!11';
            await typeOrmReportRepository.save(r2);

            const reports = await adminController.getTechReports(savedAgent.id);

            expect(reports).toHaveLength(2);
            const titles = reports.map((r) => r.title);
            expect(titles).toEqual(expect.arrayContaining(['R1', 'R2']));
        });

        it('dovrebbe lanciare OFFICER_NOT_FOUND se il tech agent non esiste', async () => {
            await expect(adminController.getTechReports(99999)).rejects.toThrow(
                'OFFICER_NOT_FOUND',
            );
        });
    });

    // --- Test per getTechLeadReports ---
    describe('getTechLeadReports', () => {
        it('dovrebbe restituire tutti i report delle categorie gestite dal tech lead con status validi', async () => {
            // categorie
            const cat1 = new Category();
            cat1.name = 'Roads';
            await typeOrmCategoryRepository.save(cat1);

            const cat2 = new Category();
            cat2.name = 'Parks';
            await typeOrmCategoryRepository.save(cat2);

            // ruolo TECH_LEAD con categorie
            const techLeadRole = makeRole('TECH_LEAD_AREA1');
            techLeadRole.categories = [cat1, cat2];
            await typeOrmRoleRepository.save(techLeadRole);

            // tech lead
            const techLead = new MunicipalityOfficer();
            techLead.username = 'tech.lead2';
            techLead.email = 'tech.lead2@example.com';
            techLead.password = await hashPassword('leadpass2');
            techLead.first_name = 'Tech';
            techLead.last_name = 'Lead2';
            techLead.role = techLeadRole;
            const savedLead = await typeOrmOfficerRepository.save(techLead);

            // user
            const user = new User();
            user.username = 'citizen3';
            user.email = 'citizen3@example.com';
            user.password = await hashPassword('citizenpass3');
            user.first_name = 'Citizen';
            user.last_name = 'Three';
            user.photo = 'test-photo-url';
            user.telegram_id = 'test-telegram-id';
            user.flag_email=false;
            const savedUser = await typeOrmUserRepository.save(user);

            // report per cat1 (uno valido, uno da escludere perché PendingApproval)
            const r1 = new Report();
            r1.title = 'Cat1-Assigned';
            r1.description = 'Assigned';
            r1.latitude = 45.0;
            r1.longitude = 7.0;
            r1.status = StatusType.Assigned;
            r1.user = savedUser;
            r1.category = cat1;
            r1.explanation = 'Explanation!! Lots of text here';
            await typeOrmReportRepository.save(r1);

            const r2 = new Report();
            r2.title = 'Cat1-Pending';
            r2.description = 'Pending';
            r2.latitude = 45.1;
            r2.longitude = 7.1;
            r2.status = StatusType.PendingApproval; // dovrebbe essere filtrato
            r2.user = savedUser;
            r2.category = cat1;
            r2.explanation = 'Explanation!! Lots of text here';
            await typeOrmReportRepository.save(r2);

            // report per cat2 (valido)
            const r3 = new Report();
            r3.title = 'Cat2-Resolved';
            r3.description = 'Resolved';
            r3.latitude = 45.2;
            r3.longitude = 7.2;
            r3.status = StatusType.Resolved;
            r3.user = savedUser;
            r3.category = cat2;
            r3.explanation = 'Explanation!! Lots of text here';
            await typeOrmReportRepository.save(r3);

            const reports = await adminController.getTechLeadReports(savedLead.id);

            // devono esserci solo r1 e r3
            expect(reports.length).toBe(2);
            const titles = reports.map((r) => r.title);
            expect(titles).toEqual(
                expect.arrayContaining(['Cat1-Assigned', 'Cat2-Resolved']),
            );
            expect(titles).not.toContain('Cat1-Pending');
        });

        it('dovrebbe lanciare OFFICER_NOT_FOUND se il tech lead non esiste', async () => {
            await expect(adminController.getTechLeadReports(99999)).rejects.toThrow(
                'OFFICER_NOT_FOUND',
            );
        });
    });
});
