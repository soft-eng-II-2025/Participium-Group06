// src/tests/unit/mappers.test.ts

import {
    removeNullAttributes,
  createCategoryDTO,
  createMunicipalityOfficerDTO,
  createReportDTO,
  createRoleDTO,
  createUserDTO,
  createMessageResponseDTO,
  createNotificationDTO,
  mapCategoryDAOToDTO,
  mapMunicipalityOfficerDAOToDTO,
  mapReportDAOToDTO,
  mapRoleDAOToDTO,
  mapUserDAOToDTO,
  mapMessageDAOToDTO,
  mapNotificationDAOToDTO,
  mapChatDAOToDTO,
  mapCreateReportRequestToDAO,
  mapCreateOfficerRequestDTOToDAO
} from "../../../services/mapperService";

import { StatusType } from "../../../models/StatusType";
import { SenderType } from "../../../models/SenderType";
import { NotificationType } from "../../../models/NotificationType";

import { User } from "../../../models/User";
import { Report } from "../../../models/Report";
import { Category } from "../../../models/Category";
import { MunicipalityOfficer } from "../../../models/MunicipalityOfficer";
import { Chat } from "../../../models/Chat";
import { Message } from "../../../models/Message";
import { Notification } from "../../../models/Notification";
import { ReportPhoto } from "../../../models/ReportPhoto";
import { CreateReportRequestDTO } from "../../../models/DTOs/CreateReportRequestDTO";
import { CreateOfficerRequestDTO } from "../../../models/DTOs/CreateOfficerRequestDTO";

import { hashPassword } from "../../../services/passwordService";

jest.mock("../../../services/passwordService");

