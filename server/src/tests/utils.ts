import { title } from "process";
import { DataSource } from "typeorm";
import { email } from "zod";
import { MunicipalityOfficer } from "../models/MunicipalityOfficer";
import { Role } from "../models/Role";
import { Category } from "../models/Category";
import { User } from "../models/User";
import e from "express";
import { create } from "domain";
import { Chat } from "../models/Chat";
import { StatusType } from "../models/StatusType";
import { Report } from "../models/Report";
import { ChatType } from "../models/ChatType";
import { Message } from "../models/Message";
import { SenderType } from "../models/SenderType";


export async function createTestAdminRole(ds: DataSource): Promise<Role> {
    const roleRepo = ds.getRepository(Role);
    const adminRole = roleRepo.create({
        title: 'ADMIN',
        label: 'Administrator',
    })
    await roleRepo.save(adminRole);
    return adminRole;
}

export async function createTestOrganizationOfficerRole(ds: DataSource): Promise<Role> {
    const roleRepo = ds.getRepository(Role);
    const orgOfficerRole = roleRepo.create({
        title: 'ORGANIZATION_OFFICER',
        label: 'Organization Officer',
    })
    await roleRepo.save(orgOfficerRole);
    return orgOfficerRole;
}

export async function createTestLeadOfficerRole(ds: DataSource): Promise<Role> {
    const roleRepo = ds.getRepository(Role);
    const leadOfficerRole = roleRepo.create({
        title: 'TECH_LEAD_INFRASTRUCTURE',
        label: 'Tech Lead, Infrastructure',
    })
    await roleRepo.save(leadOfficerRole);
    return leadOfficerRole;
}

export async function createTestMunicipalityOfficerRole(ds: DataSource): Promise<Role> {
    const roleRepo = ds.getRepository(Role);
    const officerRole = roleRepo.create({
        title: 'TECH_AGENT_INFRASTRUCTURE',
        label: 'Tech Agent, Infrastructure',
    })
    await roleRepo.save(officerRole);
    return officerRole;
}

export async function createTestUser1(ds: DataSource): Promise<User> {
    const roleRepo = ds.getRepository(User);
    const userRole = roleRepo.create({
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
    await roleRepo.save(userRole);
    return userRole;
}

export async function createTestUser2(ds: DataSource): Promise<User> {
    const roleRepo = ds.getRepository(User);
    const userRole = roleRepo.create({
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
    await roleRepo.save(userRole);
    return userRole;
}

export async function createTestCategory(ds: DataSource): Promise<Category> {
    const role1 = await createTestMunicipalityOfficerRole(ds);
    const role2 = await createTestLeadOfficerRole(ds);
   return ds.getRepository(Category).save({
        name: "Other",
        roles: [role1, role2]
    });
}

export async function createTestAdmin(ds: DataSource): Promise<MunicipalityOfficer> {
    const adminRole = await createTestAdminRole(ds);
    const officerRepo = ds.getRepository(MunicipalityOfficer);
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
    const orgOfficerRole = await createTestOrganizationOfficerRole(ds);
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

export async function createTestLeadOfficer(ds: DataSource): Promise<MunicipalityOfficer> {
    const leadOfficerRole = await createTestLeadOfficerRole(ds);
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

export async function createTestMunicipalityOfficer(ds: DataSource): Promise<MunicipalityOfficer> {
    const officerRole = await createTestMunicipalityOfficerRole(ds);
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

export async function createTestExternalMunicipalityOfficer(ds: DataSource): Promise<MunicipalityOfficer> {
    const officerRole = await createTestMunicipalityOfficerRole(ds);
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

export async function createTestReport(ds: DataSource): Promise<Report> {
    const user = await createTestUser1(ds);
    const category = await createTestCategory(ds);
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