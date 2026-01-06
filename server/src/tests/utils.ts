import {DataSource} from "typeorm";
import {MunicipalityOfficer} from "../models/MunicipalityOfficer";
import {Role} from "../models/Role";
import {Category} from "../models/Category";
import {User} from "../models/User";
import {Chat} from "../models/Chat";
import {StatusType} from "../models/StatusType";
import {Report} from "../models/Report";
import {ChatType} from "../models/ChatType";
import {Message} from "../models/Message";
import {SenderType} from "../models/SenderType";
import {ReportResponseDTO} from "../models/DTOs/ReportResponseDTO";
import {MunicipalityOfficerResponseDTO} from "../models/DTOs/MunicipalityOfficerResponseDTO";
import {UserResponseDTO} from "../models/DTOs/UserResponseDTO";
import {ChatResponseDTO} from "../models/DTOs/ChatRespondeDTO";
import {Notification} from "../models/Notification";
import {NotificationType} from "../models/NotificationType";


/**
 * Create roles and categories in the db
 * @param ds
 */
export async function setupDb(ds: DataSource): Promise<boolean> {
    // Role
    let roles = await createAllBasicRole(ds);
    // Category
    let categories = await createAllBasicCategories(ds, roles)

    // Ritorna true se entrambe le liste contengono elementi
    return Array.isArray(roles) && roles.length > 0
        && Array.isArray(categories) && categories.length > 0;
}

/**
 * Create the follow roles:
 * - TECH_AGENT_INFRASTRUCTURE
 * - TECH_LEAD_INFRASTRUCTURE
 * - ADMIN
 * - ORGANIZATION_OFFICER
 * @param ds
 */
export async function createAllBasicRole(ds: DataSource): Promise<Role[]> {
    const roleRepo = ds.getRepository(Role);

    // Lista dei ruoli da creare
    const rolesData = [
        {title: 'TECH_AGENT_INFRASTRUCTURE', label: 'Tech Agent, Infrastructure'},
        {title: 'TECH_LEAD_INFRASTRUCTURE', label: 'Tech Lead, Infrastructure'},
        {title: 'ADMIN', label: 'Administrator'},
        {title: 'ORGANIZATION_OFFICER', label: 'Organization Officer'},

    ];

    const roles = roleRepo.create(rolesData);

    await roleRepo.save(roles);

    return roles;
}

/**
 * Create categories linked with roles (create only "Water Supply – Drinking Water" cat)
 * @param ds
 * @param roles
 */
export async function createAllBasicCategories(ds: DataSource, roles: Role[]): Promise<Category[]> {
    const categoryRepo = ds.getRepository(Category);

    // Troviamo i ruoli necessari
    const techAgentRole = roles.find(r => r.title === 'TECH_AGENT_INFRASTRUCTURE');
    const techLeadRole = roles.find(r => r.title === 'TECH_LEAD_INFRASTRUCTURE');
    const adminRole = roles.find(r => r.title === 'ADMIN');
    const orgOfficerRole = roles.find(r => r.title === 'ORGANIZATION_OFFICER');

    if (!techAgentRole || !techLeadRole || !adminRole || !orgOfficerRole) {
        throw new Error("Alcuni ruoli obbligatori non sono stati trovati!");
    }

    const categoriesData = [
        {
            name: "Water Supply – Drinking Water",
            roles: [techAgentRole, techLeadRole, adminRole, orgOfficerRole],
        },
    ];

    const categories = categoryRepo.create(categoriesData);
    await categoryRepo.save(categories);

    return categories;
}

/**
 * Create a mocked role, with title: TECH_AGENT_INFRASTRUCTURE, in the db
 * @param ds
 */

export async function createTestUser1(ds: DataSource): Promise<User> {
    const userRepo = ds.getRepository(User);
    const user = userRepo.create({
        username: 'mariorossi',
        email: 'mariorossi@gmail.com',
        password: 'password123',
        first_name: 'Mario',
        last_name: 'Rossi',
        photo: '',
        telegram_id: '',
        flag_email: true,
        verified: true,
    })
    await userRepo.save(user);
    return user;
}

export async function createTestUser2(ds: DataSource): Promise<User> {
    const userRepo = ds.getRepository(User);
    const user = userRepo.create({
        username: 'annaverdi',
        email: 'annaverdi@gmail.com',
        password: 'password123',
        first_name: 'Anna',
        last_name: 'Verdi',
        photo: '',
        telegram_id: '',
        flag_email: true,
        verified: true,
    })
    await userRepo.save(user);
    return user;
}

