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

    //const adminRole = await createTestAdminRole(ds);
    const officer = officerRepo.create({
        username: 'admin',
        email: 'admin@gmail.com',
        password: 'adminpassword',
        first_name: 'Admin',
        last_name: 'Admin',
        external: false,
        role: adminRole,
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
        role: orgOfficerRole,
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
        role: leadOfficerRole,
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
        role: officerRole,
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
        role: officerRole,
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
    status: StatusType
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
    });
    await reportRepo.save(report);
    return report;
}

/* ###########################################################################
    LE FUNZIONI SOPRA ERANO PIENE DI "INTRECCI" QUINDI SI OTTENEVANO
    ERRORI DA PARTE DEL DB, adesso dovrebbero essere tutte sistemate

    LE FUNZIONI CHE SEGUONO NON SO, MA POTREBBERO CAUSARE GLI STESSI ERRORI

    ############### ############### ############### ############### ##########
 */
export async function createTestChat(ds: DataSource): Promise<Chat> {
    const report = await createTestReport(ds);
    const chatRepo = ds.getRepository(Chat);
    const chat = chatRepo.create({
        report: report,
        type: ChatType.LEAD_EXTERNAL,
        messages: [],
    });
    await chatRepo.save(chat);
    return chat;
}

export async function createTestMessage(ds: DataSource): Promise<Message> {
    const chat = await createTestChat(ds);
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