describe("Mapper & DTO helper functions", () => {
  beforeEach(() => jest.clearAllMocks());

  // ------------------------
  // removeNullAttributes
  // ------------------------
  test("removeNullAttributes removes null, undefined, and empty arrays", () => {
    const input = { a: null, b: undefined, c: [], d: 0, e: "text", f: [1] };
    const result = removeNullAttributes(input);
    expect(result).toEqual({ d: 0, e: "text", f: [1] });
  });

  // ------------------------
  // createXYZDTO
  // ------------------------
  test("createCategoryDTO returns correct object", () => {
    const dto = createCategoryDTO("Cat1");
    expect(dto.name).toBe("Cat1");
  });

  test("createMunicipalityOfficerDTO returns correct object", () => {
    const dto = createMunicipalityOfficerDTO(1, "user", "a@b.com", "F", "L", true, ["Role"], "Company");
    expect(dto.id).toBe(1);
    expect(dto.username).toBe("user");
    expect(dto.companyName).toBe("Company");
  });

  test("createReportDTO maps user to DTO and optional fields", () => {
    const user = new User();
    user.username = "u1";
    user.email = "a@b.com";
    user.first_name = "F";
    user.last_name = "L";
    user.reports = [];
    user.flag_email = true;
    const dto = createReportDTO(1, 12, 34, "Title", "Desc", user, false);
    expect(dto.user?.username).toBe("u1");
    expect(dto.title).toBe("Title");
  });

  test("createRoleDTO returns correct object", () => {
    const dto = createRoleDTO("Role1");
    expect(dto.title).toBe("Role1");
  });

  test("createUserDTO returns correct object", () => {
    const dto = createUserDTO("u1", "a@b.com", null, "F", "L");
    expect(dto.username).toBe("u1");
    expect(dto.email).toBe("a@b.com");
  });

  test("createMessageResponseDTO returns correct object", () => {
    const dto = createMessageResponseDTO(1, 2, "Role", "User", "Content", new Date(), SenderType.USER);
    expect(dto.reportId).toBe(1);
    expect(dto.sender).toBe(SenderType.USER);
  });

  test("createNotificationDTO returns correct object", () => {
    const userDto = createUserDTO("u1", "a@b.com", null, "F", "L");
    const dto = createNotificationDTO(1, userDto, "Content", NotificationType.NewMessage, false, new Date());
    expect(dto.user.username).toBe("u1");
    expect(dto.type).toBe(NotificationType.NewMessage);
  });

  // ------------------------
  // DAO -> DTO mappers
  // ------------------------
  test("mapCategoryDAOToDTO maps correctly", () => {
    const cat = new Category();
    cat.id = 1;
    cat.name = "Cat1";
    const dto = mapCategoryDAOToDTO(cat);
    expect(dto.name).toBe("Cat1");
  });

  test("mapMunicipalityOfficerDAOToDTO maps correctly", () => {
    const officer = new MunicipalityOfficer();
    officer.id = 1;
    officer.username = "u";
    officer.email = "a@b.com";
    officer.first_name = "F";
    officer.last_name = "L";
    officer.external = true;
    officer.roles = [{ title: "Role" }] as any;
    officer.companyName = "Company";
    const dto = mapMunicipalityOfficerDAOToDTO(officer);
    expect(dto.roles[0]).toBe("Role");
    expect(dto.companyName).toBe("Company");
  });

  test("mapReportDAOToDTO maps correctly", () => {
    const user = new User();
    user.id = 1;
    user.username = "u";
    user.email = "a@b.com";
    user.first_name = "F";
    user.last_name = "L";
    user.reports = [];
    user.flag_email = true;

    const report = new Report();
    report.id = 1;
    report.longitude = 10;
    report.latitude = 20;
    report.title = "Title";
    report.description = "Desc";
    report.user = user;
    report.category = { id: 1, name: "Cat1" } as any;
    report.status = StatusType.PendingApproval;
    report.explanation = "";
    report.officer = undefined;
    report.photos = [{ photo: "p1" } as ReportPhoto];
    report.chats = [];
    report.leadOfficer = undefined;

    const dto = mapReportDAOToDTO(report);
    expect(dto.user?.username).toBe("u");
    expect(dto.category).toBe("Cat1");
    expect(dto.photos).toEqual(["p1"]);
  });

  test("mapRoleDAOToDTO maps correctly", () => {
    const role = { title: "Admin", municipalityOfficer: [] } as any;
    const dto = mapRoleDAOToDTO(role);
    expect(dto.title).toBe("Admin");
  });

  test("mapUserDAOToDTO maps correctly", () => {
    const user = new User();
    user.username = "u";
    user.email = "a@b.com";
    user.first_name = "F";
    user.last_name = "L";
    user.reports = [];
    user.flag_email = true;
    user.verified = false;
    const dto = mapUserDAOToDTO(user);
    expect(dto.username).toBe("u");
  });

  test("mapMessageDAOToDTO maps correctly", () => {
    const chat = { report: { id: 1, user: { username: "u" }, officer: { roles: [{ label: "R" }] } } } as any;
    const msg = { chat, content: "Hello", created_at: new Date(), sender: SenderType.USER } as Message;
    const dto = mapMessageDAOToDTO(msg);
    expect(dto.content).toBe("Hello");
    expect(dto.username).toBe("u");
    expect(dto.role_label).toBe("R");
  });

  test("mapNotificationDAOToDTO maps correctly", () => {
    const notif = { id: 1, content: "C", type: NotificationType.NewMessage, is_read: false, created_at: new Date(), user: new User() } as Notification;
    const dto = mapNotificationDAOToDTO(notif);
    expect(dto.content).toBe("C");
    expect(dto.user).toBeDefined();
  });

  test("mapChatDAOToDTO maps correctly", () => {
    const chat = { id: 1, report: { id: 2 }, type: "OFFICER_USER" } as Chat;
    const dto = mapChatDAOToDTO(chat);
    expect(dto.reportId).toBe(2);
    expect(dto.type).toBe("OFFICER_USER");
  });

  // ------------------------
  // Request -> DAO mappers
  // ------------------------
  test("mapCreateReportRequestToDAO maps correctly", () => {
    const dto: CreateReportRequestDTO = { longitude: 10, latitude: 20, title: "T", description: "D", userId: 1, categoryId: 2, photos: ["p"], anonymous: false };
    const dao = mapCreateReportRequestToDAO(dto);
    expect(dao.longitude).toBe(10);
    expect(dao.latitude).toBe(20);
    expect(dao.user.id).toBe(1);
    expect(dao.category.id).toBe(2);
    expect(dao.status).toBe(StatusType.PendingApproval);
  });

  test("mapCreateOfficerRequestDTOToDAO maps and hashes password", async () => {
    (hashPassword as jest.Mock).mockResolvedValue("hashedpass");
    const dto: CreateOfficerRequestDTO = { username: "u", password: "pass1234", email: "A@B.COM", first_name: "F", last_name: "L", external: true };
    const dao = await mapCreateOfficerRequestDTOToDAO(dto);
    expect(dao.username).toBe("u");
    expect(dao.password).toBe("hashedpass");
    expect(dao.email).toBe("a@b.com");
  });
});