export async function createTestUser3(ds: DataSource): Promise<User> {
    const userRepo = ds.getRepository(User);
    const user = userRepo.create({
        username: 'giacomogialli',
        email: 'giacomogialli@gmail.com',
        password: 'password123',
        first_name: 'Giacomo',
        last_name: 'Gialli',
        photo: '',
        telegram_id: '',
        flag_email: true,
        verified: true,
    })
    await userRepo.save(user);
    return user;
}

/**
 * Function to retrieve roles already added to the database by their title.
 * @param ds
 * @param stringRoleTitle
 */
export async function retrieveRole(ds: DataSource, stringRoleTitle: string): Promise<Role>{
    const roleRepo = ds.getRepository(Role);
    const role = await roleRepo.findOneBy({ title: stringRoleTitle });
    if (!role) {
        throw new Error(`Role ${stringRoleTitle} not found in the db. Assicurati di aver eseguito setupDb.`);
    }
    return role
}

/**
 * Function to retrieve categories already added to the database by their title.
 * @param ds
 * @param categoryName
 */
export async function retrieveCategories(ds: DataSource, categoryName: string): Promise<Category>{
    const categoryRepo = ds.getRepository(Category);
    const category = await categoryRepo.findOneBy({ name: categoryName});
    if (!category){
        throw new Error(`Category ${categoryName} not found in the db. Assicurati di aver eseguito setupDb.`);
    }
    return category
}

export async function createTestAdmin(ds: DataSource): Promise<MunicipalityOfficer> {
    const officerRepo = ds.getRepository(MunicipalityOfficer);

    // Recupera il ruolo ADMIN dal DB
    const adminRole = await retrieveRole(ds,'ADMIN')

    const officer = officerRepo.create({
        username: 'admin',
        email: 'admin@gmail.com',
        password: 'adminpassword',
        first_name: 'Admin',
        last_name: 'Admin',
        external: false,
        roles: [adminRole],
        reports: [],
        leadReports: []
    });
    await officerRepo.save(officer);
    return officer;
}

export async function createTestOrganizationOfficer(ds: DataSource): Promise<MunicipalityOfficer> {
    const orgOfficerRole = await retrieveRole(ds,'ORGANIZATION_OFFICER')
    const officerRepo = ds.getRepository(MunicipalityOfficer);
    const orgOfficer = officerRepo.create({
        username: 'orgofficer',
        email: 'org@gmail.com',
        password: 'orgpassword',
        first_name: 'Org',
        last_name: 'Officer',
        external: false,
        roles: [orgOfficerRole],
        reports: [],
        leadReports: []
    });
    await officerRepo.save(orgOfficer);
    return orgOfficer;
}

/**
 * Create a tech lead --> TECH_LEAD_INFRASTRUCTURE
 * @param ds
 */
export async function createTestLeadOfficer(ds: DataSource): Promise<MunicipalityOfficer> {
    const leadOfficerRole = await retrieveRole(ds, 'TECH_LEAD_INFRASTRUCTURE' );
    const officerRepo = ds.getRepository(MunicipalityOfficer);
    const leadOfficer = officerRepo.create({
        username: 'leadofficer',
        email: 'lead@gmail.com',
        password: 'leadpassword',
        first_name: 'Lead',
        last_name: 'Officer',
        external: false,
        roles: [leadOfficerRole],
        reports: [],
        leadReports: []
    });
    await officerRepo.save(leadOfficer);
    return leadOfficer;
}

/**
 * Create a tech agent --> TECH_AGENT_INFRASTRUCTURE
 * @param ds
 */
export async function createTestMunicipalityOfficer(ds: DataSource): Promise<MunicipalityOfficer> {
    const officerRole = await retrieveRole(ds, 'TECH_AGENT_INFRASTRUCTURE')
    const officerRepo = ds.getRepository(MunicipalityOfficer);
    const officer = officerRepo.create({
        username: 'techofficer',
        email: 'officer@gmail.com',
        password: 'officerpassword',
        first_name: 'Tech',
        last_name: 'Officer',
        external: false,
        roles: [officerRole],
        reports: [],
        leadReports: []
    });
    await officerRepo.save(officer);
    return officer;
}

/**
 * Create an external tech agent --> TECH_AGENT_INFRASTRUCTURE
 * @param ds
 */
export async function createTestExternalMunicipalityOfficer(ds: DataSource): Promise<MunicipalityOfficer> {
    const officerRole = await retrieveRole(ds, 'TECH_AGENT_INFRASTRUCTURE')
    const officerRepo = ds.getRepository(MunicipalityOfficer);
    const officer = officerRepo.create({
        username: 'externofficer',
        email: 'external@gmail.com',
        password: 'externalpassword',
        first_name: 'External',
        last_name: 'Officer',
        external: true,
        roles: [officerRole],
        reports: [],
        leadReports: []
    });
    await officerRepo.save(officer);
    return officer;
}

/**
 * Create a new role
 * !! Attention: this function, create a new user internally, using the function createTestUser1
 * so if you already use this function --> !! YOU'LL HAVE AN ERROR FOR DUPLICATE KEY IN THE DB !!
 * !! The same happens for lead, external
 * For a safe usage, yuo can use the function below --> createBasicReport
 * @param ds
 */
export async function createTestReport(ds: DataSource): Promise<Report> {
    const user = await createTestUser1(ds);
    const category = await retrieveCategories(ds, "Water Supply – Drinking Water")
    const lead = await createTestLeadOfficer(ds);
    const external = await createTestExternalMunicipalityOfficer(ds);
    const reportRepo = ds.getRepository(Report);
    const report = reportRepo.create({
        longitude: 12.4924,
        latitude: 41.8902,
        title: 'Pothole on Main Street',
        description: 'There is a large pothole on Main Street that needs to be fixed.',
        status: StatusType.InProgress,
        explanation: '',
        createdAt: new Date(),
        officer: external,
        user: user,
        category: category,
        photos: [],
        chats: [],
        leadOfficer: lead,
        anonymous: false,
    });
    await reportRepo.save(report);
    return report;
}



/**
 * You can create your report adding only these parameters, the function will add
 * the details about the report and put it into db
 * @param ds
 * @param reporter
 * @param category
 * @param lead
 * @param external
 * @param status
 */
export async function createBasicReport(
    ds: DataSource,
    reporter: User,
    category: Category,
    lead: MunicipalityOfficer,
    external: MunicipalityOfficer,
    status: StatusType,
    anonym: boolean
): Promise<Report> {

    const reportRepo = ds.getRepository(Report);
    const report = reportRepo.create({
        longitude: 12.4924,
        latitude: 41.8902,
        title: 'Pothole on Main Street',
        description: 'There is a large pothole on Main Street that needs to be fixed.',
        status: status,
        explanation: '',
        createdAt: new Date(),
        officer: external,
        user: reporter,
        category: category,
        photos: [],
        chats: [],
        leadOfficer: lead,
        anonymous: anonym,
        anonymous: false,
    });
    await reportRepo.save(report);
    return report;
}


export async function createTestNotifications(ds: DataSource, user: User): Promise<Notification[]> {
    const notificationRepo = ds.getRepository(Notification);
    const notifications = notificationRepo.create([
        {
            type: NotificationType.ReportChanged,
            content: 'Il tuo report è stato aggiornato.',
            user,
        },
        {
            type: NotificationType.NewMessage,
            content: 'Hai ricevuto un nuovo messaggio.',
            user,
        },
        {
            type: NotificationType.NewMessage,
            content: 'Secondo messaggio di test.',
            user,
        },
    ]);
    return await notificationRepo.save(notifications);
}
/* ###########################################################################
    LE FUNZIONI SOPRA ERANO PIENE DI "INTRECCI" QUINDI SI OTTENEVANO
    ERRORI DA PARTE DEL DB, adesso dovrebbero essere tutte sistemate

    LE FUNZIONI CHE SEGUONO NON SO, MA POTREBBERO CAUSARE GLI STESSI ERRORI

    ############### ############### ############### ############### ##########
 */
export async function createTestChatLeadExternal(ds: DataSource, report: Report): Promise<Chat> {
    const chatRepo = ds.getRepository(Chat);
    const chat = chatRepo.create({
        report: report,
        type: ChatType.LEAD_EXTERNAL,
        messages: [],
    });
    await chatRepo.save(chat);
    return chat;
}

export async function createTestChatOfficerUser(ds: DataSource, report: Report): Promise<Chat> {
    const chatRepo = ds.getRepository(Chat);
    const chat = chatRepo.create({
        report: report,
        type: ChatType.OFFICER_USER,
        messages: [],
    });
    await chatRepo.save(chat);
    return chat;
}

export async function createTestMessageLeadExternal(ds: DataSource, chat: Chat): Promise<Message> {
    const messageRepo = ds.getRepository(Message);
    const message = messageRepo.create({
        content: 'This is a test message.',
        sender: SenderType.LEAD,
        created_at: new Date(),
        chat: chat,
    });
    await messageRepo.save(message);
    return message;
}

export async function createTestMessageExternalLead(ds: DataSource, chat: Chat): Promise<Message> {
    const messageRepo = ds.getRepository(Message);
    const message = messageRepo.create({
        content: 'This is a test message.',
        sender: SenderType.EXTERNAL,
        created_at: new Date(),
        chat: chat,
    });
    await messageRepo.save(message);
    return message;
}

export async function createTestMessageOfficerUser(ds: DataSource, chat: Chat): Promise<Message> {
    const messageRepo = ds.getRepository(Message);
    const message = messageRepo.create({
        content: 'This is a test message.',
        sender: SenderType.OFFICER,
        created_at: new Date(),
        chat: chat,
    });
    await messageRepo.save(message);
    return message;
}

/**
 * Creates a mock MunicipalityOfficer DAO for a Tech Lead (in memory, not saved to DB).
 */
export function mockTechLeadDAO(): MunicipalityOfficer {
    const techLead = new MunicipalityOfficer();
    techLead.id = 100;
    techLead.username = 'mocktechlead';
    techLead.email = 'mocktechlead@example.com';
    techLead.first_name = 'Mock';
    techLead.last_name = 'TechLead';
    techLead.external = false;
    techLead.roles = [{
        id: 1,
        title: 'TECH_LEAD_INFRASTRUCTURE',
        label: 'Tech Lead, Infrastructure',
    } as Role];
    return techLead;
}

/**
 * Creates a mock MunicipalityOfficer DAO for a Tech Agent (in memory, not saved to DB).
 */
export function mockTechAgentDAO(): MunicipalityOfficer {
    const techAgent = new MunicipalityOfficer();
    techAgent.id = 101;
    techAgent.username = 'mocktechagent';
    techAgent.email = 'mocktechagent@example.com';
    techAgent.first_name = 'Mock';
    techAgent.last_name = 'TechAgent';
    techAgent.external = false;
    techAgent.roles = [{
        id: 2,
        title: 'TECH_AGENT_INFRASTRUCTURE',
        label: 'Tech Agent, Infrastructure',
    } as Role];

    return techAgent;
}

/**
 * Creates a mock UserResponseDTO (in memory, for expected results in Unit Test).
 */
export function mockUserResponseDTO(): UserResponseDTO {
    const dto = new UserResponseDTO();
    dto.userId = 1;
    dto.username = 'mockuser';
    dto.email = 'mockuser@example.com';
    dto.first_name = 'Mock';
    dto.last_name = 'User';
    dto.photo = null;
    dto.telegram_id = null;
    dto.flag_email = true;
    dto.verified = true;
    dto.reports = [];
    return dto;
}

/**
 * Creates a mock MunicipalityOfficerResponseDTO (in memory, for expected results in Unit Test).
 */
export function mockOfficerResponseDTO(isLead: boolean = false): MunicipalityOfficerResponseDTO {
    const dto = new MunicipalityOfficerResponseDTO();
    dto.id = isLead ? 100 : 101;
    dto.username = isLead ? 'mocktechlead' : 'mocktechagent';
    dto.email = isLead ? 'mocktechlead@example.com' : 'mocktechagent@example.com';
    dto.first_name = isLead ? 'Mock' : 'Tech';
    dto.last_name = isLead ? 'TechLead' : 'Agent';
    dto.external = false;
    dto.roles = [isLead ? 'Tech Lead, Infrastructure' : 'Tech Agent, Infrastructure'];
    return dto;
}

/**
 * Creates a mock ChatResponseDTO array (in memory, for expected results in Unit Test).
 */
export function mockChatResponseDTOs(): ChatResponseDTO[] {
    const chatDto = new ChatResponseDTO();
    chatDto.id = 1;
    chatDto.reportId = 1;
    chatDto.type = 'OFFICER_USER';
    return [chatDto];
}

/**
 * Creates a mock ReportResponseDTO (in memory, for expected results in Unit Test).
 */
export function mockReportResponseDTO(
    reportId: number = 1,
    officer: MunicipalityOfficerResponseDTO = mockOfficerResponseDTO(false),
    user: UserResponseDTO = mockUserResponseDTO(),
    chats: ChatResponseDTO[] = mockChatResponseDTOs()
): ReportResponseDTO {
    const dto = new ReportResponseDTO();
    dto.id = reportId;
    dto.title = 'Mock Report Title';
    dto.status = StatusType.Assigned;
    dto.officer = officer;
    dto.category = 'Water Supply – Drinking Water';
    dto.longitude = 12.0;
    dto.latitude = 45.0;
    dto.description = 'Mock description';
    dto.explanation = '';
    dto.photos = [];
    dto.createdAt = new Date();
    dto.user = user;
    dto.chats = chats;
    dto.anonymous = false;
    return dto;
}